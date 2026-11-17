import { FULFILLMENT_STATUSES, FULFILLMENT_TRANSITIONS, PAYMENT_STATUSES, type FulfillmentStatus } from '@zuri/shared'
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Filter, Plus, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ConfirmDialog, Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, ButtonLink, buttonClass, Checkbox, cx, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Select } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { ordersCsvUrl, useBulkOrderStatus, useOrders } from '@/hooks/resources'
import { useDebounced } from '@/hooks/useDebounced'
import type { Query } from '@/lib/api'
import { money, prettyPhone, relative } from '@/lib/format'
import { FULFILLMENT_LABEL, PAYMENT_STATUS_LABEL, TRANSITION_ACTION } from '@/lib/labels'
import type { OrderListItem } from '@/lib/types'
import { ContactButtons, PaymentBadge, ShipDialog, StatusActions, StatusBadge, whatsappUrl } from './shared'

const TABS: FulfillmentStatus[] = ['new', 'unreachable', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled']

function CustomerFlags({ order }: { order: OrderListItem }) {
  if (!order.customerFlag && !order.customerReturns) return null
  return (
    <span className="inline-flex flex-wrap gap-1">
      {order.customerFlag && (
        <Badge tone="red">
          <AlertTriangle className="size-3" /> Client bloqué
        </Badge>
      )}
      {order.customerReturns > 0 && (
        <Badge tone="orange">
          {order.customerReturns} retour{order.customerReturns > 1 ? 's' : ''}
        </Badge>
      )}
    </span>
  )
}

const itemsText = (o: OrderListItem) => o.items.map((i) => `${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`).join(', ')

function OrderCard({ order, selected, onSelect, storeName }: { order: OrderListItem; selected: boolean; onSelect: (v: boolean) => void; storeName?: string }) {
  const navigate = useNavigate()
  const open = () => navigate(String(order.id))
  const cod = order.paymentMethod === 'cod'
  return (
    <li
      className={cx('rounded-xl border bg-surface p-4 transition-colors', selected ? 'border-accent ring-1 ring-accent' : 'border-line')}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && open()}
      tabIndex={0}
      role="link"
      aria-label={`Commande ${order.orderNumber}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onChange={onSelect} label={`Sélectionner ${order.orderNumber}`} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{order.customerName ?? 'Client'}</p>
              <p className="tabular text-[13px] text-muted">{prettyPhone(order.customerPhone)}</p>
            </div>
            <div className="text-right">
              <p className="tabular font-semibold">{money(order.total, order.currency)}</p>
              <p className="text-[12px] text-subtle">{relative(order.createdAt)}</p>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm">{itemsText(order)}</p>
          {(order.city || order.address) && <p className="mt-0.5 truncate text-[13px] text-muted">{[order.city, order.address].filter(Boolean).join(' · ')}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={order.fulfillmentStatus} />
            {cod ? <Badge>COD</Badge> : <PaymentBadge status={order.paymentStatus} />}
            {order.kind === 'digital' && <Badge tone="violet">Digital</Badge>}
            {order.callAttempts > 0 && <Badge tone="orange">{order.callAttempts} appel{order.callAttempts > 1 ? 's' : ''}</Badge>}
            <CustomerFlags order={order} />
            <span className="ml-auto text-[12px] text-subtle">{order.orderNumber}</span>
          </div>
        </div>
      </div>
      {order.kind !== 'digital' && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          {cod && ['new', 'unreachable', 'confirmed'].includes(order.fulfillmentStatus) && (
            <ContactButtons phone={order.customerPhone} waUrl={whatsappUrl(order, order.items, storeName)} size="sm" className="[&>a]:flex-1" />
          )}
          <StatusActions order={order} size="sm" className="[&>button]:flex-1" />
        </div>
      )}
    </li>
  )
}

function FiltersDialog({ open, onClose, params, apply }: { open: boolean; onClose: () => void; params: URLSearchParams; apply: (v: Record<string, string>) => void }) {
  const [v, setV] = useState({ type: '', payment: '', from: '', to: '' })
  useEffect(() => {
    if (open) setV({ type: params.get('type') ?? '', payment: params.get('payment') ?? '', from: params.get('from') ?? '', to: params.get('to') ?? '' })
  }, [open, params])
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Filtres"
      footer={
        <>
          <Button onClick={() => apply({ type: '', payment: '', from: '', to: '' })}>Réinitialiser</Button>
          <Button variant="primary" onClick={() => apply(v)}>
            Appliquer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Type de produit"
          value={v.type}
          onChange={(e) => setV({ ...v, type: e.target.value })}
          options={[
            { value: '', label: 'Tous' },
            { value: 'physical', label: 'Physique' },
            { value: 'digital', label: 'Digital' },
          ]}
        />
        <Select label="Statut du paiement" value={v.payment} onChange={(e) => setV({ ...v, payment: e.target.value })} options={[{ value: '', label: 'Tous' }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_STATUS_LABEL[s] }))]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Du" type="date" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} />
          <Input label="Au" type="date" value={v.to} onChange={(e) => setV({ ...v, to: e.target.value })} />
        </div>
      </div>
    </Dialog>
  )
}

function BulkBar({ ids, orders, onDone }: { ids: string[]; orders: OrderListItem[]; onDone: () => void }) {
  const bulk = useBulkOrderStatus()
  const toast = useToast()
  const [ship, setShip] = useState(false)
  const [confirm, setConfirm] = useState<FulfillmentStatus | null>(null)
  // Actions communes à toute la sélection.
  const common = useMemo(() => {
    const sel = orders.filter((o) => ids.includes(o.id))
    if (!sel.length) return []
    return FULFILLMENT_TRANSITIONS[sel[0]!.fulfillmentStatus].filter((t) => sel.every((o) => FULFILLMENT_TRANSITIONS[o.fulfillmentStatus].includes(t)))
  }, [ids, orders])

  const run = (to: FulfillmentStatus, extra: { courier?: string; note?: string } = {}) =>
    bulk.mutate(
      { ids, fulfillmentStatus: to, ...extra },
      {
        onSuccess: ({ results }) => {
          const ko = results.filter((r) => !r.ok)
          if (ko.length) toast.error(`${results.length - ko.length} mise(s) à jour, ${ko.length} échec(s) : ${ko[0]?.error ?? ''}`)
          else toast.success(`${results.length} commande(s) : ${FULFILLMENT_LABEL[to].toLowerCase()}`)
          onDone()
        },
        onError: (e) => toast.error(e),
        onSettled: () => {
          setShip(false)
          setConfirm(null)
        },
      },
    )

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 px-3 lg:bottom-6 lg:left-64 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-xl border border-line-strong bg-surface p-2.5 shadow-xl">
        <span className="px-1.5 text-sm font-medium">{ids.length} sélectionnée(s)</span>
        <div className="flex flex-1 flex-wrap justify-end gap-1.5">
          {common.length === 0 && <span className="text-[13px] text-muted">Aucune action commune</span>}
          {common.map((to) => (
            <Button
              key={to}
              size="sm"
              variant={to === 'confirmed' || to === 'delivered' ? 'success' : to === 'shipped' ? 'primary' : 'secondary'}
              disabled={bulk.isPending}
              onClick={() => (to === 'shipped' ? setShip(true) : to === 'cancelled' || to === 'returned' ? setConfirm(to) : run(to))}
            >
              {TRANSITION_ACTION[to]}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={onDone} aria-label="Tout désélectionner">
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <ShipDialog open={ship} count={ids.length} onClose={() => setShip(false)} onSubmit={(v) => run('shipped', v)} loading={bulk.isPending} />
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm)}
        title={`${confirm ? TRANSITION_ACTION[confirm] : ''} ${ids.length} commande(s) ?`}
        message="Le stock des articles sera remis en vente."
        danger
        confirmLabel="Confirmer"
        loading={bulk.isPending}
      />
    </div>
  )
}

export default function OrdersList() {
  const { storeId, store } = useCurrentStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const q = useDebounced(search.trim(), 350)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const status = (params.get('status') ?? '') as FulfillmentStatus | ''
  const page = Number(params.get('page') ?? 1) || 1
  const to = params.get('to')
  const query: Query = {
    q: q || undefined,
    fulfillmentStatus: status || undefined,
    type: params.get('type') || undefined,
    paymentStatus: params.get('payment') || undefined,
    from: params.get('from') || undefined,
    // Inclure toute la journée de fin.
    to: to ? `${to}T23:59:59` : undefined,
    page,
  }
  const { data, error, isPending, refetch, isFetching } = useOrders(query)

  const update = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (resetPage) next.delete('page')
    setParams(next, { replace: true })
    setSelected([])
  }

  useEffect(() => {
    if ((params.get('q') ?? '') !== q) update({ q })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const counts = data?.statusCounts ?? {}
  const totalAll = FULFILLMENT_STATUSES.reduce((s, k) => s + (counts[k] ?? 0), 0)
  const activeFilters = ['type', 'payment', 'from', 'to'].filter((k) => params.get(k))
  const rows = data?.data ?? []
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const toggle = (id: string, v: boolean) => setSelected((s) => (v ? [...s, id] : s.filter((x) => x !== id)))

  return (
    <>
      <PageHeader
        title="Commandes"
        actions={
          <>
            <a href={ordersCsvUrl(storeId, query)} className={buttonClass('secondary', 'md')} download>
              <Download className="size-4" /> <span className="hidden sm:inline">Exporter CSV</span>
              <span className="sm:hidden">CSV</span>
            </a>
            <ButtonLink to="new" variant="primary">
              <Plus className="size-4" /> Saisir
            </ButtonLink>
          </>
        }
      />

      {/* Onglets par statut */}
      <div className="scrollbar-none -mx-4 mb-3 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Statut">
        <div className="flex w-max gap-1.5">
          {[{ key: '' as const, label: 'Toutes', n: totalAll }, ...TABS.map((k) => ({ key: k, label: FULFILLMENT_LABEL[k], n: counts[k] ?? 0 }))].map((t) => (
            <button
              key={t.key || 'all'}
              role="tab"
              aria-selected={status === t.key}
              onClick={() => update({ status: t.key })}
              className={cx(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
                status === t.key ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-surface text-muted hover:text-fg',
              )}
            >
              {t.label}
              <span className={cx('tabular rounded-full px-1.5 text-[11px]', status === t.key ? 'bg-bg/20' : 'bg-surface-2')}>{t.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
          <Input type="search" placeholder="Nom, téléphone, n° de commande, ville…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" aria-label="Rechercher une commande" />
        </div>
        <Button onClick={() => setFiltersOpen(true)} aria-label="Filtres">
          <Filter className="size-4" />
          <span className="hidden sm:inline">Filtres</span>
          {activeFilters.length > 0 && <span className="tabular rounded-full bg-accent px-1.5 text-[11px] text-accent-fg">{activeFilters.length}</span>}
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {activeFilters.map((k) => {
            const v = params.get(k)!
            const label =
              k === 'type' ? (v === 'digital' ? 'Digital' : 'Physique') : k === 'payment' ? `Paiement : ${PAYMENT_STATUS_LABEL[v as keyof typeof PAYMENT_STATUS_LABEL] ?? v}` : k === 'from' ? `Depuis le ${v}` : `Jusqu’au ${v}`
            return (
              <button key={k} onClick={() => update({ [k]: '' })} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pr-2 pl-3 text-[13px] hover:bg-line">
                {label} <X className="size-3.5" />
              </button>
            )
          })}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mb-2 flex items-center gap-2 px-1 text-[13px] text-muted">
          <Checkbox checked={selected.length === rows.length} onChange={(v) => setSelected(v ? rows.map((r) => r.id) : [])} label="Tout sélectionner" />
          <span>
            {data?.total} commande{(data?.total ?? 0) > 1 ? 's' : ''}
          </span>
          {isFetching && <span className="text-subtle">· mise à jour…</span>}
        </div>
      )}

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-5" />}
          title={q || activeFilters.length || status ? 'Aucune commande ne correspond' : 'Aucune commande pour le moment'}
          description={q || activeFilters.length || status ? 'Essayez un autre onglet ou retirez des filtres.' : 'Les commandes de vos pages de vente arrivent ici. Vous pouvez aussi saisir une commande reçue par téléphone ou WhatsApp.'}
          action={
            q || activeFilters.length || status ? (
              <Button
                onClick={() => {
                  setSearch('')
                  setParams(new URLSearchParams(), { replace: true })
                }}
              >
                Tout afficher
              </Button>
            ) : (
              <ButtonLink to="new" variant="primary">
                <Plus className="size-4" /> Saisir une commande
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="grid gap-2.5 xl:grid-cols-2">
          {rows.map((o) => (
            <OrderCard key={o.id} order={o} selected={selected.includes(o.id)} onSelect={(v) => toggle(o.id, v)} storeName={store?.name} />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Pagination">
          <Button size="sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) }, false)} aria-label="Page précédente">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="tabular text-sm text-muted">
            Page {page} / {pages}
          </span>
          <Button size="sm" disabled={page >= pages} onClick={() => update({ page: String(page + 1) }, false)} aria-label="Page suivante">
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}

      <FiltersDialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        params={params}
        apply={(v) => {
          update(v)
          setFiltersOpen(false)
        }}
      />
      {selected.length > 0 && <BulkBar ids={selected} orders={rows} onDone={() => setSelected([])} />}
    </>
  )
}
