/**
 * Formulaire de commande, le seul JS conséquent de la page de vente.
 * Les montants affichés sont indicatifs : l'API recalcule tout (services/pricing.ts).
 */
import type { CustomFieldValue, OrderForm, OrderFormField, PublicOrderCreate, QuantityOffer } from '@zuri/shared'
import { checkCustomFields, interpolate, resolveFormFields } from '@zuri/shared/form-runtime'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { api, fmt } from '../client/http'
import { DIAL, dialFor, flag, fullPhone, validEmail } from '../client/phone'
import { getJSON, getStr, setJSON, setStr } from '../client/storage'
import { initiateCheckout, noTrack, orderAttribution, purchaseOnce, track } from '../client/track'
import { money, roundMoney } from '../lib/format'
import type { CartStrings, FormStrings, PayStrings } from '../lib/i18n'
import { addToCart, clearCart, readCart, removeFromCart, type CartLine } from '../client/cart'
import type { CreatedOrder, DisplayPrice, PaymentGateway, PaymentResponse, PublicFunnel, PublicOffer, Variant, Zone } from '../lib/types'
import PoPayStep from './PoPayStep'
import PaymentStep from './PaymentStep'

export interface OrderFormProps {
  slug: string
  storeId: string
  productId: string
  productName: string
  type: 'digital' | 'physical'
  currency: string
  locale: string
  country: string
  unit: DisplayPrice
  offers: QuantityOffer[]
  variants: Variant[]
  variantLabel: string | null
  inStock: boolean
  zones: Zone[]
  method: 'cod' | 'native' | 'integration'
  externalUrl: string | null
  onlineEnabled: boolean
  ctaText: string
  ctaStyle: string
  orderBase: string
  fb: string | null
  tt: string | null
  t: FormStrings
  pt: PayStrings
  /** Formulaire effectif (produit ou boutique), déjà choisi par l'API. */
  form: OrderForm
  storeName: string
  /** Aperçu dans le dashboard : aucune commande, aucun suivi, aucun envoi de coordonnées. */
  preview?: boolean
  /** Tunnel de vente : order bump, offres après commande, bouton de remerciement. */
  funnel?: PublicFunnel | null
  /** Paiement en ligne : Payment Orchestrator (widget) ou direct. */
  gateway?: PaymentGateway
  /** Panier activé par le vendeur : bouton « Ajouter au panier », autres produits ajoutés à la commande. */
  cartEnabled?: boolean
  ct?: CartStrings
}

/** Champs intégrés, « form » (erreur générale) ou clé d'un champ personnalisé (« cf_xxxx »). */
type Field = string
type Errors = Partial<Record<Field, string>>
type Buyer = { name?: string; phone?: string; dial?: string; email?: string; address?: string; cityKey?: string; city?: string }
type Promo = { code: string; status: 'checking' | 'ok' | 'bad'; discount: number; subtotal: number; reason?: string }
/** Offre en cours du tunnel : index de l'upsell, et s'il s'agit de son offre de repli. */
type OfferStage = { kind: 'offer'; token: string; orderNumber: string; total: number; eventId: string | null; pixelEvent?: 'Purchase' | 'Lead'; method: string; idx: number; down: boolean; added: number }
type Stage = { kind: 'form' } | { kind: 'done'; orderNumber: string; token: string } | { kind: 'pay'; token: string; total: number } | { kind: 'lead' } | { kind: 'redirect' } | OfferStage

const ISSUE_FIELD: Record<string, Field> = { customerName: 'name', customerPhone: 'phone', customerEmail: 'email', city: 'city', address: 'address', variantId: 'variant', note: 'note' }

export default function OrderForm(p: OrderFormProps) {
  const t = p.t
  const physical = p.type === 'physical'
  const fmtMoney = (n: number) => money(n, p.currency, p.locale)

  const firstInStock = p.variants.find((v) => v.inStock)
  const [name, setName] = useState('')
  const [dial, setDial] = useState(dialFor(p.country))
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cityKey, setCityKey] = useState('')
  const [cityText, setCityText] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [custom, setCustom] = useState<Record<string, CustomFieldValue>>({})
  const fields = useMemo(() => resolveFormFields(p.form, p.type), [p.form, p.type])
  const fc = (key: string): OrderFormField | undefined => fields.find((f) => f.key === key)
  const shows = (key: string) => fc(key)?.visible ?? false
  const texts = p.form.texts
  const [variantId, setVariantId] = useState<number | null>(firstInStock?.id ?? null)
  const [offerId, setOfferId] = useState<string | null>(p.offers[0]?.id ?? null)
  const [qty, setQty] = useState(1)
  const [promo, setPromo] = useState<Promo | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoOpen, setPromoOpen] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<Stage>({ kind: 'form' })
  const busyRef = useRef(false)
  const leadsSent = useRef(new Set<string>())
  const rootRef = useRef<HTMLDivElement>(null)

  // ─── Livraison ───
  const zones = useMemo(() => (p.method === 'cod' ? p.zones.filter((z) => z.codAllowed) : p.zones), [p.zones, p.method])
  const cityOptions = useMemo(
    () => zones.flatMap((z) => (z.cities.length ? z.cities.map((c) => ({ key: `${z.id}:${c}`, zone: z, city: c })) : [{ key: `${z.id}:`, zone: z, city: z.name }])),
    [zones],
  )
  const picked = cityOptions.find((o) => o.key === cityKey)

  // ─── Prix (affichage) ───
  const variant = p.variants.find((v) => v.id === variantId)
  const unitPrice = variant?.price?.effective ?? p.unit.effective
  const hasUnitOffer = p.offers.some((o) => o.quantity === 1)
  const offer = p.offers.find((o) => o.id === offerId)
  const quantity = physical ? (offer ? offer.quantity : qty) : 1
  const subtotal = offer ? roundMoney(offer.price, p.currency) : roundMoney(unitPrice * quantity, p.currency)
  const discount = promo?.status === 'ok' ? Math.min(promo.discount, subtotal) : 0
  const zone = picked?.zone ?? null
  // Order bump : case cochée = offre ajoutée au total (prix fixé par le vendeur, revérifié par l'API).
  const bumpOffer = p.funnel?.bump ?? null
  const [bumpOn, setBumpOn] = useState(false)
  // ─── Panier : les autres produits du panier (même mode de paiement) partent dans la même commande ───
  const [cartLines, setCartLines] = useState<CartLine[]>([])
  const cartOn = Boolean(p.cartEnabled && !p.preview)
  const loadCart = async () => {
    const items = readCart(p.storeId)
    if (!items.length) return setCartLines([])
    const r = await api<CartLine[]>('/cart/lines', { body: { storeSlug: p.slug, items } })
    setCartLines(r.ok && r.data ? r.data : [])
  }
  useEffect(() => {
    if (!cartOn) return
    // Arrivée depuis le panier : la ligne de ce produit fixe la variante et la quantité.
    if (new URLSearchParams(location.search).get('panier')) {
      const mine = readCart(p.storeId).find((i) => i.productId === p.productId)
      if (mine) {
        if (mine.variantId && p.variants.some((v) => v.id === mine.variantId)) setVariantId(mine.variantId)
        if (physical && !p.offers.length) setQty(Math.max(1, Math.min(50, mine.quantity)))
      }
    }
    void loadCart()
    const onChange = () => void loadCart()
    window.addEventListener('sf-cart', onChange)
    return () => window.removeEventListener('sf-cart', onChange)
  }, [])
  const extras = cartOn
    ? cartLines.filter((l) => l.available && l.type === p.type && l.paymentMethod === p.method && l.currency === p.currency && !(l.productId === p.productId && (l.variantId ?? null) === (variant?.id ?? null)))
    : []
  const extraAmount = roundMoney(extras.reduce((sum, l) => sum + (l.total ?? 0), 0), p.currency)
  const [cartMsg, setCartMsg] = useState(false)
  const addCurrentToCart = () => {
    addToCart(p.storeId, { productId: p.productId, variantId: physical && variant ? variant.id : null, quantity: physical ? quantity : 1 })
    window.dispatchEvent(new CustomEvent('sf-cart', { detail: { storeId: p.storeId, open: true } }))
    setCartMsg(true)
    setTimeout(() => setCartMsg(false), 2500)
  }

  // Livraison offerte au-delà d'un montant : calculée sur tout ce qui part dans la commande.
  const freeBase = subtotal - discount + (extras.length ? extraAmount + (bumpOn && bumpOffer ? bumpOffer.price : 0) : 0)
  const shipping = zone ? (zone.freeAbove != null && freeBase >= zone.freeAbove ? 0 : zone.fee) : 0
  const bumpAmount = bumpOn && bumpOffer ? bumpOffer.price : 0
  const total = roundMoney(subtotal - discount + shipping + bumpAmount + extraAmount, p.currency)
  const leadMode = p.method === 'native' && !p.onlineEnabled
  const allSoldOut = !p.inStock || (p.variants.length > 0 && !firstInStock)

  // ─── Préremplissage APRÈS montage (pas de décalage d'hydratation) ───
  useEffect(() => {
    if (p.preview) return
    const b = getJSON<Buyer>('sf_buyer')
    if (b) {
      if (b.name) setName(b.name)
      if (b.dial) setDial(b.dial)
      if (b.phone) setPhone(b.phone)
      if (b.email) setEmail(b.email)
      if (b.address) setAddress(b.address)
      if (b.cityKey && cityOptions.some((o) => o.key === b.cityKey)) setCityKey(b.cityKey)
      else if (b.city && !cityOptions.length) setCityText(b.city)
    }
    try {
      const code = new URLSearchParams(location.search).get('promo') || getStr('sf_promo_pending', 'session')
      if (code) applyPromo(code)
    } catch {
      /* ignore */
    }
  }, [])

  // Code promo choisi dans une popup marketing : appliqué aussitôt.
  useEffect(() => {
    const on = (e: Event) => {
      const code = (e as CustomEvent<string>).detail
      if (typeof code === 'string' && code) applyPromo(code)
    }
    window.addEventListener('zuri:promo', on)
    return () => window.removeEventListener('zuri:promo', on)
  }, [subtotal])

  // ─── Code promo ───
  const applyPromo = async (raw: string, forSubtotal = subtotal) => {
    const code = raw.trim().toUpperCase().slice(0, 30)
    if (!code) return
    setPromoInput(code)
    setPromo({ code, status: 'checking', discount: 0, subtotal: forSubtotal })
    const r = await api<{ ok: true; discount: number } | { ok: false; reason: string }>('/promo/check', { body: { storeSlug: p.slug, productId: p.productId, code, subtotal: forSubtotal } })
    if (r.ok && r.data?.ok) setPromo({ code, status: 'ok', discount: r.data.discount, subtotal: forSubtotal })
    else setPromo({ code, status: 'bad', discount: 0, subtotal: forSubtotal, reason: (r.data && !r.data.ok && r.data.reason) || t.promoInvalid })
  }

  // Le montant de la réduction dépend du sous-total : on revérifie quand il change.
  useEffect(() => {
    if (promo?.status !== 'ok' || promo.subtotal === subtotal) return
    const id = setTimeout(() => applyPromo(promo.code, subtotal), 400)
    return () => clearTimeout(id)
  }, [subtotal, promo?.status])

  const promoLabel = promo?.status === 'ok' && promo.subtotal > 0 ? (Number.isInteger((promo.discount / promo.subtotal) * 100) ? `-${(promo.discount / promo.subtotal) * 100}%` : `-${fmtMoney(promo.discount)}`) : ''

  // Bandeau promo en haut de page (rendu serveur vide, rempli seulement après confirmation de l'API).
  useEffect(() => {
    const el = document.getElementById('sf-promo')
    if (!el) return
    if (promo?.status === 'ok') {
      el.textContent = fmt(t.promoApplied, promo.code, promoLabel)
      el.hidden = false
    } else el.hidden = true
  }, [promo?.status, promoLabel])

  // ─── Panier abandonné : coordonnées envoyées une fois ───
  const sendLead = (kind: 'phone' | 'email') => {
    if (p.preview || noTrack()) return
    const full = fullPhone(dial, phone)
    const okEmail = validEmail(email)
    if (kind === 'phone' && !full) return
    if (kind === 'email' && !okEmail) return
    const key = kind === 'phone' ? `p:${full}` : `e:${email.trim().toLowerCase()}`
    if (leadsSent.current.has(key)) return
    leadsSent.current.add(key)
    api('/leads', { body: { storeSlug: p.slug, productId: p.productId, phone: full ?? undefined, email: okEmail ? email.trim() : undefined, name: name.trim().length >= 2 ? name.trim().slice(0, 120) : undefined, fbp: orderAttribution().fbp, fbc: orderAttribution().fbc, url: location.href.split('#')[0]!.slice(0, 2000) } })
  }

  // ─── Validation ───
  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = t.errName
    if (!fullPhone(dial, phone)) e.phone = t.errPhone
    if (shows('email')) {
      if (!email.trim()) {
        if (fc('email')?.required) e.email = physical ? t.errRequired : t.errEmailReq
      } else if (!validEmail(email)) e.email = t.errEmail
    }
    if (physical) {
      if (p.variants.length && !variant?.inStock) e.variant = t.errVariant
      if (cityOptions.length ? !picked : cityText.trim().length < 2) e.city = t.errCity
      if (shows('address') && fc('address')?.required && address.trim().length < 3) e.address = t.errAddress
      if (shows('note') && fc('note')?.required && !note.trim()) e.note = t.errRequired
    }
    const c = checkCustomFields(fields, custom)
    if (!c.ok) for (const i of c.issues) e[i.key] = i.message.slice(i.message.indexOf(' : ') + 3)
    return e
  }

  const focusFirstError = (e: Errors) => {
    const first = fields.map((f) => f.key).find((f) => e[f])
    if (first) rootRef.current?.querySelector<HTMLElement>(`[data-f="${first}"]`)?.focus()
  }

  const saveBuyer = () =>
    setJSON('sf_buyer', { name: name.trim(), phone: phone.trim(), dial, email: email.trim(), address: address.trim(), cityKey, city: picked?.city ?? cityText.trim() } satisfies Buyer)

  const submit = async (ev: Event) => {
    ev.preventDefault()
    if (busyRef.current) return
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      setErrors({ ...e, form: t.errFix })
      focusFirstError(e)
      return
    }
    if (p.preview) {
      // Aperçu : on montre l'écran de remerciement, sans créer de commande.
      setStage({ kind: 'done', orderNumber: 'ZR-APERCU', token: '' })
      return
    }
    busyRef.current = true
    setBusy(true)

    const customerPhone = fullPhone(dial, phone)!
    const payload: PublicOrderCreate = {
      storeSlug: p.slug,
      productId: p.productId,
      variantId: physical && variant ? variant.id : null,
      offerId: physical && offer ? offer.id : null,
      quantity,
      customerName: name.trim().slice(0, 120),
      customerPhone,
      customerEmail: shows('email') && email.trim() ? email.trim().toLowerCase() : null,
      city: physical ? (picked?.city ?? cityText.trim()) || null : null,
      address: physical && shows('address') ? address.trim() || null : null,
      deliveryZoneId: physical && picked ? picked.zone.id : null,
      note: physical && shows('note') && note.trim() ? note.trim().slice(0, 500) : null,
      customFields: Object.keys(custom).length ? custom : undefined,
      promoCode: promo?.status === 'ok' ? promo.code : null,
      ...(bumpOn && bumpOffer ? { bump: true } : {}),
      ...(extras.length ? { extraItems: extras.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity ?? 1 })) } : {}),
      ...orderAttribution(),
    }

    const r = await api<CreatedOrder>('/orders', { body: payload, timeoutMs: 30_000 })
    if (!r.ok || !r.data) {
      busyRef.current = false
      setBusy(false)
      const code = r.error?.code
      if (code === 'payments_disabled') {
        // Paiement en ligne désactivé : on garde le contact (relance vendeur) au lieu de perdre le visiteur.
        leadsSent.current.clear()
        await api('/leads', { body: { storeSlug: p.slug, productId: p.productId, phone: customerPhone, email: validEmail(email) ? email.trim() : undefined, name: name.trim() } })
        saveBuyer()
        setStage({ kind: 'lead' })
        return
      }
      const fe: Errors = {}
      if (r.status === 422 && r.error?.issues) for (const i of r.error.issues) fe[i.path.startsWith('customFields.') ? i.path.slice(13) : (ISSUE_FIELD[i.path] ?? 'form')] ??= i.message
      if (code === 'email_required') fe.email = t.errEmailReq
      if (code === 'address_required') fe.address = t.errAddress
      fe.form = r.network ? t.errNetwork : code === 'out_of_stock' ? t.errStock : r.status === 429 ? t.errRate : fe.form ?? r.error?.error ?? t.errGeneric
      setErrors(fe)
      focusFirstError(fe)
      return
    }

    const o = r.data.order
    saveBuyer()
    // Commande passée : le panier est vidé (les produits commandés séparément y restent).
    if (cartOn && cartLines.length) {
      const sent = new Set([`${p.productId}:${physical && variant ? variant.id : null}`, ...extras.map((l) => `${l.productId}:${l.variantId ?? null}`)])
      const rest = readCart(p.storeId).filter((i) => !sent.has(`${i.productId}:${i.variantId ?? null}`))
      if (!rest.length) clearCart(p.storeId)
      else for (const i of readCart(p.storeId)) if (sent.has(`${i.productId}:${i.variantId ?? null}`)) removeFromCart(p.storeId, i.productId, i.variantId)
    }
    track('order_created', { total: o.total, method: o.paymentMethod })
    // Client qui vient de commander : plus de popup marketing pour lui.
    setStr(`sf_ordered_${p.storeId}`, String(Date.now()))
    // Pour la page commande (Purchase après paiement en ligne) : l'API ne renvoie pas les pixels avec la commande.
    setJSON(`sf_o_${o.token}`, { fb: p.fb, tt: p.tt, productId: p.productId, name: p.productName, storeId: p.storeId }, 'local')

    // Tunnel : offres juste après la commande (COD : ajoutées à la livraison ; en ligne : avant le paiement).
    const upsells = p.funnel?.upsells ?? []
    if (upsells.length && o.paymentStatus !== 'paid' && (o.paymentMethod === 'cod' || (p.method === 'native' && o.paymentMethod !== 'external'))) {
      setStage({ kind: 'offer', token: o.token, orderNumber: o.orderNumber, total: o.total, eventId: o.eventId, pixelEvent: o.pixelEvent, method: o.paymentMethod, idx: 0, down: false, added: 0 })
      busyRef.current = false
      setBusy(false)
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: 'start' }))
      return
    }

    if (o.paymentMethod === 'cod') {
      purchaseOnce(o.token, { value: o.total, currency: o.currency, eventId: o.eventId, numItems: quantity, event: o.pixelEvent })
      setStage({ kind: 'done', orderNumber: o.orderNumber, token: o.token })
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: 'start' }))
      return
    }
    if (o.paymentStatus === 'paid') {
      location.assign(p.orderBase + o.token)
      return
    }
    if (p.method === 'integration') {
      setStage({ kind: 'redirect' })
      if (p.externalUrl) {
        location.href = p.externalUrl
        return
      }
      const pay = await api<PaymentResponse>(`/orders/${o.token}/pay`, { body: { country: p.country, network: 'web', phone: customerPhone }, timeoutMs: 30_000 })
      if (pay.ok && pay.data?.status === 'redirect') {
        location.href = pay.data.redirectUrl
        return
      }
      location.assign(p.orderBase + o.token)
      return
    }
    setStage({ kind: 'pay', token: o.token, total: o.total })
    busyRef.current = false
    setBusy(false)
  }

  /** Fin du tunnel : COD → remerciement (pixel d'achat avec le total final) ; en ligne → paiement du total. */
  const finishFunnel = (st: OfferStage, finalTotal: number) => {
    if (st.method === 'cod') {
      purchaseOnce(st.token, { value: finalTotal, currency: p.currency, eventId: st.eventId, numItems: quantity, event: st.pixelEvent })
      setStage({ kind: 'done', orderNumber: st.orderNumber, token: st.token })
    } else {
      setStage({ kind: 'pay', token: st.token, total: finalTotal })
    }
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: 'start' }))
  }

  const answerOffer = async (st: OfferStage, accept: boolean) => {
    if (busyRef.current) return
    const ups = p.funnel?.upsells ?? []
    const current = st.down ? ups[st.idx]?.downsell : ups[st.idx]
    if (!current) return finishFunnel(st, st.total)
    // Étape suivante : refus d'un upsell qui a une offre de repli → l'offre de repli ; sinon upsell suivant.
    const next = !accept && !st.down && ups[st.idx]?.downsell ? { idx: st.idx, down: true } : ups[st.idx + 1] ? { idx: st.idx + 1, down: false } : null
    busyRef.current = true
    setBusy(true)
    const r = await api<{ accepted: boolean; order: { total: number } }>(`/orders/${st.token}/funnel`, { body: { offerId: current.id, accept, last: !next }, timeoutMs: 20_000 })
    busyRef.current = false
    setBusy(false)
    const newTotal = r.ok && r.data ? r.data.order.total : st.total
    if (accept && r.ok) track('cta_click', { offer: current.id, accepted: true })
    const moved = { ...st, total: newTotal, added: st.added + (accept && r.ok && r.data?.accepted ? current.price : 0) }
    if (next) setStage({ ...moved, ...next })
    else finishFunnel(moved, newTotal)
  }

  // Offre introuvable (retirée entre-temps) : on termine le tunnel proprement, hors du rendu.
  useEffect(() => {
    if (stage.kind !== 'offer') return
    const ups = p.funnel?.upsells ?? []
    if (!(stage.down ? ups[stage.idx]?.downsell : ups[stage.idx])) finishFunnel(stage, stage.total)
  }, [stage])

  // ─── Rendus ───
  if (allSoldOut) return null

  // Variables injectables dans les textes du formulaire (recalculées à chaque changement).
  const vars: Record<string, string | number> = {
    produit: p.productName,
    prix: fmtMoney(unitPrice),
    quantite: quantity,
    offre: offer ? offer.label || `${offer.quantity} ${offer.quantity > 1 ? t.units : t.unit}` : `${quantity} ${quantity > 1 ? t.units : t.unit}`,
    sous_total: fmtMoney(subtotal),
    livraison: zone ? (shipping === 0 ? t.free : fmtMoney(shipping)) : physical ? t.shippingPick : t.free,
    total: fmtMoney(total),
    devise: p.currency === 'XOF' || p.currency === 'XAF' ? 'FCFA' : p.currency,
    ville: picked?.city ?? cityText.trim(),
    prenom: name.trim().split(/\s+/)[0] ?? '',
    boutique: p.storeName,
    commande: stage.kind === 'done' ? stage.orderNumber : '',
  }
  const tx = (text: string) => interpolate(text, vars)

  if (stage.kind === 'offer') {
    const ups = p.funnel?.upsells ?? []
    const offer: PublicOffer | null | undefined = stage.down ? ups[stage.idx]?.downsell : ups[stage.idx]
    if (!offer) return null
    return (
      <div class="upsell" ref={rootRef} role="dialog" aria-labelledby="upsell-title">
        <p class="upsell-kicker">{t.offerKicker}</p>
        {offer.image && <img class="upsell-img" src={offer.image} alt={offer.productName} loading="eager" />}
        <h3 id="upsell-title" class="upsell-title">{offer.title}</h3>
        {offer.text && <p class="upsell-text pre">{offer.text}</p>}
        <p class="upsell-price">
          <strong>{fmtMoney(offer.price)}</strong>
          {offer.regularPrice != null && (
            <span class="muted">
              {' '}
              {t.offerInstead} <s>{fmtMoney(offer.regularPrice)}</s>
            </span>
          )}
        </p>
        <p class="muted upsell-note">{stage.method === 'cod' ? t.offerSame : t.offerSameOnline}</p>
        <button type="button" class={`btn btn-block btn-lg cta-${p.ctaStyle}`} disabled={busy} aria-busy={busy} onClick={() => answerOffer(stage, true)}>
          {busy ? t.sending : offer.acceptLabel || t.offerAccept}
        </button>
        <button type="button" class="btn btn-block btn-ghost upsell-decline" disabled={busy} onClick={() => answerOffer(stage, false)}>
          {offer.declineLabel || t.offerDecline}
        </button>
        {stage.added > 0 && <p class="upsell-added">{t.offerAdded} : +{fmtMoney(stage.added)}</p>}
      </div>
    )
  }

  if (stage.kind === 'done') {
    return (
      <div class="done" ref={rootRef} role="status">
        <div class="done-icon" aria-hidden="true">✓</div>
        <h3>{texts.successTitle ? tx(texts.successTitle) : fmt(t.thanks, name.trim().split(/\s+/)[0] ?? '')}</h3>
        {texts.successMessage ? (
          <p class="pre">{tx(texts.successMessage)}</p>
        ) : (
          <>
            <p>
              <strong>{fmt(t.received, stage.orderNumber)}</strong>
            </p>
            <p class="muted">{t.callSoon}</p>
          </>
        )}
        {p.preview ? (
          <>
            <p class="muted">Aperçu : aucune commande n’a été créée.</p>
            <button type="button" class="btn btn-block btn-ghost" onClick={() => setStage({ kind: 'form' })}>
              Revenir au formulaire
            </button>
          </>
        ) : (
          <>
            {p.funnel?.thankYou && (
              <a class={`btn btn-block btn-lg cta-${p.ctaStyle}`} href={p.funnel.thankYou.buttonUrl} target="_blank" rel="noopener">
                {p.funnel.thankYou.buttonLabel}
              </a>
            )}
            <a class="btn btn-block btn-ghost" href={p.orderBase + stage.token}>
              {t.track}
            </a>
          </>
        )}
      </div>
    )
  }
  if (stage.kind === 'lead') {
    return (
      <div class="done" ref={rootRef} role="status">
        <div class="done-icon" aria-hidden="true">✓</div>
        <p>{t.leadDone}</p>
      </div>
    )
  }
  if (stage.kind === 'redirect') return <div class="notice" role="status"><span class="spinner" aria-hidden="true" /> {t.redirecting}</div>
  if (stage.kind === 'pay') {
    return (
      <div ref={rootRef}>
        {summary()}
        {p.gateway?.kind === 'orchestrator' ? (
          <PoPayStep token={stage.token} total={stage.total} currency={p.currency} locale={p.locale} gateway={p.gateway} orderUrl={p.orderBase + stage.token} t={p.pt} autoStart />
        ) : (
          <PaymentStep token={stage.token} slug={p.slug} total={stage.total} currency={p.currency} locale={p.locale} storeCountry={p.country} phone={phone} t={p.pt} onPaid={() => location.assign(p.orderBase + stage.token)} />
        )}
      </div>
    )
  }

  function summary() {
    return (
      <dl class="summary">
        <div>
          <dt>
            {t.subtotal}
            {physical && quantity > 1 ? ` (${quantity} ${t.units})` : ''}
          </dt>
          <dd>{fmtMoney(subtotal)}</dd>
        </div>
        {extras.map((l) => (
          <div key={`${l.productId}-${l.variantId}`}>
            <dt>
              {l.name}
              {l.variantName ? ` (${l.variantName})` : ''}
              {physical && (l.quantity ?? 1) > 1 ? ` x${l.quantity}` : ''}{' '}
              {stage.kind === 'form' && p.ct && (
                <button type="button" class="cart-rm" onClick={() => removeFromCart(p.storeId, l.productId, l.variantId)}>
                  {p.ct.remove}
                </button>
              )}
            </dt>
            <dd>{fmtMoney(l.total ?? 0)}</dd>
          </div>
        ))}
        {discount > 0 && (
          <div class="disc">
            <dt>
              {t.discount} ({promo?.code})
            </dt>
            <dd>-{fmtMoney(discount)}</dd>
          </div>
        )}
        {physical && (
          <div>
            <dt>{t.shipping}</dt>
            <dd>{zone ? (shipping === 0 ? t.free : fmtMoney(shipping)) : cityOptions.length ? t.shippingPick : t.free}</dd>
          </div>
        )}
        {bumpAmount > 0 && bumpOffer && (
          <div>
            <dt>
              {t.bumpLine} : {bumpOffer.productName}
            </dt>
            <dd>{fmtMoney(bumpAmount)}</dd>
          </div>
        )}
        <div class="total">
          <dt>{t.total}</dt>
          <dd>{fmtMoney(total)}</dd>
        </div>
      </dl>
    )
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p class="err" id={`e-${f}`} role="alert">
        {errors[f]}
      </p>
    ) : null
  const inv = (f: Field) => (errors[f] ? { 'aria-invalid': true, 'aria-describedby': `e-${f}` } : {})
  const clear = (f: Field) => errors[f] && setErrors({ ...errors, [f]: undefined, form: undefined })
  /** Libellé, texte indicatif et aide : ceux du vendeur (avec variables) sinon ceux par défaut. */
  const lbl = (f: OrderFormField | undefined, def: string) => (f?.label ? tx(f.label) : def)
  const ph = (f: OrderFormField | undefined, def: string) => (f?.placeholder ? tx(f.placeholder) : def)
  const help = (f: OrderFormField | undefined, key: Field) => (!errors[key] && f?.help ? <small class="muted">{tx(f.help)}</small> : null)
  const cls = (f: OrderFormField | undefined, base = 'field') => `${base}${f?.width === 'half' ? ' half' : ''}`

  const submitLabel = busy
    ? t.sending
    : leadMode
      ? t.submitLead
      : p.method === 'cod'
        ? texts.submitCod
          ? tx(texts.submitCod)
          : t.submitCod
        : texts.submitOnline
          ? tx(texts.submitOnline)
          : `${p.ctaText} | ${fmtMoney(total)}`

  const setCustomValue = (key: string, value: CustomFieldValue) => {
    setCustom((cur) => {
      const next = { ...cur }
      if ((Array.isArray(value) && !value.length) || value === '') delete next[key]
      else next[key] = value
      return next
    })
    clear(key)
  }

  function customField(f: OrderFormField) {
    const id = `sf-${f.key}`
    const value = custom[f.key]
    const label = `${tx(f.label || f.key)}${f.required ? '' : ` (${t.optional})`}`
    if (f.type === 'radio' || f.type === 'checkbox') {
      const opts = f.type === 'checkbox' && !f.options.length ? [t.yes] : f.options
      const list = Array.isArray(value) ? value : value ? [value] : []
      return (
        <fieldset class={cls(f)} key={f.key}>
          <legend>{label}</legend>
          <div class="chips">
            {opts.map((o, i) => {
              const on = list.includes(f.type === 'checkbox' && !f.options.length ? 'Oui' : o)
              const stored = f.type === 'checkbox' && !f.options.length ? 'Oui' : o
              return (
                <label class={`chip${on ? ' on' : ''}`} key={o}>
                  <input
                    type={f.type === 'radio' ? 'radio' : 'checkbox'}
                    name={f.key}
                    data-f={i === 0 ? f.key : undefined}
                    checked={on}
                    onChange={() => setCustomValue(f.key, f.type === 'radio' ? stored : on ? list.filter((x) => x !== stored) : [...list, stored])}
                  />
                  {o}
                </label>
              )
            })}
          </div>
          {err(f.key)}
          {help(f, f.key)}
        </fieldset>
      )
    }
    const str = typeof value === 'string' ? value : ''
    const common = { id, class: 'input', 'data-f': f.key, placeholder: f.placeholder ? tx(f.placeholder) : undefined, ...inv(f.key) }
    return (
      <div class={cls(f)} key={f.key}>
        <label class="lbl" for={id}>
          {label}
        </label>
        {f.type === 'textarea' ? (
          <textarea {...common} rows={3} maxLength={1000} value={str} onInput={(e) => setCustomValue(f.key, e.currentTarget.value)} />
        ) : f.type === 'select' ? (
          <select {...common} value={str} onChange={(e) => setCustomValue(f.key, e.currentTarget.value)}>
            <option value="">{f.placeholder ? tx(f.placeholder) : t.choose}</option>
            {f.options.map((o) => (
              <option value={o} key={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          f.type === 'date' ? (
            <input {...common} type="date" value={str} onInput={(e) => setCustomValue(f.key, e.currentTarget.value)} />
          ) : (
            <input {...common} type="text" inputMode={f.type === 'number' ? 'decimal' : 'text'} maxLength={f.type === 'text' ? 200 : 30} value={str} onInput={(e) => setCustomValue(f.key, e.currentTarget.value)} />
          )
        )}
        {err(f.key)}
        {help(f, f.key)}
      </div>
    )
  }

  function builtinField(f: OrderFormField) {
    switch (f.key) {
      case 'variant':
        if (!physical || !p.variants.length) return null
        return (
          <fieldset class="field" key="variant">
            <legend>{lbl(f, p.variantLabel || t.variant)}</legend>
            <div class="chips">
              {p.variants.map((v, i) => (
                <label class={`chip${variantId === v.id ? ' on' : ''}${v.inStock ? '' : ' off'}`} key={v.id}>
                  <input
                    type="radio"
                    name="variant"
                    data-f={i === 0 ? 'variant' : undefined}
                    disabled={!v.inStock}
                    checked={variantId === v.id}
                    onChange={() => {
                      setVariantId(v.id)
                      clear('variant')
                    }}
                  />
                  {v.name}
                  {v.price && v.price.effective !== p.unit.effective ? ` · ${fmtMoney(v.price.effective)}` : ''}
                  {!v.inStock && <small> ({t.soldOut})</small>}
                </label>
              ))}
            </div>
            {err('variant')}
            {help(f, 'variant')}
          </fieldset>
        )
      case 'quantity':
        if (!physical || !f.visible) return null
        if (p.offers.length > 0)
          return (
            <fieldset class="field" key="quantity">
              <legend>{lbl(f, t.quantity)}</legend>
              <div class="offers">
                {!hasUnitOffer && (
                  <label class={`offer${offerId === null ? ' on' : ''}`}>
                    <input type="radio" name="offer" checked={offerId === null} onChange={() => (setOfferId(null), setQty(1))} />
                    <span class="offer-q">1 {t.unit}</span>
                    <span class="offer-p">{fmtMoney(unitPrice)}</span>
                  </label>
                )}
                {p.offers.map((o) => {
                  const save = roundMoney(unitPrice * o.quantity - o.price, p.currency)
                  return (
                    <label class={`offer${offerId === o.id ? ' on' : ''}`} key={o.id}>
                      <input type="radio" name="offer" checked={offerId === o.id} onChange={() => setOfferId(o.id)} />
                      {o.badge && <span class="badge">{o.badge}</span>}
                      <span class="offer-q">{o.label || `${o.quantity} ${o.quantity > 1 ? t.units : t.unit}`}</span>
                      <span class="offer-p">{fmtMoney(o.price)}</span>
                      {save > 0 && (
                        <span class="offer-s">
                          {t.save} {fmtMoney(save)}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
              {help(f, 'quantity')}
            </fieldset>
          )
        return (
          <div class={cls(f)} key="quantity">
            <span class="lbl">{lbl(f, t.quantity)}</span>
            <div class="stepper">
              <button type="button" aria-label="-" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>
                −
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" aria-label="+" disabled={qty >= 50} onClick={() => setQty(Math.min(50, qty + 1))}>
                +
              </button>
            </div>
            {help(f, 'quantity')}
          </div>
        )
      case 'name':
        return (
          <label class={cls(f)} key="name">
            <span class="lbl">{lbl(f, t.name)}</span>
            <input class="input" data-f="name" autoComplete="name" placeholder={ph(f, t.namePh)} maxLength={120} value={name} onInput={(e) => (setName(e.currentTarget.value), clear('name'))} {...inv('name')} />
            {err('name')}
            {help(f, 'name')}
          </label>
        )
      case 'phone':
        return (
          <div class={cls(f)} key="phone">
            <label class="lbl" for="sf-phone">
              {lbl(f, t.phone)}
            </label>
            <div class="tel">
              <select class="input dial-sel" aria-label="Indicatif" value={dial} onChange={(e) => setDial(e.currentTarget.value)}>
                {DIAL.map(([cc, d]) => (
                  <option value={d} key={cc}>
                    {flag(cc)} +{d}
                  </option>
                ))}
              </select>
              <input
                id="sf-phone"
                class="input"
                data-f="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={ph(f, t.phonePh)}
                maxLength={25}
                value={phone}
                onInput={(e) => (setPhone(e.currentTarget.value), clear('phone'))}
                onBlur={() => sendLead('phone')}
                {...inv('phone')}
              />
            </div>
            {err('phone')}
            {help(f, 'phone')}
          </div>
        )
      case 'email':
        if (!f.visible) return null
        return (
          <label class={cls(f)} key="email">
            <span class="lbl">
              {lbl(f, t.email)}
              {physical && !f.required && !f.label ? ` (${t.optional})` : ''}
            </span>
            <input class="input" data-f="email" type="email" inputMode="email" autoComplete="email" placeholder={ph(f, physical ? '' : t.emailPh)} maxLength={200} value={email} onInput={(e) => (setEmail(e.currentTarget.value), clear('email'))} onBlur={() => sendLead('email')} {...inv('email')} />
            {err('email') ?? (f.help ? <small class="muted">{tx(f.help)}</small> : physical ? null : <small class="muted">{t.emailHint}</small>)}
          </label>
        )
      case 'city':
        if (!physical) return null
        return (
          <label class={cls(f)} key="city">
            <span class="lbl">{lbl(f, t.city)}</span>
            {cityOptions.length ? (
              <select class="input" data-f="city" value={cityKey} onChange={(e) => (setCityKey(e.currentTarget.value), clear('city'))} {...inv('city')}>
                <option value="">{ph(f, t.cityPick)}</option>
                {zones.map((z) => (
                  <optgroup key={z.id} label={`${z.name} | ${z.fee === 0 ? t.free : fmtMoney(z.fee)}`}>
                    {cityOptions
                      .filter((o) => o.zone.id === z.id)
                      .map((o) => (
                        <option value={o.key} key={o.key}>
                          {o.city}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input class="input" data-f="city" autoComplete="address-level2" placeholder={ph(f, t.cityPh)} maxLength={120} value={cityText} onInput={(e) => (setCityText(e.currentTarget.value), clear('city'))} {...inv('city')} />
            )}
            {err('city')}
            {zone && (
              <small class="muted">
                {t.shipping} : {zone.fee === 0 ? t.free : fmtMoney(zone.fee)}
                {zone.freeAbove != null && zone.fee > 0 ? ` · ${t.freeAbove} ${fmtMoney(zone.freeAbove)}` : ''}
                {zone.etaLabel ? ` · ${zone.etaLabel}` : ''}
              </small>
            )}
            {help(f, 'city')}
          </label>
        )
      case 'address':
        if (!physical || !f.visible) return null
        return (
          <label class={cls(f)} key="address">
            <span class="lbl">
              {lbl(f, t.address)}
              {!f.required && !f.label ? ` (${t.optional})` : ''}
            </span>
            <input class="input" data-f="address" autoComplete="street-address" placeholder={ph(f, t.addressPh)} maxLength={500} value={address} onInput={(e) => (setAddress(e.currentTarget.value), clear('address'))} {...inv('address')} />
            {err('address')}
            {help(f, 'address')}
          </label>
        )
      case 'note':
        if (!physical || !f.visible) return null
        // Par défaut : repliée (comme avant). Personnalisée ou obligatoire : champ visible.
        if (!f.required && !f.label && !f.help && !f.placeholder)
          return (
            <details class="field more" key="note">
              <summary>{t.note}</summary>
              <textarea class="input" data-f="note" rows={2} maxLength={500} value={note} onInput={(e) => setNote(e.currentTarget.value)} />
            </details>
          )
        return (
          <label class={cls(f)} key="note">
            <span class="lbl">
              {lbl(f, t.note)}
              {!f.required && f.label ? ` (${t.optional})` : ''}
            </span>
            <textarea class="input" data-f="note" rows={2} maxLength={500} placeholder={f.placeholder ? tx(f.placeholder) : undefined} value={note} onInput={(e) => (setNote(e.currentTarget.value), clear('note'))} {...inv('note')} />
            {err('note')}
            {help(f, 'note')}
          </label>
        )
      default:
        return null
    }
  }

  const assure = texts.footnote ? tx(texts.footnote) : p.method === 'cod' ? t.codNote : leadMode ? '' : p.method === 'integration' ? t.externalNote : t.secureNote

  return (
    <div ref={rootRef}>
      {(texts.title || texts.subtitle) && (
        <div class="form-head">
          {texts.title && <h2 class="order-title">{tx(texts.title)}</h2>}
          {texts.subtitle && <p class="muted pre">{tx(texts.subtitle)}</p>}
        </div>
      )}
      <form class="form" onSubmit={submit} onFocusCapture={p.preview ? undefined : initiateCheckout} noValidate>
        {leadMode && <p class="notice warn">{t.onlineOff}</p>}

        <div class="form-grid">{fields.map((f) => (f.builtin ? builtinField(f) : f.visible ? customField(f) : null))}</div>

        {p.form.showPromo && (
          <details class="field more" open={promoOpen || !!promo} onToggle={(e) => setPromoOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>{t.promoToggle}</summary>
            {promo?.status === 'ok' ? (
              <p class="notice ok">
                {fmt(t.promoApplied, promo.code, promoLabel)}{' '}
                <button type="button" class="link" onClick={() => (setPromo(null), setPromoInput(''))}>
                  {t.remove}
                </button>
              </p>
            ) : (
              <div class="row">
                <input
                  class="input"
                  placeholder={t.promoPh}
                  maxLength={30}
                  value={promoInput}
                  onInput={(e) => setPromoInput(e.currentTarget.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyPromo(promoInput)
                    }
                  }}
                />
                <button type="button" class="btn btn-ghost" disabled={promo?.status === 'checking' || !promoInput.trim()} onClick={() => applyPromo(promoInput)}>
                  {promo?.status === 'checking' ? '…' : t.apply}
                </button>
              </div>
            )}
            {promo?.status === 'bad' && <p class="err">{promo.reason}</p>}
          </details>
        )}

        {bumpOffer && !leadMode && (
          <label class={`bump${bumpOn ? ' on' : ''}`}>
            <input type="checkbox" checked={bumpOn} onChange={(e) => setBumpOn((e.target as HTMLInputElement).checked)} />
            {bumpOffer.image && <img src={bumpOffer.image} alt="" loading="lazy" />}
            <span class="bump-body">
              <strong>{bumpOffer.title}</strong>
              {bumpOffer.text && <span class="bump-text">{bumpOffer.text}</span>}
              <span class="bump-price">
                {t.bumpYes} : <strong>+{fmtMoney(bumpOffer.price)}</strong>
                {bumpOffer.regularPrice != null && (
                  <>
                    {' '}
                    <s class="muted">{fmtMoney(bumpOffer.regularPrice)}</s>
                  </>
                )}
              </span>
            </span>
          </label>
        )}

        {summary()}

        {errors.form && (
          <p class="err form-err" role="alert">
            {errors.form}
          </p>
        )}
        <button class={`btn btn-block btn-lg cta-${p.ctaStyle}`} disabled={busy} aria-busy={busy}>
          {submitLabel}
        </button>
        {cartOn && p.ct && (
          <>
            <button type="button" class="btn btn-block btn-ghost cart-add" onClick={addCurrentToCart}>
              {p.ct.add}
            </button>
            {cartMsg && (
              <p class="cart-msg" role="status">
                {p.ct.added}
              </p>
            )}
          </>
        )}
        {texts.reassurance.length > 0 && (
          <ul class="reassure">
            {texts.reassurance.map((r, i) => (
              <li key={i}>{tx(r)}</li>
            ))}
          </ul>
        )}
        {assure && <p class="assure pre">{assure}</p>}
      </form>
    </div>
  )
}
