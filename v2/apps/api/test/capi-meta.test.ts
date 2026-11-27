import { afterEach, describe, expect, mock, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { checkoutSettings, users } from '../src/db/schema'
import { capiPayload, phoneForMeta, sendCapiEvent, splitName } from '../src/services/notify'
import { Client } from './helpers'

/** API Conversions de Meta : données au bon format, journal visible, nouvelles tentatives. */
const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})
const mockFetch = (handler: (url: string, init?: RequestInit) => Response | Promise<Response>) => {
  globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => handler(String(input instanceof Request ? input.url : input), init)) as unknown as typeof fetch
}
const sha = (s: string) => new Bun.CryptoHasher('sha256').update(s).digest('hex')

const base = {
  pixelId: '472781488939349',
  accessToken: 'jeton-secret',
  eventName: 'Purchase' as const,
  eventId: 'evt-123',
  eventTime: new Date('2026-11-27T10:00:00Z'),
  sourceUrl: 'https://ab-academy.zurisell.store/p/prd_X',
  value: 7400,
  currency: 'XOF',
  user: { email: ' Awa@Mail.com ', phone: '97 00 00 00', name: 'Awa Diallo Kone', city: 'Abomey Calavi', country: 'BJ', ip: '41.1.2.3', userAgent: 'Mozilla/5.0', fbp: 'fb.1.1.123', fbc: 'fb.1.1.abc' },
  contentIds: ['prd_X'],
  contents: [{ id: 'prd_X', quantity: 2, item_price: 3700 }],
  contentName: 'Formation',
  orderId: 'ZR-1001',
}

describe('API Conversions de Meta', () => {
  test('téléphone international, prénom et nom', () => {
    expect(phoneForMeta('97 00 00 00', 'BJ')).toBe('22997000000')
    expect(phoneForMeta('+229 01 97 00 00 00', 'BJ')).toBe('2290197000000')
    expect(phoneForMeta('0803 123 4567', 'NG')).toBe('2348031234567')
    expect(phoneForMeta('00225 07 00 00 00 00', 'CI')).toBe('2250700000000')
    expect(phoneForMeta('229 97000000', 'BJ')).toBe('22997000000')
    expect(splitName('Awa Diallo Kone')).toEqual({ fn: 'Awa', ln: 'Diallo Kone' })
  })

  test('données hachées en SHA-256, IP et navigateur en clair, code de test', () => {
    const p = capiPayload({ ...base, testEventCode: 'TEST123' })
    const d = p.data[0]!
    expect(d).toMatchObject({ event_name: 'Purchase', event_id: 'evt-123', action_source: 'website', event_time: 1795773600 })
    expect(d.user_data).toMatchObject({
      em: sha('awa@mail.com'),
      ph: sha('22997000000'),
      fn: sha('awa'),
      ln: sha('diallo kone'),
      ct: sha('abomeycalavi'),
      country: sha('bj'),
      external_id: sha('22997000000'),
      client_ip_address: '41.1.2.3',
      client_user_agent: 'Mozilla/5.0',
      fbp: 'fb.1.1.123',
      fbc: 'fb.1.1.abc',
    })
    expect(d.custom_data).toMatchObject({ value: 7400, currency: 'XOF', content_ids: ['prd_X'], content_type: 'product', order_id: 'ZR-1001', num_items: 2 })
    expect(p).toMatchObject({ test_event_code: 'TEST123' })
    expect(JSON.stringify(p)).not.toContain('jeton-secret')
  })

  test('réponse de Meta journalisée ; refus sans nouvel essai ; coupure réseau retentée puis signalée', async () => {
    await db.insert(users).values({ email: 'capi-meta@test.dev', name: 'Capi', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    const owner = new Client()
    await owner.post('/api/auth/login', { email: 'capi-meta@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Capi Shop', slug: 'capi-meta-shop', currency: 'XOF' })).body.id
    await owner.put(`/api/stores/${s}/tracking`, { facebookPixelId: '472781488939349' })

    let calls = 0
    mockFetch((url) => {
      calls++
      expect(url).toStartWith('https://graph.facebook.com/v21.0/472781488939349/events')
      return Response.json({ events_received: 1, fbtrace_id: 'AbC123' })
    })
    const ok = await sendCapiEvent({ ...base, storeId: s })
    expect(ok).toMatchObject({ ok: true, eventsReceived: 1, fbtraceId: 'AbC123' })

    mockFetch(() => {
      calls++
      return Response.json({ error: { message: 'Invalid OAuth access token', fbtrace_id: 'Err9' } }, { status: 400 })
    })
    calls = 0
    const refused = await sendCapiEvent({ ...base, storeId: s })
    expect(refused).toMatchObject({ ok: false, status: 400, error: 'Invalid OAuth access token' })
    expect(calls).toBe(1)

    calls = 0
    mockFetch(() => {
      calls++
      return new Response('down', { status: 503 })
    })
    await expect(sendCapiEvent({ ...base, storeId: s })).rejects.toThrow()
    expect(calls).toBe(3)

    const [row] = await db.select({ log: checkoutSettings.capiLog }).from(checkoutSettings).where(eq(checkoutSettings.storeId, s))
    expect(row!.log.map((l) => [l.ok, l.status])).toEqual([
      [false, 503],
      [false, 400],
      [true, 200],
    ])
    expect(row!.log[2]).toMatchObject({ event: 'Purchase', ref: 'ZR-1001', eventsReceived: 1, fbtraceId: 'AbC123' })
  }, 20_000)

  test('bouton de test et InitiateCheckout côté serveur (même event_id que le navigateur)', async () => {
    await db.insert(users).values({ email: 'capi-test@test.dev', name: 'CapiTest', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    const owner = new Client()
    await owner.post('/api/auth/login', { email: 'capi-test@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Capi Test', slug: 'capi-test-shop', currency: 'XOF' })).body.id
    const prd = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Gel', isActive: true, price: 7500 })).body.id
    await owner.put(`/api/stores/${s}/tracking`, { facebookPixelId: '472781488939349', facebookAccessToken: 'jeton-boutique' })
    expect((await owner.post(`/api/stores/${s}/tracking/capi-test`)).body.code).toBe('no_test_code')
    await owner.put(`/api/stores/${s}/tracking`, { facebookPixelId: '472781488939349', facebookTestEventCode: 'TEST777' })

    const sent: { url: string; body: Record<string, any> }[] = []
    mockFetch((url, init) => {
      sent.push({ url, body: JSON.parse(String(init?.body)) })
      return Response.json({ events_received: 1, fbtrace_id: 'Tr1' })
    })
    const t = await owner.post(`/api/stores/${s}/tracking/capi-test`)
    expect(t.body).toMatchObject({ ok: true, eventsReceived: 1, fbtraceId: 'Tr1' })
    expect(sent[0]!.body).toMatchObject({ test_event_code: 'TEST777', data: [{ event_name: 'PageView' }] })
    expect(sent[0]!.url).toContain('access_token=jeton-boutique')
    const cfg = await owner.get(`/api/stores/${s}/checkout-settings`)
    expect(cfg.body.tracking.capiLog[0]).toMatchObject({ event: 'PageView', ok: true, test: true })
    expect(JSON.stringify(cfg.body)).not.toContain('jeton-boutique')

    const visitor = new Client()
    visitor.headers = { 'user-agent': 'Mozilla/5.0 (iPhone)' }
    const ic = await visitor.post('/api/v1/capi/checkout', { storeId: s, productId: prd, eventId: 'ic_abc12345', fbp: 'fb.1.1.9', url: 'https://capi-test-shop.zurisell.store/p/x' })
    expect(ic.status).toBe(204)
    await Bun.sleep(50)
    const last = sent.at(-1)!.body
    expect(last.data[0]).toMatchObject({ event_name: 'InitiateCheckout', event_id: 'ic_abc12345', custom_data: { value: 7500, currency: 'XOF', content_ids: [prd] }, user_data: { fbp: 'fb.1.1.9', client_user_agent: 'Mozilla/5.0 (iPhone)' } })
  }, 20_000)
})
