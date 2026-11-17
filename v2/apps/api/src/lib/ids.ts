import { ID_PREFIXES } from '@zuri/shared'

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES]

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Identifiant public : `shp_7Kq2mX9vB3nRtYwE`, préfixe + 16 caractères base62 tirés
 * uniformément (rejet des octets ≥ 248 pour éviter le biais du modulo). ~95 bits d'aléa.
 */
export function newId(prefix: IdPrefix, length = 16): string {
  let out = ''
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2))
    for (const b of bytes) {
      if (b < 248) out += ALPHABET[b % 62]
      if (out.length === length) break
    }
  }
  return `${prefix}_${out}`
}
