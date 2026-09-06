import { NavLink, Link, Outlet } from 'react-router-dom'
import { Menu, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'
import { formatDate, stats } from '../lib/data'
import { LINKS } from '../lib/links'

const NAV = [
  { to: '/for-students', label: 'はじめに' },
  { to: '/paths', label: '学びの道筋' },
  { to: '/browse', label: '全配信を探す' },
  { to: '/for-consumers', label: '消費者の疑問' },
  { to: '/about', label: '牧場について' },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-cream-200">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0" onClick={() => setOpen(false)}>
            <span className="leading-tight min-w-0">
              <span className="block font-serif text-lg font-bold text-ink-900 truncate">川上牧場</span>
              <span className="block text-xs font-bold tracking-[0.18em] text-moss-700 truncate">酪農データバンク</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-moss-50 text-moss-900' : 'text-ink-700 hover:bg-cream-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <a
              href={LINKS.line}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-line px-3 py-2 text-sm font-bold text-white hover:bg-line-dark"
            >
              <MessageCircle size={16} /> LINEで質問
            </a>
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
          <nav className="md:hidden border-t border-cream-200 bg-white px-4 py-2 flex flex-col">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-sm font-medium ${isActive ? 'bg-moss-50 text-moss-900' : 'text-ink-700'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <a href={LINKS.line} target="_blank" rel="noreferrer" className="mt-1 mb-2 inline-flex items-center gap-1.5 rounded-lg bg-line px-3 py-3 text-sm font-bold text-white">
              <MessageCircle size={16} /> LINEで質問する
            </a>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* スマホ: いつでも質問できる浮きボタン */}
      <a
        href={LINKS.line}
        target="_blank"
        rel="noreferrer"
        className="md:hidden fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-line px-4 py-3 text-sm font-bold text-white shadow-lg"
        aria-label="LINEで質問する"
      >
        <MessageCircle size={18} /> 質問する
      </a>

      <footer className="mt-16">
        <div className="border-t-4 border-moss-700 bg-cream-100">
          <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
            <div>
              <p className="font-bold text-ink-900 mb-2">川上牧場</p>
              <p className="text-ink-700 leading-relaxed">
                島根県出雲市の牧場から、酪農の現場を毎朝配信しています。このサイトは配信の文字起こしをもとに、酪農を志す人が順番に学べるように整理したものです。
              </p>
            </div>
            <div>
              <p className="font-bold text-ink-900 mb-2">聴く・読む・聞く</p>
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
                <li>
                  <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.noteSubscribe} target="_blank" rel="noreferrer">
                    川上牧場🐮サブスク（note）
                  </a>
                </li>
                <li>
                  <a className="underline decoration-moss-300 hover:text-moss-700" href={LINKS.line} target="_blank" rel="noreferrer">
                    公式LINEで質問する
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
            収録期間 {formatDate(stats.earliest)} 〜 {formatDate(stats.latest)} ／ 要約つき {stats.articles} 本
          </div>
        </div>
      </footer>
    </div>
  )
}
