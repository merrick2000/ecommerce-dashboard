/**
 * Tableau de bord d'une boutique digitale : le paiement est le seul vrai goulot.
 * Taux de paiement, ventes, panier moyen, paiements refusés (et pourquoi), paniers abandonnés et récupérés,
 * opérateurs Mobile Money, accès non téléchargés. Chaque carte mène à la liste correspondante.
 */
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Banknote, CreditCard, Download, RotateCcw, ShoppingCart, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, cx, Skeleton } from '@/components/ui'
import { useStoreId } from '@/hooks/auth'
import { api } from '@/lib/api'
import { money, num, percent } from '@/lib/format'

interface DigitalStats {
  currency: string
  revenueVisible: boolean
  payments: { created: number; paid: number; pending: number; failed: number; refunded: number; paymentRate: number | null; revenue: number | null; averageOrder: number | null }
  failureReasons: { reason: string; count: number }[]
  operators: { operator: string; count: number; revenue: number | null }[]
  carts: { open: number; recovered: number; recoveredRevenue: number | null; recoveryRate: number | null }
  downloads: { total: number; paidNeverDownloaded: number }
}

const REASONS: Record<string, string> = {
  customer_declined: 'Refusé par le client',
  customer_timeout: 'Pas validé à temps',
  customer_unreachable: 'Téléphone injoignable',
  insufficient_balance: 'Solde insuffisant',
  payer_limit_reached: 'Plafond atteint',
  invalid_phone: 'Numéro invalide',
  not_on_operator: 'Mauvais opérateur',
  wallet_locked: 'Portefeuille bloqué',
  mno_unavailable: 'Opérateur indisponible',
  cancelled: 'Annulé',
}

function Tile({ label, value, hint, icon, to, tone }: { label: string; value: ReactNode; hint?: ReactNode; icon: ReactNode; to?: string; tone?: 'red' | 'amber' }) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted">{label}</p>
        <span className={cx(tone === 'red' ? 'text-red-500' : tone === 'amber' ? 'text-amber-500' : 'text-subtle')}>{icon}</span>
      </div>
      <p className="tabular mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
      <p className="mt-1 min-h-4 text-[12px] text-subtle">{hint}</p>
    </>
  )
  const cls = 'block rounded-xl border border-line bg-surface p-4 transition-colors'
  return to ? (
    <Link to={to} className={cx(cls, 'hover:border-line-strong')}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

/** Entonnoir commandes créées → payées, avec la part en attente et refusée. */
function PaymentFunnel({ s, base }: { s: DigitalStats; base: string }) {
  const p = s.payments
  const total = Math.max(p.created, 1)
  const seg = [
    { k: 'paid', label: 'Payées', n: p.paid, cls: 'bg-emerald-500' },
    { k: 'pending', label: 'En attente', n: p.pending, cls: 'bg-amber-400' },
    { k: 'failed', label: 'Refusées', n: p.failed, cls: 'bg-red-500' },
    { k: 'refunded', label: 'Remboursées', n: p.refunded, cls: 'bg-neutral-400' },
  ]
  return (
    <Card title="Paiements">
      <p className="text-sm text-muted">
        Sur <strong className="text-fg">{num(p.created)}</strong> commande{p.created > 1 ? 's' : ''} créée{p.created > 1 ? 's' : ''}, <strong className="text-fg">{num(p.paid)}</strong> {p.paid > 1 ? 'ont' : 'a'} été payée{p.paid > 1 ? 's' : ''}.
      </p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-2">
        {seg.map((x) => x.n > 0 && <div key={x.k} className={x.cls} style={{ width: `${(x.n / total) * 100}%` }} />)}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {seg.map((x) => (
          <li key={x.k}>
            <Link to={`${base}/orders?etat=${x.k}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
              <span className={cx('size-2.5 rounded-full', x.cls)} />
              <span className="text-muted">{x.label}</span>
              <span className="tabular ml-auto font-medium">{num(x.n)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function DigitalOverview({ from, to, base }: { from: string; to: string; base: string }) {
  const storeId = useStoreId()
  const { data: s } = useQuery({ queryKey: ['store', storeId, 'stats', 'digital', from, to], queryFn: () => api.get<DigitalStats>(`/stores/${storeId}/stats/digital`, { from, to }) })
  if (!s)
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  const p = s.payments
  const rv = s.revenueVisible
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {rv && <Tile label="Ventes encaissées" value={money(p.revenue, s.currency)} icon={<Banknote className="size-4" />} hint={`${num(p.paid)} vente${p.paid > 1 ? 's' : ''}`} to={`${base}/orders?etat=paid`} />}
        <Tile label="Taux de paiement" value={percent(p.paymentRate)} icon={<CreditCard className="size-4" />} hint="commandes créées puis payées" />
        {rv && <Tile label="Panier moyen" value={p.averageOrder != null ? money(p.averageOrder, s.currency) : '-'} icon={<Wallet className="size-4" />} hint="par vente payée" />}
        <Tile label="Paiements refusés" value={num(p.failed)} icon={<AlertTriangle className="size-4" />} tone={p.failed ? 'red' : undefined} hint={p.failed ? 'à relancer' : 'aucun'} to={`${base}/orders?etat=failed`} />
        <Tile label="En attente de paiement" value={num(p.pending)} icon={<CreditCard className="size-4" />} tone={p.pending ? 'amber' : undefined} hint="commencé sans finir" to={`${base}/orders?etat=pending`} />
        <Tile label="Paniers abandonnés" value={num(s.carts.open)} icon={<ShoppingCart className="size-4" />} hint="coordonnées laissées sans commander" to={`${base}/orders?etat=carts`} />
        <Tile
          label="Paniers récupérés"
          value={num(s.carts.recovered)}
          icon={<RotateCcw className="size-4" />}
          hint={[s.carts.recoveryRate != null ? `${percent(s.carts.recoveryRate)} récupérés` : null, rv && s.carts.recoveredRevenue ? money(s.carts.recoveredRevenue, s.currency) : null].filter(Boolean).join(' · ') || 'grâce aux relances'}
        />
        <Tile label="Téléchargements" value={num(s.downloads.total)} icon={<Download className="size-4" />} tone={s.downloads.paidNeverDownloaded ? 'amber' : undefined} hint={s.downloads.paidNeverDownloaded ? `${num(s.downloads.paidNeverDownloaded)} client${s.downloads.paidNeverDownloaded > 1 ? 's' : ''} pas encore téléchargé` : 'tous les clients ont téléchargé'} to={`${base}/orders?etat=paid`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PaymentFunnel s={s} base={base} />
        <Card title="Pourquoi les paiements échouent">
          {s.failureReasons.length ? (
            <ul className="space-y-2">
              {s.failureReasons.map((r) => (
                <li key={r.reason} className="flex items-center justify-between gap-3 text-sm">
                  <span>{REASONS[r.reason] ?? r.reason}</span>
                  <span className="tabular font-medium">{num(r.count)}</span>
                </li>
              ))}
              <li className="pt-1 text-[12px] text-subtle">Astuce : un client au solde insuffisant ou qui n’a pas validé à temps paie souvent après une relance WhatsApp.</li>
            </ul>
          ) : (
            <p className="text-sm text-muted">Aucun paiement refusé sur la période.</p>
          )}
        </Card>
        {s.operators.length > 0 && (
          <Card title="Moyens de paiement utilisés">
            <ul className="space-y-2">
              {s.operators.map((o) => (
                <li key={o.operator} className="flex items-center justify-between gap-3 text-sm">
                  <span className="uppercase">{o.operator}</span>
                  <span className="tabular text-muted">
                    {num(o.count)} vente{o.count > 1 ? 's' : ''}
                    {rv && o.revenue != null ? ` · ${money(o.revenue, s.currency)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  )
}
