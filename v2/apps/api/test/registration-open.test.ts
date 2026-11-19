import { describe, expect, test } from 'bun:test'
import { env } from '../src/lib/env'
import { Client } from './helpers'

/** Mode par défaut en production : n'importe qui peut créer son compte. */
describe('inscriptions ouvertes', () => {
  test('un nouveau vendeur peut s’inscrire même si des comptes existent', async () => {
    const previous = env.REGISTRATION_OPEN
    env.REGISTRATION_OPEN = 'true'
    try {
      const r = await new Client().post('/api/auth/register', { name: 'Nouveau Vendeur', email: `nouveau-${Date.now()}@test.dev`, password: 'motdepasse-solide' })
      expect(r.status).toBe(201)
      expect(r.body.isPlatformAdmin).toBe(false)
      expect((await new Client().get('/api/auth/providers')).body.registrationOpen).toBe(true)
    } finally {
      env.REGISTRATION_OPEN = previous
    }
  })
})
