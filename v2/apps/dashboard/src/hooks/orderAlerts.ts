/**
 * Alerte « nouvelle commande » dans l'app, pour tout le monde : même sans notifications push
 * (jamais activées, refusées, iPhone pas installé), le tableau de bord ouvert sonne et affiche
 * une bannière dès qu'une vente arrive. Le push, quand il est actif, partage le même tag
 * (`order-<id>`) : une vente n'est annoncée qu'une fois.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { showInAppAlert } from '@/components/PushBridge'
import { api } from '@/lib/api'
import type { OrderList } from '@/lib/types'

const POLL_MS = 20_000

export function useOrderAlerts(storeId: string, enabled: boolean) {
  const qc = useQueryClient()
  // Seules les commandes arrivées après l'ouverture du tableau de bord sont annoncées.
  const since = useRef(Date.now())
  const announced = useRef(new Set<string>())

  useEffect(() => {
    since.current = Date.now()
    announced.current = new Set()
  }, [storeId])

  const latest = useQuery({
    queryKey: ['store', storeId, 'orders', 'alerts'],
    queryFn: ({ signal }) => api.get<OrderList>(`/stores/${storeId}/orders`, { pageSize: 10, archived: 'all' }, signal),
    enabled: enabled && !!storeId,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
    staleTime: 0,
  })

  useEffect(() => {
    const list = latest.data?.data
    if (!list) return
    let fresh = false
    for (const o of [...list].reverse()) {
      if (announced.current.has(o.id) || new Date(o.createdAt).getTime() < since.current - 5_000) continue
      // Saisie manuelle : c'est un membre qui l'a créée, pas une vente qui tombe.
      if (o.source === 'manual') continue
      // Paiement en ligne pas encore confirmé : on attendra qu'il soit payé.
      const isSale = o.paymentMethod === 'cod' || o.paymentStatus === 'paid'
      if (!isSale) continue
      announced.current.add(o.id)
      fresh = true
      const who = [o.customerName, o.city].filter(Boolean).join(', ')
      const what = o.items.map((i) => `${i.quantity > 1 ? `${i.quantity} × ` : ''}${i.name}`).join(', ')
      showInAppAlert({
        title: o.paymentMethod === 'cod' ? `Nouvelle commande ${o.orderNumber}` : `Paiement reçu ${o.orderNumber}`,
        body: [who, what].filter(Boolean).join(' · '),
        url: `/stores/${storeId}/orders/${o.id}`,
        tag: `order-${o.id}`,
        event: o.paymentMethod === 'cod' ? 'order.new' : 'order.paid',
        sound: 'sale',
      })
    }
    // Rafraîchit la liste, le compteur et les statistiques sans attendre leur prochain passage.
    if (fresh) void qc.invalidateQueries({ queryKey: ['store', storeId], predicate: (q) => q.queryKey[3] !== 'alerts' })
  }, [latest.data, storeId, qc])
}
