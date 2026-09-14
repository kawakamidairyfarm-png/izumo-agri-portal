/**
 * 配信の全文につく「行頭の印」を読み解く。
 *
 * pody の記事は章立て・発言の吹き出し・質問・用語メモ・まとめでできている。
 * 平らな文章にすると見分けのつかない壁になるので、取り込みのときに行頭へ印を置いてある
 * （印を付ける側は scripts/ingest.mjs の podyArticleToText。印の一覧はそちらにも書いてある）。
 *
 *   ## 見出し        ?? 質問した人｜質問      %% 用語｜説明
 *   >> 話者｜発言     !! だいじなひとこと      -- まとめの項目
 *
 * 印の無い行はふつうの段落。印を知らない文章（昔の文字起こし・note の記事）は
 * そのまま段落として読めるので、どちらの形も同じ関数で扱える。
 */

export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'quote'; who: string; text: string }
  | { kind: 'question'; who: string; text: string }
  | { kind: 'insight'; who: string; text: string }
  | { kind: 'term'; who: string; text: string }
  | { kind: 'points'; items: string[] }

const MARKER = /^(##|>>|\?\?|!!|%%|--)\s+([\s\S]*)$/

/** 「名前｜本文」を分ける。区切りが無ければ名前なしとして扱う */
function split(rest: string): { who: string; text: string } {
  const i = rest.indexOf('｜')
  return i < 0 ? { who: '', text: rest.trim() } : { who: rest.slice(0, i).trim(), text: rest.slice(i + 1).trim() }
}

export function parseTranscript(raw: string): Block[] {
  const blocks: Block[] = []
  for (const line of raw.split(/\n+/)) {
    const l = line.trim()
    if (!l) continue
    const m = MARKER.exec(l)
    if (!m) {
      blocks.push({ kind: 'paragraph', text: l })
      continue
    }
    const [, mark, rest] = m
    if (mark === '##') blocks.push({ kind: 'heading', text: rest.trim() })
    else if (mark === '>>') blocks.push({ kind: 'quote', ...split(rest) })
    else if (mark === '??') blocks.push({ kind: 'question', ...split(rest) })
    else if (mark === '!!') blocks.push({ kind: 'insight', ...split(rest) })
    else if (mark === '%%') blocks.push({ kind: 'term', ...split(rest) })
    else {
      // まとめの項目は続くかぎり1つの箱にまとめる
      const last = blocks[blocks.length - 1]
      if (last?.kind === 'points') last.items.push(rest.trim())
      else blocks.push({ kind: 'points', items: [rest.trim()] })
    }
  }
  return blocks
}

/** 印を外して、ふつうの文章に戻す（検索の抜き書きなど、見出しの形が要らないところで使う） */
export function stripMarkers(raw: string): string {
  return raw.replace(/^(##|>>|\?\?|!!|%%|--)\s+/gm, '').replace(/^([^\n｜]{1,24})｜/gm, '$1: ')
}

/** この全文が章立てのある記事か（見出しが1つでもあれば目次を出す価値がある） */
export function hasChapters(blocks: Block[]): boolean {
  return blocks.some((b) => b.kind === 'heading')
}
