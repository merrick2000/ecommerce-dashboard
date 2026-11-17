import { useCan, useCurrentStore } from '@/hooks/auth'
import { money } from '@/lib/format'
import { PAYMENT_METHOD_LABEL } from '@/lib/labels'
import type { OrderListItem } from '@/lib/types'
import { ContactButtons, StatusActions, whatsappUrl } from '../shared'
import { AssigneeBadge, OPEN_STATUSES } from './common'

/** Détails d'une commande dépliée (liste compacte et tableau) + actions rapides. */
export function OrderExpand({ order, canUpdate }: { order: OrderListItem; canUpdate: boolean }) {
  const { store, me } = useCurrentStore()
  const canAssign = useCan('orders.assign')
  // Prise par un autre membre : seul lui ou quelqu'un qui peut attribuer la modifie (sinon l'API répond order_taken).
  const takenByOther = order.assignedTo != null && order.assignedTo !== me?.id && !canAssign
  const physical = order.kind !== 'digital'
  return (
    <div className="space-y-3 text-sm" onClick={(e) => e.stopPropagation()}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="mb-1 text-[12px] font-medium text-muted uppercase">Articles</p>
          <ul className="space-y-0.5">
            {order.items.map((i, k) => (
              <li key={k}>
                <span className="tabular font-medium">{i.quantity} ×</span> {i.name}
                {i.variantName && <span className="text-muted"> ({i.variantName})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[13px] text-muted">
            Total <span className="tabular font-medium text-fg">{money(order.total, order.currency)}</span>
            {order.shippingFee > 0 && <> dont livraison {money(order.shippingFee, order.currency)}</>}
            {' · '}
            {PAYMENT_METHOD_LABEL[order.paymentMethod]}
          </p>
        </div>
        {physical && (
          <div>
            <p className="mb-1 text-[12px] font-medium text-muted uppercase">Livraison</p>
            <p>{[order.address, order.city].filter(Boolean).join(', ') || 'Adresse non renseignée'}</p>
            {(order.courier || order.trackingNumber) && (
              <p className="mt-0.5 text-[13px] text-muted">
                {order.courier ?? 'Livreur'}
                {order.trackingNumber && <> · suivi {order.trackingNumber}</>}
              </p>
            )}
          </div>
        )}
        <div>
          <p className="mb-1 text-[12px] font-medium text-muted uppercase">Note du client</p>
          <p className={order.customerNote ? 'whitespace-pre-line' : 'text-muted'}>{order.customerNote || 'Aucune note'}</p>
          {order.callAttempts > 0 && <p className="mt-0.5 text-[13px] text-muted">{order.callAttempts} appel(s) effectué(s)</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <AssigneeBadge order={order} canUpdate={canUpdate} />
        {physical && OPEN_STATUSES.includes(order.fulfillmentStatus) && (
          <ContactButtons phone={order.customerPhone} waUrl={whatsappUrl(order, order.items, store?.name)} size="sm" />
        )}
        {canUpdate && physical && !takenByOther && <StatusActions order={order} size="sm" />}
        {canUpdate && takenByOther && <span className="text-[13px] text-muted">Prise par {order.assigneeName ?? 'un autre membre'} : seul ce membre ou un gestionnaire peut la modifier.</span>}
      </div>
    </div>
  )
}
