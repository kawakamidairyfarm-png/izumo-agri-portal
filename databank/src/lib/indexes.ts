import { useEffect, useState } from 'react'

/** 届いた質問（scripts/build-transcripts-json.mjs が作る data/questions.json） */
export interface QuestionRow {
  q: string
  a: string
  key: string
}
/** ことば帖（data/terms.json） */
export interface TermRow {
  term: string
  text: string
  key: string
}

type Indexes = { questions: QuestionRow[]; terms: TermRow[] }
let cache: Indexes | null = null
let pending: Promise<Indexes> | null = null

/** 質問とことばの索引を、必要になったページでだけ読む（最初の読み込みを重くしない） */
export function useIndexes(): { questions: QuestionRow[]; terms: TermRow[]; ready: boolean } {
  const [state, setState] = useState(cache)
  useEffect(() => {
    if (cache) return
    const p =
      pending ??
      (pending = Promise.all([import('../../data/questions.json'), import('../../data/terms.json')]).then(([q, t]) => {
        const c: Indexes = { questions: (q.default ?? q) as QuestionRow[], terms: (t.default ?? t) as TermRow[] }
        cache = c
        return c
      }))
    let alive = true
    p.then((c) => alive && setState(c))
    return () => {
      alive = false
    }
  }, [])
  return { questions: state?.questions ?? [], terms: state?.terms ?? [], ready: state !== null }
}
