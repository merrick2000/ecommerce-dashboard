import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { downloads, orders, users } from '../src/db/schema'
import { Client } from './helpers'

/** Boutique digitale : commandes par état de paiement, renvoi d'accès, lien de paiement, paniers abandonnés, stats. */
const owner = new Client()
const visitor = new Client()
let storeId = ''
let productId = ''
const ids: Record<string, string> = {}
const today = new Date().toISOString().slice(0, 10)

describe('vue digitale', () => {
  test('mise en place : 3 commandes payée, en attente, refusée', async () => {
    await db.insert(users).values({ email: 'digi-owner@test.dev', name: 'Digi', features: { onlinePayments: true }, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'digi-owner@test.dev', password: 'motdepasse-solide' })
    storeId = (await owner.post('/api/stores', { name: 'Digi', slug: 'digi-shop', currency: 'XOF', kind: 'digital' })).body.id
    await owner.put(`/api/stores/${storeId}/payment-accounts/feexpay`, { enabled: true, mode: 'sandbox', sandbox: { apiKey: 'k', shopId: 's' } })
    productId = (await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Ebook', isActive: true, price: 5000, delivery: { type: 'external_url', url: 'https://x.test/e' } })).body.id
    for (const k of ['paid', 'pending', 'failed']) {
      const r = await visitor.post('/api/v1/orders', { storeSlug: 'digi-shop', productId, customerName: `Client ${k}`, customerPhone: '+22961000000', customerEmail: `${k}@test.dev` })
      expect(r.status).toBe(201)
      const [o] = await db.select().from(orders).where(eq(orders.accessToken, r.body.order.token))
      ids[k] = o!.id
    }
    await owner.post(`/api/stores/${storeId}/orders/${ids.paid}/payment`, { paymentStatus: 'paid' })
    await db.update(orders).set({ poStatus: 'failed', poFailure: 'insufficient_balance : Solde insuffisant', poSessionId: 'cs_x' }).where(eq(orders.id, ids.failed!))
    await db.insert(downloads).values({ orderId: ids.paid!, productId })
  })

  test('liste : filtre et compteurs par état de paiement, téléchargements', async () => {
    const all = await owner.get(`/api/stores/${storeId}/orders`)
    expect(all.body.paymentCounts).toEqual({ paid: 1, pending: 1, failed: 1, refunded: 0 })
    const failed = await owner.get(`/api/stores/${storeId}/orders?paymentState=failed`)
    expect(failed.body.data.map((o: any) => o.id)).toEqual([ids.failed])
    expect(failed.body.data[0].paymentFailed).toBe(true)
    const paid = await owner.get(`/api/stores/${storeId}/orders?paymentState=paid`)
    expect(paid.body.data[0].downloads).toBe(1)
  })

  test('renvoyer l’accès (email corrigé) ; lien de paiement pour une commande en attente', async () => {
    const r = await owner.post(`/api/stores/${storeId}/orders/${ids.paid}/resend-access`, { email: 'bon@test.dev' })
    expect(r.body).toMatchObject({ ok: true, email: 'bon@test.dev' })
    const [o] = await db.select().from(orders).where(eq(orders.id, ids.paid!))
    expect(o!.customerEmail).toBe('bon@test.dev')
    expect((await owner.post(`/api/stores/${storeId}/orders/${ids.pending}/resend-access`, {})).status).toBe(400)
    const link = await owner.post(`/api/stores/${storeId}/orders/${ids.failed}/send-payment-link`, { email: true })
    expect(link.body.emailed).toBe(true)
    expect(link.body.url).toContain('/digi-shop/order/')
    const detail = await owner.get(`/api/stores/${storeId}/orders/${ids.paid}`)
    expect(detail.body.downloads).toHaveLength(1)
    expect(detail.body.customerUrl).toContain('/order/')
  })

  test('paniers abandonnés : liste, relance, retrait', async () => {
    await visitor.post('/api/v1/leads', { storeSlug: 'digi-shop', productId, email: 'panier@test.dev', name: 'Panier' })
    const l = await owner.get(`/api/stores/${storeId}/leads`)
    expect(l.body.total).toBe(1)
    expect(l.body.data[0]).toMatchObject({ email: 'panier@test.dev', productName: 'Ebook' })
    expect(l.body.data[0].productUrl).toContain(`/digi-shop/p/${productId}`)
    expect((await owner.post(`/api/stores/${storeId}/leads/${l.body.data[0].id}/remind`)).body.ok).toBe(true)
    expect((await owner.get(`/api/stores/${storeId}/leads`)).body.data[0].reminderCount).toBe(1)
    expect((await owner.req('DELETE', `/api/stores/${storeId}/leads/${l.body.data[0].id}`)).status).toBe(200)
    expect((await owner.get(`/api/stores/${storeId}/leads`)).body.total).toBe(0)
  })

  test('statistiques digitales', async () => {
    const r = await owner.get(`/api/stores/${storeId}/stats/digital?from=${today}&to=${today}`)
    expect(r.body.payments).toMatchObject({ created: 3, paid: 1, pending: 1, failed: 1, paymentRate: 33.3, revenue: 5000 })
    expect(r.body.failureReasons[0]).toEqual({ reason: 'insufficient_balance', count: 1 })
    expect(r.body.downloads).toEqual({ total: 1, paidNeverDownloaded: 0 })
  })
})

describe('MCP, boutique digitale', () => {
  test('outils digitaux : ventes par état, renvoi d’accès, paniers, stats', async () => {
    const key = (await owner.post('/api/api-keys', { name: 'IA digi', storeId })).body.key as string
    let rid = 0
    const { app } = await import('../src/app')
    const tool = async (name: string, args: Record<string, unknown> = {}) => {
      const res = await app.request('/api/mcp', { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'cf-connecting-ip': '10.9.9.8' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++rid, method: 'tools/call', params: { name, arguments: args } }) })
      const b = (await res.json()) as any
      expect(b.result.isError).toBeFalsy()
      return b.result.structuredContent as any
    }
    const failed = await tool('list_orders', { paymentState: 'failed' })
    expect(failed.orders).toHaveLength(1)
    expect(failed.orders[0].paymentFailure).toContain('insufficient_balance')
    expect(failed.paymentCounts.paid).toBe(1)
    expect((await tool('resend_digital_access', { orderId: ids.paid })).ok).toBe(true)
    expect((await tool('send_payment_link', { orderId: ids.failed, email: false })).url).toContain('/order/')
    expect((await tool('get_digital_stats', { period: 'today' })).payments.failed).toBe(1)
    await visitor.post('/api/v1/leads', { storeSlug: 'digi-shop', productId, email: 'panier2@test.dev', name: 'P2' })
    const carts = await tool('list_abandoned_carts')
    expect(carts.total).toBe(1)
    expect((await tool('remind_abandoned_cart', { cartId: carts.data[0].id })).ok).toBe(true)
  })
})
