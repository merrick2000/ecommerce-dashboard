import { AlertTriangle, KeyRound, Lock } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { useCan } from '@/hooks/auth'
import { useIntegrations, useRotateIntegrationSecret } from '@/hooks/resources'
import { ApiError } from '@/lib/api'
import { CopyButton } from './PaymentsSettings'

/** Webhook entrant Selar (via n8n / Zapier) : URL commune + secret propre à la boutique. */
export function IntegrationsSettings() {
  const isOwner = useCan('integrations.manage')
  const toast = useToast()
  const { data, error, isPending, refetch } = useIntegrations(isOwner)
  const rotate = useRotateIntegrationSecret()
  const [secret, setSecret] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  if (!isOwner || (error instanceof ApiError && error.status === 403))
    return <EmptyState icon={<Lock className="size-5" />} title="Réservé au propriétaire" description="Seul le propriétaire de la boutique peut gérer les intégrations." />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-64 rounded-xl" />

  const generate = () =>
    rotate.mutate(undefined, {
      onSuccess: (r) => {
        setSecret(r.secret)
        setConfirm(false)
        toast.success('Nouveau secret généré')
      },
      onError: (e) => toast.error(e),
    })

  return (
    <div className="space-y-4">
      <Card title="Webhook Selar (n8n, Zapier…)" description="Les ventes Selar sont enregistrées comme commandes payées. Renseignez le « code produit Selar » dans l’onglet Paiement de chaque produit.">
        <div className="space-y-5">
          <div>
            <p className="mb-1.5 text-[13px] font-medium">URL du webhook</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-2 px-3 py-2 text-[12.5px]" title={data.webhookUrl}>
                {data.webhookUrl}
              </code>
              <CopyButton text={data.webhookUrl} />
            </div>
            <p className="mt-1 text-[12.5px] text-muted">
              Méthode POST, en-tête <code className="rounded bg-surface-2 px-1">X-Webhook-Secret</code> avec le secret ci-dessous.
            </p>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-2 text-[13px] font-medium">
              Secret {data.hasSecret ? <Badge tone="green">configuré</Badge> : <Badge>non configuré</Badge>}
            </p>
            {secret ? (
              <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-2 font-mono text-[12.5px]">{secret}</code>
                  <CopyButton text={secret} />
                </div>
                <p className="flex items-start gap-1.5 text-[12.5px] text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Copiez-le maintenant : il ne sera plus jamais affiché.
                </p>
              </div>
            ) : (
              <Button onClick={() => (data.hasSecret ? setConfirm(true) : generate())} loading={rotate.isPending}>
                <KeyRound className="size-4" /> {data.hasSecret ? 'Régénérer le secret' : 'Générer un secret'}
              </Button>
            )}
          </div>
        </div>
      </Card>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={generate}
        title="Régénérer le secret ?"
        message="L’ancien secret cessera immédiatement de fonctionner : votre scénario n8n / Zapier actuel sera refusé tant que vous n’y aurez pas collé le nouveau."
        confirmLabel="Régénérer"
        danger
        loading={rotate.isPending}
      />
    </div>
  )
}
