import { stats } from '../lib/data'
import { LINKS } from '../lib/links'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-ink-900">このサイトについて</h1>
      <div className="mt-6 space-y-8 leading-relaxed text-ink-700">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">何のためのサイトか</h2>
          <p className="mt-2">
            島根県出雲市の川上牧場は、{stats.earliest.slice(0, 4)}年から音声配信を続けてきました。配信は毎朝の作業の合間に、牛乳や酪農の疑問、研修生とのやりとり、
            業界の動きを酪農家自身の言葉で話したものです。ここではその文字起こし {stats.episodes} 本を整理し、
            酪農を志す人と牛乳を飲む人が、同じ一次情報から学べるようにしています。
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
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">お問い合わせ・研修・取材</h2>
          <p className="mt-2">
            研修生の受け入れ、学校・自治体向けの教材利用、取材のご相談は、配信のコメント欄または note からご連絡ください。
          </p>
        </section>
      </div>
    </div>
  )
}
