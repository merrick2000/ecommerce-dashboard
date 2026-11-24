/** Super admin : avis des vendeurs (note sur 10), témoignages à valider avant publication sur zurisell.store. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, MessageSquareQuote, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { Badge, Button, EmptyState, ErrorState, ListSkeleton, Segmented } from '@/components/ui'
import { api } from '@/lib/api'
import { fdate } from './shared'

interface Review {
  id: number
  userId: number
  name: string
  email: string
  score: number | null
  comment: string | null
  consent: boolean
  publishName: string | null
  publishRole: string | null
  storeUrl: string | null
  status: 'pending' | 'approved' | 'rejected' | 'private'
  updatedAt: string
}

const STATUS: Record<Review['status'], { label: string; tone: 'amber' | 'green' | 'red' | 'neutral' }> = {
  pending: { label: 'À valider', tone: 'amber' },
  approved: { label: 'Publié', tone: 'green' },
  rejected: { label: 'Refusé', tone: 'red' },
  private: { label: 'Privé', tone: 'neutral' },
}

export default function AdminReviews() {
  const qc = useQueryClient()
  const toast = useToast()
  const [status, setStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['admin', 'reviews', status], queryFn: () => api.get<{ nps: number | null; answers: number; pending: number; data: Review[] }>('/admin/reviews', { status }) })
  const mark = useMutation({
    mutationFn: (v: { id: number; status: 'approved' | 'rejected' }) => api.patch(`/admin/reviews/${v.id}`, { status: v.status }),
    onSuccess: (_r, v) => {
      toast.success(v.status === 'approved' ? 'Témoignage publié sur le site' : 'Témoignage refusé')
      void qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (e) => toast.error(e),
  })
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Avis des vendeurs</h1>
          <p className="text-sm text-muted">Demandé dans le tableau de bord après les premières ventes. Les témoignages publiés apparaissent sur zurisell.store.</p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-[13px] text-muted">Score de recommandation</p>
            <p className="tabular text-2xl font-bold">{data.nps == null ? '-' : data.nps}</p>
            <p className="text-[12px] text-muted">{data.answers} réponse{data.answers > 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
      <Segmented
        label="Filtre"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'all', label: 'Tous' },
          { value: 'pending', label: `À valider${data ? ` (${data.pending})` : ''}` },
          { value: 'approved', label: 'Publiés' },
        ]}
      />
      {error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton rows={4} />
      ) : !data.data.length ? (
        <EmptyState icon={<MessageSquareQuote className="size-5" />} title="Aucun avis pour l’instant" description="La question est posée aux vendeurs après leur première vente payée ou livrée." />
      ) : (
        <ul className="space-y-3">
          {data.data.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2">
                  <span className={`tabular rounded-md px-2 py-0.5 text-sm font-bold ${r.score == null ? 'bg-surface-2' : r.score >= 9 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : r.score <= 6 ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>{r.score ?? '-'}/10</span>
                  <Link to={`/admin/users/${r.userId}`} className="font-semibold hover:underline">
                    {r.name}
                  </Link>
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  {r.consent && <Badge tone="neutral">Accord de publication</Badge>}
                </p>
                <span className="text-[13px] text-muted">{fdate(r.updatedAt, true)}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm whitespace-pre-wrap">« {r.comment} »</p>}
              <p className="mt-1 text-[13px] text-muted">{[r.publishName, r.publishRole, r.storeUrl].filter(Boolean).join(' · ')}</p>
              {r.consent && r.comment && (
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  {r.status !== 'approved' && (
                    <Button size="sm" variant="primary" onClick={() => mark.mutate({ id: r.id, status: 'approved' })}>
                      <Check className="size-3.5" /> Publier sur le site
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: r.id, status: 'rejected' })}>
                      <X className="size-3.5" /> {r.status === 'approved' ? 'Retirer du site' : 'Refuser'}
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
