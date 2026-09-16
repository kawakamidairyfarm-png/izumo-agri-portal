import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { EPISODES, formatDate, stats } from '../lib/data'

/**
 * 全配信の一覧。年ごとに、日付順のただのリンクで並べる。
 *
 * 「全配信を探す」は探すための画面なので、一度に24件しか出さない。
 * それとは別に、全部の回に一覧から辿れる場所を1つ持っておく。
 * 読む人の道しるべであると同時に、検索エンジンが全ての回を見つける道にもなる。
 */
export default function Archive() {
  const byYear = new Map<string, typeof EPISODES>()
  for (const e of EPISODES) {
    const y = e.date.slice(0, 4)
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(e)
  }
  const years = [...byYear.keys()].sort().reverse()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-ink-900">全配信の一覧</h1>
      <p className="mt-2 text-ink-700 leading-relaxed">
        {formatDate(stats.earliest)} から {formatDate(stats.latest)} までの {EPISODES.length} 回を、新しい順に並べています。
      </p>
      <Link
        to="/browse"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 shadow-card hover:border-moss-300"
      >
        <Search size={16} /> 言葉で探す
      </Link>

      <nav aria-label="年" className="mt-6 flex flex-wrap gap-1.5">
        {years.map((y) => (
          <a
            key={y}
            href={`#y${y}`}
            className="rounded-full border border-cream-200 bg-white px-3 py-1 text-sm font-medium text-ink-700 hover:border-moss-300 hover:text-moss-700"
          >
            {y}年
          </a>
        ))}
      </nav>

      {years.map((y) => (
        <section key={y} className="mt-8">
          <h2 id={`y${y}`} className="scroll-mt-20 font-serif text-xl font-bold text-ink-900">
            {y}年 <span className="text-sm font-sans font-medium text-ink-500">{byYear.get(y)!.length} 回</span>
          </h2>
          <ul className="mt-3 divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
            {byYear.get(y)!.map((e) => (
              <li key={e.id}>
                <Link to={`/e/${e.id}`} className="flex gap-3 px-4 py-3 text-sm hover:bg-cream-50">
                  <span className="shrink-0 tabular-nums text-ink-500">{e.date.slice(5).replace('-', '/')}</span>
                  <span className="min-w-0 text-ink-900">{e.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
