import { escapeHtml } from '../lib/sanitize'

const fmt = (n: number, currency: string) => `${new Intl.NumberFormat('fr-FR').format(n)} ${currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency}`

function layout(storeName: string, inner: string, color = '#f59e0b') {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:${color};padding:18px 24px;color:#fff;font-weight:700;font-size:18px">${escapeHtml(storeName)}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">${inner}</td></tr>
</table></td></tr></table></body></html>`
}

const button = (href: string, label: string, color = '#f59e0b') =>
  `<p style="text-align:center;margin:24px 0"><a href="${escapeHtml(href)}" style="background:${color};color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">${escapeHtml(label)}</a></p>`

export function digitalReceiptEmail(p: { storeName: string; customerName: string | null; orderNumber: string; items: string[]; total: number; currency: string; accessUrl: string }) {
  return {
    subject: `Votre commande ${p.orderNumber} | accès à votre produit`,
    html: layout(
      p.storeName,
      `<p>Bonjour ${escapeHtml(p.customerName?.split(' ')[0] ?? '')},</p>
<p>Merci pour votre achat ! Votre paiement de <strong>${fmt(p.total, p.currency)}</strong> est confirmé.</p>
<p>${p.items.map(escapeHtml).join('<br>')}</p>
${button(p.accessUrl, 'Accéder à mon produit')}
<p style="color:#71717a;font-size:13px">Gardez cet email : ce lien vous permet de retélécharger votre produit à tout moment.<br>Commande ${escapeHtml(p.orderNumber)}</p>`,
    ),
  }
}

export function physicalConfirmationEmail(p: { storeName: string; customerName: string | null; orderNumber: string; items: string[]; total: number; currency: string; cod: boolean; trackUrl: string }) {
  return {
    subject: `Commande ${p.orderNumber} bien reçue`,
    html: layout(
      p.storeName,
      `<p>Bonjour ${escapeHtml(p.customerName?.split(' ')[0] ?? '')},</p>
<p>Nous avons bien reçu votre commande :</p>
<p>${p.items.map(escapeHtml).join('<br>')}</p>
<p>Total : <strong>${fmt(p.total, p.currency)}</strong>${p.cod ? ' (à payer à la livraison)' : ''}.</p>
<p>Nous allons vous appeler pour confirmer la livraison. Gardez votre téléphone à portée de main 📞</p>
${button(p.trackUrl, 'Suivre ma commande')}`,
    ),
  }
}

export function sellerNewOrderEmail(p: { storeName: string; orderNumber: string; customer: string; phone: string | null; items: string[]; total: number; currency: string; method: string; dashboardUrl: string }) {
  return {
    subject: `🛒 Nouvelle commande ${p.orderNumber} | ${fmt(p.total, p.currency)}`,
    html: layout(
      p.storeName,
      `<p><strong>${escapeHtml(p.customer)}</strong> ${p.phone ? `(${escapeHtml(p.phone)})` : ''}</p>
<p>${p.items.map(escapeHtml).join('<br>')}</p>
<p>Total : <strong>${fmt(p.total, p.currency)}</strong> | ${escapeHtml(p.method)}</p>
${button(p.dashboardUrl, 'Ouvrir la commande')}`,
    ),
  }
}

const REMINDERS = [
  { subject: 'Vous avez oublié quelque chose 👀', body: 'Vous étiez sur le point de commander <strong>{product}</strong>. Votre commande vous attend toujours.' },
  { subject: 'Toujours intéressé(e) par {product} ?', body: 'Beaucoup de clients ont déjà franchi le pas. Il ne vous reste qu’un clic pour finaliser votre commande de <strong>{product}</strong>.' },
  { subject: 'Dernier rappel : une remise vous attend', body: 'C’est notre dernier message au sujet de <strong>{product}</strong>.' },
]

export function abandonedCartEmail(p: { step: number; storeName: string; name: string | null; product: string; url: string; promo?: { code: string; label: string } }) {
  const tpl = REMINDERS[Math.min(p.step, REMINDERS.length) - 1]!
  const product = escapeHtml(p.product)
  return {
    subject: tpl.subject.replace('{product}', p.product),
    html: layout(
      p.storeName,
      `<p>Bonjour ${escapeHtml(p.name?.split(' ')[0] ?? '')},</p>
<p>${tpl.body.replace('{product}', product)}</p>
${p.promo ? `<p style="background:#fef3c7;border-radius:8px;padding:12px;text-align:center">Code <strong>${escapeHtml(p.promo.code)}</strong> : ${escapeHtml(p.promo.label)}, appliqué automatiquement via le bouton ci-dessous.</p>` : ''}
${button(p.url, 'Finaliser ma commande')}`,
    ),
  }
}

export { fmt as formatMoney }

// ─── Emails de compte (signés Zuri, sans rapport avec une boutique) ─────────

const firstName = (name: string) => escapeHtml(name.trim().split(/\s+/)[0] ?? '')
const small = (text: string) => `<p style="font-size:13px;color:#71717a;margin-top:24px">${text}</p>`
const detailRows = (rows: [string, string][]) =>
  `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f4f4f5;border-radius:8px;padding:12px 16px;font-size:14px;margin:16px 0">${rows
    .map(([k, v]) => `<tr><td style="color:#71717a;padding:4px 12px 4px 0;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join('')}</table>`

export function welcomeEmail(p: { name: string; appUrl: string }) {
  return {
    subject: 'Bienvenue sur Zuri',
    html: layout(
      'Zuri',
      `<p>Bonjour ${firstName(p.name)},</p>
<p>Votre compte Zuri est prêt. Voici les trois étapes pour encaisser votre première commande :</p>
<ol style="padding-left:20px">
<li style="margin-bottom:8px"><strong>Créez votre boutique</strong> : nom, devise et pays.</li>
<li style="margin-bottom:8px"><strong>Ajoutez un produit</strong> : photos, prix, et le mode de paiement (en ligne, via une intégration, ou à la livraison).</li>
<li style="margin-bottom:8px"><strong>Partagez le lien</strong> de la page de vente dans vos pubs, votre bio ou sur WhatsApp.</li>
</ol>
<p>Pour un produit physique, pensez aussi à configurer vos <strong>zones de livraison</strong>.</p>
${button(p.appUrl, 'Ouvrir mon espace')}
${small('Vous recevez cet email parce qu’un compte Zuri vient d’être créé avec cette adresse.')}`,
    ),
  }
}

export function passwordResetEmail(p: { name: string; resetUrl: string; minutes: number }) {
  return {
    subject: 'Réinitialiser votre mot de passe Zuri',
    html: layout(
      'Zuri',
      `<p>Bonjour ${firstName(p.name)},</p>
<p>Vous avez demandé à changer le mot de passe de votre compte Zuri. Cliquez sur le bouton pour en choisir un nouveau :</p>
${button(p.resetUrl, 'Choisir un nouveau mot de passe')}
<p>Ce lien est valable <strong>${p.minutes} minutes</strong> et ne fonctionne qu’une seule fois.</p>
${small('Vous n’êtes pas à l’origine de cette demande ? Ignorez cet email : votre mot de passe actuel reste valable et personne ne peut l’utiliser sans ce lien.')}`,
    ),
  }
}

export function passwordChangedEmail(p: { name: string; when: string; device: string; forgotUrl: string }) {
  return {
    subject: 'Votre mot de passe Zuri a été modifié',
    html: layout(
      'Zuri',
      `<p>Bonjour ${firstName(p.name)},</p>
<p>Le mot de passe de votre compte Zuri vient d’être modifié. Par sécurité, toutes vos autres sessions ont été déconnectées.</p>
${detailRows([
  ['Date', p.when],
  ['Appareil', p.device],
])}
<p><strong>Ce n’est pas vous ?</strong> Réinitialisez immédiatement votre mot de passe :</p>
${button(p.forgotUrl, 'Sécuriser mon compte', '#dc2626')}`,
    ),
  }
}

export function newLoginEmail(p: { name: string; when: string; device: string; location: string; method: string; forgotUrl: string }) {
  return {
    subject: 'Nouvelle connexion à votre compte Zuri',
    html: layout(
      'Zuri',
      `<p>Bonjour ${firstName(p.name)},</p>
<p>Votre compte Zuri vient d’être utilisé depuis un appareil que nous ne connaissions pas :</p>
${detailRows([
  ['Date', p.when],
  ['Appareil', p.device],
  ['Lieu', p.location],
  ['Méthode', p.method],
])}
<p>Si c’est vous, il n’y a rien à faire.</p>
<p><strong>Ce n’est pas vous ?</strong> Changez votre mot de passe tout de suite :</p>
${button(p.forgotUrl, 'Sécuriser mon compte', '#dc2626')}`,
    ),
  }
}

export function teamInviteEmail(p: { storeName: string; inviterName: string; roleLabel: string; roleDescription: string; acceptUrl: string; days: number }) {
  return {
    subject: `${p.inviterName} vous invite à rejoindre ${p.storeName} sur Zuri`,
    html: layout(
      'Zuri',
      `<p>Bonjour,</p>
<p><strong>${escapeHtml(p.inviterName)}</strong> vous invite à rejoindre l’équipe de la boutique <strong>${escapeHtml(p.storeName)}</strong> en tant que <strong>${escapeHtml(p.roleLabel)}</strong>.</p>
<p style="color:#52525b">${escapeHtml(p.roleDescription)}</p>
${button(p.acceptUrl, 'Rejoindre l’équipe')}
<p>Cette invitation est valable <strong>${p.days} jours</strong>. Vous pourrez vous connecter avec Google ou créer un mot de passe.</p>
${small('Vous ne connaissez pas cette personne ? Ignorez cet email, rien ne sera créé.')}`,
    ),
  }
}
