/**
 * Popups marketing : liste (ordre de priorité, résultats, test), modèles prêts à l'emploi,
 * éditeur complet (moments multiples, message, image, offre, bouton, design libre, ciblage)
 * avec un aperçu fidèle téléphone / ordinateur (même rendu que la page de vente : @zuri/shared/popup-render).
 */
import { MKT_TRIGGERS, popupDesignSchema, popupTriggers, type MarketingPopup, type MktTrigger, type PopupDesign, type PopupTrigger } from '@zuri/shared'
import { POPUP_CSS, POPUP_TEXTS, popupInnerHtml, popupRootClass, popupRootStyle, type RenderPopup } from '@zuri/shared/popup-render'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ChevronDown, Copy, ExternalLink, Maximize2, Monitor, MousePointerClick, Pencil, Plus, ShoppingBag, Smartphone, Tag, Trash2, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Dialog } from '@/components/Dialog'
import { Button, cx, Field, Input, Segmented, Select, Switch, Textarea } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { useProducts, usePromoCodes } from '@/hooks/resources'
import { api } from '@/lib/api'
import { money } from '@/lib/format'
import { storefrontProductUrl } from '@/lib/storefront'
import { ImageUpload, NumberField } from '../products/editor/fields'

type P = MarketingPopup
const MAX = 10
const MAX_TRIGGERS = 5
const newId = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0')
const DEFAULT_DESIGN: PopupDesign = popupDesignSchema.parse({})

export const TRIGGER: Record<MktTrigger, { label: string; short: string; hint: string; unit?: 's' | '%'; def: number }> = {
  exit: { label: 'Quand il veut quitter la page', short: 'veut partir', hint: 'Souris qui file vers la fermeture sur ordinateur, remontée rapide sur téléphone.', def: 0 },
  delay: { label: 'Après un temps sur la page', short: 'temps sur la page', hint: 'Après le nombre de secondes choisi.', unit: 's', def: 15 },
  scroll: { label: 'Après avoir lu une partie de la page', short: 'a lu la page', hint: 'Quand il a fait défiler ce pourcentage de la page.', unit: '%', def: 60 },
  idle: { label: 'Quand il ne fait plus rien', short: 'inactif', hint: 'Aucun mouvement pendant le nombre de secondes choisi.', unit: 's', def: 25 },
  form_abandon: { label: 'Formulaire commencé mais pas envoyé', short: 'formulaire abandonné', hint: 'Il a commencé à remplir puis s’arrête, ou veut partir.', unit: 's', def: 20 },
  cta_no_order: { label: 'Arrivé au formulaire sans le remplir', short: 'hésite au formulaire', hint: 'Il a cliqué sur Commander ou vu le formulaire, sans rien remplir.', unit: 's', def: 25 },
  return_visit: { label: 'Quand il revient sur la page', short: 'visiteur de retour', hint: 'Deuxième visite (ou plus) de ce visiteur sur ce produit.', unit: 's', def: 3 },
  tab_return: { label: 'Quand il revient sur l’onglet', short: 'revient sur l’onglet', hint: 'Il était parti ailleurs (WhatsApp, un autre site) et revient.', def: 0 },
}
const triggerSummary = (p: P) => {
  const list = popupTriggers(p)
  return list.map((t) => TRIGGER[t.type].short + (TRIGGER[t.type].unit ? ` ${t.value}${TRIGGER[t.type].unit === '%' ? ' %' : ' s'}` : '')).join(p.triggerMode === 'all' ? ' et ' : ' ou ')
}

const BASE: Omit<P, 'id' | 'name' | 'title'> = {
  enabled: true,
  trigger: 'exit',
  value: 0,
  triggers: [],
  triggerMode: 'any',
  design: DEFAULT_DESIGN,
  image: 'product',
  autoApply: true,
  countdown: 'none',
  countdownMinutes: 15,
  collectPhone: false,
  ctaAction: 'order',
  layout: 'center',
  theme: 'light',
  teaser: true,
  devices: 'all',
  frequency: 'day',
  scope: 'all',
  productIds: [],
}

const TEMPLATES: { key: string; label: string; hint: string; make: Partial<P> & Pick<P, 'name' | 'title'> }[] = [
  { key: 'exit', label: 'Avant de partir', hint: 'Une réduction au moment où il quitte la page, avec compte à rebours.', make: { name: 'Avant de partir', trigger: 'exit', title: 'Attendez ! Une réduction rien que pour vous', text: 'Profitez-en maintenant, cette offre ne dure pas.', countdown: 'minutes', countdownMinutes: 15, ctaText: 'J’en profite' } },
  { key: 'form', label: 'Formulaire commencé', hint: 'Il a commencé à commander puis s’arrête : on l’aide à terminer.', make: { name: 'Formulaire abandonné', trigger: 'form_abandon', value: 20, title: 'Plus qu’une étape pour recevoir votre commande', text: 'Terminez maintenant : vous ne payez qu’à la livraison.', ctaText: 'Terminer ma commande', layout: 'bottom', image: 'none' } },
  { key: 'phone', label: 'Code contre numéro WhatsApp', hint: 'Il laisse son numéro pour voir le code : vous pouvez le relancer ensuite.', make: { name: 'Numéro WhatsApp', trigger: 'exit', collectPhone: true, title: 'Débloquez votre réduction', text: 'Laissez votre numéro WhatsApp et recevez votre code tout de suite.', ctaText: 'Commander avec ma réduction' } },
  { key: 'return', label: 'Visiteur de retour', hint: 'Il revient sur la page : il hésite, un petit cadeau le décide.', make: { name: 'Visiteur de retour', trigger: 'return_visit', value: 3, title: 'Content de vous revoir !', text: 'Pour votre retour, voici un petit cadeau sur votre commande.', frequency: 'week' } },
  { key: 'hesitate', label: 'Hésitation', hint: 'Arrivé au formulaire sans le remplir : on lui propose de poser sa question.', make: { name: 'Hésitation', trigger: 'cta_no_order', value: 25, title: 'Une question avant de commander ?', text: 'Écrivez-nous sur WhatsApp, on vous répond tout de suite.', ctaAction: 'whatsapp', ctaText: 'Poser ma question', layout: 'side', image: 'none' } },
  { key: 'reader', label: 'Lecteur intéressé', hint: 'Il a lu une bonne partie de la page depuis un moment : on le rassure.', make: { name: 'Lecteur intéressé', triggers: [{ type: 'scroll', value: 60 }, { type: 'delay', value: 30 }], triggerMode: 'all', trigger: 'scroll', value: 60, title: 'Livraison rapide, paiement à la réception', text: 'Commandez aujourd’hui, vous payez seulement quand vous recevez votre colis.', layout: 'side', ctaText: 'Commander maintenant' } },
  { key: 'back', label: 'Retour sur l’onglet', hint: 'Il était parti voir ailleurs et revient : on relance son attention.', make: { name: 'Retour sur l’onglet', trigger: 'tab_return', title: 'Toujours intéressé ?', text: 'Votre produit vous attend. Les stocks partent vite.', layout: 'bottom' } },
  { key: 'blank', label: 'Partir de zéro', hint: 'Une popup vide, à régler comme vous voulez.', make: { name: 'Nouvelle popup', trigger: 'delay', value: 15, title: 'Votre titre ici' } },
]

type Stats = Record<string, { views: number; clicks: number; leads: number; orders: number }>

export function MarketingPopupsEditor({ value, onChange, accent }: { value: P[]; onChange: (v: P[]) => void; accent?: string }) {
  const { store, storeId } = useCurrentStore()
  const { data: products } = useProducts()
  const stats = useQuery({ queryKey: ['store', storeId, 'marketing-popups', 'stats'], queryFn: () => api.get<Stats>(`/stores/${storeId}/marketing-popups/stats`), staleTime: 60_000 })
  const [editing, setEditing] = useState<P | null>(null)
  const [picking, setPicking] = useState(false)
  const list = value ?? []
  const save = (p: P) => {
    onChange(list.some((x) => x.id === p.id) ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p].slice(0, MAX))
    setEditing(null)
  }
  const move = (i: number, d: -1 | 1) => {
    const next = [...list]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x!)
    onChange(next)
  }
  const testUrl = (p: P) => {
    const pid = p.scope === 'selected' ? p.productIds[0] : (products?.find((x) => x.isActive)?.id ?? products?.[0]?.id)
    return store?.slug && pid ? `${storefrontProductUrl(store.slug, pid)}?zuri_popup=${p.id}&notrack` : null
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">
        Un message qui s’ouvre au bon moment : quand le visiteur veut partir, hésite, a commencé à commander… Ajoutez un code promo, un compte à rebours, ou demandez son numéro WhatsApp. Une seule popup s’ouvre par visite : la première de la liste dont le moment arrive. Jamais après une commande.
      </p>

      {list.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {list.map((p, i) => {
            const st = stats.data?.[p.id]
            const url = testUrl(p)
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-muted hover:text-fg disabled:opacity-30" aria-label="Monter (plus prioritaire)">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded p-0.5 text-muted hover:text-fg disabled:opacity-30" aria-label="Descendre">
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-muted">
                    <span className="first-letter:uppercase">{triggerSummary(p)}</span>
                    {p.promoCode && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Tag className="size-3" /> {p.promoCode}
                      </span>
                    )}
                    {p.scope === 'selected' && <span>{p.productIds.length} produit{p.productIds.length > 1 ? 's' : ''}</span>}
                  </p>
                  {st && (
                    <p className="mt-1 flex flex-wrap gap-x-3 text-[12px] text-muted">
                      <span>
                        <strong className="text-fg">{st.views}</strong> vues
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className="size-3" />
                        <strong className="text-fg">{st.clicks}</strong> clics
                      </span>
                      {p.collectPhone && (
                        <span>
                          <strong className="text-fg">{st.leads}</strong> numéros
                        </span>
                      )}
                      {p.promoCode && (
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="size-3" />
                          <strong className="text-fg">{st.orders}</strong> commandes avec le code
                        </span>
                      )}
                      <span>30 derniers jours</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={p.enabled} onChange={(enabled) => onChange(list.map((x) => (x.id === p.id ? { ...x, enabled } : x)))} label={<span className="sr-only">Activer {p.name}</span>} />
                  {url && (
                    <a href={url} target="_blank" rel="noopener" className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg" title="Tester sur la page (enregistrez d’abord)" aria-label="Tester sur la page">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  <button type="button" onClick={() => setEditing(p)} className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Modifier" title="Modifier">
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => list.length < MAX && onChange([...list, { ...p, id: newId(), name: `${p.name} (copie)`.slice(0, 60), enabled: false }])}
                    disabled={list.length >= MAX}
                    className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-30"
                    aria-label="Dupliquer"
                    title="Dupliquer"
                  >
                    <Copy className="size-4" />
                  </button>
                  <button type="button" onClick={() => window.confirm(`Supprimer la popup « ${p.name} » ?`) && onChange(list.filter((x) => x.id !== p.id))} className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-red-600" aria-label="Supprimer" title="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Button onClick={() => setPicking(true)} disabled={list.length >= MAX}>
        <Plus className="size-4" /> Nouvelle popup
      </Button>
      {list.length > 0 && <p className="text-[12px] text-muted">Le bouton de test ouvre la popup tout de suite sur la page de vente (pensez à enregistrer avant). Les flèches changent la priorité.</p>}

      {picking && (
        <Dialog open onClose={() => setPicking(false)} title="Choisir un modèle" size="lg">
          <div className="grid gap-2 sm:grid-cols-2">
            {TEMPLATES.map((tp) => (
              <button
                key={tp.key}
                type="button"
                onClick={() => {
                  setPicking(false)
                  const draft: P = { ...BASE, value: TRIGGER[tp.make.trigger ?? 'exit'].def, ...tp.make, id: newId() }
                  setEditing({ ...draft, triggers: popupTriggers(draft) })
                }}
                className="rounded-xl border border-line p-3 text-left hover:border-accent hover:bg-accent/5"
              >
                <span className="block font-semibold">{tp.label}</span>
                <span className="mt-0.5 block text-[12.5px] text-muted">{tp.hint}</span>
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {editing && <PopupDialog initial={editing} accent={accent} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  )
}

/** Section repliable de l'éditeur (accordéon), avec un résumé quand elle est fermée. */
function Section({ title, summary, defaultOpen = false, children }: { title: string; summary?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-xl border border-line">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{title}</span>
          {!open && summary && <span className="block truncate text-[12.5px] text-muted">{summary}</span>}
        </span>
        <ChevronDown className={cx('size-4 shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      <div className={cx('grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="space-y-3 border-t border-line px-3.5 py-4">{children}</div>
        </div>
      </div>
    </section>
  )
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v?: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <input type="color" aria-label={label} value={value ?? '#ffffff'} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 cursor-pointer rounded-lg border border-line-strong bg-surface p-1" />
        <span className={cx('font-mono text-[12.5px]', value ? 'text-fg' : 'text-muted')}>{value ?? 'Thème'}</span>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="rounded p-1 text-muted hover:text-fg" aria-label={`Couleur du thème pour ${label}`} title="Revenir à la couleur du thème">
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </Field>
  )
}

function PopupDialog({ initial, accent, onClose, onSave }: { initial: P; accent?: string; onClose: () => void; onSave: (p: P) => void }) {
  const { storeId, store } = useCurrentStore()
  const { data: products } = useProducts()
  const promos = usePromoCodes().list.data
  const [p, setP] = useState<P>({ ...initial, triggers: popupTriggers(initial), design: { ...DEFAULT_DESIGN, ...initial.design } })
  const [err, setErr] = useState<string | null>(null)
  const set = (patch: Partial<P>) => setP((x) => ({ ...x, ...patch }))
  const setD = (patch: Partial<PopupDesign>) => setP((x) => ({ ...x, design: { ...x.design, ...patch } }))
  const d = p.design
  const cur = store?.currency ?? 'XOF'
  const now = Date.now()
  const promo = promos?.find((x) => x.code === p.promoCode)
  const promoProblem = promo
    ? !promo.isActive
      ? 'Ce code est désactivé : il ne sera pas montré.'
      : promo.endsAt && Date.parse(promo.endsAt) < now
        ? 'Ce code a expiré : il ne sera pas montré.'
        : promo.maxUses != null && promo.usedCount >= promo.maxUses
          ? 'Ce code a atteint son nombre maximum d’utilisations.'
          : null
    : p.promoCode
      ? 'Ce code n’existe plus.'
      : null
  const promoLabel = promo ? (promo.type === 'percentage' ? `-${promo.value}%` : `-${money(promo.value, cur)}`) : null
  const productImage = (p.scope === 'selected' ? products?.find((x) => x.id === p.productIds[0]) : products?.[0])?.thumbnail ?? null
  const imageSrc = p.image === 'custom' ? (p.imageUrl ?? null) : p.image === 'product' ? productImage : null
  const triggers = p.triggers
  const setTrigger = (i: number, patch: Partial<PopupTrigger>) => set({ triggers: triggers.map((t, k) => (k === i ? { ...t, ...patch } : t)) })

  const submit = () => {
    if (!p.name.trim()) return setErr('Donnez un nom à la popup.')
    if (!p.title.trim()) return setErr('Le titre est obligatoire.')
    if (!triggers.length) return setErr('Choisissez au moins un moment.')
    if (p.ctaAction === 'url' && !/^https?:\/\/\S+$/.test(p.ctaUrl ?? '')) return setErr('Entrez une adresse web complète pour le bouton (https://…).')
    if (p.scope === 'selected' && !p.productIds.length) return setErr('Choisissez au moins un produit, ou « Tous les produits ».')
    if (p.image === 'custom' && !p.imageUrl) return setErr('Ajoutez votre image, ou choisissez « Photo du produit ».')
    if (p.collectPhone && !p.promoCode) return setErr('La demande de numéro sert à débloquer un code : choisissez un code promo.')
    const clean = triggers.map((t) => ({ type: t.type, value: TRIGGER[t.type].unit ? t.value : 0 }))
    onSave({ ...p, name: p.name.trim(), title: p.title.trim(), triggers: clean, trigger: clean[0]!.type, value: clean[0]!.value })
  }

  const render: RenderPopup = {
    id: p.id,
    title: p.title || 'Votre titre',
    text: p.text,
    image: p.image,
    imageSrc,
    promo: p.promoCode && !promoProblem && promoLabel ? { code: p.promoCode, label: promoLabel, endsAt: promo?.endsAt ?? null, minText: promo?.minSubtotal ? `Dès ${money(promo.minSubtotal, cur)} d’achat` : null } : null,
    collectPhone: p.collectPhone,
    countdown: p.countdown,
    ctaText: p.ctaText,
    ctaAction: p.ctaAction,
    dismissText: p.dismissText,
    layout: p.layout,
    theme: p.theme,
    design: d,
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={initial.title ? `Popup : ${initial.name}` : 'Nouvelle popup'}
      size="xl"
      footer={
        <>
          {err && <p className="mr-auto text-sm text-red-600">{err}</p>}
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={submit}>
            Valider la popup
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-3">
          <Input label="Nom (pour vous seulement)" value={p.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />

          <Section title="Quand l’afficher" summary={triggerSummary(p)} defaultOpen>
            {triggers.map((t, i) => (
              <div key={i} className="rounded-lg bg-surface-2/60 p-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Select
                      label={triggers.length > 1 ? `Moment ${i + 1}` : 'Moment'}
                      value={t.type}
                      onChange={(e) => setTrigger(i, { type: e.target.value as MktTrigger, value: TRIGGER[e.target.value as MktTrigger].def })}
                      options={MKT_TRIGGERS.map((x) => ({ value: x, label: TRIGGER[x].label }))}
                      hint={TRIGGER[t.type].hint}
                    />
                  </div>
                  {triggers.length > 1 && (
                    <button type="button" onClick={() => set({ triggers: triggers.filter((_, k) => k !== i) })} className="mt-7 rounded-md p-2 text-muted hover:bg-surface hover:text-red-600" aria-label="Retirer ce moment">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                {TRIGGER[t.type].unit && (
                  <NumberField
                    label={TRIGGER[t.type].unit === '%' ? 'Partie de la page lue' : t.type === 'form_abandon' ? 'Secondes sans écrire' : t.type === 'return_visit' ? 'Secondes après son arrivée' : 'Secondes'}
                    value={t.value}
                    onChange={(v) => setTrigger(i, { value: Math.min(TRIGGER[t.type].unit === '%' ? 100 : 600, Math.max(0, v ?? TRIGGER[t.type].def)) })}
                    suffix={TRIGGER[t.type].unit}
                    wrapClass="mt-3 sm:max-w-xs"
                  />
                )}
              </div>
            ))}
            {triggers.length < MAX_TRIGGERS && (
              <button type="button" onClick={() => set({ triggers: [...triggers, { type: triggers.some((x) => x.type === 'delay') ? 'scroll' : 'delay', value: triggers.some((x) => x.type === 'delay') ? 60 : 15 }] })} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-accent hover:bg-accent/10">
                <Plus className="size-4" /> Ajouter un moment
              </button>
            )}
            {triggers.length > 1 && (
              <Segmented
                showLabel
                label="La popup s’ouvre…"
                value={p.triggerMode}
                onChange={(triggerMode) => set({ triggerMode })}
                options={[
                  { value: 'any', label: 'Dès que l’un arrive' },
                  { value: 'all', label: 'Quand tous sont arrivés' },
                ]}
              />
            )}
            {triggers.length > 1 && (
              <p className="text-[12px] text-muted">
                {p.triggerMode === 'all' ? 'Exemple : « a lu 60 % de la page » et « 30 secondes sur la page » : elle s’ouvre quand les deux sont vrais, dans n’importe quel ordre.' : 'Elle s’ouvre au premier de ces moments qui arrive.'}
              </p>
            )}
          </Section>

          <Section title="Message" summary={p.title}>
            <Input label="Titre" value={p.title} maxLength={90} onChange={(e) => set({ title: e.target.value })} />
            <Textarea label="Texte" optional rows={3} value={p.text ?? ''} maxLength={300} onChange={(e) => set({ text: e.target.value || undefined })} hint="Les retours à la ligne sont gardés." />
          </Section>

          <Section title="Image" summary={p.image === 'none' ? 'Sans image' : `${p.image === 'product' ? 'Photo du produit' : 'Mon image'} · ${d.imageFit === 'contain' ? 'entière' : 'recadrée'} · ${d.imagePosition === 'top' ? 'en haut' : d.imagePosition === 'left' ? 'à gauche' : 'en fond'}`}>
            <Segmented
              showLabel
              label="Image"
              value={p.image}
              onChange={(image) => set({ image })}
              options={[
                { value: 'product', label: 'Photo du produit' },
                { value: 'custom', label: 'Mon image' },
                { value: 'none', label: 'Aucune image' },
              ]}
            />
            {p.image === 'custom' && <ImageUpload preset="content" label="Votre image" value={p.imageUrl ?? null} onChange={(v) => set({ imageUrl: v ?? undefined })} aspect="video" hint="Une affiche, un visuel promo : elle s’affiche en entier si vous choisissez « Image entière »." />}
            {p.image !== 'none' && (
              <>
                <Segmented
                  showLabel
                  label="Affichage"
                  value={d.imageFit}
                  onChange={(imageFit) => setD({ imageFit })}
                  options={[
                    { value: 'contain', label: 'Image entière' },
                    { value: 'cover', label: 'Recadrée pour remplir' },
                  ]}
                />
                <Segmented
                  showLabel
                  label="Position"
                  value={d.imagePosition}
                  onChange={(imagePosition) => setD({ imagePosition })}
                  options={[
                    { value: 'top', label: 'En haut' },
                    { value: 'left', label: 'À gauche (ordinateur)' },
                    { value: 'background', label: 'En fond, texte par-dessus' },
                  ]}
                />
              </>
            )}
          </Section>

          <Section title="Offre" summary={[p.promoCode ? `Code ${p.promoCode}` : 'Sans code', p.countdown !== 'none' ? 'compte à rebours' : '', p.collectPhone ? 'numéro WhatsApp demandé' : ''].filter(Boolean).join(' · ')}>
            <Select
              label="Code promo"
              value={p.promoCode ?? ''}
              onChange={(e) => set({ promoCode: e.target.value || undefined, ...(e.target.value ? {} : { collectPhone: false, countdown: p.countdown === 'promo_end' ? 'none' : p.countdown }) })}
              options={[{ value: '', label: 'Aucun code' }, ...(promos ?? []).map((x) => ({ value: x.code, label: `${x.code} (${x.type === 'percentage' ? `-${x.value}%` : `-${money(x.value, cur)}`})${x.isActive ? '' : ', désactivé'}` }))]}
              hint={
                <>
                  Vérifié à chaque visite : désactivé, expiré ou épuisé, il n’est pas montré.{' '}
                  <Link to={`/stores/${storeId}/marketing?tab=promos`} target="_blank" className="font-medium text-accent hover:underline">
                    Créer un code promo
                  </Link>
                </>
              }
            />
            {promoProblem && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{promoProblem}</p>}
            {p.promoCode && (
              <>
                <Switch checked={p.autoApply} onChange={(autoApply) => set({ autoApply })} label="Appliquer le code automatiquement" description="Au clic sur le bouton, le code est mis dans le formulaire : le client n’a rien à taper." />
                <Switch checked={p.collectPhone} onChange={(collectPhone) => set({ collectPhone })} label="Demander son numéro WhatsApp pour voir le code" description="Le numéro rejoint vos paniers à relancer, même s’il ne commande pas tout de suite." />
                <Switch checked={p.teaser} onChange={(teaser) => set({ teaser })} label="Rappel du code après fermeture" description="Une petite pastille reste dans un coin de l’écran : un clic rouvre la popup." />
              </>
            )}
            <Segmented
              showLabel
              label="Compte à rebours"
              value={p.countdown}
              onChange={(countdown) => set({ countdown })}
              options={[
                { value: 'none', label: 'Aucun' },
                { value: 'minutes', label: 'Durée par visiteur' },
                ...(promo?.endsAt ? [{ value: 'promo_end' as const, label: 'Fin du code promo' }] : []),
              ]}
            />
            {p.countdown === 'minutes' && <NumberField label="Durée pour chaque visiteur" value={p.countdownMinutes} onChange={(v) => set({ countdownMinutes: Math.min(1440, Math.max(1, v ?? 15)) })} suffix="min" wrapClass="sm:max-w-xs" hint="Elle ne repart pas si le visiteur revient." />}
          </Section>

          <Section title="Bouton" summary={`${p.ctaText || (p.ctaAction === 'order' ? 'J’en profite' : 'Continuer')} · ${p.ctaAction === 'order' ? 'va au formulaire' : p.ctaAction === 'whatsapp' ? 'ouvre WhatsApp' : p.ctaAction === 'url' ? 'ouvre un lien' : 'ferme'}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Texte du bouton" optional value={p.ctaText ?? ''} maxLength={40} placeholder={p.ctaAction === 'order' ? 'J’en profite' : 'Continuer'} onChange={(e) => set({ ctaText: e.target.value || undefined })} />
              <Input label="Lien pour refuser" optional value={p.dismissText ?? ''} maxLength={40} placeholder="Non merci" onChange={(e) => set({ dismissText: e.target.value || undefined })} />
            </div>
            <Segmented
              showLabel
              label="Le bouton…"
              value={p.ctaAction}
              onChange={(ctaAction) => set({ ctaAction })}
              options={[
                { value: 'order', label: 'Va au formulaire' },
                { value: 'whatsapp', label: 'Ouvre WhatsApp' },
                { value: 'url', label: 'Ouvre un lien' },
                { value: 'close', label: 'Ferme' },
              ]}
            />
            {p.ctaAction === 'whatsapp' && <p className="text-[12px] text-muted">Utilise le numéro du bouton WhatsApp du produit. Sans ce bouton, il mène au formulaire.</p>}
            {p.ctaAction === 'url' && <Input label="Adresse" value={p.ctaUrl ?? ''} placeholder="https://…" onChange={(e) => set({ ctaUrl: e.target.value || undefined })} />}
          </Section>

          <Section title="Design" summary={`${p.layout === 'center' ? 'Au centre' : p.layout === 'bottom' ? 'En bas' : 'Dans un coin'} · ${p.theme === 'light' ? 'clair' : p.theme === 'dark' ? 'sombre' : 'couleur de la boutique'} · téléphone : ${d.mobileLayout === 'bottom' ? 'panneau en bas' : d.mobileLayout === 'center' ? 'au centre' : 'plein écran'}`}>
            <Segmented showLabel label="Position sur ordinateur" value={p.layout} onChange={(layout) => set({ layout })} options={[{ value: 'center', label: 'Au centre' }, { value: 'bottom', label: 'En bas' }, { value: 'side', label: 'Dans un coin' }]} />
            <Segmented showLabel label="Sur téléphone" value={d.mobileLayout} onChange={(mobileLayout) => setD({ mobileLayout })} options={[{ value: 'bottom', label: 'Panneau en bas' }, { value: 'center', label: 'Au centre' }, { value: 'fullscreen', label: 'Plein écran' }]} />
            <Segmented showLabel label="Thème" value={p.theme} onChange={(theme) => set({ theme })} options={[{ value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }, { value: 'accent', label: 'Couleur de la boutique' }]} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ColorField label="Fond" value={d.bg} onChange={(bg) => setD({ bg })} />
              <ColorField label="Texte" value={d.fg} onChange={(fg) => setD({ fg })} />
              <ColorField label="Bouton" value={d.btnBg} onChange={(btnBg) => setD({ btnBg })} />
              <ColorField label="Texte du bouton" value={d.btnFg} onChange={(btnFg) => setD({ btnFg })} />
              <ColorField label="Pastille de réduction" value={d.badgeBg} onChange={(badgeBg) => setD({ badgeBg })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Largeur" value={d.width} onChange={(e) => setD({ width: e.target.value as PopupDesign['width'] })} options={[{ value: 'sm', label: 'Étroite' }, { value: 'md', label: 'Moyenne' }, { value: 'lg', label: 'Large' }]} />
              <Select label="Taille du titre" value={d.titleSize} onChange={(e) => setD({ titleSize: e.target.value as PopupDesign['titleSize'] })} options={[{ value: 'sm', label: 'Petit' }, { value: 'md', label: 'Moyen' }, { value: 'lg', label: 'Grand' }]} />
              <Select label="Alignement du texte" value={d.align} onChange={(e) => setD({ align: e.target.value as PopupDesign['align'] })} options={[{ value: 'center', label: 'Centré' }, { value: 'left', label: 'À gauche' }]} />
              <Select label="Forme du bouton" value={d.btnShape} onChange={(e) => setD({ btnShape: e.target.value as PopupDesign['btnShape'] })} options={[{ value: 'rounded', label: 'Arrondi' }, { value: 'pill', label: 'Pilule' }, { value: 'square', label: 'Carré' }]} />
              <Select label="Animation d’ouverture" value={d.animation} onChange={(e) => setD({ animation: e.target.value as PopupDesign['animation'] })} options={[{ value: 'slide', label: 'Glisse' }, { value: 'fade', label: 'Fondu' }, { value: 'zoom', label: 'Zoom' }, { value: 'none', label: 'Aucune' }]} />
              <NumberField label="Arrondi des coins" value={d.radius} onChange={(v) => setD({ radius: Math.min(40, Math.max(0, v ?? 18)) })} suffix="px" />
              <NumberField label="Assombrissement du fond" value={d.overlay} onChange={(v) => setD({ overlay: Math.min(90, Math.max(0, v ?? 50)) })} suffix="%" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Switch checked={d.showBadge} onChange={(showBadge) => setD({ showBadge })} label="Pastille de réduction" />
              <Switch checked={d.showClose} onChange={(showClose) => setD({ showClose })} label="Croix de fermeture" />
              <Switch checked={d.showDismiss} onChange={(showDismiss) => setD({ showDismiss })} label="Lien « Non merci »" />
            </div>
            {!d.showClose && !d.showDismiss && <p className="text-[12px] text-amber-700 dark:text-amber-300">Sans croix ni lien de refus, le visiteur ferme avec Échap ou en touchant le fond. Gardez au moins l’un des deux sur téléphone.</p>}
            <Textarea label="CSS libre (avancé)" optional rows={3} value={d.customCss ?? ''} maxLength={4000} onChange={(e) => setD({ customCss: e.target.value || undefined })} placeholder=".mkp-title { letter-spacing: -0.02em } .mkp-cta { text-transform: uppercase }" hint="Pour aller plus loin : classes .mkp-card, .mkp-title, .mkp-text, .mkp-cta, .mkp-badge, .mkp-img." className="font-mono text-[12.5px]" />
          </Section>

          <Section title="Pour qui" summary={`${p.devices === 'all' ? 'Téléphone et ordinateur' : p.devices === 'mobile' ? 'Téléphone' : 'Ordinateur'} · une fois par ${p.frequency === 'session' ? 'visite' : p.frequency === 'day' ? 'jour' : p.frequency === 'week' ? 'semaine' : 'visiteur'} · ${p.scope === 'all' ? 'tous les produits' : `${p.productIds.length} produit(s)`}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Appareils" value={p.devices} onChange={(e) => set({ devices: e.target.value as P['devices'] })} options={[{ value: 'all', label: 'Téléphone et ordinateur' }, { value: 'mobile', label: 'Téléphone seulement' }, { value: 'desktop', label: 'Ordinateur seulement' }]} />
              <Select label="Pas plus d’une fois par" value={p.frequency} onChange={(e) => set({ frequency: e.target.value as P['frequency'] })} options={[{ value: 'session', label: 'Visite' }, { value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }, { value: 'once', label: 'Une seule fois en tout' }]} />
            </div>
            <Segmented showLabel label="Produits" value={p.scope} onChange={(scope) => set({ scope })} options={[{ value: 'all', label: 'Tous les produits' }, { value: 'selected', label: 'Produits choisis' }]} />
            {p.scope === 'selected' && (
              <Field label="Produits concernés" hint="Chaque produit peut aussi masquer toutes les popups (onglet Page de vente du produit).">
                <div className="flex flex-wrap gap-1.5">
                  {(products ?? []).map((x) => {
                    const on = p.productIds.includes(x.id)
                    return (
                      <button key={x.id} type="button" title={x.name} onClick={() => set({ productIds: on ? p.productIds.filter((i) => i !== x.id) : [...p.productIds, x.id] })} className={cx('max-w-full truncate rounded-full border px-3 py-1.5 text-[13px]', on ? 'border-accent bg-accent/10 font-medium' : 'border-line text-muted hover:text-fg')}>
                        {x.name.length > 34 ? `${x.name.slice(0, 32)}…` : x.name}
                      </button>
                    )
                  })}
                </div>
              </Field>
            )}
          </Section>
        </div>

        <div className="lg:sticky lg:top-0 lg:self-start">
          <PopupPreview popup={render} accent={accent} />
        </div>
      </div>
    </Dialog>
  )
}

/** Couleur de texte lisible sur la couleur de la boutique. */
const onAccent = (hex?: string) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!m) return '#111111'
  const n = parseInt(m[1]!, 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b! > 0.45 ? '#111111' : '#ffffff'
}

/** Page de test : le vrai rendu de la popup sur une fausse page de vente. */
function previewDoc(popup: RenderPopup, accent?: string) {
  const a = /^#[0-9a-f]{6}$/i.test(accent ?? '') ? accent! : '#f59e0b'
  const inner = popupInnerHtml(popup, POPUP_TEXTS.fr, { stage: popup.collectPhone && popup.promo ? 'phone' : 'code', dial: '229', cdText: popup.countdown !== 'none' ? '14 min 59 s' : undefined })
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--accent:${a};--on-accent:${onAccent(a)};--page:#fff;--fg:#111827;--muted:#6b7280;--line:#e5e7eb;--radius-btn:12px}
html,body{margin:0;height:100%;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#fff;color:#111827}
.fake{max-width:1100px;margin:0 auto;padding:20px;display:grid;gap:14px}.fake i{display:block;border-radius:12px;background:#eceef1}
@media(min-width:768px){.fake{grid-template-columns:1.3fr 1fr}}
${POPUP_CSS}
</style></head><body><div class="fake"><i style="height:260px"></i><div style="display:grid;gap:12px"><i style="height:26px;width:80%"></i><i style="height:18px;width:45%"></i><i style="height:50px;background:${a}"></i><i style="height:120px"></i></div></div>
<div class="${popupRootClass(popup)} mkp-in" style="${popupRootStyle(popup)}">${inner}</div></body></html>`
}

function PopupPreview({ popup, accent }: { popup: RenderPopup; accent?: string }) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [big, setBig] = useState(false)
  const doc = useMemo(() => previewDoc(popup, accent), [popup, accent])
  const size = device === 'mobile' ? { w: 390, h: 680 } : { w: 1280, h: 800 }
  const scale = 320 / size.w
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Aperçu</p>
        <div className="flex items-center gap-1">
          <Segmented
            label="Appareil de l’aperçu"
            value={device}
            onChange={setDevice}
            options={[
              { value: 'mobile', label: <Smartphone className="size-4" aria-label="Téléphone" /> },
              { value: 'desktop', label: <Monitor className="size-4" aria-label="Ordinateur" /> },
            ]}
          />
          <button type="button" onClick={() => setBig(true)} className="rounded-md p-2 text-muted hover:bg-surface-2 hover:text-fg" title="Voir en grand" aria-label="Voir en grand">
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface-2" style={{ width: 320, height: size.h * scale }}>
        <iframe title="Aperçu de la popup" srcDoc={doc} sandbox="" style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0, pointerEvents: 'none' }} />
      </div>
      <p className="mt-1.5 text-[12px] text-muted">{device === 'mobile' ? 'Téléphone' : 'Ordinateur'} : exactement le rendu de la page de vente.</p>
      {big &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex flex-col bg-black/80 p-3 sm:p-6" role="dialog" aria-label="Aperçu en grand">
            <div className="mb-3 flex items-center justify-between gap-2 text-white">
              <Segmented
                label="Appareil de l’aperçu"
                value={device}
                onChange={setDevice}
                options={[
                  { value: 'mobile', label: 'Téléphone' },
                  { value: 'desktop', label: 'Ordinateur' },
                ]}
              />
              <button type="button" onClick={() => setBig(false)} className="rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label="Fermer l’aperçu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <iframe title="Aperçu en grand" srcDoc={doc} sandbox="" className="h-full rounded-xl border-0 bg-white" style={{ width: device === 'mobile' ? 390 : '100%', maxHeight: device === 'mobile' ? 844 : undefined }} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
