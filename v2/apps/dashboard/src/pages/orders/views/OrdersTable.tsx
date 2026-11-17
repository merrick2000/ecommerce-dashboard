import { FULFILLMENT_STATUSES } from '@zuri/shared'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Badge, Checkbox, cx } from '@/components/ui'
import { dateTime, money, prettyPhone } from '@/lib/format'
import { PAYMENT_METHOD_LABEL } from '@/lib/labels'
import type { OrderListItem } from '@/lib/types'
import { PaymentBadge, StatusBadge } from '../shared'
import { AssigneeBadge, CustomerFlags, itemsText } from './common'
import { OrderExpand } from './OrderExpand'
import { TABLE_COLUMNS, type ColumnKey, type Density } from './prefs'

type SortKey = 'date' | 'total' | 'status'
const SORTABLE: Partial<Record<ColumnKey, SortKey>> = { date: 'date', total: 'total', status: 'status' }

/** Tableau desktop : colonnes au choix, tri sur la page courante, lignes dépliables. */
export function OrdersTable({
  rows,
  selected,
  onSelect,
  onSelectAll,
  canUpdate,
  hidden,
  density,
}: {
  rows: OrderListItem[]
  selected: string[]
  onSelect: (id: string, v: boolean) => void
  onSelectAll: (v: boolean) => void
  canUpdate: boolean
  hidden: ColumnKey[]
  density: Density
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState<string[]>([])
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const columns = TABLE_COLUMNS.filter((c) => !hidden.includes(c.key))
  const cell = density === 'compact' ? 'px-3 py-1.5' : 'px-3 py-3'

  const sorted = useMemo(() => {
    const factor = sort.dir === 'asc' ? 1 : -1
    const value = (o: OrderListItem) => (sort.key === 'total' ? o.total : sort.key === 'status' ? FULFILLMENT_STATUSES.indexOf(o.fulfillmentStatus) : Date.parse(o.createdAt))
    return [...rows].sort((a, b) => (value(a) - value(b)) * factor)
  }, [rows, sort])

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'status' ? 'asc' : 'desc' }))
  const toggleOpen = (id: string) => setOpen((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const render = (o: OrderListItem, key: ColumnKey) => {
    switch (key) {
      case 'number':
        return <span className="tabular text-[13px] whitespace-nowrap text-muted">{o.orderNumber}</span>
      case 'date':
        return <span className="tabular text-[13px] whitespace-nowrap">{dateTime(o.createdAt)}</span>
      case 'customer':
        return (
          <div className="min-w-0">
            <p className="max-w-44 truncate font-medium whitespace-nowrap">{o.customerName ?? 'Client'}</p>
            <CustomerFlags order={o} />
          </div>
        )
      case 'phone':
        return <span className="tabular whitespace-nowrap">{prettyPhone(o.customerPhone)}</span>
      case 'city':
        return <span className="whitespace-nowrap text-muted">{o.city ?? '-'}</span>
      case 'items':
        return <span className="block min-w-40 max-w-64 truncate" title={itemsText(o)}>{itemsText(o)}</span>
      case 'total':
        return <span className="tabular font-semibold whitespace-nowrap">{money(o.total, o.currency)}</span>
      case 'payment':
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[13px] whitespace-nowrap">{o.paymentMethod === 'cod' ? 'À la livraison' : PAYMENT_METHOD_LABEL[o.paymentMethod]}</span>
            {o.paymentMethod !== 'cod' && <PaymentBadge status={o.paymentStatus} />}
          </div>
        )
      case 'status':
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge status={o.fulfillmentStatus} />
            {o.callAttempts > 0 && <Badge tone="orange">{o.callAttempts} appel{o.callAttempts > 1 ? 's' : ''}</Badge>}
          </div>
        )
      case 'assignee':
        return (
          <div className="whitespace-nowrap">
            <AssigneeBadge order={o} canUpdate={canUpdate} />
          </div>
        )
      case 'source':
        return <span className="text-[13px] text-muted">{o.utmSource || (o.source === 'manual' ? 'Saisie' : 'Direct')}</span>
    }
  }

  return (
    <div className="max-h-[calc(100dvh-13rem)] overflow-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-surface-2 text-[12px] font-medium text-muted uppercase">
          <tr>
            {canUpdate && (
              <th className={cx(cell, 'w-10')}>
                <Checkbox checked={rows.length > 0 && selected.length === rows.length} onChange={onSelectAll} label="Tout sélectionner" />
              </th>
            )}
            {columns.map((c) => {
              const sk = SORTABLE[c.key]
              return (
                <th key={c.key} className={cx(cell, 'font-medium whitespace-nowrap', c.key === 'total' && 'text-right')} aria-sort={sk && sort.key === sk ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {sk ? (
                    <button type="button" onClick={() => toggleSort(sk)} className="inline-flex items-center gap-1 uppercase hover:text-fg">
                      {c.label}
                      {sort.key === sk && (sort.dir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
            <th className={cx(cell, 'w-10')}>
              <span className="sr-only">Détails</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map((o) => {
            const expanded = open.includes(o.id)
            const isSelected = selected.includes(o.id)
            return (
              <Fragment key={o.id}>
                <tr className={cx('cursor-pointer align-top hover:bg-surface-2/60', isSelected && 'bg-accent-soft/40')} onClick={() => navigate(String(o.id))}>
                  {canUpdate && (
                    <td className={cell} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onChange={(v) => onSelect(o.id, v)} label={`Sélectionner ${o.orderNumber}`} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} className={cx(cell, c.key === 'total' && 'text-right')}>
                      {render(o, c.key)}
                    </td>
                  ))}
                  <td className={cell}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOpen(o.id)
                      }}
                      className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
                      aria-expanded={expanded}
                      aria-label={expanded ? 'Masquer les détails' : 'Voir les détails'}
                    >
                      <ChevronDown className={cx('size-4 transition-transform', expanded && 'rotate-180')} />
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr className="bg-surface-2/40">
                    <td colSpan={columns.length + (canUpdate ? 2 : 1)} className="px-4 py-3">
                      <OrderExpand order={o} canUpdate={canUpdate} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
