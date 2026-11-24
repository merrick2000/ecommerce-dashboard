/**
 * « Lancez votre boutique » : les étapes jusqu'à la première vente, cochées d'après ce que le vendeur a vraiment fait.
 * Disparaît une fois tout terminé (ou masquée par le vendeur sur cet appareil).
 */
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight, Copy, MessageCircle, Rocket, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { buttonClass, cx } from '@/components/ui'
import { useCan, useStoreId } from '@/hooks/auth'
import { api } from '@/lib/api'
import { readLocal, writeLocal } from '@/lib/storage'

type Step = 'store' | 'product' | 'delivery' | 'payment' | 'notifications' | 'share' | 'order'
interface Launch {
  steps: { key: Step; done: boolean }[]
  done: boolean
  kind: 'physical' | 'digital'
  storeUrl: string
  productUrl: string | null
}

export function LaunchChecklist() {
  const storeId = useStoreId()
  const toast = useToast()
  const canEdit = useCan('products.edit')
  const hideKey = `launch-hidden:${storeId}`
  const [hidden, setHidden] = useState(() => readLocal(hideKey) === '1')
  const { data } = useQuery({ queryKey: ['store', storeId, 'launch'], queryFn: () => api.get<Launch>(`/stores/${storeId}/launch`), enabled: canEdit && !hidden, staleTime: 60_000 })
  if (!data || data.done || hidden) return null

  const base = `/stores/${storeId}`
  const link = data.productUrl ?? data.storeUrl
  const copy = async () => {
    await navigator.clipboard?.writeText(link)
    toast.success('Lien copié')
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique : ${link}`)}`
  const doneCount = data.steps.filter((s) => s.done).length
  const pct = Math.round((doneCount / data.steps.length) * 100)
  const next = data.steps.find((s) => !s.done)?.key

  const STEPS: Record<Step, { title: string; text: string; action?: ReactNode }> = {
    store: { title: 'Créer la boutique', text: 'C’est fait, votre boutique est en ligne.' },
    product: {
      title: data.kind === 'digital' ? 'Ajouter votre produit et son fichier' : 'Ajouter votre premier produit',
      text: data.kind === 'digital' ? 'Le fichier ou le lien est envoyé tout seul au client après paiement.' : 'Photos, prix et description : votre page de vente est prête.',
      action: (
        <Link to={`${base}/products/new`} className={buttonClass('primary', 'sm')}>
          Ajouter un produit
        </Link>
      ),
    },
    delivery: {
      title: 'Ajouter vos zones de livraison',
      text: 'Villes livrées, frais et délai : le client voit le prix exact avant de commander.',
      action: (
        <Link to={`${base}/zones`} className={buttonClass('primary', 'sm')}>
          Ajouter une zone
        </Link>
      ),
    },
    payment: {
      title: 'Brancher le paiement Mobile Money',
      text: 'L’argent arrive directement sur votre compte, retrait le jour même ou sous 24 h.',
      action: (
        <Link to={`${base}/settings?tab=payments`} className={buttonClass('primary', 'sm')}>
          Connecter un paiement
        </Link>
      ),
    },
    notifications: {
      title: 'Recevoir vos commandes sur le téléphone',
      text: 'Une alerte à chaque commande, pour appeler le client tout de suite.',
      action: (
        <Link to={`${base}/notifications`} className={buttonClass('primary', 'sm')}>
          Activer les alertes
        </Link>
      ),
    },
    share: {
      title: 'Partager votre lien',
      text: 'En statut WhatsApp, dans vos groupes, votre bio ou vos pubs Facebook et TikTok.',
      action: (
        <span className="flex flex-wrap gap-2">
          <a href={wa} target="_blank" rel="noopener" className={buttonClass('primary', 'sm')}>
            <MessageCircle className="size-3.5" /> WhatsApp
          </a>
          <button type="button" onClick={() => void copy()} className={buttonClass('secondary', 'sm')}>
            <Copy className="size-3.5" /> Copier le lien
          </button>
        </span>
      ),
    },
    order: { title: 'Recevoir votre première commande', text: 'Elle apparaîtra ici dès qu’un client commande. Vous serez prévenu sur votre téléphone.' },
  }

  return (
    <section className="mb-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <Rocket className="size-4 text-accent" /> Lancez votre boutique
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {doneCount} étape{doneCount > 1 ? 's' : ''} sur {data.steps.length} : encore un peu et vous recevez vos premières commandes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            writeLocal(hideKey, '1')
            setHidden(true)
          }}
          className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Masquer"
          title="Masquer"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 h-2 rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progression">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-4 space-y-2">
        {data.steps.map((s) => {
          const info = STEPS[s.key]
          const isNext = s.key === next
          return (
            <li key={s.key} className={cx('flex gap-3 rounded-lg p-3', isNext ? 'border border-accent/40 bg-accent/5' : 'border border-transparent')}>
              <span className={cx('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', s.done ? 'bg-emerald-500 text-white' : 'border border-line-strong text-muted')}>
                {s.done ? <Check className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx('text-sm font-medium', s.done && 'text-muted line-through')}>{info.title}</p>
                {!s.done && <p className="mt-0.5 text-[13px] text-muted">{info.text}</p>}
                {!s.done && isNext && info.action && <div className="mt-2">{info.action}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
