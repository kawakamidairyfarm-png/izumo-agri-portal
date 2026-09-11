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

const readJson = async (p) => JSON.parse(await fs.readFile(p, 'utf8'))
const exists = (p) => fs.access(p).then(() => true, () => false)

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function normalizeTitle(t) {
  return String(t).normalize('NFKC').replace(/\s+/g, '').replace(/[“”"「」『』!！?？・:：、。…—─―]/g, '').toLowerCase()
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
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ].filter(Boolean).join('\n    ')

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, '')
  html = html.replace(/\n\s*<meta name="description"[\s\S]*?\/>/, '')
  html = html.replace(/\n\s*<meta property="og:(?:type|title|description|url)"[\s\S]*?\/>/g, '')
  html = html.replace('</head>', `  ${head}\n  </head>`)
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

function episodeBody(ep, transcript) {
  const parts = [`<article>`, `<h1>${esc(ep.title)}</h1>`, `<p>${esc(ep.date)} 配信｜${esc(NAME)}</p>`]
  if (ep.tags.length) parts.push(`<p>${ep.tags.map((t) => `#${esc(t)}`).join(' ')}</p>`)
  if (ep.summary) parts.push(`<h2>要約</h2><p>${esc(ep.summary)}</p>`)
  if (ep.keyPoints.length) parts.push(`<h2>要点</h2><ul>${ep.keyPoints.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>`)
  if (ep.qa.length) parts.push(`<h2>こんな質問に答えています</h2><dl>${ep.qa.map((q) => `<dt>${esc(q.q)}</dt><dd>${esc(q.a)}</dd>`).join('')}</dl>`)
  if (transcript) {
    const text = transcript.length > BODY_LIMIT ? transcript.slice(0, BODY_LIMIT) : transcript
    const heading = ep.bodySource === 'pody' ? '配信の全文（podyの記事より）' : '配信の全文'
    parts.push(`<h2>${esc(heading)}</h2>`)
    parts.push(text.split(/\n+/).filter((p) => p.trim()).map((p) => `<p>${esc(p)}</p>`).join(''))
  }
  parts.push('</article>')
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
    { url: '/', title: NAME, description: '酪農家になりたい人のための知識バンク。島根県出雲市・川上牧場が研修生に話してきたことを、毎朝の配信の文字起こしから読める形に整理しました。', h1: NAME, lead: `配信 ${episodes.length} 回分を、言葉で検索できる形にまとめています。`, priority: '1.0' },
    { url: '/browse', title: `全配信を探す｜${NAME}`, description: `川上牧場の配信 ${episodes.length} 回を、言葉・分類・年月から探せます。乳房炎、資金、飼料、繁殖、就農など。`, h1: '全配信を探す', lead: '言葉で全文を検索できます。', priority: '0.9' },
    { url: '/paths', title: `学びの道筋｜${NAME}`, description: '何から読めばいいかを順番にした道筋。ゼロから酪農を始める、牛を健康に飼う、ほか。', h1: '学びの道筋', lead: '読む順番をたどれます。', priority: '0.8' },
    { url: '/for-students', title: `酪農を志す人へ｜${NAME}`, description: '酪農をやってみたい人が最初に知りたいこと。資金、資格、非農家からの道、研修のこと。', h1: '酪農を志す人へ', lead: '', priority: '0.8' },
    { url: '/for-consumers', title: `牛乳を飲む人へ｜${NAME}`, description: '牛乳と酪農について、消費者からよく聞かれる質問に酪農家が答えます。', h1: '牛乳を飲む人へ', lead: '', priority: '0.8' },
    { url: '/about', title: `牧場について｜${NAME}`, description: '島根県出雲市・川上牧場について。研修生の受け入れ、酪農家・牧場向けの相談、講演や取材のご依頼。', h1: '牧場について', lead: '', priority: '0.7' },
  ]
  for (const f of fixed) {
    await write(f.url, render(template, {
      url: f.url, title: f.title, description: f.description,
      body: `<article><h1>${esc(f.h1)}</h1><p>${esc(f.lead || f.description)}</p></article>`,
      jsonLd: f.url === '/' ? { '@context': 'https://schema.org', '@type': 'WebSite', name: NAME, url: SITE } : null,
    }))
  }

  // 学びの道筋
  for (const p of paths) {
    await write(`/paths/${p.key}`, render(template, {
      url: `/paths/${p.key}`,
      title: `${p.title}｜学びの道筋｜${NAME}`,
      description: clip(p.lead, 110),
      body: `<article><h1>${esc(p.title)}</h1><p>${esc(p.lead)}</p></article>`,
    }))
  }

  // 個別の回
  let withBody = 0
  for (const ep of episodes) {
    let transcript = null
    if (ep.transcriptFile) {
      transcript = await fs.readFile(path.join(DATA, 'transcripts', ep.transcriptFile), 'utf8')
      withBody++
    }
    const description = clip(ep.summary || transcript || `${ep.date} の配信。${ep.title}`, 110)
    await write(`/e/${ep.id}`, render(template, {
      url: `/e/${ep.id}`,
      type: 'article',
      title: `${ep.title}｜${NAME}`,
      description,
      body: episodeBody(ep, transcript),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: ep.title,
        datePublished: ep.date,
        description,
        author: { '@type': 'Organization', name: '川上牧場' },
        publisher: { '@type': 'Organization', name: NAME },
        mainEntityOfPage: `${SITE}e/${ep.id}/`,
        isPartOf: { '@type': 'WebSite', name: NAME, url: SITE },
      },
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
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`,
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
