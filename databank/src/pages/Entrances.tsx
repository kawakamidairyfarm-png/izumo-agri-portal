import { Link } from 'react-router-dom'
import { ArrowRight, HandHeart, HelpCircle, MapPin } from 'lucide-react'
import Section from '../components/Section'
import EpisodeCard from '../components/EpisodeCard'
import SearchBox from '../components/SearchBox'
import { ARTICLES, EPISODES, TOPICS } from '../lib/data'
import { PATHS, resolvePath } from '../lib/paths'
import { LINKS } from '../lib/links'

function Hero({ eyebrow, title, lead, dark = false }: { eyebrow: string; title: string; lead: string; dark?: boolean }) {
  return (
    <section className={dark ? 'bg-moss-800 text-cream-50' : 'bg-moss-50'}>
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <p className={`text-sm font-bold ${dark ? 'text-hay-300' : 'text-moss-700'}`}>{eyebrow}</p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
        <p className={`mt-4 max-w-2xl leading-relaxed ${dark ? 'text-moss-100' : 'text-ink-700'}`}>{lead}</p>
        <div className="mt-6 max-w-xl">
          <SearchBox />
        </div>
      </div>
    </section>
  )
}

export function ForStudents() {
  const paths = PATHS.filter((p) => p.audience !== 'consumer')
  const picks = ARTICLES.filter((e) => e.audience.includes('student')).slice(0, 6)
  const topicKeys = ['career', 'money', 'health', 'feed', 'repro', 'cow']
  return (
    <>
      <Hero
        dark
        eyebrow="酪農を志す人・研修生へ"
        title="現場で本当に聞かれることを、先に読んでおく。"
        lead="川上牧場は毎年、研修生と高校生・中学生を受け入れています。配信では、その人たちに実際に話してきたことをそのまま語っています。就農の準備、資金、牛の健康、飼料設計、改良。順番に読める道筋を用意しました。"
      />

      <Section title="学ぶ順番" lead="迷ったら、この順で。">
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((p) => (
            <Link
              key={p.key}
              to={`/paths/${p.key}`}
              className="rounded-3xl bg-white border border-cream-200 p-6 shadow-card hover:border-moss-300 hover:-translate-y-0.5 transition-all"
            >
              <p className="text-[11px] font-bold text-moss-700">{resolvePath(p).length} 回</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{p.lead}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-moss-700">
                読み始める <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="テーマから探す">
        <div className="flex flex-wrap gap-2">
          {topicKeys.map((k) => {
            const t = TOPICS.find((x) => x.key === k)!
            const n = EPISODES.filter((e) => e.topics.includes(k)).length
            return (
              <Link key={k} to={`/browse?topic=${k}`} className="rounded-full bg-white border border-cream-200 px-4 py-2 text-sm font-medium hover:border-moss-300">
                {t.label} <span className="text-ink-500">{n}</span>
              </Link>
            )
          })}
          <Link to="/browse?series=trainee" className="rounded-full bg-hay-100 border border-hay-300/60 px-4 py-2 text-sm font-medium hover:border-hay-500">
            研修生と配信シリーズ
          </Link>
          <Link to="/browse?series=lecture2021" className="rounded-full bg-hay-100 border border-hay-300/60 px-4 py-2 text-sm font-medium hover:border-hay-500">
            2021年 研修講義（飼料・遺伝）
          </Link>
        </div>
      </Section>

      <Section title="要約つきの回" more={{ to: '/browse?audience=student&has=article', label: 'もっと見る' }}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {picks.map((e) => (
            <EpisodeCard key={e.id} episode={e} />
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-3xl bg-white border border-cream-200 p-6 md:p-8 shadow-card">
          <div className="flex items-start gap-3">
            <MapPin className="text-moss-600 shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900">現地で学ぶ</h2>
              <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                川上牧場では研修生・インターンシップを受け入れています。読んで気になったことは、配信のコメント欄や note から質問できます。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={LINKS.pody} target="_blank" rel="noreferrer" className="rounded-xl bg-moss-600 text-cream-50 px-4 py-2 text-sm font-bold hover:bg-moss-700">
                  Pody で質問する
                </a>
                <a href={LINKS.note} target="_blank" rel="noreferrer" className="rounded-xl bg-white border border-cream-200 px-4 py-2 text-sm font-bold hover:border-moss-300">
                  note を読む
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export function ForConsumers() {
  const paths = PATHS.filter((p) => p.audience !== 'student')
  const qas = ARTICLES.filter((e) => e.audience.includes('consumer'))
    .flatMap((e) => e.article!.qa.slice(0, 1).map((qa) => ({ ...qa, episode: e })))
    .slice(0, 8)
  const picks = ARTICLES.filter((e) => e.audience.includes('consumer')).slice(0, 6)
  return (
    <>
      <Hero
        eyebrow="牛乳を飲む人へ"
        title="牛乳の「なぜ？」に、酪農家が自分の言葉で答えます。"
        lead="原価はいくら？給食の牛乳とスーパーの牛乳は何が違う？雄の子牛はどうなる？牧場に届いた質問に、出雲の酪農家が毎朝答えてきました。ここでは、その答えを読める形にしています。"
      />

      <Section title="よくある質問" lead="配信で実際に答えた質問から。">
        <div className="grid gap-3 md:grid-cols-2">
          {qas.map((x, i) => (
            <Link key={i} to={`/e/${x.episode.id}`} className="rounded-2xl bg-white border border-cream-200 p-5 shadow-card hover:border-moss-300 transition-colors">
              <p className="inline-flex items-start gap-2 font-bold text-ink-900">
                <HelpCircle size={18} className="shrink-0 mt-0.5 text-moss-600" />
                {x.q}
              </p>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed line-clamp-3">{x.a}</p>
              <p className="mt-2 text-xs text-ink-500">出典：{x.episode.title}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="読む順番">
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((p) => (
            <Link
              key={p.key}
              to={`/paths/${p.key}`}
              className="rounded-3xl bg-white border border-cream-200 p-6 shadow-card hover:border-moss-300 hover:-translate-y-0.5 transition-all"
            >
              <p className="text-[11px] font-bold text-moss-700">{resolvePath(p).length} 回</p>
              <h3 className="mt-1 font-serif text-xl font-bold text-ink-900">{p.title}</h3>
              <p className="mt-2 text-sm text-ink-700 leading-relaxed">{p.lead}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="要約つきの回" more={{ to: '/browse?audience=consumer&has=article', label: 'もっと見る' }}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {picks.map((e) => (
            <EpisodeCard key={e.id} episode={e} />
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-3xl bg-hay-100 border border-hay-300/60 p-6 md:p-8">
          <div className="flex items-start gap-3">
            <HandHeart className="text-hay-700 shrink-0 mt-1" />
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-900">買う以外の応援もあります</h2>
              <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                配信を聴く、コメントを残す、牧場のことを誰かに話す。それだけで酪農家の力になると、配信で何度も語られています。
              </p>
              <Link to="/e/2026-03-21_support-beyond-buying" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-hay-700 hover:underline">
                「牛乳を買う以外の応援方法」を読む <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
