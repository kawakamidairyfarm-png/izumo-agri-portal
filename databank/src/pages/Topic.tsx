import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import EpisodeCard from '../components/EpisodeCard'
import NextSteps from '../components/NextSteps'
import { BY_TRANSCRIPT, episodesForTopic, groupByKey, topicByKey } from '../lib/data'
import { flowsForTopic } from '../lib/flows'
import { stairsForTopic } from '../lib/stairs'
import { useIndexes } from '../lib/indexes'

const PAGE = 12

/** 小分類のページ。回・届いた質問・ことば・隣のテーマ・流れ、を一つの入口にまとめる */
export default function TopicPage() {
  const { key = '' } = useParams()
  const topic = topicByKey(key)
  const group = topic ? groupByKey(topic.group) : undefined
  const [shown, setShown] = useState(PAGE)
  const { questions: QUESTIONS, terms: TERMS } = useIndexes()
  const episodes = useMemo(() => (topic ? episodesForTopic(topic.key) : []), [topic])
  const ids = useMemo(() => new Set(episodes.map((e) => e.transcriptKey).filter(Boolean)), [episodes])
  const questions = useMemo(() => QUESTIONS.filter((q) => ids.has(q.key)).slice(0, 6), [ids, QUESTIONS])
  const terms = useMemo(() => {
    const seen = new Set<string>()
    return TERMS.filter((t) => ids.has(t.key) && !seen.has(t.term) && seen.add(t.term)).slice(0, 12)
  }, [ids, TERMS])
  const flows = topic ? flowsForTopic(topic.key) : []
  const stairs = topic ? stairsForTopic(topic.key) : []

  if (!topic || !group) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">このテーマは見つかりませんでした。</p>
        <Link to="/topics" className="mt-3 inline-flex items-center gap-1 text-moss-700 font-bold">
          <ArrowLeft size={16} /> テーマから探す
        </Link>
      </div>
    )
  }
  const siblings = group.subs.filter((s) => s.key !== topic.key)
  const withSummary = episodes.filter((e) => e.summary).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="text-sm text-ink-500 flex flex-wrap items-center gap-1">
        <Link to="/topics" className="hover:text-ink-900">テーマから探す</Link>
        <span>›</span>
        <span>{group.label}</span>
      </nav>
      <h1 className="mt-2 font-serif text-3xl font-bold text-ink-900">{topic.label}</h1>
      <p className="mt-2 text-ink-700 leading-relaxed">{topic.blurb}</p>
      <p className="mt-1 text-sm text-ink-500">
        {episodes.length} 回{withSummary > 0 && <>（要約つき {withSummary} 回）</>}。要約のある回から順に並べています。
      </p>

      {siblings.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-ink-500">同じ「{group.label}」の中：</span>
          {siblings.map((s) => (
            <Link key={s.key} to={`/t/${s.key}`} className="rounded-full border border-cream-200 bg-white px-3 py-1 text-sm font-medium text-ink-700 hover:border-moss-300 hover:text-moss-900">
              {s.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {episodes.length === 0 ? (
            <div className="rounded-2xl bg-white border border-cream-200 p-8 text-center text-ink-700">
              <p className="font-bold">このテーマに当たる回は、まだありません。</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {episodes.slice(0, shown).map((e) => (
                  <EpisodeCard key={e.id} episode={e} />
                ))}
              </div>
              {episodes.length > shown && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + PAGE)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white border border-cream-200 px-5 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300"
                  >
                    <ChevronDown size={16} /> さらに見る（残り {episodes.length - shown} 回）
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="space-y-6">
          {questions.length > 0 && (
            <section className="rounded-2xl bg-white border border-cream-200 p-5">
              <h2 className="text-sm font-bold text-moss-700">このテーマに届いた質問</h2>
              <ul className="mt-3 space-y-3">
                {questions.map((q, i) => {
                  const ep = BY_TRANSCRIPT.get(q.key)
                  return (
                    <li key={i} className="text-sm leading-relaxed">
                      <p className="font-bold text-ink-900">{q.q}</p>
                      {ep && (
                        <Link to={`/e/${ep.id}`} className="text-xs text-moss-700 hover:text-moss-900 underline decoration-moss-300">
                          答えた回を読む
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
              <Link to="/questions" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-moss-700 hover:text-moss-900">
                届いた質問をすべて見る <ArrowRight size={12} />
              </Link>
            </section>
          )}
          {terms.length > 0 && (
            <section className="rounded-2xl bg-white border border-cream-200 p-5">
              <h2 className="text-sm font-bold text-moss-700">このテーマのことば</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {terms.map((t) => (
                  <li key={t.term}>
                    <Link to={`/terms?q=${encodeURIComponent(t.term)}`} className="inline-block rounded-full bg-cream-100 px-3 py-1 text-sm text-ink-900 hover:bg-moss-50">
                      {t.term}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {stairs.length > 0 && (
            <section className="rounded-2xl bg-white border border-cream-200 p-5">
              <h2 className="text-sm font-bold text-moss-700">このテーマが入っている段</h2>
              <ul className="mt-3 space-y-2">
                {stairs.map((s) => (
                  <li key={s.key}>
                    <Link to={`/stair/${s.key}`} className="font-serif font-bold text-ink-900 hover:text-moss-700">
                      {s.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {flows.length > 0 && (
            <section className="rounded-2xl bg-moss-700 text-white p-5">
              <h2 className="text-sm font-bold text-hay-300">このテーマが入っている流れ</h2>
              <ul className="mt-3 space-y-2">
                {flows.map((f) => (
                  <li key={f.key}>
                    <Link to={`/flow/${f.key}`} className="font-serif font-bold hover:text-hay-300">
                      {f.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <NextSteps audience={group.audience === 'both' ? 'consumer' : group.audience} />
    </div>
  )
}
