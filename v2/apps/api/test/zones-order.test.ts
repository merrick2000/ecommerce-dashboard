import { describe, expect, test } from 'bun:test'
import { db } from '../src/db/client'
import { users } from '../src/db/schema'
import { Client } from './helpers'

const owner = new Client()
const other = new Client()

async function login(c: Client, email: string) {
  await db.insert(users).values({ email, name: email, passwordHash: await Bun.password.hash('motdepasse-solide', { algorithm: 'argon2id' }) }).onConflictDoNothing()
  await c.post('/api/auth/login', { email, password: 'motdepasse-solide' })
}
const zone = (name: string) => ({ name, country: 'BJ', cities: [], fee: 1000, freeAbove: null, codAllowed: true, etaLabel: null, isActive: true, position: 0 })

describe('ordre des zones', () => {
  test('glisser-déposer : position = rang, zones d’une autre boutique ignorées', async () => {
    await login(owner, 'zones-a@test.dev')
    await login(other, 'zones-b@test.dev')
    const s = (await owner.post('/api/stores', { name: 'Zones A', slug: 'zones-a', currency: 'XOF' })).body.id
    const s2 = (await other.post('/api/stores', { name: 'Zones B', slug: 'zones-b', currency: 'XOF' })).body.id
    const a = (await owner.post(`/api/stores/${s}/zones`, zone('Cotonou'))).body.id
    const b = (await owner.post(`/api/stores/${s}/zones`, zone('Calavi'))).body.id
    const c = (await owner.post(`/api/stores/${s}/zones`, zone('Porto-Novo'))).body.id
    const foreign = (await other.post(`/api/stores/${s2}/zones`, zone('Lomé'))).body.id
    expect((await owner.put(`/api/stores/${s}/zones/order`, { ids: [c, a, b, foreign] })).status).toBe(200)
    const list = (await owner.get(`/api/stores/${s}/zones`)).body as { id: number; name: string; position: number }[]
    expect(list.map((z) => z.name)).toEqual(['Porto-Novo', 'Cotonou', 'Calavi'])
    const theirs = (await other.get(`/api/stores/${s2}/zones`)).body as { position: number }[]
    expect(theirs[0]!.position).toBe(0) // inchangée
  })
})
