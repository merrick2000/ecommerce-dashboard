/**
 * Popups marketing : liste (ordre de priorité, résultats, test), modèles prêts à l'emploi,
 * éditeur complet (déclencheur, contenu, code promo, compte à rebours, numéro WhatsApp, apparence, ciblage)
 * avec aperçu en direct.
 */
import { MKT_TRIGGERS, type MarketingPopup, type MktTrigger } from '@zuri/shared'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Copy, ExternalLink, MousePointerClick, Pencil, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
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
const newId = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0')

export const TRIGGER: Record<MktTrigger, { label: string; hint: string; unit?: 's' | '%'; def: number }> = {
  exit: { label: 'Quand il veut quitter la page', hint: 'Souris qui file vers la fermeture sur ordinateur, remontée rapide sur téléphone.', def: 0 },
  delay: { label: 'Après un temps sur la page', hint: 'S’ouvre après le nombre de secondes choisi.', unit: 's', def: 15 },
  scroll: { label: 'Après avoir lu une partie de la page', hint: 'S’ouvre quand il a fait défiler ce pourcentage de la page.', unit: '%', def: 60 },
  idle: { label: 'Quand il ne fait plus rien', hint: 'Aucun mouvement pendant le nombre de secondes choisi.', unit: 's', def: 25 },
  form_abandon: { label: 'Formulaire commencé mais pas envoyé', hint: 'Il a commencé à remplir le formulaire puis s’arrête (ou veut partir).', unit: 's', def: 20 },
  cta_no_order: { label: 'Arrivé au formulaire sans le remplir', hint: 'Il a cliqué sur Commander ou vu le formulaire, mais ne remplit rien.', unit: 's', def: 25 },
  return_visit: { label: 'Quand il revient sur la page', hint: 'Deuxième visite (ou plus) de ce visiteur sur ce produit.', unit: 's', def: 3 },
  tab_return: { label: 'Quand il revient sur l’onglet', hint: 'Il était parti voir ailleurs (WhatsApp, un autre site) et revient.', def: 0 },
}

const BASE: Omit<P, 'id' | 'name' | 'title'> = {
  enabled: true,
  trigger: 'exit',
  value: 0,
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
  {
    key: 'exit',
    label: 'Avant de partir',
    hint: 'Une réduction au moment où il quitte la page, avec compte à rebours.',
    make: { name: 'Avant de partir', trigger: 'exit', title: 'Attendez ! Une réduction rien que pour vous', text: 'Profitez-en maintenant, cette offre ne dure pas.', countdown: 'minutes', countdownMinutes: 15, ctaText: 'J’en profite' },
  },
  {
    key: 'form',
    label: 'Formulaire commencé',
    hint: 'Il a commencé à commander puis s’arrête : on l’aide à terminer.',
    make: { name: 'Formulaire abandonné', trigger: 'form_abandon', value: 20, title: 'Plus qu’une étape pour recevoir votre commande', text: 'Terminez maintenant : vous ne payez qu’à la livraison.', ctaText: 'Terminer ma commande', layout: 'bottom', image: 'none' },
  },
  {
    key: 'phone',
    label: 'Code contre numéro WhatsApp',
    hint: 'Il laisse son numéro pour voir le code : vous pouvez le relancer ensuite.',
    make: { name: 'Numéro WhatsApp', trigger: 'exit', collectPhone: true, title: 'Débloquez votre réduction', text: 'Laissez votre numéro WhatsApp et recevez votre code tout de suite.', ctaText: 'Commander avec ma réduction' },
  },
  {
    key: 'return',
    label: 'Visiteur de retour',
    hint: 'Il revient sur la page : il hésite, un petit cadeau le décide.',
    make: { name: 'Visiteur de retour', trigger: 'return_visit', value: 3, title: 'Content de vous revoir !', text: 'Pour votre retour, voici un petit cadeau sur votre commande.', frequency: 'week' },
  },
  {
    key: 'hesitate',
    label: 'Hésitation',
    hint: 'Arrivé au formulaire sans le remplir : on lui propose de poser sa question.',
    make: { name: 'Hésitation', trigger: 'cta_no_order', value: 25, title: 'Une question avant de commander ?', text: 'Écrivez-nous sur WhatsApp, on vous répond tout de suite.', ctaAction: 'whatsapp', ctaText: 'Poser ma question', layout: 'side', image: 'none' },
  },
  {
    key: 'reader',
    label: 'Lecteur intéressé',
    hint: 'Il a lu une bonne partie de la page : on le rassure.',
    make: { name: 'Lecteur intéressé', trigger: 'scroll', value: 60, title: 'Livraison rapide, paiement à la réception', text: 'Commandez aujourd’hui, vous payez seulement quand vous recevez votre colis.', layout: 'side', ctaText: 'Commander maintenant' },
  },
  {
    key: 'back',
    label: 'Retour sur l’onglet',
    hint: 'Il était parti voir ailleurs et revient : on relance son attention.',
    make: { name: 'Retour sur l’onglet', trigger: 'tab_return', title: 'Toujours intéressé ?', text: 'Votre produit vous attend. Les stocks partent vite.', layout: 'bottom' },
  },
  { key: 'blank', label: 'Partir de zéro', hint: 'Une popup vide, à régler comme vous voulez.', make: { name: 'Nouvelle popup', trigger: 'delay', value: 15, title: 'Votre titre ici' } },
]

type Stats = Record<string, { views: number; clicks: number; leads: number; orders: number }>

export function MarketingPopupsEditor({ value, onChange }: { value: P[]; onChange: (v: P[]) => void }) {
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
    const pid = p.scope === 'selected' ? p.productIds[0] : products?.find((x) => x.isActive)?.id ?? products?.[0]?.id
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
                    <span>{TRIGGER[p.trigger].label}</span>
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
                  setEditing({ ...BASE, value: TRIGGER[tp.make.trigger ?? 'exit'].def, ...tp.make, id: newId() })
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
      {editing && <PopupDialog initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[13px] font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  )
}

function PopupDialog({ initial, onClose, onSave }: { initial: P; onClose: () => void; onSave: (p: P) => void }) {
  const { storeId, store } = useCurrentStore()
  const { data: products } = useProducts()
  const promos = usePromoCodes().list.data
  const [p, setP] = useState<P>(initial)
  const [err, setErr] = useState<string | null>(null)
  const set = (patch: Partial<P>) => setP((x) => ({ ...x, ...patch }))
  const tr = TRIGGER[p.trigger]
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

  const submit = () => {
    if (!p.name.trim()) return setErr('Donnez un nom à la popup.')
    if (!p.title.trim()) return setErr('Le titre est obligatoire.')
    if (p.ctaAction === 'url' && !/^https?:\/\/\S+$/.test(p.ctaUrl ?? '')) return setErr('Entrez une adresse web complète pour le bouton (https://…).')
    if (p.scope === 'selected' && !p.productIds.length) return setErr('Choisissez au moins un produit, ou « Tous les produits ».')
    if (p.image === 'custom' && !p.imageUrl) return setErr('Ajoutez une image, ou choisissez « Photo du produit ».')
    if (p.collectPhone && !p.promoCode) return setErr('La demande de numéro sert à débloquer un code : choisissez un code promo.')
    onSave({ ...p, name: p.name.trim(), title: p.title.trim(), value: tr.unit ? p.value : 0 })
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="min-w-0 space-y-6">
          <Input label="Nom (pour vous seulement)" value={p.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />

          <Section title="Quand l’afficher">
            <Select label="Moment" value={p.trigger} onChange={(e) => set({ trigger: e.target.value as MktTrigger, value: TRIGGER[e.target.value as MktTrigger].def })} options={MKT_TRIGGERS.map((t) => ({ value: t, label: TRIGGER[t].label }))} hint={tr.hint} />
            {tr.unit && (
              <NumberField
                label={tr.unit === '%' ? 'Partie de la page lue' : p.trigger === 'form_abandon' ? 'Secondes sans écrire' : p.trigger === 'return_visit' ? 'Secondes après son arrivée' : 'Secondes'}
                value={p.value}
                onChange={(v) => set({ value: Math.min(tr.unit === '%' ? 100 : 600, Math.max(0, v ?? tr.def)) })}
                suffix={tr.unit}
                wrapClass="sm:max-w-xs"
              />
            )}
          </Section>

          <Section title="Message">
            <Input label="Titre" value={p.title} maxLength={90} onChange={(e) => set({ title: e.target.value })} />
            <Textarea label="Texte" optional rows={2} value={p.text ?? ''} maxLength={300} onChange={(e) => set({ text: e.target.value || undefined })} />
            <Segmented showLabel
              label="Image"
              value={p.image}
              onChange={(image) => set({ image })}
              options={[
                { value: 'product', label: 'Photo du produit' },
                { value: 'custom', label: 'Mon image' },
                { value: 'none', label: 'Aucune' },
              ]}
            />
            {p.image === 'custom' && <ImageUpload preset="content" label="Image de la popup" value={p.imageUrl ?? null} onChange={(v) => set({ imageUrl: v ?? undefined })} aspect="video" />}
          </Section>

          <Section title="Offre">
            <Select
              label="Code promo"
              value={p.promoCode ?? ''}
              onChange={(e) => set({ promoCode: e.target.value || undefined, ...(e.target.value ? {} : { collectPhone: false, countdown: p.countdown === 'promo_end' ? 'none' : p.countdown }) })}
              options={[{ value: '', label: 'Aucun code' }, ...(promos ?? []).map((x) => ({ value: x.code, label: `${x.code} (${x.type === 'percentage' ? `-${x.value}%` : `-${money(x.value, cur)}`})${x.isActive ? '' : ', désactivé'}` }))]}
              hint={
                <>
                  Le code est vérifié à chaque visite : désactivé, expiré ou épuisé, il n’est pas montré.{' '}
                  <Link to={`/stores/${storeId}/promo-codes`} target="_blank" className="font-medium text-accent hover:underline">
                    Créer un code promo
                  </Link>
                </>
              }
            />
            {promoProblem && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{promoProblem}</p>}
            {p.promoCode && (
              <>
                <Switch checked={p.autoApply} onChange={(autoApply) => set({ autoApply })} label="Appliquer le code automatiquement" description="Au clic sur le bouton, le code est mis dans le formulaire de commande : le client n’a rien à taper." />
                <Switch checked={p.collectPhone} onChange={(collectPhone) => set({ collectPhone })} label="Demander son numéro WhatsApp pour voir le code" description="Le numéro rejoint vos paniers à relancer, même s’il ne commande pas tout de suite." />
                <Switch checked={p.teaser} onChange={(teaser) => set({ teaser })} label="Rappel du code après fermeture" description="Une petite pastille reste dans un coin de l’écran : un clic rouvre la popup." />
              </>
            )}
            <Segmented showLabel
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

          <Section title="Bouton">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Texte du bouton" optional value={p.ctaText ?? ''} maxLength={40} placeholder={p.ctaAction === 'order' ? 'J’en profite' : 'Continuer'} onChange={(e) => set({ ctaText: e.target.value || undefined })} />
              <Input label="Lien pour refuser" optional value={p.dismissText ?? ''} maxLength={40} placeholder="Non merci" onChange={(e) => set({ dismissText: e.target.value || undefined })} />
            </div>
            <Segmented showLabel
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
            {p.ctaAction === 'whatsapp' && <p className="text-[12px] text-muted">Utilise le numéro du bouton WhatsApp du produit (onglet Page de vente). Sans ce bouton, il mène au formulaire.</p>}
            {p.ctaAction === 'url' && <Input label="Adresse" value={p.ctaUrl ?? ''} placeholder="https://…" onChange={(e) => set({ ctaUrl: e.target.value || undefined })} />}
          </Section>

          <Section title="Apparence">
            <Segmented showLabel
              label="Position"
              value={p.layout}
              onChange={(layout) => set({ layout })}
              options={[
                { value: 'center', label: 'Au centre' },
                { value: 'bottom', label: 'En bas' },
                { value: 'side', label: 'Dans un coin' },
              ]}
            />
            <Segmented showLabel
              label="Couleurs"
              value={p.theme}
              onChange={(theme) => set({ theme })}
              options={[
                { value: 'light', label: 'Clair' },
                { value: 'dark', label: 'Sombre' },
                { value: 'accent', label: 'Couleur de la boutique' },
              ]}
            />
          </Section>

          <Section title="Pour qui">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Appareils"
                value={p.devices}
                onChange={(e) => set({ devices: e.target.value as P['devices'] })}
                options={[
                  { value: 'all', label: 'Téléphone et ordinateur' },
                  { value: 'mobile', label: 'Téléphone seulement' },
                  { value: 'desktop', label: 'Ordinateur seulement' },
                ]}
              />
              <Select
                label="Pas plus d’une fois par"
                value={p.frequency}
                onChange={(e) => set({ frequency: e.target.value as P['frequency'] })}
                options={[
                  { value: 'session', label: 'Visite' },
                  { value: 'day', label: 'Jour' },
                  { value: 'week', label: 'Semaine' },
                  { value: 'once', label: 'Une seule fois en tout' },
                ]}
              />
            </div>
            <Segmented showLabel
              label="Produits"
              value={p.scope}
              onChange={(scope) => set({ scope })}
              options={[
                { value: 'all', label: 'Tous les produits' },
                { value: 'selected', label: 'Produits choisis' },
              ]}
            />
            {p.scope === 'selected' && (
              <Field label="Produits concernés" hint="Chaque produit peut aussi masquer toutes les popups (onglet Page de vente du produit).">
                <div className="flex flex-wrap gap-1.5">
                  {(products ?? []).map((x) => {
                    const on = p.productIds.includes(x.id)
                    return (
                      <button
                        key={x.id}
                        type="button"
                        title={x.name}
                        onClick={() => set({ productIds: on ? p.productIds.filter((i) => i !== x.id) : [...p.productIds, x.id] })}
                        className={cx('max-w-full truncate rounded-full border px-3 py-1.5 text-[13px]', on ? 'border-accent bg-accent/10 font-medium' : 'border-line text-muted hover:text-fg')}
                      >
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
          <p className="mb-2 text-sm font-medium">Aperçu</p>
          <Preview p={p} promoLabel={promoProblem ? null : promoLabel} image={p.image === 'custom' ? (p.imageUrl ?? null) : p.image === 'product' ? productImage : null} />
        </div>
      </div>
    </Dialog>
  )
}

function Preview({ p, promoLabel, image }: { p: P; promoLabel: string | null; image: string | null }) {
  const dark = p.theme === 'dark'
  const accent = p.theme === 'accent'
  return (
    <div className={cx('relative flex min-h-[380px] overflow-hidden rounded-2xl border border-line bg-surface-2 p-3', p.layout === 'center' ? 'items-center justify-center' : p.layout === 'bottom' ? 'items-end justify-center' : 'items-end justify-end')}>
      {p.layout !== 'side' && <div className="absolute inset-0 bg-black/40" />}
      <div className={cx('relative w-full overflow-hidden rounded-2xl shadow-xl', p.layout === 'side' ? 'max-w-[210px]' : 'max-w-[236px]', dark ? 'bg-gray-900 text-gray-50' : accent ? 'bg-accent text-white' : 'bg-surface text-fg')}>
        <X className="absolute top-2 right-2 size-4 opacity-70" />
        {image && <img src={image} alt="" className="aspect-video w-full object-cover" />}
        <div className="space-y-2 p-3 text-center">
          {promoLabel && <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold', dark || accent ? 'bg-white/15' : 'bg-accent/15')}>{promoLabel}</span>}
          <p className="text-[14px] leading-tight font-extrabold break-words">{p.title || 'Votre titre'}</p>
          {p.text && <p className={cx('text-[11.5px] leading-snug', dark ? 'text-gray-300' : accent ? 'text-white/85' : 'text-muted')}>{p.text}</p>}
          {p.countdown !== 'none' && <p className="text-[11px] font-semibold">Offre valable encore <span className="tabular-nums">14:59</span></p>}
          {promoLabel &&
            (p.collectPhone ? (
              <div className="space-y-1 text-left">
                <p className="text-[10.5px] font-semibold">Votre numéro WhatsApp</p>
                <div className="h-7 rounded-md border border-current/25 bg-white/80" />
              </div>
            ) : (
              <div className={cx('flex items-center justify-between rounded-lg border-2 border-dashed px-2 py-1.5', dark || accent ? 'border-white/30' : 'border-line')}>
                <span className="text-[12px] font-bold tracking-widest">{p.promoCode}</span>
                <span className="text-[10px] opacity-70">Copier</span>
              </div>
            ))}
          <div className={cx('rounded-lg py-2 text-[12px] font-bold', accent ? 'bg-white text-accent' : 'bg-accent text-white')}>{p.collectPhone && promoLabel ? 'Voir mon code' : p.ctaText || (p.ctaAction === 'order' ? 'J’en profite' : 'Continuer')}</div>
          <p className="text-[10.5px] underline opacity-70">{p.dismissText || 'Non merci'}</p>
        </div>
      </div>
    </div>
  )
}
