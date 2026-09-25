import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AudioLines, BookOpen, ChevronDown, ChevronUp, Headphones, Info, Quote, Youtube } from 'lucide-react'
import EpisodeCard from '../components/EpisodeCard'
import { EPISODES, TOPICS, findEpisode, formatDate, paragraphs as toParagraphs } from '../lib/data'
import { LINKS, noteLinkFor, spotifyLinkFor, youtubeLinkFor } from '../lib/links'
import { loadTranscript } from '../lib/transcripts'
import { extractSummary } from '../lib/transcript'
import NextSteps from '../components/NextSteps'
import ShareBar from '../components/ShareBar'
import TranscriptBody from '../components/TranscriptBody'

export default function EpisodePage() {
  const { id = '' } = useParams()
  const episode = findEpisode(id)
  // 要約が無い回は全文が主役なので、最初から開いておく（要約がある回はたたんだまま）
  const [showTranscript, setShowTranscript] = useState(!episode?.article)
  const [transcript, setTranscript] = useState<string | null>(null)
  // 別の回へ移ったら、本文と開閉をその回のものに戻す（描画中に直すので効果の中で setState しない）
  const [lastId, setLastId] = useState(id)
  if (lastId !== id) {
    setLastId(id)
    setTranscript(null)
    setShowTranscript(!episode?.article)
  }
  useEffect(() => {
    let alive = true
    if (episode?.transcriptKey) loadTranscript(episode.transcriptKey).then((t) => alive && setTranscript(t))
    return () => {
      alive = false
    }
  }, [episode])

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

  const a = episode.article
  // 編集した記事が無い回は、全文の「まとめ」を要約として先頭に出し、全文からはその節を外す
  const sum = !a && transcript ? extractSummary(transcript) : null
  const bodyText = sum?.abstract ? sum.body : transcript
  const idx = EPISODES.findIndex((e) => e.id === episode.id)
  const newer = idx > 0 ? EPISODES[idx - 1] : null
  const older = idx < EPISODES.length - 1 ? EPISODES[idx + 1] : null
  const note = noteLinkFor(episode)
  const youtube = youtubeLinkFor(episode)
  const spotify = spotifyLinkFor(episode)

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/browse" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} /> 全配信を探す
      </Link>

      <header className="mt-4">
        {/* 頭は「いつ・何の話か・どう読むか」だけ。分類と対象の札、ハッシュタグ、共有は本文の後ろへ（2026-09-25 金継ぎ） */}
        <p className="text-sm text-ink-500 tabular-nums"><time dateTime={episode.date}>{formatDate(episode.date)}</time> 配信</p>
        <h1 className="mt-1 font-serif text-2xl md:text-3xl font-bold leading-snug text-ink-900 [text-wrap:balance]">{episode.title}</h1>
        {episode.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {/* テーマの札。押すと、その話をした回・質問・ことばがまとまった入口へ */}
            {episode.topics.map((k) => {
              const t = TOPICS.find((x) => x.key === k)
              return t ? (
                <Link key={k} to={`/t/${k}`} className="rounded-full bg-moss-50 border border-moss-300/60 px-3 py-1 text-xs font-bold text-moss-900 hover:bg-moss-100">
                  {t.label}
                </Link>
              ) : null
            })}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={episode.podyUrl ?? LINKS.pody}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-moss-900"
          >
            <Headphones size={16} /> 音声で聴く
          </a>
          {transcript && (
            <button
              type="button"
              onClick={() => {
                setShowTranscript(true)
                requestAnimationFrame(() => document.getElementById('zenbun')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300"
            >
              <BookOpen size={16} /> 全文を読む
            </button>
          )}
        </div>
      </header>

      {a ? (
        <>
          <section className="mt-8 rounded-2xl bg-white border border-cream-200 p-6 shadow-card">
            <h2 className="text-sm font-bold text-moss-700 tracking-wide">要約</h2>
            {toParagraphs(a.summary).map((t, i) => (
              <p key={i} className="mt-2 leading-relaxed text-ink-900">{t}</p>
            ))}
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
                    {toParagraphs(p.a).map((t, j) => (
                      <p key={j} className="mt-2 leading-relaxed text-ink-700">{j === 0 ? 'A. ' : ''}{t}</p>
                    ))}
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
                  <p className="text-sm font-bold text-moss-700">川上牧場の実体験</p>
                  {toParagraphs(a.experience).map((t, i) => (
                    <p key={i} className="mt-2 text-sm leading-relaxed text-ink-700">{t}</p>
                  ))}
                </div>
              )}
              {a.caveats && (
                <div className="rounded-2xl bg-hay-100 border border-hay-300/60 p-5">
                  <p className="inline-flex items-center gap-1 text-sm font-bold text-hay-700">
                    <Info size={14} /> 読むときの注意
                  </p>
                  {toParagraphs(a.caveats).map((t, i) => (
                    <p key={i} className="mt-2 text-sm leading-relaxed text-ink-700">{t}</p>
                  ))}
                </div>
              )}
            </section>
          )}

        </>
      ) : sum?.abstract ? (
        <>
          <section className="mt-8 rounded-2xl bg-white border border-cream-200 p-6 shadow-card">
            <h2 className="text-sm font-bold text-moss-700 tracking-wide">要約</h2>
            <p className="mt-2 leading-relaxed text-ink-900">{sum.abstract}</p>
            <p className="mt-2 text-xs text-ink-500">podyの記事の「まとめ」より。固有名詞や数字に誤りが含まれることがあります。</p>
          </section>
          {sum.points.length > 0 && (
            <section className="mt-6">
              <h2 className="font-serif text-xl font-bold text-ink-900">要点</h2>
              <ul className="mt-3 space-y-2">
                {sum.points.map((k, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="shrink-0 mt-2 h-2 w-2 rounded-full bg-hay-500" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : episode.hasTranscript ? null : (
        /* 全文も要約も無い回だけ、どこで読めるかを案内する（全文がある回は、この下の全文が主役） */
        <section className="mt-8 rounded-2xl bg-white border border-cream-200 p-6 shadow-card">
          <p className="font-bold text-ink-900">この回は、まだこのサイトで読めません。</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {episode.paidNote
              ? 'この回の全文は note の記事として公開しています（下に案内があります）。配信本体は Pody で聴けます。'
              : '配信本体は Pody で聴けます。全文は、記事ができしだいこのサイトに追加していきます。'}
          </p>
        </section>
      )}

      {transcript && (
        <section id="zenbun" className="mt-10 scroll-mt-20">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
            className="w-full flex items-center justify-between rounded-2xl bg-white border border-cream-200 px-5 py-4 text-left hover:border-moss-300"
          >
            <span>
              <span className="font-bold text-ink-900">
                {episode.transcriptSource === 'note'
                  ? '配信の全文（noteの記事より）'
                  : episode.transcriptSource === 'pody'
                    ? '配信の全文（podyの記事より）'
                    : '配信の全文（文字起こし）'}
              </span>
              <span className="block text-sm text-ink-500 mt-0.5">
                {episode.transcriptSource === 'note'
                  ? 'noteで無料公開されている記事の本文です。AIによる文字起こしを含むため、固有名詞や数字に誤りが含まれることがあります。'
                  : episode.transcriptSource === 'pody'
                    ? 'podyがこの回の音声からAIで起こした記事です。章ごとの見出しと要点つき。固有名詞や数字に誤りが含まれることがあります。'
                    : '自動文字起こしのため、固有名詞や数字に誤りが含まれることがあります。'}
                約 {Math.round(transcript!.length / 100) * 100} 字
              </span>
            </span>
            {showTranscript ? <ChevronUp /> : <ChevronDown />}
          </button>
          {showTranscript && (
            <div className="mt-4 rounded-2xl bg-white border border-cream-200 p-6">
              <TranscriptBody text={bodyText!} />
              {episode.transcriptSource === 'note' && episode.noteUrl && (
                <p className="pt-2 text-sm text-ink-500">
                  出典：
                  <a href={episode.noteUrl} target="_blank" rel="noreferrer" className="underline decoration-moss-300 hover:text-moss-700">
                    noteの記事を開く
                  </a>
                </p>
              )}
              {episode.transcriptSource === 'pody' && episode.podyUrl && (
                <p className="pt-2 text-sm text-ink-500">
                  出典：
                  <a href={episode.podyUrl} target="_blank" rel="noreferrer" className="underline decoration-moss-300 hover:text-moss-700">
                    podyで読む（音声つき・章ごとに再生できます）
                  </a>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* noteの有料記事になっている回は、このサイトに全文を置いていない＝どこで読めるかを正直に案内する */}
      {episode.paidNote && (
        <section className="mt-8 rounded-2xl border border-hay-300/70 bg-hay-100 p-6">
          <p className="inline-flex items-center gap-1.5 font-bold text-ink-900">
            <BookOpen size={16} className="text-hay-700" /> もっと詳しくは、noteの記事で。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            この回の全文は、note{'の'}
            {episode.notePrice ? `有料記事（${episode.notePrice.toLocaleString()}円）` : 'メンバーシップ限定記事'}
            として公開しています。数字の出どころや、配信で話しきれなかったところまで書いてあります。
            配信の音声そのものは、Pody・Spotify・YouTube でどなたでも無料で聴けます。
          </p>
          <a
            href={note.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-moss-700 text-white px-4 py-2.5 text-sm font-bold hover:bg-moss-900"
          >
            <BookOpen size={16} />
            {note.exact
              ? episode.notePrice
                ? `note で読む（${episode.notePrice.toLocaleString()}円）`
                : 'note で読む（メンバーシップ限定）'
              : 'note で探す'}
          </a>
        </section>
      )}

      <section className="mt-8">
        <p className="text-sm font-bold text-ink-500 mb-2">ほかの場所で聴く・読む</p>
        <div className="flex flex-wrap gap-2">
          <a href={note.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-moss-700 text-white px-4 py-2.5 text-sm font-bold hover:bg-moss-900">
            <BookOpen size={16} />{' '}
            {note.exact
              ? episode.paidNote
                ? episode.notePrice
                  ? `note で読む（${episode.notePrice.toLocaleString()}円）`
                  : 'note で読む（メンバーシップ限定）'
                : 'note で読む'
              : 'note で探す'}
          </a>
          <a href={youtube.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
            <Youtube size={16} className="text-red-600" /> {youtube.exact ? 'YouTube で聴く' : 'YouTube で探す'}
          </a>
          <a href={spotify.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
            <AudioLines size={16} className="text-green-600" /> {spotify.exact ? 'Spotify で聴く' : 'Spotify で探す'}
          </a>
          <a href={episode.podyUrl ?? LINKS.pody} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
            <Headphones size={16} /> {episode.podyUrl ? 'Pody で読む・聴く' : 'Pody（番組ページ）'}
          </a>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          「探す」のボタンは、この回のタイトルで各サービス内を検索します。通常は先頭に該当回が表示されます。
          {!episode.podyUrl && <>Podyでは配信日（{formatDate(episode.date)} 前後）から探せます。</>}
        </p>
      </section>

      <section className="mt-8 rounded-2xl bg-white border border-cream-200 p-5">
        <p className="text-sm font-bold text-ink-900">この回を人に教える</p>
        <ShareBar title={episode.title} url={`${location.origin}${location.pathname}`} />
        {(a?.tags ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-ink-500">この回のことば：</span>
            {(a?.tags ?? []).map((t) => (
              <Link key={t} to={`/browse?q=${encodeURIComponent(t)}`} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs text-ink-700 hover:bg-moss-100">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 両方の相手に当たる回は、来る人の多い飲む人向けの文面を既定にする */}
      <NextSteps compact audience={episode.audience.includes('consumer') ? 'consumer' : 'student'} />

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
