import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, users } from '../src/db/schema'
import { enqueued } from '../src/jobs/queue'
import { arrivalEvent } from '../src/jobs/handlers'
import { Client } from './helpers'

/** Paiement à la livraison : achat déclaré à Meta à la commande, à la confirmation ou à la livraison. */
const owner = new Client()
const visitor = new Client()

describe('achat déclaré à Meta en paiement à la livraison', () => {
  test('règle : prospect tant que le moment choisi n’est pas atteint, achat direct pour le paiement en ligne', () => {
    expect(arrivalEvent({ paymentMethod: 'cod' }, 'created')).toBe('Purchase')
    expect(arrivalEvent({ paymentMethod: 'cod' }, 'confirmed')).toBe('Lead')
    expect(arrivalEvent({ paymentMethod: 'cod' }, 'delivered')).toBe('Lead')
    expect(arrivalEvent({ paymentMethod: 'mobile_money' }, 'delivered')).toBe('Purchase')
    expect(arrivalEvent({ paymentMethod: 'cod' }, null)).toBe('Lead')
  })

  test('réglage enregistré, prospect côté navigateur, achat envoyé à la confirmation', async () => {
    await db.insert(users).values({ email: 'capi-cod@test.dev', name: 'Capi', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'capi-cod@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Capi Cod', slug: 'capi-cod', currency: 'XOF' })).body.id
    expect((await owner.get(`/api/stores/${s}/checkout-settings`)).body.tracking.codPurchaseOn).toBe('delivered')
    expect((await owner.put(`/api/stores/${s}/tracking`, { facebookPixelId: '123456789012', codPurchaseOn: 'confirmed' })).status).toBe(200)
    expect((await owner.get(`/api/stores/${s}/checkout-settings`)).body.tracking.codPurchaseOn).toBe('confirmed')
    expect((await owner.put(`/api/stores/${s}/tracking`, { facebookPixelId: '123456789012', codPurchaseOn: 'demain' })).status).toBe(422)

    const p = await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Sac', isActive: true, price: 8000 })
    const o = await visitor.post('/api/v1/orders', { storeSlug: 'capi-cod', productId: p.body.id, customerName: 'Awa', customerPhone: '+22997000000', city: 'Cotonou' })
    expect(o.body.order.pixelEvent).toBe('Lead')
    expect((await visitor.get(`/api/v1/orders/${o.body.order.token}`)).body.pixelEvent).toBe('Lead')

    const [row] = await db.select().from(orders).where(eq(orders.accessToken, o.body.order.token))
    const r = await owner.post(`/api/stores/${s}/orders/${row!.id}/status`, { fulfillmentStatus: 'confirmed' })
    expect(r.status).toBe(200)
    expect(enqueued.some((j) => j.name === 'order.capi-purchase' && (j.data as { orderId: string; stage: string }).orderId === row!.id && (j.data as { stage: string }).stage === 'confirmed')).toBe(true)
  })
})
