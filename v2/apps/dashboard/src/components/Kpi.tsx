/** Tuiles d'indicateurs (valeur, évolution, précision), partagées par le tableau de bord et le trafic. */
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cx } from './ui'

export function Delta({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  if (!previous && !current) return <span className="text-[12px] text-subtle">-</span>
  if (!previous) return <span className="text-[12px] text-subtle">nouveau</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  const good = invert ? !up : up
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-[12px] font-medium', pct === 0 ? 'text-subtle' : good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {Math.abs(pct)} %
    </span>
  )
}

export function Kpi({ label, value, icon, delta, hint, to }: { label: string; value: ReactNode; icon?: ReactNode; delta?: ReactNode; hint?: ReactNode; to?: string }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted">{label}</p>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <p className="tabular mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
      <div className="mt-1 flex min-h-4 items-center gap-2">
        {delta}
        {hint && <span className="text-[12px] text-subtle">{hint}</span>}
      </div>
    </>
  )
  const cls = 'block rounded-xl border border-line bg-surface p-4 transition-colors'
  return to ? (
    <Link to={to} className={cx(cls, 'hover:border-line-strong')}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}
