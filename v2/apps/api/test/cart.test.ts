import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orderItems, orders, products, users } from '../src/db/schema'
import { Client } from './helpers'

/** Panier : plusieurs produits d'une boutique dans une seule commande, catégories du catalogue. */
const owner = new Client()
const visitor = new Client()

describe('panier et catégories', () => {
  test('commande à plusieurs produits : prix et stock relus, livraison offerte sur tout le panier, catégories', async () => {
    await db.insert(users).values({ email: 'panier@test.dev', name: 'Panier', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'panier@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Panier Shop', slug: 'panier-shop', currency: 'XOF' })).body.id
    const zone = (await owner.post(`/api/stores/${s}/zones`, { name: 'Cotonou', country: 'BJ', cities: [], fee: 1000, freeAbove: 20000, codAllowed: true, etaLabel: null, isActive: true, position: 0 })).body.id
    const a = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Perruque', category: 'Perruques', isActive: true, price: 15000, trackInventory: true, stock: 5 })).body.id
    const b = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Bonnet', category: 'Accessoires', isActive: true, price: 3000 })).body.id
    const digital = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Brosse en ligne', isActive: true, price: 2000, payment: { method: 'native', integration: null } })).body.id

    expect((await owner.put(`/api/stores/${s}/checkout-settings`, { cart: { enabled: true } })).status).toBe(200)
    // En observation : tant que le super admin n'ouvre pas le panier, il reste invisible et refusé.
    expect((await visitor.get('/api/v1/stores/panier-shop')).body.cartEnabled).toBe(false)
    expect((await visitor.get(`/api/v1/checkout/panier-shop/${a}`)).body.checkout.cart.enabled).toBe(false)
    const refused = await visitor.post('/api/v1/orders', { storeSlug: 'panier-shop', productId: a, extraItems: [{ productId: b }], customerName: 'Awa', customerPhone: '+22997000021', city: 'Cotonou', deliveryZoneId: zone })
    expect(refused.body.code).toBe('cart_disabled')
    expect((await owner.get('/api/auth/me')).body.features.cart).toBe(false)
    await db.update(users).set({ features: { cart: true } }).where(eq(users.email, 'panier@test.dev'))
    expect((await owner.get('/api/auth/me')).body.features.cart).toBe(true)
    const cat = await visitor.get('/api/v1/stores/panier-shop')
    expect(cat.body.cartEnabled).toBe(true)
    expect(cat.body.products.find((p: { id: string }) => p.id === a)).toMatchObject({ category: 'Perruques', hasVariants: false, paymentMethod: 'cod' })

    const lines = await visitor.post('/api/v1/cart/lines', { storeSlug: 'panier-shop', items: [{ productId: a, quantity: 1 }, { productId: b, quantity: 2 }, { productId: 'prd_inexistant00000', quantity: 1 }] })
    expect(lines.body.map((l: { total?: number; available: boolean }) => [l.total ?? null, l.available])).toEqual([[15000, true], [6000, true], [null, false]])

    const r = await visitor.post('/api/v1/orders', { storeSlug: 'panier-shop', productId: a, quantity: 1, extraItems: [{ productId: b, quantity: 2 }], customerName: 'Awa', customerPhone: '+22997000020', city: 'Cotonou', deliveryZoneId: zone })
    expect(r.status).toBe(201)
    // 15 000 + 2 x 3 000 = 21 000 : au-dessus de 20 000, la livraison est offerte.
    expect(r.body.order.total).toBe(21000)
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, r.body.order.token))
    expect(o).toMatchObject({ subtotal: 21000, shippingFee: 0 })
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o!.id))
    expect(items.map((i) => [i.name, i.quantity, Number(i.total)]).sort()).toEqual([['Bonnet', 2, 6000], ['Perruque', 1, 15000]])
    const [p] = await db.select().from(products).where(eq(products.id, a))
    expect(p!.stock).toBe(4)
    expect((await visitor.get(`/api/v1/checkout/panier-shop/${a}`)).body.checkout.cart.enabled).toBe(true)

    // Modes de paiement différents : commandes séparées.
    const mixed = await visitor.post('/api/v1/orders', { storeSlug: 'panier-shop', productId: a, extraItems: [{ productId: digital }], customerName: 'Awa', customerPhone: '+22997000020', city: 'Cotonou', deliveryZoneId: zone })
    expect(mixed.body.code).toBe('cart_payment_mismatch')
  })
})
