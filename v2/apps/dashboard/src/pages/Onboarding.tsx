import { CURRENCIES, storeCreateSchema } from '@zuri/shared'
import { ArrowLeft, Store } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Logo } from '@/components/layout/Guards'
import { useToast } from '@/components/Toast'
import { Button, Input, Select } from '@/components/ui'
import { useMe } from '@/hooks/auth'
import { useCreateStore } from '@/hooks/resources'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { slugify } from '@/lib/format'
import { COUNTRIES, CURRENCY_NAME } from '@/lib/labels'

export default function Onboarding() {
  const { data: me, refetch } = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreateStore()
  const [form, setForm] = useState({ name: '', slug: '', currency: 'XOF', country: 'BJ' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const first = !me?.stores.length

  const setName = (name: string) => setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(storeCreateSchema, form)
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    create.mutate(v.data, {
      onSuccess: async (store) => {
        await refetch()
        toast.success('Boutique créée')
        navigate(`/stores/${store.id}`, { replace: true })
      },
      onError: (err) => {
        const fe = serverErrors(err)
        if (fe) setErrors(fe)
        else if (err instanceof Error && 'code' in err && err.code === 'store_taken') setErrors({ slug: 'Ce lien est déjà pris, choisissez-en un autre.' })
        else toast.error(err)
      },
    })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo className="text-lg" />
          {!first && (
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
              <ArrowLeft className="size-4" /> Retour
            </Link>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-7">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Store className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{first ? 'Créez votre boutique' : 'Nouvelle boutique'}</h1>
          <p className="mt-1 text-sm text-muted">Quelques informations pour commencer. Tout reste modifiable dans les paramètres.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input label="Nom de la boutique" value={form.name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="Ex. Awa Beauté" autoFocus />
            <Input
              label="Lien de la boutique"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setForm({ ...form, slug: e.target.value.toLowerCase() })
              }}
              error={errors.slug}
              hint={form.slug ? `${form.slug}.zurisell.store` : 'Lettres minuscules, chiffres et tirets.'}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} error={errors.country} />
              <Select label="Devise" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={CURRENCIES.map((c) => ({ value: c, label: `${c} | ${CURRENCY_NAME[c] ?? c}` }))} error={errors.currency} />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={create.isPending}>
              Créer la boutique
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
