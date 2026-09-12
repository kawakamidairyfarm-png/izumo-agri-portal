import { Link } from 'react-router-dom'
import { MessageCircle, Mail } from 'lucide-react'
import { LINKS } from '../lib/links'
import { stats } from '../lib/data'

/** 企業・研究機関・メディアからの相談の入口。牧場の現場の知見を、外の人が使えるようにする */
export default function Expert() {
  const chip = 'rounded-full bg-cream-100 px-3 py-1 text-xs text-ink-700'
  return (
    <div>
      <section className="bg-moss-900 text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <p className="text-sm font-bold text-hay-300">企業・研究機関・メディアの方へ</p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold leading-tight">
            酪農の現場に、直接たずねる
          </h1>
          <p className="mt-4 leading-relaxed">
            島根県出雲市で搾乳牛40頭・全体80頭を1人で管理している酪農家です。毎朝の配信{stats.episodes}回分をこのサイトに公開しています。
          </p>
          <p className="mt-2 leading-relaxed">
            現場で実際に起きていること、数字の読み方、機械や資材の使われ方を、統計や資料では出てこない粒度でお話しします。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-10 text-ink-700 leading-relaxed">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">こんなご相談を受けています</h2>
          <ul className="mt-3 space-y-2.5">
            <li>・<span className="font-bold text-ink-900">飼養管理の実態</span>{'　'}乳房炎、繁殖、削蹄、暑熱対策。日々どう判断し、何を見ているか。</li>
            <li>・<span className="font-bold text-ink-900">経営とコスト</span>{'　'}牛1頭にかかる費用、飼料価格の影響、機械や設備の入れ替えの判断。</li>
            <li>・<span className="font-bold text-ink-900">人手と働き方</span>{'　'}求人、スキマバイト、研修生の受け入れ。少人数で回すための手順づくり。</li>
            <li>・<span className="font-bold text-ink-900">遺伝改良と繁殖</span>{'　'}牛群検定の読み方、交配設計、近交係数の管理、受精卵移植やF1。</li>
            <li>・<span className="font-bold text-ink-900">資材・機械の使われ方</span>{'　'}現場で何が選ばれ、何が定着せず、なぜ捨てられるか。</li>
            <li>・<span className="font-bold text-ink-900">消費者と酪農のあいだ</span>{'　'}牛乳をめぐる誤解、食育、取材や記事の監修。</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white border border-cream-200 shadow-card p-6">
          <h2 className="font-serif text-xl font-bold text-ink-900">実績と、話せることの裏づけ</h2>
          <ul className="mt-3 space-y-2">
            <li>・知見提供サービス「ビザスク」を通じた専門家インタビューを<span className="font-bold text-ink-900">10件</span>実施（2024年〜）。依頼元と内容は守秘のため公開していません。</li>
            <li>・毎朝の音声配信を2021年から継続。全{stats.episodes}回、うち{stats.withText}回は全文をこのサイトで公開しています。</li>
            <li>・Kindle『酪農未経験者のために ― 遺伝改良と飼料設計編』『川上牧場研修 牛群検定の見方編』</li>
            <li>・繁殖牛の血統から子牛の近交係数を計算するアプリを自作・公開。</li>
            <li>・研修生の受け入れを継続。高校生・中学生の職場体験、海外からの研修生も受け入れています。</li>
          </ul>
          <p className="mt-4 text-sm text-ink-500">
            ご相談の内容や貴社名を外部に出すことはありません。ビザスク経由の案件でも、依頼元・内容は一切公開していません。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">受け方と費用</h2>
          <div className="mt-3 space-y-4">
            <div className="rounded-2xl bg-cream-100 p-5">
              <p className="font-bold text-ink-900">スポット相談（オンライン）</p>
              <p className="mt-1 text-sm">Zoomなどで直接おたずねください。1時間から、1回きりで完結します。</p>
            </div>
            <div className="rounded-2xl bg-cream-100 p-5">
              <p className="font-bold text-ink-900">継続の伴走・顧問</p>
              <p className="mt-1 text-sm">月1回の面談と、その間の相談。新規事業の立ち上げや、牧場運営の設計に並走します。内容に応じてお見積りします。</p>
            </div>
            <div className="rounded-2xl bg-cream-100 p-5">
              <p className="font-bold text-ink-900">現地訪問・取材の受け入れ</p>
              <p className="mt-1 text-sm">川上牧場での撮影・取材・見学。出張でのご相談も承ります。日程と内容をご相談ください。</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-500">
            費用は、ご相談の内容と時間をうかがってから個別にお見積りします。金額の目安だけ先に知りたい場合も、その旨をお送りください。
          </p>
          <p className="mt-2 text-sm text-ink-500">
            出雲で牧場を経営しているため、移住や常駐はいたしかねます。オンラインでの継続と、必要に応じた訪問という形になります。
          </p>
        </section>

        <section className="rounded-2xl bg-moss-50 p-6">
          <h2 className="font-serif text-xl font-bold text-ink-900">まずはご連絡ください</h2>
          <p className="mt-2">
            内容が固まっていない段階でも構いません。何を知りたいかだけ送っていただければ、お役に立てるかどうかを先にお返事します。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href={LINKS.line} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark">
              <MessageCircle size={18} /> 公式LINEで相談する
            </a>
            <a href="mailto:kawakami.dairy.farm@gmail.com" className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-5 py-3 text-sm font-bold text-ink-900 hover:border-moss-300">
              <Mail size={18} /> メールで相談する
            </a>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink-900">先に中身を見ていただくために</h2>
          <p className="mt-2">
            どんなことを、どの粒度で話しているかは、このサイトでそのまま読めます。言葉で全文検索できます。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['乳房炎', '飼料設計', '牛群検定', '近交係数', '人手不足', '資金'].map((w) => (
              <Link key={w} to={`/browse?q=${encodeURIComponent(w)}`} className={chip}>
                {w}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-500">
            牧場の経営者の方で、自分の牧場の相談をされたい場合は
            <Link to="/about#farmers" className="underline decoration-moss-300 underline-offset-4 hover:text-moss-700"> 酪農家・牧場の方へ </Link>
            をご覧ください。月額のプランをご用意しています。
          </p>
        </section>
      </div>
    </div>
  )
}
