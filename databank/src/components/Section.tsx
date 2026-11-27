import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function Section({
  title,
  lead,
  more,
  children,
  className = '',
}: {
  title: string
  lead?: string
  more?: { to: string; label: string }
  children: React.ReactNode
  className?: string
}) {
  return (
    // 大項目の区切り（2026-11-28）: 見出しの前に余白を取り、見出しは h2 の段（23〜32px・明朝）。説明は本文と同じ 16px
    <section className={`mx-auto max-w-6xl px-4 pt-12 pb-6 md:pt-16 ${className}`}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="font-serif text-h2 font-bold text-ink-900">{title}</h2>
          {lead && <p className="mt-2 max-w-prose text-base text-ink-700">{lead}</p>}
        </div>
        {more && (
          <Link to={more.to} className="link-more hidden sm:inline-flex shrink-0 text-base">
            {more.label} <ArrowRight size={16} />
          </Link>
        )}
      </div>
      {children}
      {more && (
        <Link to={more.to} className="link-more sm:hidden mt-3 text-base">
          {more.label} <ArrowRight size={16} />
        </Link>
      )}
    </section>
  )
}
