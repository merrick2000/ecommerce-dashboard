/**
 * Boutique encore vide : « Qu'est-ce qui vous empêche d'ajouter votre premier produit ? ».
 * Un clic suffit ; la réponse aide le super admin à comprendre et à aider. Aide adaptée affichée ensuite.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { MessageCircleQuestion, X } from 'lucide-react'
import { useState } from 'react'
import { Button, Textarea } from '@/components/ui'
import { useCan, useStoreId } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { api } from '@/lib/api'
import { readLocal, writeLocal } from '@/lib/storage'

const CHOICES = [
  ['no_photos', 'Je n’ai pas encore de photos'],
  ['what_to_sell', 'Je ne sais pas encore quoi vendre'],
  ['too_complex', 'Je ne sais pas comment faire'],
  ['payment_delivery', 'Paiement ou livraison : pas clair'],
  ['just_looking', 'Je voulais juste découvrir'],
  ['other', 'Autre chose'],
] as const

const HELP: Record<string, string> = {
  no_photos: 'Des photos prises au téléphone, à la lumière du jour, suffisent. Commencez avec une seule photo, vous en ajouterez plus tard.',
  what_to_sell: 'Commencez par ce que vous vendez déjà sur WhatsApp ou Facebook, ou par un produit que vos clients demandent souvent.',
  too_complex: 'Écrivez-nous depuis la page Contact ou sur WhatsApp : on ajoute votre premier produit avec vous, étape par étape.',
  payment_delivery: 'Commencez par le paiement à la livraison : le client paie le livreur. Vous ajouterez ensuite vos villes et vos frais.',
  just_looking: 'Aucun souci : votre boutique reste gratuite et prête quand vous voulez.',
  other: 'Merci, on lit chaque réponse.',
}

export function BlockerPrompt() {
  const storeId = useStoreId()
  const canEdit = useCan('products.edit')
  const hideKey = `blocker-hidden:${storeId}`
  const [hidden, setHidden] = useState(() => readLocal(hideKey) === '1')
  const products = useProducts(canEdit && !hidden)
  const last = useQuery({ queryKey: ['seller', 'blocker'], queryFn: () => api.get<{ answer: string } | null>('/seller/blocker'), enabled: canEdit && !hidden && products.data?.length === 0, staleTime: 10 * 60_000 })
  const [picked, setPicked] = useState<string | null>(null)
  const [detail, setDetail] = useState('')
  const [done, setDone] = useState(false)
  const send = useMutation({ mutationFn: (v: { answer: string; detail?: string }) => api.post('/seller/blocker', v) })
  if (!canEdit || hidden || products.data?.length !== 0 || last.isPending || (last.data && !picked)) return null
  const close = () => {
    writeLocal(hideKey, '1')
    setHidden(true)
  }
  return (
    <div className="mb-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          {!picked ? (
            <>
              <p className="text-sm font-semibold">Qu’est-ce qui vous empêche d’ajouter votre premier produit ?</p>
              <p className="mt-0.5 text-[13px] text-muted">Un clic suffit. On lit chaque réponse pour vous aider.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CHOICES.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPicked(id)
                      if (id !== 'other') send.mutate({ answer: id })
                    }}
                    className="rounded-full border border-line px-3 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-fg"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Merci, c’est noté.</p>
              <p className="mt-0.5 text-sm text-muted">{HELP[picked]}</p>
              {!done && (
                <div className="mt-3 space-y-2">
                  <Textarea rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={1000} placeholder="Dites-nous en plus (facultatif)" aria-label="Précisez" />
                  <Button
                    size="sm"
                    disabled={picked === 'other' && !detail.trim()}
                    loading={send.isPending}
                    onClick={() => send.mutate({ answer: picked, detail: detail.trim() || undefined }, { onSuccess: () => setDone(true) })}
                  >
                    Envoyer
                  </Button>
                </div>
              )}
              {done && <p className="mt-2 text-[13px] text-emerald-700 dark:text-emerald-400">Message envoyé. On vous répond très vite.</p>}
            </>
          )}
        </div>
        <button type="button" onClick={close} className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Fermer" title="Fermer">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
