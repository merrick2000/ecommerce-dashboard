import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, products, users } from '../src/db/schema'
import { enqueued } from '../src/jobs/queue'
import { Client } from './helpers'

/** Packs de produits et tunnel de vente (order bump, upsell, offre de repli). */
const owner = new Client()
const visitor = new Client()
let storeId = ''
const ids: Record<string, string> = {}
const today = new Date().toISOString().slice(0, 10)

async function login(c: Client, email: string) {
  await db.insert(users).values({ email, name: 'Owner', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })
}
const make = async (key: string, body: Record<string, unknown>) => {
  const r = await owner.post(`/api/stores/${storeId}/products`, { type: 'physical', isActive: true, ...body })
  expect(r.status).toBe(201)
  ids[key] = r.body.id
  return r.body
}
const stock = async (id: string) => (await db.select({ stock: products.stock }).from(products).where(eq(products.id, id)))[0]!.stock
const order = (productId: string, extra: Record<string, unknown> = {}) =>
  visitor.post('/api/v1/orders', { storeSlug: 'funnel-shop', productId, quantity: 1, customerName: 'Awa', customerPhone: '+225 07 33 33 33 33', city: 'Cocody', address: 'Riviera', ...extra })

describe('packs (bundles)', () => {
  test('mise en place', async () => {
    await login(owner, 'funnel-owner@test.dev')
    storeId = (await owner.post('/api/stores', { name: 'Funnel', slug: 'funnel-shop', currency: 'XOF', country: 'CI' })).body.id
    await make('A', { name: 'Perruque', price: 10000, costPrice: 4000, trackInventory: true, stock: 10 })
    await make('B', { name: 'Bonnet', price: 5000, costPrice: 2000, trackInventory: true, stock: 5 })
    await make('C', { name: 'Brosse', price: 3000, costPrice: 1000, trackInventory: true, stock: 3 })
  })

  test('pack : contenu validé (même boutique, même type, pas de pack dans un pack)', async () => {
    const p = await make('P', { name: 'Pack Beauté', price: 18000, bundle: { items: [{ productId: ids.A, quantity: 1 }, { productId: ids.B, quantity: 2 }] } })
    expect(p.bundle.items).toHaveLength(2)
    const nested = await owner.post(`/api/stores/${storeId}/products`, { type: 'physical', name: 'Pack de packs', price: 1, bundle: { items: [{ productId: ids.P }, { productId: ids.A }] } })
    expect(nested.status).toBe(400)
    const alone = await owner.post(`/api/stores/${storeId}/products`, { type: 'physical', name: 'Pack seul', price: 1, bundle: { items: [{ productId: ids.A }] } })
    expect(alone.status).toBe(422)
  })

  test('page de vente : contenu du pack exposé', async () => {
    const r = await visitor.get(`/api/v1/checkout/funnel-shop/${ids.P}`)
    expect(r.body.product.bundle.map((i: any) => i.name)).toEqual(['Perruque', 'Bonnet'])
    expect(r.body.product.inStock).toBe(true)
    expect(JSON.stringify(r.body)).not.toContain('costPrice')
  })

  test('commande d’un pack : stock de chaque produit réservé, coût = somme, rendu à l’annulation', async () => {
    const r = await order(ids.P!)
    expect(r.status).toBe(201)
    expect(await stock(ids.A!)).toBe(9)
    expect(await stock(ids.B!)).toBe(3)
    const list = await owner.get(`/api/stores/${storeId}/orders?q=${r.body.order.orderNumber}`)
    const id = list.body.data[0].id
    const detail = await owner.get(`/api/stores/${storeId}/orders/${id}`)
    expect(detail.body.items[0].unitCost).toBe(8000)
    expect(detail.body.items[0].bundle).toHaveLength(2)
    expect((await owner.post(`/api/stores/${storeId}/orders/${id}/status`, { fulfillmentStatus: 'cancelled' })).status).toBe(200)
    expect(await stock(ids.A!)).toBe(10)
    expect(await stock(ids.B!)).toBe(5)
  })

  test('stock insuffisant d’un composant : commande refusée', async () => {
    await db.update(products).set({ stock: 1 }).where(eq(products.id, ids.B!))
    const r = await order(ids.P!)
    expect(r.status).toBe(409)
    await db.update(products).set({ stock: 5 }).where(eq(products.id, ids.B!))
  })
})

describe('tunnel de vente', () => {
  test('produit avec order bump, upsell et offre de repli', async () => {
    const m = await make('M', {
      name: 'Perruque premium',
      price: 15000,
      funnel: {
        bump: { id: 'bump', productId: ids.C, price: 2000, title: 'Ajoute la brosse démêlante' },
        upsells: [{ id: 'up1', productId: ids.A, price: 7000, title: 'Une 2e perruque à -30 %', downsell: { id: 'down1', productId: ids.B, price: 3000, title: 'Le bonnet à 3 000' } }],
        thankYou: { buttonLabel: 'Rejoins le groupe WhatsApp', buttonUrl: 'https://chat.whatsapp.com/abc' },
      },
    })
    expect(m.funnel.upsells[0].downsell.id).toBe('down1')
    const page = await visitor.get(`/api/v1/checkout/funnel-shop/${ids.M}`)
    expect(page.body.funnel.bump).toMatchObject({ id: 'bump', price: 2000, regularPrice: 3000, productName: 'Brosse' })
    expect(page.body.funnel.upsells[0].downsell.id).toBe('down1')
  })

  test('order bump coché : ajouté au total, prix fixé par le vendeur', async () => {
    const r = await order(ids.M!, { bump: true })
    expect(r.status).toBe(201)
    expect(r.body.order.total).toBe(17000)
    expect(await stock(ids.C!)).toBe(2)
    ids.token = r.body.order.token
    // Notification au vendeur différée : on attend la fin du tunnel (filet de sécurité 5 min).
    const job = enqueued.filter((j) => j.name === 'order.notify-new').at(-1)
    expect(job).toBeTruthy()
  })

  test('upsell refusé → offre de repli acceptée : ajoutée à la même commande', async () => {
    const d = await visitor.post(`/api/v1/orders/${ids.token}/funnel`, { offerId: 'up1', accept: false })
    expect(d.status).toBe(200)
    expect(d.body.order.total).toBe(17000)
    const before = enqueued.length
    const a = await visitor.post(`/api/v1/orders/${ids.token}/funnel`, { offerId: 'down1', accept: true, last: true })
    expect(a.body.accepted).toBe(true)
    expect(a.body.order.total).toBe(20000)
    expect(enqueued.slice(before).some((j) => j.name === 'order.notify-new')).toBe(true)
    // Rejouer : idempotent ; l'upsell déjà refusé ne peut plus être accepté.
    expect((await visitor.post(`/api/v1/orders/${ids.token}/funnel`, { offerId: 'down1', accept: true })).body.order.total).toBe(20000)
    expect((await visitor.post(`/api/v1/orders/${ids.token}/funnel`, { offerId: 'up1', accept: true })).body.accepted).toBe(false)
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, ids.token!))
    const detail = await owner.get(`/api/stores/${storeId}/orders/${o!.id}`)
    expect(detail.body.items.map((i: any) => i.role).sort()).toEqual(['bump', 'downsell', 'main'])
  })

  test('offre de repli sans refus préalable, ou commande déjà confirmée : refusée', async () => {
    const r = await order(ids.M!)
    expect((await visitor.post(`/api/v1/orders/${r.body.order.token}/funnel`, { offerId: 'down1', accept: true })).status).toBe(409)
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, r.body.order.token))
    await owner.post(`/api/stores/${storeId}/orders/${o!.id}/status`, { fulfillmentStatus: 'confirmed' })
    expect((await visitor.post(`/api/v1/orders/${r.body.order.token}/funnel`, { offerId: 'up1', accept: true })).status).toBe(409)
  })

  test('statistiques du tunnel', async () => {
    const r = await owner.get(`/api/stores/${storeId}/stats/funnel?from=${today}&to=${today}&productId=${ids.M}`)
    expect(r.status).toBe(200)
    expect(r.body.bump).toMatchObject({ offered: 2, accepted: 1, rate: 50 })
    const up = r.body.offers.find((o: any) => o.id === 'up1')
    const down = r.body.offers.find((o: any) => o.id === 'down1')
    expect(up).toMatchObject({ declined: 1, accepted: 0, title: 'Une 2e perruque à -30 %' })
    expect(down).toMatchObject({ accepted: 1, rate: 100, role: 'downsell' })
    expect(r.body.revenue.booked).toBe(5000)
  })
})

describe('pack digital', () => {
  test('les fichiers de chaque produit inclus sont livrés après paiement', async () => {
    const dig = (await owner.post('/api/stores', { name: 'Ebooks', slug: 'funnel-ebooks', currency: 'XOF', kind: 'digital' })).body.id
    const e1 = await owner.post(`/api/stores/${dig}/products`, { type: 'digital', name: 'Ebook 1', price: 3000, delivery: { type: 'external_url', url: 'https://x.test/e1' } })
    const e2 = await owner.post(`/api/stores/${dig}/products`, { type: 'digital', name: 'Ebook 2', price: 3000, delivery: { type: 'external_url', url: 'https://x.test/e2' } })
    const pack = await owner.post(`/api/stores/${dig}/products`, { type: 'digital', name: 'Pack ebooks', price: 5000, isActive: true, bundle: { items: [{ productId: e1.body.id }, { productId: e2.body.id }] } })
    expect(pack.status).toBe(201)
    const phys = await owner.post(`/api/stores/${dig}/products`, { type: 'digital', name: 'Pack mixte', price: 1, bundle: { items: [{ productId: e1.body.id }, { productId: ids.A }] } })
    expect(phys.status).toBe(400)
    await db.update(users).set({ features: { onlinePayments: true } }).where(eq(users.email, 'funnel-owner@test.dev'))
    await owner.put(`/api/stores/${dig}/payment-accounts/feexpay`, { enabled: true, mode: 'sandbox', sandbox: { apiKey: 'k', shopId: 's' } })
    const o = await visitor.post('/api/v1/orders', { storeSlug: 'funnel-ebooks', productId: pack.body.id, customerName: 'Koffi', customerPhone: '+22961000000', customerEmail: 'k@test.dev' })
    expect(o.status).toBe(201)
    const [row] = await db.select().from(orders).where(eq(orders.accessToken, o.body.order.token))
    await owner.post(`/api/stores/${dig}/orders/${row!.id}/payment`, { paymentStatus: 'paid' })
    const dl = await visitor.post(`/api/v1/orders/${o.body.order.token}/download`)
    expect(dl.body.links.map((l: any) => l.url).sort()).toEqual(['https://x.test/e1', 'https://x.test/e2'])
  })
})
