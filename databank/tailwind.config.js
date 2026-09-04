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
        moss: { 50: '#eef4ee', 100: '#d7e5d7', 300: '#8fb18f', 500: '#4f7d52', 600: '#3f6842', 700: '#2f5232', 800: '#233d25', 900: '#172a19' },
        hay: { 100: '#fbeecd', 300: '#f2cf7a', 500: '#d9a437', 700: '#9a6f17' },
        ink: { 900: '#1f2419', 700: '#3c4435', 500: '#6b7263' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,36,25,0.06), 0 8px 24px -12px rgba(31,36,25,0.18)',
      },
    },
  },
  plugins: [],
}
