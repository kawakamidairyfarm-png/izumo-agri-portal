import { EPISODES, type Episode } from './data'
import { getCached, isAllLoaded, loadAllTranscripts } from './transcripts'

// Common speech-to-text mistakes in the transcripts. Queries and text are both
// normalised so that "楽能" and "酪農" match each other.
const ASR_VARIANTS: [RegExp, string][] = [
  [/楽能|落脳|楽農/g, '酪農'],
  [/乳腺炎|入房院|乳房園/g, '乳房炎'],
  [/搾入|作乳|搾乳/g, '搾乳'],
  [/ホルスタイン|ホルスタン/g, 'ホルスタイン'],
]

export function normalize(s: string): string {
  let t = s.normalize('NFKC').toLowerCase()
  for (const [re, rep] of ASR_VARIANTS) t = t.replace(re, rep)
  return t
}

export interface Hit {
  episode: Episode
  score: number
  snippet: string | null
}

interface Doc {
  episode: Episode
  title: string
  meta: string
  body: string
}

let docs: Doc[] | null = null
let docsWithBodies = false

/** 全文を読み込んで検索の索引を作り直す。Browse ページが最初に呼ぶ */
export async function ensureSearchReady(): Promise<void> {
  await loadAllTranscripts()
  if (!docsWithBodies) {
    docs = null
    docsWithBodies = true
  }
}

export function searchHasBodies(): boolean {
  return isAllLoaded()
}

const bodyOf = (e: Episode): string | null => (e.transcriptKey ? getCached(e.transcriptKey) : null)

function getDocs(): Doc[] {
  if (docs) return docs
  docs = EPISODES.map((e) => ({
    episode: e,
    title: normalize(e.title),
    meta: normalize(
      [
        ...(e.article?.tags ?? []),
        e.article?.summary ?? '',
        ...(e.article?.keyPoints ?? []),
        ...(e.article?.qa.flatMap((p) => [p.q, p.a]) ?? []),
      ].join(' '),
    ),
    body: bodyOf(e) ? normalize(bodyOf(e)!) : '',
  }))
  return docs
}

function countOccurrences(hay: string, needle: string): number {
  if (!needle) return 0
  let n = 0
  let i = 0
  while ((i = hay.indexOf(needle, i)) !== -1) {
    n++
    i += needle.length
    if (n > 50) break
  }
  return n
}

export function search(query: string, limit = 60): Hit[] {
  const terms = normalize(query)
    .split(/[\s\u3000,、]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  if (terms.length === 0) return []

  const hits: Hit[] = []
  for (const d of getDocs()) {
    let score = 0
    let allMatched = true
    let firstBodyIdx = -1
    let firstTerm = ''
    for (const t of terms) {
      const inTitle = d.title.includes(t)
      const inMeta = d.meta.includes(t)
      const bodyCount = countOccurrences(d.body, t)
      if (!inTitle && !inMeta && bodyCount === 0) {
        allMatched = false
        break
      }
      if (inTitle) score += 20
      if (inMeta) score += 8
      score += Math.min(bodyCount, 12)
      if (bodyCount > 0 && firstBodyIdx === -1) {
        firstBodyIdx = d.body.indexOf(t)
        firstTerm = t
      }
    }
    if (!allMatched) continue
    if (d.episode.article) score += 3
    hits.push({ episode: d.episode, score, snippet: makeSnippet(d.episode, firstBodyIdx, firstTerm) })
  }
  hits.sort((a, b) => b.score - a.score || (a.episode.date < b.episode.date ? 1 : -1))
  return hits.slice(0, limit)
}

function makeSnippet(e: Episode, idx: number, term: string): string | null {
  const raw = bodyOf(e)
  if (idx < 0 || !raw) return null
  // The normalised body and the raw transcript have the same length in most
  // cases (NFKC/lowercase keep Japanese text stable), so index into the raw text.
  const start = Math.max(0, idx - 60)
  const end = Math.min(raw.length, idx + term.length + 90)
  const s = raw.slice(start, end).replace(/\s+/g, ' ')
  return (start > 0 ? '…' : '') + s + (end < raw.length ? '…' : '')
}

/** Highlight query terms inside a text. Returns segments for rendering. */
export function highlight(text: string, query: string): { text: string; hit: boolean }[] {
  const terms = normalize(query)
    .split(/[\s\u3000,、]+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  if (terms.length === 0) return [{ text, hit: false }]
  const norm = normalize(text)
  const marks = new Array<boolean>(text.length).fill(false)
  if (norm.length !== text.length) return [{ text, hit: false }]
  for (const t of terms) {
    let i = 0
    while ((i = norm.indexOf(t, i)) !== -1) {
      for (let k = i; k < i + t.length; k++) marks[k] = true
      i += t.length
    }
  }
  const out: { text: string; hit: boolean }[] = []
  let cur = ''
  let curHit = marks[0]
  for (let i = 0; i < text.length; i++) {
    if (marks[i] !== curHit) {
      out.push({ text: cur, hit: curHit })
      cur = ''
      curHit = marks[i]
    }
    cur += text[i]
  }
  if (cur) out.push({ text: cur, hit: curHit })
  return out
}
