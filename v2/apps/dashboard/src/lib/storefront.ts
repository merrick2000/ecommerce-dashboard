/**
 * Adresses du storefront vues depuis le dashboard.
 * Production : sous-domaine de la boutique (https://<slug>.zurisell.store).
 * Développement : VITE_STOREFRONT_URL (ex. http://localhost:4321), adresses « plateforme » /<slug>/….
 */
const DEV_BASE = (import.meta.env.VITE_STOREFRONT_URL as string | undefined)?.replace(/\/$/, '')

export function storefrontProductUrl(storeSlug: string, productId: string): string {
  if (DEV_BASE) return `${DEV_BASE}/${storeSlug}/p/${productId}`
  return `https://${storeSlug}.zurisell.store/p/${productId}`
}

/** Page d'aperçu du formulaire de commande (affichable seulement dans le dashboard). */
export const formPreviewUrl = (storeSlug: string, productId: string) => `${storefrontProductUrl(storeSlug, productId)}/apercu?notrack`

/** Page d'accueil (catalogue) d'une boutique. */
export const storefrontUrl = (storeSlug: string) => (DEV_BASE ? `${DEV_BASE}/${storeSlug}` : `https://${storeSlug}.zurisell.store`)
