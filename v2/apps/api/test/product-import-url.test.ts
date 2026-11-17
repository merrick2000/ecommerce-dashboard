import { afterEach, describe, expect, mock, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { products, storeInvitations, users } from '../src/db/schema'
import { sha256 } from '../src/lib/crypto'
import { env } from '../src/lib/env'
import { extractProduct, parsePrice } from '../src/services/url-import'
import { Client } from './helpers'

/** Aucun appel réseau réel : fetch est simulé dans chaque test qui en a besoin. */
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
  delete (env as { KIE_API_KEY?: string }).KIE_API_KEY
})

const mockFetch = (handler: (url: string, init?: RequestInit) => Response | Promise<Response>) => {
  globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input instanceof Request ? input.url : input), init)) as unknown as typeof fetch
}

// Adresse IP publique littérale : pas de résolution DNS dans les tests.
const BASE = 'https://93.184.216.34'

const SHOPIFY_HTML = `<!doctype html><html><head><title>Console GameBox</title>
<meta property="og:title" content="Console GameBox | Boutique">
<script src="https://cdn.shopify.com/s/files/app.js"></script></head><body>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></body></html>`

const SHOPIFY_JS = {
  title: 'Console GameBox',
  description: '<p>Console rétro portable.</p><ul><li>10 000 jeux intégrés</li><li>Écran 3,5 pouces</li></ul><script>alert(1)</script>',
  vendor: 'GameBox',
  price: 4490000,
  compare_at_price: 5990000,
  options: [{ name: 'Couleur' }],
  variants: [
    { title: 'Blanc', price: 4490000, available: true, sku: 'GB-W' },
    { title: 'Noir', price: 4690000, available: false, sku: 'GB-B' },
  ],
  images: ['//cdn.shopify.com/s/files/console_600x600.jpg', '//cdn.shopify.com/s/files/console-2.jpg'],
  media: [{ media_type: 'external_video', host: 'youtube', external_id: 'dQw4w9WgXcQ' }],
}

const JSONLD_HTML = `<html><head>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProductGroup',
      name: 'Crème Karité Bio',
      description: 'Crème hydratante au beurre de karité.',
      brand: { '@type': 'Brand', name: 'Karibio' },
      image: ['https://cdn.exemple.com/creme.jpg', { '@type': 'ImageObject', url: 'https://cdn.exemple.com/creme-2.jpg' }],
      variesBy: ['https://schema.org/size'],
      hasVariant: [
        { '@type': 'Product', name: 'Crème Karité Bio - 100 ml', sku: 'K100', offers: { '@type': 'Offer', price: '7 500', priceCurrency: 'XOF', availability: 'https://schema.org/InStock' } },
        { '@type': 'Product', name: 'Crème Karité Bio - 250 ml', sku: 'K250', offers: { '@type': 'Offer', price: '15000', priceCurrency: 'XOF', availability: 'https://schema.org/OutOfStock' } },
      ],
      review: [{ '@type': 'Review', author: { '@type': 'Person', name: 'Aïcha' }, reviewRating: { ratingValue: 5 }, reviewBody: 'Très bonne crème.' }],
    },
    { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Pour quel type de peau ?', acceptedAnswer: { '@type': 'Answer', text: '<p>Tous types.</p>' } }] },
  ],
})}</script></head><body></body></html>`

const OG_HTML = `<html><head><title>Sac en wax</title>
<meta property="og:title" content="Sac en wax fait main">
<meta property="og:description" content="Un sac solide et coloré.">
<meta property="og:image" content="/img/sac.jpg">
<meta property="product:price:amount" content="12 000">
<meta property="product:price:currency" content="XOF">
</head><body><img src="/img/logo.png" width="120" height="40"><img src="/img/sac-dos.jpg" width="800" height="800"></body></html>`

describe('extraction depuis une page', () => {
  test('prix : formats courants', () => {
    expect(parsePrice('29 900')).toBe(29900)
    expect(parsePrice('29.900,50')).toBe(29900.5)
    expect(parsePrice('1,299.99')).toBe(1299.99)
    expect(parsePrice('15000')).toBe(15000)
    expect(parsePrice('7.500')).toBe(7500)
    expect(parsePrice('abc')).toBeNull()
  })

  test('Shopify : API produit .js (prix en centimes, variantes, images en grand, vidéo)', async () => {
    mockFetch((url) => (url.endsWith('/products/console-gamebox.js') ? Response.json(SHOPIFY_JS) : new Response('introuvable', { status: 404 })))
    const r = await extractProduct(SHOPIFY_HTML, `${BASE}/products/console-gamebox`)
    expect(r.detected).toContain('shopify')
    expect(r.draft).toMatchObject({ name: 'Console GameBox', price: 44900, compareAtPrice: 59900, variantLabel: 'Couleur', brand: 'GameBox', video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    expect(r.draft.variants).toEqual([
      { name: 'Blanc', price: 44900, available: true, sku: 'GB-W' },
      { name: 'Noir', price: 46900, available: false, sku: 'GB-B' },
    ])
    expect(r.draft.images[0]).toBe('https://cdn.shopify.com/s/files/console.jpg')
    expect(r.draft.description).not.toContain('<script')
    expect(r.draft.features).toEqual(['10 000 jeux intégrés', 'Écran 3,5 pouces'])
  })

  test('JSON-LD : groupe de variantes, FAQ et avis réels', async () => {
    const r = await extractProduct(JSONLD_HTML, `${BASE}/creme`, { allowShopifyFetch: false })
    expect(r.detected).toContain('jsonld')
    expect(r.draft).toMatchObject({ name: 'Crème Karité Bio', price: 7500, currency: 'XOF', brand: 'Karibio', variantLabel: 'size' })
    expect(r.draft.variants.map((v) => [v.name, v.price, v.available])).toEqual([
      ['100 ml', 7500, true],
      ['250 ml', 15000, false],
    ])
    expect(r.draft.images).toEqual(['https://cdn.exemple.com/creme.jpg', 'https://cdn.exemple.com/creme-2.jpg'])
    expect(r.draft.faqs).toEqual([{ question: 'Pour quel type de peau ?', answer: 'Tous types.' }])
    expect(r.draft.testimonials).toEqual([{ name: 'Aïcha', rating: 5, text: 'Très bonne crème.' }])
  })

  test('OpenGraph seul : nom, prix, images (logos écartés)', async () => {
    const r = await extractProduct(OG_HTML, `${BASE}/sac`, { allowShopifyFetch: false })
    expect(r.detected).toContain('opengraph')
    expect(r.draft).toMatchObject({ name: 'Sac en wax fait main', price: 12000, currency: 'XOF' })
    expect(r.draft.description).toContain('Un sac solide et coloré.')
    expect(r.draft.images).toEqual([`${BASE}/img/sac.jpg`, `${BASE}/img/sac-dos.jpg`])
    expect(r.warnings.some((w) => w.includes('peu structurée'))).toBe(true)
  })
})

// ─── Routes ──────────────────────────────────────────────────────────────────

const owner = new Client()
const closer = new Client()
let storeId = ''

async function login(c: Client, email: string) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  return (await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })).body.id as number
}

const DRAFT = {
  name: 'Sac en wax fait main',
  description: '<p>Un sac solide.</p><img src=x onerror=alert(1)>',
  price: 12000,
  compareAtPrice: 15000,
  variants: [{ name: 'Rouge', price: null, available: true, sku: null }],
  features: ['Fait main', 'Tissu wax'],
  faqs: [{ question: 'Lavable ?', answer: 'Oui, à 30 degrés.' }],
  testimonials: [],
  video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  kicker: 'Mode · Femme',
  tagline: 'Le sac qui va avec tout.',
}

describe('import par URL : routes', () => {
  test('mise en place', async () => {
    await login(owner, 'import-url@test.dev')
    storeId = (await owner.post('/api/stores', { name: 'Import URL', slug: 'import-url', currency: 'XOF' })).body.id
    await login(closer, 'import-url-closer@test.dev')
    const inv = await owner.post(`/api/stores/${storeId}/team/invitations`, { email: 'import-url-closer@test.dev', role: 'closer', productIds: null })
    const token = `jeton-import-${crypto.randomUUID()}`
    await db.update(storeInvitations).set({ tokenHash: sha256(token) }).where(eq(storeInvitations.id, inv.body.invitation.id))
    expect((await closer.post('/api/invitations/accept', { token })).status).toBe(200)
  })

  test('aperçu : adresse privée refusée, page publique analysée', async () => {
    const priv = await owner.post(`/api/stores/${storeId}/products/import/url/preview`, { url: 'http://127.0.0.1:8787/api/health' })
    expect(priv.status).toBe(400)
    mockFetch(() => new Response(OG_HTML, { headers: { 'content-type': 'text/html' } }))
    const r = await owner.post(`/api/stores/${storeId}/products/import/url/preview`, { url: `${BASE}/sac` })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ domain: '93.184.216.34', aiAvailable: false, draft: { name: 'Sac en wax fait main', price: 12000 } })
  })

  test('closer : pas le droit d’importer', async () => {
    expect((await closer.post(`/api/stores/${storeId}/products/import/url/preview`, { url: `${BASE}/sac` })).status).toBe(403)
    expect((await closer.post(`/api/stores/${storeId}/products/import/url/commit`, { draft: DRAFT })).status).toBe(403)
  })

  test('création : produit inactif, HTML nettoyé, image en échec signalée', async () => {
    mockFetch(() => new Response('pas une image', { headers: { 'content-type': 'image/jpeg' } }))
    const r = await owner.post(`/api/stores/${storeId}/products/import/url/commit`, { draft: DRAFT, imageUrls: [`${BASE}/img/sac.jpg`], sourceUrl: `${BASE}/sac` })
    expect(r.status).toBe(201)
    expect(r.body.warnings).toHaveLength(1)
    const [p] = await db.select().from(products).where(eq(products.id, r.body.id))
    expect(p).toMatchObject({ name: 'Sac en wax fait main', isActive: false, price: 12000, compareAtPrice: 15000, variantLabel: 'Option' })
    expect(p!.description).not.toContain('onerror')
    expect(p!.content).toMatchObject({ features: ['Fait main', 'Tissu wax'], kicker: 'Mode · Femme', tagline: 'Le sac qui va avec tout.', video: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    const activity = await owner.get(`/api/stores/${storeId}/activity`)
    expect(activity.body.data.some((a: { message: string }) => a.message === 'Produit importé depuis 93.184.216.34')).toBe(true)
  })

  test('suggestions IA : 404 sans clé', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products/import/url/improve`, { draft: DRAFT })
    expect(r.status).toBe(404)
    expect((await owner.get(`/api/stores/${storeId}/products/import/url/config`)).body).toEqual({ aiAvailable: false })
  })

  test('suggestions IA (kie.ai simulé) : sortie validée, nettoyée, sans tiret long', async () => {
    ;(env as { KIE_API_KEY?: string }).KIE_API_KEY = 'cle-de-test'
    let sent: Record<string, unknown> | null = null
    mockFetch(async (url, init) => {
      expect(url).toBe('https://api.kie.ai/claude/v1/messages')
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer cle-de-test')
      sent = JSON.parse(String(init?.body))
      return Response.json({
        content: [
          {
            type: 'tool_use',
            name: 'suggestions',
            input: { name: 'Sac wax fait main', kicker: 'Mode — Femme', headline: 'Le sac qui fait tourner les têtes', tagline: 'Solide et coloré.', description: '<p>Un sac <strong>solide</strong>.</p><script>x</script>', features: ['Fait main'], faqs: [{ question: 'Lavable ?', answer: 'Oui.' }] },
          },
        ],
        stop_reason: 'tool_use',
      })
    })
    const r = await owner.post(`/api/stores/${storeId}/products/import/url/improve`, { draft: DRAFT, goal: 'cible les femmes' })
    expect(r.status).toBe(200)
    expect(r.body.kicker).toBe('Mode, Femme')
    expect(r.body.description).not.toContain('<script')
    expect(sent!).toMatchObject({ stream: false, tool_choice: { type: 'tool', name: 'suggestions' } })
    // Les données de la page sont isolées et signalées comme non fiables.
    const prompt = (sent!.messages as { content: string }[])[0]!.content
    expect(prompt).toContain('<page>')
    expect(prompt).toContain('DONNÉE')
  })

  test('suggestions IA : erreur kie.ai remontée proprement', async () => {
    ;(env as { KIE_API_KEY?: string }).KIE_API_KEY = 'cle-de-test'
    mockFetch(() => Response.json({ code: 402, msg: 'Crédits insuffisants', data: null }))
    const r = await owner.post(`/api/stores/${storeId}/products/import/url/improve`, { draft: DRAFT })
    expect(r.status).toBe(502)
    expect(r.body.error).toContain('Crédits insuffisants')
  })
})
