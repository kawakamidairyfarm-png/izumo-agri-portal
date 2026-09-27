import { useEffect, useState } from 'react'
import { ARTICLES, BY_TRANSCRIPT, type Episode } from './data'

/** 届いた質問1問（編集した記事のQ&A ＋ 配信本文の質問。同じ質問文は1つ） */
export interface QA {
  id: string
  q: string
  a: string
  episode: Episode
}

/**
 * 質問の住所（/q/<id>）。質問文から決まる8桁の記号なので、並び順が変わっても住所は変わらない。
 * scripts/prerender.mjs の qaId と同じ計算（FNV-1a 32bit）。片方だけ変えないこと。
 */
export function qaId(q: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < q.length; i++) {
    h ^= q.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/**
 * 配信本文から拾った「答え」のうち、実際は質問の続き（「さらに追記として…」）を拾ったものは答えとして出さない。
 * scripts/prerender.mjs の answerText と同じ規則（2026-09-27 Instagram カードを作るときに見つかった）。
 */
export function answerText(a: string | null | undefined): string {
  const t = (a ?? '').trim()
  return /^(さらに)?追記/.test(t) ? '' : t
}

let cache: QA[] | null = null
let pending: Promise<QA[]> | null = null

function load(): Promise<QA[]> {
  if (!pending) {
    pending = import('../../data/questions.json').then((m) => {
      const edited = ARTICLES.flatMap((e) => e.article!.qa.map((p) => ({ q: p.q, a: p.a, episode: e })))
      const seen = new Set(edited.map((x) => x.q))
      const fromBodies = (m.default as { q: string; a: string; key: string }[])
        .map((r) => ({ q: r.q, a: answerText(r.a), episode: BY_TRANSCRIPT.get(r.key) }))
        .filter((r): r is { q: string; a: string; episode: Episode } => Boolean(r.episode) && !seen.has(r.q))
      const all = [...edited, ...fromBodies]
        .map((x) => ({ ...x, id: qaId(x.q) }))
        .sort((a, b) => (a.episode.date < b.episode.date ? 1 : a.episode.date > b.episode.date ? -1 : 0))
      cache = all
      return all
    })
  }
  return pending
}

/** 届いた質問をすべて（読み込むまで null）。必要になったページでだけ読む */
export function useAllQA(): QA[] | null {
  const [rows, setRows] = useState<QA[] | null>(cache)
  useEffect(() => {
    if (cache) return
    let alive = true
    load().then((r) => alive && setRows(r))
    return () => {
      alive = false
    }
  }, [])
  return rows
}
