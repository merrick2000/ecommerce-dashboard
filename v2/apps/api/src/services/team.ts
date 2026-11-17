/**
 * Équipe : invitations, acceptation, droits des membres.
 * Règle : un membre ne voit et n'est notifié que de ce que son rôle et son périmètre produits permettent.
 */
import { canGrantRole, FULL_SCOPE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type InvitationCreate, type InvitationPreview, type MemberOptions, type StoreRole } from '@zuri/shared'
import { and, eq, exists, gt, inArray, isNull, not, sql as dsql } from 'drizzle-orm'
import { db, type Tx } from '../db/client'
import { activityLog, orderItems, orders, products, storeInvitations, storeMemberProducts, storeMembers, stores, users, type User } from '../db/schema'
import { randomToken, sha256 } from '../lib/crypto'
import { env } from '../lib/env'
import { badRequest, conflict, forbidden, HttpError } from '../lib/errors'
import { teamInviteEmail } from './emails'
import { sendEmail } from './notify'

export const INVITE_TTL_DAYS = 7
/** Statuts où une commande attend encore une action d'un membre. */
export const OPEN_STATUSES = ['new', 'unreachable', 'confirmed'] as const

export const inviteUrl = (token: string) => `${env.APP_URL.replace(/\/$/, '')}/invite?token=${encodeURIComponent(token)}`

/** Ne garde que les produits qui appartiennent bien à la boutique. */
export async function storeProductIds(storeId: string, ids: string[] | null): Promise<string[] | null> {
  if (ids === null) return null
  if (!ids.length) return []
  const rows = await db.select({ id: products.id }).from(products).where(and(eq(products.storeId, storeId), inArray(products.id, ids)))
  return rows.map((r) => r.id)
}

export async function sendInvitationEmail(opts: { storeName: string; inviterName: string; email: string; role: StoreRole; token: string }) {
  const mail = teamInviteEmail({
    storeName: opts.storeName,
    inviterName: opts.inviterName,
    roleLabel: ROLE_LABELS[opts.role],
    roleDescription: ROLE_DESCRIPTIONS[opts.role],
    acceptUrl: inviteUrl(opts.token),
    days: INVITE_TTL_DAYS,
  })
  await sendEmail(opts.email, mail.subject, mail.html, { fromName: 'Zuri', localPart: 'compte' })
}

export async function createInvitation(actor: { userId: number; name: string; role: StoreRole }, store: { id: string; name: string }, input: InvitationCreate) {
  if (!canGrantRole(actor.role, input.role)) throw forbidden('Vous ne pouvez pas attribuer ce rôle')
  const [existing] = await db
    .select({ userId: storeMembers.userId })
    .from(storeMembers)
    .innerJoin(users, eq(users.id, storeMembers.userId))
    .where(and(eq(storeMembers.storeId, store.id), eq(users.email, input.email)))
    .limit(1)
  if (existing) throw conflict('Cette personne fait déjà partie de l’équipe', 'already_member')
  const productIds = FULL_SCOPE_ROLES.includes(input.role) ? null : await storeProductIds(store.id, input.productIds)
  // Une seule invitation en attente par email : la nouvelle remplace l'ancienne.
  await db.delete(storeInvitations).where(and(eq(storeInvitations.storeId, store.id), eq(storeInvitations.email, input.email), isNull(storeInvitations.acceptedAt)))
  const token = randomToken(32)
  const [invitation] = await db
    .insert(storeInvitations)
    .values({
      tokenHash: sha256(token),
      storeId: store.id,
      email: input.email,
      role: input.role,
      productIds,
      options: input.options,
      invitedBy: actor.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86400_000),
    })
    .returning()
  if (!invitation) throw new Error('Invitation non créée')
  await sendInvitationEmail({ storeName: store.name, inviterName: actor.name, email: input.email, role: input.role, token }).catch((err) => console.error('[team] email invitation', err))
  return { invitation, token }
}

/** Nouveau lien (l'ancien ne marche plus), validité repartie pour 7 jours, email renvoyé. */
export async function resendInvitation(actor: { name: string; role: StoreRole }, store: { id: string; name: string }, invitationId: string) {
  const [inv] = await db.select().from(storeInvitations).where(and(eq(storeInvitations.id, invitationId), eq(storeInvitations.storeId, store.id), isNull(storeInvitations.acceptedAt))).limit(1)
  if (!inv) throw new HttpError(404, 'Invitation introuvable', 'not_found')
  if (!canGrantRole(actor.role, inv.role)) throw forbidden('Vous ne pouvez pas gérer cette invitation')
  const token = randomToken(32)
  await db.update(storeInvitations).set({ tokenHash: sha256(token), expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86400_000) }).where(eq(storeInvitations.id, inv.id))
  await sendInvitationEmail({ storeName: store.name, inviterName: actor.name, email: inv.email, role: inv.role, token }).catch((err) => console.error('[team] email invitation', err))
  return token
}

async function findInvitation(token: string) {
  const [row] = await db
    .select({ inv: storeInvitations, storeName: stores.name, inviterName: users.name })
    .from(storeInvitations)
    .innerJoin(stores, eq(stores.id, storeInvitations.storeId))
    .leftJoin(users, eq(users.id, storeInvitations.invitedBy))
    .where(eq(storeInvitations.tokenHash, sha256(token)))
    .limit(1)
  return row ?? null
}

export async function previewInvitation(token: string): Promise<InvitationPreview | null> {
  const row = await findInvitation(token)
  if (!row) return null
  const [account] = await db.select({ id: users.id }).from(users).where(eq(users.email, row.inv.email)).limit(1)
  return {
    storeId: row.inv.storeId,
    storeName: row.storeName,
    inviterName: row.inviterName,
    email: row.inv.email,
    role: row.inv.role,
    expired: row.inv.expiresAt.getTime() < Date.now(),
    accepted: Boolean(row.inv.acceptedAt),
    hasAccount: Boolean(account),
  }
}

/** Invitation valable (non expirée, non utilisée) pour cet email ? Utilisé pour autoriser l'inscription malgré les inscriptions fermées. */
export async function validInvitationFor(token: string, email: string) {
  const row = await findInvitation(token)
  if (!row || row.inv.acceptedAt || row.inv.expiresAt.getTime() < Date.now()) return null
  return row.inv.email === email.toLowerCase() ? row.inv : null
}

async function setMemberProducts(tx: Tx, storeId: string, userId: number, productIds: string[] | null) {
  await tx.delete(storeMemberProducts).where(and(eq(storeMemberProducts.storeId, storeId), eq(storeMemberProducts.userId, userId)))
  if (productIds?.length) await tx.insert(storeMemberProducts).values(productIds.map((productId) => ({ storeId, userId, productId }))).onConflictDoNothing()
}

/**
 * Accepte une invitation pour l'utilisateur connecté. L'invitation est liée à son email :
 * un lien transféré à quelqu'un d'autre ne donne pas accès à la boutique.
 */
export async function acceptInvitation(user: User, token: string): Promise<string> {
  const row = await findInvitation(token)
  if (!row || row.inv.acceptedAt || row.inv.expiresAt.getTime() < Date.now()) throw badRequest('Cette invitation n’est plus valable. Demandez-en une nouvelle.')
  if (row.inv.email !== user.email.toLowerCase()) throw new HttpError(403, `Cette invitation est destinée à ${row.inv.email}. Connectez-vous avec cette adresse.`, 'invite_email_mismatch')
  const inv = row.inv
  const productIds = await storeProductIds(inv.storeId, inv.productIds)
  await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(storeInvitations)
      .set({ acceptedAt: new Date(), acceptedBy: user.id })
      .where(and(eq(storeInvitations.id, inv.id), isNull(storeInvitations.acceptedAt), gt(storeInvitations.expiresAt, new Date())))
      .returning({ id: storeInvitations.id })
    if (!claimed) throw badRequest('Cette invitation n’est plus valable. Demandez-en une nouvelle.')
    const [already] = await tx.select().from(storeMembers).where(and(eq(storeMembers.storeId, inv.storeId), eq(storeMembers.userId, user.id))).limit(1)
    if (already) return // déjà membre : on ne rétrograde jamais un accès existant
    await tx.insert(storeMembers).values({ storeId: inv.storeId, userId: user.id, role: inv.role, options: inv.options, allProducts: productIds === null })
    await setMemberProducts(tx, inv.storeId, user.id, productIds)
    await tx.insert(activityLog).values({
      storeId: inv.storeId,
      userId: user.id,
      entityType: 'team',
      entityId: String(user.id),
      entityLabel: user.name,
      action: 'joined',
      message: `A rejoint l’équipe (${ROLE_LABELS[inv.role]})`,
    })
  })
  return inv.storeId
}

/** Libère les commandes en attente d'un membre qui n'y a plus accès (retiré, ou périmètre réduit). */
export async function releaseInaccessibleOrders(storeId: string, userId: number, productIds: string[] | null | 'all') {
  if (productIds === null) return // accès à tous les produits : rien à libérer
  const base = and(eq(orders.storeId, storeId), eq(orders.assignedTo, userId), inArray(orders.fulfillmentStatus, ['new', 'unreachable']))
  const outOfScope =
    productIds === 'all' || !productIds.length
      ? undefined
      : not(exists(db.select({ one: dsql`1` }).from(orderItems).where(and(eq(orderItems.orderId, orders.id), inArray(orderItems.productId, productIds)))))
  await db.update(orders).set({ assignedTo: null, assignedAt: null }).where(and(base, outOfScope))
}

export async function updateMember(storeId: string, userId: number, patch: { role: StoreRole; productIds: string[] | null; options: MemberOptions }) {
  const productIds = FULL_SCOPE_ROLES.includes(patch.role) ? null : await storeProductIds(storeId, patch.productIds)
  await db.transaction(async (tx) => {
    await tx.update(storeMembers).set({ role: patch.role, options: patch.options, allProducts: productIds === null }).where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
    await setMemberProducts(tx, storeId, userId, productIds)
  })
  await releaseInaccessibleOrders(storeId, userId, productIds)
  return productIds
}

