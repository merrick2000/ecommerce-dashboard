// @ts-check
import cloudflare from '@astrojs/cloudflare'
import preact from '@astrojs/preact'
import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'server',
  // Pas d'astro:assets ni de sessions : aucune liaison KV / Images à provisionner.
  adapter: cloudflare({ imageService: 'passthrough' }),
  session: false,
  integrations: [preact()],
  // Le CSS (≈ 10 Ko) est inliné : zéro requête bloquante avant le premier rendu en 3G.
  build: { inlineStylesheets: 'always' },
  prefetch: false,
  devToolbar: { enabled: false },
  // Dev : les domaines boutiques (sous-domaines, domaines perso) arrivent avec leur propre Host.
  server: { port: 4321, host: true, allowedHosts: true },
  // Dev : évite la ré-optimisation en cours de requête (deux copies de Preact → « reading '__H' »).
  vite: { optimizeDeps: { include: ['preact', 'preact/hooks', 'preact/devtools', 'preact/jsx-runtime'] } },
})
