/**
 * Panier de la boutique, gardé dans le navigateur (identifiants seulement : prix et disponibilité
 * sont toujours relus par l'API). Un panier par boutique ; l'événement « sf-cart » prévient l'affichage.
 */
import { getJSON, setJSON } from './storage'

export interface CartItem {
  productId: string
  variantId: number | null
  quantity: number
}

const key = (storeId: string) => `sf_cart_${storeId}`

export const readCart = (storeId: string): CartItem[] => (getJSON<CartItem[]>(key(storeId)) ?? []).filter((i) => i && typeof i.productId === 'string').slice(0, 20)

function write(storeId: string, items: CartItem[]) {
  setJSON(key(storeId), items.slice(0, 20))
  window.dispatchEvent(new CustomEvent('sf-cart', { detail: { storeId } }))
}

export function addToCart(storeId: string, item: CartItem) {
  const items = readCart(storeId)
  const same = items.find((i) => i.productId === item.productId && i.variantId === item.variantId)
  if (same) same.quantity = Math.min(50, same.quantity + item.quantity)
  else items.push({ ...item, quantity: Math.min(50, Math.max(1, item.quantity)) })
  write(storeId, items)
}

export function setCartQuantity(storeId: string, productId: string, variantId: number | null, quantity: number) {
  const items = readCart(storeId)
    .map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, quantity: Math.min(50, quantity) } : i))
    .filter((i) => i.quantity > 0)
  write(storeId, items)
}

export const removeFromCart = (storeId: string, productId: string, variantId: number | null) => setCartQuantity(storeId, productId, variantId, 0)

export const clearCart = (storeId: string) => write(storeId, [])

export const cartCount = (storeId: string) => readCart(storeId).reduce((n, i) => n + i.quantity, 0)

/** Ligne de panier telle que renvoyée par l'API (prix réels). */
export interface CartLine {
  productId: string
  variantId: number | null
  name?: string
  variantName?: string | null
  image?: string | null
  type?: 'physical' | 'digital'
  paymentMethod?: 'cod' | 'native' | 'integration'
  unitPrice?: number
  quantity?: number
  total?: number
  currency?: string
  available: boolean
}
