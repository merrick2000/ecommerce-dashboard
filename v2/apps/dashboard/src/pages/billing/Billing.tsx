import { PLANS, priceFor, type EffectivePlan, type PlanDef } from '@zuri/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Crown, Loader2, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, cx, ErrorState, Input, Segmented, Select, Skeleton } from '@/components/ui'
import { meKey, useMe } from '@/hooks/auth'
import { api } from '@/lib/api'
import { COUNTRIES } from '@/lib/labels'
import { LAST_STORE_KEY, readLocal } from '@/lib/storage'
import { Logo } from '@/components/layout/Guards'

interface BillingInfo {
  plan: EffectivePlan
  plans: PlanDef[]
  usage: { stores: number }
  canPay: boolean
  networks: { country: string; networks: string[] }[]
  payments: { id: number; plan: string; months: number; amount: number; status: string; provider: string; createdAt: string; paidAt: string | null }[]
}

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} F`
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '')
const NETWORK: Record<string, string> = { mtn: 'MTN MoMo', moov: 'Moov Money', orange: 'Orange Money', wave: 'Wave', celtiis: 'Celtiis Cash', tmoney: 'Mixx by Yas (T-Money)', free: 'Free Money', airtel: 'Airtel Money', airteltigo: 'AirtelTigo', telecel: 'Telecel Cash', africell: 'Afrimoney', mpesa: 'M-Pesa' }
const lim = (v: number | null, unit: string) => (v === null ? `${unit.charAt(0).toUpperCase()}${unit.slice(1)} illimités` : `${v} ${unit}`)

export function planSummary(p: EffectivePlan) {
  const name = PLANS[p.plan].name
  switch (p.reason) {
    case 'launch':
      return { title: 'Offre de lancement : tout est gratuit et illimité', text: `Jusqu’au ${date(p.until)}. Ensuite, ton premier mois en Pro est offert.` }
    case 'early':
      return { title: 'Ton mois offert en Pro', text: `Formule Pro offerte jusqu’au ${date(p.until)}. Choisis ta formule avant pour ne pas être interrompu.` }
    case 'subscription':
      return { title: `Formule ${name}`, text: `Active jusqu’au ${date(p.until)}.` }
    case 'free':
      return { title: 'Offre gratuite (limitée)', text: `Disponible jusqu’au ${date(p.until)}. Passe à une formule payante pour vendre sans limite.` }
    case 'expired':
      return { title: 'Aucune formule active', text: 'L’offre gratuite est terminée. Choisis une formule pour continuer à ajouter des produits.' }
  }
}

function PlanCard({ plan, current, months, onPick, canPay }: { plan: PlanDef; current: boolean; months: 1 | 12; onPick: () => void; canPay: boolean }) {
  const price = priceFor(plan.id, months)
  return (
    <div className={cx('flex flex-col rounded-xl border bg-surface p-5', plan.highlight ? 'border-accent ring-1 ring-accent' : 'border-line')}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">{plan.name}</p>
        {plan.highlight && <Badge tone="amber">Le plus choisi</Badge>}
        {current && <Badge tone="green">Actuelle</Badge>}
      </div>
      <p className="mt-3">
        <span className="tabular text-3xl font-bold">{plan.priceXof ? fcfa(price) : '0 F'}</span>
        <span className="text-sm text-muted"> {plan.priceXof ? (months === 12 ? '/ an' : '/ mois') : ''}</span>
      </p>
      {months === 12 && plan.priceXof > 0 && <p className="text-[12px] font-medium text-emerald-600">2 mois offerts, soit {fcfa(Math.round(price / 12))} par mois</p>}
      <ul className="mt-4 flex-1 space-y-2 text-sm">
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> {lim(plan.limits.stores, 'boutiques').replace('1 boutiques', '1 boutique')}</li>
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> {lim(plan.limits.products, 'produits')}</li>
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> {plan.limits.ordersPerMonth === null ? 'Commandes illimitées' : `${new Intl.NumberFormat('fr-FR').format(plan.limits.ordersPerMonth)} commandes par mois`}</li>
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> {plan.limits.members === null ? 'Équipe illimitée' : plan.limits.members === 1 ? 'Toi seul' : `${plan.limits.members} membres d’équipe`}</li>
        <li className={cx('flex gap-2', !plan.features.onlinePayments && 'text-muted line-through')}><Check className="size-4 shrink-0 text-emerald-600" /> Mobile Money sur ta boutique</li>
        <li className={cx('flex gap-2', !plan.features.aiImport && 'text-muted line-through')}><Check className="size-4 shrink-0 text-emerald-600" /> Import de produits avec l’IA</li>
        <li className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-600" /> Paiement à la livraison, pixel et API Conversions, 0 % de commission</li>
      </ul>
      {plan.priceXof > 0 && (
        <Button className="mt-5" variant={plan.highlight ? 'primary' : 'secondary'} onClick={onPick} disabled={!canPay}>
          {canPay ? `Choisir ${plan.name}` : 'Bientôt disponible'}
        </Button>
      )}
    </div>
  )
}

function Checkout({ info, plan, months, onClose }: { info: BillingInfo; plan: PlanDef; months: 1 | 12; onClose: () => void }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [country, setCountry] = useState(info.networks[0]?.country ?? '')
  const nets = info.networks.find((n) => n.country === country)?.networks ?? []
  const [network, setNetwork] = useState(nets[0] ?? '')
  const [phone, setPhone] = useState('')
  const [pending, setPending] = useState<{ id: number; message: string } | null>(null)
  useEffect(() => setNetwork(nets[0] ?? ''), [country]) // eslint-disable-line react-hooks/exhaustive-deps
  const start = useMutation({ mutationFn: () => api.post<{ id: number; status: string; message?: string; redirectUrl?: string }>('/billing/checkout', { plan: plan.id, months, phone, country, network }) })
  const poll = useQuery({
    queryKey: ['billing-payment', pending?.id],
    queryFn: () => api.get<{ status: string }>(`/billing/payments/${pending!.id}`),
    enabled: !!pending,
    refetchInterval: (q) => (q.state.data?.status === 'pending' || !q.state.data ? 3000 : false),
  })
  useEffect(() => {
    if (poll.data?.status === 'paid') {
      toast.success(`Paiement reçu : formule ${plan.name} activée`)
      void qc.invalidateQueries({ queryKey: meKey })
      void qc.invalidateQueries({ queryKey: ['billing'] })
      onClose()
    } else if (poll.data?.status === 'failed') {
      toast.error('Le paiement a échoué ou a été refusé. Réessaie.')
      setPending(null)
    }
  }, [poll.data?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Formule ${plan.name} · ${fcfa(priceFor(plan.id, months))}`}
      size="sm"
      footer={
        !pending && (
          <>
            <Button onClick={onClose}>Annuler</Button>
            <Button
              variant="primary"
              disabled={!country || !network || phone.trim().length < 6}
              loading={start.isPending}
              onClick={() =>
                start.mutate(undefined, {
                  onSuccess: (r) => {
                    if (r.redirectUrl) window.location.href = r.redirectUrl
                    else setPending({ id: r.id, message: r.message ?? 'Valide le paiement sur ton téléphone' })
                  },
                  onError: (e) => toast.error(e),
                })
              }
            >
              Payer
            </Button>
          </>
        )
      }
    >
      {pending ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Smartphone className="size-10 text-accent" />
          <p className="font-medium">{pending.message}</p>
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> En attente de la confirmation de l’opérateur…
          </p>
        </div>
      ) : info.networks.length === 0 ? (
        <p className="text-sm text-muted">Le paiement en ligne des abonnements n’est pas encore configuré.</p>
      ) : (
        <div className="space-y-4">
          <Select label="Pays" value={country} onChange={(e) => setCountry(e.target.value)} options={info.networks.map((n) => ({ value: n.country, label: COUNTRIES.find((c) => c.code === n.country)?.name ?? n.country }))} />
          <Select label="Réseau" value={network} onChange={(e) => setNetwork(e.target.value)} options={nets.map((n) => ({ value: n, label: NETWORK[n] ?? n }))} />
          <Input label="Numéro Mobile Money" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01 97 00 00 00" />
          <p className="text-[12px] text-muted">Tu recevras une demande de validation sur ton téléphone. Aucune carte bancaire nécessaire.</p>
        </div>
      )}
    </Dialog>
  )
}

export default function Billing() {
  const { data: me } = useMe()
  const [months, setMonths] = useState<1 | 12>(1)
  const [picked, setPicked] = useState<PlanDef | null>(null)
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['billing'], queryFn: () => api.get<BillingInfo>('/billing') })
  const last = readLocal(LAST_STORE_KEY) ?? me?.stores[0]?.id
  const sum = data ? planSummary(data.plan) : null

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
        <Logo />
        {last && (
          <Link to={`/stores/${last}`} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
            <ArrowLeft className="size-4" /> Retour à ma boutique
          </Link>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="mt-1 text-muted">Une seule formule couvre toutes tes boutiques. Paiement par Mobile Money, sans carte bancaire.</p>
        {error && !data ? (
          <div className="mt-6">
            <ErrorState error={error} onRetry={() => void refetch()} />
          </div>
        ) : isPending ? (
          <Skeleton className="mt-6 h-96 rounded-xl" />
        ) : (
          <>
            <Card className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Crown className="size-6 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{sum?.title}</p>
                  <p className="text-sm text-muted">{sum?.text}</p>
                </div>
              </div>
            </Card>
            <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Les formules</h2>
              <Segmented label="Durée" value={String(months)} onChange={(v) => setMonths(Number(v) as 1 | 12)} options={[{ value: '1', label: 'Mensuel' }, { value: '12', label: 'Annuel (2 mois offerts)' }]} />
            </div>
            {!data.canPay && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Le paiement des formules ouvre très bientôt. Tu seras prévenu par email avant la fin de ton offre.</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.plans.map((p) => (
                <PlanCard key={p.id} plan={p} months={months} current={data.plan.reason === 'subscription' && data.plan.plan === p.id} canPay={data.canPay} onPick={() => setPicked(p)} />
              ))}
            </div>
            {data.payments.length > 0 && (
              <Card title="Historique des paiements" className="mt-8">
                <ul className="divide-y divide-line text-sm">
                  {data.payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <span>
                        {PLANS[p.plan as keyof typeof PLANS]?.name ?? p.plan} · {p.months === 12 ? '1 an' : '1 mois'}
                      </span>
                      <span className="tabular">{fcfa(p.amount)}</span>
                      <span className="text-muted">{date(p.paidAt ?? p.createdAt)}</span>
                      <Badge tone={p.status === 'paid' ? 'green' : p.status === 'failed' ? 'red' : 'neutral'}>{p.status === 'paid' ? 'Payé' : p.status === 'failed' ? 'Échoué' : 'En attente'}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </main>
      {picked && data && <Checkout info={data} plan={picked} months={months} onClose={() => setPicked(null)} />}
    </div>
  )
}
