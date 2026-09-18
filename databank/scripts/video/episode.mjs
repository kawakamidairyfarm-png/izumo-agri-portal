import fs from 'node:fs/promises'
import path from 'node:path'

/** 題名の突き合わせ用（src/lib/data.ts の normalizeTitle と同じ規則） */
const norm = (t) => String(t).normalize('NFKC').toLowerCase().replace(/[\s　]/g, '').replace(/[「」『』【】（）()]/g, '')

/** 題名の似ている度合い（2文字の並びの重なり）。同じ日に複数の回があるときの選び分けに使う */
function sim(a, b) {
  const grams = (s) => {
    const n = norm(s)
    const o = new Set()
    for (let i = 0; i < n.length - 1; i++) o.add(n.slice(i, i + 2))
    return o
  }
  const A = grams(a)
  const B = grams(b)
  let c = 0
  for (const x of A) if (B.has(x)) c++
  return (2 * c) / (A.size + B.size || 1)
}

/**
 * 本文ファイル名から、配信の回を引く。
 *
 * キーは2種類ある:
 *   2026-09-16_x5564f57.txt          索引（episodes.json）の日付＋driveIdの頭8文字
 *   2026-03-21_support-beyond-buying.txt  記事（data/articles/*.json）のID
 *
 * 記事のIDのときは、記事 → 索引の行を driveId か「日付＋題名」で探す。
 * 音声の中で言う日付と公開日が1日ずれることがあるので、題名が同じなら±1日まで許す
 * （サイト側 src/lib/data.ts と同じ考え方）。
 */
export async function resolveEpisode(ROOT, key) {
  const stem = String(key).replace(/\.txt$/, '')
  const index = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'episodes.json'), 'utf8'))
  const dir = path.join(ROOT, 'data', 'articles')
  const articles = []
  for (const f of await fs.readdir(dir).catch(() => [])) {
    if (f.endsWith('.json')) articles.push(JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')))
  }

  const m = /^(\d{4}-\d{2}-\d{2})_([0-9a-z]{8})$/.exec(stem)
  let entry = m ? index.find((e) => e.date === m[1] && e.driveId.startsWith(m[2])) ?? null : null
  let article = articles.find((a) => a.id === stem) ?? null

  let how = entry ? 'key' : ''
  if (!entry && article) {
    const day = (s) => new Date(`${s}T00:00:00Z`).getTime()
    entry = index.find((e) => e.driveId === article.driveId) ?? null
    if (entry) how = 'driveId'
    if (!entry) {
      entry = index.find((e) => e.date === article.date && norm(e.title) === norm(article.title)) ?? null
      if (entry) how = '日付＋題名'
    }
    if (!entry) {
      // 題名が違っていても、配信日を突き合わせれば同じ回が見つかる（毎朝1本の配信なので）。
      // 同じ日に複数あるときだけ、題名の似ている方を採る
      const near = index.filter((e) => e.podyUrl && Math.abs(day(e.date) - day(article.date)) <= 86400000)
      if (near.length) {
        entry = near.length === 1 ? near[0] : near.map((e) => ({ e, s: sim(e.title, article.title) })).sort((a, b) => b.s - a.s)[0].e
        how = near.length === 1 ? '配信日' : '配信日＋題名の近さ'
      }
    }
  }
  if (entry && !article) {
    article =
      articles.find((a) => a.driveId === entry.driveId) ??
      articles.find((a) => a.date === entry.date && norm(a.title) === norm(entry.title)) ??
      null
  }

  return {
    entry,
    article,
    how,
    // サイトでの住所（/e/<id>/）。記事があればそのID、無ければ索引のID
    id: article?.id ?? (entry ? `${entry.date}_${entry.driveId.slice(0, 8)}` : stem),
    title: article?.title ?? entry?.title ?? stem,
    date: article?.date ?? entry?.date ?? stem.slice(0, 10),
    podyUrl: entry?.podyUrl ?? null,
  }
}
