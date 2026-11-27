import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ShieldAlert } from 'lucide-react'
import data from '../../data/tools.json'
import story from '../../data/tools-story.json'
import { LINKS } from '../lib/links'

// 川上牧場が作った2つのシミュレーターへの入口（2026-11-27）。アプリ本体は別に公開されていて、ここからは直接リンクするだけ。
// URL・アプリの画面に書いてあること（facts）は data/tools.json、開発の背景の本文は data/tools-story.json にまとめる（prerender.mjs も同じファイルを読む）。
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

        {/* 開発の背景は note のメンバーシップ記事だが、データバンクではこのサイトの中で無料で読める（/tools/story/） */}
        <Link to="/tools/story" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-moss-700 hover:underline">
          <BookOpen size={16} /> 開発の背景を読む（無料）
        </Link>
      </section>
    </>
  )
}

type StoryBlock =
  | { t: 'p'; html: string }
  | { t: 'h2' | 'h3'; text: string }
  | { t: 'link'; href: string; label: string }
  | { t: 'img'; src: string; w: number; h: number; caption: string }
const STORY = story as { source: string; title: string; date: string; blocks: StoryBlock[] }

/**
 * 開発の背景（/tools/story/）。note の記事を、データバンクではずっと無料で読めるように写したもの（2026-11-27 本人の決定）。
 * note 側は初月だけ無料で、そのあとメンバーシップ限定にする。段落の html は写すときに strong / em / br だけ残してある
 */
export function ToolsStory() {
  const [y, m, d] = STORY.date.split('-').map(Number)
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Link to="/tools" className="inline-flex items-center gap-1 text-sm font-bold text-moss-700 hover:underline">
        <ArrowLeft size={16} /> 酪農の未来を考えるツール
      </Link>
      <p className="mt-6 text-sm font-bold text-moss-700">開発の背景</p>
      <h1 className="mt-1 font-serif text-2xl md:text-3xl font-bold leading-snug text-ink-900 [text-wrap:balance]">{STORY.title}</h1>
      <p className="mt-2 text-sm text-ink-500">
        川上哲也（川上牧場）・{y}年{m}月{d}日
      </p>
      <p className="mt-5 rounded-2xl bg-hay-100 border border-hay-300/60 p-4 text-sm text-ink-700 leading-relaxed">
        この文章は、note のメンバーシップ向けに書いた記事です。酪農データバンクでは、どなたでも無料で読めます。
      </p>

      <div className="mt-8 text-[17px] leading-loose text-ink-900">
        {STORY.blocks.map((b, i) =>
          b.t === 'h2' ? (
            <h2 key={i} className="mt-12 mb-4 font-serif text-xl md:text-2xl font-bold leading-snug [text-wrap:balance]">
              {b.text}
            </h2>
          ) : b.t === 'h3' ? (
            <h3 key={i} className="mt-8 mb-3 font-serif text-lg font-bold">
              {b.text}
            </h3>
          ) : b.t === 'link' ? (
            <p key={i} className="my-5">
              <a
                href={b.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors"
              >
                {b.label} <ArrowUpRight size={18} />
              </a>
            </p>
          ) : b.t === 'img' ? (
            <figure key={i} className="my-6">
              <img src={b.src} width={b.w} height={b.h} loading="lazy" decoding="async" alt={b.caption} className="w-full h-auto rounded-xl border border-cream-200" />
              {b.caption && <figcaption className="mt-2 text-center text-sm text-ink-500">{b.caption}</figcaption>}
            </figure>
          ) : (
            <p key={i} className="my-3" dangerouslySetInnerHTML={{ __html: b.t === 'p' ? b.html : '' }} />
          ),
        )}
      </div>

      <div className="mt-12 rounded-3xl bg-white border border-cream-200 p-6 shadow-card">
        <h2 className="font-serif text-lg font-bold text-ink-900">感想や診断の結果を、聞かせてください</h2>
        <p className="mt-2 text-sm text-ink-700 leading-relaxed">「自分はこんな形になった」「この項目は納得できなかった」など、公式LINEから送れます。</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={LINKS.line} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors">
            公式LINEで送る <ArrowUpRight size={18} />
          </a>
          <Link to="/tools" className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-cream-200 px-5 py-3 text-sm font-bold text-moss-700 hover:border-moss-300">
            2つのツールに戻る <ArrowRight size={16} />
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink-500">
          元の記事：
          <a href={STORY.source} target="_blank" rel="noreferrer" className="underline hover:text-moss-700">
            note（メンバーシップ）
          </a>
        </p>
      </div>
    </article>
  )
}
