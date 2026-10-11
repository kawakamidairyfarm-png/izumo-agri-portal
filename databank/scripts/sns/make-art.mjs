// 毎日のSNS自動投稿: その日の質問に合わせた表紙の絵を、Gemini の画像生成で1枚作る（2026-10-11）
//
//   GEMINI_API_KEY=... node scripts/sns/make-art.mjs --id <質問の記号>
//
// - 作った絵は data/sns-art/<id>.jpg に残す（同じ質問の絵は二度作らない＝1問1回だけ料金がかかる）
// - 鍵が無い・失敗したときは何もしない。表紙は牧場の写真のまま（make-cards.mjs が写真に戻す）
// - 絵には文字・数字・ロゴを入れさせない（質問の文字はカードの側で載せる。絵の中の文字は崩れやすく、事実と違う数字が出るおそれがある）
// - 絵は「場面」だけ。答えの中身（数字や方法）は絵にしない（答えは配信の要約だけで伝える）
// モデルは GEMINI_IMAGE_MODEL で変えられる（既定 gemini-2.5-flash-image）
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const args = process.argv.slice(2)
const id = args.includes('--id') ? args[args.indexOf('--id') + 1] : null
const KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
const outDir = path.join(root, 'data', 'sns-art')
const out = path.join(outDir, `${id}.jpg`)

if (!id) throw new Error('--id が要ります')
if (fs.existsSync(out)) {
  console.log(`絵はもうあります: data/sns-art/${id}.jpg`)
  process.exit(0)
}
if (!KEY) {
  console.log('GEMINI_API_KEY が無いので絵は作りません（表紙は写真のまま）')
  process.exit(0)
}
const qa = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'qa.json'), 'utf8'))
const x = qa.find((y) => y.id === id)
if (!x) throw new Error(`質問が見つかりません: ${id}`)

const prompt = [
  'Create a warm, friendly editorial illustration for an Instagram post by a small family dairy farm in Izumo, Shimane, Japan.',
  `The post answers this question from a reader (Japanese): 「${x.q}」`,
  x.topics?.length ? `Related topics (Japanese): ${x.topics.slice(0, 4).join('、')}` : '',
  'Show one clear, simple scene that matches the question (for example cows, calves, milk, a milking parlor, hay, a barn, or a family at a dinner table, as fits the question).',
  'Depict a real Japanese dairy farm accurately: Holstein (black and white) cows unless the question names another breed, clean free-stall or tie-stall barn, rice-field countryside.',
  'Style: soft hand-made paper-cut and watercolor illustration, gentle depth, natural light, palette of deep moss green, warm cream and hay yellow, calm and trustworthy, not cartoonish.',
  'Wide composition with the main subject in the center and some quiet space at the top.',
  'Absolutely no text, letters, numbers, signs, labels, logos, watermarks or speech bubbles anywhere in the image.',
]
  .filter(Boolean)
  .join('\n')

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
  }),
})
const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.log(`絵を作れませんでした（${res.status} ${body.error?.message ?? ''}）。表紙は写真のまま`)
  process.exit(0)
}
const part = (body.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data)
if (!part) {
  console.log(`絵が返ってきませんでした（${body.candidates?.[0]?.finishReason ?? '理由不明'}）。表紙は写真のまま`)
  process.exit(0)
}

// 返ってきた絵（PNG で大きい）を、表紙の帯の大きさ 1080×620 の JPEG に縮めて残す
function loadPlaywright() {
  for (const dir of [process.env.PLAYWRIGHT_DIR, root].filter(Boolean)) {
    try {
      return createRequire(path.join(dir, 'noop.js'))('playwright')
    } catch {
      /* 次へ */
    }
  }
  return null
}
fs.mkdirSync(outDir, { recursive: true })
const pw = loadPlaywright()
const dataUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`
if (pw) {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1080, height: 620 } })
  await page.setContent(`<html><body style="margin:0"><div style="width:1080px;height:620px;background:url('${dataUrl}') center/cover"></div></body></html>`)
  await page.waitForTimeout(300)
  await page.screenshot({ path: out, type: 'jpeg', quality: 86 })
  await browser.close()
} else {
  fs.writeFileSync(out, Buffer.from(part.inlineData.data, 'base64'))
}
console.log(`絵を作りました: data/sns-art/${id}.jpg（${MODEL}）`)
