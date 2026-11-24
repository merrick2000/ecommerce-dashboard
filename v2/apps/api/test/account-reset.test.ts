import { describe, expect, test } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../src/db/client'
import { customers, orders, products, storeMembers, stores, users } from '../src/db/schema'
import { Client } from './helpers'

/** Remise à zéro du compte super admin : ses boutiques et leur contenu partent, le compte et les autres vendeurs restent. */
const admin = new Client()
const other = new Client()

async function account(c: Client, email: string, isPlatformAdmin: boolean) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, isPlatformAdmin, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })
}

async function storeWithData(c: Client, slug: string) {
  const s = (await c.post('/api/stores', { name: slug, slug, currency: 'XOF' })).body
  const [p] = await db.insert(products).values({ storeId: s.id, type: 'physical', name: 'Produit', price: 5000, content: {}, payment: { method: 'cod' } as never }).returning()
  const [cu] = await db.insert(customers).values({ storeId: s.id, phone: '+22990000000' }).returning()
  await db.insert(orders).values({ storeId: s.id, orderNumber: `${slug}-1`, customerId: cu!.id, kind: 'physical', subtotal: 5000, total: 5000, currency: 'XOF', paymentMethod: 'cod', accessToken: crypto.randomUUID().replace(/-/g, ''), eventId: crypto.randomUUID() } as never)
  return { storeId: s.id as string, productId: p!.id }
}

describe('remise à zéro du compte', () => {
  test('seul le super admin, confirmation obligatoire, ses données seulement', async () => {
    await account(admin, 'reset-admin@test.dev', true)
    await account(other, 'reset-autre@test.dev', false)
    const mine = await storeWithData(admin, 'reset-moi')
    const mine2 = await storeWithData(admin, 'reset-moi-2')
    const theirs = await storeWithData(other, 'reset-autre')

    expect((await other.get('/api/admin/me/reset')).status).toBe(404)
    expect((await other.post('/api/admin/me/reset', { confirm: 'EFFACER' })).status).toBe(404)

    const preview = await admin.get('/api/admin/me/reset')
    expect(preview.body.stores.map((s: { slug: string }) => s.slug).sort()).toEqual(['reset-moi', 'reset-moi-2'])
    expect(preview.body).toMatchObject({ products: 2, orders: 2, customers: 2 })

    expect((await admin.post('/api/admin/me/reset', { confirm: 'oui' })).status).toBe(422)
    expect((await db.select().from(stores).where(eq(stores.id, mine.storeId))).length).toBe(1)

    const r = await admin.post('/api/admin/me/reset', { confirm: 'EFFACER' })
    expect(r.status).toBe(200)
    expect(r.body.stores).toBe(2)
    expect((await db.select().from(stores).where(inArray(stores.id, [mine.storeId, mine2.storeId]))).length).toBe(0)
    expect((await db.select().from(orders).where(inArray(orders.storeId, [mine.storeId, mine2.storeId]))).length).toBe(0)
    expect((await db.select().from(products).where(eq(products.id, mine.productId))).length).toBe(0)

    // L'autre vendeur n'est pas touché.
    expect((await db.select().from(stores).where(eq(stores.id, theirs.storeId))).length).toBe(1)
    expect((await db.select().from(orders).where(eq(orders.storeId, theirs.storeId))).length).toBe(1)
    expect((await db.select().from(storeMembers).where(eq(storeMembers.storeId, theirs.storeId))).length).toBe(1)

    // Le compte reste utilisable : connexion, super admin, nouvelle boutique avec le même lien.
    const me = await admin.get('/api/auth/me')
    expect(me.body.isPlatformAdmin).toBe(true)
    expect(me.body.stores).toEqual([])
    expect((await admin.post('/api/stores', { name: 'Neuve', slug: 'reset-moi', currency: 'XOF' })).status).toBe(201)
  })
})
