import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages has no SPA routing: refreshing /albums would hit its 404 page.
 * Serving the app as 404.html too lets React Router take over any deep link.
 */
const spaFallback = (): Plugin => ({
  name: 'spa-404-fallback',
  apply: 'build',
  closeBundle() {
    const dist = resolve(import.meta.dirname, 'dist')
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
  },
})

export default defineConfig({
  // GitHub Pages serves project sites from /<repo-name>/ — the deploy workflow passes it in.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), spaFallback()],
  build: {
    chunkSizeWarningLimit: 700,
  },
})
