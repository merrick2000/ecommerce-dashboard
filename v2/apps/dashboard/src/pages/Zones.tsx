import { deliveryZoneInputSchema } from '@zuri/shared'
import { MapPin, Pencil, Plus, Trash2, Truck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog, Dialog, useDialogState } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, EmptyState, ErrorState, Input, ListSkeleton, PageHeader, Select, Switch, TagInput } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useStoreInfo, useZones } from '@/hooks/resources'
import { serverErrors, strOrNull, validate, type Errors } from '@/lib/form'
import { currencyLabel, money } from '@/lib/format'
import { COUNTRIES, countryName } from '@/lib/labels'
import type { DeliveryZone } from '@/lib/types'
import { NumberField } from './products/editor/fields'

interface ZoneForm {
  name: string
  country: string
  cities: string[]
  fee: number | null
  freeAbove: number | null
  codAllowed: boolean
  etaLabel: string
  isActive: boolean
  position: number
}

const toForm = (z: DeliveryZone | null, country: string, position: number): ZoneForm =>
  z
    ? { name: z.name, country: z.country, cities: z.cities, fee: z.fee, freeAbove: z.freeAbove, codAllowed: z.codAllowed, etaLabel: z.etaLabel ?? '', isActive: z.isActive, position: z.position }
    : { name: '', country, cities: [], fee: null, freeAbove: null, codAllowed: true, etaLabel: '', isActive: true, position }

function ZoneDialog({ zone, open, onClose, nextPosition }: { zone: DeliveryZone | null; open: boolean; onClose: () => void; nextPosition: number }) {
  const { save } = useZones()
  const toast = useToast()
  const { store } = useCurrentStore()
  const currency = store?.currency ?? 'XOF'
  const country = useStoreInfo().data?.country ?? 'BJ'
  const [form, setForm] = useState<ZoneForm>(() => toForm(zone, country, nextPosition))
  const [errors, setErrors] = useState<Errors>({})
  const [prevKey, setPrevKey] = useState<string | null>(null)
  const key = open ? String(zone?.id ?? 'new') : null
  if (key !== prevKey) {
    setPrevKey(key)
    if (open) {
      setForm(toForm(zone, country, nextPosition))
      setErrors({})
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(deliveryZoneInputSchema, { ...form, fee: form.fee ?? undefined, etaLabel: strOrNull(form.etaLabel) })
    if (v.errors) return setErrors(v.errors)
    save.mutate(
      { id: zone?.id ?? null, body: v.data },
      {
        onSuccess: () => {
          toast.success(zone ? 'Zone mise à jour' : 'Zone créée')
          onClose()
        },
        onError: (err) => {
          const fe = serverErrors(err)
          if (fe) setErrors(fe)
          else toast.error(err)
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={zone ? 'Modifier la zone' : 'Nouvelle zone de livraison'}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" form="zone-form" variant="primary" loading={save.isPending}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="zone-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Input label="Nom de la zone" placeholder="Ex. Cotonou et environs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} wrapClass="sm:col-span-2" />
        <Select label="Pays" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} error={errors.country} />
        <Input label="Délai affiché" optional placeholder="Ex. 24 à 48 h" value={form.etaLabel} onChange={(e) => setForm({ ...form, etaLabel: e.target.value })} error={errors.etaLabel} />
        <div className="sm:col-span-2">
          <TagInput label="Villes" placeholder="Tapez une ville puis Entrée" value={form.cities} onChange={(cities) => setForm({ ...form, cities })} hint="Le client choisit la zone ; les villes l’aident à se repérer." error={errors.cities} />
        </div>
        <NumberField label="Frais de livraison" value={form.fee} onChange={(fee) => setForm({ ...form, fee })} suffix={currencyLabel(currency)} error={errors.fee} />
        <NumberField label="Gratuite à partir de" optional value={form.freeAbove} onChange={(freeAbove) => setForm({ ...form, freeAbove })} suffix={currencyLabel(currency)} error={errors.freeAbove} />
        <div className="space-y-4 sm:col-span-2">
          <Switch checked={form.codAllowed} onChange={(codAllowed) => setForm({ ...form, codAllowed })} label="Paiement à la livraison accepté" />
          <Switch checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} label="Zone active" description="Visible sur les pages de vente." />
        </div>
        <NumberField label="Ordre d’affichage" value={form.position} onChange={(v) => setForm({ ...form, position: v ?? 0 })} hint="Les plus petits nombres apparaissent en premier." />
      </form>
    </Dialog>
  )
}

export default function Zones() {
  const { store } = useCurrentStore()
  const currency = store?.currency ?? 'XOF'
  const toast = useToast()
  const { list, remove } = useZones()
  const [editing, setEditing] = useState<{ zone: DeliveryZone | null } | null>(null)
  const del = useDialogState<DeliveryZone>()
  const nextPosition = (list.data?.reduce((m, z) => Math.max(m, z.position), 0) ?? 0) + 1

  return (
    <>
      <PageHeader
        title="Livraison"
        description="Zones, frais et délais proposés au client."
        actions={
          <Button variant="primary" onClick={() => setEditing({ zone: null })}>
            <Plus className="size-4" /> Nouvelle zone
          </Button>
        }
      />
      {list.error && !list.data ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : list.isPending ? (
        <ListSkeleton rows={3} />
      ) : list.data.length === 0 ? (
        <EmptyState
          icon={<Truck className="size-5" />}
          title="Aucune zone de livraison"
          description="Créez au moins une zone (ex. votre ville) pour que les clients puissent commander vos produits physiques."
          action={
            <Button variant="primary" onClick={() => setEditing({ zone: null })}>
              <Plus className="size-4" /> Créer une zone
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.data.map((z) => (
            <li key={z.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {z.name}
                    {!z.isActive && <Badge>Inactive</Badge>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
                    <MapPin className="size-3.5" /> {countryName(z.country)}
                    {z.etaLabel && ` · ${z.etaLabel}`}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setEditing({ zone: z })} aria-label={`Modifier ${z.name}`}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => del.show(z)} aria-label={`Supprimer ${z.name}`} className="text-red-600 dark:text-red-400">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="amber">{z.fee > 0 ? money(z.fee, currency) : 'Gratuite'}</Badge>
                {z.freeAbove != null && <Badge tone="green">Offerte dès {money(z.freeAbove, currency)}</Badge>}
                <Badge tone={z.codAllowed ? 'blue' : 'neutral'}>{z.codAllowed ? 'COD accepté' : 'Sans COD'}</Badge>
              </div>
              {z.cities.length > 0 && <p className="mt-2 line-clamp-2 text-[13px] text-muted">{z.cities.join(', ')}</p>}
            </li>
          ))}
        </ul>
      )}

      <ZoneDialog open={editing !== null} zone={editing?.zone ?? null} onClose={() => setEditing(null)} nextPosition={nextPosition} />
      <ConfirmDialog
        open={del.open}
        onClose={del.close}
        title="Supprimer la zone ?"
        message={`« ${del.value?.name ?? ''} » ne sera plus proposée. Les commandes existantes ne changent pas.`}
        confirmLabel="Supprimer"
        danger
        loading={remove.isPending}
        onConfirm={() =>
          del.value &&
          remove.mutate(del.value.id, {
            onSuccess: () => {
              toast.success('Zone supprimée')
              del.close()
            },
            onError: (e) => toast.error(e),
          })
        }
      />
    </>
  )
}
