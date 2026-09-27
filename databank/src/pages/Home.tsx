import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, ExternalLink, FileText, Headphones, MessageCircle } from 'lucide-react'
import NextSteps from '../components/NextSteps'
import SearchBox from '../components/SearchBox'
import Section from '../components/Section'
import { StairLadder } from './Stairs'
import { ARTICLES, BY_TRANSCRIPT, EPISODES, SERIES, formatDate, stats, GROUPS, type Episode } from '../lib/data'
import { seriesEpisodes } from '../lib/paths'
import { LINKS } from '../lib/links'
import { PHOTOS } from '../lib/photos'

const HOME_SUGGESTIONS = ['牛乳の原価', 'バター', '給食', '乳糖不耐症', '雄の子牛', '資金', '研修']

export default function Home() {
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
  // 最近届いた質問（証拠を1件だけ）。質問の索引は必要になってから読む（最初の読み込みを重くしない）
  const [latestQ, setLatestQ] = useState<{ q: string; episode: Episode } | null>(null)
  useEffect(() => {
    let alive = true
    import('../../data/questions.json').then((m) => {
      if (!alive) return
      const rows = (m.default as { q: string; key: string }[])
        .map((r) => ({ q: r.q, episode: BY_TRANSCRIPT.get(r.key) }))
        .filter((r): r is { q: string; episode: Episode } => Boolean(r.episode))
        .sort((x, y) => (x.episode.date < y.episode.date ? 1 : x.episode.date > y.episode.date ? -1 : 0))
      // 最初の画面で読み切れる長さの質問を、新しい順に探す（直近10件に無ければ一番新しいもの）
      setLatestQ(rows.slice(0, 10).find((r) => r.q.length <= 45) ?? rows[0] ?? null)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      {/* 最初の画面（2026-09-27 使用者の発案「あなたの質問が牛乳をもっとおいしくする」・明鏡×軍配×金継ぎ）
          旗を「隠さず話す（配信）」から「質問が回って誰かの役に立つ（参加）」へ。主役の釦は LINE の質問1つ。
          その証拠として、最近届いた質問と答えた回を1件だけ見せる。「牛乳の疑問から読む」「酪農家になる道」はすぐ下の階段と重なるので外した。
          写真は暗い膜の下に沈めず、文字の面（深緑）と写真の面を左右で分ける（2026-09-22） */}
      <section className="relative overflow-hidden bg-moss-900 text-white">
        {PHOTOS.hero && (
          <>
            {/* スマホ: 写真を見出しの上に横長の帯で（2026-09-27「スマホで背景の牛が消えている」）。文字の上には重ねない */}
            <div className="relative h-44 sm:h-56 md:hidden">
              <img src={PHOTOS.hero} alt="川上牧場の牛舎。餌を食べる牛たち" decoding="async" className="h-full w-full object-cover object-[30%_55%]" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-moss-900 to-moss-900/0" />
            </div>
            {/* PC・タブレット: 右に写真の面 */}
            <div className="absolute inset-y-0 right-0 hidden w-[42%] md:block">
              <img src={PHOTOS.hero} alt="" decoding="async" className="h-full w-full object-cover" />
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-moss-900 to-moss-900/0" />
            </div>
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-4 pt-5 pb-8 md:py-16 md:pr-[44%]">
          {/* 牧場そのものを探して来た人のために、ホームページへ（2026-09-26）。字間を広げると2行に折れて「ジ」が落ちたので詰める */}
          <p className="text-sm font-bold text-hay-100">
            島根県出雲市・
            <a
              href={LINKS.home}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 py-1 underline decoration-hay-100/40 underline-offset-4 hover:decoration-hay-100"
            >
              川上牧場のホームページ <ExternalLink size={13} />
            </a>
          </p>
          <h1 className="mt-3 font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight [text-wrap:balance]">
            あなたの質問が、
            <br />
            誰かの牛乳を
            <br />
            もっとおいしくする。
          </h1>
          {/* 文は「何をすればいいか → どうなるか」の順に、1文1つのことだけ（2026-09-27 使用者「文章に違和感」: 前の文は「次の誰かの一杯に、酪農を志す人の力に」とつながりがねじれていた） */}
          <p className="mt-4 md:mt-5 max-w-2xl leading-relaxed">
            牛乳や牛のことで「なぜ？」と思ったら、LINEで送ってください。出雲の酪農家が、毎朝の配信で答えています。
          </p>
          <p className="mt-2 max-w-2xl leading-relaxed">
            答えはこのサイトに残り、同じ疑問を持つ次の人や、酪農を志す人の役に立っています。
          </p>
          <div className="mt-5 md:mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href={LINKS.line}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3.5 text-base font-bold text-white shadow-lg hover:bg-line-dark transition-colors"
            >
              <MessageCircle size={20} /> 質問を送る（LINE）
            </a>
            <Link to="/questions" className="inline-flex items-center gap-1 py-2 text-sm font-bold text-white underline decoration-white/60 underline-offset-4 hover:decoration-white">
              届いた質問と答えを読む <ArrowRight size={16} />
            </Link>
          </div>
          {latestQ && (
            <Link
              to={`/e/${latestQ.episode.id}`}
              className="group mt-5 block max-w-2xl rounded-2xl border border-white/20 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <span className="block text-xs font-bold text-hay-100">最近届いた質問</span>
              <span className="mt-1 font-bold leading-snug line-clamp-2">「{latestQ.q}」</span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm text-white/90 group-hover:text-white">
                {formatDate(latestQ.episode.date)}の配信で答えました <ArrowRight size={14} />
              </span>
            </Link>
          )}
          <div className="mt-6 md:mt-8 max-w-2xl">
            <SearchBox large placeholder="例：なぜバターだけ高いの？" suggestions={HOME_SUGGESTIONS} />
          </div>
          <p className="mt-4 md:mt-6 max-w-2xl text-sm leading-relaxed text-white/90">
            これまでの配信 {stats.episodes} 回分を、登録なし・無料で読めます。牛乳を飲む人も、酪農を志す人も。
          </p>
        </div>
      </section>

      {/* 入口は相手の「いまの状態」で切る（変化の階段・2026-09-22の裁定）。飲む人を先に、志す人をそのあとに。テーマ（棚）は下に一段下げる */}
      <section className="mx-auto max-w-6xl px-4 mt-8 md:mt-12">
        <div className="mb-5">
          <h2 className="font-serif text-2xl font-bold text-ink-900">あなたはいま、どこ？</h2>
          <p className="mt-1 text-sm text-ink-700">テーマの名前より、いまの自分に近い段から入るほうが早く着きます。どの段にも、読んだあとの次の一歩を一つだけ置いています。</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg font-bold text-ink-900">牛乳を飲む人</h3>
              <Link to="/for-consumers" className="inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
                飲む人の入口へ <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-3">
              <StairLadder audience="consumer" compact />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg font-bold text-ink-900">酪農を志す人</h3>
              <Link to="/for-students" className="inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
                志す人の入口へ <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-3">
              <StairLadder audience="student" compact />
            </div>
          </div>
        </div>
      </section>

      {/* 話しているのは（実名・実物・時間） */}
      <section className="mx-auto max-w-6xl px-4 mt-10">
        <div className="grid md:grid-cols-[300px_minmax(0,1fr)] rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
          {profilePhoto && <img loading="lazy" decoding="async" src={profilePhoto} alt={PHOTOS.about ? '川上哲也' : '川上牧場の牛'} className="aspect-square w-full object-cover md:aspect-auto md:h-full" />}
          <div className="p-6 md:p-8">
            <p className="text-sm font-bold text-moss-700">話しているのは</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink-900">川上哲也（川上牧場）</h2>
            <p className="mt-3 text-sm text-ink-700 leading-relaxed">
              島根県出雲市で乳牛約80頭を飼う酪農家。非農家の出身で、10歳のときにゲーム『牧場物語』をきっかけに酪農家を志し、就農しました。
            </p>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">
              第31回 全農酪農経営体験発表会 優秀賞。{stats.earliest.slice(0, 4)}年から毎朝の音声配信を続け、研修生や高校生・中学生の受け入れ、スポットワークを通じて400人以上を牧場に迎えてきました。
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link to="/about" className="inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
                牧場とこのサイトについて <ArrowRight size={16} />
              </Link>
              <a href={LINKS.home} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
                川上牧場のホームページ <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 「まず、この順で読む」（学びの道筋4本）は、入口の階段7段と重なるのでトップから外した（2026-09-25）。道筋は /paths・二つの入口ページ・フッターに残る */}

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

      <Section title="よく聞かれる質問" lead="配信に届いた質問と、そのとき答えた回です。あなたの質問も、ここに加わります。" more={{ to: '/questions', label: '届いた質問をすべて見る' }}>
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

      {/* 棚（テーマ）は段の下に一段下げる。話した中身で分けた分類なので、言葉で探す人のために残す */}
      <Section title="テーマから探す" lead="話した中身で分けた棚です。段から入りにくいときは、気になる言葉から。" more={{ to: '/topics', label: 'テーマをすべて見る' }}>
        <div className="rounded-2xl bg-white border border-cream-200 divide-y divide-cream-200">
          {GROUPS.map((g) => (
            <div key={g.key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-5 py-3">
              <p className="sm:w-44 shrink-0 text-sm font-bold text-ink-900">{g.label}</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1">
                {g.subs.map((t) => (
                  <li key={t.key}>
                    <Link to={`/t/${t.key}`} className="text-sm text-ink-700 underline decoration-cream-200 underline-offset-4 hover:text-moss-900 hover:decoration-moss-300">
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 読んだあとの次の一歩（無料の受け皿はメルマガ1つ。来る人の多くは飲む人なので、飲む人向けの文面を既定にする） */}
      <NextSteps audience="consumer" />

      {/* 最近の配信（一覧） */}
      <Section title="最近の配信" lead="毎朝の配信から。要約がない回も、タイトルで探せます。" more={{ to: '/browse', label: '全配信を探す' }}>
        {/* スマホで題名が細い列に押し込まれて4文字ずつ折れていたので、表をやめて行ごとのリンクにする（2026-09-25） */}
        <ul className="divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
          {latest.map((e) => (
            <li key={e.id}>
              <Link to={`/e/${e.id}`} className="group flex flex-col gap-0.5 px-5 py-3.5 hover:bg-cream-50 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="shrink-0 text-sm text-ink-500 tabular-nums sm:w-28">{formatDate(e.date)}</span>
                <span className="min-w-0 flex-1 font-bold text-ink-900 group-hover:text-moss-700">{e.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-500">
                  {e.summary ? <FileText size={13} /> : <Headphones size={13} />}
                  {e.summary ? '要約あり' : e.hasTranscript ? '全文あり' : '音声'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

    </>
  )
}
