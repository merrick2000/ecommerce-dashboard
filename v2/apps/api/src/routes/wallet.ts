/**
 * Portefeuille de la boutique (produits digitaux encaissés par Zuri) : soldes, historique, demandes de retrait.
 * Réservé au propriétaire et aux personnes qui gèrent les paiements.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { v } from '../lib/validate'
import { logActivity } from '../services/activity'
import { closeWithdrawal, commissionFor, requestWithdrawal, walletBalances, walletConfig, walletHistory } from '../services/wallet'

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive().max(100_000_000),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, 'Numéro invalide'),
  network: z.string().trim().min(2).max(40),
  country: z.string().length(2).toUpperCase(),
  holderName: z.string().trim().max(120).optional(),
})

export const walletRoutes = new Hono<AppEnv>()
  .use(requirePermission('payments.manage'))
  .get('/', async (c) => {
    const store = c.get('store')
    const cfg = await walletConfig()
    if (!store.walletEnabled) return c.json({ enabled: false, currency: store.currency })
    const [balances, history, commission] = await Promise.all([walletBalances(store.id), walletHistory(store.id), commissionFor(store)])
    return c.json({
      enabled: true,
      currency: store.currency,
      ...balances,
      commissionPct: commission.pct,
      holdDays: cfg.holdDays,
      minWithdrawal: cfg.minWithdrawal,
      payoutTo: store.walletPayoutTo ?? null,
      ...history,
    })
  })
  .post('/withdrawals', v('json', withdrawalSchema), async (c) => {
    const store = c.get('store')
    const user = c.get('user')
    const w = await requestWithdrawal(store, user.id, c.req.valid('json'))
    await logActivity(c, { entityType: 'store', entityId: store.id, entityLabel: store.name, action: 'withdrawal_requested', message: `Retrait demandé : ${w.amount} ${w.currency} vers ${w.network} ${w.phone}` }).catch(() => undefined)
    return c.json(w, 201)
  })
  .post('/withdrawals/:wid/cancel', v('param', z.object({ wid: z.coerce.number().int().positive() })), async (c) => {
    const store = c.get('store')
    const w = await closeWithdrawal(c.req.valid('param').wid, 'cancelled', { userId: c.get('user').id, storeId: store.id })
    return c.json(w)
  })
