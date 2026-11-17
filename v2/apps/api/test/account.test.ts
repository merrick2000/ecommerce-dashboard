import { describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { db } from '../src/db/client'
import { passwordResets, sessions, userDevices, users } from '../src/db/schema'
import { sha256 } from '../src/lib/crypto'
import { enqueued } from '../src/jobs/queue'
import { describeDevice } from '../src/services/account'
import { Client } from './helpers'

const EMAIL = 'compte@test.dev'
const PASSWORD = 'motdepasse-initial'

/** Les fichiers de test partagent la base : ce compte est créé directement (inscriptions fermées ailleurs). */
async function ensureUser() {
  const [u] = await db.select().from(users).where(eq(users.email, EMAIL)).limit(1)
  if (u) return u
  const [created] = await db.insert(users).values({ email: EMAIL, name: 'Awa Diallo', passwordHash: await Bun.password.hash(PASSWORD, { algorithm: 'argon2id' }) }).returning()
  return created!
}

const noticesFor = (userId: number, kind: string) => enqueued.filter((j) => j.name === 'account.notify' && (j.data as { userId: number; kind: string }).userId === userId && (j.data as { kind: string }).kind === kind)

async function createReset(userId: number, opts: { expired?: boolean } = {}) {
  const token = `jeton-de-test-${crypto.randomUUID()}`
  await db.insert(passwordResets).values({ id: sha256(token), userId, expiresAt: new Date(Date.now() + (opts.expired ? -60_000 : 30 * 60_000)) })
  return token
}

describe('nouvel appareil', () => {
  test('premier appareil : référence, pas d’alerte ; même appareil ensuite : pas d’alerte', async () => {
    const user = await ensureUser()
    const laptop = new Client()
    expect((await laptop.post('/api/auth/login', { email: EMAIL, password: PASSWORD })).status).toBe(200)
    expect([...laptop.jar.keys()].some((k) => k.includes('zuri_device'))).toBe(true)
    expect(noticesFor(user.id, 'new-login')).toHaveLength(0)
    expect((await laptop.post('/api/auth/login', { email: EMAIL, password: PASSWORD })).status).toBe(200)
    expect(noticesFor(user.id, 'new-login')).toHaveLength(0)
    const devices = await db.select().from(userDevices).where(eq(userDevices.userId, user.id))
    expect(devices).toHaveLength(1)
  })

  test('connexion depuis un autre appareil : alerte avec le contexte', async () => {
    const user = await ensureUser()
    const phone = new Client()
    expect((await phone.post('/api/auth/login', { email: EMAIL, password: PASSWORD })).status).toBe(200)
    const alerts = noticesFor(user.id, 'new-login')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]!.data).toMatchObject({ method: 'password', ip: '10.0.0.1' })
  })

  test('mot de passe faux : aucun appareil enregistré', async () => {
    const user = await ensureUser()
    const before = (await db.select().from(userDevices).where(eq(userDevices.userId, user.id))).length
    expect((await new Client().post('/api/auth/login', { email: EMAIL, password: 'mauvais-mdp' })).status).toBe(401)
    expect(await db.select().from(userDevices).where(eq(userDevices.userId, user.id))).toHaveLength(before)
  })
})

describe('mot de passe oublié', () => {
  test('réponse identique pour un email connu ou inconnu', async () => {
    const user = await ensureUser()
    const known = await new Client().post('/api/auth/password/forgot', { email: EMAIL })
    const unknown = await new Client().post('/api/auth/password/forgot', { email: 'personne@test.dev' })
    expect(known).toEqual(unknown)
    expect(known.status).toBe(200)
    await Bun.sleep(50) // l'envoi n'est pas attendu par la route
    const rows = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id))
    expect(rows).toHaveLength(1)
    expect(rows[0]!.id).toHaveLength(64) // seul le hash est stocké
  })

  test('un seul lien par minute (anti-spam)', async () => {
    const user = await ensureUser()
    await new Client().post('/api/auth/password/forgot', { email: EMAIL })
    await Bun.sleep(50)
    const rows = await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id))
    expect(rows).toHaveLength(1)
  })

  test('réinitialisation : nouveau mot de passe, autres sessions coupées, alerte envoyée', async () => {
    const user = await ensureUser()
    const old = new Client()
    await old.post('/api/auth/login', { email: EMAIL, password: PASSWORD })
    expect((await old.get('/api/auth/me')).status).toBe(200)

    const token = await createReset(user.id)
    const browser = new Client()
    const r = await browser.post('/api/auth/password/reset', { token, password: 'nouveau-mdp-solide' })
    expect(r.status).toBe(200)
    expect(r.body.email).toBe(EMAIL)
    expect((await browser.get('/api/auth/me')).status).toBe(200) // connecté directement
    expect((await old.get('/api/auth/me')).status).toBe(401) // l'ancienne session est tombée
    expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(1)
    expect(noticesFor(user.id, 'password-changed')).toHaveLength(1)
    // L'ancien lien demandé plus haut est invalidé lui aussi.
    expect((await db.select().from(passwordResets).where(eq(passwordResets.userId, user.id))).filter((x) => !x.usedAt)).toHaveLength(0)

    expect((await new Client().post('/api/auth/login', { email: EMAIL, password: PASSWORD })).status).toBe(401)
    expect((await new Client().post('/api/auth/login', { email: EMAIL, password: 'nouveau-mdp-solide' })).status).toBe(200)
  })

  test('lien déjà utilisé, expiré ou inventé : refusé', async () => {
    const user = await ensureUser()
    const token = await createReset(user.id)
    expect((await new Client().post('/api/auth/password/reset', { token, password: 'encore-un-autre-mdp' })).status).toBe(200)
    const reuse = await new Client().post('/api/auth/password/reset', { token, password: 'encore-un-autre-mdp' })
    expect(reuse.status).toBe(400)
    expect(reuse.body.code).toBe('reset_invalid')
    const expired = await createReset(user.id, { expired: true })
    expect((await new Client().post('/api/auth/password/reset', { token: expired, password: 'encore-un-autre-mdp' })).status).toBe(400)
    expect((await new Client().post('/api/auth/password/reset', { token: 'x'.repeat(40), password: 'encore-un-autre-mdp' })).status).toBe(400)
  })

  test('mot de passe trop court refusé', async () => {
    const user = await ensureUser()
    const token = await createReset(user.id)
    expect((await new Client().post('/api/auth/password/reset', { token, password: 'court' })).status).toBe(422)
  })
})

describe('describeDevice', () => {
  test('navigateurs et systèmes courants', () => {
    expect(describeDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36')).toBe('Chrome sur Windows')
    expect(describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).toBe('Safari sur iPhone')
    expect(describeDevice('Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36')).toBe('Samsung Internet sur Android')
    expect(describeDevice(null)).toBe('Appareil inconnu')
  })
})
