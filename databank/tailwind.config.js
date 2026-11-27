/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'Georgia', 'serif'],
      },
      colors: {
        cream: { 50: '#fdfbf6', 100: '#f8f3e8', 200: '#efe6d2' },
        moss: { 50: '#eef4ee', 100: '#eef4ee', 300: '#8fb18f', 500: '#4f7d52', 600: '#2f5232', 700: '#2f5232', 800: '#172a19', 900: '#172a19' },
        hay: { 100: '#fbeecd', 300: '#f2cf7a', 500: '#d9a437', 700: '#7f5a12' },
        // 補足の文字（ink-500）は小さい字で使うことが多いので、地の色に対して約7:1まで濃くした（2026-11-27。前は #5f665a・約5.7:1）
        ink: { 900: '#172a19', 700: '#3c4435', 500: '#545b4f' },
        line: { DEFAULT: '#03853a', dark: '#027a35' },
      },
      // 文字の大きさ（2026-11-27 本人「文字や項目が多く見難い」）。読ませる文の大半が text-sm（14px）、補足が text-xs（12px）で小さかったので、
      // 小さい側だけ1段ずつ上げ、日本語の行間を広めにした。見出し（lg 以上）は変えない
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.6' }], // 13px（前は 12px）
        sm: ['0.9375rem', { lineHeight: '1.75' }], // 15px（前は 14px）
        base: ['1rem', { lineHeight: '1.8' }], // 16px
      },
      lineHeight: { relaxed: '1.8' }, // 本文の段落（前は 1.625）
      borderRadius: { md: '8px', lg: '8px', xl: '8px', '2xl': '16px', '3xl': '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(31,36,25,0.06), 0 8px 24px -12px rgba(31,36,25,0.18)',
      },
    },
  },
  plugins: [],
}
