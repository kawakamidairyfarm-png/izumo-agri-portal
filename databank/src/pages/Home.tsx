import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronRight, FileText, Headphones, MessageCircle } from 'lucide-react'
import SearchBox from '../components/SearchBox'
import Section from '../components/Section'
import { ARTICLES, EPISODES, SERIES, formatDate, stats } from '../lib/data'
import { PATHS, resolvePath, seriesEpisodes } from '../lib/paths'
import { LINKS } from '../lib/links'
import { PHOTOS } from '../lib/photos'

const PATH_ORDER = ['start-dairy', 'raise-healthy-cows', 'bridge', 'milk-truth']

export default function Home() {
  const paths = PATH_ORDER.map((k) => PATHS.find((p) => p.key === k)!).filter(Boolean)
  const questions = ARTICLES.filter((e) => e.audience.includes('student'))
    .flatMap((e) => e.article!.qa.slice(0, 1).map((qa) => ({ q: qa.q, episode: e })))
    .slice(0, 7)
  const latest = EPISODES.slice(0, 8)
  const trainee = SERIES.find((s) => s.key === 'trainee')!
  const lecture = SERIES.find((s) => s.key === 'lecture2021')!
  const profilePhoto = PHOTOS.about ?? PHOTOS.consumers

  return (
    <>
      {/* 最初の画面: 誰に・何が・次の一歩 */}
      <section className="relative overflow-hidden bg-moss-900 text-white">
        {PHOTOS.hero && (
          <>
            <img src={PHOTOS.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-moss-900/90 to-moss-900/80 md:bg-gradient-to-r md:from-moss-900/90 md:via-moss-900/70 md:to-moss-900/30" />
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-24">
          <p className="text-sm font-bold tracking-[0.2em] text-hay-300">島根県出雲市・川上牧場</p>
          <h1 className="mt-3 font-serif text-3xl md:text-5xl font-bold leading-tight [text-wrap:balance]">
            酪農家になりたい。
            <br />
            そう思ったら、ここから。
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed">
            出雲の酪農家が研修生に話してきたことを、{stats.episodes} 本の配信から読める形にしました。
          </p>
          <p className="mt-2 max-w-2xl leading-relaxed">
            就農の準備、資金、資格、牛の健康、飼料、改良まで。わからないことは、LINEで気軽に聞けます。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/paths/start-dairy"
              className="inline-flex items-center gap-2 rounded-xl bg-hay-300 px-5 py-3 text-sm font-bold text-moss-900 hover:bg-hay-500 transition-colors"
            >
              <BookOpen size={18} /> ゼロから酪農を始める
            </Link>
            <a
              href={LINKS.line}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/70 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <MessageCircle size={18} /> LINEで質問する
            </a>
          </div>
          <div className="mt-8 max-w-2xl">
            <SearchBox large />
          </div>
          <p className="mt-6 text-sm text-hay-300">
            {stats.earliest.slice(0, 4)}年から毎朝の配信を続けています。要約・Q&Aつきの回は {stats.articles} 本、順次増やしています。
          </p>
        </div>
      </section>

      {/* 話しているのは（実名・実物・時間） */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
          {profilePhoto && <img src={profilePhoto} alt={PHOTOS.about ? '川上哲也' : '川上牧場の牛'} className="h-64 md:h-full w-full object-cover object-top" />}
          <div className="p-6 md:p-8">
            <p className="text-sm font-bold text-moss-700">話しているのは</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink-900">川上哲也（川上牧場）</h2>
            <p className="mt-3 text-sm text-ink-700 leading-relaxed">
              島根県出雲市で乳牛約80頭を飼う酪農家。非農家の出身で、10歳のときにゲーム『牧場物語』をきっかけに酪農家を志し、就農しました。
            </p>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              第31回 全農酪農経営体験発表会 優秀賞。{stats.earliest.slice(0, 4)}年から毎朝の音声配信を続け、研修生や高校生・中学生の受け入れ、スポットワークを通じて400人以上を牧場に迎えてきました。
            </p>
            <Link to="/about" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
              牧場とこのサイトについて <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 読む順番（番号つきの一覧） */}
      <Section title="まず、この順で読む" lead="配信は日付順ですが、学ぶには順番があります。">
        <ol className="divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
          {paths.map((p, i) => {
            const n = resolvePath(p).length
            return (
              <li key={p.key}>
                <Link to={`/paths/${p.key}`} className="group flex items-start gap-4 p-5 md:p-6 hover:bg-cream-50 transition-colors">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-moss-700 text-white font-serif text-lg font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-ink-900 group-hover:text-moss-700">
                      {p.title} <span className="text-sm font-normal text-ink-500">{n} 回</span>
                    </h3>
                    <p className="mt-1 text-sm text-ink-700 leading-relaxed">{p.lead}</p>
                  </div>
                  <ChevronRight className="shrink-0 text-ink-500 mt-2" size={20} />
                </Link>
              </li>
            )
          })}
        </ol>
      </Section>

      {/* 研修生と話した回 */}
      <Section title="研修生と一緒に話した回" lead="同じ立場の人が、同じところでつまずいています。">
        <div className="grid gap-6 md:grid-cols-2">
          {[trainee, lecture].map((s) => {
            const eps = seriesEpisodes(s.key)
            return (
              <div key={s.key} className="rounded-2xl bg-moss-50 p-6">
                <h3 className="font-serif text-lg font-bold text-ink-900">
                  {s.label} <span className="text-sm font-sans font-normal text-ink-500">{eps.length} 回</span>
                </h3>
                <p className="mt-1 text-sm text-ink-700 leading-relaxed">{s.description}</p>
                <ul className="mt-4 space-y-2">
                  {eps.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link to={`/e/${e.id}`} className="flex items-start gap-2 text-sm text-ink-900 hover:text-moss-700">
                        <Headphones size={16} className="shrink-0 mt-0.5 text-moss-500" />
                        <span className="line-clamp-1">{e.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to={`/browse?series=${s.key}`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
                  すべて見る <ArrowRight size={16} />
                </Link>
              </div>
            )
          })}
        </div>
      </Section>

      {/* よく聞かれる質問（文の一覧） */}
      <Section title="研修生によく聞かれる質問" lead="配信で実際に答えた質問から。">
        <ul className="divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
          {questions.map((x, i) => (
            <li key={i}>
              <Link to={`/e/${x.episode.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-cream-50">
                <span className="shrink-0 font-serif font-bold text-moss-700">Q</span>
                <span className="flex-1 text-ink-900">{x.q}</span>
                <ChevronRight size={18} className="shrink-0 text-ink-500" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 受け皿: 質問と深掘り */}
      <section className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-moss-50 p-6 md:p-8 flex flex-col">
            <h2 className="inline-flex items-center gap-2 font-serif text-xl font-bold text-ink-900">
              <MessageCircle size={22} className="text-line" /> 気軽に質問する
            </h2>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed flex-1">
              読んで気になったことを、そのまま公式LINEに送れます。配信やnoteで答えることもあります。研修や見学の相談も、ここから。
            </p>
            <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark transition-colors">
              <MessageCircle size={18} /> LINEで質問する
            </a>
          </div>
          <div className="rounded-2xl bg-hay-100 p-6 md:p-8 flex flex-col">
            <h2 className="inline-flex items-center gap-2 font-serif text-xl font-bold text-ink-900">
              <FileText size={22} className="text-hay-700" /> 数字まで深掘りする
            </h2>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed flex-1">
              noteの「川上牧場🐮サブスク」では、牛群検定の成績や経営の数字、配信の全文まで読めます。就農を本気で考える人向けです。
            </p>
            <a href={LINKS.noteSubscribe} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors">
              <BookOpen size={18} /> noteのサブスクを見る
            </a>
          </div>
        </div>
      </section>

      {/* 最近の配信（一覧） */}
      <Section title="最近の配信" lead="毎朝の配信から。要約がない回も、タイトルで探せます。" more={{ to: '/browse', label: '全配信を探す' }}>
        <div className="overflow-x-auto rounded-2xl bg-white border border-cream-200 shadow-card">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-cream-200">
              {latest.map((e) => (
                <tr key={e.id} className="hover:bg-cream-50">
                  <td className="whitespace-nowrap px-4 py-3 text-ink-500 tabular-nums align-top">{formatDate(e.date)}</td>
                  <td className="px-2 py-3">
                    <Link to={`/e/${e.id}`} className="font-bold text-ink-900 hover:text-moss-700">
                      {e.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink-500 align-top">
                    <span className="inline-flex items-center gap-1">
                      {e.article ? <FileText size={14} /> : <Headphones size={14} />}
                      {e.article ? '要約あり' : '音声'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 消費者に聞かれること */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-2xl bg-white border border-cream-200 shadow-card p-6 md:p-8 md:flex md:items-center md:gap-8">
          <div className="flex-1">
            <p className="text-sm font-bold text-moss-700">就農すると、必ず聞かれる</p>
            <h2 className="mt-1 font-serif text-xl font-bold text-ink-900">牛乳の「なぜ？」に、答えられる酪農家になる</h2>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              原価はいくら？なぜバターだけ高い？雄の子牛はどうなる？消費者から届いた質問と、酪農家の率直な答えを先に読んでおく。
            </p>
          </div>
          <Link to="/for-consumers" className="mt-4 md:mt-0 shrink-0 inline-flex items-center gap-1 rounded-xl border border-cream-200 px-5 py-3 text-sm font-bold text-ink-900 hover:border-moss-300">
            消費者の疑問を読む <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
