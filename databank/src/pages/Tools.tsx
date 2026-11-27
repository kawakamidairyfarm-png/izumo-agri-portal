import { ArrowUpRight, BookOpen, ShieldAlert } from 'lucide-react'
import data from '../../data/tools.json'

// 川上牧場が作った2つのシミュレーターへの入口（2026-11-27）。アプリ本体は別に公開されていて、ここからは直接リンクするだけ。
// URL・アプリの画面に書いてあること（facts）・note の記事は data/tools.json にまとめる（prerender.mjs も同じファイルを読む）。
// url が空のあいだはボタンを出さない（ダミーのリンクを置かない）。
type Tool = { key: string; audience: string; name: string; text: string; cta: string; url: string }
const TOOLS = data.tools as Tool[]

export default function Tools() {
  return (
    <>
      <section className="bg-moss-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <p className="text-sm font-bold text-moss-700">川上牧場がつくったシミュレーター</p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold leading-tight text-ink-900">酪農の未来を考えるツール</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">
            牛乳を飲む人と、牛乳をつくる人。それぞれの立場から、今の自分と、これからの一歩を考える2つのシミュレーターです。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* スマホでは消費者版 → 生産者版の順に縦に並ぶ（並びは tools.json の順） */}
        <div className="grid gap-4 md:grid-cols-2">
          {TOOLS.map((t) => (
            <article
              key={t.key}
              id={t.key}
              className="scroll-mt-24 flex flex-col rounded-3xl bg-white border border-cream-200 p-6 md:p-8 shadow-card"
            >
              <p className="text-sm font-bold text-moss-700">{t.audience}</p>
              <h2 className="mt-1 font-serif text-xl md:text-2xl font-bold text-ink-900 [text-wrap:balance]">{t.name}</h2>
              <p className="mt-3 text-sm text-ink-700 leading-relaxed">{t.text}</p>
              {t.url && (
                <div className="mt-auto pt-5">
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors"
                  >
                    {t.cta} <ArrowUpRight size={18} />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-cream-50 border border-cream-200 p-6 md:p-8">
          <h2 className="font-serif text-xl font-bold text-ink-900">使い方</h2>
          {data.facts && <p className="mt-2 text-sm font-bold text-moss-700">{data.facts}</p>}
          <ol className="mt-3 grid gap-2 text-sm text-ink-700 leading-relaxed md:grid-cols-3">
            <li className="rounded-2xl bg-white border border-cream-200 p-4">
              <span className="font-bold text-moss-700">1.</span> 6つの視点を、10段階で選ぶ（いまの位置と、目指したい姿）
            </li>
            <li className="rounded-2xl bg-white border border-cream-200 p-4">
              <span className="font-bold text-moss-700">2.</span> 結果を見る
            </li>
            <li className="rounded-2xl bg-white border border-cream-200 p-4">
              <span className="font-bold text-moss-700">3.</span> 必要なら、相談用の文章をコピーして、ふだん使っているAIに貼る
            </li>
          </ol>
          <p className="mt-4 text-sm text-ink-700 leading-relaxed">
            ツールの中でAIが答えるわけではありません。相談したいときは、コピーした文章をご自分で、いつも使っているAIに貼ってください。
          </p>
          <p className="mt-2 inline-flex items-start gap-2 text-sm text-ink-700 leading-relaxed">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-hay-700" />
            <span>貼る前に、名前・住所・連絡先などの個人情報や、外に出していない経営の数字が入っていないか確かめてください。</span>
          </p>

          <h3 className="mt-6 font-serif text-lg font-bold text-ink-900">数字は、点数ではありません</h3>
          <p className="mt-2 text-sm text-ink-700 leading-relaxed">
            採点や未来の予測ではなく、いまの自分の位置と、向かいたい方向を表すものです。正解は一つではなく、玉虫色のグラデーション。人によって、牧場によって、ちょうどいい位置は違います。
          </p>
        </div>

        {data.noteUrl && (
          <a
            href={data.noteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-moss-700 hover:underline"
          >
            <BookOpen size={16} /> 開発の背景を読む（noteメンバー限定）
          </a>
        )}
      </section>
    </>
  )
}
