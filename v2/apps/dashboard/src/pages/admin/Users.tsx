import type { EffectivePlan } from '@zuri/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, ErrorState, Input, ListSkeleton } from '@/components/ui'
import { useDebounced } from '@/hooks/useDebounced'
import { api } from '@/lib/api'
import { ago, fdate, PlanBadge } from './shared'

export interface AdminUser {
  id: number
  email: string
  name: string
  phone: string | null
  country: string | null
  isPlatformAdmin: boolean
  createdAt: string
  lastLoginAt: string | null
  disabled: boolean
  features: Record<string, boolean>
  signupSource: Record<string, string> | null
  sourceLabel: string
  stores: number
  orders: number
  plan: EffectivePlan
}

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const dq = useDebounced(q.trim(), 300)
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['admin', 'users', dq, page],
    queryFn: () => api.get<{ data: AdminUser[]; total: number; pageSize: number }>('/admin/users', { q: dq || undefined, page }),
    placeholderData: keepPreviousData,
  })
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comptes</h1>
          <p className="text-sm text-muted">{data?.total ?? '…'} comptes au total</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Rechercher" placeholder="Email, nom, téléphone" className="pl-9" value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} />
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
                <th className="px-3 py-2">Compte</th>
                <th className="px-3 py-2">Inscrit</th>
                <th className="px-3 py-2">Provenance</th>
                <th className="px-3 py-2">Formule</th>
                <th className="px-3 py-2 text-right">Boutiques</th>
                <th className="px-3 py-2 text-right">Commandes</th>
                <th className="px-3 py-2">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.data.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2">
                  <td className="px-3 py-2.5">
                    <Link to={`/admin/users/${u.id}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                    <div className="text-[12px] text-muted">{u.email}</div>
                    <div className="mt-0.5 flex gap-1">
                      {u.isPlatformAdmin && <Badge tone="violet">Admin</Badge>}
                      {u.disabled && <Badge tone="red">Suspendu</Badge>}
                      {u.features.onlinePayments && <Badge tone="blue">Paiements</Badge>}
                      {u.features.urlImport && <Badge tone="blue">Import lien</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{fdate(u.createdAt, true)}</td>
                  <td className="px-3 py-2.5">
                    <div>{u.sourceLabel}</div>
                    {u.signupSource?.from && <div className="max-w-[220px] truncate text-[12px] text-muted">depuis {u.signupSource.from}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">{u.stores}</td>
                  <td className="tabular px-3 py-2.5 text-right">{u.orders}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted">{ago(u.lastLoginAt)}</td>
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
