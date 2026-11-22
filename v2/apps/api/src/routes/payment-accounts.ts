import { PAYMENT_PROVIDERS, paymentProviderSchema, poSettingsSchema, type PaymentProvider } from '@zuri/shared'
import { po, PoError } from '../services/po'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HttpError } from '../lib/errors'
import { assertFeature, planForStore, resolveFeatures } from '../services/platform'
import { z } from 'zod'
import { db } from '../db/client'
import { paymentAccounts } from '../db/schema'
import { requirePermission } from '../lib/auth'
import { logActivity } from '../services/activity'
import type { AppEnv } from '../lib/context'
import { decryptJson, encryptJson, randomToken } from '../lib/crypto'
import { env } from '../lib/env'
import { v } from '../lib/validate'

/** Champs attendus par provider (les noms correspondent aux docs des providers). */
export const PROVIDER_FIELDS: Record<PaymentProvider, string[]> = {
  orchestrator: ['secretKey', 'webhookSecret'],
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
  /** Réglages non secrets (Payment Orchestrator : mode du widget, langue, pays et opérateurs autorisés). */
  settings: poSettingsSchema.optional(),
})

export const paymentAccountRoutes = new Hono<AppEnv>()
  .use(requirePermission('payments.manage'))
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
          webhookUrl: row ? (provider === 'orchestrator' ? `${env.APP_URL}/api/v1/webhooks/payment-orchestrator/${row.webhookToken}` : `${env.APP_URL}/api/v1/webhooks/${provider}/${row.webhookToken}`) : null,
          settings: provider === 'orchestrator' ? poSettingsSchema.parse(row?.settings ?? {}) : null,
        }
      }),
    )
  })
  .put('/:provider', v('param', z.object({ provider: paymentProviderSchema })), v('json', updateSchema), async (c) => {
    const storeId = c.get('store').id
    const { provider } = c.req.valid('param')
    const body = c.req.valid('json')
    if (!(await resolveFeatures(c.get('user'))).onlinePayments) throw new HttpError(403, 'Les paiements en ligne ne sont pas encore ouverts sur ton compte. Le paiement à la livraison reste disponible.', 'online_payments_disabled')
    await assertFeature(await planForStore(storeId), 'onlinePayments')
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
    if (provider === 'orchestrator') {
      // Le préfixe de la clé dit son mode : une clé collée sous le mauvais onglet est rangée au bon endroit
      // (avec le secret de webhook saisi au même endroit), au lieu d'être refusée.
      for (const [from, to, prefix] of [['live', 'sandbox', 'sk_test_'], ['sandbox', 'live', 'sk_live_']] as const) {
        const k = creds[from]?.secretKey
        if (k?.startsWith(prefix)) {
          const moved = { ...(creds[to] ?? {}), secretKey: k, ...(creds[from]?.webhookSecret && body[from]?.webhookSecret ? { webhookSecret: creds[from]!.webhookSecret } : {}) }
          creds[to] = moved
          const rest = { ...(creds[from] ?? {}) }
          delete rest.secretKey
          if (body[from]?.webhookSecret) delete rest.webhookSecret
          creds[from] = rest
        }
      }
      // Mode actif sans clé alors que l'autre mode en a une : on bascule sur le mode de la clé disponible.
      if (body.enabled && !creds[body.mode]?.secretKey) {
        const other = body.mode === 'live' ? 'sandbox' : 'live'
        if (creds[other]?.secretKey) body.mode = other
      }
      // Clé de test en mode test, clé live en production : une erreur ici ferait payer « pour de faux » ou l'inverse.
      for (const [m, prefix] of [['sandbox', 'sk_test_'], ['live', 'sk_live_']] as const) {
        const k = creds[m]?.secretKey
        if (k && !k.startsWith(prefix)) throw new HttpError(422, m === 'sandbox' ? 'En mode test, la clé secrète commence par sk_test_' : 'En production, la clé secrète commence par sk_live_', 'po_key_mode')
        const w = creds[m]?.webhookSecret
        if (w && !w.startsWith('whsec_')) throw new HttpError(422, 'Le secret de webhook commence par whsec_', 'po_webhook_secret')
      }
      if (body.enabled && !creds[body.mode]?.secretKey) throw new HttpError(422, 'Ajoute la clé secrète du mode choisi avant d’activer', 'po_key_missing')
    }
    const values = { enabled: body.enabled, mode: body.mode, credentialsEnc: encryptJson(creds), ...(body.settings ? { settings: body.settings } : {}) }
    if (row) await db.update(paymentAccounts).set(values).where(eq(paymentAccounts.id, row.id))
    else await db.insert(paymentAccounts).values({ storeId, provider, webhookToken: randomToken(24), ...values })
    await logActivity(c, { entityType: 'payment_account', entityLabel: provider, action: 'updated', message: `Moyen de paiement ${provider} ${body.enabled ? 'activé' : 'désactivé'} (${body.mode === 'live' ? 'production' : 'test'})` })
    return c.json({ ok: true })
  })
  /** Payment Orchestrator : test de la clé du mode actif (GET /ping). */
  .post('/orchestrator/test', async (c) => {
    const [row] = await db.select().from(paymentAccounts).where(and(eq(paymentAccounts.storeId, c.get('store').id), eq(paymentAccounts.provider, 'orchestrator'))).limit(1)
    const key = row ? decryptJson<Creds>(row.credentialsEnc, {})[row.mode]?.secretKey : undefined
    if (!key) throw new HttpError(422, 'Enregistre d’abord la clé secrète', 'po_key_missing')
    try {
      const r = await po<{ ok: boolean; merchant: { id: string; name: string }; livemode: boolean }>(key, '/ping')
      return c.json({ ok: true, merchant: r.merchant, livemode: r.livemode })
    } catch (e) {
      return c.json({ ok: false, error: e instanceof PoError ? (e.code === 'invalid_api_key' ? 'Clé invalide ou révoquée' : e.message) : 'Service injoignable' })
    }
  })
