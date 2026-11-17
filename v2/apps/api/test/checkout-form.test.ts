import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, users } from '../src/db/schema'
import { Client } from './helpers'

/** Formulaire de commande paramétrable : configuration boutique, surcharge produit, champs personnalisés. */
const owner = new Client()
const visitor = new Client()
let storeId = ''
let productId = ''
let overrideId = ''

const product = (name: string, extra: Record<string, unknown> = {}) => ({ type: 'physical', name, isActive: true, description: '<p>x</p>', price: 12000, trackInventory: false, payment: { method: 'cod', integration: null }, ...extra })
const order = (pid: string, extra: Record<string, unknown> = {}) => ({ storeSlug: 'form-shop', productId: pid, customerName: 'Awa Koné', customerPhone: '+22997000077', city: 'Cotonou', address: 'Akpakpa', ...extra })

const storeForm = {
  fields: [
    { key: 'name', builtin: true, label: 'Votre nom' },
    { key: 'phone', builtin: true },
    { key: 'cf_taille', builtin: false, type: 'select', label: 'Taille', required: true, options: ['S', 'M', 'L'] },
    { key: 'cf_cadeau', builtin: false, type: 'checkbox', label: 'Emballage cadeau' },
    { key: 'cf_livraison', builtin: false, type: 'date', label: 'Date souhaitée' },
    { key: 'email', builtin: true, visible: true, required: true },
  ],
  texts: { title: 'Commandez {produit}', submitCod: 'Je commande | {total}', reassurance: ['Livraison 24 h'] },
}

describe('formulaire de commande', () => {
  test('mise en place : boutique avec formulaire personnalisé', async () => {
    await db.insert(users).values({ email: 'form@test.dev', name: 'Form', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    expect((await owner.post('/api/auth/login', { email: 'form@test.dev', password: 'motdepasse-solide' })).status).toBe(200)
    const s = await owner.post('/api/stores', { name: 'Form Shop', slug: 'form-shop', currency: 'XOF' })
    storeId = s.body.id
    productId = (await owner.post(`/api/stores/${storeId}/products`, product('T-shirt'))).body.id
    const cur = await owner.get(`/api/stores/${storeId}/checkout-settings`)
    // Valeurs par défaut : le formulaire historique.
    expect(cur.body.settings.form.fields.map((f: { key: string }) => f.key)).toEqual(['variant', 'quantity', 'name', 'phone', 'email', 'city', 'address', 'note'])
    const r = await owner.req('PUT', `/api/stores/${storeId}/checkout-settings`, { ...cur.body.settings, form: storeForm })
    expect(r.status).toBe(200)
    expect(r.body.settings.form.texts.title).toBe('Commandez {produit}')
  })

  test('la page de vente reçoit le formulaire effectif', async () => {
    const r = await visitor.get(`/api/v1/checkout/form-shop/${productId}`)
    expect(r.body.orderForm.fields.map((f: { key: string }) => f.key)).toContain('cf_taille')
    expect(r.body.orderForm.texts.submitCod).toBe('Je commande | {total}')
  })

  test('configuration invalide refusée (liste sans option, clé libre)', async () => {
    const cur = await owner.get(`/api/stores/${storeId}/checkout-settings`)
    const bad1 = await owner.req('PUT', `/api/stores/${storeId}/checkout-settings`, { ...cur.body.settings, form: { fields: [{ key: 'cf_vide', builtin: false, type: 'select', options: [] }] } })
    expect(bad1.status).toBe(422)
    const bad2 = await owner.req('PUT', `/api/stores/${storeId}/checkout-settings`, { ...cur.body.settings, form: { fields: [{ key: 'pirate', builtin: false, type: 'text' }] } })
    expect(bad2.status).toBe(422)
  })

  test('champ obligatoire manquant, choix hors liste, date invalide : refusés', async () => {
    const missing = await visitor.post('/api/v1/orders', order(productId, { customerEmail: 'a@test.dev' }))
    expect(missing.status).toBe(422)
    expect(missing.body.issues[0].path).toBe('customFields.cf_taille')
    const wrong = await visitor.post('/api/v1/orders', order(productId, { customerEmail: 'a@test.dev', customFields: { cf_taille: 'XXL' } }))
    expect(wrong.status).toBe(422)
    const date = await visitor.post('/api/v1/orders', order(productId, { customerEmail: 'a@test.dev', customFields: { cf_taille: 'M', cf_livraison: '31/12/2026' } }))
    expect(date.status).toBe(422)
    const box = await visitor.post('/api/v1/orders', order(productId, { customerEmail: 'a@test.dev', customFields: { cf_taille: 'M', cf_cadeau: ['Peut-être'] } }))
    expect(box.status).toBe(422)
  })

  test('email rendu obligatoire par le vendeur', async () => {
    const r = await visitor.post('/api/v1/orders', order(productId, { customFields: { cf_taille: 'M' } }))
    expect(r.status).toBe(400)
    expect(r.body.code).toBe('email_required')
  })

  test('réponses valides stockées dans la commande, champs inconnus ignorés, visibles dans le détail et le CSV', async () => {
    const r = await visitor.post('/api/v1/orders', order(productId, { customerEmail: 'a@test.dev', customFields: { cf_taille: 'L', cf_cadeau: ['Oui'], cf_livraison: '2026-12-24', cf_inconnu: 'x' } }))
    expect(r.status).toBe(201)
    const [o] = await db.select().from(orders).where(eq(orders.orderNumber, r.body.order.orderNumber))
    expect((o!.metadata as { customFields: unknown }).customFields).toEqual([
      { key: 'cf_taille', label: 'Taille', value: 'L' },
      { key: 'cf_cadeau', label: 'Emballage cadeau', value: 'Oui' },
      { key: 'cf_livraison', label: 'Date souhaitée', value: '2026-12-24' },
    ])
    const detail = await owner.get(`/api/stores/${storeId}/orders/${o!.id}`)
    expect(detail.body.metadata.customFields).toHaveLength(3)
    const csv = await owner.req('GET', `/api/stores/${storeId}/orders/export.csv`)
    expect(csv.body).toContain('Champs personnalisés')
    expect(csv.body).toContain('Taille: L | Emballage cadeau: Oui')
  })

  test('surcharge produit : son propre formulaire remplace celui de la boutique', async () => {
    const created = await owner.post(
      `/api/stores/${storeId}/products`,
      product('Montre', { content: { orderForm: { fields: [{ key: 'cf_gravure', builtin: false, type: 'text', label: 'Texte à graver', required: true }] } } }),
    )
    expect(created.status).toBe(201)
    overrideId = created.body.id
    const page = await visitor.get(`/api/v1/checkout/form-shop/${overrideId}`)
    const keys = page.body.orderForm.fields.map((f: { key: string }) => f.key)
    expect(keys).toContain('cf_gravure')
    expect(keys).not.toContain('cf_taille')
    // Les champs intégrés oubliés reviennent automatiquement côté storefront/serveur.
    const ok = await visitor.post('/api/v1/orders', order(overrideId, { customFields: { cf_gravure: 'Pour Awa' } }))
    expect(ok.status).toBe(201)
    const missing = await visitor.post('/api/v1/orders', order(overrideId, {}))
    expect(missing.status).toBe(422)
  })

  test('texte trop long refusé', async () => {
    const r = await visitor.post('/api/v1/orders', order(overrideId, { customFields: { cf_gravure: 'x'.repeat(201) } }))
    expect(r.status).toBe(422)
  })
})
