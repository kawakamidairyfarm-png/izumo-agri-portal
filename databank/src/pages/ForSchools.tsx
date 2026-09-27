import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, MessageCircle, School } from 'lucide-react'
import { findEpisode, formatDate, topicByKey } from '../lib/data'
import { LINKS } from '../lib/links'
import { qaId } from '../lib/qa'

/**
 * 学校の先生・栄養士の方へ（2026-09-27）。
 * 給食だより・食育の時間・調べ学習で使える「届いた質問と答え」を、テーマごとに選んで並べる。
 * 答えは編集済みの記事の要約をそのまま出す（ここで新しい答えは作らない）。
 * 利用の決まりは本人の判断なので、ここでは「出典を添えて」「まとまった利用は相談を」までに留める。
 */
type Pick = [episodeId: string, qaIndex: number]
const SETS: { title: string; lead: string; topic: string; picks: Pick[] }[] = [
  {
    title: '給食と牛乳',
    lead: '給食だよりや、牛乳が苦手な子への声かけに。',
    topic: 'milk-taste',
    picks: [
      ['2025-12-01_school-milk-vs-store', 0],
      ['2025-12-01_school-milk-vs-store', 1],
      ['2025-12-01_school-milk-vs-store', 2],
    ],
  },
  {
    title: '牛乳の中身と表示',
    lead: '理科や家庭科、買い物の学習に。',
    topic: 'milk-kind',
    picks: [
      ['2026-02-27_why-milk-is-white', 0],
      ['2026-02-27_why-milk-is-white', 1],
      ['2026-03-26_raw-milk-vs-processed', 1],
      ['2026-03-26_raw-milk-vs-processed', 3],
    ],
  },
  {
    title: '牛の一生と命',
    lead: '生き物と食べ物のつながりを考える時間に。',
    topic: 'cow-life',
    picks: [
      ['2026-04-06_do-cows-always-give-milk', 0],
      ['2026-04-06_do-cows-always-give-milk', 1],
      ['2026-02-17_male-calves', 0],
      ['2026-02-17_male-calves', 1],
    ],
  },
  {
    title: '値段と仕事',
    lead: '社会科、食べ物の値段と仕事の学習に。',
    topic: 'milk-price',
    picks: [
      ['2025-11-12_cost-of-one-liter', 0],
      ['2025-11-12_cost-of-one-liter', 1],
      ['2025-11-13_why-butter-price-rises', 0],
    ],
  },
  {
    title: '牧場と地域',
    lead: 'ふんが堆肥になって、田んぼや畑に戻るまで。',
    topic: 'env',
    picks: [
      ['2025-11-06_compost-science', 0],
      ['2025-11-06_compost-science', 2],
    ],
  },
]

/**
 * 答えの要約を、スマホで3行ほどの塊に分ける（文の途中では切らない）。
 * 1問の要約は2〜3文・80〜130字あり、幅390pxでは5〜6行の壁になるため（金継ぎ 2026-09-27）。
 */
function chunks(text: string, max = 60): string[] {
  const sentences = text.match(/[^。]+。?/g) ?? [text]
  const out: string[] = []
  for (const s of sentences) {
    const last = out.length - 1
    if (last >= 0 && out[last].length + s.length <= max) out[last] += s
    else out.push(s)
  }
  return out
}

export default function ForSchools() {
  return (
    <>
      <section className="bg-moss-50">
        <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-moss-700">
            <School size={16} /> 学校の先生・栄養士の方へ
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold leading-tight text-ink-900 [text-wrap:balance]">
            子どもの「なぜ？」に、
            <br />
            酪農家が答えた記録を
            <br className="md:hidden" />
            授業と給食に。
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">
            給食の牛乳の味、牛乳が白いわけ、牛はずっとミルクを出すのか。牧場に届いた質問に、島根県出雲市の酪農家が毎朝の配信で答えてきました。
          </p>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-700">
            給食だより、食育の時間、調べ学習で使えそうな質問を、テーマごとに選んでいます。登録なし・無料で読めます。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['給食だよりに', '1問ずつ、質問と答えの要約があります。短く紹介できます。'],
            ['食育の時間に', '回のページで、配信の全文や音声までたどれます。'],
            ['調べ学習に', '「テーマ」から、同じ話題の回をまとめて探せます。'],
          ].map(([h, p]) => (
            <div key={h} className="rounded-2xl bg-white border border-cream-200 p-5">
              <p className="font-serif text-lg font-bold text-ink-900">{h}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{p}</p>
            </div>
          ))}
        </section>

        {SETS.map((set) => {
          const topic = topicByKey(set.topic)
          const rows = set.picks
            .map(([id, i]) => {
              const e = findEpisode(id)
              const p = e?.article?.qa[i]
              return e && p ? { e, q: p.q, a: p.a } : null
            })
            .filter((x): x is NonNullable<typeof x> => x !== null)
          if (!rows.length) return null
          return (
            <section key={set.title} className="mt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-serif text-2xl font-bold text-ink-900">{set.title}</h2>
                {topic && (
                  <Link to={`/t/${topic.key}`} className="inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
                    「{topic.label}」の回をすべて見る <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-700">{set.lead}</p>
              <ul className="mt-4 space-y-3">
                {rows.map((r) => (
                  <li key={r.q}>
                    <Link to={`/q/${qaId(r.q)}`} className="group block rounded-2xl bg-white border border-cream-200 p-5 shadow-card hover:border-moss-300">
                      <p className="font-bold text-ink-900 group-hover:text-moss-700">Q. {r.q}</p>
                      <p className="mt-2 text-sm leading-relaxed text-ink-700">
                        {chunks(r.a).map((c, i) => (
                          <span key={i}>
                            {i > 0 && <br />}
                            {c}
                          </span>
                        ))}
                      </p>
                      <p className="mt-2 text-xs text-ink-500">
                        <time dateTime={r.e.date}>{formatDate(r.e.date)}</time>の配信「{r.e.title}」より
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <section className="mt-12 rounded-2xl bg-white border border-cream-200 p-6">
          <h2 className="font-serif text-xl font-bold text-ink-900">紹介するときは</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            授業や給食だよりで紹介するときは、出典として回の題名と配信日を添えてください。答えは配信した時点の川上牧場の経験と意見です。数字や制度は変わることがあるので、各ページの「読むときの注意」もあわせてご覧ください。
          </p>
          <p className="mt-3 rounded-xl bg-cream-100 px-4 py-3 text-sm text-ink-900">
            出典の書き方の例：川上牧場 酪農データバンク「給食の牛乳とスーパーの牛乳、味が違うのはなぜ？」（2025年12月1日の配信）
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            印刷物へのまとまった掲載や、教材としての利用、見学・職場体験のご相談は、公式LINEからお送りください。
          </p>
        </section>

        <section className="mt-8 rounded-2xl bg-moss-900 p-6 text-white">
          <p className="text-sm font-bold text-hay-100">子どもたちの「なぜ？」を送ってください</p>
          <h2 className="mt-1 font-serif text-xl font-bold [text-wrap:balance]">クラスで出た疑問に、毎朝の配信で答えることがあります。</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">答えた回は、このサイトに加わります。あなたの質問が、誰かの牛乳をもっとおいしくする。</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={LINKS.line} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark">
              <MessageCircle size={18} /> 質問・相談を送る（LINE）
            </a>
            <Link to="/questions" className="inline-flex items-center gap-1 text-sm font-bold text-white underline decoration-white/60 underline-offset-4">
              <BookOpen size={16} /> 届いた質問をすべて見る
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
