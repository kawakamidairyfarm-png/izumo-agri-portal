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
  // 組織の正式な住所は牧場のホームページ。データバンクは その牧場が出している読み物
  url: 'https://kawakamibokuzyou.hp.peraichi.com/',
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
      noteUrl,
      notePrice: paidNote ? (paid[String(noteUrl).split('?')[0]]?.price ?? null) : null,
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
      noteUrl: a.noteUrl ?? null,
      notePrice: paidNote ? (paid[String(a.noteUrl).split('?')[0]]?.price ?? null) : null,
    })
  }
  out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title, 'ja')))
  return out
}

/** src/lib/flows.ts から、流れで読む道の key・題名・段階の小分類を取り出す */
async function loadFlows() {
  const src = await fs.readFile(path.join(ROOT, 'src', 'lib', 'flows.ts'), 'utf8')
  const out = []
  for (const m of src.matchAll(/key: '([a-z0-9-]+)',\s*title: '([^']+)',\s*lead: '([^']+)',\s*steps: \[([\s\S]*?)\n\s*\],/g)) {
    out.push({ key: m[1], title: m[2], lead: m[3], steps: [...m[4].matchAll(/topic: '([a-z0-9-]+)', why: '([^']+)'/g)].map((x) => ({ topic: x[1], why: x[2] })) })
  }
  return out
}

/** src/lib/stairs.ts から、変化の階段（相手の状態別の入口）の key・相手・題名・段の小分類を取り出す */
async function loadStairs() {
  const src = await fs.readFile(path.join(ROOT, 'src', 'lib', 'stairs.ts'), 'utf8')
  const out = []
  for (const m of src.matchAll(/key: '([a-z0-9-]+)',\s*audience: '(consumer|student)',\s*title: '([^']+)',\s*lead: '([^']+)',\s*topics: \[([^\]]*)\],\s*next: \{\s*label: '([^']+)',\s*text: '([^']+)',\s*href: [^,]+,\s*cta: '([^']+)'/g)) {
    out.push({ key: m[1], audience: m[2], title: m[3], lead: m[4], topics: [...m[5].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]), next: { label: m[6], text: m[7], cta: m[8] } })
  }
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
function render(template, { url, title, description, body, jsonLd, type = 'website', ogTitle, ogDescription }) {
  // GitHub Pages はフォルダの住所に「/」を付けて返すので、正式な住所も「/」付きにそろえる
  const abs = url === '/' ? SITE : SITE + url.replace(/^\//, '') + '/'
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(abs)}" />`,
    `<meta property="og:type" content="${type}" />`,
    // 共有カード（LINE・X・Discord）の題名と説明は、検索向けの <title>・description と分けてよい
    `<meta property="og:title" content="${esc(ogTitle ?? title)}" />`,
    `<meta property="og:description" content="${esc(ogDescription ?? description)}" />`,
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
  // noteの有料記事になっている回は、このサイトに全文を置いていない＝どこで読めるかを正直に案内する
  if (ep.paidNote && ep.noteUrl) {
    const kind = ep.notePrice ? `有料記事（${ep.notePrice.toLocaleString()}円）` : 'メンバーシップ限定記事'
    parts.push(
      `<h2>もっと詳しくは、noteの記事で</h2><p>この回の全文は、noteの${esc(kind)}として公開しています。` +
        `数字の出どころや、配信で話しきれなかったところまで書いてあります：` +
        `<a href="${esc(ep.noteUrl)}">noteで読む</a>。配信の音声そのものは、Pody・Spotify・YouTube でどなたでも無料で聴けます。</p>`,
    )
  }
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
  const taxonomy = await readJson(path.join(DATA, 'taxonomy.json'))
  const topicMap = await readJson(path.join(DATA, 'topics.json'))
  const subs = taxonomy.groups.flatMap((g) => g.subs.map((t) => ({ ...t, group: g })))
  const episodesForTopic = (key) => {
    const rank = (e) => (e.summary ? 0 : e.transcriptFile ? 1 : 2)
    return episodes
      .filter((e) => (topicMap[e.id] ?? []).includes(key))
      .sort((a, b) => rank(a) - rank(b) || (a.date < b.date ? 1 : -1))
  }
  const flows = await loadFlows()
  const stairs = await loadStairs()
  if (stairs.length !== 7) throw new Error(`stairs.ts の読み取りが ${stairs.length} 段（7段のはず）`)
  const AUD_LABEL = { consumer: '牛乳を飲む人', student: '酪農を志す人' }
  const urls = []

  const write = async (url, html) => {
    const dir = url === '/' ? DIST : path.join(DIST, url.replace(/^\//, ''))
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'index.html'), html, 'utf8')
    urls.push(url)
  }

  // 本文から作った索引（scripts/build-transcripts-json.mjs が prebuild で作る）。質問した人の名前は入っていない
  const byFile = new Map(episodes.filter((e) => e.transcriptFile).map((e) => [e.transcriptFile, e]))
  const questionsRaw = (await exists(path.join(DATA, 'questions.json'))) ? await readJson(path.join(DATA, 'questions.json')) : []
  const termsRaw = (await exists(path.join(DATA, 'terms.json'))) ? await readJson(path.join(DATA, 'terms.json')) : []
  /** 届いた質問（編集した記事のQ&A ＋ 本文の質問。同じ質問文は1つ） */
  const questions = (() => {
    const edited = episodes.flatMap((e) => e.qa.map((p) => ({ q: p.q, a: p.a, ep: e })))
    const seen = new Set(edited.map((x) => x.q))
    const rest = questionsRaw.map((r) => ({ q: r.q, a: r.a, ep: byFile.get(r.key) })).filter((x) => x.ep && !seen.has(x.q))
    return [...edited, ...rest].sort((a, b) => (a.ep.date < b.ep.date ? 1 : a.ep.date > b.ep.date ? -1 : 0))
  })()
  /** ことば帖（言葉ごとに束ね、説明は最初に出てきた回のもの） */
  const terms = (() => {
    const m = new Map()
    for (const r of termsRaw) {
      const ep = byFile.get(r.key)
      if (!ep) continue
      if (!m.has(r.term)) m.set(r.term, [])
      m.get(r.term).push({ text: r.text, ep })
    }
    return [...m.entries()]
      .map(([term, list]) => ({ term, list: list.sort((a, b) => (a.ep.date < b.ep.date ? 1 : -1)) }))
      .sort((a, b) => a.term.localeCompare(b.term, 'ja'))
  })()

  // 固定のページ
  const fixed = [
    { url: '/', title: NAME, ogTitle: '酪農データバンク｜牛乳の「なぜ？」に、出雲の酪農家が答える', ogDescription: '原価はいくら？ なぜバターだけ高い？ 雄の子牛はどうなる？ 毎朝の配信で答えてきたことを、登録なしで読めます。', description: `原価はいくら？ なぜバターだけ高い？ 雄の子牛はどうなる？ 出雲の酪農家が毎朝の配信で答えてきた${episodes.length}回を、読める形にまとめました。牛乳を飲む人も、酪農を志す人も、登録なしで読めます。`, h1: NAME, lead: `牛乳のこと、牛のこと、酪農家になる道のこと。配信 ${episodes.length} 回分を、言葉で検索できる形にまとめています。牛乳を飲む人も、酪農を志す人も、登録なしで読めます。`, priority: '1.0' },
    { url: '/browse', title: `全配信を探す｜${NAME}`, description: `川上牧場の配信 ${episodes.length} 回を、言葉・分類・年月から探せます。乳房炎、資金、飼料、繁殖、就農など。`, h1: '全配信を探す', lead: '言葉で全文を検索できます。', priority: '0.9' },
    { url: '/archive', title: `全配信の一覧｜${NAME}`, description: `2019年から続く川上牧場の音声配信 ${episodes.length} 回を、日付順にすべて並べた一覧です。`, h1: '全配信の一覧', lead: `2019年からの ${episodes.length} 回を、新しい順に並べています。`, priority: '0.9' },
    { url: '/questions', title: `届いた質問と、答えた回｜${NAME}`, description: `牛乳や酪農について牧場に届いた質問 ${questions.length} 件と、出雲の酪農家がそのとき配信で答えたこと。原価、バター、給食の牛乳、雄の子牛、就農の資金など。`, h1: '届いた質問と、答えた回', lead: `配信に届いた質問と、そのとき酪農家が答えたことを ${questions.length} 件並べています。答えは配信時点の経験と意見です。`, priority: '0.9' },
    { url: '/terms', title: `酪農のことば帖｜${NAME}`, description: `配信の中で出てきた酪農の言葉 ${terms.length} 語を、現場の酪農家が自分の言葉で説明したまま並べた帖。乳糖不耐症、牛群検定、初乳、TMR、ルーメンなど。`, h1: '酪農のことば帖', lead: `配信の中で出てきた言葉を、そのとき酪農家が自分の言葉で説明したまま ${terms.length} 語並べています。辞書の定義ではなく、現場の言い方です。`, priority: '0.9' },
    { url: '/stairs', title: `あなたはいま、どこ？｜${NAME}`, description: 'スーパーで気になった、牛のことが気になってきた、応援したい。憧れている、現実を知りたい、準備を始める、飼い始めた。いまの自分に近い段から入る、牛乳を飲む人と酪農を志す人の入口。', h1: 'あなたはいま、どこ？', lead: 'テーマの名前より、いまの自分に近い段から入るほうが早く着きます。牛乳を飲む人は3段、酪農を志す人は4段。どの段にも、読んだあとの次の一歩を一つだけ置いています。', priority: '0.9' },
    { url: '/topics', title: `テーマから探す｜${NAME}`, description: `牛乳の値段、給食の牛乳、子牛、乳房炎、資金、後継、AI、環境、アニマルウェルフェア。配信 ${episodes.length} 回を ${taxonomy.groups.length} つの大きなテーマと ${taxonomy.groups.reduce((a, g) => a + g.subs.length, 0)} の小さなテーマに分けた入口。`, h1: 'テーマから探す', lead: '気になる言葉から入って、その話をした回・届いた質問・ことばをまとめて読めます。', priority: '0.9' },
    { url: '/paths', title: `学びの道筋｜${NAME}`, description: '何から読めばいいかを順番にした道筋。ゼロから酪農を始める、牛を健康に飼う、ほか。', h1: '学びの道筋', lead: '読む順番をたどれます。', priority: '0.8' },
    { url: '/for-students', title: `酪農を志す人へ｜${NAME}`, description: '酪農をやってみたい人が最初に知りたいこと。資金、資格、非農家からの道、研修のこと。', h1: '酪農を志す人へ', lead: '', priority: '0.8' },
    { url: '/live', title: `LIVEを見てくれている人へ｜${NAME}`, description: '川上牧場のLIVEを見てくれている人へ。LIVEで話したことを、毎朝の配信の記録からあとで読めます。聞けなかった質問は公式LINEへ。', h1: 'LIVEで話したことを、あとから読めます。', lead: 'LIVEで出てきた言葉から、その話をした回を探せます。聞けなかった質問は公式LINEへ送れます。', priority: '0.7' },
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
    `<li><a href="https://kawakamibokuzyou.hp.peraichi.com/">川上牧場のホームページ</a></li>` +
    `</ul></nav>`
  for (const f of fixed) {
    const extra =
      f.url === '/archive' || f.url === '/browse'
        ? // 全配信の索引。ここから 1 回ずつに辿れる（/archive は画面にも同じ一覧が出る）
          byYear2().map(([y, list]) => `<h2>${esc(y)}年</h2><ul>${list.map(epLink).join('')}</ul>`).join('')
        : f.url === '/stairs'
          ? ['consumer', 'student']
              .map(
                (au) =>
                  `<h2>${esc(AUD_LABEL[au])}</h2><ol>${stairs
                    .filter((st) => st.audience === au)
                    .map((st) => `<li><a href="${esc(SITE)}stair/${esc(st.key)}/">${esc(st.title)}</a> ${esc(st.lead)}</li>`)
                    .join('')}</ol>`,
              )
              .join('')
        : f.url === '/topics'
          ? `<h2>流れで読む</h2><ul>${flows.map((fl) => `<li><a href="${esc(SITE)}flow/${esc(fl.key)}/">${esc(fl.title)}</a> ${esc(fl.lead)}</li>`).join('')}</ul>` +
            taxonomy.groups
              .map(
                (g) =>
                  `<h2>${esc(g.label)}</h2><p>${esc(g.blurb)}</p><ul>${g.subs
                    .map((t) => `<li><a href="${esc(SITE)}t/${esc(t.key)}/">${esc(t.label)}</a>（${episodesForTopic(t.key).length}回） ${esc(t.blurb)}</li>`)
                    .join('')}</ul>`,
              )
              .join('')
        : f.url === '/'
          ? `<h2>最近の配信</h2><ul>${byDate.slice(0, 30).map(epLink).join('')}</ul>`
          : f.url === '/questions'
            ? `<dl>${questions
                .map(
                  (x) =>
                    `<dt>${esc(x.q)}</dt><dd>${esc(x.a)}<br><a href="${esc(SITE)}e/${esc(x.ep.id)}/">${esc(x.ep.date)} ${esc(x.ep.title)}</a></dd>`,
                )
                .join('')}</dl>`
            : f.url === '/terms'
              ? `<dl>${terms
                  .map(
                    (g) =>
                      `<dt>${esc(g.term)}</dt><dd>${esc(g.list[0].text)}<br>出てきた回：${g.list
                        .slice(0, 3)
                        .map((r) => `<a href="${esc(SITE)}e/${esc(r.ep.id)}/">${esc(r.ep.date)}</a>`)
                        .join('／')}</dd>`,
                  )
                  .join('')}</dl>`
              : ''
    await write(f.url, render(template, {
      url: f.url,
      ogTitle: f.ogTitle,
      ogDescription: f.ogDescription, title: f.title, description: f.description,
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
              // 届いた質問は FAQ として、ことば帖は用語集として、機械にもそのまま読めるように
              ...(f.url === '/questions'
                ? [
                    {
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      mainEntity: questions
                        .filter((x) => x.a)
                        .map((x) => ({
                          '@type': 'Question',
                          name: x.q,
                          answerCount: 1,
                          acceptedAnswer: { '@type': 'Answer', text: x.a, author: AUTHOR, url: `${SITE}e/${x.ep.id}/`, dateCreated: x.ep.date },
                        })),
                    },
                  ]
                : f.url === '/terms'
                  ? [
                      {
                        '@context': 'https://schema.org',
                        '@type': 'DefinedTermSet',
                        name: '酪農のことば帖',
                        url: `${SITE}terms/`,
                        inLanguage: 'ja',
                        author: AUTHOR,
                        hasDefinedTerm: terms.map((g) => ({ '@type': 'DefinedTerm', name: g.term, description: g.list[0].text, url: `${SITE}e/${g.list[0].ep.id}/` })),
                      },
                    ]
                  : []),
            ],
    }))
  }

  // テーマ（小分類）: その話をした回の一覧を静的にも置く
  for (const t of subs) {
    const list = episodesForTopic(t.key)
    const sib = t.group.subs.filter((x) => x.key !== t.key)
    await write(`/t/${t.key}`, render(template, {
      url: `/t/${t.key}`,
      title: `${t.label}｜${t.group.label}｜${NAME}`,
      description: clip(`${t.blurb} 出雲の酪農家が配信で話した ${list.length} 回。`, 110),
      body:
        `<article><h1>${esc(t.label)}</h1><p>${esc(t.blurb)}</p><p>${esc(t.group.label)}のテーマ。${list.length} 回。</p>` +
        `<h2>この話をした回</h2><ul>${list.map(epLink).join('')}</ul>` +
        `<h2>同じ「${esc(t.group.label)}」の中</h2><ul>${sib.map((x) => `<li><a href="${esc(SITE)}t/${esc(x.key)}/">${esc(x.label)}</a></li>`).join('')}</ul></article>${menu}`,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.label, url: `${SITE}t/${t.key}/`, description: t.blurb, inLanguage: 'ja', isPartOf: { '@type': 'WebSite', name: NAME, url: SITE }, hasPart: list.slice(0, 50).map((e) => ({ '@type': 'Article', headline: e.title, url: `${SITE}e/${e.id}/`, datePublished: e.date })) },
        breadcrumb([
          { name: NAME, url: SITE },
          { name: 'テーマから探す', url: `${SITE}topics/` },
          { name: t.label, url: `${SITE}t/${t.key}/` },
        ]),
      ],
    }))
  }
  // 変化の階段（相手の状態別の入口）
  for (const st of stairs) {
    const list = stairs.filter((x) => x.audience === st.audience)
    const n = list.indexOf(st) + 1
    const parts = st.topics.map((k) => subs.find((x) => x.key === k)).filter(Boolean)
    const ids = new Set(parts.flatMap((t) => episodesForTopic(t.key).map((e) => e.id)))
    await write(`/stair/${st.key}`, render(template, {
      url: `/stair/${st.key}`,
      title: `${st.title}｜${AUD_LABEL[st.audience]}の${n}段目｜${NAME}`,
      description: clip(st.lead, 110),
      body:
        `<article><h1>${esc(st.title)}</h1><p>${esc(AUD_LABEL[st.audience])}の ${n} 段目／${list.length}。${ids.size} 回。</p><p>${esc(st.lead)}</p><ol>${parts
          .map((t) => `<li><a href="${esc(SITE)}t/${esc(t.key)}/">${esc(t.label)}</a> ${esc(t.blurb)}<ul>${episodesForTopic(t.key).slice(0, 3).map(epLink).join('')}</ul></li>`)
          .join('')}</ol><h2>この段を読んだら</h2><p>${esc(st.next.label)}。${esc(st.next.text)}</p></article>${menu}`,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'CollectionPage', name: st.title, url: `${SITE}stair/${st.key}/`, description: st.lead, inLanguage: 'ja', isPartOf: { '@type': 'WebSite', name: NAME, url: SITE }, hasPart: parts.map((t) => ({ '@type': 'CollectionPage', name: t.label, url: `${SITE}t/${t.key}/` })) },
        breadcrumb([
          { name: NAME, url: SITE },
          { name: 'あなたはいま、どこ？', url: `${SITE}stairs/` },
          { name: st.title, url: `${SITE}stair/${st.key}/` },
        ]),
      ],
    }))
  }

  // 流れで読む
  for (const fl of flows) {
    const steps = fl.steps.map((st) => ({ ...st, sub: subs.find((x) => x.key === st.topic) })).filter((st) => st.sub)
    await write(`/flow/${fl.key}`, render(template, {
      url: `/flow/${fl.key}`,
      title: `${fl.title}｜流れで読む｜${NAME}`,
      description: clip(fl.lead, 110),
      body:
        `<article><h1>${esc(fl.title)}</h1><p>${esc(fl.lead)}</p><ol>${steps
          .map((st) => `<li><a href="${esc(SITE)}t/${esc(st.sub.key)}/">${esc(st.sub.label)}</a> ${esc(st.why)}<ul>${episodesForTopic(st.sub.key).slice(0, 3).map(epLink).join('')}</ul></li>`)
          .join('')}</ol></article>${menu}`,
      jsonLd: breadcrumb([
        { name: NAME, url: SITE },
        { name: 'テーマから探す', url: `${SITE}topics/` },
        { name: fl.title, url: `${SITE}flow/${fl.key}/` },
      ]),
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
          publisher: FARM,
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
      `- [届いた質問と、答えた回](${SITE}questions/): 牧場に届いた質問 ${questions.length} 件と、そのとき配信で答えたこと（FAQ）`,
      `- [酪農のことば帖](${SITE}terms/): 配信で出てきた言葉 ${terms.length} 語を、酪農家が自分の言葉で説明したまま（用語集）`,
      `- [あなたはいま、どこ？](${SITE}stairs/): 読む人のいまの状態から入る入口。牛乳を飲む人は3段、酪農を志す人は4段（/stair/<段>/）`,
      `- [テーマから探す](${SITE}topics/): ${taxonomy.groups.length} つの大きなテーマと小さなテーマの入口（/t/<テーマ>/ に回の一覧）`,
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
      '- [作った経緯（note）](https://note.com/kawakamifarm/n/n1b47869416ee): 本人が書いた、このサイトを作った理由',
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
