/**
 * Formulaire de commande : logique PURE (aucune dépendance, pas de zod).
 * Importée par le storefront (via « @zuri/shared/form-runtime »), le dashboard (aperçu) et l'API (validation).
 */

export const BUILTIN_FIELDS = ['variant', 'quantity', 'name', 'phone', 'email', 'city', 'address', 'note'] as const
export type BuiltinField = (typeof BUILTIN_FIELDS)[number]

export const CUSTOM_FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date'] as const
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number]

export interface OrderFormField {
  /** Champ intégré (« name », « phone »…) ou personnalisé (« cf_xxxx »). */
  key: string
  builtin: boolean
  type: CustomFieldType | null
  visible: boolean
  required: boolean
  /** Vide = libellé par défaut du storefront. */
  label: string
  placeholder: string
  help: string
  width: 'full' | 'half'
  options: string[]
}

export interface OrderFormTexts {
  title: string
  subtitle: string
  /** Vide = texte par défaut (« Commander (paiement à la livraison) »). */
  submitCod: string
  /** Vide = « {texte du bouton} | {total} ». */
  submitOnline: string
  successTitle: string
  successMessage: string
  reassurance: string[]
  footnote: string
}

export interface OrderForm {
  fields: OrderFormField[]
  texts: OrderFormTexts
  showPromo: boolean
}

const builtin = (key: BuiltinField, visible: boolean, required: boolean): OrderFormField => ({ key, builtin: true, type: null, visible, required, label: '', placeholder: '', help: '', width: 'full', options: [] })

/** Reproduit exactement le formulaire historique. */
export const DEFAULT_FORM_FIELDS: OrderFormField[] = [
  builtin('variant', true, true),
  builtin('quantity', true, false),
  builtin('name', true, true),
  builtin('phone', true, true),
  builtin('email', false, false),
  builtin('city', true, true),
  builtin('address', true, true),
  builtin('note', true, false),
]

export const DEFAULT_FORM_TEXTS: OrderFormTexts = { title: '', subtitle: '', submitCod: '', submitOnline: '', successTitle: '', successMessage: '', reassurance: [], footnote: '' }

export const DEFAULT_ORDER_FORM: OrderForm = { fields: DEFAULT_FORM_FIELDS, texts: DEFAULT_FORM_TEXTS, showPromo: true }

/** Champs intégrés propres aux produits physiques. */
const PHYSICAL_ONLY: readonly string[] = ['variant', 'quantity', 'city', 'address', 'note']

/**
 * Champs effectifs pour un type de produit, dans l'ordre choisi, avec les règles non négociables :
 * nom et téléphone toujours visibles et obligatoires ; email obligatoire pour un produit digital
 * (c'est là qu'il reçoit son accès) ; ville toujours demandée pour un produit physique (frais de livraison).
 */
export function resolveFormFields(form: Pick<OrderForm, 'fields'> | null | undefined, productType: 'digital' | 'physical'): OrderFormField[] {
  const source = form?.fields?.length ? form.fields : DEFAULT_FORM_FIELDS
  const seen = new Set<string>()
  const list: OrderFormField[] = []
  for (const f of source) {
    if (seen.has(f.key)) continue
    if (f.builtin && !(BUILTIN_FIELDS as readonly string[]).includes(f.key)) continue
    seen.add(f.key)
    list.push({ ...f, options: f.options ?? [] })
  }
  // Un champ intégré oublié revient à sa place par défaut (configuration ancienne ou abîmée).
  for (const d of DEFAULT_FORM_FIELDS) {
    if (seen.has(d.key)) continue
    const at = DEFAULT_FORM_FIELDS.indexOf(d)
    const before = DEFAULT_FORM_FIELDS.slice(at + 1).find((x) => seen.has(x.key))
    const idx = before ? list.findIndex((x) => x.key === before.key) : list.length
    list.splice(idx, 0, { ...d })
    seen.add(d.key)
  }
  return list
    .filter((f) => !(productType === 'digital' && f.builtin && PHYSICAL_ONLY.includes(f.key)))
    .map((f) => {
      if (!f.builtin) return f
      if (f.key === 'name' || f.key === 'phone') return { ...f, visible: true, required: true }
      if (f.key === 'email' && productType === 'digital') return { ...f, visible: true, required: true }
      if (f.key === 'city') return { ...f, visible: true, required: true }
      if (f.key === 'variant') return { ...f, visible: true, required: true }
      if (!f.visible) return { ...f, required: false }
      return f
    })
}

// ─── Variables injectables ───────────────────────────────────────────────────

export const FORM_VARIABLES: { key: string; label: string }[] = [
  { key: 'produit', label: 'Nom du produit' },
  { key: 'prix', label: 'Prix unitaire' },
  { key: 'quantite', label: 'Quantité' },
  { key: 'offre', label: 'Offre choisie' },
  { key: 'sous_total', label: 'Sous-total' },
  { key: 'livraison', label: 'Frais de livraison' },
  { key: 'total', label: 'Total à payer' },
  { key: 'devise', label: 'Devise' },
  { key: 'ville', label: 'Ville choisie' },
  { key: 'prenom', label: 'Prénom du client' },
  { key: 'boutique', label: 'Nom de la boutique' },
  { key: 'commande', label: 'N° de commande (message de succès)' },
]

/**
 * Remplace {variable} par sa valeur. Une variable inconnue reste telle quelle.
 * Le résultat est du TEXTE BRUT : il doit être inséré comme texte (Preact/React échappent), jamais en HTML.
 */
export function interpolate(text: string, vars: Record<string, string | number | null | undefined>): string {
  if (!text || !text.includes('{')) return text
  return text.replace(/\{([a-z_]+)\}/g, (all, key: string) => {
    const v = vars[key]
    return v === undefined || v === null ? all : String(v)
  })
}

// ─── Validation des champs personnalisés (serveur, et client pour les messages) ─

export type CustomFieldValue = string | string[]
export interface CustomFieldAnswer {
  key: string
  label: string
  value: string
}

const LIMITS: Record<CustomFieldType, number> = { text: 200, textarea: 1000, number: 30, select: 80, radio: 80, checkbox: 80, date: 10 }

/**
 * Vérifie les réponses aux champs personnalisés visibles.
 * Renvoie les réponses propres (dans l'ordre du formulaire) ou la liste des erreurs par clé.
 */
export function checkCustomFields(
  fields: OrderFormField[],
  input: Record<string, CustomFieldValue | undefined> | null | undefined,
): { ok: true; answers: CustomFieldAnswer[] } | { ok: false; issues: { key: string; message: string }[] } {
  const answers: CustomFieldAnswer[] = []
  const issues: { key: string; message: string }[] = []
  for (const f of fields) {
    if (f.builtin || !f.visible || !f.type) continue
    const raw = input?.[f.key]
    const label = f.label || f.key
    let value = ''
    if (f.type === 'checkbox') {
      const list = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((x) => String(x).trim()).filter(Boolean)
      // Sans options : une seule case (consentement), valeur « Oui ».
      const allowed = f.options.length ? f.options : ['Oui']
      if (list.some((x) => !allowed.includes(x))) {
        issues.push({ key: f.key, message: `${label} : choix invalide` })
        continue
      }
      value = list.join(', ')
    } else {
      if (Array.isArray(raw)) {
        issues.push({ key: f.key, message: `${label} : valeur invalide` })
        continue
      }
      value = (raw ?? '').toString().trim()
      if (value.length > LIMITS[f.type]) {
        issues.push({ key: f.key, message: `${label} : ${LIMITS[f.type]} caractères maximum` })
        continue
      }
      if (value) {
        if (f.type === 'number' && !/^-?\d+([.,]\d+)?$/.test(value)) {
          issues.push({ key: f.key, message: `${label} : nombre attendu` })
          continue
        }
        if (f.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) {
          issues.push({ key: f.key, message: `${label} : date invalide` })
          continue
        }
        if ((f.type === 'select' || f.type === 'radio') && !f.options.includes(value)) {
          issues.push({ key: f.key, message: `${label} : choix invalide` })
          continue
        }
      }
    }
    if (f.required && !value) {
      issues.push({ key: f.key, message: `${label} : champ obligatoire` })
      continue
    }
    if (value) answers.push({ key: f.key, label, value })
  }
  return issues.length ? { ok: false, issues } : { ok: true, answers }
}
