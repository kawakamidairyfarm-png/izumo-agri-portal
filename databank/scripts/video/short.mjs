#!/usr/bin/env node
/**
 * 配信の一番いい60〜90秒を、縦型（1080×1920）の短い動画にする。
 *
 *   node scripts/video/short.mjs --key 2025-12-01_school-milk-vs-store.txt --asr /tmp/asr.json \
 *        --audio /tmp/ep.mp3 --out /tmp/short [--from 477 --to 552] [--frames-only]
 *
 * 画面は3つだけ: 上に「届いた質問」のカード、真ん中に本人の顔、下に声に合わせて変わる字幕。
 * 字幕の時刻は音声認識（asr.py）から取る。文字は、全文があれば全文の文に置き換える
 * （認識の粗い文字を出さない）。切り出す範囲と質問文は clips/<key>.json に書く。
 */
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const HERE = path.dirname(fileURLToPath(import.meta.url))
const args = new Map()
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]
  if (a.startsWith('--')) args.set(a.slice(2), process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? '1' : process.argv[++i])
}
const need = (k) => {
  const v = args.get(k)
  if (!v) throw new Error(`--${k} が要ります`)
  return v
}
const KEY = need('key')
const OUT = path.resolve(need('out'))
const AUDIO = args.get('audio') ? path.resolve(args.get('audio')) : null
const FRAMES_ONLY = args.has('frames-only')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const require = createRequire(process.env.PLAYWRIGHT_DIR ? path.join(process.env.PLAYWRIGHT_DIR, 'package.json') : import.meta.url)
const { chromium } = require('playwright')
const { resolveEpisode } = await import('./episode.mjs')
const { esc, jp, splitLines, fixAsr } = await import('./text.mjs')

const W = 1080, H = 1920
const END = 2.5 // 締めのカード（音は無い）
const MAX_CAPTION = 26 // 字幕1つの上限（超えたら2つに割る）

/* ---------- 材料 ---------- */
const ep = await resolveEpisode(ROOT, KEY)
const stem = KEY.replace(/\.txt$/, '')
const clip = await fs.readFile(path.join(HERE, 'clips', `${stem}.json`), 'utf8').then(JSON.parse).catch(() => ({}))
const FROM = Number(args.get('from') ?? clip.from)
const TO = Number(args.get('to') ?? clip.to)
if (!Number.isFinite(FROM) || !Number.isFinite(TO) || TO <= FROM) throw new Error('--from/--to か clips/<key>.json の from/to が要ります')
if (TO - FROM > 95) console.warn(`⚠ ${Math.round(TO - FROM)} 秒は長い。ショートは 60〜90 秒が目安`)
const asr = JSON.parse(await fs.readFile(path.resolve(need('asr')), 'utf8'))
const portrait = await fs
  .readFile(path.join(ROOT, 'data', 'photos', 'about.jpg'))
  .then((b) => `data:image/jpeg;base64,${b.toString('base64')}`)
  .catch(() => '')
// 全文（あれば）。印を落として文に分ける＝字幕の文字をこちらに寄せる
const transcript = await fs.readFile(path.join(ROOT, 'data', 'transcripts', KEY), 'utf8').catch(() => '')
const sentences = transcript
  .split(/\n+/)
  .map((l) => l.replace(/^(##|>>|\?\?|!!|%%|--)\s*/, '').replace(/^[^｜]{1,12}｜/, '').trim())
  .filter(Boolean)
  .flatMap((l) => l.split(/(?<=[。！？])/))
  .map((s) => s.trim())
  .filter((s) => s.length >= 4)

const norm = (t) => String(t).normalize('NFKC').replace(/[\s、。！？?!「」『』（）()]/g, '')
const grams = (s) => {
  const n = norm(s), o = new Set()
  for (let i = 0; i < n.length - 1; i++) o.add(n.slice(i, i + 2))
  return o
}
const sim = (a, b) => {
  const A = grams(a), B = grams(b)
  let c = 0
  for (const x of A) if (B.has(x)) c++
  return (2 * c) / (A.size + B.size || 1)
}

/* ---------- 字幕（時刻は認識から、文字はできるだけ全文から） ---------- */
let caps = []
if (Array.isArray(clip.captions) && clip.captions.length) {
  caps = clip.captions.map((c) => ({ start: Number(c.start), end: Number(c.end), text: String(c.text) }))
} else {
  let cursor = 0
  for (const s of asr.segments ?? []) {
    if (s.end <= FROM || s.start >= TO) continue
    let text = fixAsr(s.text)
    if (sentences.length) {
      // 全文の中で一番近い文（順番を守って探す）
      let best = { i: -1, v: 0 }
      for (let i = Math.max(0, cursor - 2); i < Math.min(sentences.length, cursor + 40); i++) {
        const v = sim(text, sentences[i])
        if (v > best.v) best = { i, v }
      }
      if (best.v >= 0.45) {
        text = sentences[best.i]
        cursor = best.i + 1
      }
    }
    caps.push({ start: Math.max(FROM, s.start), end: Math.min(TO, s.end), text })
  }
}
// 長い字幕は、折ってよいところで割っていく（時刻は字数で按分）。短すぎる字幕は次にくっつける
const splitCap = (c) => {
  if (c.text.length <= MAX_CAPTION) return [c]
  const [a, b] = splitLines(c.text, Math.ceil(c.text.length / 2) + 2)
  if (!b) return [c]
  const mid = c.start + (c.end - c.start) * (a.length / (a.length + b.length))
  return [...splitCap({ start: c.start, end: mid, text: a }), ...splitCap({ start: mid, end: c.end, text: b })]
}
caps = caps.flatMap(splitCap)
const merged = []
for (const c of caps) {
  const last = merged[merged.length - 1]
  if (last && (last.text.length <= 4 || last.end - last.start < 1.0) && (last.text + c.text).length <= MAX_CAPTION) {
    last.text = `${last.text}${c.text}`
    last.end = c.end
  } else merged.push({ ...c })
}
caps = merged.filter((c) => c.text.replace(/[はいうんえ。、]/g, '').length > 0) // 「はい。」だけの字幕は出さない
// 字幕は次の字幕が出るまで残す（音の切れ目で消えない）。最初の字幕が遅いときは、それまで質問だけ
const frames = []
if (!caps.length || caps[0].start > FROM + 0.4) frames.push({ t: FROM, text: '' })
caps.forEach((c) => frames.push({ t: c.start, text: c.text }))
for (let i = 0; i < frames.length; i++) frames[i].dur = (i + 1 < frames.length ? frames[i + 1].t : TO) - frames[i].t
const live = frames.filter((f) => f.dur > 0.05)
live.push({ t: TO, dur: END, text: '', end: true })

/* ---------- 絵 ---------- */
const fmtDate = (iso) => {
  const [y, mo, d] = String(iso).split('-')
  return y ? `${y}年${Number(mo)}月${Number(d)}日` : ''
}
// 強調する語（clip.hit）を金色に。折り返しの規則（jp）を通したうえで、語の両側だけを組む
const HIT = clip.hit ? String(clip.hit) : ''
const mark = (t) => {
  const text = String(t ?? '')
  if (!HIT || !text.includes(HIT)) return jp(text)
  const i = text.indexOf(HIT)
  return `${jp(text.slice(0, i))}<em>${esc(HIT)}</em>${jp(text.slice(i + HIT.length))}`
}
const capHtml = (text) => {
  const lines = splitLines(text, 13)
  const longest = Math.max(...lines.map((l) => l.length))
  const fs = Math.min(70, Math.floor(920 / Math.max(6, longest)))
  return lines.map((l) => `<div class="cl" style="font-size:${fs}px"><i class="o">${mark(l)}</i><i class="t">${mark(l)}</i></div>`).join('')
}
const stroke = (px, c) =>
  Array.from({ length: 16 }, (_, i) => {
    const r = (i * Math.PI) / 8
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${c}`
  }).join(',')
const INK = '#08122a'
const css = `
${process.env.FONT_CSS ? await fs.readFile(process.env.FONT_CSS, 'utf8') : ''}
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;color:#fff;
  font-family:"Zen Kaku Gothic New","Noto Sans JP","Noto Sans CJK JP",sans-serif;font-weight:700;-webkit-font-smoothing:antialiased}
.s{position:absolute;inset:0;background:linear-gradient(170deg,#22407c 0%,#0e1d3f 55%,#0b1730 100%)}
.brand{position:absolute;left:64px;right:64px;top:170px;display:flex;align-items:center;gap:18px;font-size:34px;color:#c6d6f2;letter-spacing:.06em}
.brand i{width:16px;height:16px;border-radius:50%;background:#ffd11a}
.prog{position:absolute;left:64px;right:64px;top:236px;height:8px;background:#2a4372;border-radius:99px;overflow:hidden}
.prog b{display:block;height:100%;background:#ffd11a;border-radius:99px}
.qc{position:absolute;left:64px;right:64px;top:300px;background:rgba(255,255,255,.07);border:3px solid #2f4d86;border-radius:28px;padding:36px 40px 40px}
.qc .tag{display:inline-block;background:#ffd11a;color:#132349;font-size:30px;font-weight:900;letter-spacing:.12em;padding:8px 20px;border-radius:8px}
.qc .who{font-size:28px;color:#c6d6f2;margin-top:18px;letter-spacing:.02em}
.qc .q{font-size:54px;font-weight:900;line-height:1.36;margin-top:18px;text-wrap:balance}
.face{position:absolute;left:50%;top:790px;transform:translateX(-50%);width:300px;height:300px;border-radius:50%;overflow:hidden;border:8px solid #ffd11a;box-shadow:0 18px 50px rgba(0,0,0,.45)}
.face img{position:absolute;width:1125px;left:-623px;top:-294px;max-width:none}
.cap{position:absolute;left:48px;right:48px;top:1170px;display:flex;flex-direction:column;align-items:center;gap:10px}
.cl{position:relative;display:inline-block;font-size:70px;font-weight:900;line-height:1.25;letter-spacing:-.01em;
  background:rgba(8,18,42,.86);padding:6px 26px;border-radius:14px}
.cl i{font-style:normal;display:block;white-space:nowrap}
.cl i .w{display:inline}
.cl .o{position:absolute;left:26px;top:6px;color:${INK};text-shadow:${stroke(5, INK)}}
.cl .t{position:relative;color:#fff}
.cl em{font-style:normal;color:#ffd11a}
.cl .o em{color:${INK}}
.w{display:inline-block}
.foot{position:absolute;left:64px;right:64px;top:1520px;font-size:30px;color:#9fb5d8;letter-spacing:.04em}
/* 締め */
.end .pt{position:absolute;left:64px;right:64px;top:800px;text-align:center}
.end .pt .k{display:inline-block;background:#ffd11a;color:#132349;font-size:30px;font-weight:900;letter-spacing:.14em;padding:8px 22px;border-radius:8px}
.end .pt .p{font-size:58px;font-weight:900;line-height:1.36;margin-top:26px;text-wrap:balance}
.end .pt .p em{font-style:normal;color:#ffd11a}
.end .url{position:absolute;left:64px;right:64px;top:1240px;text-align:center;font-size:34px;color:#c6d6f2;line-height:1.7}
.end .url b{display:block;color:#fff;font-size:46px;margin:6px 0}
`
const qCard = `<div class="qc"><span class="tag">届いた質問</span>${clip.who ? `<div class="who">${esc(clip.who)}</div>` : ''}<div class="q">${jp(clip.q ?? ep.title)}</div></div>`
const brand = `<div class="brand"><i></i>川上牧場 酪農データバンク</div>`
function frame(f, prog) {
  if (f.end) {
    return `<div class="s end">${brand}<div class="prog"><b style="width:100%"></b></div>
      ${portrait ? `<div class="face" style="top:420px"><img src="${portrait}" alt=""></div>` : ''}
      <div class="pt"><span class="k">この回の答え</span><div class="p">${mark(clip.point ?? ep.title)}</div></div>
      <div class="url">全編と全文は<b>川上牧場 酪農データバンク</b>プロフィールのリンクから<br>${fmtDate(ep.date)}の配信</div></div>`
  }
  return `<div class="s">${brand}<div class="prog"><b style="width:${(prog * 100).toFixed(1)}%"></b></div>${qCard}
    ${portrait ? `<div class="face"><img src="${portrait}" alt=""></div>` : ''}
    <div class="cap">${f.text ? capHtml(f.text) : ''}</div>
    <div class="foot">${fmtDate(ep.date)}の配信より</div></div>`
}

/* ---------- 焼く ---------- */
await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const files = []
const HEAD = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700;900&display=block"><style>${css}</style></head>`
for (let i = 0; i < live.length; i++) {
  const f = live[i]
  await page.setContent(`${HEAD}<body>${frame(f, Math.min(1, (f.t - FROM) / (TO - FROM)))}</body></html>`, { waitUntil: i === 0 ? 'networkidle' : 'load' })
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(OUT, `s-${String(i).padStart(3, '0')}.png`)
  await page.screenshot({ path: file })
  files.push(file)
}
// 表紙＝字幕が最初に出た画面
const coverIdx = Math.max(0, live.findIndex((f) => f.text))
await fs.copyFile(files[coverIdx], path.join(OUT, 'cover.png'))
await browser.close()

const list = files.map((f, i) => `file '${f}'\nduration ${live[i].dur.toFixed(3)}`).join('\n') + `\nfile '${files[files.length - 1]}'\n`
await fs.writeFile(path.join(OUT, 'list.txt'), list)
// 字幕ファイル（YouTube に付けるとき用）
const srt = (t) => {
  const x = Math.max(0, t)
  const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = Math.floor(x % 60), ms = Math.round((x % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}
await fs.writeFile(
  path.join(OUT, 'captions.srt'),
  caps.map((c, i) => `${i + 1}\n${srt(c.start - FROM)} --> ${srt(c.end - FROM)}\n${c.text}\n`).join('\n'),
)
const SITE = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'
await fs.writeFile(
  path.join(OUT, 'post.txt'),
  [
    clip.q ? `${clip.q.replace(/[。]$/, '')}` : ep.title,
    '',
    `${fmtDate(ep.date)}の配信より。${clip.point ?? ''}`,
    '',
    `全編と全文　${SITE}e/${ep.id}/`,
    ...(ep.notePaid && ep.noteUrl ? [`もっと詳しく（noteの記事${ep.notePrice ? `・${ep.notePrice.toLocaleString()}円` : ''}）　${ep.noteUrl}`] : []),
    '',
    '#酪農 #牛乳 #川上牧場 #出雲 #酪農家 #Shorts',
  ].join('\n'),
)
const total = live.reduce((a, b) => a + b.dur, 0)
console.log(`字幕 ${caps.length} 本・画面 ${files.length} 枚・${total.toFixed(1)} 秒（元の音声 ${FROM}〜${TO} 秒）・全文との突き合わせ: ${sentences.length ? 'あり' : 'なし（認識の文字を直して使う）'}`)
for (const c of caps) console.log(`  ${(c.start - FROM).toFixed(1).padStart(5)}s  ${c.text}`)
if (FRAMES_ONLY) process.exit(0)

const out = path.join(OUT, `${stem}_short.mp4`)
const span = TO - FROM
const af = `afade=t=in:st=0:d=0.3,afade=t=out:st=${Math.max(0, span - 1.2).toFixed(3)}:d=1.2,apad`
const aArgs = AUDIO ? ['-ss', String(FROM), '-to', String(TO), '-i', AUDIO, '-af', af] : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo']
execFileSync(
  FFMPEG,
  ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'list.txt'), ...aArgs,
    '-c:v', 'libx264', '-r', '30', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '21', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
    '-t', total.toFixed(3), out],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)
console.log(`書き出し: ${out}`)
