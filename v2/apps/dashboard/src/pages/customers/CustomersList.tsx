import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, EmptyState, ErrorState, Input, ListSkeleton, PageHeader } from '@/components/ui'
import { useCurrency } from '@/hooks/auth'
import { useCustomers } from '@/hooks/resources'
import { useDebounced } from '@/hooks/useDebounced'
import { money, num, prettyPhone } from '@/lib/format'

export default function CustomersList() {
  const currency = useCurrency()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search.trim(), 300)
  const { data: result, error, isPending, refetch, isFetching } = useCustomers(q, page)
  const data = result?.data ?? []
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <>
      <PageHeader title="Clients" description="Un client = un numéro de téléphone." />
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
        <Input
          type="search"
          placeholder="Nom, téléphone, email, ville…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-9"
          aria-label="Rechercher un client"
        />
      </div>

      {error && !result ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton />
      ) : data.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title={q ? 'Aucun client trouvé' : 'Pas encore de clients'} description={q ? 'Vérifiez l’orthographe ou cherchez par numéro.' : 'Chaque commande crée ou met à jour la fiche du client.'} />
      ) : (
        <div className={`overflow-hidden rounded-xl border border-line bg-surface transition-opacity ${isFetching ? 'opacity-70' : ''}`}>
          <div className="hidden grid-cols-[1.5fr_1fr_80px_80px_80px_120px] gap-4 border-b border-line px-4 py-2.5 text-[12px] font-medium text-muted md:grid">
            <span>Client</span>
            <span>Ville</span>
            <span className="text-right">Cmd</span>
            <span className="text-right">Livrées</span>
            <span className="text-right">Retours</span>
            <span className="text-right">Dépensé</span>
          </div>
          <ul className="divide-y divide-line">
            {data.map((c) => (
              <li key={c.id}>
                <Link to={String(c.id)} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 hover:bg-surface-2/60 md:grid-cols-[1.5fr_1fr_80px_80px_80px_120px] md:items-center md:gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      {c.name ?? 'Sans nom'}
                      {c.isBlocked && <Badge tone="red">Bloqué</Badge>}
                    </p>
                    <p className="tabular text-[13px] text-muted">{prettyPhone(c.phone)}</p>
                  </div>
                  <p className="tabular text-right font-medium md:hidden">{money(c.totalSpent, currency)}</p>
                  <p className="truncate text-[13px] text-muted md:text-sm md:text-fg">{c.city ?? '-'}</p>
                  <p className="text-right text-[12px] text-subtle md:hidden">
                    {num(c.ordersCount)} cmd · {num(c.deliveredCount)} livrées{c.returnedCount ? ` · ${num(c.returnedCount)} retours` : ''}
                  </p>
                  <span className="tabular hidden text-right text-sm md:block">{num(c.ordersCount)}</span>
                  <span className="tabular hidden text-right text-sm md:block">{num(c.deliveredCount)}</span>
                  <span className={`tabular hidden text-right text-sm md:block ${c.returnedCount ? 'font-medium text-orange-600' : ''}`}>{num(c.returnedCount)}</span>
                  <span className="tabular hidden text-right text-sm font-medium md:block">{money(c.totalSpent, currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Pagination">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Page précédente">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted">Page {page} / {totalPages} · {result.total} clients</span>
          <Button size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Page suivante">
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </>
  )
}
