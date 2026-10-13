// 毎日のSNS自動投稿: 公開中の sns/today.json を読み、オンにしたSNSへ投稿する（2026-10-04）
//
//   node scripts/sns/post.mjs            … 試運転（投稿せず、送る中身だけ表示）
//   SNS_LIVE=on node scripts/sns/post.mjs … 本番（下の SNS_<名前>=on のSNSだけ投稿）
//
// SNSごとのオン／オフ（GitHub の Variables）: SNS_INSTAGRAM, SNS_FACEBOOK, SNS_THREADS, SNS_X
// 鍵（GitHub の Secrets。値はここに書かない）:
//   Instagram・Facebook: META_PAGE_TOKEN（Facebookページのアクセストークン）, IG_USER_ID, FB_PAGE_ID
//   Threads: THREADS_TOKEN（60日で切れる。切れる前に作り直して入れ替える。THREADS_USER_ID は点検で照合するだけ）
//   X: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
// その日のショート動画（任意・手で呼ぶときの入力）: REEL_DRIVE_ID（Google ドライブの動画の記号）、REEL_CAPTION（リールの投稿文）
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
let reelPosted = false
const videoPosted = new Set()
let videoCache = null
const GRAPH = 'https://graph.facebook.com/v21.0'
const THREADS = 'https://graph.threads.net/v1.0'

// 点検（SNS_CHECK=on）: 投稿せず、鍵で自分のアカウント名が読めるかだけを確かめる
if (env.SNS_CHECK === 'on') {
  const show = async (label, url) => {
    try {
      const r = await (await fetch(url)).json()
      console.log(`${label}: ${r.error ? '使えません ' + r.error.message : 'OK ' + (r.username || r.name || r.id)}`)
    } catch (e) {
      console.log(`${label}: 確かめられません ${e.message}`)
    }
  }
  const t = encodeURIComponent(env.META_PAGE_TOKEN || '')
  if (env.META_PAGE_TOKEN && env.IG_USER_ID) await show('Instagram', `${GRAPH}/${env.IG_USER_ID}?fields=username&access_token=${t}`)
  else console.log('Instagram: 鍵が未設定')
  if (env.META_PAGE_TOKEN && env.FB_PAGE_ID) await show('Facebookページ', `${GRAPH}/${env.FB_PAGE_ID}?fields=name&access_token=${t}`)
  else console.log('Facebookページ: 鍵が未設定')
  if (env.META_PAGE_TOKEN) {
    const d = await (await fetch(`${GRAPH}/debug_token?input_token=${t}&access_token=${t}`)).json().catch(() => ({}))
    const exp = d.data?.expires_at
    console.log(`Metaの鍵の期限: ${exp === 0 ? '期限なし' : exp ? new Date(exp * 1000).toISOString().slice(0, 10) : '不明'}／権限: ${(d.data?.scopes || []).join(', ') || '不明'}`)
  }
  if (env.THREADS_TOKEN) {
    // ユーザーIDの数字は使わず、鍵の持ち主（me）を読む。IDの写し間違いで止まらないため
    try {
      const r = await (await fetch(`${THREADS}/me?fields=id,username&access_token=${encodeURIComponent(env.THREADS_TOKEN)}`)).json()
      if (r.error) console.log(`Threads: 使えません ${r.error.message}`)
      else console.log(`Threads: OK ${r.username}${env.THREADS_USER_ID ? `（Secrets の THREADS_USER_ID と${r.id === env.THREADS_USER_ID.trim() ? '一致' : '不一致・投稿には使わないので支障なし'}）` : ''}`)
    } catch (e) {
      console.log(`Threads: 確かめられません ${e.message}`)
    }
  } else console.log('Threads: 鍵が未設定')
  // リールの点検（reel_id を渡したとき）: ドライブから動画を取り、Instagram に送って取り込みまで確かめる。公開はしない
  if (env.REEL_DRIVE_ID && env.META_PAGE_TOKEN && env.IG_USER_ID) {
    try {
      await postReel(env.META_PAGE_TOKEN, env.IG_USER_ID, { publish: false, caption: env.REEL_CAPTION || '点検' })
    } catch (e) {
      console.log(`リール: 使えません ${e.message}`)
    }
    // Facebook: 公開しない動画として送り、受け取れたら消す
    if (env.FB_PAGE_ID) {
      try {
        const id = await postFbVideo({ published: false, text: env.REEL_CAPTION || '点検' })
        console.log('Facebook の動画: 受け取りまで済みました（公開していません）')
        await fetch(`${GRAPH}/${id}?access_token=${encodeURIComponent(env.META_PAGE_TOKEN)}`, { method: 'DELETE' }).catch(() => {})
      } catch (e) {
        console.log(`Facebook の動画: 使えません ${e.message}`)
      }
    }
    // Threads: 取り込みまで確かめて公開しない
    if (env.THREADS_TOKEN) {
      try {
        await postThreadsVideo({ publish: false, text: env.REEL_CAPTION || '点検' })
        console.log('Threads の動画: 取り込みまで済みました（公開していません）')
      } catch (e) {
        console.log(`Threads の動画: 使えません ${e.message}`)
      }
    }
  }
  console.log('点検だけで、投稿はしていません')
  process.exit(0)
}

// リールだけを手で出す（reel_only=on・2026-10-11 本人「試しにさっきの動画を投稿して」）。
// 時間帯・「今夜は投稿済み」の決まりは使わず、Instagram にリールを1本だけ出す。質問カードには戻さない。
// 記録は「今日の1問」の記号ではなく reel-<日付> で残す（翌日の質問カードの判定に混ざらないため）
if (env.REEL_ONLY === 'on') {
  if (!env.REEL_DRIVE_ID) throw new Error('reel_only には reel_id が要ります')
  if (!LIVE || env.SNS_INSTAGRAM !== 'on') {
    console.log('リールだけの投稿: 本番（SNS_LIVE・SNS_INSTAGRAM が on）ではないので出しません')
    process.exit(0)
  }
  const id = await postReel(env.META_PAGE_TOKEN, env.IG_USER_ID, { caption: env.REEL_CAPTION || '川上牧場の切り抜き動画' })
  const file = path.join(root, 'data', 'sns-posted.json')
  const log = JSON.parse(fs.readFileSync(file, 'utf8'))
  const jstDate = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
  log.posts.push({ id: `reel-${jstDate}`, sns: 'instagram', at: new Date().toISOString(), postId: String(id), kind: 'reel' })
  fs.writeFileSync(file, JSON.stringify(log, null, 1) + '\n', 'utf8')
  console.log(`instagram: リールを投稿しました（${id}）`)
  process.exit(0)
}

const today = JSON.parse(
  env.SNS_TODAY_FILE ? fs.readFileSync(env.SNS_TODAY_FILE, 'utf8') : await (await fetch(`${SITE}sns/today.json?t=${Date.now()}`)).text(),
)
if (!today.pick) {
  console.log('今日は投稿する質問がありません')
  process.exit(0)
}
const postedFile = path.join(root, 'data', 'sns-posted.json')
const posted = JSON.parse(fs.readFileSync(postedFile, 'utf8'))
// 投稿してよい時間帯（日本時間）。GitHub の時刻指定は大きく遅れることがあり、10/5 19:07 の予約が翌朝 4:14 に動いて投稿した。
// 時間帯の外で動いたら投稿しない（手で動かしたときも同じ。どうしても出すときは SNS_WINDOW=0-24 で動かす）
const [WIN_FROM, WIN_TO] = (env.SNS_WINDOW || '19-21').split('-').map(Number)
const jst = (t) => new Date(Date.parse(t) + 9 * 3600e3)
const nowJst = jst(new Date().toISOString())
if (LIVE && !(nowJst.getUTCHours() >= WIN_FROM && nowJst.getUTCHours() < WIN_TO)) {
  console.log(`いまは日本時間 ${nowJst.toISOString().slice(11, 16)}。投稿の時間帯（${WIN_FROM}時〜${WIN_TO}時）の外なので投稿しません`)
  process.exit(0)
}
// 同じSNSには、同じ日の夜の時間帯に2回出さない（予備の時刻の実行や、投稿後に「今日の1問」が選び直された後の実行で二重にならないため）
const day = (d) => d.toISOString().slice(0, 10)
const inTonight = (t) => day(jst(t)) === day(nowJst) && jst(t).getUTCHours() >= WIN_FROM
const already = (sns) => posted.posts.some((p) => p.sns === sns && (p.id === today.pick.id || inTonight(p.at)))
console.log(`今日の1問: ${today.pick.id}「${today.pick.q}」（${today.reason}）${LIVE ? '' : ' ※試運転'}`)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
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
    // その日のショート動画（毎日SNS投稿準備タスクが Google ドライブに置いたもの）があればリールで出す。失敗したら質問カードに戻す
    if (env.REEL_DRIVE_ID) {
      try {
        return await postReel(token, ig)
      } catch (e) {
        console.log(`instagram: リールを出せなかったので質問カードにします（${e.message}）`)
      }
    }
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
    if (env.REEL_DRIVE_ID) {
      try {
        const id = await postFbVideo({ text: videoText(today.text.facebook) })
        console.log('facebook: 動画で投稿しました')
        videoPosted.add('facebook')
        return id
      } catch (e) {
        console.log(`facebook: 動画を出せなかったので質問カードにします（${e.message}）`)
      }
    }
    return (await form(`${GRAPH}/${env.FB_PAGE_ID}/feed`, { message: today.text.facebook, link: `${today.pick.page}?utm_source=facebook`, access_token: env.META_PAGE_TOKEN })).id
  },
  // Threads: 1枚目の画像と文（投稿先は鍵の持ち主 me）
  async threads() {
    if (env.REEL_DRIVE_ID) {
      try {
        const id = await postThreadsVideo({ text: videoText(today.text.threads) })
        console.log('threads: 動画で投稿しました')
        videoPosted.add('threads')
        return id
      } catch (e) {
        console.log(`threads: 動画を出せなかったので質問カードにします（${e.message}）`)
      }
    }
    const base = `${THREADS}/me`
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

/**
 * Instagram リール（2026-10-11）: Google ドライブの動画（リンクを知っている人は見られる設定）を取ってきて、
 * Instagram の「再開可能アップロード」で動画そのものを送る（公開URLを Instagram に読みに行かせない）
 */
/** ドライブの動画の公開リンク（Threads はこの住所を読みに来る） */
function driveUrl() {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(env.REEL_DRIVE_ID)}&export=download&confirm=t`
}
/** ドライブの動画を1回だけ取ってきて、Instagram と Facebook で使い回す */
async function getVideo() {
  if (videoCache) return videoCache
  const res = await fetch(driveUrl())
  const type = res.headers.get('content-type') || ''
  if (!res.ok || /text\/html/.test(type)) throw new Error(`ドライブの動画を取れません（${res.status} ${type}）。共有が「リンクを知っている全員」になっているか`)
  const video = Buffer.from(await res.arrayBuffer())
  // MP4 の先頭（4〜8バイト目が "ftyp"）で、本当に動画かを確かめる
  if (video.subarray(4, 8).toString('latin1') !== 'ftyp') throw new Error(`ドライブから取れたものが MP4 ではありません（${type}・${video.length}バイト）`)
  console.log(`その日の動画: ${(video.length / 1048576).toFixed(1)}MB`)
  return (videoCache = video)
}
/** 動画の投稿文（Instagram と同じ）。無ければ質問カードの文 */
const videoText = (fallback) => env.REEL_CAPTION || fallback

/**
 * Facebook ページに動画を出す（2026-10-13 本人「Facebook・Threads も Instagram と同じ投稿で」）。
 * published:false で出すと公開されない（点検用）
 */
async function postFbVideo({ published = true, text } = {}) {
  const video = await getVideo()
  const fd = new FormData()
  fd.append('source', new Blob([video], { type: 'video/mp4' }), 'video.mp4')
  fd.append('description', text)
  fd.append('published', published ? 'true' : 'false')
  fd.append('access_token', env.META_PAGE_TOKEN)
  const res = await fetch(`https://graph-video.facebook.com/v21.0/${env.FB_PAGE_ID}/videos`, { method: 'POST', body: fd })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) throw new Error(`Facebook の動画に失敗（${res.status} ${JSON.stringify(body.error ?? body).slice(0, 300)}）`)
  return body.id
}

/**
 * Threads に動画を出す。Threads は動画の住所を読みに来る（ドライブの公開リンク）。文は500字まで。
 * publish:false なら取り込みまで確かめて公開しない（点検用）
 */
async function postThreadsVideo({ publish = true, text } = {}) {
  const base = `${THREADS}/me`
  const box = await form(`${base}/threads`, { media_type: 'VIDEO', video_url: driveUrl(), text: clip500(text), access_token: env.THREADS_TOKEN })
  for (let i = 0; i < 60; i++) {
    await sleep(5000)
    const st = await get(`${THREADS}/${box.id}?fields=status,error_message&access_token=${encodeURIComponent(env.THREADS_TOKEN)}`)
    if (st.status === 'FINISHED') break
    if (st.status === 'ERROR' || st.status === 'EXPIRED') throw new Error(`Threads の動画の取り込みに失敗（${st.error_message ?? st.status}）`)
    if (i === 59) throw new Error('Threads の動画の取り込みが5分で終わりませんでした')
  }
  if (!publish) return box.id
  return (await form(`${base}/threads_publish`, { creation_id: box.id, access_token: env.THREADS_TOKEN })).id
}
/** Threads の500字に収める（段落・文の切れ目で切る） */
function clip500(t) {
  t = String(t || '')
  if (t.length <= 500) return t
  const cut = t.slice(0, 498)
  const at = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('。'))
  return (at > 200 ? cut.slice(0, at + 1) : cut).trim()
}

async function postReel(token, ig, { publish = true, caption: cap } = {}) {
  const video = await getVideo()
  const caption = (cap || env.REEL_CAPTION || today.text.instagram).slice(0, 2200)
  // 動画の送信は Instagram 側で一時的に断られることがある（10/13 の点検で1回 ProcessingFailedError）。1回だけ箱を作り直して送り直す
  let box
  for (let attempt = 1; ; attempt++) {
    box = await form(`${GRAPH}/${ig}/media`, { media_type: 'REELS', upload_type: 'resumable', share_to_feed: 'true', caption, access_token: token })
    const up = await fetch(box.uri || `https://rupload.facebook.com/ig-api-upload/v21.0/${box.id}`, {
      method: 'POST',
      headers: { Authorization: `OAuth ${token}`, offset: '0', file_size: String(video.length) },
      body: video,
    })
    const upBody = await up.json().catch(() => ({}))
    if (up.ok && upBody.success !== false) break
    if (attempt >= 2) throw new Error(`動画の送信に失敗（${up.status} ${JSON.stringify(upBody).slice(0, 200)}）`)
    console.log(`リール: 動画の送信を送り直します（${up.status}）`)
    await sleep(10000)
  }
  // 動画の取り込みは数十秒〜数分かかる
  for (let i = 0; i < 60; i++) {
    const st = await get(`${GRAPH}/${box.id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`)
    if (st.status_code === 'FINISHED') break
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`動画の取り込みに失敗（${st.status ?? st.status_code}）`)
    if (i === 59) throw new Error('動画の取り込みが5分で終わりませんでした')
    await sleep(5000)
  }
  if (!publish) {
    console.log(`リール: Instagram が動画を受け取り、取り込みまで済みました（公開はしていません。下書きは24時間で消えます）`)
    return box.id
  }
  const id = (await form(`${GRAPH}/${ig}/media_publish`, { creation_id: box.id, access_token: token })).id
  console.log('instagram: リールで投稿しました')
  reelPosted = true
  return id
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
  threads: ['THREADS_TOKEN'],
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
    console.log(`${sns}: 今日はもう投稿済み`)
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
    results.push({ id: today.pick.id, sns, at: new Date().toISOString(), postId: String(id), ...((sns === 'instagram' && reelPosted) || videoPosted.has(sns) ? { kind: sns === 'instagram' ? 'reel' : 'video' } : {}) })
  } catch (e) {
    console.log(`${sns}: 失敗 ${e.message}`)
    process.exitCode = 1
  }
}
if (results.length) {
  posted.posts.push(...results)
  fs.writeFileSync(postedFile, JSON.stringify(posted, null, 1) + '\n', 'utf8')
}
