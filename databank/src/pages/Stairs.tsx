import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import EpisodeCard from '../components/EpisodeCard'
import NextSteps from '../components/NextSteps'
import type { Audience } from '../lib/data'
import { AUDIENCE_LABEL, STAIRS, findStair, resolveStair, stairEpisodeCount, stairPosition, stairsFor } from '../lib/stairs'

/**
 * 変化の階段（相手の「いまの状態」から入る入口）。
 * 一段ずつ番号つきで並べ、飲む人を先に。トップと二つの入口ページで使い回す。
 */
export function StairLadder({ audience, compact = false }: { audience: Audience; compact?: boolean }) {
  const list = stairsFor(audience)
  return (
    <ol className={`grid gap-3 ${compact ? '' : 'md:gap-4'}`}>
      {list.map((s, i) => (
        <li key={s.key}>
          <Link
            to={`/stair/${s.key}`}
            className="group flex items-start gap-4 rounded-2xl bg-white border border-cream-200 shadow-card p-5 hover:border-moss-300 transition-colors"
          >
            <span className="shrink-0 h-10 w-10 rounded-full bg-moss-700 text-white font-serif text-lg font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-lg font-bold text-ink-900 group-hover:text-moss-700 [text-wrap:balance]">{s.title}</span>
              {!compact && <span className="mt-1 block text-sm text-ink-700 leading-relaxed">{s.lead}</span>}
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
                この段を読む <span className="font-normal text-ink-500">{stairEpisodeCount(s)} 回</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** /stairs: 二つの相手の階段をならべた入口 */
export function StairsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-ink-900">あなたはいま、どこ？</h1>
      <p className="mt-1 text-sm text-ink-700 max-w-2xl leading-relaxed">
        テーマの名前で探すより、いまの自分に近い段から入るほうが早く着きます。牛乳を飲む人は上から、酪農を志す人は下から。どの段にも、読み終わったあとの次の一歩を一つだけ置いています。
      </p>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {(['consumer', 'student'] as const).map((au) => (
          <section key={au}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl font-bold text-ink-900">{AUDIENCE_LABEL[au]}</h2>
              <Link to={au === 'consumer' ? '/for-consumers' : '/for-students'} className="text-sm font-bold text-moss-700 hover:underline">
                {au === 'consumer' ? '飲む人の入口へ' : '志す人の入口へ'}
              </Link>
            </div>
            <div className="mt-3">
              <StairLadder audience={au} />
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-500">
        棚の名前から探したい人は <Link to="/topics" className="font-bold text-moss-700 hover:underline">テーマから探す</Link>（{STAIRS.length} 段の下に、8つの大分類と39の小分類があります）。
      </p>
    </div>
  )
}

/** /stair/:key: 一段の中身。小分類ごとに回を出し、段の次の一歩を一つだけ置く */
export function StairDetail() {
  const { key = '' } = useParams()
  const stair = findStair(key)
  if (!stair) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">この段は見つかりませんでした。</p>
        <Link to="/stairs" className="mt-3 inline-flex items-center gap-1 text-moss-700 font-bold">
          <ArrowLeft size={16} /> あなたはいま、どこ？
        </Link>
      </div>
    )
  }
  const { n, of } = stairPosition(stair)
  const list = stairsFor(stair.audience)
  const prev = list[n - 2]
  const next = list[n]
  const parts = resolveStair(stair)
  const total = stairEpisodeCount(stair)
  const back = stair.audience === 'consumer' ? '/for-consumers' : '/for-students'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <nav className="text-sm text-ink-500 flex flex-wrap items-center gap-1">
        <Link to={back} className="hover:text-ink-900">{AUDIENCE_LABEL[stair.audience]}</Link>
        <span>›</span>
        <span>{n} 段目／{of}</span>
      </nav>
      <h1 className="mt-2 font-serif text-3xl font-bold text-ink-900 [text-wrap:balance]">{stair.title}</h1>
      <p className="mt-2 text-ink-700 leading-relaxed">{stair.lead}</p>
      <p className="mt-1 text-sm text-ink-500">{parts.length} つのテーマ、{total} 回。各テーマは要約のある回から順に並べています。</p>

      <ol className="mt-8 space-y-8">
        {parts.map((p, i) => (
          <li key={p.topic.key}>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-2xl font-bold text-moss-700">{i + 1}</span>
              <div>
                <h2 className="font-serif text-xl font-bold text-ink-900">
                  <Link to={`/t/${p.topic.key}`} className="hover:text-moss-700">
                    {p.topic.label}
                  </Link>
                </h2>
                <p className="text-sm text-ink-700">{p.topic.blurb}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {p.episodes.slice(0, 2).map((e) => (
                <EpisodeCard key={e.id} episode={e} />
              ))}
            </div>
            {p.episodes.length > 2 && (
              <Link to={`/t/${p.topic.key}`} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:text-moss-900">
                このテーマの {p.episodes.length} 回をすべて見る <ArrowRight size={14} />
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* この段の次の一歩は一つだけ */}
      <section className="mt-10 rounded-2xl bg-moss-50 border border-moss-100 p-6 md:p-8">
        <p className="text-sm font-bold text-moss-700">この段を読んだら</p>
        <h2 className="mt-1 font-serif text-xl font-bold text-ink-900 [text-wrap:balance]">{stair.next.label}</h2>
        <p className="mt-2 text-sm text-ink-700 leading-relaxed max-w-2xl">{stair.next.text}</p>
        <a
          href={stair.next.href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors"
        >
          {stair.next.cta} <ExternalLink size={16} />
        </a>
      </section>

      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-bold">
        {prev ? (
          <Link to={`/stair/${prev.key}`} className="inline-flex items-center gap-1 text-moss-700 hover:text-moss-900">
            <ArrowLeft size={16} /> {n - 1} 段目: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/stair/${next.key}`} className="inline-flex items-center gap-1 text-moss-700 hover:text-moss-900 text-right">
            {n + 1} 段目: {next.title} <ArrowRight size={16} />
          </Link>
        ) : (
          <Link to="/stairs" className="inline-flex items-center gap-1 text-moss-700 hover:text-moss-900">
            ほかの段を見る <ArrowRight size={16} />
          </Link>
        )}
      </div>

      <NextSteps audience={stair.audience} compact />
    </div>
  )
}
