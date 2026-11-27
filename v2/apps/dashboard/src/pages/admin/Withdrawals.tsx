/**
 * Super admin : demandes de retrait des boutiques (vérifier, valider, marquer versé, refuser)
 * et réglages du portefeuille (délai avant retrait, minimum, commission par formule).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, EmptyState, ErrorState, Input, ListSkeleton, Segmented } from '@/components/ui'
import { api } from '@/lib/api'
import { money, relative } from '@/lib/format'
import { W_STATUS } from '../Finances'

type Row = {
  id: number
  storeId: string
  storeName: string
  storeSlug: string
  owner: string | null
  amount: number
  currency: string
  phone: string
  network: string
  country: string
  holderName: string | null
  status: keyof typeof W_STATUS
  reference: string | null
  reason: string | null
  createdAt: string
  paidAt: string | null
  balance: { available: number; pending: number; earned: number; withdrawn: number }
}
type Config = { holdDays: number; minWithdrawal: number; commission: Record<'free' | 'starter' | 'pro' | 'business', number> }
const PLAN_NAME = { free: 'Gratuite', starter: 'Starter', pro: 'Pro', business: 'Business' } as const

export default function AdminWithdrawals() {
  const [status, setStatus] = useState<'open' | 'paid' | 'rejected' | 'all'>('open')
  const qc = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['admin', 'withdrawals', status], queryFn: () => api.get<Row[]>('/admin/withdrawals', { status }) })
  const act = useMutation({
    mutationFn: (v: { id: number; action: 'approve' | 'paid' | 'reject' | 'failed'; reference?: string; reason?: string }) => api.post(`/admin/withdrawals/${v.id}/${v.action}`, { reference: v.reference, reason: v.reason }),
    onSuccess: (_, v) => {
      toast.success(v.action === 'approve' ? 'Retrait validé : à envoyer' : v.action === 'paid' ? 'Retrait marqué versé, le vendeur est prévenu' : 'Retrait refusé, montant rendu au vendeur')
      void qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] })
    },
    onError: (e) => toast.error(e),
  })
  const copy = (t: string) => void navigator.clipboard?.writeText(t).then(() => toast.success('Copié'))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Retraits</h1>
          <p className="text-sm text-muted">Demandes des boutiques à portefeuille : vérifier, valider, envoyer, puis marquer versé.</p>
        </div>
        <Segmented
          label="Statut"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'open', label: 'À traiter' },
            { value: 'paid', label: 'Versés' },
            { value: 'rejected', label: 'Refusés' },
            { value: 'all', label: 'Tous' },
          ]}
        />
      </div>

      {q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : q.isPending ? (
        <ListSkeleton rows={3} />
      ) : !q.data.length ? (
        <EmptyState icon={<Check className="size-5" />} title={status === 'open' ? 'Rien à traiter' : 'Aucun retrait'} description={status === 'open' ? 'Les nouvelles demandes arrivent ici (et en notification).' : 'Aucun retrait dans cette liste.'} />
      ) : (
        <ul className="space-y-3">
          {q.data.map((w) => (
            <li key={w.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="tabular text-xl font-semibold">{money(Number(w.amount), w.currency)}</p>
                  <p className="text-sm">
                    <strong>{w.storeName}</strong> <span className="text-muted">· {w.owner ?? 'propriétaire inconnu'} · {relative(w.createdAt)}</span>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      {w.network} · {w.country}
                    </span>
                    <button type="button" onClick={() => copy(w.phone.replace(/\s/g, ''))} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[13px] hover:bg-line" title="Copier le numéro">
                      {w.phone} <Copy className="size-3" />
                    </button>
                    {w.holderName && <span className="text-muted">titulaire : {w.holderName}</span>}
                  </p>
                  <p className="mt-1 text-[12.5px] text-muted">
                    Solde de la boutique : {money(w.balance.available, w.currency)} disponible, {money(w.balance.pending, w.currency)} en attente, {money(w.balance.earned, w.currency)} gagné au total
                  </p>
                  {(w.reference || w.reason) && <p className="mt-1 text-[12.5px] text-muted">{w.reference ? `Référence : ${w.reference}` : `Motif : ${w.reason}`}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={W_STATUS[w.status].tone}>{W_STATUS[w.status].label}</Badge>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {w.status === 'pending' && (
                      <Button size="sm" variant="primary" loading={act.isPending} onClick={() => act.mutate({ id: w.id, action: 'approve' })}>
                        <Check className="size-3.5" /> Valider
                      </Button>
                    )}
                    {(w.status === 'approved' || w.status === 'processing') && (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={act.isPending}
                        onClick={() => {
                          const reference = window.prompt(`Envoyé ${money(Number(w.amount), w.currency)} sur ${w.network} ${w.phone} ? Référence du transfert (facultatif) :`, '')
                          if (reference !== null) act.mutate({ id: w.id, action: 'paid', reference })
                        }}
                      >
                        <Send className="size-3.5" /> Marquer versé
                      </Button>
                    )}
                    {['pending', 'approved', 'processing'].includes(w.status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const reason = window.prompt('Motif du refus (le vendeur le verra) :', '')
                          if (reason !== null) act.mutate({ id: w.id, action: w.status === 'pending' ? 'reject' : 'failed', reason })
                        }}
                      >
                        <X className="size-3.5" /> {w.status === 'pending' ? 'Refuser' : 'Échec d’envoi'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfigCard />
    </div>
  )
}

function ConfigCard() {
  const qc = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['admin', 'wallet-config'], queryFn: () => api.get<Config>('/admin/wallet/config') })
  const [draft, setDraft] = useState<Config | null>(null)
  const c = draft ?? q.data
  const save = useMutation({
    mutationFn: (v: Config) => api.put<Config>('/admin/wallet/config', v),
    onSuccess: () => (toast.success('Réglages du portefeuille enregistrés'), setDraft(null), void qc.invalidateQueries({ queryKey: ['admin', 'wallet-config'] })),
    onError: (e) => toast.error(e),
  })
  if (!c) return null
  const set = (patch: Partial<Config>) => setDraft({ ...c, ...patch })
  return (
    <Card collapsible defaultOpen={false} title="Réglages du portefeuille" summary={`Délai ${c.holdDays} j · minimum ${money(c.minWithdrawal, 'XOF')} · commission ${c.commission.free} / ${c.commission.starter} / ${c.commission.pro} / ${c.commission.business} %`}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Délai avant retrait" type="number" min={0} max={60} value={c.holdDays} onChange={(e) => set({ holdDays: Number(e.target.value) })} suffix="jours" hint="Protège contre les remboursements et la fraude." />
          <Input label="Retrait minimum" type="number" min={0} value={c.minWithdrawal} onChange={(e) => set({ minWithdrawal: Number(e.target.value) })} suffix="FCFA" />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium">Commission par formule</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(PLAN_NAME) as (keyof typeof PLAN_NAME)[]).map((k) => (
              <Input key={k} label={PLAN_NAME[k]} type="number" min={0} max={50} step="0.5" value={c.commission[k]} onChange={(e) => set({ commission: { ...c.commission, [k]: Number(e.target.value) } })} suffix="%" />
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-muted">Une commission propre peut être fixée boutique par boutique (Super admin, Boutiques).</p>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" disabled={!draft} loading={save.isPending} onClick={() => draft && save.mutate(draft)}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Card>
  )
}
