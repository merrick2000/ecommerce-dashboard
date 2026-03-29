export type Locale = 'fr' | 'en';

const translations = {
  // Checkout form
  'form.name': { fr: 'Nom', en: 'Name' },
  'form.name.optional': { fr: '(optionnel)', en: '(optional)' },
  'form.name.placeholder': { fr: 'Votre nom', en: 'Your name' },
  'form.email': { fr: 'Email', en: 'Email' },
  'form.email.placeholder': { fr: 'vous@email.com', en: 'you@email.com' },
  'form.phone': { fr: 'WhatsApp / Téléphone', en: 'WhatsApp / Phone' },
  'form.phone.hint': { fr: 'De préférence votre numéro WhatsApp', en: 'Preferably your WhatsApp number' },
  'form.phone.placeholder.bj': { fr: '01 23 45 67 89', en: '01 23 45 67 89' },
  'form.phone.placeholder.default': { fr: '77 123 45 67', en: '77 123 45 67' },
  'form.country.search': { fr: 'Rechercher un pays...', en: 'Search country...' },
  'form.country.empty': { fr: 'Aucun pays trouvé', en: 'No country found' },
  'form.processing': { fr: 'Traitement...', en: 'Processing...' },

  // Checkout page
  'checkout.total': { fr: 'Total à payer', en: 'Total to pay' },
  'checkout.secure': { fr: 'Paiement sécurisé', en: 'Secure payment' },
  'checkout.instant': { fr: 'Accès instant', en: 'Instant access' },
  'checkout.instant_guaranteed': { fr: 'Accès instantané garanti', en: 'Instant access guaranteed' },
  'checkout.features_title': { fr: 'Ce que vous obtenez', en: 'What you get ?' },

  // Urgency / Social proof
  'urgency.viewers': { fr: 'personnes regardent ce produit', en: 'people are viewing this product' },
  'urgency.spots_left': { fr: 'Plus que', en: 'Only' },
  'urgency.spots_remaining': { fr: 'places restantes', en: 'spots remaining' },
  'urgency.flash_sale': { fr: 'OFFRE FLASH', en: 'FLASH SALE' },
  'urgency.discount': { fr: 'de réduction', en: 'off' },

  // Sales popup
  'popup.someone': { fr: "Quelqu'un", en: 'Someone' },
  'popup.from': { fr: 'de', en: 'from' },
  'popup.just_bought': { fr: "vient d'acheter", en: 'just bought' },
  'popup.ago': { fr: 'il y a', en: '' },
  'popup.min': { fr: 'min', en: 'min ago' },

  // Success page
  'success.payment_confirmed': { fr: 'Paiement confirmé !', en: 'Payment confirmed!' },
  'success.thanks': { fr: 'Merci pour votre achat', en: 'Thank you for your purchase' },
  'success.order_confirmed': { fr: 'Votre commande a été confirmée', en: 'Your order has been confirmed' },
  'success.download': { fr: 'Télécharger mon fichier', en: 'Download my file' },
  'success.downloading': { fr: 'Téléchargement en cours...', en: 'Downloading...' },
  'success.access': { fr: 'Accéder à mon contenu', en: 'Access my content' },
  'success.amount_paid': { fr: 'Montant payé', en: 'Amount paid' },
  'success.order': { fr: 'Commande', en: 'Order' },
  'success.order_ref': { fr: 'Référence commande', en: 'Order reference' },
  'success.amount': { fr: 'Montant', en: 'Amount' },
  'success.link_expires': { fr: 'Le lien expire dans 30 minutes. Téléchargez votre fichier maintenant.', en: 'The link expires in 30 minutes. Download your file now.' },
  'success.no_file': { fr: 'Aucun fichier disponible pour le moment.', en: 'No file available at the moment.' },
  'success.verifying': { fr: 'Paiement en cours de vérification...', en: 'Payment verification in progress...' },
  'success.verifying_detail': { fr: 'Vous recevrez un email dès que le paiement sera confirmé.', en: 'You will receive an email once payment is confirmed.' },
  'success.confirmation_sent': { fr: 'Confirmation envoyée', en: 'Confirmation sent' },
  'success.recap_sent': { fr: 'Un récapitulatif a été envoyé à', en: 'A summary has been sent to' },
  'success.back_to_store': { fr: 'Retour à la boutique', en: 'Back to store' },
  'success.email_sent': { fr: 'Un email de confirmation a été envoyé', en: 'A confirmation email has been sent' },

  // Catalog
  'catalog.title': { fr: 'Nos produits', en: 'Our products' },
  'catalog.subtitle': { fr: 'Découvrez tous les produits de', en: 'Browse all products from' },
  'catalog.view_product': { fr: 'Voir le produit', en: 'View product' },
  'catalog.no_products': { fr: 'Aucun produit disponible pour le moment.', en: 'No products available at the moment.' },

  // Sections
  'section.faq_title': { fr: 'Questions fréquentes', en: 'Frequently asked questions' },
  'section.testimonials_title': { fr: 'Ce que nos clients disent', en: 'What our customers say' },
  'section.features_title': { fr: 'Ce que vous obtenez', en: 'What you get ?' },
  'section.guarantee_detail': { fr: 'Recevez votre produit immédiatement après le paiement. Satisfaction garantie.', en: 'Receive your product immediately after payment. Satisfaction guaranteed.' },

  // Price
  'price.instead_of': { fr: 'au lieu de', en: 'instead of' },

  // Sticky CTA
  'sticky.secure': { fr: 'Paiement sécurisé', en: 'Secure payment' },

  // Payment page
  'payment.title': { fr: 'Paiement', en: 'Payment' },
  'payment.summary': { fr: 'Récapitulatif', en: 'Summary' },
  'payment.select_country': { fr: 'Choisissez votre pays', en: 'Select your country' },
  'payment.select_network': { fr: 'Choisissez votre réseau', en: 'Select your network' },
  'payment.phone': { fr: 'Numéro de téléphone', en: 'Phone number' },
  'payment.phone_placeholder': { fr: 'Ex: 97 00 00 00', en: 'Ex: 97 00 00 00' },
  'payment.phone_hint': { fr: 'Le numéro associé à votre compte mobile money', en: 'The number linked to your mobile money account' },
  'payment.pay': { fr: 'Payer', en: 'Pay' },
  'payment.processing': { fr: 'Traitement en cours...', en: 'Processing...' },
  'payment.confirm_phone': { fr: 'Confirmez le paiement sur votre téléphone', en: 'Confirm payment on your phone' },
  'payment.confirm_detail': { fr: 'Vous allez recevoir une demande de confirmation sur votre téléphone. Entrez votre code PIN pour valider.', en: 'You will receive a confirmation request on your phone. Enter your PIN to validate.' },
  'payment.waiting': { fr: 'En attente de confirmation...', en: 'Waiting for confirmation...' },
  'payment.failed': { fr: 'Le paiement a échoué. Veuillez réessayer.', en: 'Payment failed. Please try again.' },
  'payment.retry': { fr: 'Réessayer', en: 'Try again' },
  'payment.secure': { fr: 'Paiement sécurisé et chiffré', en: 'Secure and encrypted payment' },
  'payment.no_country': { fr: 'Votre pays n\'est pas encore supporté', en: 'Your country is not yet supported' },
  'payment.otp_title': { fr: 'Code de confirmation', en: 'Confirmation code' },
  'payment.otp_detail': { fr: 'Entrez le code reçu par SMS sur votre téléphone.', en: 'Enter the code received by SMS on your phone.' },
  'payment.otp_placeholder': { fr: 'Ex: 1234', en: 'Ex: 1234' },
  'payment.otp_submit': { fr: 'Confirmer le paiement', en: 'Confirm payment' },
  'payment.otp_resend': { fr: 'Renvoyer le code', en: 'Resend code' },

  // Footer
  'footer.powered_by': { fr: 'Propulsé par', en: 'Powered by' },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale = 'fr'): string {
  return translations[key]?.[locale] ?? translations[key]?.['fr'] ?? key;
}

export function createT(locale: Locale = 'fr') {
  return (key: TranslationKey) => t(key, locale);
}
