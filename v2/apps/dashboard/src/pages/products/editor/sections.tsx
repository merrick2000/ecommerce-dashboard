/**
 * Sections de l'éditeur produit. Chaque section reçoit l'état complet du
 * formulaire (forme `ProductInput` du schéma partagé) et un setter partiel.
 */
import {
  CTA_STYLES,
  CURRENCIES,
  INTEGRATION_PLATFORMS,
  NATIVE_PROVIDERS,
  type IntegrationPlatform,
  type PaymentChoice,
  type ProductContent,
  type ProductInput,
  type QuantityOffer,
} from '@zuri/shared'
import { CreditCard, ExternalLink, FileUp, Paperclip, Star, Trash2, Truck, Wallet } from 'lucide-react'
import { lazy, Suspense, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, cx, Field, Input, Segmented, Select, Skeleton, Switch, Textarea } from '@/components/ui'
import { useCurrentStore } from '@/hooks/auth'
import { uploadFile, usePaymentAccounts } from '@/hooks/resources'
import { errorMessage } from '@/lib/api'
import type { Errors } from '@/lib/form'
import { currencyLabel, fileSize, money } from '@/lib/format'
import { CTA_STYLE_LABEL, PROVIDER_LABEL } from '@/lib/labels'
import { ImageUpload, ListEditor, NumberField } from './fields'

const RichText = lazy(() => import('./RichText'))

export type Form = ProductInput
export interface SectionProps {
  form: Form
  set: (patch: Partial<Form>) => void
  errors: Errors
  currency: string
}

const setContent = (p: SectionProps, patch: Partial<ProductContent>) => p.set({ content: { ...p.form.content, ...patch } })
const opt = (s: string) => (s.trim() === '' ? undefined : s)
const nul = (s: string) => (s.trim() === '' ? null : s)

// ─── Général ─────────────────────────────────────────────────────────────────

export function GeneralSection(p: SectionProps) {
  const { form, set, errors, currency } = p
  const cur = currencyLabel(currency)
  const promo = form.promo
  const effective =
    promo.type === 'percentage' ? form.price * (1 - Math.min(promo.value, 100) / 100) : promo.type === 'fixed' ? Math.max(0, form.price - promo.value) : form.price
  return (
    <div className="space-y-4">
      <Card title="Informations">
        <div className="space-y-4">
          <Input label="Nom du produit" value={form.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} placeholder="Ex. Montre connectée X1" />
          <Switch checked={form.isActive} onChange={(v) => set({ isActive: v })} label="Produit en vente" description="Inactif, la page de vente n’accepte pas de commande." />
        </div>
      </Card>

      <Card title="Prix">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Prix de vente" value={form.price} onChange={(v) => set({ price: v ?? 0 })} suffix={cur} error={errors.price} />
          <NumberField label="Prix barré" optional value={form.compareAtPrice} onChange={(v) => set({ compareAtPrice: v })} suffix={cur} error={errors.compareAtPrice} hint="Affiché barré pour montrer la réduction." />
        </div>
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <Field label="Promotion">
            <Segmented
              label="Type de promotion"
              value={promo.type}
              onChange={(type) => set({ promo: { ...promo, type } })}
              options={[
                { value: 'none', label: 'Aucune' },
                { value: 'percentage', label: 'Pourcentage' },
                { value: 'fixed', label: 'Montant fixe' },
              ]}
            />
          </Field>
          {promo.type !== 'none' && (
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Valeur" value={promo.value} onChange={(v) => set({ promo: { ...promo, value: v ?? 0 } })} suffix={promo.type === 'percentage' ? '%' : cur} error={errors['promo.value']} />
              <Input label="Libellé" optional placeholder="Ex. -20 % aujourd’hui" value={promo.label ?? ''} onChange={(e) => set({ promo: { ...promo, label: opt(e.target.value) } })} error={errors['promo.label']} />
              <Select
                label="Affichage"
                value={promo.display}
                onChange={(e) => set({ promo: { ...promo, display: e.target.value as Form['promo']['display'] } })}
                options={[
                  { value: 'strikethrough', label: 'Prix barré' },
                  { value: 'strikethrough_text', label: 'Prix barré + texte' },
                  { value: 'text_only', label: 'Texte seul' },
                ]}
              />
              <p className="text-sm text-muted sm:col-span-3">
                Prix affiché : <strong className="tabular text-fg">{money(effective, currency)}</strong>
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Prix dans d’autres devises" description="Pour les clients d’autres pays (sinon le prix de base s’applique).">
        <ListEditor<Form['currencyPrices'][number]>
          items={form.currencyPrices}
          onChange={(currencyPrices) => set({ currencyPrices })}
          create={() => ({ currency: currency === 'XAF' ? 'XOF' : 'XAF', price: 0 })}
          addLabel="Ajouter une devise"
          max={CURRENCIES.length}
          render={(cp, update, i) => (
            <div className="grid grid-cols-2 gap-3">
              <Select aria-label="Devise" value={cp.currency} onChange={(e) => update({ currency: e.target.value as Form['currencyPrices'][number]['currency'] })} options={CURRENCIES.filter((c) => c !== currency).map((c) => ({ value: c, label: c }))} />
              <NumberField ariaLabel="Prix" value={cp.price} onChange={(v) => update({ price: v ?? 0 })} suffix={currencyLabel(cp.currency)} error={errors[`currencyPrices.${i}.price`]} />
            </div>
          )}
        />
      </Card>
    </div>
  )
}

// ─── Page de vente ───────────────────────────────────────────────────────────

export function SalesPageSection(p: SectionProps) {
  const { form, errors } = p
  const c = form.content
  return (
    <div className="space-y-4">
      <Card title="Description">
        <Suspense fallback={<Skeleton className="h-56 rounded-lg" />}>
          <RichText label="Description du produit" value={form.description} onChange={(description) => p.set({ description })} placeholder="Décrivez le produit, ses bénéfices…" />
        </Suspense>
        {errors.description && <p className="mt-1 text-[13px] text-red-600">{errors.description}</p>}
      </Card>

      <Card title="Texte personnalisé" description="Bloc libre (HTML simple accepté), placé selon la mise en page de la boutique.">
        <Textarea aria-label="Texte personnalisé" rows={4} value={c.customText ?? ''} onChange={(e) => setContent(p, { customText: opt(e.target.value) })} error={errors['content.customText']} />
      </Card>

      <Card title="Points forts">
        <div className="space-y-3">
          <Select
            label="Position"
            value={c.featuresPosition}
            onChange={(e) => setContent(p, { featuresPosition: e.target.value as ProductContent['featuresPosition'] })}
            options={[
              { value: 'before_description', label: 'Avant la description' },
              { value: 'after_description', label: 'Après la description' },
              { value: 'hidden', label: 'Masqués' },
            ]}
          />
          <ListEditor
            items={c.features}
            onChange={(features) => setContent(p, { features })}
            create={() => ''}
            addLabel="Ajouter un point fort"
            max={30}
            render={(f, _u, i) => (
              <Input aria-label={`Point fort ${i + 1}`} value={f} placeholder="Ex. Livraison en 24 h" onChange={(e) => setContent(p, { features: c.features.map((x, k) => (k === i ? e.target.value : x)) })} error={errors[`content.features.${i}`]} />
            )}
          />
        </div>
      </Card>

      <Card title="Vidéo">
        <div className="space-y-4">
          <Switch checked={c.video !== null} onChange={(on) => setContent(p, { video: on ? { url: '', position: 'before_description' } : null })} label="Afficher une vidéo" description="YouTube, Facebook, TikTok…" />
          {c.video && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="URL de la vidéo" placeholder="https://youtube.com/…" value={c.video.url} onChange={(e) => setContent(p, { video: { ...c.video!, url: e.target.value } })} error={errors['content.video.url']} wrapClass="sm:col-span-2" />
              <Input label="Titre" optional value={c.video.title ?? ''} onChange={(e) => setContent(p, { video: { ...c.video!, title: opt(e.target.value) } })} />
              <Select
                label="Position"
                value={c.video.position}
                onChange={(e) => setContent(p, { video: { ...c.video!, position: e.target.value as NonNullable<ProductContent['video']>['position'] } })}
                options={[
                  { value: 'after_hero', label: 'Sous l’image principale' },
                  { value: 'before_description', label: 'Avant la description' },
                  { value: 'after_description', label: 'Après la description' },
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      <Card title="Questions fréquentes">
        <ListEditor
          items={c.faqs}
          onChange={(faqs) => setContent(p, { faqs })}
          create={() => ({ question: '', answer: '' })}
          addLabel="Ajouter une question"
          max={40}
          empty="Les FAQ rassurent et répondent aux objections (livraison, garantie…)."
          render={(f, update, i) => (
            <div className="space-y-3">
              <Input aria-label="Question" placeholder="Question" value={f.question} onChange={(e) => update({ question: e.target.value })} error={errors[`content.faqs.${i}.question`]} />
              <Textarea aria-label="Réponse" placeholder="Réponse" rows={2} value={f.answer} onChange={(e) => update({ answer: e.target.value })} error={errors[`content.faqs.${i}.answer`]} />
            </div>
          )}
        />
      </Card>

      <Card
        title="Témoignages"
        actions={
          <Select
            aria-label="Style des témoignages"
            className="h-8 w-auto"
            value={c.testimonialsStyle}
            onChange={(e) => setContent(p, { testimonialsStyle: e.target.value as ProductContent['testimonialsStyle'] })}
            options={[
              { value: 'cards', label: 'Cartes' },
              { value: 'minimal', label: 'Minimal' },
              { value: 'highlight', label: 'Mis en avant' },
            ]}
          />
        }
      >
        <ListEditor<ProductContent['testimonials'][number]>
          items={c.testimonials}
          onChange={(testimonials) => setContent(p, { testimonials })}
          create={() => ({ name: '', rating: 5, text: '' })}
          addLabel="Ajouter un témoignage"
          max={40}
          render={(t, update, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input aria-label="Nom" placeholder="Nom" value={t.name} onChange={(e) => update({ name: e.target.value })} error={errors[`content.testimonials.${i}.name`]} />
              <Input aria-label="Ville" placeholder="Ville (facultatif)" value={t.city ?? ''} onChange={(e) => update({ city: opt(e.target.value) })} />
              <div className="flex items-center gap-1 sm:col-span-2" role="radiogroup" aria-label="Note">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={t.rating === n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} onClick={() => update({ rating: n })} className="p-0.5">
                    <Star className={cx('size-5', n <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-line-strong')} />
                  </button>
                ))}
              </div>
              <Textarea aria-label="Avis" placeholder="Avis du client" rows={2} value={t.text} onChange={(e) => update({ text: e.target.value })} wrapClass="sm:col-span-2" error={errors[`content.testimonials.${i}.text`]} />
            </div>
          )}
        />
      </Card>

      <Card title="Boutons dans la description" description="Boutons d’appel à l’action insérés entre les paragraphes.">
        <ListEditor<ProductContent['descriptionCtas'][number]>
          items={c.descriptionCtas}
          onChange={(descriptionCtas) => setContent(p, { descriptionCtas })}
          create={() => ({ text: 'Commander maintenant', action: 'scroll_to_form', style: 'default', alignment: 'center', afterParagraph: 1 })}
          addLabel="Ajouter un bouton"
          max={20}
          render={(cta, update, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Texte" value={cta.text} onChange={(e) => update({ text: e.target.value })} error={errors[`content.descriptionCtas.${i}.text`]} />
              <Input label="Sous-texte" optional value={cta.subText ?? ''} onChange={(e) => update({ subText: opt(e.target.value) })} />
              <Select
                label="Action"
                value={cta.action}
                onChange={(e) => update({ action: e.target.value as 'scroll_to_form' | 'custom_url' })}
                options={[
                  { value: 'scroll_to_form', label: 'Aller au formulaire' },
                  { value: 'custom_url', label: 'Ouvrir un lien' },
                ]}
              />
              {cta.action === 'custom_url' ? (
                <Input label="Lien" placeholder="https://…" value={cta.url ?? ''} onChange={(e) => update({ url: opt(e.target.value) })} error={errors[`content.descriptionCtas.${i}.url`]} />
              ) : (
                <NumberField label="Après le paragraphe n°" value={cta.afterParagraph} onChange={(v) => update({ afterParagraph: v ?? 0 })} />
              )}
              <Select label="Style" value={cta.style} onChange={(e) => update({ style: e.target.value as (typeof CTA_STYLES)[number] })} options={CTA_STYLES.map((s) => ({ value: s, label: CTA_STYLE_LABEL[s] ?? s }))} />
              <Select
                label="Alignement"
                value={cta.alignment}
                onChange={(e) => update({ alignment: e.target.value as 'left' | 'center' | 'full' })}
                options={[
                  { value: 'left', label: 'Gauche' },
                  { value: 'center', label: 'Centré' },
                  { value: 'full', label: 'Pleine largeur' },
                ]}
              />
              {cta.action === 'custom_url' && <NumberField label="Après le paragraphe n°" value={cta.afterParagraph} onChange={(v) => update({ afterParagraph: v ?? 0 })} />}
            </div>
          )}
        />
      </Card>

      <Card title="Bouton WhatsApp">
        <div className="space-y-4">
          <Switch checked={c.whatsapp.enabled} onChange={(enabled) => setContent(p, { whatsapp: { ...c.whatsapp, enabled } })} label="Afficher le bouton WhatsApp flottant" />
          {c.whatsapp.enabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Numéro WhatsApp" type="tel" inputMode="tel" placeholder="+229 97 00 00 00" value={c.whatsapp.phone ?? ''} onChange={(e) => setContent(p, { whatsapp: { ...c.whatsapp, phone: opt(e.target.value) } })} error={errors['content.whatsapp.phone']} />
              <Select
                label="Position"
                value={c.whatsapp.position}
                onChange={(e) => setContent(p, { whatsapp: { ...c.whatsapp, position: e.target.value as 'left' | 'right' } })}
                options={[
                  { value: 'right', label: 'À droite' },
                  { value: 'left', label: 'À gauche' },
                ]}
              />
              <Textarea label="Message d’accueil" optional rows={2} value={c.whatsapp.welcomeMessage ?? ''} onChange={(e) => setContent(p, { whatsapp: { ...c.whatsapp, welcomeMessage: opt(e.target.value) } })} wrapClass="sm:col-span-2" />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ─── Médias ──────────────────────────────────────────────────────────────────

export function MediaSection(p: SectionProps) {
  const { form, set, errors } = p
  const gallery = form.content.gallery
  return (
    <div className="space-y-4">
      <Card title="Images principales">
        <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
          <ImageUpload label="Couverture (16:9)" hint="Image en haut de la page de vente." preset="cover" aspect="video" value={form.coverImage} onChange={(coverImage) => set({ coverImage })} error={errors.coverImage} />
          <ImageUpload label="Miniature (1:1)" hint="Listes, partage, panier." preset="thumbnail" value={form.thumbnail} onChange={(thumbnail) => set({ thumbnail })} error={errors.thumbnail} />
        </div>
      </Card>
      {form.type === 'physical' && (
        <Card title="Galerie" description={`Photos supplémentaires du produit (${gallery.length}/12).`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {gallery.map((src, i) => (
              <div key={`${src}-${i}`} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-2">
                <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                <button type="button" onClick={() => setContent(p, { gallery: gallery.filter((_, k) => k !== i) })} className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1.5 text-white" aria-label={`Retirer la photo ${i + 1}`}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {gallery.length < 12 && <ImageUpload label="Ajouter" preset="gallery" value={null} onChange={(v) => v && setContent(p, { gallery: [...gallery, v] })} />}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Livraison (fichier digital ou logistique physique) ──────────────────────

function DigitalDelivery(p: SectionProps) {
  const { form, set, errors } = p
  const { storeId } = useCurrentStore()
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<{ name: string; size: number } | null>(null)
  const d = form.delivery ?? { type: 'file' as const, filePath: null }

  const pick = async (f: File | undefined) => {
    if (!f) return
    setBusy(true)
    setUploadError(null)
    try {
      const r = await uploadFile(storeId, f)
      set({ delivery: { type: 'file', filePath: r.key } })
      setUploaded({ name: r.name, size: r.size })
      toast.success('Fichier envoyé')
    } catch (e) {
      setUploadError(errorMessage(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <Card title="Livraison du produit digital" description="Ce que le client reçoit après paiement.">
      <div className="space-y-4">
        <Segmented
          label="Mode de livraison"
          value={d.type}
          onChange={(type) => set({ delivery: type === 'file' ? { type: 'file', filePath: null } : { type: 'external_url', url: '' } })}
          options={[
            { value: 'file', label: 'Fichier' },
            { value: 'external_url', label: 'Lien externe' },
          ]}
        />
        {d.type === 'file' ? (
          <Field label="Fichier à télécharger" error={uploadError ?? errors['delivery.filePath']} hint="PDF, ZIP, vidéo… 500 Mo max. Stocké en privé, lien signé après paiement.">
            {d.filePath ? (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-3">
                <Paperclip className="size-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{uploaded?.name ?? d.filePath.split('/').pop()}</p>
                  {uploaded && <p className="text-[12px] text-muted">{fileSize(uploaded.size)}</p>}
                </div>
                <Button size="sm" onClick={() => input.current?.click()} loading={busy}>
                  Remplacer
                </Button>
              </div>
            ) : (
              <Button onClick={() => input.current?.click()} loading={busy} className="w-full sm:w-auto">
                <FileUp className="size-4" /> Envoyer le fichier
              </Button>
            )}
            <input ref={input} type="file" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
          </Field>
        ) : (
          <Input label="Lien d’accès" placeholder="https://drive.google.com/…" value={d.url} onChange={(e) => set({ delivery: { type: 'external_url', url: e.target.value } })} error={errors['delivery.url']} hint="Google Drive, Notion, espace membre…" />
        )}
      </div>
    </Card>
  )
}

function PhysicalDelivery(p: SectionProps) {
  const { form, set, errors, currency } = p
  const hasVariants = form.variants.length > 0
  return (
    <div className="space-y-4">
      <Card title="Inventaire">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="SKU" optional value={form.sku ?? ''} onChange={(e) => set({ sku: nul(e.target.value) })} error={errors.sku} />
          <NumberField label="Poids" optional value={form.weightGrams} onChange={(weightGrams) => set({ weightGrams })} suffix="g" error={errors.weightGrams} />
          <div className="sm:col-span-2">
            <Switch checked={form.trackInventory} onChange={(trackInventory) => set({ trackInventory })} label="Suivre le stock" description="Le stock baisse à chaque commande et remonte en cas d’annulation ou de retour." />
          </div>
          {form.trackInventory && !hasVariants && <NumberField label="Stock disponible" value={form.stock} onChange={(stock) => set({ stock })} error={errors.stock} />}
          {form.trackInventory && hasVariants && <p className="text-[13px] text-muted sm:col-span-2">Le stock est géré par variante ci-dessous.</p>}
        </div>
      </Card>

      <Card title="Variantes" description="Tailles, couleurs… Laissez le prix vide pour utiliser le prix du produit.">
        <div className="space-y-4">
          <Input label="Nom de l’option" placeholder="Ex. Couleur, Taille" value={form.variantLabel ?? ''} onChange={(e) => set({ variantLabel: nul(e.target.value) })} wrapClass="sm:max-w-xs" />
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_60px_40px] gap-2 px-1 text-[12px] font-medium text-muted md:grid">
            <span>Nom</span>
            <span>SKU</span>
            <span>Prix</span>
            <span>Stock</span>
            <span>Actif</span>
            <span />
          </div>
          <ul className="space-y-2">
            {form.variants.map((v, i) => {
              const update = (patch: Partial<Form['variants'][number]>) => set({ variants: form.variants.map((x, k) => (k === i ? { ...x, ...patch } : x)) })
              return (
                <li key={v.id ?? `new-${i}`} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_60px_40px] md:items-start md:rounded-none md:border-0 md:p-0">
                  <Input aria-label="Nom de la variante" placeholder="Nom" value={v.name} onChange={(e) => update({ name: e.target.value })} error={errors[`variants.${i}.name`]} wrapClass="col-span-2 md:col-span-1" />
                  <Input aria-label="SKU" placeholder="SKU" value={v.sku ?? ''} onChange={(e) => update({ sku: nul(e.target.value) })} />
                  <NumberField ariaLabel="Prix" placeholder={String(form.price)} value={v.price ?? null} onChange={(price) => update({ price })} suffix={currencyLabel(currency)} />
                  <NumberField ariaLabel="Stock" placeholder={form.trackInventory ? '0' : '—'} value={v.stock ?? null} onChange={(stock) => update({ stock })} error={errors[`variants.${i}.stock`]} />
                  <div className="flex h-10 items-center gap-2">
                    <Switch size="sm" checked={v.isActive} onChange={(isActive) => update({ isActive })} ariaLabel={`Variante ${v.name || i + 1} active`} />
                    <span className="text-[13px] text-muted md:hidden">Active</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => set({ variants: form.variants.filter((_, k) => k !== i) })} aria-label="Supprimer la variante" className="justify-self-end text-red-600 dark:text-red-400">
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
          {form.variants.length < 50 && (
            <Button size="sm" onClick={() => set({ variants: [...form.variants, { name: '', isActive: true, sku: null, price: null, stock: null }] })}>
              + Ajouter une variante
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export function DeliverySection(p: SectionProps) {
  return p.form.type === 'digital' ? <DigitalDelivery {...p} /> : <PhysicalDelivery {...p} />
}

// ─── Offres par quantité ─────────────────────────────────────────────────────

export function OffersSection(p: SectionProps) {
  const { form, set, errors, currency } = p
  const newId = () => `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
  return (
    <Card title="Offres par quantité" description="Ex. 1 pour 15 000, 2 pour 27 000. Le client choisit l’offre sur la page de vente.">
      <ListEditor<QuantityOffer>
        items={form.offers}
        onChange={(offers) => set({ offers })}
        create={() => {
          const q = (form.offers.at(-1)?.quantity ?? 1) + 1
          return { id: newId(), quantity: q, price: Math.round(form.price * q * 0.9) }
        }}
        addLabel="Ajouter une offre"
        max={6}
        empty="Aucune offre : le client commande à l’unité au prix du produit."
        render={(o, update, i) => {
          const full = form.price * o.quantity
          const saving = full > 0 ? Math.round((1 - o.price / full) * 100) : 0
          return (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NumberField label="Quantité" value={o.quantity} onChange={(v) => update({ quantity: v ?? 1 })} error={errors[`offers.${i}.quantity`]} />
              <NumberField label="Prix total" value={o.price} onChange={(v) => update({ price: v ?? 0 })} suffix={currencyLabel(currency)} error={errors[`offers.${i}.price`]} />
              <Input label="Libellé" optional placeholder={`${o.quantity} unités`} value={o.label ?? ''} onChange={(e) => update({ label: opt(e.target.value) })} />
              <Input label="Badge" optional placeholder="Populaire" value={o.badge ?? ''} onChange={(e) => update({ badge: opt(e.target.value) })} />
              <p className="tabular col-span-2 text-[13px] text-muted sm:col-span-4">
                {money(o.quantity > 0 ? o.price / o.quantity : 0, currency)} / unité
                {saving > 0 && <Badge tone="green" className="ml-2">−{saving} %</Badge>}
              </p>
            </div>
          )
        }}
      />
    </Card>
  )
}

// ─── Paiement ────────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<IntegrationPlatform, string> = { chariow: 'Chariow', maketou: 'Maketou', selar: 'Selar', link: 'Autre lien de paiement' }

function ChoiceCard({ value, current, onSelect, icon, title, description, disabled, children }: { value: PaymentChoice; current: PaymentChoice; onSelect: (v: PaymentChoice) => void; icon: ReactNode; title: string; description: ReactNode; disabled?: boolean; children?: ReactNode }) {
  const checked = value === current
  return (
    <div className={cx('rounded-xl border transition-colors', checked ? 'border-accent bg-accent-soft/40 ring-1 ring-accent' : 'border-line', disabled && 'opacity-60')}>
      <label className={cx('flex items-start gap-3 p-4', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
        <input type="radio" name="payment-method" value={value} checked={checked} disabled={disabled} onChange={() => onSelect(value)} className="mt-1 size-4 accent-amber-600" />
        <span className="mt-0.5 text-muted">{icon}</span>
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          <span className="mt-0.5 block text-[13px] text-muted">{description}</span>
        </span>
      </label>
      {checked && children && <div className="border-t border-line px-4 pt-3 pb-4">{children}</div>}
    </div>
  )
}

export function PaymentSection(p: SectionProps) {
  const { form, set, errors } = p
  const { storeId, role } = useCurrentStore()
  const isOwner = role === 'owner'
  const accounts = usePaymentAccounts(isOwner)
  const enabledNative = (accounts.data ?? []).filter((a) => a.enabled && (NATIVE_PROVIDERS as readonly string[]).includes(a.provider))
  // Rôle non propriétaire : la liste est inaccessible (403), on n'empêche pas le choix.
  const nativeKnownUnavailable = isOwner && accounts.isSuccess && enabledNative.length === 0
  const pay = form.payment
  const integ = pay.integration ?? { platform: 'chariow' as IntegrationPlatform, url: null, productId: null }
  const select = (method: PaymentChoice) => set({ payment: { method, integration: method === 'integration' ? integ : null } })
  const setInteg = (patch: Partial<typeof integ>) => set({ payment: { method: 'integration', integration: { ...integ, ...patch } } })

  return (
    <Card title="Paiement" description="Un seul mode de paiement par produit.">
      <div className="space-y-3" role="radiogroup" aria-label="Mode de paiement">
        <ChoiceCard
          value="native"
          current={pay.method}
          onSelect={select}
          icon={<CreditCard className="size-5" />}
          title="Paiement intégré"
          disabled={nativeKnownUnavailable && pay.method !== 'native'}
          description={
            nativeKnownUnavailable ? (
              <>
                Activez d’abord FeexPay, FedaPay, PayDunya ou pawaPay dans{' '}
                <Link to={`/stores/${storeId}/settings?tab=payments`} className="font-medium text-accent underline">
                  Paramètres → Paiements
                </Link>
                .
              </>
            ) : enabledNative.length ? (
              `Mobile money via ${enabledNative.map((a) => PROVIDER_LABEL[a.provider]).join(', ')}.`
            ) : (
              'Mobile money via les moyens de paiement activés de la boutique.'
            )
          }
        >
          {nativeKnownUnavailable && <p className="text-[13px] text-orange-700 dark:text-orange-400">Aucun moyen de paiement n’est activé : les clients ne pourront pas payer.</p>}
        </ChoiceCard>

        <ChoiceCard value="integration" current={pay.method} onSelect={select} icon={<ExternalLink className="size-5" />} title="Intégration" description="Paiement hébergé sur Chariow, Maketou, Selar ou un autre lien.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Plateforme" value={integ.platform} onChange={(e) => setInteg({ platform: e.target.value as IntegrationPlatform })} options={INTEGRATION_PLATFORMS.map((x) => ({ value: x, label: PLATFORM_LABEL[x] }))} error={errors['payment.integration.platform'] ?? errors['payment.integration']} />
            {integ.platform === 'chariow' || integ.platform === 'maketou' ? (
              <Input label={`ID produit ${PLATFORM_LABEL[integ.platform]}`} value={integ.productId ?? ''} onChange={(e) => setInteg({ productId: nul(e.target.value) })} error={errors['payment.integration.productId']} hint="La clé API se règle dans Paramètres → Paiements." />
            ) : (
              <Input label="Lien de paiement" placeholder="https://…" value={integ.url ?? ''} onChange={(e) => setInteg({ url: nul(e.target.value) })} error={errors['payment.integration.url']} />
            )}
            {integ.platform === 'selar' && (
              <Input label="Code produit Selar" optional value={form.externalProductId ?? ''} onChange={(e) => set({ externalProductId: nul(e.target.value) })} error={errors.externalProductId} hint="Pour rattacher les ventes Selar (webhook) à ce produit." wrapClass="sm:col-span-2" />
            )}
          </div>
        </ChoiceCard>

        <ChoiceCard
          value="cod"
          current={pay.method}
          onSelect={select}
          icon={form.type === 'physical' ? <Truck className="size-5" /> : <Wallet className="size-5" />}
          title="Paiement à la livraison"
          disabled={form.type === 'digital'}
          description={form.type === 'digital' ? 'Réservé aux produits physiques.' : 'Le client paie le livreur. Vous confirmez la commande par téléphone ou WhatsApp.'}
        />
        {errors['payment.method'] && <p className="text-[13px] text-red-600">{errors['payment.method']}</p>}
      </div>
    </Card>
  )
}
