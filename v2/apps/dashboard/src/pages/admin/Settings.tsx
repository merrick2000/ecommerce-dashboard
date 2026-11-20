import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Select, Skeleton, Switch } from '@/components/ui'
import { api } from '@/lib/api'
import { fdate, fmt } from './shared'

interface PlatformSettings {
  paymentsOnline: boolean
  billingEnabled: boolean
  billingAccount: { storeId?: string } | null
  urlImport: boolean
  firecrawl: { configured: boolean; source: 'admin' | 'env' | null; hint: string | null }
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
      <Card title="Import de produit par lien" description="Lecture des pages produit protégées (AliExpress, Amazon…) avec un navigateur distant Firecrawl, puis IA. Chaque import consomme des crédits Firecrawl : tant que c’est fermé, seuls toi et les comptes que tu autorises (fiche du compte) le voient.">
        <div className="space-y-4">
          <Switch label="Import par lien ouvert à tous les vendeurs" checked={data.urlImport} onChange={(v) => put({ urlImport: v }, v ? 'Import par lien ouvert à tous' : 'Import par lien réservé')} />
          <FirecrawlKey firecrawl={data.firecrawl} onSave={(key, msg) => put({ firecrawlKey: key }, msg)} />
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

/** Clé Firecrawl : enregistrée chiffrée en base (prioritaire sur la variable d'environnement). */
function FirecrawlKey({ firecrawl, onSave }: { firecrawl: PlatformSettings['firecrawl']; onSave: (key: string | null, msg: string) => void }) {
  const [key, setKey] = useState('')
  return (
    <div className="space-y-2">
      <p className="text-sm">
        Clé Firecrawl :{' '}
        {firecrawl.configured ? (
          <>
            <Badge tone="green">configurée</Badge> <code className="text-[12px]">{firecrawl.hint}</code> <span className="text-[12px] text-muted">({firecrawl.source === 'admin' ? 'enregistrée ici' : 'variable d’environnement'})</span>
          </>
        ) : (
          <Badge tone="amber">absente : les sites protégés passent par l’IA ou le texte collé</Badge>
        )}
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!key.trim()) return
          onSave(key.trim(), 'Clé Firecrawl enregistrée')
          setKey('')
        }}
      >
        <Input label="Nouvelle clé" placeholder="fc-…" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" wrapClass="min-w-64 flex-1" />
        <Button type="submit" variant="primary" disabled={!key.trim()}>
          Enregistrer
        </Button>
        {firecrawl.source === 'admin' && (
          <Button type="button" variant="ghost" onClick={() => onSave(null, 'Clé Firecrawl retirée')}>
            Retirer
          </Button>
        )}
      </form>
    </div>
  )
}
