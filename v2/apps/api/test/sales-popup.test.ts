import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { Client } from './helpers'

/** Popup de ventes : messages configurés par le vendeur (comme les avis), en plus des vraies commandes. */
const owner = new Client()
const visitor = new Client()

describe('popup de ventes : messages configurés', () => {
  test('ajoutés dans les réglages, renvoyés sans heure, avec texte libre et modèle', async () => {
    await db.insert(users).values({ email: 'popup@test.dev', name: 'Popup', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'popup@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Popup Shop', slug: 'popup-shop', currency: 'XOF' })).body.id
    expect((await visitor.get('/api/v1/stores/popup-shop/recent-sales')).body).toEqual([])

    const put = await owner.put(`/api/stores/${s}/checkout-settings`, {
      salesPopup: {
        enabled: true,
        intervalSeconds: 10,
        template: '{prenom} de {ville} a choisi « {produit} »',
        recentLabel: 'cette semaine',
        entries: [
          { firstName: 'Awa Diallo', city: 'Cotonou', product: 'Gel Anti-Cafard' },
          { firstName: 'Koffi', product: 'Gel Anti-Cafard', text: '{prenom} a pris 2 boîtes' },
        ],
      },
    })
    expect(put.status).toBe(200)
    const r = await visitor.get('/api/v1/stores/popup-shop/recent-sales')
    expect(r.body).toEqual([
      { firstName: 'Awa', city: 'Cotonou', product: 'Gel Anti-Cafard', text: null, at: null },
      { firstName: 'Koffi', city: null, product: 'Gel Anti-Cafard', text: '{prenom} a pris 2 boîtes', at: null },
    ])
    const cfg = await owner.get(`/api/stores/${s}/checkout-settings`)
    expect(cfg.body.settings.salesPopup).toMatchObject({ template: '{prenom} de {ville} a choisi « {produit} »', recentLabel: 'cette semaine' })
    // Entrée incomplète refusée avec un message clair.
    const bad = await owner.put(`/api/stores/${s}/checkout-settings`, { salesPopup: { enabled: true, intervalSeconds: 10, entries: [{ firstName: '', product: 'X' }] } })
    expect(bad.status).toBe(422)
  })
})
