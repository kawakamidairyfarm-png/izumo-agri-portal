// 全文を1つのチャンクにまとめる。検索のときだけ動的importで読み込む（初回表示には含めない）
const modules = import.meta.glob<string>('../../data/transcripts/*.txt', { eager: true, query: '?raw', import: 'default' })
const ALL: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, text]) => [path.split('/').pop()!, text]),
)
export default ALL
