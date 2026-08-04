import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// IMPORTANT: base must match your GitHub repo name for GitHub Pages to work,
// e.g. if your repo is https://github.com/you/tally-app then base should be '/tally-app/'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/khata-app/',
})
