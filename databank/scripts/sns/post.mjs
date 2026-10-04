// 毎日のSNS自動投稿: 公開中の sns/today.json を読み、オンにしたSNSへ投稿する（2026-10-04）
//
//   node scripts/sns/post.mjs            … 試運転（投稿せず、送る中身だけ表示）
//   SNS_LIVE=on node scripts/sns/post.mjs … 本番（下の SNS_<名前>=on のSNSだけ投稿）
//
// SNSごとのオン／オフ（GitHub の Variables）: SNS_INSTAGRAM, SNS_FACEBOOK, SNS_THREADS, SNS_X
// 鍵（GitHub の Secrets。値はここに書かない）:
//   Instagram・Facebook: META_PAGE_TOKEN（Facebookページのアクセストークン）, IG_USER_ID, FB_PAGE_ID
//   Threads: THREADS_TOKEN, THREADS_USER_ID
//   X: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
// 投稿したら data/sns-posted.json に記録する（同じ質問を二度出さない）。1つのSNSが失敗しても、ほかは続ける。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const SITE = 'https://kawakamidairyfarm-png.github.io/izumo-agri-portal/'
const env = process.env
const LIVE = env.SNS_LIVE === 'on'
const GRAPH = 'https://graph.facebook.com/v21.0'

const today = JSON.parse(
  env.SNS_TODAY_FILE ? fs.readFileSync(env.SNS_TODAY_FILE, 'utf8') : await (await fetch(`${SITE}sns/today.json?t=${Date.now()}`)).text(),
)
if (!today.pick) {
  console.log('今日は投稿する質問がありません')
  process.exit(0)
}
const postedFile = path.join(root, 'data', 'sns-posted.json')
const posted = JSON.parse(fs.readFileSync(postedFile, 'utf8'))
const already = (sns) => posted.posts.some((p) => p.id === today.pick.id && p.sns === sns)
console.log(`今日の1問: ${today.pick.id}「${today.pick.q}」（${today.reason}）${LIVE ? '' : ' ※試運転'}`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function form(url, params) {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) throw new Error(`${res.status} ${JSON.stringify(body.error ?? body).slice(0, 300)}`)
  return body
}
async function get(url) {
  const res = await fetch(url)
  return res.json()
}

/** 画像が公開されているか（公開の直後で、まだ置かれていないことがある） */
async function imagesReady() {
  for (const u of today.images) {
    const r = await fetch(u, { method: 'HEAD' })
    if (!r.ok) return false
  }
  return true
}

const jobs = {
  // Instagram: 画像3枚のカルーセル
  async instagram() {
    const token = env.META_PAGE_TOKEN
    const ig = env.IG_USER_ID
    if (!(await imagesReady())) throw new Error('カードの画像がまだ公開されていません')
    const children = []
    for (const image_url of today.images) {
      children.push((await form(`${GRAPH}/${ig}/media`, { image_url, is_carousel_item: 'true', access_token: token })).id)
    }
    const box = await form(`${GRAPH}/${ig}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: today.text.instagram, access_token: token })
    for (let i = 0; i < 20; i++) {
      const st = await get(`${GRAPH}/${box.id}?fields=status_code&access_token=${encodeURIComponent(token)}`)
      if (st.status_code === 'FINISHED') break
      if (st.status_code === 'ERROR') throw new Error('画像の取り込みに失敗')
      await sleep(3000)
    }
    return (await form(`${GRAPH}/${ig}/media_publish`, { creation_id: box.id, access_token: token })).id
  },
  // Facebookページ: 文と質問のページへのリンク
  async facebook() {
    return (await form(`${GRAPH}/${env.FB_PAGE_ID}/feed`, { message: today.text.facebook, link: `${today.pick.page}?utm_source=facebook`, access_token: env.META_PAGE_TOKEN })).id
  },
  // Threads: 1枚目の画像と文
  async threads() {
    const base = `https://graph.threads.net/v1.0/${env.THREADS_USER_ID}`
    const box = await form(`${base}/threads`, { media_type: 'IMAGE', image_url: today.images[0], text: today.text.threads, access_token: env.THREADS_TOKEN })
    await sleep(15000) // Threads は取り込みに少し時間がかかる
    return (await form(`${base}/threads_publish`, { creation_id: box.id, access_token: env.THREADS_TOKEN })).id
  },
  // X: 本文と、リンクを入れた返信
  async x() {
    const first = await tweet({ text: today.text.x })
    await tweet({ text: today.text.xReply, reply: { in_reply_to_tweet_id: first } })
    return first
  },
}

/** X API v2 への投稿（OAuth 1.0a・本人のアカウント） */
async function tweet(body) {
  const url = 'https://api.x.com/2/tweets'
  const oauth = {
    oauth_consumer_key: env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: env.X_ACCESS_TOKEN,
    oauth_version: '1.0',
  }
  const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
  const paramStr = Object.keys(oauth).sort().map((k) => `${enc(k)}=${enc(oauth[k])}`).join('&')
  const base = ['POST', enc(url), enc(paramStr)].join('&')
  const key = `${enc(env.X_API_SECRET)}&${enc(env.X_ACCESS_SECRET)}`
  oauth.oauth_signature = crypto.createHmac('sha1', key).update(base).digest('base64')
  const header = 'OAuth ' + Object.keys(oauth).sort().map((k) => `${enc(k)}="${enc(oauth[k])}"`).join(', ')
  const res = await fetch(url, { method: 'POST', headers: { Authorization: header, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(out).slice(0, 300)}`)
  return out.data.id
}

const need = {
  instagram: ['META_PAGE_TOKEN', 'IG_USER_ID'],
  facebook: ['META_PAGE_TOKEN', 'FB_PAGE_ID'],
  threads: ['THREADS_TOKEN', 'THREADS_USER_ID'],
  x: ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET'],
}
const results = []
for (const sns of Object.keys(jobs)) {
  const on = env[`SNS_${sns.toUpperCase()}`] === 'on'
  const preview = sns === 'x' ? `${today.text.x}\n  └返信: ${today.text.xReply}` : today.text[sns]
  if (!on || !LIVE) {
    console.log(`\n── ${sns}（${!on ? 'オフ' : '試運転'}）──\n${preview}`)
    continue
  }
  if (already(sns)) {
    console.log(`${sns}: 今日の質問はもう投稿済み`)
    continue
  }
  const missing = need[sns].filter((k) => !env[k])
  if (missing.length) {
    console.log(`${sns}: 鍵が足りないので飛ばします（${missing.join(', ')}）`)
    continue
  }
  try {
    const id = await jobs[sns]()
    console.log(`${sns}: 投稿しました（${id}）`)
    results.push({ id: today.pick.id, sns, at: new Date().toISOString(), postId: String(id) })
  } catch (e) {
    console.log(`${sns}: 失敗 ${e.message}`)
    process.exitCode = 1
  }
}
if (results.length) {
  posted.posts.push(...results)
  fs.writeFileSync(postedFile, JSON.stringify(posted, null, 1) + '\n', 'utf8')
}
