import type { Episode } from './data'

export const LINKS = {
  pody: 'https://pody.jp/player/OT1nXl6WW61B8vjQ98ru',
  note: 'https://note.com/kawakamifarm',
  /** 川上牧場🐮サブスク（noteのメンバーシップ・有料マガジン） */
  noteSubscribe: 'https://note.com/kawakamifarm/m/md448972b533b',
  youtube: 'https://www.youtube.com/channel/UC7biWU5T2H9H6mmzgaNV2Bw',
  spotify: 'https://open.spotify.com/show/5VP7uC8prZ3wjoYDLHSUmj',
  /** 川上牧場 公式LINE（質問受付） */
  line: 'https://line.me/R/ti/p/@imb8734o?ts=04142028&oat_content=url',
}

export interface EpisodeLink {
  url: string
  /** true なら該当回への直接リンク、false ならタイトル検索へのリンク */
  exact: boolean
}

/**
 * この回のnoteリンク。実URLが登録されていればそこへ、
 * なければnote内検索へ飛ぶ。noteでの記事タイトルが配信タイトルと
 * 異なるシリーズは、シリーズ名での検索に切り替える。
 */
export function noteLinkFor(episode: Episode): EpisodeLink {
  if (episode.noteUrl) return { url: episode.noteUrl, exact: true }
  const t = episode.title
  let query: string
  if (/(?:famars|farmers)\s*voices/i.test(t)) {
    // note側は「【Farmers Voices🐮】 AI文字起こし vol.N」表記（配信の約1週間後に公開）
    query = 'Farmers Voices AI文字起こし'
  } else if (/R7.?年?研修生と配信/.test(t)) {
    // note側は「R7年研修生と配信 #N」表記
    query = 'R7年研修生と配信'
  } else if (/^川上牧場研修/.test(t)) {
    // note側は「川上牧場研修 #N【副題】」表記なので副題で検索
    const sub = t.match(/【(.+?)】/)?.[1]
    query = sub ? `川上牧場研修 ${sub}` : '川上牧場研修'
  } else {
    // 【】や記号を除いてnoteの検索にかかりやすくする
    query = `川上哲也 ${t.replace(/[【】「」｜]/g, ' ').replace(/\s+/g, ' ').trim()}`
  }
  const q = encodeURIComponent(query)
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
