import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base は公開先のサブパス。個別ページを実体のある HTML として書き出すため、相対パス './' ではなく絶対パスにする。
// 別の場所へ置くときは VITE_BASE で上書きする（例: VITE_BASE=/ で独自ドメインの直下）。
// VITE_INLINE_TRANSCRIPTS=1 のときは全文も1ファイルに束ねる（単一HTMLのテスト版用）。
// 通常のビルドでは全文は別チャンク／別ファイルで、開いたときだけ読み込む。
export default defineConfig({
  base: process.env.VITE_BASE || '/izumo-agri-portal/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: { inlineDynamicImports: process.env.VITE_INLINE_TRANSCRIPTS === '1' },
    },
  },
})
