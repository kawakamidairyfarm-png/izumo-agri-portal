import type { Episode } from './data'

export const LINKS = {
  pody: 'https://pody.jp/player/OT1nXl6WW61B8vjQ98ru',
  note: 'https://note.com/kawakamifarm',
  youtube: 'https://www.youtube.com/channel/UC7biWU5T2H9H6mmzgaNV2Bw',
  spotify: 'https://open.spotify.com/show/5VP7uC8prZ3wjoYDLHSUmj',
}

export interface EpisodeLink {
  url: string
  /** true なら該当回への直接リンク、false ならタイトル検索へのリンク */
  exact: boolean
}

/**
 * この回のnoteリンク。実URLが登録されていればそこへ、
 * なければタイトルでnote内を検索した結果へ飛ぶ。
 */
export function noteLinkFor(episode: Episode): EpisodeLink {
  if (episode.noteUrl) return { url: episode.noteUrl, exact: true }
  const q = encodeURIComponent(`川上哲也 ${episode.title}`)
  return { url: `https://note.com/search?context=note&mode=search&q=${q}`, exact: false }
}

/** この回のYouTubeリンク。未登録ならチャンネル内をタイトルで検索。 */
export function youtubeLinkFor(episode: Episode): EpisodeLink {
  if (episode.youtubeUrl) return { url: episode.youtubeUrl, exact: true }
  const q = encodeURIComponent(episode.title)
  return { url: `${LINKS.youtube}/search?query=${q}`, exact: false }
}

/** この回のSpotifyリンク。未登録ならエピソード検索。 */
export function spotifyLinkFor(episode: Episode): EpisodeLink {
  if (episode.spotifyUrl) return { url: episode.spotifyUrl, exact: true }
  const q = encodeURIComponent(episode.title.slice(0, 40))
  return { url: `https://open.spotify.com/search/${q}/episodes`, exact: false }
}
