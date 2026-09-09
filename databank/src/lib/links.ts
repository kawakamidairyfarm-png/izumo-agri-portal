import type { Episode } from './data'

export const LINKS = {
  pody: 'https://pody.jp/player/OT1nXl6WW61B8vjQ98ru',
  note: 'https://note.com/kawakamifarm',
  /** noteのメンバーシップ（限定記事・数字まで読める） */
  noteSubscribe: 'https://note.com/kawakamifarm/membership/boards',
  /** 酪農DX・タイミー活用 伴走サポートの紹介記事 */
  notePlanBanso: 'https://note.com/kawakamifarm/n/ndf5ea5a0bd27',
  /** FarmEcho（酪農×AI）の紹介記事 */
  notePlanFarmEcho: 'https://note.com/kawakamifarm/n/nbf0a8d7a7a3e',
  youtube: 'https://www.youtube.com/channel/UC7biWU5T2H9H6mmzgaNV2Bw',
  spotify: 'https://open.spotify.com/show/5VP7uC8prZ3wjoYDLHSUmj',
  /** 川上牧場 公式LINE（質問受付） */
  line: 'https://line.me/R/ti/p/@imb8734o?ts=04142028&oat_content=url',
  /** 無料メルマガ「牛乳の見方が変わる川上牧場メルマガ」の登録ページ（配信本文で案内している登録URL） */
  newsletter: 'https://kawakamifarm.net/p/r/VrTCygLJ',
  /** 川上牧場 研修生募集ページ（牧場の公式サイト） */
  recruit: 'https://kawakamibokuzyou.hp.peraichi.com/recruit/',
  /** Kindle本『酪農未経験者のために』（Kindle Unlimited 対象） */
  kindle: 'https://www.amazon.co.jp/dp/B0FBQWGSK6',
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
