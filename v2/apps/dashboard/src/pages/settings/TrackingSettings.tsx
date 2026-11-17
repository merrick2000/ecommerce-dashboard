import { trackingSettingsSchema } from '@zuri/shared'
import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Skeleton } from '@/components/ui'
import { useCheckoutSettings, useSaveTracking } from '@/hooks/resources'
import { serverErrors, strOrNull, validate, type Errors } from '@/lib/form'
import type { CheckoutSettingsResponse } from '@/lib/types'

function Form({ tracking, canEdit }: { tracking: CheckoutSettingsResponse['tracking']; canEdit: boolean }) {
  const save = useSaveTracking()
  const toast = useToast()
  const [f, setF] = useState({ facebookPixelId: tracking.facebookPixelId ?? '', facebookTestEventCode: tracking.facebookTestEventCode ?? '', tiktokPixelId: tracking.tiktokPixelId ?? '', token: '' })
  const [clearToken, setClearToken] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      facebookPixelId: strOrNull(f.facebookPixelId),
      facebookTestEventCode: strOrNull(f.facebookTestEventCode),
      tiktokPixelId: strOrNull(f.tiktokPixelId),
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
        <Card title="TikTok">
          <Input label="ID du pixel TikTok" value={f.tiktokPixelId} onChange={(e) => setF({ ...f, tiktokPixelId: e.target.value })} error={errors.tiktokPixelId} />
        </Card>
      </fieldset>
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={save.isPending}>
            Enregistrer
          </Button>
        </div>
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
