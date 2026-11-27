import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, Compass, ExternalLink, FileText, Headphones, MessageCircle } from 'lucide-react'
import NextSteps from '../components/NextSteps'
import SearchBox from '../components/SearchBox'
import Section from '../components/Section'
import { ARTICLES, BY_TRANSCRIPT, EPISODES, SERIES, formatDate, stats, GROUPS, type Episode } from '../lib/data'
import { seriesEpisodes } from '../lib/paths'
import { LINKS } from '../lib/links'
import { qaId } from '../lib/qa'
import { PHOTOS } from '../lib/photos'

const HOME_SUGGESTIONS = ['牛乳の原価', '給食', '就農の資金']

/** トップの入口は相手で2つ（対象とできることを1行ずつ）。階段の全項目は各入口ページへ */
const ENTRANCES = [
  { to: '/for-consumers', title: '牛乳を飲む人へ', text: '値段・給食・雄の子牛など、身近な「なぜ？」の答えを読む' },
  { to: '/for-students', title: '酪農を志す人へ', text: '資金・資格・研修など、酪農家になるまでを順番に読む' },
]

export default function Home() {
  // 両方の相手の質問を交互に並べる。どちらの人が見ても自分の疑問が入っているように
  const pick = (au: 'student' | 'consumer') =>
    ARTICLES.filter((e) => e.audience.includes(au)).flatMap((e) => e.article!.qa.slice(0, 1).map((qa) => ({ q: qa.q, episode: e })))
  const forStudents = pick('student')
  const forConsumers = pick('consumer').filter((x) => !forStudents.some((y) => y.q === x.q))
  const questions = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? forConsumers[i / 2] : forStudents[(i - 1) / 2]))
    .filter(Boolean)
    .slice(0, 8)
  const latest = EPISODES.slice(0, 4)
  const trainee = SERIES.find((s) => s.key === 'trainee')!
  const lecture = SERIES.find((s) => s.key === 'lecture2021')!
  const profilePhoto = PHOTOS.about ?? PHOTOS.consumers
  // SNS（Instagram・Threads・Facebook）の動画から来た人へ（2026-10-21）。10/14〜10/21 の来訪は Instagram が最多（14）なのに、
  // トップに着いて最初の画面で帰る人が多かった（12訪問のうち5）。動画は毎朝の配信の切り抜きなので、最近の回をいちばん上に出す
  // 最初の描画で決める（描画のあとに切り替えると、見出しが下へずれて見える）
  const [fromSns] = useState(() => {
    try {
      const src = new URLSearchParams(location.search).get('utm_source') ?? sessionStorage.getItem('db-ref') ?? ''
      return /^(ig|instagram|threads)$|instagram\.com$|threads\.(net|com)$|facebook\.com$/.test(src)
    } catch {
      return false
    }
  })
  const recentForSns = EPISODES.filter((e) => !/メンバーシップ限定|牛群検定・バルク乳成績/.test(e.title)).slice(0, 3)
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
      {/* 最初の画面（2026-09-27 使用者の発案「あなたの質問が牛乳をもっとおいしくする」）。
          2026-11-28 スマホ優先の整理: 説明は2文、主ボタンは「LINEで質問する」1つ、「質問と答えを読む」は下線の副リンク。
          最近届いた質問のカードと配信の件数は、主ボタンと検索を下へ押し出していたので、下の段へ移した。写真に文字は重ねない */}
      <section className="relative overflow-hidden bg-moss-900 text-white">
        {PHOTOS.hero && (
          <>
            {/* スマホ: 写真を見出しの上に横長の帯で。高さは控えめにして、見出しとボタンを最初の画面に入れる */}
            <div className="relative h-32 min-[400px]:h-40 sm:h-52 md:hidden">
              <img src={PHOTOS.hero} alt="川上牧場の牛舎。餌を食べる牛たち" decoding="async" className="h-full w-full object-cover object-[30%_55%]" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-moss-900 to-moss-900/0" />
            </div>
            {/* PC・タブレット: 右に写真の面 */}
            <div className="absolute inset-y-0 right-0 hidden w-[42%] md:block">
              <img src={PHOTOS.hero} alt="" decoding="async" className="h-full w-full object-cover" />
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-moss-900 to-moss-900/0" />
            </div>
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-4 pt-4 pb-8 md:py-16 md:pr-[44%]">
          {fromSns && recentForSns.length > 0 && (
            <div className="mb-5 max-w-2xl rounded-2xl bg-cream-50 p-4 text-ink-900 shadow-lg">
              <p className="text-base font-bold text-moss-700">動画の続きは、配信の全文で</p>
              <p className="mt-0.5 text-sm text-ink-700">動画は毎朝の配信の一部です。最近の回はこちら。</p>
              <ul className="mt-1 divide-y divide-cream-200">
                {recentForSns.map((e) => (
                  <li key={e.id}>
                    <Link to={`/e/${e.id}`} className="flex min-h-11 items-start gap-3 py-2.5 hover:text-moss-700">
                      <time dateTime={e.date} className="shrink-0 pt-0.5 text-sm font-bold text-ink-500 tabular-nums">
                        {formatDate(e.date).replace(/^\d+年/, '')}
                      </time>
                      <span className="min-w-0 flex-1 font-bold leading-snug line-clamp-2 [overflow-wrap:anywhere]">{e.title}</span>
                      <ChevronRight size={18} className="mt-0.5 shrink-0 text-moss-700" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* 牧場そのものを探して来た人のために、ホームページへ（2026-09-26） */}
          <p className="text-sm font-bold text-hay-100">
            島根県出雲市・
            <a
              href={LINKS.home}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1 underline decoration-hay-100/50 underline-offset-4 hover:decoration-hay-100"
            >
              川上牧場のホームページ <ExternalLink size={13} />
            </a>
          </p>
          <h1 className="mt-1 font-serif text-h1 font-bold [text-wrap:balance]">あなたの質問が、誰かの牛乳をもっとおいしくする。</h1>
          <p className="mt-3 max-w-prose text-base md:text-[17px]">
            牛乳や牛の「なぜ？」をLINEで送ると、出雲の酪農家が毎朝の配信で答えます。答えはこのサイトに残り、誰でも無料で読めます。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href={LINKS.line} target="_blank" rel="noreferrer" className="btn-line px-6 shadow-lg">
              <MessageCircle size={20} /> LINEで質問する
            </a>
            <Link to="/questions" className="inline-flex min-h-11 items-center gap-1 text-base font-bold text-white underline decoration-white/60 underline-offset-4 hover:decoration-white">
              質問と答えを読む <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* すぐ下に検索（2026-11-28）。例は2〜3個だけ */}
      <section className="mx-auto max-w-6xl px-4 pt-8 md:pt-12">
        <h2 className="font-serif text-h2 font-bold text-ink-900">答えを探す</h2>
        <p className="mt-2 max-w-prose text-base text-ink-700">これまでの配信 {stats.episodes} 回分から、言葉で探せます。</p>
        <div className="mt-4 max-w-2xl">
          <SearchBox large placeholder="例：なぜバターだけ高いの？" suggestions={HOME_SUGGESTIONS} />
        </div>
      </section>

      {/* 入口は相手で2つだけ（2026-11-28）。階段の全項目はトップでは見せず、各入口ページ・/stairs に残す */}
      <section className="mx-auto max-w-6xl px-4 pt-12 md:pt-16">
        <h2 className="font-serif text-h2 font-bold text-ink-900">あなたに合う入口から</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ENTRANCES.map((x) => (
            <Link
              key={x.to}
              to={x.to}
              className="group flex items-center gap-4 rounded-2xl bg-white border border-cream-200 shadow-card p-5 hover:border-moss-300 transition-colors"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-h3 font-bold text-ink-900 group-hover:text-moss-700">{x.title}</span>
                <span className="mt-1 block text-base text-ink-700">{x.text}</span>
              </span>
              <ArrowRight size={22} className="shrink-0 text-moss-700 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
        {/* 2つのシミュレーター（消費者版・生産者版）への副導線。紹介ページ /tools から各アプリへ（2026-11-27） */}
        <Link
          to="/tools"
          className="group mt-3 flex min-h-11 items-center gap-3 rounded-2xl bg-moss-50 px-5 py-3.5 hover:bg-cream-100 transition-colors"
        >
          <Compass size={22} className="shrink-0 text-moss-700" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-ink-900 group-hover:text-moss-700">酪農の未来を考えるツール</span>
            <span className="block text-sm text-ink-700">飲む人向け・つくる人向けの、2つのシミュレーター</span>
          </span>
          <ArrowRight size={18} className="shrink-0 text-moss-700" />
        </Link>
      </section>

      {/* よく聞かれる質問（最初は4件。最近届いた質問を先頭に） */}
      <Section title="よく聞かれる質問" lead="配信に届いた質問と、そのとき答えた回です。あなたの質問も、ここに加わります。" more={{ to: '/questions', label: '質問と答えをすべて見る' }}>
        <ul className="divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
          {latestQ && (
            <li>
              <Link to={`/q/${qaId(latestQ.q)}`} className="flex items-center gap-3 px-5 py-4 hover:bg-cream-50">
                <span className="shrink-0 font-serif font-bold text-moss-700">Q</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-moss-700">最近届いた質問</span>
                  <span className="block text-ink-900">{latestQ.q}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-ink-500" />
              </Link>
            </li>
          )}
          {questions.filter((x) => x.q !== latestQ?.q).slice(0, latestQ ? 3 : 4).map((x, i) => (
            <li key={i}>
              <Link to={`/q/${qaId(x.q)}`} className="flex items-center gap-3 px-5 py-4 hover:bg-cream-50">
                <span className="shrink-0 font-serif font-bold text-moss-700">Q</span>
                <span className="min-w-0 flex-1 text-ink-900">{x.q}</span>
                <ChevronRight size={18} className="shrink-0 text-ink-500" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 最近の配信（最初は4件。一覧は /browse） */}
      <Section title="最近の配信" lead="毎朝の配信から。要約がない回も、タイトルで探せます。" more={{ to: '/browse', label: `配信を探す（全${stats.episodes}回）` }}>
        {/* スマホで題名が細い列に押し込まれて4文字ずつ折れていたので、表をやめて行ごとのリンクにする（2026-09-25） */}
        <ul className="divide-y divide-cream-200 rounded-2xl bg-white border border-cream-200 shadow-card">
          {latest.map((e) => (
            <li key={e.id}>
              <Link to={`/e/${e.id}`} className="group flex flex-col gap-0.5 px-5 py-3.5 hover:bg-cream-50 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="shrink-0 text-sm text-ink-500 tabular-nums sm:w-28">{formatDate(e.date)}</span>
                <span className="min-w-0 flex-1 font-bold text-ink-900 group-hover:text-moss-700">{e.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm text-ink-500">
                  {e.summary ? <FileText size={14} /> : <Headphones size={14} />}
                  {e.summary ? '要約あり' : e.hasTranscript ? '全文あり' : '音声'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 話しているのは（実名・実物・時間） */}
      <section className="mx-auto max-w-6xl px-4 pt-12 md:pt-16">
        <div className="grid md:grid-cols-[300px_minmax(0,1fr)] rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
          {profilePhoto && <img loading="lazy" decoding="async" src={profilePhoto} alt={PHOTOS.about ? '川上哲也' : '川上牧場の牛'} className="aspect-square w-full object-cover md:aspect-auto md:h-full" />}
          <div className="p-6 md:p-8">
            <p className="text-sm font-bold text-moss-700">話しているのは</p>
            <h2 className="mt-1 font-serif text-h2 font-bold text-ink-900">川上哲也（川上牧場）</h2>
            <p className="mt-3 max-w-prose text-base text-ink-700">
              島根県出雲市で乳牛約80頭を飼う酪農家。非農家の出身で、10歳のときにゲーム『牧場物語』をきっかけに酪農家を志し、就農しました。
            </p>
            <p className="mt-2 max-w-prose text-base text-ink-700">
              第31回 全農酪農経営体験発表会 優秀賞。{stats.earliest.slice(0, 4)}年から毎朝の音声配信を続け、研修生や高校生・中学生の受け入れ、スポットワークを通じて400人以上を牧場に迎えてきました。
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link to="/about" className="link-more">
                牧場とこのサイトについて <ArrowRight size={16} />
              </Link>
              <a href={LINKS.home} target="_blank" rel="noreferrer" className="link-more">
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
                <h3 className="text-h3 font-bold text-ink-900">
                  {s.label} <span className="text-sm font-normal text-ink-500">{eps.length} 回</span>
                </h3>
                <p className="mt-1 text-base text-ink-700">{s.description}</p>
                <ul className="mt-3">
                  {eps.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link to={`/e/${e.id}`} className="flex min-h-11 items-center gap-2 text-base text-ink-900 hover:text-moss-700">
                        <Headphones size={16} className="shrink-0 mt-0.5 text-moss-500" />
                        <span className="line-clamp-1">{e.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to={`/browse?series=${s.key}`} className="link-more mt-1">
                  {s.label}をすべて見る <ArrowRight size={16} />
                </Link>
              </div>
            )
          })}
        </div>
      </Section>

      {/* 棚（テーマ）は段の下に一段下げる。話した中身で分けた分類なので、言葉で探す人のために残す */}
      <Section title="テーマから探す" lead="話した中身で分けた棚です。気になる言葉から入れます。" more={{ to: '/topics', label: 'テーマをすべて見る' }}>
        <div className="rounded-2xl bg-white border border-cream-200 divide-y divide-cream-200">
          {GROUPS.map((g) => (
            <div key={g.key} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-5 py-3">
              <p className="sm:w-44 shrink-0 text-base font-bold text-ink-900">{g.label}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {g.subs.map((t) => (
                  <li key={t.key}>
                    <Link to={`/t/${t.key}`} className="inline-block py-1 text-base text-moss-700 underline decoration-moss-300 underline-offset-4 hover:decoration-moss-700">
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

    </>
  )
}
