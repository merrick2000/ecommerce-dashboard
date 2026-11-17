/**
 * Moteur de prix — PUR (aucun accès base), donc entièrement testable.
 * Le serveur est la seule source de vérité des montants : le storefront affiche,
 * l'API recalcule toujours.
 */
import type { Promo, QuantityOffer } from '@zuri/shared'

export interface PricedProduct {
  price: number
  baseCurrency: string
  currencyPrices: { currency: string; price: number }[]
  promo: Promo
  offers: QuantityOffer[]
}

export interface PricedVariant {
  price: number | null
}

export interface PromoCodeRule {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxUses: number | null
  usedCount: number
  minSubtotal: number | null
  productIds: number[]
  startsAt: Date | null
  endsAt: Date | null
  isActive: boolean
}

export interface ZoneRule {
  fee: number
  freeAbove: number | null
}

/** Arrondi à l'unité pour les devises sans décimales usuelles (FCFA…), au centime sinon. */
const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'GNF', 'CDF', 'KES', 'NGN'])
export function roundMoney(amount: number, currency: string): number {
  if (ZERO_DECIMAL.has(currency)) return Math.round(amount)
  return Math.round(amount * 100) / 100
}

/** Prix catalogue dans la devise de la boutique, avant promo. */
export function basePrice(product: PricedProduct, storeCurrency: string, variant?: PricedVariant | null): { price: number; currency: string } {
  if (variant?.price != null) return { price: variant.price, currency: product.baseCurrency }
  if (storeCurrency !== product.baseCurrency) {
    const alt = product.currencyPrices.find((p) => p.currency === storeCurrency)
    if (alt) return { price: alt.price, currency: storeCurrency }
  }
  return { price: product.price, currency: product.baseCurrency }
}

/**
 * Applique la promo produit. Une promo « fixed » est exprimée dans la devise de base :
 * on l'applique en proportion pour rester cohérent sur les prix alternatifs.
 */
export function applyProductPromo(price: number, promo: Promo, basePriceInBaseCurrency: number, currency: string): number {
  if (promo.type === 'percentage' && promo.value > 0) {
    return roundMoney(Math.max(0, price * (1 - Math.min(promo.value, 100) / 100)), currency)
  }
  if (promo.type === 'fixed' && promo.value > 0 && basePriceInBaseCurrency > 0) {
    const ratio = Math.min(promo.value / basePriceInBaseCurrency, 1)
    return roundMoney(Math.max(0, price * (1 - ratio)), currency)
  }
  return roundMoney(price, currency)
}

export interface DisplayPrice {
  currency: string
  /** Prix barré éventuel. */
  regular: number
  /** Prix payé à l'unité. */
  effective: number
  promoPercent: number | null
}

export function displayPrice(product: PricedProduct, storeCurrency: string, variant?: PricedVariant | null): DisplayPrice {
  const { price, currency } = basePrice(product, storeCurrency, variant)
  const effective = applyProductPromo(price, product.promo, product.price, currency)
  const promoPercent = effective < price && price > 0 ? Math.round((1 - effective / price) * 100) : null
  return { currency, regular: roundMoney(price, currency), effective, promoPercent }
}

export type PromoCheck = { ok: true; discount: number } | { ok: false; reason: string }

export function evaluatePromoCode(rule: PromoCodeRule, subtotal: number, productIds: number[], currency: string, now = new Date()): PromoCheck {
  if (!rule.isActive) return { ok: false, reason: 'Code inactif' }
  if (rule.startsAt && now < rule.startsAt) return { ok: false, reason: 'Code pas encore valable' }
  if (rule.endsAt && now > rule.endsAt) return { ok: false, reason: 'Code expiré' }
  if (rule.maxUses != null && rule.usedCount >= rule.maxUses) return { ok: false, reason: 'Code épuisé' }
  if (rule.minSubtotal != null && subtotal < rule.minSubtotal) return { ok: false, reason: 'Montant minimum non atteint' }
  if (rule.productIds.length > 0 && !productIds.some((id) => rule.productIds.includes(id))) {
    return { ok: false, reason: 'Code non valable pour ce produit' }
  }
  const raw = rule.type === 'percentage' ? subtotal * (Math.min(rule.value, 100) / 100) : rule.value
  return { ok: true, discount: roundMoney(Math.min(raw, subtotal), currency) }
}

export function shippingFee(zone: ZoneRule | null, subtotalAfterDiscount: number): number {
  if (!zone) return 0
  if (zone.freeAbove != null && subtotalAfterDiscount >= zone.freeAbove) return 0
  return zone.fee
}

export interface QuoteInput {
  product: PricedProduct
  variant?: PricedVariant | null
  storeCurrency: string
  quantity: number
  offerId?: string | null
  promoCode?: PromoCodeRule | null
  productId: number
  zone?: ZoneRule | null
}

export interface Quote {
  currency: string
  quantity: number
  unitPrice: number
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  offerId: string | null
  promoError: string | null
}

/**
 * Devis complet d'une ligne de commande.
 * Une offre par quantité fixe le prix du lot (et remplace la promo produit, déjà intégrée par le vendeur).
 */
export function quote(input: QuoteInput): Quote {
  const unit = displayPrice(input.product, input.storeCurrency, input.variant)
  const currency = unit.currency
  let quantity = input.quantity
  let subtotal: number
  let offerId: string | null = null

  const offer = input.offerId ? input.product.offers.find((o) => o.id === input.offerId) : undefined
  if (offer) {
    quantity = offer.quantity
    offerId = offer.id
    subtotal = roundMoney(offer.price, currency)
  } else {
    subtotal = roundMoney(unit.effective * quantity, currency)
  }

  let discount = 0
  let promoError: string | null = null
  if (input.promoCode) {
    const check = evaluatePromoCode(input.promoCode, subtotal, [input.productId], currency)
    if (check.ok) discount = check.discount
    else promoError = check.reason
  }

  const fee = shippingFee(input.zone ?? null, subtotal - discount)
  return {
    currency,
    quantity,
    unitPrice: roundMoney(subtotal / quantity, currency),
    subtotal,
    discount,
    shippingFee: fee,
    total: roundMoney(subtotal - discount + fee, currency),
    offerId,
    promoError,
  }
}
