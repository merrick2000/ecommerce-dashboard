import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { announcements, users } from '../src/db/schema'
import { enqueued } from '../src/jobs/queue'
import { matches } from '../src/services/announcements'
import { Client } from './helpers'

/** Annonces du super admin : ciblage, bandeau du vendeur, fermeture, clic, notification. */
const admin = new Client()
const seller = new Client()
const english = new Client()

async function account(c: Client, email: string, opts: { admin?: boolean; from?: string } = {}) {
  await db.insert(users).values({ email, name: email.split('@')[0]!, isPlatformAdmin: opts.admin ?? false, signupSource: opts.from ? { from: opts.from } : null, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })
}

describe('annonces', () => {
  test('règles de ciblage', () => {
    const t = { id: 1, stage: 'no_product' as const, lang: 'fr' as const, kinds: ['physical' as const], countries: ['BJ'] }
    expect(matches({}, t)).toBe(true)
    expect(matches({ stages: ['no_product', 'no_store'] }, t)).toBe(true)
    expect(matches({ stages: ['active'] }, t)).toBe(false)
    expect(matches({ langs: ['en'] }, t)).toBe(false)
    expect(matches({ kinds: ['digital'] }, t)).toBe(false)
    expect(matches({ countries: ['BJ', 'TG'] }, t)).toBe(true)
  })

  test('publiée par le super admin, vue par la bonne cible, fermée, cliquée, notifiée', async () => {
    await account(admin, 'annonce-admin@test.dev', { admin: true })
    await account(seller, 'annonce-fr@test.dev')
    await account(english, 'annonce-en@test.dev', { from: '/en/countries/sell-online-kenya' })
    expect((await seller.post('/api/admin/announcements', { title: 'x', body: 'y' })).status).toBe(404)

    const size = await admin.post('/api/admin/announcements/audience', { audience: { langs: ['fr'], stages: ['no_store'] } })
    expect(size.body.size).toBeGreaterThanOrEqual(1)
    expect((await admin.post('/api/admin/announcements', { title: 'Offre', body: 'Texte', ctaUrl: 'javascript:alert(1)' })).status).toBe(422)

    const created = await admin.post('/api/admin/announcements', { title: 'Plus que 5 jours d’offre de lancement', body: 'Choisissez votre formule avant le 30 novembre.', ctaLabel: 'Voir les formules', ctaUrl: '/billing', tone: 'promo', audience: { langs: ['fr'], stages: ['no_store'] }, push: true })
    expect(created.status).toBe(201)
    const id = created.body.id
    expect(enqueued.some((j) => j.name === 'announcement.push' && (j.data as { id: number }).id === id)).toBe(true)

    const mine = await seller.get('/api/announcements')
    expect(mine.body.map((a: { id: number }) => a.id)).toContain(id)
    expect(mine.body.find((a: { id: number }) => a.id === id)).toMatchObject({ title: 'Plus que 5 jours d’offre de lancement', ctaUrl: '/billing', tone: 'promo' })
    // Hors cible (inscrit depuis une page anglaise) : rien.
    expect((await english.get('/api/announcements')).body.map((a: { id: number }) => a.id)).not.toContain(id)

    await seller.post(`/api/announcements/${id}/click`)
    expect((await seller.get('/api/announcements')).body.map((a: { id: number }) => a.id)).not.toContain(id)
    const [row] = await db.select().from(announcements).where(eq(announcements.id, id))
    expect(row!.clicks).toBe(1)

    // Terminée ou désactivée : plus affichée.
    const other = (await admin.post('/api/admin/announcements', { title: 'Nouveauté', body: 'Le parrainage est arrivé.', audience: {} })).body.id
    expect((await english.get('/api/announcements')).body.map((a: { id: number }) => a.id)).toContain(other)
    await admin.patch(`/api/admin/announcements/${other}`, { active: false })
    expect((await english.get('/api/announcements')).body.map((a: { id: number }) => a.id)).not.toContain(other)
    const list = await admin.get('/api/admin/announcements')
    expect(list.body.find((a: { id: number }) => a.id === id)).toMatchObject({ clicks: 1, dismissed: 1 })
  })
})
