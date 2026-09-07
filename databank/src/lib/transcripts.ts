// 全文の遅延読み込み。記事ページは1本ずつ、検索は全部をまとめて読む
const urlModules = import.meta.glob<string>('../../data/transcripts/*.txt', { eager: true, query: '?url', import: 'default' })
export const TRANSCRIPT_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(urlModules).map(([path, url]) => [path.split('/').pop()!, url]),
)

const cache: Record<string, string> = {}
let allLoaded: Promise<Record<string, string>> | null = null

export function getCached(key: string): string | null {
  return cache[key] ?? null
}

/** 1本だけ読む（記事ページ用） */
export async function loadTranscript(key: string): Promise<string | null> {
  if (cache[key]) return cache[key]
  if (allLoaded) return (await allLoaded)[key] ?? null
  const url = TRANSCRIPT_URLS[key]
  if (!url) return null
  const res = await fetch(url)
  if (!res.ok) return null
  const text = await res.text()
  cache[key] = text
  return text
}

/** 全部まとめて読む（全文検索用・1チャンク） */
export function loadAllTranscripts(): Promise<Record<string, string>> {
  if (!allLoaded) {
    allLoaded = (
      import.meta.env.VITE_INLINE_TRANSCRIPTS === '1'
        ? import('./transcriptsAll').then((m) => m.default)
        : fetch(`${import.meta.env.BASE_URL}transcripts-all.json`).then((r) => r.json() as Promise<Record<string, string>>)
    ).then((all) => {
      Object.assign(cache, all)
      return all
    })
  }
  return allLoaded
}

// 単一ファイル版（テスト版）では最初から全部を束ねて持つ
if (import.meta.env.VITE_INLINE_TRANSCRIPTS === '1') {
  void loadAllTranscripts()
}

export function isAllLoaded(): boolean {
  return allLoaded !== null && Object.keys(cache).length >= Object.keys(TRANSCRIPT_URLS).length
}
