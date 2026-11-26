/**
 * Étapes du vendeur (ouverture de la création de produit, erreur à l'enregistrement…), envoyées sans bloquer
 * l'écran : elles servent au super admin à comprendre pourquoi une boutique reste sans produit.
 */
import { api } from './api'

type SellerEvent = 'product_editor_open' | 'product_import_open' | 'product_save_error'

export function trackSeller(type: SellerEvent, storeId: string | undefined, data?: Record<string, string | number | boolean | string[]>) {
  void api.post('/seller/events', { type, ...(storeId ? { storeId } : {}), ...(data ? { data } : {}) }).catch(() => undefined)
}
