import { PLAN_IDS, PLANS, type EffectivePlan, type PlanId } from '@zuri/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Select, Skeleton, Switch } from '@/components/ui'
import { api } from '@/lib/api'
import { ago, fdate, fmt, NUDGE_LABEL, PlanBadge, StageBadge, StatusBadge, type Stage } from './shared'

interface Detail {
  user: { id: number; email: string; name: string; phone: string | null; country: string | null; isPlatformAdmin: boolean; createdAt: string; lastLoginAt: string | null; disabledAt: string | null; features: Record<string, boolean> | null; signupSource: Record<string, string> | null; googleSub: string | null }
  stores: { id: string; name: string; slug: string; status: string; role: string; createdAt: string }[]
  payments: { id: number; plan: string; months: number; amount: number; status: string; provider: string; error?: string | null; createdAt: string }[]
  subscription: { plan: PlanId; currentPeriodEnd: string; source: string; note: string | null } | null
  plan: EffectivePlan
  stage: Stage
  nudges: { kind: string; step: number; at: string }[]
  referral: { parent: { id: number; name: string } | null; referred: number }
}

const SOURCE_LABEL: Record<string, string> = { utmSource: 'utm_source', utmMedium: 'utm_medium', utmCampaign: 'utm_campaign', referrer: 'Site d’origine', landing: 'Première page vue', from: 'Clic depuis', firstSeen: 'Première visite', method: 'Méthode' }

export default function AdminUserDetail() {
  const { userId } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const [plan, setPlan] = useState<PlanId>('pro')
  const [months, setMonths] = useState('1')
  const key = ['admin', 'user', userId]
  const { data, error, isPending, refetch } = useQuery({ queryKey: key, queryFn: () => api.get<Detail>(`/admin/users/${userId}`) })
  const done = (msg: string) => {
    toast.success(msg)
    void qc.invalidateQueries({ queryKey: ['admin'] })
  }
  const patch = useMutation({ mutationFn: (body: unknown) => api.patch(`/admin/users/${userId}`, body) })
  const offer = useMutation({ mutationFn: () => api.post(`/admin/users/${userId}/subscription`, { plan, months: Number(months) }) })
  const revoke = useMutation({ mutationFn: () => api.del(`/admin/users/${userId}/subscription`) })
  const retry = useMutation({ mutationFn: () => api.post<{ email: string; plan: string; amount: number }>(`/admin/users/${userId}/billing-retry`) })
  const storeStatus = useMutation({ mutationFn: (v: { id: string; status: string }) => api.post(`/admin/stores/${v.id}/status`, { status: v.status }) })

  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  const u = data.user
  const features = u.features ?? {}
  const setFeature = (k: string, v: boolean) => patch.mutate({ features: { ...features, [k]: v } }, { onSuccess: () => done('Option mise à jour'), onError: (e) => toast.error(e) })

  return (
    <div className="space-y-4">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Comptes
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{u.name}</h1>
        <PlanBadge plan={data.plan} />
        <StageBadge stage={data.stage} />
        {data.referral.parent && (
          <Link to={`/admin/users/${data.referral.parent.id}`} className="text-sm text-muted hover:text-fg">
            Parrainé par <span className="font-medium underline">{data.referral.parent.name}</span>
          </Link>
        )}
        {data.referral.referred > 0 && <Badge tone="green">{data.referral.referred} filleul{data.referral.referred > 1 ? 's' : ''}</Badge>}
        {u.isPlatformAdmin && <Badge tone="violet">Admin</Badge>}
        {u.disabledAt && <Badge tone="red">Suspendu</Badge>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Compte">
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Email</dt>
            <dd>{u.email}</dd>
            <dt className="text-muted">Téléphone</dt>
            <dd>{u.phone ?? '-'}</dd>
            <dt className="text-muted">Pays</dt>
            <dd>{u.country ?? '-'}</dd>
            <dt className="text-muted">Inscrit le</dt>
            <dd>{fdate(u.createdAt, true)}</dd>
            <dt className="text-muted">Dernière connexion</dt>
            <dd>{ago(u.lastLoginAt)}</dd>
            <dt className="text-muted">Google</dt>
            <dd>{u.googleSub ? 'Relié' : 'Non'}</dd>
          </dl>
        </Card>
        <Card title="Provenance">
          {u.signupSource ? (
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              {Object.entries(u.signupSource).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{SOURCE_LABEL[k] ?? k}</dt>
                  <dd className="break-all">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">Inscrit avant le suivi de provenance.</p>
          )}
        </Card>
      </div>

      <Card
        title="Emails d’accompagnement"
        description={(u as { emailOptOutAt?: string | null }).emailOptOutAt ? 'Ce vendeur a demandé à ne plus recevoir ces emails.' : 'Envoyés automatiquement quand le vendeur bloque à une étape (sans boutique, sans produit, sans vente).'}
      >
        {data.nudges.length ? (
          <ul className="divide-y divide-line text-sm">
            {data.nudges.map((n) => (
              <li key={`${n.kind}-${n.step}`} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {n.kind.startsWith('billing_') ? 'Terminer le paiement de l’abonnement' : (NUDGE_LABEL[n.kind] ?? n.kind)} <span className="text-muted">· relance {n.step}</span>
                </span>
                <span className="text-muted">{fdate(n.at, true)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun email d’accompagnement envoyé pour l’instant.</p>
        )}
      </Card>

      <Card title="Formule" description={data.subscription ? `${PLANS[data.subscription.plan].name} jusqu’au ${fdate(data.subscription.currentPeriodEnd)} (${data.subscription.source === 'offered' ? 'offerte' : 'payée'})` : 'Aucun abonnement : formule selon le calendrier de lancement.'}>
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Formule à offrir" value={plan} onChange={(e) => setPlan(e.target.value as PlanId)} options={PLAN_IDS.map((p) => ({ value: p, label: PLANS[p].name }))} />
          <Input label="Durée (mois)" type="number" min={1} max={36} value={months} onChange={(e) => setMonths(e.target.value)} wrapClass="w-32" />
          <Button variant="primary" loading={offer.isPending} onClick={() => offer.mutate(undefined, { onSuccess: () => done('Formule offerte'), onError: (e) => toast.error(e) })}>
            Offrir
          </Button>
          {data.payments.some((p) => p.status !== 'paid') && (
            <Button
              loading={retry.isPending}
              onClick={() => retry.mutate(undefined, { onSuccess: (r) => toast.success(`Relance envoyée à ${r.email} : ${r.plan} à ${fmt(r.amount)} F`), onError: (e) => toast.error(e) })}
            >
              Relancer pour son abonnement
            </Button>
          )}
          {data.subscription && (
            <Button variant="danger" loading={revoke.isPending} onClick={() => revoke.mutate(undefined, { onSuccess: () => done('Abonnement retiré'), onError: (e) => toast.error(e) })}>
              Retirer l’abonnement
            </Button>
          )}
        </div>
      </Card>

      <Card title="Options et accès">
        <div className="space-y-3">
          <Switch label="Paiements en ligne (Mobile Money sur ses boutiques)" checked={!!features.onlinePayments} onChange={(v) => setFeature('onlinePayments', v)} />
          <Switch label="Payer son abonnement en ligne" checked={!!features.billing} onChange={(v) => setFeature('billing', v)} />
          <Switch label="Importer des produits par lien (AliExpress, Amazon, boutiques)" checked={!!features.urlImport} onChange={(v) => setFeature('urlImport', v)} />
          <Switch label="Panier : plusieurs produits par commande (en observation)" checked={!!features.cart} onChange={(v) => setFeature('cart', v)} />
          <Switch
            label="Compte suspendu (connexion refusée)"
            checked={!!u.disabledAt}
            onChange={(v) => patch.mutate({ disabled: v }, { onSuccess: () => done(v ? 'Compte suspendu' : 'Compte réactivé'), onError: (e) => toast.error(e) })}
          />
        </div>
      </Card>

      <Card title={`Boutiques (${data.stores.length})`}>
        <ul className="divide-y divide-line text-sm">
          {data.stores.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <Link to={`/stores/${s.id}`} className="font-medium hover:underline">
                {s.name}
              </Link>
              <span className="text-muted">/{s.slug}</span>
              <StatusBadge status={s.status} />
              <Badge>{s.role}</Badge>
              <div className="flex-1" />
              {s.status !== 'active' && (
                <Button size="sm" onClick={() => storeStatus.mutate({ id: s.id, status: 'active' }, { onSuccess: () => done('Boutique rouverte') })}>
                  Rouvrir
                </Button>
              )}
              {s.status === 'active' && (
                <Button size="sm" onClick={() => storeStatus.mutate({ id: s.id, status: 'paused' }, { onSuccess: () => done('Boutique en pause') })}>
                  Pause
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {data.payments.length > 0 && (
        <Card title="Paiements d’abonnement">
          <ul className="divide-y divide-line text-sm">
            {data.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {p.plan} · {p.months} mois · {p.provider}
                </span>
                <span className="tabular">{fmt(p.amount)} F</span>
                <span className="text-muted">{fdate(p.createdAt, true)}</span>
                <Badge tone={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'neutral'}>{p.status === 'paid' ? 'payé' : p.status === 'failed' ? 'échoué' : 'en attente'}</Badge>
                {p.status === 'failed' && p.error && <span className="w-full text-[12px] text-red-700 dark:text-red-300">{p.error}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
