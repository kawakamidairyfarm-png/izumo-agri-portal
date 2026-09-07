// 全文をまとめた JSON を public/ に生成する（検索のときだけ1回だけ読む・JSモジュールより軽い）
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const dir = join(here, '..', 'data', 'transcripts')
const out = join(here, '..', 'public', 'transcripts-all.json')
const all = {}
for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) all[f] = readFileSync(join(dir, f), 'utf8')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(all))
console.log(`transcripts-all.json: ${Object.keys(all).length} files, ${(Buffer.byteLength(JSON.stringify(all)) / 1024).toFixed(0)} KB`)
