/**
 * Formulaire de commande — le seul JS conséquent de la page de vente.
 * Les montants affichés sont indicatifs : l'API recalcule tout (services/pricing.ts).
 */
import type { PublicOrderCreate, QuantityOffer } from '@zuri/shared'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { api, fmt } from '../client/http'
import { DIAL, dialFor, flag, fullPhone, validEmail } from '../client/phone'
import { getJSON, setJSON } from '../client/storage'
import { initiateCheckout, noTrack, orderAttribution, purchaseOnce, track } from '../client/track'
import { money, roundMoney } from '../lib/format'
import type { FormStrings, PayStrings } from '../lib/i18n'
import type { CreatedOrder, DisplayPrice, PaymentResponse, Variant, Zone } from '../lib/types'
import PaymentStep from './PaymentStep'

export interface OrderFormProps {
  slug: string
  storeId: number
  productId: number
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
}

type Field = 'name' | 'phone' | 'email' | 'city' | 'address' | 'variant' | 'form'
type Errors = Partial<Record<Field, string>>
type Buyer = { name?: string; phone?: string; dial?: string; email?: string; address?: string; cityKey?: string; city?: string }
type Promo = { code: string; status: 'checking' | 'ok' | 'bad'; discount: number; subtotal: number; reason?: string }
type Stage = { kind: 'form' } | { kind: 'done'; orderNumber: string; token: string } | { kind: 'pay'; token: string; total: number } | { kind: 'lead' } | { kind: 'redirect' }

const ISSUE_FIELD: Record<string, Field> = { customerName: 'name', customerPhone: 'phone', customerEmail: 'email', city: 'city', address: 'address', variantId: 'variant' }

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
  const shipping = zone ? (zone.freeAbove != null && subtotal - discount >= zone.freeAbove ? 0 : zone.fee) : 0
  const total = roundMoney(subtotal - discount + shipping, p.currency)
  const leadMode = p.method === 'native' && !p.onlineEnabled
  const allSoldOut = !p.inStock || (p.variants.length > 0 && !firstInStock)

  // ─── Préremplissage APRÈS montage (pas de décalage d'hydratation) ───
  useEffect(() => {
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
      const code = new URLSearchParams(location.search).get('promo')
      if (code) applyPromo(code)
    } catch {
      /* ignore */
    }
  }, [])

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
      el.textContent = `🎉 ${fmt(t.promoApplied, promo.code, promoLabel)}`
      el.hidden = false
    } else el.hidden = true
  }, [promo?.status, promoLabel])

  // ─── Panier abandonné : coordonnées envoyées une fois ───
  const sendLead = (kind: 'phone' | 'email') => {
    if (noTrack()) return
    const full = fullPhone(dial, phone)
    const okEmail = validEmail(email)
    if (kind === 'phone' && !full) return
    if (kind === 'email' && !okEmail) return
    const key = kind === 'phone' ? `p:${full}` : `e:${email.trim().toLowerCase()}`
    if (leadsSent.current.has(key)) return
    leadsSent.current.add(key)
    api('/leads', { body: { storeSlug: p.slug, productId: p.productId, phone: full ?? undefined, email: okEmail ? email.trim() : undefined, name: name.trim().length >= 2 ? name.trim().slice(0, 120) : undefined } })
  }

  // ─── Validation ───
  const validate = (): Errors => {
    const e: Errors = {}
    if (name.trim().length < 2) e.name = t.errName
    if (!fullPhone(dial, phone)) e.phone = t.errPhone
    if (!physical) {
      if (!email.trim()) e.email = t.errEmailReq
      else if (!validEmail(email)) e.email = t.errEmail
    } else {
      if (p.variants.length && !variant?.inStock) e.variant = t.errVariant
      if (cityOptions.length ? !picked : cityText.trim().length < 2) e.city = t.errCity
      if (address.trim().length < 3) e.address = t.errAddress
    }
    return e
  }

  const focusFirstError = (e: Errors) => {
    const first = (['variant', 'name', 'phone', 'email', 'city', 'address'] as Field[]).find((f) => e[f])
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
      customerEmail: email.trim() ? email.trim().toLowerCase() : null,
      city: physical ? (picked?.city ?? cityText.trim()) || null : null,
      address: physical ? address.trim() || null : null,
      deliveryZoneId: physical && picked ? picked.zone.id : null,
      note: physical && note.trim() ? note.trim().slice(0, 500) : null,
      promoCode: promo?.status === 'ok' ? promo.code : null,
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
      if (r.status === 422 && r.error?.issues) for (const i of r.error.issues) fe[ISSUE_FIELD[i.path] ?? 'form'] ??= i.message
      if (code === 'email_required') fe.email = t.errEmailReq
      if (code === 'address_required') fe.address = t.errAddress
      fe.form = r.network ? t.errNetwork : code === 'out_of_stock' ? t.errStock : r.status === 429 ? t.errRate : fe.form ?? r.error?.error ?? t.errGeneric
      setErrors(fe)
      focusFirstError(fe)
      return
    }

    const o = r.data.order
    saveBuyer()
    track('order_created', { total: o.total, method: o.paymentMethod })
    // Pour la page commande (Purchase après paiement en ligne) : l'API ne renvoie pas les pixels avec la commande.
    setJSON(`sf_o_${o.token}`, { fb: p.fb, tt: p.tt, productId: p.productId, name: p.productName, storeId: p.storeId }, 'local')

    if (o.paymentMethod === 'cod') {
      purchaseOnce(o.token, { value: o.total, currency: o.currency, eventId: o.eventId, numItems: quantity })
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

  // ─── Rendus ───
  if (allSoldOut) return null

  if (stage.kind === 'done') {
    return (
      <div class="done" ref={rootRef} role="status">
        <div class="done-icon" aria-hidden="true">✓</div>
        <h3>{fmt(t.thanks, name.trim().split(/\s+/)[0] ?? '')}</h3>
        <p>
          <strong>{fmt(t.received, stage.orderNumber)}</strong>
        </p>
        <p class="muted">{t.callSoon}</p>
        <a class="btn btn-block btn-ghost" href={p.orderBase + stage.token}>
          {t.track}
        </a>
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
        <PaymentStep token={stage.token} slug={p.slug} total={stage.total} currency={p.currency} locale={p.locale} storeCountry={p.country} phone={phone} t={p.pt} onPaid={() => location.assign(p.orderBase + stage.token)} />
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

  const submitLabel = busy ? t.sending : leadMode ? t.submitLead : p.method === 'cod' ? t.submitCod : `${p.ctaText} — ${fmtMoney(total)}`

  return (
    <div ref={rootRef}>
      <form class="form" onSubmit={submit} onFocusCapture={initiateCheckout} noValidate>
        {leadMode && <p class="notice warn">{t.onlineOff}</p>}

        {physical && p.variants.length > 0 && (
          <fieldset class="field">
            <legend>{p.variantLabel || t.variant}</legend>
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
          </fieldset>
        )}

        {physical && p.offers.length > 0 && (
          <fieldset class="field">
            <legend>{t.quantity}</legend>
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
          </fieldset>
        )}

        {physical && p.offers.length === 0 && (
          <div class="field">
            <span class="lbl">{t.quantity}</span>
            <div class="stepper">
              <button type="button" aria-label="-" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>
                −
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" aria-label="+" disabled={qty >= 50} onClick={() => setQty(Math.min(50, qty + 1))}>
                +
              </button>
            </div>
          </div>
        )}

        <label class="field">
          <span class="lbl">{t.name}</span>
          <input class="input" data-f="name" autoComplete="name" placeholder={t.namePh} maxLength={120} value={name} onInput={(e) => (setName(e.currentTarget.value), clear('name'))} {...inv('name')} />
          {err('name')}
        </label>

        <div class="field">
          <label class="lbl" for="sf-phone">
            {t.phone}
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
              placeholder={t.phonePh}
              maxLength={25}
              value={phone}
              onInput={(e) => (setPhone(e.currentTarget.value), clear('phone'))}
              onBlur={() => sendLead('phone')}
              {...inv('phone')}
            />
          </div>
          {err('phone')}
        </div>

        {!physical && (
          <label class="field">
            <span class="lbl">{t.email}</span>
            <input class="input" data-f="email" type="email" inputMode="email" autoComplete="email" placeholder={t.emailPh} maxLength={200} value={email} onInput={(e) => (setEmail(e.currentTarget.value), clear('email'))} onBlur={() => sendLead('email')} {...inv('email')} />
            {err('email') ?? <small class="muted">{t.emailHint}</small>}
          </label>
        )}

        {physical && (
          <>
            <label class="field">
              <span class="lbl">{t.city}</span>
              {cityOptions.length ? (
                <select class="input" data-f="city" value={cityKey} onChange={(e) => (setCityKey(e.currentTarget.value), clear('city'))} {...inv('city')}>
                  <option value="">{t.cityPick}</option>
                  {zones.map((z) => (
                    <optgroup key={z.id} label={`${z.name} — ${z.fee === 0 ? t.free : fmtMoney(z.fee)}`}>
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
                <input class="input" data-f="city" autoComplete="address-level2" placeholder={t.cityPh} maxLength={120} value={cityText} onInput={(e) => (setCityText(e.currentTarget.value), clear('city'))} {...inv('city')} />
              )}
              {err('city')}
              {zone && (
                <small class="muted">
                  {t.shipping} : {zone.fee === 0 ? t.free : fmtMoney(zone.fee)}
                  {zone.freeAbove != null && zone.fee > 0 ? ` · ${t.freeAbove} ${fmtMoney(zone.freeAbove)}` : ''}
                  {zone.etaLabel ? ` · ${zone.etaLabel}` : ''}
                </small>
              )}
            </label>
            <label class="field">
              <span class="lbl">{t.address}</span>
              <input class="input" data-f="address" autoComplete="street-address" placeholder={t.addressPh} maxLength={500} value={address} onInput={(e) => (setAddress(e.currentTarget.value), clear('address'))} {...inv('address')} />
              {err('address')}
            </label>
            <details class="field more">
              <summary>{t.note}</summary>
              <textarea class="input" rows={2} maxLength={500} value={note} onInput={(e) => setNote(e.currentTarget.value)} />
            </details>
          </>
        )}

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

        {summary()}

        {errors.form && (
          <p class="err form-err" role="alert">
            {errors.form}
          </p>
        )}
        <button class={`btn btn-block btn-lg cta-${p.ctaStyle}`} disabled={busy} aria-busy={busy}>
          {submitLabel}
        </button>
        <p class="assure">{p.method === 'cod' ? t.codNote : leadMode ? '' : p.method === 'integration' ? t.externalNote : t.secureNote}</p>
      </form>
    </div>
  )
}
