import { afterEach, describe, expect, test } from 'bun:test'
import { createHmac } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { app } from '../src/app'
import { db } from '../src/db/client'
import { orders, users } from '../src/db/schema'
import { env } from '../src/lib/env'
import { verifyPoSignature } from '../src/services/po'
import { Client } from './helpers'

/** Payment Orchestrator : session, widget, webhook signé, confirmation serveur. API simulée. */
const owner = new Client()
const visitor = new Client()
const WHSEC = 'whsec_test_secret_zuri'
let storeId = ''
let productId = ''
let webhookUrl = ''
const realFetch = globalThis.fetch
type Call = { method: string; path: string; headers: Record<string, string>; body: any }
let calls: Call[] = []
let sessions: Record<string, any> = {}

/** Simule l'API Payment Orchestrator ; tout le reste passe par le vrai fetch. */
function mockPo() {
  calls = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input)
    if (!url.startsWith(env.PO_BASE_URL)) return realFetch(input as any, init)
    const path = url.slice(env.PO_BASE_URL.length + '/api/v1'.length)
    const headers = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>).map(([k, v]) => [k.toLowerCase(), v]))
    const body = init?.body ? JSON.parse(String(init.body)) : null
    calls.push({ method: init?.method ?? 'GET', path, headers, body })
    if (headers.authorization !== 'Bearer sk_test_store_key' && headers.authorization !== 'Bearer sk_test_platform_key') return Response.json({ error: 'bad key', error_code: 'invalid_api_key', status: 401 }, { status: 401 })
    if (path === '/ping') return Response.json({ ok: true, merchant: { id: 'm_1', name: 'Ma boutique' }, livemode: false })
    if (path === '/checkout/sessions' && init?.method === 'POST') {
      const id = `cs_test_${Object.keys(sessions).length + 1}`
      sessions[id] = { id, object: 'checkout.session', url: `${env.PO_BASE_URL}/pay/${id}`, status: 'open', payment_status: 'unpaid', amount: body.amount, currency: body.currency, livemode: false, client_reference: body.client_reference, transaction: null }
      return Response.json(sessions[id], { status: 201 })
    }
    const m = path.match(/^\/checkout\/sessions\/([^/]+)(\/expire)?$/)
    if (m && sessions[m[1]!]) {
      if (m[2]) sessions[m[1]!].status = 'expired'
      return Response.json(sessions[m[1]!])
    }
    return Response.json({ error: 'not found', error_code: 'not_found', status: 404 }, { status: 404 })
  }) as typeof fetch
}
afterEach(() => {
  globalThis.fetch = realFetch
})

const sign = (body: string, secret = WHSEC, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`
const event = (type: string, tx: Record<string, unknown>, id = crypto.randomUUID()) => JSON.stringify({ id, object: 'event', type, livemode: false, created_at: new Date().toISOString(), data: { object: { object: 'transaction', livemode: false, provider: 'pawapay', country: 'BJ', operator: 'mtn', failure_code: null, failure_message: null, ...tx } } })
const hook = (path: string, body: string, sig: string) => app.request(path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-po-signature': sig }, body })
const newOrder = async () => {
  const r = await visitor.post('/api/v1/orders', { storeSlug: 'po-shop', productId, customerName: 'Awa', customerPhone: '+229 97 00 00 00', customerEmail: 'awa@test.dev' })
  expect(r.status).toBe(201)
  const [o] = await db.select().from(orders).where(eq(orders.accessToken, r.body.order.token))
  return o!
}

describe('Payment Orchestrator', () => {
  test('signature : valide, fausse, trop ancienne', () => {
    const body = '{"id":"e1"}'
    expect(verifyPoSignature(body, sign(body), WHSEC)).toBe(true)
    expect(verifyPoSignature(body, sign(body, 'whsec_autre'), WHSEC)).toBe(false)
    expect(verifyPoSignature(body, sign(body, WHSEC, Math.floor(Date.now() / 1000) - 400), WHSEC)).toBe(false)
    expect(verifyPoSignature(body + ' ', sign(body), WHSEC)).toBe(false)
    expect(verifyPoSignature(body, undefined, WHSEC)).toBe(false)
  })

  test('compte de la boutique : clés contrôlées, webhook propre à la boutique, test de connexion', async () => {
    await db.insert(users).values({ email: 'po-owner@test.dev', name: 'O', features: { onlinePayments: true }, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'po-owner@test.dev', password: 'motdepasse-solide' })
    storeId = (await owner.post('/api/stores', { name: 'PO Shop', slug: 'po-shop', currency: 'XOF', kind: 'digital', country: 'BJ' })).body.id
    // Secret de webhook mal formé : refusé.
    const bad = await owner.put(`/api/stores/${storeId}/payment-accounts/orchestrator`, { enabled: true, mode: 'sandbox', sandbox: { secretKey: 'sk_test_store_key', webhookSecret: 'pas_un_secret' } })
    expect(bad.status).toBe(422)
    const ok = await owner.put(`/api/stores/${storeId}/payment-accounts/orchestrator`, { enabled: true, mode: 'sandbox', sandbox: { secretKey: 'sk_test_store_key', webhookSecret: WHSEC }, settings: { widgetMode: 'modal', locale: 'fr', allowedCountries: ['BJ', 'CI'], allowedOperators: [], defaultCountry: null } })
    expect(ok.status).toBe(200)
    const list = await owner.get(`/api/stores/${storeId}/payment-accounts`)
    const po = list.body.find((a: any) => a.provider === 'orchestrator')
    expect(po.sandbox.secretKey).not.toContain('store_key')
    expect(po.webhookUrl).toContain('/api/v1/webhooks/payment-orchestrator/')
    expect(po.settings.widgetMode).toBe('modal')
    webhookUrl = new URL(po.webhookUrl).pathname
    mockPo()
    expect((await owner.post(`/api/stores/${storeId}/payment-accounts/orchestrator/test`)).body).toMatchObject({ ok: true, merchant: { name: 'Ma boutique' } })
    productId = (await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Ebook', isActive: true, price: 5000, delivery: { type: 'external_url', url: 'https://x.test/e' } })).body.id
    const page = await visitor.get(`/api/v1/checkout/po-shop/${productId}`)
    expect(page.body.onlinePaymentEnabled).toBe(true)
    expect(page.body.paymentGateway).toMatchObject({ kind: 'orchestrator', widgetMode: 'modal', test: true })
    expect(JSON.stringify(page.body)).not.toContain('sk_test')
  })

  test('session : montant serveur, référence, clé d’idempotence, URL de retour ; réutilisée ensuite', async () => {
    mockPo()
    const o = await newOrder()
    const r = await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ paid: false, mode: 'modal', locale: 'fr' })
    const create = calls.find((c) => c.method === 'POST' && c.path === '/checkout/sessions')!
    expect(create.headers['idempotency-key']).toBe(`order_${o.id}`)
    expect(create.body).toMatchObject({ amount: 5000, currency: 'XOF', client_reference: o.id, allowed_countries: ['BJ', 'CI'], default_country: 'BJ', locale: 'fr' })
    expect(create.body.success_url).toContain(`/po-shop/order/${o.accessToken}?session={SESSION_ID}`)
    // Paiement abandonné : retour sur la page de vente du produit (formulaire), pas sur la commande en attente.
    expect(create.body.cancel_url).toMatch(/\/po-shop\/p\/prd_[A-Za-z0-9]+#commander$/)
    const [saved] = await db.select().from(orders).where(eq(orders.id, o.id))
    expect(saved!.poSessionId).toBe(r.body.sessionId)
    calls = []
    const again = await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)
    expect(again.body.sessionId).toBe(r.body.sessionId)
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  test('total modifié (upsell) : ancienne session expirée, nouvelle session et nouvelle clé', async () => {
    mockPo()
    const o = await newOrder()
    const first = await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)
    await db.update(orders).set({ total: 7000 }).where(eq(orders.id, o.id))
    const second = await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)
    expect(second.body.sessionId).not.toBe(first.body.sessionId)
    expect(sessions[first.body.sessionId].status).toBe('expired')
    expect(calls.filter((c) => c.method === 'POST' && c.path === '/checkout/sessions').at(-1)!.headers['idempotency-key']).toBe(`order_${o.id}_2`)
  })

  test('webhook signé payment.succeeded : commande payée une seule fois ; faux ou rejoué : sans effet', async () => {
    mockPo()
    const o = await newOrder()
    const s = (await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)).body
    const body = event('payment.succeeded', { id: 'tx_1', status: 'succeeded', amount: 5000, currency: 'XOF', checkout_session: s.sessionId, client_reference: o.id })
    expect((await hook(webhookUrl, body, sign(body, 'whsec_faux'))).status).toBe(400)
    const [still] = await db.select().from(orders).where(eq(orders.id, o.id))
    expect(still!.paymentStatus).toBe('pending')
    expect((await hook(webhookUrl, body, sign(body))).status).toBe(200)
    expect((await hook(webhookUrl, body, sign(body))).status).toBe(200) // même événement : dédoublonné
    const [paid] = await db.select().from(orders).where(eq(orders.id, o.id))
    expect(paid).toMatchObject({ paymentStatus: 'paid', poStatus: 'paid', poTransactionId: 'tx_1', poProvider: 'pawapay', poOperator: 'mtn', paymentProvider: 'orchestrator' })
  })

  test('montant différent : jamais payée ; échec : raison enregistrée, commande en attente', async () => {
    mockPo()
    const o = await newOrder()
    await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)
    const low = event('payment.succeeded', { id: 'tx_low', status: 'succeeded', amount: 100, currency: 'XOF', client_reference: o.id })
    expect((await hook(webhookUrl, low, sign(low))).status).toBe(200)
    let [row] = await db.select().from(orders).where(eq(orders.id, o.id))
    expect(row).toMatchObject({ paymentStatus: 'pending', poStatus: 'mismatch' })
    const o2 = await newOrder()
    await visitor.post(`/api/v1/orders/${o2.accessToken}/po-session`)
    const failed = event('payment.failed', { id: 'tx_f', status: 'failed', amount: 5000, currency: 'XOF', client_reference: o2.id, failure_code: 'insufficient_balance', failure_message: 'Solde insuffisant' })
    expect((await hook(webhookUrl, failed, sign(failed))).status).toBe(200)
    ;[row] = await db.select().from(orders).where(eq(orders.id, o2.id))
    expect(row).toMatchObject({ paymentStatus: 'pending', poStatus: 'failed', poFailure: 'insufficient_balance : Solde insuffisant' })
  })

  test('confirmation serveur (page commande) : lecture de la session payée', async () => {
    mockPo()
    const o = await newOrder()
    const s = (await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)).body
    expect((await visitor.get(`/api/v1/orders/${o.accessToken}/payment-status`)).body.status).toBe('pending')
    sessions[s.sessionId] = { ...sessions[s.sessionId], status: 'complete', payment_status: 'paid', transaction: { id: 'tx_get', status: 'succeeded', amount: 5000, currency: 'XOF', livemode: false, provider: 'fedapay', operator: 'moov', country: 'BJ' } }
    expect((await visitor.get(`/api/v1/orders/${o.accessToken}/payment-status`)).body.status).toBe('paid')
    const [row] = await db.select().from(orders).where(eq(orders.id, o.id))
    expect(row).toMatchObject({ paymentStatus: 'paid', poTransactionId: 'tx_get', poOperator: 'moov' })
  })

  test('annulation avant paiement : session expirée', async () => {
    mockPo()
    const o = await newOrder()
    const s = (await visitor.post(`/api/v1/orders/${o.accessToken}/po-session`)).body
    expect((await owner.post(`/api/stores/${storeId}/orders/${o.id}/status`, { fulfillmentStatus: 'cancelled' })).status).toBe(200)
    await new Promise((r) => setTimeout(r, 50))
    expect(sessions[s.sessionId].status).toBe('expired')
  })

  test('compte de la plateforme : seulement pour les boutiques du super admin', async () => {
    mockPo()
    env.PO_SECRET_KEY = 'sk_test_platform_key'
    env.PO_WEBHOOK_SECRET = WHSEC
    try {
      const other = new Client()
      await db.insert(users).values({ email: 'po-seller@test.dev', name: 'S', features: { onlinePayments: true }, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
      await other.post('/api/auth/login', { email: 'po-seller@test.dev', password: 'motdepasse-solide' })
      const s = (await other.post('/api/stores', { name: 'Vendeur', slug: 'po-vendeur', currency: 'XOF', kind: 'digital' })).body.id
      const created = await other.post(`/api/stores/${s}/products`, { type: 'digital', name: 'Cours', isActive: true, price: 3000 })
      const p = created.body.id
      const page = await visitor.get(`/api/v1/checkout/po-vendeur/${p}`)
      expect(page.body.paymentGateway.kind).toBe('direct')
      const r = await visitor.post('/api/v1/orders', { storeSlug: 'po-vendeur', productId: p, customerName: 'Koffi', customerPhone: '+22961000000', customerEmail: 'k@test.dev' })
      expect(r.body.code).toBe('payments_disabled')
    } finally {
      env.PO_SECRET_KEY = undefined
      env.PO_WEBHOOK_SECRET = undefined
    }
  })
})

describe('Payment Orchestrator : abonnements et ouverture réservée', () => {
  test('abonnement payé via le compte de la plateforme : session, webhook signé, formule prolongée une fois', async () => {
    mockPo()
    const admin = new Client()
    await db.insert(users).values({ email: 'po-admin@test.dev', name: 'Admin', isPlatformAdmin: true, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await admin.post('/api/auth/login', { email: 'po-admin@test.dev', password: 'motdepasse-solide' })
    expect((await admin.put('/api/admin/settings', { poSecretKey: 'sk_live_mauvais_mode_ok', poWebhookSecret: 'pas_un_secret' })).status).toBe(422)
    expect((await admin.put('/api/admin/settings', { poSecretKey: 'sk_test_platform_key', poWebhookSecret: WHSEC })).status).toBe(200)
    const settings = await admin.get('/api/admin/settings')
    expect(settings.body.po).toMatchObject({ configured: true, source: 'admin', livemode: false, webhookSecretSet: true })
    expect(JSON.stringify(settings.body)).not.toContain('platform_key')
    expect((await admin.post('/api/admin/po/test')).body).toMatchObject({ ok: true })

    const billing = await admin.get('/api/billing')
    expect(billing.body.gateway).toMatchObject({ kind: 'orchestrator', test: true })
    const r = await admin.post('/api/billing/checkout', { plan: 'pro', months: 1 })
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ status: 'po' })
    const create = calls.find((c) => c.method === 'POST' && c.path === '/checkout/sessions' && c.body.client_reference === `bill_${r.body.id}`)!
    expect(create.headers['idempotency-key']).toBe(`billing_${r.body.id}`)
    expect(create.body.amount).toBe(9900)

    // Paiement confirmé : webhook signé avec le secret de la plateforme, la session est relue côté serveur.
    sessions[r.body.sessionId] = { ...sessions[r.body.sessionId], status: 'complete', payment_status: 'paid', transaction: { id: 'tx_bill', status: 'succeeded' } }
    const body = event('payment.succeeded', { id: 'tx_bill', status: 'succeeded', amount: 9900, currency: 'XOF', client_reference: `bill_${r.body.id}`, checkout_session: r.body.sessionId })
    expect((await hook('/api/v1/webhooks/payment-orchestrator', body, sign(body, 'whsec_autre'))).status).toBe(400)
    expect((await hook('/api/v1/webhooks/payment-orchestrator', body, sign(body))).status).toBe(200)
    const status = await admin.get(`/api/billing/payments/${r.body.id}`)
    expect(status.body.status).toBe('paid')
    expect(status.body.plan.plan).toBe('pro')
    await admin.put('/api/admin/settings', { poSecretKey: null, poWebhookSecret: null })
  })

  test('paiement en ligne non ouvert au vendeur : ses clés ne suffisent pas', async () => {
    mockPo()
    const seller = new Client()
    await db.insert(users).values({ email: 'po-ferme@test.dev', name: 'Ferme', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await seller.post('/api/auth/login', { email: 'po-ferme@test.dev', password: 'motdepasse-solide' })
    const s = (await seller.post('/api/stores', { name: 'Fermé', slug: 'po-ferme', currency: 'XOF', kind: 'digital' })).body.id
    // Sans l'option, l'enregistrement des clés est refusé…
    expect((await seller.put(`/api/stores/${s}/payment-accounts/orchestrator`, { enabled: true, mode: 'sandbox', sandbox: { secretKey: 'sk_test_store_key' } })).status).toBe(403)
    // …et même un compte déjà présent (option retirée ensuite) n'est plus utilisé.
    const { paymentAccounts } = await import('../src/db/schema')
    const { encryptJson } = await import('../src/lib/crypto')
    await db.insert(paymentAccounts).values({ storeId: s, provider: 'orchestrator', enabled: true, mode: 'sandbox', credentialsEnc: encryptJson({ sandbox: { secretKey: 'sk_test_store_key' } }), webhookToken: `tok_${crypto.randomUUID()}` })
    const p = (await seller.post(`/api/stores/${s}/products`, { type: 'digital', name: 'Cours', isActive: true, price: 3000 })).body.id
    const page = await visitor.get(`/api/v1/checkout/po-ferme/${p}`)
    expect(page.body.onlinePaymentEnabled).toBe(false)
    const o = await visitor.post('/api/v1/orders', { storeSlug: 'po-ferme', productId: p, customerName: 'Koffi', customerPhone: '+22961000000', customerEmail: 'k@test.dev' })
    expect(o.body.code).toBe('payments_disabled')
  })
})

describe('Payment Orchestrator : clé collée sous le mauvais onglet', () => {
  test('sk_test_ saisie dans « Production » : rangée en test, mode test activé', async () => {
    const seller = new Client()
    await db.insert(users).values({ email: 'po-onglet@test.dev', name: 'Onglet', features: { onlinePayments: true }, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await seller.post('/api/auth/login', { email: 'po-onglet@test.dev', password: 'motdepasse-solide' })
    const s = (await seller.post('/api/stores', { name: 'Onglet', slug: 'po-onglet', currency: 'XOF', kind: 'digital' })).body.id
    const r = await seller.put(`/api/stores/${s}/payment-accounts/orchestrator`, { enabled: true, mode: 'live', live: { secretKey: 'sk_test_store_key', webhookSecret: WHSEC } })
    expect(r.status).toBe(200)
    const po = (await seller.get(`/api/stores/${s}/payment-accounts`)).body.find((a: any) => a.provider === 'orchestrator')
    expect(po.mode).toBe('sandbox')
    expect(po.sandbox.secretKey).toBeTruthy()
    expect(po.sandbox.webhookSecret).toBeTruthy()
    expect(po.live.secretKey).toBeNull()
  })
})
