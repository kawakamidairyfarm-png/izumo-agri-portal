import { episodesForTopic, topicByKey, type Audience, type Episode, type Topic } from './data'
import { LINKS } from './links'

/**
 * 変化の階段: 読む人の「いまの状態」から入る入口。
 * 8×39 のテーマ（taxonomy.json）は「何を話したか」で分けた棚。
 * この階段は「相手がいまどこにいるか」で分けた入口で、棚の小分類をまとめて指す。
 * 2026-09-22 の裁定（scripts/裁定_カテゴリ分け_2026-09-22.md）に基づく。
 *
 * 各段の「次の一歩」は一つだけ。無料の受け皿（LINE・メルマガ）を先に、有料（note・Kindle）は後ろの段に。
 * 文面は配信本文・サイト内で本人が語っている事実の範囲で書く。
 */
export interface Stair {
  key: string
  audience: Audience
  /** 相手の言葉で書いた見出し（棚の名前ではなく、いまの状態） */
  title: string
  lead: string
  /** この段で読む小分類（taxonomy の sub key）。順は読む順 */
  topics: string[]
  /** この段の次の一歩は一つだけ */
  next: { label: string; text: string; href: string; cta: string }
}

export const STAIRS: Stair[] = [
  // ── 牛乳を飲む人（3段）──
  {
    key: 'store',
    audience: 'consumer',
    title: 'スーパーで、ふと気になった',
    lead: '牛乳の値段、パックの表示、給食の牛乳とスーパーの牛乳の違い、バターだけ高い理由。買うときに浮かんだ「なぜ？」に、酪農家が答えた回から。',
    topics: ['milk-price', 'milk-kind', 'milk-taste', 'dairy-products', 'milk-body', 'milk-science'],
    next: {
      label: '聞いてみる',
      text: '読んでも残った「なぜ？」は、公式LINEから送れます。配信やnoteで答えることがあります。',
      href: LINKS.line,
      cta: 'LINEで質問する',
    },
  },
  {
    key: 'cows',
    audience: 'consumer',
    title: '牛のことが、気になってきた',
    lead: '牛は何を考えているのか、なぜつながれているのか、雄の子牛はどうなるのか、暑さに弱いって本当か。牛乳の裏側にいる牛の暮らしを、飼っている本人が話した回から。',
    topics: ['cow-mind', 'cow-body', 'welfare', 'male-calf', 'cow-life', 'cow-season', 'cow-breed', 'env'],
    next: {
      label: '牛舎の話を、続けて受け取る',
      text: '「牛乳の見方が変わる川上牧場メルマガ」。牛舎で起きていること、子牛が育つ現場、SNSでは書きにくい話をメールで届けます。無料で、いつでも解除できます。',
      href: LINKS.newsletter,
      cta: 'メルマガに登録する（無料）',
    },
  },
  {
    key: 'support',
    audience: 'consumer',
    title: '買う以外に、応援できることは',
    lead: '牛乳を買う以外にできることはあるのか、酪農はこれからどうなるのか、届いた声にどう答えてきたか。距離を縮める対話の記録から。',
    topics: ['fans', 'qa', 'policy', 'industry', 'media', 'life'],
    next: {
      label: 'もっと深く読む',
      text: 'noteでは有料記事（1本500円）と、限定記事や牧場の数字まで読めるメンバーシップを公開しています。',
      href: LINKS.noteSubscribe,
      cta: 'noteを見る',
    },
  },
  // ── 酪農を志す人（4段）──
  {
    key: 'dream',
    audience: 'student',
    title: '憧れている。向いているか知りたい',
    lead: 'やりがいと大変さ、毎日の作業、牧場の日常、研修生が実際に見たこと。憧れのまま来た人に、最初に話してきたことから。',
    topics: ['reality', 'daily', 'training', 'life'],
    next: {
      label: '読む順番を、無料で受け取る',
      text: 'PDF『ゼロから酪農を始める 読む順番』。資金、資格、非農家からの道を、研修生に話してきた順にまとめました。無料メルマガに登録するとすぐ届きます。',
      href: LINKS.newsletter,
      cta: '登録してPDFを受け取る（無料）',
    },
  },
  {
    key: 'reality',
    audience: 'student',
    title: '現実を知りたい。お金と、大変さと、やめる話',
    lead: '一頭にかかるお金、資金と補助金、規模と働き方、後継と廃業、制度の話。良いことだけでなく、やめた人の話まで。',
    topics: ['cost', 'money-start', 'management', 'succession', 'policy', 'industry', 'future'],
    next: {
      label: '数字まで読む',
      text: 'noteのメンバーシップでは、牛群検定の成績や経営の数字、限定記事まで読めます。月額は「牛乳パック2本分」と配信で紹介しています。',
      href: LINKS.noteSubscribe,
      cta: 'メンバーシップを見る',
    },
  },
  {
    key: 'prepare',
    audience: 'student',
    title: '準備を始める',
    lead: '就農の始め方、何をどう学ぶか、資格は要るか、研修や体験にどう入るか。決めた人が次に踏む段。',
    topics: ['start-dairy', 'learn', 'training'],
    next: {
      label: '現地で学ぶ',
      text: '川上牧場では研修生を受け入れています。期間や条件は牧場の募集ページに。見学や質問は公式LINEからも送れます。',
      href: LINKS.recruit,
      cta: '研修生募集ページを見る',
    },
  },
  {
    key: 'farming',
    audience: 'student',
    title: '飼っている。飼い始めた',
    lead: '餌、乳房炎、病気、牛舎、子牛、繁殖、改良、AIと省力化。毎日の管理で迷ったときに、現場の判断をそのまま話した回から。',
    topics: ['feed', 'mastitis', 'disease', 'barn', 'daily', 'calf', 'birth', 'breeding', 'genetics', 'dx'],
    next: {
      label: '一冊で全体をつかむ',
      text: 'Kindle本『酪農未経験者のために』。Kindle Unlimited なら読み放題の対象です。',
      href: LINKS.kindle,
      cta: 'Kindleで見る',
    },
  },
]

export const AUDIENCE_LABEL: Record<Audience, string> = { consumer: '牛乳を飲む人', student: '酪農を志す人' }

export function stairsFor(audience: Audience): Stair[] {
  return STAIRS.filter((s) => s.audience === audience)
}
export function findStair(key: string): Stair | undefined {
  return STAIRS.find((s) => s.key === key)
}
/** 同じ相手の中での段の位置（1 始まり）と段数 */
export function stairPosition(stair: Stair): { n: number; of: number } {
  const list = stairsFor(stair.audience)
  return { n: list.findIndex((s) => s.key === stair.key) + 1, of: list.length }
}
export function resolveStair(stair: Stair): { topic: Topic; episodes: Episode[] }[] {
  return stair.topics
    .map((k) => {
      const topic = topicByKey(k)
      return topic ? { topic, episodes: episodesForTopic(k) } : null
    })
    .filter((x): x is { topic: Topic; episodes: Episode[] } => x !== null)
}
/** この段に入っている回の数（小分類の重なりは一回に数える） */
export function stairEpisodeCount(stair: Stair): number {
  const ids = new Set<string>()
  for (const k of stair.topics) for (const e of episodesForTopic(k)) ids.add(e.id)
  return ids.size
}
/** 小分類が入っている段 */
export function stairsForTopic(key: string): Stair[] {
  return STAIRS.filter((s) => s.topics.includes(key))
}
