import { canGrantRole, invitationCreateSchema, invitationIdSchema, memberUpdateSchema, permissionsFor, ROLE_LABELS, type TeamInvitation, type TeamMember } from '@zuri/shared'
import { and, asc, eq, gt, inArray, isNull, sql as dsql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/client'
import { orders, storeInvitations, storeMemberProducts, storeMembers, users } from '../db/schema'
import { requirePermission } from '../lib/auth'
import type { AppEnv } from '../lib/context'
import { forbidden, notFound } from '../lib/errors'
import { v } from '../lib/validate'
import { logActivity } from '../services/activity'
import { createInvitation, inviteUrl, OPEN_STATUSES, releaseInaccessibleOrders, resendInvitation, updateMember } from '../services/team'

const userParam = z.object({ userId: z.coerce.number().int().positive() })
const invParam = z.object({ id: invitationIdSchema })

const invitationView = (inv: typeof storeInvitations.$inferSelect, invitedBy: string | null): TeamInvitation => ({
  id: inv.id,
  email: inv.email,
  role: inv.role,
  productIds: inv.productIds ?? null,
  options: inv.options,
  invitedBy,
  expiresAt: inv.expiresAt.toISOString(),
  createdAt: inv.createdAt.toISOString(),
})

async function loadMembers(storeId: string): Promise<TeamMember[]> {
  const rows = await db
    .select({
      member: storeMembers,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      lastLoginAt: users.lastLoginAt,
      openOrders: dsql<number>`(select count(*)::int from ${orders} where ${orders.storeId} = ${storeId} and ${orders.assignedTo} = ${storeMembers.userId} and ${inArray(orders.fulfillmentStatus, [...OPEN_STATUSES])})`,
    })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(eq(storeMembers.storeId, storeId))
    .orderBy(asc(storeMembers.createdAt))
  const scoped = rows.filter((r) => !r.member.allProducts).map((r) => r.member.userId)
  const scopes = scoped.length
    ? await db
        .select()
        .from(storeMemberProducts)
        .where(and(eq(storeMemberProducts.storeId, storeId), inArray(storeMemberProducts.userId, scoped)))
    : []
  return rows.map((r) => ({
    userId: r.member.userId,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatarUrl,
    role: r.member.role,
    productIds: r.member.allProducts || r.member.role === 'owner' || r.member.role === 'admin' ? null : scopes.filter((x) => x.userId === r.member.userId).map((x) => x.productId),
    options: r.member.options,
    lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    joinedAt: r.member.createdAt.toISOString(),
    openOrders: r.openOrders,
  }))
}

async function loadTarget(storeId: string, userId: number) {
  const [row] = await db
    .select({ member: storeMembers, name: users.name })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
    .limit(1)
  if (!row) throw notFound('Membre')
  return row
}

export const teamRoutes = new Hono<AppEnv>()
  /** Membres pouvant traiter des commandes (menu « Attribuer à », filtre du fil d'activité). */
  .get('/assignees', requirePermission('orders.view'), async (c) => {
    const rows = await db
      .select({ userId: storeMembers.userId, name: users.name, role: storeMembers.role })
      .from(storeMembers)
      .innerJoin(users, eq(users.id, storeMembers.userId))
      .where(eq(storeMembers.storeId, c.get('store').id))
      .orderBy(asc(users.name))
    return c.json(rows.filter((r) => permissionsFor(r.role).includes('orders.update')).map(({ userId, name }) => ({ userId, name })))
  })
  /** Tous les membres (filtre « par membre » du fil d'activité). */
  .get('/people', requirePermission('activity.view'), async (c) => {
    const rows = await db
      .select({ userId: storeMembers.userId, name: users.name })
      .from(storeMembers)
      .innerJoin(users, eq(users.id, storeMembers.userId))
      .where(eq(storeMembers.storeId, c.get('store').id))
      .orderBy(asc(users.name))
    return c.json(rows)
  })
  .use(requirePermission('team.manage'))
  .get('/', async (c) => {
    const storeId = c.get('store').id
    const [members, invitations] = await Promise.all([
      loadMembers(storeId),
      db
        .select({ inv: storeInvitations, invitedBy: users.name })
        .from(storeInvitations)
        .leftJoin(users, eq(users.id, storeInvitations.invitedBy))
        .where(and(eq(storeInvitations.storeId, storeId), isNull(storeInvitations.acceptedAt), gt(storeInvitations.expiresAt, new Date())))
        .orderBy(asc(storeInvitations.createdAt)),
    ])
    return c.json({ members, invitations: invitations.map((r) => invitationView(r.inv, r.invitedBy)) })
  })
  .post('/invitations', v('json', invitationCreateSchema), async (c) => {
    const store = c.get('store')
    const user = c.get('user')
    const input = c.req.valid('json')
    const { invitation, token } = await createInvitation({ userId: user.id, name: user.name, role: c.get('role') }, store, input)
    await logActivity(c, { entityType: 'team', entityId: invitation.id, entityLabel: input.email, action: 'invited', message: `Invitation envoyée (${ROLE_LABELS[input.role]})` })
    return c.json({ invitation: invitationView(invitation, user.name), inviteUrl: inviteUrl(token) }, 201)
  })
  .post('/invitations/:id/resend', v('param', invParam), async (c) => {
    const token = await resendInvitation({ name: c.get('user').name, role: c.get('role') }, c.get('store'), c.req.valid('param').id)
    return c.json({ inviteUrl: inviteUrl(token) })
  })
  .delete('/invitations/:id', v('param', invParam), async (c) => {
    const [row] = await db
      .delete(storeInvitations)
      .where(and(eq(storeInvitations.id, c.req.valid('param').id), eq(storeInvitations.storeId, c.get('store').id), isNull(storeInvitations.acceptedAt)))
      .returning({ email: storeInvitations.email })
    if (!row) throw notFound('Invitation')
    await logActivity(c, { entityType: 'team', entityLabel: row.email, action: 'invite_revoked', message: 'Invitation annulée' })
    return c.json({ ok: true })
  })
  .patch('/members/:userId', v('param', userParam), v('json', memberUpdateSchema), async (c) => {
    const store = c.get('store')
    const { userId } = c.req.valid('param')
    const patch = c.req.valid('json')
    if (userId === c.get('user').id) throw forbidden('Vous ne pouvez pas modifier votre propre accès')
    const target = await loadTarget(store.id, userId)
    const actorRole = c.get('role')
    if (target.member.role === 'owner' || !canGrantRole(actorRole, target.member.role) || !canGrantRole(actorRole, patch.role)) throw forbidden('Vous ne pouvez pas modifier ce membre')
    await updateMember(store.id, userId, patch)
    const changes: string[] = []
    if (patch.role !== target.member.role) changes.push(`${ROLE_LABELS[target.member.role]} → ${ROLE_LABELS[patch.role]}`)
    changes.push(patch.productIds === null ? 'tous les produits' : `${patch.productIds.length} produit(s)`)
    await logActivity(c, { entityType: 'team', entityId: String(userId), entityLabel: target.name, action: 'member_updated', message: `Accès modifié (${changes.join(', ')})` })
    const members = await loadMembers(store.id)
    return c.json(members.find((m) => m.userId === userId))
  })
  .delete('/members/:userId', v('param', userParam), async (c) => {
    const store = c.get('store')
    const { userId } = c.req.valid('param')
    if (userId === c.get('user').id) throw forbidden('Vous ne pouvez pas vous retirer vous-même')
    const target = await loadTarget(store.id, userId)
    if (target.member.role === 'owner' || !canGrantRole(c.get('role'), target.member.role)) throw forbidden('Vous ne pouvez pas retirer ce membre')
    // Ses commandes en attente redeviennent libres pour le reste de l'équipe.
    await releaseInaccessibleOrders(store.id, userId, 'all')
    await db.delete(storeMembers).where(and(eq(storeMembers.storeId, store.id), eq(storeMembers.userId, userId)))
    await logActivity(c, { entityType: 'team', entityId: String(userId), entityLabel: target.name, action: 'member_removed', message: 'Retiré de l’équipe' })
    return c.json({ ok: true })
  })
