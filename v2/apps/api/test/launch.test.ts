import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { Client } from './helpers'

/** Liste de démarrage : chaque étape se coche d'après ce que le vendeur a réellement fait. */
const owner = new Client()

describe('liste de démarrage', () => {
  test('boutique physique : produit, zone puis visite et commande', async () => {
    await db.insert(users).values({ email: 'launch@test.dev', name: 'Launch', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'launch@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Launch Shop', slug: 'launch-shop', currency: 'XOF' })).body.id
    const state = async () => Object.fromEntries(((await owner.get(`/api/stores/${s}/launch`)).body.steps as { key: string; done: boolean }[]).map((x) => [x.key, x.done]))
    expect(await state()).toEqual({ store: true, product: false, delivery: false, notifications: false, share: false, order: false })
    const p = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Sac', isActive: true, price: 8000 })).body.id
    const zone = (await owner.post(`/api/stores/${s}/zones`, { name: 'Cotonou', country: 'BJ', cities: [], fee: 1000, freeAbove: null, codAllowed: true, etaLabel: null, isActive: true, position: 0 })).body.id
    expect(await state()).toMatchObject({ product: true, delivery: true, share: false })
    const launch = (await owner.get(`/api/stores/${s}/launch`)).body
    expect(launch.productUrl).toContain(`/launch-shop/p/${p}`)
    const visitor = new Client()
    await visitor.post('/api/v1/orders', { storeSlug: 'launch-shop', productId: p, customerName: 'Awa', customerPhone: '+22997000030', city: 'Cotonou', deliveryZoneId: zone })
    expect((await state()).order).toBe(true)
  })
})
