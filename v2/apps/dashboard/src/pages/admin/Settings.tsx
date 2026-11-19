import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/Toast'
import { Badge, Card, ErrorState, Select, Skeleton, Switch } from '@/components/ui'
import { api } from '@/lib/api'
import { fdate, fmt } from './shared'

interface PlatformSettings {
  paymentsOnline: boolean
  billingEnabled: boolean
  billingAccount: { storeId?: string } | null
  myStores: { id: string; name: string; accounts: { provider: string; enabled: boolean; mode: string }[] }[]
}

export default function AdminSettings() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => api.get<PlatformSettings>('/admin/settings') })
  const payments = useQuery({ queryKey: ['admin', 'billing-payments'], queryFn: () => api.get<{ id: number; email: string; plan: string; months: number; amount: number; status: string; provider: string; createdAt: string }[]>('/admin/billing-payments') })
  const save = useMutation({ mutationFn: (body: unknown) => api.put('/admin/settings', body) })
  const put = (body: unknown, msg: string) => save.mutate(body, { onSuccess: () => (toast.success(msg), void qc.invalidateQueries({ queryKey: ['admin', 'settings'] })), onError: (e) => toast.error(e) })
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  const billingStore = data.myStores.find((s) => s.id === data.billingAccount?.storeId)
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Réglages de la plateforme</h1>
      <Card title="Ouverture des paiements" description="Tant que c’est désactivé, seuls toi et les comptes que tu autorises (fiche du compte) y ont accès.">
        <div className="space-y-3">
          <Switch label="Paiements en ligne (Mobile Money) ouverts à tous les vendeurs" checked={data.paymentsOnline} onChange={(v) => put({ paymentsOnline: v }, v ? 'Paiements en ligne ouverts à tous' : 'Paiements en ligne réservés')} />
          <Switch label="Paiement des abonnements ouvert à tous" checked={data.billingEnabled} onChange={(v) => put({ billingEnabled: v }, v ? 'Abonnements payants ouverts' : 'Abonnements payants réservés')} />
        </div>
      </Card>
      <Card title="Compte d’encaissement des abonnements" description="Les abonnements sont payés sur les comptes FedaPay, FeexPay ou pawaPay connectés à cette boutique (Paramètres, Paiements).">
        <Select
          label="Boutique qui encaisse"
          value={data.billingAccount?.storeId ?? ''}
          onChange={(e) => put({ billingStoreId: e.target.value || null }, 'Compte d’encaissement enregistré')}
          options={[{ value: '', label: 'Aucune (paiement désactivé)' }, ...data.myStores.map((s) => ({ value: s.id, label: s.name }))]}
        />
        {billingStore && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {billingStore.accounts.length === 0 ? (
              <span className="text-red-600">Aucun compte FedaPay, FeexPay ou pawaPay connecté sur cette boutique.</span>
            ) : (
              billingStore.accounts.map((a) => (
                <Badge key={a.provider} tone={a.enabled ? 'green' : 'neutral'}>
                  {a.provider} · {a.mode === 'live' ? 'réel' : 'test'}
                </Badge>
              ))
            )}
          </div>
        )}
      </Card>
      <Card title="Derniers paiements d’abonnement">
        {payments.data?.length ? (
          <ul className="divide-y divide-line text-sm">
            {payments.data.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{p.email}</span>
                <span>
                  {p.plan} · {p.months} mois · {p.provider}
                </span>
                <span className="tabular">{fmt(p.amount)} F</span>
                <span className="text-muted">{fdate(p.createdAt, true)}</span>
                <Badge tone={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'neutral'}>{p.status}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun paiement pour l’instant.</p>
        )}
      </Card>
    </div>
  )
}
