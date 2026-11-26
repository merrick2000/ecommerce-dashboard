import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { checkPreviewToken, previewToken } from '../src/services/preview'
import { Client } from './helpers'

/** Aperçu d'un produit depuis l'édition : actif ou non, jeton signé, jamais mis en cache. */
const owner = new Client()
const visitor = new Client()

describe('aperçu produit', () => {
  test('jeton : propre au produit, expire', () => {
    const { token } = previewToken('prd_AAAAAAAAAAAAAAAA')
    expect(checkPreviewToken('prd_AAAAAAAAAAAAAAAA', token)).toBe(true)
    expect(checkPreviewToken('prd_BBBBBBBBBBBBBBBB', token)).toBe(false)
    expect(checkPreviewToken('prd_AAAAAAAAAAAAAAAA', previewToken('prd_AAAAAAAAAAAAAAAA', Date.now() - 7 * 3600_000).token)).toBe(false)
    expect(checkPreviewToken('prd_AAAAAAAAAAAAAAAA', 'faux')).toBe(false)
  })

  test('produit en brouillon visible seulement avec le jeton', async () => {
    await db.insert(users).values({ email: 'apercu@test.dev', name: 'Apercu', passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
    await owner.post('/api/auth/login', { email: 'apercu@test.dev', password: 'motdepasse-solide' })
    const s = (await owner.post('/api/stores', { name: 'Apercu Shop', slug: 'apercu-shop', currency: 'XOF' })).body.id
    const draft = (await owner.post(`/api/stores/${s}/products`, { type: 'physical', name: 'Brouillon', isActive: false, price: 5000 })).body.id

    expect((await visitor.get(`/api/v1/checkout/apercu-shop/${draft}`)).status).toBe(404)
    expect((await visitor.get(`/api/stores/${s}/products/${draft}/preview`)).status).toBe(401)
    const link = await owner.get(`/api/stores/${s}/products/${draft}/preview`)
    expect(link.status).toBe(200)
    const r = await app_get(`/api/v1/checkout/apercu-shop/${draft}?preview=${encodeURIComponent(link.body.token)}`)
    expect(r.status).toBe(200)
    expect(r.headers.get('cache-control')).toContain('no-store')
    const body = (await r.json()) as { preview: boolean; product: { name: string; isActive: boolean } }
    expect(body).toMatchObject({ preview: true, product: { name: 'Brouillon', isActive: false } })
    expect((await visitor.get(`/api/v1/checkout/apercu-shop/${draft}?preview=1234567890.faux`)).status).toBe(404)
  })
})

async function app_get(path: string) {
  const { app } = await import('../src/app')
  return app.request(path, { headers: { 'cf-connecting-ip': '10.0.0.2' } })
}
