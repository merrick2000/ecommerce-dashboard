import { checkoutSettingsSchema, orderFormSchema, type OrderForm } from '@zuri/shared'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Button, ErrorState, Skeleton } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useCheckoutSettings, useSaveCheckoutSettings } from '@/hooks/resources'
import { serverErrors, validate } from '@/lib/form'
import { normalizeForm, OrderFormBuilder } from './OrderFormBuilder'

/** Formulaire de commande de la boutique : s'applique à tous les produits (sauf formulaire propre au produit). */
export function FormSettings({ canEdit }: { canEdit: boolean }) {
  const { data, error, isPending, refetch } = useCheckoutSettings()
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  const parsed = checkoutSettingsSchema.safeParse(data.settings)
  const settings = parsed.success ? parsed.data : checkoutSettingsSchema.parse({})
  return <Editor initial={normalizeForm(settings.form as OrderForm)} canEdit={canEdit} />
}

function Editor({ initial, canEdit }: { initial: OrderForm; canEdit: boolean }) {
  const { store } = useCurrentStore()
  const settingsQuery = useCheckoutSettings()
  const save = useSaveCheckoutSettings()
  const toast = useToast()
  const [form, setForm] = useState(initial)
  const [base, setBase] = useState(() => JSON.stringify(initial))
  const dirty = JSON.stringify(form) !== base

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(orderFormSchema, form)
    if (v.errors) {
      toast.error(Object.values(v.errors)[0] ?? 'Certains champs sont à corriger')
      return
    }
    // Les autres réglages de la page de vente sont renvoyés tels quels (dernière version connue).
    const current = checkoutSettingsSchema.safeParse(settingsQuery.data?.settings)
    const settings = current.success ? current.data : checkoutSettingsSchema.parse({})
    save.mutate(
      { ...settings, form: v.data },
      {
        onSuccess: () => {
          setBase(JSON.stringify(form))
          toast.success('Formulaire de commande mis à jour')
        },
        onError: (err) => {
          const fe = serverErrors(err)
          toast.error(fe ? (Object.values(fe)[0] ?? 'Données invalides') : err)
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm text-muted">S’applique à tous vos produits. Un produit peut avoir son propre formulaire (éditeur produit, onglet Paiement).</p>
      <OrderFormBuilder value={form} onChange={setForm} storeName={store?.name ?? 'Ma boutique'} currency={store?.currency ?? 'XOF'} disabled={!canEdit} />
      {canEdit && (
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex justify-end gap-2 lg:bottom-4">
          {dirty && (
            <Button size="lg" onClick={() => setForm(initial)} className="shadow-lg">
              Annuler
            </Button>
          )}
          <Button type="submit" variant="primary" size="lg" disabled={!dirty} loading={save.isPending} className="shadow-lg">
            Enregistrer
          </Button>
        </div>
      )}
    </form>
  )
}
