import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Headphones, HelpCircle, MessageCircle } from 'lucide-react'
import { formatDate, topicByKey } from '../lib/data'
import { LINKS } from '../lib/links'
import { useAllQA } from '../lib/qa'
import { splitParagraph } from '../lib/transcript'

/**
 * 届いた質問1問のページ（/q/<id>・2026-09-27）。
 * 「牛乳 原価」のように質問そのもので調べる人の入口。答えの要約・答えた回・同じテーマの質問・自分の質問を送る、を1枚に。
 * 答えは配信の記事（編集した記事、または pody の記事）をもとにしたもの。ここで新しい答えは作らない。
 */
export default function QAPage() {
  const { id = '' } = useParams()
  const all = useAllQA()
  if (!all) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink-500">読み込んでいます…</div>
  const item = all.find((x) => x.id === id)
  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-bold">この質問は見つかりませんでした。</p>
        <Link to="/questions" className="mt-3 inline-flex items-center gap-1 text-moss-700 font-bold">
          <ArrowLeft size={16} /> 届いた質問をすべて見る
        </Link>
      </div>
    )
  }
  const e = item.episode
  const topic = e.topics.map((k) => topicByKey(k)).find(Boolean)
  const same = all
    .filter((x) => x.id !== item.id && x.episode.topics.some((t) => e.topics.includes(t)))
    .slice(0, 5)
  const paras = item.a ? item.a.split(/\n+/).flatMap((t) => splitParagraph(t, 90, 30)) : []

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-ink-500 flex flex-wrap items-center gap-1">
        <Link to="/questions" className="hover:text-ink-900">届いた質問</Link>
        {topic && (
          <>
            <span>›</span>
            <Link to={`/t/${topic.key}`} className="hover:text-ink-900">{topic.label}</Link>
          </>
        )}
      </nav>

      <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-moss-700">
        <HelpCircle size={16} /> 牧場に届いた質問
      </p>
      <h1
        className={`mt-1 font-serif font-bold leading-snug text-ink-900 [overflow-wrap:anywhere] ${
          item.q.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
        }`}
      >
        {item.q}
      </h1>

      <section className="mt-6 rounded-2xl bg-white border border-cream-200 p-6 shadow-card">
        <h2 className="text-sm font-bold text-moss-700">配信で答えたこと（要約）</h2>
        {paras.length > 0 ? (
          <div className="mt-2 space-y-2 leading-relaxed text-ink-900">
            {paras.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
        ) : (
          <p className="mt-2 leading-relaxed text-ink-700">答えは、この回の配信で話しています。</p>
        )}
        <small className="mt-3 block text-xs text-ink-500">
          <time dateTime={e.date}>{formatDate(e.date)}</time>の配信の記事をもとにまとめたものです。答えは配信時点の経験と意見です。
        </small>
      </section>

      <section className="mt-6 rounded-2xl bg-cream-100 p-5">
        <p className="text-sm font-bold text-ink-900">この質問に答えた回</p>
        <Link to={`/e/${e.id}`} className="mt-1 block font-bold text-moss-700 underline decoration-moss-300 underline-offset-4 hover:text-moss-900">
          {e.title}
        </Link>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/e/${e.id}`} className="inline-flex items-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-moss-900">
            <BookOpen size={16} /> この回を読む
          </Link>
          <a
            href={e.podyUrl ?? LINKS.pody}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300"
          >
            <Headphones size={16} /> 音声で聴く
          </a>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-moss-900 p-6 text-white">
        <p className="text-sm font-bold text-hay-100">あなたの「なぜ？」も</p>
        <h2 className="mt-1 font-serif text-xl font-bold [text-wrap:balance]">あなたの質問が、誰かの牛乳をもっとおいしくする。</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/90">牛乳や牛のことで気になったことを、LINEで送ってください。毎朝の配信で答えています。</p>
        <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark">
          <MessageCircle size={18} /> 質問を送る（LINE）
        </a>
      </section>

      {same.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold text-ink-900">同じテーマの質問</h2>
          <ul className="mt-3 divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200">
            {same.map((x) => (
              <li key={x.id}>
                <Link to={`/q/${x.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-cream-50">
                  <span className="shrink-0 font-serif font-bold text-moss-700">Q</span>
                  <span className="min-w-0 flex-1 text-ink-900 [overflow-wrap:anywhere]">{x.q}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link to="/questions" className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
        届いた質問をすべて見る <ArrowRight size={16} />
      </Link>
    </article>
  )
}
