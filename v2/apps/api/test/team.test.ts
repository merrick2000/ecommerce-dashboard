import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, storeInvitations, users } from '../src/db/schema'
import { sha256 } from '../src/lib/crypto'
import { Client } from './helpers'

/**
 * Équipe : un membre ne voit que ce que son rôle et son périmètre produits permettent.
 * Fichier autonome : son propre propriétaire et sa propre boutique.
 */
const boss = new Client()
const closerA = new Client()
const closerB = new Client()
const manager = new Client()
let storeId = ''
let watchId = '' // produit accessible aux closers
let shoeId = '' // produit hors périmètre
let watchOrder = ''
let shoeOrder = ''
let closerAId = 0
let closerBId = 0

const product = (name: string) => ({ type: 'physical', name, isActive: true, description: '<p>x</p>', price: 10000, trackInventory: false, payment: { method: 'cod', integration: null } })

async function makeUser(client: Client, email: string, name: string) {
  await db.insert(users).values({ email, name, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  const r = await client.post('/api/auth/login', { email, password: 'motdepasse-solide' })
  expect(r.status).toBe(200)
  return r.body.id as number
}

/** Invitation créée par l'API ; on récupère un jeton utilisable en le remplaçant par un jeton connu. */
async function invite(by: Client, body: Record<string, unknown>) {
  const r = await by.post(`/api/stores/${storeId}/team/invitations`, body)
  if (r.status !== 201) return { status: r.status, token: '', body: r.body }
  const token = `jeton-invitation-${crypto.randomUUID()}`
  await db.update(storeInvitations).set({ tokenHash: sha256(token) }).where(eq(storeInvitations.id, r.body.invitation.id))
  expect(r.body.inviteUrl).toContain('/invite?token=')
  return { status: 201, token, body: r.body }
}

const manualOrder = (productId: string, name: string) => ({ items: [{ productId, quantity: 1 }], customerName: name, customerPhone: '+22997000001', paymentMethod: 'cod' })

describe('équipe : mise en place', () => {
  test('boutique, deux produits, deux commandes', async () => {
    await makeUser(boss, 'patron@team.dev', 'Patron')
    const s = await boss.post('/api/stores', { name: 'Équipe Shop', slug: 'equipe-shop', currency: 'XOF' })
    expect(s.status).toBe(201)
    storeId = s.body.id
    watchId = (await boss.post(`/api/stores/${storeId}/products`, product('Montre'))).body.id
    shoeId = (await boss.post(`/api/stores/${storeId}/products`, product('Chaussure'))).body.id
    watchOrder = (await boss.post(`/api/stores/${storeId}/orders`, manualOrder(watchId, 'Client Montre'))).body.id
    shoeOrder = (await boss.post(`/api/stores/${storeId}/orders`, manualOrder(shoeId, 'Client Chaussure'))).body.id
    expect(watchOrder).toStartWith('ord_')
    expect(shoeOrder).toStartWith('ord_')
  })

  test('invitation d’un closer limité à la montre : aperçu public puis inscription', async () => {
    const inv = await invite(boss, { email: 'awa@team.dev', role: 'closer', productIds: [watchId], options: { viewRevenue: false, exportData: false } })
    expect(inv.status).toBe(201)
    const preview = await new Client().get(`/api/invitations/${inv.token}`)
    expect(preview.body).toMatchObject({ storeName: 'Équipe Shop', email: 'awa@team.dev', role: 'closer', expired: false, accepted: false, hasAccount: false })

    const r = await closerA.post('/api/auth/register-invite', { token: inv.token, name: 'Awa', password: 'motdepasse-solide' })
    expect(r.status).toBe(201)
    closerAId = r.body.id
    const store = r.body.stores.find((x: { id: string }) => x.id === storeId)
    expect(store.role).toBe('closer')
    expect(store.productIds).toEqual([watchId])
    expect(store.permissions).toContain('orders.update')
    expect(store.permissions).not.toContain('stats.revenue')
    // Lien à usage unique.
    expect((await new Client().post('/api/auth/register-invite', { token: inv.token, name: 'Autre', password: 'motdepasse-solide' })).status).toBe(400)
  })

  test('un compte existant rejoint via /invitations/accept, avec le bon email seulement', async () => {
    closerBId = await makeUser(closerB, 'bio@team.dev', 'Bio')
    const wrong = await invite(boss, { email: 'quelquun@team.dev', role: 'closer', productIds: [watchId] })
    const mismatch = await closerB.post('/api/invitations/accept', { token: wrong.token })
    expect(mismatch.status).toBe(403)
    expect(mismatch.body.code).toBe('invite_email_mismatch')

    const inv = await invite(boss, { email: 'bio@team.dev', role: 'closer', productIds: [watchId] })
    const r = await closerB.post('/api/invitations/accept', { token: inv.token })
    expect(r.status).toBe(200)
    expect(r.body.stores.some((x: { id: string }) => x.id === storeId)).toBe(true)
  })

  test('gestionnaire commandes sur tous les produits', async () => {
    await makeUser(manager, 'gest@team.dev', 'Gest')
    const inv = await invite(boss, { email: 'gest@team.dev', role: 'order_manager', productIds: null })
    expect((await manager.post('/api/invitations/accept', { token: inv.token })).status).toBe(200)
  })
})

describe('équipe : périmètre produits', () => {
  test('le closer ne voit que les commandes de la montre', async () => {
    const list = await closerA.get(`/api/stores/${storeId}/orders`)
    expect(list.status).toBe(200)
    expect(list.body.data.map((o: { id: string }) => o.id)).toEqual([watchOrder])
    expect((await closerA.get(`/api/stores/${storeId}/orders/${shoeOrder}`)).status).toBe(404)
    expect((await closerA.post(`/api/stores/${storeId}/orders/${shoeOrder}/notes`, { note: 'test' })).status).toBe(404)
  })

  test('produits et clients filtrés', async () => {
    const prods = await closerA.get(`/api/stores/${storeId}/products`)
    expect(prods.body.map((p: { id: string }) => p.id)).toEqual([watchId])
    expect(prods.body[0].revenue).toBeNull()
    expect((await closerA.get(`/api/stores/${storeId}/products/${shoeId}`)).status).toBe(404)
    const custs = await closerA.get(`/api/stores/${storeId}/customers`)
    // Même téléphone pour les deux commandes : le client est visible (il a une commande montre), mais son historique est filtré.
    const detail = await closerA.get(`/api/stores/${storeId}/customers/${custs.body.data[0].id}`)
    expect(detail.body.orders.map((o: { id: string }) => o.id)).toEqual([watchOrder])
  })

  test('statistiques sans chiffre d’affaires', async () => {
    const r = await closerA.get(`/api/stores/${storeId}/stats/overview`)
    expect(r.status).toBe(200)
    expect(r.body.revenueVisible).toBe(false)
    expect(r.body.current.revenue).toBeNull()
    expect(r.body.current.orders).toBe(1)
    expect(r.body.daily.every((d: { revenue: number | null }) => d.revenue === null)).toBe(true)
    expect(r.body.mine).toMatchObject({ assigned: 0 })
    const owner = await boss.get(`/api/stores/${storeId}/stats/overview`)
    expect(owner.body.revenueVisible).toBe(true)
    expect(owner.body.current.orders).toBe(2)
  })

  test('actions interdites au closer', async () => {
    expect((await closerA.get(`/api/stores/${storeId}/team`)).status).toBe(403)
    expect((await closerA.get(`/api/stores/${storeId}/payment-accounts`)).status).toBe(403)
    expect((await closerA.get(`/api/stores/${storeId}/orders/export.csv`)).status).toBe(403)
    expect((await closerA.get(`/api/stores/${storeId}/activity`)).status).toBe(403)
    expect((await closerA.post(`/api/stores/${storeId}/products`, product('Pirate'))).status).toBe(403)
    expect((await closerA.post(`/api/stores/${storeId}/orders`, manualOrder(watchId, 'X'))).status).toBe(403)
  })
})

describe('équipe : prise en charge des commandes', () => {
  test('« Je prends » puis l’autre closer est bloqué', async () => {
    expect((await closerA.post(`/api/stores/${storeId}/orders/${watchOrder}/claim`)).status).toBe(200)
    const taken = await closerB.post(`/api/stores/${storeId}/orders/${watchOrder}/claim`)
    expect(taken.status).toBe(409)
    expect(taken.body.code).toBe('order_taken')
    expect(taken.body.error).toContain('Awa')
    const status = await closerB.post(`/api/stores/${storeId}/orders/${watchOrder}/status`, { fulfillmentStatus: 'confirmed' })
    expect(status.status).toBe(409)
    const list = await closerB.get(`/api/stores/${storeId}/orders?assigned=none`)
    expect(list.body.data).toHaveLength(0)
    const mine = await closerA.get(`/api/stores/${storeId}/orders?assigned=me`)
    expect(mine.body.data[0]).toMatchObject({ id: watchOrder, assignedTo: closerAId, assigneeName: 'Awa' })
  })

  test('libérer puis prise automatique au premier changement de statut', async () => {
    expect((await closerB.post(`/api/stores/${storeId}/orders/${watchOrder}/release`)).status).toBe(403)
    expect((await closerA.post(`/api/stores/${storeId}/orders/${watchOrder}/release`)).status).toBe(200)
    expect((await closerB.post(`/api/stores/${storeId}/orders/${watchOrder}/status`, { fulfillmentStatus: 'unreachable' })).status).toBe(200)
    const [o] = await db.select().from(orders).where(eq(orders.id, watchOrder))
    expect(o!.assignedTo).toBe(closerBId)
  })

  test('le gestionnaire attribue, mais pas à quelqu’un sans accès au produit', async () => {
    expect((await manager.post(`/api/stores/${storeId}/orders/${watchOrder}/assign`, { userId: closerAId })).status).toBe(200)
    const refused = await manager.post(`/api/stores/${storeId}/orders/${shoeOrder}/assign`, { userId: closerAId })
    expect(refused.status).toBe(400)
    expect((await closerA.post(`/api/stores/${storeId}/orders/${watchOrder}/assign`, { userId: closerAId })).status).toBe(403)
    const detail = await boss.get(`/api/stores/${storeId}/orders/${watchOrder}`)
    expect(detail.body.assigneeName).toBe('Awa')
    expect(detail.body.events.some((e: { type: string; message: string }) => e.type === 'assigned' && e.message === 'Attribuée à Awa')).toBe(true)
  })

  test('assignees : membres pouvant traiter les commandes', async () => {
    const r = await closerA.get(`/api/stores/${storeId}/team/assignees`)
    expect(r.body.map((m: { name: string }) => m.name).sort()).toEqual(['Awa', 'Bio', 'Gest', 'Patron'])
  })
})

describe('équipe : gestion et activité', () => {
  test('liste de l’équipe et invitations en attente', async () => {
    const r = await boss.get(`/api/stores/${storeId}/team`)
    expect(r.status).toBe(200)
    const awa = r.body.members.find((m: { name: string }) => m.name === 'Awa')
    expect(awa).toMatchObject({ role: 'closer', productIds: [watchId], openOrders: 1 })
    expect(r.body.invitations.map((i: { email: string }) => i.email)).toEqual(['quelquun@team.dev'])
  })

  test('règles de rôles : personne ne touche au propriétaire, un admin ne nomme pas d’admin', async () => {
    const team = await boss.get(`/api/stores/${storeId}/team`)
    const ownerId = team.body.members.find((m: { role: string }) => m.role === 'owner').userId
    const admin = new Client()
    await makeUser(admin, 'admin@team.dev', 'Admin')
    const inv = await invite(boss, { email: 'admin@team.dev', role: 'admin', productIds: null })
    expect((await admin.post('/api/invitations/accept', { token: inv.token })).status).toBe(200)
    expect((await admin.patch(`/api/stores/${storeId}/team/members/${ownerId}`, { role: 'closer', productIds: null })).status).toBe(403)
    expect((await invite(admin, { email: 'x@team.dev', role: 'admin', productIds: null })).status).toBe(403)
    expect((await invite(admin, { email: 'x@team.dev', role: 'closer', productIds: null })).status).toBe(201)
  })

  test('réduire le périmètre libère les commandes devenues inaccessibles', async () => {
    const r = await boss.patch(`/api/stores/${storeId}/team/members/${closerAId}`, { role: 'closer', productIds: [shoeId], options: { viewRevenue: true, exportData: false } })
    expect(r.status).toBe(200)
    expect(r.body.productIds).toEqual([shoeId])
    const [o] = await db.select().from(orders).where(eq(orders.id, watchOrder))
    expect(o!.assignedTo).toBeNull()
    const me = await closerA.get('/api/auth/me')
    expect(me.body.stores.find((x: { id: string }) => x.id === storeId).permissions).toContain('stats.revenue')
  })

  test('fil d’activité : complet pour le propriétaire, filtré pour un gestionnaire limité', async () => {
    const all = await boss.get(`/api/stores/${storeId}/activity`)
    expect(all.status).toBe(200)
    const messages = all.body.data.map((a: { message: string }) => a.message)
    expect(messages).toContain('Produit créé')
    expect(messages.some((m: string) => m.startsWith('A rejoint l’équipe'))).toBe(true)
    expect(messages).toContain('Attribuée à Awa')

    // Gestionnaire boutique limité à la chaussure : rien sur la montre, rien sur l'équipe.
    const shopMgr = new Client()
    await makeUser(shopMgr, 'shopmgr@team.dev', 'ShopMgr')
    const inv = await invite(boss, { email: 'shopmgr@team.dev', role: 'store_manager', productIds: [shoeId] })
    expect((await shopMgr.post('/api/invitations/accept', { token: inv.token })).status).toBe(200)
    const scoped = await shopMgr.get(`/api/stores/${storeId}/activity`)
    expect(scoped.status).toBe(200)
    const labels = scoped.body.data.map((a: { entityLabel: string | null }) => a.entityLabel)
    expect(labels).not.toContain('Montre')
    expect(scoped.body.data.some((a: { entityType: string }) => a.entityType === 'team')).toBe(false)
    expect(scoped.body.data.some((a: { entityType: string; entityId: string }) => a.entityType === 'order' && a.entityId === watchOrder)).toBe(false)
  })

  test('retirer un membre : plus d’accès, ses commandes en attente sont libérées', async () => {
    await boss.post(`/api/stores/${storeId}/orders/${shoeOrder}/assign`, { userId: closerAId })
    expect((await boss.req('DELETE', `/api/stores/${storeId}/team/members/${closerAId}`)).status).toBe(200)
    expect((await closerA.get(`/api/stores/${storeId}/orders`)).status).toBe(404)
    const [o] = await db.select().from(orders).where(eq(orders.id, shoeOrder))
    expect(o!.assignedTo).toBeNull()
  })
})
