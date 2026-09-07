#!/usr/bin/env node
/**
 * 新しい配信を取り込む（inbox フォルダ ＋ note の新着記事）
 *
 * 使い方:
 *   node scripts/ingest.mjs               inbox と note の新着を両方取り込む
 *   node scripts/ingest.mjs --no-note     inbox だけ
 *   node scripts/ingest.mjs --no-inbox    note だけ
 *   node scripts/ingest.mjs --dry-run     何を取り込むかを表示するだけで、ファイルは変えない
 *   node scripts/ingest.mjs --full        note の全記事を見直す（通常は既知の記事に当たった時点で止める）
 *
 * 1. inbox/ の使い方
 *    databank/inbox/ に「YYYYMMDD_タイトル.txt」という名前で文字起こしを置く。
 *    先頭に次のような行を書くと、その情報も登録される（無くてもよい）:
 *      note: https://note.com/kawakamifarm/n/xxxx
 *      youtube: https://youtu.be/xxxx
 *      spotify: https://open.spotify.com/episode/xxxx
 *      日付: 2026-09-07        （ファイル名に日付が無いとき）
 *      タイトル: 〇〇について   （ファイル名にタイトルが無いとき）
 *    取り込んだファイルは inbox から消え、data/transcripts/ に移る。
 *
 * 2. note の新着
 *    note の公開 API から新しい記事を探し、無料記事なら本文を全文として取り込む。
 *    有料記事（価格つき・メンバーシップ限定・Farmers Voices）は本文を取り込まず、
 *    data/note_paid.json に登録して「noteの有料記事」として案内だけ出す。
 *    note の API から返る本文は「その人が無料で読める範囲」だけなので、
 *    有料部分がサイトに載ることは仕組み上ない。
 *
 * 環境変数:
 *   NOTE_CREATOR   note のユーザー名（既定: kawakamifarm）
 *   NOTE_API_BASE  note API のベース URL（テスト用。既定: https://note.com）
 */

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const INBOX = path.join(ROOT, 'inbox')
const TRANSCRIPTS = path.join(DATA, 'transcripts')
const PRIVATE = path.join(DATA, 'transcripts_private')
const EPISODES_JSON = path.join(DATA, 'episodes.json')
const PAID_JSON = path.join(DATA, 'note_paid.json')

const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry-run')
const DO_INBOX = !args.has('--no-inbox')
const DO_NOTE = !args.has('--no-note')
const FULL = args.has('--full')
const CREATOR = process.env.NOTE_CREATOR || 'kawakamifarm'
const API_BASE = (process.env.NOTE_API_BASE || 'https://note.com').replace(/\/$/, '')

/** タイトルから有料と判断するパターン（利用者の方針: Farmers Voices は全て有料） */
const PAID_TITLE_RE = /(?:famars|farmers)\s*voices|【後半有料】|【有料】/i

const report = { added: [], bodies: [], paid: [], updated: [], skipped: [], warnings: [] }

// ---------- 小道具 ----------

function normalizeTitle(t) {
  return t
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[“”"「」『』!！?？・:：、。…—─―]/g, '')
    .toLowerCase()
}

function noteKeyOf(url) {
  const m = String(url).match(/note\.com\/[^/]+\/n\/(n[0-9a-f]+)/)
  return m ? m[1] : null
}

function cleanNoteUrl(url) {
  const key = noteKeyOf(url)
  return key ? `https://note.com/${CREATOR}/n/${key}` : String(url).split('?')[0]
}

/** note の記事は記事キー、それ以外は日付+タイトルのハッシュを driveId 代わりの ID にする */
function syntheticId(date, title, noteUrl) {
  const key = noteUrl && noteKeyOf(noteUrl)
  if (key) return key
  return 'x' + createHash('sha1').update(`${date}|${normalizeTitle(title)}`).digest('hex').slice(0, 15)
}

function toJstDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–' }
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

/** note の本文 HTML を、サイトで使う素のテキストにする */
export function htmlToText(html) {
  let s = String(html)
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<\/(p|div|h[1-6]|li|blockquote|tr|figure|figcaption|section)>/gi, '\n')
  s = s.replace(/<li[^>]*>/gi, '・')
  s = s.replace(/<[^>]+>/g, '')
  s = decodeEntities(s)
  s = s.replace(/ /g, ' ')
  s = s
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/g, '').replace(/^[ \t]+/g, ''))
    .join('\n')
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s + '\n'
}

async function readJson(p, fallback) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'))
  } catch (e) {
    if (e.code === 'ENOENT' && fallback !== undefined) return fallback
    throw e
  }
}

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function writeText(p, text) {
  if (DRY) return
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, text, 'utf8')
}

// ---------- 索引の操作 ----------

class Index {
  constructor(entries, paid) {
    this.entries = entries
    this.paid = paid
    this.byNote = new Map()
    this.byDateTitle = new Map()
    for (const e of entries) this.#track(e)
  }
  #track(e) {
    if (e.noteUrl) this.byNote.set(cleanNoteUrl(e.noteUrl), e)
    this.byDateTitle.set(`${e.date}|${normalizeTitle(e.title)}`, e)
  }
  find({ date, title, noteUrl }) {
    if (noteUrl && this.byNote.has(cleanNoteUrl(noteUrl))) return this.byNote.get(cleanNoteUrl(noteUrl))
    if (date && title) return this.byDateTitle.get(`${date}|${normalizeTitle(title)}`) ?? null
    return null
  }
  idOf(e) {
    return `${e.date}_${e.driveId.slice(0, 8)}`
  }
  isPaid(noteUrl) {
    return Boolean(noteUrl && this.paid[cleanNoteUrl(noteUrl)])
  }
  markPaid(noteUrl, info) {
    const url = cleanNoteUrl(noteUrl)
    if (this.paid[url]) return false
    this.paid[url] = info
    return true
  }
  /** 既存があれば URL を補い、無ければ追加する。戻り値は [entry, isNew] */
  upsert({ date, title, noteUrl, youtubeUrl, spotifyUrl, source, bytes }) {
    let e = this.find({ date, title, noteUrl })
    let isNew = false
    if (!e) {
      e = { date, title, driveId: syntheticId(date, title, noteUrl), bytes: bytes ?? 0, source }
      this.entries.push(e)
      this.#track(e)
      isNew = true
    }
    let changed = false
    for (const [k, v] of [
      ['noteUrl', noteUrl && cleanNoteUrl(noteUrl)],
      ['youtubeUrl', youtubeUrl],
      ['spotifyUrl', spotifyUrl],
    ]) {
      if (v && !e[k]) {
        e[k] = v
        changed = true
        if (k === 'noteUrl') this.byNote.set(v, e)
      }
    }
    if (bytes && !e.bytes) e.bytes = bytes
    return [e, isNew, changed]
  }
  sorted() {
    return [...this.entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }
}

async function transcriptExists(id) {
  return (await exists(path.join(TRANSCRIPTS, `${id}.txt`))) || (await exists(path.join(PRIVATE, `${id}.txt`)))
}

/** 本文を保存する。有料の回は公開ビルドに入らない transcripts_private/ に置く */
async function saveBody(index, entry, text, { paid, label }) {
  const id = index.idOf(entry)
  if (await transcriptExists(id)) {
    report.skipped.push(`${label}: 本文は登録済み（${id}）`)
    return false
  }
  const dir = paid ? PRIVATE : TRANSCRIPTS
  await writeText(path.join(dir, `${id}.txt`), text)
  if (paid) report.warnings.push(`${label}: 有料記事の回なので本文は非公開フォルダ（data/transcripts_private/）に保存しました`)
  else report.bodies.push(`${label} → ${path.relative(ROOT, path.join(dir, `${id}.txt`))}`)
  entry.bytes = entry.bytes || Buffer.byteLength(text, 'utf8')
  return true
}

// ---------- 1. inbox ----------

const NAME_RE = /^(\d{4})[-_]?(\d{2})[-_]?(\d{2})[_\s-]*(.*?)(?:\s*\(\d+\))?\.(?:txt|md)$/i
const HEADER_RE = /^(note|youtube|spotify|drive|date|日付|title|タイトル)\s*[:：]\s*(.+?)\s*$/i

function parseInboxFile(name, raw) {
  const meta = {}
  const m = name.match(NAME_RE)
  if (m) {
    meta.date = `${m[1]}-${m[2]}-${m[3]}`
    meta.title = m[4].trim()
  }
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/)
  let i = 0
  for (; i < Math.min(lines.length, 12); i++) {
    const line = lines[i].trim()
    if (line === '') {
      if (i === 0 || Object.keys(meta).length > 0) continue
      break
    }
    const h = line.match(HEADER_RE)
    if (!h) break
    const key = h[1].toLowerCase()
    const val = h[2]
    if (key === 'note') meta.noteUrl = val
    else if (key === 'youtube') meta.youtubeUrl = val
    else if (key === 'spotify') meta.spotifyUrl = val
    else if (key === 'drive') meta.driveId = val
    else if (key === 'date' || key === '日付') meta.date = val.replace(/[./年月]/g, '-').replace(/日$/, '').replace(/-+$/, '')
    else if (key === 'title' || key === 'タイトル') meta.title = val
  }
  // 見出し行の直後の空行を飛ばす
  while (i < lines.length && lines[i].trim() === '') i++
  meta.body = lines.slice(i).join('\n').trim() + '\n'
  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    const d = toJstDate(meta.date)
    meta.date = d
  }
  return meta
}

async function ingestInbox(index) {
  if (!(await exists(INBOX))) return
  const names = (await fs.readdir(INBOX)).filter((n) => /\.(txt|md)$/i.test(n) && !/^readme/i.test(n))
  for (const name of names.sort()) {
    const file = path.join(INBOX, name)
    const raw = await fs.readFile(file, 'utf8')
    const meta = parseInboxFile(name, raw)
    const label = `inbox/${name}`
    if (!meta.date || !meta.title) {
      report.warnings.push(`${label}: 日付かタイトルが分かりません。ファイル名を「20260907_タイトル.txt」の形にするか、先頭に「日付: 2026-09-07」「タイトル: ○○」の行を入れてください`)
      continue
    }
    if (meta.body.trim().length < 50) {
      report.warnings.push(`${label}: 本文が短すぎるので取り込みません（${meta.body.trim().length} 文字）`)
      continue
    }
    const [entry, isNew, changed] = index.upsert({ ...meta, source: 'inbox', bytes: Buffer.byteLength(meta.body, 'utf8') })
    if (meta.driveId && !isNew && entry.driveId.startsWith('x')) {
      // 合成 ID の回に本物の Drive ID が来ても、id が変わると URL が変わるので差し替えない
      report.skipped.push(`${label}: Drive ID は記録しません（既存の id を維持）`)
    }
    const paid = index.isPaid(entry.noteUrl) || PAID_TITLE_RE.test(entry.title)
    await saveBody(index, entry, meta.body, { paid, label })
    if (isNew) report.added.push(`${entry.date} ${entry.title}（${label}）`)
    else if (changed) report.updated.push(`${entry.date} ${entry.title}: リンクを追加`)
    if (!DRY) await fs.unlink(file)
  }
}

// ---------- 2. note の新着 ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** note に負担をかけないよう、1 リクエストずつ少し間を置き、20 秒で諦める */
async function fetchJson(url) {
  await sleep(400)
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'kawakami-databank-ingest/1.0 (+https://databank.kawakamifarm.net)' },
      signal: AbortSignal.timeout(20_000),
    })
    if (res.ok) return res.json()
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await sleep(3000 * attempt)
      continue
    }
    throw new Error(`HTTP ${res.status} ${url}`)
  }
}

/** note の記事一覧（新しい順）。ページごとに配列を返す非同期ジェネレータ */
async function* listNotes() {
  for (let page = 1; page <= 200; page++) {
    const json = await fetchJson(`${API_BASE}/api/v2/creators/${CREATOR}/contents?kind=note&page=${page}`)
    const contents = json?.data?.contents ?? []
    if (contents.length === 0) return
    yield contents
    if (json?.data?.isLastPage) return
  }
}

/** 記事一覧の 1 件から、サイトで使う形に整える */
function summarizeNote(c) {
  const key = c.key
  const url = `https://note.com/${CREATOR}/n/${key}`
  const price = Number(c.price ?? 0)
  const flags = Object.entries(c)
    .filter(([k, v]) => /limited|membership|paid|purchase|circle|magazine/i.test(k) && v && typeof v !== 'object')
    .map(([k, v]) => `${k}=${v}`)
  const limited = Boolean(c.isLimited || c.is_limited || c.isMembershipConnected || c.is_membership_connected)
  const date = toJstDate(c.publishAt ?? c.publish_at ?? c.createdAt ?? c.created_at)
  return { key, url, title: String(c.name ?? '').trim(), price, limited, flags, date, excerpt: c.body ?? '' }
}

async function fetchNoteBody(key) {
  const json = await fetchJson(`${API_BASE}/api/v3/notes/${key}`)
  const d = json?.data ?? {}
  return {
    html: d.body ?? '',
    price: Number(d.price ?? 0),
    limited: Boolean(d.isLimited || d.is_limited || d.isMembershipConnected || d.is_membership_connected),
    canRead: d.canRead ?? d.can_read ?? true,
    title: d.name,
    date: toJstDate(d.publishAt ?? d.publish_at),
  }
}

async function ingestNote(index) {
  let seenKnown = 0
  let looked = 0
  for await (const page of listNotes()) {
    for (const c of page) {
      const n = summarizeNote(c)
      looked++
      if (!n.key || !n.title || !n.date) {
        report.warnings.push(`note: 読めない項目をとばしました ${JSON.stringify(c).slice(0, 120)}`)
        continue
      }
      const known = index.find({ noteUrl: n.url })
      const knownHasBody = known ? await transcriptExists(index.idOf(known)) : false
      const knownPaid = index.isPaid(n.url)
      if (known && (knownHasBody || knownPaid)) {
        seenKnown++
        // 既知の記事が続いたら、それより古いものは取り込み済みとみなして止める
        if (!FULL && seenKnown >= 5) return
        continue
      }
      const label = `note ${n.date} ${n.title}`
      const paidByTitle = PAID_TITLE_RE.test(n.title)
      if (n.price > 0 || n.limited || paidByTitle) {
        const [entry, isNew] = index.upsert({ date: n.date, title: n.title, noteUrl: n.url, source: 'note' })
        if (index.markPaid(n.url, { title: n.title, date: n.date, price: n.price, note: n.price > 0 ? undefined : n.limited ? 'メンバーシップ限定' : 'タイトル判定' }))
          report.paid.push(`${label}（¥${n.price}${n.limited ? '・限定' : ''}${n.flags.length ? '・' + n.flags.join(',') : ''}）`)
        if (isNew) report.added.push(`${entry.date} ${entry.title}（note・有料）`)
        continue
      }
      // 無料記事: 本文を取りに行く
      let body
      try {
        body = await fetchNoteBody(n.key)
      } catch (e) {
        report.warnings.push(`${label}: 本文を取得できませんでした（${e.message}）。次回にやり直します`)
        continue
      }
      if (body.price > 0 || body.limited || body.canRead === false) {
        const [entry, isNew] = index.upsert({ date: n.date, title: n.title, noteUrl: n.url, source: 'note' })
        if (index.markPaid(n.url, { title: n.title, date: n.date, price: body.price, note: '本文APIの判定' })) report.paid.push(`${label}（本文API: ¥${body.price}）`)
        if (isNew) report.added.push(`${entry.date} ${entry.title}（note・有料）`)
        continue
      }
      const text = htmlToText(body.html)
      if (text.trim().length < 200) {
        report.warnings.push(`${label}: 本文が短すぎるので取り込みません（${text.trim().length} 文字）`)
        continue
      }
      const [entry, isNew, changed] = index.upsert({ date: n.date, title: n.title, noteUrl: n.url, source: 'note', bytes: Buffer.byteLength(text, 'utf8') })
      await saveBody(index, entry, text, { paid: false, label })
      if (isNew) report.added.push(`${entry.date} ${entry.title}（note・無料）`)
      else if (changed) report.updated.push(`${entry.date} ${entry.title}: note のリンクを追加`)
    }
  }
  if (looked === 0) report.warnings.push('note: 記事一覧が空でした（API の形式が変わった可能性）')
}

// ---------- main ----------

async function main() {
  const entries = await readJson(EPISODES_JSON)
  const paid = await readJson(PAID_JSON, {})
  const index = new Index(entries, paid)
  const before = JSON.stringify(index.sorted())
  const paidBefore = JSON.stringify(paid)

  if (DO_INBOX) await ingestInbox(index)
  if (DO_NOTE) {
    try {
      await ingestNote(index)
    } catch (e) {
      report.warnings.push(`note の新着確認に失敗しました: ${e.message}`)
    }
  }

  const after = index.sorted()
  if (!DRY) {
    if (JSON.stringify(after) !== before) await fs.writeFile(EPISODES_JSON, JSON.stringify(after, null, 2) + '\n', 'utf8')
    if (JSON.stringify(paid) !== paidBefore) await fs.writeFile(PAID_JSON, JSON.stringify(paid, null, 2) + '\n', 'utf8')
  }

  const lines = []
  const section = (title, items) => {
    if (items.length === 0) return
    lines.push(`### ${title}（${items.length}）`)
    for (const it of items) lines.push(`- ${it}`)
    lines.push('')
  }
  lines.push(DRY ? '## 取り込みの下見（--dry-run: ファイルは変えていません）' : '## 取り込み結果')
  lines.push('')
  section('新しく登録した配信', report.added)
  section('全文を取り込んだ回', report.bodies)
  section('有料記事として登録（本文なし）', report.paid)
  section('既存の回にリンクを追加', report.updated)
  section('見送り', report.skipped)
  section('確認してください', report.warnings)
  if (lines.length === 2) lines.push('新しいものはありませんでした。')
  const out = lines.join('\n')
  console.log(out)
  if (process.env.GITHUB_STEP_SUMMARY && !DRY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, out + '\n')
  if (process.env.GITHUB_STEP_SUMMARY && DRY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, out + '\n')
  const changed = report.added.length + report.bodies.length + report.paid.length + report.updated.length
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, `changed=${changed > 0 && !DRY ? 'true' : 'false'}\ncount=${changed}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
