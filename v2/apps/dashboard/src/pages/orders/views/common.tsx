import { AlertTriangle, Hand, UserCheck } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { Badge } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useClaimOrder } from '@/hooks/team'
import type { OrderListItem } from '@/lib/types'

export const OPEN_STATUSES = ['new', 'unreachable', 'confirmed']

export const itemsText = (o: OrderListItem) => o.items.map((i) => `${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`).join(', ')

export function CustomerFlags({ order }: { order: OrderListItem }) {
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

/** « À moi », « Pris par Awa » ou « Libre » (+ bouton « Je prends »). */
export function AssigneeBadge({ order, canUpdate }: { order: OrderListItem; canUpdate: boolean }) {
  const { me } = useCurrentStore()
  const claim = useClaimOrder(order.id)
  const toast = useToast()
  if (order.assignedTo != null)
    return order.assignedTo === me?.id ? (
      <Badge tone="blue">
        <UserCheck className="size-3" /> À moi
      </Badge>
    ) : (
      <Badge>
        <UserCheck className="size-3" /> {order.assigneeName ?? 'Membre'}
      </Badge>
    )
  if (!OPEN_STATUSES.includes(order.fulfillmentStatus)) return null
  if (!canUpdate) return <Badge tone="amber">Libre</Badge>
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        claim.mutate(undefined, { onSuccess: () => toast.success(`${order.orderNumber} : prise en charge`), onError: (err) => toast.error(err) })
      }}
      disabled={claim.isPending}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-accent px-2 py-0.5 text-[12px] font-medium whitespace-nowrap text-accent hover:bg-accent-soft disabled:opacity-60"
    >
      <Hand className="size-3" /> Je prends
    </button>
  )
}
