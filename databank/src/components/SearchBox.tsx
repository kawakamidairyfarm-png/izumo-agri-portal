import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SUGGESTIONS = ['乳房炎', '原価', '資金', '子牛', '放牧', 'バター', '給食', '後継者', 'AI']

export default function SearchBox({
  initial = '',
  large = false,
  onSearch,
}: {
  initial?: string
  large?: boolean
  onSearch?: (q: string) => void
}) {
  const [q, setQ] = useState(initial)
  const nav = useNavigate()
  const submit = (value: string) => {
    const v = value.trim()
    if (onSearch) onSearch(v)
    else nav(v ? `/browse?q=${encodeURIComponent(v)}` : '/browse')
  }
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(q)
        }}
        className={`flex items-center gap-2 rounded-2xl bg-white border border-cream-200 shadow-card focus-within:border-moss-500 ${
          large ? 'p-2 pl-4' : 'p-1.5 pl-3'
        }`}
      >
        <Search className="text-ink-500 shrink-0" size={large ? 22 : 18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="川上牧場に聞く。例：乳房炎はなぜ起きる？"
          className={`flex-1 min-w-0 bg-transparent outline-none ${large ? 'text-lg py-2' : 'text-sm py-1.5'}`}
          aria-label="検索"
        />
        <button
          type="submit"
          className={`rounded-xl bg-moss-600 text-cream-50 font-bold hover:bg-moss-700 ${large ? 'px-5 py-2.5' : 'px-4 py-2 text-sm'}`}
        >
          探す
        </button>
      </form>
      {large && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s)
                submit(s)
              }}
              className="rounded-full border border-cream-200 bg-white px-3 py-1 text-xs text-ink-700 hover:border-moss-300 hover:text-moss-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
