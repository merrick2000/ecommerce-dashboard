import { manualOrderCreateSchema, PAYMENT_METHODS, type PaymentMethod } from '@sellit/shared'
import { ArrowLeft, Minus, Package, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useToast } from '@/components/Toast'
import { Button, ButtonLink, Card, EmptyState, Input, ListSkeleton, PageHeader, Select, Textarea } from '@/components/ui'
import { useCurrency, useStoreId } from '@/hooks/auth'
import { useCreateManualOrder, useProduct, useProducts, useZones } from '@/hooks/resources'
import { numOrNull, serverErrors, strOrNull, validate, type Errors } from '@/lib/form'
import { currencyLabel, money } from '@/lib/format'
import { PAYMENT_METHOD_LABEL } from '@/lib/labels'
import type { ProductListItem } from '@/lib/types'

interface Line {
  key: number
  productId: number | null
  variantId: number | null
  quantity: number
  unitPrice: string
}

function LineRow({
  line,
  index,
  products,
  onChange,
  onRemove,
  onPrice,
  errors,
}: {
  line: Line
  index: number
  products: ProductListItem[]
  onChange: (l: Line) => void
  onRemove: () => void
  onPrice: (unit: number) => void
  errors: Errors
}) {
  const currency = useCurrency()
  const { data: product } = useProduct(line.productId)
  const listItem = products.find((p) => p.id === line.productId)
  const variants = product?.variants.filter((v) => v.isActive) ?? []
  const variant = variants.find((v) => v.id === line.variantId)
  // Prix catalogue estimé (le serveur recalcule si aucun prix n'est forcé).
  const catalog = variant?.price ?? listItem?.price.effective ?? 0
  const unit = numOrNull(line.unitPrice) ?? catalog
  useEffect(() => onPrice(unit * line.quantity), [unit, line.quantity]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-start gap-2">
        <Select
          aria-label={`Produit ${index + 1}`}
          wrapClass="flex-1"
          value={line.productId ?? ''}
          onChange={(e) => onChange({ ...line, productId: e.target.value ? Number(e.target.value) : null, variantId: null, unitPrice: '' })}
          options={[{ value: '', label: 'Choisir un produit…' }, ...products.map((p) => ({ value: String(p.id), label: `${p.name}${p.isActive ? '' : ' (inactif)'}` }))]}
          error={errors[`items.${index}.productId`]}
        />
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Retirer la ligne">
          <Trash2 className="size-4" />
        </Button>
      </div>
      {line.productId && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_160px]">
          {variants.length > 0 ? (
            <Select
              label={product?.variantLabel ?? 'Variante'}
              wrapClass="col-span-2 sm:col-span-1"
              value={line.variantId ?? ''}
              onChange={(e) => onChange({ ...line, variantId: e.target.value ? Number(e.target.value) : null })}
              options={[{ value: '', label: '—' }, ...variants.map((v) => ({ value: String(v.id), label: `${v.name}${v.stock != null ? ` (stock ${v.stock})` : ''}` }))]}
            />
          ) : (
            <div className="hidden sm:block" />
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Quantité</span>
            <div className="flex h-10 items-center rounded-lg border border-line-strong">
              <button type="button" className="flex h-full w-10 items-center justify-center text-muted hover:text-fg" onClick={() => onChange({ ...line, quantity: Math.max(1, line.quantity - 1) })} aria-label="Moins">
                <Minus className="size-4" />
              </button>
              <span className="tabular w-8 text-center font-medium" aria-live="polite">
                {line.quantity}
              </span>
              <button type="button" className="flex h-full w-10 items-center justify-center text-muted hover:text-fg" onClick={() => onChange({ ...line, quantity: Math.min(500, line.quantity + 1) })} aria-label="Plus">
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <Input label="Prix unitaire" inputMode="decimal" placeholder={String(catalog)} value={line.unitPrice} onChange={(e) => onChange({ ...line, unitPrice: e.target.value })} suffix={currencyLabel(currency)} hint="Vide = prix catalogue" />
        </div>
      )}
      {line.productId && <p className="tabular mt-2 text-right text-sm text-muted">Sous-total : {money(unit * line.quantity, currency)}</p>}
    </li>
  )
}

export default function ManualOrder() {
  const storeId = useStoreId()
  const currency = useCurrency()
  const navigate = useNavigate()
  const toast = useToast()
  const products = useProducts()
  const { list: zones } = useZones()
  const create = useCreateManualOrder()
  const [seq, setSeq] = useState(1)
  const [lines, setLines] = useState<Line[]>([{ key: 0, productId: null, variantId: null, quantity: 1, unitPrice: '' }])
  const [totals, setTotals] = useState<Record<number, number>>({})
  const [c, setC] = useState({ customerName: '', customerPhone: '', customerEmail: '', city: '', address: '', deliveryZoneId: '', shippingFee: '', paymentMethod: 'cod' as PaymentMethod, note: '' })
  const [errors, setErrors] = useState<Errors>({})

  const subtotal = lines.reduce((s, l) => s + (totals[l.key] ?? 0), 0)
  const zone = zones.data?.find((z) => z.id === Number(c.deliveryZoneId))
  const autoFee = zone ? (zone.freeAbove != null && subtotal >= zone.freeAbove ? 0 : zone.fee) : 0
  const fee = numOrNull(c.shippingFee) ?? autoFee

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      items: lines
        .filter((l) => l.productId)
        .map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity, unitPrice: numOrNull(l.unitPrice) ?? undefined })),
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      customerEmail: strOrNull(c.customerEmail),
      city: strOrNull(c.city),
      address: strOrNull(c.address),
      deliveryZoneId: c.deliveryZoneId ? Number(c.deliveryZoneId) : null,
      shippingFee: numOrNull(c.shippingFee) ?? undefined,
      paymentMethod: c.paymentMethod,
      note: strOrNull(c.note),
    }
    const v = validate(manualOrderCreateSchema, payload)
    if (v.errors) {
      setErrors(v.errors)
      if (v.errors.items) toast.error('Ajoutez au moins un produit')
      return
    }
    setErrors({})
    create.mutate(v.data, {
      onSuccess: (o) => {
        toast.success(`Commande ${o.orderNumber} créée`)
        navigate(`/stores/${storeId}/orders/${o.id}`, { replace: true })
      },
      onError: (err) => {
        const fe = serverErrors(err)
        if (fe) setErrors(fe)
        else toast.error(err)
      },
    })
  }

  const back = (
    <Link to={`/stores/${storeId}/orders`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Commandes
    </Link>
  )

  if (products.isPending) return <>{back}<ListSkeleton rows={3} /></>
  if (products.data && products.data.length === 0)
    return (
      <>
        <PageHeader back={back} title="Nouvelle commande" />
        <EmptyState icon={<Package className="size-5" />} title="Aucun produit" description="Créez d’abord un produit pour pouvoir saisir une commande." action={<ButtonLink to={`/stores/${storeId}/products/new`} variant="primary">Créer un produit</ButtonLink>} />
      </>
    )

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader back={back} title="Nouvelle commande" description="Commande reçue par téléphone, WhatsApp ou en boutique." />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card title="Produits">
            <ul className="space-y-3">
              {lines.map((l, i) => (
                <LineRow
                  key={l.key}
                  line={l}
                  index={i}
                  products={products.data ?? []}
                  errors={errors}
                  onChange={(nl) => setLines((ls) => ls.map((x) => (x.key === l.key ? nl : x)))}
                  onRemove={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [{ ...ls[0]!, productId: null, variantId: null, quantity: 1, unitPrice: '' }]))}
                  onPrice={(t) => setTotals((m) => (m[l.key] === t ? m : { ...m, [l.key]: t }))}
                />
              ))}
            </ul>
            <Button
              className="mt-3"
              onClick={() => {
                setLines((ls) => [...ls, { key: seq, productId: null, variantId: null, quantity: 1, unitPrice: '' }])
                setSeq(seq + 1)
              }}
            >
              <Plus className="size-4" /> Ajouter un produit
            </Button>
          </Card>

          <Card title="Client">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nom" value={c.customerName} onChange={(e) => setC({ ...c, customerName: e.target.value })} error={errors.customerName} autoComplete="off" />
              <Input label="Téléphone" type="tel" inputMode="tel" placeholder="+229 97 00 00 00" value={c.customerPhone} onChange={(e) => setC({ ...c, customerPhone: e.target.value })} error={errors.customerPhone} />
              <Input label="Email" optional type="email" value={c.customerEmail} onChange={(e) => setC({ ...c, customerEmail: e.target.value })} error={errors.customerEmail} wrapClass="sm:col-span-2" />
              <Input label="Ville" value={c.city} onChange={(e) => setC({ ...c, city: e.target.value })} error={errors.city} />
              <Input label="Adresse" value={c.address} onChange={(e) => setC({ ...c, address: e.target.value })} error={errors.address} />
              <Textarea label="Note" optional rows={2} value={c.note} onChange={(e) => setC({ ...c, note: e.target.value })} wrapClass="sm:col-span-2" />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Livraison et paiement">
            <div className="space-y-4">
              <Select
                label="Zone de livraison"
                value={c.deliveryZoneId}
                onChange={(e) => setC({ ...c, deliveryZoneId: e.target.value })}
                options={[{ value: '', label: 'Aucune' }, ...(zones.data ?? []).map((z) => ({ value: String(z.id), label: `${z.name} — ${money(z.fee, currency)}` }))]}
              />
              <Input label="Frais de livraison" inputMode="decimal" placeholder={String(autoFee)} value={c.shippingFee} onChange={(e) => setC({ ...c, shippingFee: e.target.value })} suffix={currencyLabel(currency)} hint="Vide = tarif de la zone" error={errors.shippingFee} />
              <Select label="Paiement" value={c.paymentMethod} onChange={(e) => setC({ ...c, paymentMethod: e.target.value as PaymentMethod })} options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABEL[m] }))} />
            </div>
          </Card>
          <Card>
            <dl className="tabular space-y-1.5 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Sous-total estimé</dt>
                <dd>{money(subtotal, currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Livraison</dt>
                <dd>{money(fee, currency)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd>{money(subtotal + fee, currency)}</dd>
              </div>
            </dl>
            <div className="border-t border-line p-4">
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={create.isPending}>
                Créer la commande
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
