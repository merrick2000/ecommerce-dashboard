/** Repères partagés par les pages Trafic et En direct : canaux d'acquisition et noms de pays. */

export type Channel = 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'google' | 'youtube' | 'snapchat' | 'telegram' | 'x' | 'search' | 'email' | 'sms' | 'campaign' | 'referral' | 'direct'

export const CHANNEL: Record<Channel, { label: string; color: string }> = {
  facebook: { label: 'Facebook', color: '#1877F2' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  tiktok: { label: 'TikTok', color: 'var(--fg)' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  google: { label: 'Google', color: '#EA4335' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  snapchat: { label: 'Snapchat', color: '#EAB308' },
  telegram: { label: 'Telegram', color: '#229ED9' },
  x: { label: 'X (Twitter)', color: 'var(--muted)' },
  search: { label: 'Autres moteurs', color: '#8B5CF6' },
  email: { label: 'Email', color: '#0EA5E9' },
  sms: { label: 'SMS', color: '#14B8A6' },
  campaign: { label: 'Autres campagnes', color: '#F59E0B' },
  referral: { label: 'Sites référents', color: '#64748B' },
  direct: { label: 'Accès direct', color: '#94A3B8' },
}

export const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(['fr'], { type: 'region' })
    return (code: string) => (code === 'XX' ? 'Inconnu' : (dn.of(code) ?? code))
  } catch {
    return (code: string) => (code === 'XX' ? 'Inconnu' : code)
  }
})()

/** Il y a combien de temps, en bref : « 12 s », « 4 min », « 2 h ». */
export function ago(at: string) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(at)) / 1000))
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`
}
