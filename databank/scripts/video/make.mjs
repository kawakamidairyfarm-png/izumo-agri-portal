#!/usr/bin/env node
/**
 * 配信1回分を、学習教材の動画（mp4）にする。
 *
 *   node scripts/video/make.mjs --key 2026-09-16_x5564f57.txt --out out/ \
 *        [--audio ep.mp3] [--chapters 427,499,…] [--duration 1925] [--size 1920x1080] [--frames-only]
 *
 * 声は配信そのもの。画面は「文章を流す」のではなく、要点の短い言葉と図で出す
 * （教育系の動画を調べた結論: 1画面1メッセージ・短い言葉・図・数秒ごとに動く）。
 *
 * 画面の台本は scripts/video/plans/<key>.json（手で書いた要点と図）。
 * 台本が無い回は、全文の見出し・用語・ひとこと・質問・まとめだけを使って自動で組み立てる
 * （文章をそのまま流さない＝途中で切れた文が出ない）。
 *
 * 章の頭の時刻は pody の再生位置（--chapters）に必ず合わせるので、ずれが溜まらない。
 * --frames-only 画像だけ作って動画にしない（見た目の確認用）／--full 前置きの雑談も残す
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
const CHAPTERS = (args.get('chapters') ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n))
const FRAMES_ONLY = args.has('frames-only')
const FULL = args.has('full')
const MAX_MIN = Number(args.get('max-minutes') ?? 0) // 動画全体の上限（分）。Instagram は 20 分まで
const [W, H] = (args.get('size') ?? '1920x1080').split('x').map(Number)
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const FFPROBE = process.env.FFPROBE || FFMPEG.replace(/ffmpeg$/, 'ffprobe')
const require = createRequire(process.env.PLAYWRIGHT_DIR ? path.join(process.env.PLAYWRIGHT_DIR, 'package.json') : import.meta.url)
const { chromium } = require('playwright')

const COVER = 5 // 表紙（音声より前・無音）
const END = 8 // 締め（音声より後・無音）
const EYECATCH = 3.0

/* ---------- 材料 ---------- */
const episodes = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'episodes.json'), 'utf8'))
const km = /^(\d{4}-\d{2}-\d{2})_([0-9a-z]{8})/.exec(KEY)
const ep = episodes.find((e) => e.date === km?.[1] && e.driveId.startsWith(km?.[2] ?? '\0'))
/** 自動文字起こしの固有名詞の取り違えを、画面に出す前だけ直す（中身は変えない） */
const ASR_FIX = [
  [/ポポポ/g, 'Pody'],
  [/楽能|落脳|楽農/g, '酪農'],
  [/乳腺炎|入房院|乳房園/g, '乳房炎'],
]
const text = ASR_FIX.reduce((s, [re, to]) => s.replace(re, to), await fs.readFile(path.join(ROOT, 'data', 'transcripts', KEY), 'utf8'))
const title = ep?.title ?? KEY
const date = ep?.date ?? km?.[1] ?? ''
const epId = ep ? `${ep.date}_${ep.driveId.slice(0, 8)}` : KEY.replace(/\.txt$/, '')
const portrait = await fs
  .readFile(path.join(ROOT, 'data', 'photos', 'about.jpg'))
  .then((b) => `data:image/jpeg;base64,${b.toString('base64')}`)
  .catch(() => '')

/* ---------- 全文を章に分ける（見出しと、台本が無いときの材料） ---------- */
const chapters = []
let cur = null
for (const raw of text.split(/\n+/)) {
  const l = raw.trim()
  if (!l) continue
  if (l.startsWith('## ')) {
    cur = { heading: l.slice(3).trim(), blocks: [] }
    chapters.push(cur)
    continue
  }
  if (!cur) continue
  const mm = /^(>>|\?\?|!!|%%|--)\s+([\s\S]*)$/.exec(l)
  if (!mm) continue
  const rest = mm[2]
  const who = rest.includes('｜') ? rest.slice(0, rest.indexOf('｜')).trim() : ''
  const t = (rest.includes('｜') ? rest.slice(rest.indexOf('｜') + 1) : rest).trim()
  cur.blocks.push({ mark: mm[1], who, t })
}
const summaryCh = chapters.find((c) => /^まとめ/.test(c.heading))
let body = chapters.filter((c) => c !== summaryCh)
// 全文に章の印が無い回（noteの記事から取り込んだ回）は、pody の章見出しを使う
if (!body.length && args.get('meta')) {
  const meta = JSON.parse(await fs.readFile(path.resolve(args.get('meta')), 'utf8'))
  body = (meta.chapters ?? []).map((c) => ({ heading: c.heading, blocks: [] }))
}
const points = summaryCh?.blocks.filter((b) => b.mark === '--').map((b) => b.t) ?? []

/* ---------- 画面の台本 ---------- */
let plan = null
try {
  plan = JSON.parse(await fs.readFile(path.join(HERE, 'plans', KEY.replace(/\.txt$/, '.json')), 'utf8')).chapters
} catch {
  /* 台本が無ければ下で自動生成 */
}
/** 台本が無い回: 全文の見出し・用語・ひとこと・質問だけを使う（文章は流さない） */
if (!plan) {
  plan = body.map((c) => {
    const s = []
    for (const b of c.blocks) {
      if (b.mark === '??') s.push({ type: 'q', who: b.who ? `${b.who} さんから届いた質問` : '牧場に届いた質問', lines: [b.t] })
      else if (b.mark === '%%') s.push({ type: 'term', term: b.who || '用語', desc: b.t })
      else if (b.mark === '!!') s.push({ type: 'insight', who: b.who || '川上', text: b.t })
    }
    if (!s.length) s.push({ type: 'point', big: c.heading })
    return s
  })
}
if (points.length) plan[plan.length - 1] = [...plan[plan.length - 1], { type: 'matome' }, { type: 'summary', items: points }]

/* ---------- 画面（frame）へ展開 ---------- */
const STEPS = {
  q: (s) => s.lines.length,
  compare: () => 2,
  balance: () => 2,
  list: (s) => (s.grid ? 1 : s.items.length),
  check: (s) => s.items.length,
  steps: (s) => s.items.length,
  bars: (s) => s.items.length,
  timeline: (s) => s.items.length,
  web: (s) => s.items.length,
  summary: (s) => s.items.length,
  calc: (s) => s.rows.length + 1,
}
const frames = []
plan.forEach((slides, ci) => {
  frames.push({ ci, type: 'eyecatch', w: 0 })
  for (const s of slides) {
    if (s.type === 'matome') {
      frames.push({ ci, type: 'eyecatch', matome: true, w: 0 })
      continue
    }
    const n = STEPS[s.type]?.(s) ?? 1
    for (let k = 0; k < n; k++) frames.push({ ci, type: s.type, s, k, n, w: n > 1 ? 1 : 1.6 })
  }
})

/* ---------- 時間割 ---------- */
const audioStart = FULL || !CHAPTERS.length ? 0 : CHAPTERS[0]
let audioEnd = Number(args.get('duration') ?? 0)
if (!audioEnd && AUDIO) audioEnd = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', AUDIO]).toString().trim())
if (!audioEnd) throw new Error('--duration か --audio が要ります')

/**
 * 上限（分）に収める。まず後ろの雑談を落とし、それでも長ければ少しだけ速さを上げる。
 * 落とすのは「最後の章の話が終わったあと」まで＝本編は削らない。速さは 1.2 倍を超えない。
 */
let tempo = 1
let trimmed = 0
if (MAX_MIN > 0) {
  const target = MAX_MIN * 60 - COVER - END
  const span = audioEnd - audioStart
  if (span > target) {
    // この回の話す速さ（字/秒）から、最後の章の話が終わる時刻を見積もる
    const chars = text.replace(/^(##|>>|\?\?|!!|%%|--)\s+/gm, '').replace(/\s/g, '').length
    const rate = chars / span
    const lastFrom = CHAPTERS[plan.length - 1] ?? audioStart
    const lastChars = (chapters[chapters.length - 1]?.heading ?? '').length +
      (body[body.length - 1]?.blocks ?? []).reduce((a, b) => a + b.t.length, 0) + points.join('').length
    const contentEnd = Math.min(audioEnd, lastFrom + Math.max(30, lastChars / Math.max(1, rate)) + 10)
    if (contentEnd < audioEnd) {
      trimmed = audioEnd - contentEnd
      audioEnd = contentEnd
    }
    const left = audioEnd - audioStart
    if (left > target) tempo = Math.min(1.2, left / target)
  }
}
const bounds = plan.map((_, i) => ({ from: CHAPTERS[i] ?? audioStart, to: i + 1 < plan.length ? (CHAPTERS[i + 1] ?? audioEnd) : audioEnd }))
for (let ci = 0; ci < plan.length; ci++) {
  const mine = frames.filter((f) => f.ci === ci)
  const budget = Math.max(6, bounds[ci].to - bounds[ci].from)
  const eyes = mine.filter((f) => f.type === 'eyecatch')
  const rest = mine.filter((f) => f.type !== 'eyecatch')
  const eye = Math.min(EYECATCH, budget / (eyes.length * 4 || 1))
  eyes.forEach((f) => (f.dur = eye))
  const pool = budget - eye * eyes.length
  const total = rest.reduce((a, b) => a + b.w, 0) || 1
  rest.forEach((f) => (f.dur = (pool * f.w) / total))
  const diff = budget - mine.reduce((a, b) => a + b.dur, 0)
  mine[mine.length - 1].dur += diff
}
// 速さを上げたぶん、画面の長さも縮める（章の頭が音とずれないように）
if (tempo !== 1) for (const f of frames) f.dur /= tempo
frames.unshift({ type: 'cover', dur: COVER })
frames.push({ type: 'end', dur: END })

/* ---------- 絵 ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fmtDate = (iso) => {
  const [y, mo, d] = iso.split('-')
  return y ? `${y}年${Number(mo)}月${Number(d)}日` : ''
}
const short = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s))
const u = (r) => `${Math.round(H * r)}px`
const on = (k, i) => (i <= k ? 'on' : '')

const css = `
${process.env.FONT_CSS ? await fs.readFile(process.env.FONT_CSS, 'utf8') : ''}
:root{--bg:#0f1a10;--card:#18291b;--line:#2f462f;--fg:#ffffff;--dim:#9db09c;--hay:#f2cf7a;--hay2:#ffe6a8;--moss:#7fae84}
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg);color:var(--fg);
  font-family:"Noto Sans JP","Noto Sans CJK JP","IPAPGothic",sans-serif;font-weight:700;-webkit-font-smoothing:antialiased}
.s{position:absolute;inset:0;display:flex;flex-direction:column;padding:${u(0.055)} ${u(0.072)}}
.bar{display:flex;align-items:center;gap:${u(0.022)};font-size:${u(0.026)};color:var(--dim);letter-spacing:.08em}
.bar .no{color:var(--hay);white-space:nowrap}
.bar .hd{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:500}
.prog{height:${u(0.006)};background:var(--line);border-radius:999px;margin-top:${u(0.022)};overflow:hidden}
.prog i{display:block;height:100%;background:var(--hay);border-radius:999px}
.mid{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;min-height:0}
.t{font-size:${u(0.038)};color:var(--hay);letter-spacing:.06em;margin-bottom:${u(0.04)}}
.big{font-size:${u(0.088)};font-weight:900;line-height:1.45;width:15.5em}
.sub{font-size:${u(0.036)};font-weight:500;color:#cfdccd;line-height:1.6;margin-top:${u(0.032)};width:24em}
.tag{display:inline-block;font-size:${u(0.027)};letter-spacing:.16em;color:#0b1410;background:var(--hay);padding:${u(0.009)} ${u(0.02)};border-radius:${u(0.008)};margin-bottom:${u(0.032)}}
.tag.m{background:var(--moss)}
/* 引用 */
.quote{font-size:${u(0.062)};font-weight:900;line-height:1.6;width:18em;border-left:${u(0.012)} solid var(--hay);padding-left:${u(0.04)}}
.by{font-size:${u(0.032)};color:var(--hay);margin-top:${u(0.03)}}
.insight{background:var(--hay);color:#12200f;border-radius:${u(0.028)};padding:${u(0.05)} ${u(0.05)};font-size:${u(0.062)};line-height:1.6;width:19em}
.insight small{display:block;font-size:${u(0.03)};margin-top:${u(0.025)};color:#5d4a14}
/* ことば */
.term{font-size:${u(0.1)};font-weight:900;color:var(--hay)}
.termd{font-size:${u(0.044)};font-weight:500;line-height:1.75;color:#e8efe6;width:23em;margin-top:${u(0.03)}}
/* 数字 */
.stat{display:flex;align-items:baseline;gap:${u(0.02)}}
.stat b{font-size:${u(0.24)};font-weight:900;color:var(--hay);line-height:1}
.stat i{font-style:normal;font-size:${u(0.08)};color:var(--hay);font-weight:900}
.statl{font-size:${u(0.046)};margin-top:${u(0.035)};width:22em;line-height:1.5}
/* 一覧 */
.ul{display:flex;flex-direction:column;gap:${u(0.026)};width:100%;font-size:${u(0.052)}}
.ul li{list-style:none;font-size:inherit;line-height:1.45;padding-left:${u(0.055)};position:relative;color:#41543f;transition:none}
.ul li.on{color:#fff}
.ul li:before{content:"";position:absolute;left:${u(0.012)};top:.55em;width:${u(0.016)};height:${u(0.016)};border-radius:50%;background:#41543f}
.ul li.on:before{background:var(--hay)}
.grid{display:flex;flex-wrap:wrap;gap:${u(0.02)};width:100%}
.grid span{font-size:${u(0.042)};background:var(--card);border:2px solid var(--line);border-radius:999px;padding:${u(0.016)} ${u(0.032)}}
/* チェック */
.ck{display:flex;flex-direction:column;gap:${u(0.028)};width:100%}
.ck div{display:flex;gap:${u(0.028)};align-items:flex-start;font-size:${u(0.05)};line-height:1.45;color:#41543f}
.ck div.on{color:#fff}
.ck b{flex:none;width:${u(0.06)};height:${u(0.06)};border-radius:${u(0.012)};border:${u(0.005)} solid #41543f;display:flex;align-items:center;justify-content:center;font-size:${u(0.034)};color:transparent}
.ck div.on b{border-color:var(--hay);background:var(--hay);color:#12200f}
/* 段（初産→2産→3産） */
.stp{display:flex;align-items:center;gap:${u(0.022)};flex-wrap:wrap}
.stp span{font-size:${u(0.056)};font-weight:900;background:var(--card);border:3px solid var(--line);color:#41543f;border-radius:${u(0.02)};padding:${u(0.022)} ${u(0.04)}}
.stp span.on{color:#12200f;background:var(--hay);border-color:var(--hay)}
.stp b{color:#41543f;font-size:${u(0.05)}}
.stp b.on{color:var(--hay)}
/* 棒 */
.bars{display:flex;flex-direction:column;gap:${u(0.034)};width:100%}
.bars .row{display:flex;align-items:center;gap:${u(0.03)}}
.bars .lb{width:4.2em;font-size:${u(0.05)};color:#41543f;text-align:right}
.bars .row.on .lb{color:#fff}
.bars .tr{flex:1;height:${u(0.085)};background:var(--card);border-radius:${u(0.014)};overflow:hidden}
.bars .tr i{display:block;height:100%;background:linear-gradient(90deg,#c8a css,var(--hay));border-radius:${u(0.014)}}
/* 時間の帯 */
.tl{width:100%;display:flex;align-items:center;gap:0}
.tl .n{flex:none;display:flex;flex-direction:column;align-items:center;gap:${u(0.018)}}
.tl .dot{width:${u(0.036)};height:${u(0.036)};border-radius:50%;background:#33452f}
.tl .n.on .dot{background:var(--hay)}
.tl .n span{font-size:${u(0.034)};color:#41543f;white-space:nowrap}
.tl .n.on span{color:#fff}
.tl .seg{flex:1;height:${u(0.008)};background:#25361f;border-radius:999px}
.tl .seg.on{background:var(--hay)}
.tlend{font-size:${u(0.07)};color:var(--hay);font-weight:900;margin-top:${u(0.045)}}
/* 二枚並べ */
.cmp{display:flex;gap:${u(0.03)};width:100%;align-items:stretch}
.cmp .c{flex:1;background:var(--card);border:3px solid var(--line);border-radius:${u(0.03)};padding:${u(0.04)};opacity:.22}
.cmp .c.on{opacity:1;border-color:var(--hay)}
.cmp .m{font-size:${u(0.05)};color:var(--hay);font-weight:900}
.cmp .h{font-size:${u(0.052)};font-weight:900;line-height:1.4;margin-top:${u(0.014)}}
.cmp .p{font-size:${u(0.034)};font-weight:500;color:#cfdccd;line-height:1.6;margin-top:${u(0.022)}}
.cmp .vs{align-self:center;font-size:${u(0.05)};color:var(--hay);font-weight:900;flex:none}
/* 計算 */
.calc{display:flex;flex-direction:column;gap:${u(0.026)};width:100%}
.calc .r{display:flex;align-items:baseline;justify-content:space-between;gap:${u(0.04)};font-size:${u(0.05)};color:#41543f;border-bottom:2px solid var(--line);padding-bottom:${u(0.02)}}
.calc .r.on{color:#fff}
.calc .r b{font-size:${u(0.062)};color:#41543f;white-space:nowrap}
.calc .r.on b{color:var(--hay)}
.calc .r.res{border-bottom:none;background:var(--card);border-radius:${u(0.02)};padding:${u(0.03)} ${u(0.035)}}
.calc .r.res b{font-size:${u(0.09)}}
/* 輪 */
.web{display:flex;flex-wrap:wrap;gap:${u(0.022)};width:100%;align-items:center}
.web .c{font-size:${u(0.062)};font-weight:900;color:#12200f;background:var(--hay);border-radius:999px;padding:${u(0.024)} ${u(0.045)}}
.web .i{font-size:${u(0.046)};background:var(--card);border:3px solid var(--line);border-radius:999px;padding:${u(0.02)} ${u(0.038)};color:#41543f}
.web .i.on{color:#fff;border-color:var(--hay)}
/* 下 */
.foot{display:flex;align-items:center;gap:${u(0.018)};font-size:${u(0.025)};color:var(--dim);font-weight:500}
.foot img{width:${u(0.058)};height:${u(0.058)};border-radius:50%;object-fit:cover}
.foot b{color:#dfe7dd;font-weight:700}
.foot .r{margin-left:auto;letter-spacing:.06em}
/* 章の見出し */
.eye{justify-content:center;align-items:flex-start}
.eyeno{font-size:${u(0.036)};color:var(--hay);letter-spacing:.24em}
.eyeh{font-size:${u(0.098)};font-weight:900;line-height:1.35;width:15em;margin-top:${u(0.03)}}
.rule{width:${u(0.14)};height:${u(0.008)};background:var(--hay);margin-top:${u(0.045)};border-radius:999px}
/* 表紙・締め */
.cover{background:linear-gradient(160deg,#18291b 0%,#0b140c 70%)}
.ct{font-size:${u(0.086)};font-weight:900;line-height:1.4;width:17em;margin-top:${u(0.03)}}
.cp{display:flex;flex-direction:column;gap:${u(0.018)};margin-top:${u(0.05)}}
.cp span{font-size:${u(0.036)};color:#cfdccd;font-weight:500;padding-left:${u(0.045)};position:relative;line-height:1.45}
.cp span:before{content:"";position:absolute;left:${u(0.012)};top:.58em;width:${u(0.014)};height:${u(0.014)};border-radius:50%;background:var(--hay)}
.mark{display:flex;align-items:center;gap:${u(0.018)};font-size:${u(0.028)};color:var(--hay);letter-spacing:.14em}
.mark img{width:${u(0.07)};height:${u(0.07)};border-radius:50%;object-fit:cover}
.url{font-size:${u(0.042)};color:var(--hay);font-weight:700;margin-top:${u(0.028)}}
.endh{font-size:${u(0.072)};font-weight:900;line-height:1.45;width:16em;margin-top:${u(0.03)}}
.endn{font-size:${u(0.032)};color:#cfdccd;font-weight:500;margin-top:${u(0.04)};line-height:1.7;width:26em}
`.replace('linear-gradient(90deg,#c8a css,var(--hay))', 'linear-gradient(90deg,#c8a94f,var(--hay))')

const footer = (right) =>
  `<div class="foot">${portrait ? `<img src="${portrait}" alt="">` : ''}<span><b>川上哲也</b>　島根県出雲市・川上牧場</span><span class="r">${esc(right)}</span></div>`
const head = (ci, prog) =>
  `<div class="bar"><span class="no">第 ${ci + 1} 章 ／ ${plan.length}</span><span class="hd">${esc(short(body[ci]?.heading ?? '', 30))}</span></div>
   <div class="prog"><i style="width:${(prog * 100).toFixed(1)}%"></i></div>`

/** 1枚の中身 */
function inner(f) {
  const s = f.s
  const k = f.k
  const T = s?.title ? `<div class="t">${esc(s.title)}</div>` : ''
  switch (f.type) {
    case 'q':
      return `<span class="tag m">${esc(s.who)}</span><div class="quote">${s.lines.slice(0, k + 1).map((l) => `<div>${esc(l)}</div>`).join('')}</div>`
    case 'point':
      return `${T}<div class="big">${esc(s.big)}</div>${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}`
    case 'note':
      return `<span class="tag m">ただし</span><div class="big" style="font-size:${u(0.07)}">${esc(s.big)}</div>${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}`
    case 'quote':
      return `<div class="quote">${esc(s.text)}</div><div class="by">── ${esc(s.who)}</div>`
    case 'insight':
      return `<div class="insight">${esc(s.text)}<small>── ${esc(s.who)}</small></div>`
    case 'term':
      return `<span class="tag">ことば</span><div class="term">${esc(s.term)}</div><div class="termd">${esc(s.desc)}</div>`
    case 'stat':
      return `<div class="stat"><b>${esc(s.value)}</b><i>${esc(s.unit)}</i></div><div class="statl">${esc(s.label)}</div>${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ''}`
    case 'list':
      return s.grid
        ? `${T}<div class="grid">${s.items.map((x) => `<span>${esc(x)}</span>`).join('')}</div>${s.note ? `<div class="sub">${esc(s.note)}</div>` : ''}`
        : `${T}<ul class="ul">${s.items.map((x, i) => `<li class="${on(k, i)}">${esc(x)}</li>`).join('')}</ul>${s.note ? `<div class="sub">${esc(s.note)}</div>` : ''}`
    case 'check':
      return `${T}<div class="ck">${s.items.map((x, i) => `<div class="${on(k, i)}"><b>✓</b><span>${esc(x)}</span></div>`).join('')}</div>`
    case 'steps':
      return `${T}<div class="stp">${s.items
        .map((x, i) => `${i ? `<b class="${on(k, i)}">→</b>` : ''}<span class="${on(k, i)}">${esc(x)}</span>`)
        .join('')}</div>${s.note ? `<div class="sub">${esc(s.note)}</div>` : ''}`
    case 'bars':
      return `${T}<div class="bars">${s.items
        .map((x, i) => `<div class="row ${on(k, i)}"><span class="lb">${esc(x.label)}</span><span class="tr"><i style="width:${i <= k ? Math.round(x.v * 100) : 0}%"></i></span></div>`)
        .join('')}</div>${s.note ? `<div class="sub">${esc(s.note)}</div>` : ''}`
    case 'timeline':
      return `${T}<div class="tl">${s.items
        .map((x, i) => `${i ? `<span class="seg ${on(k, i)}"></span>` : ''}<span class="n ${on(k, i)}"><span class="dot"></span><span>${esc(x)}</span></span>`)
        .join('')}</div>${s.tail ? `<div class="tlend ${k >= s.items.length - 1 ? '' : 'hidden'}" style="opacity:${k >= s.items.length - 1 ? 1 : 0}">${esc(s.tail)}</div>` : ''}`
    case 'compare':
      return `${T}<div class="cmp"><div class="c ${on(k, 0)}"><div class="m">${esc(s.left.mark ?? '')}</div><div class="h">${esc(s.left.h)}</div>${s.left.t ? `<div class="p">${esc(s.left.t)}</div>` : ''}</div>
        <div class="vs">${esc(s.vs ?? 'VS')}</div>
        <div class="c ${on(k, 1)}"><div class="m">${esc(s.right.mark ?? '')}</div><div class="h">${esc(s.right.h)}</div>${s.right.t ? `<div class="p">${esc(s.right.t)}</div>` : ''}</div></div>`
    case 'balance':
      return `${T}<div class="cmp"><div class="c ${on(k, 0)}"><div class="h">${esc(s.left.h)}</div><div class="p">${esc(s.left.t)}</div></div>
        <div class="vs">⇄</div>
        <div class="c ${on(k, 1)}"><div class="h">${esc(s.right.h)}</div><div class="p">${esc(s.right.t)}</div></div></div>`
    case 'calc':
      return `${T}<div class="calc">${s.rows.map((r, i) => `<div class="r ${on(k, i)}"><span>${esc(r.l)}</span><b>${esc(r.r)}</b></div>`).join('')}
        <div class="r res ${on(k, s.rows.length)}"><span>${esc(s.result.l)}</span><b>${esc(s.result.r)}</b></div></div>`
    case 'web':
      return `${T}<div class="web"><span class="c">${esc(s.center)}</span>${s.items.map((x, i) => `<span class="i ${on(k, i)}">${esc(x)}</span>`).join('')}</div>`
    case 'summary':
      return `<span class="tag">この回の要点</span><ul class="ul" style="font-size:${u(0.046)}">${s.items.map((x, i) => `<li class="${on(k, i)}">${esc(x)}</li>`).join('')}</ul>`
    default:
      return `<div class="big">${esc(s?.big ?? '')}</div>`
  }
}

function frame(f, prog) {
  if (f.type === 'cover') {
    return `<div class="s cover"><div class="mark">${portrait ? `<img src="${portrait}" alt="">` : ''}川上牧場 酪農データバンク</div>
      <div class="mid"><div class="ct">${esc(title)}</div>
      <div class="cp">${points.slice(0, 3).map((p) => `<span>${esc(short(p, 40))}</span>`).join('')}</div></div>
      ${footer(`${fmtDate(date)}の配信　全 ${plan.length} 章`)}</div>`
  }
  if (f.type === 'end') {
    return `<div class="s cover"><div class="mark">${portrait ? `<img src="${portrait}" alt="">` : ''}川上牧場 酪農データバンク</div>
      <div class="mid"><div class="endh">この回の全文・用語・質問は、<br>データバンクで読めます。</div>
      <div class="url">kawakamidairyfarm-png.github.io/izumo-agri-portal/e/${esc(epId)}/</div>
      <div class="endn">牛乳のこと、牛のこと、酪農家になる道のこと。2019年からの配信を、言葉で探せます。質問は公式LINEへ。</div></div>
      ${footer('登録もお金も要りません')}</div>`
  }
  const h = head(f.ci, prog)
  const ft = footer(fmtDate(date))
  if (f.type === 'eyecatch') {
    const heading = f.matome ? 'まとめ' : (body[f.ci]?.heading ?? '')
    return `<div class="s">${h}<div class="mid eye"><div class="eyeno">${f.matome ? 'MATOME' : `CHAPTER ${String(f.ci + 1).padStart(2, '0')}`}</div>
      <div class="eyeh">${esc(heading)}</div><div class="rule"></div></div>${ft}</div>`
  }
  return `<div class="s">${h}<div class="mid">${inner(f)}</div>${ft}</div>`
}

/* ---------- 焼く ---------- */
await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const files = []
let t = 0
const totalBody = bounds.length ? bounds[bounds.length - 1].to - bounds[0].from : audioEnd
for (let i = 0; i < frames.length; i++) {
  const f = frames[i]
  await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>${frame(f, Math.min(1, t / (totalBody || 1)))}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(OUT, `f-${String(i).padStart(4, '0')}.png`)
  await page.screenshot({ path: file })
  files.push(file)
  if (f.type !== 'cover' && f.type !== 'end') t += f.dur
}

// サムネイル（1280×720）
const thumbTitle = (/^(.{4,24}?[？?])/.exec(title)?.[1] ?? title.split(/[。、]/)[0]).slice(0, 26)
const tf = Math.round(Math.min(116, 1130 / Math.max(6, thumbTitle.length <= 13 ? thumbTitle.length : Math.ceil(thumbTitle.length / 2))))
await page.setViewportSize({ width: 1280, height: 720 })
await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}
html,body{width:1280px;height:720px}
.tw{position:absolute;inset:0;background:linear-gradient(150deg,#18291b,#0b140c);padding:60px 68px;display:flex;flex-direction:column;justify-content:center}
.tw .k{font-size:32px;color:#f2cf7a;letter-spacing:.2em}
.tw h1{font-size:${tf}px;font-weight:900;line-height:1.3;margin-top:20px;width:1130px}
.tw h1 em{font-style:normal;color:#f2cf7a}
.tw .sx{font-size:36px;color:#cfdccd;font-weight:700;margin-top:34px;letter-spacing:.04em}
.tw .b{position:absolute;right:60px;bottom:52px;display:flex;align-items:center;gap:18px;font-size:29px;color:#cfdccd}
.tw .b img{width:104px;height:104px;border-radius:50%;object-fit:cover;border:5px solid #f2cf7a}
</style></head><body><div class="tw"><div class="k">出雲の酪農家が答える</div>
<h1>${esc(thumbTitle).replace(/(更新率|乳量|長生き|牛乳|原価|子牛|飼料|繁殖|資金|給食|バター)/, '<em>$1</em>')}</h1>
<div class="sx">${esc(short(points[0] ?? `配信 ${fmtDate(date)}`, 26))}</div>
<div class="b">${portrait ? `<img src="${portrait}" alt="">` : ''}<span>川上牧場 酪農データバンク</span></div></div></body></html>`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: path.join(OUT, 'thumbnail.png') })
await browser.close()

const list = files.map((f, i) => `file '${f}'\nduration ${frames[i].dur.toFixed(3)}`).join('\n') + `\nfile '${files[files.length - 1]}'\n`
await fs.writeFile(path.join(OUT, 'list.txt'), list)

// YouTube の説明欄（章の時刻は、前置きを落としたあとの動画の時刻）
const mmss = (sec) => {
  const x = Math.max(0, Math.round(sec))
  const h = Math.floor(x / 3600)
  const r = `${String(Math.floor((x % 3600) / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
  return h ? `${h}:${r}` : r
}
const SITE = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'
await fs.writeFile(
  path.join(OUT, 'youtube.txt'),
  [
    title,
    '',
    `${fmtDate(date)}の配信より。島根県出雲市で乳牛約80頭を飼う酪農家・川上哲也が、毎朝の音声配信で話したことをそのまま教材にしたものです。`,
    '',
    ...(points.length ? ['この回の要点', ...points.map((p) => `・${p}`), ''] : []),
    '章',
    `${mmss(0)} はじめに`,
    ...body.map((c, i) => `${mmss(COVER + (bounds[i].from - audioStart) / tempo)} ${c.heading}`),
    '',
    `この回の全文・用語・質問　${SITE}e/${epId}/`,
    `酪農のことば帖　${SITE}terms/`,
    `届いた質問と、答えた回　${SITE}questions/`,
    '',
    '牛乳のこと、牛のこと、酪農家になる道のこと。出雲の酪農家が、隠さず話します。',
    '島根県出雲市・川上牧場　川上哲也',
  ].join('\n'),
)

const totalSec = frames.reduce((a, b) => a + b.dur, 0)
console.log(`画面 ${files.length} 枚・${Math.round(totalSec)} 秒＝${(totalSec / 60).toFixed(1)} 分（本編 ${Math.round(audioStart)}秒〜${Math.round(audioEnd)}秒${FULL ? '' : '＝前置きの雑談は落とした'}）`)
if (trimmed) console.log(`後ろの雑談を ${Math.round(trimmed)} 秒落とした`)
if (tempo !== 1) console.log(`上限 ${MAX_MIN} 分に収めるため、話す速さを ${tempo.toFixed(3)} 倍にした（声の高さは変えていない）`)
console.log(`1枚あたり ${(totalSec / files.length).toFixed(1)} 秒・台本: ${args.has('key') && plan ? 'あり' : 'なし'}`)
if (FRAMES_ONLY) process.exit(0)

const out = path.join(OUT, `${KEY.replace(/\.txt$/, '')}.mp4`)
const spanSec = (audioEnd - audioStart) / tempo
const af = [
  tempo !== 1 ? `atempo=${tempo.toFixed(5)}` : null,
  // 終わりを2秒かけて絞る（途中で切っても唐突にならないように）
  `afade=t=out:st=${Math.max(0, spanSec - 2).toFixed(3)}:d=2`,
  `adelay=${COVER * 1000}|${COVER * 1000}`,
  'apad',
].filter(Boolean).join(',')
const aArgs = AUDIO
  ? ['-ss', String(audioStart), '-to', String(audioEnd), '-i', AUDIO, '-af', af]
  : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo']
execFileSync(
  FFMPEG,
  ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'list.txt'), ...aArgs,
    '-c:v', 'libx264', '-r', '25', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k',
    '-t', totalSec.toFixed(3), out],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)
console.log(`書き出し: ${out}`)
