import { ArrowDownRight, ArrowUpRight, Banknote, Check, Copy, ExternalLink, Inbox, PackageCheck, PhoneCall, Plus, ShoppingBag, Truck, UserCheck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ButtonLink, Card, cx, EmptyState, ErrorState, PageHeader, Segmented, Skeleton } from '@/components/ui'
import { useCan, useCurrentStore } from '@/hooks/auth'
import { usePaymentAccounts, useProducts, useStats, useZones } from '@/hooks/resources'
import { salesPageUrl } from './products/ProductsList'
import { useToast } from '@/components/Toast'
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

function RevenueChart({ data, currency, revenueVisible }: { data: StatsOverview['daily']; currency: string; revenueVisible: boolean }) {
  const [chosen, setMetric] = useState<'revenue' | 'orders'>('revenue')
  // Sans droit sur le chiffre d'affaires : seulement le nombre de commandes.
  const metric = revenueVisible ? chosen : 'orders'
  const compact = useMemo(() => new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }), [])
  return (
    <Card
      title="Évolution"
      actions={
        revenueVisible && (
        <Segmented
          label="Indicateur"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'revenue', label: 'Revenu' },
            { value: 'orders', label: 'Commandes' },
          ]}
        />
        )
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

/** Résultats personnels du membre (commandes qui lui sont attribuées). */
function MyResults({ mine, base }: { mine: NonNullable<StatsOverview['mine']>; base: string }) {
  return (
    <Card title="Mes résultats" description="Commandes qui vous sont attribuées sur la période" actions={<ButtonLink to={`${base}/orders?assigned=me`} size="sm">Mes commandes</ButtonLink>}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Attribuées" value={num(mine.assigned)} icon={<Inbox className="size-4" />} />
        <MiniStat label="Confirmées" value={num(mine.confirmed)} icon={<UserCheck className="size-4" />} />
        <MiniStat label="Livrées" value={num(mine.delivered)} icon={<PackageCheck className="size-4" />} />
        <MiniStat label="Taux de confirmation" value={percent(mine.confirmationRate)} icon={<PhoneCall className="size-4" />} />
      </div>
    </Card>
  )
}

function MiniStat({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        <span className="text-subtle">{icon}</span>
        {label}
      </p>
      <p className="tabular mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { storeId, store } = useCurrentStore()
  const canSetup = useCan('products.edit')
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

  if (error && !data)
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
  const rv = data.revenueVisible && c.revenue != null

  return (
    <div className={cx('transition-opacity', isFetching && 'opacity-70')}>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {rv && <Kpi label="Revenu encaissé" value={money(c.revenue, currency)} icon={<Banknote className="size-4" />} delta={<Delta current={c.revenue ?? 0} previous={p.revenue ?? 0} />} />}
        <Kpi label="Commandes" value={num(c.orders)} icon={<ShoppingBag className="size-4" />} delta={<Delta current={c.orders} previous={p.orders} />} to={`${base}/orders`} />
        <Kpi label="COD à confirmer" value={num(c.codPending)} icon={<PhoneCall className="size-4" />} hint="à appeler" to={`${base}/orders?status=new`} />
        <Kpi label="À expédier" value={num(c.codToShip)} icon={<PackageCheck className="size-4" />} hint="confirmées" to={`${base}/orders?status=confirmed`} />
        {rv && c.codInTransit != null && <Kpi label="Chez les livreurs" value={money(c.codInTransit, currency)} icon={<Truck className="size-4" />} hint="à encaisser" to={`${base}/orders?status=shipped`} />}
        <Kpi label="Taux de confirmation" value={percent(rates.confirmation)} hint="COD confirmées" />
        <Kpi label="Taux de livraison" value={percent(rates.delivery)} hint={`${num(c.delivered)} livrées · ${num(c.returned)} retours`} />
        <Kpi label="Conversion" value={percent(rates.conversion)} hint={`${num(data.visitors.visitors)} visiteurs`} />
      </div>

      {data.mine && (
        <div className="mt-4">
          <MyResults mine={data.mine} base={base} />
        </div>
      )}

      {empty ? (
        <div className="mt-4">
          {canSetup ? (
            <GettingStarted base={base} />
          ) : (
            <Card>
              <EmptyState icon={<ShoppingBag className="size-5" />} title="Aucune commande sur la période" description="Les nouvelles commandes des produits auxquels vous avez accès apparaîtront ici." />
            </Card>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4">
            <RevenueChart data={data.daily} currency={currency} revenueVisible={rv} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Meilleurs produits">
              {data.topProducts.length ? (
                <Bars rows={data.topProducts.map((t) => ({ label: t.name, value: t.units, sub: rv ? `${num(t.units)} u. · ${money(t.revenue, currency)}` : `${num(t.units)} u. · ${num(t.orders)} cmd` }))} />
              ) : (
                <p className="text-sm text-muted">Aucune vente sur la période.</p>
              )}
            </Card>
            <Card title="Sources de trafic">
              {data.sources.length ? (
                <Bars rows={data.sources.map((s) => ({ label: s.source === 'direct' ? 'Direct' : s.source, value: s.orders, sub: rv ? `${num(s.orders)} cmd · ${money(s.revenue, currency)}` : `${num(s.orders)} cmd` }))} />
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

/**
 * Écran « Bien démarrer » : affiché tant qu'il n'y a pas de commande.
 * Chaque étape est calculée à partir des vraies données de la boutique.
 */
function GettingStarted({ base }: { base: string }) {
  const { store } = useCurrentStore()
  const toast = useToast()
  const products = useProducts()
  const zones = useZones().list
  const canPayments = useCan('payments.manage')
  const payments = usePaymentAccounts(canPayments)
  const list = products.data ?? []
  const active = list.filter((p) => p.isActive)
  const needsZones = list.some((p) => p.type === 'physical')
  const needsPayments = list.some((p) => p.paymentMethod === 'native')
  const nativeOn = (payments.data ?? []).some((a) => a.enabled && ['feexpay', 'fedapay', 'paydunya', 'pawapay'].includes(a.provider))
  const first = active[0] ?? null
  const link = first && store ? salesPageUrl(store.slug, first.id).replace('?notrack', '') : null

  if (products.isPending) return <Skeleton className="h-56 w-full rounded-xl" />

  const steps: { done: boolean; title: string; text: string; to: string; cta: string; show: boolean }[] = [
    { show: true, done: list.length > 0, title: 'Créer un produit', text: 'Digital (ebook, formation…) ou physique (livré, payé à la livraison).', to: `${base}/products/new`, cta: 'Ajouter un produit' },
    { show: list.length > 0, done: active.length > 0, title: 'Activer un produit', text: 'Un produit inactif n’est pas visible par vos clients.', to: `${base}/products`, cta: 'Voir mes produits' },
    { show: needsZones, done: (zones.data ?? []).length > 0, title: 'Configurer la livraison', text: 'Zones et frais de livraison pour vos produits physiques.', to: `${base}/zones`, cta: 'Ajouter une zone' },
    { show: needsPayments && canPayments, done: nativeOn, title: 'Activer le paiement en ligne', text: 'Un de vos produits utilise le paiement intégré : activez au moins un moyen (FeexPay, FedaPay…).', to: `${base}/settings?tab=payments`, cta: 'Configurer' },
  ]
  const visible = steps.filter((s) => s.show)
  const doneCount = visible.filter((s) => s.done).length

  return (
    <Card title="Bien démarrer" description={`${doneCount}/${visible.length} étapes terminées · aucune commande pour l’instant sur la période`}>
      <ol className="divide-y divide-line">
        {visible.map((s) => (
          <li key={s.title} className="flex items-start gap-3 py-3">
            <span className={cx('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs', s.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line-strong text-muted')}>
              {s.done ? <Check className="size-3.5" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cx('text-sm font-medium', s.done && 'text-muted line-through')}>{s.title}</p>
              {!s.done && <p className="text-[13px] text-muted">{s.text}</p>}
            </div>
            {!s.done && (
              <ButtonLink to={s.to} size="sm" variant="primary">
                {s.cta}
              </ButtonLink>
            )}
          </li>
        ))}
      </ol>
      {link && (
        <div className="mt-3 rounded-lg bg-surface-2 p-3">
          <p className="text-sm font-medium">Partagez votre page de vente pour recevoir vos premières commandes</p>
          <p className="mt-0.5 text-[13px] text-muted">« {first!.name} » : à mettre dans vos pubs, votre bio ou sur WhatsApp.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]">{link}</code>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm hover:bg-surface-2"
              onClick={() => {
                void navigator.clipboard?.writeText(link).then(() => toast.success('Lien copié'))
              }}
            >
              <Copy className="size-3.5" /> Copier
            </button>
            <a href={`${link}?notrack`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm hover:bg-surface-2">
              <ExternalLink className="size-3.5" /> Ouvrir
            </a>
          </div>
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <ButtonLink to={`${base}/orders/new`} size="sm">
          <Plus className="size-4" /> Saisir une commande reçue sur WhatsApp
        </ButtonLink>
      </div>
    </Card>
  )
}
