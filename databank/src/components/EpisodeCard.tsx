import { Link } from 'react-router-dom'
import { FileText, Headphones } from 'lucide-react'
import { AUDIENCE_META, CATEGORY_META, TOPICS, formatDate, leadOf, type Episode } from '../lib/data'
import { highlight } from '../lib/search'

export function Badge({ children, tone = 'bg-cream-200 text-ink-700' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${tone}`}>{children}</span>
}

export function Highlighted({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>
  return (
    <>
      {highlight(text, query).map((seg, i) => (seg.hit ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>))}
    </>
  )
}

export default function EpisodeCard({
  episode,
  query,
  snippet,
  why,
  index,
}: {
  episode: Episode
  query?: string
  snippet?: string | null
  why?: string
  index?: number
}) {
  const cat = CATEGORY_META[episode.category]
  const topicLabels = episode.topics.slice(0, 3).map((k) => TOPICS.find((t) => t.key === k)?.label ?? k)
  return (
    <Link
      to={`/e/${episode.id}`}
      className="group block rounded-2xl bg-white border border-cream-200 shadow-card hover:border-moss-300 hover:-translate-y-0.5 transition-all p-5"
    >
      <div className="flex items-start gap-3">
        {index !== undefined && (
          <span className="shrink-0 h-8 w-8 rounded-full bg-moss-700 text-white text-sm font-black flex items-center justify-center">
            {index}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <Badge tone={cat.tone}>{cat.label}</Badge>
            {episode.audience.map((a) => (
              <Badge key={a}>{AUDIENCE_META[a].short}</Badge>
            ))}
            <span className="text-xs text-ink-500 ml-auto">{formatDate(episode.date)}</span>
          </div>
          <h3 className="font-bold text-ink-900 leading-snug group-hover:text-moss-700">
            <Highlighted text={episode.title} query={query} />
          </h3>
          {why && <p className="mt-1 text-sm text-moss-700">{why}</p>}
          {episode.article ? (
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              <Highlighted text={query ? episode.article.summary : leadOf(episode.article.summary)} query={query} />
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-500">
              {episode.transcript
                ? '要約は準備中。全文（noteの記事）を読めます。'
                : episode.paidNote
                  ? '要約は準備中。全文は note の有料記事で読めます。'
                  : '要約は準備中。配信本体は Pody で聴けます。'}
            </p>
          )}
          {snippet && (
            <p className="mt-2 text-xs text-ink-500 leading-relaxed border-l-2 border-hay-300 pl-2">
              <Highlighted text={snippet} query={query} />
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
            {topicLabels.map((t) => (
              <span key={t} className="rounded-full bg-cream-100 px-2 py-0.5">
                {t}
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1">
              {episode.article || episode.transcript ? <FileText size={13} /> : <Headphones size={13} />}
              {episode.article ? '要約・全文あり' : episode.transcript ? '全文あり' : '音声のみ'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
