// @ts-check
import cloudflare from '@astrojs/cloudflare'
import preact from '@astrojs/preact'
import { defineConfig } from 'astro/config'
import { execFileSync } from 'node:child_process'

/**
 * Vraie date de dernière modification de chaque type de contenu (historique git), pour le plan du site :
 * jamais la date de la mise en ligne. Sans git (rare), une date fixe sûre.
 */
const lastChange = (...paths) => {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths], { encoding: 'utf8' }).trim() || null
  } catch {
    return null
  }
}
const C = 'src/content/seo/'
const CONTENT_DATES = {
  static: lastChange('src/pages/index.astro', 'src/pages/en/index.astro', 'src/components/marketing', 'src/pages/tarifs.astro', 'src/pages/a-propos.astro', 'src/pages/contact.astro', 'src/pages/fonctionnalites.astro'),
  help: lastChange(C + 'help.ts'),
  changelog: lastChange(C + 'changelog.ts'),
  guides: lastChange(C + 'guides.ts', C + 'guide-bonus.ts'),
  tools: lastChange(C + 'tools.ts'),
  countries: lastChange(C + 'countries.ts'),
  cities: lastChange(C + 'cities.ts'),
  niches: lastChange(C + 'niches.ts', C + 'combos.ts'),
  best: lastChange(C + 'best.ts'),
  alternatives: lastChange(C + 'alternatives.ts'),
  comparisons: lastChange(C + 'comparisons.ts'),
}

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
  vite: { define: { __CONTENT_DATES__: JSON.stringify(CONTENT_DATES) }, optimizeDeps: { include: ['preact', 'preact/hooks', 'preact/devtools', 'preact/jsx-runtime'] } },
})
