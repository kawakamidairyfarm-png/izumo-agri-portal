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
 * --thumb-only  サムネイルだけ作り直す（画面も動画も作らない）
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
const THUMB_ONLY = args.has('thumb-only') // サムネイルだけ作り直す（動画は触らない）
const FULL = args.has('full')
const MAX_MIN = Number(args.get('max-minutes') ?? 0) // 動画全体の上限（分）。Instagram は 20 分まで
const [W, H] = (args.get('size') ?? '1920x1080').split('x').map(Number)
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const FFPROBE = process.env.FFPROBE || FFMPEG.replace(/ffmpeg$/, 'ffprobe')
const require = createRequire(process.env.PLAYWRIGHT_DIR ? path.join(process.env.PLAYWRIGHT_DIR, 'package.json') : import.meta.url)
const { chromium } = require('playwright')
const { resolveEpisode } = await import('./episode.mjs')

const COVER = 5 // 表紙（音声より前・無音）
const END = 8 // 締め（音声より後・無音）
const EYECATCH = 3.0

/* ---------- 材料 ---------- */
const ep = await resolveEpisode(ROOT, KEY)
/** 自動文字起こしの固有名詞の取り違えを、画面に出す前だけ直す（中身は変えない） */
const ASR_FIX = [
  [/ポポポ/g, 'Pody'],
  [/楽能|落脳|楽農/g, '酪農'],
  [/乳腺炎|入房院|乳房園/g, '乳房炎'],
]
// 全文が無い回もある（noteの有料記事の回は、本文を公開の場所に置いていない）。
// その場合は台本（plans/<key>.json）だけで作る＝有料記事の本文をリポジトリに入れない
const text = ASR_FIX.reduce(
  (s, [re, to]) => s.replace(re, to),
  await fs.readFile(path.join(ROOT, 'data', 'transcripts', KEY), 'utf8').catch(() => ''),
)
const title = ep.title
const date = ep.date
const epId = ep.id
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
let points = summaryCh?.blocks.filter((b) => b.mark === '--').map((b) => b.t) ?? []

/* ---------- 画面の台本 ---------- */
let plan = null
let planPoints = null
let planThumb = null
try {
  const j = JSON.parse(await fs.readFile(path.join(HERE, 'plans', KEY.replace(/\.txt$/, '.json')), 'utf8'))
  plan = j.chapters
  // 全文が無い回のために、まとめの要点を台本に書いておける
  if (Array.isArray(j.points)) planPoints = j.points
  // サムネイルの文字（手で書いたものがあれば、題名からの自動生成より優先する）
  if (j.thumb && typeof j.thumb === 'object') planThumb = j.thumb
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
if (planPoints?.length) points = planPoints
if (points.length) plan[plan.length - 1] = [...plan[plan.length - 1], { type: 'matome' }, { type: 'summary', items: points }]

/* ---------- 画面（frame）へ展開 ---------- */
const STEPS = {
  q: (s) => s.lines.length,
  point: (s) => (s.sub ? 2 : 1),
  note: (s) => (s.sub ? 2 : 1),
  term: () => 2,
  stat: (s) => (s.label || s.sub ? 2 : 1),
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

/* ---------- 日本語の折り返し ----------
 * 画面の字が「までが短い」「均質化／の5つ」のように語の途中で折れていた。
 * 折ってよいのは、助詞や読点のうしろか、文字の種類が変わるところだけ。
 * その切れ目ごとに inline-block で包むと、ブラウザはそこでしか折れなくなる。
 */
const CLS = (c) => (/[一-鿿々]/.test(c) ? 'k' : /[ぁ-ん]/.test(c) ? 'h' : /[ァ-ヶー]/.test(c) ? 'K' : /[0-9A-Za-z０-９Ａ-Ｚａ-ｚ]/.test(c) ? 'n' : 'o')
const PARTICLE = 'はがをにのとでもへ' // 「か・ね・よ・や」は言葉の途中にも出るので入れない
const NO_HEAD = 'ーぁぃぅぇぉっゃゅょァィゥェォッャュョ々、。・？?！!」』）)％%℃' // 行の頭に置かない字
const NO_TAIL = '（(「『【' // 行の終わりに置かない字（かっこの開き）
/** i の位置で行を折ってよいか */
function canBreak(s, i) {
  if (i <= 0 || i >= s.length) return false
  const prev = s[i - 1]
  const cur = s[i]
  if (NO_HEAD.includes(cur) || NO_TAIL.includes(prev)) return false
  if (PARTICLE.includes(cur)) return false // 行の頭が助詞になるのは避ける
  if ('、・'.includes(prev)) return true
  if (PARTICLE.includes(prev)) return true
  return CLS(prev) !== CLS(cur)
}
/** 折ってよいところだけで折れるように組む（語の途中では折れない） */
const jp = (text) => {
  const t = String(text ?? '')
  const out = []
  let start = 0
  for (let i = 1; i < t.length; i++) {
    if (canBreak(t, i)) {
      out.push(t.slice(start, i))
      start = i
    }
  }
  out.push(t.slice(start))
  return out
    .filter(Boolean)
    .map((c) => `<span class="w">${esc(c)}</span>`)
    .join('')
}
/** 一覧が枠からはみ出さない字の大きさを選ぶ（はみ出すくらいなら小さくする） */
function fitRatio(items, { maxH, maxW, base, min = 0.028, lh = 1.45, gap = 0.026, indent = 0 }) {
  for (let r = base; r > min; r -= 0.002) {
    const f = H * r
    const w = maxW - H * indent
    const lines = items.reduce((a, x) => a + Math.max(1, Math.ceil((String(x).length * f) / w)), 0)
    if (lines * lh * f + (items.length - 1) * H * gap <= maxH) return r
  }
  return min
}
const CONTENT_W = W - 2 * H * 0.072
const on = (k, i) => (i <= k ? 'on' : '')

const css = `
${process.env.FONT_CSS ? await fs.readFile(process.env.FONT_CSS, 'utf8') : ''}
:root{--bg:#0c1a34;--card:#16294a;--line:#2a4372;--fg:#ffffff;--dim:#9fb5d8;--hay:#ffd11a;--hay2:#ffe27a;--moss:#5f8fd8;--off:#3c5885}
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
.w{display:inline-block}
/* 行の長さを揃え、最後の行だけ極端に短くなるのを防ぐ */
.big,.eyeh,.ct,.endh,.quote,.insight,.cmp .h{text-wrap:balance}
.sub,.termd,.statl,.cmp .p,.ul li,.ck div span,.cp > span,.endn{text-wrap:pretty}
.big{font-size:${u(0.102)};font-weight:900;line-height:1.38;width:13.6em}
.sub{font-size:${u(0.044)};font-weight:500;color:#cfdcf0;line-height:1.6;margin-top:${u(0.034)};width:20em}
.tag{display:inline-block;font-size:${u(0.027)};letter-spacing:.16em;color:#0b1424;background:var(--hay);padding:${u(0.009)} ${u(0.02)};border-radius:${u(0.008)};margin-bottom:${u(0.032)}}
.tag.m{background:var(--moss)}
/* 引用 */
.quote{font-size:${u(0.062)};font-weight:900;line-height:1.6;width:18em;border-left:${u(0.012)} solid var(--hay);padding-left:${u(0.04)}}
.by{font-size:${u(0.032)};color:var(--hay);margin-top:${u(0.03)}}
.insight{background:var(--hay);color:#12203f;border-radius:${u(0.028)};padding:${u(0.05)} ${u(0.05)};font-size:${u(0.062)};line-height:1.6;width:19em}
.insight small{display:block;font-size:${u(0.03)};margin-top:${u(0.025)};color:#5d4a14}
/* ことば */
.term{font-size:${u(0.1)};font-weight:900;color:var(--hay)}
.termd{font-size:${u(0.044)};font-weight:500;line-height:1.75;color:#e6edf8;width:23em;margin-top:${u(0.03)}}
/* 数字 */
.stat{display:flex;align-items:baseline;gap:${u(0.02)}}
.stat b{font-size:${u(0.24)};font-weight:900;color:var(--hay);line-height:1}
.stat i{font-style:normal;font-size:${u(0.08)};color:var(--hay);font-weight:900}
.statl{font-size:${u(0.046)};margin-top:${u(0.035)};width:22em;line-height:1.5}
/* 一覧 */
.ul{display:flex;flex-direction:column;gap:${u(0.026)};width:100%;font-size:${u(0.056)}}
.ul li{list-style:none;font-size:inherit;line-height:1.45;padding-left:${u(0.055)};position:relative;color:var(--off);transition:none}
.ul li.on{color:#fff}
.ul li:before{content:"";position:absolute;left:${u(0.012)};top:.55em;width:${u(0.016)};height:${u(0.016)};border-radius:50%;background:var(--off)}
.ul li.on:before{background:var(--hay)}
.grid{display:flex;flex-wrap:wrap;gap:${u(0.02)};width:100%}
.grid > span{font-size:${u(0.042)};background:var(--card);border:2px solid var(--line);border-radius:999px;padding:${u(0.016)} ${u(0.032)}}
/* チェック */
.ck{display:flex;flex-direction:column;gap:${u(0.028)};width:100%}
.ck div{display:flex;gap:${u(0.028)};align-items:flex-start;font-size:${u(0.05)};line-height:1.45;color:var(--off)}
.ck div.on{color:#fff}
.ck b{flex:none;width:${u(0.06)};height:${u(0.06)};border-radius:${u(0.012)};border:${u(0.005)} solid var(--off);display:flex;align-items:center;justify-content:center;font-size:${u(0.034)};color:transparent}
.ck div.on b{border-color:var(--hay);background:var(--hay);color:#12203f}
/* 段（初産→2産→3産） */
.stp{display:flex;align-items:center;gap:${u(0.022)};flex-wrap:wrap}
.stp > span{font-size:${u(0.056)};font-weight:900;background:var(--card);border:3px solid var(--line);color:var(--off);border-radius:${u(0.02)};padding:${u(0.022)} ${u(0.04)}}
.stp > span.on{color:#12203f;background:var(--hay);border-color:var(--hay)}
.stp b{color:var(--off);font-size:${u(0.05)}}
.stp b.on{color:var(--hay)}
/* 棒 */
.bars{display:flex;flex-direction:column;gap:${u(0.034)};width:100%}
.bars .row{display:flex;align-items:center;gap:${u(0.03)}}
.bars .lb{width:4.2em;font-size:${u(0.05)};color:var(--off);text-align:right}
.bars .row.on .lb{color:#fff}
.bars .tr{flex:1;height:${u(0.085)};background:var(--card);border-radius:${u(0.014)};overflow:hidden}
.bars .tr i{display:block;height:100%;background:linear-gradient(90deg,#e0a800 css,var(--hay));border-radius:${u(0.014)}}
/* 時間の帯 */
.tl{width:100%;display:flex;align-items:center;gap:0}
.tl .n{flex:none;display:flex;flex-direction:column;align-items:center;gap:${u(0.018)}}
.tl .dot{width:${u(0.036)};height:${u(0.036)};border-radius:50%;background:#2a4372}
.tl .n.on .dot{background:var(--hay)}
.tl .n span{font-size:${u(0.034)};color:var(--off);white-space:nowrap}
.tl .n.on span{color:#fff}
.tl .seg{flex:1;height:${u(0.008)};background:#1d3157;border-radius:999px}
.tl .seg.on{background:var(--hay)}
.tlend{font-size:${u(0.07)};color:var(--hay);font-weight:900;margin-top:${u(0.045)}}
/* 二枚並べ */
.cmp{display:flex;gap:${u(0.03)};width:100%;align-items:stretch}
.cmp .c{flex:1;background:var(--card);border:3px solid var(--line);border-radius:${u(0.03)};padding:${u(0.04)};opacity:.22}
.cmp .c.on{opacity:1;border-color:var(--hay)}
.cmp .m{font-size:${u(0.05)};color:var(--hay);font-weight:900}
.cmp .h{font-size:${u(0.052)};font-weight:900;line-height:1.4;margin-top:${u(0.014)}}
.cmp .p{font-size:${u(0.034)};font-weight:500;color:#cfdcf0;line-height:1.6;margin-top:${u(0.022)}}
.cmp .vs{align-self:center;font-size:${u(0.05)};color:var(--hay);font-weight:900;flex:none}
/* 計算 */
.calc{display:flex;flex-direction:column;gap:${u(0.026)};width:100%}
.calc .r{display:flex;align-items:baseline;justify-content:space-between;gap:${u(0.04)};font-size:${u(0.05)};color:var(--off);border-bottom:2px solid var(--line);padding-bottom:${u(0.02)}}
.calc .r.on{color:#fff}
.calc .r b{font-size:${u(0.062)};color:var(--off);white-space:nowrap}
.calc .r.on b{color:var(--hay)}
.calc .r.res{border-bottom:none;background:var(--card);border-radius:${u(0.02)};padding:${u(0.03)} ${u(0.035)}}
.calc .r.res b{font-size:${u(0.09)}}
/* 輪 */
.web{display:flex;flex-wrap:wrap;gap:${u(0.022)};width:100%;align-items:center}
.web .c{font-size:${u(0.062)};font-weight:900;color:#12203f;background:var(--hay);border-radius:999px;padding:${u(0.024)} ${u(0.045)}}
.web .i{font-size:${u(0.046)};background:var(--card);border:3px solid var(--line);border-radius:999px;padding:${u(0.02)} ${u(0.038)};color:var(--off)}
.web .i.on{color:#fff;border-color:var(--hay)}
/* 下 */
.foot{display:flex;align-items:center;gap:${u(0.018)};font-size:${u(0.025)};color:var(--dim);font-weight:500}
.foot img{width:${u(0.058)};height:${u(0.058)};border-radius:50%;object-fit:cover}
.foot b{color:#dde6f5;font-weight:700}
.foot .r{margin-left:auto;letter-spacing:.06em}
/* 章の見出し */
.eye{justify-content:center;align-items:flex-start}
.eyeno{font-size:${u(0.036)};color:var(--hay);letter-spacing:.24em}
.eyeh{font-size:${u(0.118)};font-weight:900;line-height:1.32;width:12.5em;margin-top:${u(0.03)}}
.rule{width:${u(0.14)};height:${u(0.008)};background:var(--hay);margin-top:${u(0.045)};border-radius:999px}
/* 表紙・締め */
.cover{background:linear-gradient(160deg,#22407c 0%,#0b1730 72%)}
.ct{font-size:${u(0.1)};font-weight:900;line-height:1.36;width:14.5em;margin-top:${u(0.03)}}
.cp{display:flex;flex-direction:column;gap:${u(0.018)};margin-top:${u(0.05)}}
.cp > span{font-size:inherit;color:#cfdcf0;font-weight:500;padding-left:${u(0.045)};position:relative;line-height:1.45}
.cp > span:before{content:"";position:absolute;left:${u(0.012)};top:.58em;width:${u(0.014)};height:${u(0.014)};border-radius:50%;background:var(--hay)}
.mark{display:flex;align-items:center;gap:${u(0.018)};font-size:${u(0.028)};color:var(--hay);letter-spacing:.14em}
.mark img{width:${u(0.07)};height:${u(0.07)};border-radius:50%;object-fit:cover}
.url{font-size:${u(0.042)};color:var(--hay);font-weight:700;margin-top:${u(0.028)}}
.endh{font-size:${u(0.082)};font-weight:900;line-height:1.42;width:14.5em;margin-top:${u(0.03)}}
.endn{font-size:${u(0.036)};color:#cfdcf0;font-weight:500;margin-top:${u(0.04)};line-height:1.7;width:24em}
`.replace('linear-gradient(90deg,#e0a800 css,var(--hay))', 'linear-gradient(90deg,#e0a800,var(--hay))')

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
      return `<span class="tag m">${esc(s.who)}</span><div class="quote">${s.lines.slice(0, k + 1).map((l) => `<div>${jp(l)}</div>`).join('')}</div>`
    case 'point':
      return `${T}<div class="big">${jp(s.big)}</div>${s.sub && k >= 1 ? `<div class="sub">${jp(s.sub)}</div>` : ''}`
    case 'note':
      return `<span class="tag m">ただし</span><div class="big" style="font-size:${u(0.082)}">${jp(s.big)}</div>${s.sub && k >= 1 ? `<div class="sub">${jp(s.sub)}</div>` : ''}`
    case 'quote':
      return `<div class="quote">${jp(s.text)}</div><div class="by">── ${esc(s.who)}</div>`
    case 'insight':
      return `<div class="insight">${jp(s.text)}<small>── ${esc(s.who)}</small></div>`
    case 'term':
      return `<span class="tag">ことば</span><div class="term">${esc(s.term)}</div>${k >= 1 ? `<div class="termd">${jp(s.desc)}</div>` : ''}`
    case 'stat':
      return `<div class="stat"><b>${esc(s.value)}</b><i>${esc(s.unit)}</i></div>${
        k >= 1 ? `<div class="statl">${jp(s.label)}</div>${s.sub ? `<div class="sub">${jp(s.sub)}</div>` : ''}` : ''
      }`
    case 'list':
      return s.grid
        ? `${T}<div class="grid">${s.items.map((x) => `<span>${esc(x)}</span>`).join('')}</div>${s.note ? `<div class="sub">${jp(s.note)}</div>` : ''}`
        : `${T}<ul class="ul" style="font-size:${u(
            fitRatio(s.items, { maxH: H * (s.note ? 0.44 : 0.56), maxW: CONTENT_W, base: 0.056, indent: 0.055 }),
          )}">${s.items.map((x, i) => `<li class="${on(k, i)}">${jp(x)}</li>`).join('')}</ul>${s.note ? `<div class="sub">${jp(s.note)}</div>` : ''}`
    case 'check':
      return `${T}<div class="ck">${s.items.map((x, i) => `<div class="${on(k, i)}"><b>✓</b><span>${jp(x)}</span></div>`).join('')}</div>`
    case 'steps':
      return `${T}<div class="stp">${s.items
        .map((x, i) => `${i ? `<b class="${on(k, i)}">→</b>` : ''}<span class="${on(k, i)}">${esc(x)}</span>`)
        .join('')}</div>${s.note ? `<div class="sub">${jp(s.note)}</div>` : ''}`
    case 'bars':
      return `${T}<div class="bars">${s.items
        .map((x, i) => `<div class="row ${on(k, i)}"><span class="lb">${esc(x.label)}</span><span class="tr"><i style="width:${i <= k ? Math.round(x.v * 100) : 0}%"></i></span></div>`)
        .join('')}</div>${s.note ? `<div class="sub">${jp(s.note)}</div>` : ''}`
    case 'timeline':
      return `${T}<div class="tl">${s.items
        .map((x, i) => `${i ? `<span class="seg ${on(k, i)}"></span>` : ''}<span class="n ${on(k, i)}"><span class="dot"></span><span>${esc(x)}</span></span>`)
        .join('')}</div>${s.tail ? `<div class="tlend ${k >= s.items.length - 1 ? '' : 'hidden'}" style="opacity:${k >= s.items.length - 1 ? 1 : 0}">${esc(s.tail)}</div>` : ''}`
    case 'compare':
      return `${T}<div class="cmp"><div class="c ${on(k, 0)}"><div class="m">${esc(s.left.mark ?? '')}</div><div class="h">${jp(s.left.h)}</div>${s.left.t ? `<div class="p">${jp(s.left.t)}</div>` : ''}</div>
        <div class="vs">${esc(s.vs ?? 'VS')}</div>
        <div class="c ${on(k, 1)}"><div class="m">${esc(s.right.mark ?? '')}</div><div class="h">${jp(s.right.h)}</div>${s.right.t ? `<div class="p">${jp(s.right.t)}</div>` : ''}</div></div>`
    case 'balance':
      return `${T}<div class="cmp"><div class="c ${on(k, 0)}"><div class="h">${jp(s.left.h)}</div><div class="p">${jp(s.left.t)}</div></div>
        <div class="vs">⇄</div>
        <div class="c ${on(k, 1)}"><div class="h">${jp(s.right.h)}</div><div class="p">${jp(s.right.t)}</div></div></div>`
    case 'calc':
      return `${T}<div class="calc">${s.rows.map((r, i) => `<div class="r ${on(k, i)}"><span>${jp(r.l)}</span><b>${esc(r.r)}</b></div>`).join('')}
        <div class="r res ${on(k, s.rows.length)}"><span>${jp(s.result.l)}</span><b>${esc(s.result.r)}</b></div></div>`
    case 'web':
      return `${T}<div class="web"><span class="c">${esc(s.center)}</span>${s.items.map((x, i) => `<span class="i ${on(k, i)}">${esc(x)}</span>`).join('')}</div>`
    case 'summary':
      return `<span class="tag">この回の要点</span><ul class="ul" style="font-size:${u(
        fitRatio(s.items, { maxH: H * 0.6, maxW: CONTENT_W, base: 0.05, indent: 0.055 }),
      )}">${s.items.map((x, i) => `<li class="${on(k, i)}">${jp(x)}</li>`).join('')}</ul>`
    default:
      return `<div class="big">${esc(s?.big ?? '')}</div>`
  }
}

function frame(f, prog) {
  if (f.type === 'cover') {
    return `<div class="s cover"><div class="mark">${portrait ? `<img src="${portrait}" alt="">` : ''}川上牧場 酪農データバンク</div>
      <div class="mid"><div class="ct">${jp(title)}</div>
      <div class="cp" style="font-size:${u(
        fitRatio(points.slice(0, 3), { maxH: H * 0.3, maxW: CONTENT_W * 0.86, base: 0.041, gap: 0.018, indent: 0.045 }),
      )}">${points.slice(0, 3).map((p) => `<span>${jp(p)}</span>`).join('')}</div></div>
      ${footer(`${fmtDate(date)}の配信　全 ${plan.length} 章`)}</div>`
  }
  if (f.type === 'end') {
    // noteの有料記事になっている回は、データバンクに全文が無い＝「もっと詳しくはnoteで」と正直に案内する
    return `<div class="s cover"><div class="mark">${portrait ? `<img src="${portrait}" alt="">` : ''}川上牧場 酪農データバンク</div>
      <div class="mid"><div class="endh">この回の${ep.notePaid ? '要点' : '全文'}・用語・質問は、<br>データバンクで読めます。</div>
      <div class="url">kawakamidairyfarm-png.github.io/izumo-agri-portal/e/${esc(epId)}/</div>
      <div class="endn">牛乳のこと、牛のこと、酪農家になる道のこと。2019年からの配信を、言葉で探せます。質問は公式LINEへ。${
        ep.notePaid ? `<br><b>もっと詳しくは、noteの記事で${ep.notePrice ? `（${ep.notePrice.toLocaleString()}円）` : ''}。note.com/kawakamifarm</b>` : ''
      }</div></div>
      ${footer(ep.notePaid ? 'データバンクは登録もお金も要りません' : '登録もお金も要りません')}</div>`
  }
  const h = head(f.ci, prog)
  const ft = footer(fmtDate(date))
  if (f.type === 'eyecatch') {
    // 章の見出しは pody の章から。無い回は、その章の最初の言葉で代える（空の扉を出さない）
    const first = plan[f.ci]?.find((x) => x.big || x.title || x.text)
    const heading = f.matome
      ? 'まとめ'
      : body[f.ci]?.heading || first?.big || first?.title || first?.text || title
    return `<div class="s">${h}<div class="mid eye"><div class="eyeno">${f.matome ? 'MATOME' : `CHAPTER ${String(f.ci + 1).padStart(2, '0')}`}</div>
      <div class="eyeh">${jp(heading)}</div><div class="rule"></div></div>${ft}</div>`
  }
  return `<div class="s">${h}<div class="mid">${inner(f)}</div>${ft}</div>`
}

/* 1枚を長く映しっぱなしにしない。長い枚は同じ絵のまま分け、上の帯だけ進める
 * （台本の枚数が少ない回でも、画面が止まって見えないように） */
const MAX_HOLD = 7
const shots = []
for (const f of frames) {
  const parts = Math.max(1, Math.ceil(f.dur / MAX_HOLD))
  for (let i = 0; i < parts; i++) shots.push({ ...f, dur: f.dur / parts })
}

/* ---------- 焼く ---------- */
await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const files = []
let t = 0
const totalBody = bounds.length ? bounds[bounds.length - 1].to - bounds[0].from : audioEnd
for (let i = 0; !THUMB_ONLY && i < shots.length; i++) {
  const f = shots[i]
  await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>${frame(f, Math.min(1, t / (totalBody || 1)))}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  const file = path.join(OUT, `f-${String(i).padStart(4, '0')}.png`)
  await page.screenshot({ path: file })
  files.push(file)
  if (f.type !== 'cover' && f.type !== 'end') t += f.dur
}

/* ---------- サムネイル（1280×720） ----------
 * YouTubeのサムネイルの作法を調べて作った（LOCUS「YouTubeサムネイル完全攻略ガイド」ほか）:
 *   ・文字は多くて20字・ねらいは6〜10字（スマホでは約1/9の大きさに縮む）
 *   ・太いゴシック体。地と文字は「座布団（背景色）」で分ける
 *   ・Zの法則＝一番伝えたい言葉は左上に置く
 *   ・右下には再生時間の黒い帯が乗るので、文字も顔も置かない
 *   ・色はベース・メイン・アクセントの3色まで。地と文字の明度差を強く
 *   ・人の顔（表情）が入るとクリックされやすい
 *   ・ロゴの位置・色・書体は毎回同じにする（チャンネルの見た目を揃える）
 *   ・煽らない＝配信で話した範囲の言葉だけ使う
 * 台本（plans/<key>.json）に "thumb" があればそれを使う。手で書いた言葉が一番強い。
 *   "thumb": { "kicker": "…", "lines": ["…","…"], "hit": "強調する語", "sub": "…" }
 */
/* 題名から、サムネイルに出す1〜2行を作る。
 * 決まりごとは画面の折り返しと同じ＝「言葉の途中で折らない」（上の canBreak を使う）。
 * 折れるところが無ければ、1行のまま小さくする（中途半端に切った行は出さない）。
 */
/** 題名から、サムネイルの芯になる一文を取る（問いがあれば問いを優先する） */
function thumbCore(t) {
  const s = String(t)
    .replace(/[【】]/g, '・') // 副題の囲みは切れ目として扱う
    .replace(/[“”"「」『』]/g, '') // 引用の記号は落とす
    .replace(/・+/g, '・')
    .trim()
  const qi = s.search(/[？?]/)
  if (qi >= 0) {
    // 問いの終わりから、切れ目ごとに頭を落としていく。20字に収まるうちで一番長いものを採る
    const cand = []
    for (let c = s.slice(0, qi + 1); c; ) {
      if (c.length <= 20) cand.push(c)
      const cut = Math.max(...['、', '・', '。', '！', '!'].map((x) => c.lastIndexOf(x)))
      if (cut < 0) break
      c = c.slice(cut + 1)
    }
    const pick = cand.find((c) => c.length >= 8) ?? cand[0]
    if (pick && pick.length >= 4) return pick
    // 切れ目が無くて長いときは、問いの終わりから折れるところまでを取る（頭を落とす＝言葉は途中で切らない）
    const c = s.slice(0, qi + 1)
    for (let n = 14; n >= 8; n--) {
      const i = c.length - n
      if (i > 0 && canBreak(c, i) && !PARTICLE.includes(c[i])) return c.slice(i)
    }
  }
  const parts = s.split(/[。、・／｜─！!]/).map((x) => x.trim()).filter(Boolean)
  const first = parts.find((x) => x.length >= 6) ?? parts[0] ?? s
  if (first.length <= 20) return first
  for (let i = 20; i >= 8; i--) if (canBreak(first, i)) return first.slice(0, i)
  return first.slice(0, 20)
}
function autoThumbLines(t) {
  const s = thumbCore(t)
  if (s.length <= 11) return [s.replace(/[、・―—–－\s]+$/, '')]
  let best = null
  for (let i = 3; i <= s.length - 3; i++) {
    if (i > 12 || s.length - i > 12) continue
    if (!canBreak(s, i)) continue
    let score = -Math.abs(i - (s.length - i))
    if (PARTICLE.includes(s[i - 1])) score += 4
    if ('、・'.includes(s[i - 1])) score += 9
    if ('kKn'.includes(CLS(s[i]))) score += 3 // 次の行が漢字・カタカナ・数字で始まると、語の頭に見える
    if (PARTICLE.includes(s[i])) score -= 5 // 行の頭が助詞になるのは避ける
    if (!best || score > best.score) best = { score, i }
  }
  if (!best) return [s] // 折れるところが無ければ1行のまま（小さくなっても、切れた言葉は出さない）
  return [s.slice(0, best.i).replace(/[、・―—–－\s]+$/, ''), s.slice(best.i)]
}
const thumb = planThumb ?? {}
const tLines = (Array.isArray(thumb.lines) ? thumb.lines : thumb.lines ? [thumb.lines] : autoThumbLines(title))
  .map((l) => String(l).trim())
  .filter(Boolean)
  .slice(0, 2)
const HIT = /(更新率|乳量|長生き|牛乳|原価|子牛|飼料|繁殖|資金|給食|バター|乳価|乳脂肪|一番大変|堆肥|研修|非農家|乳房炎)/
let hitRe = thumb.hit ? new RegExp(`(${thumb.hit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`) : HIT
// 決め打ちの語が無い回は、一番長い漢字のかたまりを金色にする（1語も光らない絵にしない）
if (!thumb.hit && !tLines.some((l) => HIT.test(l))) {
  const runs = tLines.flatMap((l) => l.match(/[\u4e00-\u9fff々]{2,}/g) ?? [])
  const top = runs.sort((a, b) => b.length - a.length)[0]
  if (top) hitRe = new RegExp(`(${top})`)
}
let hitDone = false
// 1行に収まる字数から大きさを決める。顔にかからない幅までに収める（体の上は縁取りで読める）
const tf = Math.round(
  Math.min(
    tLines.length === 1 ? 158 : 138,
    ...tLines.map((l, i) => (portrait && tLines.length > 1 && i === 0 ? 820 : portrait && tLines.length === 1 ? 1100 : 1150) / Math.max(5, l.length)),
  ),
)
const autoSub = String(points[0] ?? '').split(/[。、（(]/)[0]
const tSub = thumb.sub ?? (autoSub && autoSub.length <= 18 ? autoSub : '')
const tKick = thumb.kicker ?? '出雲の酪農家が答える'
await page.setViewportSize({ width: 1280, height: 720 })
/* 色は「背景・文字・差し色」の3色だけ。地と文字の明度差は極端につける。
 * 調べた結論（サムネAI「配色パターン10選」ほか）:
 *   ・解説・教育で効くのは 紺×白×オレンジ／黒×白×金／白×黒×赤
 *   ・似た色どうし（深緑に淡い金、灰に白、パステル同士）は、きれいでも埋もれる＝いちばんの失敗
 *   ・差し色は彩度の高いものを1色だけ。3色を超えると視線が散る
 *   ・スマホで小さく見て、色の差が分かるかで決める
 */
const THEMES = {
  紺: { bg1: '#22407c', bg2: '#0b1730', ink: '#08122a', fg: '#ffffff', ac: '#ffd11a', acInk: '#132349', subBg: '#08122aeb', dim: '#c6d6f2', halo: 'rgba(150,190,255,.30)', grade: 'saturate(1.04) contrast(1.07) brightness(1.07)' },
  黒: { bg1: '#2c2c31', bg2: '#08080a', ink: '#000000', fg: '#ffffff', ac: '#ffd700', acInk: '#141414', subBg: '#000000eb', dim: '#d2d2d2', halo: 'rgba(255,225,150,.22)', grade: 'saturate(1.05) contrast(1.09) brightness(1.08)' },
  白: { bg1: '#ffffff', bg2: '#efe9dc', ink: '#ffffff', fg: '#14161a', ac: '#e0301e', acInk: '#ffffff', subBg: '#14161a', subFg: '#ffffff', dim: '#5d6066', halo: 'rgba(255,255,255,.65)', grade: 'saturate(1.06) contrast(1.05) brightness(1.02)' },
}
// 2026-09-19 使用者の裁定: 紺で通す。回ごとに変えず、チャンネルの見た目を揃える
const TH = THEMES[args.get('thumb-theme') ?? '紺'] ?? THEMES['紺']
/** 文字のまわりの縁取り（16方向）。写真の上に字が乗るところで効く */
const stroke = (px, c) =>
  Array.from({ length: 16 }, (_, i) => {
    const r = (i * Math.PI) / 8
    return `${(Math.cos(r) * px).toFixed(1)}px ${(Math.sin(r) * px).toFixed(1)}px 0 ${c}`
  }).join(',')
// 見出しは太い見出し書体で。取れないときは Noto Sans JP の一番太いものに落ちる
const HEADFONT = "'Zen Kaku Gothic New','Noto Sans JP','Noto Sans CJK JP',sans-serif"
/** 1行ぶんの組み（縁取りの層と、色の層を重ねる＝差し色の字にも縁が付く） */
const hlHtml = (l) => {
  let h = esc(l)
  if (!hitDone && hitRe.test(h)) {
    h = h.replace(hitRe, '<em>$1</em>')
    hitDone = true
  }
  return `<div class="tw-hl"><i class="tw-o">${h}</i><i class="tw-t">${h}</i></div>`
}
await page.setContent(
  `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700;900&display=block">
<style>${css}
html,body{width:1280px;height:720px}
.tw{position:absolute;inset:0;overflow:hidden;
  background:radial-gradient(460px 480px at 80% 34%, ${TH.halo}, transparent 68%),
             linear-gradient(160deg,${TH.bg1} 0%,${TH.bg2} 72%)}
/* 右に上半身。左のふちだけ地にとけこませる（覆いをかぶせると縦の線が出る） */
.tw-ph{position:absolute;right:0;top:0;width:640px;height:720px;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.25) 22%,rgba(0,0,0,.86) 48%,#000 68%);
  mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.25) 22%,rgba(0,0,0,.86) 48%,#000 68%)}
.tw-ph img{position:absolute;height:930px;left:-216px;top:-150px;max-width:none;filter:${TH.grade}}
.tw-vig{position:absolute;left:0;right:0;bottom:0;height:200px;
  background:linear-gradient(0deg,${TH.bg2} 0%,transparent 100%)}
/* 名乗りの帯＝毎回おなじ位置・おなじ色 */
.tw-kick{position:absolute;left:52px;top:46px;background:${TH.ac};padding:12px 24px}
.tw-kick span{display:block;color:${TH.acInk};font-size:30px;font-weight:900;letter-spacing:.14em}
.tw-mid{position:absolute;left:52px;right:40px;top:150px;bottom:142px;
  display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.tw-hl{position:relative;display:block;font-family:${HEADFONT};font-weight:900;font-size:${tf}px;
  line-height:1.2;letter-spacing:-.008em}
.tw-hl + .tw-hl{margin-top:8px}
.tw-hl i{font-style:normal;display:block;white-space:nowrap}
.tw-o{position:absolute;left:0;top:0;color:${TH.ink};text-shadow:${stroke(5, TH.ink)}}
.tw-t{position:relative;color:${TH.fg}}
.tw-t em{font-style:normal;color:${TH.ac}}
.tw-sub{margin-top:24px;display:inline-flex;align-items:center;background:${TH.subBg};
  border-left:9px solid ${TH.ac};color:${TH.subFg ?? TH.fg};
  font-size:32px;font-weight:700;letter-spacing:.02em;padding:10px 22px 10px 16px}
.tw-brand{position:absolute;left:54px;bottom:44px;display:flex;align-items:center;gap:12px;
  font-size:25px;font-weight:700;color:${TH.dim};letter-spacing:.05em}
.tw-brand i{display:block;width:12px;height:12px;border-radius:50%;background:${TH.ac}}
</style></head><body><div class="tw">
${portrait ? `<div class="tw-ph"><img src="${portrait}" alt=""></div>` : ''}
<div class="tw-vig"></div>
<div class="tw-kick"><span>${esc(tKick)}</span></div>
<div class="tw-mid">
${tLines.map(hlHtml).join('\n')}
${tSub ? `<div class="tw-sub">${esc(tSub)}</div>` : ''}
</div>
<div class="tw-brand"><i></i>川上牧場 酪農データバンク</div>
</div></body></html>`,
  { waitUntil: 'networkidle' },
)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: path.join(OUT, 'thumbnail.png') })
await browser.close()
if (THUMB_ONLY) {
  console.log(`サムネイル: ${path.join(OUT, 'thumbnail.png')}（文字 ${tLines.join('／')}＝${tLines.join('').length}字）`)
  process.exit(0)
}

const list = files.map((f, i) => `file '${f}'\nduration ${shots[i].dur.toFixed(3)}`).join('\n') + `\nfile '${files[files.length - 1]}'\n`
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
    `この回の${ep.notePaid ? '要点' : '全文'}・用語・質問　${SITE}e/${epId}/`,
    ...(ep.notePaid && ep.noteUrl
      ? [`もっと詳しく読む（noteの記事${ep.notePrice ? `・${ep.notePrice.toLocaleString()}円` : ''}）　${ep.noteUrl}`]
      : []),
    `酪農のことば帖　${SITE}terms/`,
    `届いた質問と、答えた回　${SITE}questions/`,
    '',
    '牛乳のこと、牛のこと、酪農家になる道のこと。出雲の酪農家が、隠さず話します。',
    '島根県出雲市・川上牧場　川上哲也',
  ].join('\n'),
)

const totalSec = shots.reduce((a, b) => a + b.dur, 0)
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
