import { Check, Copy, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Segmented, Skeleton, Switch } from '@/components/ui'
import { useCan } from '@/hooks/auth'
import { usePaymentAccounts, useSavePaymentAccount } from '@/hooks/resources'
import { ApiError } from '@/lib/api'
import { FIELD_LABEL, PROVIDER_LABEL } from '@/lib/labels'
import { SaveBar } from '@/components/SaveBar'
import type { PaymentAccount } from '@/lib/types'

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const toast = useToast()
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          toast.error('Copie impossible : sélectionnez le texte manuellement')
        }
      }}
      aria-label="Copier l’URL du webhook"
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {done ? 'Copié' : 'Copier'}
    </Button>
  )
}

function ProviderCard({ account }: { account: PaymentAccount }) {
  const save = useSavePaymentAccount()
  const toast = useToast()
  const [enabled, setEnabled] = useState(account.enabled)
  const [mode, setMode] = useState(account.mode)
  const [values, setValues] = useState<Record<'sandbox' | 'live', Record<string, string>>>({ sandbox: {}, live: {} })
  const [cleared, setCleared] = useState<Record<string, boolean>>({})
  const [credMode, setCredMode] = useState<'sandbox' | 'live'>(account.mode)
  const dirty = enabled !== account.enabled || mode !== account.mode || Object.values(values.sandbox).some(Boolean) || Object.values(values.live).some(Boolean) || Object.values(cleared).some(Boolean)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Champ vide = conserver ; null = effacer.
    const build = (m: 'sandbox' | 'live') => {
      const out: Record<string, string | null> = {}
      for (const f of account.fields) {
        if (cleared[`${m}.${f}`]) out[f] = null
        else if (values[m][f]?.trim()) out[f] = values[m][f]!.trim()
      }
      return out
    }
    save.mutate(
      { provider: account.provider, body: { enabled, mode, sandbox: build('sandbox'), live: build('live') } },
      {
        onSuccess: () => {
          setValues({ sandbox: {}, live: {} })
          setCleared({})
          toast.success(`${PROVIDER_LABEL[account.provider]} enregistré`)
        },
        onError: (err) => toast.error(err),
      },
    )
  }

  const current = account[credMode]
  const configured = account.fields.every((f) => account[account.mode][f])

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          {PROVIDER_LABEL[account.provider]}
          {account.enabled ? <Badge tone="green">Activé</Badge> : <Badge>Désactivé</Badge>}
          {account.enabled && !configured && <Badge tone="orange">Identifiants incomplets</Badge>}
        </span>
      }
      actions={<Switch checked={enabled} onChange={setEnabled} ariaLabel={`Activer ${PROVIDER_LABEL[account.provider]}`} />}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Mode actif</span>
          <Segmented
            label="Mode actif"
            value={mode}
            onChange={(m) => {
              setMode(m)
              setCredMode(m)
            }}
            options={[
              { value: 'sandbox', label: 'Test (sandbox)' },
              { value: 'live', label: 'Production' },
            ]}
          />
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-muted">Identifiants</span>
            <Segmented
              label="Identifiants à modifier"
              value={credMode}
              onChange={setCredMode}
              options={[
                { value: 'sandbox', label: 'Test' },
                { value: 'live', label: 'Production' },
              ]}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {account.fields.map((f) => {
              const key = `${credMode}.${f}`
              const masked = current[f]
              return (
                <div key={key}>
                  <Input
                    label={
                      <span className="inline-flex items-center gap-2">
                        {FIELD_LABEL[f] ?? f}
                        {masked && !cleared[key] && <code className="rounded bg-surface-2 px-1.5 text-[12px] font-normal text-muted">{masked}</code>}
                      </span>
                    }
                    type="password"
                    autoComplete="off"
                    placeholder={masked && !cleared[key] ? 'laisser vide pour conserver' : 'Non renseigné'}
                    value={values[credMode][f] ?? ''}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [credMode]: { ...v[credMode], [f]: e.target.value } }))
                      setCleared((c) => ({ ...c, [key]: false }))
                    }}
                  />
                  {masked && (
                    <button type="button" onClick={() => setCleared((c) => ({ ...c, [key]: !c[key] }))} className="mt-1 text-[12px] font-medium text-red-600 hover:underline dark:text-red-400">
                      {cleared[key] ? 'Annuler' : 'Effacer'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {account.webhookUrl ? (
          <div>
            <p className="mb-1.5 text-[13px] font-medium">URL de webhook</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-2 px-3 py-2 text-[12.5px]" title={account.webhookUrl}>
                {account.webhookUrl}
              </code>
              <CopyButton text={account.webhookUrl} />
            </div>
            <p className="mt-1 text-[12.5px] text-muted">À coller dans le tableau de bord de {PROVIDER_LABEL[account.provider]}.</p>
          </div>
        ) : (
          <p className="text-[12.5px] text-muted">L’URL de webhook apparaîtra après le premier enregistrement.</p>
        )}
        {/* Une barre par moyen de paiement : collée en bas tant que sa carte est à l'écran. */}
        <SaveBar
          submit
          dirty={dirty}
          saving={save.isPending}
          alwaysOnMobile={false}
          label={`Enregistrer ${PROVIDER_LABEL[account.provider]}`}
          onDiscard={() => {
            setEnabled(account.enabled)
            setMode(account.mode)
            setValues({ sandbox: {}, live: {} })
            setCleared({})
          }}
        />
      </form>
    </Card>
  )
}

export function PaymentsSettings() {
  const isOwner = useCan('payments.manage')
  const { data, error, isPending, refetch } = usePaymentAccounts(isOwner)
  const forbidden = !isOwner || (error instanceof ApiError && error.status === 403)
  if (forbidden) return <EmptyState icon={<Lock className="size-5" />} title="Réservé au propriétaire" description="Seul le propriétaire de la boutique peut voir et modifier les moyens de paiement." />
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    )
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Les identifiants sont chiffrés. Les valeurs actuelles ne sont jamais affichées en entier.</p>
      {data.map((a) => (
        <ProviderCard key={`${a.provider}-${a.enabled}-${a.mode}-${JSON.stringify(a.sandbox)}-${JSON.stringify(a.live)}`} account={a} />
      ))}
    </div>
  )
}
