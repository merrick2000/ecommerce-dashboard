import { productContentSchema, productInputSchema, type ProductType } from '@zuri/shared'
import { ArrowLeft, Box, FileDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Badge, Button, cx, ErrorState, Segmented, Skeleton } from '@/components/ui'
import { useCan, useCurrency, useCurrentStore, useStoreId } from '@/hooks/auth'
import { useProduct, useSaveProduct } from '@/hooks/resources'
import { serverErrors, validate, type Errors } from '@/lib/form'
import type { Product } from '@/lib/types'
import { DeliverySection, GeneralSection, MediaSection, OffersSection, OrderFormSection, PaymentSection, SalesPageSection, type Form, type SectionProps } from './editor/sections'

type Tab = 'general' | 'page' | 'media' | 'delivery' | 'offers' | 'payment'

const TABS: { id: Tab; label: string; physicalOnly?: boolean; match: (k: string) => boolean }[] = [
  { id: 'general', label: 'Général', match: (k) => /^(name|isActive|price|compareAtPrice|promo|currencyPrices)/.test(k) },
  { id: 'page', label: 'Page de vente', match: (k) => k === 'description' || (k.startsWith('content.') && !k.startsWith('content.gallery')) },
  { id: 'media', label: 'Médias', match: (k) => /^(coverImage|thumbnail|content\.gallery)/.test(k) },
  { id: 'delivery', label: 'Livraison', match: (k) => /^(delivery|sku|trackInventory|stock|weightGrams|variantLabel|variants)/.test(k) },
  { id: 'offers', label: 'Offres', physicalOnly: true, match: (k) => k.startsWith('offers') },
  { id: 'payment', label: 'Paiement', match: (k) => /^(payment|externalProductId)/.test(k) },
]

function emptyForm(type: ProductType): Form {
  return {
    type,
    name: '',
    isActive: false,
    description: '',
    price: 0,
    compareAtPrice: null,
    costPrice: null,
    currencyPrices: [],
    promo: { type: 'none', value: 0, display: 'strikethrough' },
    offers: [],
    coverImage: null,
    thumbnail: null,
    content: productContentSchema.parse({}),
    payment: { method: type === 'physical' ? 'cod' : 'native', integration: null },
    delivery: type === 'digital' ? { type: 'file', filePath: null } : null,
    externalProductId: null,
    sku: null,
    trackInventory: false,
    stock: null,
    weightGrams: null,
    variantLabel: null,
    variants: [],
  }
}

function fromProduct(p: Product): Form {
  const content = productContentSchema.safeParse(p.content ?? {})
  // Tolère d'anciens produits dont le paiement n'a pas encore la forme { method, integration }.
  const payment = p.payment && 'method' in p.payment ? p.payment : emptyForm(p.type).payment
  return {
    type: p.type,
    name: p.name,
    isActive: p.isActive,
    description: p.description ?? '',
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    costPrice: p.costPrice ?? null,
    currencyPrices: p.currencyPrices ?? [],
    promo: p.promo ?? { type: 'none', value: 0, display: 'strikethrough' },
    offers: p.offers ?? [],
    coverImage: p.coverImage,
    thumbnail: p.thumbnail,
    content: content.success ? content.data : productContentSchema.parse({}),
    payment,
    delivery: p.type === 'digital' ? (p.delivery ?? { type: 'file', filePath: null }) : null,
    externalProductId: p.externalProductId,
    sku: p.sku,
    trackInventory: p.trackInventory,
    stock: p.stock,
    weightGrams: p.weightGrams,
    variantLabel: p.variantLabel,
    variants: p.variants.map((v) => ({ id: v.id, name: v.name, sku: v.sku, price: v.price, costPrice: v.costPrice ?? null, stock: v.stock, isActive: v.isActive })),
  }
}

/** Nettoie l'état du formulaire avant validation (champs vides → null). */
function toPayload(f: Form): Form {
  const video = f.content.video && f.content.video.url.trim() ? f.content.video : null
  return {
    ...f,
    content: { ...f.content, video, features: f.content.features.filter((x) => x.trim()) },
    delivery: f.type === 'digital' ? f.delivery : null,
    offers: f.type === 'physical' ? f.offers : [],
    payment: f.type === 'digital' && f.payment.method === 'cod' ? { method: 'native', integration: null } : f.payment,
  }
}

function Editor({ initial, productId }: { initial: Form; productId: string | null }) {
  const storeId = useStoreId()
  const currency = useCurrency()
  const navigate = useNavigate()
  const toast = useToast()
  const save = useSaveProduct()
  const canEdit = useCan('products.edit')
  const storeKind = useCurrentStore().store?.kind ?? null
  const [form, setForm] = useState<Form>(initial)
  const [saved, setSaved] = useState(() => JSON.stringify(initial))
  const [errors, setErrors] = useState<Errors>({})
  const [tab, setTab] = useState<Tab>('general')
  const leaving = useRef(false)
  // Lecture seule (closer…) : jamais « non enregistré », pas de blocage à la sortie.
  const dirty = canEdit && JSON.stringify(form) !== saved

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload((e) => {
    if (dirty) e.preventDefault()
  })

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))
  const switchType = (type: ProductType) => {
    if (type === form.type) return
    set({
      type,
      delivery: type === 'digital' ? { type: 'file', filePath: null } : null,
      payment: type === 'digital' && form.payment.method === 'cod' ? { method: 'native', integration: null } : form.payment,
    })
    if (type === 'digital' && tab === 'offers') setTab('general')
  }

  const tabs = TABS.filter((t) => !t.physicalOnly || form.type === 'physical')
  const tabErrors = useMemo(() => {
    const keys = Object.keys(errors)
    return Object.fromEntries(tabs.map((t) => [t.id, keys.some(t.match)])) as Record<Tab, boolean>
  }, [errors, tabs])

  const submit = () => {
    const payload = toPayload(form)
    const v = validate(productInputSchema, payload)
    if (v.errors) {
      setErrors(v.errors)
      const first = tabs.find((t) => Object.keys(v.errors).some(t.match))
      if (first) setTab(first.id)
      toast.error('Certains champs sont à corriger')
      return
    }
    setErrors({})
    save.mutate(
      { id: productId, body: v.data },
      {
        onSuccess: (p) => {
          const next = fromProduct(p)
          setForm(next)
          setSaved(JSON.stringify(next))
          toast.success(productId ? 'Produit enregistré' : 'Produit créé')
          if (!productId) {
            leaving.current = true
            navigate(`/stores/${storeId}/products/${p.id}`, { replace: true })
          }
        },
        onError: (err) => {
          const fe = serverErrors(err)
          if (fe) {
            setErrors(fe)
            const first = tabs.find((t) => Object.keys(fe).some(t.match))
            if (first) setTab(first.id)
            toast.error('Le serveur a refusé certains champs')
          } else toast.error(err)
        },
      },
    )
  }

  // Ctrl/Cmd + S pour enregistrer.
  const submitRef = useRef(submit)
  submitRef.current = submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        submitRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const props: SectionProps = { form, set, errors, currency }

  return (
    <>
      <div className="mb-4">
        <Link to={`/stores/${storeId}/products`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> Produits
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl">{form.name.trim() || (productId ? 'Produit' : 'Nouveau produit')}</h1>
          <div className="flex items-center gap-2">
            {dirty && <Badge tone="amber">Non enregistré</Badge>}
            {!canEdit && <Badge>Lecture seule</Badge>}
            <div className={canEdit ? 'hidden sm:block' : 'hidden'}>
              <Button variant="primary" onClick={submit} loading={save.isPending}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Le type suit la boutique ; le sélecteur n'apparaît que pour un ancien produit d'un autre type. */}
        {storeKind && form.type === storeKind ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-[13px] text-muted">
            {form.type === 'physical' ? <Box className="size-4" /> : <FileDown className="size-4" />} Produit {form.type === 'physical' ? 'physique' : 'digital'}
          </span>
        ) : (
        <Segmented
          label="Type de produit"
          value={form.type}
          onChange={switchType}
          options={[
            {
              value: 'physical',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Box className="size-4" /> Physique
                </span>
              ),
            },
            {
              value: 'digital',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <FileDown className="size-4" /> Digital
                </span>
              ),
            },
          ]}
        />
        )}
      </div>

      <div className="scrollbar-none sticky top-14 z-20 -mx-4 mb-4 overflow-x-auto border-b border-line bg-bg/95 px-4 backdrop-blur sm:mx-0 sm:px-0 lg:top-0" role="tablist" aria-label="Sections">
        <div className="flex w-max gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx('relative px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors', tab === t.id ? 'text-fg' : 'text-muted hover:text-fg')}
            >
              {t.label}
              {tabErrors[t.id] && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-red-500 align-middle" aria-label="contient des erreurs" />}
              {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="pb-20 sm:pb-0">
        {tab === 'general' && <GeneralSection {...props} />}
        {tab === 'page' && <SalesPageSection {...props} />}
        {tab === 'media' && <MediaSection {...props} />}
        {tab === 'delivery' && <DeliverySection {...props} />}
        {tab === 'offers' && form.type === 'physical' && <OffersSection {...props} />}
        {tab === 'payment' && (
          <>
            <PaymentSection {...props} />
            <OrderFormSection {...props} />
          </>
        )}
      </div>

      {/* Barre d'enregistrement mobile, au-dessus de la navigation basse */}
      <div className={cx('fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 p-3 backdrop-blur sm:hidden', !canEdit && 'hidden')}>
        <Button variant="primary" size="lg" className="w-full" onClick={submit} loading={save.isPending}>
          {dirty ? 'Enregistrer les modifications' : 'Enregistrer'}
        </Button>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Quitter sans enregistrer ?"
        message="Vos modifications seront perdues."
        confirmLabel="Quitter"
        danger
      />
    </>
  )
}

export default function ProductEditor() {
  const { productId } = useParams()
  const id = productId ?? null
  const { data, error, isPending, refetch } = useProduct(id)
  const { store } = useCurrentStore()

  // Nouveau produit : du type de la boutique (une boutique vend du physique OU du digital).
  if (id === null) return <Editor key="new" initial={emptyForm(store?.kind ?? 'physical')} productId={null} />
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  return <Editor key={data.id} initial={fromProduct(data)} productId={data.id} />
}
