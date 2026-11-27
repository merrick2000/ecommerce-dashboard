/**
 * Popup de ventes récentes : apparence (style, position, aperçu en direct), texte du message,
 * messages ajoutés rapidement (lignes compactes, clavier, liste collée, génération par l'IA).
 */
import type { CheckoutSettings } from '@zuri/shared'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Plus, Sparkles, Trash2, Type, X } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast'
import { Button, cx, Field, Input, Segmented, Select, Switch, Textarea } from '@/components/ui'
import { useCurrentStore, useMe } from '@/hooks/auth'
import { useProducts, useZones } from '@/hooks/resources'
import { api } from '@/lib/api'
import type { Errors } from '@/lib/form'
import { NumberField } from '../products/editor/fields'

type Popup = CheckoutSettings['salesPopup']
type Entry = NonNullable<Popup['entries']>[number]
const MAX = 30

const STYLES: { id: Popup['style']; label: string; hint: string }[] = [
  { id: 'card', label: 'Carte', hint: 'Avec la photo du produit' },
  { id: 'minimal', label: 'Discret', hint: 'Petit et léger' },
  { id: 'pill', label: 'Pastille', hint: 'Une ligne arrondie' },
  { id: 'dark', label: 'Sombre', hint: 'Fond foncé, bien visible' },
]

const short = (s: string, n = 46) => (s.length > n ? `${s.slice(0, n - 2).trimEnd()}…` : s)

/** Aperçu de la popup avec le style choisi et le premier message. */
function Preview({ popup, entry, image }: { popup: Popup; entry?: Entry; image?: string | null }) {
  const name = entry?.firstName || 'Awa'
  const city = entry?.city || 'Cotonou'
  const product = short(entry?.product || 'Votre produit')
  const tpl = entry?.text || popup.template
  const msg = tpl ? tpl.replace(/\{prenom\}/gi, name).replace(/\{ville\}/gi, city).replace(/\{produit\}/gi, product) : null
  const style = popup.style ?? 'card'
  return (
    <div className={cx('flex min-h-[92px] items-end rounded-xl bg-surface-2 p-3', (popup.position ?? 'left') === 'right' ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'flex max-w-[300px] items-center gap-2.5 border shadow-md',
          style === 'card' && 'rounded-2xl border-line bg-surface px-3 py-2.5 text-sm',
          style === 'minimal' && 'rounded-lg border-line bg-surface px-3 py-2 text-[12.5px]',
          style === 'pill' && 'rounded-full border-accent/50 bg-surface px-4 py-2 text-[13px]',
          style === 'dark' && 'rounded-2xl border-gray-900 bg-gray-900 px-3 py-2.5 text-sm text-gray-50',
        )}
      >
        {style === 'card' && (image ? <img src={image} alt="" className="size-11 shrink-0 rounded-lg object-cover" /> : <span className="size-11 shrink-0 rounded-lg bg-surface-2" />)}
        <div className="min-w-0">
          <p className={cx('leading-snug', style === 'pill' ? 'line-clamp-1' : 'line-clamp-2')}>{msg ?? <><strong>{name}</strong> de {city} vient de commander « {product} »</>}</p>
          {style !== 'pill' && <p className={cx('text-[11.5px]', style === 'dark' ? 'text-gray-300' : 'text-muted')}>{entry ? popup.recentLabel || 'récemment' : 'il y a 5 min'}</p>}
        </div>
      </div>
    </div>
  )
}

export function SalesPopupEditor({ value, onChange, errors }: { value: Popup; onChange: (p: Popup) => void; errors: Errors }) {
  const { data: products } = useProducts()
  const zones = useZones().list.data
  const { data: me } = useMe()
  const entries = value.entries ?? []
  const set = (patch: Partial<Popup>) => onChange({ ...value, ...patch })
  const setEntries = (next: Entry[]) => set({ entries: next.slice(0, MAX) })
  const cities = [...new Set((zones ?? []).flatMap((z) => z.cities ?? []))].filter(Boolean)
  const firstProduct = products?.[0]
  const [paste, setPaste] = useState(false)
  const [ai, setAi] = useState(false)
  const focusRow = (i: number) => requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-popup-first="${i}"]`)?.focus())

  const add = (focus = true) => {
    if (entries.length >= MAX) return
    const prev = entries.at(-1)
    // Nouveau message : même produit et même ville que le précédent, on ne change que le prénom.
    const p = (prev && products?.find((x) => x.id === prev.productId || x.name === prev.product)) ?? firstProduct
    setEntries([...entries, { firstName: '', city: prev?.city, product: p?.name ?? prev?.product ?? '', productId: p?.id }])
    if (focus) focusRow(entries.length)
  }
  const update = (i: number, patch: Partial<Entry>) => setEntries(entries.map((e, k) => (k === i ? { ...e, ...patch } : e)))
  const productImage = (id?: string) => products?.find((p) => p.id === id)?.thumbnail ?? null

  return (
    <div className="space-y-5">
      <Switch checked={value.enabled} onChange={(enabled) => set({ enabled })} label="Afficher la popup sur les pages de vente" description="Vos vraies commandes récentes, puis les messages ci-dessous. Chaque produit peut aussi l’activer ou la masquer (onglet Page de vente)." />

      <Field label="Apparence">
        <div className="grid gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Style de la popup">
          {STYLES.map((st) => (
            <button
              key={st.id}
              type="button"
              role="radio"
              aria-checked={value.style === st.id}
              onClick={() => set({ style: st.id })}
              className={cx('rounded-lg border p-2.5 text-left text-sm', value.style === st.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-line hover:bg-surface-2')}
            >
              <span className="block font-semibold">{st.label}</span>
              <span className="block text-[12px] text-muted">{st.hint}</span>
            </button>
          ))}
        </div>
      </Field>
      <div className="flex flex-wrap items-end gap-4">
        <Segmented showLabel label="Position" value={value.position ?? 'left'} onChange={(position) => set({ position })} options={[{ value: 'left', label: 'En bas à gauche' }, { value: 'right', label: 'En bas à droite' }]} />
        <NumberField label="Une popup toutes les" value={value.intervalSeconds} onChange={(v) => set({ intervalSeconds: v ?? 20 })} suffix="s" wrapClass="w-44" error={errors['salesPopup.intervalSeconds']} />
      </div>
      <Preview popup={value} entry={entries[0]} image={productImage(entries[0]?.productId) ?? firstProduct?.thumbnail} />

      <Input
        label="Texte du message"
        optional
        value={value.template ?? ''}
        onChange={(e) => set({ template: e.target.value || undefined })}
        maxLength={160}
        placeholder="{prenom} de {ville} vient de commander « {produit} »"
        hint="Repères : {prenom}, {ville}, {produit}. Les noms de produits trop longs sont raccourcis automatiquement."
      />

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">
            Messages <span className="text-muted">({entries.length}/{MAX})</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {me?.features.urlImport && (
              <Button size="sm" onClick={() => setAi(true)} disabled={entries.length >= MAX}>
                <Sparkles className="size-4" /> Générer avec l’IA
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setPaste(true)} disabled={entries.length >= MAX}>
              <ClipboardList className="size-4" /> Coller une liste
            </Button>
            {entries.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => window.confirm('Retirer tous les messages ?') && setEntries([])}>
                Tout retirer
              </Button>
            )}
          </div>
        </div>
        <datalist id="popup-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
        {entries.length > 0 && (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {entries.map((e, i) => (
              <EntryRow
                key={i}
                entry={e}
                index={i}
                products={products ?? []}
                errors={errors}
                onChange={(patch) => update(i, patch)}
                onRemove={() => setEntries(entries.filter((_, k) => k !== i))}
                onEnterLast={() => (i === entries.length - 1 ? add() : focusRow(i + 1))}
              />
            ))}
          </ul>
        )}
        <button type="button" onClick={() => add()} disabled={entries.length >= MAX} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-40">
          <Plus className="size-4" /> Ajouter un message
        </button>
        <p className="mt-1 text-[12px] text-muted">Astuce : Entrée passe au message suivant et en crée un nouveau à la fin.</p>
      </div>

      {entries.length > 0 && (
        <Input label="Moment affiché sous vos messages" optional value={value.recentLabel ?? ''} onChange={(e) => set({ recentLabel: e.target.value || undefined })} maxLength={40} placeholder="récemment" wrapClass="sm:max-w-xs" />
      )}
      <RecentSalesCount />

      {paste && (
        <PasteDialog
          products={products ?? []}
          room={MAX - entries.length}
          onClose={() => setPaste(false)}
          onAdd={(list) => {
            setEntries([...entries, ...list])
            setPaste(false)
          }}
        />
      )}
      {ai && (
        <AiDialog
          products={products ?? []}
          room={MAX - entries.length}
          onClose={() => setAi(false)}
          onAdd={(list, replace) => {
            setEntries(replace ? list : [...entries, ...list])
            setAi(false)
          }}
        />
      )}
    </div>
  )
}

type ProductLite = { id: string; name: string; thumbnail: string | null }

/** Une ligne compacte : prénom, ville, produit ; texte libre sur demande. */
function EntryRow({ entry, index, products, errors, onChange, onRemove, onEnterLast }: { entry: Entry; index: number; products: ProductLite[]; errors: Errors; onChange: (p: Partial<Entry>) => void; onRemove: () => void; onEnterLast: () => void }) {
  const [showText, setShowText] = useState(Boolean(entry.text))
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnterLast()
    }
  }
  const options = products.map((p) => ({ value: p.id, label: short(p.name, 40) }))
  // Anciens messages sans identifiant : produit retrouvé par son nom.
  const current = products.find((p) => p.id === entry.productId) ?? products.find((p) => p.name === entry.product)
  const known = Boolean(current)
  return (
    <li className="space-y-2 p-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
        <Input data-popup-first={index} aria-label={`Prénom du message ${index + 1}`} placeholder="Prénom" value={entry.firstName} onChange={(e) => onChange({ firstName: e.target.value })} onKeyDown={enter} error={errors[`salesPopup.entries.${index}.firstName`]} />
        <Input aria-label="Ville" placeholder="Ville" list="popup-cities" value={entry.city ?? ''} onChange={(e) => onChange({ city: e.target.value || undefined })} onKeyDown={enter} />
        <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto" title={entry.product}>
          <Select
            aria-label="Produit"
            value={current?.id ?? ''}
            onChange={(e) => {
              const p = products.find((x) => x.id === e.target.value)
              if (p) onChange({ productId: p.id, product: p.name })
            }}
            options={[...(known ? [] : [{ value: '', label: entry.product ? short(entry.product, 40) : 'Choisir un produit' }]), ...options]}
          />
        </div>
        <div className="flex items-start gap-0.5">
          <button type="button" onClick={() => setShowText((v) => !v)} className={cx('rounded-md p-2 hover:bg-surface-2', showText || entry.text ? 'text-accent' : 'text-muted')} aria-label="Texte libre" title="Texte libre pour ce message">
            <Type className="size-4" />
          </button>
          <button type="button" onClick={onRemove} className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-red-600" aria-label="Retirer ce message" title="Retirer">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {showText && <Input aria-label="Texte libre" placeholder="Texte libre, ex. {prenom} a pris 2 boîtes" value={entry.text ?? ''} onChange={(e) => onChange({ text: e.target.value || undefined })} maxLength={160} />}
    </li>
  )
}

/** Plusieurs messages d'un coup : une ligne par message, « Prénom, Ville ». */
function PasteDialog({ products, room, onClose, onAdd }: { products: ProductLite[]; room: number; onClose: () => void; onAdd: (e: Entry[]) => void }) {
  const [text, setText] = useState('')
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, room)
  const product = products.find((p) => p.id === productId)
  const parsed: Entry[] = lines.map((l, i) => {
    const [firstName = '', city] = l.split(/\s*[,;|]\s*|\s+-\s+/)
    // « Tous les produits » : chaque message prend le produit suivant, à tour de rôle.
    const p = product ?? products[i % Math.max(products.length, 1)]
    return { firstName: firstName.slice(0, 40), city: city?.slice(0, 60) || undefined, product: p?.name ?? '', productId: p?.id }
  })
  return (
    <Dialog
      open
      onClose={onClose}
      title="Coller une liste"
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" disabled={!parsed.length} onClick={() => onAdd(parsed.filter((e) => e.firstName && e.product))}>
            Ajouter {parsed.length || ''} message{parsed.length > 1 ? 's' : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Textarea label="Une ligne par message : Prénom, Ville" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Awa, Cotonou\nKoffi, Abomey-Calavi\nFatou, Porto-Novo'} />
        <Select label="Produit" value={productId} onChange={(e) => setProductId(e.target.value)} options={[...products.map((p) => ({ value: p.id, label: short(p.name, 48) })), { value: '', label: 'Tous les produits, à tour de rôle' }]} />
        <p className="text-[12px] text-muted">{room < 30 ? `Encore ${room} message${room > 1 ? 's' : ''} possible${room > 1 ? 's' : ''}.` : 'Jusqu’à 30 messages.'}</p>
      </div>
    </Dialog>
  )
}

/** Messages générés par l'IA d'après vos consignes, à relire avant de les ajouter. */
function AiDialog({ products, room, onClose, onAdd }: { products: ProductLite[]; room: number; onClose: () => void; onAdd: (e: Entry[], replace: boolean) => void }) {
  const storeId = useCurrentStore().store?.id
  const toast = useToast()
  const [count, setCount] = useState(String(Math.min(10, Math.max(room, 1))))
  const [selected, setSelected] = useState<string[]>([])
  const [instructions, setInstructions] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Entry[] | null>(null)
  const generate = async () => {
    setBusy(true)
    try {
      setResult(await api.post<Entry[]>(`/stores/${storeId}/sales-popup/generate`, { count: Number(count), instructions: instructions.trim() || undefined, productIds: selected.length ? selected : undefined }))
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  return (
    <Dialog
      open
      onClose={onClose}
      title="Générer des messages avec l’IA"
      size="md"
      footer={
        result ? (
          <>
            <Button onClick={() => setResult(null)}>Recommencer</Button>
            <Button onClick={() => onAdd(result, true)}>Remplacer les messages</Button>
            <Button variant="primary" onClick={() => onAdd(result.slice(0, room), false)} disabled={room <= 0}>
              Ajouter {Math.min(result.length, room)} message{result.length > 1 ? 's' : ''}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Annuler</Button>
            <Button variant="primary" loading={busy} onClick={() => void generate()}>
              <Sparkles className="size-4" /> Générer
            </Button>
          </>
        )
      }
    >
      {result ? (
        <ul className="max-h-[50vh] divide-y divide-line overflow-auto rounded-lg border border-line text-sm">
          {result.map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <strong>{e.firstName}</strong>
                {e.city ? ` · ${e.city}` : ''}
                <span className="block truncate text-[12px] text-muted" title={e.product}>
                  {e.text || e.product}
                </span>
              </span>
              <button type="button" onClick={() => setResult(result.filter((_, k) => k !== i))} className="rounded-md p-1 text-muted hover:bg-surface-2" aria-label="Retirer">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <Select label="Nombre de messages" value={count} onChange={(e) => setCount(e.target.value)} options={['5', '10', '15', '20', '30'].map((n) => ({ value: n, label: n }))} />
          <Field label="Produits" hint="Aucun choisi : tous les produits de la boutique.">
            <div className="flex flex-wrap gap-1.5">
              {products.map((p) => (
                <button key={p.id} type="button" onClick={() => toggle(p.id)} title={p.name} className={cx('max-w-full truncate rounded-full border px-3 py-1.5 text-[13px]', selected.includes(p.id) ? 'border-accent bg-accent/10 font-medium' : 'border-line text-muted hover:text-fg')}>
                  {short(p.name, 34)}
                </button>
              ))}
            </div>
          </Field>
          <Textarea label="Consignes" optional rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={600} placeholder="Ex. prénoms du Bénin, surtout des femmes, villes : Cotonou, Calavi, Porto-Novo. Quelques messages du style « a pris 2 formations »." />
        </div>
      )}
    </Dialog>
  )
}

/** Combien de messages la popup peut montrer maintenant (mêmes règles que la page de vente). */
function RecentSalesCount() {
  const slug = useCurrentStore().store?.slug
  const { data } = useQuery({ queryKey: ['recent-sales', slug], queryFn: () => api.get<unknown[]>(`/v1/stores/${slug}/recent-sales`), enabled: !!slug, staleTime: 60_000 })
  if (!data) return null
  return data.length ? (
    <p className="text-[13px] text-muted">
      <strong className="text-fg">{data.length}</strong> message{data.length > 1 ? 's' : ''} affichable{data.length > 1 ? 's' : ''} en ligne (commandes récentes et messages enregistrés).
    </p>
  ) : (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Rien d’affiché pour l’instant : ajoutez des messages et enregistrez, ou la popup montrera vos commandes confirmées, payées ou livrées des 14 derniers jours.</p>
  )
}
