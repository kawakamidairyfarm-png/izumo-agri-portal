import { Link } from 'react-router-dom'
import { GraduationCap, Milk, ArrowRight, Radio } from 'lucide-react'
import SearchBox from '../components/SearchBox'
import Section from '../components/Section'
import EpisodeCard from '../components/EpisodeCard'
import { ARTICLES, EPISODES, SERIES, stats } from '../lib/data'
import { PATHS, resolvePath, seriesEpisodes } from '../lib/paths'
import { LINKS } from '../lib/links'
import { MilkArt, PastureScene, StudentCowArt } from '../components/FarmArt'

export default function Home() {
  const latestArticles = ARTICLES.slice(0, 6)
  const latest = EPISODES.slice(0, 4)
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e9f2e6] via-moss-50 to-cream-50">
        <div className="mx-auto max-w-6xl px-4 pt-12 md:pt-16 pb-4 relative z-10">
          <p className="text-sm font-bold text-moss-700 tracking-wide">島根県出雲市・川上牧場</p>
          <h1 className="mt-2 font-serif text-3xl md:text-5xl font-bold leading-tight text-ink-900 [text-wrap:balance]">
            酪農家が毎日話してきたことを、
            <br className="hidden md:block" />
            学ぶ人と飲む人の知識バンクに。
          </h1>
          <p className="mt-4 max-w-2xl text-ink-700 leading-relaxed">
            {stats.earliest.slice(0, 4)}年から続く音声配信 {stats.episodes} 本の文字起こしを整理しました。
            酪農を志す学生・研修生には現場の判断を、牛乳を飲む人には「なぜ？」への答えを。
            どちらも同じ一次情報から読めます。
          </p>
          <div className="mt-7 max-w-2xl">
            <SearchBox large />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-moss-800">
            <span className="rounded-full bg-white/80 border border-moss-100 px-3 py-1.5">全 {stats.episodes} 配信を検索</span>
            <span className="rounded-full bg-white/80 border border-moss-100 px-3 py-1.5">要約・Q&A つき {stats.articles} 本</span>
            <span className="rounded-full bg-white/80 border border-moss-100 px-3 py-1.5">{stats.earliest.slice(0, 4)}年から毎朝配信</span>
          </div>
        </div>
        <PastureScene className="w-full h-40 md:h-56 block mt-2" />
      </section>

      <section className="mx-auto max-w-6xl px-4 grid gap-4 md:grid-cols-2">
        <Link
          to="/for-students"
          className="group relative overflow-hidden rounded-3xl bg-moss-700 text-cream-50 p-7 md:p-9 shadow-card hover:bg-moss-800 transition-colors"
        >
          <div className="absolute -right-3 -bottom-3 opacity-90 group-hover:scale-105 transition-transform" aria-hidden="true">
            <StudentCowArt size={104} />
          </div>
          <GraduationCap size={34} className="text-hay-300" />
          <h2 className="mt-4 font-serif text-2xl font-bold">酪農を学びたい人へ</h2>
          <p className="mt-2 text-moss-100 leading-relaxed text-sm pr-14 md:pr-16 relative z-10">
            就農前の準備、資金、資格、牛の健康管理、飼料設計、改良戦略。研修生に話してきた内容を、順番に読める形にしました。
          </p>
          <span className="mt-5 inline-flex items-center gap-1 font-bold text-hay-300 group-hover:gap-2 transition-all">
            入口へ <ArrowRight size={18} />
          </span>
        </Link>
        <Link
          to="/for-consumers"
          className="group relative overflow-hidden rounded-3xl bg-white border border-cream-200 p-7 md:p-9 shadow-card hover:border-moss-300 transition-colors"
        >
          <div className="absolute -right-3 -bottom-3 opacity-90 group-hover:scale-105 transition-transform" aria-hidden="true">
            <MilkArt size={104} />
          </div>
          <Milk size={34} className="text-moss-600" />
          <h2 className="mt-4 font-serif text-2xl font-bold text-ink-900">牛乳を飲む人へ</h2>
          <p className="mt-2 text-ink-700 leading-relaxed text-sm pr-14 md:pr-16 relative z-10">
            原価はいくら？なぜバターだけ高い？雄の子牛はどうなる？牧場に届いた疑問と、酪農家の率直な答え。買う以外の応援の仕方も。
          </p>
          <span className="mt-5 inline-flex items-center gap-1 font-bold text-moss-700 group-hover:gap-2 transition-all">
            入口へ <ArrowRight size={18} />
          </span>
        </Link>
      </section>

      <Section title="学びの道筋" lead="テーマごとに、読む順番を決めてあります。" more={{ to: '/paths', label: 'すべての道筋' }}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PATHS.map((p) => {
            const n = resolvePath(p).length
            return (
              <Link
                key={p.key}
                to={`/paths/${p.key}`}
                className="rounded-2xl bg-white border border-cream-200 p-5 shadow-card hover:border-moss-300 hover:-translate-y-0.5 transition-all"
              >
                <p className="text-[11px] font-bold text-moss-700">
                  {p.audience === 'student' ? '学ぶ人向け' : p.audience === 'consumer' ? '飲む人向け' : '両方向け'} ・ {n} 回
                </p>
                <h3 className="mt-1 font-bold text-ink-900">{p.title}</h3>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed line-clamp-3">{p.lead}</p>
              </Link>
            )
          })}
        </div>
      </Section>

      <Section title="要約つきの配信" lead="本文を読み込んで、要点・Q&A・注意点を添えた回。" more={{ to: '/browse?has=article', label: '要約つきをすべて見る' }}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {latestArticles.map((e) => (
            <EpisodeCard key={e.id} episode={e} />
          ))}
        </div>
      </Section>

      <Section title="シリーズで聴く" lead="続きものは、シリーズごとにまとめています。">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SERIES.map((s) => {
            const n = seriesEpisodes(s.key).length
            if (n === 0) return null
            return (
              <Link
                key={s.key}
                to={`/browse?series=${s.key}`}
                className="flex items-start gap-3 rounded-2xl bg-white border border-cream-200 p-5 shadow-card hover:border-moss-300 transition-colors"
              >
                <Radio className="text-hay-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-ink-900">
                    {s.label} <span className="text-xs text-ink-500 font-normal">{n} 回</span>
                  </h3>
                  <p className="mt-1 text-sm text-ink-700 leading-relaxed">{s.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </Section>

      <Section title="最近の配信" lead="新しい回から。要約がない回も、タイトルで探せます。" more={{ to: '/browse', label: '全配信を探す' }}>
        <div className="grid gap-4 md:grid-cols-2">
          {latest.map((e) => (
            <EpisodeCard key={e.id} episode={e} />
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="rounded-3xl bg-hay-100 border border-hay-300/60 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <h2 className="font-serif text-xl font-bold text-ink-900">声で聴く、文字で読む</h2>
            <p className="mt-1 text-sm text-ink-700 leading-relaxed">
              毎朝の配信は Pody で。深掘り記事は note で。このサイトは、その二つを横断して探すための索引です。
            </p>
          </div>
          <div className="flex gap-2">
            <a href={LINKS.pody} target="_blank" rel="noreferrer" className="rounded-xl bg-moss-600 text-cream-50 px-4 py-2.5 text-sm font-bold hover:bg-moss-700">
              Pody で聴く
            </a>
            <a href={LINKS.note} target="_blank" rel="noreferrer" className="rounded-xl bg-white border border-cream-200 px-4 py-2.5 text-sm font-bold text-ink-900 hover:border-moss-300">
              note を読む
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
