import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/workshop/marshmallow/',
  build: {
    outDir: '../dist/workshop/marshmallow',
    emptyOutDir: true
  }
})
