import { describe, expect, test } from 'bun:test'
import { DEFAULT_PROMO, priceFor, promoActive, promoPrice } from '@zuri/shared'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { billingPromo } from '../src/services/billing'
import { setSetting } from '../src/services/platform'
import { Client } from './helpers'

/** Offre sur les formules (Black Friday) : prix réduit côté serveur, réglable et arrêtable dans le super admin. */
describe('offre sur les formules', () => {
  test('calcul du prix et fin de l’offre', () => {
    const on = { active: true, label: 'Black Friday', percent: 30, endsAt: new Date(Date.now() + 864e5).toISOString() }
    expect(promoPrice(4900, on)).toBe(3430)
    expect(promoPrice(priceFor('pro', 12), on)).toBe(69300)
    expect(promoPrice(4900, { ...on, active: false })).toBe(4900)
    expect(promoPrice(4900, { ...on, endsAt: new Date(Date.now() - 1000).toISOString() })).toBe(4900)
    expect(promoActive(null)).toBe(false)
  })

  test('réglée dans le super admin, visible sur le site, arrêtable', async () => {
    const admin = new Client()
    await db.insert(users).values({ email: 'promo-admin@test.dev', name: 'Admin', isPlatformAdmin: true, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await admin.post('/api/auth/login', { email: 'promo-admin@test.dev', password: 'motdepasse-solide' })
    expect((await admin.get('/api/admin/settings')).body.billingPromo).toMatchObject({ label: DEFAULT_PROMO.label, percent: DEFAULT_PROMO.percent })

    const endsAt = new Date(Date.now() + 3 * 864e5).toISOString()
    expect((await admin.put('/api/admin/settings', { billingPromo: { active: true, label: 'Black Friday', percent: 95, endsAt } })).status).toBe(422)
    expect((await admin.put('/api/admin/settings', { billingPromo: { active: true, label: 'Black Friday', percent: 40, endsAt } })).status).toBe(200)
    expect((await billingPromo())?.percent).toBe(40)
    expect((await new Client().get('/api/v1/platform/contact')).body.promo).toMatchObject({ label: 'Black Friday', percent: 40 })

    await admin.put('/api/admin/settings', { billingPromo: { active: false, label: 'Black Friday', percent: 40, endsAt } })
    expect(await billingPromo()).toBeNull()
    expect((await new Client().get('/api/v1/platform/contact')).body.promo).toBeNull()
    // Retour à l'offre par défaut pour les autres fichiers de test.
    await setSetting('billing.promo', null)
  })
})
