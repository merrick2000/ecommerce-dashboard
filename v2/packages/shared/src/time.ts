/**
 * Temps restant lisible, toujours avec ses unités : « 1 j 21 h 54 min », « 21 h 23 min 05 s », « 18 min 15 s », « 45 s ».
 * Au-delà d'un jour, les secondes ne servent plus à rien et sont retirées.
 */
export function formatCountdown(seconds: number, locale: 'fr' | 'en' = 'fr'): string {
  const s = Math.max(0, Math.floor(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = locale === 'en' ? 'd' : 'j'
  if (d > 0) return `${d} ${day} ${h} h ${pad(m)} min`
  if (h > 0) return `${h} h ${pad(m)} min ${pad(sec)} s`
  if (m > 0) return `${m} min ${pad(sec)} s`
  return `${sec} s`
}
