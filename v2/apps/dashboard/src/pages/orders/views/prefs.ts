import { useEffect, useState } from 'react'

/** Préférences d'affichage par utilisateur et par boutique (navigateur local, jamais bloquant). */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

export function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback))
  useEffect(() => setValue(read(key, fallback)), [key]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (v: T) => {
    setValue(v)
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* stockage indisponible : préférence non mémorisée */
    }
  }
  return [value, set]
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

export type OrdersView = 'cards' | 'compact' | 'table'
export type Density = 'comfortable' | 'compact'

export const TABLE_COLUMNS = [
  { key: 'number', label: 'N°' },
  { key: 'date', label: 'Date' },
  { key: 'customer', label: 'Client' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'city', label: 'Ville' },
  { key: 'items', label: 'Produits' },
  { key: 'total', label: 'Total' },
  { key: 'payment', label: 'Paiement' },
  { key: 'status', label: 'Livraison' },
  { key: 'assignee', label: 'Pris par' },
  { key: 'source', label: 'Source' },
] as const
export type ColumnKey = (typeof TABLE_COLUMNS)[number]['key']

export interface OrdersPrefs {
  view: OrdersView
  density: Density
  hidden: ColumnKey[]
}
export const DEFAULT_PREFS: OrdersPrefs = { view: 'cards', density: 'comfortable', hidden: ['source'] }
