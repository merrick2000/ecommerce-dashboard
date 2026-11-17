import { promoCodeInputSchema } from '@zuri/shared'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog, Dialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, EmptyState, ErrorState, Field, Input, ListSkeleton, PageHeader, Segmented, Switch } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useProducts, usePromoCodes } from '@/hooks/resources'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { currencyLabel, date, money, num } from '@/lib/format'
import type { PromoCode } from '@/lib/types'
import { NumberField } from './products/editor/fields'

interface PromoForm {
  code: string
  type: 'percentage' | 'fixed'
  value: number | null
  maxUses: number | null
  minSubtotal: number | null
  productIds: string[]
  startsAt: string
  endsAt: string
  isActive: boolean
}

const dayOf = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const toForm = (p: PromoCode | null): PromoForm =>
  p
    ? { code: p.code, type: p.type, value: p.value, maxUses: p.maxUses, minSubtotal: p.minSubtotal, productIds: p.productIds, startsAt: dayOf(p.startsAt), endsAt: dayOf(p.endsAt), isActive: p.isActive }
    : { code: '', type: 'percentage', value: null, maxUses: null, minSubtotal: null, productIds: [], startsAt: '', endsAt: '', isActive: true }

function status(p: PromoCode): { label: string; tone: 'green' | 'neutral' | 'red' | 'amber' } {
  const now = Date.now()
  if (!p.isActive) return { label: 'Inactif', tone: 'neutral' }
  if (p.endsAt && new Date(p.endsAt).getTime() < now) return { label: 'Expiré', tone: 'red' }
  if (p.maxUses != null && p.usedCount >= p.maxUses) return { label: 'Épuisé', tone: 'red' }
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return { label: 'Programmé', tone: 'amber' }
  return { label: 'Actif', tone: 'green' }
}

function PromoDialog({ promo, open, onClose }: { promo: PromoCode | null; open: boolean; onClose: () => void }) {
  const { save } = usePromoCodes()
  const products = useProducts()
  const toast = useToast()
  const { store } = useCurrentStore()
  const cur = currencyLabel(store?.currency ?? 'XOF')
  const [form, setForm] = useState<PromoForm>(() => toForm(promo))
  const [errors, setErrors] = useState<Errors>({})
  const [prevKey, setPrevKey] = useState<string | null>(null)
  const key = open ? String(promo?.id ?? 'new') : null
  if (key !== prevKey) {
    setPrevKey(key)
    if (open) {
      setForm(toForm(promo))
      setErrors({})
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(promoCodeInputSchema, {
      ...form,
      value: form.value ?? undefined,
      startsAt: form.startsAt ? `${form.startsAt}T00:00:00` : null,
      endsAt: form.endsAt ? `${form.endsAt}T23:59:59` : null,
    })
    if (v.errors) return setErrors(v.errors)
    if (v.data.type === 'percentage' && v.data.value > 100) return setErrors({ value: '100 % maximum' })
    save.mutate(
      { id: promo?.id ?? null, body: v.data },
      {
        onSuccess: () => {
          toast.success(promo ? 'Code mis à jour' : 'Code créé')
          onClose()
        },
        onError: (err) => {
          const fe = serverErrors(err)
          if (fe) setErrors(fe)
          else if (err instanceof Error && 'code' in err && err.code === 'code_taken') setErrors({ code: 'Ce code existe déjà' })
          else toast.error(err)
        },
      },
    )
  }

  const toggleProduct = (id: string) => setForm((f) => ({ ...f, productIds: f.productIds.includes(id) ? f.productIds.filter((x) => x !== id) : [...f.productIds, id] }))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={promo ? 'Modifier le code' : 'Nouveau code promo'}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" form="promo-form" variant="primary" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="promo-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input label="Code" placeholder="BIENVENUE10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} error={errors.code} hint="3 à 30 caractères : lettres, chiffres, - et _" autoCapitalize="characters" wrapClass="sm:col-span-2" />
        <Field label="Type de remise">
          <Segmented
            label="Type de remise"
            value={form.type}
            onChange={(type) => setForm({ ...form, type })}
            options={[
              { value: 'percentage', label: 'Pourcentage' },
              { value: 'fixed', label: 'Montant' },
            ]}
          />
        </Field>
        <NumberField label="Valeur" value={form.value} onChange={(value) => setForm({ ...form, value })} suffix={form.type === 'percentage' ? '%' : cur} error={errors.value} />
        <NumberField label="Utilisations max." optional value={form.maxUses} onChange={(maxUses) => setForm({ ...form, maxUses })} error={errors.maxUses} />
        <NumberField label="Montant minimum" optional value={form.minSubtotal} onChange={(minSubtotal) => setForm({ ...form, minSubtotal })} suffix={cur} error={errors.minSubtotal} />
        <Input label="Début" optional type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} error={errors.startsAt} />
        <Input label="Fin" optional type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} error={errors.endsAt} />
        <Field label="Produits concernés" hint={form.productIds.length ? `${form.productIds.length} produit(s) sélectionné(s)` : 'Aucun sélectionné = tous les produits'} className="sm:col-span-2">
          <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-line-strong p-1.5">
            {(products.data ?? []).map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2">
                <input type="checkbox" className="size-4 accent-amber-600" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                <span className="truncate">{p.name}</span>
              </label>
            ))}
            {products.data?.length === 0 && <p className="px-2 py-1.5 text-sm text-muted">Aucun produit.</p>}
          </div>
        </Field>
        <div className="sm:col-span-2">
          <Switch checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Code actif" />
        </div>
      </form>
    </Dialog>
  )
}

export default function PromoCodes() {
  const { store } = useCurrentStore()
  const currency = store?.currency ?? 'XOF'
  const toast = useToast()
  const { list, remove } = usePromoCodes()
  const [editing, setEditing] = useState<{ promo: PromoCode | null } | null>(null)
  const del = useDialogState<PromoCode>()

  return (
    <>
      <PageHeader
        title="Codes promo"
        actions={
          <Button variant="primary" onClick={() => setEditing({ promo: null })}>
            <Plus className="size-4" /> Nouveau code
          </Button>
        }
      />
      {list.error ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.isPending ? (
        <ListSkeleton rows={3} />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon={<Tag className="size-5" />}
          title="Aucun code promo"
          description="Offrez une remise à vos clients (bienvenue, relance de panier abandonné, influenceurs…)."
          action={
            <Button variant="primary" onClick={() => setEditing({ promo: null })}>
              <Plus className="size-4" /> Créer un code
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.data.map((p) => {
            const st = status(p)
            return (
              <li key={p.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2">
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[15px] font-semibold tracking-wide">{p.code}</span>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </p>
                    <p className="mt-1.5 text-sm font-medium">{p.type === 'percentage' ? `−${num(p.value)} %` : `−${money(p.value, currency)}`}</p>
                  </div>
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setEditing({ promo: p })} aria-label={`Modifier ${p.code}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => del.show(p)} aria-label={`Supprimer ${p.code}`} className="text-red-600 dark:text-red-400">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-[13px] text-muted">
                  {num(p.usedCount)}
                  {p.maxUses != null ? ` / ${num(p.maxUses)}` : ''} utilisation(s)
                  {p.minSubtotal != null && ` · dès ${money(p.minSubtotal, currency)}`}
                  {p.productIds.length > 0 && ` · ${p.productIds.length} produit(s)`}
                  {(p.startsAt || p.endsAt) && ` · ${p.startsAt ? `du ${date(p.startsAt)} ` : ''}${p.endsAt ? `au ${date(p.endsAt)}` : ''}`}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      <PromoDialog open={editing !== null} promo={editing?.promo ?? null} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={del.open}
        onClose={del.close}
        title="Supprimer le code ?"
        message={`Le code ${del.value?.code ?? ''} ne sera plus utilisable.`}
        confirmLabel="Supprimer"
        danger
        loading={remove.isPending}
        onConfirm={() =>
          del.value &&
          remove.mutate(del.value.id, {
            onSuccess: () => {
              toast.success('Code supprimé')
              del.close()
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </>
  )
}
