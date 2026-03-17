/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        milk: '#ffffff', // 白基調
        coral: {
          light: '#fecdd3', // rose-200
          DEFAULT: '#fb7185', // rose-400
          dark: '#e11d48', // rose-600
        },
        teal: {
          light: '#99f6e4', // teal-200
          DEFAULT: '#2dd4bf', // teal-400
          dark: '#0d9488', // teal-600
        },
        soil: {
          light: '#FCE6C3',
          DEFAULT: '#E5C088',
          dark: '#C89B5B',
        }
      },
      boxShadow: {
        'pop': '4px 4px 0px 0px rgba(0, 0, 0, 1)', // ネオブルータリズム風ハードシャドウ
        'pop-hover': '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        'pop-soft': '0 10px 40px -10px rgba(251, 113, 133, 0.3)', // コーラル系の柔らかい影
      },
      borderRadius: {
        'blob-1': '30% 70% 70% 30% / 30% 30% 70% 70%',
        'blob-2': '60% 40% 30% 70% / 60% 30% 70% 40%',
        'blob-3': '40% 60% 70% 30% / 40% 50% 60% 50%',
      }
    },
  },
  plugins: [],
}
