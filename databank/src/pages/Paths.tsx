import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EpisodeCard from '../components/EpisodeCard'
import { PATHS, findPath, resolvePath } from '../lib/paths'

export function PathsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-ink-900">学びの道筋</h1>
      <p className="mt-1 text-sm text-ink-700">配信は日付順に並んでいますが、学ぶには順番があります。テーマごとに読む順を決めました。</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {PATHS.map((p) => {
          const steps = resolvePath(p)
          return (
            <Link
              key={p.key}
              to={`/paths/${p.key}`}
              className="rounded-3xl bg-white border border-cream-200 p-6 shadow-card hover:border-moss-300 hover:-translate-y-0.5 transition-all"
            >
              <p className="text-xs font-bold text-moss-700">
                {p.audience === 'student' ? '志す人向け' : p.audience === 'consumer' ? '消費者の疑問' : '志す人・消費者の両方'} ・ {steps.length} 回
              </p>
              <h2 className="mt-1 font-serif text-xl font-bold text-ink-900">{p.title}</h2>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{p.lead}</p>
              <ol className="mt-4 space-y-1 text-sm text-ink-700">
                {steps.slice(0, 4).map((s, i) => (
                  <li key={s.episode.id} className="flex gap-2">
                    <span className="text-moss-700 font-bold">{i + 1}.</span>
                    <span className="line-clamp-1">{s.episode.title}</span>
                  </li>
                ))}
                {steps.length > 4 && <li className="text-ink-500">… ほか {steps.length - 4} 回</li>}
              </ol>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function PathDetail() {
  const { key = '' } = useParams()
  const path = findPath(key)
  if (!path) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">この道筋は見つかりませんでした。</p>
        <Link to="/paths" className="mt-3 inline-flex items-center gap-1 text-moss-700 font-bold">
          <ArrowLeft size={16} /> 学びの道筋へ
        </Link>
      </div>
    )
  }
  const steps = resolvePath(path)
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/paths" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> 学びの道筋
      </Link>
      <p className="mt-4 text-xs font-bold text-moss-700">
        {path.audience === 'student' ? '志す人向け' : path.audience === 'consumer' ? '消費者の疑問' : '志す人・消費者の両方'} ・ {steps.length} 回
      </p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-ink-900">{path.title}</h1>
      <p className="mt-2 text-ink-700 leading-relaxed">{path.lead}</p>
      <div className="mt-8 space-y-4">
        {steps.map((s, i) => (
          <EpisodeCard key={s.episode.id} episode={s.episode} index={i + 1} why={s.why} />
        ))}
      </div>
    </div>
  )
}
