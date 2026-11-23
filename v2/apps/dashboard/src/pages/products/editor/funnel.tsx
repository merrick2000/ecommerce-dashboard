/**
 * Pack de produits et tunnel de vente (order bump, upsells / offres de repli, page de remerciement).
 * Les offres pointent vers d'autres produits de la boutique ; le prix spécial est fixé ici et revérifié par l'API.
 */
import type { FunnelOffer } from '@zuri/shared'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, Input, Select, Switch, Textarea } from '@/components/ui'
import { useCan, useStoreId } from '@/hooks/auth'
import { useProducts } from '@/hooks/resources'
import { api } from '@/lib/api'
import { currencyLabel, isoDay, money } from '@/lib/format'
import type { ProductListItem } from '@/lib/types'
import { NumberField } from './fields'
import type { Form, SectionProps } from './sections'

type Upsell = NonNullable<Form['funnel']>['upsells'][number]
const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`
const emptyFunnel = (): NonNullable<Form['funnel']> => ({ bump: null, upsells: [], thankYou: null })

function useCatalog(selfId: string | null, type: Form['type']) {
  const products = useProducts()
  const list = (products.data ?? []).filter((p) => p.id !== selfId && p.type === type)
  return { list, byId: new Map(list.map((p) => [p.id, p])) }
}

function ProductSelect({ value, onChange, list, label = 'Produit', error }: { value: string; onChange: (id: string) => void; list: ProductListItem[]; label?: string; error?: string }) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      hint={(() => {
        const name = list.find((p) => p.id === value)?.name
        return name && name.length > 52 ? name : undefined
      })()}
      options={[{ value: '', label: list.length ? 'Choisir un produit…' : 'Crée d’abord un autre produit' }, ...list.map((p) => ({ value: p.id, title: p.name, label: p.name, meta: `${p.isActive ? '' : 'Inactif · '}${money(p.price.effective, p.price.currency)}` }))]}
    />
  )
}

/** Une offre (bump, upsell, repli) : produit, prix spécial, titre, texte, libellés des boutons. */
function OfferFields({ offer, onChange, list, currency, errorPrefix, errors, buttons = true }: { offer: FunnelOffer; onChange: (o: FunnelOffer) => void; list: ProductListItem[]; currency: string; errorPrefix: string; errors: SectionProps['errors']; buttons?: boolean }) {
  const regular = list.find((p) => p.id === offer.productId)?.price.effective
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ProductSelect
        value={offer.productId}
        list={list}
        error={errors[`${errorPrefix}.productId`]}
        onChange={(productId) => {
          const p = list.find((x) => x.id === productId)
          onChange({ ...offer, productId, price: offer.price || (p ? Math.round(p.price.effective * 0.7) : 0), title: offer.title || (p ? `Ajoute ${p.name}` : '') })
        }}
      />
      <NumberField label="Prix spécial" value={offer.price} onChange={(v) => onChange({ ...offer, price: v ?? 0 })} suffix={currencyLabel(currency)} error={errors[`${errorPrefix}.price`]} hint={regular ? `Prix normal : ${money(regular, currency)}` : undefined} />
      <Input label="Titre" value={offer.title} onChange={(e) => onChange({ ...offer, title: e.target.value })} maxLength={120} error={errors[`${errorPrefix}.title`]} placeholder="Ex. Ajoute la brosse démêlante à -30 %" wrapClass="sm:col-span-2" />
      <Textarea label="Texte" optional rows={2} value={offer.text} onChange={(e) => onChange({ ...offer, text: e.target.value })} maxLength={600} placeholder="Pourquoi le prendre maintenant, en une ou deux phrases." wrapClass="sm:col-span-2" />
      {buttons && (
        <>
          <Input label="Bouton oui" optional value={offer.acceptLabel} onChange={(e) => onChange({ ...offer, acceptLabel: e.target.value })} maxLength={60} placeholder="Oui, j’ajoute à ma commande" />
          <Input label="Bouton non" optional value={offer.declineLabel} onChange={(e) => onChange({ ...offer, declineLabel: e.target.value })} maxLength={80} placeholder="Non merci, je passe" />
        </>
      )}
    </div>
  )
}

const blankOffer = (prefix: string): FunnelOffer => ({ id: newId(prefix), productId: '', variantId: null, price: 0, title: '', text: '', image: null, acceptLabel: '', declineLabel: '' })

// ─── Pack ────────────────────────────────────────────────────────────────────

export function BundleSection({ form, set, errors, currency, productId }: SectionProps & { productId: string | null }) {
  const { list, byId } = useCatalog(productId, form.type)
  const items = form.bundle?.items ?? []
  const on = items.length > 0 || form.bundle !== null
  const separate = items.reduce((a, i) => a + (byId.get(i.productId)?.price.effective ?? 0) * i.quantity, 0)
  const setItems = (next: typeof items) => set({ bundle: { items: next } })
  return (
    <Card title="Pack de produits" description="Vends plusieurs produits ensemble à un prix de pack. Le stock et le prix d’achat de chaque produit sont pris en compte.">
      <Switch
        checked={on}
        onChange={(v) => set({ bundle: v ? { items: [{ productId: '', variantId: null, quantity: 1 }, { productId: '', variantId: null, quantity: 1 }] } : null })}
        label="Ce produit est un pack"
        description={form.type === 'digital' ? 'Ex. 3 ebooks : chaque fichier est livré après paiement.' : 'Ex. perruque + bonnet + brosse : le stock de chaque produit est réservé.'}
      />
      {on && (
        <div className="mt-4 space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
              <ProductSelect label={`Produit ${i + 1}`} value={it.productId} list={list} error={errors[`bundle.items.${i}.productId`]} onChange={(productId) => setItems(items.map((x, k) => (k === i ? { ...x, productId } : x)))} />
              <NumberField label="Quantité" value={it.quantity} onChange={(v) => setItems(items.map((x, k) => (k === i ? { ...x, quantity: Math.max(1, Math.min(50, v ?? 1)) } : x)))} />
              <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, k) => k !== i))} aria-label="Retirer du pack" disabled={items.length <= 2}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {errors['bundle.items'] && <p className="text-[13px] text-red-600">{errors['bundle.items']}</p>}
          <Button size="sm" onClick={() => setItems([...items, { productId: '', variantId: null, quantity: 1 }])} disabled={items.length >= 20}>
            <Plus className="size-4" /> Ajouter un produit
          </Button>
          {separate > 0 && (
            <p className="rounded-lg bg-surface-2 p-3 text-[13px]">
              Valeur séparée : <strong>{money(separate, currency)}</strong>
              {form.price > 0 && separate > form.price ? (
                <>
                  {' '}· le client économise <strong>{money(separate - form.price, currency)}</strong> ({Math.round(((separate - form.price) / separate) * 100)} %). Affiché sur la page de vente.
                </>
              ) : (
                ' · fixe un prix de pack plus bas pour afficher l’économie.'
              )}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── Tunnel ──────────────────────────────────────────────────────────────────

function FunnelStats({ productId, currency }: { productId: string; currency: string }) {
  const storeId = useStoreId()
  const from = isoDay(new Date(Date.now() - 29 * 86400_000))
  const to = isoDay(new Date())
  const q = useQuery({
    queryKey: ['store', storeId, 'stats', 'funnel', productId, from],
    queryFn: () =>
      api.get<{ ordersWithFunnel: number; bump: { offered: number; accepted: number; rate: number | null; revenueBooked: number | null }; offers: { id: string; title: string; role: string; accepted: number; declined: number; rate: number | null }[]; revenue: { booked: number | null } }>(`/stores/${storeId}/stats/funnel`, { from, to, productId }),
  })
  if (!q.data || !q.data.ordersWithFunnel) return <p className="text-sm text-muted">Pas encore de commande avec ce tunnel sur les 30 derniers jours.</p>
  const d = q.data
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="text-[12px] text-muted">Order bump accepté</p>
          <p className="text-lg font-semibold">{d.bump.rate != null ? `${d.bump.rate} %` : '-'}</p>
          <p className="text-[12px] text-muted">
            {d.bump.accepted} sur {d.bump.offered}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <p className="text-[12px] text-muted">Chiffre ajouté par le tunnel</p>
          <p className="text-lg font-semibold">{d.revenue.booked != null ? money(d.revenue.booked, currency) : '-'}</p>
          <p className="text-[12px] text-muted">hors annulées et retours</p>
        </div>
      </div>
      {d.offers.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {d.offers.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <Badge>{o.role === 'downsell' ? 'Repli' : 'Upsell'}</Badge>
              <span className="min-w-0 flex-1 truncate">{o.title}</span>
              <span className="tabular text-muted">
                {o.accepted} oui · {o.declined} non
              </span>
              <span className="tabular w-14 text-right font-semibold">{o.rate != null ? `${o.rate} %` : '-'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function FunnelSection({ form, set, errors, currency, productId }: SectionProps & { productId: string | null }) {
  const { list } = useCatalog(null, form.type)
  const canStats = useCan('stats.view')
  const f = form.funnel ?? emptyFunnel()
  const setF = (patch: Partial<NonNullable<Form['funnel']>>) => {
    const next = { ...f, ...patch }
    set({ funnel: !next.bump && !next.upsells.length && !next.thankYou ? null : next })
  }
  const setUpsell = (i: number, u: Upsell) => setF({ upsells: f.upsells.map((x, k) => (k === i ? u : x)) })
  const isCod = form.payment?.method === 'cod'
  return (
    <div className="space-y-4">
      <Card title="Order bump" description="Une case à cocher sur le formulaire : « Ajoute aussi… ». Le client l’ajoute en un geste, sans quitter la page.">
        <Switch checked={!!f.bump} onChange={(v) => setF({ bump: v ? blankOffer('bump') : null })} label="Proposer un order bump" />
        {f.bump && (
          <div className="mt-4">
            <OfferFields offer={f.bump} onChange={(bump) => setF({ bump })} list={list} currency={currency} errorPrefix="funnel.bump" errors={errors} buttons={false} />
          </div>
        )}
      </Card>

      <Card
        title="Offres après la commande"
        description={
          isCod
            ? 'Juste après la commande, une offre en un clic. En paiement à la livraison, le produit s’ajoute à la même commande : le livreur encaisse le tout.'
            : 'Juste après la commande, avant le paiement : le produit s’ajoute à la commande et le client paie le tout en une fois.'
        }
      >
        <div className="space-y-4">
          {f.upsells.map((u, i) => (
            <div key={u.id} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Offre {i + 1}</p>
                <Button variant="ghost" size="icon" onClick={() => setF({ upsells: f.upsells.filter((_, k) => k !== i) })} aria-label="Supprimer l’offre">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <OfferFields offer={u} onChange={(o) => setUpsell(i, { ...u, ...o })} list={list} currency={currency} errorPrefix={`funnel.upsells.${i}`} errors={errors} />
              <div className="mt-4 border-t border-line pt-4">
                <Switch checked={!!u.downsell} onChange={(v) => setUpsell(i, { ...u, downsell: v ? blankOffer('down') : null })} label="Offre de repli si le client refuse" description="Ex. un produit moins cher, ou le même à un prix plus bas." />
                {u.downsell && (
                  <div className="mt-3 rounded-lg bg-surface-2 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[13px] text-muted">
                      <ArrowDown className="size-3.5" /> Proposée seulement si l’offre {i + 1} est refusée
                    </p>
                    <OfferFields offer={u.downsell} onChange={(d) => setUpsell(i, { ...u, downsell: d })} list={list} currency={currency} errorPrefix={`funnel.upsells.${i}.downsell`} errors={errors} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {f.upsells.length < 3 && (
            <Button onClick={() => setF({ upsells: [...f.upsells, { ...blankOffer('up'), downsell: null }] })}>
              <Plus className="size-4" /> Ajouter une offre
            </Button>
          )}
          {form.payment?.method === 'integration' && <p className="text-[13px] text-amber-700 dark:text-amber-400">Paiement sur une plateforme externe : les offres après commande ne s’affichent pas (le client quitte la page pour payer).</p>}
        </div>
      </Card>

      <Card title="Page de remerciement" description="Un bouton d’action après la commande : groupe WhatsApp, chaîne, autre produit… Le titre et le message se règlent dans le formulaire de commande (onglet Paiement).">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Texte du bouton" optional value={f.thankYou?.buttonLabel ?? ''} onChange={(e) => setF({ thankYou: e.target.value || f.thankYou?.buttonUrl ? { buttonLabel: e.target.value, buttonUrl: f.thankYou?.buttonUrl ?? '' } : null })} maxLength={60} placeholder="Rejoins le groupe WhatsApp" error={errors['funnel.thankYou.buttonLabel']} />
          <Input label="Lien du bouton" optional type="url" value={f.thankYou?.buttonUrl ?? ''} onChange={(e) => setF({ thankYou: e.target.value || f.thankYou?.buttonLabel ? { buttonLabel: f.thankYou?.buttonLabel ?? '', buttonUrl: e.target.value } : null })} placeholder="https://chat.whatsapp.com/…" error={errors['funnel.thankYou.buttonUrl']} />
        </div>
      </Card>

      {productId && canStats && (form.funnel?.bump || form.funnel?.upsells.length) ? (
        <Card title="Résultats du tunnel" description="30 derniers jours, commandes de ce produit.">
          <FunnelStats productId={productId} currency={currency} />
        </Card>
      ) : null}
    </div>
  )
}
