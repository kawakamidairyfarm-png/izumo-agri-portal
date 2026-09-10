import { useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { trackEvent } from '../lib/analytics'

const SITE = '川上牧場 酪農データバンク'

/** 記事の見出しの下に置く共有の列。X・LINE・Facebook・リンクのコピー、スマホでは端末の共有メニュー */
export default function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)
  // 静的サイトなので描画時にブラウザがある。端末の共有メニューが使えるときだけボタンを出す
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const text = `${title}｜${SITE}`
  const enc = encodeURIComponent
  const targets = [
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: 'LINE', href: `https://social-plugins.line.me/lineit/share?url=${enc(url)}&text=${enc(text)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackEvent('リンクをコピー')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('このリンクをコピーしてください', url)
    }
  }
  const native = async () => {
    try {
      await navigator.share({ title: text, text, url })
      trackEvent('端末の共有メニュー')
    } catch {
      /* 閉じただけ */
    }
  }

  const chip = 'inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:border-moss-300 hover:text-moss-700'
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="この回を共有">
      <span className="text-xs text-ink-500">共有</span>
      {canNative && (
        <button type="button" onClick={native} className={chip}>
          <Share2 size={14} /> 共有する
        </button>
      )}
      {targets.map((t) => (
        <a key={t.label} href={t.href} target="_blank" rel="noreferrer noopener" className={chip}>
          {t.label}
        </a>
      ))}
      <button type="button" onClick={copy} className={chip} aria-live="polite">
        {copied ? <Check size={14} className="text-moss-700" /> : <Link2 size={14} />} {copied ? 'コピーしました' : 'リンクをコピー'}
      </button>
    </div>
  )
}
