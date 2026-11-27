import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SUGGESTIONS = ['資金', '資格', '非農家', '研修', '乳房炎', '飼料設計', '改良', '後継者', '牛乳の原価']

export default function SearchBox({
  initial = '',
  large = false,
  placeholder = '例：牧場を始めるのに資金はいくら？',
  suggestions = SUGGESTIONS,
  onSearch,
}: {
  initial?: string
  large?: boolean
  /** 読む人に合わせて例を変える（志す人には就農の質問、飲む人には牛乳の質問） */
  placeholder?: string
  /** 検索窓の下に並べる言葉。placeholder と同じく、読む人に合わせて差し替える */
  suggestions?: string[]
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
          placeholder={placeholder}
          className={`search-input flex-1 min-w-0 bg-white text-ink-900 placeholder:text-ink-500 caret-moss-700 outline-none ${large ? 'text-lg py-2' : 'text-sm py-1.5'}`}
          autoComplete="off"
          aria-label="検索"
        />
        <button
          type="submit"
          className={`shrink-0 rounded-xl bg-moss-700 text-white font-bold hover:bg-moss-900 ${large ? 'min-h-11 px-5 text-base' : 'min-h-10 px-4 text-sm'}`}
        >
          探す
        </button>
      </form>
      {large && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-500">例：</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s)
                submit(s)
              }}
              className="min-h-11 rounded-full border border-moss-300 bg-white px-4 text-base text-moss-700 hover:border-moss-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
