/** Drapeau d'un pays (code ISO à 2 lettres) en SVG : rendu identique partout, y compris sous Windows.
 * Chaque drapeau est un fichier à part, chargé seulement quand il s'affiche. */
import { Globe } from 'lucide-react'
import { cx } from './ui'

const FLAGS = import.meta.glob<string>('../../node_modules/flag-icons/flags/4x3/*.svg', { query: '?no-inline', import: 'default', eager: true })
const urlOf = (c: string) => FLAGS[`../../node_modules/flag-icons/flags/4x3/${c}.svg`]

export function Flag({ code, className }: { code: string; className?: string }) {
  const url = urlOf(code.toLowerCase())
  if (!url) return <Globe className={cx('size-4 shrink-0 text-subtle', className)} aria-hidden />
  return <img src={url} alt="" loading="lazy" width={20} height={15} className={cx('h-[15px] w-5 shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]', className)} />
}
