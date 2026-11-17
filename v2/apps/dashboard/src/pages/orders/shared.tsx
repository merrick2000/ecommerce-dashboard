/**
 * Briques partagées liste / détail des commandes : badges, liens d'appel et
 * WhatsApp, boutons de statut limités aux transitions autorisées.
 */
import { FULFILLMENT_TRANSITIONS, type FulfillmentStatus, type PaymentStatus } from '@zuri/shared'
import { Ban, Check, MessageCircle, PackageCheck, Phone, PhoneOff, RotateCcw, Truck, Undo2, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog, Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, cx, Input, Textarea } from '@/components/ui'
import { useOrderStatus } from '@/hooks/resources'
import { money, phoneDigits } from '@/lib/format'
import { FULFILLMENT_LABEL, FULFILLMENT_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE, TRANSITION_ACTION } from '@/lib/labels'
import { readLocal, writeLocal } from '@/lib/storage'
import type { OrderBase } from '@/lib/types'

export function StatusBadge({ status }: { status: FulfillmentStatus }) {
  return <Badge tone={FULFILLMENT_TONE[status]}>{FULFILLMENT_LABEL[status]}</Badge>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_STATUS_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>
}

interface WaItem {
  name: string
  variantName: string | null
  quantity: number
}

/** Message de confirmation pré-rempli (français) pour WhatsApp. */
export function whatsappUrl(order: Pick<OrderBase, 'customerPhone' | 'customerName' | 'orderNumber' | 'total' | 'currency' | 'address' | 'city' | 'paymentMethod'>, items: WaItem[], storeName?: string) {
  const digits = phoneDigits(order.customerPhone)
  const firstName = (order.customerName ?? '').trim().split(/\s+/)[0] ?? ''
  const lines = items.map((i) => `• ${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`)
  const address = [order.address, order.city].filter(Boolean).join(', ')
  const text = [
    `Bonjour${firstName ? ` ${firstName}` : ''} 👋`,
    `Merci pour votre commande n° ${order.orderNumber}${storeName ? ` chez ${storeName}` : ''} :`,
    ...lines,
    `Total : ${money(order.total, order.currency)}${order.paymentMethod === 'cod' ? ' (à payer à la livraison)' : ''}`,
    address ? `Adresse de livraison : ${address}` : null,
    '',
    'Pouvez-vous nous confirmer votre commande et votre disponibilité pour la livraison ? Merci !',
  ]
    .filter((l) => l !== null)
    .join('\n')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function ContactButtons({ phone, waUrl, size = 'md', className }: { phone: string | null; waUrl: string; size?: 'sm' | 'md'; className?: string }) {
  if (!phone) return null
  const cls = cx(
    'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors',
    size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-10 px-3.5 text-sm',
  )
  return (
    <div className={cx('flex gap-2', className)}>
      <a href={`tel:${phone}`} onClick={(e) => e.stopPropagation()} className={cx(cls, 'border-line-strong bg-surface hover:bg-surface-2')} aria-label={`Appeler ${phone}`}>
        <Phone className="size-4" /> Appeler
      </a>
      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cx(cls, 'border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70')}
        aria-label="Écrire sur WhatsApp"
      >
        <MessageCircle className="size-4" /> WhatsApp
      </a>
    </div>
  )
}

const ACTION_ICON: Record<FulfillmentStatus, LucideIcon> = {
  new: RotateCcw,
  confirmed: Check,
  unreachable: PhoneOff,
  shipped: Truck,
  delivered: PackageCheck,
  returned: Undo2,
  cancelled: Ban,
}

const ACTION_VARIANT: Record<FulfillmentStatus, 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'> = {
  new: 'secondary',
  confirmed: 'success',
  unreachable: 'secondary',
  shipped: 'primary',
  delivered: 'success',
  returned: 'secondary',
  cancelled: 'ghost',
}

/** Ces passages demandent une confirmation (irréversibles ou coûteux). */
const NEEDS_CONFIRM: FulfillmentStatus[] = ['cancelled', 'returned']

const COURIERS_KEY = 'zuri:couriers'
export function recentCouriers(): string[] {
  try {
    const v: unknown = JSON.parse(readLocal(COURIERS_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 8) : []
  } catch {
    return []
  }
}
function rememberCourier(c: string) {
  if (!c) return
  writeLocal(COURIERS_KEY, JSON.stringify([c, ...recentCouriers().filter((x) => x !== c)].slice(0, 8)))
}

/** Demande livreur + numéro de suivi avant « Expédier ». */
export function ShipDialog({
  open,
  onClose,
  onSubmit,
  loading,
  count = 1,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (v: { courier?: string; trackingNumber?: string; note?: string }) => void
  loading?: boolean
  count?: number
}) {
  const [courier, setCourier] = useState('')
  const [tracking, setTracking] = useState('')
  const [note, setNote] = useState('')
  const couriers = recentCouriers()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    rememberCourier(courier.trim())
    onSubmit({ courier: courier.trim() || undefined, trackingNumber: tracking.trim() || undefined, note: note.trim() || undefined })
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={count > 1 ? `Expédier ${count} commandes` : 'Expédier la commande'}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" type="submit" form="ship-form" loading={loading}>
            <Truck className="size-4" /> Marquer expédiée
          </Button>
        </>
      }
    >
      <form id="ship-form" onSubmit={submit} className="space-y-4">
        <Input label="Livreur" placeholder="Ex. Gozem, Yango, livreur interne…" value={courier} onChange={(e) => setCourier(e.target.value)} list="couriers-list" autoFocus />
        <datalist id="couriers-list">
          {couriers.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {couriers.length > 0 && (
          <div className="-mt-2 flex flex-wrap gap-1.5">
            {couriers.map((c) => (
              <button key={c} type="button" onClick={() => setCourier(c)} className={cx('rounded-full border px-2.5 py-1 text-[13px]', courier === c ? 'border-accent bg-accent-soft' : 'border-line-strong hover:bg-surface-2')}>
                {c}
              </button>
            ))}
          </div>
        )}
        {count === 1 && <Input label="Numéro de suivi" optional value={tracking} onChange={(e) => setTracking(e.target.value)} />}
        <Textarea label="Note" optional rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </form>
    </Dialog>
  )
}

/** Boutons de statut pour une commande (liste ou détail). */
export function StatusActions({
  order,
  transitions,
  size = 'md',
  className,
}: {
  order: Pick<OrderBase, 'id' | 'orderNumber' | 'fulfillmentStatus'>
  transitions?: FulfillmentStatus[]
  size?: 'sm' | 'md'
  className?: string
}) {
  const toast = useToast()
  const mutation = useOrderStatus()
  const [ship, setShip] = useState(false)
  const [confirm, setConfirm] = useState<FulfillmentStatus | null>(null)
  const allowed = transitions ?? FULFILLMENT_TRANSITIONS[order.fulfillmentStatus]

  const run = (to: FulfillmentStatus, extra: { courier?: string; trackingNumber?: string; note?: string } = {}) => {
    mutation.mutate(
      { id: order.id, fulfillmentStatus: to, ...extra },
      {
        onSuccess: () => toast.success(`${order.orderNumber} : ${FULFILLMENT_LABEL[to].toLowerCase()}`),
        onError: (e) => toast.error(e),
        onSettled: () => {
          setShip(false)
          setConfirm(null)
        },
      },
    )
  }
  const click = (to: FulfillmentStatus) => {
    if (to === 'shipped') setShip(true)
    else if (NEEDS_CONFIRM.includes(to)) setConfirm(to)
    else run(to)
  }

  if (!allowed.length) return null
  return (
    // Le clic ne doit pas remonter à la carte (qui ouvre le détail), dialogues compris.
    <div className={cx('flex flex-wrap gap-2', className)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        {allowed.map((to) => {
          const Icon = ACTION_ICON[to]
          return (
            <Button
              key={to}
              size={size}
              variant={ACTION_VARIANT[to]}
              onClick={() => click(to)}
              disabled={mutation.isPending}
              className={to === 'cancelled' ? 'text-red-600 dark:text-red-400' : undefined}
            >
              <Icon className="size-4" aria-hidden />
              {to === 'unreachable' && order.fulfillmentStatus === 'unreachable' ? 'Encore injoignable' : TRANSITION_ACTION[to]}
            </Button>
          )
        })}
      <ShipDialog open={ship} onClose={() => setShip(false)} onSubmit={(v) => run('shipped', v)} loading={mutation.isPending} />
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm)}
        title={confirm === 'cancelled' ? 'Annuler la commande ?' : 'Marquer comme retournée ?'}
        message={
          confirm === 'cancelled'
            ? `La commande ${order.orderNumber} sera annulée et le stock remis en vente.`
            : `La commande ${order.orderNumber} sera marquée retournée : le stock est rendu et le retour compté sur la fiche client.`
        }
        confirmLabel={confirm === 'cancelled' ? 'Annuler la commande' : 'Confirmer le retour'}
        danger
        loading={mutation.isPending}
      />
    </div>
  )
}
