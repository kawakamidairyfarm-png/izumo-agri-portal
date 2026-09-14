import { useEffect, useState } from 'react'
import { HelpCircle, Quote, Sparkles } from 'lucide-react'
import { parseTranscript, splitParagraph } from '../lib/transcript'

/** 幅の狭い画面か（段落を分けるかどうかの判断に使う） */
function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow
}

/**
 * 配信の全文を、章立て・発言・質問・用語メモの形のまま出す。
 * 印の無い文章（昔の文字起こし・note の記事）は、これまでどおり段落だけで並ぶ。
 */
export default function TranscriptBody({ text }: { text: string }) {
  const blocks = parseTranscript(text)
  const narrow = useNarrow()
  return (
    <div className="prose-transcript space-y-4 text-base leading-[1.85] text-ink-700">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading':
            return (
              <h3
                key={i}
                id={`sec-${i}`}
                className="scroll-mt-20 pt-4 first:pt-0 font-serif text-lg font-bold text-ink-900 [text-wrap:balance]"
              >
                {b.text}
              </h3>
            )
          case 'quote':
            return (
              <figure key={i} className="rounded-2xl bg-cream-50 border border-cream-200 px-5 py-4">
                <figcaption className="flex items-center gap-1.5 text-xs font-bold text-moss-700">
                  <Quote size={14} /> {b.who || '話し手'}
                </figcaption>
                <blockquote className="mt-1.5 space-y-2 text-ink-900">
                  {(narrow ? splitParagraph(b.text) : [b.text]).map((t, j) => (
                    <p key={j}>{t}</p>
                  ))}
                </blockquote>
              </figure>
            )
          case 'question':
            return (
              <div key={i} className="rounded-2xl bg-white border-l-4 border-moss-500 border-y border-r border-cream-200 px-5 py-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-moss-700">
                  <HelpCircle size={14} /> 質問{b.who && <span className="text-ink-500 font-medium">{b.who}</span>}
                </p>
                <div className="mt-1.5 space-y-2 font-bold text-ink-900">
                  {(narrow ? splitParagraph(b.text) : [b.text]).map((t, j) => (
                    <p key={j}>{t}</p>
                  ))}
                </div>
              </div>
            )
          case 'insight':
            return (
              <figure key={i} className="rounded-2xl bg-hay-100 px-5 py-4">
                <blockquote className="font-bold text-ink-900">
                  <Sparkles size={14} className="mr-1.5 inline-block align-[-2px] text-hay-700" />
                  {b.text}
                </blockquote>
                {b.who && <figcaption className="mt-1.5 text-xs font-bold text-hay-700">── {b.who}</figcaption>}
              </figure>
            )
          case 'term':
            return (
              <p key={i} className="rounded-xl bg-cream-100 px-4 py-3 text-sm">
                {b.who && <span className="font-bold text-ink-900">{b.who}{'\u3000'}</span>}
                {b.text}
              </p>
            )
          case 'points':
            return (
              <ul key={i} className="space-y-1.5 rounded-2xl bg-moss-50 px-5 py-4">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss-500" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )
          default:
            // 狭い画面では、長い段落を文の切れ目で分ける（広い画面ではそのまま）
            return (
              <div key={i} className="space-y-3">
                {(narrow ? splitParagraph(b.text) : [b.text]).map((t, j) => (
                  <p key={j}>{t}</p>
                ))}
              </div>
            )
        }
      })}
    </div>
  )
}
