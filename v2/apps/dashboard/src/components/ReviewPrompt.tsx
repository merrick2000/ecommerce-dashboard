/**
 * « Recommanderiez-vous Zuri à un autre vendeur ? » : posé une seule fois, après les premières ventes.
 * Note de 0 à 10, puis un mot (témoignage publiable avec accord, ou ce qu'il faut améliorer).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { Button, Checkbox, cx, Input, Textarea } from '@/components/ui'
import { api } from '@/lib/api'

export function ReviewPrompt() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data } = useQuery({ queryKey: ['seller-review'], queryFn: () => api.get<{ ask: boolean }>('/reviews'), staleTime: 10 * 60_000 })
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [consent, setConsent] = useState(true)
  const [role, setRole] = useState('')
  const [done, setDone] = useState(false)
  const send = useMutation({
    mutationFn: () => api.post('/reviews', { score, comment: comment.trim() || undefined, consent: score != null && score >= 7 && consent, publishRole: role.trim() || undefined }),
    onSuccess: () => {
      setDone(true)
      void qc.invalidateQueries({ queryKey: ['seller-review'] })
    },
    onError: (e) => toast.error(e),
  })
  const dismiss = useMutation({ mutationFn: () => api.post('/reviews/dismiss'), onSuccess: () => void qc.setQueryData(['seller-review'], { ask: false }) })

  if (done)
    return (
      <div className="mb-4 rounded-xl border border-line bg-surface p-4 text-sm">
        <p className="font-semibold">Merci pour votre réponse.</p>
        <p className="mt-0.5 text-muted">{score != null && score <= 6 ? 'Nous allons vous contacter pour comprendre ce qui ne va pas et le corriger.' : 'Elle nous aide énormément à faire connaître Zuri.'}</p>
      </div>
    )
  if (!data?.ask) return null
  const happy = score != null && score >= 7
  return (
    <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Heart className="size-4 text-accent" /> Recommanderiez-vous Zuri à un autre vendeur ?
        </p>
        <button type="button" onClick={() => dismiss.mutate()} className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Plus tard" title="Plus tard">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Note de 0 à 10">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            onClick={() => setScore(n)}
            className={cx('tabular size-9 rounded-lg border text-sm font-semibold transition-colors', score === n ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-surface hover:border-accent')}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-muted sm:max-w-[33rem]">
        <span>Pas du tout</span>
        <span>Oui, sans hésiter</span>
      </div>
      {score != null && (
        <div className="mt-3 space-y-3">
          <Textarea
            label={happy ? 'En une ou deux phrases, qu’est-ce que Zuri a changé pour vous ?' : 'Qu’est-ce qui vous manque ou vous gêne ?'}
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={happy ? 'Ex. Je reçois mes commandes sur mon téléphone et mon équipe confirme tout de suite.' : 'Ex. Je n’arrive pas à configurer la livraison.'}
          />
          {happy && (
            <>
              <Input label="Ce que vous vendez et votre ville" optional value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} placeholder="Ex. Boutique de perruques, Abidjan" />
              <label className="flex cursor-pointer items-start gap-2 text-[13px]">
                <Checkbox checked={consent} onChange={setConsent} label="Accord de publication" className="mt-0.5" />
                <span>J’accepte que ce témoignage soit publié sur zurisell.store avec mon prénom et le lien de ma boutique.</span>
              </label>
            </>
          )}
          <Button variant="primary" onClick={() => send.mutate()} loading={send.isPending}>
            Envoyer
          </Button>
        </div>
      )}
    </div>
  )
}
