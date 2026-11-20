import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { resolveRecipients } from '../src/services/notifications'
import { Client } from './helpers'

/**
 * Régression : un vendeur inscrit (pas l'admin plateforme) doit voir ses commandes,
 * être notifié, et ses commandes doivent apparaître dans le super admin.
 */
const admin = new Client()
const seller = new Client()

async function login(client: Client, email: string, name: string, isPlatformAdmin = false) {
  await db.insert(users).values({ email, name, isPlatformAdmin, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  const r = await client.post('/api/auth/login', { email, password: 'motdepasse-solide' })
  expect(r.status).toBe(200)
  return r.body.id as number
}

describe('nouveau vendeur', () => {
  test('commande publique visible, notifiée et comptée dans l’admin', async () => {
    await login(admin, 'newowner-admin@test.dev', 'Admin', true)
    const sellerId = await login(seller, 'newowner-seller@test.dev', 'Vendeur')
    const store = await seller.post('/api/stores', { name: 'Boutique Neuve', slug: 'boutique-neuve', currency: 'XOF', country: 'CI' })
    expect(store.status).toBe(201)
    const storeId = store.body.id as string
    const prod = await seller.post(`/api/stores/${storeId}/products`, { type: 'physical', name: 'Perruque', isActive: true, price: 15000 })
    expect(prod.status).toBe(201)

    const anon = new Client()
    const order = await anon.post('/api/v1/orders', { storeSlug: 'boutique-neuve', productId: prod.body.id, quantity: 1, customerName: 'Awa', customerPhone: '+225 07 00 00 00 00', city: 'Abidjan', address: 'Cocody' })
    expect(order.status).toBe(201)

    const list = await seller.get(`/api/stores/${storeId}/orders`)
    expect(list.status).toBe(200)
    expect(list.body.total).toBe(1)

    const recipients = await resolveRecipients(storeId, 'order.new', { productIds: [prod.body.id] })
    expect(recipients.map((r) => r.userId)).toContain(sellerId)
    expect(recipients.find((r) => r.userId === sellerId)!.channels.email).toBe(true)

    const adminStores = await admin.get('/api/admin/stores')
    expect(adminStores.status).toBe(200)
    expect(adminStores.body.data.find((s: { id: string }) => s.id === storeId).orders).toBe(1)
    const adminOrders = await admin.get(`/api/stores/${storeId}/orders`)
    expect(adminOrders.body.total).toBe(1)
  })
})
