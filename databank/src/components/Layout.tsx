import { NavLink, Link, Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { stats } from '../lib/data'
import { LINKS } from '../lib/links'

const NAV = [
  { to: '/for-students', label: '酪農を学ぶ' },
  { to: '/for-consumers', label: '牛乳を知る' },
  { to: '/paths', label: '学びの道筋' },
  { to: '/browse', label: '全配信を探す' },
  { to: '/about', label: 'このサイトについて' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-cream-50/90 backdrop-blur border-b border-cream-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setOpen(false)}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-moss-600 text-cream-50 font-black text-sm shadow-sm">
              牛
            </span>
            <span className="leading-tight min-w-0">
              <span className="block font-bold text-ink-900 truncate">川上牧場 酪農データバンク</span>
              <span className="block text-[11px] text-ink-500 truncate">音声配信 {stats.episodes} 本の知識を、学ぶ人と飲む人へ</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-moss-100 text-moss-800' : 'text-ink-700 hover:bg-cream-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-cream-100"
            aria-label="メニュー"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open && (
          <nav className="md:hidden border-t border-cream-200 bg-cream-50 px-4 py-2 flex flex-col">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-sm font-medium ${isActive ? 'bg-moss-100 text-moss-800' : 'text-ink-700'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-cream-200 bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
          <div>
            <p className="font-bold text-ink-900 mb-2">川上牧場</p>
            <p className="text-ink-700 leading-relaxed">
              島根県出雲市の小さな牧場から、牛乳と酪農の魅力を毎日配信しています。このサイトは配信の文字起こしをもとに、
              酪農を志す人と牛乳を飲む人が同じ知識にアクセスできるように整理したものです。
            </p>
          </div>
          <div>
            <p className="font-bold text-ink-900 mb-2">配信を聴く・読む</p>
            <ul className="space-y-1.5 text-ink-700">
              <li>
                <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.pody} target="_blank" rel="noreferrer">
                  Pody で音声配信を聴く
                </a>
              </li>
              <li>
                <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.note} target="_blank" rel="noreferrer">
                  note で記事を読む
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-ink-900 mb-2">おことわり</p>
            <p className="text-ink-700 leading-relaxed">
              内容は配信時点の川上牧場の経験と意見です。価格・制度・医学的な情報は時間とともに変わるため、判断の際は最新の一次資料も確認してください。
            </p>
          </div>
        </div>
        <div className="border-t border-cream-200 py-4 text-center text-xs text-ink-500">
          収録期間 {stats.earliest} 〜 {stats.latest} ／ 要約つき {stats.articles} 本
        </div>
      </footer>
    </div>
  )
}
