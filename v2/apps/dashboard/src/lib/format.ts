const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const FCFA = new Set(['XOF', 'XAF'])

/** 15 000 FCFA, 12,50 €… */
export function money(amount: number | null | undefined, currency = 'XOF'): string {
  const n = Number(amount ?? 0)
  if (FCFA.has(currency)) return `${nf0.format(n)} FCFA`
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
  } catch {
    return `${nf.format(n)} ${currency}`
  }
}

export const currencyLabel = (c: string) => (FCFA.has(c) ? 'FCFA' : c)

export const num = (n: number | null | undefined) => nf0.format(Number(n ?? 0))

export function percent(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${nf.format(n)} %`
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const shortDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

export const date = (d: string | Date | null | undefined) => (d ? dateFmt.format(new Date(d)) : '—')
export const dateTime = (d: string | Date | null | undefined) => (d ? dateTimeFmt.format(new Date(d)) : '—')
export const day = (d: string) => shortDay.format(new Date(`${d}T00:00:00`))

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
/** « il y a 5 min », « hier »… pour les listes de commandes. */
export function relative(d: string | Date): string {
  const diff = (new Date(d).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'à l’instant'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return date(d)
}

/** Chiffres uniquement, pour wa.me et tel:. */
export const phoneDigits = (p: string | null | undefined) => (p ?? '').replace(/\D/g, '')

/** +22997000001 → +229 97 00 00 01 (lecture plus facile au téléphone). */
export function prettyPhone(p: string | null | undefined): string {
  if (!p) return '—'
  const m = /^\+(\d{3})(\d+)$/.exec(p)
  if (!m) return p
  return `+${m[1]} ${m[2]!.replace(/(\d{2})(?=\d)/g, '$1 ')}`
}

/** Slug d'URL depuis un nom (« Ma Boutique Été » → « ma-boutique-ete »). */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function isoDay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${nf.format(bytes / 1024)} Ko`
  return `${nf.format(bytes / 1024 / 1024)} Mo`
}
