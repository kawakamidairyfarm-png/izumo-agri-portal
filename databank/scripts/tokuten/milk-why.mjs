// メルマガ登録特典（飲む人向け）『牛乳の「なぜ？」10の答え』のPDFを作る（2026-09-27）。
//
//   node scripts/tokuten/milk-why.mjs        → databank/tokuten-out/milk-why-10.pdf
//
// 中身は編集済みの記事（data/articles/*.json）の質問と答え・読むときの注意を、そのまま並べたもの。
// ここで新しい答えや数字は作らない。質問を選び直すときは PICKS だけを変える。
// PDF はサイトに置かない（登録した人だけに届く特典のため）。配布はメルマガの登録フォームから。
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const SITE = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'

/** [記事の id, 質問の番号] 。並びは読む順（値段 → 味と給食 → 中身と表示 → 牛 → 命） */
const PICKS = [
  ['2025-11-12_cost-of-one-liter', 0],
  ['2025-11-12_cost-of-one-liter', 1],
  ['2025-11-13_why-butter-price-rises', 0],
  ['2025-12-01_school-milk-vs-store', 0],
  ['2025-12-01_school-milk-vs-store', 2],
  ['2026-02-27_why-milk-is-white', 0],
  ['2026-03-26_raw-milk-vs-processed', 0],
  ['2026-03-26_raw-milk-vs-processed', 3],
  ['2026-04-06_do-cows-always-give-milk', 0],
  ['2026-02-17_male-calves', 0],
]
const CLOSING = ['2026-03-21_support-beyond-buying', 0]

function qaId(q) {
  let h = 0x811c9dc5
  for (let i = 0; i < q.length; i++) {
    h ^= q.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}
const art = (id) => JSON.parse(fs.readFileSync(path.join(root, 'data', 'articles', `${id}.json`), 'utf8'))
const fmt = (d) => {
  const [y, m, dd] = d.split('-').map(Number)
  return `${y}年${m}月${dd}日`
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const item = ([id, i]) => {
  const a = art(id)
  const p = a.qa[i]
  if (!p) throw new Error(`質問が無い: ${id} ${i}`)
  return { q: p.q, a: p.a, caveat: a.caveats, date: a.date, title: a.title, url: `${SITE}q/${qaId(p.q)}/?utm_source=pdf` }
}
const items = PICKS.map(item)
const closing = item(CLOSING)

const img = (f) => `data:image/${f.endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(path.join(here, f)).toString('base64')}`
const qa = (x, n) => `<section class="qa">
  <p class="num">${n}</p>
  <h2>${esc(x.q)}</h2>
  <p class="lab">配信で答えたこと（要約）</p>
  <p class="ans">${esc(x.a)}</p>
  <p class="cav"><b>読むときの注意</b>　${esc(x.caveat)}</p>
  <p class="src">${fmt(x.date)}の配信「${esc(x.title)}」より<br><a href="${x.url}">続きと配信の全文を読む</a></p>
</section>`

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Serif+JP:wght@700;900&display=swap" rel="stylesheet">
<style>
@page{size:A5;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:"Noto Sans JP",sans-serif;color:#172a19;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:148mm;height:210mm;padding:14mm 13mm;position:relative;page-break-after:always;overflow:hidden}
.cover{background:#172a19;color:#fdfbf6;padding:0}
.cover .photo{height:92mm;background:url(${img('jersey.jpg')}) 60% 45%/cover}
.cover .body{padding:9mm 13mm}
.cover .kicker{color:#f2cf7a;font-weight:700;font-size:10pt}
.cover h1{font-family:"Noto Serif JP",serif;font-size:26pt;line-height:1.3;margin:4mm 0 0}
.cover .sub{margin-top:5mm;font-size:10.5pt;line-height:1.8}
.cover .by{position:absolute;left:13mm;right:13mm;bottom:11mm;display:flex;align-items:center;justify-content:space-between;font-size:9pt;color:#f2cf7a;font-weight:700}
.cover .by img{height:13mm;background:#fdfbf6;border-radius:2mm;padding:1mm 2mm}
h3{font-family:"Noto Serif JP",serif;font-size:15pt;margin:0 0 5mm}
.intro p{font-size:10pt;line-height:1.9;margin:0 0 3.5mm}
.toc{margin-top:6mm;padding:0;list-style:none;counter-reset:t}
.toc li{font-size:9.5pt;line-height:1.6;padding:1.6mm 0;border-bottom:.3mm solid #efe6d2;display:flex;gap:3mm}
.toc li b{color:#2f5232;min-width:6mm}
.qa{padding:0}
.qa .num{font-family:"Noto Serif JP",serif;font-size:30pt;color:#d9a437;margin:0;line-height:1}
.qa h2{font-family:"Noto Serif JP",serif;font-size:15pt;line-height:1.55;margin:3mm 0 5mm}
.qa .lab{font-size:8.5pt;font-weight:700;color:#2f5232;margin:0 0 1.5mm}
.qa .ans{font-size:10.5pt;line-height:1.95;margin:0}
.qa .cav{margin-top:6mm;padding:3mm 3.5mm;background:#fbeecd;border-radius:2mm;font-size:8.5pt;line-height:1.7}
.qa .src{margin-top:5mm;font-size:8pt;line-height:1.7;color:#5f665a}
.qa a{color:#2f5232;font-weight:700}
.foot{position:absolute;left:13mm;right:13mm;bottom:8mm;font-size:7.5pt;color:#8a8f84;display:flex;justify-content:space-between}
.end{background:#fdfbf6}
.end .box{margin-top:5mm;padding:4mm;border:.3mm solid #efe6d2;border-radius:2mm;background:#fff}
.end .box b{display:block;font-size:10pt;margin-bottom:1mm}
.end .box p{margin:0;font-size:9pt;line-height:1.8}
.end a{color:#2f5232;font-weight:700;word-break:break-all}
</style></head><body>
<div class="page cover"><div class="photo"></div><div class="body">
  <p class="kicker">川上牧場のメルマガ 登録特典</p>
  <h1>牛乳の「なぜ？」<br>10の答え</h1>
  <p class="sub">スーパーで、給食で、ふと浮かんだ疑問に、<br>島根県出雲市の酪農家が毎朝の配信で答えた記録から。</p>
</div><div class="by"><img src="${img('logo.png')}" alt=""><span>川上哲也（川上牧場）</span></div></div>

<div class="page intro"><h3>はじめに</h3>
<p>牧場には毎日のように「なぜ？」が届きます。牛乳の値段、味の違い、パックの表示、牛の暮らし。</p>
<p>ここに集めた10の質問は、実際に届いたものです。答えは、毎朝の音声配信で話したことを要約しました。</p>
<p>数字や制度は、配信した時点のものです。それぞれに「読むときの注意」を付けています。</p>
<ol class="toc">${items.map((x, i) => `<li><b>${i + 1}</b><span>${esc(x.q)}</span></li>`).join('')}</ol>
<div class="foot"><span>牛乳の「なぜ？」10の答え</span><span>川上牧場 酪農データバンク</span></div></div>

${items.map((x, i) => `<div class="page">${qa(x, i + 1)}<div class="foot"><span>牛乳の「なぜ？」10の答え</span><span>${i + 1} / 10</span></div></div>`).join('')}

<div class="page end"><h3>おわりに：牛乳を買う以外の応援</h3>
<p class="lab" style="font-size:8.5pt;font-weight:700;color:#2f5232;margin:0 0 1.5mm">届いた質問「${esc(closing.q)}」</p>
<p style="font-size:10pt;line-height:1.9;margin:0">${esc(closing.a)}</p>
<div class="box"><b>あなたの「なぜ？」も送ってください</b><p>公式LINEから送れます。毎朝の配信で答えることがあります。<br><a href="https://line.me/R/ti/p/@imb8734o">https://line.me/R/ti/p/@imb8734o</a></p></div>
<div class="box"><b>ほかの答えも読む</b><p>配信の記録を、登録なし・無料で読めます。<br><a href="${SITE}?utm_source=pdf">川上牧場 酪農データバンク</a></p></div>
<div class="box"><b>もっと深く</b><p>noteのメンバーシップでは、牧場の数字や限定記事まで読めます。<br><a href="https://note.com/kawakamifarm/membership/info">note.com/kawakamifarm/membership</a></p></div>
<div class="foot"><span>内容は配信時点の川上牧場の経験と意見です。</span><span>2026年9月版</span></div></div>
</body></html>`

function loadPlaywright() {
  for (const dir of [process.env.PLAYWRIGHT_DIR, root, '/root/.claude/skills/kintsugi'].filter(Boolean)) {
    try {
      return createRequire(path.join(dir, 'noop.js'))('playwright')
    } catch {
      /* 次へ */
    }
  }
  throw new Error('playwright が見つかりません')
}
const outDir = path.join(root, 'tokuten-out')
fs.mkdirSync(outDir, { recursive: true })
const htmlPath = path.join(outDir, 'milk-why-10.html')
fs.writeFileSync(htmlPath, html, 'utf8')
const { chromium } = loadPlaywright()
const b = await chromium.launch()
const p = await b.newPage()
await p.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.pdf({ path: path.join(outDir, 'milk-why-10.pdf'), format: 'A5', printBackground: true, preferCSSPageSize: true })
await b.close()
console.log('作成:', path.relative(root, path.join(outDir, 'milk-why-10.pdf')), `（${items.length}問＋はじめに・おわりに）`)
