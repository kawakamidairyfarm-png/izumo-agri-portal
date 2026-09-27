// Instagram の「今日の質問と答え」カードを作る（2026-09-27）。
//
//   node scripts/instagram/make-cards.mjs --latest 5      新しい質問から5問
//   node scripts/instagram/make-cards.mjs --id 7c4dd6b9   住所（/q/<id>）を指定
//
// 先に npm run build を済ませておく（dist/qa.json を読む）。
// 出力: instagram/out/<配信日>_<id>/ に 1.png（質問）・2.png（答え）・3.png（案内）・caption.txt（投稿文）。
//
//   node scripts/instagram/make-cards.mjs --latest 7 --site dist/instagram
//     公開用（pages.yml が毎回実行）。dist/instagram/<id>/ に画像と投稿文、
//     dist/instagram/index.html（スマホで保存しやすい一覧）と cards.json（毎日のSNSルーティンが読む）を書く。
// 答えは配信の記事の要約をそのまま短くしたもの。ここで新しい答えや数字は作らない。
// Playwright が要る。見つからなければ PLAYWRIGHT_DIR に node_modules の場所を渡す。
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const SITE = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_DIR, root, '/root/.claude/skills/kintsugi'].filter(Boolean)
  for (const dir of tries) {
    try {
      return createRequire(path.join(dir, 'noop.js'))('playwright')
    } catch {
      /* 次へ */
    }
  }
  throw new Error('playwright が見つかりません。PLAYWRIGHT_DIR=<node_modules のある場所> を付けて実行してください')
}

const args = process.argv.slice(2)
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null)
const qa = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'qa.json'), 'utf8'))
let picks
if (opt('--id')) picks = qa.filter((x) => x.id === opt('--id'))
// 答えの要約に川上さんの答えがはっきり入っているものだけ（空・前置きだけ・質問の続きは外す）
// 質問の形の文だけ（感想やコメントは外す）
else
  picks = qa
    .filter((x) => x.a && /川上さん|酪農家/.test(x.a.slice(0, 160)) && /[？?]|ですか|ますか|でしょうか/.test(x.q))
    .slice(0, Number(opt('--latest') ?? 5))
if (!picks.length) throw new Error('該当する質問がありません')

/** 答えを、カード1枚に収まる長さ（全体でおよそ140字）まで、文の切れ目で短くする */
function shorten(a) {
  const sentences = String(a || '').replace(/\s+/g, ' ').match(/[^。！？]+[。！？]?/g) ?? []
  const out = []
  let n = 0
  for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
    if (n + s.length > 140 && out.length) break
    out.push(s)
    n += s.length
  }
  // 2〜3文ずつの段落に
  const paras = []
  for (let i = 0; i < out.length; i += 2) paras.push(out.slice(i, i + 2).join(''))
  return paras.length ? paras : ['この回の配信で答えています。']
}
const fmt = (d) => {
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}年${m}月${dd}日`
}

const TAGS = ['#酪農', '#牛乳', '#酪農家', '#川上牧場', '#島根県', '#出雲市', '#牛乳のなぜ']
function caption(x) {
  const first = shorten(x.a)[0]
  const url = `${SITE}q/${x.id}/?utm_source=instagram`
  return [
    `牧場に届いた質問です。`,
    ``,
    `「${x.q}」`,
    ``,
    first,
    ``,
    `答えの続きと、${fmt(x.episode.date)}の配信「${x.episode.title}」の全文は、プロフィールのリンクから「川上牧場 データバンク」へ。`,
    ``,
    `牛乳や牛のことで「なぜ？」と思ったら、LINEで質問を送ってください。毎朝の配信で答えています。`,
    `あなたの質問が、誰かの牛乳をもっとおいしくする。`,
    ``,
    TAGS.concat(x.topics.slice(0, 2).map((t) => '#' + t.replace(/[・、\s]/g, ''))).join(' '),
    ``,
    `（ストーリーズのリンクに使うとき: ${url}）`,
  ].join('\n')
}

const { chromium } = loadPlaywright()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
const tpl = pathToFileURL(path.join(here, 'card.html')).href
const siteDir = opt('--site') ? path.resolve(root, opt('--site')) : null
const made = []
for (const x of picks) {
  const dir = siteDir ? path.join(siteDir, x.id) : path.join(root, 'instagram', 'out', `${x.episode.date}_${x.id}`)
  fs.mkdirSync(dir, { recursive: true })
  const data = { q: x.q, a: shorten(x.a), date: fmt(x.episode.date), title: x.episode.title }
  for (const slide of [1, 2, 3]) {
    // 型紙は読み込み時に1回だけ描くので、1枚ごとに問い合わせ文字列を変えて読み込み直す（#だけ変えると描き直されない）
    await page.goto(`${tpl}?n=${x.id}-${slide}#${encodeURIComponent(JSON.stringify({ ...data, slide }))}`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(dir, `${slide}.png`) })
  }
  const cap = caption(x)
  fs.writeFileSync(path.join(dir, 'caption.txt'), cap + '\n', 'utf8')
  made.push({ id: x.id, date: x.episode.date, q: x.q, episode: x.episode.title, caption: cap })
  console.log('作成:', path.relative(root, dir), x.q.slice(0, 30))
}
await browser.close()

if (siteDir) {
  const base = `${SITE}instagram/`
  const cards = made.map((m) => ({
    ...m,
    images: [1, 2, 3].map((n) => `${base}${m.id}/${n}.png`),
    captionUrl: `${base}${m.id}/caption.txt`,
    page: `${SITE}q/${m.id}/`,
  }))
  fs.writeFileSync(path.join(siteDir, 'cards.json'), JSON.stringify({ updated: new Date().toISOString(), cards }, null, 1) + '\n', 'utf8')
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Instagram 質問カード｜川上牧場 酪農データバンク</title>
<style>body{margin:0;background:#fdfbf6;color:#172a19;font-family:system-ui,"Noto Sans JP",sans-serif}main{max-width:720px;margin:0 auto;padding:20px 16px 60px}
h1{font-size:22px;margin:8px 0}p.lead{font-size:14px;color:#3c4435;line-height:1.7}section{margin-top:28px;padding:16px;background:#fff;border:1px solid #efe6d2;border-radius:16px}
h2{font-size:16px;line-height:1.5;margin:0}small{color:#5f665a}.imgs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.imgs img{width:100%;border-radius:8px;display:block}
.imgs a{font-size:12px;color:#2f5232;display:block;text-align:center;margin-top:4px}textarea{width:100%;box-sizing:border-box;height:220px;margin-top:12px;font:14px/1.6 inherit;border:1px solid #efe6d2;border-radius:8px;padding:8px}
button{margin-top:8px;padding:10px 16px;border:0;border-radius:10px;background:#2f5232;color:#fff;font-weight:700;font-size:14px}</style></head><body><main>
<h1>Instagram 質問カード</h1><p class="lead">新しい質問から順に並んでいます。画像は長押しで保存できます。投稿文は「コピー」で写せます。このページは検索に出ません。</p>
${cards
  .map(
    (c) => `<section id="${c.id}"><small>${esc(c.date)} の配信 ・ 記号 ${c.id}</small><h2>「${esc(c.q)}」</h2>
<div class="imgs">${c.images.map((u, i) => `<div><img src="${u}" alt="${i + 1}枚目" loading="lazy"><a href="${u}" download>${i + 1}枚目を保存</a></div>`).join('')}</div>
<textarea readonly>${esc(c.caption)}</textarea><button type="button" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);this.textContent='コピーしました'">投稿文をコピー</button></section>`,
  )
  .join('')}
</main></body></html>`
  fs.writeFileSync(path.join(siteDir, 'index.html'), html, 'utf8')
  console.log('公開用の一覧:', path.relative(root, path.join(siteDir, 'index.html')), cards.length, '組')
}
