#!/usr/bin/env node
/**
 * 配信1回分を「音声＋章立てスライド」の動画にする（学習教材の試作）。
 *
 *   node scripts/video/make.mjs --key 2026-09-16_x5564f57.txt --out out/ \
 *        [--audio ep.mp3] [--chapters 427,499,581] [--duration 1234] [--size 1920x1080] [--preview 4]
 *
 * 材料はすべて手元にあるもの: data/transcripts の全文（pody の章立て・用語・まとめの印つき）と、
 * pody の章ごとの再生位置（秒）。音声は配信そのもの（本人の声）。話し手を増やさない。
 *
 * --chapters  各章の開始秒（pody の timestamp-link data-seconds を順に）。先頭の章より前は表紙
 * --duration  音声の長さ（秒）。省略時は ffprobe で測る
 * --preview N 音声なしの試写。全スライドを N 秒ずつ・無音で出す
 * 環境変数: FFMPEG（既定 ffmpeg）、PLAYWRIGHT_DIR（playwright を置いた node_modules の親）、FONT_CSS（@font-face の追加CSS）
 */
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
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
const CHAPTERS = (args.get('chapters') ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
const PREVIEW = args.has('preview') ? Number(args.get('preview')) || 4 : 0
const [W, H] = (args.get('size') ?? '1920x1080').split('x').map(Number)
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const require = createRequire(process.env.PLAYWRIGHT_DIR ? path.join(process.env.PLAYWRIGHT_DIR, 'package.json') : import.meta.url)
const { chromium } = require('playwright')

/* ---------- 全文を章に分ける（印は src/lib/transcript.ts と同じ） ---------- */
const episodes = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'episodes.json'), 'utf8'))
const m = /^(\d{4}-\d{2}-\d{2})_([0-9a-z]{8})/.exec(KEY)
const ep = episodes.find((e) => e.date === m?.[1] && e.driveId.startsWith(m?.[2] ?? '\0'))
const text = await fs.readFile(path.join(ROOT, 'data', 'transcripts', KEY), 'utf8')
const title = ep?.title ?? KEY
const date = ep?.date ?? m?.[1] ?? ''
// 回のID（サイトの住所）は索引に無いので、サイト側（src/lib/data.ts）と同じ規則で組む
const epId = ep ? `${ep.date}_${ep.driveId.slice(0, 8)}` : KEY.replace(/\.txt$/, '')

const chapters = [] // {heading, lead, terms:[{term,text}], insight, points:[]}
let cur = null
for (const raw of text.split(/\n+/)) {
  const l = raw.trim()
  if (!l) continue
  if (l.startsWith('## ')) {
    cur = { heading: l.slice(3).trim(), lead: '', terms: [], insight: '', points: [] }
    chapters.push(cur)
    continue
  }
  if (!cur) continue
  const [, mark, rest] = /^(>>|\?\?|!!|%%|--)\s+([\s\S]*)$/.exec(l) ?? []
  const body = (s) => (s.includes('｜') ? s.slice(s.indexOf('｜') + 1) : s).trim()
  if (mark === '%%') cur.terms.push({ term: rest.includes('｜') ? rest.slice(0, rest.indexOf('｜')).trim() : '', text: body(rest) })
  else if (mark === '!!') cur.insight ||= body(rest)
  else if (mark === '--') cur.points.push(rest.trim())
  else if (mark === '>>' || !mark) cur.lead ||= mark ? body(rest) : l
}
const summary = chapters.find((c) => /^まとめ/.test(c.heading))
const body = chapters.filter((c) => c !== summary)

/* ---------- スライドの HTML ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fmtDate = (iso) => {
  const [y, mo, d] = iso.split('-')
  return y ? `${y}年${Number(mo)}月${Number(d)}日` : ''
}
/** 文の切れ目で 2 文・120 字までに切る */
const clipLead = (s, max = 120) => {
  const out = []
  let n = 0
  for (const part of s.split(/(?<=[。！？])/)) {
    if (!part) continue
    if (out.length >= 2 || n + part.length > max) break
    out.push(part)
    n += part.length
  }
  return out.join('') || s.slice(0, max)
}
const fontCss = process.env.FONT_CSS ? await fs.readFile(process.env.FONT_CSS, 'utf8') : ''
const css = `
${fontCss}
:root{--moss9:#172a19;--moss7:#2f5232;--moss5:#4f7d52;--moss1:#eef4ee;--hay3:#f2cf7a;--hay1:#fbeecd;--hay7:#7f5a12;--cream1:#f8f3e8;--cream2:#efe6d2;--ink7:#3c4435;--ink5:#5f665a}
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--cream1);color:var(--moss9);font-family:"Noto Sans JP","Noto Sans CJK JP","IPAPGothic",sans-serif}
.serif{font-family:"Noto Serif JP","Noto Serif CJK JP","IPAPMincho",serif}
.slide{position:absolute;inset:0;padding:${H * 0.09}px ${W * 0.07}px;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;align-items:baseline;font-size:${H * 0.028}px;font-weight:700;color:var(--moss7);letter-spacing:.12em}
.top .n{color:var(--ink5);font-weight:500;letter-spacing:0}
h1{font-size:${H * 0.075}px;line-height:1.35;margin-top:${H * 0.05}px;text-wrap:balance}
h2{font-size:${H * 0.062}px;line-height:1.35;margin-top:${H * 0.045}px;text-wrap:balance}
.lead{font-size:${H * 0.036}px;line-height:1.7;color:var(--ink7);margin-top:${H * 0.04}px;max-width:${W * 0.78}px}
.cards{display:flex;gap:${W * 0.02}px;margin-top:${H * 0.045}px}
.card{flex:1;background:#fff;border:2px solid var(--cream2);border-radius:${H * 0.03}px;padding:${H * 0.03}px ${W * 0.022}px}
.card b{display:block;font-size:${H * 0.036}px}
.card p{font-size:${H * 0.028}px;line-height:1.6;color:var(--ink7);margin-top:${H * 0.012}px}
.insight{margin-top:${H * 0.045}px;background:var(--hay1);border-left:${W * 0.006}px solid var(--hay3);border-radius:${H * 0.02}px;padding:${H * 0.03}px ${W * 0.025}px;font-size:${H * 0.038}px;line-height:1.6;font-weight:700}
.insight small{display:block;font-size:${H * 0.026}px;color:var(--hay7);margin-top:${H * 0.01}px;font-weight:700}
ul{list-style:none;margin-top:${H * 0.04}px;display:flex;flex-direction:column;gap:${H * 0.022}px}
li{font-size:${H * 0.04}px;line-height:1.55;padding-left:${W * 0.035}px;position:relative}
li:before{content:"";position:absolute;left:0;top:.62em;width:${W * 0.012}px;height:${W * 0.012}px;border-radius:50%;background:var(--moss5)}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:${H * 0.026}px;color:var(--ink5)}
.foot b{color:var(--moss9)}
.cover{background:var(--moss9);color:#fff}
.cover .top,.cover .foot{color:var(--hay1)} .cover .foot b{color:#fff}
.cover .lead{color:#fff;opacity:.92}
.big{font-size:${H * 0.06}px;margin-top:${H * 0.05}px}
.url{font-size:${H * 0.036}px;color:var(--hay3);margin-top:${H * 0.02}px;font-weight:700}
`
const site = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'
const slides = []
slides.push(`<div class="slide cover"><div class="top"><span>川上牧場 酪農データバンク</span><span class="n">${esc(fmtDate(date))}の配信</span></div>
<h1 class="serif">${esc(title)}</h1><p class="lead">毎朝の音声配信を、そのまま教材に。話しているのは、島根県出雲市の酪農家・川上哲也です。</p>
<div class="foot"><span>全 ${body.length} 章</span><b>音声は配信そのもの・スライドは配信の記事から</b></div></div>`)
body.forEach((c, i) => {
  const terms = c.terms.slice(0, 2).map((t) => `<div class="card"><b>${esc(t.term || '用語')}</b><p>${esc(clipLead(t.text, 90))}</p></div>`).join('')
  slides.push(`<div class="slide"><div class="top"><span>第 ${i + 1} 章 ／ ${body.length}</span><span class="n">${esc(title.length > 34 ? title.slice(0, 33) + '…' : title)}</span></div>
<h2 class="serif">${esc(c.heading)}</h2>${c.lead ? `<p class="lead">${esc(clipLead(c.lead))}</p>` : ''}
${terms ? `<div class="cards">${terms}</div>` : ''}${c.insight && !terms ? `<div class="insight">${esc(c.insight)}<small>── 川上</small></div>` : ''}
<div class="foot"><span>川上牧場 酪農データバンク</span><b>${esc(fmtDate(date))}</b></div></div>`)
})
if (summary?.points.length) {
  slides.push(`<div class="slide"><div class="top"><span>まとめ</span><span class="n">${esc(title.length > 34 ? title.slice(0, 33) + '…' : title)}</span></div>
<h2 class="serif">この回の要点</h2><ul>${summary.points.slice(0, 6).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
<div class="foot"><span>川上牧場 酪農データバンク</span><b>${esc(fmtDate(date))}</b></div></div>`)
}
slides.push(`<div class="slide cover"><div class="top"><span>川上牧場 酪農データバンク</span><span class="n">つづきは、読める形で</span></div>
<h2 class="serif big">この回の全文・用語・質問は、データバンクで。</h2><p class="url">${esc(site)}e/${esc(epId)}/</p>
<p class="lead">牛乳のこと、牛のこと、酪農家になる道のこと。出雲の酪農家が、隠さず話します。質問は公式LINEへ。</p>
<div class="foot"><span>登録もお金も要りません</span><b>島根県出雲市・川上牧場</b></div></div>`)

/* ---------- 画像に焼く ---------- */
await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const files = []
for (let i = 0; i < slides.length; i++) {
  await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>${slides[i]}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  const f = path.join(OUT, `slide-${String(i).padStart(2, '0')}.png`)
  await page.screenshot({ path: f })
  files.push(f)
}
await browser.close()

/* ---------- 時間割 ---------- */
let durations
if (PREVIEW) durations = files.map(() => PREVIEW)
else {
  const total = args.get('duration')
    ? Number(args.get('duration'))
    : Number(execFileSync(FFMPEG.replace(/ffmpeg$/, 'ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', AUDIO]).toString().trim())
  const END = 8
  const starts = [0, ...CHAPTERS.slice(0, body.length)] // 表紙 + 各章
  while (starts.length < body.length + 1) starts.push(starts[starts.length - 1] + 1) // 秒が足りない章は 1 秒
  const sumStart = summary?.points.length ? Math.max(starts[starts.length - 1] + 1, total - END - 60) : null
  const ends = [...starts.slice(1), sumStart ?? total - END, total - END]
  durations = starts.map((s, i) => Math.max(1, ends[i] - s))
  if (summary?.points.length) durations.push(Math.max(1, total - END - sumStart))
  durations.push(END)
}
const list = files.map((f, i) => `file '${f}'\nduration ${durations[i]}`).join('\n') + `\nfile '${files[files.length - 1]}'\n`
await fs.writeFile(path.join(OUT, 'list.txt'), list)

/* ---------- 動画にする ---------- */
const out = path.join(OUT, `${KEY.replace(/\.txt$/, '')}.mp4`)
const audioArgs = PREVIEW || !AUDIO ? ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo'] : ['-i', AUDIO]
execFileSync(
  FFMPEG,
  ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'list.txt'), ...audioArgs, '-c:v', 'libx264', '-r', '25', '-pix_fmt', 'yuv420p', '-tune', 'stillimage', '-c:a', 'aac', '-b:a', '128k', '-shortest', out],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)
console.log(`書き出し: ${out}（スライド ${files.length} 枚・${durations.reduce((a, b) => a + b, 0)} 秒）`)
