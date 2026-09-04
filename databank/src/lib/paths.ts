import { EPISODES, findEpisode, type Episode } from './data'

export interface LearningPath {
  key: string
  title: string
  audience: 'student' | 'consumer' | 'both'
  lead: string
  steps: { id: string; why: string }[]
}

// Curated reading orders. Each step points at an article id under data/articles.
export const PATHS: LearningPath[] = [
  {
    key: 'start-dairy',
    title: 'ゼロから酪農を始める',
    audience: 'student',
    lead: '「牛を買えば始められる？」から「資金はいくら？」「資格は？」まで、就農前に知っておきたい現実を順番に。',
    steps: [
      { id: '2026-03-19_zero-start', why: 'まず、牧場を始めるのに何が必要かを全体像で掴む。' },
      { id: '2026-02-26_non-farm-to-dairy', why: '非農家出身で酪農に入る道と、その壁。' },
      { id: '2026-01-26_startup-capital', why: '資金の規模感を数字で。' },
      { id: '2025-08-08_real-money', why: '「いくら」より「何に使うか」という考え方。' },
      { id: '2025-12-21_qualifications', why: '資格・免許は何が要るのか。' },
      { id: '2026-03-16_before-agri-college', why: '進学前にやっておくと良いこと。' },
      { id: '2025-11-20_hardest-part', why: '一番大変なところを先に知っておく。' },
      { id: '2026-03-01_succession', why: '出口の話。継ぐ、託す、という選択。' },
    ],
  },
  {
    key: 'raise-healthy-cows',
    title: '牛を健康に飼う',
    audience: 'student',
    lead: '毎日の観察、乳房炎、飼料、改良、そして一頭にかかるお金。現場の管理の基本を押さえる。',
    steps: [
      { id: '2025-11-30_daily-care-points', why: '飼育で最も気を配るポイント。' },
      { id: '2025-12-18_mastitis-why', why: '乳房炎はなぜ起きるのか、原因の整理。' },
      { id: '2026-04-01_mastitis-when', why: '乳房炎はいつ起きるのか、搾乳との関係。' },
      { id: '2021-05-28_feed-study-intro', why: '飼料の勉強を始める前の大前提。' },
      { id: '2025-07-18_breeding-strategy', why: '川上牧場の改良戦略。ゲノムか堅実か。' },
      { id: '2026-01-20_lifetime-cost-of-a-cow', why: '牛一頭の一生にかかるお金。' },
    ],
  },
  {
    key: 'milk-truth',
    title: '牛乳のほんとうの話',
    audience: 'consumer',
    lead: '原価はいくら？なぜバターだけ値上がる？給食の牛乳とスーパーの牛乳は何が違う？飲む人の疑問に酪農家が答える。',
    steps: [
      { id: '2025-11-12_cost-of-one-liter', why: '牛乳1リットルの原価。' },
      { id: '2025-12-01_school-milk-vs-store', why: '給食の牛乳とスーパーの牛乳の味の違い。' },
      { id: '2025-11-13_why-butter-price-rises', why: 'バターだけ値上がる仕組み。' },
      { id: '2026-03-26_raw-milk-vs-processed', why: '生乳100％と加工乳の違い。' },
      { id: '2026-02-27_why-milk-is-white', why: '緑の草を食べて白い牛乳が出る理由。' },
      { id: '2026-04-06_do-cows-always-give-milk', why: '牛はずっとミルクを出し続けるのか。' },
    ],
  },
  {
    key: 'bridge',
    title: '酪農と消費者の架け橋',
    audience: 'both',
    lead: '「買う以外の応援」「雄の子牛はどうなる？」「なぜつながれているの？」。距離を縮めるための対話の記録。',
    steps: [
      { id: '2026-03-21_support-beyond-buying', why: '牛乳を買う以外の応援方法。' },
      { id: '2025-11-09_consumers-as-partners', why: '消費者が仲間になる時代。' },
      { id: '2025-07-22_milk-virtuous-cycle', why: 'ミルク好循環のつくり方。' },
      { id: '2026-02-17_male-calves', why: 'ホルスタイン雄・ジャージー雄の行方。' },
      { id: '2026-02-08_animal-welfare-after-calving', why: '分娩直後につながれている理由。' },
      { id: '2025-11-06_compost-science', why: '牛乳を支える見えない主役、堆肥。' },
    ],
  },
]

export function resolvePath(p: LearningPath): { episode: Episode; why: string }[] {
  return p.steps
    .map((s) => ({ episode: findEpisode(s.id), why: s.why }))
    .filter((x): x is { episode: Episode; why: string } => Boolean(x.episode))
}

export function findPath(key: string): LearningPath | undefined {
  return PATHS.find((p) => p.key === key)
}

/** Episodes of a series, oldest first for series that are numbered. */
export function seriesEpisodes(key: string): Episode[] {
  return EPISODES.filter((e) => e.series === key)
}
