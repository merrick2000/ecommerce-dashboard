import { PAYMENT_PROVIDERS, paymentProviderSchema, type PaymentProvider } from '@sellit/shared'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { paymentAccounts } from '../db/schema'
import { requireRole } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { decryptJson, encryptJson, randomToken } from '../lib/crypto'
import { env } from '../lib/env'
import { v } from '../lib/validate'

/** Champs attendus par provider (les noms correspondent aux docs des providers). */
export const PROVIDER_FIELDS: Record<PaymentProvider, string[]> = {
  feexpay: ['apiKey', 'shopId'],
  fedapay: ['apiKey', 'webhookSecret'],
  paydunya: ['masterKey', 'publicKey', 'privateKey', 'token'],
  pawapay: ['apiKey'],
  chariow: ['apiKey', 'webhookSecret'],
  maketou: ['apiKey'],
}

type Creds = Partial<Record<'sandbox' | 'live', Record<string, string>>>

const mask = (s: string) => (s.length <= 6 ? '••••' : `${s.slice(0, 3)}••••${s.slice(-3)}`)

const updateSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(['sandbox', 'live']),
  /** Valeur vide ou absente = on garde la valeur existante. `null` = effacer. */
  sandbox: z.record(z.string(), z.string().max(500).nullable()).optional(),
  live: z.record(z.string(), z.string().max(500).nullable()).optional(),
})

export const paymentAccountRoutes = new Hono<AppEnv>()
  .use(requireRole('owner'))
  .get('/', async (c) => {
    const rows = await db.select().from(paymentAccounts).where(eq(paymentAccounts.storeId, c.get('store').id))
    return c.json(
      PAYMENT_PROVIDERS.map((provider) => {
        const row = rows.find((r) => r.provider === provider)
        const creds = decryptJson<Creds>(row?.credentialsEnc, {})
        const describe = (m: 'sandbox' | 'live') => Object.fromEntries(PROVIDER_FIELDS[provider].map((f) => [f, creds[m]?.[f] ? mask(creds[m]![f]!) : null]))
        return {
          provider,
          enabled: row?.enabled ?? false,
          mode: row?.mode ?? 'sandbox',
          fields: PROVIDER_FIELDS[provider],
          sandbox: describe('sandbox'),
          live: describe('live'),
          // URL de webhook propre à cette boutique : à coller dans le dashboard du provider.
          webhookUrl: row ? `${env.APP_URL}/api/v1/webhooks/${provider}/${row.webhookToken}` : null,
        }
      }),
    )
  })
  .put('/:provider', v('param', z.object({ provider: paymentProviderSchema })), v('json', updateSchema), async (c) => {
    const storeId = c.get('store').id
    const { provider } = c.req.valid('param')
    const body = c.req.valid('json')
    const [row] = await db.select().from(paymentAccounts).where(and(eq(paymentAccounts.storeId, storeId), eq(paymentAccounts.provider, provider))).limit(1)
    const creds = decryptJson<Creds>(row?.credentialsEnc, {})
    for (const m of ['sandbox', 'live'] as const) {
      const incoming = body[m]
      if (!incoming) continue
      const current = { ...(creds[m] ?? {}) }
      for (const field of PROVIDER_FIELDS[provider]) {
        const val = incoming[field]
        if (val === null) delete current[field]
        else if (typeof val === 'string' && val.trim() !== '') current[field] = val.trim()
      }
      creds[m] = current
    }
    const values = { enabled: body.enabled, mode: body.mode, credentialsEnc: encryptJson(creds) }
    if (row) await db.update(paymentAccounts).set(values).where(eq(paymentAccounts.id, row.id))
    else await db.insert(paymentAccounts).values({ storeId, provider, webhookToken: randomToken(24), ...values })
    return c.json({ ok: true })
  })
