/** Super admin : annonces aux vendeurs (bandeau du tableau de bord, notification en option), ciblées. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, Input, ListSkeleton, Segmented, Switch, Textarea } from '@/components/ui'
import { useDebounced } from '@/hooks/useDebounced'
import { api } from '@/lib/api'
import { fdate } from './shared'

type Stage = 'no_store' | 'no_product' | 'no_order' | 'active'
interface Audience {
  stages?: Stage[]
  langs?: ('fr' | 'en')[]
  kinds?: ('physical' | 'digital')[]
  countries?: string[]
}
interface Announcement {
  id: number
  title: string
  body: string
  ctaLabel: string | null
  ctaUrl: string | null
  tone: 'info' | 'promo' | 'warning'
  audience: Audience
  startsAt: string
  endsAt: string | null
  active: boolean
  push: boolean
  pushedAt: string | null
  pushedCount: number | null
  clicks: number
  dismissed: number
  audienceSize: number
  createdAt: string
}

const STAGES: [Stage, string][] = [
  ['no_store', 'Sans boutique'],
  ['no_product', 'Sans produit'],
  ['no_order', 'Sans vente'],
  ['active', 'Ont vendu'],
]
const TONE_LABEL = { info: 'Information', promo: 'Promo', warning: 'Important' }

function toggle<T>(list: T[] | undefined, v: T): T[] {
  const l = list ?? []
  return l.includes(v) ? l.filter((x) => x !== v) : [...l, v]
}

function Form({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [tone, setTone] = useState<'info' | 'promo' | 'warning'>('promo')
  const [audience, setAudience] = useState<Audience>({})
  const [countries, setCountries] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [push, setPush] = useState(false)
  const [size, setSize] = useState<number | null>(null)
  const full: Audience = { ...audience, countries: countries.split(/[\s,]+/).map((c) => c.trim().toUpperCase()).filter((c) => c.length === 2) }
  const key = useDebounced(JSON.stringify(full), 300)
  useEffect(() => {
    void api.post<{ size: number }>('/admin/announcements/audience', { audience: JSON.parse(key) }).then((r) => setSize(r.size))
  }, [key])
  const save = useMutation({
    mutationFn: () => api.post('/admin/announcements', { title, body, ctaLabel: ctaLabel || null, ctaUrl: ctaUrl || null, tone, audience: full, endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null, push }),
    onSuccess: () => {
      toast.success(push ? 'Annonce publiée, notifications en cours d’envoi' : 'Annonce publiée')
      onDone()
    },
    onError: (e) => toast.error(e),
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }
  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} type="button" onClick={onClick} className={`rounded-full border px-3 py-1.5 text-[13px] font-medium ${on ? 'border-accent bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg'}`}>
      {label}
    </button>
  )
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex. Plus que 5 jours d’offre de lancement" />
      <Textarea label="Texte" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} placeholder="Ex. Choisissez votre formule avant le 30 novembre et gardez toutes vos fonctions." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Texte du bouton" optional value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={40} placeholder="Voir les formules" />
        <Input label="Lien du bouton" optional value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} maxLength={300} placeholder="/billing, /referrals ou https://…" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Segmented label="Ton" value={tone} onChange={setTone} options={(['promo', 'info', 'warning'] as const).map((v) => ({ value: v, label: TONE_LABEL[v] }))} />
        <Input label="Jusqu’au" optional type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </div>
      <fieldset className="space-y-2 rounded-lg border border-line p-3">
        <legend className="px-1 text-sm font-semibold">Qui la voit ?</legend>
        <p className="text-[12px] text-muted">Rien de coché dans une ligne = tout le monde pour ce critère.</p>
        <div className="flex flex-wrap gap-1.5">{STAGES.map(([v, l]) => chip(!!audience.stages?.includes(v), l, () => setAudience({ ...audience, stages: toggle(audience.stages, v) })))}</div>
        <div className="flex flex-wrap gap-1.5">
          {chip(!!audience.langs?.includes('fr'), 'Français', () => setAudience({ ...audience, langs: toggle(audience.langs, 'fr') }))}
          {chip(!!audience.langs?.includes('en'), 'Anglais', () => setAudience({ ...audience, langs: toggle(audience.langs, 'en') }))}
          {chip(!!audience.kinds?.includes('physical'), 'Boutiques physiques', () => setAudience({ ...audience, kinds: toggle(audience.kinds, 'physical') }))}
          {chip(!!audience.kinds?.includes('digital'), 'Boutiques digitales', () => setAudience({ ...audience, kinds: toggle(audience.kinds, 'digital') }))}
        </div>
        <Input label="Pays" optional value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="Codes pays : BJ, CI, SN…" />
        <p className="text-sm">
          <strong className="tabular">{size ?? '…'}</strong> compte{size === 1 ? '' : 's'} concerné{size === 1 ? '' : 's'}
        </p>
      </fieldset>
      <Switch checked={push} onChange={setPush} label="Envoyer aussi une notification sur leur téléphone" description="Une seule fois, aux vendeurs ciblés qui ont activé les notifications." />
      <Button type="submit" variant="primary" loading={save.isPending} disabled={title.trim().length < 3 || body.trim().length < 5}>
        Publier l’annonce
      </Button>
    </form>
  )
}

export default function AdminAnnouncements() {
  const qc = useQueryClient()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['admin', 'announcements'], queryFn: () => api.get<Announcement[]>('/admin/announcements') })
  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin', 'announcements'] })
  const patch = useMutation({ mutationFn: (v: { id: number; active: boolean }) => api.patch(`/admin/announcements/${v.id}`, { active: v.active }), onSuccess: refresh, onError: (e) => toast.error(e) })
  const del = useMutation({ mutationFn: (id: number) => api.del(`/admin/announcements/${id}`), onSuccess: () => (toast.success('Annonce supprimée'), refresh()), onError: (e) => toast.error(e) })
  const target = (a: Audience) =>
    [a.stages?.map((s) => STAGES.find((x) => x[0] === s)?.[1]).join(', '), a.langs?.map((l) => (l === 'fr' ? 'Français' : 'Anglais')).join(', '), a.kinds?.map((k) => (k === 'physical' ? 'Physiques' : 'Digitales')).join(', '), a.countries?.join(', ')].filter(Boolean).join(' · ') || 'Tous les vendeurs'
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Annonces</h1>
          <p className="text-sm text-muted">Un bandeau en haut du tableau de bord des vendeurs ciblés, et une notification en option.</p>
        </div>
        {!creating && (
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Megaphone className="size-4" /> Nouvelle annonce
          </Button>
        )}
      </div>
      {creating && (
        <Card title="Nouvelle annonce">
          <Form
            onDone={() => {
              setCreating(false)
              refresh()
            }}
          />
        </Card>
      )}
      {error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <ListSkeleton rows={3} />
      ) : !data.length ? (
        <EmptyState icon={<Megaphone className="size-5" />} title="Aucune annonce" description="Exemples : fin de l’offre de lancement, nouvelle fonction, rappel du parrainage." />
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <strong>{a.title}</strong>
                    <Badge tone={a.active ? 'green' : 'neutral'}>{a.active ? 'En ligne' : 'Arrêtée'}</Badge>
                    <Badge tone="neutral">{TONE_LABEL[a.tone]}</Badge>
                  </p>
                  <p className="mt-1 text-sm text-muted">{a.body}</p>
                  <p className="mt-1 text-[13px] text-muted">
                    Cible : {target(a.audience)} ({a.audienceSize} compte{a.audienceSize > 1 ? 's' : ''}) · publiée le {fdate(a.createdAt)}
                    {a.endsAt ? ` · jusqu’au ${fdate(a.endsAt)}` : ''}
                  </p>
                  <p className="mt-1 text-[13px]">
                    <strong className="tabular">{a.clicks}</strong> clic{a.clicks > 1 ? 's' : ''} · <strong className="tabular">{a.dismissed}</strong> fermée{a.dismissed > 1 ? 's' : ''}
                    {a.push ? ` · notification ${a.pushedAt ? `envoyée à ${a.pushedCount ?? 0} téléphone${(a.pushedCount ?? 0) > 1 ? 's' : ''}` : 'en attente'}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-[13px]">
                    <Checkbox checked={a.active} onChange={(active) => patch.mutate({ id: a.id, active })} label="Annonce en ligne" /> En ligne
                  </label>
                  <Button size="icon" variant="ghost" className="text-red-600 dark:text-red-400" aria-label="Supprimer" onClick={() => window.confirm('Supprimer cette annonce ?') && del.mutate(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
