// 毎日のSNS自動投稿: 今日の1問を選び、SNSごとの文を作って dist/sns/today.json に書く（2026-10-04）
//
//   node scripts/sns/pick.mjs            … dist/qa.json と data/sns-posted.json を読む（先に npm run build）
//
// 選び方（上から順に）
//   1. 直近3日の配信で答えた、まだ投稿していない質問（いま話している話題＝配信・LIVEと同じ流れ）
//   2. 今月の季節の話題（data/sns-calendar.json）に合う、まだ投稿していない質問
//   3. まだ投稿していない質問を、日付で決まる順に（毎日同じ結果になる）
// 文は配信の記事の要約だけで作る。新しい答え・数字・あおる言葉は足さない（明鏡: 原稿の魂は自動化しない）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const SITE = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'
const LINE = 'https://line.me/R/ti/p/@imb8734o?ts=04142028&oat_content=url'

const qa = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'qa.json'), 'utf8'))
const readJson = (p, d) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : d)
const posted = readJson(path.join(root, 'data', 'sns-posted.json'), { posts: [] })
const calendar = readJson(path.join(root, 'data', 'sns-calendar.json'), {})

// 日本時間の今日
const now = new Date(Date.now() + 9 * 3600e3)
const today = now.toISOString().slice(0, 10)
const month = String(now.getUTCMonth() + 1)
const daysAgo = (d) => (Date.parse(today) - Date.parse(d)) / 864e5

const done = new Set(posted.posts.map((p) => p.id))
// 質問カードと同じ条件: 答えの要約に川上さんの答えが入っていて、質問の形の文
// SNSでは質問が一目で読めることが大事なので、60字までの質問だけ（長い感想・前置きつきの質問は外す）
const ok = qa.filter((x) => x.a && x.q.length <= 60 && /川上さん|酪農家/.test(x.a.slice(0, 160)) && /[？?]|ですか|ますか|でしょうか/.test(x.q))
const left = ok.filter((x) => !done.has(x.id))

const season = calendar[month] ?? []
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const pick =
  left.find((x) => daysAgo(x.episode.date) <= 3) ??
  left.filter((x) => x.topics.some((t) => season.some((w) => t.includes(w))))[0] ??
  [...left].sort((a, b) => hash(today + a.id) - hash(today + b.id))[0]

const outDir = path.join(root, 'dist', 'sns')
fs.mkdirSync(outDir, { recursive: true })
if (!pick) {
  fs.writeFileSync(path.join(outDir, 'today.json'), JSON.stringify({ date: today, pick: null }) + '\n')
  console.log('投稿する質問が残っていません（全部投稿済み）')
  process.exit(0)
}

/** 答えの要約を文の切れ目で短くする（max 字まで・最低1文） */
function shorten(a, max) {
  const s = (String(a).replace(/\s+/g, ' ').match(/[^。！？]+[。！？]?/g) ?? []).map((x) => x.trim()).filter(Boolean)
  const out = []
  for (const x of s) {
    if (out.join('').length + x.length > max && out.length) break
    out.push(x)
  }
  return out.join('')
}
const fmt = (d) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`
const url = (src) => `${SITE}q/${pick.id}/?utm_source=${src}`
const tags = ['#酪農', '#牛乳', '#牛乳のなぜ', '#川上牧場', '#出雲市']

const text = {
  // Instagram: 画像3枚（質問・答え・案内）。本文のリンクは押せないので、プロフィールへ案内する
  instagram: [
    '牧場に届いた質問です。',
    '',
    `「${pick.q}」`,
    '',
    '配信で答えたこと（要約）',
    shorten(pick.a, 140),
    '',
    `答えの続きと、${fmt(pick.episode.date)}の配信「${pick.episode.title}」は、プロフィールのリンク（酪農データバンク）から。`,
    '牛乳や牛の「なぜ？」は、公式LINEで受け付けています。',
    '',
    tags.join(' '),
  ].join('\n'),
  // Facebook: リンクが押せるので、質問のページへ直接
  facebook: [
    `牧場に届いた質問「${pick.q}」`,
    '',
    '配信で答えたこと（要約）',
    shorten(pick.a, 160),
    '',
    `答えの続きと、答えた配信（${fmt(pick.episode.date)}）はこちら`,
    url('facebook'),
  ].join('\n'),
  // Threads: 会話の口調で短く。リンクは押せる（500字まで）
  threads: [`牧場に届いた質問。「${pick.q}」`, '', `（配信の要約）${shorten(pick.a, 120)}`, '', `続きと、答えた配信 → ${url('threads')}`].join('\n'),
  // X: 本文にリンクを入れると表示が減るので、リンクは返信に分ける。日本語は1字=2と数えるので本文は120字以内
  x: `牧場に届いた質問「${pick.q.length > 50 ? pick.q.slice(0, 49) + '…' : pick.q}」\n\n（配信の要約）${shorten(pick.a, Math.max(40, 104 - Math.min(pick.q.length, 50)))}`,
  xReply: `答えの続きと、答えた配信の全文はこちら（酪農データバンク）\n${url('x')}`,
}

const result = {
  date: today,
  pick: { id: pick.id, q: pick.q, episode: pick.episode, topics: pick.topics, page: `${SITE}q/${pick.id}/` },
  images: [1, 2, 3].map((n) => `${SITE}instagram/${pick.id}/${n}.png`),
  text,
  line: LINE,
  reason: daysAgo(pick.episode.date) <= 3 ? '直近の配信' : season.length && pick.topics.some((t) => season.some((w) => t.includes(w))) ? '季節の話題' : '順番',
}
fs.writeFileSync(path.join(outDir, 'today.json'), JSON.stringify(result, null, 1) + '\n', 'utf8')
console.log(`今日の1問（${result.reason}）: ${pick.id} ${pick.q}`)
// 画像を作る住所を pages.yml に渡す
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `id=${pick.id}\n`)
