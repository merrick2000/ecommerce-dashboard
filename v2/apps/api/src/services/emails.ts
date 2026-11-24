import { escapeHtml } from '../lib/sanitize'

const fmt = (n: number, currency: string) => `${new Intl.NumberFormat('fr-FR').format(n)} ${currency === 'XOF' || currency === 'XAF' ? 'FCFA' : currency}`

/**
 * Gabarit commun des emails : lisible sur téléphone (viewport, marges réduites, bouton pleine largeur),
 * tables pour les vieux clients mail, aucune image ni police externe.
 */
export function layout(storeName: string, inner: string, color = '#f59e0b', lang: 'fr' | 'en' = 'fr') {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><title>${escapeHtml(storeName)}</title>
<style>
body{margin:0;padding:0;-webkit-text-size-adjust:100%}
a{word-break:break-word}
img{max-width:100%;height:auto}
@media (max-width:560px){
.zo{padding:12px 6px!important}
.zc{padding:20px 16px!important;font-size:16px!important}
.zh{padding:16px!important}
.zb{display:block!important;width:100%!important;box-sizing:border-box!important;text-align:center!important}
}
</style></head><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="zo" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fff;border-radius:12px;overflow:hidden">
<tr><td class="zh" style="background:${color};padding:18px 24px;color:#fff;font-weight:700;font-size:18px">${escapeHtml(storeName)}</td></tr>
<tr><td class="zc" style="padding:24px;font-size:15px;line-height:1.6;word-break:break-word">${inner}</td></tr>
</table></td></tr></table></body></html>`
}

export const button = (href: string, label: string, color = '#f59e0b') =>
  `<p style="text-align:center;margin:24px 0"><a class="zb" href="${escapeHtml(href)}" style="background:${color};color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;display:inline-block">${escapeHtml(label)}</a></p>`

const REMINDERS = [
  { subject: 'Vous avez oublié quelque chose ?', body: 'Vous étiez sur le point de commander <strong>{product}</strong>. Votre commande vous attend toujours.' },
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
export const small = (text: string) => `<p style="font-size:13px;color:#71717a;margin-top:24px">${text}</p>`
const detailRows = (rows: [string, string][]) =>
  `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f4f4f5;border-radius:8px;padding:12px 16px;font-size:14px;margin:16px 0">${rows
    .map(([k, v]) => `<tr><td style="color:#71717a;padding:4px 12px 4px 0;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join('')}</table>`

export function welcomeEmail(p: { name: string; appUrl: string; lang?: 'fr' | 'en' }) {
  if (p.lang === 'en')
    return {
      subject: 'Welcome to Zuri',
      html: layout(
        'Zuri',
        `<p>Hi ${firstName(p.name)},</p>
<p>Your Zuri account is ready. Three steps to your first order:</p>
<ol style="padding-left:20px">
<li style="margin-bottom:8px"><strong>Create your store</strong>: name, currency and country.</li>
<li style="margin-bottom:8px"><strong>Add a product</strong>: photos, price, and how customers pay (online, through an integration, or cash on delivery).</li>
<li style="margin-bottom:8px"><strong>Share the link</strong> of your sales page in your ads, your bio or on WhatsApp.</li>
</ol>
<p>For physical products, also set up your <strong>delivery zones</strong>.</p>
${button(p.appUrl, 'Open my dashboard')}
${small('You receive this email because a Zuri account was just created with this address.')}`,
        '#f59e0b',
        'en',
      ),
    }
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

/** Notification d'équipe par email (nouvelle commande, paiement, attribution…). */
export function notificationEmail(p: { title: string; body: string; url: string; storeName: string }) {
  return {
    subject: p.title,
    html: layout(
      p.storeName,
      `<p style="font-size:17px;font-weight:700;margin:0 0 8px">${escapeHtml(p.title)}</p>
<p>${escapeHtml(p.body)}</p>
${button(p.url, 'Ouvrir dans Zuri')}
${small('Vous recevez cet email selon vos réglages de notifications dans Zuri (menu Notifications).')}`,
    ),
  }
}
