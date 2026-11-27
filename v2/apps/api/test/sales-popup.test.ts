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
      { firstName: 'Awa', city: 'Cotonou', product: 'Gel Anti-Cafard', text: null, at: null, image: null },
      { firstName: 'Koffi', city: null, product: 'Gel Anti-Cafard', text: '{prenom} a pris 2 boîtes', at: null, image: null },
    ])
    const cfg = await owner.get(`/api/stores/${s}/checkout-settings`)
    expect(cfg.body.settings.salesPopup).toMatchObject({ template: '{prenom} de {ville} a choisi « {produit} »', recentLabel: 'cette semaine' })
    // Entrée incomplète refusée avec un message clair.
    const bad = await owner.put(`/api/stores/${s}/checkout-settings`, { salesPopup: { enabled: true, intervalSeconds: 10, entries: [{ firstName: '', product: 'X' }] } })
    expect(bad.status).toBe(422)
  })

  test('génération par l’IA réservée, messages rattachés au produit, filtre par page de vente', async () => {
    const { env } = await import('../src/lib/env')
    const { eq } = await import('drizzle-orm')
    const realFetch = globalThis.fetch
    const s = (await owner.get('/api/auth/me')).body.stores.find((x: { slug: string }) => x.slug === 'popup-shop').id
    const prd = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Gel Anti-Cafard Pastille Pro, la boîte de 12 pastilles longue durée', isActive: true, price: 7500 })).body.id
    expect((await owner.post(`/api/stores/${s}/sales-popup/generate`, { count: 3 })).status).toBe(403)

    await db.update(users).set({ features: { urlImport: true } }).where(eq(users.email, 'popup@test.dev'))
    ;(env as { KIE_API_KEY?: string }).KIE_API_KEY = 'cle-de-test'
    globalThis.fetch = (async () =>
      Response.json({ content: [{ type: 'tool_use', name: 'messages', input: { entries: [
        { firstName: 'Adjoavi', city: 'Calavi', product: 'Gel Anti-Cafard Pastille Pro, la boîte de 12 pastilles longue durée' },
        { firstName: 'Fréjus \u{1F600}', city: 'Cotonou', product: 'Gel Anti-Cafard Pastille Pro, la boîte de 12 pastilles longue durée', text: 'Fréjus — a pris 2 boîtes' },
      ] } }] })) as unknown as typeof fetch
    const g = await owner.post(`/api/stores/${s}/sales-popup/generate`, { count: 2, productIds: [prd], instructions: 'prénoms du Bénin' })
    globalThis.fetch = realFetch
    delete (env as { KIE_API_KEY?: string }).KIE_API_KEY
    expect(g.status).toBe(200)
    expect(g.body[0]).toMatchObject({ firstName: 'Adjoavi', city: 'Calavi', productId: prd })
    expect(g.body[1].firstName).toBe('Fréjus')
    expect(g.body[1].text).toBe('Fréjus, a pris 2 boîtes')

    // Sur la page d'un autre produit, ce message n'apparaît pas ; sur la sienne, si.
    await owner.put(`/api/stores/${s}/checkout-settings`, { salesPopup: { enabled: true, intervalSeconds: 10, style: 'dark', position: 'right', entries: [{ ...g.body[0] }] } })
    expect((await visitor.get(`/api/v1/stores/popup-shop/recent-sales?product=${prd}`)).body).toHaveLength(1)
    expect((await visitor.get('/api/v1/stores/popup-shop/recent-sales?product=prd_autreautreautre1')).body).toHaveLength(0)
    expect((await owner.get(`/api/stores/${s}/checkout-settings`)).body.settings.salesPopup).toMatchObject({ style: 'dark', position: 'right' })
  })

  test('urgence : emplacement, style, couleur et modes enregistrés ; date invalide refusée', async () => {
    const s = (await owner.get('/api/auth/me')).body.stores.find((x: { slug: string }) => x.slug === 'popup-shop').id
    const urgency = {
      countdown: { enabled: true, minutes: 30, mode: 'date', endsAt: '2026-12-31T23:59:00.000Z', format: 'blocks', placement: 'top_bar', style: 'solid', color: 'red' },
      limitedStock: { enabled: true, remaining: 7, label: 'Il reste {n} pièces', showBar: true, total: 50, placement: 'above_form', style: 'outline', color: 'green' },
      viewers: { enabled: true, base: 12, vary: false, placement: 'under_title', style: 'pill', color: 'accent' },
    }
    expect((await owner.put(`/api/stores/${s}/checkout-settings`, { urgency })).status).toBe(200)
    expect((await owner.get(`/api/stores/${s}/checkout-settings`)).body.settings.urgency).toMatchObject(urgency)
    const bad = await owner.put(`/api/stores/${s}/checkout-settings`, { urgency: { ...urgency, countdown: { ...urgency.countdown, endsAt: 'demain' } } })
    expect(bad.status).toBe(422)
  })

  test('popups marketing : ciblage produit, code vérifié, réglage produit, résultats', async () => {
    const s = (await owner.get('/api/auth/me')).body.stores.find((x: { slug: string }) => x.slug === 'popup-shop').id
    const a = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Produit A', isActive: true, price: 10000 })).body.id
    const b = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Produit B', isActive: true, price: 10000 })).body.id
    expect((await owner.post(`/api/stores/${s}/promo-codes`, { code: 'SORTIE10', type: 'percentage', value: 10 })).status).toBe(201)
    expect((await owner.post(`/api/stores/${s}/promo-codes`, { code: 'VIEUX', type: 'fixed', value: 500, isActive: false })).status).toBe(201)
    const base = { enabled: true, trigger: 'exit', title: 'Attendez !', collectPhone: true, countdown: 'promo_end' }
    const put = await owner.put(`/api/stores/${s}/checkout-settings`, {
      marketingPopups: [
        { ...base, id: 'sortie01', name: 'Sortie', promoCode: 'SORTIE10' },
        { ...base, id: 'vieux001', name: 'Code éteint', promoCode: 'VIEUX' },
        { ...base, id: 'seulb001', name: 'Seulement B', scope: 'selected', productIds: [b] },
      ],
    })
    expect(put.status).toBe(200)
    const pa = (await visitor.get(`/api/v1/checkout/popup-shop/${a}`)).body
    expect(pa.marketingPopups.map((p: { id: string }) => p.id)).toEqual(['sortie01', 'vieux001'])
    expect(pa.checkout.marketingPopups).toEqual([])
    const [ok, off] = pa.marketingPopups
    expect(ok.promo).toMatchObject({ code: 'SORTIE10', type: 'percentage', value: 10 })
    expect(ok.collectPhone).toBe(true)
    expect(ok.countdown).toBe('none') // code sans date de fin
    expect(off.promo).toBeNull()
    expect(off.collectPhone).toBe(false)
    expect(JSON.stringify(pa)).not.toContain('VIEUX')
    expect((await visitor.get(`/api/v1/checkout/popup-shop/${b}`)).body.marketingPopups).toHaveLength(3)

    // Produit qui masque toutes les popups.
    expect((await owner.put(`/api/stores/${s}/products/${b}`, { type: 'physical', name: 'Produit B', isActive: true, price: 10000, content: { marketingPopups: 'off' } })).status).toBe(200)
    expect((await visitor.get(`/api/v1/checkout/popup-shop/${b}`)).body.marketingPopups).toEqual([])

    const st = await owner.get(`/api/stores/${s}/marketing-popups/stats`)
    expect(st.status).toBe(200)
    expect(st.body.sortie01).toEqual({ views: 0, clicks: 0, leads: 0, orders: 0 })
  })
})
