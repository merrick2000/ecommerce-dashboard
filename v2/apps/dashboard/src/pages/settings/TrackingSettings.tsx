import { trackingSettingsSchema } from '@zuri/shared'
import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Skeleton } from '@/components/ui'
import { keys, useCheckoutSettings, useSaveTracking } from '@/hooks/resources'
import { useQueryClient } from '@tanstack/react-query'
import { useStoreId } from '@/hooks/auth'
import { api } from '@/lib/api'
import { serverErrors, strOrNull, validate, type Errors } from '@/lib/form'
import { SaveBar } from '@/components/SaveBar'
import type { CheckoutSettingsResponse } from '@/lib/types'

function Form({ tracking, canEdit }: { tracking: CheckoutSettingsResponse['tracking']; canEdit: boolean }) {
  const save = useSaveTracking()
  const toast = useToast()
  const initial = { facebookPixelId: tracking.facebookPixelId ?? '', facebookTestEventCode: tracking.facebookTestEventCode ?? '', tiktokPixelId: tracking.tiktokPixelId ?? '', token: '', codPurchaseOn: tracking.codPurchaseOn ?? 'delivered' }
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
        <Card collapsible title="Meta (Facebook / Instagram)">
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
        <CapiPanel tracking={tracking} />
        <Card collapsible title="Paiement à la livraison : quand déclarer l’achat à Meta ?" description="Les pubs apprennent des achats que vous déclarez. En paiement à la livraison, beaucoup de commandes ne sont jamais livrées : déclarer l’achat plus tard apprend à Meta à trouver des clients qui paient vraiment. Avant ce moment, la commande est déclarée comme prospect (Lead).">
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Moment de l’achat déclaré à Meta">
            {(
              [
                ['delivered', 'À la livraison (recommandé)', 'Seulement les ventes vraiment encaissées. Meta apprend à trouver des clients qui paient, pas seulement qui commandent.'],
                ['confirmed', 'À la confirmation', 'Quand votre équipe confirme par téléphone. Plus rapide, mais compte aussi les colis refusés à la livraison.'],
                ['created', 'À la commande', 'Dès le formulaire rempli. Beaucoup de signaux, mais compte les commandes jamais livrées.'],
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
        <Card collapsible title="TikTok">
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
  return <Form key={JSON.stringify({ ...data.tracking, capiLog: undefined })} tracking={data.tracking} canEdit={canEdit} />
}

const EVENT_LABEL: Record<string, string> = { Purchase: 'Achat', Lead: 'Prospect (Lead)', InitiateCheckout: 'Début de commande', PageView: 'Test' }

/** API Conversions : bouton de test (code d'événement test) et derniers envois serveur avec la réponse de Meta. */
function CapiPanel({ tracking }: { tracking: CheckoutSettingsResponse['tracking'] }) {
  const storeId = useStoreId()
  const toast = useToast()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; eventsReceived: number | null; fbtraceId: string | null; error: string | null } | null>(null)
  const log = tracking.capiLog ?? []
  const test = async () => {
    setBusy(true)
    setResult(null)
    try {
      setResult(await api.post(`/stores/${storeId}/tracking/capi-test`))
      void qc.invalidateQueries({ queryKey: keys.checkout(storeId) })
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card collapsible title="API Conversions (envois du serveur)" description="Achats, prospects et débuts de commande envoyés par le serveur avec votre jeton, en plus du pixel du navigateur (même identifiant : Meta ne compte chaque événement qu’une fois).">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void test()} loading={busy} disabled={!tracking.facebookPixelId || !tracking.hasFacebookAccessToken}>
            Tester l’envoi
          </Button>
          <span className="text-[13px] text-muted">Envoie un événement de test, visible dans le Gestionnaire d’événements, onglet « Événements de test ». Code d’événement test requis (enregistrez-le d’abord).</span>
        </div>
        {result &&
          (result.ok ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              Meta a bien reçu l’événement ({result.eventsReceived ?? 0} reçu). Regardez l’onglet Événements de test. Référence Meta : {result.fbtraceId ?? '-'}
            </p>
          ) : (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">Meta a refusé : {result.error}</p>
          ))}
        <div>
          <p className="mb-2 text-sm font-medium">Derniers envois</p>
          {log.length ? (
            <ul className="divide-y divide-line rounded-lg border border-line text-[13px]">
              {log.map((l, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                  <Badge tone={l.ok ? 'green' : 'red'}>{l.ok ? 'reçu' : 'refusé'}</Badge>
                  <span className="font-medium">{EVENT_LABEL[l.event] ?? l.event}</span>
                  {l.ref && l.ref !== 'test' && <span className="text-muted">{l.ref}</span>}
                  {l.test && <Badge tone="neutral">test</Badge>}
                  <span className="text-muted">{new Date(l.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  {l.error && <span className="w-full text-red-700 dark:text-red-300">{l.error}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">Aucun envoi pour l’instant : le premier part à la prochaine commande, ou avec le bouton de test.</p>
          )}
        </div>
      </div>
    </Card>
  )
}
