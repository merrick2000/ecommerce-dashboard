import { ArrowLeft, Ban, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, PageHeader, Skeleton, Stat, Textarea } from '@/components/ui'
import { useCan, useCurrentStore } from '@/hooks/auth'
import { useCustomer, useUpdateCustomer } from '@/hooks/resources'
import { date, money, num, phoneDigits, prettyPhone } from '@/lib/format'
import { PaymentBadge, StatusBadge } from '../orders/shared'

export default function CustomerDetail() {
  const { customerId } = useParams()
  const id = customerId ?? ''
  const { storeId, store } = useCurrentStore()
  const currency = store?.currency ?? 'XOF'
  const toast = useToast()
  const { data: c, error, isPending, refetch } = useCustomer(id)
  const update = useUpdateCustomer(id)
  const canEdit = useCan('customers.edit')
  const [notes, setNotes] = useState<string | null>(null)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const back = (
    <Link to={`/stores/${storeId}/customers`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Clients
    </Link>
  )

  if (error) return <>{back}<ErrorState error={error} onRetry={() => void refetch()} /></>
  if (isPending)
    return (
      <div className="space-y-4">
        {back}
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )

  const currentNotes = notes ?? c.notes ?? ''
  const toggleBlock = () =>
    update.mutate(
      { isBlocked: !c.isBlocked },
      {
        onSuccess: (r) => {
          toast.success(r.isBlocked ? 'Client bloqué' : 'Client débloqué')
          setConfirmBlock(false)
        },
        onError: (e) => toast.error(e),
      },
    )

  return (
    <>
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {c.name ?? 'Sans nom'} {c.isBlocked && <Badge tone="red">Bloqué</Badge>}
          </span>
        }
        description={`Client depuis le ${date(c.createdAt)}`}
        actions={
          canEdit && (
          <Button variant={c.isBlocked ? 'secondary' : 'danger'} onClick={() => (c.isBlocked ? toggleBlock() : setConfirmBlock(true))} loading={update.isPending && update.variables?.isBlocked !== undefined}>
            {c.isBlocked ? <ShieldCheck className="size-4" /> : <Ban className="size-4" />}
            {c.isBlocked ? 'Débloquer' : 'Bloquer'}
          </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
              <Stat label="Commandes" value={num(c.ordersCount)} />
              <Stat label="Livrées" value={num(c.deliveredCount)} />
              <Stat label="Retours" value={<span className={c.returnedCount ? 'text-orange-600' : ''}>{num(c.returnedCount)}</span>} />
              <Stat label="Total dépensé" value={money(c.totalSpent, currency)} />
            </dl>
          </Card>
          <Card title="Historique des commandes">
            {c.orders.length === 0 ? (
              <p className="text-sm text-muted">Aucune commande.</p>
            ) : (
              <ul className="-my-2 divide-y divide-line">
                {c.orders.map((o) => (
                  <li key={o.id}>
                    <Link to={`/stores/${storeId}/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                      <div className="min-w-0">
                        <p className="font-medium">{o.orderNumber}</p>
                        <p className="text-[13px] text-muted">{date(o.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="tabular text-sm font-medium">{money(o.total, o.currency)}</span>
                        <span className="flex gap-1">
                          <StatusBadge status={o.fulfillmentStatus} />
                          <PaymentBadge status={o.paymentStatus} />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Coordonnées">
            <p className="tabular font-medium">{prettyPhone(c.phone)}</p>
            {c.email && <p className="text-sm text-muted">{c.email}</p>}
            <p className="mt-2 text-sm">{[c.address, c.city].filter(Boolean).join(', ') || '-'}</p>
            <div className="mt-4 flex gap-2">
              <a href={`tel:${c.phone}`} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-strong text-sm font-medium hover:bg-surface-2">
                <Phone className="size-4" /> Appeler
              </a>
              <a href={`https://wa.me/${phoneDigits(c.phone)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>
          </Card>
          <Card title="Notes internes">
            <Textarea aria-label="Notes internes" readOnly={!canEdit} rows={4} placeholder="Préférences, historique d’appels…" value={currentNotes} onChange={(e) => setNotes(e.target.value)} />
            <Button
              className="mt-3"
              disabled={notes === null || notes === (c.notes ?? '')}
              loading={update.isPending && update.variables?.notes !== undefined}
              onClick={() =>
                update.mutate(
                  { notes: currentNotes.trim() || null },
                  {
                    onSuccess: () => {
                      setNotes(null)
                      toast.success('Notes enregistrées')
                    },
                    onError: (e) => toast.error(e),
                  },
                )
              }
            >
              Enregistrer
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        onConfirm={toggleBlock}
        title="Bloquer ce client ?"
        message="Ses prochaines commandes seront signalées dans la liste des commandes."
        confirmLabel="Bloquer"
        danger
        loading={update.isPending}
      />
    </>
  )
}
