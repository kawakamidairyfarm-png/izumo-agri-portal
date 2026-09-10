#!/usr/bin/env node
/**
 * 同じ回が「pody（配信日）」と「note（記事の公開日＝配信の 7〜8 週間後）」で二重に登録されているのをまとめる。
 * pody の初回取り込み（2026-09-10）で起きた重複の後始末。ingest.mjs は今は同じタイトルを 100 日以内で同じ回とみなすので、
 * 以後は二重にならない。
 *
 *   node scripts/dedupe-pody-note.mjs [--dry-run]
 *
 * まとめ方: 配信日のついた pody 側の回を残し、note の URL と本文（あれば）を移す。note の本文がある回は
 * pody の記事を note の本文で置き換える。有料 note の回は pody の記事を非公開フォルダへ移す。
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeTitle } from './ingest.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const TRANSCRIPTS = path.join(DATA, 'transcripts')
const PRIVATE = path.join(DATA, 'transcripts_private')
const DRY = process.argv.includes('--dry-run')
const WINDOW_DAYS = 100
const PAID_TITLE_RE = /(?:famars|farmers)\s*voices|【後半有料】|【有料】/i

const idOf = (e) => `${e.date}_${e.driveId.slice(0, 8)}`
const exists = (p) => fs.access(p).then(() => true, () => false)

const entries = JSON.parse(await fs.readFile(path.join(DATA, 'episodes.json'), 'utf8'))
const paid = JSON.parse(await fs.readFile(path.join(DATA, 'note_paid.json'), 'utf8'))

const groups = new Map()
for (const e of entries) {
  const k = normalizeTitle(e.title)
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(e)
}

const removed = new Set()
const log = []
for (const g of groups.values()) {
  if (g.length < 2) continue
  const podys = g.filter((e) => e.source === 'pody')
  const others = g.filter((e) => e.source !== 'pody')
  if (podys.length !== 1 || others.length !== 1) {
    log.push(`見送り（組み合わせが想定外）: ${g.map((e) => `${e.date}/${e.source}`).join(', ')} ${g[0].title}`)
    continue
  }
  const [p] = podys
  const [o] = others
  const gap = Math.abs(Date.parse(p.date) - Date.parse(o.date)) / 86400000
  if (gap > WINDOW_DAYS) {
    log.push(`見送り（${Math.round(gap)} 日離れている）: ${p.date} と ${o.date} ${p.title}`)
    continue
  }
  const pId = idOf(p)
  const oId = idOf(o)
  if (o.source === 'note') {
    // note の回を pody の回にまとめる
    for (const k of ['noteUrl', 'youtubeUrl', 'spotifyUrl', 'category']) if (o[k] && !p[k]) p[k] = o[k]
    const isPaid = Boolean(o.noteUrl && paid[o.noteUrl]) || PAID_TITLE_RE.test(o.title)
    const oPub = path.join(TRANSCRIPTS, `${oId}.txt`)
    const oPriv = path.join(PRIVATE, `${oId}.txt`)
    const pPub = path.join(TRANSCRIPTS, `${pId}.txt`)
    const pPriv = path.join(PRIVATE, `${pId}.txt`)
    if (await exists(oPub)) {
      // note の本文で pody の記事を置き換える
      const text = await fs.readFile(oPub, 'utf8')
      if (!DRY) {
        await fs.rm(pPub, { force: true })
        await fs.rm(pPriv, { force: true })
        await fs.writeFile(isPaid ? pPriv : pPub, text, 'utf8')
        await fs.rm(oPub)
      }
      p.bodySource = 'note'
      p.bytes = Buffer.byteLength(text, 'utf8')
      log.push(`まとめ（note の本文で置き換え${isPaid ? '・非公開' : ''}）: ${o.date} → ${p.date} ${p.title}`)
    } else if (await exists(oPriv)) {
      const text = await fs.readFile(oPriv, 'utf8')
      if (!DRY) {
        await fs.rm(pPub, { force: true })
        await fs.writeFile(pPriv, text, 'utf8')
        await fs.rm(oPriv)
      }
      p.bodySource = 'note'
      p.bytes = Buffer.byteLength(text, 'utf8')
      log.push(`まとめ（note の非公開本文を移動）: ${o.date} → ${p.date} ${p.title}`)
    } else if (isPaid && (await exists(pPub))) {
      if (!DRY) {
        await fs.mkdir(PRIVATE, { recursive: true })
        await fs.rename(pPub, pPriv)
      }
      log.push(`まとめ（有料の回なので pody の記事を非公開へ）: ${o.date} → ${p.date} ${p.title}`)
    } else {
      log.push(`まとめ（リンクだけ）: ${o.date} → ${p.date} ${p.title}`)
    }
    removed.add(o)
  } else {
    // Drive の文字起こし（root/archive）の回に pody のリンクを足し、pody 側は消す
    if (!o.podyUrl) o.podyUrl = p.podyUrl
    if (!DRY) {
      await fs.rm(path.join(TRANSCRIPTS, `${pId}.txt`), { force: true })
      await fs.rm(path.join(PRIVATE, `${pId}.txt`), { force: true })
    }
    log.push(`まとめ（${o.source} の回に pody のリンク）: ${p.date} → ${o.date} ${o.title}`)
    removed.add(p)
  }
}

const after = entries.filter((e) => !removed.has(e)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
if (!DRY) await fs.writeFile(path.join(DATA, 'episodes.json'), JSON.stringify(after, null, 2) + '\n', 'utf8')
console.log(log.join('\n'))
console.log(`\n${DRY ? '（下見）' : ''}${entries.length} 件 → ${after.length} 件（${removed.size} 件をまとめた）`)
