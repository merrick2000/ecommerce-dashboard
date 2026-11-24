/** Annonces de Zuri (publiées depuis le super admin) : bandeau en haut du tableau de bord, fermable. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Info, Megaphone, X } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClass, cx } from '@/components/ui'
import { api } from '@/lib/api'

interface Announcement {
  id: number
  title: string
  body: string
  ctaLabel: string | null
  ctaUrl: string | null
  tone: 'info' | 'promo' | 'warning'
}

const TONE = {
  info: { box: 'border-line bg-surface', icon: Info, color: 'text-accent' },
  promo: { box: 'border-accent/40 bg-accent/5', icon: Megaphone, color: 'text-accent' },
  warning: { box: 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40', icon: AlertTriangle, color: 'text-amber-700 dark:text-amber-300' },
}

export function Announcements() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['announcements'], queryFn: () => api.get<Announcement[]>('/announcements'), staleTime: 5 * 60_000 })
  const act = useMutation({
    mutationFn: (v: { id: number; kind: 'dismiss' | 'click' }) => api.post(`/announcements/${v.id}/${v.kind}`),
    onMutate: (v) => qc.setQueryData<Announcement[]>(['announcements'], (list) => (list ?? []).filter((a) => a.id !== v.id)),
  })
  if (!data?.length) return null
  const a = data[0]!
  const t = TONE[a.tone] ?? TONE.info
  const external = a.ctaUrl ? /^https?:\/\//.test(a.ctaUrl) : false
  return (
    <div className={cx('mb-4 flex items-start gap-3 rounded-xl border px-4 py-3', t.box)} role="status">
      <t.icon className={cx('mt-0.5 size-5 shrink-0', t.color)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{a.title}</p>
        <p className="mt-0.5 text-sm text-muted">{a.body}</p>
        {a.ctaUrl && a.ctaLabel && (
          <div className="mt-2">
            {external ? (
              <a href={a.ctaUrl} target="_blank" rel="noopener" onClick={() => act.mutate({ id: a.id, kind: 'click' })} className={buttonClass('primary', 'sm')}>
                {a.ctaLabel}
              </a>
            ) : (
              <Link to={a.ctaUrl} onClick={() => act.mutate({ id: a.id, kind: 'click' })} className={buttonClass('primary', 'sm')}>
                {a.ctaLabel}
              </Link>
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={() => act.mutate({ id: a.id, kind: 'dismiss' })} className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Fermer" title="Fermer">
        <X className="size-4" />
      </button>
    </div>
  )
}
