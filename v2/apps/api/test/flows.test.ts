import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, productVariants, products, users } from '../src/db/schema'
import { enqueued } from '../src/jobs/queue'
import { app } from '../src/app'
import { Client } from './helpers'

const owner = new Client()
const intruder = new Client()
const visitor = new Client()
let storeId = ''
let physicalId = ''
let digitalId = ''
let variantId = 0
let zoneId = 0

const physicalProduct = {
  type: 'physical',
  name: 'Montre connectée X1',
  isActive: true,
  description: '<p>Super montre</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>',
  price: 15000,
  offers: [{ id: 'x2', quantity: 2, price: 27000, label: '2 montres' }],
  trackInventory: true,
  stock: 10,
  variantLabel: 'Couleur',
  variants: [
    { name: 'Noir', stock: 3 },
    { name: 'Or', stock: 0 },
  ],
}

describe('auth & boutique', () => {
  test('le premier compte devient admin plateforme, les inscriptions se ferment ensuite', async () => {
    const r = await owner.post('/api/auth/register', { name: 'Merrick', email: 'owner@test.dev', password: 'motdepasse-solide' })
    expect(r.status).toBe(201)
    expect(r.body.isPlatformAdmin).toBe(true)
    expect(enqueued.some((j) => j.name === 'account.notify' && (j.data as { kind: string; userId: number }).kind === 'welcome' && (j.data as { userId: number }).userId === r.body.id)).toBe(true)
    const r2 = await intruder.post('/api/auth/register', { name: 'Intrus', email: 'intrus@test.dev', password: 'motdepasse-solide' })
    expect(r2.status).toBe(403)
  })

  test('connexion avec un ancien hash bcrypt Laravel ($2y$), puis rehash argon2id', async () => {
    const legacy = (await Bun.password.hash('ancien-mdp', { algorithm: 'bcrypt', cost: 4 })).replace('$2b$', '$2y$')
    await db.insert(users).values({ email: 'intrus@test.dev', name: 'Intrus', passwordHash: legacy })
    const r = await intruder.post('/api/auth/login', { email: 'intrus@test.dev', password: 'ancien-mdp' })
    expect(r.status).toBe(200)
    const [u] = await db.select().from(users).where(eq(users.email, 'intrus@test.dev'))
    expect(u!.passwordHash.startsWith('$argon2id')).toBe(true)
  })

  test('mauvais mot de passe refusé', async () => {
    expect((await new Client().post('/api/auth/login', { email: 'owner@test.dev', password: 'faux' })).status).toBe(401)
  })

  test('création de boutique', async () => {
    const r = await owner.post('/api/stores', { name: 'Ma Boutique', slug: 'ma-boutique', currency: 'XOF' })
    expect(r.status).toBe(201)
    storeId = r.body.id
    expect(r.body.subdomain).toBe('ma-boutique') // les tirets sont acceptés (bug de l'ancien admin)
    const me = await owner.get('/api/auth/me')
    expect(me.body.stores[0]).toMatchObject({ slug: 'ma-boutique', role: 'owner' })
  })

  test('isolation : un autre compte ne voit pas la boutique (404, pas 403)', async () => {
    expect((await intruder.get(`/api/stores/${storeId}/orders`)).status).toBe(404)
    expect((await intruder.get(`/api/stores/${storeId}/payment-accounts`)).status).toBe(404)
  })

  test('sans session → 401', async () => {
    expect((await visitor.get(`/api/stores/${storeId}/products`)).status).toBe(401)
  })
})

describe('catalogue', () => {
  test('produit physique avec variantes : HTML nettoyé', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products`, physicalProduct)
    expect(r.status).toBe(201)
    physicalId = r.body.id
    variantId = r.body.variants[0].id
    expect(r.body.description).not.toContain('<script')
    expect(r.body.description).not.toContain('javascript:')
    expect(r.body.variants).toHaveLength(2)
  })

  test('produit digital', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products`, {
      type: 'digital',
      name: 'Ebook Business',
      isActive: true,
      price: 5000,
      delivery: { type: 'external_url', url: 'https://drive.example.com/ebook' },
    })
    expect(r.status).toBe(201)
    digitalId = r.body.id
  })

  test('zone de livraison et code promo', async () => {
    const z = await owner.post(`/api/stores/${storeId}/zones`, { name: 'Cotonou', country: 'BJ', cities: ['Cotonou', 'Calavi'], fee: 1000 })
    expect(z.status).toBe(201)
    zoneId = z.body.id
    const p = await owner.post(`/api/stores/${storeId}/promo-codes`, { code: 'bienvenue10', type: 'percentage', value: 10 })
    expect(p.status).toBe(201)
    expect(p.body.code).toBe('BIENVENUE10')
  })

  test('validation : prix négatif refusé avec détail', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products`, { ...physicalProduct, price: -5 })
    expect(r.status).toBe(422)
    expect(r.body.issues[0].path).toBe('price')
  })
})

describe('commande COD de bout en bout', () => {
  let orderId = ''
  let token = ''

  test('page de vente publique : zones, variantes, stock', async () => {
    const r = await visitor.get(`/api/v1/checkout/ma-boutique/${physicalId}`)
    expect(r.status).toBe(200)
    expect(r.body.zones).toHaveLength(1)
    expect(r.body.product.variants.map((v: any) => v.inStock)).toEqual([true, false])
    expect(JSON.stringify(r.body)).not.toContain('accessToken')
  })

  test('commande COD : offre x2 + code promo + livraison, montants recalculés serveur', async () => {
    const r = await visitor.post('/api/v1/orders', {
      storeSlug: 'ma-boutique',
      productId: physicalId,
      variantId,
      offerId: 'x2',
      customerName: 'Awa Koné',
      customerPhone: '+229 97 00 00 01',
      city: 'Cotonou',
      address: 'Akpakpa, près du marché',
      deliveryZoneId: zoneId,
      promoCode: 'bienvenue10',
    })
    expect(r.status).toBe(201)
    expect(r.body.order).toMatchObject({ total: 27000 - 2700 + 1000, paymentMethod: 'cod', paymentStatus: 'pending' })
    token = r.body.order.token
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, token))
    orderId = o!.id
    expect(o!.customerPhone).toBe('+22997000001')
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, variantId))
    expect(v!.stock).toBe(1) // 3 - 2
    expect(enqueued.some((j) => j.name === 'order.notify-new')).toBe(true)
  })

  test('stock insuffisant → 409', async () => {
    const r = await visitor.post('/api/v1/orders', { storeSlug: 'ma-boutique', productId: physicalId, variantId, quantity: 5, customerName: 'Test', customerPhone: '+22990000000', city: 'Cotonou' })
    expect(r.status).toBe(409)
    expect(r.body.code).toBe('out_of_stock')
  })

  test('vue publique par jeton uniquement', async () => {
    expect((await visitor.get(`/api/v1/orders/${token}`)).body.orderNumber).toMatch(/^SLT-/)
    expect((await visitor.get(`/api/v1/orders/${orderId}`)).status).toBe(404)
    expect((await visitor.get('/api/v1/orders/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).status).toBe(404)
  })

  test('transition interdite : nouvelle → livrée', async () => {
    const r = await owner.post(`/api/stores/${storeId}/orders/${orderId}/status`, { fulfillmentStatus: 'delivered' })
    expect(r.status).toBe(409)
  })

  test('injoignable → confirmée → expédiée → livrée = payée, client crédité', async () => {
    for (const s of ['unreachable', 'confirmed', 'shipped', 'delivered']) {
      const r = await owner.post(`/api/stores/${storeId}/orders/${orderId}/status`, { fulfillmentStatus: s, courier: s === 'shipped' ? 'Gozem' : undefined })
      expect(r.status).toBe(200)
    }
    const d = await owner.get(`/api/stores/${storeId}/orders/${orderId}`)
    expect(d.body).toMatchObject({ fulfillmentStatus: 'delivered', paymentStatus: 'paid', callAttempts: 1, courier: 'Gozem' })
    expect(d.body.customer).toMatchObject({ deliveredCount: 1, totalSpent: 25300 })
    expect(d.body.events.length).toBeGreaterThanOrEqual(5)
    expect(d.body.accessToken).toBeUndefined()
    expect(enqueued.filter((j) => j.name === 'order.paid')).toHaveLength(1)
  })

  test('retour : stock rendu', async () => {
    await owner.post(`/api/stores/${storeId}/orders/${orderId}/status`, { fulfillmentStatus: 'returned' })
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, variantId))
    expect(v!.stock).toBe(3)
  })

  test('liste avec compteurs par statut + recherche', async () => {
    const r = await owner.get(`/api/stores/${storeId}/orders?q=awa`)
    expect(r.body.total).toBe(1)
    expect(r.body.statusCounts.returned).toBe(1)
  })
})

describe('mode de paiement (un seul choix par produit)', () => {
  test('COD refusé pour un produit digital', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Ebook COD', price: 1000, payment: { method: 'cod' } })
    expect(r.status).toBe(422)
    expect(r.body.issues[0].path).toBe('payment.method')
  })

  test('intégration Chariow sans identifiant produit refusée', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Cours', price: 1000, payment: { method: 'integration', integration: { platform: 'chariow' } } })
    expect(r.status).toBe(422)
    expect(r.body.issues[0].path).toBe('payment.integration.productId')
  })

  test('défaut : COD pour le physique, paiement intégré pour le digital', async () => {
    const phys = await owner.get(`/api/stores/${storeId}/products/${physicalId}`)
    const dig = await owner.get(`/api/stores/${storeId}/products/${digitalId}`)
    expect(phys.body.payment.method).toBe('cod')
    expect(dig.body.payment.method).toBe('native')
  })

  test('paiement intégré sans moyen de paiement activé → commande refusée', async () => {
    const r = await visitor.post('/api/v1/orders', { storeSlug: 'ma-boutique', productId: digitalId, customerName: 'Koffi', customerPhone: '+22961000000', customerEmail: 'koffi@test.dev' })
    expect(r.status).toBe(400)
    expect(r.body.code).toBe('payments_disabled')
    const page = await visitor.get(`/api/v1/checkout/ma-boutique/${digitalId}`)
    expect(page.body.onlinePaymentEnabled).toBe(false)
  })

  test('intégration Selar : lien public exposé, commande externe', async () => {
    const r = await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Formation Selar', isActive: true, price: 9000, payment: { method: 'integration', integration: { platform: 'selar', url: 'https://selar.co/abc' } } })
    expect(r.status).toBe(201)
    const page = await visitor.get(`/api/v1/checkout/ma-boutique/${r.body.id}`)
    expect(page.body.product.payment).toEqual({ method: 'integration', externalUrl: 'https://selar.co/abc', platform: 'selar' })
    const o = await visitor.post('/api/v1/orders', { storeSlug: 'ma-boutique', productId: r.body.id, customerName: 'Ami', customerPhone: '+22961000001', customerEmail: 'ami@test.dev' })
    expect(o.body.order.paymentMethod).toBe('external')
  })
})

describe('commande digitale', () => {
  test('email obligatoire', async () => {
    await owner.put(`/api/stores/${storeId}/payment-accounts/feexpay`, { enabled: true, mode: 'sandbox', sandbox: { apiKey: 'k', shopId: 's' } })
    const r = await visitor.post('/api/v1/orders', { storeSlug: 'ma-boutique', productId: digitalId, customerName: 'Koffi', customerPhone: '+22961000000' })
    expect(r.status).toBe(400)
    expect(r.body.code).toBe('email_required')
  })

  test('téléchargement refusé avant paiement, accordé après', async () => {
    const r = await visitor.post('/api/v1/orders', { storeSlug: 'ma-boutique', productId: digitalId, customerName: 'Koffi', customerPhone: '+22961000000', customerEmail: 'koffi@test.dev' })
    expect(r.status).toBe(201)
    const token = r.body.order.token
    expect((await visitor.post(`/api/v1/orders/${token}/download`)).status).toBe(400)
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, token))
    // Double confirmation simultanée : un seul passage à « payé ».
    await Promise.all([
      owner.post(`/api/stores/${storeId}/orders/${o!.id}/payment`, { paymentStatus: 'paid' }),
      owner.post(`/api/stores/${storeId}/orders/${o!.id}/payment`, { paymentStatus: 'paid' }),
    ])
    const paidJobs = enqueued.filter((j) => j.name === 'order.paid' && (j.data as any).orderId === o!.id)
    expect(paidJobs).toHaveLength(1)
    const dl = await visitor.post(`/api/v1/orders/${token}/download`)
    expect(dl.body.links[0]).toMatchObject({ url: 'https://drive.example.com/ebook', external: true })
  })

  test('produit inactif : commande impossible', async () => {
    await db.update(products).set({ isActive: false }).where(eq(products.id, digitalId))
    const r = await visitor.post('/api/v1/orders', { storeSlug: 'ma-boutique', productId: digitalId, customerName: 'Kossi', customerPhone: '+22961000000', customerEmail: 'k@test.dev' })
    expect(r.status).toBe(404)
  })
})

describe('stats & divers', () => {
  test('tableau de bord : une série par jour, taux de livraison', async () => {
    const r = await owner.get(`/api/stores/${storeId}/stats/overview`)
    expect(r.status).toBe(200)
    expect(r.body.daily).toHaveLength(30)
    expect(r.body.current.orders).toBe(3)
  })

  test('identifiants de paiement chiffrés et masqués', async () => {
    const put = await owner.put(`/api/stores/${storeId}/payment-accounts/fedapay`, { enabled: true, mode: 'sandbox', sandbox: { apiKey: 'sk_sandbox_supersecret123' } })
    expect(put.status).toBe(200)
    const r = await owner.get(`/api/stores/${storeId}/payment-accounts`)
    const feda = r.body.find((p: any) => p.provider === 'fedapay')
    expect(feda.sandbox.apiKey).toBe('sk_••••123')
    expect(feda.webhookUrl).toContain('/api/v1/webhooks/fedapay/')
  })

  test('track : produit inconnu ignoré sans erreur 500', async () => {
    const r = await visitor.post('/api/v1/track', { storeId, productId: 'prd_inexistant0000000', eventType: 'page_view', sessionId: 'session-12345' })
    expect(r.status).toBe(204)
  })

  test('export CSV protégé contre l’injection de formules', async () => {
    await db.update(orders).set({ customerName: '=HYPERLINK("x")' })
    const res = await owner.get(`/api/stores/${storeId}/orders/export.csv`)
    expect(res.body).toContain(`"'=HYPERLINK(""x"")"`)
  })
})

describe('webhook Selar (n8n)', () => {
  let secret = ''
  const sale = (status: string, receipt = 'https://selar.co/r/1') => ({
    platform: 'selar',
    status,
    metadata: { product_code: 'SELAR-1', buyer_email: 'Client@Test.dev', buyer_full_name: 'Jean K', total_amount: 9000, currency: 'XOF', receipt_url: receipt },
  })
  const hook = (body: unknown, s = secret) =>
    app.request('/api/v1/webhooks/external', { method: 'POST', headers: { 'content-type': 'application/json', 'x-webhook-secret': s }, body: JSON.stringify(body) })

  test('secret généré une fois, jamais renvoyé ensuite', async () => {
    const p = await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Cours Selar', isActive: true, price: 9000, externalProductId: 'SELAR-1', payment: { method: 'integration', integration: { platform: 'selar', url: 'https://selar.co/x' } } })
    expect(p.status).toBe(201)
    const r = await owner.post(`/api/stores/${storeId}/integrations/secret`)
    secret = r.body.secret
    expect(secret).toStartWith('whsec_')
    const store = await owner.get(`/api/stores/${storeId}`)
    expect(store.body.hasIntegrationSecret).toBe(true)
    expect(JSON.stringify(store.body)).not.toContain('integrationSecretEnc')
  })

  test('mauvais secret → 401', async () => {
    expect((await hook(sale('paid'), 'whsec_faux')).status).toBe(401)
  })

  test('vente payée → commande payée + effets ; doublon ignoré ; remboursement met à jour', async () => {
    const before = enqueued.filter((j) => j.name === 'order.paid').length
    const r1 = await (await hook(sale('paid'))).json()
    expect(r1.success).toBe(true)
    const r2 = await (await hook(sale('paid'))).json()
    expect(r2).toMatchObject({ duplicate: true, orderId: r1.orderId })
    expect(enqueued.filter((j) => j.name === 'order.paid').length).toBe(before + 1)
    await hook(sale('refunded'))
    const [o] = await db.select().from(orders).where(eq(orders.id, r1.orderId))
    expect(o).toMatchObject({ paymentStatus: 'refunded', fulfillmentStatus: 'returned', customerEmail: 'client@test.dev' })
  })
})

describe('commande manuelle', () => {
  test('stock contrôlé et réservé comme sur le storefront', async () => {
    const tooMany = await owner.post(`/api/stores/${storeId}/orders`, { items: [{ productId: physicalId, variantId, quantity: 50 }], customerName: 'Client WhatsApp', customerPhone: '+22990111111' })
    expect(tooMany.status).toBe(409)
    const ok = await owner.post(`/api/stores/${storeId}/orders`, { items: [{ productId: physicalId, variantId, quantity: 1 }], customerName: 'Client WhatsApp', customerPhone: '+22990111111', city: 'Porto-Novo' })
    expect(ok.status).toBe(201)
    const [v] = await db.select().from(productVariants).where(eq(productVariants.id, variantId))
    expect(v!.stock).toBe(2)
  })

  test('filtre « jusqu’au » inclut toute la journée', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const r = await owner.get(`/api/stores/${storeId}/orders?to=${today}`)
    expect(r.body.total).toBeGreaterThan(0)
  })
})

describe('identifiants publics', () => {
  test('boutique, produit, commande, client : préfixe + 16 caractères aléatoires', async () => {
    expect(storeId).toMatch(/^shp_[0-9A-Za-z]{16}$/)
    expect(physicalId).toMatch(/^prd_[0-9A-Za-z]{16}$/)
    const list = await owner.get(`/api/stores/${storeId}/orders`)
    expect(list.body.data[0].id).toMatch(/^ord_[0-9A-Za-z]{16}$/)
    expect(list.body.data[0].customerId).toMatch(/^cus_[0-9A-Za-z]{16}$/)
  })

  test('identifiant mal formé → 404 (pas d’erreur serveur)', async () => {
    expect((await owner.get('/api/stores/1/products')).status).toBe(404)
    expect((await owner.get(`/api/stores/${storeId}/products/12`)).status).toBe(422)
  })

  test('ancien lien de pub /p/123 : le produit est retrouvé par son ancien numéro', async () => {
    await db.update(products).set({ legacyId: 123, isActive: true }).where(eq(products.id, physicalId))
    const r = await visitor.get('/api/v1/checkout/ma-boutique/123')
    expect(r.status).toBe(200)
    expect(r.body.product.id).toBe(physicalId)
  })

  test('export CSV : colonne Articles correcte', async () => {
    const res = await owner.get(`/api/stores/${storeId}/orders/export.csv`)
    expect(res.body).toContain('x Montre connectée X1')
  })
})
