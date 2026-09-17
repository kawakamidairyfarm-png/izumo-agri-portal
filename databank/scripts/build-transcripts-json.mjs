// 全文をまとめた JSON を public/ に生成する（検索のときだけ1回だけ読む・JSモジュールより軽い）
//
// あわせて、全文の行頭の印から3つの軽い索引を data/ に作る（印の一覧は src/lib/transcript.ts）:
//   summaries.json  「## まとめ」の要旨の一文（本文ファイル名→一文）。一覧や絞り込みで「要約つき」として扱う
//   questions.json  「?? 質問」と、その直後に答えた発言。届いた質問の索引（/questions）
//   terms.json      「%% 用語｜説明」。配信で出てきたことばの帖（/terms）
// 質問した人の名前は索引には入れない（回のページでは pody の記事どおり出る）。
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, '..', 'data', 'transcripts')
const out = join(here, '..', 'public', 'transcripts-all.json')
const dataDir = join(here, '..', 'data')

const MARK = /^(##|>>|\?\?|!!|%%|--)\s+/
/** 「名前｜本文」の本文だけ */
const after = (s) => (s.includes('｜') ? s.slice(s.indexOf('｜') + 1) : s).trim()

/** 「## まとめ」の節から要旨（印の無い最初の行）を返す。無ければ空文字（src/lib/transcript.ts の extractSummary と同じ規則） */
function abstractOf(text) {
  const at = text.indexOf('\n## まとめ')
  if (at < 0) return ''
  const lines = text.slice(at).split(/\n/).map((l) => l.trim()).filter(Boolean)
  lines.shift()
  for (const l of lines) {
    if (l.startsWith('## ')) break
    if (!MARK.test(l)) return l
  }
  return ''
}

/** 「?? 質問」と、その直後の答え（次の質問か見出しまでの発言・段落を 300 字まで） */
function questionsOf(text) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)
  const qs = []
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('?? ')) continue
    const q = after(lines[i].slice(3))
    const parts = []
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j]
      if (l.startsWith('?? ') || l.startsWith('## ')) break
      if (l.startsWith('>> ')) parts.push(after(l.slice(3)))
      else if (!MARK.test(l)) parts.push(l)
      if (parts.join('').length >= 300) break
    }
    const a = parts.join(' ').replace(/\s+/g, ' ').trim()
    if (q) qs.push({ q, a: a.length > 300 ? a.slice(0, 299) + '…' : a })
  }
  return qs
}

/** 「%% 用語｜説明」。文になっている見出し（長い・句点あり）は用語ではないので外す */
function termsOf(text) {
  const ts = []
  for (const l of text.split(/\n/)) {
    const m = /^%%\s+([^｜]{1,20})｜(.+)$/.exec(l.trim())
    if (!m) continue
    const term = m[1].trim()
    if (term.includes('。')) continue
    ts.push({ term, text: m[2].trim() })
  }
  return ts
}

const all = {}
const summaries = {}
const questions = []
const terms = []
for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
  const text = readFileSync(join(dir, f), 'utf8')
  all[f] = text
  const a = abstractOf(text)
  if (a) summaries[f] = a
  for (const q of questionsOf(text)) questions.push({ ...q, key: f })
  for (const t of termsOf(text)) terms.push({ ...t, key: f })
}
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(all))
writeFileSync(join(dataDir, 'summaries.json'), JSON.stringify(summaries, null, 1) + '\n')
writeFileSync(join(dataDir, 'questions.json'), JSON.stringify(questions, null, 1) + '\n')
writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(terms, null, 1) + '\n')
console.log(`transcripts-all.json: ${Object.keys(all).length} files, ${(Buffer.byteLength(JSON.stringify(all)) / 1024).toFixed(0)} KB`)
console.log(`summaries.json: ${Object.keys(summaries).length} 回にまとめの要旨 / questions.json: ${questions.length} 問 / terms.json: ${terms.length} 語（${new Set(terms.map((t) => t.term)).size} 種）`)
