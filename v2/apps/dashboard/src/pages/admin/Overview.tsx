import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { Card, ErrorState, Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import { Bars, fmt, Ranking, StatBox as Stat } from './shared'

interface Overview {
  users: { total: number; today: number; d7: number; d30: number; active7: number }
  stores: { total: number; active: number; paused: number; closed: number; withOrders: number }
  orders: { total: number; today: number; d30: number; delivered30: number }
  billing: { revenue: number; payments: number; subscriptions: { plan: string; n: number }[] }
  signups: { day: string; count: number }[]
  ordersDaily: { day: string; count: number }[]
  sources: { label: string; count: number }[]
  landings: { label: string; count: number }[]
  umamiUrl: string
}

export default function AdminOverview() {
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['admin', 'overview'], queryFn: () => api.get<Overview>('/admin/overview'), refetchInterval: 60_000 })
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vue d’ensemble</h1>
          <p className="text-sm text-muted">Tout ce qui se passe sur Zuri, en direct.</p>
        </div>
        <a href={data.umamiUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          Trafic du site (Umami) <ExternalLink className="size-3.5" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Comptes" value={fmt(data.users.total)} sub={`+${data.users.today} aujourd’hui · +${data.users.d7} en 7 j`} />
        <Stat label="Actifs (7 j)" value={fmt(data.users.active7)} sub={`${data.users.d30} inscrits en 30 j`} />
        <Stat label="Boutiques" value={fmt(data.stores.total)} sub={`${data.stores.active} en ligne · ${data.stores.paused} en pause · ${data.stores.withOrders} avec commandes`} />
        <Stat label="Commandes" value={fmt(data.orders.total)} sub={`${data.orders.today} aujourd’hui · ${fmt(data.orders.d30)} en 30 j`} />
        <Stat label="Livré (30 j)" value={`${fmt(data.orders.delivered30)} F`} sub="Volume livré par les vendeurs" />
        <Stat label="Revenus abonnements" value={`${fmt(data.billing.revenue)} F`} sub={`${data.billing.payments} paiement(s)`} />
        <Stat label="Abonnés actifs" value={fmt(data.billing.subscriptions.reduce((s, x) => s + x.n, 0))} sub={data.billing.subscriptions.map((s) => `${s.plan} ${s.n}`).join(' · ') || 'Aucun pour l’instant'} />
        <Stat label="Boutiques fermées" value={fmt(data.stores.closed)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Inscriptions par jour" description="30 derniers jours">
          <Bars data={data.signups} />
        </Card>
        <Card title="Commandes par jour" description="Toutes boutiques, 30 derniers jours">
          <Bars data={data.ordersDaily} color="bg-emerald-500" />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="D’où viennent les inscrits" description="Source du premier contact (Google, Facebook, campagne…)">
          <Ranking rows={data.sources} />
        </Card>
        <Card title="Pages qui font s’inscrire" description="Page d’où le visiteur a cliqué sur « Créer ma boutique »">
          <Ranking rows={data.landings} />
        </Card>
      </div>
    </div>
  )
}
