import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, MessageCircle, Search } from 'lucide-react'
import { ARTICLES, BY_TRANSCRIPT, formatDate, leadOf, type Episode } from '../lib/data'
import { LINKS } from '../lib/links'
import { splitParagraph } from '../lib/transcript'
import { useNarrow } from '../lib/useNarrow'

type QA = { q: string; a: string; episode: Episode }

/**
 * 届いた質問と、答えた回。
 *
 * 配信に届いた質問（podyの記事の「質問」の箱）と、編集した記事のQ&Aを一枚に集める。
 * 質問は本物のリスナーから届いたもので、答えは本人がその朝に話したこと。
 * ここが、ほかのどこにも無いこのサイトの芯なので、「あなたの質問も次の配信になる」まで一続きにする。
 * 質問した人の名前はこの一覧には出さない（回のページには pody の記事どおり出る）。
 */
export default function Questions() {
  const [fromBodies, setFromBodies] = useState<QA[] | null>(null)
  const [q, setQ] = useState('')
  const narrow = useNarrow()
  useEffect(() => {
    let alive = true
    import('../../data/questions.json').then((m) => {
      if (!alive) return
      const rows = (m.default as { q: string; a: string; key: string }[])
        .map((r) => ({ q: r.q, a: r.a, episode: BY_TRANSCRIPT.get(r.key)! }))
        .filter((r) => r.episode)
      setFromBodies(rows)
    })
    return () => {
      alive = false
    }
  }, [])

  const all = useMemo(() => {
    const edited: QA[] = ARTICLES.flatMap((e) => e.article!.qa.map((p) => ({ q: p.q, a: p.a, episode: e })))
    const seen = new Set(edited.map((x) => x.q))
    const rows = [...edited, ...(fromBodies ?? []).filter((x) => !seen.has(x.q))]
    return rows.sort((a, b) => (a.episode.date < b.episode.date ? 1 : a.episode.date > b.episode.date ? -1 : 0))
  }, [fromBodies])

  const needle = q.trim()
  const shown = needle ? all.filter((x) => x.q.includes(needle) || x.a.includes(needle)) : all

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="text-sm font-bold text-moss-700">牧場に届いた質問</p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-ink-900 [text-wrap:balance]">届いた質問と、答えた回</h1>
      <p className="mt-3 text-ink-700 leading-relaxed">
        配信に届いた質問と、そのとき酪農家が答えたことを、{all.length} 件並べています。答えは配信時点の経験と意見です。
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white border border-cream-200 px-4 py-2.5 shadow-card focus-within:border-moss-500">
          <Search size={18} className="shrink-0 text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="例：バター、子牛、給食"
            className="search-input min-w-0 flex-1 bg-white text-ink-900 placeholder:text-ink-500 outline-none"
            aria-label="質問を絞り込む"
          />
        </label>
        <a
          href={LINKS.line}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-moss-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-moss-900"
        >
          <MessageCircle size={18} /> 自分の質問を送る（LINE）
        </a>
      </div>
      <p className="mt-2 text-sm text-ink-500">送ってもらった質問は、朝の配信で答えることがあります。答えた回は、ここに加わります。</p>

      {needle && <p className="mt-6 text-sm text-ink-700">{shown.length} 件</p>}

      <ul className="mt-4 space-y-3">
        {shown.map((x, i) => (
          <li key={`${x.episode.id}-${i}`}>
            <Link to={`/e/${x.episode.id}`} className="block rounded-2xl bg-white border border-cream-200 p-5 shadow-card hover:border-moss-300 transition-colors">
              <p className="flex items-start gap-2 font-bold text-ink-900">
                <HelpCircle size={18} className="shrink-0 mt-0.5 text-moss-700" />
                <span className="min-w-0 [overflow-wrap:anywhere]">{x.q}</span>
              </p>
              {x.a && (
                <div className="mt-2 space-y-1.5 text-sm text-ink-700 leading-relaxed">
                  {(narrow ? splitParagraph(leadOf(x.a, 120), 60, 20) : [leadOf(x.a, 120)]).map((t, j) => (
                    <p key={j}>{t}</p>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-ink-500">
                {formatDate(x.episode.date)}{'\u3000'}{x.episode.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {fromBodies === null && <p className="mt-4 text-sm text-ink-500">配信に届いた質問を読み込んでいます…</p>}
    </div>
  )
}
