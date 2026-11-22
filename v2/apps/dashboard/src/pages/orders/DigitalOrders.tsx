/**
 * Commandes d'une boutique digitale : pas d'appel, pas de livraison, pas de statut d'expédition.
 * Ce qui compte : le paiement (payées, en attente, refusées, remboursées), les paniers abandonnés,
 * et les actions utiles (renvoyer l'accès, copier le lien, relancer un paiement, relancer un panier).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellOff, ChevronLeft, ChevronRight, Copy, Download, LayoutGrid, List, Mail, MessageCircle, RotateCcw, Search, ShoppingBag, Table2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, buttonClass, cx, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Segmented } from '@/components/ui'
import { DEFAULT_PREFS, useMediaQuery, usePref, type OrdersPrefs } from './views/prefs'
import { useCan, useCurrentStore, useStoreId } from '@/hooks/auth'
import { ordersCsvUrl, useOrders } from '@/hooks/resources'
import { useDebounced } from '@/hooks/useDebounced'
import { api, errorMessage } from '@/lib/api'
import { money, prettyPhone, relative } from '@/lib/format'
import type { OrderListItem } from '@/lib/types'

type Tab = '' | 'paid' | 'pending' | 'failed' | 'carts' | 'refunded'
const TABS: { key: Tab; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'paid', label: 'Payées' },
  { key: 'pending', label: 'En attente' },
  { key: 'failed', label: 'Paiement refusé' },
  { key: 'carts', label: 'Paniers abandonnés' },
  { key: 'refunded', label: 'Remboursées' },
]

/** Raisons de refus Payment Orchestrator, en clair. */
const FAILURE: Record<string, string> = {
  customer_declined: 'Refusé par le client',
  customer_timeout: 'Pas validé à temps',
  customer_unreachable: 'Téléphone injoignable',
  insufficient_balance: 'Solde insuffisant',
  payer_limit_reached: 'Plafond atteint',
  invalid_phone: 'Numéro invalide',
  not_on_operator: 'Mauvais opérateur',
  wallet_locked: 'Portefeuille bloqué',
  mno_unavailable: 'Opérateur indisponible',
  cancelled: 'Annulé',
}
const failureLabel = (f: string | null | undefined) => (f ? (FAILURE[f.split(' : ')[0]!] ?? 'Paiement refusé') : 'Paiement refusé')

interface Lead {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  productName: string | null
  price: number | null
  productUrl: string | null
  reminderCount: number
  lastRemindedAt: string | null
  createdAt: string
}

type Layout = 'card' | 'compact' | 'table'

const wa = (phone: string | null | undefined, text: string) => (phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}` : null)

function stateOf(o: OrderListItem & { paymentFailed?: boolean }) {
  if (o.paymentStatus === 'paid') return { label: 'Payée', tone: 'green' as const }
  if (o.paymentStatus === 'refunded') return { label: 'Remboursée', tone: 'neutral' as const }
  if (o.paymentFailed || o.paymentStatus === 'failed') return { label: failureLabel(o.poFailure), tone: 'red' as const }
  return { label: 'En attente de paiement', tone: 'amber' as const }
}

function OrderRow({ order, storeName, layout }: { order: OrderListItem & { paymentFailed?: boolean; downloads?: number }; storeName: string; layout: Layout }) {
  const navigate = useNavigate()
  const storeId = useStoreId()
  const toast = useToast()
  const qc = useQueryClient()
  const canUpdate = useCan('orders.update')
  const [resend, setResend] = useState(false)
  const [email, setEmail] = useState(order.customerEmail ?? '')
  const st = stateOf(order)
  const paid = order.paymentStatus === 'paid'
  const items = order.items.map((i) => i.name).join(', ')

  const resendAccess = useMutation({
    mutationFn: () => api.post<{ email: string }>(`/stores/${storeId}/orders/${order.id}/resend-access`, { email: email.trim() || undefined }),
    onSuccess: (r) => {
      toast.success(`Accès renvoyé à ${r.email}`)
      setResend(false)
      void qc.invalidateQueries({ queryKey: ['store', storeId, 'orders'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const payLink = async (sendEmail: boolean) => {
    try {
      const r = await api.post<{ url: string; emailed: boolean }>(`/stores/${storeId}/orders/${order.id}/send-payment-link`, { email: sendEmail })
      if (sendEmail) toast.success(r.emailed ? 'Lien de paiement envoyé par email' : 'Pas d’email pour ce client')
      return r.url
    } catch (e) {
      toast.error(errorMessage(e))
      return null
    }
  }
  const copyAccess = async () => {
    const r = await api.get<{ customerUrl: string }>(`/stores/${storeId}/orders/${order.id}`)
    await navigator.clipboard?.writeText(r.customerUrl)
    toast.success(paid ? 'Lien d’accès copié' : 'Lien de paiement copié')
  }
  const whatsappPay = async () => {
    const url = await payLink(false)
    if (!url) return
    const link = wa(order.customerPhone, `Bonjour ${order.customerName?.split(' ')[0] ?? ''}, votre commande ${order.orderNumber} chez ${storeName} vous attend (${money(order.total, order.currency)}). Vous pouvez finaliser votre paiement ici : ${url}`)
    if (link) window.open(link, '_blank', 'noopener')
  }

  const unpaid = order.paymentStatus === 'pending' || order.paymentStatus === 'failed'
  /** Actions : boutons complets (cartes) ou icônes avec info-bulle (liste et tableau). */
  const act = (icon: ReactNode, label: string, onClick: () => void, variant: 'secondary' | 'ghost' = 'secondary') =>
    compact ? (
      <button key={label} type="button" title={label} aria-label={label} onClick={(e) => (e.stopPropagation(), onClick())} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
        {icon}
      </button>
    ) : (
      <Button key={label} size="sm" variant={variant} onClick={onClick}>
        {icon} {label}
      </Button>
    )
  const compact = layout !== 'card'
  const actions = !canUpdate
    ? []
    : paid
      ? [act(<RotateCcw className="size-3.5" />, 'Renvoyer l’accès', () => setResend(true)), act(<Copy className="size-3.5" />, 'Copier le lien d’accès', () => void copyAccess(), 'ghost')]
      : unpaid
        ? [
            order.customerEmail ? act(<Mail className="size-3.5" />, 'Relancer par email', () => void payLink(true)) : null,
            order.customerPhone ? act(<MessageCircle className="size-3.5" />, 'WhatsApp', () => void whatsappPay()) : null,
            act(<Copy className="size-3.5" />, 'Copier le lien de paiement', () => void copyAccess(), 'ghost'),
          ].filter(Boolean)
        : []
  const dl =
    (order.downloads ?? 0) > 0 ? (
      <span className="inline-flex items-center gap-1 text-[12px] text-muted" title="Téléchargements">
        <Download className="size-3.5" /> {order.downloads}
      </span>
    ) : paid ? (
      <span className="text-[12px] whitespace-nowrap text-amber-700 dark:text-amber-400">Pas encore téléchargé</span>
    ) : null
  const dialog = (
    <Dialog
      open={resend}
      onClose={() => setResend(false)}
      title="Renvoyer l’accès au produit"
      size="sm"
      footer={
        <>
          <Button onClick={() => setResend(false)}>Annuler</Button>
          <Button variant="primary" loading={resendAccess.isPending} onClick={() => resendAccess.mutate()}>
            Renvoyer
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-muted">Le client reçoit à nouveau l’email avec le bouton d’accès. Corrige l’adresse s’il s’était trompé.</p>
      <Input label="Email du client" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    </Dialog>
  )
  const open = () => navigate(String(order.id))

  if (layout === 'table') {
    const cell = 'px-3 py-2.5'
    return (
      <tr className="cursor-pointer border-t border-line hover:bg-surface-2/60" onClick={open}>
        <td className={cx(cell, 'whitespace-nowrap')}>
          <p>{order.orderNumber}</p>
          <p className="text-[12px] text-muted">{relative(order.createdAt)}</p>
        </td>
        <td className={cell}>
          <p className="font-medium whitespace-nowrap">{order.customerName || 'Client'}</p>
          {order.customerEmail && <p className="max-w-52 truncate text-[12px] text-muted">{order.customerEmail}</p>}
        </td>
        <td className={cx(cell, 'whitespace-nowrap text-muted')}>{order.customerPhone ? prettyPhone(order.customerPhone) : '-'}</td>
        <td className={cx(cell, 'max-w-44 truncate')}>{items}</td>
        <td className={cx(cell, 'tabular text-right font-medium whitespace-nowrap')}>{money(order.total, order.currency)}</td>
        <td className={cell}>
          <Badge tone={st.tone}>{st.label}</Badge>
        </td>
        <td className={cx(cell, 'tabular')}>
          {(order.downloads ?? 0) > 0 ? order.downloads : paid ? <span className="text-amber-700 dark:text-amber-400" title="Pas encore téléchargé">0</span> : ''}
        </td>
        <td className={cx(cell, 'text-right')} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-0.5">{actions}</div>
          {dialog}
        </td>
      </tr>
    )
  }

  if (layout === 'compact')
    return (
      <li className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-surface-2/60" onClick={open}>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{order.customerName || 'Client'}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
            {dl}
          </p>
          <p className="truncate text-[12px] text-muted">
            {order.orderNumber} · {items} · {relative(order.createdAt)}
          </p>
        </div>
        <span className="tabular text-sm font-semibold whitespace-nowrap">{money(order.total, order.currency)}</span>
        <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
        {dialog}
      </li>
    )

  return (
    <li className="rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={open} className="min-w-0 flex-1 text-left">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{order.customerName || 'Client'}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
            {dl}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-muted">{[order.customerEmail, order.customerPhone ? prettyPhone(order.customerPhone) : null].filter(Boolean).join(' · ')}</p>
          <p className="mt-1 truncate text-sm">{items}</p>
        </button>
        <div className="text-right">
          <p className="tabular font-semibold">{money(order.total, order.currency)}</p>
          <p className="text-[12px] text-muted">
            {order.orderNumber} · {relative(order.createdAt)}
          </p>
        </div>
      </div>
      {actions.length > 0 && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions}</div>}
      {dialog}
    </li>
  )
}

function CartsList({ q, view }: { q: string; view: 'cards' | 'compact' | 'table' }) {
  const storeId = useStoreId()
  const toast = useToast()
  const qc = useQueryClient()
  const { store } = useCurrentStore()
  const canUpdate = useCan('orders.update')
  const [page, setPage] = useState(1)
  const [ignoredView, setIgnoredView] = useState(false)
  const key = ['store', storeId, 'leads', q, page, ignoredView] as const
  const list = useQuery({ queryKey: key, queryFn: () => api.get<{ total: number; pageSize: number; counts: { open: number; ignored: number }; data: Lead[] }>(`/stores/${storeId}/leads`, { q: q || undefined, page, ignored: ignoredView ? '1' : undefined }) })
  useEffect(() => setPage(1), [q, ignoredView])
  const refresh = () => void qc.invalidateQueries({ queryKey: ['store', storeId, 'leads'] })
  const remind = useMutation({
    mutationFn: (id: number) => api.post(`/stores/${storeId}/leads/${id}/remind`),
    onSuccess: () => (toast.success('Relance envoyée par email'), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  // « Ne plus relancer » : réversible depuis l'onglet Ignorés, donc pas de confirmation.
  const ignore = useMutation({
    mutationFn: ({ id, restore }: { id: number; restore?: boolean }) => api.post(`/stores/${storeId}/leads/${id}/${restore ? 'restore' : 'ignore'}`),
    onSuccess: (_r, v) => (toast.success(v.restore ? 'Panier remis dans la liste à relancer' : 'Ce panier ne sera plus relancé. Retrouvez-le dans Ignorés.'), refresh()),
    onError: (e) => toast.error(errorMessage(e)),
  })
  const switcher = (
    <div className="mb-3">
      <Segmented
        label="Paniers"
        value={ignoredView ? 'ignored' : 'open'}
        onChange={(v) => setIgnoredView(v === 'ignored')}
        options={[
          { value: 'open', label: `À relancer${list.data ? ` (${list.data.counts.open})` : ''}` },
          { value: 'ignored', label: `Ignorés${list.data ? ` (${list.data.counts.ignored})` : ''}` },
        ]}
      />
    </div>
  )
  if (list.isPending) return <>{switcher}<ListSkeleton rows={4} /></>
  if (list.error) return <>{switcher}<ErrorState error={list.error} onRetry={() => void list.refetch()} /></>
  if (!list.data.data.length)
    return (
      <>
        {switcher}
        {ignoredView ? (
          <EmptyState icon={<ShoppingBag className="size-5" />} title="Aucun panier ignoré" description="Les paniers que vous ne voulez plus relancer (client déjà contacté, pas intéressé, fausses coordonnées) apparaissent ici." />
        ) : (
          <EmptyState icon={<ShoppingBag className="size-5" />} title="Aucun panier à relancer" description="Les visiteurs qui laissent leur email ou leur numéro sans payer apparaissent ici. Zuri les relance aussi automatiquement par email si c’est activé dans Paramètres." />
        )}
      </>
    )
  const pages = Math.max(1, Math.ceil(list.data.total / list.data.pageSize))
  const stopLabel = ignoredView ? 'Remettre à relancer' : 'Ne plus relancer'
  const stop = (l: Lead) => ignore.mutate({ id: l.id, restore: ignoredView })
  return (
    <>
      {switcher}
      <p className="mb-2 px-1 text-[13px] text-muted">
        {list.data.total} panier{list.data.total > 1 ? 's' : ''} {ignoredView ? (list.data.total > 1 ? 'ignorés' : 'ignoré') : 'à relancer'}
      </p>
      {(() => {
        const iconBtn = (icon: ReactNode, label: string, onClick?: () => void, href?: string) =>
          href ? (
            <a key={label} href={href} target="_blank" rel="noopener" title={label} aria-label={label} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
              {icon}
            </a>
          ) : (
            <button key={label} type="button" title={label} aria-label={label} onClick={onClick} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg">
              {icon}
            </button>
          )
        const waFor = (l: Lead) => wa(l.phone, `Bonjour ${l.name?.split(' ')[0] ?? ''}, vous étiez sur le point de commander « ${l.productName ?? 'notre produit'} » chez ${store?.name ?? 'nous'}. Il est toujours disponible ici : ${l.productUrl ?? ''}`)
        const icons = (l: Lead) =>
          canUpdate
            ? [!ignoredView && l.email ? iconBtn(<Mail className="size-3.5" />, 'Relancer par email', () => remind.mutate(l.id)) : null, waFor(l) ? iconBtn(<MessageCircle className="size-3.5" />, 'WhatsApp', undefined, waFor(l)!) : null, iconBtn(ignoredView ? <RotateCcw className="size-3.5" /> : <BellOff className="size-3.5" />, stopLabel, () => stop(l))].filter(Boolean)
            : []
        const price = (l: Lead) => (l.price != null ? money(l.price, store?.currency ?? 'XOF') : '')
        if (view === 'table')
          return (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-[12px] font-medium text-muted uppercase">
                  <tr>
                    {['Date', 'Nom', 'Email', 'Téléphone', 'Produit', 'Prix', 'Relances', ''].map((h, i) => (
                      <th key={i} className={cx('px-3 py-2 font-medium whitespace-nowrap', h === 'Prix' && 'text-right')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.data.data.map((l) => (
                    <tr key={l.id} className="border-t border-line">
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted">{relative(l.createdAt)}</td>
                      <td className="px-3 py-2.5 font-medium">{l.name || 'Visiteur'}</td>
                      <td className="max-w-48 truncate px-3 py-2.5 text-muted">{l.email ?? '-'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted">{l.phone ? prettyPhone(l.phone) : '-'}</td>
                      <td className="max-w-56 truncate px-3 py-2.5">{l.productName ?? 'Produit supprimé'}</td>
                      <td className="tabular px-3 py-2.5 text-right whitespace-nowrap">{price(l)}</td>
                      <td className="tabular px-3 py-2.5 text-muted">{l.reminderCount}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-0.5">{icons(l)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        if (view === 'compact')
          return (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {list.data.data.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {l.name || 'Visiteur'}
                      {l.reminderCount > 0 && <span className="ml-2 text-[12px] font-normal text-muted">{l.reminderCount} relance{l.reminderCount > 1 ? 's' : ''}</span>}
                    </p>
                    <p className="truncate text-[12px] text-muted">{[l.productName, l.email, l.phone ? prettyPhone(l.phone) : null, relative(l.createdAt)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className="tabular text-sm font-semibold whitespace-nowrap">{price(l)}</span>
                  <div className="flex gap-0.5">{icons(l)}</div>
                </li>
              ))}
            </ul>
          )
        return (
      <ul className="grid gap-2.5 xl:grid-cols-2">
          {list.data.data.map((l) => {
            const waLink = wa(l.phone, `Bonjour ${l.name?.split(' ')[0] ?? ''}, vous étiez sur le point de commander « ${l.productName ?? 'notre produit'} » chez ${store?.name ?? 'nous'}. Il est toujours disponible ici : ${l.productUrl ?? ''}`)
            return (
              <li key={l.id} className="rounded-xl border border-line bg-surface p-3 sm:p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{l.name || 'Visiteur'}</span>
                      <Badge tone="amber">Panier abandonné</Badge>
                      {l.reminderCount > 0 && <span className="text-[12px] text-muted">{l.reminderCount} relance{l.reminderCount > 1 ? 's' : ''}</span>}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-muted">{[l.email, l.phone ? prettyPhone(l.phone) : null].filter(Boolean).join(' · ')}</p>
                    <p className="mt-1 truncate text-sm">{l.productName ?? 'Produit supprimé'}</p>
                  </div>
                  <div className="text-right">
                    {l.price != null && <p className="tabular font-semibold">{money(l.price, store?.currency ?? 'XOF')}</p>}
                    <p className="text-[12px] text-muted">{relative(l.createdAt)}</p>
                  </div>
                </div>
                {canUpdate && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    {!ignoredView && l.email && (
                      <Button size="sm" onClick={() => remind.mutate(l.id)} loading={remind.isPending && remind.variables === l.id}>
                        <Mail className="size-3.5" /> Relancer par email
                      </Button>
                    )}
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener" className={buttonClass('secondary', 'sm')}>
                        <MessageCircle className="size-3.5" /> WhatsApp
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => stop(l)}>
                      {ignoredView ? <RotateCcw className="size-3.5" /> : <BellOff className="size-3.5" />} {stopLabel}
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        )
      })()}
      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Pagination">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Page précédente">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="tabular text-sm text-muted">
            {page} / {pages}
          </span>
          <Button size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Page suivante">
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </>
  )
}

export default function DigitalOrders() {
  const { storeId, store } = useCurrentStore()
  const canExport = useCan('orders.export')
  const [params, setParams] = useSearchParams()
  const tab = (params.get('etat') ?? '') as Tab
  const [search, setSearch] = useState(params.get('q') ?? '')
  // Même choix d'affichage que les boutiques physiques (Cartes / Liste / Tableau), mémorisé par boutique.
  const wide = useMediaQuery('(min-width: 1024px)')
  const [prefs, setPrefs] = usePref<OrdersPrefs>(`orders-view:digital:${storeId}`, DEFAULT_PREFS)
  const view = prefs.view === 'table' && !wide ? 'compact' : prefs.view
  const q = useDebounced(search.trim(), 300)
  const page = Number(params.get('page') ?? 1) || 1
  const query = { paymentState: tab && tab !== 'carts' ? tab : undefined, q: q || undefined, page, archived: 'all' as const }
  // Toujours chargé : les compteurs des onglets restent justes même sur l'onglet Paniers.
  const orders = useOrders(query)
  const leadsCount = useQuery({ queryKey: ['store', storeId, 'leads', 'count'], queryFn: () => api.get<{ total: number }>(`/stores/${storeId}/leads`, { page: 1 }) })
  const counts = (orders.data as unknown as { paymentCounts?: Record<string, number> } | undefined)?.paymentCounts
  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k))
    if (!('page' in patch)) next.delete('page')
    setParams(next, { replace: true })
  }
  const n = (k: Tab) =>
    k === 'carts' ? (leadsCount.data?.total ?? 0) : k === '' ? (counts ? (counts.paid ?? 0) + (counts.pending ?? 0) + (counts.failed ?? 0) + (counts.refunded ?? 0) : 0) : (counts?.[k] ?? 0)
  const rows = (orders.data?.data ?? []) as (OrderListItem & { paymentFailed?: boolean; downloads?: number })[]
  const pages = orders.data ? Math.max(1, Math.ceil(orders.data.total / orders.data.pageSize)) : 1

  return (
    <>
      <PageHeader
        title="Ventes"
        description="Paiements, accès aux produits et paniers à relancer. Pas d’appel ni de livraison : tout est automatique."
        actions={
          canExport && tab !== 'carts' ? (
            <a href={ordersCsvUrl(storeId, query)} className={buttonClass('secondary', 'md')} download>
              <Download className="size-4" /> <span className="hidden sm:inline">Exporter CSV</span>
            </a>
          ) : undefined
        }
      />
      <div className="scrollbar-none -mx-4 mb-3 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="État">
        <div className="flex w-max gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key || 'all'}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => set({ etat: t.key })}
              className={cx(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                tab === t.key ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-surface text-muted hover:text-fg',
              )}
            >
              {t.label}
              <span className={cx('tabular rounded-full px-1.5 text-[11px]', tab === t.key ? 'bg-bg/20' : 'bg-surface-2')}>{n(t.key)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3 flex justify-end">
        <Segmented
          label="Affichage"
          value={view}
          onChange={(v) => setPrefs({ ...prefs, view: v })}
          options={[
            { value: 'cards' as const, label: <span className="inline-flex items-center gap-1.5" title="Cartes"><LayoutGrid className="size-4" /><span className="hidden md:inline">Cartes</span></span> },
            { value: 'compact' as const, label: <span className="inline-flex items-center gap-1.5" title="Liste compacte"><List className="size-4" /><span className="hidden md:inline">Liste compacte</span></span> },
            ...(wide ? [{ value: 'table' as const, label: <span className="inline-flex items-center gap-1.5" title="Tableau"><Table2 className="size-4" /><span className="hidden md:inline">Tableau</span></span> }] : []),
          ]}
        />
      </div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
        <Input type="search" placeholder="Nom, email, téléphone, n° de commande…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Rechercher" />
      </div>

      {tab === 'carts' ? (
        <CartsList q={q} view={view} />
      ) : orders.error && !orders.data ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : orders.isPending ? (
        <ListSkeleton rows={6} />
      ) : !rows.length ? (
        <EmptyState icon={<ShoppingBag className="size-5" />} title={q || tab ? 'Aucune vente ne correspond' : 'Aucune vente pour le moment'} description={q || tab ? 'Essayez un autre onglet ou une autre recherche.' : 'Les ventes de vos pages arrivent ici dès qu’un client commande.'} />
      ) : (
        <>
          {view === 'cards' && (
            <ul className="grid gap-2.5 xl:grid-cols-2">
              {rows.map((o) => (
                <OrderRow key={o.id} order={o} storeName={store?.name ?? ''} layout="card" />
              ))}
            </ul>
          )}
          {view === 'compact' && (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {rows.map((o) => (
                <OrderRow key={o.id} order={o} storeName={store?.name ?? ''} layout="compact" />
              ))}
            </ul>
          )}
          {view === 'table' && (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-[12px] font-medium text-muted uppercase">
                  <tr>
                    {['Commande', 'Client', 'Téléphone', 'Produits', 'Total', 'Paiement', 'Téléch.', ''].map((h, i) => (
                      <th key={i} className={cx('px-3 py-2 font-medium whitespace-nowrap', h === 'Total' && 'text-right')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <OrderRow key={o.id} order={o} storeName={store?.name ?? ''} layout="table" />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Pagination">
              <Button size="sm" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })} aria-label="Page précédente">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="tabular text-sm text-muted">
                {page} / {pages}
              </span>
              <Button size="sm" disabled={page >= pages} onClick={() => set({ page: String(page + 1) })} aria-label="Page suivante">
                <ChevronRight className="size-4" />
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
