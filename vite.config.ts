import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/apex-score-calculator/',
  build: {
    sourcemap: true,
  },
})
