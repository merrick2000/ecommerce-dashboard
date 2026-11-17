import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.API_URL ?? 'http://localhost:8787', changeOrigin: false } },
  },
  // Le chunk d'entrée (~155 Ko gzip) = react-dom + react-router + zod + react-query ; les écrans sont chargés à la demande.
  build: { target: 'es2022', chunkSizeWarningLimit: 560 },
})
