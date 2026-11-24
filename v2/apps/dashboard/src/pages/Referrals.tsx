/**
 * Parrainage : le lien personnel du vendeur, comment ça marche, ses filleuls et les mois gagnés.
 * Un mois Pro offert au parrain et au filleul dès la première vente du filleul.
 */
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Copy, Gift, MessageCircle, Share2, Store, UserPlus, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '@/components/layout/Guards'
import { useToast } from '@/components/Toast'
import { Badge, Button, buttonClass, Card, ErrorState, Skeleton } from '@/components/ui'
import { useMe } from '@/hooks/auth'
import { api } from '@/lib/api'
import { LAST_STORE_KEY, readLocal } from '@/lib/storage'

interface ReferralData {
  code: string
  link: string
  reward: { plan: string; months: number; cap: number }
  stats: { signed: number; sold: number; monthsEarned: number }
  referrals: { name: string; createdAt: string; stage: 'signed' | 'store' | 'sold' }[]
}

const STAGE = {
  signed: { label: 'Inscrit', tone: 'neutral' as const },
  store: { label: 'Boutique créée', tone: 'amber' as const },
  sold: { label: 'A vendu : mois gagné', tone: 'green' as const },
}

export default function Referrals() {
  const { data: me } = useMe()
  const toast = useToast()
  const { data, error, isPending, refetch } = useQuery({ queryKey: ['referrals'], queryFn: () => api.get<ReferralData>('/referrals') })
  const last = readLocal(LAST_STORE_KEY) ?? me?.stores[0]?.id
  const message = data ? `Je vends en ligne avec Zuri : paiement à la livraison, Mobile Money, commandes sur le téléphone, sans commission. Crée ta boutique gratuitement avec mon lien : ${data.link}` : ''
  const copy = async (text: string, msg: string) => {
    await navigator.clipboard?.writeText(text)
    toast.success(msg)
  }
  const share = async () => {
    if (navigator.share) await navigator.share({ title: 'Zuri', text: message }).catch(() => undefined)
    else await copy(message, 'Message copié')
  }

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
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Gift className="size-6 text-accent" /> Parrainage
          </h1>
          <p className="mt-1 text-muted">Invitez d’autres vendeurs : à leur première vente, vous gagnez chacun un mois de Zuri Pro offert.</p>
        </div>
        {error && !data ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : isPending ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <>
            <Card title="Votre lien">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <code className="flex-1 truncate rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm">{data.link}</code>
                  <Button variant="secondary" onClick={() => void copy(data.link, 'Lien copié')}>
                    <Copy className="size-4" /> Copier
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className={buttonClass('primary', 'md')} href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">
                    <MessageCircle className="size-4" /> Partager sur WhatsApp
                  </a>
                  <Button variant="secondary" onClick={() => void share()}>
                    <Share2 className="size-4" /> Autres applications
                  </Button>
                </div>
                <p className="text-[13px] text-muted">Votre code : <strong>{data.code}</strong>. Il reste valable 90 jours sur le téléphone de la personne, même si elle s’inscrit plus tard.</p>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: UserPlus, title: '1. Partagez votre lien', text: 'En statut WhatsApp, dans vos groupes de vendeurs, à vos amis qui vendent en ligne.' },
                { icon: Store, title: '2. Ils créent leur boutique', text: 'Gratuitement, sans carte bancaire, en 2 minutes.' },
                { icon: Wallet, title: '3. Première vente : 1 mois offert', text: `À sa première vente payée ou livrée, vous recevez tous les deux un mois Pro (jusqu’à ${data.reward.cap} mois pour vous).` },
              ].map((s) => (
                <div key={s.title} className="rounded-xl border border-line bg-surface p-4">
                  <s.icon className="size-5 text-accent" />
                  <p className="mt-2 font-semibold">{s.title}</p>
                  <p className="mt-1 text-[13px] text-muted">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['Inscrits', data.stats.signed],
                ['Ont vendu', data.stats.sold],
                ['Mois gagnés', data.stats.monthsEarned],
              ].map(([label, n]) => (
                <div key={label} className="rounded-xl border border-line bg-surface p-4 text-center">
                  <p className="tabular text-2xl font-bold">{n}</p>
                  <p className="text-[13px] text-muted">{label}</p>
                </div>
              ))}
            </div>

            <Card title={`Vos filleuls (${data.referrals.length})`}>
              {data.referrals.length ? (
                <ul className="divide-y divide-line text-sm">
                  {data.referrals.map((r, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <span>
                        <strong>{r.name || 'Vendeur'}</strong> <span className="text-muted">· inscrit le {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <Badge tone={STAGE[r.stage].tone}>{STAGE[r.stage].label}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Personne pour l’instant. Partagez votre lien : chaque vendeur qui fait sa première vente vous rapporte un mois.</p>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
