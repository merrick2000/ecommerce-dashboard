/** Super admin : messages reçus par la page contact du site (zurisell.store/contact). */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Mail, MessageCircle, RotateCcw, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { Badge, Button, buttonClass, EmptyState, ErrorState, Input, ListSkeleton, Segmented } from '@/components/ui'
import { useDebounced } from '@/hooks/useDebounced'
import { api } from '@/lib/api'
import { fdate } from './shared'

interface Message {
  id: number
  name: string
  email: string
  phone: string | null
  message: string
  page: string | null
  lang: string | null
  status: 'new' | 'done'
  source: 'form' | 'email'
  handledAt: string | null
  createdAt: string
  userId: number | null
}

export default function AdminMessages() {
  const qc = useQueryClient()
  const toast = useToast()
  const [status, setStatus] = useState<'new' | 'done' | 'all'>('new')
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 300)
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['admin', 'messages', status, q],
    queryFn: () => api.get<{ total: number; counts: { new: number; done: number }; mailboxUrl: string | null; data: Message[] }>('/admin/messages', { status, q: q || undefined }),
    placeholderData: keepPreviousData,
  })
  const mark = useMutation({
    mutationFn: (v: { id: number; status: 'new' | 'done' }) => api.patch(`/admin/messages/${v.id}`, { status: v.status }),
    onSuccess: (_r, v) => {
      toast.success(v.status === 'done' ? 'Message marqué traité' : 'Message remis à traiter')
      void qc.invalidateQueries({ queryKey: ['admin', 'messages'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (e) => toast.error(e),
  })
  const counts = data?.counts
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted">Envoyés depuis la page contact du site, ou reçus sur contact@zurisell.store.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented
          label="État"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'new', label: `À traiter${counts ? ` (${counts.new})` : ''}` },
            { value: 'done', label: `Traités${counts ? ` (${counts.done})` : ''}` },
            { value: 'all', label: 'Tous' },
          ]}
        />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 z-[1] size-4 -translate-y-1/2 text-subtle" />
          <Input type="search" aria-label="Rechercher" placeholder="Nom, email, contenu" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      {error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton rows={4} />
      ) : !data.data.length ? (
        <EmptyState icon={<Mail className="size-5" />} title={status === 'new' ? 'Aucun message à traiter' : 'Aucun message'} description="Les messages envoyés depuis zurisell.store/contact apparaissent ici." />
      ) : (
        <ul className="space-y-3">
          {data.data.map((m) => {
            const wa = m.phone ? `https://wa.me/${m.phone.replace(/\D/g, '')}` : null
            return (
              <li key={m.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{m.name}</span>
                      {m.status === 'new' ? <Badge tone="amber">À traiter</Badge> : <Badge tone="green">Traité</Badge>}
                      <Badge tone="neutral">{m.source === 'email' ? 'Email reçu' : 'Formulaire'}</Badge>
                      {m.lang === 'en' && <Badge tone="neutral">Anglais</Badge>}
                      {m.userId && (
                        <Link to={`/admin/users/${m.userId}`} className="text-[13px] font-medium text-accent hover:underline">
                          Voir le compte
                        </Link>
                      )}
                    </p>
                    <p className="mt-0.5 text-[13px] break-all text-muted">{[m.email, m.phone].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className="text-[13px] text-muted">
                    {fdate(m.createdAt, true)}
                    {m.page ? ` · ${m.page}` : ''}
                  </span>
                </div>
                <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <a className={buttonClass('secondary', 'sm')} href={`mailto:${m.email}?subject=${encodeURIComponent('Re: votre message à Zuri')}`}>
                    <Mail className="size-3.5" /> Répondre par email
                  </a>
                  {m.source === 'email' && data.mailboxUrl && (
                    <a className={buttonClass('secondary', 'sm')} href={data.mailboxUrl} target="_blank" rel="noopener">
                      <Mail className="size-3.5" /> Ouvrir la boîte mail
                    </a>
                  )}
                  {wa && (
                    <a className={buttonClass('secondary', 'sm')} href={wa} target="_blank" rel="noopener">
                      <MessageCircle className="size-3.5" /> WhatsApp
                    </a>
                  )}
                  {m.status === 'new' ? (
                    <Button size="sm" variant="primary" onClick={() => mark.mutate({ id: m.id, status: 'done' })}>
                      <Check className="size-3.5" /> Marquer traité
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => mark.mutate({ id: m.id, status: 'new' })}>
                      <RotateCcw className="size-3.5" /> Remettre à traiter
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
