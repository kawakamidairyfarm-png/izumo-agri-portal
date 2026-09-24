import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MessageCircle } from 'lucide-react'
import EpisodeCard from '../components/EpisodeCard'
import SearchBox from '../components/SearchBox'
import { formatDate } from '../lib/data'
import { LINKS } from '../lib/links'
import { LIVES, recentEpisodes } from '../lib/live'

/**
 * LIVEを見てくれている人の入口（2026-09-24 裁定 B）。
 * もう関係ができている人向け。次の一歩はメルマガではなく「LINEで質問」を主にする。
 * LIVEで話した回は data/live.json に手で足す。空のあいだは最近の配信を出す（LIVEの中身を作り話しない）。
 */
export default function Live() {
  const latest = LIVES[0]
  const recent = recentEpisodes(3)
  return (
    <>
      <section className="bg-moss-50">
        <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <p className="text-sm font-bold text-moss-700">LIVEを見てくれている人へ</p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold leading-tight text-ink-900 [text-wrap:balance]">
            LIVEで話したことを、あとから読めます。
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">
            毎朝の配信で話してきたことを、読める形にまとめています。LIVEで出てきた言葉を入れると、その話をした回が見つかります。
          </p>
          <div className="mt-6 max-w-xl">
            <SearchBox placeholder="例：乳房炎、雄の子牛、牛乳の値段" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        {latest ? (
          <>
            <p className="text-sm font-bold text-moss-700">{formatDate(latest.date)} のLIVE</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink-900">{latest.title}</h2>
            {latest.note && <p className="mt-2 text-sm leading-relaxed text-ink-700">{latest.note}</p>}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {latest.episodes.map((e) => (
                <EpisodeCard key={e.id} episode={e} />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif text-2xl font-bold text-ink-900">最近の配信</h2>
            <p className="mt-1 text-sm text-ink-700">LIVEで話した回は、ここに足していきます。</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {recent.map((e) => (
                <EpisodeCard key={e.id} episode={e} />
              ))}
            </div>
          </>
        )}

        {LIVES.length > 1 && (
          <div className="mt-10">
            <h2 className="font-serif text-xl font-bold text-ink-900">これまでのLIVE</h2>
            <ul className="mt-3 divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200">
              {LIVES.slice(1).map((l) => (
                <li key={l.date + l.title} className="px-5 py-4">
                  <p className="text-sm text-ink-500 tabular-nums">{formatDate(l.date)}</p>
                  <p className="font-bold text-ink-900">{l.title}</p>
                  <ul className="mt-1 space-y-1">
                    {l.episodes.map((e) => (
                      <li key={e.id}>
                        <Link to={`/e/${e.id}`} className="text-sm text-moss-700 underline decoration-moss-300 underline-offset-4 hover:text-moss-900">
                          {e.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 次の一歩は一つ: LINEで質問。LIVEで流れてしまった質問の受け皿 */}
      <section className="mx-auto max-w-4xl px-4">
        <div className="rounded-2xl bg-white border border-cream-200 shadow-card p-6 md:p-8">
          <p className="text-sm font-bold text-moss-700">LIVEで聞けなかったことは</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-ink-900 [text-wrap:balance]">公式LINEから、質問を送ってください</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
            コメントで流れてしまった質問も、あとから送れます。LIVEや毎朝の配信で答えることがあります。答えた質問は、このサイトの「届いた質問」にも載ります。
          </p>
          <a
            href={LINKS.line}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark"
          >
            <MessageCircle size={18} /> LINEで質問する
          </a>
          <p className="mt-4 text-sm text-ink-700">
            牛舎の話をメールでも受け取りたい人は{' '}
            <a href={LINKS.newsletter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-moss-700 underline decoration-moss-300 underline-offset-4 hover:text-moss-900">
              <Mail size={14} /> 無料メルマガ
            </a>
            へ。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/questions" className="group rounded-2xl bg-white border border-cream-200 p-5 hover:border-moss-300 transition-colors">
            <p className="font-serif text-lg font-bold text-ink-900 group-hover:text-moss-700">届いた質問と、答えた回</p>
            <p className="mt-1 text-sm text-ink-700">これまでに届いた質問と、そのとき配信で答えたこと。</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
              質問を読む <ArrowRight size={14} />
            </span>
          </Link>
          <Link to="/stairs" className="group rounded-2xl bg-white border border-cream-200 p-5 hover:border-moss-300 transition-colors">
            <p className="font-serif text-lg font-bold text-ink-900 group-hover:text-moss-700">あなたはいま、どこ？</p>
            <p className="mt-1 text-sm text-ink-700">牛乳を飲む人は3段、酪農を志す人は4段。いまの自分に近い段から。</p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
              段を選ぶ <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </section>
    </>
  )
}
