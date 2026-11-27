import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, users, walletEntries } from '../src/db/schema'
import { env } from '../src/lib/env'
import { markOrderPaid } from '../src/services/orders'
import { Client } from './helpers'

/** Portefeuille : vente encaissée par Zuri, commission de la formule, délai, retrait validé puis versé. */
const owner = new Client()
const admin = new Client()
const visitor = new Client()
let storeId = ''
let productId = ''

async function login(client: Client, email: string, isAdmin = false) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  if (isAdmin) await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.email, email))
  expect((await client.post('/api/auth/login', { email, password: 'motdepasse-solide' })).status).toBe(200)
}

/** Commande digitale payée via le compte de la plateforme (comme le ferait le webhook de Payment Orchestrator). */
async function walletSale(email: string) {
  const r = await visitor.post('/api/v1/orders', { storeSlug: 'wallet-shop', productId, customerName: 'Client', customerPhone: '+22961000000', customerEmail: email })
  expect(r.status).toBe(201)
  const [o] = await db.select().from(orders).where(eq(orders.accessToken, r.body.order.token))
  await db.update(orders).set({ walletCollected: true }).where(eq(orders.id, o!.id))
  await markOrderPaid(o!.id, { provider: 'orchestrator', ref: `tx_${email}` })
  return o!.id
}

describe('portefeuille', () => {
  // Compte Payment Orchestrator de la plateforme (encaisse pour les boutiques à portefeuille).
  const prev = env.PO_SECRET_KEY
  beforeAll(() => {
    env.PO_SECRET_KEY = 'sk_test_platform_key'
  })
  afterAll(() => {
    env.PO_SECRET_KEY = prev
  })
  test('ouvert par le super admin, réservé aux boutiques digitales', async () => {
    await login(owner, 'wallet-owner@test.dev')
    await login(admin, 'wallet-admin@test.dev', true)
    storeId = (await owner.post('/api/stores', { name: 'Wallet Shop', slug: 'wallet-shop', currency: 'XOF', kind: 'digital', country: 'BJ' })).body.id
    productId = (await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Formation', isActive: true, price: 20000, delivery: { type: 'external_url', url: 'https://x.test/f' } })).body.id
    expect((await owner.get(`/api/stores/${storeId}/wallet`)).body).toEqual({ enabled: false, currency: 'XOF' })
    const phys = (await owner.post('/api/stores', { name: 'Physique', slug: 'wallet-phys', currency: 'XOF' })).body.id
    expect((await admin.patch(`/api/admin/stores/${phys}/wallet`, { enabled: true })).status).toBe(400)
    expect((await owner.patch(`/api/admin/stores/${storeId}/wallet`, { enabled: true })).status).toBe(404)
    expect((await admin.patch(`/api/admin/stores/${storeId}/wallet`, { enabled: true })).body.walletEnabled).toBe(true)
  })

  test('vente : crédit moins la commission de la formule, en attente pendant le délai', async () => {
    await admin.put('/api/admin/wallet/config', { holdDays: 3, minWithdrawal: 5000, commission: { free: 10, starter: 7, pro: 5, business: 3 } })
    // Sans réglage propre : la commission de la formule du compte.
    expect([10, 7, 5, 3]).toContain((await owner.get(`/api/stores/${storeId}/wallet`)).body.commissionPct)
    // Commission propre à la boutique, fixée par le super admin.
    expect((await admin.patch(`/api/admin/stores/${storeId}/wallet`, { commissionPct: 5 })).body.walletCommissionPct).toBe(5)
    const id = await walletSale('a@test.dev')
    // Paiement marqué deux fois (webhook + vérification) : un seul crédit.
    await markOrderPaid(id, { provider: 'orchestrator', ref: 'tx_again' })
    const w = (await owner.get(`/api/stores/${storeId}/wallet`)).body
    expect(w.commissionPct).toBe(5)
    expect(w).toMatchObject({ enabled: true, available: 0, pending: 19000, earned: 19000, holdDays: 3 })
    expect(w.entries.map((e: { type: string; amount: number }) => [e.type, Number(e.amount)]).sort()).toEqual([
      ['commission', -1000],
      ['sale', 20000],
    ])
    expect(w.entries[0].orderNumber).toBeTruthy()

    // Paiement marqué à la main par le vendeur : l'argent n'est pas passé par Zuri, pas de crédit.
    const r = await visitor.post('/api/v1/orders', { storeSlug: 'wallet-shop', productId, customerName: 'Cash', customerPhone: '+22961000001', customerEmail: 'cash@test.dev' })
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, r.body.order.token))
    await owner.post(`/api/stores/${storeId}/orders/${o!.id}/payment`, { paymentStatus: 'paid' })
    expect((await owner.get(`/api/stores/${storeId}/wallet`)).body.earned).toBe(19000)
  })

  test('retrait : minimum, solde disponible seulement, une demande à la fois, annulation', async () => {
    const dest = { phone: '+229 61 00 00 00', network: 'MTN', country: 'BJ', holderName: 'Awa' }
    expect((await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 10000 })).body.code).toBe('insufficient_balance')
    // Délai passé.
    await db.update(walletEntries).set({ availableAt: new Date(Date.now() - 1000) }).where(eq(walletEntries.storeId, storeId))
    expect((await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 1000 })).body.code).toBe('withdrawal_min')
    expect((await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 25000 })).body.code).toBe('insufficient_balance')
    const first = await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 10000 })
    expect(first.status).toBe(201)
    expect((await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 5000 })).body.code).toBe('withdrawal_open')
    let w = (await owner.get(`/api/stores/${storeId}/wallet`)).body
    expect(w.available).toBe(9000)
    expect(w.payoutTo).toMatchObject({ phone: dest.phone, network: 'MTN' })
    expect((await owner.post(`/api/stores/${storeId}/wallet/withdrawals/${first.body.id}/cancel`, {})).body.status).toBe('cancelled')
    w = (await owner.get(`/api/stores/${storeId}/wallet`)).body
    expect(w.available).toBe(19000)
  })

  test('super admin : refus (montant rendu), validation puis versement avec référence', async () => {
    const dest = { phone: '+22961000000', network: 'Moov', country: 'BJ' }
    const a = (await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 8000 })).body
    const list = (await admin.get('/api/admin/withdrawals')).body
    expect(list[0]).toMatchObject({ id: a.id, storeName: 'Wallet Shop', status: 'pending' })
    expect(list[0].balance.available).toBe(11000)
    expect((await admin.post(`/api/admin/withdrawals/${a.id}/reject`, { reason: 'Numéro incorrect' })).body.status).toBe('rejected')
    expect((await owner.get(`/api/stores/${storeId}/wallet`)).body.available).toBe(19000)

    const b = (await owner.post(`/api/stores/${storeId}/wallet/withdrawals`, { ...dest, amount: 15000 })).body
    expect((await admin.post(`/api/admin/withdrawals/${b.id}/approve`, {})).body.status).toBe('approved')
    // Validé : le vendeur ne peut plus l'annuler.
    expect((await owner.post(`/api/stores/${storeId}/wallet/withdrawals/${b.id}/cancel`, {})).body.code).toBe('withdrawal_locked')
    const paid = (await admin.post(`/api/admin/withdrawals/${b.id}/paid`, { reference: 'MTN-123' })).body
    expect(paid).toMatchObject({ status: 'paid', reference: 'MTN-123' })
    expect((await admin.post(`/api/admin/withdrawals/${b.id}/reject`, {})).body.code).toBe('withdrawal_final')
    const w = (await owner.get(`/api/stores/${storeId}/wallet`)).body
    expect(w).toMatchObject({ available: 4000, withdrawn: 15000 })
  })

  test('remboursement : le net de la vente est retiré une fois', async () => {
    const id = await walletSale('b@test.dev')
    await owner.post(`/api/stores/${storeId}/orders/${id}/payment`, { paymentStatus: 'refunded' })
    await owner.post(`/api/stores/${storeId}/orders/${id}/payment`, { paymentStatus: 'refunded' })
    const w = (await owner.get(`/api/stores/${storeId}/wallet`)).body
    expect(w.earned).toBe(19000)
    expect(w.entries.filter((e: { type: string }) => e.type === 'refund')).toHaveLength(1)
  })
})
