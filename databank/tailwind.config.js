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
        ink: { 900: '#172a19', 700: '#3c4435', 500: '#5f665a' },
        line: { DEFAULT: '#03853a', dark: '#027a35' },
      },
      borderRadius: { md: '8px', lg: '8px', xl: '8px', '2xl': '16px', '3xl': '16px' },
      boxShadow: {
        card: '0 1px 2px rgba(31,36,25,0.06), 0 8px 24px -12px rgba(31,36,25,0.18)',
      },
    },
  },
  plugins: [],
}
