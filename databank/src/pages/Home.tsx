import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronRight, FileText, Headphones, MessageCircle, Milk } from 'lucide-react'
import NextSteps from '../components/NextSteps'
import SearchBox from '../components/SearchBox'
import Section from '../components/Section'
import { ARTICLES, EPISODES, SERIES, formatDate, stats } from '../lib/data'
import { PATHS, resolvePath, seriesEpisodes } from '../lib/paths'
import { LINKS } from '../lib/links'
import { PHOTOS } from '../lib/photos'

// 旗は「酪農の現場を、隠さず話す」。来る人の多くは牛乳を飲む人なので（2026-09 アクセスログ）、
// 飲む人の道筋を先に、志す人の道筋をそのあとに並べる。志す人の道は消さない
const PATH_ORDER = ['milk-truth', 'bridge', 'start-dairy', 'raise-healthy-cows']
const HOME_SUGGESTIONS = ['牛乳の原価', 'バター', '給食', '乳糖不耐症', '雄の子牛', '資金', '研修', '非農家', '乳房炎']

export default function Home() {
  const paths = PATH_ORDER.map((k) => PATHS.find((p) => p.key === k)!).filter(Boolean)
  // 両方の相手の質問を交互に並べる。どちらの人が見ても自分の疑問が入っているように
  const pick = (au: 'student' | 'consumer') =>
    ARTICLES.filter((e) => e.audience.includes(au)).flatMap((e) => e.article!.qa.slice(0, 1).map((qa) => ({ q: qa.q, episode: e })))
  const forStudents = pick('student')
  const forConsumers = pick('consumer').filter((x) => !forStudents.some((y) => y.q === x.q))
  const questions = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? forConsumers[i / 2] : forStudents[(i - 1) / 2]))
    .filter(Boolean)
    .slice(0, 8)
  const latest = EPISODES.slice(0, 8)
  const trainee = SERIES.find((s) => s.key === 'trainee')!
  const lecture = SERIES.find((s) => s.key === 'lecture2021')!
  const profilePhoto = PHOTOS.about ?? PHOTOS.consumers

  return (
    <>
      {/* 最初の画面: 誰に・何が・次の一歩。旗は「隠さず話す」、入口は飲む人を先に */}
      <section className="relative overflow-hidden bg-moss-900 text-white">
        {PHOTOS.hero && (
          <>
            <img src={PHOTOS.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-moss-900/95 to-moss-900/85 md:bg-gradient-to-r md:from-moss-900/95 md:via-moss-900/92 md:to-moss-900/60" />
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-8 md:py-16">
          <p className="text-sm font-bold tracking-[0.2em] text-hay-100">島根県出雲市・川上牧場</p>
          <h1 className="mt-3 font-serif text-3xl md:text-5xl font-bold leading-tight [text-wrap:balance]">
            牛乳のこと、牛のこと、酪農家になる道のこと。
            <br />
            出雲の酪農家が、隠さず話します。
          </h1>
          <p className="mt-4 md:mt-5 max-w-2xl leading-relaxed">
            原価はいくら？ なぜバターだけ高い？ 雄の子牛はどうなる？ 牧場に届いた質問に毎朝の配信で答えてきた {stats.episodes} 回を、読める形にしました。
          </p>
          <p className="mt-2 max-w-2xl leading-relaxed">
            <span className="font-bold">牛乳を飲む人も、酪農を志す人も、どなたでも読めます。</span>登録もお金も要りません。
          </p>
          <div className="mt-5 md:mt-7 flex flex-wrap gap-3">
            <Link
              to="/for-consumers"
              className="inline-flex items-center gap-2 rounded-xl bg-hay-300 px-5 py-3 text-sm font-bold text-moss-900 hover:bg-hay-500 transition-colors"
            >
              <Milk size={18} /> 牛乳の疑問から読む
            </Link>
            <Link
              to="/paths/start-dairy"
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
            >
              <BookOpen size={18} /> 酪農家になる道を読む
            </Link>
            <a
              href={LINKS.line}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-white underline decoration-white/60 underline-offset-4 hover:decoration-white"
            >
              <MessageCircle size={18} /> 質問はLINEで
            </a>
          </div>
          <div className="mt-6 md:mt-8 max-w-2xl">
            <SearchBox large placeholder="例：なぜバターだけ高いの？" suggestions={HOME_SUGGESTIONS} />
          </div>
          <p className="mt-4 md:mt-6 max-w-2xl text-sm leading-relaxed text-white">
            {stats.earliest.slice(0, 4)}年から毎朝の配信を続けています。全文を読める回は {stats.withText} 本、要約つきの回は {stats.withSummary} 本。
          </p>
        </div>
      </section>

      {/* 二つの入口: 飲む人を先に（スマホでは上に）、志す人をそのあとに。どちらの人も自分の場所が見つかるように */}
      <section className="mx-auto max-w-6xl px-4 mt-6 md:mt-10">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/for-consumers"
            className="group rounded-2xl bg-white border border-cream-200 shadow-card p-6 md:p-7 hover:border-moss-300 transition-colors"
          >
            <p className="text-sm font-bold text-moss-700">牛乳を飲む人へ</p>
            <h2 className="mt-1 font-serif text-xl font-bold text-ink-900">牛乳の「なぜ？」に、酪農家が答える</h2>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              原価はいくら？ なぜバターだけ高い？ 給食の牛乳とスーパーの牛乳は何が違う？ 消費者から届いた質問に、現場から率直に答えています。
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
              飲む人の入口へ <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link
            to="/for-students"
            className="group rounded-2xl bg-white border border-cream-200 shadow-card p-6 md:p-7 hover:border-moss-300 transition-colors"
          >
            <p className="text-sm font-bold text-moss-700">酪農を志す人へ</p>
            <h2 className="mt-1 font-serif text-xl font-bold text-ink-900">就農の現実を、順番に読む</h2>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              資金はいくらかかるのか、資格は要るのか、非農家から入れるのか。研修生に話してきたことを、読む順番をつけて並べています。
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
              志す人の入口へ <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* 話しているのは（実名・実物・時間） */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <div className="grid md:grid-cols-[300px_minmax(0,1fr)] rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
          {profilePhoto && <img src={profilePhoto} alt={PHOTOS.about ? '川上哲也' : '川上牧場の牛'} className="aspect-square w-full object-cover md:aspect-auto md:h-full" />}
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
      <Section title="まず、この順で読む" lead="配信は日付順ですが、知るには順番があります。牛乳の疑問からでも、就農の準備からでも。">
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

      {/* まとまった連続回 */}
      <Section title="まとまった話を、続けて読む" lead="一つのテーマを何回かに分けて話した回です。">
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
      <Section title="よく聞かれる質問" lead="配信に届いた質問と、そのとき答えた回です。" more={{ to: '/questions', label: '届いた質問をすべて見る' }}>
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

      {/* 読んだあとの次の一歩（無料の受け皿はメルマガ1つ。来る人の多くは飲む人なので、飲む人向けの文面を既定にする） */}
      <NextSteps audience="consumer" />

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
                      {e.summary ? <FileText size={14} /> : <Headphones size={14} />}
                      {e.summary ? '要約あり' : e.hasTranscript ? '全文あり' : '音声'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

    </>
  )
}
