// data/photos/ に置かれた写真をビルド時に取り込む。
// 該当ファイルが無ければ null（写真なしレイアウトで描画される）。
const modules = import.meta.glob<string>('../../data/photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?inline',
  import: 'default',
})

function find(name: string): string | null {
  for (const [path, url] of Object.entries(modules)) {
    const base = path.split('/').pop()!.replace(/\.(jpg|jpeg|png|webp)$/i, '')
    if (base === name) return url
  }
  return null
}

export const PHOTOS = {
  hero: find('hero'),
  students: find('students'),
  consumers: find('consumers'),
  about: find('about'),
}
