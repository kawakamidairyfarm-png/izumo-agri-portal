import { Link } from 'react-router-dom'
import { FileText, Headphones } from 'lucide-react'
import { TOPICS, formatDate, leadOf, type Episode } from '../lib/data'
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
  const topicLabels = episode.topics.slice(0, 2).map((k) => TOPICS.find((t) => t.key === k)?.label ?? k)
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
          {/* 札は減らす（2026-09-25 金継ぎ: 1枚に分類・対象・テーマ・状態の4種類が並んでいた）。日付と題名を先に */}
          <time dateTime={episode.date} className="mb-1 block text-xs text-ink-500 tabular-nums">{formatDate(episode.date)}</time>
          <h3 className="font-bold text-ink-900 leading-snug group-hover:text-moss-700">
            <Highlighted text={episode.title} query={query} />
          </h3>
          {why && <p className="mt-1 text-sm text-moss-700">{why}</p>}
          {episode.summary ? (
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              <Highlighted text={query ? episode.summary : leadOf(episode.summary)} query={query} />
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-500">
              {episode.hasTranscript
                ? episode.transcriptSource === 'pody'
                  ? 'この回の全文を、章ごとに読めます。'
                  : episode.transcriptSource === 'note'
                    ? 'この回の全文（noteの記事）を読めます。'
                    : 'この回の全文（文字起こし）を読めます。'
                : episode.paidNote
                  ? '全文は note の有料記事で読めます。'
                  : '配信本体は Pody で聴けます。'}
            </p>
          )}
          {snippet && (
            <p className="mt-2 text-xs text-ink-500 leading-relaxed border-l-2 border-hay-300 pl-2">
              <Highlighted text={snippet} query={query} />
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            {topicLabels.length > 0 && <span className="min-w-0">{topicLabels.join('・')}</span>}
            <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap">
              {episode.article || episode.hasTranscript ? <FileText size={13} /> : <Headphones size={13} />}
              {episode.summary ? '要約・全文あり' : episode.hasTranscript ? '全文あり' : '音声のみ'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
