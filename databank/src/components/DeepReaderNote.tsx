import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { LINKS } from '../lib/links'
import { trackEvent } from '../lib/analytics'

/**
 * たくさん読んでくれた人への案内（2026-09-26）。
 * ログでは20ページ以上読んだ人が、メルマガ・メンバーシップ・LINEのどれも押していなかった（案内がページの一番下にあるため）。
 * 1回の訪問で5ページ目を開いたときに一度だけ、画面の下に小さく出す。閉じたら30日は出さない。
 * 文面は配信・サイト内で本人が言っている事実の範囲（メンバーシップの中身と「牛乳パック2本分」）。
 */
const COUNT_KEY = 'db-pages'
const SEEN_KEY = 'db-deep-note'
const AT = 5
const QUIET_DAYS = 30

function read(key: string, store: Storage): string | null {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string, store: Storage) {
  try {
    store.setItem(key, value)
  } catch {
    /* 保存できない端末でも表示は壊さない */
  }
}

export default function DeepReaderNote() {
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const n = Number(read(COUNT_KEY, sessionStorage) ?? '0') + 1
    write(COUNT_KEY, String(n), sessionStorage)
    if (n !== AT) return
    const seen = Number(read(SEEN_KEY, localStorage) ?? '0')
    if (seen && Date.now() - seen < QUIET_DAYS * 864e5) return
    write(SEEN_KEY, String(Date.now()), localStorage)
    // 描画の後に出す（ページ移動の直後に被せない）
    const t = window.setTimeout(() => {
      setShow(true)
      trackEvent('5ページ目の案内を出した')
    }, 1200)
    return () => window.clearTimeout(t)
  }, [pathname])

  if (!show) return null
  const close = () => {
    setShow(false)
    trackEvent('5ページ目の案内を閉じた')
  }
  return (
    <aside
      aria-label="たくさん読んでくれた方へ"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-cream-200 bg-white p-5 shadow-card md:inset-x-auto md:right-6 md:bottom-6"
    >
      <button
        type="button"
        onClick={close}
        aria-label="閉じる"
        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-cream-100 hover:text-ink-900"
      >
        <X size={18} />
      </button>
      <p className="pr-8 text-sm font-bold text-moss-700">たくさん読んでくれて、ありがとうございます</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        noteのメンバーシップでは、牛群検定の成績や経営の数字、限定記事まで読めます。月額は「牛乳パック2本分」です。
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={LINKS.noteSubscribe}
          target="_blank"
          rel="noreferrer"
          onClick={() => setShow(false)}
          className="inline-flex items-center rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-moss-900"
        >
          メンバーシップを見る
        </a>
        <a
          href={LINKS.newsletter}
          target="_blank"
          rel="noreferrer"
          onClick={() => setShow(false)}
          className="text-sm font-bold text-moss-700 underline decoration-moss-300 underline-offset-4 hover:text-moss-900"
        >
          まずは無料のメルマガ
        </a>
      </div>
    </aside>
  )
}
