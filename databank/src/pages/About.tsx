import { MessageCircle } from 'lucide-react'
import { stats } from '../lib/data'
import { LINKS } from '../lib/links'
import { PHOTOS } from '../lib/photos'

export default function About() {
  const photo = PHOTOS.about ?? PHOTOS.students
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-ink-900">牧場とこのサイトについて</h1>

      <section className="mt-6 rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
        {photo && <img src={photo} alt="川上牧場" className="h-56 w-full object-cover" />}
        <div className="p-6">
          <p className="text-sm font-bold text-moss-700">話しているのは</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-ink-900">川上哲也（川上牧場）</h2>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-700">
            <p>島根県出雲市で乳牛約80頭を飼う酪農家。非農家の出身で、10歳のときにゲーム『牧場物語』をきっかけに酪農家を志し、就農しました。</p>
            <p>第31回 全農酪農経営体験発表会 優秀賞。島根県指導農業士。{stats.earliest.slice(0, 4)}年から毎朝の音声配信を続けています。</p>
            <p>研修生や高校生・中学生の受け入れ、スポットワークを通じて、これまで400人以上を牧場に迎えてきました。</p>
          </div>
        </div>
      </section>

      <div className="mt-8 space-y-8 leading-relaxed text-ink-700">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">何のためのサイトか</h2>
          <p className="mt-2">
            配信は毎朝の作業の合間に、研修生とのやりとり、牛の健康や飼料、経営のお金、業界の動きを酪農家自身の言葉で話したものです。
          </p>
          <p className="mt-2">
            ここではその文字起こし {stats.episodes} 本を整理し、酪農を志す人が、就農前に知っておきたいことを順番に読めるようにしています。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">どう作られているか</h2>
          <ol className="mt-2 list-decimal pl-5 space-y-1.5">
            <li>配信音声を自動文字起こしし、配信日とタイトルで索引化します。</li>
            <li>タイトルから分類・テーマ・シリーズを機械的に付与し、全配信を検索できるようにします。</li>
            <li>本文を読み込んだ回には、要約・要点・Q&A・実体験・注意点を添えます。要約つきは現在 {stats.articles} 本で、順次増やしています。</li>
            <li>全文検索では、文字起こしの誤変換（楽能→酪農、乳腺炎→乳房炎 など）を吸収して探せるようにしています。</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">読むときの約束</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-bold text-ink-900">経験と科学的根拠を分けて読む。</span> 配信は川上牧場の経験・問題意識として扱い、医学・栄養・制度の事実は最新の一次資料で確認してください。
            </li>
            <li>
              <span className="font-bold text-ink-900">配信日を見る。</span> 価格、制度、製品の仕様は変わります。古い回の数字はその時点の話です。
            </li>
            <li>
              <span className="font-bold text-ink-900">逐語引用は原文で確認する。</span> 文字起こしは発言の厳密な記録ではありません。引用する場合は配信本体で確認してください。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">配信を聴く・読む</h2>
          <ul className="mt-2 space-y-1.5">
            <li>
              音声配信：
              <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.pody} target="_blank" rel="noreferrer">
                Pody
              </a>
            </li>
            <li>
              記事：
              <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.note} target="_blank" rel="noreferrer">
                note
              </a>
              ／ 数字まで読める
              <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.noteSubscribe} target="_blank" rel="noreferrer">
                川上牧場🐮サブスク
              </a>
            </li>
          </ul>
        </section>

        <section className="rounded-2xl bg-moss-50 p-6">
          <h2 className="font-serif text-xl font-bold text-ink-900">質問・研修・見学・取材</h2>
          <p className="mt-2">研修生の受け入れ、見学、学校・自治体向けの教材利用、取材のご相談は、公式LINEから気軽に送ってください。</p>
          <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark">
            <MessageCircle size={18} /> LINEで質問する
          </a>
        </section>
      </div>
    </div>
  )
}
