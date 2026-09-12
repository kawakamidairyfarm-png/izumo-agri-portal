#!/usr/bin/env node
/**
 * 題名の一部から、データバンクのページの住所を引く。
 * 毎週の「noteの人気記事3本」を公式LINEで案内するときに使う。
 *
 *   node scripts/find-url.mjs "モー" "飼料価格" "カゼイン"
 *   node scripts/find-url.mjs --json "モー"        機械で使う形で出す
 *
 * note のスクリーンショットは題名が「…」で切れていることが多いので、
 * 途中まででも引けるように、記号と空白を無視して部分一致で探す。
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE = (process.env.SITE_URL || 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/').replace(/\/?$/, '/')

const args = process.argv.slice(2)
const JSON_OUT = args.includes('--json')
const queries = args.filter((a) => a !== '--json')

if (queries.length === 0) {
  console.error('使い方: node scripts/find-url.mjs "題名の一部" ["題名の一部" ...]')
  process.exit(1)
}

/** 記号・空白・大文字小文字の違いを無視して比べる */
function norm(t) {
  return String(t)
    .normalize('NFKC')
    .replace(/[\s“”"「」『』（）()!！?？・:：、。，,…—─―\-‐'’]/g, '')
    .toLowerCase()
}

const index = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'episodes.json'), 'utf8'))
const paid = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'note_paid.json'), 'utf8'))
const articles = new Map()
const articleDir = path.join(ROOT, 'data', 'articles')
for (const f of (await fs.readdir(articleDir).catch(() => [])).filter((f) => f.endsWith('.json'))) {
  const a = JSON.parse(await fs.readFile(path.join(articleDir, f), 'utf8'))
  articles.set(a.driveId, a)
  articles.set(a.date + '|' + norm(a.title), a)
}

function idOf(e) {
  const a = articles.get(e.driveId) ?? articles.get(e.date + '|' + norm(e.title))
  return a?.id ?? `${e.date}_${e.driveId.slice(0, 8)}`
}

const results = []
for (const q of queries) {
  const key = norm(q)
  const hits = index
    .filter((e) => norm(e.title).includes(key))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e) => ({
      date: e.date,
      title: e.title,
      url: `${SITE}e/${idOf(e)}/`,
      noteUrl: e.noteUrl ?? null,
      paidNote: Boolean(e.noteUrl && paid[String(e.noteUrl).split('?')[0]]),
    }))
  results.push({ query: q, hits })
}

if (JSON_OUT) {
  console.log(JSON.stringify(results, null, 2))
} else {
  for (const { query, hits } of results) {
    console.log(`\n■ ${query}`)
    if (hits.length === 0) {
      console.log('  見つかりません。題名の別の一部で試してください。')
      continue
    }
    for (const h of hits) {
      console.log(`  ${h.date}  ${h.title}${h.paidNote ? '（noteは有料）' : ''}`)
      console.log(`  ${h.url}`)
    }
    if (hits.length > 1) console.log('  ※ 複数見つかりました。日付で選んでください。')
  }
  console.log()
}
