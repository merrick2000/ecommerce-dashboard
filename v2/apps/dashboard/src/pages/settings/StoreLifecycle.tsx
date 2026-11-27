import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PauseCircle, PlayCircle, XOctagon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, Input, Textarea } from '@/components/ui'
import { meKey, useCurrentStore } from '@/hooks/auth'
import { api } from '@/lib/api'
import type { Store } from '@/lib/types'

/** Pause, réouverture et fermeture définitive de la boutique (propriétaire uniquement). */
export function StoreLifecycle({ store }: { store: Store }) {
  const { role } = useCurrentStore()
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const [pauseOpen, setPauseOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [message, setMessage] = useState(store.pauseMessage ?? '')
  const [confirm, setConfirm] = useState('')
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: meKey })
    void qc.invalidateQueries({ queryKey: ['store', store.id] })
    void qc.invalidateQueries()
  }
  const act = useMutation({
    mutationFn: (v: { action: 'pause' | 'resume' | 'close'; body?: unknown }) => api.post(`/stores/${store.id}/${v.action}`, v.body ?? {}),
  })
  if (role !== 'owner') return null

  const paused = store.status === 'paused'
  return (
    <Card collapsible defaultOpen={false} title="Statut de la boutique" description="Mets ta boutique en pause pendant une rupture de stock ou des congés, ou ferme-la définitivement.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          État actuel : {paused ? <Badge tone="amber">En pause</Badge> : <Badge tone="green">En ligne</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          {paused ? (
            <Button variant="success" loading={act.isPending} onClick={() => act.mutate({ action: 'resume' }, { onSuccess: () => (toast.success('Boutique rouverte : les commandes reprennent'), refresh()), onError: (e) => toast.error(e) })}>
              <PlayCircle className="size-4" /> Rouvrir la boutique
            </Button>
          ) : (
            <Button onClick={() => setPauseOpen(true)}>
              <PauseCircle className="size-4" /> Mettre en pause
            </Button>
          )}
          <Button variant="danger" onClick={() => setCloseOpen(true)}>
            <XOctagon className="size-4" /> Fermer définitivement
          </Button>
        </div>
      </div>
      {paused && store.pauseMessage && <p className="mt-3 text-[13px] text-muted">Message affiché : « {store.pauseMessage} »</p>}

      <Dialog
        open={pauseOpen}
        onClose={() => setPauseOpen(false)}
        title="Mettre la boutique en pause"
        size="sm"
        footer={
          <>
            <Button onClick={() => setPauseOpen(false)}>Annuler</Button>
            <Button
              variant="primary"
              loading={act.isPending}
              onClick={() =>
                act.mutate({ action: 'pause', body: { message: message.trim() || undefined } }, { onSuccess: () => (toast.success('Boutique en pause'), setPauseOpen(false), refresh()), onError: (e) => toast.error(e) })
              }
            >
              Mettre en pause
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">Tes pages restent visibles avec ton message, mais personne ne peut commander. Tu rouvres en un clic.</p>
        <Textarea label="Message pour tes clients" optional rows={3} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Nous sommes en réapprovisionnement, retour lundi !" />
      </Dialog>

      <Dialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Fermer définitivement la boutique"
        size="sm"
        footer={
          <>
            <Button onClick={() => setCloseOpen(false)}>Annuler</Button>
            <Button
              variant="danger"
              disabled={confirm !== store.name}
              loading={act.isPending}
              onClick={() =>
                act.mutate(
                  { action: 'close', body: { confirmName: confirm } },
                  {
                    onSuccess: () => {
                      toast.success('Boutique fermée')
                      refresh()
                      navigate('/', { replace: true })
                    },
                    onError: (e) => toast.error(e),
                  },
                )
              }
            >
              Fermer pour toujours
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-muted">
          <p>Les pages de la boutique et ses liens ne fonctionneront plus, et elle disparaîtra de ton tableau de bord. Tu ne pourras pas la rouvrir toi-même.</p>
          <p>
            Pour confirmer, tape le nom de la boutique : <b className="text-fg">{store.name}</b>
          </p>
          <Input label="Nom de la boutique" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
      </Dialog>
    </Card>
  )
}
