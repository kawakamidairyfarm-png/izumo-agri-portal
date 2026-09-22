// 回ごとのテーマ（小分類）を決めて data/topics.json に書く（prebuild）。
//
// 分け方は data/taxonomy.json。当てる文字は、題名・記事の札・全文の見出し（##）・ことば（%%）・
// 「## まとめ」の要旨・届いた質問（??）。題名に当たれば強く、本文に当たれば弱く数え、
// 合計が 2 以上の小分類を、多い順に最大 4 つまで採る（題名だけの回でも 1 つは付く）。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const DATA = join(here, '..', 'data')

const tax = JSON.parse(readFileSync(join(DATA, 'taxonomy.json'), 'utf8'))
const SUBS = tax.groups.flatMap((g) => g.subs.map((s) => ({ ...s, group: g.key, re: new RegExp(s.re, 'i') })))
const index = JSON.parse(readFileSync(join(DATA, 'episodes.json'), 'utf8'))
const articles = readdirSync(join(DATA, 'articles')).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(DATA, 'articles', f), 'utf8')))
const texts = new Map(readdirSync(join(DATA, 'transcripts')).filter((f) => f.endsWith('.txt')).map((f) => [f, readFileSync(join(DATA, 'transcripts', f), 'utf8')]))
const norm = (t) => String(t).normalize('NFKC').replace(/\s+/g, '').replace(/[“”"「」『』!！?？・:：、。…—─―]/g, '').toLowerCase()
const byDrive = new Map(articles.map((a) => [a.driveId, a]))
const byDateTitle = new Map(articles.map((a) => [a.date + '|' + norm(a.title), a]))

/** 本文から、テーマ判定に使う行だけを取り出す（見出し・ことば・要旨・質問） */
function signalsOf(text) {
  const out = []
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  let inMatome = false
  for (const l of lines) {
    if (l.startsWith('## ')) { inMatome = l.slice(3).trim() === 'まとめ'; out.push(l.slice(3)); continue }
    if (l.startsWith('%% ') || l.startsWith('?? ') || l.startsWith('-- ')) { out.push(l.slice(3)); continue }
    if (inMatome && !/^(>>|!!)/.test(l)) out.push(l)
  }
  return out.join('\n')
}
const count = (re, s) => (s.match(new RegExp(re.source, 'gi')) || []).length

const topics = {}
const per = {}
let none = 0
const seen = new Set()
for (const e of index) {
  const a = byDrive.get(e.driveId) ?? byDateTitle.get(e.date + '|' + norm(e.title)) ?? null
  const id = a?.id ?? `${e.date}_${e.driveId.slice(0, 8)}`
  if (seen.has(id)) continue
  seen.add(id)
  const title = (a?.title ?? e.title) + ' ' + (a?.tags ?? []).join(' ')
  const text = texts.get(a?.transcriptFile ?? '') ?? texts.get(`${id}.txt`) ?? ''
  const body = text ? signalsOf(text) : ''
  const scored = SUBS.map((s) => ({ key: s.key, score: count(s.re, title) * 3 + Math.min(6, count(s.re, body)) }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
  let keys = scored.slice(0, 4).map((x) => x.key)
  // 同じ大分類ばかりに偏らないよう、上位4つのうち大分類が同じものは2つまで
  const g = (k) => SUBS.find((s) => s.key === k).group
  keys = keys.filter((k, i) => keys.slice(0, i).filter((o) => g(o) === g(k)).length < 2)
  if (!keys.length) {
    const best = SUBS.map((s) => ({ key: s.key, score: count(s.re, title) })).sort((a, b) => b.score - a.score)[0]
    if (best.score > 0) keys = [best.key]
  }
  if (!keys.length) none++
  topics[id] = keys
  for (const k of keys) per[k] = (per[k] || 0) + 1
}
writeFileSync(join(DATA, 'topics.json'), JSON.stringify(topics, null, 0) + '\n')
console.log(`topics.json: ${Object.keys(topics).length} 回・テーマ無し ${none} 回`)
for (const gr of tax.groups) console.log(`  ${gr.label}: ` + gr.subs.map((s) => `${s.label}${per[s.key] || 0}`).join(' / '))
