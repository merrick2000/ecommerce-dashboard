import { describe, expect, test } from 'bun:test'
import { displayPrice, evaluatePromoCode, quote, type PricedProduct, type PromoCodeRule } from '../src/services/pricing'

const product = (over: Partial<PricedProduct> = {}): PricedProduct => ({
  price: 10000,
  baseCurrency: 'XOF',
  currencyPrices: [{ currency: 'EUR', price: 15 }],
  promo: { type: 'none', value: 0, display: 'strikethrough' },
  offers: [],
  ...over,
})

const code = (over: Partial<PromoCodeRule> = {}): PromoCodeRule => ({
  id: 1,
  code: 'RELANCE10',
  type: 'percentage',
  value: 10,
  maxUses: null,
  usedCount: 0,
  minSubtotal: null,
  productIds: [],
  startsAt: null,
  endsAt: null,
  isActive: true,
  ...over,
})

describe('displayPrice', () => {
  test('prix de base sans promo', () => {
    expect(displayPrice(product(), 'XOF')).toEqual({ currency: 'XOF', regular: 10000, effective: 10000, promoPercent: null })
  })
  test('promo pourcentage arrondie au franc', () => {
    expect(displayPrice(product({ price: 9999, promo: { type: 'percentage', value: 33, display: 'strikethrough' } }), 'XOF').effective).toBe(6699)
  })
  test('promo fixe appliquée en proportion sur la devise alternative', () => {
    const p = product({ promo: { type: 'fixed', value: 2000, display: 'strikethrough' } })
    expect(displayPrice(p, 'XOF').effective).toBe(8000)
    expect(displayPrice(p, 'EUR')).toMatchObject({ currency: 'EUR', regular: 15, effective: 12, promoPercent: 20 })
  })
  test('promo fixe supérieure au prix → 0, jamais négatif', () => {
    expect(displayPrice(product({ promo: { type: 'fixed', value: 50000, display: 'strikethrough' } }), 'XOF').effective).toBe(0)
  })
  test('prix de variante prioritaire', () => {
    expect(displayPrice(product(), 'XOF', { price: 12000 }).effective).toBe(12000)
  })
})

describe('evaluatePromoCode', () => {
  test('code expiré refusé', () => {
    expect(evaluatePromoCode(code({ endsAt: new Date('2020-01-01') }), 10000, ['prd_1'], 'XOF')).toEqual({ ok: false, reason: 'Code expiré' })
  })
  test('code épuisé refusé', () => {
    expect(evaluatePromoCode(code({ maxUses: 5, usedCount: 5 }), 10000, ['prd_1'], 'XOF').ok).toBe(false)
  })
  test('code limité à d’autres produits refusé', () => {
    expect(evaluatePromoCode(code({ productIds: ['prd_2'] }), 10000, ['prd_1'], 'XOF').ok).toBe(false)
  })
  test('remise fixe plafonnée au sous-total', () => {
    expect(evaluatePromoCode(code({ type: 'fixed', value: 99999 }), 10000, ['prd_1'], 'XOF')).toEqual({ ok: true, discount: 10000 })
  })
})

describe('quote', () => {
  test('commande COD avec offre, code promo et livraison', () => {
    const q = quote({
      product: product({ offers: [{ id: 'x2', quantity: 2, price: 18000 }] }),
      storeCurrency: 'XOF',
      quantity: 1,
      offerId: 'x2',
      promoCode: code(),
      productId: 'prd_1',
      zone: { fee: 1500, freeAbove: null },
    })
    expect(q).toEqual({
      currency: 'XOF',
      quantity: 2,
      unitPrice: 9000,
      subtotal: 18000,
      discount: 1800,
      shippingFee: 1500,
      total: 17700,
      offerId: 'x2',
      promoError: null,
    })
  })
  test('livraison offerte au-dessus du seuil', () => {
    const q = quote({ product: product(), storeCurrency: 'XOF', quantity: 3, productId: 'prd_1', zone: { fee: 1500, freeAbove: 25000 } })
    expect(q.shippingFee).toBe(0)
    expect(q.total).toBe(30000)
  })
  test('code invalide : commande acceptée sans remise, raison renvoyée', () => {
    const q = quote({ product: product(), storeCurrency: 'XOF', quantity: 1, productId: 'prd_1', promoCode: code({ isActive: false }) })
    expect(q.discount).toBe(0)
    expect(q.promoError).toBe('Code inactif')
  })
  test('offre inconnue ignorée', () => {
    expect(quote({ product: product(), storeCurrency: 'XOF', quantity: 2, offerId: 'nope', productId: 'prd_1' }).subtotal).toBe(20000)
  })
})

import { localMidnight } from '../src/routes/stats'
describe('fuseaux horaires des stats', () => {
  test('minuit à Cotonou (UTC+1) = 23h UTC la veille', () => {
    expect(localMidnight('2026-11-17', 'Africa/Porto-Novo').toISOString()).toBe('2026-11-16T23:00:00.000Z')
  })
  test('Abidjan (UTC+0)', () => {
    expect(localMidnight('2026-11-17', 'Africa/Abidjan').toISOString()).toBe('2026-11-17T00:00:00.000Z')
  })
  test('Paris en été (UTC+2)', () => {
    expect(localMidnight('2026-07-01', 'Europe/Paris').toISOString()).toBe('2026-06-30T22:00:00.000Z')
  })
})
