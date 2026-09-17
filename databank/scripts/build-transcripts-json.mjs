// 全文をまとめた JSON を public/ に生成する（検索のときだけ1回だけ読む・JSモジュールより軽い）
// あわせて、全文の「## まとめ」から要旨の一文を抜き出した data/summaries.json も作る。
// 一覧や絞り込みで「要約つき」として扱うための軽い索引（要点は記事ページで全文から読む）。
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, '..', 'data', 'transcripts')
const out = join(here, '..', 'public', 'transcripts-all.json')
const summariesOut = join(here, '..', 'data', 'summaries.json')

/** 「## まとめ」の節から要旨（印の無い最初の行）を返す。無ければ空文字（src/lib/transcript.ts の extractSummary と同じ規則） */
function abstractOf(text) {
  const at = text.indexOf('\n## まとめ')
  if (at < 0) return ''
  const lines = text.slice(at).split(/\n/).map((l) => l.trim()).filter(Boolean)
  lines.shift()
  for (const l of lines) {
    if (l.startsWith('## ')) break
    if (!/^(>>|\?\?|!!|%%|--)\s/.test(l)) return l
  }
  return ''
}

const all = {}
const summaries = {}
for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
  all[f] = readFileSync(join(dir, f), 'utf8')
  const a = abstractOf(all[f])
  if (a) summaries[f] = a
}
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(all))
writeFileSync(summariesOut, JSON.stringify(summaries, null, 1) + '\n')
console.log(`transcripts-all.json: ${Object.keys(all).length} files, ${(Buffer.byteLength(JSON.stringify(all)) / 1024).toFixed(0)} KB`)
console.log(`summaries.json: ${Object.keys(summaries).length} 回にまとめの要旨`)
