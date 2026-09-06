import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react'
import SearchBox from '../components/SearchBox'
import EpisodeCard from '../components/EpisodeCard'
import { AUDIENCE_META, CATEGORY_META, EPISODES, SERIES, TOPICS, type Audience, type Category, type Episode } from '../lib/data'
import { search } from '../lib/search'

const CATS = Object.keys(CATEGORY_META) as Category[]

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const q = params.get('q') ?? ''
  const audience = params.get('audience') as Audience | null
  const category = params.get('category') as Category | null
  const topic = params.get('topic')
  const series = params.get('series')
  const hasArticle = params.get('has') === 'article'
  const year = params.get('year')

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    let base: { episode: Episode; snippet: string | null }[]
    if (q) base = search(q, 400).map((h) => ({ episode: h.episode, snippet: h.snippet }))
    else base = EPISODES.map((e) => ({ episode: e, snippet: null }))
    return base.filter(({ episode: e }) => {
      if (audience && !e.audience.includes(audience)) return false
      if (category && e.category !== category) return false
      if (topic && !e.topics.includes(topic)) return false
      if (series && e.series !== series) return false
      if (hasArticle && !e.article) return false
      if (year && !e.date.startsWith(year)) return false
      return true
    })
  }, [q, audience, category, topic, series, hasArticle, year])

  const years = useMemo(() => Array.from(new Set(EPISODES.map((e) => e.date.slice(0, 4)))).sort().reverse(), [])
  const activeFilters = [audience, category, topic, series, hasArticle ? 'article' : null, year].filter(Boolean).length

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold text-ink-900">全配信を探す</h1>
      <p className="mt-1 text-sm text-ink-700">
        タイトル、要約、全文（要約つきの回）を横断して検索します。文字起こしの誤変換（楽能→酪農 など）は自動で吸収します。
      </p>
      <div className="mt-5">
        <SearchBox initial={q} onSearch={(v) => set('q', v || null)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          {/* モバイルでは折りたたみ、PCでは常時表示 */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden w-full flex items-center justify-between rounded-2xl bg-white border border-cream-200 px-4 py-3 shadow-card"
            aria-expanded={filtersOpen}
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900">
              <SlidersHorizontal size={16} /> 絞り込み
              {activeFilters > 0 && (
                <span className="ml-1 rounded-full bg-moss-700 text-white text-xs px-2 py-0.5">{activeFilters}</span>
              )}
            </span>
            {filtersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div className={`${filtersOpen ? 'block' : 'hidden'} lg:block space-y-5 mt-4 lg:mt-0`}>
          <div className="hidden lg:flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900">
              <SlidersHorizontal size={16} /> 絞り込み
            </p>
            {activeFilters > 0 && (
              <button
                className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900"
                onClick={() => setParams(q ? { q } : {}, { replace: true })}
              >
                <X size={14} /> 解除
              </button>
            )}
          </div>
          {activeFilters > 0 && (
            <button
              className="lg:hidden inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900"
              onClick={() => setParams(q ? { q } : {}, { replace: true })}
            >
              <X size={14} /> 絞り込みを解除
            </button>
          )}

          <Filter label="読む人">
            {(Object.keys(AUDIENCE_META) as Audience[]).map((a) => (
              <Chip key={a} active={audience === a} onClick={() => set('audience', audience === a ? null : a)}>
                {AUDIENCE_META[a].short}
              </Chip>
            ))}
            <Chip active={hasArticle} onClick={() => set('has', hasArticle ? null : 'article')}>
              要約つきのみ
            </Chip>
          </Filter>

          <Filter label="分類">
            {CATS.map((c) => (
              <Chip key={c} active={category === c} onClick={() => set('category', category === c ? null : c)}>
                {CATEGORY_META[c].label}
              </Chip>
            ))}
          </Filter>

          <Filter label="テーマ">
            {TOPICS.map((t) => (
              <Chip key={t.key} active={topic === t.key} onClick={() => set('topic', topic === t.key ? null : t.key)}>
                {t.label}
              </Chip>
            ))}
          </Filter>

          <Filter label="シリーズ">
            {SERIES.map((s) => (
              <Chip key={s.key} active={series === s.key} onClick={() => set('series', series === s.key ? null : s.key)}>
                {s.label}
              </Chip>
            ))}
          </Filter>

          <Filter label="年">
            {years.map((y) => (
              <Chip key={y} active={year === y} onClick={() => set('year', year === y ? null : y)}>
                {y}
              </Chip>
            ))}
          </Filter>
          </div>
        </aside>

        <div>
          <p className="text-sm text-ink-500 mb-3">
            {results.length} 件{q && <>（「{q}」）</>}
          </p>
          {results.length === 0 ? (
            <div className="rounded-2xl bg-white border border-cream-200 p-8 text-center text-ink-700">
              <p className="font-bold">見つかりませんでした。</p>
              <p className="mt-1 text-sm">言い方を変えるか、絞り込みを解除してみてください。要約のない回は、タイトルのみで検索されます。</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map(({ episode, snippet }) => (
                <EpisodeCard key={episode.id} episode={episode} query={q} snippet={snippet} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-ink-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
        active ? 'bg-moss-700 border-moss-700 text-white' : 'bg-white border-cream-200 text-ink-700 hover:border-moss-300'
      }`}
    >
      {children}
    </button>
  )
}
