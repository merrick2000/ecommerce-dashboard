import { afterEach, describe, expect, test } from 'bun:test'
import { env } from '../src/lib/env'
import { looksBlocked, resetFirecrawlKeyCache } from '../src/services/page-fetch'
import { previewFromText, previewFromUrl } from '../src/services/url-import'

/** Import par lien : page bloquée → Firecrawl → IA ; texte collé → IA. Réseau simulé. */
const realFetch = globalThis.fetch
const PAGE = 'https://example.com/produit/creme-karite'
afterEach(() => {
  resetFirecrawlKeyCache()
  globalThis.fetch = realFetch
  env.FIRECRAWL_API_KEY = undefined
  env.KIE_API_KEY = undefined
})

const BLOCKED = '<html><head><title>Just a moment...</title></head><body>cf-challenge</body></html>'
const LD_PAGE = `<html><head><title>Crème</title><script type="application/ld+json">${JSON.stringify({ '@type': 'Product', name: 'Crème karité bio', image: ['https://cdn.example.com/creme.jpg'], offers: { '@type': 'Offer', price: '4500', priceCurrency: 'XOF' } })}</script></head><body>${'x'.repeat(5000)}</body></html>`

function mockNet(routes: { firecrawl?: unknown; kie?: unknown; direct?: { status: number; html: string } }) {
  const calls: string[] = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = String(input instanceof Request ? input.url : input)
    calls.push(u)
    if (u.startsWith('https://api.firecrawl.dev')) return Response.json(routes.firecrawl)
    if (u.startsWith('https://api.kie.ai')) return Response.json(routes.kie)
    const d = routes.direct ?? { status: 403, html: BLOCKED }
    return new Response(d.html, { status: d.status, headers: { 'content-type': 'text/html' } })
  }) as typeof fetch
  return calls
}

const kieAnswer = (input: Record<string, unknown>) => ({ content: [{ type: 'tool_use', name: 'product', input }] })

describe('import : détection de page bloquée', () => {
  test('défi Cloudflare, 403 et 202 : bloqué ; vraie page avec recaptcha : non', () => {
    expect(looksBlocked({ status: 200, html: BLOCKED })).toBe(true)
    expect(looksBlocked({ status: 403, html: LD_PAGE })).toBe(true)
    expect(looksBlocked({ status: 202, html: '' })).toBe(true)
    expect(looksBlocked({ status: 200, html: LD_PAGE + '<script src="https://www.google.com/recaptcha/api.js"></script>' })).toBe(false)
  })
})

describe('import : étages de secours', () => {
  test('page bloquée → Firecrawl lit la page et les données structurées suffisent', async () => {
    env.FIRECRAWL_API_KEY = 'fc-test'
    const calls = mockNet({ firecrawl: { success: true, data: { rawHtml: LD_PAGE, markdown: '# Crème', metadata: { statusCode: 200, url: PAGE } } } })
    const p = await previewFromUrl(PAGE, 'XOF')
    expect(p.fetchedVia).toBe('firecrawl')
    expect(p.draft.name).toBe('Crème karité bio')
    expect(p.draft.price).toBe(4500)
    expect(p.draft.images).toEqual(['https://cdn.example.com/creme.jpg'])
    expect(calls.some((u) => u.includes('api.kie.ai'))).toBe(false)
  })

  test('page sans données structurées → l’IA complète, images inventées écartées', async () => {
    env.FIRECRAWL_API_KEY = 'fc-test'
    env.KIE_API_KEY = 'kie-test'
    const markdown = `# Sac en cuir Dakar\n\nPrix : 25 000 FCFA\n\n![sac](https://img.example.com/sac-1.jpg)\n\nCuir véritable, fait main.`
    mockNet({
      firecrawl: { success: true, data: { rawHtml: `<html><head><title>Sac</title></head><body>${'y'.repeat(5000)}</body></html>`, markdown, metadata: { statusCode: 200, url: PAGE } } },
      kie: kieAnswer({ found: true, name: 'Sac en cuir Dakar', price: 25000, currency: 'XOF', description: '<p>Cuir véritable — fait main.</p>', features: ['Cuir véritable'], imageUrls: ['https://img.example.com/sac-1.jpg', 'https://invente.example.com/faux.jpg'] }),
    })
    const p = await previewFromUrl(PAGE, 'XOF')
    expect(p.detected).toContain('ai')
    expect(p.draft.name).toBe('Sac en cuir Dakar')
    expect(p.draft.price).toBe(25000)
    expect(p.draft.images).toEqual(['https://img.example.com/sac-1.jpg'])
    expect(p.draft.description).not.toContain('—')
  })

  test('tout est bloqué → message clair qui propose de coller le texte', async () => {
    mockNet({})
    await expect(previewFromUrl(PAGE, 'XOF')).rejects.toThrow(/Coller le contenu de la page/)
  })

  test('texte collé → fiche par IA', async () => {
    env.KIE_API_KEY = 'kie-test'
    mockNet({ kie: kieAnswer({ found: true, name: 'Montre homme', price: 15000, currency: 'XOF', description: '<p>Acier.</p>', features: [], imageUrls: [] }) })
    const p = await previewFromText('Montre homme acier inoxydable, prix 15 000 FCFA, livraison Abidjan. Bracelet réglable, étanche.', 'XOF')
    expect(p.fetchedVia).toBe('text')
    expect(p.draft.name).toBe('Montre homme')
    expect(p.warnings).toContain('Aucune image détectée.')
  })
})

describe('import : fiche produit Firecrawl', () => {
  test('format product (type AliExpress) : nom nettoyé, prix le plus bas, photos, EUR converti en FCFA', async () => {
    env.FIRECRAWL_API_KEY = 'fc-test'
    mockNet({
      firecrawl: {
        success: true,
        data: {
          rawHtml: `<html><head><title>Montre</title></head><body>${'z'.repeat(5000)}</body></html>`,
          markdown: '# Montre',
          metadata: { statusCode: 200, url: PAGE },
          product: {
            title: 'Montre homme acier - AliExpress 1511',
            brand: 'GAIETY',
            description: 'Montre en acier inoxydable.\nMouvement quartz.',
            variants: [
              { title: 'Noir', price: { amount: 4.5, currency: 'EUR' }, images: [{ url: 'https://ae.example.com/noir.jpg' }] },
              { title: 'Or', price: { amount: 3.79, currency: 'EUR' }, sale: { originalPrice: { amount: 9.99 } }, images: [{ url: 'https://ae.example.com/or.jpg' }] },
            ],
          },
        },
      },
    })
    const p = await previewFromUrl(PAGE, 'XOF')
    expect(p.detected[0]).toBe('browser')
    expect(p.draft.name).toBe('Montre homme acier')
    expect(p.draft.price).toBe(3.79)
    expect(p.draft.compareAtPrice).toBe(9.99)
    expect(p.draft.currency).toBe('EUR')
    expect(p.draft.variants.map((v) => v.name)).toEqual(['Noir', 'Or'])
    expect(p.draft.images).toEqual(['https://ae.example.com/noir.jpg', 'https://ae.example.com/or.jpg'])
    expect(p.draft.description).toContain('<p>Mouvement quartz.</p>')
    expect(p.warnings.join(' ')).toMatch(/3,79\s€ = 2\s485 FCFA/)
  })

  test('noms de places de marché nettoyés', async () => {
    const { cleanMarketplaceName } = await import('../src/services/url-import')
    expect(cleanMarketplaceName('Sac cuir : Amazon.fr : Mode')).toBe('Sac cuir')
    expect(cleanMarketplaceName('Amazon.fr : Perruque lisse')).toBe('Perruque lisse')
    expect(cleanMarketplaceName('Montre - AliExpress')).toBe('Montre')
  })
})
