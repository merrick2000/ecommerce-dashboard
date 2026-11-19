import type React from 'react'
import type { EffectivePlan } from '@zuri/shared'
import { PLANS } from '@zuri/shared'
import { Badge } from '@/components/ui'

export const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))
export const fdate = (iso: string | null | undefined, time = false) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }) : '-'
export const ago = (iso: string | null | undefined) => {
  if (!iso) return 'jamais'
  const d = (Date.now() - new Date(iso).getTime()) / 1000
  if (d < 3600) return `il y a ${Math.max(1, Math.round(d / 60))} min`
  if (d < 86400) return `il y a ${Math.round(d / 3600)} h`
  return `il y a ${Math.round(d / 86400)} j`
}

export function PlanBadge({ plan }: { plan: EffectivePlan }) {
  const label = plan.reason === 'launch' ? 'Lancement' : plan.reason === 'early' ? 'Pro offert' : plan.reason === 'expired' ? 'Expiré' : PLANS[plan.plan].name
  const tone = plan.reason === 'subscription' ? 'green' : plan.reason === 'expired' ? 'red' : plan.reason === 'free' ? 'neutral' : 'amber'
  return <Badge tone={tone}>{label}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  return status === 'active' ? <Badge tone="green">En ligne</Badge> : status === 'paused' ? <Badge tone="amber">En pause</Badge> : <Badge tone="red">Fermée</Badge>
}

/** Petit histogramme en barres (30 jours). */
export function Bars({ data, color = 'bg-accent' }: { data: { day: string; count: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="flex h-36 items-end gap-[3px]">
      {data.map((d) => (
        <div key={d.day} className="group relative flex-1">
          <div className={`${color} min-h-[2px] rounded-t`} style={{ height: `${(d.count / max) * 128}px` }} />
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-fg px-1.5 py-0.5 text-[11px] whitespace-nowrap text-bg group-hover:block">
            {new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : {d.count}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Ranking({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  if (!rows.length) return <p className="text-sm text-muted">Pas encore de données.</p>
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="mb-1 flex justify-between gap-2">
            <span className="truncate">{r.label}</span>
            <span className="tabular font-medium">{r.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function StatBox({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="tabular mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-muted">{sub}</p>}
    </div>
  )
}
