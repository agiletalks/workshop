import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hangout/split/',
  build: {
    outDir: '../dist/hangout/split',
    emptyOutDir: true,
  }
})
