import { CURRENCIES, LOCALES, storeUpdateSchema } from '@zuri/shared'
import { CheckCircle2, Clock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState, Input, Select, Skeleton } from '@/components/ui'
import { useStoreInfo, useUpdateStore } from '@/hooks/resources'
import { serverErrors, strOrNull, validate, type Errors } from '@/lib/form'
import { COUNTRIES, CURRENCY_NAME } from '@/lib/labels'
import type { Store } from '@/lib/types'

const toForm = (s: Store) => ({
  name: s.name,
  slug: s.slug,
  currency: s.currency as string,
  locale: s.locale as string,
  country: s.country,
  subdomain: s.subdomain ?? '',
  customDomain: s.customDomain ?? '',
  supportPhone: s.supportPhone ?? '',
  supportEmail: s.supportEmail ?? '',
})

function StoreForm({ store, canEdit }: { store: Store; canEdit: boolean }) {
  const update = useUpdateStore()
  const toast = useToast()
  const [form, setForm] = useState(() => toForm(store))
  const [errors, setErrors] = useState<Errors>({})
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(store))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      subdomain: strOrNull(form.subdomain),
      customDomain: strOrNull(form.customDomain),
      supportPhone: strOrNull(form.supportPhone),
      supportEmail: strOrNull(form.supportEmail),
    }
    const v = validate(storeUpdateSchema, payload)
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    update.mutate(v.data, {
      onSuccess: (s) => {
        setForm(toForm(s))
        toast.success('Boutique mise à jour')
      },
      onError: (err) => {
        const fe = serverErrors(err)
        if (fe) setErrors(fe)
        else if (err instanceof Error && 'code' in err && err.code === 'store_taken') setErrors({ slug: 'Déjà utilisé', subdomain: 'Déjà utilisé', customDomain: 'Déjà utilisé' })
        else toast.error(err)
      },
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset disabled={!canEdit} className="space-y-4">
        <Card title="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nom" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
            <Input label="Identifiant (slug)" value={form.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} error={errors.slug} autoCapitalize="off" />
            <Select label="Devise" value={form.currency} onChange={(e) => set({ currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c, label: `${c} — ${CURRENCY_NAME[c] ?? c}` }))} error={errors.currency} />
            <Select label="Langue" value={form.locale} onChange={(e) => set({ locale: e.target.value })} options={LOCALES.map((l) => ({ value: l, label: l === 'fr' ? 'Français' : 'English' }))} />
            <Select label="Pays" value={form.country} onChange={(e) => set({ country: e.target.value })} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} />
          </div>
        </Card>

        <Card title="Adresse web">
          <div className="space-y-4">
            <Input label="Sous-domaine" value={form.subdomain} onChange={(e) => set({ subdomain: e.target.value.toLowerCase() })} error={errors.subdomain} suffix=".zurisell.store" autoCapitalize="off" />
            <div>
              <Input
                label="Domaine personnalisé"
                optional
                placeholder="boutique.mondomaine.com"
                value={form.customDomain}
                onChange={(e) => set({ customDomain: e.target.value.toLowerCase() })}
                error={errors.customDomain}
                autoCapitalize="off"
                hint="Créez un enregistrement CNAME vers zurisell.store chez votre registraire."
              />
              {store.customDomain && (
                <p className="mt-2">
                  {store.customDomainVerifiedAt ? (
                    <Badge tone="green">
                      <CheckCircle2 className="size-3" /> {store.customDomain} vérifié
                    </Badge>
                  ) : (
                    <Badge tone="amber">
                      <Clock className="size-3" /> Vérification en attente pour {store.customDomain}
                    </Badge>
                  )}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card title="Support client" description="Affiché aux clients sur les pages et dans les emails.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Téléphone" optional type="tel" inputMode="tel" value={form.supportPhone} onChange={(e) => set({ supportPhone: e.target.value })} error={errors.supportPhone} />
            <Input label="Email" optional type="email" value={form.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} error={errors.supportEmail} />
          </div>
        </Card>
      </fieldset>
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={!dirty} loading={update.isPending}>
            Enregistrer
          </Button>
        </div>
      )}
    </form>
  )
}

export function StoreSettings({ canEdit }: { canEdit: boolean }) {
  const { data, error, isPending, refetch } = useStoreInfo()
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  return <StoreForm key={data.updatedAt} store={data} canEdit={canEdit} />
}
