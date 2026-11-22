import { checkoutSettingsSchema, CTA_STYLES, PAGE_BLOCKS, STICKY_CTA_DEFAULTS, TEMPLATES, type CheckoutSettings, type StickyCta } from '@zuri/shared'
import { Eye, EyeOff } from 'lucide-react'
import { DragHandle, draggingClass, useSortable } from '@/components/Sortable'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/Toast'
import { Button, Card, cx, ErrorState, Field, Input, Segmented, Select, Skeleton, Switch, TagInput } from '@/components/ui'
import { useCheckoutSettings, usePromoCodes, useSaveCheckoutSettings } from '@/hooks/resources'
import { serverErrors, validate, type Errors } from '@/lib/form'
import { CTA_STYLE_LABEL, PAGE_BLOCK_LABEL, TEMPLATE_LABEL } from '@/lib/labels'
import { SaveBar } from '@/components/SaveBar'
import { NumberField } from '../products/editor/fields'

const PAYMENT_LOGOS = ['mtn', 'moov', 'orange', 'wave', 'free', 'airtel', 'mpesa', 'visa', 'mastercard', 'paypal', 'celtiis', 'togocom']

const LAYOUTS: { value: CheckoutSettings['desktopLayout']; label: string; description: string }[] = [
  { value: 'product_split', label: 'Style boutique', description: 'Image à gauche ; titre, prix et formulaire à droite.' },
  { value: 'form_side', label: 'Formulaire à droite', description: 'Toute la page à gauche, le formulaire à côté.' },
  { value: 'single', label: 'Une colonne', description: 'Comme sur téléphone, centré.' },
]

/** Petit schéma de la mise en page (image, texte, formulaire). */
function LayoutSketch({ kind, titleAbove }: { kind: CheckoutSettings['desktopLayout']; titleAbove: boolean }) {
  const img = 'rounded bg-line-strong/60'
  const line = 'h-1.5 rounded bg-line-strong'
  const form = 'rounded border border-accent/60 bg-accent/15'
  return (
    <div className="aspect-[16/10] rounded-lg border border-line bg-surface-2 p-2" aria-hidden>
      {kind === 'product_split' && (
        <div className="flex h-full flex-col gap-1.5">
          {titleAbove && <div className={cx(line, 'w-2/3 h-2')} />}
          <div className="grid flex-1 grid-cols-2 gap-1.5">
            <div className={img} />
            <div className="flex flex-col gap-1">
              {!titleAbove && <div className={cx(line, 'h-2 w-5/6')} />}
              <div className={cx(line, 'w-1/2')} />
              <div className={cx(form, 'flex-1')} />
            </div>
          </div>
        </div>
      )}
      {kind === 'form_side' && (
        <div className="grid h-full grid-cols-[1.4fr_1fr] gap-1.5">
          <div className="flex flex-col gap-1">
            <div className={cx(img, 'h-1/2')} />
            <div className={cx(line, 'w-5/6')} />
            <div className={cx(line, 'w-2/3')} />
            <div className={cx(line, 'w-3/4')} />
          </div>
          <div className={form} />
        </div>
      )}
      {kind === 'single' && (
        <div className="mx-auto flex h-full w-1/2 flex-col gap-1">
          <div className={cx(img, 'h-2/5')} />
          <div className={cx(line, 'w-5/6')} />
          <div className={cx(form, 'flex-1')} />
        </div>
      )}
    </div>
  )
}

/** Complète la mise en page avec les blocs absents (nouveaux blocs ajoutés au produit). */
function normalize(s: CheckoutSettings): CheckoutSettings {
  const present = new Set(s.pageLayout.map((b) => b.block))
  return { ...s, desktopLayout: s.desktopLayout ?? 'form_side', titlePosition: s.titlePosition ?? 'beside', stickyCta: { ...STICKY_CTA_DEFAULTS, ...s.stickyCta }, pageLayout: [...s.pageLayout, ...PAGE_BLOCKS.filter((b) => !present.has(b)).map((block) => ({ block, visible: false }))] }
}

function Form({ initial, canEdit }: { initial: CheckoutSettings; canEdit: boolean }) {
  const save = useSaveCheckoutSettings()
  const promos = usePromoCodes().list
  const toast = useToast()
  const [s, setS] = useState(() => normalize(initial))
  const [base, setBase] = useState(() => JSON.stringify(normalize(initial)))
  const [errors, setErrors] = useState<Errors>({})
  const set = (patch: Partial<CheckoutSettings>) => setS((x) => ({ ...x, ...patch }))
  const dirty = JSON.stringify(s) !== base
  const u = s.urgency
  const st = s.stickyCta
  const layoutSort = useSortable(s.pageLayout, (pageLayout) => set({ pageLayout }))
  const setSticky = (patch: Partial<StickyCta>) => set({ stickyCta: { ...st, ...patch } })


  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = validate(checkoutSettingsSchema, s)
    if (v.errors) {
      setErrors(v.errors)
      toast.error('Certains champs sont à corriger')
      return
    }
    setErrors({})
    save.mutate(v.data, {
      onSuccess: () => {
        setBase(JSON.stringify(s))
        toast.success('Page de vente mise à jour')
      },
      onError: (err) => {
        const fe = serverErrors(err)
        if (fe) setErrors(fe)
        else toast.error(err)
      },
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <fieldset disabled={!canEdit} className="space-y-4">
        <Card title="Mise en page sur ordinateur" description="Sur téléphone, tout s’affiche sur une colonne, le formulaire après le prix.">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {LAYOUTS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => set({ desktopLayout: l.value })}
                  aria-pressed={s.desktopLayout === l.value}
                  className={cx('rounded-xl border p-3 text-left transition', s.desktopLayout === l.value ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-line hover:border-line-strong')}
                >
                  <LayoutSketch kind={l.value} titleAbove={s.titlePosition === 'above'} />
                  <span className="mt-2 block text-sm font-semibold">{l.label}</span>
                  <span className="block text-xs text-muted">{l.description}</span>
                </button>
              ))}
            </div>
            {s.desktopLayout === 'product_split' && (
              <Field label="Position du titre">
                <Segmented
                  label="Position du titre"
                  value={s.titlePosition}
                  onChange={(titlePosition) => set({ titlePosition })}
                  options={[
                    { value: 'beside', label: 'À côté de l’image' },
                    { value: 'above', label: 'Au-dessus de l’image' },
                  ]}
                />
              </Field>
            )}
          </div>
        </Card>

        <Card title="Apparence">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Modèle" value={s.template} onChange={(e) => set({ template: e.target.value as CheckoutSettings['template'] })} options={TEMPLATES.map((t) => ({ value: t, label: TEMPLATE_LABEL[t] ?? t }))} />
            <Field label="Couleur principale" error={errors.primaryColor}>
              <div className="flex gap-2">
                <input type="color" aria-label="Choisir la couleur" value={/^#[0-9a-f]{6}$/i.test(s.primaryColor) ? s.primaryColor : '#f59e0b'} onChange={(e) => set({ primaryColor: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-line-strong bg-surface p-1" />
                <Input aria-label="Code couleur" value={s.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="font-mono" />
              </div>
            </Field>
            <Input label="Texte du bouton" value={s.ctaText} onChange={(e) => set({ ctaText: e.target.value })} error={errors.ctaText} />
            <Select label="Style du bouton" value={s.ctaStyle} onChange={(e) => set({ ctaStyle: e.target.value as CheckoutSettings['ctaStyle'] })} options={CTA_STYLES.map((c) => ({ value: c, label: CTA_STYLE_LABEL[c] ?? c }))} />
          </div>
        </Card>

        <Card title="Réassurance">
          <div className="space-y-4">
            <TagInput label="Badges de confiance" placeholder="Ex. Livraison rapide, Paiement à la livraison" value={s.trustBadges} onChange={(trustBadges) => set({ trustBadges: trustBadges.slice(0, 8) })} hint="8 maximum." error={errors.trustBadges} />
            <Field label="Logos de paiement affichés">
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_LOGOS.map((l) => {
                  const on = s.paymentLogos.includes(l)
                  return (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ paymentLogos: on ? s.paymentLogos.filter((x) => x !== l) : [...s.paymentLogos, l] })}
                      className={cx('rounded-full border px-3 py-1 text-[13px] font-medium capitalize', on ? 'border-accent bg-accent-soft' : 'border-line-strong text-muted hover:text-fg')}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>
        </Card>

        <Card title="Ordre des blocs" description="Glissez la poignée pour changer l’ordre ; l’œil affiche ou masque un bloc.">
          <ol ref={layoutSort.listRef} className={cx('divide-y divide-line rounded-lg border border-line', layoutSort.dragging && 'select-none')}>
            {s.pageLayout.map((b, i) => (
              <li key={b.block} {...layoutSort.itemProps(i)} className={cx('flex items-center gap-2 px-3 py-2', !b.visible && 'bg-surface-2/50', layoutSort.dragIndex === i && draggingClass)}>
                <DragHandle {...layoutSort.handleProps(i, PAGE_BLOCK_LABEL[b.block] ?? b.block)} className="-ml-1" />
                <span className="tabular w-5 text-[12px] text-subtle">{i + 1}</span>
                <span className={cx('flex-1 text-sm', !b.visible && 'text-muted line-through')}>{PAGE_BLOCK_LABEL[b.block] ?? b.block}</span>
                <Button size="sm" variant="ghost" onClick={() => set({ pageLayout: s.pageLayout.map((x, k) => (k === i ? { ...x, visible: !x.visible } : x)) })} aria-label={b.visible ? `Masquer ${PAGE_BLOCK_LABEL[b.block]}` : `Afficher ${PAGE_BLOCK_LABEL[b.block]}`}>
                  {b.visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-subtle" />}
                </Button>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Bouton d’achat collant" description="Il suit le client pendant qu’il fait défiler la page, pour commander à tout moment.">
          <div className="space-y-5">
            <Switch checked={st.enabled} onChange={(enabled) => setSticky({ enabled })} label="Afficher le bouton collant" />
            {st.enabled && (
              <>
                {/* Aperçu en direct du bandeau. */}
                <div className="overflow-hidden rounded-xl border border-line bg-surface-2 p-3">
                  <div className={cx('flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-sm', st.position === 'top' && 'flex-row')}>
                    {st.showThumbnail && <span className="size-10 shrink-0 rounded-lg bg-surface-2" aria-hidden />}
                    {st.showPrice && <span className="text-sm font-extrabold whitespace-nowrap">15 000 FCFA</span>}
                    <span className="flex-1 truncate rounded-lg px-3 py-2 text-center text-sm font-bold text-white" style={{ background: s.primaryColor }}>
                      {(st.text.trim() || 'Commander maintenant').replace('{produit}', 'Montre X1').replace('{prix}', '15 000 FCFA').replace('{prix_barre}', '18 000 FCFA').replace('{boutique}', 'Ma boutique')}
                    </span>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted">Aperçu : {st.position === 'top' ? 'en haut' : 'en bas'} de l’écran, {st.devices === 'all' ? 'mobile et ordinateur' : 'sur mobile'}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Appareils">
                    <Segmented label="Appareils" value={st.devices} onChange={(devices) => setSticky({ devices })} options={[{ value: 'mobile', label: 'Mobile' }, { value: 'all', label: 'Mobile et ordinateur' }]} />
                  </Field>
                  <Field label="Position">
                    <Segmented label="Position" value={st.position} onChange={(position) => setSticky({ position })} options={[{ value: 'bottom', label: 'En bas' }, { value: 'top', label: 'En haut' }]} />
                  </Field>
                </div>
                <Select
                  label="Quand l’afficher"
                  value={st.trigger}
                  onChange={(e) => setSticky({ trigger: e.target.value as StickyCta['trigger'] })}
                  options={[
                    { value: 'after_hero', label: 'Après l’image principale (recommandé)' },
                    { value: 'immediate', label: 'Dès l’arrivée sur la page' },
                    { value: 'scroll', label: 'Après un pourcentage de défilement' },
                  ]}
                />
                {st.trigger === 'scroll' && <NumberField label="Défilement" value={st.scrollPercent} onChange={(v) => setSticky({ scrollPercent: Math.min(90, Math.max(5, v ?? 25)) })} suffix="%" wrapClass="sm:max-w-xs" error={errors['stickyCta.scrollPercent']} />}
                <Input
                  label="Texte du bouton"
                  optional
                  placeholder="Vide : texte par défaut"
                  maxLength={60}
                  value={st.text}
                  onChange={(e) => setSticky({ text: e.target.value })}
                  hint="Variables : {produit}, {prix}, {prix_barre}, {boutique}. Ex. « Je commande à {prix} »."
                  error={errors['stickyCta.text']}
                />
                <Select
                  label="Animation"
                  value={st.animation}
                  onChange={(e) => setSticky({ animation: e.target.value as StickyCta['animation'] })}
                  options={[
                    { value: 'none', label: 'Aucune' },
                    { value: 'pulse', label: 'Pulsation douce' },
                    { value: 'shake', label: 'Petit balancement toutes les 4 s' },
                  ]}
                />
                <div className="space-y-3">
                  <Switch checked={st.showPrice} onChange={(showPrice) => setSticky({ showPrice })} label="Afficher le prix" />
                  <Switch checked={st.showThumbnail} onChange={(showThumbnail) => setSticky({ showThumbnail })} label="Afficher la miniature du produit" />
                  <Switch checked={st.hideNearForm} onChange={(hideNearForm) => setSticky({ hideNearForm })} label="Masquer quand le formulaire est visible" description="Évite un bouton en double à côté du formulaire." />
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="Urgence">
          <div className="space-y-5">
            <div className="space-y-3">
              <Switch checked={!!u.countdown?.enabled} onChange={(enabled) => set({ urgency: { ...u, countdown: { minutes: 15, ...u.countdown, enabled } } })} label="Compte à rebours" />
              {u.countdown?.enabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField label="Durée" value={u.countdown.minutes} onChange={(v) => set({ urgency: { ...u, countdown: { ...u.countdown!, minutes: v ?? 15 } } })} suffix="min" error={errors['urgency.countdown.minutes']} />
                  <Input label="Libellé" optional placeholder="L’offre se termine dans" value={u.countdown.label ?? ''} onChange={(e) => set({ urgency: { ...u, countdown: { ...u.countdown!, label: e.target.value || undefined } } })} />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Switch checked={!!u.limitedStock?.enabled} onChange={(enabled) => set({ urgency: { ...u, limitedStock: { remaining: 12, ...u.limitedStock, enabled } } })} label="Stock limité affiché" />
              {u.limitedStock?.enabled && <NumberField label="Pièces restantes affichées" value={u.limitedStock.remaining} onChange={(v) => set({ urgency: { ...u, limitedStock: { ...u.limitedStock!, remaining: v ?? 1 } } })} wrapClass="sm:max-w-xs" error={errors['urgency.limitedStock.remaining']} />}
            </div>
            <div className="space-y-3">
              <Switch checked={!!u.viewers?.enabled} onChange={(enabled) => set({ urgency: { ...u, viewers: { base: 8, ...u.viewers, enabled } } })} label="Visiteurs en ce moment" />
              {u.viewers?.enabled && <NumberField label="Nombre de base" value={u.viewers.base} onChange={(v) => set({ urgency: { ...u, viewers: { ...u.viewers!, base: v ?? 1 } } })} wrapClass="sm:max-w-xs" error={errors['urgency.viewers.base']} />}
            </div>
          </div>
        </Card>

        <Card title="Popup de ventes récentes">
          <div className="space-y-4">
            <Switch checked={s.salesPopup.enabled} onChange={(enabled) => set({ salesPopup: { ...s.salesPopup, enabled } })} label="Afficher les ventes récentes" description="« Awa de Cotonou vient de commander… »" />
            {s.salesPopup.enabled && (
              <>
                <NumberField label="Intervalle" value={s.salesPopup.intervalSeconds} onChange={(v) => set({ salesPopup: { ...s.salesPopup, intervalSeconds: v ?? 20 } })} suffix="s" wrapClass="sm:max-w-xs" error={errors['salesPopup.intervalSeconds']} />
                <Switch checked={s.salesPopup.realSalesOnly} onChange={(realSalesOnly) => set({ salesPopup: { ...s.salesPopup, realSalesOnly } })} label="Vraies ventes uniquement" description="N’affiche que des commandes réelles (prénom + ville)." />
              </>
            )}
          </div>
        </Card>

        <Card title="Panier abandonné">
          <div className="space-y-4">
            <Switch checked={s.abandonedCart.enabled} onChange={(enabled) => set({ abandonedCart: { ...s.abandonedCart, enabled } })} label="Relancer les paniers abandonnés" description="Relance des visiteurs ayant laissé leurs coordonnées sans commander." />
            {s.abandonedCart.enabled && (
              <Select
                label="Code promo offert dans la relance"
                value={s.abandonedCart.promoCodeId != null ? String(s.abandonedCart.promoCodeId) : ''}
                onChange={(e) => set({ abandonedCart: { ...s.abandonedCart, promoCodeId: e.target.value ? Number(e.target.value) : null } })}
                options={[{ value: '', label: 'Aucun' }, ...(promos.data ?? []).filter((p) => p.isActive).map((p) => ({ value: String(p.id), label: `${p.code} (${p.type === 'percentage' ? `−${p.value} %` : `−${p.value}`})` }))]}
                hint={promos.data?.length === 0 ? 'Créez un code dans « Codes promo » pour en proposer un.' : undefined}
                wrapClass="sm:max-w-sm"
              />
            )}
          </div>
        </Card>
      </fieldset>

      {canEdit && <SaveBar submit dirty={dirty} saving={save.isPending} onDiscard={() => setS(JSON.parse(base) as CheckoutSettings)} />}
    </form>
  )
}

export function CheckoutSettingsForm({ canEdit }: { canEdit: boolean }) {
  const { data, error, isPending, refetch } = useCheckoutSettings()
  if (error && !data) return <ErrorState error={error} onRetry={() => void refetch()} />
  if (isPending) return <Skeleton className="h-96 rounded-xl" />
  const parsed = checkoutSettingsSchema.safeParse(data.settings)
  return <Form initial={parsed.success ? parsed.data : checkoutSettingsSchema.parse({})} canEdit={canEdit} />
}
