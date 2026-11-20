import { describe, expect, test } from 'bun:test'
import { app } from '../src/app'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { periodRange } from '../src/services/mcp/tools'
import { Client } from './helpers'

const owner = new Client()
const other = new Client()
let storeId = ''
let store2Id = ''
let otherStoreId = ''
let writeKey = ''
let readKey = ''
let scopedKey = ''
let productId = ''

async function login(client: Client, email: string, isPlatformAdmin = false) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, isPlatformAdmin, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  expect((await client.post('/api/auth/login', { email, password: 'motdepasse-solide' })).status).toBe(200)
}

let rpcId = 0
async function rpc(key: string, method: string, params?: unknown) {
  const res = await app.request('/api/mcp', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'cf-connecting-ip': '10.9.9.9' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }) })
  return { status: res.status, body: (await res.json().catch(() => null)) as any }
}
async function tool(key: string, name: string, args: Record<string, unknown> = {}) {
  const r = await rpc(key, 'tools/call', { name, arguments: args })
  expect(r.status).toBe(200)
  const result = r.body.result
  return { isError: Boolean(result.isError), text: result.content[0].text as string, data: result.structuredContent as any }
}

describe('MCP', () => {
  test('mise en place : boutiques et clés', async () => {
    await login(owner, 'mcp-owner@test.dev')
    await login(other, 'mcp-other@test.dev', true)
    storeId = (await owner.post('/api/stores', { name: 'MCP Shop', slug: 'mcp-shop', currency: 'XOF', country: 'CI' })).body.id
    store2Id = (await owner.post('/api/stores', { name: 'MCP Shop 2', slug: 'mcp-shop-2', currency: 'XOF' })).body.id
    otherStoreId = (await other.post('/api/stores', { name: 'Autre', slug: 'mcp-autre', currency: 'XOF' })).body.id
    const w = await owner.post('/api/api-keys', { name: 'Claude' })
    expect(w.status).toBe(201)
    expect(w.body.key).toStartWith('zk_live_')
    writeKey = w.body.key
    readKey = (await owner.post('/api/api-keys', { name: 'Lecture', scope: 'read' })).body.key
    scopedKey = (await owner.post('/api/api-keys', { name: 'Boutique 2', storeId: store2Id })).body.key
    const list = await owner.get('/api/api-keys')
    expect(list.body.length).toBe(3)
    expect(JSON.stringify(list.body)).not.toContain(writeKey)
  })

  test('sans clé : 401 ; clé inconnue : 401', async () => {
    const r = await app.request('/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    expect(r.status).toBe(401)
    expect((await rpc('zk_live_faux', 'ping')).status).toBe(401)
  })

  test('initialize et tools/list', async () => {
    const init = await rpc(writeKey, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } })
    expect(init.body.result.serverInfo.name).toBe('zuri')
    expect(init.body.result.protocolVersion).toBe('2025-06-18')
    const tools = (await rpc(writeKey, 'tools/list')).body.result.tools as { name: string; inputSchema: any }[]
    expect(tools.length).toBeGreaterThan(40)
    expect(tools.every((t) => /^[a-z_]+$/.test(t.name) && t.inputSchema.type === 'object')).toBe(true)
    // Clé lecture seule : seulement les outils de lecture.
    const ro = (await rpc(readKey, 'tools/list')).body.result.tools as { name: string }[]
    expect(ro.some((t) => t.name === 'create_product')).toBe(false)
    expect(ro.some((t) => t.name === 'get_sales_report')).toBe(true)
  })

  test('list_stores : plusieurs boutiques → storeId exigé', async () => {
    const r = await tool(writeKey, 'list_stores')
    expect(r.data.stores.map((s: any) => s.id).sort()).toEqual([storeId, store2Id].sort())
    const e = await tool(writeKey, 'list_products')
    expect(e.isError).toBe(true)
    expect(e.text).toContain('storeId')
  })

  test('create_product puis update_product partiel (fusion du contenu)', async () => {
    const c = await tool(writeKey, 'create_product', {
      storeId,
      name: 'Perruque lisse',
      price: 25000,
      compareAtPrice: 35000,
      isActive: true,
      description: '<p>Belle perruque</p>',
      offers: [{ id: 'pack2', quantity: 2, price: 45000, label: '2 perruques' }],
      content: { headline: 'La perruque qui tient toute la journée', features: ['Cheveux naturels', 'Pose facile'], faqs: [{ question: 'Livraison ?', answer: 'En 24 h à Abidjan.' }] },
    })
    expect(c.isError).toBe(false)
    productId = c.data.id
    expect(c.data.salesPageUrl).toContain(`/p/${productId}`)
    expect(c.data.payment.method).toBe('cod')

    const u = await tool(writeKey, 'update_product', { storeId, productId, price: 23000, content: { tagline: 'Livrée chez toi' } })
    expect(u.isError).toBe(false)
    expect(u.data.price).toBe(23000)
    expect(u.data.content.headline).toBe('La perruque qui tient toute la journée')
    expect(u.data.content.tagline).toBe('Livrée chez toi')
    expect(u.data.content.features).toEqual(['Cheveux naturels', 'Pose facile'])
    expect(u.data.offers).toHaveLength(1)
  })

  test('commande, statut, rapport et comparaison', async () => {
    const o = await new Client().post('/api/v1/orders', { storeSlug: 'mcp-shop', productId, quantity: 1, customerName: 'Awa', customerPhone: '+225 07 00 00 00 01', city: 'Cocody', address: 'Riviera' })
    expect(o.status).toBe(201)
    const list = await tool(writeKey, 'list_orders', { storeId, status: 'new' })
    expect(list.data.total).toBe(1)
    const orderId = list.data.orders[0].id
    expect(list.data.orders[0].items).toContain('Perruque lisse')

    const st = await tool(writeKey, 'update_order_status', { storeId, orderIds: [orderId], status: 'confirmed', note: 'Client joint' })
    expect(st.isError).toBe(false)

    const rep = await tool(writeKey, 'get_sales_report', { storeId, period: 'this_month', breakdown: 'product' })
    expect(rep.isError).toBe(false)
    expect(rep.data.totals.orders).toBe(1)
    expect(rep.data.totals.confirmed).toBe(1)
    expect(rep.data.breakdown.rows[0].label).toBe('Perruque lisse')
    expect(rep.data.breakdown.rows[0].units).toBe(1)

    const cities = await tool(writeKey, 'get_sales_report', { storeId, period: 'last_30_days', breakdown: 'city', groupBy: 'week' })
    expect(cities.data.breakdown.rows[0].key).toBe('Cocody')

    const sum = await tool(writeKey, 'get_sales_summary', { storeId, period: 'last_7_days' })
    expect(sum.data.current.orders).toBe(1)

    const cmp = await tool(writeKey, 'compare_periods', { storeId, periodA: 'last_7_days', periodB: 'last_year', breakdown: 'product' })
    expect(cmp.isError).toBe(false)
    expect(cmp.data.a.totals.orders).toBe(1)
  })

  test('clé lecture seule : lecture oui, écriture non', async () => {
    const r = await tool(readKey, 'get_product', { storeId, productId })
    expect(r.data.name).toBe('Perruque lisse')
    const w = await rpc(readKey, 'tools/call', { name: 'update_product', arguments: { storeId, productId, price: 1 } })
    expect(w.body.error.code).toBe(-32602)
    // Même en REST direct.
    const res = await app.request(`/api/stores/${storeId}/products/${productId}/active`, { method: 'PATCH', headers: { authorization: `Bearer ${readKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ isActive: false }) })
    expect(res.status).toBe(403)
  })

  test('clé limitée à une boutique : les autres n’existent pas', async () => {
    const s = await tool(scopedKey, 'list_stores')
    expect(s.data.stores.map((x: any) => x.id)).toEqual([store2Id])
    // Sans storeId : la boutique de la clé est prise d'office.
    const p = await tool(scopedKey, 'list_products')
    expect(p.isError).toBe(false)
    expect(p.data.count).toBe(0)
    const e = await tool(scopedKey, 'get_product', { storeId, productId })
    expect(e.isError).toBe(true)
  })

  test('jamais la boutique d’un autre compte, même pour un admin plateforme via clé', async () => {
    const e = await tool(writeKey, 'list_products', { storeId: otherStoreId })
    expect(e.isError).toBe(true)
    const adminKey = (await other.post('/api/api-keys', { name: 'Admin' })).body.key
    const a = await tool(adminKey, 'list_products', { storeId })
    expect(a.isError).toBe(true)
  })

  test('zones de livraison et codes promo', async () => {
    const z = await tool(writeKey, 'create_delivery_zone', { storeId, name: 'Abidjan', country: 'CI', cities: ['Cocody', 'Yopougon'], fee: 1500, freeAbove: 30000 })
    expect(z.isError).toBe(false)
    const zu = await tool(writeKey, 'update_delivery_zone', { storeId, zoneId: z.data.id, fee: 1000 })
    expect(zu.isError).toBe(false)
    expect((await tool(writeKey, 'list_delivery_zones', { storeId })).text).toContain('"fee": 1000')
    const p = await tool(writeKey, 'create_promo_code', { storeId, code: 'tabaski', type: 'percentage', value: 10 })
    expect(p.isError).toBe(false)
    const pu = await tool(writeKey, 'update_promo_code', { storeId, promoCodeId: p.data.id, isActive: false })
    expect(pu.isError).toBe(false)
    const d = await tool(writeKey, 'delete_promo_code', { storeId, promoCodeId: p.data.id })
    expect(d.isError).toBe(true) // confirm manquant
  })

  test('une clé ne gère ni les clés, ni les paiements, ni l’admin', async () => {
    for (const path of ['/api/api-keys', `/api/stores/${storeId}/payment-accounts`, '/api/admin/overview', '/api/billing/plans']) {
      const r = await app.request(path, { headers: { authorization: `Bearer ${writeKey}` } })
      expect(r.status).toBe(403)
    }
  })

  test('activité : action via API marquée', async () => {
    const r = await tool(writeKey, 'list_activity', { storeId })
    expect(r.text).toContain('"via": "api"')
  })

  test('clé révoquée : refusée', async () => {
    const list = await owner.get('/api/api-keys')
    const id = list.body.find((k: any) => k.name === 'Lecture').id
    expect((await owner.req('DELETE', `/api/api-keys/${id}`)).status).toBe(200)
    expect((await rpc(readKey, 'ping')).status).toBe(401)
  })

  test('périodes dans le fuseau de la boutique', () => {
    const now = new Date('2026-03-04T23:30:00Z') // mercredi 4 mars, 23 h 30 UTC
    expect(periodRange('today', 'Africa/Abidjan', now)).toEqual({ from: '2026-03-04', to: '2026-03-04' })
    expect(periodRange('today', 'Africa/Nairobi', now)).toEqual({ from: '2026-03-05', to: '2026-03-05' })
    expect(periodRange('this_week', 'Africa/Abidjan', now)).toEqual({ from: '2026-03-02', to: '2026-03-04' })
    expect(periodRange('last_month', 'Africa/Abidjan', now)).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(periodRange('last_month', 'Africa/Abidjan', new Date('2026-01-10T10:00:00Z'))).toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })
})
