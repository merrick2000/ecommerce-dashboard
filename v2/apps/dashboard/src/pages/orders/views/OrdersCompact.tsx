import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Badge, Checkbox, cx } from '@/components/ui'
import { money, prettyPhone, relative } from '@/lib/format'
import type { OrderListItem } from '@/lib/types'
import { PaymentBadge, StatusBadge } from '../shared'
import { AssigneeBadge, CustomerFlags, itemsText } from './common'
import { OrderExpand } from './OrderExpand'

/** Une ligne dense par commande ; un chevron déplie les détails et les actions rapides. */
export function OrdersCompact({ rows, selected, onSelect, canUpdate }: { rows: OrderListItem[]; selected: string[]; onSelect: (id: string, v: boolean) => void; canUpdate: boolean }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState<string[]>([])
  const toggleOpen = (id: string) => setOpen((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {rows.map((o) => {
        const expanded = open.includes(o.id)
        const isSelected = selected.includes(o.id)
        return (
          <li key={o.id} className={cx('transition-colors', isSelected && 'bg-accent-soft/40')}>
            <div
              className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-surface-2/60"
              onClick={() => navigate(String(o.id))}
              onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && navigate(String(o.id))}
              tabIndex={0}
              role="link"
              aria-label={`Commande ${o.orderNumber}`}
            >
              {canUpdate && (
                <span onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onChange={(v) => onSelect(o.id, v)} label={`Sélectionner ${o.orderNumber}`} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate font-medium">{o.customerName ?? 'Client'}</p>
                  <span className="tabular hidden text-[13px] text-muted sm:inline">{prettyPhone(o.customerPhone)}</span>
                  <span className="tabular ml-auto shrink-0 font-semibold">{money(o.total, o.currency)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted">
                  <span className="min-w-0 truncate">
                    {itemsText(o)}
                    {o.city && ` · ${o.city}`}
                  </span>
                  <span className="ml-auto shrink-0 text-[12px] text-subtle">{relative(o.createdAt)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={o.fulfillmentStatus} />
                  {o.paymentMethod === 'cod' ? <Badge>COD</Badge> : <PaymentBadge status={o.paymentStatus} />}
                  {o.callAttempts > 0 && <Badge tone="orange">{o.callAttempts} appel{o.callAttempts > 1 ? 's' : ''}</Badge>}
                  <CustomerFlags order={o} />
                  <AssigneeBadge order={o} canUpdate={canUpdate} />
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleOpen(o.id)
                }}
                className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
                aria-expanded={expanded}
                aria-label={expanded ? 'Masquer les détails' : 'Voir les détails'}
              >
                <ChevronDown className={cx('size-4 transition-transform', expanded && 'rotate-180')} />
              </button>
            </div>
            {expanded && (
              <div className="border-t border-line bg-surface-2/40 px-3 py-3">
                <OrderExpand order={o} canUpdate={canUpdate} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
