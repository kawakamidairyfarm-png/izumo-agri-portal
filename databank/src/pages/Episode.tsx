import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AudioLines, BookOpen, ChevronDown, ChevronUp, Headphones, Info, Quote, Youtube } from 'lucide-react'
import { Badge } from '../components/EpisodeCard'
import EpisodeCard from '../components/EpisodeCard'
import { AUDIENCE_META, CATEGORY_META, EPISODES, TOPICS, findEpisode, formatDate } from '../lib/data'
import { LINKS, noteLinkFor, spotifyLinkFor, youtubeLinkFor } from '../lib/links'

export default function EpisodePage() {
  const { id = '' } = useParams()
  const episode = findEpisode(id)
  const [showTranscript, setShowTranscript] = useState(false)

  const related = useMemo(() => {
    if (!episode) return []
    return EPISODES.filter((e) => e.id !== episode.id && e.topics.some((t) => episode.topics.includes(t)))
      .sort((a, b) => Number(Boolean(b.article)) - Number(Boolean(a.article)))
      .slice(0, 4)
  }, [episode])

  if (!episode) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">この配信は見つかりませんでした。</p>
        <Link to="/browse" className="mt-3 inline-flex items-center gap-1 text-moss-700 font-bold">
          <ArrowLeft size={16} /> 全配信を探す
        </Link>
      </div>
    )
  }

  const cat = CATEGORY_META[episode.category]
  const a = episode.article
  const idx = EPISODES.findIndex((e) => e.id === episode.id)
  const newer = idx > 0 ? EPISODES[idx - 1] : null
  const older = idx < EPISODES.length - 1 ? EPISODES[idx + 1] : null
  const paragraphs = episode.transcript ? episode.transcript.split(/\n+/).filter((p) => p.trim()) : []
  const note = noteLinkFor(episode)
  const youtube = youtubeLinkFor(episode)
  const spotify = spotifyLinkFor(episode)

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> 全配信を探す
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={cat.tone}>{cat.label}</Badge>
          {episode.audience.map((au) => (
            <Badge key={au}>{AUDIENCE_META[au].label}</Badge>
          ))}
          <span className="text-xs text-ink-500 ml-auto">{formatDate(episode.date)} 配信</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl md:text-3xl font-bold leading-snug text-ink-900">{episode.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(a?.tags ?? episode.topics.map((k) => TOPICS.find((t) => t.key === k)?.label ?? k)).map((t) => (
            <Link key={t} to={`/browse?q=${encodeURIComponent(t)}`} className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs text-ink-700 hover:bg-moss-100">
              #{t}
            </Link>
          ))}
        </div>
      </header>

      {a ? (
        <>
          <section className="mt-8 rounded-2xl bg-white border border-cream-200 p-6 shadow-card">
            <h2 className="text-xs font-bold text-moss-700 tracking-wide">要約</h2>
            <p className="mt-2 leading-relaxed text-ink-900">{a.summary}</p>
          </section>

          <section className="mt-6">
            <h2 className="font-serif text-xl font-bold text-ink-900">要点</h2>
            <ul className="mt-3 space-y-2">
              {a.keyPoints.map((k, i) => (
                <li key={i} className="flex gap-3 leading-relaxed">
                  <span className="shrink-0 mt-2 h-2 w-2 rounded-full bg-hay-500" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </section>

          {a.qa.length > 0 && (
            <section className="mt-8">
              <h2 className="font-serif text-xl font-bold text-ink-900">こんな質問に答えています</h2>
              <div className="mt-3 space-y-3">
                {a.qa.map((p, i) => (
                  <div key={i} className="rounded-2xl bg-cream-100 p-5">
                    <p className="font-bold text-ink-900">Q. {p.q}</p>
                    <p className="mt-2 leading-relaxed text-ink-700">A. {p.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {a.quotes.length > 0 && (
            <section className="mt-8 space-y-3">
              {a.quotes.map((qt, i) => (
                <blockquote key={i} className="flex gap-3 rounded-2xl border-l-4 border-moss-500 bg-moss-50 p-5 font-serif text-lg text-moss-900">
                  <Quote size={20} className="shrink-0 text-moss-500" />
                  <span>{qt}</span>
                </blockquote>
              ))}
            </section>
          )}

          {(a.experience || a.caveats) && (
            <section className="mt-8 grid gap-4 md:grid-cols-2">
              {a.experience && (
                <div className="rounded-2xl bg-white border border-cream-200 p-5">
                  <p className="text-xs font-bold text-moss-700">川上牧場の実体験</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{a.experience}</p>
                </div>
              )}
              {a.caveats && (
                <div className="rounded-2xl bg-hay-100 border border-hay-300/60 p-5">
                  <p className="inline-flex items-center gap-1 text-xs font-bold text-hay-700">
                    <Info size={14} /> 読むときの注意
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-700">{a.caveats}</p>
                </div>
              )}
            </section>
          )}

          {paragraphs.length > 0 && (
            <section className="mt-10">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="w-full flex items-center justify-between rounded-2xl bg-white border border-cream-200 px-5 py-4 text-left hover:border-moss-300"
              >
                <span>
                  <span className="font-bold text-ink-900">配信の全文（文字起こし）</span>
                  <span className="block text-xs text-ink-500 mt-0.5">
                    自動文字起こしのため、固有名詞や数字に誤りが含まれることがあります。約 {Math.round(episode.transcript!.length / 100) * 100} 字
                  </span>
                </span>
                {showTranscript ? <ChevronUp /> : <ChevronDown />}
              </button>
              {showTranscript && (
                <div className="prose-transcript mt-4 rounded-2xl bg-white border border-cream-200 p-6 text-[15px] text-ink-700 space-y-3">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <section className="mt-8 rounded-2xl bg-white border border-cream-200 p-6 shadow-card">
          <p className="font-bold text-ink-900">この回の要約は準備中です。</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            配信本体は Pody で聴けます。要約と全文は、順次このサイトに追加していきます。
          </p>
        </section>
      )}

      <section className="mt-8">
        <p className="text-xs font-bold text-ink-500 mb-2">この回を聴く・読む</p>
        <div className="flex flex-wrap gap-2">
          <a href={note.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-moss-600 text-cream-50 px-4 py-2.5 text-sm font-bold hover:bg-moss-700">
            <BookOpen size={16} /> {note.exact ? 'note で読む' : 'note で探す'}
          </a>
          <a href={youtube.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
            <Youtube size={16} className="text-red-600" /> {youtube.exact ? 'YouTube で聴く' : 'YouTube で探す'}
          </a>
          <a href={spotify.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
            <AudioLines size={16} className="text-green-600" /> {spotify.exact ? 'Spotify で聴く' : 'Spotify で探す'}
          </a>
          <a href={LINKS.pody} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
            <Headphones size={16} /> Pody（番組ページ）
          </a>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          「探す」のボタンは、この回のタイトルで各サービス内を検索します。通常は先頭に該当回が表示されます。Podyでは配信日（
          {formatDate(episode.date)} 前後）から探せます。
        </p>
      </section>

      <nav className="mt-10 grid gap-3 sm:grid-cols-2 text-sm">
        {older && (
          <Link to={`/e/${older.id}`} className="rounded-2xl bg-white border border-cream-200 p-4 hover:border-moss-300">
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <ArrowLeft size={14} /> 前の配信
            </span>
            <span className="block mt-1 font-bold text-ink-900 line-clamp-2">{older.title}</span>
          </Link>
        )}
        {newer && (
          <Link to={`/e/${newer.id}`} className="rounded-2xl bg-white border border-cream-200 p-4 hover:border-moss-300 sm:text-right">
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              次の配信 <ArrowRight size={14} />
            </span>
            <span className="block mt-1 font-bold text-ink-900 line-clamp-2">{newer.title}</span>
          </Link>
        )}
      </nav>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-bold text-ink-900">関連する配信</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {related.map((e) => (
              <EpisodeCard key={e.id} episode={e} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
