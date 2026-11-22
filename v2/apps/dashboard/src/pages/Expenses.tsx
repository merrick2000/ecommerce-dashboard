/**
 * Dépenses : pub, emballage, achats de stock, salaires… Déduites du chiffre encaissé pour le bénéfice réel.
 * Une dépense peut être rattachée à un produit (ex. la pub Facebook d'un produit) : bénéfice par produit.
 */
import { EXPENSE_CATEGORIES, EXPENSE_LABELS, expenseInputSchema, type ExpenseCategory } from '@zuri/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Receipt, Trash2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { ConfirmDialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Button, Card, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Segmented, Select } from '@/components/ui'
import { useCurrency, useStoreId } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { api } from '@/lib/api'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { isoDay, money, optionLabel } from '@/lib/format'
import { NumberField } from './products/editor/fields'

interface ExpenseRow {
  id: number
  spentOn: string
  category: ExpenseCategory
  amount: number
  label: string | null
  productId: string | null
  productName: string | null
  author: string | null
}
interface ExpenseList {
  currency: string
  total: number
  byCategory: { category: string; label: string; amount: number }[]
  data: ExpenseRow[]
}

const PERIODS = [
  { value: 'month', label: 'Ce mois' },
  { value: 'last', label: 'Mois dernier' },
  { value: '90', label: '90 jours' },
] as const
type Period = (typeof PERIODS)[number]['value']

function rangeOf(p: Period) {
  const now = new Date()
  if (p === 'month') return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) }
  if (p === 'last') return { from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)) }
  const from = new Date(now)
  from.setDate(from.getDate() - 89)
  return { from: isoDay(from), to: isoDay(now) }
}

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export default function Expenses() {
  const storeId = useStoreId()
  const currency = useCurrency()
  const toast = useToast()
  const qc = useQueryClient()
  const products = useProducts()
  const [period, setPeriod] = useState<Period>('month')
  const range = useMemo(() => rangeOf(period), [period])
  const key = ['store', storeId, 'expenses', range] as const
  const list = useQuery({ queryKey: key, queryFn: () => api.get<ExpenseList>(`/stores/${storeId}/expenses`, range) })
  const [form, setForm] = useState({ spentOn: isoDay(new Date()), category: 'ads' as ExpenseCategory, amount: null as number | null, label: '', productId: '' })
  const [errors, setErrors] = useState<Errors>({})
  const del = useDialogState<ExpenseRow>()

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['store', storeId, 'expenses'] })
    void qc.invalidateQueries({ queryKey: ['store', storeId, 'stats'] })
  }
  const add = useMutation({
    mutationFn: (body: unknown) => api.post(`/stores/${storeId}/expenses`, body),
    onSuccess: () => {
      toast.success('Dépense ajoutée')
      setForm((f) => ({ ...f, amount: null, label: '' }))
      refresh()
    },
    onError: (e) => {
      const fe = serverErrors(e)
      if (fe) setErrors(fe)
      else toast.error(e)
    },
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/stores/${storeId}/expenses/${id}`),
    onSuccess: () => {
      toast.success('Dépense supprimée')
      del.close()
      refresh()
    },
    onError: (e) => toast.error(e),
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(expenseInputSchema, { ...form, amount: form.amount ?? 0, label: form.label.trim() || null, productId: form.productId || null })
    if (v.errors) return setErrors(v.errors)
    setErrors({})
    add.mutate(v.data)
  }

  return (
    <div>
      <PageHeader
        title="Dépenses"
        description="Pub, emballage, stock, salaires des closers… Chaque dépense est déduite de ton chiffre encaissé pour calculer ton bénéfice réel."
        actions={<Segmented label="Période" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label }))} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="space-y-4">
          <Card title="Ajouter une dépense">
            <form onSubmit={submit} className="space-y-3" noValidate>
              <Select
                label="Type"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: EXPENSE_LABELS[c] }))}
              />
              <NumberField label="Montant" value={form.amount} onChange={(amount) => setForm({ ...form, amount })} suffix={currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency} error={errors.amount} />
              <Input label="Date" type="date" value={form.spentOn} max={isoDay(new Date())} onChange={(e) => setForm({ ...form, spentOn: e.target.value })} error={errors.spentOn} />
              <Input label="Détail" optional placeholder="Ex. Pub Facebook perruques" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={160} />
              <Select
                label="Produit concerné"
                hint="Optionnel : pour voir le bénéfice par produit."
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                options={[{ value: '', label: 'Toute la boutique' }, ...(products.data ?? []).map((p) => ({ value: p.id, title: p.name, label: optionLabel(p.name) }))]}
              />
              <Button type="submit" variant="primary" loading={add.isPending} className="w-full">
                Ajouter
              </Button>
            </form>
          </Card>
          {list.data && list.data.byCategory.length > 0 && (
            <Card title="Par type">
              <ul className="space-y-2">
                {list.data.byCategory.map((c) => (
                  <li key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{c.label}</span>
                    <span className="tabular font-medium">{money(c.amount, currency)}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between border-t border-line pt-2 text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular">{money(list.data.total, currency)}</span>
                </li>
              </ul>
            </Card>
          )}
        </div>

        <Card title="Dépenses de la période">
          {list.isPending ? (
            <ListSkeleton rows={4} />
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          ) : !list.data.data.length ? (
            <EmptyState icon={<Receipt className="size-5" />} title="Aucune dépense sur la période" description="Ajoute ta pub du jour, tes emballages ou tes salaires pour connaître ton vrai bénéfice." />
          ) : (
            <ul className="divide-y divide-line">
              {list.data.data.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-14 shrink-0 text-[12px] text-muted">{fmtDay(e.spentOn)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.label || EXPENSE_LABELS[e.category]}</p>
                    <p className="truncate text-[12px] text-muted">
                      {EXPENSE_LABELS[e.category]}
                      {e.productName ? ` · ${e.productName}` : ''}
                      {e.author ? ` · ${e.author}` : ''}
                    </p>
                  </div>
                  <span className="tabular text-sm font-medium">{money(e.amount, currency)}</span>
                  <Button variant="ghost" size="icon" onClick={() => del.show(e)} aria-label="Supprimer la dépense">
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={del.open}
        onClose={del.close}
        onConfirm={() => del.value && remove.mutate(del.value.id)}
        title="Supprimer cette dépense ?"
        message={`${del.value?.label || (del.value ? EXPENSE_LABELS[del.value.category] : '')} : ${del.value ? money(del.value.amount, currency) : ''}`}
        confirmLabel="Supprimer"
        danger
        loading={remove.isPending}
      />
    </div>
  )
}
