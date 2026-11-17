import { z } from 'zod'
import { Hono } from 'hono'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { notFound } from '../lib/errors'
import { rateLimit } from '../lib/rate-limit'
import { v } from '../lib/validate'
import { acceptInvitation, previewInvitation } from '../services/team'
import { loadMe } from './auth'

const tokenSchema = z.string().min(20).max(200)

export const invitationRoutes = new Hono<AppEnv>()
  /** Aperçu public (sans session) : boutique, rôle, compte existant ou non. */
  .get('/:token', rateLimit({ key: 'invite-view', limit: 30, windowSec: 600 }), v('param', z.object({ token: tokenSchema })), async (c) => {
    const preview = await previewInvitation(c.req.valid('param').token)
    if (!preview) throw notFound('Invitation')
    return c.json(preview)
  })
  .post('/accept', requireAuth, rateLimit({ key: 'invite-accept', limit: 20, windowSec: 600 }), v('json', z.object({ token: tokenSchema })), async (c) => {
    const user = c.get('user')
    await acceptInvitation(user, c.req.valid('json').token)
    return c.json(await loadMe(user))
  })
