import { ArrowDownRight, ArrowUpRight, Banknote, PackageCheck, PhoneCall, Plus, ShoppingBag, Truck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ButtonLink, Card, cx, EmptyState, ErrorState, PageHeader, Segmented, Skeleton } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useStats } from '@/hooks/resources'
import { day, isoDay, money, num, percent } from '@/lib/format'
import type { StatsOverview } from '@/lib/types'

const PRESETS = [
  { value: '7', label: '7 j' },
  { value: '30', label: '30 j' },
  { value: '90', label: '90 j' },
] as const
type Preset = (typeof PRESETS)[number]['value']

function rangeFor(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: isoDay(from), to: isoDay(to) }
}

function Delta({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  if (!previous && !current) return <span className="text-[12px] text-subtle">—</span>
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

function Kpi({ label, value, icon, delta, hint, to }: { label: string; value: ReactNode; icon?: ReactNode; delta?: ReactNode; hint?: ReactNode; to?: string }) {
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

function RevenueChart({ data, currency }: { data: StatsOverview['daily']; currency: string }) {
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue')
  const compact = useMemo(() => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }), [])
  return (
    <Card
      title="Évolution"
      actions={
        <Segmented
          label="Indicateur"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'revenue', label: 'Revenu' },
            { value: 'orders', label: 'Commandes' },
          ]}
        />
      }
    >
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="fillAccent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="day" tickFormatter={day} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tickFormatter={(v: number) => compact.format(v)} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} width={44} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: 'var(--line-strong)' }}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, color: 'var(--fg)' }}
              labelFormatter={(l) => day(String(l))}
              formatter={(v) => [metric === 'revenue' ? money(Number(v), currency) : num(Number(v)), metric === 'revenue' ? 'Revenu' : 'Commandes']}
            />
            <Area type="monotone" dataKey={metric} stroke="var(--accent)" strokeWidth={2} fill="url(#fillAccent)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function Bars({ rows }: { rows: { label: string; value: number; sub: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="tabular shrink-0 text-muted">{r.sub}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Dashboard() {
  const { storeId, store } = useCurrentStore()
  const [preset, setPreset] = useState<Preset>('30')
  const range = useMemo(() => rangeFor(Number(preset)), [preset])
  const { data, error, isPending, refetch, isFetching } = useStats(range.from, range.to)
  const base = `/stores/${storeId}`
  const currency = data?.currency ?? store?.currency ?? 'XOF'

  const header = (
    <PageHeader
      title="Tableau de bord"
      description={`Comparé aux ${preset} jours précédents`}
      actions={<Segmented label="Période" value={preset} onChange={setPreset} options={PRESETS.map((p) => ({ value: p.value, label: p.label }))} />}
    />
  )

  if (error)
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    )

  if (isPending || !data)
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-72 rounded-xl" />
      </>
    )

  const { current: c, previous: p, rates } = data
  const empty = c.orders === 0 && p.orders === 0

  return (
    <div className={cx('transition-opacity', isFetching && 'opacity-70')}>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Revenu encaissé" value={money(c.revenue, currency)} icon={<Banknote className="size-4" />} delta={<Delta current={c.revenue} previous={p.revenue} />} />
        <Kpi label="Commandes" value={num(c.orders)} icon={<ShoppingBag className="size-4" />} delta={<Delta current={c.orders} previous={p.orders} />} to={`${base}/orders`} />
        <Kpi label="COD à confirmer" value={num(c.codPending)} icon={<PhoneCall className="size-4" />} hint="à appeler" to={`${base}/orders?status=new`} />
        <Kpi label="À expédier" value={num(c.codToShip)} icon={<PackageCheck className="size-4" />} hint="confirmées" to={`${base}/orders?status=confirmed`} />
        <Kpi label="Chez les livreurs" value={money(c.codInTransit, currency)} icon={<Truck className="size-4" />} hint="à encaisser" to={`${base}/orders?status=shipped`} />
        <Kpi label="Taux de confirmation" value={percent(rates.confirmation)} hint="COD confirmées" />
        <Kpi label="Taux de livraison" value={percent(rates.delivery)} hint={`${num(c.delivered)} livrées · ${num(c.returned)} retours`} />
        <Kpi label="Conversion" value={percent(rates.conversion)} hint={`${num(data.visitors.visitors)} visiteurs`} />
      </div>

      {empty ? (
        <div className="mt-4">
          <EmptyState
            icon={<ShoppingBag className="size-5" />}
            title="Pas encore de commandes sur la période"
            description="Ajoutez un produit et partagez sa page de vente, ou saisissez une commande reçue sur WhatsApp."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink to={`${base}/products/new`} variant="primary">
                  <Plus className="size-4" /> Ajouter un produit
                </ButtonLink>
                <ButtonLink to={`${base}/orders/new`}>Saisir une commande</ButtonLink>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <RevenueChart data={data.daily} currency={currency} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Meilleurs produits">
              {data.topProducts.length ? (
                <Bars rows={data.topProducts.map((t) => ({ label: t.name, value: t.units, sub: `${num(t.units)} u. · ${money(t.revenue, currency)}` }))} />
              ) : (
                <p className="text-sm text-muted">Aucune vente sur la période.</p>
              )}
            </Card>
            <Card title="Sources de trafic">
              {data.sources.length ? (
                <Bars rows={data.sources.map((s) => ({ label: s.source === 'direct' ? 'Direct' : s.source, value: s.orders, sub: `${num(s.orders)} cmd · ${money(s.revenue, currency)}` }))} />
              ) : (
                <p className="text-sm text-muted">Aucune donnée.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
