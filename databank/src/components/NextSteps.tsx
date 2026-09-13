import { BookOpen, FileDown, FileText, Mail, MapPin, MessageCircle, Sprout } from 'lucide-react'
import type { Audience } from '../lib/data'
import { LINKS } from '../lib/links'

/**
 * 読んだあとの「次の一歩」。
 * 無料の受け皿を1つだけボタンにし、そのほかの段（本・note・現地）は文中リンクの見た目に格下げする。
 *
 * 相手で渡すものを変える。
 * - 酪農を志す人には、まずPDF『ゼロから酪農を始める 読む順番』。いま一番ほしいものを先に渡し、
 *   その下でメルマガを案内する（先に渡して、あとで頼む）。
 * - 牛乳を飲む人には、これまでどおりメルマガ。PDFは「酪農そのものが気になったら」の段に格下げ。
 *
 * 文面はすべて配信本文・サイト内で本人が語っている事実の範囲で書く（新しい実績や価格を発明しない）。
 */
export default function NextSteps({
  audience = 'student',
  compact = false,
  title,
}: {
  audience?: Audience
  compact?: boolean
  title?: string
}) {
  const heading = title ?? (compact ? 'この回を読んだら' : '読んだあとの、次の一歩')
  const student = audience === 'student'

  const steps = student
    ? [
        {
          icon: BookOpen,
          label: '一冊で全体をつかむ',
          text: 'Kindle本『酪農未経験者のために』。Kindle Unlimited なら読み放題の対象です。',
          href: LINKS.kindle,
          cta: 'Kindleで見る',
        },
        {
          icon: FileText,
          label: '数字まで読む',
          text: 'noteのメンバーシップでは、牛群検定の成績や経営の数字、限定記事まで読めます。月額は「牛乳パック2本分」と配信で紹介しています。',
          href: LINKS.noteSubscribe,
          cta: 'メンバーシップを見る',
        },
        {
          icon: MapPin,
          label: '現地で学ぶ',
          text: '川上牧場では研修生を受け入れています。期間や条件は牧場の募集ページに。見学や質問は公式LINEからも送れます。',
          href: LINKS.recruit,
          cta: '研修生募集ページを見る',
        },
      ]
    : [
        {
          icon: FileText,
          label: 'もっと深く読む',
          text: 'noteでは有料記事（1本500円）と、限定記事や牧場の数字まで読めるメンバーシップを公開しています。',
          href: LINKS.noteSubscribe,
          cta: 'noteを見る',
        },
        {
          icon: Sprout,
          label: '酪農そのものが気になったら',
          text: '就農を考える人に渡している『ゼロから酪農を始める 読む順番』のPDFです。資金・資格・非農家からの入り方まで、読む順番をつけてまとめています。',
          href: LINKS.guidePdf,
          cta: '読む順番（PDF）を開く',
        },
        {
          icon: MessageCircle,
          label: '聞いてみる',
          text: '牛乳や牧場について気になったことは、公式LINEから質問できます。配信やnoteで答えることもあります。',
          href: LINKS.line,
          cta: 'LINEで質問する',
        },
      ]

  return (
    <section className={compact ? 'mt-8' : 'mx-auto max-w-6xl px-4 py-10'}>
      <div className="rounded-2xl bg-white border border-cream-200 shadow-card overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* 無料の受け皿は1つだけボタンにする */}
          <div className="bg-moss-50 p-6 md:p-8">
            <p className="text-sm font-bold text-moss-700">{heading}</p>
            {student ? (
              <>
                <h2 className="mt-1 font-serif text-xl font-bold text-ink-900 [text-wrap:balance]">
                  『ゼロから酪農を始める 読む順番』を渡します
                </h2>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">
                  何から調べればいいのか分からない。就農を考えはじめた人が、最初にぶつかるのはそこです。
                </p>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                  資金はいくらかかるのか、資格は要るのか、非農家から入れるのか。研修生に話してきたことを、読む順番をつけてPDFにまとめました。
                </p>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">
                  登録もお金も要りません。開けば、そのまま読めます。
                </p>
                <a
                  href={LINKS.guidePdf}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors"
                >
                  <FileDown size={18} /> 読む順番（PDF）を開く
                </a>
                <p className="mt-4 text-sm text-ink-700 leading-relaxed">
                  この先の話は、週に一度のメルマガで届けています。牛舎で起きていること、牛乳の値段の裏側、SNSでは書きにくい話まで。
                  <a
                    href={LINKS.newsletter}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 inline-block font-bold text-moss-700 underline decoration-moss-300 underline-offset-4 hover:text-moss-900"
                  >
                    メルマガに登録する（無料）
                  </a>
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-1 font-serif text-xl font-bold text-ink-900 [text-wrap:balance]">
                  まず、無料のメルマガを受け取る
                </h2>
                <p className="mt-3 text-sm text-ink-700 leading-relaxed">
                  「牛乳の見方が変わる川上牧場メルマガ」。牛舎で起きていること、牛乳の値段の裏側、子牛が育つ現場、SNSでは書きにくい話をメールで届けます。
                </p>
                <p className="mt-2 text-sm text-ink-700 leading-relaxed">登録は無料で、いつでも解除できます。</p>
                <a
                  href={LINKS.newsletter}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-bold text-white hover:bg-moss-900 transition-colors"
                >
                  <Mail size={18} /> メルマガに登録する（無料）
                </a>
              </>
            )}
          </div>

          {/* そのほかの段は文中リンクの見た目に格下げ */}
          <ul className="divide-y divide-cream-200">
            {steps.map((s) => (
              <li key={s.label} className="flex gap-3 p-5 md:p-6">
                <s.icon size={20} className="shrink-0 mt-0.5 text-moss-700" />
                <div className="min-w-0">
                  <p className="font-bold text-ink-900">{s.label}</p>
                  <p className="mt-1 text-sm text-ink-700 leading-relaxed">{s.text}</p>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block text-sm font-bold text-moss-700 underline decoration-moss-300 underline-offset-4 hover:text-moss-900"
                  >
                    {s.cta}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
