// Data layer: loads the episode index, the curated articles, and full transcripts
import { TRANSCRIPT_URLS } from './transcripts'
// that live under databank/data/. Everything is bundled at build time by Vite,
// so the site is fully static.

export type Category = '酪農技術管理' | '研修生教育' | 'ビジョン社会提言' | '日常配信雑談'
export type Audience = 'student' | 'consumer'

export interface IndexEntry {
  date: string
  title: string
  driveId: string
  bytes: number
  /** root/archive=Driveの文字起こしフォルダ、note=noteの記事から自動取り込み、inbox=inboxフォルダから取り込み、pody=podyの記事から自動取り込み */
  source: 'root' | 'archive' | 'note' | 'inbox' | 'pody'
  /** 本文（data/transcripts/）をどこから取り込んだか。無ければ note か inbox */
  bodySource?: 'note' | 'inbox' | 'pody'
  /** Optional: category carried over from the ledger spreadsheet. Wins over title rules. */
  category?: Category
  /** Optional: この回のnote記事URL */
  noteUrl?: string
  youtubeUrl?: string
  spotifyUrl?: string
  /** podyのこの回のページ（AIが音声から起こした記事と再生） */
  podyUrl?: string
}

export interface Article {
  id: string
  date: string
  title: string
  driveId: string
  category: Category
  audience: Audience[]
  tags: string[]
  summary: string
  keyPoints: string[]
  qa: { q: string; a: string }[]
  quotes: string[]
  experience: string
  caveats: string
  transcriptFile: string
  /** 各プラットフォームの該当回URL（分かっている場合のみ） */
  noteUrl?: string
  youtubeUrl?: string
  spotifyUrl?: string
}

/** Unified record used across the UI. Curated articles carry an `article`. */
export interface Episode {
  id: string
  date: string
  title: string
  driveId: string
  category: Category
  topics: string[]
  series: string | null
  audience: Audience[]
  article: Article | null
  /** 要約の一文。編集した記事があればその要約、無ければ全文の「まとめ」の要旨。どちらも無ければ null */
  summary: string | null
  /** 本文（全文）のファイル名。本文は遅延読み込み（lib/transcripts.ts）。無ければ null */
  transcriptKey: string | null
  hasTranscript: boolean
  /** 本文の出典: drive=配信音声の自動文字起こし（要約つきの回）／note=noteの無料記事の本文／pody=podyがAIで音声から起こした記事 */
  transcriptSource: 'drive' | 'note' | 'pody' | null
  /** noteの該当記事が有料（全文はnoteで購読・購入して読む） */
  paidNote: boolean
  /** 有料記事の価格（円）。メンバーシップ限定は 0、無料・不明は null */
  notePrice: number | null
  /** 各プラットフォームの該当回URL（記事データまたは索引に登録があるとき） */
  noteUrl: string | null
  youtubeUrl: string | null
  spotifyUrl: string | null
  podyUrl: string | null
}

// ---------- raw loading ----------

const indexModules = import.meta.glob<IndexEntry[]>('../../data/episodes.json', {
  eager: true,
  import: 'default',
})
const articleModules = import.meta.glob<Article>('../../data/articles/*.json', {
  eager: true,
  import: 'default',
})
/** noteで有料販売している記事（URL→{title,date,price}）。該当する回は全文を載せない */
const paidModules = import.meta.glob<Record<string, { title: string; date: string; price: number }>>('../../data/note_paid.json', {
  eager: true,
  import: 'default',
})
const PAID_NOTE: Record<string, { title: string; date: string; price: number }> = Object.values(paidModules)[0] ?? {}
/** 全文の「## まとめ」から抜いた要旨（本文ファイル名→一文）。scripts/build-transcripts-json.mjs が作る */
const summaryModules = import.meta.glob<Record<string, string>>('../../data/summaries.json', {
  eager: true,
  import: 'default',
})
const SUMMARIES: Record<string, string> = Object.values(summaryModules)[0] ?? {}


const rawIndex: IndexEntry[] = Object.values(indexModules)[0] ?? []
const articles: Article[] = Object.values(articleModules)

// ---------- classification ----------

const CATEGORY_RULES: [Category, RegExp][] = [
  ['研修生教育', /研修生|川上牧場研修|職場体験|インターンシップ|中学生|高校生/],
  ['日常配信雑談', /コメント返し|リスナー|質問|Famars ?Voices|総集編|お便り|振り返|やってみたいこと|質問箱|エゴサーチ/i],
  [
    'ビジョン社会提言',
    /未来|先行き|シナリオ|提言|相場|国際|総裁選|大臣|給食から|日本の酪農|企業化|担い手|高齢化|6次産業|メディア|境界線|氷河期|CO2|規制/,
  ],
]

export function classify(title: string): Category {
  for (const [cat, re] of CATEGORY_RULES) if (re.test(title)) return cat
  return '酪農技術管理'
}

// ---------- テーマ（大分類→小分類） ----------
// 分け方は data/taxonomy.json。回ごとの小分類は scripts/build-topics.mjs が全文の見出し・ことば・要旨・質問から
// 決めて data/topics.json に書く（prebuild）。全文の無い回は、ここで題名だけから補う。

export interface Topic {
  key: string
  label: string
  blurb: string
  group: string
  re: RegExp
}
export interface TopicGroup {
  key: string
  label: string
  blurb: string
  audience: 'consumer' | 'student' | 'both'
  subs: Topic[]
}
interface RawTaxonomy {
  groups: { key: string; label: string; blurb: string; audience: 'consumer' | 'student' | 'both'; subs: { key: string; label: string; blurb: string; re: string }[] }[]
}
const taxonomyModules = import.meta.glob<RawTaxonomy>('../../data/taxonomy.json', { eager: true, import: 'default' })
const topicMapModules = import.meta.glob<Record<string, string[]>>('../../data/topics.json', { eager: true, import: 'default' })
const RAW_TAX: RawTaxonomy = Object.values(taxonomyModules)[0] ?? { groups: [] }
const TOPIC_MAP: Record<string, string[]> = Object.values(topicMapModules)[0] ?? {}

export const GROUPS: TopicGroup[] = RAW_TAX.groups.map((g) => ({
  key: g.key,
  label: g.label,
  blurb: g.blurb,
  audience: g.audience,
  subs: g.subs.map((s) => ({ key: s.key, label: s.label, blurb: s.blurb, group: g.key, re: new RegExp(s.re, 'i') })),
}))
/** 小分類の一覧（平ら）。EpisodeCard などが label を引くのに使う */
export const TOPICS: Topic[] = GROUPS.flatMap((g) => g.subs)
export function topicByKey(key: string): Topic | undefined {
  return TOPICS.find((t) => t.key === key)
}
export function groupByKey(key: string): TopicGroup | undefined {
  return GROUPS.find((g) => g.key === key)
}

/** 回のテーマ。prebuild で決めたものがあればそれ、無ければ題名と札から（最大2つ） */
export function topicsFor(id: string, title: string, tags: string[] = []): string[] {
  const pre = TOPIC_MAP[id]
  if (pre && pre.length) return pre
  const hay = title + ' ' + tags.join(' ')
  return TOPICS.filter((t) => t.re.test(hay))
    .slice(0, 2)
    .map((t) => t.key)
}

export const SERIES: { key: string; label: string; description: string; re: RegExp }[] = [
  { key: 'trainee', label: 'R7年 研修生と配信', description: '2025年度の研修生と一緒に、日々の作業と学びを語る連続配信。', re: /研修生と配信/ },
  { key: 'lecture2021', label: '川上牧場研修（2021）', description: '飼料設計・遺伝改良・体型評価など、研修生向けの本格講義。', re: /川上牧場研修【/ },
  { key: 'sunday', label: '日曜コメント返し', description: 'SNSと音声配信に届いた質問に、まとめて答える日曜回。', re: /コメント返し|リスナー|質問箱|お便り|日曜/ },
  { key: 'famars', label: 'Famars Voices', description: '農業×AI・発信・地方の動きを短く話す水曜配信。', re: /Famars ?Voices/i },
  { key: 'intern', label: '中高生の受け入れ', description: '中学生の職場体験、高校生インターンシップの受け入れ記録。', re: /職場体験|インターンシップ/ },
]

export function seriesFor(title: string): string | null {
  return SERIES.find((s) => s.re.test(title))?.key ?? null
}

// ---------- assembly ----------

function slugFromIndex(e: IndexEntry): string {
  return `${e.date}_${e.driveId.slice(0, 8)}`
}

function build(): Episode[] {
  const byDrive = new Map<string, Article>()
  const byDateTitle = new Map<string, Article>()
  for (const a of articles) {
    byDrive.set(a.driveId, a)
    byDateTitle.set(a.date + '|' + normalizeTitle(a.title), a)
  }

  const seen = new Set<string>()
  const list: Episode[] = []

  for (const e of rawIndex) {
    const article = byDrive.get(e.driveId) ?? byDateTitle.get(e.date + '|' + normalizeTitle(e.title)) ?? null
    const id = article?.id ?? slugFromIndex(e)
    if (seen.has(id)) continue
    seen.add(id)
    if (article) byDrive.delete(article.driveId)
    list.push(toEpisode(e.date, e.title, e.driveId, article, e.category, e))
  }
  // Articles that are not in the index (should not happen, but keep them visible)
  for (const a of byDrive.values()) {
    if (seen.has(a.id)) continue
    seen.add(a.id)
    list.push(toEpisode(a.date, a.title, a.driveId, a))
  }

  list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title, 'ja')))
  return list
}

function toEpisode(
  date: string,
  title: string,
  driveId: string,
  article: Article | null,
  ledgerCategory?: Category,
  indexEntry?: IndexEntry,
): Episode {
  const category = article?.category ?? ledgerCategory ?? classify(title)
  const id = article?.id ?? `${date}_${driveId.slice(0, 8)}`
  const topics = topicsFor(id, title, article?.tags ?? [])
  const series = seriesFor(title)
  const audience: Audience[] = article?.audience ?? defaultAudience(category, topics)
  const noteUrl = article?.noteUrl || indexEntry?.noteUrl || null
  const paidInfo = noteUrl ? PAID_NOTE[noteUrl.split('?')[0]] : undefined
  const paidNote = Boolean(paidInfo)
  // 有料記事の回は、noteの本文もDriveの文字起こしも載せない（要約・Q&Aだけ）
  const driveKey = !paidNote && article && TRANSCRIPT_URLS[article.transcriptFile] ? article.transcriptFile : null
  const noteKey = !paidNote && TRANSCRIPT_URLS[`${id}.txt`] ? `${id}.txt` : null
  const transcriptKey = driveKey ?? noteKey
  return {
    id,
    date,
    title: article?.title ?? title,
    driveId,
    category,
    topics,
    series,
    audience,
    article,
    summary: article?.summary || (transcriptKey && SUMMARIES[transcriptKey]) || null,
    transcriptKey,
    hasTranscript: transcriptKey !== null,
    transcriptSource: driveKey ? 'drive' : noteKey ? (indexEntry?.bodySource === 'pody' ? 'pody' : 'note') : null,
    paidNote,
    notePrice: paidInfo ? paidInfo.price : null,
    noteUrl,
    youtubeUrl: article?.youtubeUrl || indexEntry?.youtubeUrl || null,
    spotifyUrl: article?.spotifyUrl || indexEntry?.spotifyUrl || null,
    podyUrl: indexEntry?.podyUrl || null,
  }
}

function defaultAudience(category: Category, topics: string[]): Audience[] {
  if (category === '研修生教育') return ['student']
  const groups = topics.map((t) => topicByKey(t)?.group).filter(Boolean) as string[]
  const consumerish = groups.some((g) => ['milk', 'voice'].includes(g)) || topics.some((t) => ['welfare', 'cow-mind', 'cow-body', 'milk-taste'].includes(t))
  const studentish = groups.some((g) => ['repro', 'care', 'farm', 'career'].includes(g))
  if (consumerish && !studentish) return ['consumer']
  if (studentish && !consumerish) return ['student']
  return ['student', 'consumer']
}

export function normalizeTitle(t: string): string {
  return t
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[“”"「」『』!！?？・:：、。…—─―]/g, '')
    .toLowerCase()
}

export const EPISODES: Episode[] = build()
export const ARTICLES: Episode[] = EPISODES.filter((e) => e.article)
/** 本文ファイル名 → 回（本文から作った索引: 質問・ことば帖 を回に結びつける） */
export const BY_TRANSCRIPT = new Map<string, Episode>(EPISODES.filter((e) => e.transcriptKey).map((e) => [e.transcriptKey!, e]))

export function findEpisode(id: string): Episode | undefined {
  return EPISODES.find((e) => e.id === id)
}

/** ある小分類の回。読める順（要約つき → 全文あり → 題名だけ）、同じ中では新しい順 */
export function episodesForTopic(key: string): Episode[] {
  const rank = (e: Episode) => (e.summary ? 0 : e.hasTranscript ? 1 : 2)
  return EPISODES.filter((e) => e.topics.includes(key)).sort((a, b) => rank(a) - rank(b) || (a.date < b.date ? 1 : -1))
}
/** ある大分類の回（小分類のどれかに当たる回） */
export function episodesForGroup(key: string): Episode[] {
  const subs = new Set(groupByKey(key)?.subs.map((s) => s.key) ?? [])
  return EPISODES.filter((e) => e.topics.some((t) => subs.has(t)))
}

export const CATEGORY_META: Record<Category, { label: string; blurb: string; tone: string }> = {
  酪農技術管理: { label: '酪農技術・管理', blurb: '牛の飼い方、搾乳、健康、牛乳の科学', tone: 'bg-moss-100 text-moss-800' },
  研修生教育: { label: '研修生教育', blurb: '研修生・学生と一緒に学ぶ回', tone: 'bg-hay-100 text-hay-700' },
  ビジョン社会提言: { label: 'ビジョン・社会', blurb: '酪農の未来、制度、業界の見方', tone: 'bg-sky-100 text-sky-800' },
  日常配信雑談: { label: '日常・コメント返し', blurb: 'リスナーとのやりとり、日々の話', tone: 'bg-rose-100 text-rose-800' },
}

export const AUDIENCE_META: Record<Audience, { label: string; short: string }> = {
  student: { label: '酪農を志す人・研修生向け', short: '志す人' },
  consumer: { label: '消費者に聞かれる質問', short: '消費者の疑問' },
}

/** 文を「。」で分ける（「」（）の中は分けない） */
export function splitSentences(text: string): string[] {
  const out: string[] = []
  let buf = ''
  let depth = 0
  for (const ch of text) {
    buf += ch
    if ('「『（'.includes(ch)) depth++
    else if ('」』）'.includes(ch)) depth = Math.max(0, depth - 1)
    if (ch === '。' && depth === 0) {
      out.push(buf.trim())
      buf = ''
    }
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

/** 長い文章を、2文以内・約60字以内の段落に分ける（幅390pxで3行に収まる目安） */
export function paragraphs(text: string, limit = 60): string[] {
  const ss = splitSentences(text)
  const res: string[] = []
  let cur = ''
  let n = 0
  for (const s of ss) {
    if (cur && (n >= 2 || (cur + s).length > limit)) {
      res.push(cur)
      cur = ''
      n = 0
    }
    cur += s
    n++
  }
  if (cur) res.push(cur)
  return res
}

/** カード用の書き出し: 先頭の1〜2文（約90字まで） */
export function leadOf(text: string, max = 90): string {
  const ss = splitSentences(text)
  if (!ss.length) return text
  let out = ss[0]
  if (ss[1] && (out + ss[1]).length <= max) out += ss[1]
  return out
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}

export const stats = {
  episodes: EPISODES.length,
  articles: ARTICLES.length,
  withText: EPISODES.filter((e) => e.hasTranscript).length,
  /** 要約のある回（編集した記事＋全文のまとめ） */
  withSummary: EPISODES.filter((e) => e.summary).length,
  earliest: EPISODES.length ? EPISODES[EPISODES.length - 1].date : '',
  latest: EPISODES.length ? EPISODES[0].date : '',
}
