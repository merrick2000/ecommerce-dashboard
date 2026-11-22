/**
 * Emails de commande : vendeur (« Génial, une nouvelle vente ! ») et client (confirmation, accès au produit,
 * commande confirmée, colis en route). HTML pensé pour les clients mail : tableaux, styles en ligne,
 * largeur 560 px, lisible sur mobile, sans emoji. Les couleurs reprennent celle de la boutique.
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
}

const money = (n: number, currency: string) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n * 100) / 100)} ${currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency}`
const e = escapeHtml
const first = (name: string | null) => e((name ?? '').trim().split(/\s+/)[0] ?? '')
const digits = (s: string) => s.replace(/\D/g, '')
const ROLE_LABEL: Record<EmailItem['role'], string> = { main: '', bump: 'Ajouté au formulaire', upsell: 'Offre ajoutée après la commande', downsell: 'Offre ajoutée après la commande' }

/** Couleur lisible sur le fond de la marque (texte noir sur couleur claire, blanc sinon). */
function onColor(hex: string) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return '#ffffff'
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x!, 16))
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 160 ? '#111111' : '#ffffff'
}

function layout(o: { storeName: string; color: string; preheader: string; inner: string; footer?: string }) {
  const c = /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : '#f59e0b'
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(o.storeName)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)">
<tr><td style="height:6px;background:${c};line-height:6px;font-size:0">&nbsp;</td></tr>
<tr><td style="padding:22px 28px 0;font-size:15px;font-weight:700;color:#111827">${e(o.storeName)}</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.6">${o.inner}</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:16px 28px;font-size:12px;line-height:1.6;color:#6b7280;text-align:center">${o.footer ?? ''}</td></tr></table>
</td></tr></table></body></html>`
}

const btn = (href: string, label: string, color: string, filled = true) => {
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : '#f59e0b'
  const style = filled ? `background:${c};color:${onColor(c)};border:1px solid ${c}` : `background:#ffffff;color:#111827;border:1px solid #d1d5db`
  return `<a href="${e(href)}" style="${style};text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;margin:4px 6px 4px 0">${e(label)}</a>`
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
      const sub = [i.variant, i.bundle?.length ? `Contient : ${i.bundle.join(', ')}` : null, showRoles ? ROLE_LABEL[i.role] || null : null].filter(Boolean).map((x) => e(x!)).join('<br>')
      return `<tr>
<td width="68" valign="top" style="padding:10px 0">${img}</td>
<td valign="top" style="padding:10px 8px;font-size:14px"><strong>${e(i.name)}</strong>${i.quantity > 1 ? ` <span style="color:#6b7280">x${i.quantity}</span>` : ''}${sub ? `<br><span style="font-size:12px;color:#6b7280">${sub}</span>` : ''}</td>
${showAmounts ? `<td valign="top" align="right" style="padding:10px 0;font-size:14px;white-space:nowrap">${money(i.total, o.currency)}</td>` : ''}
</tr>`
    })
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin:8px 0">${rows}</table>`
}

function totals(o: EmailOrder, label?: string) {
  const line = (k: string, v: string, strong = false) =>
    `<tr><td style="padding:3px 0;font-size:${strong ? 16 : 14}px;${strong ? 'font-weight:800' : 'color:#4b5563'}">${k}</td><td align="right" style="padding:3px 0;font-size:${strong ? 16 : 14}px;${strong ? 'font-weight:800' : ''};white-space:nowrap">${v}</td></tr>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px">
${line('Sous-total', money(o.subtotal, o.currency))}
${o.discount > 0 ? line('Réduction', `- ${money(o.discount, o.currency)}`) : ''}
${!o.digital ? line('Livraison', o.shippingFee > 0 ? money(o.shippingFee, o.currency) : 'Offerte') : ''}
${line(label ?? 'Total', money(o.total, o.currency), true)}
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
  const parts = [o.support.phone ? `Téléphone / WhatsApp : <a href="tel:${digits(o.support.phone)}" style="color:#374151">${e(o.support.phone)}</a>` : null, o.support.email ? `Email : <a href="mailto:${e(o.support.email)}" style="color:#374151">${e(o.support.email)}</a>` : null].filter(Boolean)
  return `${parts.length ? `Une question ? ${parts.join(' · ')}<br>` : 'Une question ? Répondez simplement à cet email.<br>'}Commande ${e(o.orderNumber)} · ${e(o.storeName)}`
}

// ─── Vendeur ─────────────────────────────────────────────────────────────────

export interface SaleEmailData extends EmailOrder {
  dashboardUrl: string
  /** Bilan du jour (commandes et chiffre du jour, fuseau de la boutique). */
  today: { orders: number; revenue: number }
}

/** « Génial, une nouvelle vente ! » : tout ce qu'il faut pour agir vite, depuis le téléphone. */
export function sellerSaleEmail(d: SaleEmailData, opts: { event: 'order.new' | 'order.paid'; showAmounts: boolean }) {
  const paid = opts.event === 'order.paid'
  const who = d.customerName ? e(d.customerName) : 'Un client'
  const where = d.city ? ` (${e(d.city)})` : ''
  const upsold = d.items.filter((i) => i.role !== 'main')
  const title = paid ? 'Génial, une nouvelle vente !' : 'Génial, une nouvelle commande !'
  const text = paid
    ? `${who}${where} vient de payer${opts.showAmounts ? ` <strong>${money(d.total, d.currency)}</strong>` : ''}. ${d.digital ? 'Son accès au produit est déjà envoyé.' : 'Il ne reste qu’à préparer la livraison.'}`
    : `${who}${where} vient de commander${opts.showAmounts ? ` pour <strong>${money(d.total, d.currency)}</strong>` : ''}, à payer à la livraison. Appelle vite pour confirmer : plus l’appel est rapide, plus la commande a de chances d’être livrée.`
  const phone = d.customerPhone ? digits(d.customerPhone) : null
  const actions = [
    !paid && phone ? btn(`tel:+${phone}`, 'Appeler le client', d.color) : null,
    phone ? btn(`https://wa.me/${phone}`, 'WhatsApp', d.color, paid) : null,
    btn(d.dashboardUrl, 'Voir la commande', d.color, !(!paid && phone)),
  ].filter(Boolean)
  const customer = [
    `<strong>${who}</strong>`,
    d.customerPhone ? e(d.customerPhone) : null,
    d.customerEmail ? e(d.customerEmail) : null,
    [d.address, d.city].filter(Boolean).map((x) => e(x!)).join(', ') || null,
    d.note ? `<em>Note : ${e(d.note)}</em>` : null,
  ].filter(Boolean)
  const today =
    d.today.orders > 1
      ? `C’est ta <strong>${d.today.orders}e commande</strong> aujourd’hui${opts.showAmounts && d.today.revenue > 0 ? `, pour ${money(d.today.revenue, d.currency)} au total` : ''}. Continue comme ça.`
      : 'Ta première commande de la journée. Bonne journée de ventes.'
  const subject = paid
    ? `Nouvelle vente${opts.showAmounts ? ` : ${money(d.total, d.currency)}` : ''} · ${d.customerName ?? d.orderNumber}`
    : `Nouvelle commande à confirmer${opts.showAmounts ? ` : ${money(d.total, d.currency)}` : ''} · ${d.customerName ?? d.orderNumber}`
  return {
    subject,
    html: layout({
      storeName: d.storeName,
      color: d.color,
      preheader: `${d.customerName ?? 'Un client'}${d.city ? `, ${d.city}` : ''} · ${d.items.map((i) => i.name).join(', ')}`,
      inner: `${hero(title, text)}
<div style="margin:0 0 18px">${actions.join('')}</div>
${itemsTable(d, opts.showAmounts, true)}
${opts.showAmounts ? totals(d, paid ? 'Encaissé' : 'À encaisser à la livraison') : ''}
${upsold.length ? box(`Ton tunnel a travaillé : <strong>${upsold.length} offre${upsold.length > 1 ? 's' : ''} ajoutée${upsold.length > 1 ? 's' : ''}</strong> à cette commande.`, '#ecfdf5') : ''}
${box(`<span style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280">Client</span><br>${customer.join('<br>')}`)}
${box(today, '#fffbeb')}
<p style="font-size:13px;color:#6b7280;margin:0">Commande ${e(d.orderNumber)} · ${e(d.paymentLabel)}</p>`,
      footer: 'Tu reçois cet email selon tes réglages de notifications dans Zuri (menu Notifications).',
    }),
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

/** Commande reçue (paiement à la livraison) ou payée (produit physique payé en ligne). */
export function customerOrderEmail(o: EmailOrder) {
  const name = first(o.customerName)
  const title = o.cod ? `Merci ${name} ! Votre commande est bien reçue` : `Merci ${name} ! Votre paiement est confirmé`
  const text = o.cod
    ? `Nous préparons votre commande <strong>${e(o.orderNumber)}</strong>. Vous ne payez rien maintenant : vous réglez <strong>${money(o.total, o.currency)}</strong> à la livraison, après avoir vu votre colis.`
    : `Votre commande <strong>${e(o.orderNumber)}</strong> de <strong>${money(o.total, o.currency)}</strong> est payée. Nous préparons votre colis.`
  const delivery = [o.address, o.city].filter(Boolean).map((x) => e(x!)).join(', ')
  return {
    subject: o.cod ? `Commande ${o.orderNumber} bien reçue · ${o.storeName}` : `Paiement confirmé · commande ${o.orderNumber}`,
    html: layout({
      storeName: o.storeName,
      color: o.color,
      preheader: o.cod ? `Vous payez ${money(o.total, o.currency)} à la livraison. Nous vous appelons pour confirmer.` : `Paiement de ${money(o.total, o.currency)} confirmé.`,
      inner: `${hero(title, text)}
${itemsTable(o, true)}
${totals(o, o.cod ? 'À payer à la livraison' : 'Payé')}
${delivery ? box(`<span style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280">Livraison</span><br>${delivery}${o.customerPhone ? `<br>${e(o.customerPhone)}` : ''}${o.etaLabel ? `<br>Délai : ${e(o.etaLabel)}` : ''}`) : ''}
<p style="margin:0 0 10px;font-weight:700">La suite</p>
${steps(
  o.cod
    ? [
        ['Nous vous appelons', 'pour confirmer votre commande et l’adresse. Gardez votre téléphone à portée de main.'],
        ['Livraison', o.etaLabel ? `Le livreur vous apporte votre colis. Délai annoncé : ${e(o.etaLabel)}.` : 'Le livreur vous apporte votre colis.'],
        ['Vous payez à la réception', `${money(o.total, o.currency)}, en espèces ou Mobile Money selon le livreur.`],
      ]
    : [
        ['Préparation', 'Nous préparons votre colis.'],
        ['Livraison', o.etaLabel ? `Le livreur vous contacte avant de passer. Délai annoncé : ${e(o.etaLabel)}.` : 'Le livreur vous contacte avant de passer.'],
      ],
  o.color,
)}
<div style="margin:18px 0 0">${btn(o.trackUrl, 'Suivre ma commande', o.color)}</div>`,
      footer: supportFooter(o),
    }),
  }
}

/** Produit digital payé : accès immédiat, reçu détaillé. */
export function customerDigitalEmail(o: EmailOrder & { accessUrl: string }) {
  const name = first(o.customerName)
  const products = o.items.flatMap((i) => (i.bundle?.length ? i.bundle : [i.name]))
  return {
    subject: `Votre accès est prêt · ${o.items[0]?.name ?? o.orderNumber}`,
    html: layout({
      storeName: o.storeName,
      color: o.color,
      preheader: `Paiement confirmé. Accédez à ${products.length > 1 ? 'vos produits' : 'votre produit'} en un clic.`,
      inner: `${hero(`Merci ${name} ! Votre accès est prêt`, `Votre paiement de <strong>${money(o.total, o.currency)}</strong> est confirmé. ${products.length > 1 ? `Vos ${products.length} produits sont disponibles` : 'Votre produit est disponible'} tout de suite.`)}
<div style="margin:0 0 20px">${btn(o.accessUrl, products.length > 1 ? 'Accéder à mes produits' : 'Accéder à mon produit', o.color)}</div>
${itemsTable(o, true)}
${totals(o, 'Payé')}
${box(`Gardez cet email : le bouton ci-dessus vous permet de retrouver et retélécharger ${products.length > 1 ? 'vos produits' : 'votre produit'} à tout moment.<br><span style="color:#6b7280">Paiement : ${e(o.paymentLabel)}</span>`)}`,
      footer: supportFooter(o),
    }),
  }
}

/** Suivi : commande confirmée par la boutique, ou colis remis au livreur. */
export function customerStatusEmail(o: EmailOrder & { status: 'confirmed' | 'shipped'; courier?: string | null; trackingNumber?: string | null }) {
  const name = first(o.customerName)
  const shipped = o.status === 'shipped'
  const title = shipped ? `${name}, votre commande est en route` : `${name}, votre commande est confirmée`
  const text = shipped
    ? `Votre colis <strong>${e(o.orderNumber)}</strong> est chez le livreur${o.courier ? ` (${e(o.courier)})` : ''}. Il vous appelle avant de passer.${o.cod ? ` Préparez <strong>${money(o.total, o.currency)}</strong> pour le paiement à la livraison.` : ''}`
    : `Merci d’avoir confirmé. Votre commande <strong>${e(o.orderNumber)}</strong> part bientôt en livraison${o.etaLabel ? ` (délai annoncé : ${e(o.etaLabel)})` : ''}.${o.cod ? ` Vous payerez <strong>${money(o.total, o.currency)}</strong> à la réception.` : ''}`
  return {
    subject: shipped ? `Votre commande ${o.orderNumber} est en route` : `Commande ${o.orderNumber} confirmée`,
    html: layout({
      storeName: o.storeName,
      color: o.color,
      preheader: shipped ? 'Votre colis est chez le livreur.' : 'Votre commande part bientôt en livraison.',
      inner: `${hero(title, text)}
${o.trackingNumber ? box(`Numéro de suivi : <strong>${e(o.trackingNumber)}</strong>`) : ''}
${itemsTable(o, true)}
${totals(o, o.cod ? 'À payer à la livraison' : 'Payé')}
<div style="margin:6px 0 0">${btn(o.trackUrl, 'Suivre ma commande', o.color)}</div>`,
      footer: supportFooter(o),
    }),
  }
}
