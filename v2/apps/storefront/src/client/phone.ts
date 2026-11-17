/** Indicatifs (pays routés par l'API + Afrique francophone courante). */
export const DIAL: [cc: string, dial: string][] = [
  ['BJ', '229'], ['CI', '225'], ['SN', '221'], ['TG', '228'], ['BF', '226'], ['ML', '223'], ['NE', '227'], ['GN', '224'],
  ['CM', '237'], ['GA', '241'], ['CG', '242'], ['CD', '243'], ['TD', '235'], ['CF', '236'], ['MR', '222'], ['MG', '261'],
  ['MA', '212'], ['DZ', '213'], ['TN', '216'], ['GH', '233'], ['NG', '234'], ['SL', '232'], ['KE', '254'], ['RW', '250'],
  ['UG', '256'], ['TZ', '255'], ['ET', '251'], ['ZM', '260'], ['MW', '265'], ['MZ', '258'], ['LS', '266'], ['FR', '33'],
  ['BE', '32'], ['CA', '1'], ['US', '1'],
]

export const dialFor = (cc: string) => DIAL.find((d) => d[0] === cc)?.[1] ?? '229'

export const flag = (cc: string) => String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))

/**
 * Numéro international « +<indicatif><numéro> ». On NE retire PAS le 0 initial :
 * la Côte d'Ivoire (10 chiffres, 07…) et le Bénin (01…) l'intègrent désormais au numéro.
 */
export function fullPhone(dial: string, input: string): string | null {
  const raw = input.trim()
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  if (digits.startsWith('00')) {
    digits = digits.slice(2)
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  }
  // Numéro déjà saisi avec l'indicatif (ex. 22997000000).
  if (digits.startsWith(dial) && digits.length >= dial.length + 8) return digits.length <= 15 ? `+${digits}` : null
  const out = dial + digits
  return digits.length >= 7 && out.length <= 15 ? `+${out}` : null
}

export const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim())
