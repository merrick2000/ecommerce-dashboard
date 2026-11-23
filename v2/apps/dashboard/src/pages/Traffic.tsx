/**
 * Trafic : combien de visiteurs, d'où ils viennent, ce qu'ils font et ce qui vend vraiment.
 * Données : visites des pages de vente (collecte interne, robots exclus) et commandes web.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Clock, Copy, Eye, Globe, Megaphone, Monitor, MousePointerClick, Smartphone, Tablet, Target, Users } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Bar, CartesianGrid, ComposedChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flag } from '@/components/Flag'
import { Delta, Kpi } from '@/components/Kpi'
import { Card, cx, EmptyState, ErrorState, PageHeader, Segmented, Select, Skeleton } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useCan, useCurrentStore, useStoreId } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { api } from '@/lib/api'
import { day, isoDay, money, num, percent } from '@/lib/format'

type Channel = 'facebook' | 'instagram' | 'tiktok' | 'whatsapp' | 'google' | 'youtube' | 'snapchat' | 'telegram' | 'x' | 'search' | 'email' | 'sms' | 'campaign' | 'referral' | 'direct'

type Outcome = { orders: number; revenue: number | null; conversion: number | null }
/** Dernier clic à la racine, premier clic dans `first`. */
type Attributed = Outcome & { first: Outcome }
type Model = 'last' | 'first'
const MODEL_HINT: Record<Model, string> = {
  last: 'Dernier clic : la commande revient à la dernière source (hors accès direct) avant l’achat. Ce qui a déclenché l’achat.',
  first: 'Premier clic : la commande revient à la source de la toute première visite. Ce qui a fait découvrir ta boutique.',
}
const pickModel = <T extends Attributed>(r: T, m: Model): Outcome => (m === 'first' ? r.first : r)

interface Traffic {
  range: { from: string; to: string }
  revenueVisible: boolean
  live: number
  current: {
    visitors: number
    sessions: number
    views: number
    engaged: number
    returning: number
    newVisitors: number
    orders: number
    paidOrders: number
    revenue: number | null
    conversion: number | null
    engagement: number | null
    viewsPerVisit: number | null
  }
  previous: { visitors: number; sessions: number; views: number; orders: number; revenue: number | null; conversion: number | null }
  daily: { day: string; visitors: number; views: number; orders: number }[]
  funnel: { visits: number; scrolled: number; clicked: number; started: number; ordered: number; paid: number }
  attribution: { orders: number; tracked: number; multiVisit: number; switched: number; avgVisits: number | null; avgHours: number | null }
  channels: ({ channel: Channel; visitors: number; sessions: number; paidVisitors: number } & Attributed)[]
  campaigns: ({ source: string | null; medium: string | null; campaign: string; channel: Channel; visitors: number } & Attributed)[]
  referrers: { host: string; channel: Channel; visitors: number }[]
  devices: { device: string; visitors: number }[]
  countries: { country: string; visitors: number }[]
  products: { id: string; name: string; visitors: number; views: number; started: number; orders: number; revenue: number | null; conversion: number | null }[]
  hours: { hour: number; visitors: number; orders: number }[]
}

const CHANNEL: Record<Channel, { label: string; color: string }> = {
  facebook: { label: 'Facebook', color: '#1877F2' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  tiktok: { label: 'TikTok', color: 'var(--fg)' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  google: { label: 'Google', color: '#EA4335' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  snapchat: { label: 'Snapchat', color: '#EAB308' },
  telegram: { label: 'Telegram', color: '#229ED9' },
  x: { label: 'X (Twitter)', color: 'var(--muted)' },
  search: { label: 'Autres moteurs', color: '#8B5CF6' },
  email: { label: 'Email', color: '#0EA5E9' },
  sms: { label: 'SMS', color: '#14B8A6' },
  campaign: { label: 'Autres campagnes', color: '#F59E0B' },
  referral: { label: 'Sites référents', color: '#64748B' },
  direct: { label: 'Accès direct', color: '#94A3B8' },
}

const DEVICE: Record<string, { label: string; icon: ReactNode }> = {
  mobile: { label: 'Mobile', icon: <Smartphone className="size-4" /> },
  desktop: { label: 'Ordinateur', icon: <Monitor className="size-4" /> },
  tablet: { label: 'Tablette', icon: <Tablet className="size-4" /> },
  unknown: { label: 'Inconnu', icon: <Monitor className="size-4" /> },
}

const PRESETS = [
  { value: '1', label: 'Auj.' },
  { value: '7', label: '7 j' },
  { value: '30', label: '30 j' },
  { value: '90', label: '90 j' },
] as const
type Preset = (typeof PRESETS)[number]['value']

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(['fr'], { type: 'region' })
    return (code: string) => (code === 'XX' ? 'Inconnu' : (dn.of(code) ?? code))
  } catch {
    return (code: string) => (code === 'XX' ? 'Inconnu' : code)
  }
})()

const share = (a: number, total: number) => (total > 0 ? Math.round((a / total) * 100) : 0)
/** Part en texte : « moins de 1 % » plutôt que « 0 % » quand il y a quand même quelque chose. */
const shareLabel = (a: number, total: number) => (a > 0 && total > 0 && (a / total) * 100 < 1 ? '< 1 %' : `${share(a, total)} %`)

const FB_PARAMS = 'utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}'
const TT_PARAMS = 'utm_source=tiktok&utm_medium=paid&utm_campaign=__CAMPAIGN_NAME__&utm_content=__CID_NAME__'

export default function Traffic() {
  const storeId = useStoreId()
  const { store } = useCurrentStore()
  const canProducts = useCan('products.view')
  const products = useProducts(canProducts)
  const [preset, setPreset] = useState<Preset>('30')
  const [productId, setProductId] = useState('')
  const [model, setModel] = useState<Model>('last')
  const range = useMemo(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - (Number(preset) - 1))
    return { from: isoDay(from), to: isoDay(to) }
  }, [preset])
  const q = useQuery({
    queryKey: ['store', storeId, 'traffic', range.from, range.to, productId],
    queryFn: () => api.get<Traffic>(`/stores/${storeId}/stats/traffic`, { ...range, ...(productId ? { productId } : {}) }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
  const currency = store?.currency ?? 'XOF'
  const base = `/stores/${storeId}`

  const productOptions = [{ value: '', label: 'Tous les produits' }, ...(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))]
  const header = (
    <PageHeader
      title="Trafic"
      description={preset === '1' ? 'Aujourd’hui, comparé à hier' : `${preset} derniers jours, comparés aux ${preset} précédents`}
      actions={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {canProducts && (products.data?.length ?? 0) > 1 && <Select aria-label="Produit" value={productId} onChange={(e) => setProductId(e.target.value)} options={productOptions} wrapClass="min-w-0 flex-1 sm:w-56 sm:flex-none" />}
          <Segmented label="Période" value={preset} onChange={setPreset} options={PRESETS.map((p) => ({ value: p.value, label: p.label }))} />
        </div>
      }
    />
  )

  if (q.error && !q.data)
    return (
      <>
        {header}
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </>
    )
  if (!q.data)
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-4 h-72 rounded-xl" />
      </>
    )

  const t = q.data
  const c = t.current
  const p = t.previous
  const rv = t.revenueVisible

  return (
    <div className={cx('transition-opacity', q.isFetching && 'opacity-70')}>
      {header}
      <LivePill n={t.live} />

      {c.visitors === 0 && p.visitors === 0 ? (
        <div className="mt-4 space-y-4">
          <EmptyState
            icon={<Users className="size-5" />}
            title="Pas encore de visiteurs sur la période"
            description="Chaque visite de tes pages de vente est comptée ici (les robots et tes propres aperçus sont exclus). Partage le lien de ton produit dans tes pubs, ton statut WhatsApp ou ta bio."
          />
          <UtmGuide />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Visiteurs" value={num(c.visitors)} icon={<Users className="size-4" />} delta={<Delta current={c.visitors} previous={p.visitors} />} hint={c.returning ? `${num(c.returning)} revenus` : undefined} />
            <Kpi label="Pages vues" value={num(c.views)} icon={<Eye className="size-4" />} delta={<Delta current={c.views} previous={p.views} />} hint={c.viewsPerVisit ? `${String(c.viewsPerVisit).replace('.', ',')} par visite` : undefined} />
            <Kpi label="Conversion" value={percent(c.conversion)} icon={<Target className="size-4" />} hint={`${num(c.orders)} commande${c.orders > 1 ? 's' : ''}`} delta={p.conversion != null && c.conversion != null ? <Delta current={c.conversion} previous={p.conversion} /> : undefined} />
            <Kpi label="Visites engagées" value={percent(c.engagement)} icon={<MousePointerClick className="size-4" />} hint="défilent, cliquent ou remplissent" />
          </div>

          <div className="mt-4">
            <TrafficChart data={t.daily} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Provenance" description="D’où viennent tes visiteurs et ce qu’ils achètent" actions={<ModelSwitch value={model} onChange={setModel} />}>
              <p className="mb-4 text-[12.5px] text-muted">{MODEL_HINT[model]}</p>
              <ChannelList rows={t.channels} rv={rv} currency={currency} model={model} />
            </Card>
            <Card title="Parcours" description="Ce que font les visiteurs, de l’arrivée à la commande">
              <Funnel f={t.funnel} digital={store?.kind === 'digital'} />
              <Journey a={t.attribution} />
            </Card>
          </div>

          <div className="mt-4">
            <Card title="Campagnes" description={t.campaigns.length ? `Liens de pub suivis avec des paramètres UTM · commandes au ${model === 'last' ? 'dernier' : 'premier'} clic` : 'Liens de pub suivis avec des paramètres UTM'} actions={t.campaigns.length ? <ModelSwitch value={model} onChange={setModel} /> : <Megaphone className="size-4 text-subtle" />}>
              {t.campaigns.length ? <CampaignList rows={t.campaigns} rv={rv} currency={currency} model={model} /> : <UtmGuide inline />}
            </Card>
          </div>

          {!productId && t.products.length > 0 && (
            <div className="mt-4">
              <Card title="Produits" description="Visiteurs et conversion par page de vente">
                <ProductList rows={t.products} rv={rv} currency={currency} base={base} />
              </Card>
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="Appareils">
              <Devices rows={t.devices} />
            </Card>
            <Card title="Pays" actions={<Globe className="size-4 text-subtle" />}>
              <SimpleBars rows={t.countries.map((r) => ({ key: r.country, label: regionName(r.country), value: r.visitors, icon: <Flag code={r.country} /> }))} empty="Aucune donnée." />
            </Card>
            <Card title="Sites référents" description="Liens cliqués sur d’autres sites">
              <SimpleBars rows={t.referrers.map((r) => ({ key: r.host, label: r.host, value: r.visitors, color: CHANNEL[r.channel]?.color }))} empty="Aucun site référent : les visiteurs arrivent par des liens directs ou des pubs." />
            </Card>
          </div>

          <div className="mt-4">
            <Card title="Heures de visite" description="Heure locale de la boutique : utile pour programmer tes pubs et tes statuts" actions={<Clock className="size-4 text-subtle" />}>
              <Hours rows={t.hours} />
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function LivePill({ n }: { n: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]">
      <span className="relative flex size-2.5">
        {n > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
        <span className={cx('relative inline-flex size-2.5 rounded-full', n > 0 ? 'bg-emerald-500' : 'bg-line-strong')} />
      </span>
      <span>
        <span className="tabular font-semibold">{num(n)}</span> <span className="text-muted">{n > 1 ? 'visiteurs en ce moment' : 'visiteur en ce moment'}</span>
      </span>
    </div>
  )
}

function TrafficChart({ data }: { data: Traffic['daily'] }) {
  const single = data.length <= 1
  return (
    <Card title="Évolution" description="Visiteurs par jour et commandes reçues">
      {single ? (
        <p className="text-sm text-muted">Choisis une période de plusieurs jours pour voir l’évolution.</p>
      ) : (
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="day" tickFormatter={day} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis yAxisId="v" tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
              <YAxis yAxisId="o" orientation="right" tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'var(--surface-2)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, color: 'var(--fg)' }}
                labelFormatter={(l) => day(String(l))}
                formatter={(v, name) => [num(Number(v)), name === 'visitors' ? 'Visiteurs' : 'Commandes']}
              />
              <Bar yAxisId="o" dataKey="orders" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={14} opacity={0.85} />
              <Area yAxisId="v" type="monotone" dataKey="visitors" stroke="var(--accent)" strokeWidth={2} fill="url(#fillVisitors)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {!single && (
        <div className="mt-2 flex gap-4 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded bg-accent" /> Visiteurs
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500" /> Commandes
          </span>
        </div>
      )}
    </Card>
  )
}

function Meter({ value, max, color }: { value: number; max: number; color?: string }) {
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full bg-accent" style={{ width: `${max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0}%`, background: color }} />
    </div>
  )
}

function Dot({ color }: { color: string }) {
  return <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
}

/** Ligne secondaire : commandes, conversion, chiffre (si visible) selon le modèle, et l'écart avec l'autre modèle. */
function OutcomeLine({ o, other, model, rv, currency }: { o: Outcome; other: Outcome; model: Model; rv: boolean; currency: string }) {
  const diff = other.orders - o.orders
  return (
    <div className="tabular mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
      <span>
        <span className={cx(o.orders > 0 && 'font-medium text-fg')}>{num(o.orders)}</span> commande{o.orders > 1 ? 's' : ''}
      </span>
      {o.conversion != null && <span>conversion {percent(o.conversion)}</span>}
      {rv && o.revenue != null && o.revenue > 0 && <span>{money(o.revenue, currency)} encaissés</span>}
      {diff !== 0 && (
        <span className="text-subtle">
          {num(other.orders)} au {model === 'last' ? 'premier' : 'dernier'} clic
        </span>
      )}
    </div>
  )
}

function ModelSwitch({ value, onChange }: { value: Model; onChange: (m: Model) => void }) {
  return (
    <Segmented
      label="Attribution"
      value={value}
      onChange={onChange}
      options={[
        { value: 'last', label: 'Dernier clic' },
        { value: 'first', label: 'Premier clic' },
      ]}
    />
  )
}

/** Parcours d'achat : combien de visites et de temps avant d'acheter. */
function Journey({ a }: { a: Traffic['attribution'] }) {
  if (!a.tracked) return null
  const hours = a.avgHours ?? 0
  const delay = hours < 1 ? 'moins d’une heure' : hours < 48 ? `${Math.round(hours)} h` : `${Math.round(hours / 24)} jours`
  return (
    <div className="mt-5 rounded-lg bg-surface-2 p-3 text-[13px]">
      <p className="font-medium">Avant d’acheter</p>
      <ul className="mt-1.5 space-y-1 text-muted">
        <li>
          <span className="font-medium text-fg">{share(a.multiVisit, a.tracked)} %</span> des acheteurs sont venus plusieurs fois (en moyenne {String(a.avgVisits ?? 1).replace('.', ',')} visites)
        </li>
        <li>
          <span className="font-medium text-fg">{delay}</span> en moyenne entre la première visite et la commande
        </li>
        {a.switched > 0 && (
          <li>
            <span className="font-medium text-fg">{num(a.switched)}</span> commande{a.switched > 1 ? 's' : ''} : découverte par une source, achat après une autre
          </li>
        )}
      </ul>
      {a.tracked < a.orders && <p className="mt-1.5 text-[12px] text-subtle">Parcours retrouvé pour {num(a.tracked)} commandes sur {num(a.orders)}.</p>}
    </div>
  )
}

function ChannelList({ rows, rv, currency, model }: { rows: Traffic['channels']; rv: boolean; currency: string; model: Model }) {
  if (!rows.length) return <p className="text-sm text-muted">Aucune donnée.</p>
  const max = Math.max(...rows.map((r) => r.visitors))
  const total = rows.reduce((a, r) => a + r.visitors, 0)
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => {
        const ch = CHANNEL[r.channel] ?? CHANNEL.referral
        return (
          <li key={r.channel}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Dot color={ch.color} />
                <span className="truncate font-medium">{ch.label}</span>
                {r.paidVisitors > 0 && <span className="shrink-0 rounded bg-surface-2 px-1.5 py-px text-[11.5px] text-muted">{share(r.paidVisitors, r.visitors)} % pub</span>}
              </span>
              <span className="tabular shrink-0">
                {num(r.visitors)} <span className="text-muted">· {shareLabel(r.visitors, total)}</span>
              </span>
            </div>
            <Meter value={r.visitors} max={max} color={ch.color} />
            <OutcomeLine o={pickModel(r, model)} other={pickModel(r, model === 'last' ? 'first' : 'last')} model={model} rv={rv} currency={currency} />
          </li>
        )
      })}
    </ul>
  )
}

function Funnel({ f, digital }: { f: Traffic['funnel']; digital: boolean }) {
  const steps = [
    { label: 'Arrivent sur la page', value: f.visits },
    { label: 'Font défiler la page', value: f.scrolled },
    { label: 'Cliquent sur un bouton', value: f.clicked },
    { label: 'Commencent le formulaire', value: f.started },
    { label: 'Commandent', value: f.ordered },
    ...(digital || f.paid > 0 ? [{ label: 'Paient', value: f.paid }] : []),
  ]
  const top = Math.max(f.visits, 1)
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1]!.value : null
        const lost = prev != null && prev > 0 ? Math.round(((prev - s.value) / prev) * 100) : null
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{s.label}</span>
              <span className="tabular shrink-0">
                {num(s.value)} <span className="text-muted">· {shareLabel(s.value, top)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(share(s.value, top), s.value > 0 ? 2 : 0)}%`, opacity: 1 - i * 0.1 }} />
            </div>
            {lost != null && lost > 0 && <p className="mt-0.5 text-[12px] text-subtle">{lost} % perdus à cette étape</p>}
          </li>
        )
      })}
    </ol>
  )
}

function CampaignList({ rows, rv, currency, model }: { rows: Traffic['campaigns']; rv: boolean; currency: string; model: Model }) {
  const max = Math.max(...rows.map((r) => r.visitors))
  return (
    <ul className="grid gap-x-8 gap-y-3.5 md:grid-cols-2">
      {rows.map((r) => {
        const ch = CHANNEL[r.channel] ?? CHANNEL.campaign
        return (
          <li key={`${r.source}|${r.campaign}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium" title={r.campaign}>
                  {r.campaign}
                </span>
                <span className="flex items-center gap-1.5 text-[12px] text-muted">
                  <Dot color={ch.color} /> {r.source ?? ch.label}
                  {r.medium ? ` · ${r.medium}` : ''}
                </span>
              </span>
              <span className="tabular shrink-0">{num(r.visitors)} <span className="text-muted">visiteurs</span></span>
            </div>
            <Meter value={r.visitors} max={max} color={ch.color} />
            <OutcomeLine o={pickModel(r, model)} other={pickModel(r, model === 'last' ? 'first' : 'last')} model={model} rv={rv} currency={currency} />
          </li>
        )
      })}
    </ul>
  )
}

function ProductList({ rows, rv, currency, base }: { rows: Traffic['products']; rv: boolean; currency: string; base: string }) {
  const max = Math.max(...rows.map((r) => r.visitors))
  return (
    <ul className="grid gap-x-8 gap-y-3.5 md:grid-cols-2">
      {rows.map((r) => (
        <li key={r.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <Link to={`${base}/products/${r.id}`} className="min-w-0 truncate font-medium hover:underline" title={r.name}>
              {r.name}
            </Link>
            <span className="tabular shrink-0">{num(r.visitors)} <span className="text-muted">visiteurs</span></span>
          </div>
          <Meter value={r.visitors} max={max} />
          <div className="tabular mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
            <span>{num(r.started)} formulaire{r.started > 1 ? 's' : ''} commencé{r.started > 1 ? 's' : ''}</span>
            <span>
              <span className={cx(r.orders > 0 && 'font-medium text-fg')}>{num(r.orders)}</span> commande{r.orders > 1 ? 's' : ''}
            </span>
            {r.conversion != null && <span>conversion {percent(r.conversion)}</span>}
            {rv && r.revenue != null && r.revenue > 0 && <span>{money(r.revenue, currency)}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Devices({ rows }: { rows: Traffic['devices'] }) {
  const total = rows.reduce((a, r) => a + r.visitors, 0)
  if (!total) return <p className="text-sm text-muted">Aucune donnée.</p>
  const colors: Record<string, string> = { mobile: 'var(--accent)', desktop: '#64748B', tablet: '#8B5CF6', unknown: 'var(--line-strong)' }
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        {rows.map((r) => (
          <div key={r.device} style={{ width: `${(r.visitors / total) * 100}%`, background: colors[r.device] ?? colors.unknown }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => {
          const d = DEVICE[r.device] ?? DEVICE.unknown!
          return (
            <li key={r.device} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: colors[r.device] ?? colors.unknown }} />
                <span className="text-muted">{d.icon}</span>
                {d.label}
              </span>
              <span className="tabular">
                {shareLabel(r.visitors, total)} <span className="text-muted">· {num(r.visitors)}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SimpleBars({ rows, empty }: { rows: { key: string; label: string; value: number; color?: string; icon?: ReactNode }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>
  const max = Math.max(...rows.map((r) => r.value))
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
          <Meter value={r.value} max={max} color={r.color} />
        </li>
      ))}
    </ul>
  )
}

function Hours({ rows }: { rows: Traffic['hours'] }) {
  const max = Math.max(1, ...rows.map((r) => r.visitors))
  const peak = rows.reduce((a, r) => (r.visitors > a.visitors ? r : a), rows[0]!)
  const bestOrders = rows.reduce((a, r) => (r.orders > a.orders ? r : a), rows[0]!)
  return (
    <div>
      {peak.visitors > 0 && (
        <p className="mb-3 text-sm">
          Pic de visites vers <span className="font-semibold">{peak.hour} h</span>
          {bestOrders.orders > 0 && (
            <>
              {' '}
              · le plus de commandes vers <span className="font-semibold">{bestOrders.hour} h</span>
            </>
          )}
        </p>
      )}
      <div className="flex h-28 items-end gap-[3px]">
        {rows.map((r) => (
          <div key={r.hour} className="group relative flex h-full flex-1 flex-col justify-end" title={`${r.hour} h : ${num(r.visitors)} visites, ${num(r.orders)} commandes`}>
            <div className={cx('w-full rounded-t-[3px] transition-colors', r.hour === peak.hour && peak.visitors > 0 ? 'bg-accent' : 'bg-accent/35 group-hover:bg-accent/60')} style={{ height: `${Math.max((r.visitors / max) * 100, r.visitors > 0 ? 3 : 1)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-subtle">
        <span>0 h</span>
        <span>6 h</span>
        <span>12 h</span>
        <span>18 h</span>
        <span>23 h</span>
      </div>
    </div>
  )
}

/** Comment suivre ses pubs : paramètres UTM à coller dans Facebook / TikTok Ads. */
function UtmGuide({ inline }: { inline?: boolean }) {
  const toast = useToast()
  const copy = (v: string) => void navigator.clipboard?.writeText(v).then(() => toast.success('Paramètres copiés'))
  const body = (
    <div className="space-y-3 text-sm">
      <p className="text-muted">Pour savoir quelle pub vend vraiment, ajoute ces paramètres à tes liens publicitaires. Chaque campagne apparaîtra ici avec ses visiteurs, ses commandes et son taux de conversion.</p>
      {[
        { label: 'Facebook et Instagram Ads', hint: 'Dans la publicité : Paramètres d’URL', value: FB_PARAMS },
        { label: 'TikTok Ads', hint: 'Dans l’annonce : Paramètres d’URL', value: TT_PARAMS },
      ].map((x) => (
        <div key={x.label} className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium">{x.label}</p>
              <p className="text-[12.5px] text-muted">{x.hint}</p>
            </div>
            <button type="button" onClick={() => copy(x.value)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-[13px] hover:bg-surface-2">
              <Copy className="size-3.5" /> Copier
            </button>
          </div>
          <code className="mt-2 block break-all rounded-md bg-surface px-2 py-1.5 text-[12px]">{x.value}</code>
        </div>
      ))}
      <p className="text-[12.5px] text-muted">Pour un lien partagé à la main (statut WhatsApp, influenceur), ajoute par exemple ?utm_source=whatsapp&amp;utm_campaign=statut-lundi à la fin du lien.</p>
    </div>
  )
  return inline ? body : <Card title="Suivre tes pubs">{body}</Card>
}
