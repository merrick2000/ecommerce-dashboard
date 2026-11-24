import { describe, expect, test } from 'bun:test'
import { LAUNCH } from '@zuri/shared'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, subscriptions, users } from '../src/db/schema'
import { env } from '../src/lib/env'
import { checkReferralReward } from '../src/services/referrals'
import { Client } from './helpers'

/** Parrainage : lien du parrain, inscription du filleul, mois Pro offert aux deux à la première vente. */
describe('parrainage', () => {
  test('lien, filleul relié, récompense une seule fois, après l’offre de lancement', async () => {
    const parent = new Client()
    await db.insert(users).values({ email: 'parrain@test.dev', name: 'Koffi Mensah', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await parent.post('/api/auth/login', { email: 'parrain@test.dev', password: 'motdepasse-solide' })
    const r = await parent.get('/api/referrals')
    expect(r.body.code).toMatch(/^[A-Z2-9]{6}$/)
    expect(r.body.link).toBe(`https://zurisell.store/?ref=${r.body.code}`)
    expect((await parent.get('/api/referrals')).body.code).toBe(r.body.code)

    // Le filleul arrive par le lien (cookie posé par le site) et s'inscrit.
    const child = new Client()
    child.jar.set('zuri_ref', r.body.code)
    const previous = env.REGISTRATION_OPEN
    env.REGISTRATION_OPEN = 'true'
    const reg = await child.post('/api/auth/register', { name: 'Awa Diallo', email: 'filleul@test.dev', password: 'motdepasse-solide' }).finally(() => (env.REGISTRATION_OPEN = previous))
    expect(reg.status).toBe(201)
    const [c1] = await db.select().from(users).where(eq(users.email, 'filleul@test.dev'))
    const [p1] = await db.select().from(users).where(eq(users.email, 'parrain@test.dev'))
    expect(c1!.referredBy).toBe(p1!.id)
    expect(c1!.signupSource?.ref).toBe(r.body.code)
    expect((await parent.get('/api/referrals')).body.referrals).toEqual([expect.objectContaining({ name: 'Awa', stage: 'signed' })])

    // Pas encore de vente : rien.
    const s = (await child.post('/api/stores', { name: 'Awa Shop', slug: 'awa-filleul', currency: 'XOF' })).body.id
    expect(await checkReferralReward(s)).toBe(false)
    const p = (await child.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Sac', isActive: true, price: 8000 })).body.id
    const o = await new Client().post('/api/v1/orders', { storeSlug: 'awa-filleul', productId: p, customerName: 'Client', customerPhone: '+22997000040', city: 'Cotonou' })
    expect(await checkReferralReward(s)).toBe(false)
    await db.update(orders).set({ fulfillmentStatus: 'delivered' }).where(eq(orders.accessToken, o.body.order.token))

    expect(await checkReferralReward(s)).toBe(true)
    expect(await checkReferralReward(s)).toBe(false)
    const subs = await db.select().from(subscriptions)
    const launchEnd = new Date(LAUNCH.unlimitedUntil)
    for (const id of [c1!.id, p1!.id]) {
      const sub = subs.find((x) => x.userId === id)!
      expect(sub).toMatchObject({ plan: 'pro', source: 'offered' })
      expect(sub.currentPeriodEnd.getTime()).toBeGreaterThan(Math.max(Date.now(), launchEnd.getTime()) + 27 * 86400_000)
    }
    const after = (await parent.get('/api/referrals')).body
    expect(after.stats).toEqual({ signed: 1, sold: 1, monthsEarned: 1 })
    expect(after.referrals[0].stage).toBe('sold')
  })

  test('code inconnu ou son propre code : aucun parrain', async () => {
    const c = new Client()
    c.jar.set('zuri_ref', 'ZZZZZZ')
    const previous = env.REGISTRATION_OPEN
    env.REGISTRATION_OPEN = 'true'
    await c.post('/api/auth/register', { name: 'Seul', email: 'sans-parrain@test.dev', password: 'motdepasse-solide' }).finally(() => (env.REGISTRATION_OPEN = previous))
    const [u] = await db.select().from(users).where(eq(users.email, 'sans-parrain@test.dev'))
    expect(u!.referredBy).toBeNull()
  })
})
