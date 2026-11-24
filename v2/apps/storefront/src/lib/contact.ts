/**
 * Coordonnées de contact de Zuri (réglées dans le super admin), gardées 5 minutes en mémoire :
 * le bouton WhatsApp des pages marketing ne coûte pas un appel à l'API par page vue.
 */
import { apiGet } from './api'

export interface ContactInfo {
  email: string
  whatsapp: string | null
}

const FALLBACK: ContactInfo = { email: 'contact@zurisell.store', whatsapp: null }
let cache: { at: number; value: ContactInfo } | null = null

export async function contactInfo(): Promise<ContactInfo> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.value
  try {
    const value = await apiGet<ContactInfo>('/platform/contact', { timeoutMs: 2500 })
    cache = { at: Date.now(), value }
    return value
  } catch {
    return cache?.value ?? FALLBACK
  }
}

export const waLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
