import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { Button, ErrorState, Input, ListSkeleton, Segmented } from '@/components/ui'
import { useDebounced } from '@/hooks/useDebounced'
import { api } from '@/lib/api'
import { storefrontUrl } from '@/lib/storefront'
import { ago, fdate, fmt, StatusBadge } from './shared'

interface AdminStore {
  id: string
  name: string
  slug: string
  status: string
  country: string
  currency: string
  createdAt: string
  owner: string | null
  orders: number
  orders30: number
  delivered: number
  lastOrderAt: string | null
  products: number
  payments: string | null
}

export default function AdminStores() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const dq = useDebounced(q.trim(), 300)
  const qc = useQueryClient()
  const toast = useToast()
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['admin', 'stores', dq, status, page],
    queryFn: () => api.get<{ data: AdminStore[]; total: number; pageSize: number }>('/admin/stores', { q: dq || undefined, status: status || undefined, page }),
    placeholderData: keepPreviousData,
  })
  const setStoreStatus = useMutation({ mutationFn: (v: { id: string; status: string }) => api.post(`/admin/stores/${v.id}/status`, { status: v.status }) })
  const act = (id: string, s: string) => setStoreStatus.mutate({ id, status: s }, { onSuccess: () => (toast.success('Statut mis à jour'), void qc.invalidateQueries({ queryKey: ['admin'] })), onError: (e) => toast.error(e) })
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Boutiques</h1>
          <p className="text-sm text-muted">{data?.total ?? '…'} boutiques</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Statut" value={status} onChange={(v) => (setStatus(v), setPage(1))} options={[{ value: '', label: 'Toutes' }, { value: 'active', label: 'En ligne' }, { value: 'paused', label: 'En pause' }, { value: 'closed', label: 'Fermées' }]} />
          <div className="relative w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input aria-label="Rechercher" placeholder="Nom ou lien" className="pl-9" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
          </div>
        </div>
      </div>
      {error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2">Boutique</th>
                <th className="px-3 py-2">Propriétaire</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-right">Produits</th>
                <th className="px-3 py-2 text-right">Commandes (30 j)</th>
                <th className="px-3 py-2 text-right">Livré</th>
                <th className="px-3 py-2">Dernière commande</th>
                <th className="px-3 py-2">Paiements</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.data.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2">
                  <td className="px-3 py-2.5">
                    <Link to={`/stores/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    <a href={storefrontUrl(s.slug)} target="_blank" rel="noopener" className="flex items-center gap-1 text-[12px] text-muted hover:text-fg">
                      /{s.slug} <ExternalLink className="size-3" />
                    </a>
                    <div className="text-[11px] text-muted">
                      {s.country} · créée le {fdate(s.createdAt)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[13px]">{s.owner ?? '-'}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{s.products}</td>
                  <td className="tabular px-3 py-2.5 text-right">
                    {s.orders} <span className="text-muted">({s.orders30})</span>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right whitespace-nowrap">{fmt(s.delivered)} {s.currency === 'XOF' || s.currency === 'XAF' ? 'F' : s.currency}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted">{ago(s.lastOrderAt)}</td>
                  <td className="px-3 py-2.5 text-[12px] text-muted">{s.payments ?? 'COD seul'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {s.status === 'active' ? (
                      <Button size="sm" onClick={() => act(s.id, 'paused')}>
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => act(s.id, 'active')}>
                        Rouvrir
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted">
            {page} / {pages}
          </span>
          <Button size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
