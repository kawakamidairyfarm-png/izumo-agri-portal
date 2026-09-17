#!/usr/bin/env node
/**
 * 検索エンジンから見えるようにする。ビルド後に、1 ページずつ実体のある HTML を書き出す。
 *
 *   node scripts/prerender.mjs
 *
 * 何をするか:
 *  - dist/index.html を型紙に、全ページ分の dist/<住所>/index.html を作る
 *  - 各ページに、そのページ用の題名・説明・正規 URL・SNS カード（OGP）・構造化データを入れる
 *  - #root の中に本文（要約・要点・全文）を静的な HTML として置く。
 *    React は起動時にこの中身を置き換えるので、人の見え方は変わらない。検索する側だけが読む。
 *  - sitemap.xml と robots.txt を作る
 *  - 404.html を置く（GitHub Pages で、書き出していない住所に来たときの受け皿）
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const DIST = path.join(ROOT, 'dist')
const SITE = (process.env.SITE_URL || 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/').replace(/\/?$/, '/')
const NAME = '川上牧場 酪農データバンク'
/** 全文をこの長さで切る。長すぎるページは検索側に嫌われ、ファイルも重くなる */
const BODY_LIMIT = 12000

/* 誰が話したものか・どこの牧場かを、機械が読める形で1か所に持つ。
   検索やAIの要約に拾われるとき、書き手が実在の酪農家であることが手がかりになる */
const FARM = {
  '@type': 'Organization',
  name: '川上牧場',
  url: SITE,
  address: { '@type': 'PostalAddress', addressRegion: '島根県', addressLocality: '出雲市', addressCountry: 'JP' },
}
const AUTHOR = {
  '@type': 'Person',
  name: '川上哲也',
  jobTitle: '酪農家',
  worksFor: FARM,
  description: '島根県出雲市で乳牛約80頭を飼う酪農家。2019年から毎朝の音声配信を続けている。',
}
/** パンくず（このページがサイトのどこにあるか） */
const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
})

const readJson = async (p) => JSON.parse(await fs.readFile(p, 'utf8'))
const exists = (p) => fs.access(p).then(() => true, () => false)

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function normalizeTitle(t) {
  return String(t).normalize('NFKC').replace(/\s+/g, '').replace(/[“”"「」『』!！?？・:：、。…—─―]/g, '').toLowerCase()
}

/** 行頭の印（## >> ?? !! %% --）と「名前｜」を外して、ふつうの文章に戻す */
function stripMarkers(text) {
  return String(text ?? '')
    .replace(/^(##|>>|\?\?|!!|%%|--)\s+/gm, '')
    .replace(/^([^\n｜]{1,24})｜/gm, '$1: ')
}

/**
 * 全文の末尾にある「まとめ」を取り出す。
 * pody の記事は最後に、1〜2文の要旨と箇条書きの要点を置いてくれる。
 * これはページの説明文にも、答えを先に示すための要点にも使える一番良い材料になる。
 */
function extractSummary(text) {
  const t = String(text ?? '')
  const at = t.indexOf('\n## まとめ')
  if (at < 0) return { abstract: '', points: [] }
  const lines = t.slice(at).split(/\n/).map((l) => l.trim()).filter(Boolean)
  lines.shift() // 「## まとめ」の見出し自体を捨てる
  let abstract = ''
  const points = []
  for (const l of lines) {
    if (l.startsWith('## ')) break
    if (l.startsWith('-- ')) points.push(l.slice(3).trim())
    else if (!abstract && !/^(>>|\?\?|!!|%%)\s/.test(l)) abstract = l
  }
  return { abstract, points }
}

/** 説明文にする。改行を詰めて、指定の長さで切る */
function clip(text, max = 110) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}

async function loadEpisodes() {
  const index = await readJson(path.join(DATA, 'episodes.json'))
  const paid = await readJson(path.join(DATA, 'note_paid.json'))
  const articleDir = path.join(DATA, 'articles')
  const articles = []
  if (await exists(articleDir)) {
    for (const f of (await fs.readdir(articleDir)).filter((f) => f.endsWith('.json'))) {
      articles.push(await readJson(path.join(articleDir, f)))
    }
  }
  const transcripts = new Set((await fs.readdir(path.join(DATA, 'transcripts'))).filter((f) => f.endsWith('.txt')))

  const byDrive = new Map(articles.map((a) => [a.driveId, a]))
  const byDateTitle = new Map(articles.map((a) => [a.date + '|' + normalizeTitle(a.title), a]))
  const seen = new Set()
  const out = []
  for (const e of index) {
    const article = byDrive.get(e.driveId) ?? byDateTitle.get(e.date + '|' + normalizeTitle(e.title)) ?? null
    const id = article?.id ?? `${e.date}_${e.driveId.slice(0, 8)}`
    if (seen.has(id)) continue
    seen.add(id)
    if (article) byDrive.delete(article.driveId)
    const noteUrl = article?.noteUrl || e.noteUrl || null
    const paidNote = Boolean(noteUrl && paid[String(noteUrl).split('?')[0]])
    const driveKey = !paidNote && article && transcripts.has(article.transcriptFile) ? article.transcriptFile : null
    const noteKey = !paidNote && transcripts.has(`${id}.txt`) ? `${id}.txt` : null
    out.push({
      id,
      date: e.date,
      title: article?.title ?? e.title,
      tags: article?.tags ?? [],
      summary: article?.summary ?? '',
      keyPoints: article?.keyPoints ?? [],
      qa: article?.qa ?? [],
      transcriptFile: driveKey ?? noteKey,
      bodySource: e.bodySource ?? null,
      paidNote,
    })
  }
  // 索引に載っていない記事（通常は無いが、サイト側と数を合わせる）
  for (const a of byDrive.values()) {
    if (seen.has(a.id)) continue
    seen.add(a.id)
    const paidNote = Boolean(a.noteUrl && paid[String(a.noteUrl).split('?')[0]])
    out.push({
      id: a.id,
      date: a.date,
      title: a.title,
      tags: a.tags ?? [],
      summary: a.summary ?? '',
      keyPoints: a.keyPoints ?? [],
      qa: a.qa ?? [],
      transcriptFile: !paidNote && transcripts.has(a.transcriptFile) ? a.transcriptFile : null,
      bodySource: null,
      paidNote,
    })
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title, 'ja')))
  return out
}

/** src/lib/paths.ts から、学びの道筋の key と題名だけを取り出す */
async function loadPaths() {
  const src = await fs.readFile(path.join(ROOT, 'src', 'lib', 'paths.ts'), 'utf8')
  const out = []
  const re = /key:\s*'([^']+)',\s*\n\s*title:\s*'([^']+)',[\s\S]*?lead:\s*'([^']*)'/g
  let m
  while ((m = re.exec(src))) out.push({ key: m[1], title: m[2], lead: m[3] })
  return out
}

/** 型紙の <head> と #root を、このページ用の中身で差し替える */
function render(template, { url, title, description, body, jsonLd, type = 'website' }) {
  // GitHub Pages はフォルダの住所に「/」を付けて返すので、正式な住所も「/」付きにそろえる
  const abs = url === '/' ? SITE : SITE + url.replace(/^\//, '') + '/'
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(abs)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(abs)}" />`,
    ...[jsonLd ?? []].flat().filter(Boolean).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean).join('\n    ')

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, '')
  html = html.replace(/\n\s*<meta name="description"[\s\S]*?\/>/, '')
  html = html.replace(/\n\s*<meta property="og:(?:type|title|description|url)"[\s\S]*?\/>/g, '')
  html = html.replace('</head>', `  ${head}\n  </head>`)
  // .prerender は「検索エンジン向けの中身」の印。index.html の <style> がこれを人の目から隠す
  html = html.replace('<div id="root"></div>', `<div id="root"><div class="prerender">${body}</div></div>`)
  return html
}

/**
 * 全文の「行頭の印」を、そのままの形の HTML にする。
 * 印を付ける側は scripts/ingest.mjs の podyArticleToText、画面側は src/lib/transcript.ts。
 * 三者は同じ印の表（## 見出し／>> 話者｜発言／?? 質問者｜質問／!! ひとこと／%% 用語｜説明／-- まとめ）を見る。
 */
function transcriptHtml(text) {
  const out = []
  let points = null
  const flush = () => {
    if (points) out.push(`<ul>${points.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`)
    points = null
  }
  const named = (rest) => {
    const i = rest.indexOf('｜')
    return i < 0 ? { who: '', body: rest.trim() } : { who: rest.slice(0, i).trim(), body: rest.slice(i + 1).trim() }
  }
  for (const line of text.split(/\n+/)) {
    const l = line.trim()
    if (!l) continue
    const m = /^(##|>>|\?\?|!!|%%|--)\s+([\s\S]*)$/.exec(l)
    if (!m) {
      flush()
      out.push(`<p>${esc(l)}</p>`)
      continue
    }
    const [, mark, rest] = m
    if (mark === '--') {
      points = points ?? []
      points.push(rest.trim())
      continue
    }
    flush()
    if (mark === '##') out.push(`<h3>${esc(rest.trim())}</h3>`)
    else if (mark === '>>' || mark === '??') {
      const { who, body } = named(rest)
      const label = mark === '??' ? `質問${who ? `（${who}）` : ''}` : who || '話し手'
      out.push(`<blockquote><p><b>${esc(label)}</b> ${esc(body)}</p></blockquote>`)
    } else if (mark === '!!') {
      const { who, body } = named(rest)
      out.push(`<blockquote><p><b>${esc(body)}</b>${who ? ` ── ${esc(who)}` : ''}</p></blockquote>`)
    }
    else {
      const { who, body } = named(rest)
      out.push(`<p>${who ? `<b>${esc(who)}</b> ` : ''}${esc(body)}</p>`)
    }
  }
  flush()
  return out.join('')
}

/** 回への内部リンク1本 */
function epLink(ep) {
  return `<li><a href="${esc(SITE)}e/${esc(ep.id)}/">${esc(ep.date)} ${esc(ep.title)}</a></li>`
}

/**
 * 回どうしをつなぐ道。
 * 静的HTMLにリンクが1本も無いと、検索エンジンはトップ以外の回を見つけられない
 * （サイトマップが読めないときは、これだけが手がかりになる）。
 */
function episodeNav(ep, prev, next, sameMonth) {
  const parts = ['<nav><h2>この配信の前後</h2><ul>']
  if (prev) parts.push(`<li>前の配信: <a href="${esc(SITE)}e/${esc(prev.id)}/">${esc(prev.date)} ${esc(prev.title)}</a></li>`)
  if (next) parts.push(`<li>次の配信: <a href="${esc(SITE)}e/${esc(next.id)}/">${esc(next.date)} ${esc(next.title)}</a></li>`)
  parts.push('</ul>')
  if (sameMonth.length) {
    parts.push(`<h2>${esc(ep.date.slice(0, 7).replace('-', '年'))}月の配信</h2><ul>`)
    parts.push(sameMonth.map(epLink).join(''))
    parts.push('</ul>')
  }
  parts.push(`<ul><li><a href="${esc(SITE)}browse/">全配信を探す</a></li><li><a href="${esc(SITE)}">${esc(NAME)}</a></li></ul></nav>`)
  return parts.join('')
}

function episodeBody(ep, transcript, nav = '', summary = { abstract: '', points: [] }) {
  const parts = [`<article>`, `<h1>${esc(ep.title)}</h1>`, `<p>${esc(ep.date)} 配信｜${esc(NAME)}</p>`]
  if (ep.tags.length) parts.push(`<p>${ep.tags.map((t) => `#${esc(t)}`).join(' ')}</p>`)
  // 答えを先に置く。読む側も、要約を拾う側も、最初の数行で「この回は何の話か」が分かるように
  if (summary.abstract) parts.push(`<h2>この回の要旨</h2><p>${esc(summary.abstract)}</p>`)
  if (summary.points.length) {
    parts.push(`<h2>この回の要点</h2><ul>${summary.points.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>`)
  }
  if (ep.summary) parts.push(`<h2>要約</h2><p>${esc(ep.summary)}</p>`)
  if (ep.keyPoints.length) parts.push(`<h2>要点</h2><ul>${ep.keyPoints.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>`)
  if (ep.qa.length) parts.push(`<h2>こんな質問に答えています</h2><dl>${ep.qa.map((q) => `<dt>${esc(q.q)}</dt><dd>${esc(q.a)}</dd>`).join('')}</dl>`)
  if (transcript) {
    const text = transcript.length > BODY_LIMIT ? transcript.slice(0, BODY_LIMIT) : transcript
    const heading = ep.bodySource === 'pody' ? '配信の全文（podyの記事より）' : '配信の全文'
    parts.push(`<h2>${esc(heading)}</h2>`)
    parts.push(transcriptHtml(text))
  }
  parts.push('</article>')
  if (nav) parts.push(nav)
  return parts.join('')
}

async function main() {
  const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8')
  const episodes = await loadEpisodes()
  const paths = await loadPaths()
  const urls = []

  const write = async (url, html) => {
    const dir = url === '/' ? DIST : path.join(DIST, url.replace(/^\//, ''))
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'index.html'), html, 'utf8')
    urls.push(url)
  }

  // 固定のページ
  const fixed = [
    { url: '/', title: NAME, description: `原価はいくら？ なぜバターだけ高い？ 雄の子牛はどうなる？ 出雲の酪農家が毎朝の配信で答えてきた${episodes.length}回を、読める形にまとめました。牛乳を飲む人も、酪農を志す人も、登録なしで読めます。`, h1: NAME, lead: `牛乳のこと、牛のこと、酪農家になる道のこと。配信 ${episodes.length} 回分を、言葉で検索できる形にまとめています。牛乳を飲む人も、酪農を志す人も、登録なしで読めます。`, priority: '1.0' },
    { url: '/browse', title: `全配信を探す｜${NAME}`, description: `川上牧場の配信 ${episodes.length} 回を、言葉・分類・年月から探せます。乳房炎、資金、飼料、繁殖、就農など。`, h1: '全配信を探す', lead: '言葉で全文を検索できます。', priority: '0.9' },
    { url: '/archive', title: `全配信の一覧｜${NAME}`, description: `2019年から続く川上牧場の音声配信 ${episodes.length} 回を、日付順にすべて並べた一覧です。`, h1: '全配信の一覧', lead: `2019年からの ${episodes.length} 回を、新しい順に並べています。`, priority: '0.9' },
    { url: '/paths', title: `学びの道筋｜${NAME}`, description: '何から読めばいいかを順番にした道筋。ゼロから酪農を始める、牛を健康に飼う、ほか。', h1: '学びの道筋', lead: '読む順番をたどれます。', priority: '0.8' },
    { url: '/for-students', title: `酪農を志す人へ｜${NAME}`, description: '酪農をやってみたい人が最初に知りたいこと。資金、資格、非農家からの道、研修のこと。', h1: '酪農を志す人へ', lead: '', priority: '0.8' },
    { url: '/for-consumers', title: `牛乳を飲む人へ｜${NAME}`, description: '牛乳と酪農について、消費者からよく聞かれる質問に酪農家が答えます。', h1: '牛乳を飲む人へ', lead: '', priority: '0.8' },
    { url: '/expert', title: `企業・研究・メディアの方へ｜${NAME}`, description: '島根県出雲市の酪農家が、飼養管理・経営・人手・遺伝改良・資材の実態についてお答えします。専門家インタビュー、取材、新規事業の伴走のご相談を承ります。', h1: '酪農の現場に、直接たずねる', lead: '搾乳牛40頭・全体80頭を1人で管理する酪農家が、統計や資料では出てこない粒度で現場の実態をお話しします。', priority: '0.8' },
    { url: '/about', title: `牧場について｜${NAME}`, description: '島根県出雲市・川上牧場について。研修生の受け入れ、酪農家・牧場向けの相談、講演や取材のご依頼。', h1: '牧場について', lead: '', priority: '0.7' },
  ]
  // 静的HTMLにも、ほかのページへ行ける道を必ず置く（検索エンジンはここを辿って回を見つける）
  const byDate = [...episodes].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  /** 年ごとにまとめた一覧（新しい年から） */
  const byYear2 = () => {
    const m = new Map()
    for (const e of byDate) {
      const y = e.date.slice(0, 4)
      if (!m.has(y)) m.set(y, [])
      m.get(y).push(e)
    }
    return [...m.entries()]
  }
  const menu =
    `<nav><ul>` +
    fixed.map((f) => `<li><a href="${esc(SITE)}${f.url === '/' ? '' : f.url.replace(/^\//, '') + '/'}">${esc(f.h1)}</a></li>`).join('') +
    paths.map((p) => `<li><a href="${esc(SITE)}paths/${esc(p.key)}/">${esc(p.title)}</a></li>`).join('') +
    `</ul></nav>`
  for (const f of fixed) {
    const extra =
      f.url === '/archive' || f.url === '/browse'
        ? // 全配信の索引。ここから 1 回ずつに辿れる（/archive は画面にも同じ一覧が出る）
          byYear2().map(([y, list]) => `<h2>${esc(y)}年</h2><ul>${list.map(epLink).join('')}</ul>`).join('')
        : f.url === '/'
          ? `<h2>最近の配信</h2><ul>${byDate.slice(0, 30).map(epLink).join('')}</ul>`
          : ''
    await write(f.url, render(template, {
      url: f.url, title: f.title, description: f.description,
      body: `<article><h1>${esc(f.h1)}</h1><p>${esc(f.lead || f.description)}</p>${extra}</article>${menu}`,
      jsonLd:
        f.url === '/'
          ? [
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: NAME,
                url: SITE,
                inLanguage: 'ja',
                description: f.description,
                publisher: FARM,
                // 「サイトの中を言葉で探せる」ことを機械に伝える
                potentialAction: {
                  '@type': 'SearchAction',
                  target: { '@type': 'EntryPoint', urlTemplate: `${SITE}browse?q={search_term_string}` },
                  'query-input': 'required name=search_term_string',
                },
              },
              { '@context': 'https://schema.org', ...FARM, founder: AUTHOR, description: '島根県出雲市の酪農家。乳牛約80頭。' },
            ]
          : [
              { '@context': 'https://schema.org', '@type': 'WebPage', name: f.h1, url: `${SITE}${f.url.replace(/^\//, '')}/`, description: f.description, inLanguage: 'ja', isPartOf: { '@type': 'WebSite', name: NAME, url: SITE } },
              breadcrumb([{ name: NAME, url: SITE }, { name: f.h1, url: `${SITE}${f.url.replace(/^\//, '')}/` }]),
            ],
    }))
  }

  // 学びの道筋
  for (const p of paths) {
    await write(`/paths/${p.key}`, render(template, {
      url: `/paths/${p.key}`,
      title: `${p.title}｜学びの道筋｜${NAME}`,
      description: clip(p.lead, 110),
      body: `<article><h1>${esc(p.title)}</h1><p>${esc(p.lead)}</p></article>${menu}`,
      jsonLd: breadcrumb([
        { name: NAME, url: SITE },
        { name: '学びの道筋', url: `${SITE}paths/` },
        { name: p.title, url: `${SITE}paths/${p.key}/` },
      ]),
    }))
  }

  // 個別の回（新しい順に並べ、前後をつないで回れるようにする）
  const ordered = [...episodes].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1))
  const byMonth = new Map()
  for (const e of ordered) {
    const k = e.date.slice(0, 7)
    if (!byMonth.has(k)) byMonth.set(k, [])
    byMonth.get(k).push(e)
  }
  let withBody = 0
  for (const [i, ep] of ordered.entries()) {
    const newer = i > 0 ? ordered[i - 1] : null
    const older = i < ordered.length - 1 ? ordered[i + 1] : null
    const sameMonth = (byMonth.get(ep.date.slice(0, 7)) ?? []).filter((e) => e.id !== ep.id).slice(0, 10)
    let transcript = null
    if (ep.transcriptFile) {
      transcript = await fs.readFile(path.join(DATA, 'transcripts', ep.transcriptFile), 'utf8')
      withBody++
    }
    const summary = extractSummary(transcript)
    const description = clip(ep.summary || summary.abstract || stripMarkers(transcript) || `${ep.date} の配信。${ep.title}`, 110)
    await write(`/e/${ep.id}`, render(template, {
      url: `/e/${ep.id}`,
      type: 'article',
      title: `${ep.title}｜${NAME}`,
      description,
      body: episodeBody(ep, transcript, episodeNav(ep, older, newer, sameMonth), summary),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: ep.title,
          datePublished: ep.date,
          dateModified: ep.date,
          description,
          ...(summary.abstract ? { abstract: summary.abstract } : {}),
          ...(ep.tags.length ? { keywords: ep.tags.join(', ') } : {}),
          inLanguage: 'ja',
          isAccessibleForFree: true,
          author: AUTHOR,
          publisher: { ...FARM, name: NAME },
          mainEntityOfPage: `${SITE}e/${ep.id}/`,
          isPartOf: { '@type': 'WebSite', name: NAME, url: SITE },
        },
        breadcrumb([
          { name: NAME, url: SITE },
          { name: '全配信を探す', url: `${SITE}browse/` },
          { name: ep.title, url: `${SITE}e/${ep.id}/` },
        ]),
        // 質問と答えが揃っている回だけ、そのまま問答として出す
        ep.qa.length
          ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: ep.qa.map((q) => ({
                '@type': 'Question',
                name: q.q,
                acceptedAnswer: { '@type': 'Answer', text: q.a },
              })),
            }
          : null,
      ],
    }))
  }

  // sitemap.xml
  const today = new Date().toISOString().slice(0, 10)
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => {
      const pri = u === '/' ? '1.0' : u.startsWith('/e/') ? '0.6' : '0.8'
      const loc = u === '/' ? SITE : SITE + u.replace(/^\//, '') + '/'
      return `  <url><loc>${esc(loc)}</loc><lastmod>${today}</lastmod><priority>${pri}</priority></url>`
    }),
    '</urlset>',
  ].join('\n')
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemap + '\n', 'utf8')

  // robots.txt
  await fs.writeFile(
    path.join(DIST, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# 生成AIの巡回も歓迎します（要約に使われるとき、出典として辿れるように）',
      ...['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot'].flatMap(
        (ua) => [`User-agent: ${ua}`, 'Allow: /', ''],
      ),
      `Sitemap: ${SITE}sitemap.xml`,
      '',
    ].join('\n'),
    'utf8',
  )

  // llms.txt（生成AIに、このサイトが何で・どこを読めばよいかを一枚で伝える約束事）
  const recent = byDate.slice(0, 40)
  await fs.writeFile(
    path.join(DIST, 'llms.txt'),
    [
      `# ${NAME}`,
      '',
      `> 島根県出雲市の酪農家・川上哲也が、2019年から毎朝続けている音声配信 ${episodes.length} 回を、言葉で検索できる形にまとめたものです。全文が読める回は ${withBody} 本。牛の飼い方・繁殖・飼料・経営・牛乳の価格・消費者からの質問まで、現場の一次情報を本人の言葉で記録しています。登録も費用も要りません。`,
      '',
      '内容はすべて配信時点での本人の経験と意見です。価格・制度・医学的な情報は時間とともに変わります。引用される際は配信日を添えてください。',
      '',
      '## 入口',
      '',
      `- [全配信を探す](${SITE}browse/): ${episodes.length} 回すべての索引。言葉で全文検索できます`,
      `- [酪農を志す人へ](${SITE}for-students/): 就農の資金・資格・非農家からの入り方`,
      `- [牛乳を飲む人へ](${SITE}for-consumers/): 牛乳の原価、バターの値段、雄の子牛、給食の牛乳`,
      `- [学びの道筋](${SITE}paths/): テーマごとに読む順番を決めた案内`,
      `- [牧場について](${SITE}about/): 川上牧場と、このサイトの成り立ち`,
      `- [企業・研究・メディアの方へ](${SITE}expert/): 現場への取材・相談の窓口`,
      '',
      '## 最近の配信',
      '',
      ...recent.map((e) => `- [${e.title}](${SITE}e/${e.id}/): ${e.date} の配信`),
      '',
      '## そのほか',
      '',
      `- [サイトマップ](${SITE}sitemap.xml): 全 ${urls.length} ページの一覧`,
      '',
    ].join('\n'),
    'utf8',
  )

  // 404.html（書き出していない住所に来たとき、アプリ側で表示する）
  await fs.writeFile(path.join(DIST, '404.html'), template, 'utf8')
  // GitHub Pages 側で余計な加工をさせない
  await fs.writeFile(path.join(DIST, '.nojekyll'), '', 'utf8')

  console.log(`書き出し: ${urls.length} ページ（うち個別の回 ${episodes.length}、全文つき ${withBody}）`)
  console.log(`sitemap.xml / robots.txt / 404.html も作成。公開先: ${SITE}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
