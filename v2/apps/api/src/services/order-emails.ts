/**
 * Emails de commande : vendeur (« Génial, une nouvelle vente ! ») et client (confirmation, accès au produit,
 * commande confirmée, colis en route). HTML pensé pour les clients mail : tableaux, styles en ligne,
 * largeur 560 px, lisible sur mobile, sans emoji. Les couleurs reprennent celle de la boutique.
 * Langue : celle de la boutique (réglage Paramètres, Langue), en français ou en anglais.
 */
import { escapeHtml } from '../lib/sanitize'

export interface EmailItem {
  name: string
  variant: string | null
  quantity: number
  total: number
  image: string | null
  role: 'main' | 'bump' | 'upsell' | 'downsell'
  /** Pack : produits inclus. */
  bundle: string[] | null
}

export interface EmailOrder {
  storeName: string
  color: string
  orderNumber: string
  createdAt: string
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  city: string | null
  address: string | null
  note: string | null
  items: EmailItem[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  currency: string
  cod: boolean
  digital: boolean
  /** Ex. « MTN Mobile Money », « paiement à la livraison ». */
  paymentLabel: string
  support: { phone: string | null; email: string | null }
  trackUrl: string
  etaLabel: string | null
  /** Langue de la boutique. */
  lang?: 'fr' | 'en'
}

type Lang = 'fr' | 'en'
const L = (o: { lang?: Lang }): Lang => (o.lang === 'en' ? 'en' : 'fr')
/** Texte selon la langue de la boutique. */
const t = (o: { lang?: Lang }, fr: string, en: string) => (L(o) === 'en' ? en : fr)

const money = (n: number, currency: string, lang: Lang = 'fr') => `${new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR').format(Math.round(n * 100) / 100)} ${currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency}`
const e = escapeHtml
const first = (name: string | null) => e((name ?? '').trim().split(/\s+/)[0] ?? '')
const digits = (s: string) => s.replace(/\D/g, '')
const ROLE_LABEL: Record<Lang, Record<EmailItem['role'], string>> = {
  fr: { main: '', bump: 'Ajouté au formulaire', upsell: 'Offre ajoutée après la commande', downsell: 'Offre ajoutée après la commande' },
  en: { main: '', bump: 'Added on the order form', upsell: 'Offer added after the order', downsell: 'Offer added after the order' },
}

/** Couleur lisible sur le fond de la marque (texte noir sur couleur claire, blanc sinon). */
function onColor(hex: string) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return '#ffffff'
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x!, 16))
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 160 ? '#111111' : '#ffffff'
}

function layout(o: { storeName: string; color: string; preheader: string; inner: string; footer?: string; lang?: Lang }) {
  const c = /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : '#f59e0b'
  return `<!doctype html><html lang="${L(o)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><title>${e(o.storeName)}</title>
<style>a{word-break:break-word}img{max-width:100%}@media (max-width:560px){.zo{padding:12px 6px!important}.zc{padding-left:16px!important;padding-right:16px!important}.zb{display:block!important;margin:6px 0!important;text-align:center!important}}</style></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="zo" style="background:#f3f4f6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)">
<tr><td style="height:6px;background:${c};line-height:6px;font-size:0">&nbsp;</td></tr>
<tr><td class="zc" style="padding:22px 28px 0;font-size:15px;font-weight:700;color:#111827">${e(o.storeName)}</td></tr>
<tr><td class="zc" style="padding:8px 28px 28px;font-size:15px;line-height:1.6;word-break:break-word">${o.inner}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:16px 28px;font-size:12px;line-height:1.6;color:#6b7280;text-align:center">${o.footer ?? ''}</td></tr></table>
</td></tr></table></body></html>`
}

const btn = (href: string, label: string, color: string, filled = true) => {
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : '#f59e0b'
  const style = filled ? `background:${c};color:${onColor(c)};border:1px solid ${c}` : `background:#ffffff;color:#111827;border:1px solid #d1d5db`
  return `<a class="zb" href="${e(href)}" style="${style};text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;margin:4px 6px 4px 0">${e(label)}</a>`
}

const hero = (title: string, text: string) =>
  `<h1 style="margin:14px 0 6px;font-size:24px;line-height:1.25;font-weight:800;color:#111827">${title}</h1><p style="margin:0 0 20px;color:#4b5563">${text}</p>`

/** Tableau des articles avec miniature, variante, contenu d'un pack, origine (bump, upsell). */
function itemsTable(o: EmailOrder, showAmounts: boolean, showRoles = false) {
  const rows = o.items
    .map((i) => {
      const img = i.image
        ? `<img src="${e(i.image)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;background:#f3f4f6">`
        : `<div style="width:56px;height:56px;border-radius:10px;background:#f3f4f6"></div>`
      const sub = [i.variant, i.bundle?.length ? `${t(o, 'Contient', 'Includes')} : ${i.bundle.join(', ')}` : null, showRoles ? ROLE_LABEL[L(o)][i.role] || null : null].filter(Boolean).map((x) => e(x!)).join('<br>')
      return `<tr>
<td width="68" valign="top" style="padding:10px 0">${img}</td>
<td valign="top" style="padding:10px 8px;font-size:14px;word-break:break-word;overflow-wrap:anywhere"><strong>${e(i.name)}</strong>${i.quantity > 1 ? ` <span style="color:#6b7280">x${i.quantity}</span>` : ''}${sub ? `<br><span style="font-size:12px;color:#6b7280">${sub}</span>` : ''}</td>
${showAmounts ? `<td valign="top" align="right" style="padding:10px 0;font-size:14px;white-space:nowrap">${money(i.total, o.currency, L(o))}</td>` : ''}
</tr>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:8px 0">${rows}</table>`
}

function totals(o: EmailOrder, label?: string) {
  const line = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:3px 0;font-size:${strong ? 16 : 14}px;${strong ? 'font-weight:800' : 'color:#4b5563'}">${k}</td><td align="right" style="padding:3px 0;font-size:${strong ? 16 : 14}px;${strong ? 'font-weight:800' : ''};white-space:nowrap">${v}</td></tr>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px">
${line(t(o, 'Sous-total', 'Subtotal'), money(o.subtotal, o.currency, L(o)))}
${o.discount > 0 ? line(t(o, 'Réduction', 'Discount'), `- ${money(o.discount, o.currency, L(o))}`) : ''}
${!o.digital ? line(t(o, 'Livraison', 'Delivery'), o.shippingFee > 0 ? money(o.shippingFee, o.currency, L(o)) : t(o, 'Offerte', 'Free')) : ''}
${line(label ?? 'Total', money(o.total, o.currency, L(o)), true)}
</table>`
}

const box = (inner: string, bg = '#f9fafb') => `<div style="background:${bg};border-radius:12px;padding:14px 16px;margin:0 0 18px;font-size:14px;line-height:1.6">${inner}</div>`

function steps(list: [string, string][], color: string) {
  return list
    .map(
      ([title, text], i) =>
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px"><tr>
<td valign="top" width="30"><div style="width:24px;height:24px;border-radius:12px;background:${color};color:${onColor(color)};font-size:13px;font-weight:700;text-align:center;line-height:24px">${i + 1}</div></td>
<td valign="top" style="font-size:14px;padding-left:6px"><strong>${title}</strong><br><span style="color:#4b5563">${text}</span></td></tr></table>`,
    )
    .join('')
}

function supportFooter(o: EmailOrder) {
  const parts = [o.support.phone ? `${t(o, 'Téléphone / WhatsApp', 'Phone / WhatsApp')} : <a href="tel:${digits(o.support.phone)}" style="color:#374151">${e(o.support.phone)}</a>` : null, o.support.email ? `Email : <a href="mailto:${e(o.support.email)}" style="color:#374151">${e(o.support.email)}</a>` : null].filter(Boolean)
  return `${parts.length ? `${t(o, 'Une question ?', 'A question?')} ${parts.join(' · ')}<br>` : `${t(o, 'Une question ? Répondez simplement à cet email.', 'A question? Just reply to this email.')}<br>`}${t(o, 'Commande', 'Order')} ${e(o.orderNumber)} · ${e(o.storeName)}`
}

// ─── Vendeur ─────────────────────────────────────────────────────────────────

export interface SaleEmailData extends EmailOrder {
  dashboardUrl: string
  /** Bilan du jour (commandes et chiffre du jour, fuseau de la boutique). */
  today: { orders: number; revenue: number }
}

/** « Génial, une nouvelle vente ! » : tout ce qu'il faut pour agir vite, depuis le téléphone. */
export function sellerSaleEmail(d: SaleEmailData, opts: { event: 'order.new' | 'order.paid'; showAmounts: boolean }) {
  const lang = L(d)
  const m = (n: number) => money(n, d.currency, lang)
  const paid = opts.event === 'order.paid'
  const who = d.customerName ? e(d.customerName) : t(d, 'Un client', 'A customer')
  const where = d.city ? ` (${e(d.city)})` : ''
  const upsold = d.items.filter((i) => i.role !== 'main')
  const title = paid ? t(d, 'Génial, une nouvelle vente !', 'Great, a new sale!') : t(d, 'Génial, une nouvelle commande !', 'Great, a new order!')
  const text = paid
    ? t(
        d,
        `${who}${where} vient de payer${opts.showAmounts ? ` <strong>${m(d.total)}</strong>` : ''}. ${d.digital ? 'Son accès au produit est déjà envoyé.' : 'Il ne reste qu’à préparer la livraison.'}`,
        `${who}${where} just paid${opts.showAmounts ? ` <strong>${m(d.total)}</strong>` : ''}. ${d.digital ? 'Their access to the product has already been sent.' : 'All that is left is to prepare the delivery.'}`,
      )
    : t(
        d,
        `${who}${where} vient de commander${opts.showAmounts ? ` pour <strong>${m(d.total)}</strong>` : ''}, à payer à la livraison. Appelle vite pour confirmer : plus l’appel est rapide, plus la commande a de chances d’être livrée.`,
        `${who}${where} just ordered${opts.showAmounts ? ` for <strong>${m(d.total)}</strong>` : ''}, to pay on delivery. Call quickly to confirm: the faster the call, the more likely the order gets delivered.`,
      )
  const phone = d.customerPhone ? digits(d.customerPhone) : null
  const actions = [
    !paid && phone ? btn(`tel:+${phone}`, t(d, 'Appeler le client', 'Call the customer'), d.color) : null,
    phone ? btn(`https://wa.me/${phone}`, 'WhatsApp', d.color, paid) : null,
    btn(d.dashboardUrl, t(d, 'Voir la commande', 'View the order'), d.color, !(!paid && phone)),
  ].filter(Boolean)
  const customer = [
    `<strong>${who}</strong>`,
    d.customerPhone ? e(d.customerPhone) : null,
    d.customerEmail ? e(d.customerEmail) : null,
    [d.address, d.city].filter(Boolean).map((x) => e(x!)).join(', ') || null,
    d.note ? `<em>${t(d, 'Note', 'Note')} : ${e(d.note)}</em>` : null,
  ].filter(Boolean)
  const today =
    d.today.orders > 1
      ? t(
          d,
          `C’est ta <strong>${d.today.orders}e commande</strong> aujourd’hui${opts.showAmounts && d.today.revenue > 0 ? `, pour ${m(d.today.revenue)} au total` : ''}. Continue comme ça.`,
          `That is your <strong>order number ${d.today.orders}</strong> today${opts.showAmounts && d.today.revenue > 0 ? `, for ${m(d.today.revenue)} in total` : ''}. Keep it up.`,
        )
      : t(d, 'Ta première commande de la journée. Bonne journée de ventes.', 'Your first order of the day. Have a great day of sales.')
  const amount = opts.showAmounts ? ` : ${m(d.total)}` : ''
  const subject = paid ? `${t(d, 'Nouvelle vente', 'New sale')}${amount} · ${d.customerName ?? d.orderNumber}` : `${t(d, 'Nouvelle commande à confirmer', 'New order to confirm')}${amount} · ${d.customerName ?? d.orderNumber}`
  return {
    subject,
    html: layout({
      lang,
      storeName: d.storeName,
      color: d.color,
      preheader: `${d.customerName ?? t(d, 'Un client', 'A customer')}${d.city ? `, ${d.city}` : ''} · ${d.items.map((i) => i.name).join(', ')}`,
      inner: `${hero(title, text)}
<div style="margin:0 0 18px">${actions.join('')}</div>
${itemsTable(d, opts.showAmounts, true)}
${opts.showAmounts ? totals(d, paid ? t(d, 'Encaissé', 'Collected') : t(d, 'À encaisser à la livraison', 'To collect on delivery')) : ''}
${upsold.length ? box(t(d, `Ton tunnel a travaillé : <strong>${upsold.length} offre${upsold.length > 1 ? 's' : ''} ajoutée${upsold.length > 1 ? 's' : ''}</strong> à cette commande.`, `Your funnel worked: <strong>${upsold.length} offer${upsold.length > 1 ? 's' : ''} added</strong> to this order.`), '#ecfdf5') : ''}
${box(`<span style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280">${t(d, 'Client', 'Customer')}</span><br>${customer.join('<br>')}`)}
${box(today, '#fffbeb')}
<p style="font-size:13px;color:#6b7280;margin:0">${t(d, 'Commande', 'Order')} ${e(d.orderNumber)} · ${e(d.paymentLabel)}</p>`,
      footer: t(d, 'Tu reçois cet email selon tes réglages de notifications dans Zuri (menu Notifications).', 'You receive this email based on your notification settings in Zuri (Notifications menu).'),
    }),
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

/** Commande reçue (paiement à la livraison) ou payée (produit physique payé en ligne). */
export function customerOrderEmail(o: EmailOrder) {
  const lang = L(o)
  const m = (n: number) => money(n, o.currency, lang)
  const name = first(o.customerName)
  const title = o.cod ? t(o, `Merci ${name} ! Votre commande est bien reçue`, `Thank you ${name}! Your order is confirmed`) : t(o, `Merci ${name} ! Votre paiement est confirmé`, `Thank you ${name}! Your payment is confirmed`)
  const text = o.cod
    ? t(
        o,
        `Nous préparons votre commande <strong>${e(o.orderNumber)}</strong>. Vous ne payez rien maintenant : vous réglez <strong>${m(o.total)}</strong> à la livraison, après avoir vu votre colis.`,
        `We are preparing your order <strong>${e(o.orderNumber)}</strong>. You pay nothing now: you pay <strong>${m(o.total)}</strong> on delivery, after seeing your parcel.`,
      )
    : t(o, `Votre commande <strong>${e(o.orderNumber)}</strong> de <strong>${m(o.total)}</strong> est payée. Nous préparons votre colis.`, `Your order <strong>${e(o.orderNumber)}</strong> of <strong>${m(o.total)}</strong> is paid. We are preparing your parcel.`)
  const delivery = [o.address, o.city].filter(Boolean).map((x) => e(x!)).join(', ')
  const eta = o.etaLabel ? e(o.etaLabel) : null
  return {
    subject: o.cod ? t(o, `Commande ${o.orderNumber} bien reçue · ${o.storeName}`, `Order ${o.orderNumber} received · ${o.storeName}`) : t(o, `Paiement confirmé · commande ${o.orderNumber}`, `Payment confirmed · order ${o.orderNumber}`),
    html: layout({
      lang,
      storeName: o.storeName,
      color: o.color,
      preheader: o.cod ? t(o, `Vous payez ${m(o.total)} à la livraison. Nous vous appelons pour confirmer.`, `You pay ${m(o.total)} on delivery. We will call you to confirm.`) : t(o, `Paiement de ${m(o.total)} confirmé.`, `Payment of ${m(o.total)} confirmed.`),
      inner: `${hero(title, text)}
${itemsTable(o, true)}
${totals(o, o.cod ? t(o, 'À payer à la livraison', 'To pay on delivery') : t(o, 'Payé', 'Paid'))}
${delivery ? box(`<span style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280">${t(o, 'Livraison', 'Delivery')}</span><br>${delivery}${o.customerPhone ? `<br>${e(o.customerPhone)}` : ''}${eta ? `<br>${t(o, 'Délai', 'Delivery time')} : ${eta}` : ''}`) : ''}
<p style="margin:0 0 10px;font-weight:700">${t(o, 'La suite', 'What happens next')}</p>
${steps(
  o.cod
    ? lang === 'en'
      ? [
          ['We call you', 'to confirm your order and address. Keep your phone close.'],
          ['Delivery', eta ? `The courier brings your parcel. Expected delivery time: ${eta}.` : 'The courier brings your parcel.'],
          ['You pay on receipt', `${m(o.total)}, in cash or Mobile Money depending on the courier.`],
        ]
      : [
          ['Nous vous appelons', 'pour confirmer votre commande et l’adresse. Gardez votre téléphone à portée de main.'],
          ['Livraison', eta ? `Le livreur vous apporte votre colis. Délai annoncé : ${eta}.` : 'Le livreur vous apporte votre colis.'],
          ['Vous payez à la réception', `${m(o.total)}, en espèces ou Mobile Money selon le livreur.`],
        ]
    : lang === 'en'
      ? [
          ['Preparation', 'We are preparing your parcel.'],
          ['Delivery', eta ? `The courier contacts you before coming. Expected delivery time: ${eta}.` : 'The courier contacts you before coming.'],
        ]
      : [
          ['Préparation', 'Nous préparons votre colis.'],
          ['Livraison', eta ? `Le livreur vous contacte avant de passer. Délai annoncé : ${eta}.` : 'Le livreur vous contacte avant de passer.'],
        ],
  o.color,
)}
<div style="margin:18px 0 0">${btn(o.trackUrl, t(o, 'Suivre ma commande', 'Track my order'), o.color)}</div>`,
      footer: supportFooter(o),
    }),
  }
}

/** Produit digital payé : accès immédiat, reçu détaillé. */
export function customerDigitalEmail(o: EmailOrder & { accessUrl: string }) {
  const lang = L(o)
  const m = (n: number) => money(n, o.currency, lang)
  const name = first(o.customerName)
  const products = o.items.flatMap((i) => (i.bundle?.length ? i.bundle : [i.name]))
  const many = products.length > 1
  return {
    subject: `${t(o, 'Votre accès est prêt', 'Your access is ready')} · ${o.items[0]?.name ?? o.orderNumber}`,
    html: layout({
      lang,
      storeName: o.storeName,
      color: o.color,
      preheader: t(o, `Paiement confirmé. Accédez à ${many ? 'vos produits' : 'votre produit'} en un clic.`, `Payment confirmed. Access your ${many ? 'products' : 'product'} in one click.`),
      inner: `${hero(
        t(o, `Merci ${name} ! Votre accès est prêt`, `Thank you ${name}! Your access is ready`),
        t(
          o,
          `Votre paiement de <strong>${m(o.total)}</strong> est confirmé. ${many ? `Vos ${products.length} produits sont disponibles` : 'Votre produit est disponible'} tout de suite.`,
          `Your payment of <strong>${m(o.total)}</strong> is confirmed. ${many ? `Your ${products.length} products are` : 'Your product is'} available right now.`,
        ),
      )}
<div style="margin:0 0 20px">${btn(o.accessUrl, many ? t(o, 'Accéder à mes produits', 'Access my products') : t(o, 'Accéder à mon produit', 'Access my product'), o.color)}</div>
${itemsTable(o, true)}
${totals(o, t(o, 'Payé', 'Paid'))}
${box(
  t(
    o,
    `Gardez cet email : le bouton ci-dessus vous permet de retrouver et retélécharger ${many ? 'vos produits' : 'votre produit'} à tout moment.<br><span style="color:#6b7280">Paiement : ${e(o.paymentLabel)}</span>`,
    `Keep this email: the button above lets you find and download your ${many ? 'products' : 'product'} again at any time.<br><span style="color:#6b7280">Payment: ${e(o.paymentLabel)}</span>`,
  ),
)}`,
      footer: supportFooter(o),
    }),
  }
}

/** Suivi : commande confirmée par la boutique, ou colis remis au livreur. */
export function customerStatusEmail(o: EmailOrder & { status: 'confirmed' | 'shipped'; courier?: string | null; trackingNumber?: string | null }) {
  const lang = L(o)
  const m = (n: number) => money(n, o.currency, lang)
  const name = first(o.customerName)
  const shipped = o.status === 'shipped'
  const title = shipped ? t(o, `${name}, votre commande est en route`, `${name}, your order is on its way`) : t(o, `${name}, votre commande est confirmée`, `${name}, your order is confirmed`)
  const courier = o.courier ? ` (${e(o.courier)})` : ''
  const text = shipped
    ? t(
        o,
        `Votre colis <strong>${e(o.orderNumber)}</strong> est chez le livreur${courier}. Il vous appelle avant de passer.${o.cod ? ` Préparez <strong>${m(o.total)}</strong> pour le paiement à la livraison.` : ''}`,
        `Your parcel <strong>${e(o.orderNumber)}</strong> is with the courier${courier}. They will call you before coming.${o.cod ? ` Please have <strong>${m(o.total)}</strong> ready to pay on delivery.` : ''}`,
      )
    : t(
        o,
        `Merci d’avoir confirmé. Votre commande <strong>${e(o.orderNumber)}</strong> part bientôt en livraison${o.etaLabel ? ` (délai annoncé : ${e(o.etaLabel)})` : ''}.${o.cod ? ` Vous payerez <strong>${m(o.total)}</strong> à la réception.` : ''}`,
        `Thank you for confirming. Your order <strong>${e(o.orderNumber)}</strong> will soon be out for delivery${o.etaLabel ? ` (expected: ${e(o.etaLabel)})` : ''}.${o.cod ? ` You will pay <strong>${m(o.total)}</strong> on receipt.` : ''}`,
      )
  return {
    subject: shipped ? t(o, `Votre commande ${o.orderNumber} est en route`, `Your order ${o.orderNumber} is on its way`) : t(o, `Commande ${o.orderNumber} confirmée`, `Order ${o.orderNumber} confirmed`),
    html: layout({
      lang,
      storeName: o.storeName,
      color: o.color,
      preheader: shipped ? t(o, 'Votre colis est chez le livreur.', 'Your parcel is with the courier.') : t(o, 'Votre commande part bientôt en livraison.', 'Your order will soon be out for delivery.'),
      inner: `${hero(title, text)}
${o.trackingNumber ? box(`${t(o, 'Numéro de suivi', 'Tracking number')} : <strong>${e(o.trackingNumber)}</strong>`) : ''}
${itemsTable(o, true)}
${totals(o, o.cod ? t(o, 'À payer à la livraison', 'To pay on delivery') : t(o, 'Payé', 'Paid'))}
<div style="margin:6px 0 0">${btn(o.trackUrl, t(o, 'Suivre ma commande', 'Track my order'), o.color)}</div>`,
      footer: supportFooter(o),
    }),
  }
}

/** Paiement en attente ou refusé : lien pour finaliser, envoyé par le vendeur depuis Zuri. */
export function customerPaymentReminderEmail(o: EmailOrder & { payUrl: string }) {
  const lang = L(o)
  const m = (n: number) => money(n, o.currency, lang)
  const name = first(o.customerName)
  return {
    subject: `${t(o, 'Finalisez votre commande', 'Complete your order')} ${o.orderNumber} · ${o.storeName}`,
    html: layout({
      lang,
      storeName: o.storeName,
      color: o.color,
      preheader: t(o, `Votre commande vous attend : ${m(o.total)}, paiement par Mobile Money en un instant.`, `Your order is waiting: ${m(o.total)}, pay by Mobile Money in a moment.`),
      inner: `${hero(
        t(o, `${name}, votre commande vous attend`, `${name}, your order is waiting`),
        t(
          o,
          `Votre paiement de <strong>${m(o.total)}</strong> n’a pas abouti. Vous pouvez le finaliser en un instant par Mobile Money (MTN, Moov, Orange, Wave…).`,
          `Your payment of <strong>${m(o.total)}</strong> did not go through. You can complete it in a moment by Mobile Money (MTN, Airtel, Orange, M-Pesa…).`,
        ),
      )}
<div style="margin:0 0 20px">${btn(o.payUrl, t(o, 'Finaliser mon paiement', 'Complete my payment'), o.color)}</div>
${itemsTable(o, true)}
${totals(o, t(o, 'À payer', 'To pay'))}`,
      footer: supportFooter(o),
    }),
  }
}
