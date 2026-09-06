import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build works from any sub-path (GitHub Pages, Cloudflare, etc.)
// VITE_INLINE_TRANSCRIPTS=1 のときは全文も1ファイルに束ねる（単一HTMLのテスト版用）。
// 通常のビルドでは全文は別チャンク／別ファイルで、開いたときだけ読み込む。
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: { inlineDynamicImports: process.env.VITE_INLINE_TRANSCRIPTS === '1' },
    },
  },
})
