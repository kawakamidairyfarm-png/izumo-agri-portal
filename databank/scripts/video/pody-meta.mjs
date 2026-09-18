#!/usr/bin/env node
/**
 * pody の再生ページから、動画づくりに要る2つを取り出す:
 *   - 配信音声（mp3）のURL   … ページに埋め込まれた anchor.fm（Spotify for Podcasters）のリンク
 *   - 章ごとの再生開始秒     … 章見出しの「MM:SS から再生する」ボタンの data-seconds
 *
 *   node scripts/video/pody-meta.mjs --key 2026-09-16_x5564f57.txt --out meta.json
 *
 * この環境（GitHub Actions）から取る。取り込み（ingest）と同じで、ページの形が変わったら壊れるので、
 * 取れなかった項目は正直に空で書き、呼び出し側で止める。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const args = new Map()
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args.set(process.argv[i].slice(2), process.argv[++i])
const KEY = args.get('key')
const OUT = args.get('out') ?? 'meta.json'
if (!KEY) throw new Error('--key が要ります')

const episodes = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'episodes.json'), 'utf8'))
const m = /^(\d{4}-\d{2}-\d{2})_([0-9a-z]{8})/.exec(KEY)
const ep = episodes.find((e) => e.date === m?.[1] && e.driveId.startsWith(m?.[2] ?? '\0'))
if (!ep?.podyUrl) throw new Error(`${KEY} に対応する pody の回が索引にありません`)

const res = await fetch(ep.podyUrl, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128 Safari/537.36' } })
if (!res.ok) throw new Error(`pody: HTTP ${res.status}`)
const html = await res.text()

/* 音声: anchor.fm のURL（HTML でも埋め込み JSON でも同じ文字列で出る） */
const audio = (html.match(/https:\/\/anchor\.fm\/s\/[A-Za-z0-9]+\/podcast\/play\/\d+\/[^"'\s<>\\]+/) ?? [])[0]?.replace(/\\u0026/g, '&') ?? ''

/* 章: <div class="chapter-head" id="section-N"> … data-seconds="427" … を、section の番号ごとに1つ */
const chapters = []
const seen = new Set()
for (const mm of html.matchAll(/class="chapter-head"[^>]*id="section-(\d+)"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?data-seconds="(\d+)"/g)) {
  const n = Number(mm[1])
  if (seen.has(n)) continue
  seen.add(n)
  chapters.push({ n, heading: mm[2].replace(/<[^>]+>/g, '').trim(), seconds: Number(mm[3]) })
}
chapters.sort((a, b) => a.n - b.n)

const meta = { key: KEY, id: ep.id ?? null, date: ep.date, title: ep.title, podyUrl: ep.podyUrl, audio, chapters }
await fs.writeFile(OUT, JSON.stringify(meta, null, 2) + '\n')
console.log(`${ep.date} ${ep.title}\n音声: ${audio ? 'あり' : '見つからず'} / 章: ${chapters.length}（${chapters.map((c) => c.seconds).join(',')}）`)
if (!audio || chapters.length === 0) process.exitCode = 2
