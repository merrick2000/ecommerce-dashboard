import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { storeInvitations, users } from '../src/db/schema'
import { sha256 } from '../src/lib/crypto'
import { Client } from './helpers'

/** Bénéfice réel (COD) et séparation boutique physique / digitale. */
const owner = new Client()
const closer = new Client()
let storeId = ''
let productId = ''
let zoneId = 0
const today = new Date().toISOString().slice(0, 10)

async function login(c: Client, email: string) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  return (await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })).body.id as number
}

async function order(phone: string) {
  const r = await new Client().post('/api/v1/orders', { storeSlug: 'profit-shop', productId, quantity: 1, customerName: 'Client', customerPhone: phone, city: 'Cocody', address: 'Riviera', deliveryZoneId: zoneId })
  expect(r.status).toBe(201)
  const list = await owner.get(`/api/stores/${storeId}/orders?q=${r.body.order.orderNumber}`)
  return list.body.data[0].id as string
}
async function move(id: string, ...statuses: string[]) {
  for (const s of statuses) expect((await owner.post(`/api/stores/${storeId}/orders/${id}/status`, { fulfillmentStatus: s })).status).toBe(200)
}

describe('bénéfice réel', () => {
  test('mise en place : produit avec prix d’achat, zone avec coût livreur et retour', async () => {
    await login(owner, 'profit-owner@test.dev')
    storeId = (await owner.post('/api/stores', { name: 'Profit', slug: 'profit-shop', currency: 'XOF', country: 'CI' })).body.id
    const p = await owner.post(`/api/stores/${storeId}/products`, { type: 'physical', name: 'Perruque', isActive: true, price: 10000, costPrice: 4000 })
    expect(p.status).toBe(201)
    expect(p.body.costPrice).toBe(4000)
    productId = p.body.id
    const z = await owner.post(`/api/stores/${storeId}/zones`, { name: 'Abidjan', country: 'CI', cities: ['Cocody'], fee: 1500, courierCost: 1000, returnCost: 800 })
    expect(z.status).toBe(201)
    zoneId = z.body.id
  })

  test('une livrée, une retournée, 3 000 de pub : bénéfice net 1 700', async () => {
    const delivered = await order('+225 07 11 11 11 11')
    const returned = await order('+225 07 22 22 22 22')
    await move(delivered, 'confirmed', 'shipped', 'delivered')
    await move(returned, 'confirmed', 'shipped', 'returned')
    expect((await owner.post(`/api/stores/${storeId}/expenses`, { spentOn: today, category: 'ads', amount: 3000, label: 'Facebook', productId })).status).toBe(201)

    const r = await owner.get(`/api/stores/${storeId}/stats/report?from=${today}&to=${today}&breakdown=product`)
    expect(r.status).toBe(200)
    const t = r.body.profit.totals
    expect(t.revenueCollected).toBe(11500)
    expect(t.productCost).toBe(4000)
    expect(t.deliveryCost).toBe(2000)
    expect(t.returnCost).toBe(800)
    expect(t.grossProfit).toBe(4700)
    expect(t.expenses).toBe(3000)
    expect(t.netProfit).toBe(1700)
    expect(t.unitsWithoutCost).toBe(0)
    expect(r.body.profit.series).toHaveLength(1)
    const prod = r.body.breakdown.rows[0].profit
    expect(prod.productCost).toBe(4000)
    expect(prod.expenses).toBe(3000)

    const o = await owner.get(`/api/stores/${storeId}/stats/overview?from=${today}&to=${today}`)
    expect(o.body.profit.current.netProfit).toBe(1700)
  })

  test('le prix d’achat est figé sur la commande', async () => {
    const cur = (await owner.get(`/api/stores/${storeId}/products/${productId}`)).body
    await owner.put(`/api/stores/${storeId}/products/${productId}`, { ...cur, costPrice: 9000, variants: [], currencyPrices: [], content: cur.content, payment: cur.payment })
    const r = await owner.get(`/api/stores/${storeId}/stats/report?from=${today}&to=${today}`)
    expect(r.body.profit.totals.productCost).toBe(4000)
  })

  test('closer sans accès au chiffre d’affaires : ni bénéfice, ni dépenses', async () => {
    await login(closer, 'profit-closer@test.dev')
    const inv = await owner.post(`/api/stores/${storeId}/team/invitations`, { email: 'profit-closer@test.dev', role: 'closer', productIds: null })
    const token = `jeton-profit-${crypto.randomUUID()}`
    await db.update(storeInvitations).set({ tokenHash: sha256(token) }).where(eq(storeInvitations.id, inv.body.invitation.id))
    expect((await closer.post('/api/invitations/accept', { token })).status).toBe(200)
    const o = await closer.get(`/api/stores/${storeId}/stats/overview`)
    expect(o.body.profit).toBeNull()
    expect((await closer.get(`/api/stores/${storeId}/expenses`)).status).toBe(403)
  })

  test('dépenses : liste, total par catégorie, suppression', async () => {
    const l = await owner.get(`/api/stores/${storeId}/expenses?from=${today}&to=${today}`)
    expect(l.body.total).toBe(3000)
    expect(l.body.byCategory[0].label).toBe('Publicité')
    expect((await owner.req('DELETE', `/api/stores/${storeId}/expenses/${l.body.data[0].id}`)).status).toBe(200)
  })
})

describe('boutique physique ou digitale', () => {
  test('boutique digitale : produit physique refusé, digital accepté ; type non modifiable', async () => {
    const s = await owner.post('/api/stores', { name: 'Formations', slug: 'profit-digital', currency: 'XOF', kind: 'digital' })
    expect(s.body.kind).toBe('digital')
    const bad = await owner.post(`/api/stores/${s.body.id}/products`, { type: 'physical', name: 'Sac', price: 5000 })
    expect(bad.status).toBe(422)
    expect(bad.body.code).toBe('store_kind_mismatch')
    const ok = await owner.post(`/api/stores/${s.body.id}/products`, { type: 'digital', name: 'Ebook', price: 5000 })
    expect(ok.status).toBe(201)
    const upd = await owner.patch(`/api/stores/${s.body.id}`, { kind: 'physical', name: 'Formations Pro' })
    expect(upd.status).toBe(200)
    expect(upd.body.kind).toBe('digital')
  })
})
