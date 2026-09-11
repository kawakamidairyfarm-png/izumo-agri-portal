// 計測（ページビューと外部リンクのクリック）。導線のどこで人が落ちているかを数えるための最小限。
// 個人を特定する情報（名前・メール・IP・端末の識別子）は送らない。ブラウザの「追跡しない」設定があれば何も送らない。
//
//   VITE_LOG_ENDPOINT=<URL>          → 自前の受け口（Google Apps Script → スプレッドシート）。scripts/apps-script-log.gs
//   VITE_GOATCOUNTER=<コード>         → https://<コード>.goatcounter.com に送る
//   VITE_CF_ANALYTICS_TOKEN=<token>  → Cloudflare Web Analytics に送る
// GitHub Actions では pages.yml が repository variables（LOG_ENDPOINT / GOATCOUNTER_CODE / CF_ANALYTICS_TOKEN）から渡す。

/** 公開先のサブパス（/izumo-agri-portal/）を除いた、サイト内での位置 */
function currentPath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const p = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname
  return p || '/'
}

/** 来た元。最初の訪問時の参照元（または utm_source）を、その閲覧の間だけ覚えておく */
function referrerSource(): string {
  try {
    const saved = sessionStorage.getItem('db-ref')
    if (saved) return saved
    const utm = new URLSearchParams(location.search).get('utm_source')
    let src = utm ?? ''
    if (!src && document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      src = host === location.hostname ? '' : host
    }
    if (!src) src = '直接'
    sessionStorage.setItem('db-ref', src)
    return src
  } catch {
    return '直接'
  }
}

let track: ((label: string) => void) | null = null
let pageView: (() => void) | null = null

/** ページが変わったことを知らせる。ルーター側（App の RouteTracker）から呼ぶ */
export function trackView() {
  pageView?.()
}

/** リンク以外の操作（コピー・端末の共有など）を「クリック」として記録する。計測が無効なら何もしない */
export function trackEvent(label: string) {
  track?.(label)
}

function installOwnLog(endpoint: string) {
  const device = () => (window.innerWidth < 768 ? 'sp' : 'pc')
  const send = (t: 'view' | 'click', extra: Record<string, string> = {}) => {
    const body = JSON.stringify({ t, p: currentPath(), r: referrerSource(), d: device(), ...extra })
    try {
      // Apps Script の受け口は応答を読めない（no-cors）が、書き込みは届く
      void fetch(endpoint, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, body })
    } catch {
      /* 計測の失敗はサイトの動作に影響させない */
    }
  }
  track = (label) => send('click', { l: label })
  let last = ''
  const view = () => {
    const p = currentPath()
    if (p === last) return
    last = p
    send('view')
  }
  pageView = () => {
    view()
    gcView?.()
  }
  view()
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="http"]') as HTMLAnchorElement | null
      if (!a || a.href.startsWith(location.origin)) return
      let host = ''
      try {
        host = new URL(a.href).hostname.replace(/^www\./, '')
      } catch {
        return
      }
      const label = (a.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
      send('click', { l: `${label} → ${host}` })
    },
    { capture: true },
  )
}

let gcView: (() => void) | null = null

export function installAnalytics() {
  if (navigator.doNotTrack === '1') return

  const own = import.meta.env.VITE_LOG_ENDPOINT as string | undefined
  if (own) installOwnLog(own)

  const gc = import.meta.env.VITE_GOATCOUNTER as string | undefined
  if (gc) {
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://gc.zgo.at/count.js'
    s.dataset.goatcounter = `https://${gc}.goatcounter.com/count`
    s.dataset.goatcounterSettings = JSON.stringify({ allow_local: false })
    document.head.appendChild(s)
    let last = ''
    const send = () => {
      const path = location.pathname
      if (path === last) return
      last = path
      const w = window as unknown as { goatcounter?: { count: (o: { path: string }) => void } }
      w.goatcounter?.count({ path })
    }
    gcView = send
    s.addEventListener('load', send)
  }

  const cf = import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined
  if (cf) {
    const s = document.createElement('script')
    s.defer = true
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    s.dataset.cfBeacon = JSON.stringify({ token: cf, spa: true })
    document.head.appendChild(s)
  }
}
