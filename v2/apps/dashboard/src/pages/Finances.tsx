/**
 * Finances (boutiques de produits digitaux) : portefeuille alimenté par les ventes encaissées par Zuri,
 * demandes de retrait vers Mobile Money, suivi des retraits et historique des mouvements.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownToLine, Clock, Info, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, cx, EmptyState, ErrorState, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import { useCan, useCurrentStore } from '@/hooks/auth'
import { api } from '@/lib/api'
import { money, relative } from '@/lib/format'
import type { Tone } from '@/lib/labels'

type Entry = { id: number; type: 'sale' | 'commission' | 'refund' | 'withdrawal' | 'withdrawal_reversal' | 'adjustment'; amount: number; currency: string; note: string | null; availableAt: string; createdAt: string; orderId: string | null; orderNumber: string | null }
type Withdrawal = { id: number; amount: number; currency: string; phone: string; network: string; country: string; holderName: string | null; status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'failed' | 'cancelled'; reference: string | null; reason: string | null; createdAt: string; paidAt: string | null }
type WalletData =
  | { enabled: false; currency: string }
  | {
      enabled: true
      currency: string
      available: number
      pending: number
      earned: number
      withdrawn: number
      commissionPct: number
      holdDays: number
      minWithdrawal: number
      payoutTo: { phone: string; network: string; country: string; name?: string } | null
      entries: Entry[]
      withdrawals: Withdrawal[]
    }

export const W_STATUS: Record<Withdrawal['status'], { label: string; tone: Tone }> = {
  pending: { label: 'En attente de validation', tone: 'amber' },
  approved: { label: 'Validé, envoi en cours', tone: 'blue' },
  processing: { label: 'Envoi en cours', tone: 'blue' },
  paid: { label: 'Versé', tone: 'green' },
  rejected: { label: 'Refusé', tone: 'red' },
  failed: { label: 'Échoué', tone: 'red' },
  cancelled: { label: 'Annulé', tone: 'neutral' },
}
const ENTRY_LABEL: Record<Entry['type'], string> = { sale: 'Vente', commission: 'Commission Zuri', refund: 'Remboursement', withdrawal: 'Retrait', withdrawal_reversal: 'Retrait rendu', adjustment: 'Ajustement' }

/** Réseaux Mobile Money par pays (liste courte, champ libre sinon). */
export const NETWORKS: Record<string, string[]> = {
  BJ: ['MTN', 'Moov', 'Celtiis'],
  CI: ['Orange', 'MTN', 'Moov', 'Wave'],
  SN: ['Orange', 'Wave', 'Free'],
  TG: ['Moov (Flooz)', 'Mixx by Yas'],
  BF: ['Orange', 'Moov'],
  ML: ['Orange', 'Moov'],
  NE: ['Airtel', 'Moov'],
  CM: ['MTN', 'Orange'],
  GN: ['Orange', 'MTN'],
  CD: ['M-Pesa', 'Orange', 'Airtel'],
}
const COUNTRY_NAME: Record<string, string> = { BJ: 'Bénin', CI: 'Côte d’Ivoire', SN: 'Sénégal', TG: 'Togo', BF: 'Burkina Faso', ML: 'Mali', NE: 'Niger', CM: 'Cameroun', GN: 'Guinée', CD: 'RD Congo' }

export default function Finances() {
  const { storeId, store } = useCurrentStore()
  const canManage = useCan('payments.manage')
  const q = useQuery({ queryKey: ['store', storeId, 'wallet'], queryFn: () => api.get<WalletData>(`/stores/${storeId}/wallet`), enabled: canManage })
  const [asking, setAsking] = useState(false)
  const d = q.data
  const cur = d?.currency ?? store?.currency ?? 'XOF'

  if (!canManage) return <EmptyState icon={<Wallet className="size-5" />} title="Accès réservé" description="Seuls le propriétaire et les personnes qui gèrent les paiements voient les finances." />
  if (q.error && !d) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />

  return (
    <>
      <PageHeader
        title="Finances"
        description="Votre argent encaissé par Zuri, et vos retraits vers Mobile Money."
        actions={
          d?.enabled ? (
            <Button variant="primary" onClick={() => setAsking(true)} disabled={d.available < d.minWithdrawal || d.withdrawals.some((w) => ['pending', 'approved', 'processing'].includes(w.status))}>
              <ArrowDownToLine className="size-4" /> Demander un retrait
            </Button>
          ) : undefined
        }
      />
      {!d ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !d.enabled ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-accent/10 text-accent">
              <Wallet className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">Encaissez sans compte de paiement</h2>
            <p className="max-w-lg text-sm text-muted">Avec le portefeuille Zuri, vos clients paient par Mobile Money sans que vous ayez à ouvrir un compte chez un prestataire. Votre argent s’accumule ici et vous demandez un retrait vers votre numéro quand vous voulez.</p>
            <p className="text-sm text-muted">Le portefeuille s’ouvre sur demande. Écrivez-nous pour l’activer sur votre boutique.</p>
            <ContactLink storeName={store?.name ?? ''} />
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Disponible" value={money(d.available, cur)} hint={d.available < d.minWithdrawal ? `Retrait possible dès ${money(d.minWithdrawal, cur)}` : 'Retirable maintenant'} strong />
            <Stat label="En attente" value={money(d.pending, cur)} hint={`Disponible ${d.holdDays} jour${d.holdDays > 1 ? 's' : ''} après chaque vente`} icon={<Clock className="size-3.5" />} />
            <Stat label="Total gagné" value={money(d.earned, cur)} hint={`Après commission de ${d.commissionPct} %`} />
            <Stat label="Retiré" value={money(d.withdrawn, cur)} hint="Versé ou en cours" />
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-[13px] text-muted">
            <Info className="mt-0.5 size-4 shrink-0" />
            Chaque vente payée en ligne arrive ici, moins la commission Zuri de {d.commissionPct} % (selon votre formule). Elle devient retirable après {d.holdDays} jour{d.holdDays > 1 ? 's' : ''}, le temps de couvrir un éventuel remboursement. Un retrait est vérifié puis envoyé sur votre Mobile Money.
          </p>

          <WithdrawalsCard list={d.withdrawals} storeId={storeId} />
          <Card collapsible title="Mouvements" summary={`${d.entries.length} mouvement${d.entries.length > 1 ? 's' : ''}`} description="Ventes, commissions, remboursements et retraits.">
            {d.entries.length ? (
              <ul className="-my-2 divide-y divide-line">
                {d.entries.map((e) => {
                  const later = Date.parse(e.availableAt) > Date.now()
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {ENTRY_LABEL[e.type]}
                          {e.orderId && e.orderNumber && (
                            <Link to={`/stores/${storeId}/orders/${e.orderId}`} className="ml-1.5 font-normal text-accent hover:underline">
                              {e.orderNumber}
                            </Link>
                          )}
                        </p>
                        <p className="truncate text-[12.5px] text-muted">
                          {relative(e.createdAt)}
                          {e.note && e.type !== 'sale' ? ` · ${e.note}` : ''}
                          {later && e.type === 'sale' ? ` · disponible ${relative(e.availableAt)}` : ''}
                        </p>
                      </div>
                      <span className={cx('tabular shrink-0 font-semibold', Number(e.amount) < 0 ? 'text-muted' : 'text-emerald-600 dark:text-emerald-400')}>
                        {Number(e.amount) > 0 ? '+' : ''}
                        {money(Number(e.amount), e.currency)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">Pas encore de vente encaissée. Elles apparaîtront ici dès le premier paiement en ligne.</p>
            )}
          </Card>
        </div>
      )}
      {asking && d?.enabled && <WithdrawDialog data={d} storeId={storeId} country={({ XAF: 'CM', GNF: 'GN', CDF: 'CD' } as Record<string, string>)[cur] ?? 'BJ'} onClose={() => setAsking(false)} />}
    </>
  )
}

/** Demande d'activation : WhatsApp de l'équipe Zuri (message prérempli), sinon email. */
function ContactLink({ storeName }: { storeName: string }) {
  const { data } = useQuery({ queryKey: ['platform-contact'], queryFn: () => api.get<{ email: string; whatsapp: string | null }>('/v1/platform/contact'), staleTime: 3600_000 })
  const msg = `Bonjour, je souhaite activer le portefeuille Zuri sur ma boutique « ${storeName} ».`
  const href = data?.whatsapp ? `https://wa.me/${data.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}` : data ? `mailto:${data.email}?subject=${encodeURIComponent('Activer le portefeuille')}&body=${encodeURIComponent(msg)}` : undefined
  return (
    <Button variant="primary" disabled={!href} onClick={() => href && window.open(href, '_blank', 'noopener')}>
      Demander l’activation
    </Button>
  )
}

function Stat({ label, value, hint, strong, icon }: { label: string; value: string; hint?: string; strong?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={cx('rounded-xl border p-4', strong ? 'border-accent/40 bg-accent/5' : 'border-line bg-surface')}>
      <p className="flex items-center gap-1.5 text-[13px] text-muted">
        {icon}
        {label}
      </p>
      <p className={cx('tabular mt-1 font-semibold tracking-tight', strong ? 'text-2xl' : 'text-xl')}>{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

function WithdrawalsCard({ list, storeId }: { list: Withdrawal[]; storeId: string }) {
  const qc = useQueryClient()
  const toast = useToast()
  const cancel = useMutation({
    mutationFn: (id: number) => api.post(`/stores/${storeId}/wallet/withdrawals/${id}/cancel`, {}),
    onSuccess: () => {
      toast.success('Retrait annulé : le montant est revenu dans votre portefeuille')
      void qc.invalidateQueries({ queryKey: ['store', storeId, 'wallet'] })
    },
    onError: (e) => toast.error(e),
  })
  return (
    <Card collapsible title="Retraits" summary={list[0] ? `Dernier : ${money(Number(list[0].amount), list[0].currency)} · ${W_STATUS[list[0].status].label}` : 'Aucun retrait'}>
      {list.length ? (
        <ul className="-my-2 divide-y divide-line">
          {list.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="tabular font-semibold">{money(Number(w.amount), w.currency)}</p>
                <p className="text-[12.5px] text-muted">
                  {w.network} {w.phone} · {relative(w.createdAt)}
                  {w.reference ? ` · réf. ${w.reference}` : ''}
                  {w.reason ? ` · ${w.reason}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={W_STATUS[w.status].tone}>{W_STATUS[w.status].label}</Badge>
                {w.status === 'pending' && (
                  <Button size="sm" variant="ghost" loading={cancel.isPending} onClick={() => window.confirm('Annuler cette demande de retrait ?') && cancel.mutate(w.id)}>
                    <X className="size-3.5" /> Annuler
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Aucun retrait pour l’instant.</p>
      )}
    </Card>
  )
}

function WithdrawDialog({ data, storeId, country, onClose }: { data: Extract<WalletData, { enabled: true }>; storeId: string; country: string; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const prev = data.payoutTo
  const [c, setC] = useState(prev?.country ?? country)
  const nets = NETWORKS[c] ?? []
  const [network, setNetwork] = useState(prev?.network ?? nets[0] ?? '')
  const [phone, setPhone] = useState(prev?.phone ?? '')
  const [name, setName] = useState(prev?.name ?? '')
  const [amount, setAmount] = useState(String(Math.floor(data.available)))
  const n = Number(amount.replace(/\s/g, ''))
  const tooLow = n < data.minWithdrawal
  const tooHigh = n > data.available
  const send = useMutation({
    mutationFn: () => api.post(`/stores/${storeId}/wallet/withdrawals`, { amount: n, phone, network, country: c, holderName: name || undefined }),
    onSuccess: () => {
      toast.success('Demande envoyée : vous serez prévenu dès que l’argent est envoyé')
      void qc.invalidateQueries({ queryKey: ['store', storeId, 'wallet'] })
      onClose()
    },
    onError: (e) => toast.error(e),
  })
  return (
    <Dialog
      open
      onClose={onClose}
      title="Demander un retrait"
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={send.isPending} disabled={!n || tooLow || tooHigh || phone.replace(/\D/g, '').length < 8 || !network} onClick={() => send.mutate()}>
            Demander {n ? money(n, data.currency) : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="Montant"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
          suffix={data.currency === 'XOF' || data.currency === 'XAF' ? 'FCFA' : data.currency}
          error={n && tooHigh ? `Disponible : ${money(data.available, data.currency)}` : n && tooLow ? `Minimum : ${money(data.minWithdrawal, data.currency)}` : undefined}
          hint={
            <button type="button" className="font-medium text-accent hover:underline" onClick={() => setAmount(String(Math.floor(data.available)))}>
              Tout retirer ({money(data.available, data.currency)})
            </button>
          }
        />
        <Select
          label="Pays"
          value={c}
          onChange={(e) => {
            setC(e.target.value)
            setNetwork(NETWORKS[e.target.value]?.[0] ?? '')
          }}
          options={Object.keys(NETWORKS).map((k) => ({ value: k, label: COUNTRY_NAME[k] ?? k }))}
        />
        <Select label="Réseau Mobile Money" value={network} onChange={(e) => setNetwork(e.target.value)} options={nets.map((x) => ({ value: x, label: x }))} />
        <Input label="Numéro qui reçoit l’argent" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+229 61 00 00 00" />
        <Input label="Nom du titulaire" optional value={name} onChange={(e) => setName(e.target.value)} maxLength={120} hint="Le nom enregistré sur ce compte Mobile Money : il aide à vérifier le bon destinataire." />
        <p className="text-[12px] text-muted">Le montant est mis de côté tout de suite. Si le retrait ne peut pas être versé, il revient dans votre portefeuille.</p>
      </div>
    </Dialog>
  )
}
