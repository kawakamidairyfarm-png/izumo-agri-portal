// 川上牧場の世界観（放牧地・ホルスタイン・牛乳）を描くインラインSVG群。
// 外部画像に依存せず、サイトの配色トークンと同じ色だけで構成する。

const INK = '#1f2419'
const CREAM = '#fdfbf6'
const MOSS_100 = '#d7e5d7'
const MOSS_300 = '#8fb18f'
const MOSS_500 = '#4f7d52'
const MOSS_700 = '#2f5232'
const HAY_300 = '#f2cf7a'
const HAY_500 = '#d9a437'

/** ロゴ用のホルスタインの顔。 */
export function CowMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill={MOSS_700} />
      {/* 耳 */}
      <ellipse cx="14" cy="26" rx="8" ry="5" fill={CREAM} transform="rotate(-20 14 26)" />
      <ellipse cx="50" cy="26" rx="8" ry="5" fill={CREAM} transform="rotate(20 50 26)" />
      {/* 顔 */}
      <path d="M17 22 Q32 12 47 22 Q52 34 47 44 Q42 54 32 54 Q22 54 17 44 Q12 34 17 22 Z" fill={CREAM} />
      {/* ぶち */}
      <path d="M20 22 Q28 18 30 26 Q28 32 22 30 Q17 27 20 22 Z" fill={INK} />
      <path d="M44 40 Q48 34 45 29 Q39 30 39 36 Q40 41 44 40 Z" fill={INK} />
      {/* 目 */}
      <circle cx="26" cy="34" r="2.4" fill={INK} />
      <circle cx="38" cy="34" r="2.4" fill={INK} />
      {/* 鼻 */}
      <ellipse cx="32" cy="46" rx="9" ry="6" fill={HAY_300} />
      <circle cx="29" cy="46" r="1.5" fill={INK} />
      <circle cx="35" cy="46" r="1.5" fill={INK} />
    </svg>
  )
}

/** 横向きのホルスタイン（草を食む姿）。scale と反転で使い回す。 */
function Cow({ x, y, s = 1, flip = false, grazing = true }: { x: number; y: number; s?: number; flip?: boolean; grazing?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* 尻尾 */}
      <path d="M62 8 Q70 14 67 30" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 脚 */}
      <rect x="10" y="24" width="5" height="16" rx="2.4" fill={CREAM} stroke={INK} strokeWidth="1.6" />
      <rect x="22" y="26" width="5" height="15" rx="2.4" fill={CREAM} stroke={INK} strokeWidth="1.6" />
      <rect x="44" y="26" width="5" height="15" rx="2.4" fill={CREAM} stroke={INK} strokeWidth="1.6" />
      <rect x="55" y="24" width="5" height="16" rx="2.4" fill={CREAM} stroke={INK} strokeWidth="1.6" />
      {/* 胴体 */}
      <path d="M8 12 Q6 0 20 1 L52 1 Q66 0 64 13 Q65 26 52 27 L20 27 Q7 28 8 12 Z" fill={CREAM} stroke={INK} strokeWidth="2" />
      {/* ぶち */}
      <path d="M24 4 Q35 1 38 9 Q37 17 28 16 Q20 14 24 4 Z" fill={INK} />
      <path d="M48 14 Q56 12 57 19 Q55 25 48 24 Q43 21 48 14 Z" fill={INK} />
      {/* 乳房 */}
      <ellipse cx="40" cy="27" rx="6" ry="3.4" fill={HAY_300} stroke={INK} strokeWidth="1.2" />
      {/* 首と頭（grazing なら下向き） */}
      {grazing ? (
        <g>
          <path d="M8 12 Q0 16 -2 28 L10 26 Q12 18 12 14 Z" fill={CREAM} stroke={INK} strokeWidth="2" />
          <g transform="translate(-8 24) rotate(18)">
            <ellipse cx="6" cy="6" rx="9" ry="6.4" fill={CREAM} stroke={INK} strokeWidth="2" />
            <ellipse cx="0" cy="7.5" rx="4.6" ry="3.6" fill={HAY_300} stroke={INK} strokeWidth="1.2" />
            <circle cx="9" cy="4" r="1.4" fill={INK} />
            <ellipse cx="13" cy="0" rx="3.6" ry="2" fill={CREAM} stroke={INK} strokeWidth="1.4" transform="rotate(30 13 0)" />
          </g>
        </g>
      ) : (
        <g>
          <path d="M10 12 Q4 6 4 -2 L16 0 Q15 8 14 12 Z" fill={CREAM} stroke={INK} strokeWidth="2" />
          <g transform="translate(-2 -12)">
            <ellipse cx="8" cy="6" rx="9" ry="6.4" fill={CREAM} stroke={INK} strokeWidth="2" />
            <ellipse cx="1.5" cy="7.5" rx="4.6" ry="3.6" fill={HAY_300} stroke={INK} strokeWidth="1.2" />
            <circle cx="11" cy="4" r="1.4" fill={INK} />
            <ellipse cx="15" cy="0" rx="3.6" ry="2" fill={CREAM} stroke={INK} strokeWidth="1.4" transform="rotate(20 15 0)" />
          </g>
        </g>
      )}
    </g>
  )
}

/** ヒーロー背景：出雲の放牧地。丘・柵・牛舎・放牧中の牛。 */
export function PastureScene({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 260"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      role="img"
    >
      {/* 太陽 */}
      <circle cx="1020" cy="52" r="34" fill={HAY_300} />
      <circle cx="1020" cy="52" r="46" fill={HAY_300} opacity="0.25" />
      {/* 遠景の丘 */}
      <path d="M0 150 Q220 92 470 138 Q700 178 940 122 Q1080 92 1200 128 L1200 260 L0 260 Z" fill={MOSS_100} />
      {/* 牛舎 */}
      <g transform="translate(120 96)">
        <rect x="0" y="26" width="96" height="46" fill={CREAM} stroke={INK} strokeWidth="2.5" />
        <path d="M-8 28 L48 -4 L104 28 Z" fill={MOSS_700} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="38" y="44" width="22" height="28" fill={MOSS_500} stroke={INK} strokeWidth="2" />
        <circle cx="48" cy="20" r="7" fill={HAY_300} stroke={INK} strokeWidth="2" />
      </g>
      {/* 中景の丘 */}
      <path d="M0 190 Q260 140 560 176 Q860 210 1200 168 L1200 260 L0 260 Z" fill={MOSS_300} />
      {/* 柵 */}
      <g stroke={MOSS_700} strokeWidth="4" strokeLinecap="round">
        <line x1="640" y1="160" x2="640" y2="188" />
        <line x1="700" y1="156" x2="700" y2="184" />
        <line x1="760" y1="154" x2="760" y2="182" />
        <line x1="632" y1="168" x2="768" y2="162" />
        <line x1="632" y1="180" x2="768" y2="174" />
      </g>
      {/* 木 */}
      <g transform="translate(920 108)">
        <rect x="16" y="34" width="8" height="26" rx="3" fill={MOSS_700} />
        <circle cx="20" cy="22" r="24" fill={MOSS_500} />
        <circle cx="4" cy="32" r="14" fill={MOSS_500} />
        <circle cx="38" cy="32" r="14" fill={MOSS_500} />
      </g>
      {/* 前景の草地 */}
      <path d="M0 232 Q300 200 640 224 Q940 244 1200 218 L1200 260 L0 260 Z" fill={MOSS_500} />
      {/* 牛たち */}
      <Cow x={330} y={168} s={1.15} />
      <Cow x={560} y={186} s={0.9} flip grazing={false} />
      <Cow x={820} y={196} s={1.0} />
      {/* 草のアクセント */}
      <g stroke={MOSS_700} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M80 236 q2 -12 0 -16 M88 236 q4 -10 10 -14 M96 238 q-2 -10 -8 -14" />
        <path d="M1080 232 q2 -12 0 -16 M1088 232 q4 -10 10 -14" />
        <path d="M480 246 q2 -10 0 -14 M488 246 q4 -8 9 -12" />
      </g>
    </svg>
  )
}

/** 入口カード用：学ぶ人（帽子をかぶった子牛とノート）。 */
export function StudentCowArt({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r="46" fill={MOSS_500} opacity="0.35" />
      <ellipse cx="30" cy="40" rx="9" ry="5.5" fill={CREAM} transform="rotate(-18 30 40)" />
      <ellipse cx="66" cy="40" rx="9" ry="5.5" fill={CREAM} transform="rotate(18 66 40)" />
      <path d="M32 34 Q48 24 64 34 Q70 48 64 60 Q58 71 48 71 Q38 71 32 60 Q26 48 32 34 Z" fill={CREAM} />
      <path d="M36 34 Q44 30 46 38 Q44 44 38 42 Q33 39 36 34 Z" fill={INK} />
      <circle cx="41" cy="48" r="2.6" fill={INK} />
      <circle cx="55" cy="48" r="2.6" fill={INK} />
      <ellipse cx="48" cy="61" rx="10" ry="6.5" fill={HAY_300} />
      <circle cx="44.5" cy="61" r="1.6" fill={INK} />
      <circle cx="51.5" cy="61" r="1.6" fill={INK} />
      {/* 学帽 */}
      <g transform="translate(48 26)">
        <path d="M-22 0 L0 -10 L22 0 L0 10 Z" fill={INK} />
        <path d="M-11 4 L-11 12 Q0 18 11 12 L11 4" fill={INK} opacity="0.85" />
        <line x1="20" y1="1" x2="20" y2="14" stroke={HAY_500} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="20" cy="16" r="2.6" fill={HAY_500} />
      </g>
    </svg>
  )
}

/** 入口カード用：飲む人（牛乳のグラスと瓶）。 */
export function MilkArt({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r="46" fill={HAY_300} opacity="0.45" />
      {/* 瓶 */}
      <g transform="translate(30 18)">
        <path d="M6 10 Q6 4 10 4 L16 4 Q20 4 20 10 L20 14 Q26 20 26 30 L26 58 Q26 64 20 64 L6 64 Q0 64 0 58 L0 30 Q0 20 6 14 Z" fill={CREAM} stroke={INK} strokeWidth="2.5" />
        <path d="M2 34 L24 34 L24 58 Q24 62 20 62 L6 62 Q2 62 2 58 Z" fill="#f6f2e8" stroke={INK} strokeWidth="0" />
        <rect x="5" y="0" width="16" height="6" rx="2" fill={HAY_500} stroke={INK} strokeWidth="2" />
        <circle cx="13" cy="44" r="7" fill={MOSS_100} />
        <path d="M9 44 Q13 39 17 44 Q13 49 9 44" fill={MOSS_700} />
      </g>
      {/* グラス */}
      <g transform="translate(58 36)">
        <path d="M0 0 L20 0 L17 42 Q17 46 13 46 L7 46 Q3 46 3 42 Z" fill={CREAM} stroke={INK} strokeWidth="2.5" />
        <path d="M2 14 L18 14 L16.4 42 Q16.3 44 13.5 44 L6.5 44 Q3.7 44 3.6 42 Z" fill="#f6f2e8" />
        <ellipse cx="10" cy="14" rx="8" ry="2.4" fill={CREAM} stroke={INK} strokeWidth="1.4" />
      </g>
    </svg>
  )
}

/** フッター上の草の帯。小さな牛がひとり。 */
export function GrassStrip() {
  return (
    <svg viewBox="0 0 1200 48" preserveAspectRatio="xMidYMax slice" className="w-full h-10 block" aria-hidden="true">
      <path d="M0 34 Q300 18 620 30 Q920 40 1200 26 L1200 48 L0 48 Z" fill={MOSS_500} />
      <g stroke={MOSS_700} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M140 34 q2 -10 0 -14 M148 34 q4 -8 9 -11" />
        <path d="M760 32 q2 -10 0 -14 M768 32 q4 -8 9 -11" />
        <path d="M1040 30 q2 -9 0 -13" />
      </g>
      <Cow x={430} y={6} s={0.62} flip grazing />
    </svg>
  )
}
