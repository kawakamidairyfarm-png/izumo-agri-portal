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
    <section className={`mx-auto max-w-6xl px-4 py-10 ${className}`}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink-900">{title}</h2>
          {lead && <p className="mt-1 text-sm text-ink-700">{lead}</p>}
        </div>
        {more && (
          <Link to={more.to} className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
            {more.label} <ArrowRight size={16} />
          </Link>
        )}
      </div>
      {children}
      {more && (
        <Link to={more.to} className="sm:hidden mt-4 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
          {more.label} <ArrowRight size={16} />
        </Link>
      )}
    </section>
  )
}
