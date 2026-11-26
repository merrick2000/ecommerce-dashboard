import { describe, expect, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { onboardingEmails, sellerEvents, sellerFeedback, users } from '../src/db/schema'
import { enqueued } from '../src/jobs/queue'
import { blockerUrl, sendFirstProductCampaign } from '../src/services/activation'
import { Client } from './helpers'

/** Démarrage : boutiques sans produit, étapes suivies, « qu'est-ce qui vous bloque ? », email de relance. */
const admin = new Client()
const seller = new Client()
const busy = new Client()
const visitor = new Client()

async function account(c: Client, email: string, isPlatformAdmin = false) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, isPlatformAdmin, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })
  return (await c.get('/api/auth/me')).body.id as number
}

describe('démarrage des vendeurs', () => {
  test('étapes, réponse en un clic, rapport, relance une seule fois', async () => {
    await account(admin, 'demarrage-admin@test.dev', true)
    const sid = await account(seller, 'demarrage-vide@test.dev')
    const bid = await account(busy, 'demarrage-actif@test.dev')
    const emptyStore = (await seller.post('/api/stores', { name: 'Boutique Vide', slug: 'demarrage-vide', currency: 'XOF' })).body.id
    const busyStore = (await busy.post('/api/stores', { name: 'Boutique Pleine', slug: 'demarrage-pleine', currency: 'XOF' })).body.id
    expect((await busy.post(`/api/stores/${busyStore}/products`, { type: 'physical', name: 'Savon', isActive: true, price: 1000 })).status).toBe(201)
    expect((await db.select().from(sellerEvents).where(and(eq(sellerEvents.userId, bid), eq(sellerEvents.type, 'product_created')))).length).toBe(1)

    // Étapes envoyées par le tableau de bord.
    expect((await seller.post('/api/seller/events', { type: 'product_editor_open', storeId: emptyStore })).status).toBe(200)
    expect((await seller.post('/api/seller/events', { type: 'product_save_error', storeId: emptyStore, data: { message: 'Champs à corriger : price', fields: ['price'] } })).status).toBe(200)
    expect((await seller.post('/api/seller/events', { type: 'nimporte_quoi' })).status).toBe(422)
    expect((await visitor.post('/api/seller/events', { type: 'product_editor_open' })).status).toBe(401)

    // Réponse en un clic depuis l'email (lien signé), puis précision libre.
    const url = new URL(blockerUrl(sid, 'no_photos'))
    const click = await visitor.req('GET', `${url.pathname}${url.search}`)
    expect(click.status).toBe(200)
    expect(String(click.body)).toContain('photos')
    expect((await visitor.req('GET', `/api/v1/feedback/blocker?u=${sid}&a=no_photos&t=faux`)).status).toBe(400)
    expect((await visitor.req('GET', `/api/v1/feedback/blocker?u=${sid}&a=too_complex&t=${url.searchParams.get('t')}`)).status).toBe(400)
    // Depuis le tableau de bord.
    expect((await seller.post('/api/seller/blocker', { answer: 'too_complex', detail: 'Je ne trouve pas où mettre les photos' })).status).toBe(200)
    expect((await seller.get('/api/seller/blocker')).body).toMatchObject({ answer: 'too_complex', source: 'dashboard' })
    expect((await db.select().from(sellerFeedback).where(eq(sellerFeedback.userId, sid))).length).toBe(2)

    // Rapport du super admin.
    expect((await seller.get('/api/admin/activation')).status).toBe(404)
    const r = await admin.get('/api/admin/activation')
    expect(r.status).toBe(200)
    expect(r.body.sellers.map((s: { id: number }) => s.id)).toContain(sid)
    expect(r.body.sellers.map((s: { id: number }) => s.id)).not.toContain(bid)
    expect(r.body.steps.opened).toBeGreaterThanOrEqual(1)
    expect(r.body.steps.tried).toBeGreaterThanOrEqual(1)
    expect(r.body.saveErrors.map((e: { message: string }) => e.message)).toContain('Champs à corriger : price')
    expect(r.body.blockers.find((b: { answer: string }) => b.answer === 'too_complex')).toMatchObject({ label: 'C’est compliqué, je ne sais pas comment faire' })

    // Relance : lancée en arrière-plan depuis le super admin, une seule fois par vendeur.
    expect((await admin.post('/api/admin/activation/campaign')).status).toBe(200)
    expect(enqueued.some((j) => j.name === 'activation.campaign')).toBe(true)
    expect(await sendFirstProductCampaign()).toBeGreaterThanOrEqual(1)
    expect((await db.select().from(onboardingEmails).where(and(eq(onboardingEmails.userId, sid), eq(onboardingEmails.kind, 'first_product_mail')))).length).toBe(1)
    expect((await db.select().from(onboardingEmails).where(and(eq(onboardingEmails.userId, bid), eq(onboardingEmails.kind, 'first_product_mail')))).length).toBe(0)
    await sendFirstProductCampaign()
    expect((await db.select().from(onboardingEmails).where(and(eq(onboardingEmails.userId, sid), eq(onboardingEmails.kind, 'first_product_mail')))).length).toBe(1)
    expect((await admin.get('/api/admin/activation')).body.sellers.find((s: { id: number }) => s.id === sid)).toMatchObject({ mailed: true })
  })
})
