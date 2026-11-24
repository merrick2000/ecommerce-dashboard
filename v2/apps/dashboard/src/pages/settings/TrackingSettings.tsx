import { trackingSettingsSchema } from '@zuri/shared'
import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Skeleton } from '@/components/ui'
import { useCheckoutSettings, useSaveTracking } from '@/hooks/resources'
import { serverErrors, strOrNull, validate, type Errors } from '@/lib/form'
import { SaveBar } from '@/components/SaveBar'
import type { CheckoutSettingsResponse } from '@/lib/types'

function Form({ tracking, canEdit }: { tracking: CheckoutSettingsResponse['tracking']; canEdit: boolean }) {
  const save = useSaveTracking()
  const toast = useToast()
  const initial = { facebookPixelId: tracking.facebookPixelId ?? '', facebookTestEventCode: tracking.facebookTestEventCode ?? '', tiktokPixelId: tracking.tiktokPixelId ?? '', token: '', codPurchaseOn: tracking.codPurchaseOn ?? 'created' }
  const [f, setF] = useState(initial)
  const [clearToken, setClearToken] = useState(false)
  const dirty = JSON.stringify(f) !== JSON.stringify(initial) || clearToken
  const [errors, setErrors] = useState<Errors>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      facebookPixelId: strOrNull(f.facebookPixelId),
      facebookTestEventCode: strOrNull(f.facebookTestEventCode),
      tiktokPixelId: strOrNull(f.tiktokPixelId),
      codPurchaseOn: f.codPurchaseOn,
    }
    // Absent = inchangé ; null = supprimer ; valeur = remplacer.
    if (clearToken) payload.facebookAccessToken = null
    else if (f.token.trim()) payload.facebookAccessToken = f.token.trim()
    const v = validate(trackingSettingsSchema, payload)
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    save.mutate(v.data, {
      onSuccess: () => {
        setF((x) => ({ ...x, token: '' }))
        setClearToken(false)
        toast.success('Suivi publicitaire enregistré')
      },
      onError: (err) => {
        const fe = serverErrors(err)
        if (fe) setErrors(fe)
        else toast.error(err)
      },
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset disabled={!canEdit} className="space-y-4">
        <Card title="Meta (Facebook / Instagram)">
          <div className="space-y-4">
            <Input label="ID du pixel" inputMode="numeric" placeholder="123456789012345" value={f.facebookPixelId} onChange={(e) => setF({ ...f, facebookPixelId: e.target.value })} error={errors.facebookPixelId && 'Identifiant numérique (5 à 20 chiffres)'} />
            <Input label="Code d’événement test" optional placeholder="TEST12345" value={f.facebookTestEventCode} onChange={(e) => setF({ ...f, facebookTestEventCode: e.target.value })} error={errors.facebookTestEventCode} />
            <div>
              <Input
                label={
                  <span className="inline-flex items-center gap-2">
                    Jeton d’accès API Conversions
                    {tracking.hasFacebookAccessToken && !clearToken && (
                      <Badge tone="green">
                        <CheckCircle2 className="size-3" /> configuré
                      </Badge>
                    )}
                  </span>
                }
                type="password"
                autoComplete="off"
                placeholder={tracking.hasFacebookAccessToken ? 'Laisser vide pour conserver' : 'EAAB…'}
                value={f.token}
                onChange={(e) => {
                  setF({ ...f, token: e.target.value })
                  setClearToken(false)
                }}
                error={errors.facebookAccessToken}
                hint="Jamais réaffiché après enregistrement."
              />
              {tracking.hasFacebookAccessToken && (
                <button type="button" onClick={() => setClearToken(!clearToken)} className="mt-1.5 text-[13px] font-medium text-red-600 hover:underline dark:text-red-400">
                  {clearToken ? 'Annuler la suppression' : 'Supprimer le jeton'}
                </button>
              )}
            </div>
          </div>
        </Card>
        <Card title="Paiement à la livraison : quand déclarer l’achat à Meta ?" description="Les pubs apprennent des achats que vous déclarez. En paiement à la livraison, beaucoup de commandes ne sont jamais livrées : déclarer l’achat plus tard apprend à Meta à trouver des clients qui paient vraiment. Avant ce moment, la commande est déclarée comme prospect (Lead).">
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Moment de l’achat déclaré à Meta">
            {(
              [
                ['created', 'À la commande', 'Le plus de signaux, le plus vite. Comptabilise aussi les commandes qui ne seront pas livrées.'],
                ['confirmed', 'À la confirmation', 'Quand votre équipe confirme la commande par téléphone. Bon équilibre (recommandé).'],
                ['delivered', 'À la livraison', 'Seulement les ventes encaissées. Le signal le plus juste, mais plus tardif.'],
              ] as const
            ).map(([value, label, text]) => (
              <label key={value} className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${f.codPurchaseOn === value ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-line hover:bg-surface-2'}`}>
                <input type="radio" name="codPurchaseOn" value={value} checked={f.codPurchaseOn === value} onChange={() => setF({ ...f, codPurchaseOn: value })} className="sr-only" />
                <span className="block font-semibold">{label}</span>
                <span className="mt-1 block text-[13px] text-muted">{text}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-muted">L’achat différé part de nos serveurs par l’API Conversions : renseignez le jeton d’accès ci-dessus. Les paiements en ligne restent déclarés dès qu’ils sont payés.</p>
        </Card>
        <Card title="TikTok">
          <Input label="ID du pixel TikTok" value={f.tiktokPixelId} onChange={(e) => setF({ ...f, tiktokPixelId: e.target.value })} error={errors.tiktokPixelId} />
        </Card>
      </fieldset>
      {canEdit && (
        <SaveBar
          submit
          dirty={dirty}
          saving={save.isPending}
          onDiscard={() => {
            setF(initial)
            setClearToken(false)
          }}
        />
      )}
    </form>
  )
}

export function TrackingSettings({ canEdit }: { canEdit: boolean }) {
  const { data, error, isPending, refetch } = useCheckoutSettings()
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-72 rounded-xl" />
  return <Form key={JSON.stringify(data.tracking)} tracking={data.tracking} canEdit={canEdit} />
}
