import type { Episode } from './data'

export const LINKS = {
  pody: 'https://pody.jp/player/OT1nXl6WW61B8vjQ98ru',
  note: 'https://note.com/kawakamifarm',
}

/**
 * この回のnoteリンク。記事に実URLが登録されていればそこへ、
 * なければタイトルでnote内を検索した結果へ飛ぶ（各回のnote記事は
 * 配信タイトルと同名なので、通常は先頭に該当記事が出る）。
 */
export function noteLinkFor(episode: Episode): { url: string; exact: boolean } {
  const exact = episode.article?.noteUrl
  if (exact) return { url: exact, exact: true }
  const q = encodeURIComponent(`川上哲也 ${episode.title}`)
  return { url: `https://note.com/search?context=note&mode=search&q=${q}`, exact: false }
}
