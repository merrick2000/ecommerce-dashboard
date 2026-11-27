/**
 * En direct : qui est sur la boutique maintenant, d'où, sur quel produit, où en est chaque visiteur,
 * le cumul du jour et le fil des derniers événements, autour d'un globe 3D animé.
 * Rafraîchi toutes les 5 secondes (en pause quand l'onglet est caché).
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ClipboardPen, CreditCard, Eye, Maximize2, Minimize2, ShoppingBag } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Flag } from '@/components/Flag'
import type { GlobeOrder, GlobePoint } from '@/components/LiveGlobe'
import { Card, cx, ErrorState, Select, Skeleton } from '@/components/ui'
import { useCan, useCurrentStore, useStoreId } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { api } from '@/lib/api'
import { money, num } from '@/lib/format'
import { ago, CHANNEL, regionName, type Channel } from '@/lib/traffic'

const LiveGlobe = lazy(() => import('@/components/LiveGlobe').then((m) => ({ default: m.LiveGlobe })))

type FeedItem = { kind: 'visit' | 'form' | 'payment' | 'order'; at: string; city: string | null; country: string | null; product: string | null; channel: Channel | null; name: string | null; total: number | null }
type Live = {
  revenueVisible: boolean
  currency: string
  country: string
  serverTime: string
  now: {
    visitors: number
    stages: { browsing: number; form: number; payment: number; ordered: number }
    points: GlobePoint[]
    products: { id: string; name: string; visitors: number }[]
    channels: { channel: Channel; visitors: number }[]
  }
  today: {
    visitors: number
    sessions: number
    orders: number
    revenue: number | null
    series: { hour: number; sessions: number; orders: number; revenue: number | null }[]
    locations: { city: string | null; country: string | null; sessions: number }[]
  }
  feed: FeedItem[]
  orders: GlobeOrder[]
}

/** « de Cotonou », « d’Abidjan ». */
const de = (w: string) => (/^[aeiouyhàâéèêëîïôûAEIOUYHÀÂÉÈÊÎÔÛ]/.test(w) ? `d’${w}` : `de ${w}`)

const place = (city: string | null, country: string | null) => city || (country && country !== 'XX' ? regionName(country) : null)

export default function LiveView() {
  const storeId = useStoreId()
  const { store } = useCurrentStore()
  const canProducts = useCan('products.view')
  const products = useProducts(canProducts)
  const [productId, setProductId] = useState('')
  const [full, setFull] = useState(false)
  const q = useQuery({
    queryKey: ['store', storeId, 'live', productId],
    queryFn: () => api.get<Live>(`/stores/${storeId}/stats/live`, productId ? { productId } : undefined),
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
  })
  const currency = q.data?.currency ?? store?.currency ?? 'XOF'

  // Nouvelle commande depuis l'ouverture de la page : bandeau + le globe s'y tourne.
  const seen = useRef<string | null>(null)
  const [fresh, setFresh] = useState<FeedItem | null>(null)
  const [focus, setFocus] = useState<{ lat: number; lon: number; key: string } | null>(null)
  useEffect(() => {
    const last = q.data?.feed.find((f) => f.kind === 'order')
    if (!last) return
    if (seen.current && Date.parse(last.at) > Date.parse(seen.current)) {
      setFresh(last)
      const pin = q.data?.orders.find((o) => Math.abs(Date.parse(o.at) - Date.parse(last.at)) < 1000)
      if (pin) setFocus({ lat: pin.lat, lon: pin.lon, key: pin.at })
      const t = window.setTimeout(() => setFresh(null), 9000)
      seen.current = last.at
      return () => window.clearTimeout(t)
    }
    if (!seen.current || Date.parse(last.at) > Date.parse(seen.current)) seen.current = last.at
  }, [q.data])

  // Plein écran : celui du navigateur (au-dessus de tout, quel que soit le bloc parent).
  // Sans lui (iPhone), le globe est sorti de la page et posé sur tout l'écran.
  const globeRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)
  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement) && document.fullscreenElement === globeRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggleFull = () => {
    if (document.fullscreenElement) return void document.exitFullscreen()
    if (fallback) return void (setFallback(false), setFull(false))
    const el = globeRef.current
    if (el?.requestFullscreen && document.fullscreenEnabled) el.requestFullscreen().catch(() => (setFallback(true), setFull(true)))
    else (setFallback(true), setFull(true))
  }
  // Échap quitte le plein écran de secours.
  useEffect(() => {
    if (!fallback) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (setFallback(false), setFull(false))
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fallback])

  const productOptions = [{ value: '', label: 'Tous les produits' }, ...(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))]
  const d = q.data

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <Link to={`/stores/${storeId}/traffic`} className="mb-1 inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg">
          <ArrowLeft className="size-3.5" /> Trafic
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">En direct</h1>
          <Pulse on={!!d && !q.isError} label={q.isError ? 'Connexion perdue' : 'Mis à jour toutes les 5 s'} />
        </div>
      </div>
      {canProducts && (products.data?.length ?? 0) > 1 && <Select aria-label="Produit" value={productId} onChange={(e) => setProductId(e.target.value)} options={productOptions} wrapClass="min-w-0 w-full sm:w-60" />}
    </div>
  )

  if (q.error && !d)
    return (
      <>
        {header}
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </>
    )

  const globe = (
    <div ref={globeRef} className={cx('relative overflow-hidden border border-line bg-[radial-gradient(ellipse_at_center,var(--accent-soft)_0%,transparent_65%)]', full ? 'fixed inset-0 z-[80] h-dvh w-screen rounded-none border-0 bg-bg' : 'h-[22rem] rounded-xl sm:h-[28rem] lg:sticky lg:top-6 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[32rem]')}>
      <Suspense fallback={<div className="grid size-full place-items-center text-sm text-muted">Chargement du globe…</div>}>
        {d && <LiveGlobe points={d.now.points} orders={d.orders} country={d.country} focus={focus} />}
      </Suspense>
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
        <div className="rounded-xl border border-line bg-surface/90 px-3 py-2 shadow-sm backdrop-blur">
          <div className="text-[12px] text-muted">Visiteurs en ce moment</div>
          <div className="tabular text-2xl font-semibold leading-tight">{num(d?.now.visitors ?? 0)}</div>
        </div>
        {fresh && (
          <div className="animate-[select-in_200ms_ease-out] rounded-xl border border-emerald-500/40 bg-surface/95 px-3 py-2 shadow-md backdrop-blur">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="size-3.5" /> Nouvelle commande
            </div>
            <div className="text-sm">
              <span className="font-semibold">{fresh.name ?? 'Un client'}</span>
              {place(fresh.city, fresh.country) && <span className="text-muted">, {place(fresh.city, fresh.country)}</span>}
              {fresh.total !== null && <span className="tabular font-semibold"> · {money(fresh.total, currency)}</span>}
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={toggleFull}
        title={full ? 'Quitter le plein écran' : 'Plein écran'}
        aria-label={full ? 'Quitter le plein écran' : 'Plein écran'}
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-line bg-surface/90 text-muted shadow-sm backdrop-blur hover:text-fg"
      >
        {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      </button>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[12px]">
        <Legend color="bg-accent" label="Visiteurs en ce moment" />
        <Legend color="bg-emerald-500" label="Commandes (30 min)" />
      </div>
      {d && d.now.visitors > 0 && d.now.points.length === 0 && (
        <p className="pointer-events-none absolute inset-x-0 bottom-14 mx-auto w-fit max-w-[90%] rounded-lg bg-surface/90 px-3 py-1.5 text-center text-[12.5px] text-muted backdrop-blur">
          Position en cours de collecte : les prochains visiteurs apparaîtront sur le globe.
        </p>
      )}
    </div>
  )

  return (
    <div>
      {header}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <div className="lg:order-2">{fallback ? createPortal(globe, document.body) : globe}</div>
        <div className="min-w-0 space-y-4 lg:order-1">
          {!d ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-56 rounded-xl" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="En ce moment" value={num(d.now.visitors)} live={d.now.visitors > 0} />
                <Stat label="Ventes du jour" value={d.revenueVisible ? money(d.today.revenue ?? 0, currency) : 'Masqué'} spark={d.revenueVisible ? d.today.series.map((s) => s.revenue ?? 0) : undefined} />
                <Stat label="Visites du jour" value={num(d.today.sessions)} sub={`${num(d.today.visitors)} visiteurs`} spark={d.today.series.map((s) => s.sessions)} />
                <Stat label="Commandes du jour" value={num(d.today.orders)} sub="depuis la boutique" spark={d.today.series.map((s) => s.orders)} />
              </div>

              <Card title="Où en sont-ils" description="Les visiteurs des 5 dernières minutes">
                <Stages s={d.now.stages} total={d.now.visitors} />
              </Card>

              <Card title="Fil en direct" description="La dernière demi-heure">
                <Feed items={d.feed} currency={currency} />
              </Card>

              {d.now.products.length > 0 && (
                <Card title="Produits regardés" description="En ce moment">
                  <Bars rows={d.now.products.map((p) => ({ key: p.id, label: p.name, value: p.visitors }))} />
                </Card>
              )}

              {d.now.channels.length > 0 && (
                <Card title="D’où ils viennent" description="En ce moment">
                  <Bars rows={d.now.channels.map((c) => ({ key: c.channel, label: CHANNEL[c.channel]?.label ?? c.channel, value: c.visitors, color: CHANNEL[c.channel]?.color }))} />
                </Card>
              )}

              <Card title="Visites du jour par lieu">
                {d.today.locations.length ? (
                  <Bars
                    rows={d.today.locations.map((l) => ({
                      key: `${l.country}-${l.city}`,
                      label: [l.city, l.country && l.country !== 'XX' ? regionName(l.country) : null].filter(Boolean).join(', ') || 'Lieu inconnu',
                      value: l.sessions,
                      icon: <Flag code={l.country ?? 'XX'} />,
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted">Aucune visite aujourd’hui pour l’instant.</p>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Pulse({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
      <span className="relative flex size-2">
        {on && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
        <span className={cx('relative inline-flex size-2 rounded-full', on ? 'bg-emerald-500' : 'bg-red-500')} />
      </span>
      {label}
    </span>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-2.5 py-1 backdrop-blur">
      <span className={cx('size-2 rounded-full', color)} />
      {label}
    </span>
  )
}

function Stat({ label, value, sub, spark, live }: { label: string; value: string; sub?: string; spark?: number[]; live?: boolean }) {
  // Courbe jusqu'à l'heure en cours seulement : la suite de la journée n'existe pas encore.
  const hour = new Date().getHours()
  const data = useMemo(() => spark?.slice(0, hour + 1).map((v, i) => ({ i, v })), [spark, hour])
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
        {live && <span className="size-1.5 rounded-full bg-emerald-500" />}
        <span className="truncate">{label}</span>
      </div>
      <div className="tabular mt-1 truncate text-xl font-semibold">{value}</div>
      {sub && <div className="truncate text-[12px] text-subtle">{sub}</div>}
      {data && data.some((p) => p.v > 0) && (
        <div className="pointer-events-none mt-1.5 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <Area type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={1.5} fill="var(--accent)" fillOpacity={0.12} isAnimationActive={false} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function Stages({ s, total }: { s: Live['now']['stages']; total: number }) {
  const rows = [
    { key: 'browsing', label: 'Sur la page', value: s.browsing, color: 'bg-sky-500' },
    { key: 'form', label: 'Au formulaire', value: s.form, color: 'bg-accent' },
    ...(s.payment > 0 ? [{ key: 'payment', label: 'Au paiement', value: s.payment, color: 'bg-violet-500' }] : []),
    { key: 'ordered', label: 'Ont commandé', value: s.ordered, color: 'bg-emerald-500' },
  ]
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
        {total > 0 && rows.map((r) => r.value > 0 && <div key={r.key} className={cx('h-full transition-[width] duration-500', r.color)} style={{ width: `${(r.value / total) * 100}%` }} />)}
      </div>
      <div className={cx('mt-3 grid gap-2', rows.length === 4 ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-2' : 'grid-cols-3')}>
        {rows.map((r) => (
          <div key={r.key} className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] text-muted">
              <span className={cx('size-2 shrink-0 rounded-full', r.color)} />
              <span className="truncate" title={r.label}>
                {r.label}
              </span>
            </div>
            <div className="tabular text-lg font-semibold">{num(r.value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEED_ICON: Record<FeedItem['kind'], { icon: ReactNode; tone: string }> = {
  visit: { icon: <Eye className="size-3.5" />, tone: 'bg-sky-500/12 text-sky-600 dark:text-sky-400' },
  form: { icon: <ClipboardPen className="size-3.5" />, tone: 'bg-accent/15 text-accent' },
  payment: { icon: <CreditCard className="size-3.5" />, tone: 'bg-violet-500/12 text-violet-600 dark:text-violet-400' },
  order: { icon: <ShoppingBag className="size-3.5" />, tone: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
}

function Feed({ items, currency }: { items: FeedItem[]; currency: string }) {
  if (!items.length) return <p className="text-sm text-muted">Rien pour l’instant : chaque visite, formulaire et commande s’affichera ici.</p>
  return (
    <ul className="-my-1 max-h-[22rem] space-y-0.5 overflow-y-auto overscroll-contain pr-1">
      {items.map((f, i) => {
        const where = place(f.city, f.country)
        const who = f.kind === 'order' ? (f.name ?? 'Un client') : where ? `Visiteur ${de(where)}` : 'Un visiteur'
        const what =
          f.kind === 'visit'
            ? f.channel && f.channel !== 'direct'
              ? `arrive via ${CHANNEL[f.channel]?.label ?? f.channel}`
              : 'arrive sur la boutique'
            : f.kind === 'form'
              ? 'remplit le formulaire'
              : f.kind === 'payment'
                ? 'passe au paiement'
                : `a commandé${where ? ` depuis ${where}` : ''}`
        const ic = FEED_ICON[f.kind]
        return (
          <li key={`${f.kind}-${f.at}-${i}`} className="flex items-start gap-2.5 rounded-lg px-1 py-1.5">
            <span className={cx('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', ic.tone)}>{ic.icon}</span>
            <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
              <div>
                <span className="font-medium">{who}</span> <span className="text-muted">{what}</span>
                {f.kind === 'order' && f.total !== null && <span className="tabular font-semibold"> · {money(f.total, currency)}</span>}
              </div>
              {f.product && <div className="truncate text-[12px] text-subtle">{f.product}</div>}
            </div>
            <span className="tabular shrink-0 pt-0.5 text-[11.5px] text-subtle">{ago(f.at)}</span>
          </li>
        )
      })}
    </ul>
  )
}

function Bars({ rows }: { rows: { key: string; label: string; value: number; color?: string; icon?: ReactNode }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {r.icon}
              <span className="min-w-0 truncate" title={r.label}>
                {r.label}
              </span>
            </span>
            <span className="tabular shrink-0 text-muted">{num(r.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? 'var(--accent)' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
