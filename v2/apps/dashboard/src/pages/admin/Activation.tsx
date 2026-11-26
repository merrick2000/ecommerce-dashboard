/** Super admin : pourquoi des boutiques restent sans produit (étapes suivies, réponses), et email de relance. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Rocket } from 'lucide-react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Skeleton } from '@/components/ui'
import { api } from '@/lib/api'
import { fdate } from './shared'

interface Report {
  emptyStores: number
  steps: { opened: number; imported: number; tried: number }
  saveErrors: { message: string; count: number }[]
  blockers: { answer: string; label: string; count: number }[]
  recent: { answer: string; label: string; detail: string | null; source: string; at: string; userId: number; name: string; email: string }[]
  campaign: { eligible: number; sent: number; lastSentAt: string | null }
  sellers: { id: number; name: string; email: string; storeName: string; mailed: boolean }[]
}

function Stat({ n, of, label, hint }: { n: number; of?: number; label: string; hint?: string }) {
  const pct = of ? Math.round((n / of) * 100) : null
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="tabular text-2xl font-bold">
        {n}
        {pct !== null && <span className="ml-1 text-sm font-medium text-muted">({pct} %)</span>}
      </p>
      <p className="text-[13px] font-medium">{label}</p>
      {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

export default function AdminActivation() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['admin', 'activation'], queryFn: () => api.get<Report>('/admin/activation') })
  const send = useMutation({
    mutationFn: () => api.post('/admin/activation/campaign'),
    onSuccess: () => {
      toast.success('Envoi lancé : les emails partent en arrière-plan')
      window.setTimeout(() => void qc.invalidateQueries({ queryKey: ['admin', 'activation'] }), 8000)
    },
    onError: (e) => toast.error(e),
  })
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  const n = data.emptyStores
  const totalAnswers = data.blockers.reduce((s, b) => s + b.count, 0)
  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Rocket className="size-6 text-accent" /> Démarrage
        </h1>
        <p className="text-sm text-muted">Les vendeurs qui ont une boutique mais aucun produit : ce qu’ils ont fait, ce qui les bloque, et la relance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat n={n} label="Boutiques sans produit" />
        <Stat n={data.steps.opened} of={n} label="Ont ouvert « Nouveau produit »" hint="Ceux qui n’y sont jamais allés ne savent peut-être pas par où commencer." />
        <Stat n={data.steps.tried} of={n} label="Ont essayé d’enregistrer, sans succès" hint="Voir les erreurs ci-dessous." />
        <Stat n={totalAnswers} label="Ont dit ce qui les bloque" />
      </div>
      <p className="text-[12px] text-muted">Le suivi des étapes a démarré aujourd’hui : les chiffres se remplissent au fil des visites.</p>

      <Card title="Ce qui les bloque" description="Réponses à « Qu’est-ce qui vous empêche d’ajouter votre premier produit ? » (email en un clic ou tableau de bord). Dernière réponse de chaque vendeur.">
        {data.blockers.length ? (
          <ul className="space-y-2 text-sm">
            {data.blockers.map((b) => (
              <li key={b.answer}>
                <div className="flex justify-between gap-3">
                  <span>{b.label}</span>
                  <span className="tabular font-semibold">{b.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-2">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(4, (b.count / totalAnswers) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Pas encore de réponse. Envoie l’email ci-dessous : chaque vendeur peut répondre en un clic.</p>
        )}
      </Card>

      <Card title="Erreurs à l’enregistrement d’un produit" description="Ce que les vendeurs voient quand l’enregistrement échoue (60 derniers jours).">
        {data.saveErrors.length ? (
          <ul className="divide-y divide-line text-sm">
            {data.saveErrors.map((e) => (
              <li key={e.message} className="flex justify-between gap-3 py-2">
                <span className="min-w-0 break-words">{e.message}</span>
                <span className="tabular shrink-0 font-semibold">{e.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucune erreur enregistrée pour l’instant.</p>
        )}
      </Card>

      <Card title="Relancer les boutiques vides" description="Email « Votre boutique attend son premier produit » : les 3 étapes, un bouton vers « Nouveau produit », et la question « Qu’est-ce qui vous bloque ? » en un clic. Une seule fois par vendeur ; les désinscrits ne le reçoivent pas.">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" loading={send.isPending} disabled={!data.campaign.eligible} onClick={() => window.confirm(`Envoyer l’email à ${data.campaign.eligible} vendeur${data.campaign.eligible > 1 ? 's' : ''} ?`) && send.mutate()}>
            <Mail className="size-4" /> Envoyer à {data.campaign.eligible} vendeur{data.campaign.eligible > 1 ? 's' : ''}
          </Button>
          <span className="text-[13px] text-muted">
            {data.campaign.sent ? `Déjà envoyé à ${data.campaign.sent} vendeur${data.campaign.sent > 1 ? 's' : ''}, dernier envoi le ${fdate(data.campaign.lastSentAt!, true)}` : 'Jamais envoyé'}
          </span>
        </div>
      </Card>

      <Card title={`Dernières réponses (${data.recent.length})`}>
        {data.recent.length ? (
          <ul className="divide-y divide-line text-sm">
            {data.recent.map((r, i) => (
              <li key={i} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/admin/users/${r.userId}`} className="font-medium hover:underline">
                    {r.name}
                  </Link>
                  <span className="text-muted">{r.email}</span>
                  <Badge tone="neutral">{r.source === 'email' ? 'email' : 'tableau de bord'}</Badge>
                  <span className="text-[12px] text-muted">{fdate(r.at, true)}</span>
                </div>
                <p className="mt-0.5">{r.label}</p>
                {r.detail && <p className="mt-0.5 text-muted">« {r.detail} »</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucune réponse pour l’instant.</p>
        )}
      </Card>

      <Card title={`Vendeurs concernés (${data.sellers.length})`}>
        <ul className="divide-y divide-line text-sm">
          {data.sellers.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Link to={`/admin/users/${s.id}`} className="min-w-0 hover:underline">
                <span className="font-medium">{s.name}</span> <span className="text-muted">· {s.storeName}</span>
              </Link>
              <span className="flex items-center gap-2 text-[13px] text-muted">
                {s.email}
                {s.mailed && <Badge tone="green">relancé</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
