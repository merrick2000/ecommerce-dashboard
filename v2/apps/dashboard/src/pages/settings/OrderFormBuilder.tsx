import {
  CUSTOM_FIELD_TYPES,
  DEFAULT_ORDER_FORM,
  FORM_VARIABLES,
  interpolate,
  resolveFormFields,
  type CustomFieldType,
  type OrderForm,
  type OrderFormField,
  type OrderFormTexts,
} from '@zuri/shared'
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Lock, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Badge, Button, Card, cx, Input, Segmented, Select, Switch, TagInput, Textarea } from '@/components/ui'

export const BUILTIN_LABEL: Record<string, string> = {
  variant: 'Choix (variante)',
  quantity: 'Quantité / offres',
  name: 'Nom complet',
  phone: 'Téléphone',
  email: 'Email',
  city: 'Ville / zone de livraison',
  address: 'Quartier, repère',
  note: 'Note pour le livreur',
}

const TYPE_LABEL: Record<CustomFieldType, string> = {
  text: 'Texte court',
  textarea: 'Texte long',
  number: 'Nombre',
  select: 'Liste déroulante',
  radio: 'Choix unique',
  checkbox: 'Cases à cocher',
  date: 'Date',
}

/** Ce que le vendeur ne peut pas changer, et pourquoi. */
const LOCKS: Record<string, string> = {
  name: 'Toujours visible et obligatoire.',
  phone: 'Toujours visible et obligatoire : c’est le numéro appelé pour confirmer.',
  city: 'Toujours demandée pour un produit physique : elle fixe les frais de livraison.',
  variant: 'Affiché seulement si le produit a des variantes.',
}
const PHYSICAL_ONLY = new Set(['variant', 'quantity', 'city', 'address', 'note'])

/** Liste complète et ordonnée (tous les champs intégrés présents), prête à être éditée. */
export function normalizeForm(form: OrderForm | null | undefined): OrderForm {
  const base = form ?? DEFAULT_ORDER_FORM
  return { ...DEFAULT_ORDER_FORM, ...base, texts: { ...DEFAULT_ORDER_FORM.texts, ...base.texts }, fields: resolveFormFields(base, 'physical') }
}

const newKey = () => `cf_${Math.random().toString(36).slice(2, 8)}`

const TEXT_FIELDS: { key: keyof Omit<OrderFormTexts, 'reassurance'>; label: string; hint?: string; long?: boolean }[] = [
  { key: 'title', label: 'Titre du formulaire', hint: 'Vide : « Passer ma commande ».' },
  { key: 'subtitle', label: 'Sous-titre', hint: 'Vide : nom du produit et prix.', long: true },
  { key: 'submitCod', label: 'Bouton (paiement à la livraison)', hint: 'Vide : « Commander (paiement à la livraison) ».' },
  { key: 'submitOnline', label: 'Bouton (paiement en ligne)', hint: 'Vide : texte du bouton de la page de vente | total.' },
  { key: 'footnote', label: 'Texte sous le bouton', hint: 'Vide : texte par défaut selon le mode de paiement.', long: true },
  { key: 'successTitle', label: 'Titre après commande', hint: 'Vide : « Merci {prenom} ! ».' },
  { key: 'successMessage', label: 'Message après commande', hint: 'Vide : numéro de commande et « Nous vous appelons très vite… ».', long: true },
]

export function OrderFormBuilder({ value, onChange, storeName, currency, disabled }: { value: OrderForm; onChange: (f: OrderForm) => void; storeName: string; currency: string; disabled?: boolean }) {
  const [previewType, setPreviewType] = useState<'physical' | 'digital'>('physical')
  const [open, setOpen] = useState<string | null>(null)
  const [addType, setAddType] = useState<CustomFieldType>('text')
  // Dernier champ texte actif : les variables cliquées s'y insèrent à la position du curseur.
  const active = useRef<{ key: keyof OrderFormTexts | `r${number}`; el: HTMLInputElement | HTMLTextAreaElement } | null>(null)

  const fields = value.fields
  const setFields = (next: OrderFormField[]) => onChange({ ...value, fields: next })
  const patchField = (key: string, patch: Partial<OrderFormField>) => setFields(fields.map((f) => (f.key === key ? { ...f, ...patch } : f)))
  const setTexts = (patch: Partial<OrderFormTexts>) => onChange({ ...value, texts: { ...value.texts, ...patch } })
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= fields.length) return
    const next = [...fields]
    ;[next[i], next[j]] = [next[j]!, next[i]!]
    setFields(next)
  }
  const addField = () => {
    const key = newKey()
    const needsOptions = addType === 'select' || addType === 'radio'
    setFields([...fields, { key, builtin: false, type: addType, visible: true, required: false, label: TYPE_LABEL[addType], placeholder: '', help: '', width: 'full', options: needsOptions ? ['Option 1', 'Option 2'] : [] }])
    setOpen(key)
  }

  const insertVar = (name: string) => {
    const a = active.current
    if (!a) return
    const token = `{${name}}`
    const el = a.el
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + token + el.value.slice(end)
    if (a.key.startsWith('r')) {
      const idx = Number(a.key.slice(1))
      setTexts({ reassurance: value.texts.reassurance.map((r, i) => (i === idx ? next : r)) })
    } else setTexts({ [a.key]: next } as Partial<OrderFormTexts>)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <fieldset disabled={disabled} className="min-w-0 space-y-4">
        <Card title="Champs" description="Ordre, visibilité, libellés. Les champs grisés ne s’appliquent pas au type de produit de l’aperçu.">
          <ul className="divide-y divide-line">
            {fields.map((f, i) => {
              const lock = LOCKS[f.key]
              const lockedVisible = f.key === 'name' || f.key === 'phone' || f.key === 'city' || f.key === 'variant'
              const inapplicable = previewType === 'digital' && f.builtin && PHYSICAL_ONLY.has(f.key)
              const title = f.label || (f.builtin ? BUILTIN_LABEL[f.key] : TYPE_LABEL[f.type ?? 'text'])
              const expanded = open === f.key
              return (
                <li key={f.key} className={cx('py-2.5', inapplicable && 'opacity-50')}>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button type="button" className="rounded p-0.5 text-muted hover:text-fg disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Monter ${title}`}>
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button type="button" className="rounded p-0.5 text-muted hover:text-fg disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label={`Descendre ${title}`}>
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(expanded ? null : f.key)} aria-expanded={expanded}>
                      <span className={cx('truncate text-sm font-medium', !f.visible && 'text-muted line-through')}>{title}</span>
                      {!f.builtin && <Badge>{TYPE_LABEL[f.type ?? 'text']}</Badge>}
                      {f.builtin && PHYSICAL_ONLY.has(f.key) && <Badge>Physique</Badge>}
                      {f.visible && f.required && <Badge tone="amber">Obligatoire</Badge>}
                      {f.width === 'half' && <Badge>Demi-largeur</Badge>}
                      <ChevronDown className={cx('ml-auto size-4 shrink-0 text-muted transition-transform', expanded && 'rotate-180')} />
                    </button>
                    {lockedVisible ? (
                      <span className="p-1.5 text-subtle" title={lock}>
                        <Lock className="size-4" />
                      </span>
                    ) : (
                      <button type="button" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" onClick={() => patchField(f.key, { visible: !f.visible })} aria-label={f.visible ? `Masquer ${title}` : `Afficher ${title}`}>
                        {f.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="mt-3 grid gap-3 rounded-lg bg-surface-2/60 p-3 sm:grid-cols-2">
                      {lock && <p className="text-[13px] text-muted sm:col-span-2">{lock}</p>}
                      {f.key === 'email' && <p className="text-[13px] text-muted sm:col-span-2">Toujours obligatoire pour un produit digital (le client y reçoit son accès).</p>}
                      {!f.builtin && (
                        <Select label="Type" value={f.type ?? 'text'} onChange={(e) => patchField(f.key, { type: e.target.value as CustomFieldType })} options={CUSTOM_FIELD_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))} />
                      )}
                      <Input label="Libellé" placeholder={f.builtin ? BUILTIN_LABEL[f.key] : ''} value={f.label} maxLength={80} onChange={(e) => patchField(f.key, { label: e.target.value })} />
                      {f.key !== 'variant' && f.key !== 'quantity' && f.type !== 'radio' && f.type !== 'checkbox' && (
                        <Input label="Texte indicatif" optional value={f.placeholder} maxLength={120} onChange={(e) => patchField(f.key, { placeholder: e.target.value })} />
                      )}
                      <Input label="Aide sous le champ" optional value={f.help} maxLength={200} onChange={(e) => patchField(f.key, { help: e.target.value })} wrapClass="sm:col-span-2" />
                      {(f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') && (
                        <div className="sm:col-span-2">
                          <TagInput
                            label="Options"
                            placeholder="Ajoutez une option puis Entrée"
                            value={f.options}
                            onChange={(options) => patchField(f.key, { options: options.slice(0, 30) })}
                            hint={f.type === 'checkbox' ? 'Sans option : une seule case « Oui » (accord, consentement).' : 'Au moins une option.'}
                          />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                        {!lockedVisible && f.key !== 'quantity' && (
                          <Switch checked={f.required} onChange={(required) => patchField(f.key, { required, visible: required ? true : f.visible })} label="Obligatoire" />
                        )}
                        {f.key !== 'variant' && (
                          <Segmented
                            label="Largeur"
                            value={f.width}
                            onChange={(width) => patchField(f.key, { width })}
                            options={[
                              { value: 'full', label: 'Pleine largeur' },
                              { value: 'half', label: 'Demi-largeur' },
                            ]}
                          />
                        )}
                        {!f.builtin && (
                          <Button size="sm" variant="ghost" className="ml-auto text-red-600" onClick={() => setFields(fields.filter((x) => x.key !== f.key))}>
                            <Trash2 className="size-3.5" /> Supprimer
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
            <Select label="Ajouter un champ" value={addType} onChange={(e) => setAddType(e.target.value as CustomFieldType)} options={CUSTOM_FIELD_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))} wrapClass="min-w-44" />
            <Button onClick={addField} disabled={fields.length >= 40}>
              <Plus className="size-4" /> Ajouter
            </Button>
          </div>
        </Card>

        <Card title="Textes" description="Cliquez dans un texte puis sur une variable pour l’insérer. Les valeurs se mettent à jour en direct chez le client.">
          <div className="mb-4 flex flex-wrap gap-1.5" aria-label="Variables">
            {FORM_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                title={v.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertVar(v.key)}
                className="rounded-md border border-line-strong bg-surface px-2 py-1 font-mono text-[12px] text-fg hover:border-accent hover:text-accent"
              >
                {`{${v.key}}`}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map((tf) =>
              tf.long ? (
                <Textarea
                  key={tf.key}
                  label={tf.label}
                  hint={tf.hint}
                  rows={2}
                  value={value.texts[tf.key]}
                  onFocus={(e) => (active.current = { key: tf.key, el: e.currentTarget })}
                  onChange={(e) => setTexts({ [tf.key]: e.target.value } as Partial<OrderFormTexts>)}
                  wrapClass="sm:col-span-2"
                />
              ) : (
                <Input key={tf.key} label={tf.label} hint={tf.hint} value={value.texts[tf.key]} onFocus={(e) => (active.current = { key: tf.key, el: e.currentTarget })} onChange={(e) => setTexts({ [tf.key]: e.target.value } as Partial<OrderFormTexts>)} />
              ),
            )}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Mentions de réassurance (sous le bouton)</p>
            {value.texts.reassurance.map((r, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label={`Mention ${i + 1}`}
                  value={r}
                  maxLength={120}
                  onFocus={(e) => (active.current = { key: `r${i}`, el: e.currentTarget })}
                  onChange={(e) => setTexts({ reassurance: value.texts.reassurance.map((x, k) => (k === i ? e.target.value : x)) })}
                  wrapClass="flex-1"
                />
                <Button variant="ghost" aria-label={`Retirer la mention ${i + 1}`} onClick={() => setTexts({ reassurance: value.texts.reassurance.filter((_, k) => k !== i) })}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {value.texts.reassurance.length < 6 && (
              <Button size="sm" onClick={() => setTexts({ reassurance: [...value.texts.reassurance, 'Livraison rapide à {ville}'] })}>
                <Plus className="size-3.5" /> Ajouter une mention
              </Button>
            )}
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <Switch checked={value.showPromo} onChange={(showPromo) => onChange({ ...value, showPromo })} label="Proposer le champ « code promo »" description="Un lien ?promo=CODE continue de s’appliquer même si le champ est masqué." />
          </div>
        </Card>
      </fieldset>

      <div className="lg:sticky lg:top-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Aperçu</p>
          <Segmented
            label="Type de produit de l’aperçu"
            value={previewType}
            onChange={setPreviewType}
            options={[
              { value: 'physical', label: 'Physique' },
              { value: 'digital', label: 'Digital' },
            ]}
          />
        </div>
        <OrderFormPreview form={value} productType={previewType} storeName={storeName} currency={currency} />
      </div>
    </div>
  )
}

/** Aperçu fidèle (sans interaction) du formulaire du storefront, avec des données d'exemple. */
export function OrderFormPreview({ form, productType, storeName, currency }: { form: OrderForm; productType: 'physical' | 'digital'; storeName: string; currency: string }) {
  const physical = productType === 'physical'
  const fields = resolveFormFields(form, productType)
  const devise = currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency
  const fmt = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} ${devise}`
  const unit = physical ? 15000 : 9900
  const fee = physical ? 1000 : 0
  const vars = {
    produit: physical ? 'Montre connectée X1' : 'Formation Excel',
    prix: fmt(unit),
    quantite: 1,
    offre: '1 unité',
    sous_total: fmt(unit),
    livraison: physical ? fmt(fee) : 'Gratuite',
    total: fmt(unit + fee),
    devise,
    ville: physical ? 'Cotonou' : '',
    prenom: 'Awa',
    boutique: storeName,
    commande: 'ZR-AB12CD',
  }
  const tx = (s: string) => interpolate(s, vars)
  const t = form.texts
  const cod = physical
  const submit = cod ? (t.submitCod ? tx(t.submitCod) : 'Commander (paiement à la livraison)') : t.submitOnline ? tx(t.submitOnline) : `Acheter maintenant | ${vars.total}`
  const footnote = t.footnote ? tx(t.footnote) : cod ? 'Vous payez en espèces à la réception. Nous vous appelons pour confirmer.' : 'Paiement 100 % sécurisé par Mobile Money'
  const box = 'h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-subtle flex items-center'

  const render = (f: OrderFormField) => {
    if (!f.visible && !(f.builtin && (f.key === 'variant' || f.key === 'quantity'))) return null
    if (f.key === 'quantity' && !f.visible) return null
    const label = f.label ? tx(f.label) : f.builtin ? BUILTIN_LABEL[f.key]!.replace(' (variante)', '').replace(' / offres', '') : f.key
    const optional = !f.required && f.key !== 'variant' && f.key !== 'quantity' ? ' (facultatif)' : ''
    const span = f.width === 'half' ? 'col-span-1' : 'col-span-2'
    let control
    if (f.key === 'variant')
      control = (
        <div className="flex gap-1.5">
          {['Noir', 'Argent'].map((x, i) => (
            <span key={x} className={cx('rounded-full border px-3 py-1 text-[12px]', i === 0 ? 'border-accent bg-accent/10' : 'border-line-strong')}>
              {x}
            </span>
          ))}
        </div>
      )
    else if (f.key === 'quantity')
      control = (
        <div className="flex h-10 w-28 items-center justify-between rounded-lg border border-line-strong px-3 text-sm">
          <span>−</span>1<span>+</span>
        </div>
      )
    else if (f.type === 'radio' || f.type === 'checkbox')
      control = (
        <div className="flex flex-wrap gap-1.5">
          {(f.options.length ? f.options : ['Oui']).map((o) => (
            <span key={o} className="rounded-full border border-line-strong px-3 py-1 text-[12px]">
              {o}
            </span>
          ))}
        </div>
      )
    else control = <div className={cx(box, f.type === 'textarea' || f.key === 'note' ? 'h-16 items-start pt-2' : '')}>{f.placeholder ? tx(f.placeholder) : f.type === 'select' || f.key === 'city' ? 'Choisissez…' : ''}</div>
    return (
      <div key={f.key} className={cx(span, 'space-y-1')}>
        <p className="text-[13px] font-semibold">
          {label}
          <span className="font-normal text-muted">{optional}</span>
        </p>
        {control}
        {f.help && <p className="text-[11px] text-muted">{tx(f.help)}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <p className="text-lg font-bold">{t.title ? tx(t.title) : 'Passer ma commande'}</p>
        <p className="mb-3 text-[13px] whitespace-pre-line text-muted">{t.subtitle ? tx(t.subtitle) : `${vars.produit} · ${vars.prix}`}</p>
        <div className="grid grid-cols-2 gap-3">{fields.map(render)}</div>
        {form.showPromo && <p className="mt-3 text-[13px] text-muted underline">Vous avez un code promo ?</p>}
        <dl className="mt-3 space-y-1 rounded-lg bg-surface-2 p-3 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted">Sous-total</dt>
            <dd>{vars.sous_total}</dd>
          </div>
          {physical && (
            <div className="flex justify-between">
              <dt className="text-muted">Livraison</dt>
              <dd>{vars.livraison}</dd>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <dt>Total</dt>
            <dd>{vars.total}</dd>
          </div>
        </dl>
        <div className="mt-3 rounded-xl bg-accent px-3 py-3 text-center text-sm font-bold text-white">{submit}</div>
        {t.reassurance.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-[12px] text-muted">
            {t.reassurance.map((r, i) => (
              <li key={i}>
                <span className="font-bold text-green-600">✓</span> {tx(r)}
              </li>
            ))}
          </ul>
        )}
        {footnote && <p className="mt-2 text-center text-[12px] whitespace-pre-line text-muted">{footnote}</p>}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4 text-center">
        <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">Après la commande</p>
        <p className="mt-1 font-bold">{t.successTitle ? tx(t.successTitle) : `Merci ${vars.prenom} !`}</p>
        <p className="text-[13px] whitespace-pre-line text-muted">{t.successMessage ? tx(t.successMessage) : `Votre commande n° ${vars.commande} est bien reçue. Nous vous appelons très vite pour confirmer la livraison.`}</p>
      </div>
    </div>
  )
}
