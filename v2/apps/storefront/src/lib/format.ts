/** Formatage monétaire partagé serveur / îlots (aucune dépendance). */
const ZERO_DECIMAL = new Set(['XOF', 'XAF', 'GNF', 'CDF', 'KES', 'NGN'])
const LABEL: Record<string, string> = { XOF: 'FCFA', XAF: 'FCFA', GNF: 'GNF', CDF: 'FC' }

export function money(amount: number, currency: string, locale = 'fr'): string {
  const zero = ZERO_DECIMAL.has(currency)
  const n = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
    minimumFractionDigits: zero || Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: zero ? 0 : 2,
  }).format(amount)
  const label = LABEL[currency]
  if (label) return `${n} ${label}`
  if (currency === 'EUR') return locale === 'en' ? `€${n}` : `${n} €`
  if (currency === 'USD') return `$${n}`
  return `${n} ${currency}`
}

export function roundMoney(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency) ? Math.round(amount) : Math.round(amount * 100) / 100
}
