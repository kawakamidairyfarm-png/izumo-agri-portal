import { CalendarDays, MessageCircle, Users } from 'lucide-react'
import training from '../../data/training.json'
import { LINKS } from '../lib/links'
import { PHOTOS } from '../lib/photos'
import { stats } from '../lib/data'

/**
 * 研修（就農準備 3日間）の募集ページ。
 * data/training.json の enabled が true のときだけ本文を出す。価格・日程・定員はデータ側で決める（サイトでは発明しない）。
 * 文面は台帳の事実（受け入れ実績・配信年数・受賞）だけで、効果や就農の約束は書かない。
 */
export default function Training() {
  const t = training
  const photo = PHOTOS.students ?? PHOTOS.hero

  if (!t.enabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-bold text-moss-700">研修</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink-900">{t.title}は準備中です</h1>
        <p className="mt-4 leading-relaxed text-ink-700">
          日程と参加費が決まりしだい、このページで募集します。研修生・インターンシップの受け入れや見学の相談は、これまでどおり公式LINEから送れます。
        </p>
        <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark">
          <MessageCircle size={18} /> LINEで相談する
        </a>
      </div>
    )
  }

  const price = t.price > 0 ? `${t.price.toLocaleString()}円（税込）` : '参加費は準備中'
  return (
    <article>
      <section className="bg-moss-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-hay-100">島根県出雲市・川上牧場</p>
            <h1 className="mt-3 font-serif text-3xl md:text-4xl font-bold leading-tight [text-wrap:balance]">{t.lead}</h1>
            <p className="mt-5 max-w-2xl leading-relaxed">{t.intro}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 max-w-md text-sm">
              <div>
                <dt className="inline-flex items-center gap-1 text-hay-100 font-bold"><CalendarDays size={16} /> 日程</dt>
                <dd className="mt-1 font-bold">{t.dates || '調整中'}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1 text-hay-100 font-bold"><Users size={16} /> 定員</dt>
                <dd className="mt-1 font-bold">{t.capacity}名（先着）</dd>
              </div>
            </dl>
            <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-hay-300 px-5 py-3 text-sm font-bold text-moss-900 hover:bg-hay-500">
              <MessageCircle size={18} /> LINEで「研修希望」と送る
            </a>
          </div>
          {photo && <img src={photo} alt="川上牧場の牛舎" className="rounded-2xl w-full aspect-[4/3] object-cover" />}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-10">
        <section>
          <h2 className="font-serif text-2xl font-bold text-ink-900">読んで分かることと、立ってみて分かることは違う</h2>
          <p className="mt-3 leading-relaxed text-ink-700">
            「牛を買えば始められますか」「非農家でも本当になれますか」「資金はいくら」「一番大変なのはどこ」。配信に届く質問は、いつも同じところで止まっています。
          </p>
          <p className="mt-2 leading-relaxed text-ink-700">この3日間は、読むだけでは埋まらない部分を、現場で埋めるためにあります。</p>
        </section>

        <section className="rounded-2xl bg-white border border-cream-200 shadow-card p-6">
          <p className="text-sm font-bold text-moss-700">話す人</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-ink-900">川上哲也（川上牧場）</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            島根県出雲市で乳牛約80頭を飼う酪農家。非農家の出身で、10歳のときにゲーム『牧場物語』をきっかけに酪農家を志し、就農しました。第31回 全農酪農経営体験発表会 優秀賞。島根県指導農業士。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {stats.earliest.slice(0, 4)}年から毎朝の音声配信を続け、研修生・高校生・中学生など400人以上を牧場に迎えてきました。
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-ink-900">3日間でやること</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white border border-cream-200 shadow-card">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-500">
                <tr><th className="px-4 py-3">日</th><th className="px-4 py-3">午前（作業）</th><th className="px-4 py-3">午後（講義・対話）</th></tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {t.schedule.map((d) => (
                  <tr key={d.day} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-ink-900">{d.day}</td>
                    <td className="px-4 py-3 text-ink-700 leading-relaxed">{d.am}</td>
                    <td className="px-4 py-3 text-ink-700 leading-relaxed">{d.pm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink-500 leading-relaxed">
            機械の運転、分娩介助、興奮した牛の扱いなど危険を伴う作業は見学です。作業は学びのために行うもので、労働ではありません。体調により、いつでも中断できます。
          </p>
        </section>

        <section className="rounded-2xl bg-hay-100 border border-hay-300/60 p-6">
          <h2 className="font-serif text-2xl font-bold text-ink-900">参加のご案内</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-[8em_1fr]">
            <dt className="font-bold text-ink-900">日程</dt><dd className="text-ink-700">{t.dates || '調整中'}{t.hours ? `（各日 ${t.hours}）` : ''}</dd>
            <dt className="font-bold text-ink-900">定員</dt><dd className="text-ink-700">{t.capacity}名。先着。定員に達し次第締め切ります</dd>
            <dt className="font-bold text-ink-900">参加費</dt><dd className="text-ink-700">{price}</dd>
            <dt className="font-bold text-ink-900">含むもの</dt><dd className="text-ink-700">{t.includes.join('、')}</dd>
            <dt className="font-bold text-ink-900">含まないもの</dt><dd className="text-ink-700">{t.excludes.join('、')}{t.insurance ? `。${t.insurance}` : ''}</dd>
            <dt className="font-bold text-ink-900">対象</dt><dd className="text-ink-700">{t.target}</dd>
            {t.lodging && (<><dt className="font-bold text-ink-900">宿泊</dt><dd className="text-ink-700">{t.lodging}</dd></>)}
            {t.payment && (<><dt className="font-bold text-ink-900">お支払い</dt><dd className="text-ink-700">{t.payment}</dd></>)}
            {t.cancel && (<><dt className="font-bold text-ink-900">キャンセル</dt><dd className="text-ink-700">{t.cancel}</dd></>)}
          </dl>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold text-ink-900">よくある質問</h2>
          <div className="mt-4 space-y-3">
            {t.faq.map((f) => (
              <div key={f.q} className="rounded-2xl bg-white border border-cream-200 p-5">
                <p className="font-bold text-ink-900">Q. {f.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">A. {f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-moss-50 p-6 text-center">
          <h2 className="font-serif text-xl font-bold text-ink-900">申込は公式LINEから</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">「研修希望」と送ってください。折り返し、申込の案内をお送りします。質問だけでも構いません。</p>
          <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-line px-5 py-3 text-sm font-bold text-white hover:bg-line-dark">
            <MessageCircle size={18} /> LINEで「研修希望」と送る
          </a>
        </section>

        {t.legal.business && (
          <section className="text-xs leading-relaxed text-ink-500">
            <h2 className="text-sm font-bold text-ink-700">特定商取引法に基づく表記</h2>
            <dl className="mt-2 grid gap-1 sm:grid-cols-[10em_1fr]">
              <dt>事業者名</dt><dd>{t.legal.business}</dd>
              <dt>代表者</dt><dd>{t.legal.representative}</dd>
              <dt>所在地</dt><dd>{t.legal.address}</dd>
              <dt>電話番号</dt><dd>{t.legal.phone}</dd>
              <dt>メールアドレス</dt><dd>{t.legal.email}</dd>
              <dt>販売価格</dt><dd>{price}</dd>
              <dt>代金以外の費用</dt><dd>{t.excludes.join('、')}は参加者の負担</dd>
              <dt>支払方法・時期</dt><dd>{t.payment || '申込時にご案内します'}</dd>
              <dt>提供時期</dt><dd>{t.dates || '募集ページに記載の日程'}</dd>
              <dt>キャンセル・返金</dt><dd>{t.cancel || '申込時にご案内します'}</dd>
            </dl>
          </section>
        )}
      </div>
    </article>
  )
}
