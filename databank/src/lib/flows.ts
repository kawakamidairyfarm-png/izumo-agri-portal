import { GROUPS, episodesForTopic, topicByKey, type Episode, type Topic } from './data'

/** 流れで読む: 小分類を順にたどる入口。牛の一生、牛乳が届くまで、など */
export interface Flow {
  key: string
  title: string
  lead: string
  steps: { topic: string; why: string }[]
}

export const FLOWS: Flow[] = [
  {
    key: 'life-of-a-cow',
    title: '牛の一生をたどる',
    lead: '生まれてから、母牛になり、引退するまで。牛の一生を順にたどると、酪農の仕事が全部つながって見えます。',
    steps: [
      { topic: 'calf', why: '生まれた直後。初乳、哺乳、離乳。' },
      { topic: 'feed', why: '何を食べて育つか。' },
      { topic: 'breeding', why: '発情、人工授精、妊娠。母牛になる。' },
      { topic: 'birth', why: 'お産。ここから牛乳が出はじめる。' },
      { topic: 'mastitis', why: '搾乳と、いちばん多い病気。' },
      { topic: 'cow-life', why: '何年生きて、いつ引退するのか。' },
      { topic: 'male-calf', why: '雄の子牛はどうなるのか。' },
    ],
  },
  {
    key: 'milk-to-table',
    title: '牛乳が食卓に届くまで',
    lead: '牧場で絞られてから、殺菌され、店に並び、値段が付くまで。1本の牛乳の裏側を順に。',
    steps: [
      { topic: 'feed', why: '味の元は餌。' },
      { topic: 'mastitis', why: '搾乳。' },
      { topic: 'milk-science', why: '牛乳の中身。なぜ白いのか。' },
      { topic: 'milk-kind', why: '殺菌と表示。売り場の見分け方。' },
      { topic: 'industry', why: '乳業メーカーと流通。' },
      { topic: 'milk-price', why: '値段と原価。' },
      { topic: 'milk-taste', why: '給食とスーパーで味が違う理由。' },
    ],
  },
  {
    key: 'become-a-farmer',
    title: '酪農家になるまで',
    lead: '知る、学ぶ、体験する、始める、続ける。志す人が通る順に。',
    steps: [
      { topic: 'reality', why: 'まず、やりがいと大変さを正直に。' },
      { topic: 'learn', why: '何をどう学ぶか。資格は要るか。' },
      { topic: 'training', why: '研修・体験の記録。' },
      { topic: 'start-dairy', why: '始め方。非農家からの道。' },
      { topic: 'money-start', why: 'いくら要るか。' },
      { topic: 'management', why: '経営者としての判断。' },
      { topic: 'succession', why: '出口まで考える。' },
    ],
  },
]

export function findFlow(key: string): Flow | undefined {
  return FLOWS.find((f) => f.key === key)
}
export function resolveFlow(flow: Flow): { topic: Topic; why: string; episodes: Episode[] }[] {
  return flow.steps
    .map((s) => {
      const topic = topicByKey(s.topic)
      return topic ? { topic, why: s.why, episodes: episodesForTopic(s.topic) } : null
    })
    .filter((x): x is { topic: Topic; why: string; episodes: Episode[] } => x !== null)
}
/** 小分類が入っている流れ */
export function flowsForTopic(key: string): Flow[] {
  return FLOWS.filter((f) => f.steps.some((s) => s.topic === key))
}
export const GROUP_COUNT = GROUPS.length
