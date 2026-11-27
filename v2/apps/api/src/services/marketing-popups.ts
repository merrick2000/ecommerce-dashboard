/**
 * Popups marketing pour une page de vente : seulement celles qui visent ce produit,
 * avec leur code promo vérifié (actif, dans ses dates, pas épuisé, valable sur ce produit).
 * Un code devenu invalide n'est jamais montré : la popup s'affiche sans lui.
 */
import { and, eq, inArray } from 'drizzle-orm'
import { marketingPopupSchema, type CheckoutSettings, type MarketingPopup, type ProductContent } from '@zuri/shared'
import { db } from '../db/client'
import { promoCodes } from '../db/schema'

export type PublicPopupPromo = { code: string; type: 'percentage' | 'fixed'; value: number; endsAt: string | null; minSubtotal: number | null }

export async function popupsForProduct(storeId: string, productId: string, content: Pick<ProductContent, 'marketingPopups'>, settings: Pick<CheckoutSettings, 'marketingPopups'> | undefined, now = new Date()) {
  if (content.marketingPopups === 'off') return []
  // Popups enregistrées avant un nouveau réglage : valeurs par défaut complétées (design, moments…).
  const list = (settings?.marketingPopups ?? [])
    .map((p) => marketingPopupSchema.safeParse(p))
    .filter((r): r is { success: true; data: MarketingPopup } => r.success)
    .map((r) => r.data)
    .filter((p) => p.enabled && (p.scope === 'all' || p.productIds.includes(productId)))
  if (!list.length) return []
  const codes = [...new Set(list.map((p) => p.promoCode).filter((c): c is string => Boolean(c)))]
  const rules = codes.length ? await db.select().from(promoCodes).where(and(eq(promoCodes.storeId, storeId), inArray(promoCodes.code, codes))) : []
  const valid = new Map<string, PublicPopupPromo>()
  for (const r of rules) {
    const ok = r.isActive && (!r.startsAt || r.startsAt <= now) && (!r.endsAt || r.endsAt > now) && (r.maxUses == null || r.usedCount < r.maxUses) && (!r.productIds.length || r.productIds.includes(productId))
    if (ok) valid.set(r.code, { code: r.code, type: r.type, value: Number(r.value), endsAt: r.endsAt?.toISOString() ?? null, minSubtotal: r.minSubtotal == null ? null : Number(r.minSubtotal) })
  }
  return list.map(({ scope: _s, productIds: _p, promoCode, ...p }) => {
    const promo = promoCode ? (valid.get(promoCode) ?? null) : null
    return {
      ...p,
      promo,
      // Sans code valable : pas de compte à rebours lié au code, pas de numéro demandé pour un code absent.
      countdown: p.countdown === 'promo_end' && !promo?.endsAt ? ('none' as const) : p.countdown,
      collectPhone: p.collectPhone && Boolean(promo),
    }
  })
}
export type PublicMarketingPopup = Awaited<ReturnType<typeof popupsForProduct>>[number]
