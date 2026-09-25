import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { BY_TRANSCRIPT, formatDate, topicByKey, type Episode } from '../lib/data'
import GroupFilter, { MoreButton } from '../components/GroupFilter'
import { splitParagraph } from '../lib/transcript'
import { useNarrow } from '../lib/useNarrow'

type Term = { term: string; text: string; episode: Episode }

const PAGE = 40
const groupsOf = (e: Episode) => e.topics.map((k) => topicByKey(k)?.group).filter(Boolean) as string[]

/**
 * 酪農のことば帖。
 *
 * 配信の中で出てきた用語と、そのとき本人が付けた説明（podyの記事の「用語メモ」）を、言葉ごとにまとめる。
 * 辞書の定義ではなく、現場の酪農家が自分の言葉で説明したもの。同じ言葉が何度も出てくるなら、出てきた回を全部つなぐ。
 */
export default function Terms() {
  const [rows, setRows] = useState<Term[] | null>(null)
  // テーマのページの「このテーマのことば」から ?q=言葉 で来たら、その言葉で絞った状態で開く（2026-09-25 まで読んでいなかった）
  const [params] = useSearchParams()
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [group, setGroup] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const narrow = useNarrow()
  useEffect(() => {
    let alive = true
    import('../../data/terms.json').then((m) => {
      if (!alive) return
      setRows(
        (m.default as { term: string; text: string; key: string }[])
          .map((r) => ({ term: r.term, text: r.text, episode: BY_TRANSCRIPT.get(r.key)! }))
          .filter((r) => r.episode),
      )
    })
    return () => {
      alive = false
    }
  }, [])

  // 言葉ごとに束ねる。説明は最初に出てきた回のもの、出てきた回は新しい順
  const groups = useMemo(() => {
    const m = new Map<string, Term[]>()
    for (const r of rows ?? []) {
      if (!m.has(r.term)) m.set(r.term, [])
      m.get(r.term)!.push(r)
    }
    return [...m.entries()]
      .map(([term, list]) => ({
        term,
        list: [...list].sort((a, b) => (a.episode.date < b.episode.date ? 1 : -1)),
      }))
      .sort((a, b) => a.term.localeCompare(b.term, 'ja'))
  }, [rows])

  const needle = q.trim()
  const groupOfTerm = (g: { list: Term[] }) => new Set(g.list.flatMap((r) => groupsOf(r.episode)))
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const g of groups) for (const k of groupOfTerm(g)) m.set(k, (m.get(k) ?? 0) + 1)
    return m
  }, [groups])
  const matched = groups.filter(
    (g) =>
      (!needle || g.term.includes(needle) || g.list.some((r) => r.text.includes(needle))) &&
      (!group || groupOfTerm(g).has(group)),
  )
  const shown = matched.slice(0, limit)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm font-bold text-moss-700">配信で出てきたことば</p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-ink-900">酪農のことば帖</h1>
      <p className="mt-3 text-ink-700 leading-relaxed">
        配信の中で出てきた言葉を、そのとき酪農家が自分の言葉で説明したまま {groups.length} 語並べています。辞書の定義ではなく、現場の言い方です。
      </p>

      <label className="mt-5 flex items-center gap-2 rounded-2xl bg-white border border-cream-200 px-4 py-2.5 shadow-card focus-within:border-moss-500">
        <Search size={18} className="shrink-0 text-ink-500" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setLimit(PAGE)
          }}
          placeholder="例：乳糖不耐症、牛群検定、初乳"
          className="search-input min-w-0 flex-1 bg-white text-ink-900 placeholder:text-ink-500 outline-none"
          aria-label="ことばを絞り込む"
        />
      </label>
      <GroupFilter
        value={group}
        onChange={(g) => {
          setGroup(g)
          setLimit(PAGE)
        }}
        counts={counts}
        total={groups.length}
        label="テーマで絞る"
      />
      {(needle || group) && <p className="mt-3 text-sm text-ink-700">{matched.length} 語</p>}

      <dl className="mt-6 divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
        {shown.map((g) => (
          <div key={g.term} className="px-5 py-4">
            <dt className="font-bold text-ink-900">{g.term}</dt>
            <dd className="mt-1 space-y-1.5 text-sm leading-relaxed text-ink-700">
              {(narrow ? splitParagraph(g.list[0].text, 60, 20) : [g.list[0].text]).map((t, j) => (
                <p key={j}>{t}</p>
              ))}
            </dd>
            <dd className="mt-2 text-xs text-ink-500">
              出てきた回：
              {g.list.slice(0, 3).map((r, i) => (
                <span key={r.episode.id + i}>
                  {i > 0 && '／'}
                  <Link to={`/e/${r.episode.id}`} className="underline decoration-moss-300 hover:text-moss-700">
                    {formatDate(r.episode.date)}
                  </Link>
                </span>
              ))}
              {g.list.length > 3 && ` ほか ${g.list.length - 3} 回`}
            </dd>
          </div>
        ))}
      </dl>
      <MoreButton rest={matched.length - shown.length} onClick={() => setLimit((n) => n + PAGE)} />
      {rows === null && <p className="mt-4 text-sm text-ink-500">読み込んでいます…</p>}
    </div>
  )
}
