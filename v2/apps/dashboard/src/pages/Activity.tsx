import type { ActivityItem } from '@zuri/shared'
import { Activity as ActivityIcon, Bot, Box, ChevronRight, CreditCard, Lock, Settings, ShoppingBag, Tag, Truck, User, Users } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button, Card, cx, EmptyState, ErrorState, ListSkeleton, PageHeader, Select } from '@/components/ui'
import { useCan, useCurrentStore } from '@/hooks/auth'
import { useActivity, usePeople } from '@/hooks/team'

const TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Tout' },
  { value: 'order', label: 'Commandes' },
  { value: 'product', label: 'Produits' },
  { value: 'promo', label: 'Codes promo' },
  { value: 'zone', label: 'Livraison' },
  { value: 'store', label: 'Boutique' },
  { value: 'team', label: 'Équipe' },
  { value: 'payment_account', label: 'Paiements' },
]

const ICONS: Record<string, ReactNode> = {
  order: <ShoppingBag className="size-4" />,
  product: <Box className="size-4" />,
  promo: <Tag className="size-4" />,
  zone: <Truck className="size-4" />,
  store: <Settings className="size-4" />,
  team: <Users className="size-4" />,
  payment_account: <CreditCard className="size-4" />,
}

const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(d: Date) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(d) === dayKey(today)) return 'Aujourd’hui'
  if (dayKey(d) === dayKey(yesterday)) return 'Hier'
  const s = dayFmt.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Acteur lisible : un membre, le client (commande passée en ligne) ou le système (paiement, relance). */
function actorLabel(item: ActivityItem) {
  if (item.actor) return item.actor.name
  return item.entityType === 'order' && (item.action === 'created' || item.action === 'order.created') ? 'Client' : 'Système'
}

function Row({ item, base }: { item: ActivityItem; base: string }) {
  const href = item.entityId && item.entityType === 'order' ? `${base}/orders/${item.entityId}` : item.entityId && item.entityType === 'product' ? `${base}/products/${item.entityId}` : null
  const actor = actorLabel(item)
  const content = (
    <>
      <span className={cx('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', item.actor ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted')}>
        {ICONS[item.entityType] ?? (item.actor ? <User className="size-4" /> : <Bot className="size-4" />)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{actor}</span> <span className="text-muted">{item.message}</span>
        </p>
        <p className="mt-0.5 text-[12px] text-subtle">
          {timeFmt.format(new Date(item.at))}
          {item.entityLabel && <> · {item.entityLabel}</>}
        </p>
      </div>
      {href && <ChevronRight className="mt-2 size-4 shrink-0 text-subtle" />}
    </>
  )
  return (
    <li>
      {href ? (
        <Link to={href} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2">
          {content}
        </Link>
      ) : (
        <div className="flex items-start gap-3 py-2.5">{content}</div>
      )}
    </li>
  )
}

export default function Activity() {
  const { storeId } = useCurrentStore()
  const can = useCan('activity.view')
  const [userId, setUserId] = useState('')
  const [entityType, setEntityType] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<ActivityItem[]>([])
  const assignees = usePeople(can)
  const { data, error, isPending, isFetching, refetch } = useActivity({ page, userId: userId ? Number(userId) : undefined, entityType: entityType || undefined })

  // Accumule les pages (« Voir plus ») ; la page 1 remplace tout (filtres, rafraîchissement auto).
  useEffect(() => {
    if (!data) return
    setItems((prev) => {
      if (data.page === 1) return data.data
      const seen = new Set(prev.map((i) => i.id))
      return [...prev, ...data.data.filter((i) => !seen.has(i.id))]
    })
  }, [data])

  const changeFilter = (fn: () => void) => {
    fn()
    setPage(1)
    setItems([])
  }

  if (!can) return <EmptyState icon={<Lock className="size-5" />} title="Accès réservé" description="Le journal d’activité est réservé aux responsables de la boutique." />

  const base = `/stores/${storeId}`
  const groups: { label: string; items: ActivityItem[] }[] = []
  for (const item of items) {
    const label = dayLabel(new Date(item.at))
    const last = groups[groups.length - 1]
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  const hasMore = data ? data.page * data.pageSize < data.total : false

  return (
    <>
      <PageHeader title="Activité" description="Qui a fait quoi, et quand : commandes, appels, notes, produits, équipe." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:max-w-xl">
        <Select
          aria-label="Membre"
          value={userId}
          onChange={(e) => changeFilter(() => setUserId(e.target.value))}
          options={[{ value: '', label: 'Tous les membres' }, ...(assignees.data ?? []).map((a) => ({ value: String(a.userId), label: a.name }))]}
        />
        <Select aria-label="Type" value={entityType} onChange={(e) => changeFilter(() => setEntityType(e.target.value))} options={TYPES} />
      </div>

      {error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending && !items.length ? (
        <ListSkeleton rows={6} />
      ) : !items.length ? (
        <EmptyState icon={<ActivityIcon className="size-5" />} title="Aucune activité" description={userId || entityType ? 'Rien ne correspond à ces filtres.' : 'Les actions de l’équipe et les nouvelles commandes apparaîtront ici.'} />
      ) : (
        <div className="max-w-3xl space-y-4">
          {groups.map((g) => (
            <Card key={g.label} title={g.label}>
              <ul className="divide-y divide-line">
                {g.items.map((i) => (
                  <Row key={i.id} item={i} base={base} />
                ))}
              </ul>
            </Card>
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <Button onClick={() => setPage((p) => p + 1)} loading={isFetching}>
                Voir plus
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
