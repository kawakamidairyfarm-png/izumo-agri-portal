import { EPISODES, findEpisode, type Episode } from './data'

/**
 * LIVEで話した回の記録（data/live.json）。
 * 新しいLIVEを上に足す。記録が空のときは、最近の配信を代わりに出す（LIVEの中身を作り話しないため）。
 */
interface RawLive {
  date: string
  title: string
  note?: string
  episodes: string[]
}
const modules = import.meta.glob<{ lives: RawLive[] }>('../../data/live.json', { eager: true, import: 'default' })
const RAW: RawLive[] = Object.values(modules)[0]?.lives ?? []

export interface Live {
  date: string
  title: string
  note?: string
  episodes: Episode[]
}

export const LIVES: Live[] = RAW.map((l) => ({
  date: l.date,
  title: l.title,
  note: l.note,
  episodes: l.episodes.map((id) => findEpisode(id)).filter((e): e is Episode => Boolean(e)),
})).filter((l) => l.episodes.length > 0)

/** 最近の配信（LIVEの記録が無いときの代わり） */
export function recentEpisodes(n = 3): Episode[] {
  return EPISODES.slice(0, n)
}
