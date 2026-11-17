import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { storeInvitations, users } from '../src/db/schema'
import { sha256 } from '../src/lib/crypto'
import { enqueued } from '../src/jobs/queue'
import { resolveRecipients } from '../src/services/notifications'
import { Client } from './helpers'

/** Les notifications respectent les accès : permission, périmètre produits, montants. */
const owner = new Client()
const closer = new Client()
const shopMgr = new Client()
let storeId = ''
let bagId = ''
let hatId = ''
let ownerId = 0
let closerId = 0
let shopMgrId = 0

const product = (name: string) => ({ type: 'physical', name, isActive: true, description: '<p>x</p>', price: 5000, trackInventory: false, payment: { method: 'cod', integration: null } })

async function login(client: Client, email: string, name: string) {
  await db.insert(users).values({ email, name, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  const r = await client.post('/api/auth/login', { email, password: 'motdepasse-solide' })
  return r.body.id as number
}

async function join(client: Client, email: string, body: Record<string, unknown>) {
  const r = await owner.post(`/api/stores/${storeId}/team/invitations`, { email, ...body })
  const token = `jeton-notif-${crypto.randomUUID()}`
  await db.update(storeInvitations).set({ tokenHash: sha256(token) }).where(eq(storeInvitations.id, r.body.invitation.id))
  expect((await client.post('/api/invitations/accept', { token })).status).toBe(200)
}

const ids = (list: { userId: number }[]) => list.map((r) => r.userId).sort((a, b) => a - b)

describe('notifications : destinataires', () => {
  test('mise en place', async () => {
    ownerId = await login(owner, 'notif-owner@test.dev', 'Owner')
    storeId = (await owner.post('/api/stores', { name: 'Notif Shop', slug: 'notif-shop', currency: 'XOF' })).body.id
    bagId = (await owner.post(`/api/stores/${storeId}/products`, product('Sac'))).body.id
    hatId = (await owner.post(`/api/stores/${storeId}/products`, product('Chapeau'))).body.id
    closerId = await login(closer, 'notif-closer@test.dev', 'Closer')
    await join(closer, 'notif-closer@test.dev', { role: 'closer', productIds: [bagId] })
    shopMgrId = await login(shopMgr, 'notif-mgr@test.dev', 'Mgr')
    await join(shopMgr, 'notif-mgr@test.dev', { role: 'store_manager', productIds: null })
  })

  test('nouvelle commande : seulement ceux qui ont accès au produit', async () => {
    expect(ids(await resolveRecipients(storeId, 'order.new', { productIds: [bagId] }))).toEqual([ownerId, closerId, shopMgrId].sort((a, b) => a - b))
    // Le closer n'a que le sac : rien pour une commande de chapeau.
    expect(ids(await resolveRecipients(storeId, 'order.new', { productIds: [hatId] }))).toEqual([ownerId, shopMgrId].sort((a, b) => a - b))
  })

  test('montants : seulement pour ceux qui voient le chiffre d’affaires', async () => {
    const list = await resolveRecipients(storeId, 'order.paid', { productIds: [bagId] })
    expect(list.find((r) => r.userId === ownerId)!.canSeeRevenue).toBe(true)
    expect(list.find((r) => r.userId === closerId)!.canSeeRevenue).toBe(false)
  })

  test('attribution : uniquement la personne visée, et l’auteur est exclu', async () => {
    expect(ids(await resolveRecipients(storeId, 'order.assigned', { targetUserId: closerId, productIds: [bagId] }))).toEqual([closerId])
    expect(ids(await resolveRecipients(storeId, 'order.status', { productIds: [bagId], excludeUserId: closerId }))).not.toContain(closerId)
  })

  test('équipe : seulement ceux qui gèrent l’équipe', async () => {
    expect(ids(await resolveRecipients(storeId, 'team.activity', {}))).toEqual([ownerId])
  })

  test('un gestionnaire boutique ne reçoit pas les attributions (pas de droit de traiter)', async () => {
    expect(ids(await resolveRecipients(storeId, 'order.assigned', { targetUserId: shopMgrId }))).toEqual([])
  })

  test('préférences : un canal coupé, un événement coupé', async () => {
    const prefs = await closer.get(`/api/stores/${storeId}/notifications/preferences`)
    expect(prefs.status).toBe(200)
    const events = prefs.body.events.map((e: { event: string }) => e.event)
    expect(events).toContain('order.new')
    expect(events).not.toContain('team.activity') // pas de droit équipe
    const put = await closer.put(`/api/stores/${storeId}/notifications/preferences`, {
      prefs: { 'order.new': { push: false, email: false, telegram: false }, 'order.paid': { push: true, email: true, telegram: false }, 'team.activity': { push: true, email: true, telegram: true } },
    })
    expect(put.status).toBe(200)
    expect(ids(await resolveRecipients(storeId, 'order.new', { productIds: [bagId] }))).not.toContain(closerId)
    const paid = (await resolveRecipients(storeId, 'order.paid', { productIds: [bagId] })).find((r) => r.userId === closerId)!
    expect(paid.channels).toEqual({ push: true, email: true, telegram: false })
    // Le droit « équipe » forcé dans la requête est ignoré.
    expect(ids(await resolveRecipients(storeId, 'team.activity', {}))).toEqual([ownerId])
  })
})

describe('notifications : déclencheurs', () => {
  test('attribution et changement de statut mettent une notification en file', async () => {
    const order = (await owner.post(`/api/stores/${storeId}/orders`, { items: [{ productId: bagId, quantity: 1 }], customerName: 'Koffi', customerPhone: '+22997111111', paymentMethod: 'cod' })).body.id
    const before = enqueued.length
    expect((await owner.post(`/api/stores/${storeId}/orders/${order}/assign`, { userId: closerId })).status).toBe(200)
    const assigned = enqueued.slice(before).find((j) => j.name === 'notify.dispatch' && (j.data as { event: string }).event === 'order.assigned')
    expect(assigned?.data).toMatchObject({ storeId, data: { targetUserId: closerId, productIds: [bagId] } })

    expect((await closer.post(`/api/stores/${storeId}/orders/${order}/status`, { fulfillmentStatus: 'confirmed' })).status).toBe(200)
    const status = enqueued.slice(before).find((j) => j.name === 'notify.dispatch' && (j.data as { event: string }).event === 'order.status')
    expect(status?.data).toMatchObject({ data: { excludeUserId: closerId } })
  })

  test('configuration : clé VAPID générée une fois, stable', async () => {
    const a = await owner.get('/api/notifications/config')
    const b = await closer.get('/api/notifications/config')
    expect(a.status).toBe(200)
    expect(a.body.vapidPublicKey).toHaveLength(87)
    expect(b.body.vapidPublicKey).toBe(a.body.vapidPublicKey)
    expect(a.body.telegram.enabled).toBe(false)
  })

  test('appareils : abonnement, liste, suppression (propres au compte)', async () => {
    const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1', keys: { p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) }, label: 'Mon téléphone' }
    expect((await closer.post('/api/notifications/push/subscribe', sub)).status).toBe(200)
    const list = await closer.get('/api/notifications/devices')
    expect(list.body).toHaveLength(1)
    expect(list.body[0].label).toBe('Mon téléphone')
    expect((await owner.req('DELETE', `/api/notifications/devices/${list.body[0].id}`)).status).toBe(404)
    expect((await closer.req('DELETE', `/api/notifications/devices/${list.body[0].id}`)).status).toBe(200)
  })

  test('webhook Telegram refusé sans le bon secret', async () => {
    expect((await new Client().post('/api/v1/webhooks/telegram', { message: { text: '/start abc', chat: { id: 1 } } })).status).toBe(401)
  })
})
