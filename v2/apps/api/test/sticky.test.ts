import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { checkoutSettings, users } from '../src/db/schema'
import { Client } from './helpers'

const owner = new Client()
let storeId = ''
let productId = ''

describe('bouton collant', () => {
  test('boutique existante sans réglage : valeurs par défaut', async () => {
    await db.insert(users).values({ email: 'sticky@test.dev', name: 'Sticky', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'sticky@test.dev', password: 'motdepasse-solide' })
    storeId = (await owner.post('/api/stores', { name: 'Sticky Shop', slug: 'sticky-shop', currency: 'XOF' })).body.id
    productId = (await owner.post(`/api/stores/${storeId}/products`, { type: 'physical', name: 'Lampe', isActive: true, description: '<p>x</p>', price: 8000, trackInventory: false, payment: { method: 'cod', integration: null } })).body.id
    // Simule une boutique créée avant l'ajout du réglage.
    const [row] = await db.select().from(checkoutSettings).where(eq(checkoutSettings.storeId, storeId))
    const { stickyCta: _drop, ...old } = row!.settings as Record<string, unknown>
    await db.update(checkoutSettings).set({ settings: old as never }).where(eq(checkoutSettings.storeId, storeId))
    const r = await owner.get(`/api/stores/${storeId}/checkout-settings`)
    expect(r.body.settings.stickyCta).toMatchObject({ enabled: true, devices: 'mobile', position: 'bottom', trigger: 'after_hero' })
    const pub = await new Client().get(`/api/v1/checkout/sticky-shop/${productId}`)
    expect(pub.body.checkout.stickyCta.enabled).toBe(true)
  })

  test('réglage enregistré puis servi à la page de vente', async () => {
    const current = (await owner.get(`/api/stores/${storeId}/checkout-settings`)).body.settings
    const put = await owner.put(`/api/stores/${storeId}/checkout-settings`, { ...current, stickyCta: { ...current.stickyCta, devices: 'all', position: 'top', trigger: 'scroll', scrollPercent: 40, text: 'Je commande à {prix}', animation: 'pulse' } })
    expect(put.status).toBe(200)
    const pub = await new Client().get(`/api/v1/checkout/sticky-shop/${productId}`)
    expect(pub.body.checkout.stickyCta).toMatchObject({ devices: 'all', position: 'top', trigger: 'scroll', scrollPercent: 40, text: 'Je commande à {prix}', animation: 'pulse' })
  })

  test('valeurs hors limites refusées', async () => {
    const current = (await owner.get(`/api/stores/${storeId}/checkout-settings`)).body.settings
    expect((await owner.put(`/api/stores/${storeId}/checkout-settings`, { ...current, stickyCta: { ...current.stickyCta, scrollPercent: 150 } })).status).toBe(422)
  })
})
