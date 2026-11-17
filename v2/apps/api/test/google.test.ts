import { afterEach, describe, expect, mock, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { app } from '../src/app'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const idToken = (claims: Record<string, unknown>) =>
  `x.${Buffer.from(JSON.stringify({ iss: 'https://accounts.google.com', aud: 'test-client.apps.googleusercontent.com', exp: Math.floor(Date.now() / 1000) + 600, ...claims })).toString('base64url')}.sig`

/** Démarre le flux et renvoie le cookie + le state générés. */
async function start(next = '/stores/1') {
  const res = await app.request(`/api/auth/google/start?next=${encodeURIComponent(next)}`)
  const location = new URL(res.headers.get('location')!)
  const cookie = res.headers.get('set-cookie')!.split(';')[0]!
  return { res, location, cookie, state: location.searchParams.get('state')! }
}

async function callback(cookie: string, state: string, claims: Record<string, unknown>) {
  globalThis.fetch = mock(async () => new Response(JSON.stringify({ id_token: idToken(claims) }))) as unknown as typeof fetch
  return app.request(`/api/auth/google/callback?code=abc&state=${state}`, { headers: { cookie } })
}

describe('connexion Google', () => {
  test('providers : Google annoncé quand configuré', async () => {
    const r = await app.request('/api/auth/providers')
    expect((await r.json()).google).toBe(true)
  })

  test('start : redirection Google avec PKCE et state', async () => {
    const { res, location } = await start()
    expect(res.status).toBe(302)
    expect(location.host).toBe('accounts.google.com')
    expect(location.searchParams.get('code_challenge_method')).toBe('S256')
    expect(location.searchParams.get('redirect_uri')).toEndWith('/api/auth/google/callback')
  })

  test('state différent → refusé', async () => {
    const { cookie } = await start()
    const r = await callback(cookie, 'mauvais-state', { sub: 'g-1', email: 'x@test.dev', email_verified: true })
    expect(r.headers.get('location')).toContain('error=google_state')
  })

  test('email non vérifié par Google → refusé', async () => {
    const { cookie, state } = await start()
    const r = await callback(cookie, state, { sub: 'g-2', email: 'owner@test.dev', email_verified: false })
    expect(r.headers.get('location')).toContain('error=google_unverified')
  })

  test('compte existant (même email vérifié) : relié à Google et connecté', async () => {
    const { cookie, state } = await start('/stores/1')
    const r = await callback(cookie, state, { sub: 'g-owner', email: 'Owner@Test.dev', email_verified: true, name: 'Owner' })
    expect(r.headers.get('location')).toEndWith('/stores/1')
    const session = r.headers.getSetCookie().find((c) => c.startsWith('zuri_session=')) ?? ''
    expect(session).toContain('zuri_session=')
    const [u] = await db.select().from(users).where(eq(users.email, 'owner@test.dev'))
    expect(u!.googleSub).toBe('g-owner')
    const me = await app.request('/api/auth/me', { headers: { cookie: session.split(';')[0]! } })
    expect((await me.json()).email).toBe('owner@test.dev')
  })

  test('nouveau compte refusé quand les inscriptions sont fermées', async () => {
    const { cookie, state } = await start()
    const r = await callback(cookie, state, { sub: 'g-new', email: 'inconnu@test.dev', email_verified: true })
    expect(r.headers.get('location')).toContain('error=registration_closed')
  })

  test('redirection « next » externe neutralisée', async () => {
    const { cookie, state } = await start('//evil.example.com')
    const r = await callback(cookie, state, { sub: 'g-owner', email: 'owner@test.dev', email_verified: true })
    expect(r.headers.get('location')).not.toContain('evil')
  })
})
