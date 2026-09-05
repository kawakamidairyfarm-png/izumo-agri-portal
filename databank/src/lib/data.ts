// Data layer: loads the episode index, the curated articles, and full transcripts
// that live under databank/data/. Everything is bundled at build time by Vite,
// so the site is fully static.

export type Category = '酪農技術管理' | '研修生教育' | 'ビジョン社会提言' | '日常配信雑談'
export type Audience = 'student' | 'consumer'

export interface IndexEntry {
  date: string
  title: string
  driveId: string
  bytes: number
  source: 'root' | 'archive'
  /** Optional: category carried over from the ledger spreadsheet. Wins over title rules. */
  category?: Category
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
  /** この回のnote記事URL（分かっている場合のみ） */
  noteUrl?: string
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
  transcript: string | null
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
const transcriptModules = import.meta.glob<string>('../../data/transcripts/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const rawIndex: IndexEntry[] = Object.values(indexModules)[0] ?? []
const articles: Article[] = Object.values(articleModules)
const transcripts: Record<string, string> = Object.fromEntries(
  Object.entries(transcriptModules).map(([path, text]) => [path.split('/').pop()!, text]),
)

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

export const TOPICS: { key: string; label: string; re: RegExp }[] = [
  { key: 'milk', label: '牛乳・乳製品', re: /牛乳|ミルク|バター|チーズ|ヨーグルト|乳製品|練乳|生乳|加工乳|乳飲料|乳脂肪|A2|カルシウム|乳糖/ },
  { key: 'cow', label: '牛の体と行動', re: /牛の|牛は|牛に|牛も|牛さん|牛って|行動|性格|気質|胃|歯|目は|模様|鳴く|なつ|ストレス|しつけ|好かれる|社会|リーダー|血液型|夏バテ|熱中症|視力|毛を|反すう|野生|ホルスタイン|ジャージー|ガンジー|和牛/ },
  { key: 'repro', label: '繁殖・子牛', re: /繁殖|人工授精|妊娠|出産|分娩|子牛|初乳|哺乳|去勢|羊水|逆子|子宮|フリーマーチン|雄|オス|ゲノム|遺伝|改良|血統|種雄牛|ハプロタイプ|体型評価/ },
  { key: 'feed', label: '飼料・栄養', re: /飼料|餌|エサ|草|放牧|TMR|消化|ルーメン|副産物|グラスフェッド|グレインフェッド|A飼料|AMTS|好き嫌い/ },
  { key: 'health', label: '乳房炎・健康', re: /乳房炎|乳腺炎|病気|感染|インフル|細菌|獣医|レントゲン|アレルギー|治療|炎症|防虫|虫/ },
  { key: 'money', label: '経営・お金', re: /原価|資金|お金|マネー|価格|相場|経営|後継|廃業|倒産|土地|数字|規模|コスト|儲|クラファン|投資|値上/ },
  { key: 'career', label: '就農・キャリア', re: /就農|始める|始められる|資格|農業大学|非農家|研修|辞める|大変|飽きる|マンネリ|わざわざ|よかった|なぜ、酪農|一番すごい|後継者|継がせる/ },
  { key: 'env', label: '環境・堆肥', re: /堆肥|糞|フン|メタン|CO2|環境|循環|リン|排せつ物|保水|温暖化|バイオ|エネルギー|匂い/ },
  { key: 'ai', label: 'AI・DX・発信', re: /AI|DX|ロボット|Gemini|GImini|GPT|Vibe|バイブ|動画配信|音声配信|YouTube|TikTok|Instagram|Kindle|Note|SNS|メディア|無人|カメラ/i },
  { key: 'society', label: '社会・制度・歴史', re: /法|制度|給食|政策|農協|JA|大臣|総裁選|補助|歴史|昔|3\.11|災害|防疫|らくのう乳業|全農|海外|世界|中国|アメリカ|イスラエル|国産|輸入/ },
  { key: 'dialogue', label: '消費者との対話', re: /コメント|リスナー|質問|消費者|応援|可哀想|ヴィーガン|アニマルウェルフェア|仲間|好循環|架け橋|海外からの|イベント|ミルクフェス|お便り/ },
]

export function topicsFor(title: string, tags: string[] = []): string[] {
  const hay = title + ' ' + tags.join(' ')
  return TOPICS.filter((t) => t.re.test(hay)).map((t) => t.key)
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
    list.push(toEpisode(e.date, e.title, e.driveId, article, e.category))
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

function toEpisode(date: string, title: string, driveId: string, article: Article | null, ledgerCategory?: Category): Episode {
  const category = article?.category ?? ledgerCategory ?? classify(title)
  const topics = topicsFor(title, article?.tags ?? [])
  const series = seriesFor(title)
  const audience: Audience[] = article?.audience ?? defaultAudience(category, topics)
  return {
    id: article?.id ?? `${date}_${driveId.slice(0, 8)}`,
    date,
    title: article?.title ?? title,
    driveId,
    category,
    topics,
    series,
    audience,
    article,
    transcript: article ? (transcripts[article.transcriptFile] ?? null) : null,
  }
}

function defaultAudience(category: Category, topics: string[]): Audience[] {
  if (category === '研修生教育') return ['student']
  const consumerish = topics.some((t) => ['milk', 'dialogue', 'society'].includes(t))
  const studentish = topics.some((t) => ['repro', 'feed', 'health', 'money', 'career'].includes(t))
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

export function findEpisode(id: string): Episode | undefined {
  return EPISODES.find((e) => e.id === id)
}

export const CATEGORY_META: Record<Category, { label: string; blurb: string; tone: string }> = {
  酪農技術管理: { label: '酪農技術・管理', blurb: '牛の飼い方、搾乳、健康、牛乳の科学', tone: 'bg-moss-100 text-moss-800' },
  研修生教育: { label: '研修生教育', blurb: '研修生・学生と一緒に学ぶ回', tone: 'bg-hay-100 text-hay-700' },
  ビジョン社会提言: { label: 'ビジョン・社会', blurb: '酪農の未来、制度、業界の見方', tone: 'bg-sky-100 text-sky-800' },
  日常配信雑談: { label: '日常・コメント返し', blurb: 'リスナーとのやりとり、日々の話', tone: 'bg-rose-100 text-rose-800' },
}

export const AUDIENCE_META: Record<Audience, { label: string; short: string }> = {
  student: { label: '酪農を志す人・研修生向け', short: '学ぶ人' },
  consumer: { label: '牛乳を飲む人・消費者向け', short: '飲む人' },
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}

export const stats = {
  episodes: EPISODES.length,
  articles: ARTICLES.length,
  earliest: EPISODES.length ? EPISODES[EPISODES.length - 1].date : '',
  latest: EPISODES.length ? EPISODES[0].date : '',
}
