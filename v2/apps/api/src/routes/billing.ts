import { billingCheckoutSchema, PLANS } from '@zuri/shared'
import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { HttpError } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { billingGateway, billingHistory, billingNetworks, refreshBillingPayment, startBillingPayment } from '../services/billing'
import { countOwnedStores, planForUser, resolveFeatures } from '../services/platform'

export const billingRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  /** Formule actuelle, formules disponibles, utilisation, historique. */
  .get('/', async (c) => {
    const user = c.get('user')
    const features = await resolveFeatures(user)
    return c.json({
      plan: await planForUser(user),
      plans: Object.values(PLANS),
      usage: { stores: await countOwnedStores(user.id) },
      canPay: features.billing,
      networks: features.billing ? await billingNetworks() : [],
      /** Payment Orchestrator (widget) quand le compte de la plateforme est configuré, sinon paiement direct. */
      gateway: features.billing ? await billingGateway() : { kind: 'direct' as const },
      payments: await billingHistory(user.id),
    })
  })
  .post('/checkout', rateLimit({ key: 'billing', limit: 10, windowSec: 600 }), v('json', billingCheckoutSchema), async (c) => {
    const user = c.get('user')
    if (!(await resolveFeatures(user)).billing) throw new HttpError(403, 'Le paiement des abonnements n’est pas encore ouvert. Tu seras prévenu.', 'billing_disabled')
    return c.json(await startBillingPayment(user, c.req.valid('json')))
  })
  .get('/payments/:id', v('param', z.object({ id: z.coerce.number().int().positive() })), async (c) => {
    const status = await refreshBillingPayment(c.req.valid('param').id, c.get('user').id)
    return c.json({ status, plan: await planForUser(c.get('user')) })
  })
