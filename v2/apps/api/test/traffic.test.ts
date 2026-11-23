import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { pageEvents, users } from '../src/db/schema'
import { Client } from './helpers'

/** Trafic : visiteurs uniques, provenance par canal, campagnes, robots ignorés, conversion. */
const owner = new Client()
const browser = new Client()
browser.headers['user-agent'] = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'
const bot = new Client()
bot.headers['user-agent'] = 'facebookexternalhit/1.1'
let storeId = ''
let productId = ''

const view = (c: Client, sessionId: string, extra: Record<string, unknown> = {}) => c.post('/api/v1/track', { storeId, productId, eventType: 'page_view', sessionId, ...extra })

describe('trafic', () => {
  test('mise en place et collecte', async () => {
    await db.insert(users).values({ email: 'traffic-owner@test.dev', name: 'T', features: { onlinePayments: true }, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'traffic-owner@test.dev', password: 'motdepasse-solide' })
    storeId = (await owner.post('/api/stores', { name: 'Trafic', slug: 'trafic-shop', currency: 'XOF', kind: 'digital' })).body.id
    await owner.put(`/api/stores/${storeId}/payment-accounts/feexpay`, { enabled: true, mode: 'sandbox', sandbox: { apiKey: 'k', shopId: 's' } })
    productId = (await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Guide', isActive: true, price: 5000, delivery: { type: 'external_url', url: 'https://x.test/g' } })).body.id

    // Visiteur A : pub Facebook, 2 onglets (2 visites, 1 visiteur), commence le formulaire.
    await view(browser, 'sessA1-000', { visitorId: 'visitorA-00', utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'lancement' })
    await view(browser, 'sessA2-000', { visitorId: 'visitorA-00', utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'lancement' })
    await browser.post('/api/v1/track', { storeId, productId, eventType: 'checkout_initiate', sessionId: 'sessA1-000', visitorId: 'visitorA-00' })
    // Visiteur B : arrive depuis TikTok sans UTM (référent seul).
    await view(browser, 'sessB1-000', { visitorId: 'visitorB-00', referrer: 'https://www.tiktok.com/@boutique' })
    // Visiteur C : direct.
    await view(browser, 'sessC1-000', { visitorId: 'visitorC-00' })
    // Robot d'aperçu de lien : ignoré.
    const r = await view(bot, 'sessBot-000', { visitorId: 'bot-000000' })
    expect(r.status).toBe(204)
    const rows = await db.select().from(pageEvents).where(eq(pageEvents.storeId, storeId))
    expect(rows.some((e) => e.sessionId === 'sessBot-000')).toBe(false)

    // Commande issue de la pub Facebook.
    const o = await browser.post('/api/v1/orders', { storeSlug: 'trafic-shop', productId, customerName: 'Awa', customerPhone: '+22961000000', customerEmail: 'awa@test.dev', utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'lancement', sessionId: 'sessA1-000' })
    expect(o.status).toBe(201)
  })

  test('statistiques de trafic', async () => {
    const t = (await owner.get(`/api/stores/${storeId}/stats/traffic`)).body
    expect(t.current).toMatchObject({ visitors: 3, sessions: 4, views: 4, orders: 1, conversion: 33.3 })
    expect(t.live).toBe(3)
    const fb = t.channels.find((c: any) => c.channel === 'facebook')
    expect(fb).toMatchObject({ visitors: 1, sessions: 2, paidVisitors: 1, orders: 1, conversion: 100 })
    expect(t.channels.find((c: any) => c.channel === 'tiktok').visitors).toBe(1)
    expect(t.channels.find((c: any) => c.channel === 'direct').visitors).toBe(1)
    expect(t.campaigns[0]).toMatchObject({ source: 'facebook', campaign: 'lancement', visitors: 1, orders: 1 })
    expect(t.referrers[0]).toMatchObject({ host: 'tiktok.com', channel: 'tiktok', visitors: 1 })
    expect(t.devices[0]).toMatchObject({ device: 'mobile', visitors: 3 })
    expect(t.funnel).toMatchObject({ visits: 4, started: 1, ordered: 1 })
    expect(t.products[0]).toMatchObject({ id: productId, visitors: 3, orders: 1 })
    expect(t.hours).toHaveLength(24)
    expect(t.daily.at(-1).visitors).toBe(3)
  })

  test('filtre par produit inconnu : rien', async () => {
    const t = (await owner.get(`/api/stores/${storeId}/stats/traffic?productId=prd_inconnu`)).body
    expect(t.current.visitors).toBe(0)
    expect(t.current.orders).toBe(0)
  })
})

describe('attribution premier / dernier clic', () => {
  test('découvre par TikTok, revient par une pub Facebook, puis en direct : premier clic TikTok, dernier clic Facebook', async () => {
    const ago = (h: number) => new Date(Date.now() - h * 3600_000)
    await db.insert(pageEvents).values([
      { storeId, productId, eventType: 'page_view', sessionId: 'sessD1-000', visitorId: 'visitorD-00', referrer: 'https://www.tiktok.com/', deviceType: 'mobile', createdAt: ago(5) },
      { storeId, productId, eventType: 'page_view', sessionId: 'sessD2-000', visitorId: 'visitorD-00', utmSource: 'facebook', utmMedium: 'paid', utmCampaign: 'relance', deviceType: 'mobile', createdAt: ago(3) },
      { storeId, productId, eventType: 'page_view', sessionId: 'sessD3-000', visitorId: 'visitorD-00', deviceType: 'mobile', createdAt: ago(1) },
    ])
    // La commande ne porte que la visite directe : seul le parcours retrouve TikTok et Facebook.
    const o = await browser.post('/api/v1/orders', { storeSlug: 'trafic-shop', productId, customerName: 'Koffi', customerPhone: '+22962000000', customerEmail: 'koffi@test.dev', sessionId: 'sessD3-000', visitorId: 'visitorD-00' })
    expect(o.status).toBe(201)
    const t = (await owner.get(`/api/stores/${storeId}/stats/traffic`)).body
    const ch = (k: string) => t.channels.find((c: any) => c.channel === k)
    expect(ch('tiktok').first.orders).toBe(1)
    expect(ch('tiktok').orders).toBe(0)
    expect(ch('facebook').orders).toBe(2)
    expect(ch('facebook').first.orders).toBe(1)
    expect(ch('direct').orders).toBe(0)
    const relance = t.campaigns.find((c: any) => c.campaign === 'relance')
    expect(relance).toMatchObject({ orders: 1, first: { orders: 0 } })
    expect(t.attribution).toMatchObject({ orders: 2, tracked: 2, multiVisit: 2, switched: 1 })
    expect(t.attribution.avgHours).toBeGreaterThan(2)
  })
})

describe('MCP, trafic', () => {
  test('get_traffic_stats', async () => {
    const key = (await owner.post('/api/api-keys', { name: 'IA trafic', storeId })).body.key as string
    const { app } = await import('../src/app')
    const res = await app.request('/api/mcp', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'cf-connecting-ip': '10.9.9.7' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_traffic_stats', arguments: { period: 'today' } } }) })
    const b = (await res.json()) as any
    expect(b.result.isError).toBeFalsy()
    expect(b.result.structuredContent.current.visitors).toBe(4)
    expect(b.result.structuredContent.channels.map((c: any) => c.channel)).toContain('facebook')
  })
})
