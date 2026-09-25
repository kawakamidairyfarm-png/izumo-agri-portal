import { GROUPS } from '../lib/data'

/**
 * テーマ（8つの大分類）で絞る札の列。スマホでは横に流し、PCでは折り返す。
 * 届いた質問・ことば帖で使う（2026-09-25: 長い一覧をテーマで絞れるように）。
 */
export default function GroupFilter({
  value,
  onChange,
  counts,
  total,
  label,
}: {
  value: string | null
  onChange: (key: string | null) => void
  counts: Map<string, number>
  total: number
  label: string
}) {
  const items = [
    { key: null as string | null, label: 'すべて', n: total },
    ...GROUPS.map((g) => ({ key: g.key as string | null, label: g.label, n: counts.get(g.key) ?? 0 })),
  ].filter((c) => c.n > 0)
  return (
    <div className="mt-5 -mx-4 overflow-x-auto px-4" role="group" aria-label={label}>
      <div className="flex gap-2 pb-1 sm:flex-wrap">
        {items.map((c) => {
          const on = value === c.key
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onChange(c.key)}
              aria-pressed={on}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${
                on ? 'border-moss-700 bg-moss-700 text-white' : 'border-cream-200 bg-white text-ink-700 hover:border-moss-300'
              }`}
            >
              {c.label} <span className={on ? 'font-normal text-white/80' : 'font-normal text-ink-500'}>{c.n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** もっと見るの釦 */
export function MoreButton({ rest, onClick }: { rest: number; onClick: () => void }) {
  if (rest <= 0) return null
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl bg-white border border-cream-200 px-5 py-3 text-sm font-bold text-ink-900 hover:border-moss-300"
      >
        もっと見る（残り {rest} 件）
      </button>
    </div>
  )
}
