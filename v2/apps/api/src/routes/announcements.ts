/** Annonces vues par le vendeur connecté (sous /api/announcements) : liste, fermeture, clic sur le bouton. */
import { eq, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { announcementDismissals, announcements } from '../db/schema'
import { requireAuth } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { v } from '../lib/validate'
import { activeAnnouncementsFor } from '../services/announcements'

const idParam = z.object({ id: z.coerce.number().int().positive() })

export const announcementRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) => c.json(await activeAnnouncementsFor(c.get('user').id)))
  .post('/:id/dismiss', v('param', idParam), async (c) => {
    await db.insert(announcementDismissals).values({ announcementId: c.req.valid('param').id, userId: c.get('user').id }).onConflictDoNothing()
    return c.json({ ok: true })
  })
  /** Clic sur le bouton : compté, puis l'annonce est considérée comme vue. */
  .post('/:id/click', v('param', idParam), async (c) => {
    const id = c.req.valid('param').id
    await db.update(announcements).set({ clicks: dsql`${announcements.clicks} + 1` }).where(eq(announcements.id, id))
    await db.insert(announcementDismissals).values({ announcementId: id, userId: c.get('user').id }).onConflictDoNothing()
    return c.json({ ok: true })
  })
