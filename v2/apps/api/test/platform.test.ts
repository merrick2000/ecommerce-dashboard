import { describe, expect, test } from 'bun:test'
import { effectivePlan } from '@zuri/shared'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { Client } from './helpers'

/** Boutique en pause / fermée, archivage des commandes, super admin, formules. */
const owner = new Client()
const admin = new Client()
let storeId = ''
let orderId = ''
const slug = `plat-${Date.now().toString(36)}`

async function login(client: Client, email: string, isAdmin = false) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, isPlatformAdmin: isAdmin, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  if (isAdmin) await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.email, email))
  const r = await client.post('/api/auth/login', { email, password: 'motdepasse-solide' })
  expect(r.status).toBe(200)
  return r.body
}

describe('plateforme', () => {
  test('préparation : boutique, produit, commande', async () => {
    await login(owner, `plat-owner-${slug}@test.dev`)
    await login(admin, `plat-admin-${slug}@test.dev`, true)
    const s = await owner.post('/api/stores', { name: 'Plateforme Shop', slug, currency: 'XOF' })
    expect(s.status).toBe(201)
    storeId = s.body.id
    const p = await owner.post(`/api/stores/${storeId}/products`, { type: 'physical', name: 'Montre', isActive: true, description: '<p>x</p>', price: 10000, trackInventory: false, payment: { method: 'cod', integration: null } })
    expect(p.status).toBe(201)
    const o = await new Client().post('/api/v1/orders', { storeSlug: slug, productId: p.body.id, quantity: 1, customerName: 'Awa Test', customerPhone: '+22997000000', city: 'Cotonou' })
    expect(o.status).toBe(201)
    const list = await owner.get(`/api/stores/${storeId}/orders`)
    orderId = list.body.data[0].id
  })

  test('archiver masque la commande des listes par défaut', async () => {
    const r = await owner.post(`/api/stores/${storeId}/orders/archive`, { ids: [orderId], archived: true })
    expect(r.body.updated).toBe(1)
    expect((await owner.get(`/api/stores/${storeId}/orders`)).body.data.find((x: any) => x.id === orderId)).toBeUndefined()
    expect((await owner.get(`/api/stores/${storeId}/orders?archived=only`)).body.data.find((x: any) => x.id === orderId)).toBeDefined()
    await owner.post(`/api/stores/${storeId}/orders/archive`, { ids: [orderId], archived: false })
    expect((await owner.get(`/api/stores/${storeId}/orders`)).body.data.find((x: any) => x.id === orderId)).toBeDefined()
  })

  test('une boutique en pause refuse les commandes, puis rouvre', async () => {
    expect((await owner.post(`/api/stores/${storeId}/pause`, { message: 'Retour lundi' })).body.status).toBe('paused')
    const pub = await new Client().get(`/api/v1/stores/${slug}`)
    expect(pub.body.store.status).toBe('paused')
    expect(pub.body.store.pauseMessage).toBe('Retour lundi')
    expect((await owner.post(`/api/stores/${storeId}/resume`)).body.status).toBe('active')
  })

  test('le super admin voit tout, un vendeur non', async () => {
    expect((await owner.get('/api/admin/overview')).status).toBe(404)
    const ov = await admin.get('/api/admin/overview')
    expect(ov.status).toBe(200)
    expect(ov.body.users.total).toBeGreaterThan(0)
    expect(ov.body.signups).toHaveLength(30)
    const st = await admin.get(`/api/admin/stores?q=${slug}`)
    expect(st.body.data[0].slug).toBe(slug)
  })

  test('les paiements en ligne restent fermés aux vendeurs tant que le super admin ne les ouvre pas', async () => {
    const r = await owner.put(`/api/stores/${storeId}/payment-accounts/fedapay`, { enabled: true, mode: 'sandbox', credentials: { apiKey: 'sk_test' } })
    expect(r.status).toBe(403)
    expect(r.body.code).toBe('online_payments_disabled')
    expect((await owner.get('/api/auth/me')).body.features.onlinePayments).toBe(false)
  })

  test('fermeture définitive : il faut retaper le nom, puis la boutique disparaît', async () => {
    expect((await owner.post(`/api/stores/${storeId}/close`, { confirmName: 'Mauvais nom' })).status).toBe(422)
    expect((await owner.post(`/api/stores/${storeId}/close`, { confirmName: 'Plateforme Shop' })).status).toBe(200)
    expect((await owner.get(`/api/stores/${storeId}`)).status).toBe(404)
    expect((await new Client().get(`/api/v1/stores/${slug}`)).status).toBe(410)
    expect((await owner.get('/api/auth/me')).body.stores.find((s: any) => s.id === storeId)).toBeUndefined()
  })
})

describe('formules', () => {
  test('calendrier de lancement', () => {
    const early = new Date('2026-11-10')
    expect(effectivePlan({ createdAt: early, now: new Date('2026-11-20') }).reason).toBe('launch')
    expect(effectivePlan({ createdAt: early, now: new Date('2026-12-10') }).reason).toBe('early')
    expect(effectivePlan({ createdAt: new Date('2026-12-05'), now: new Date('2026-12-10') }).reason).toBe('free')
    expect(effectivePlan({ createdAt: new Date('2026-12-05'), now: new Date('2027-01-05') }).reason).toBe('expired')
    expect(effectivePlan({ createdAt: early, now: new Date('2027-01-05'), subscription: { plan: 'pro', currentPeriodEnd: new Date('2027-02-01') } }).plan).toBe('pro')
  })
})

describe('super admin : comptes', () => {
  test('liste des comptes avec provenance et formule', async () => {
    const r = await admin.get(`/api/admin/users?q=plat-owner-${slug}`)
    expect(r.status).toBe(200)
    expect(r.body.data[0].plan.plan).toBeDefined()
    expect(r.body.data[0].sourceLabel).toBeDefined()
  })
})
