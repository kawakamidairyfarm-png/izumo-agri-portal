// 計測（ページビュー）。導線のどこで人が落ちているかを数えるための最小限。
// どちらもクッキーを使わない匿名の集計サービスで、値が設定されているときだけ読み込む。
//   VITE_GOATCOUNTER=<コード>       → https://<コード>.goatcounter.com に送る
//   VITE_CF_ANALYTICS_TOKEN=<token> → Cloudflare Web Analytics に送る
// GitHub Actions では pages.yml が repository variables（GOATCOUNTER_CODE / CF_ANALYTICS_TOKEN）から渡す。
export function installAnalytics() {
  const gc = import.meta.env.VITE_GOATCOUNTER as string | undefined
  if (gc) {
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://gc.zgo.at/count.js'
    s.dataset.goatcounter = `https://${gc}.goatcounter.com/count`
    // ハッシュルーター（#/…）の画面ごとに数える
    s.dataset.goatcounterSettings = JSON.stringify({ path: (p: string) => p, allow_local: false })
    document.head.appendChild(s)
    let last = ''
    const send = () => {
      const path = location.pathname + location.hash
      if (path === last) return
      last = path
      const w = window as unknown as { goatcounter?: { count: (o: { path: string }) => void } }
      w.goatcounter?.count({ path })
    }
    window.addEventListener('hashchange', send)
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
