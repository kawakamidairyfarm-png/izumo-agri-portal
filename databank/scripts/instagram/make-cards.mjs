// Instagram の「今日の質問と答え」カードを作る（2026-09-27）。
//
//   node scripts/instagram/make-cards.mjs --latest 5      新しい質問から5問
//   node scripts/instagram/make-cards.mjs --id 7c4dd6b9   住所（/q/<id>）を指定
//
// 先に npm run build を済ませておく（dist/qa.json を読む）。
// 出力: instagram/out/<配信日>_<id>/ に 1.png（質問）・2.png（答え）・3.png（案内）・caption.txt（投稿文）。
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
else picks = qa.filter((x) => x.a && /川上さん|酪農家/.test(x.a.slice(0, 160))).slice(0, Number(opt('--latest') ?? 5))
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
for (const x of picks) {
  const dir = path.join(root, 'instagram', 'out', `${x.episode.date}_${x.id}`)
  fs.mkdirSync(dir, { recursive: true })
  const data = { q: x.q, a: shorten(x.a), date: fmt(x.episode.date), title: x.episode.title }
  for (const slide of [1, 2, 3]) {
    // 型紙は読み込み時に1回だけ描くので、1枚ごとに問い合わせ文字列を変えて読み込み直す（#だけ変えると描き直されない）
    await page.goto(`${tpl}?n=${x.id}-${slide}#${encodeURIComponent(JSON.stringify({ ...data, slide }))}`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(dir, `${slide}.png`) })
  }
  fs.writeFileSync(path.join(dir, 'caption.txt'), caption(x) + '\n', 'utf8')
  console.log('作成:', path.relative(root, dir), x.q.slice(0, 30))
}
await browser.close()
