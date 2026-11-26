import type { PaymentProvider } from '@zuri/shared'
import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'
import { and, eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { orders, paymentAccounts, paymentTransactions } from '../src/db/schema'
import { FeexPay } from '../src/payments/providers/feexpay'
import { PawaPay } from '../src/payments/providers/pawapay'
import { toMsisdn } from '../src/payments/routing'
import { reconcilePendingPayments, setClientFactory } from '../src/payments/service'
import type { PaymentProviderClient, StatusResult } from '../src/payments/types'
import { Client } from './helpers'

/** Provider simulé : on pilote ses réponses depuis le test. */
const state: Record<string, { initiate: 'ok' | 'fail' | 'redirect'; status: StatusResult; calls: number }> = {}
function fake(name: PaymentProvider): PaymentProviderClient {
  state[name] ??= { initiate: 'ok', status: { status: 'pending' }, calls: 0 }
  return {
    name,
    async initiate(req) {
      const s = state[name]!
      s.calls++
      if (s.initiate === 'fail') return { status: 'failed', error: `${name} indisponible` }
      if (s.initiate === 'redirect') return { status: 'redirect', ref: `${name}-ref-${req.orderId}`, redirectUrl: `https://${name}.test/pay` }
      return { status: 'processing', ref: `${name}-ref-${req.orderId}` }
    },
    async checkStatus() {
      return state[name]!.status
    },
    webhookRef: (p: any) => p?.ref ?? null,
  }
}

const owner = new Client()
const visitor = new Client()
let storeId = ''
let productId = ''

async function newOrder() {
  const r = await visitor.post('/api/v1/orders', { storeSlug: 'pay-shop', productId, customerName: 'Awa Diallo', customerPhone: '+22997000000', customerEmail: 'awa@test.dev' })
  expect(r.status).toBe(201)
  return r.body.order.token as string
}

beforeAll(async () => {
  setClientFactory((provider) => fake(provider))
  await owner.post('/api/auth/login', { email: 'owner@test.dev', password: 'motdepasse-solide' })
  if (!owner.cookie) await owner.post('/api/auth/register', { name: 'Owner', email: 'owner@test.dev', password: 'motdepasse-solide' })
  const s = await owner.post('/api/stores', { name: 'Pay Shop', slug: 'pay-shop', kind: 'digital' })
  storeId = s.body.id
  for (const p of ['feexpay', 'fedapay'] as const) {
    await owner.put(`/api/stores/${storeId}/payment-accounts/${p}`, { enabled: true, mode: 'sandbox', sandbox: { apiKey: 'k', shopId: 's' } })
  }
  const prod = await owner.post(`/api/stores/${storeId}/products`, { type: 'digital', name: 'Guide', isActive: true, price: 5000, delivery: { type: 'external_url', url: 'https://x.test/guide' } })
  productId = prod.body.id
})

afterAll(() => setClientFactory((provider) => fake(provider)))

describe('paiement intégré', () => {
  test('réseaux disponibles selon les moyens activés', async () => {
    const r = await visitor.get('/api/v1/stores/pay-shop/payment-networks')
    const bj = r.body.find((x: any) => x.country === 'BJ')
    expect(bj.networks).toEqual(['mtn', 'moov', 'celtiis'])
    expect(r.body.find((x: any) => x.country === 'GH')).toBeUndefined() // PawaPay non activé
  })

  test('repli automatique : FeexPay en panne → FedaPay', async () => {
    state.feexpay = { initiate: 'fail', status: { status: 'pending' }, calls: 0 }
    state.fedapay = { initiate: 'redirect', status: { status: 'pending' }, calls: 0 }
    const token = await newOrder()
    const r = await visitor.post(`/api/v1/orders/${token}/pay`, { country: 'BJ', network: 'mtn', phone: '97000000' })
    expect(r.body).toEqual({ status: 'redirect', redirectUrl: 'https://fedapay.test/pay' })
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, token))
    const txs = await db.select().from(paymentTransactions).where(eq(paymentTransactions.orderId, o!.id))
    expect(txs.map((t) => [t.provider, t.status])).toEqual([
      ['feexpay', 'failed'],
      ['fedapay', 'redirect'],
    ])
  })

  test('webhook forgé « payé » : ignoré tant que le provider ne confirme pas', async () => {
    state.feexpay = { initiate: 'ok', status: { status: 'pending' }, calls: 0 }
    const token = await newOrder()
    await visitor.post(`/api/v1/orders/${token}/pay`, { country: 'BJ', network: 'mtn', phone: '97000000' })
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, token))
    const [acc] = await db.select().from(paymentAccounts).where(and(eq(paymentAccounts.provider, 'feexpay'), eq(paymentAccounts.storeId, storeId)))
    const hook = await visitor.post(`/api/v1/webhooks/feexpay/${acc!.webhookToken}`, { ref: `feexpay-ref-${o!.id}`, status: 'SUCCESSFUL' })
    expect(hook.status).toBe(200)
    const [after] = await db.select().from(orders).where(eq(orders.id, o!.id))
    expect(after!.paymentStatus).toBe('pending')

    // Le provider confirme → le même webhook marque la commande payée.
    state.feexpay.status = { status: 'paid', amount: 5000 }
    await visitor.post(`/api/v1/webhooks/feexpay/${acc!.webhookToken}`, { ref: `feexpay-ref-${o!.id}` })
    const [paid] = await db.select().from(orders).where(eq(orders.id, o!.id))
    expect(paid!.paymentStatus).toBe('paid')
  })

  test('webhook avec un mauvais jeton d’URL : sans effet', async () => {
    const r = await visitor.post('/api/v1/webhooks/feexpay/mauvais-jeton-0000000000', { ref: 'x' })
    expect(r.status).toBe(200)
  })

  test('montant payé inférieur au total : commande non livrée, incident tracé', async () => {
    state.feexpay = { initiate: 'ok', status: { status: 'paid', amount: 100 }, calls: 0 }
    const token = await newOrder()
    await visitor.post(`/api/v1/orders/${token}/pay`, { country: 'BJ', network: 'mtn', phone: '97000000' })
    const st = await visitor.get(`/api/v1/orders/${token}/payment-status`)
    expect(st.body.status).not.toBe('paid')
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, token))
    const detail = await owner.get(`/api/stores/${storeId}/orders/${o!.id}`)
    expect(detail.body.events.some((e: any) => e.type === 'payment_amount_mismatch')).toBe(true)
  })

  test('limite de tentatives par commande', async () => {
    state.feexpay = { initiate: 'fail', status: { status: 'pending' }, calls: 0 }
    state.fedapay = { initiate: 'fail', status: { status: 'pending' }, calls: 0 }
    const token = await newOrder()
    const codes: number[] = []
    for (let i = 0; i < 4; i++) codes.push((await visitor.post(`/api/v1/orders/${token}/pay`, { country: 'BJ', network: 'mtn', phone: '97000000' })).status)
    // 2 transactions (feexpay + fedapay) par essai → bloqué au 3e essai.
    expect(codes).toEqual([424, 424, 424, 429])
  })

  test('réconciliation : rattrape un paiement confirmé après fermeture de la page', async () => {
    state.feexpay = { initiate: 'ok', status: { status: 'pending' }, calls: 0 }
    const token = await newOrder()
    await visitor.post(`/api/v1/orders/${token}/pay`, { country: 'BJ', network: 'mtn', phone: '97000000' })
    const [o] = await db.select().from(orders).where(eq(orders.accessToken, token))
    await db.update(paymentTransactions).set({ createdAt: new Date(Date.now() - 10 * 60_000) }).where(eq(paymentTransactions.orderId, o!.id))
    state.feexpay.status = { status: 'paid' }
    const res = await reconcilePendingPayments()
    expect(res.paid).toBeGreaterThanOrEqual(1)
    const [after] = await db.select().from(orders).where(eq(orders.id, o!.id))
    expect(after!.paymentStatus).toBe('paid')
  })

  test('commande COD : paiement en ligne refusé', async () => {
    // Produit physique : dans une boutique physique (une boutique ne mélange pas les deux).
    const phys = (await owner.post('/api/stores', { name: 'Pay Shop Physique', slug: 'pay-shop-physique' })).body.id
    const p = await owner.post(`/api/stores/${phys}/products`, { type: 'physical', name: 'Sac', isActive: true, price: 8000 })
    const o = await visitor.post('/api/v1/orders', { storeSlug: 'pay-shop-physique', productId: p.body.id, customerName: 'Awa', customerPhone: '+22997000000', city: 'Cotonou' })
    const r = await visitor.post(`/api/v1/orders/${o.body.order.token}/pay`, { country: 'BJ', network: 'mtn', phone: '97000000' })
    expect(r.body.code).toBe('cod_order')
  })
})

describe('clients providers (HTTP simulé)', () => {
  const realFetch = globalThis.fetch
  afterAll(() => {
    globalThis.fetch = realFetch
  })
  const respond = (body: unknown, status = 200) => {
    globalThis.fetch = mock(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
  }

  test('FeexPay : statut SUCCESSFUL → payé, montant lu', async () => {
    respond({ status: 'SUCCESSFUL', amount: 5000 })
    expect(await new FeexPay({ apiKey: 'k', shopId: 's' }).checkStatus('ref')).toMatchObject({ status: 'paid', amount: 5000 })
  })
  test('FeexPay : réponse sans référence → échec (plus de référence inventée)', async () => {
    respond({ message: 'ok' })
    const r = await new FeexPay({ apiKey: 'k', shopId: 's' }).initiate({ orderId: 'ord_test0000000001', orderNumber: 'ZR-1', amount: 5000, currency: 'XOF', phone: '97000000', country: 'BJ', network: 'mtn', customerName: null, customerEmail: null, returnUrl: '', webhookUrl: '' })
    expect(r.status).toBe('failed')
  })
  test('PawaPay : dépôt refusé → message lisible', async () => {
    respond({ status: 'REJECTED', rejectionReason: { rejectionMessage: 'Solde insuffisant' } })
    const r = await new PawaPay({ apiKey: 'k' }, 'sandbox').initiate({ orderId: 'ord_test0000000001', orderNumber: 'ZR-1', amount: 5000, currency: 'XOF', phone: '97000000', country: 'BJ', network: 'mtn', customerName: null, customerEmail: null, returnUrl: '', webhookUrl: '' })
    expect(r).toMatchObject({ status: 'failed', error: 'Solde insuffisant' })
  })
  test('numéros : indicatif ajouté pour tous les pays routés', () => {
    expect(toMsisdn('0712345678', 'KE')).toBe('254712345678')
    expect(toMsisdn('+229 97 00 00 00', 'BJ')).toBe('22997000000')
    expect(toMsisdn('677000000', 'CM')).toBe('237677000000')
  })
})
