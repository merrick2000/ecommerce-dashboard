import { PAYMENT_STATUSES, type PaymentStatus } from '@zuri/shared'
import { AlertTriangle, ArrowLeft, ChevronRight, Hand, MapPin, Pencil, Send, Truck, UserCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, cx, ErrorState, Input, PageHeader, Select, Skeleton, Stat, Textarea } from '@/components/ui'
import { useCan, useCurrentStore } from '@/hooks/auth'
import { useOrder, useOrderNote, useOrderPayment, useUpdateOrder } from '@/hooks/resources'
import { useAssignees, useAssignOrder, useClaimOrder, useReleaseOrder } from '@/hooks/team'
import { strOrNull } from '@/lib/form'
import { dateTime, money, prettyPhone } from '@/lib/format'
import { FULFILLMENT_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/labels'
import type { OrderDetail as Order, OrderEvent } from '@/lib/types'
import { ContactButtons, PaymentBadge, StatusActions, StatusBadge, whatsappUrl } from './shared'

function eventTitle(e: OrderEvent): string {
  if (e.type === 'status') {
    const to = e.data?.to as keyof typeof FULFILLMENT_LABEL | undefined
    return to ? `Statut : ${FULFILLMENT_LABEL[to] ?? to}` : 'Changement de statut'
  }
  if (e.type === 'note') return 'Note'
  if (e.type === 'created') return 'Commande créée'
  if (e.type === 'edited') return 'Informations modifiées'
  if (e.type.startsWith('payment_')) {
    const s = e.type.slice(8) as PaymentStatus
    return `Paiement : ${PAYMENT_STATUS_LABEL[s] ?? s}`
  }
  return e.type
}

function Timeline({ events }: { events: OrderEvent[] }) {
  const list = [...events].reverse()
  if (!list.length) return <p className="text-sm text-muted">Aucun événement.</p>
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {list.map((e) => {
        const courier = typeof e.data?.courier === 'string' ? e.data.courier : null
        const tracking = typeof e.data?.trackingNumber === 'string' ? e.data.trackingNumber : null
        return (
          <li key={e.id} className="relative">
            <span className={cx('absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-surface', e.type === 'note' ? 'bg-sky-500' : e.type === 'status' ? 'bg-accent' : 'bg-line-strong')} />
            <p className="text-sm font-medium">{eventTitle(e)}</p>
            {e.message && e.type !== 'created' && <p className={cx('mt-0.5 text-sm whitespace-pre-line', e.type === 'note' ? 'rounded-lg bg-surface-2 px-3 py-2' : 'text-muted')}>{e.message}</p>}
            {(courier || tracking) && (
              <p className="mt-0.5 text-[13px] text-muted">
                {courier && `Livreur : ${courier}`}
                {courier && tracking && ' · '}
                {tracking && `Suivi : ${tracking}`}
              </p>
            )}
            <p className="mt-0.5 text-[12px] text-subtle">
              {dateTime(e.createdAt)}
              {e.userName ? ` · ${e.userName}` : e.userId ? '' : ' · Système'}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function NoteForm({ orderId }: { orderId: string }) {
  const [note, setNote] = useState('')
  const add = useOrderNote(orderId)
  const toast = useToast()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    add.mutate(note.trim(), { onSuccess: () => setNote(''), onError: (err) => toast.error(err) })
  }
  return (
    <form onSubmit={submit} className="mb-5 flex items-end gap-2">
      <Textarea aria-label="Ajouter une note" placeholder="Ajouter une note (appel, demande du client…)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} wrapClass="flex-1" className="min-h-11" />
      <Button type="submit" variant="primary" size="icon" loading={add.isPending} disabled={!note.trim()} aria-label="Ajouter la note">
        {!add.isPending && <Send className="size-4" />}
      </Button>
    </form>
  )
}

function EditDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const update = useUpdateOrder(order.id)
  const toast = useToast()
  const [v, setV] = useState({ customerName: '', customerPhone: '', city: '', address: '', courier: '', trackingNumber: '' })
  const [prevOpen, setPrevOpen] = useState(false)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open)
      setV({
        customerName: order.customerName ?? '',
        customerPhone: order.customerPhone ?? '',
        city: order.city ?? '',
        address: order.address ?? '',
        courier: order.courier ?? '',
        trackingNumber: order.trackingNumber ?? '',
      })
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    update.mutate(
      { customerName: v.customerName.trim(), customerPhone: v.customerPhone.trim(), city: strOrNull(v.city), address: strOrNull(v.address), courier: strOrNull(v.courier), trackingNumber: strOrNull(v.trackingNumber) },
      {
        onSuccess: () => {
          toast.success('Commande mise à jour')
          onClose()
        },
        onError: (err) => toast.error(err),
      },
    )
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Modifier les informations"
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" form="edit-order" variant="primary" loading={update.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="edit-order" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Input label="Nom du client" value={v.customerName} onChange={(e) => setV({ ...v, customerName: e.target.value })} />
        <Input label="Téléphone" type="tel" inputMode="tel" value={v.customerPhone} onChange={(e) => setV({ ...v, customerPhone: e.target.value })} />
        <Input label="Ville" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} />
        <Input label="Adresse" value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} />
        <Input label="Livreur" value={v.courier} onChange={(e) => setV({ ...v, courier: e.target.value })} />
        <Input label="N° de suivi" value={v.trackingNumber} onChange={(e) => setV({ ...v, trackingNumber: e.target.value })} />
      </form>
    </Dialog>
  )
}

function PaymentCard({ order, canEdit }: { order: Order; canEdit: boolean }) {
  const pay = useOrderPayment(order.id)
  const toast = useToast()
  const [status, setStatus] = useState<PaymentStatus>(order.paymentStatus)
  const [prev, setPrev] = useState(order.paymentStatus)
  if (prev !== order.paymentStatus) {
    setPrev(order.paymentStatus)
    setStatus(order.paymentStatus)
  }
  return (
    <Card title="Paiement">
      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Méthode" value={<span className="font-medium">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>} />
        <Stat label="Statut" value={<PaymentBadge status={order.paymentStatus} />} />
        {order.paidAt && <Stat label="Payée le" value={dateTime(order.paidAt)} />}
        {order.paymentProvider && <Stat label="Prestataire" value={order.paymentProvider} sub={order.paymentRef ?? undefined} />}
      </dl>
      {canEdit && (
        <div className="mt-4 flex items-end gap-2 border-t border-line pt-4">
          <Select label="Changer le statut" wrapClass="flex-1" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)} options={PAYMENT_STATUSES.map((s) => ({ value: s, label: PAYMENT_STATUS_LABEL[s] }))} />
          <Button
            disabled={status === order.paymentStatus}
            loading={pay.isPending}
            onClick={() => pay.mutate({ paymentStatus: status }, { onSuccess: () => toast.success('Paiement mis à jour'), onError: (e) => toast.error(e) })}
          >
            Appliquer
          </Button>
        </div>
      )}
      {order.transactions.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-[13px] font-medium text-muted">Transactions</p>
          <ul className="divide-y divide-line">
            {order.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {t.provider}
                    {t.network ? ` · ${t.network}` : ''}
                  </p>
                  <p className="truncate text-[12px] text-subtle">
                    {dateTime(t.createdAt)}
                    {t.providerRef ? ` · ${t.providerRef}` : ''}
                  </p>
                  {t.errorMessage && <p className="text-[12px] text-red-600">{t.errorMessage}</p>}
                </div>
                <div className="text-right">
                  <p className="tabular">{money(t.amount, order.currency)}</p>
                  <Badge tone={t.status === 'paid' ? 'green' : t.status === 'failed' ? 'red' : 'neutral'}>{t.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

/** Qui traite la commande : « Je prends », « Libérer », « Attribuer à ». */
function AssignmentCard({ order }: { order: Order }) {
  const { me } = useCurrentStore()
  const canUpdate = useCan('orders.update')
  const canAssign = useCan('orders.assign')
  const toast = useToast()
  const claim = useClaimOrder(order.id)
  const release = useReleaseOrder(order.id)
  const assign = useAssignOrder(order.id)
  const assignees = useAssignees(canAssign)
  const mine = order.assignedTo != null && order.assignedTo === me?.id
  const free = order.assignedTo == null
  const done = (msg: string) => ({ onSuccess: () => toast.success(msg), onError: (e: unknown) => toast.error(e) })

  if (!canUpdate && !canAssign && free) return null
  return (
    <Card title="Prise en charge">
      <div className="flex items-center gap-3">
        <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-full', free ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-accent-soft text-accent')}>
          {free ? <Hand className="size-4" /> : <UserCheck className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="font-medium">{free ? 'Libre' : mine ? 'Vous' : (order.assigneeName ?? 'Membre de l’équipe')}</p>
          <p className="text-[13px] text-muted">{free ? 'Personne ne s’en occupe encore.' : order.assignedAt ? `Depuis le ${dateTime(order.assignedAt)}` : 'Attribuée'}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {canUpdate && free && (
          <Button variant="primary" size="sm" loading={claim.isPending} onClick={() => claim.mutate(undefined, done('Commande prise en charge'))}>
            <Hand className="size-3.5" /> Je prends
          </Button>
        )}
        {canUpdate && mine && (
          <Button size="sm" loading={release.isPending} onClick={() => release.mutate(undefined, done('Commande libérée'))}>
            Libérer
          </Button>
        )}
      </div>
      {canAssign && (
        <div className="mt-3">
          <Select
            label="Attribuer à"
            value={order.assignedTo == null ? '' : String(order.assignedTo)}
            disabled={assign.isPending || assignees.isPending}
            onChange={(e) => {
              const userId = e.target.value ? Number(e.target.value) : null
              const name = assignees.data?.find((a) => a.userId === userId)?.name
              assign.mutate(userId, done(userId ? `Attribuée à ${name ?? 'ce membre'}` : 'Commande libérée'))
            }}
            options={[
              { value: '', label: 'Personne (libre)' },
              // Membre actuel absent de la liste (retiré de l'équipe) : on l'affiche quand même.
              ...(order.assignedTo != null && !(assignees.data ?? []).some((a) => a.userId === order.assignedTo) ? [{ value: String(order.assignedTo), label: order.assigneeName ?? 'Membre' }] : []),
              ...(assignees.data ?? []).map((a) => ({ value: String(a.userId), label: a.userId === me?.id ? `${a.name} (vous)` : a.name })),
            ]}
          />
        </div>
      )}
    </Card>
  )
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const { storeId, store } = useCurrentStore()
  const canEditPayment = useCan('orders.payment')
  const canUpdate = useCan('orders.update')
  const canSeeCustomers = useCan('customers.view')
  const { data: order, error, isPending, refetch } = useOrder(orderId ?? '')
  const [editing, setEditing] = useState(false)
  const back = (
    <Link to={`/stores/${storeId}/orders`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Commandes
    </Link>
  )

  if (error && !order) return <>{back}<ErrorState error={error} onRetry={() => void refetch()} /></>
  if (isPending)
    return (
      <div className="space-y-4">
        {back}
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )

  const physical = order.kind !== 'digital'

  return (
    <>
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {order.orderNumber} <StatusBadge status={order.fulfillmentStatus} />
          </span>
        }
        description={`${dateTime(order.createdAt)} · ${order.source === 'manual' ? 'Saisie manuelle' : 'Page de vente'}`}
      />

      {order.customer?.isBlocked && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Ce client est bloqué. Vérifiez avant d’expédier.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {/* Actions rapides */}
          {((canUpdate && order.allowedTransitions.length > 0) || order.customerPhone) && (
            <Card>
              <div className="space-y-3 p-4">
                {order.customerPhone && <ContactButtons phone={order.customerPhone} waUrl={whatsappUrl(order, order.items, store?.name)} className="[&>a]:flex-1 sm:[&>a]:flex-none" />}
                {canUpdate && <StatusActions order={order} transitions={order.allowedTransitions} className="[&>button]:flex-1 sm:[&>button]:flex-none" />}
              </div>
            </Card>
          )}

          <Card title="Articles">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {i.productId ? (
                        <Link to={`/stores/${storeId}/products/${i.productId}`} className="hover:underline">
                          {i.name}
                        </Link>
                      ) : (
                        i.name
                      )}
                    </p>
                    <p className="text-[13px] text-muted">
                      {i.variantName && `${i.variantName} · `}
                      {i.quantity} × {money(i.unitPrice, order.currency)}
                    </p>
                  </div>
                  <p className="tabular font-medium">{money(i.total, order.currency)}</p>
                </li>
              ))}
            </ul>
            <dl className="tabular mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total</dt>
                <dd>{money(order.subtotal, order.currency)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Remise{order.promoCode ? ` (${order.promoCode})` : ''}</dt>
                  <dd className="text-emerald-700 dark:text-emerald-400">−{money(order.discount, order.currency)}</dd>
                </div>
              )}
              {physical && (
                <div className="flex justify-between">
                  <dt className="text-muted">Livraison{order.zone ? ` (${order.zone.name})` : ''}</dt>
                  <dd>{order.shippingFee > 0 ? money(order.shippingFee, order.currency) : 'Offerte'}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1.5 text-base font-semibold">
                <dt>Total</dt>
                <dd>{money(order.total, order.currency)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Historique">
            {canUpdate && <NoteForm orderId={order.id} />}
            <Timeline events={order.events} />
          </Card>
        </div>

        <div className="space-y-4">
          <AssignmentCard order={order} />
          <Card
            title="Client"
            actions={
              canUpdate && (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" /> Modifier
                </Button>
              )
            }
          >
            <p className="font-medium">{order.customerName ?? '-'}</p>
            <p className="tabular text-sm text-muted">{prettyPhone(order.customerPhone)}</p>
            {order.customerEmail && <p className="text-sm text-muted">{order.customerEmail}</p>}
            {order.customer && (
              <>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>{order.customer.ordersCount} commande(s)</Badge>
                  {order.customer.deliveredCount > 0 && <Badge tone="green">{order.customer.deliveredCount} livrée(s)</Badge>}
                  {order.customer.returnedCount > 0 && <Badge tone="orange">{order.customer.returnedCount} retour(s)</Badge>}
                  {order.customer.isBlocked && <Badge tone="red">Bloqué</Badge>}
                </div>
                {canSeeCustomers && <Link to={`/stores/${storeId}/customers/${order.customer.id}`} className="mt-3 inline-flex items-center gap-0.5 text-sm font-medium text-accent hover:underline">
                  Voir l’historique <ChevronRight className="size-4" />
                </Link>}
              </>
            )}
            {physical && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                  <MapPin className="size-3.5" /> Adresse de livraison
                </p>
                <p className="mt-1 text-sm">{[order.address, order.city].filter(Boolean).join(', ') || '-'}</p>
                {order.zone && <p className="text-[13px] text-muted">Zone : {order.zone.name}{order.zone.etaLabel ? ` · ${order.zone.etaLabel}` : ''}</p>}
              </div>
            )}
            {(order.courier || order.trackingNumber) && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                  <Truck className="size-3.5" /> Expédition
                </p>
                <p className="mt-1 text-sm">{order.courier ?? '-'}</p>
                {order.trackingNumber && <p className="text-[13px] text-muted">Suivi : {order.trackingNumber}</p>}
              </div>
            )}
            {order.customerNote && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[13px] font-medium text-muted">Note du client</p>
                <p className="mt-1 text-sm whitespace-pre-line">{order.customerNote}</p>
              </div>
            )}
            {!!order.metadata?.customFields?.length && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-[13px] font-medium text-muted">Informations complémentaires</p>
                <dl className="mt-1 space-y-1 text-sm">
                  {order.metadata.customFields.map((f) => (
                    <div key={f.key} className="flex flex-wrap gap-x-2">
                      <dt className="text-muted">{f.label} :</dt>
                      <dd className="font-medium whitespace-pre-line">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Card>

          <PaymentCard order={order} canEdit={canEditPayment} />

          {(order.utmSource || order.utmCampaign) && (
            <Card title="Origine">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {order.utmSource && <Stat label="Source" value={order.utmSource} />}
                {order.utmMedium && <Stat label="Support" value={order.utmMedium} />}
                {order.utmCampaign && <Stat label="Campagne" value={order.utmCampaign} />}
              </dl>
            </Card>
          )}
        </div>
      </div>

      <EditDialog order={order} open={editing} onClose={() => setEditing(false)} />
    </>
  )
}
