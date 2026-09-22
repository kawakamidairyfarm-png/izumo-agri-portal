import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import EpisodeCard from '../components/EpisodeCard'
import { GROUPS, episodesForGroup, episodesForTopic, stats } from '../lib/data'
import { FLOWS, findFlow, resolveFlow } from '../lib/flows'

const AUD = { consumer: '飲む人向け', student: '志す人向け', both: 'どちらにも' } as const

/** テーマの入口。大分類ごとに小分類を並べ、流れで読む道も置く */
export function TopicsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-ink-900">テーマから探す</h1>
      <p className="mt-1 text-sm text-ink-700">
        {stats.episodes} 回の配信を、{GROUPS.length} つの大きなテーマと {GROUPS.reduce((a, g) => a + g.subs.length, 0)} の小さなテーマに分けました。気になる言葉から入って、深く読めます。
      </p>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-bold text-ink-900">流れで読む</h2>
        <p className="mt-1 text-sm text-ink-700">一つの流れを順にたどると、テーマがつながって見えます。</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {FLOWS.map((f) => (
            <Link key={f.key} to={`/flow/${f.key}`} className="rounded-3xl bg-moss-700 text-white p-5 hover:bg-moss-900 transition-colors">
              <p className="text-xs font-bold text-hay-300">{f.steps.length} 段階</p>
              <h3 className="mt-1 font-serif text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-moss-50/90">{f.lead}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {GROUPS.map((g) => {
          const n = episodesForGroup(g.key).length
          return (
            <section key={g.key} className="rounded-3xl bg-white border border-cream-200 p-6 shadow-card">
              <p className="text-xs font-bold text-moss-700">
                {AUD[g.audience]} ・ {n} 回
              </p>
              <h2 className="mt-1 font-serif text-xl font-bold text-ink-900">{g.label}</h2>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{g.blurb}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {g.subs.map((s) => {
                  const c = episodesForTopic(s.key).length
                  return (
                    <li key={s.key}>
                      <Link
                        to={`/t/${s.key}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-cream-50 px-3 py-1.5 text-sm font-bold text-ink-900 hover:border-moss-300 hover:bg-moss-50"
                      >
                        {s.label}
                        <span className="text-xs font-medium text-ink-500">{c}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/** 流れで読む（小分類を順にたどる） */
export function FlowDetail() {
  const { key = '' } = useParams()
  const flow = findFlow(key)
  if (!flow) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">この流れは見つかりませんでした。</p>
        <Link to="/topics" className="mt-3 inline-flex items-center gap-1 text-moss-700 font-bold">
          <ArrowLeft size={16} /> テーマから探す
        </Link>
      </div>
    )
  }
  const steps = resolveFlow(flow)
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/topics" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> テーマから探す
      </Link>
      <p className="mt-4 text-xs font-bold text-moss-700">流れで読む ・ {steps.length} 段階</p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-ink-900">{flow.title}</h1>
      <p className="mt-2 text-ink-700 leading-relaxed">{flow.lead}</p>
      <ol className="mt-8 space-y-8">
        {steps.map((s, i) => (
          <li key={s.topic.key}>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-2xl font-bold text-moss-700">{i + 1}</span>
              <div>
                <h2 className="font-serif text-xl font-bold text-ink-900">
                  <Link to={`/t/${s.topic.key}`} className="hover:text-moss-700">
                    {s.topic.label}
                  </Link>
                </h2>
                <p className="text-sm text-ink-700">{s.why}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {s.episodes.slice(0, 2).map((e) => (
                <EpisodeCard key={e.id} episode={e} />
              ))}
            </div>
            {s.episodes.length > 2 && (
              <Link to={`/t/${s.topic.key}`} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:text-moss-900">
                このテーマの {s.episodes.length} 回をすべて見る <ArrowRight size={14} />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
