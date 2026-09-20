/**
 * 画面に出す日本語の組み方。動画（make.mjs）と縦型（short.mjs）で同じ規則を使う。
 */
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/* ---------- 日本語の折り返し ----------
 * 画面の字が「までが短い」「均質化／の5つ」のように語の途中で折れていた。
 * 折ってよいのは、助詞や読点のうしろか、文字の種類が変わるところだけ。
 * その切れ目ごとに inline-block で包むと、ブラウザはそこでしか折れなくなる。
 */
export const CLS = (c) => (/[一-鿿々]/.test(c) ? 'k' : /[ぁ-ん]/.test(c) ? 'h' : /[ァ-ヶー]/.test(c) ? 'K' : /[0-9A-Za-z０-９Ａ-Ｚａ-ｚ]/.test(c) ? 'n' : 'o')
export const PARTICLE = 'はがをにのとでもへ' // 「か・ね・よ・や」は言葉の途中にも出るので入れない
export const NO_HEAD = 'ーぁぃぅぇぉっゃゅょァィゥェォッャュョ々、。・？?！!」』）)％%℃' // 行の頭に置かない字
export const NO_TAIL = '（(「『【' // 行の終わりに置かない字（かっこの開き）
/** i の位置で行を折ってよいか */
export function canBreak(s, i) {
  if (i <= 0 || i >= s.length) return false
  const prev = s[i - 1]
  const cur = s[i]
  if (NO_HEAD.includes(cur) || NO_TAIL.includes(prev)) return false
  if (i >= 2 && s[i - 2] === 'ん' && 'でだ'.includes(prev)) return false // 「んで」「んだ」は助詞ではない（〜んです）
  if (PARTICLE.includes(cur)) return false // 行の頭が助詞になるのは避ける
  if ('、・'.includes(prev)) return true
  if (PARTICLE.includes(prev)) return true
  return CLS(prev) !== CLS(cur)
}
/** 折ってよいところだけで折れるように組む（語の途中では折れない） */
export const jp = (text) => {
  const t = String(text ?? '')
  const out = []
  let start = 0
  for (let i = 1; i < t.length; i++) {
    if (canBreak(t, i)) {
      out.push(t.slice(start, i))
      start = i
    }
  }
  out.push(t.slice(start))
  return out
    .filter(Boolean)
    .map((c) => `<span class="w">${esc(c)}</span>`)
    .join('')
}

/** 長い1文を、折ってよいところで2行以内に分ける（字幕用。各行の上限は max 字） */
export function splitLines(text, max = 14) {
  const t = String(text ?? '').trim()
  if (t.length <= max) return [t]
  let best = null
  for (let i = 3; i <= t.length - 3; i++) {
    if (!canBreak(t, i)) continue
    const a = t.slice(0, i), b = t.slice(i)
    if (a.length > max || b.length > max) continue
    const score = -Math.abs(a.length - b.length) + (PARTICLE.includes(t[i - 1]) ? 3 : 0) + ('、。'.includes(t[i - 1]) ? 6 : 0)
    if (!best || score > best.score) best = { score, i }
  }
  if (best) return [t.slice(0, best.i).replace(/[、]$/, ''), t.slice(best.i)]
  return [t.slice(0, max), t.slice(max)] // 折れるところが無いときだけ、字数で切る
}

/** 自動文字起こしの取り違えを、画面に出す前だけ直す */
export const ASR_FIX = [
  [/ポポポ/g, 'Pody'],
  [/楽能|落脳|楽農|楽の|落農/g, '酪農'],
  [/乳腺炎|入房院|乳房園/g, '乳房炎'],
  [/入手防率|乳脂肪立|入試某率/g, '乳脂肪率'],
  [/超高音作品|超高温殺金|超高作金|超高音殺菌/g, '超高温殺菌'],
  [/作金|殺金|作菌/g, '殺菌'],
  [/殺方法/g, '殺菌方法'],
  [/入行メーカー|乳行メーカー|入業メーカー|乳行|入業/g, '乳業メーカー'],
  [/生牛(?=に近い|の)/g, '生乳'],
  [/スーー/g, 'スーパー'],
  [/牛(?=を飲|が入って|の風味|の集乳|は3)/g, '牛乳'],
]
export const fixAsr = (s) => ASR_FIX.reduce((t, [re, to]) => t.replace(re, to), String(s ?? ''))
