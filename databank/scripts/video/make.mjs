#!/usr/bin/env node
/**
 * 配信1回分を、学習教材の動画（mp4）にする。
 *
 *   node scripts/video/make.mjs --key 2026-09-16_x5564f57.txt --out out/ \
 *        [--audio ep.mp3] [--chapters 427,499,…] [--duration 1925] [--size 1920x1080] [--frames-only]
 *
 * 材料はすべて手元にあるもの: data/transcripts の全文（pody の章・用語・ひとこと・まとめの印）と、
 * pody の章ごとの再生位置（秒）。声は配信そのもの。話し手を増やさない。
 *
 * 画面の作り（教育系の動画を調べて決めた形）:
 *   - 1画面1メッセージ。文は 1行16字・2行まで。話の速さ（実測 約4字/秒）に合わせて画面が5〜8秒で変わる
 *   - 章の変わり目に見出しの画面。上の帯に「第N章／全M章」と進み具合のバー
 *   - 用語・ひとこと・質問・まとめは、それぞれ専用の画面で出す
 *   - ことば帖（data/terms.json）にある言葉と数字は、文の中で色を変えて拾えるようにする
 *   - 本編の前の雑談は落とし、最初の章から始める（--full で落とさない）
 *
 * --frames-only  画像だけ作って動画にしない（見た目の確認用）
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
const FRAMES_ONLY = args.has('frames-only')
const FULL = args.has('full')
const [W, H] = (args.get('size') ?? '1920x1080').split('x').map(Number)
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const FFPROBE = process.env.FFPROBE || FFMPEG.replace(/ffmpeg$/, 'ffprobe')
const require = createRequire(process.env.PLAYWRIGHT_DIR ? path.join(process.env.PLAYWRIGHT_DIR, 'package.json') : import.meta.url)
const { chromium } = require('playwright')

const COVER = 5 // 表紙（音声より前・無音）
const END = 8 // 締め（音声より後・無音）
const MIN_CUE = 2.0
const MAX_CUE = 12
const EYECATCH = 2.6

/* ---------- 材料 ---------- */
const episodes = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'episodes.json'), 'utf8'))
const km = /^(\d{4}-\d{2}-\d{2})_([0-9a-z]{8})/.exec(KEY)
const ep = episodes.find((e) => e.date === km?.[1] && e.driveId.startsWith(km?.[2] ?? '\0'))
/**
 * 自動文字起こしの固有名詞の取り違えを、画面に出す前に直す。
 * 話の中身は変えない。直すのは「明らかに聞き間違いで、本人の言葉ではない綴り」だけ
 * （サイトの検索が 楽能→酪農 を吸収しているのと同じ考え方。src/lib/search.ts）。
 */
const ASR_FIX = [
  [/ポポポ/g, 'Pody'],
  [/楽能|落脳|楽農/g, '酪農'],
  [/乳腺炎|入房院|乳房園/g, '乳房炎'],
]
const text = ASR_FIX.reduce((s, [re, to]) => s.replace(re, to), await fs.readFile(path.join(ROOT, 'data', 'transcripts', KEY), 'utf8'))
const title = ep?.title ?? KEY
const date = ep?.date ?? km?.[1] ?? ''
const epId = ep ? `${ep.date}_${ep.driveId.slice(0, 8)}` : KEY.replace(/\.txt$/, '')

/** 強調する言葉（ことば帖にある用語）。短すぎる語は拾いすぎるので3字から */
let vocab = []
try {
  const rows = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'terms.json'), 'utf8'))
  vocab = [...new Set(rows.map((r) => r.term))].filter((t) => t.length >= 3 && t.length <= 12).sort((a, b) => b.length - a.length)
} catch {
  /* 索引がまだ無ければ強調しないだけ */
}

/** 写真（丸く小さく出す） */
const dataUri = async (name) => {
  try {
    return `data:image/jpeg;base64,${(await fs.readFile(path.join(ROOT, 'data', 'photos', name))).toString('base64')}`
  } catch {
    return ''
  }
}
const portrait = await dataUri('about.jpg')

/* ---------- 全文を章に分ける ---------- */
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
  const split = (s) => (s.includes('｜') ? { who: s.slice(0, s.indexOf('｜')).trim(), t: s.slice(s.indexOf('｜') + 1).trim() } : { who: '', t: s.trim() })
  if (!mm) cur.blocks.push({ kind: 'p', t: l })
  else if (mm[1] === '%%') cur.blocks.push({ kind: 'term', ...split(mm[2]) })
  else if (mm[1] === '!!') cur.blocks.push({ kind: 'insight', ...split(mm[2]) })
  else if (mm[1] === '??') cur.blocks.push({ kind: 'question', ...split(mm[2]) })
  else if (mm[1] === '--') cur.blocks.push({ kind: 'point', t: mm[2].trim() })
  else cur.blocks.push({ kind: 'p', ...split(mm[2]) })
}
const summaryCh = chapters.find((c) => /^まとめ/.test(c.heading))
const body = chapters.filter((c) => c !== summaryCh)
const points = summaryCh?.blocks.filter((b) => b.kind === 'point').map((b) => b.t) ?? []

/* ---------- 文を「1画面ぶん」に割る（1行16字・2行まで＝32字） ---------- */
const MAXC = 32
/** 括弧の中の句読点では切らない（「〜ですか。」が途中で割れて意味が壊れるのを防ぐ） */
function pieces(s, marks) {
  const out = []
  let depth = 0
  let buf = ''
  for (const ch of s) {
    buf += ch
    if ('「『（(【'.includes(ch)) depth++
    else if ('」』）)】'.includes(ch)) depth = Math.max(0, depth - 1)
    // 括弧が閉じていない文（文字起こしではよくある）で切れなくならないよう、長くなったら括弧の中でも切る
    else if (marks.includes(ch) && (depth === 0 || buf.length > 60)) {
      out.push(buf)
      buf = ''
      depth = 0
    }
  }
  if (buf) out.push(buf)
  return out
}
function cut(s) {
  const out = []
  const push = (piece) => {
    const last = out[out.length - 1]
    // 短すぎるかけらは前にくっつける（1文ずつ刻むとリズムが壊れる）
    if (last && (last.length < 14 || piece.length < 10) && last.length + piece.length <= MAXC) out[out.length - 1] = last + piece
    else out.push(piece)
  }
  for (const sentence of pieces(s, '。！？').map((x) => x.trim()).filter(Boolean)) {
    if (sentence.length <= MAXC) {
      push(sentence)
      continue
    }
    // 長い文は読点で割る。それでも長ければ字数で切る
    let buf = ''
    for (const part of pieces(sentence, '、，')) {
      if (buf && buf.length + part.length > MAXC) {
        push(buf)
        buf = ''
      }
      if (part.length > MAXC) {
        if (buf) {
          push(buf)
          buf = ''
        }
        // 読点でも割れない長い塊は、均等に分ける（末尾に「す。」のようなかけらを残さない）
        const n = Math.ceil(part.length / MAXC)
        const size = Math.ceil(part.length / n)
        let at = 0
        while (at < part.length) {
          let to = Math.min(part.length, at + size)
          // 英数字の途中では切らない（Pody が Pod／y に割れないように）
          while (to > at + 4 && to < part.length && /[0-9A-Za-z]/.test(part[to - 1]) && /[0-9A-Za-z]/.test(part[to])) to--
          push(part.slice(at, to))
          at = to
        }
        continue
      }
      buf += part
    }
    if (buf) push(buf)
  }
  return out.length ? out : [s]
}

/* ---------- 画面の並びを作る ---------- */
const cues = []
body.forEach((c, ci) => {
  cues.push({ ch: ci, kind: 'eyecatch', heading: c.heading, w: 0 })
  for (const b of c.blocks) {
    if (b.kind === 'term') cues.push({ ch: ci, kind: 'term', who: b.who, t: b.t, w: Math.max(40, b.t.length * 0.6) })
    else if (b.kind === 'insight') cues.push({ ch: ci, kind: 'insight', who: b.who || '川上', t: b.t, w: Math.max(36, b.t.length) })
    else if (b.kind === 'question') cues.push({ ch: ci, kind: 'question', who: b.who, t: b.t, w: Math.max(36, b.t.length) })
    else for (const t of cut(b.t)) cues.push({ ch: ci, kind: 'line', t, w: t.length })
  }
})
// まとめは最後の章の持ち時間の中で、1つずつ積み上げて出す
if (points.length) {
  const last = body.length - 1
  cues.push({ ch: last, kind: 'eyecatch', heading: 'まとめ', w: 0 })
  points.forEach((_, i) => cues.push({ ch: last, kind: 'points', upto: i + 1, w: Math.max(40, points[i].length) }))
}

/* ---------- 時間割（章の頭は pody の秒に必ず合わせる） ---------- */
const audioStart = FULL || !CHAPTERS.length ? 0 : CHAPTERS[0]
let audioEnd = Number(args.get('duration') ?? 0)
if (!audioEnd && AUDIO) audioEnd = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', AUDIO]).toString().trim())
if (!audioEnd) throw new Error('--duration か --audio が要ります')
const bounds = body.map((_, i) => ({
  from: CHAPTERS[i] ?? audioStart,
  to: i + 1 < body.length ? (CHAPTERS[i + 1] ?? audioEnd) : audioEnd,
}))
for (let i = 0; i < cues.length; i++) cues[i].i = i
for (let ci = 0; ci < body.length; ci++) {
  const mine = cues.filter((c) => c.ch === ci)
  const budget = Math.max(6, bounds[ci].to - bounds[ci].from)
  const eyes = mine.filter((c) => c.kind === 'eyecatch')
  const rest = mine.filter((c) => c.kind !== 'eyecatch')
  const eye = Math.min(EYECATCH, budget / (eyes.length * 4 || 1))
  eyes.forEach((c) => (c.dur = eye))
  let pool = budget - eye * eyes.length
  const total = rest.reduce((a, b) => a + b.w, 0) || 1
  rest.forEach((c) => (c.dur = (pool * c.w) / total))
  // 短すぎ・長すぎを均す（章の合計は動かさない）
  for (let pass = 0; pass < 3; pass++) {
    const fixed = rest.filter((c) => c.dur <= MIN_CUE || c.dur >= MAX_CUE)
    const free = rest.filter((c) => !fixed.includes(c))
    if (!fixed.length || !free.length) break
    fixed.forEach((c) => (c.dur = Math.min(MAX_CUE, Math.max(MIN_CUE, c.dur))))
    const left = pool - fixed.reduce((a, b) => a + b.dur, 0)
    const fw = free.reduce((a, b) => a + b.w, 0) || 1
    free.forEach((c) => (c.dur = (left * c.w) / fw))
  }
  // 端数は章の最後の画面で吸収する（次の章の頭がずれないように）
  const diff = budget - mine.reduce((a, b) => a + b.dur, 0)
  mine[mine.length - 1].dur += diff
}
cues.unshift({ kind: 'cover', dur: COVER })
cues.push({ kind: 'end', dur: END })

/* ---------- 画面の絵 ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fmtDate = (iso) => {
  const [y, mo, d] = iso.split('-')
  return y ? `${y}年${Number(mo)}月${Number(d)}日` : ''
}
const NUM = /([0-9０-９]+(?:[.．][0-9０-９]+)?(?:[%％]|円|頭|年|か月|ヶ月|日|産|回|倍|kg|キロ|万|億|割))/g
/** 文の中の「ことば帖の用語」と「数字」に色をつける（1画面に3つまで） */
function mark(s) {
  let n = 0
  const hits = []
  for (const v of vocab) {
    if (n >= 2) break
    const at = s.indexOf(v)
    if (at < 0 || hits.some((h) => at < h.end && at + v.length > h.at)) continue
    hits.push({ at, end: at + v.length })
    n++
  }
  let out = ''
  let p = 0
  for (const h of hits.sort((a, b) => a.at - b.at)) {
    out += esc(s.slice(p, h.at)).replace(NUM, '<u>$1</u>') + `<em>${esc(s.slice(h.at, h.end))}</em>`
    p = h.end
  }
  out += esc(s.slice(p)).replace(NUM, '<u>$1</u>')
  return out
}

const u = (r) => `${Math.round(H * r)}px`
const css = `
${process.env.FONT_CSS ? await fs.readFile(process.env.FONT_CSS, 'utf8') : ''}
:root{--bg:#0f1a10;--bg2:#16261a;--line:#2b402e;--fg:#ffffff;--dim:#9db09c;--hay:#f2cf7a;--hay2:#ffe6a8;--moss:#7fae84}
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg);color:var(--fg);
  font-family:"Noto Sans JP","Noto Sans CJK JP","IPAPGothic",sans-serif;font-weight:700;-webkit-font-smoothing:antialiased}
.s{position:absolute;inset:0;display:flex;flex-direction:column;padding:${u(0.055)} ${u(0.072)}}
/* 上の帯: 章と進み具合 */
.bar{display:flex;align-items:center;gap:${u(0.022)};font-size:${u(0.026)};color:var(--dim);letter-spacing:.08em}
.bar .no{color:var(--hay);white-space:nowrap}
.bar .hd{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:500}
.prog{height:${u(0.006)};background:var(--line);border-radius:999px;margin-top:${u(0.022)};overflow:hidden}
.prog i{display:block;height:100%;background:var(--hay);border-radius:999px}
/* 真ん中 */
.mid{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.line{font-size:${u(0.082)};font-weight:900;line-height:1.55;width:16.2em;letter-spacing:.01em}
.line em{font-style:normal;color:var(--hay)}
.line u{text-decoration:none;color:var(--hay2)}
.tag{display:inline-block;font-size:${u(0.028)};letter-spacing:.18em;color:var(--bg);background:var(--hay);
  padding:${u(0.009)} ${u(0.02)};border-radius:${u(0.008)};margin-bottom:${u(0.03)}}
.tag.q{background:var(--moss);color:#0b1410}
.term{font-size:${u(0.105)};font-weight:900;color:var(--hay)}
.termd{font-size:${u(0.05)};font-weight:500;line-height:1.7;color:#e8efe6;width:22em;margin-top:${u(0.028)}}
.quote{font-size:${u(0.078)};font-weight:900;line-height:1.6;width:17em;border-left:${u(0.012)} solid var(--hay);padding-left:${u(0.04)}}
.by{font-size:${u(0.032)};color:var(--hay);margin-top:${u(0.03)};font-weight:700}
ul{list-style:none;display:flex;flex-direction:column;gap:${u(0.028)};width:100%}
li{font-size:${u(0.05)};line-height:1.5;padding-left:${u(0.07)};position:relative;color:#5d6f5e;font-weight:700}
li.on{color:#fff}
li b{position:absolute;left:0;top:0;color:var(--line);font-size:${u(0.05)}}
li.on b{color:var(--hay)}
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
.cover{background:linear-gradient(160deg,#16261a 0%,#0c150d 70%)}
.ct{font-size:${u(0.086)};font-weight:900;line-height:1.4;width:17em;margin-top:${u(0.03)}}
.cp{display:flex;flex-direction:column;gap:${u(0.018)};margin-top:${u(0.05)}}
.cp span{font-size:${u(0.036)};color:#cfdccd;font-weight:500;padding-left:${u(0.045)};position:relative;line-height:1.45}
.cp span:before{content:"";position:absolute;left:${u(0.012)};top:.58em;width:${u(0.014)};height:${u(0.014)};border-radius:50%;background:var(--hay)}
.mark{display:flex;align-items:center;gap:${u(0.018)};font-size:${u(0.028)};color:var(--hay);letter-spacing:.14em}
.mark img{width:${u(0.07)};height:${u(0.07)};border-radius:50%;object-fit:cover}
.url{font-size:${u(0.042)};color:var(--hay);font-weight:700;margin-top:${u(0.028)};letter-spacing:.01em}
.endh{font-size:${u(0.072)};font-weight:900;line-height:1.45;width:16em;margin-top:${u(0.03)}}
.endn{font-size:${u(0.032)};color:#cfdccd;font-weight:500;margin-top:${u(0.04)};line-height:1.7;width:26em}
`

const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const footer = (right) => `<div class="foot">${portrait ? `<img src="${portrait}" alt="">` : ''}<span><b>川上哲也</b>　島根県出雲市・川上牧場</span><span class="r">${esc(right)}</span></div>`
const head = (ci, prog) =>
  `<div class="bar"><span class="no">第 ${ci + 1} 章 ／ ${body.length}</span><span class="hd">${esc(short(body[ci].heading, 30))}</span></div>
   <div class="prog"><i style="width:${(prog * 100).toFixed(1)}%"></i></div>`

function frame(c, prog) {
  if (c.kind === 'cover') {
    return `<div class="s cover"><div class="mark">${portrait ? `<img src="${portrait}" alt="">` : ''}川上牧場 酪農データバンク</div>
      <div class="mid"><div class="ct">${esc(title)}</div>
      <div class="cp">${points.slice(0, 3).map((p) => `<span>${esc(short(p, 40))}</span>`).join('')}</div></div>
      ${footer(`${fmtDate(date)}の配信　全 ${body.length} 章`)}</div>`
  }
  if (c.kind === 'end') {
    return `<div class="s cover"><div class="mark">${portrait ? `<img src="${portrait}" alt="">` : ''}川上牧場 酪農データバンク</div>
      <div class="mid"><div class="endh">この回の全文・用語・質問は、<br>データバンクで読めます。</div>
      <div class="url">kawakamidairyfarm-png.github.io/izumo-agri-portal/e/${esc(epId)}/</div>
      <div class="endn">牛乳のこと、牛のこと、酪農家になる道のこと。2019年からの配信 ${episodes.length} 回を、言葉で探せます。質問は公式LINEへ。</div></div>
      ${footer('登録もお金も要りません')}</div>`
  }
  const h = head(c.ch, prog)
  const f = footer(fmtDate(date))
  if (c.kind === 'eyecatch') {
    return `<div class="s">${h}<div class="mid eye"><div class="eyeno">${c.heading === 'まとめ' ? 'MATOME' : `CHAPTER ${String(c.ch + 1).padStart(2, '0')}`}</div>
      <div class="eyeh">${esc(c.heading)}</div><div class="rule"></div></div>${f}</div>`
  }
  if (c.kind === 'term') {
    return `<div class="s">${h}<div class="mid"><span class="tag">ことば</span>
      <div class="term">${esc(c.who || '用語')}</div><div class="termd">${esc(c.t)}</div></div>${f}</div>`
  }
  if (c.kind === 'insight') {
    return `<div class="s">${h}<div class="mid"><div class="quote">${esc(c.t)}</div><div class="by">── ${esc(c.who)}</div></div>${f}</div>`
  }
  if (c.kind === 'question') {
    return `<div class="s">${h}<div class="mid"><span class="tag q">牧場に届いた質問</span><div class="quote">${esc(c.t)}</div>${c.who ? `<div class="by">${esc(c.who)} さんより</div>` : ''}</div>${f}</div>`
  }
  if (c.kind === 'points') {
    return `<div class="s">${h}<div class="mid"><span class="tag">この回の要点</span><ul>${points
      .map((p, i) => `<li class="${i < c.upto ? 'on' : ''}"><b>${String(i + 1).padStart(2, '0')}</b>${esc(p)}</li>`)
      .join('')}</ul></div>${f}</div>`
  }
  return `<div class="s">${h}<div class="mid"><div class="line">${mark(c.t)}</div></div>${f}</div>`
}

/* ---------- 焼く ---------- */
await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const files = []
let t = 0
const totalBody = bounds.length ? bounds[bounds.length - 1].to - bounds[0].from : audioEnd
for (let i = 0; i < cues.length; i++) {
  const c = cues[i]
  const prog = Math.min(1, Math.max(0, t / (totalBody || 1)))
  await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}</style></head><body>${frame(c, prog)}</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  const f = path.join(OUT, `f-${String(i).padStart(4, '0')}.png`)
  await page.screenshot({ path: f })
  files.push(f)
  if (c.kind !== 'cover' && c.kind !== 'end') t += c.dur
}
// サムネイル（YouTube 用・1280×720）。題名の「問い」の部分だけを大きく出す
const thumbTitle = (/^(.{4,24}?[？?])/.exec(title)?.[1] ?? title.split(/[。、]/)[0]).slice(0, 26)
// 1行に収まるなら大きく、無理なら2行に収まる大きさへ（文字が欠けたり1字だけ余ったりしないように）
const tf = Math.round(Math.min(116, 1130 / Math.max(6, thumbTitle.length <= 13 ? thumbTitle.length : Math.ceil(thumbTitle.length / 2))))
await page.setViewportSize({ width: 1280, height: 720 })
await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${css}
html,body{width:1280px;height:720px}
.tw{position:absolute;inset:0;background:linear-gradient(150deg,#16261a,#0b140c);padding:60px 68px;display:flex;flex-direction:column;justify-content:center}
.tw .k{font-size:32px;color:#f2cf7a;letter-spacing:.2em}
.tw h1{font-size:${tf}px;font-weight:900;line-height:1.3;margin-top:20px;width:1130px}
.tw h1 em{font-style:normal;color:#f2cf7a}
.tw .s{position:static;display:block;padding:0;font-size:36px;color:#cfdccd;font-weight:700;margin-top:34px;letter-spacing:.04em}
.tw .b{position:absolute;right:60px;bottom:52px;display:flex;align-items:center;gap:18px;font-size:29px;color:#cfdccd}
.tw .b img{width:104px;height:104px;border-radius:50%;object-fit:cover;border:5px solid #f2cf7a}
</style></head><body><div class="tw"><div class="k">出雲の酪農家が答える</div>
<h1>${esc(thumbTitle).replace(/(更新率|乳量|長生き|牛乳|原価|子牛|飼料|繁殖|資金|給食|バター)/, '<em>$1</em>')}</h1>
<div class="s">${esc(short(points[0] ?? `配信 ${fmtDate(date)}`, 26))}</div>
<div class="b">${portrait ? `<img src="${portrait}" alt="">` : ''}<span>川上牧場 酪農データバンク</span></div></div></body></html>`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: path.join(OUT, 'thumbnail.png') })
await browser.close()

const list = files.map((f, i) => `file '${f}'\nduration ${cues[i].dur.toFixed(3)}`).join('\n') + `\nfile '${files[files.length - 1]}'\n`
await fs.writeFile(path.join(OUT, 'list.txt'), list)

// YouTube の説明欄（章の時刻は、前置きを落としたあとの動画の時刻で書く）
const mmss = (s) => {
  const t = Math.max(0, Math.round(s))
  const h = Math.floor(t / 3600)
  const r = `${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
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
    ...body.map((c, i) => `${mmss(COVER + (bounds[i].from - audioStart))} ${c.heading}`),
    '',
    `この回の全文・用語・質問　${SITE}e/${epId}/`,
    `酪農のことば帖　${SITE}terms/`,
    `届いた質問と、答えた回　${SITE}questions/`,
    '',
    '牛乳のこと、牛のこと、酪農家になる道のこと。出雲の酪農家が、隠さず話します。',
    '島根県出雲市・川上牧場　川上哲也',
  ].join('\n'),
)
const totalSec = cues.reduce((a, b) => a + b.dur, 0)
console.log(`画面 ${files.length} 枚・${Math.round(totalSec)} 秒（本編 ${Math.round(audioStart)}秒〜${Math.round(audioEnd)}秒${FULL ? '' : '＝前置きの雑談は落とした'}）`)
console.log(`1枚あたり ${(totalSec / files.length).toFixed(1)} 秒`)
if (FRAMES_ONLY) process.exit(0)

const out = path.join(OUT, `${KEY.replace(/\.txt$/, '')}.mp4`)
const aArgs = AUDIO
  ? ['-ss', String(audioStart), '-i', AUDIO, '-af', `adelay=${COVER * 1000}|${COVER * 1000},apad`]
  : ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo']
execFileSync(
  FFMPEG,
  ['-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'list.txt'), ...aArgs,
    '-c:v', 'libx264', '-r', '25', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k',
    '-t', totalSec.toFixed(3), out],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)
console.log(`書き出し: ${out}`)
