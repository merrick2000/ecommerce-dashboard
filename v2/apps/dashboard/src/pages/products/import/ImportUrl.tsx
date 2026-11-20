/**
 * Import rapide d'un produit depuis une URL : on colle le lien, Zuri détecte nom, prix,
 * variantes, images, vidéo, description, points forts, FAQ et avis ; le vendeur ajuste,
 * peut demander des suggestions d'amélioration, puis importe (produit inactif par défaut).
 */
import { AlertTriangle, Check, Link2, Loader2, Sparkles, Star, Trash2, Wand2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { DragHandle, draggingClass, useSortable } from '@/components/Sortable'
import { useToast } from '@/components/Toast'
import { Badge, Button, Card, Checkbox, cx, Input, PageHeader, Switch, Textarea } from '@/components/ui'
import { useCurrentStore, useMe, useStoreId } from '@/hooks/auth'
import { api, ApiError, errorMessage } from '@/lib/api'
import { money } from '@/lib/format'
import { NumberField } from '../editor/fields'

type Source = 'shopify' | 'jsonld' | 'microdata' | 'opengraph' | 'page' | 'ai'

interface Variant {
  name: string
  price: number | null
  available: boolean
  sku: string | null
}

interface Draft {
  type: 'physical' | 'digital'
  name: string
  description: string
  price: number | null
  compareAtPrice: number | null
  currency: string | null
  variantLabel: string | null
  variants: Variant[]
  images: string[]
  video: string | null
  features: string[]
  faqs: { question: string; answer: string }[]
  testimonials: { name: string; rating: number; text: string }[]
  brand: string | null
}

interface Preview {
  sourceUrl: string
  domain: string
  detected: Source[]
  warnings: string[]
  draft: Draft
  aiAvailable: boolean
  fetchedVia?: 'direct' | 'firecrawl' | 'text'
}

interface Suggestions {
  name: string
  kicker: string
  headline: string
  tagline: string
  description: string
  features: string[]
  faqs: { question: string; answer: string }[]
}

const SOURCE_LABEL: Record<Source, string> = {
  shopify: 'Boutique Shopify',
  jsonld: 'Données produit (schema.org)',
  microdata: 'Microdonnées',
  opengraph: 'Balises de partage',
  page: 'Images de la page',
  ai: 'Analyse IA',
}

/** Étape 2 : brouillon éditable. */
function Review({ preview, onRestart }: { preview: Preview; onRestart: () => void }) {
  const storeId = useStoreId()
  const { store } = useCurrentStore()
  const navigate = useNavigate()
  const toast = useToast()
  const currency = store?.currency ?? 'XOF'
  const d0 = preview.draft

  const [name, setName] = useState(d0.name)
  const [price, setPrice] = useState<number | null>(d0.price)
  const [compareAt, setCompareAt] = useState<number | null>(d0.compareAtPrice)
  const [variantLabel, setVariantLabel] = useState(d0.variantLabel ?? '')
  const [variants, setVariants] = useState<Variant[]>(d0.variants)
  const [images, setImages] = useState(d0.images.map((url) => ({ url, selected: true })))
  const [video, setVideo] = useState(d0.video ?? '')
  const [description, setDescription] = useState(d0.description)
  const [features, setFeatures] = useState<string[]>(d0.features)
  const [faqs, setFaqs] = useState(d0.faqs.map((f) => ({ ...f, selected: true })))
  const [reviews, setReviews] = useState(d0.testimonials.map((t) => ({ ...t, selected: false })))
  const [kicker, setKicker] = useState('')
  const [headline, setHeadline] = useState('')
  const [tagline, setTagline] = useState('')
  const [activate, setActivate] = useState(false)
  const [goal, setGoal] = useState('')
  const [suggest, setSuggest] = useState<Suggestions | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [importing, setImporting] = useState(false)
  const imageSort = useSortable(images, setImages, { mode: 'grid' })

  const selectedImages = images.filter((i) => i.selected)
  // L'écart de devise est affiché à côté du prix : inutile de le répéter en haut.
  const warnings = preview.warnings.filter((w) => !w.startsWith('Prix en '))
  const otherCurrency = d0.currency && d0.currency !== currency
  const draftPayload = () => ({
    name: name.trim(),
    description,
    price: price ?? 0,
    compareAtPrice: compareAt,
    variantLabel: variantLabel.trim() || null,
    variants: variants.filter((v) => v.name.trim()),
    video: video.trim() || null,
    features: features.map((f) => f.trim()).filter(Boolean),
    faqs: faqs.filter((f) => f.selected).map(({ question, answer }) => ({ question, answer })),
    testimonials: reviews.filter((r) => r.selected).map(({ name: n, rating, text }) => ({ name: n, rating, text })),
    kicker: kicker.trim() || undefined,
    headline: headline.trim() || undefined,
    tagline: tagline.trim() || undefined,
  })

  const askSuggestions = async () => {
    setSuggesting(true)
    try {
      setSuggest(await api.post<Suggestions>(`/stores/${storeId}/products/import/url/improve`, { draft: draftPayload(), currency: d0.currency, brand: d0.brand, goal: goal.trim() || undefined }))
    } catch (e) {
      toast.error(e)
    } finally {
      setSuggesting(false)
    }
  }

  const apply = (field: keyof Suggestions) => {
    if (!suggest) return
    if (field === 'name') setName(suggest.name)
    if (field === 'kicker') setKicker(suggest.kicker)
    if (field === 'headline') setHeadline(suggest.headline)
    if (field === 'tagline') setTagline(suggest.tagline)
    if (field === 'description') setDescription(suggest.description)
    if (field === 'features') setFeatures(suggest.features)
    if (field === 'faqs') setFaqs(suggest.faqs.map((f) => ({ ...f, selected: true })))
  }
  const applyAll = () => {
    ;(['name', 'kicker', 'headline', 'tagline', 'description', 'features', 'faqs'] as const).forEach(apply)
    toast.success('Suggestions appliquées')
  }

  const doImport = async () => {
    if (name.trim().length < 2) return toast.error('Donnez un nom au produit')
    if (price == null) return toast.error('Indiquez le prix de vente')
    setImporting(true)
    try {
      const r = await api.post<{ id: string; warnings: string[]; images: number }>(`/stores/${storeId}/products/import/url/commit`, {
        draft: draftPayload(),
        imageUrls: selectedImages.map((i) => i.url),
        activate,
        sourceUrl: preview.sourceUrl,
      })
      toast.success(r.warnings.length ? `Produit importé (${r.warnings.length} image(s) non récupérée(s))` : 'Produit importé')
      navigate(`/stores/${storeId}/products/${r.id}`)
    } catch (e) {
      toast.error(e)
      setImporting(false)
    }
  }

  const Suggestion = ({ field, label, children }: { field: keyof Suggestions; label: string; children: React.ReactNode }) =>
    suggest ? (
      <div className="mt-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Sparkles className="size-3.5" /> Proposition : {label}
          </span>
          <Button size="sm" variant="ghost" onClick={() => apply(field)}>
            <Check className="size-3.5" /> Utiliser
          </Button>
        </div>
        <div className="text-sm">{children}</div>
      </div>
    ) : null

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5">
          <span className="text-sm text-muted">Source :</span>
          <a href={preview.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
            {preview.domain}
          </a>
          {preview.detected.map((s) => (
            <Badge key={s} tone="green">
              {SOURCE_LABEL[s] ?? s}
            </Badge>
          ))}
          {preview.fetchedVia === 'firecrawl' && <Badge tone="neutral">Site protégé, lu avec un navigateur</Badge>}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={onRestart}>
            Autre lien
          </Button>
        </div>
        {warnings.length > 0 && (
          <ul className="space-y-1 border-t border-line px-4 py-3 sm:px-5">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {w}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {preview.aiAvailable && (
        <Card title="Améliorer la fiche" description="Des propositions de nom, titre, accroche, description, points forts et FAQ. Rien n’est inventé : seules les informations de la page sont utilisées.">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
            <Input label="Objectif" optional placeholder="Ex. cible les femmes de 25 à 40 ans, ton rassurant" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} wrapClass="flex-1" />
            <div className="flex gap-2">
              <Button variant="primary" onClick={askSuggestions} loading={suggesting}>
                <Wand2 className="size-4" /> {suggest ? 'Nouvelles propositions' : 'Proposer des améliorations'}
              </Button>
              {suggest && (
                <Button onClick={applyAll}>
                  <Check className="size-4" /> Tout appliquer
                </Button>
              )}
            </div>
          </div>
          {suggesting && <p className="flex items-center gap-2 px-4 pb-4 text-sm text-muted sm:px-5"><Loader2 className="size-4 animate-spin" /> Rédaction en cours, cela peut prendre jusqu’à 30 secondes…</p>}
        </Card>
      )}

      <Card title={`Images (${selectedImages.length} sur ${images.length})`} description="Cochez les images à importer et glissez-les pour changer l’ordre. La première cochée devient la couverture.">
        <div className="p-4 sm:p-5">
          {images.length === 0 ? (
            <p className="text-sm text-muted">Aucune image détectée. Vous pourrez en ajouter dans l’éditeur après l’import.</p>
          ) : (
            <ul ref={imageSort.listRef} className={cx('grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5', imageSort.dragging && 'select-none')}>
              {images.map((img, i) => {
                const isCover = img.selected && selectedImages[0]?.url === img.url
                return (
                  <li key={img.url} {...imageSort.itemProps(i)} className={cx('relative aspect-square overflow-hidden rounded-xl border bg-surface-2', img.selected ? 'border-line' : 'border-line opacity-40', imageSort.dragIndex === i && draggingClass)}>
                    <img src={img.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-contain" />
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-black/60 text-white">
                      <DragHandle {...imageSort.handleProps(i, `l’image ${i + 1}`)} className="text-white hover:bg-black/40 hover:text-white" />
                    </span>
                    <label className="absolute top-1.5 right-1.5 flex items-center rounded-md bg-surface/90 p-1">
                      <Checkbox checked={img.selected} onChange={(selected) => setImages(images.map((x, k) => (k === i ? { ...x, selected } : x)))} label={`Importer l’image ${i + 1}`} />
                    </label>
                    {isCover && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-fg">Couverture</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Card>

      <Card title="Produit">
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
            <Suggestion field="name" label="nom">
              {suggest?.name}
            </Suggestion>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Prix de vente" value={price} onChange={setPrice} suffix={currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency} integer={false} />
            <NumberField label="Prix barré" optional value={compareAt} onChange={setCompareAt} suffix={currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency} integer={false} />
          </div>
          {otherCurrency && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Le site source affiche ses prix en {d0.currency}. Votre boutique est en {currency} : saisissez votre prix de vente.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Input label="Sur-titre" optional placeholder="Ex. Accessoire · Gaming" value={kicker} onChange={(e) => setKicker(e.target.value)} maxLength={80} />
              <Suggestion field="kicker" label="sur-titre">
                {suggest?.kicker}
              </Suggestion>
            </div>
            <div className="sm:col-span-3">
              <Input label="Titre accrocheur" optional value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={160} />
              <Suggestion field="headline" label="titre accrocheur">
                {suggest?.headline}
              </Suggestion>
            </div>
            <div className="sm:col-span-3">
              <Textarea label="Accroche" optional rows={2} value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={300} />
              <Suggestion field="tagline" label="accroche">
                {suggest?.tagline}
              </Suggestion>
            </div>
          </div>
          <Input label="Vidéo" optional placeholder="Lien YouTube, Vimeo, TikTok…" value={video} onChange={(e) => setVideo(e.target.value)} />
        </div>
      </Card>

      <Card title={`Variantes (${variants.length})`} description={variants.length ? 'Détectées sur la page. Les variantes indisponibles seront importées désactivées.' : 'Aucune variante détectée.'}>
        {variants.length > 0 && (
          <div className="space-y-3 p-4 sm:p-5">
            <Input label="Nom de l’option" placeholder="Ex. Couleur, Taille" value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} maxLength={40} wrapClass="sm:max-w-xs" />
            <ul className="space-y-2">
              {variants.map((v, i) => (
                <li key={i} className="grid grid-cols-[1fr_8rem_auto_auto] items-center gap-2">
                  <Input aria-label="Nom de la variante" value={v.name} onChange={(e) => setVariants(variants.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                  <NumberField ariaLabel="Prix de la variante" placeholder={price != null ? String(price) : ''} value={v.price} onChange={(p) => setVariants(variants.map((x, k) => (k === i ? { ...x, price: p } : x)))} integer={false} />
                  <Switch size="sm" checked={v.available} onChange={(available) => setVariants(variants.map((x, k) => (k === i ? { ...x, available } : x)))} ariaLabel={`Variante ${v.name} disponible`} />
                  <Button size="icon" variant="ghost" onClick={() => setVariants(variants.filter((_, k) => k !== i))} aria-label={`Retirer ${v.name}`} className="text-red-600 dark:text-red-400">
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card title="Description">
        <div className="p-4 sm:p-5">
          {description ? (
            // HTML déjà nettoyé par le serveur (sanitize-html).
            <div className="prose-sm max-h-80 overflow-y-auto rounded-lg border border-line bg-surface-2/40 p-3 text-sm [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            <p className="text-sm text-muted">Aucune description détectée. Vous pourrez l’écrire dans l’éditeur.</p>
          )}
          <Suggestion field="description" label="description">
            <div className="max-h-60 overflow-y-auto [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2" dangerouslySetInnerHTML={{ __html: suggest?.description ?? '' }} />
          </Suggestion>
        </div>
      </Card>

      <Card title="Points forts" description="Repris de la description : modifiables.">
        <div className="space-y-2 p-4 sm:p-5">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`Point fort ${i + 1}`} value={f} onChange={(e) => setFeatures(features.map((x, k) => (k === i ? e.target.value : x)))} wrapClass="flex-1" maxLength={200} />
              <Button size="icon" variant="ghost" onClick={() => setFeatures(features.filter((_, k) => k !== i))} aria-label="Retirer" className="text-red-600 dark:text-red-400">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {features.length < 30 && (
            <Button size="sm" onClick={() => setFeatures([...features, ''])}>
              + Ajouter un point fort
            </Button>
          )}
          <Suggestion field="features" label="points forts">
            <ul className="ml-5 list-disc">{suggest?.features.map((f) => <li key={f}>{f}</li>)}</ul>
          </Suggestion>
        </div>
      </Card>

      <Card title={`Questions fréquentes (${faqs.filter((f) => f.selected).length})`}>
        <div className="space-y-2 p-4 sm:p-5">
          {faqs.length === 0 && <p className="text-sm text-muted">Aucune FAQ détectée.</p>}
          {faqs.map((f, i) => (
            <label key={i} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3">
              <Checkbox checked={f.selected} onChange={(selected) => setFaqs(faqs.map((x, k) => (k === i ? { ...x, selected } : x)))} label={f.question} />
              <span className="text-sm">
                <strong className="block">{f.question}</strong>
                <span className="text-muted">{f.answer}</span>
              </span>
            </label>
          ))}
          <Suggestion field="faqs" label="FAQ">
            <ul className="space-y-1.5">{suggest?.faqs.map((f) => <li key={f.question}><strong>{f.question}</strong> {f.answer}</li>)}</ul>
          </Suggestion>
        </div>
      </Card>

      {reviews.length > 0 && (
        <Card title="Avis détectés sur la page" description="Cochez seulement les avis réels que vous avez le droit de reprendre.">
          <div className="space-y-2 p-4 sm:p-5">
            {reviews.map((r, i) => (
              <label key={i} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3">
                <Checkbox checked={r.selected} onChange={(selected) => setReviews(reviews.map((x, k) => (k === i ? { ...x, selected } : x)))} label={`Avis de ${r.name}`} />
                <span className="text-sm">
                  <span className="flex items-center gap-1 font-medium">
                    {r.name}
                    <span className="flex text-amber-500" aria-label={`${r.rating} sur 5`}>
                      {Array.from({ length: r.rating }, (_, k) => <Star key={k} className="size-3 fill-current" />)}
                    </span>
                  </span>
                  <span className="text-muted">{r.text}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Barre d'action fixe */}
      <div className="sticky bottom-20 z-20 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur lg:bottom-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Switch checked={activate} onChange={setActivate} label="Mettre en vente tout de suite" description={activate ? 'Le produit sera visible dès l’import.' : 'Le produit sera importé désactivé, pour le relire d’abord.'} />
          <div className="flex items-center gap-3">
            {price != null && <span className="hidden text-sm font-semibold sm:inline">{money(price, currency)}</span>}
            <Button variant="primary" size="lg" onClick={doImport} loading={importing}>
              Importer le produit
            </Button>
          </div>
        </div>
        {importing && <p className="mt-1 text-xs text-muted">Récupération des {selectedImages.length} image(s) et création du produit…</p>}
      </div>
    </div>
  )
}

export default function ImportUrl() {
  const storeId = useStoreId()
  const { data: me } = useMe()
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Secours : coller le texte de la page quand un site bloque toute lecture automatique.
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const valid = useMemo(() => /^https?:\/\/\S+\.\S+/.test(url.trim()), [url])

  const analyse = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return setError('Collez l’adresse complète de la page produit (https://…)')
    setError(null)
    setLoading(true)
    try {
      setPreview(await api.post<Preview>(`/stores/${storeId}/products/import/url/preview`, { url: url.trim() }))
    } catch (err) {
      setError(errorMessage(err))
      if (err instanceof ApiError && err.code === 'page_unreadable') setPasteOpen(true)
      else toast.error(err)
    } finally {
      setLoading(false)
    }
  }

  const analyseText = async (e: FormEvent) => {
    e.preventDefault()
    if (pasted.trim().length < 40) return setPasteError('Colle le contenu de la page produit : nom, prix, description…')
    setPasteError(null)
    setLoading(true)
    try {
      setPreview(await api.post<Preview>(`/stores/${storeId}/products/import/url/preview-text`, { text: pasted.trim(), url: valid ? url.trim() : null }))
    } catch (err) {
      setPasteError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (me && !me.features.urlImport) return <Navigate to={`/stores/${storeId}/products/import`} replace />
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Importer depuis un lien"
        description="Collez le lien d’une page produit (Shopify, WooCommerce, AliExpress, Jumia, Amazon, autre boutique) : nom, prix, variantes, images, vidéo et contenu sont détectés automatiquement."
        back={
          <Link to={`/stores/${storeId}/products`} className="mb-1 inline-block text-sm text-muted hover:text-fg">
            ← Produits
          </Link>
        }
      />
      {!preview ? (
        <div className="space-y-4">
          <Card>
            <form onSubmit={analyse} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:p-5" noValidate>
              <Input aria-label="Lien de la page produit" type="url" inputMode="url" placeholder="https://boutique.com/products/mon-produit" value={url} onChange={(e) => setUrl(e.target.value)} error={error ?? undefined} wrapClass="flex-1" autoFocus />
              <Button type="submit" variant="primary" size="lg" loading={loading && !pasteOpen}>
                <Link2 className="size-4" /> Analyser
              </Button>
            </form>
            {loading && (
              <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-sm text-muted sm:px-5">
                <Loader2 className="size-4 animate-spin" /> Analyse de la page… quelques secondes, jusqu’à une minute pour les sites protégés.
              </p>
            )}
            {!pasteOpen && !loading && (
              <button type="button" onClick={() => setPasteOpen(true)} className="w-full border-t border-line px-4 py-3 text-left text-[13px] text-muted hover:text-fg sm:px-5">
                Le site bloque l’analyse ? <span className="font-medium text-accent">Colle le contenu de la page</span>
              </button>
            )}
          </Card>
          {pasteOpen && (
            <Card title="Coller le contenu de la page" description="Ouvre la page produit, sélectionne tout (Ctrl+A ou appui long puis « Tout sélectionner »), copie et colle ici. L’IA retrouve le nom, le prix, la description et les variantes.">
              <form onSubmit={analyseText} className="space-y-3" noValidate>
                <Textarea aria-label="Contenu de la page produit" rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} error={pasteError ?? undefined} maxLength={60_000} placeholder="Colle ici le texte de la page produit…" />
                <p className="text-[12px] text-muted">Pour les photos : colle aussi leurs liens (clic droit sur l’image, « Copier l’adresse de l’image »), ou ajoute-les ensuite dans la fiche.</p>
                <Button type="submit" variant="primary" loading={loading}>
                  Analyser le texte
                </Button>
              </form>
            </Card>
          )}
        </div>
      ) : (
        <Review key={preview.sourceUrl + preview.draft.name} preview={preview} onRestart={() => setPreview(null)} />
      )}
    </div>
  )
}
