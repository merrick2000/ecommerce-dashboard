import type { BestItem, BestPage, Block, Faq, L10n, Source } from './types'

/**
 * Pages « meilleur X / best X » (SEO programmatique) du site Zuri, en français et en anglais.
 * Voir les règles de rédaction dans ./types.ts.
 * Prix relevés sur les pages officielles en novembre 2026. Quand un prix n'a pas pu être vérifié : « voir le site ».
 */

/* Helpers (même style que guides.ts) */
const l = (fr: string, en: string): L10n => ({ fr, en })
const p = (fr: string, en: string): Block => ({ type: 'p', text: { fr, en } })
const h2 = (fr: string, en: string): Block => ({ type: 'h2', text: { fr, en } })
const list = (items: [string, string][], ordered = false): Block => ({
  type: 'list',
  ordered,
  items: items.map(([fr, en]) => ({ fr, en })),
})
const tip = (titleFr: string, titleEn: string, fr: string, en: string): Block => ({
  type: 'tip',
  title: { fr: titleFr, en: titleEn },
  text: { fr, en },
})
const table = (rows: [string, string][][]): Block => ({
  type: 'table',
  rows: rows.map((row) => row.map(([fr, en]) => ({ fr, en }))),
})
const faq = (qFr: string, qEn: string, aFr: string, aEn: string): Faq => ({
  q: { fr: qFr, en: qEn },
  a: { fr: aFr, en: aEn },
})

/* Sources vérifiées (prix : relevé de novembre 2026) */
const S = {
  zuri: { label: 'Zuri, offre de lancement et fonctions (novembre 2026)', url: 'https://zurisell.store' },
  shopifyPricing: { label: 'Shopify, page Tarifs (prix relevés en novembre 2026)', url: 'https://www.shopify.com/pricing' },
  shopifyPaymentsCountries: { label: 'Shopify Help Center, pays où Shopify Payments est disponible', url: 'https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries' },
  shopifyManual: { label: 'Shopify Help Center, paiements manuels (COD)', url: 'https://help.shopify.com/en/manual/payments/manual-payments' },
  easySell: { label: 'Shopify App Store, EasySell COD Form (tarifs relevés en novembre 2026)', url: 'https://apps.shopify.com/easy-order-form' },
  almanac: { label: 'HTTP Archive, Web Almanac 2025, chapitre Ecommerce (Core Web Vitals mobile)', url: 'https://almanac.httparchive.org/en/2025/ecommerce' },
  wooPricing: { label: 'WooCommerce, page Pricing (coûts relevés en novembre 2026)', url: 'https://woocommerce.com/pricing/' },
  wixPlans: { label: 'Wix, page des forfaits (consultée en novembre 2026, prix selon le pays)', url: 'https://www.wix.com/plans' },
  youcanPricing: { label: 'YouCan, page Pricing (prix relevés en novembre 2026)', url: 'https://youcan.shop/en/pricing' },
  lfPricing: { label: 'Lightfunnels, page Pricing (prix relevés en novembre 2026)', url: 'https://lightfunnels.com/pricing' },
  easyafrik: { label: 'EasyAfrik, page d’accueil et tarifs (novembre 2026)', url: 'https://easyafrik.com' },
  selika: { label: 'Selika, page d’accueil et tarifs (novembre 2026)', url: 'https://selika.io' },
  owashop: { label: 'OwaShop, page d’accueil et tarifs (novembre 2026)', url: 'https://owashop.com' },
  storeino: { label: 'Storeino, page Pricing (prix relevés en novembre 2026)', url: 'https://storeino.com/en/pricing' },
  chariowPricing: { label: 'Chariow, page Pricing (commissions relevées en novembre 2026)', url: 'https://chariow.com/pricing' },
  chariowHome: { label: 'Chariow, page d’accueil (moyens de paiement)', url: 'https://chariow.com' },
  chariowTerms: { label: 'Chariow, conditions générales (art. 11.2)', url: 'https://chariow.com/terms-of-service' },
  maketou: { label: 'Maketou, page d’accueil et FAQ (commission relevée en novembre 2026)', url: 'https://www.maketou.com/' },
  selarFees: { label: 'Selar Help Center, frais en naira (relevés en novembre 2026)', url: 'https://help.selar.com/portal/en/kb/articles/how-to-pass-transaction-fees-to-your-customers-from-your-selar-dashboard' },
  gumroad: { label: 'Gumroad, page Pricing (frais relevés en novembre 2026)', url: 'https://gumroad.com/pricing' },
  payhip: { label: 'Payhip, page Pricing (prix relevés en novembre 2026)', url: 'https://payhip.com/pricing' },
  dsers: { label: 'DSers, page Pricing (prix relevés en novembre 2026)', url: 'https://www.dsers.com/pricing/' },
  cj: { label: 'CJdropshipping, page d’accueil (intégrations)', url: 'https://cjdropshipping.com/' },
  bumpaPricing: { label: 'Bumpa, page Pricing (prix relevés en novembre 2026)', url: 'https://www.getbumpa.com/pricing' },
  bumpaKenya: { label: 'The Star (Kenya), Bumpa se lance au Kenya, juin 2026', url: 'https://www.the-star.co.ke/business/markets/2026-06-11-nigerian-business-management-platform-bumpa-expands-into-kenyan-market' },
  jumia: { label: 'Jumia Group, pays d’activité', url: 'https://group.jumia.com/' },
  feexpayPricing: { label: 'FeexPay, page Tarification (taux relevés en novembre 2026)', url: 'https://feexpay.me/pricing' },
  fedapayFees: { label: 'FedaPay Support, tarification et frais', url: 'https://support.fedapay.com/portal/en/kb/articles/tarification-et-frais-sur-fedapay' },
  fedapayCountries: { label: 'FedaPay Support, pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
  paydunya: { label: 'PayDunya, site officiel (solutions)', url: 'https://paydunya.com' },
  paydunyaDoc: { label: 'PayDunya, documentation développeur (opérateurs)', url: 'https://developers.paydunya.com/doc/FR/introduction' },
  cinetpay: { label: 'CinetPay, site officiel', url: 'https://cinetpay.com' },
  pawapayPlans: { label: 'pawaPay, page Plans (frais relevés en novembre 2026)', url: 'https://pawapay.io/plans' },
  pawapayProviders: { label: 'pawaPay, opérateurs par pays (documentation)', url: 'https://docs.pawapay.io/v2/docs/providers' },
  paystackPricing: { label: 'Paystack Support, frais de transaction par pays (relevés en novembre 2026)', url: 'https://support.paystack.com/en/articles/2130306' },
  flutterwaveNg: { label: 'Flutterwave, tarifs Nigeria (relevés en novembre 2026)', url: 'https://flutterwave.com/ng/pricing' },
} satisfies Record<string, Source>

/* Fabriques d'entrées : faits communs + ce qui change selon la page */
interface Opt {
  bestFor: L10n
  score: number
  price?: L10n
  pros?: L10n[]
  cons?: L10n[]
}
interface Base {
  price: L10n
  pros: L10n[]
  cons: L10n[]
}
const mk =
  (name: string, url: string, base: Base) =>
  (o: Opt): BestItem => ({
    name,
    url,
    bestFor: o.bestFor,
    price: o.price ?? base.price,
    pros: [...(o.pros ?? []), ...base.pros],
    cons: [...base.cons, ...(o.cons ?? [])],
    score: o.score,
  })

const ZURI_PRICE = l(
  'Gratuit jusqu’au 30 novembre 2026, puis payant (1er mois offert si tu t’inscris avant)',
  'Free until November 30, 2026, then paid (first month free if you sign up before)',
)
const ZURI_NEW = l(
  'Produit nouveau, lancé en 2026 : moins de recul et moins de retours de vendeurs que les plateformes installées.',
  'New product launched in 2026: less track record and fewer seller reviews than established platforms.',
)
const ZURI_DOMAIN = l(
  'Pas encore de domaine personnalisé (c’est prévu) : ta boutique tourne sur une adresse Zuri.',
  'No custom domain yet (it is coming): your store runs on a Zuri address.',
)
const ZURI_PAID = l(
  'Gratuit seulement jusqu’au 30 novembre 2026, ensuite payant. Le premier mois est offert si tu t’inscris avant.',
  'Free only until November 30, 2026, then paid. Your first month is free if you sign up before.',
)
const ZURI_ECOSYSTEM = l(
  'Écosystème plus petit : pas de marketplace d’applications, peu de thèmes, pas d’application mobile.',
  'Smaller ecosystem: no app marketplace, few themes, no mobile app.',
)
const ZURI_PSP = l(
  'Zuri n’encaisse pas lui-même : pour le paiement en ligne, il faut ton propre compte chez un prestataire connecté.',
  'Zuri does not process payments itself: for online payment you need your own account with a connected provider.',
)

const zuri = mk('Zuri', 'https://zurisell.store', {
  price: ZURI_PRICE,
  pros: [
    l(
      'Formulaire de commande en paiement à la livraison et gestion des commandes inclus, avec statuts de livraison.',
      'Cash on delivery order form and order management built in, with delivery statuses.',
    ),
    l(
      'Équipe de closers : les commandes sont attribuées automatiquement à tes agents de confirmation.',
      'Closers team: orders are assigned automatically to your confirmation agents.',
    ),
    l(
      'Mobile Money via ton propre compte FeexPay, FedaPay, PayDunya ou pawaPay : l’argent va chez ton prestataire, jamais chez Zuri.',
      'Mobile Money through your own FeexPay, FedaPay, PayDunya or pawaPay account: the money goes to your provider, never to Zuri.',
    ),
    l(
      'Pixel Meta avec API Conversions et pixel TikTok inclus, plus packs, compte à rebours et zones de livraison.',
      'Meta pixel with Conversions API and TikTok pixel included, plus bundles, countdown and delivery zones.',
    ),
    l('0 % de commission sur tes ventes.', '0% commission on your sales.'),
  ],
  cons: [ZURI_NEW, ZURI_DOMAIN, ZURI_PAID, ZURI_ECOSYSTEM],
})

const shopify = mk('Shopify', 'https://www.shopify.com', {
  price: l(
    'Basic à 27 $/mois (19 $/mois en annuel), après 3 jours d’essai puis 1 $/mois pendant 3 mois',
    'Basic at $27/month ($19/month billed yearly), after a 3-day trial then $1/month for 3 months',
  ),
  pros: [
    l(
      'Plateforme mondiale éprouvée, avec un écosystème immense d’applications et de thèmes.',
      'Proven global platform with a huge ecosystem of apps and themes.',
    ),
    l(
      'Boutiques rapides : selon le Web Almanac 2025, environ 76 % des boutiques Shopify passent les Core Web Vitals sur mobile.',
      'Fast stores: according to the 2025 Web Almanac, about 76% of Shopify stores pass Core Web Vitals on mobile.',
    ),
    l(
      'Le COD marche en « paiement manuel », sans frais de transaction tiers sur ces commandes selon l’aide Shopify.',
      'COD works as a « manual payment », with no third-party transaction fee on those orders according to Shopify Help.',
    ),
  ],
  cons: [
    l(
      'Abonnement en dollars : en monnaie locale, ton coût bouge avec le taux de change.',
      'Subscription in US dollars: in local currency, your cost moves with the exchange rate.',
    ),
    l(
      'Shopify Payments n’est disponible dans aucun pays africain : avec un prestataire tiers, Shopify prend 2 % (Basic) à 0,6 % (Advanced) sur ces paiements.',
      'Shopify Payments is not available in any African country: with a third-party provider, Shopify charges 2% (Basic) to 0.6% (Advanced) on those payments.',
    ),
    l(
      'Formulaire COD en une page et suivi des closers via des applications (ex. EasySell : gratuit jusqu’à 60 commandes par mois, puis 9,95 $/mois).',
      'One-page COD form and closer tracking come from apps (e.g. EasySell: free up to 60 orders a month, then $9.95/month).',
    ),
  ],
})

const woo = mk('WooCommerce', 'https://woocommerce.com', {
  price: l(
    'Logiciel gratuit ; hébergement de 25 $ à 350 $/mois selon WooCommerce, extensions de 29 $ à 299 $/an',
    'Free software; hosting $25 to $350/month according to WooCommerce, extensions $29 to $299/year',
  ),
  pros: [
    l('Le logiciel est gratuit et open source, sans commission de la plateforme.', 'The software is free and open source, with no platform commission.'),
    l('Liberté totale : hébergeur, thème, code, tout se modifie.', 'Total freedom: host, theme and code are all yours to change.'),
    l(
      'La force de WordPress pour le blog et le contenu, et beaucoup de développeurs disponibles.',
      'The power of WordPress for blogging and content, and plenty of developers available.',
    ),
  ],
  cons: [
    l(
      'Hébergement et extensions à payer en plus, souvent en dollars.',
      'Hosting and extensions cost extra, often in US dollars.',
    ),
    l(
      'Mises à jour, sauvegardes et sécurité à ta charge.',
      'Updates, backups and security are your job.',
    ),
    l(
      'La vitesse dépend de ton installation : selon le Web Almanac 2025, environ 35 % des sites WooCommerce passent les Core Web Vitals sur mobile.',
      'Speed depends on your setup: according to the 2025 Web Almanac, about 35% of WooCommerce sites pass Core Web Vitals on mobile.',
    ),
    l(
      'COD avec closers et statuts de livraison : plugins en plus ou développement sur mesure.',
      'COD with closers and delivery statuses: extra plugins or custom development.',
    ),
  ],
})

const wix = mk('Wix', 'https://www.wix.com', {
  price: l(
    'Forfait gratuit sans paiement en ligne ; vendre demande un forfait payant (Core ou plus), prix selon le pays : voir le site',
    'Free plan without online payments; selling needs a paid plan (Core or higher), price depends on your country: see website',
  ),
  pros: [
    l('Éditeur visuel très intuitif, sans compétence technique.', 'Very intuitive visual editor, no technical skills needed.'),
    l(
      'Bonnes performances : selon le Web Almanac 2025, environ 66 % des boutiques Wix passent les Core Web Vitals sur mobile.',
      'Good performance: according to the 2025 Web Almanac, about 66% of Wix stores pass Core Web Vitals on mobile.',
    ),
    l('Tout au même endroit : site vitrine, réservations, blog.', 'Everything in one place: showcase site, bookings, blog.'),
  ],
  cons: [
    l(
      'Le forfait gratuit ne permet pas d’accepter des paiements.',
      'The free plan does not let you accept payments.',
    ),
    l(
      'La page des forfaits met en avant les cartes bancaires et ne mentionne pas le Mobile Money.',
      'The plans page highlights cards and does not mention Mobile Money.',
    ),
    l(
      'La gestion des closers et des statuts COD n’est pas présentée sur la page des forfaits.',
      'Closer management and COD statuses are not presented on the plans page.',
    ),
  ],
})

const youcan = mk('YouCan', 'https://youcan.shop', {
  price: l(
    'Sans abonnement : rien avant 5 000 $ de ventes, puis 0,5 % sur le COD et 1 % en ligne ; abonnements de 29 $ à 229 $/mois',
    'Pay as you go: nothing until $5,000 in sales, then 0.5% on COD and 1% online; subscriptions from $29 to $229/month',
  ),
  pros: [
    l(
      'Formule sans abonnement : rien n’est facturé avant 5 000 $ de ventes.',
      'Pay-as-you-go plan: nothing is billed until $5,000 in sales.',
    ),
    l(
      'Plateforme établie, pensée pour le COD, avec thèmes gratuits, hébergement et SSL inclus.',
      'Established platform built for COD, with free themes, hosting and SSL included.',
    ),
    l('Domaines personnalisés et multidevise disponibles.', 'Custom domains and multi-currency available.'),
  ],
  cons: [
    l(
      'Commission en formule sans abonnement : 0,5 % puis 0,25 % sur le COD, 1 % puis 0,5 % en ligne.',
      'Commission on the pay-as-you-go plan: 0.5% then 0.25% on COD, 1% then 0.5% online.',
    ),
    l('Prix affichés en dollars.', 'Prices shown in US dollars.'),
    l(
      'La page tarifs cite Stripe comme exemple de prestataire, sans présenter de connexion Mobile Money pour l’Afrique de l’Ouest.',
      'The pricing page cites Stripe as an example provider, without presenting a Mobile Money connection for West Africa.',
    ),
  ],
})

const lightfunnels = mk('Lightfunnels', 'https://lightfunnels.com', {
  price: l(
    'Newbie à 9,99 $/mois après 30 jours d’essai ; Standard 49,99 $ ; forfait COD 99,99 $/mois',
    'Newbie at $9.99/month after a 30-day trial; Standard $49.99; COD plan $99.99/month',
  ),
  pros: [
    l('Tunnels de vente et upsells, c’est son point fort.', 'Sales funnels and upsells are its strength.'),
    l(
      'Frais COD bas : 0,20 % (Newbie), 0,10 % (Standard), 0 % sur le forfait COD.',
      'Low COD fees: 0.20% (Newbie), 0.10% (Standard), 0% on the COD plan.',
    ),
    l('Essai de 30 jours sans carte bancaire selon leur site.', '30-day trial with no credit card according to their site.'),
  ],
  cons: [
    l('Forfaits en dollars.', 'Plans in US dollars.'),
    l(
      'Frais sur le paiement en ligne : 1,5 % (Newbie) ou 0,50 % (Standard et COD).',
      'Online payment fees: 1.5% (Newbie) or 0.50% (Standard and COD).',
    ),
    l(
      'Page tarifs en anglais, sans Mobile Money présenté.',
      'Pricing page in English, with no Mobile Money presented.',
    ),
  ],
})

const easyafrik = mk('EasyAfrik', 'https://easyafrik.com', {
  price: l('De 8 900 à 34 900 FCFA/mois, 7 jours d’essai', 'From 8,900 to 34,900 FCFA/month, 7-day trial'),
  pros: [
    l(
      'Création de page par IA à partir d’un lien AliExpress, Shopify ou YouCan.',
      'AI page creation from an AliExpress, Shopify or YouCan link.',
    ),
    l('Prix en FCFA, sans engagement, et commandes illimitées.', 'Prices in FCFA, no commitment, unlimited orders.'),
    l(
      'Outils d’urgence (minuteur, prix barré, stock bas, packs) et agent de commande sur Telegram.',
      'Urgency tools (timer, strikethrough price, low stock, bundles) and an order agent on Telegram.',
    ),
  ],
  cons: [
    l('Abonnement mensuel après les 7 jours d’essai.', 'Monthly subscription after the 7-day trial.'),
    l(
      'La page d’accueil présente le COD en espèces et ne mentionne pas le Mobile Money.',
      'The homepage presents COD as cash and does not mention Mobile Money.',
    ),
    l(
      'Studio IA limité selon le forfait : 5 pages par mois sur Pro, 30 sur Premium.',
      'AI studio capped by plan: 5 pages a month on Pro, 30 on Premium.',
    ),
  ],
})

const selika = mk('Selika', 'https://selika.io', {
  price: l('Gratuit (50 produits) ou Pro à 15 000 FCFA/mois', 'Free (50 products) or Pro at 15,000 FCFA/month'),
  pros: [
    l(
      'Forfait gratuit avec une boutique complète et un sous-domaine selika.io.',
      'Free plan with a complete store and a selika.io subdomain.',
    ),
    l(
      'Gestion des livreurs intégrée : attribution, suivi de chaque colis, rôle « livreur ».',
      'Built-in delivery management: assigning riders, tracking each parcel, a « rider » role.',
    ),
    l('Prix en FCFA, domaine personnalisé sur le forfait Pro.', 'Prices in FCFA, custom domain on the Pro plan.'),
  ],
  cons: [
    l('Forfait gratuit limité à 50 produits.', 'Free plan limited to 50 products.'),
    l(
      'Domaine, statistiques avancées et multi-utilisateur demandent le Pro à 15 000 FCFA/mois.',
      'Domain, advanced analytics and multi-user need Pro at 15,000 FCFA/month.',
    ),
    l(
      'La page d’accueil ne cite pas de prestataire Mobile Money ni d’outils pub (API Conversions, compte à rebours).',
      'The homepage names no Mobile Money provider and no ad tools (Conversions API, countdown).',
    ),
  ],
})

const owashop = mk('OwaShop', 'https://owashop.com', {
  price: l(
    '1re boutique gratuite jusqu’à 1 an, 10 ventes ou 85 $ de ventes, puis 10,99 $/mois par boutique',
    'First store free for up to 1 year, 10 sales or $85 in sales, then $10.99/month per store',
  ),
  pros: [
    l(
      'Paiement à la livraison, notifications et campagnes WhatsApp, pixel Meta inclus.',
      'Cash on delivery, WhatsApp notifications and campaigns, Meta pixel included.',
    ),
    l('Une seule formule simple, boutiques illimitées.', 'One simple plan, unlimited stores.'),
  ],
  cons: [
    l(
      'La gratuité s’arrête à la première limite atteinte : 1 an, 10 ventes ou 85 $ de ventes.',
      'The free period ends at the first limit reached: 1 year, 10 sales or $85 in sales.',
    ),
    l('Ensuite 10,99 $/mois par boutique, en dollars.', 'Then $10.99/month per store, in US dollars.'),
    l(
      'Mobile Money visible en logo partenaire, mais pas décrit comme fonction ; closers non présentés.',
      'Mobile Money shown as a partner logo but not described as a feature; closers not presented.',
    ),
  ],
})

const storeino = mk('Storeino', 'https://storeino.com', {
  price: l(
    'Gratuit avec 0,3 % par commande ; forfaits de 16,99 $ à 89 $/mois',
    'Free with 0.3% per order; plans from $16.99 to $89/month',
  ),
  pros: [
    l('Forfait gratuit sans limite de durée, visiteurs illimités.', 'Free plan with no time limit, unlimited visitors.'),
    l(
      'Fonction pour bannir les faux clients et API pour les sociétés de livraison.',
      'Feature to ban fake customers and an API for delivery companies.',
    ),
    l('0 % de frais par commande sur les forfaits payants.', '0% per-order fee on paid plans.'),
  ],
  cons: [
    l(
      'Le gratuit prend 0,3 % par commande et limite les variantes.',
      'The free plan takes 0.3% per order and limits variants.',
    ),
    l(
      'Forfaits en dollars ; l’essai de 14 jours demande une carte ou PayPal.',
      'Plans in US dollars; the 14-day trial needs a card or PayPal.',
    ),
    l(
      'Pas de Mobile Money d’Afrique de l’Ouest cité sur la page tarifs.',
      'No West African Mobile Money named on the pricing page.',
    ),
  ],
})

const chariow = mk('Chariow', 'https://chariow.com', {
  price: l(
    'Sans abonnement : 15 % par vente jusqu’à 5 000 $, puis 10 %',
    'No subscription: 15% per sale up to $5,000, then 10%',
  ),
  pros: [
    l(
      'Spécialiste des produits digitaux : fichiers, formations, licences, coaching, livrés automatiquement.',
      'Digital product specialist: files, courses, licenses, coaching, delivered automatically.',
    ),
    l(
      'Mobile Money, Orange Money, Wave, MTN Money et cartes, sans compte prestataire à ouvrir.',
      'Mobile Money, Orange Money, Wave, MTN Money and cards, with no provider account to open.',
    ),
    l('Aucun abonnement ni frais d’installation.', 'No subscription and no setup fee.'),
  ],
  cons: [
    l(
      'Commission de 15 % jusqu’à 5 000 $ de ventes, puis 10 %.',
      'Commission of 15% up to $5,000 in sales, then 10%.',
    ),
    l(
      'Les revenus arrivent sur ton portefeuille Chariow 72 heures après la vente (art. 11.2 des CGU).',
      'Earnings reach your Chariow wallet 72 hours after the sale (section 11.2 of the terms).',
    ),
    l(
      'Pensé pour le digital : le COD pour produits physiques n’est pas son usage.',
      'Built for digital: COD for physical products is not what it is for.',
    ),
  ],
})

const maketou = mk('Maketou', 'https://www.maketou.com', {
  price: l('Sans abonnement : 5 % par vente', 'No subscription: 5% per sale'),
  pros: [
    l('Commission basse : 5 % par vente, sans abonnement.', 'Low commission: 5% per sale, no subscription.'),
    l('Marketplace de produits PLR à revendre sous ton nom.', 'Marketplace of PLR products you can resell under your name.'),
    l(
      'Prix en FCFA, euros et dollars ; paiements traités sous 72 h maximum selon leur FAQ.',
      'Prices in FCFA, euros and dollars; payouts processed within 72 hours at most according to their FAQ.',
    ),
  ],
  cons: [
    l(
      '5 % sur chaque vente : 50 000 FCFA sur 1 000 000 FCFA de ventes.',
      '5% on every sale: 50,000 FCFA on 1,000,000 FCFA in sales.',
    ),
    l(
      'Les gains passent par un solde Maketou avant le versement.',
      'Earnings go through a Maketou balance before payout.',
    ),
    l('Centré sur le digital, pas sur le COD physique.', 'Focused on digital, not physical COD.'),
  ],
})

const selar = mk('Selar', 'https://selar.com', {
  price: l('4 % + 50 ₦ par vente en naira', '4% + ₦50 per sale in naira'),
  pros: [
    l(
      'Plateforme établie de produits numériques, avec livraison automatique.',
      'Established digital product platform with automatic delivery.',
    ),
    l(
      'Tu peux faire payer les frais Selar par le client, réglable dans le tableau de bord.',
      'You can pass Selar fees to the customer, from your dashboard.',
    ),
    l(
      'Forte communauté de créateurs au Nigeria et dans les pays anglophones.',
      'Strong creator community in Nigeria and English-speaking countries.',
    ),
  ],
  cons: [
    l('Frais sur chaque vente (4 % + 50 ₦ en naira).', 'Fee on every sale (4% + ₦50 in naira).'),
    l(
      'L’argent est encaissé par Selar avant d’être reversé.',
      'Selar collects the money before paying you out.',
    ),
    l('Pas pensé pour le COD de produits physiques.', 'Not built for physical COD.'),
  ],
})

const bumpa = mk('Bumpa', 'https://www.getbumpa.com', {
  price: l(
    'Starter à 5 000 ₦/mois (15 000 ₦ par trimestre)',
    'Starter at ₦5,000/month (₦15,000 billed quarterly)',
  ),
  pros: [
    l(
      'Outil de gestion pour les vendeurs des réseaux sociaux : site, stock, commandes, paiements.',
      'Business tool for social media sellers: website, inventory, orders, payments.',
    ),
    l(
      'Site web avec SSL inclus sur tous les forfaits, passerelle de paiement en ligne et Bumpa Terminal.',
      'Website with SSL on every plan, online payment gateway and Bumpa Terminal.',
    ),
    l(
      'Prix en naira, payables par carte, virement, QR code ou USSD.',
      'Prices in naira, payable by card, bank transfer, QR code or USSD.',
    ),
  ],
  cons: [
    l(
      'Facturation au trimestre minimum sur les petits forfaits.',
      'Quarterly billing at minimum on the smaller plans.',
    ),
    l(
      'La page tarifs ne mentionne pas le paiement à la livraison ni d’équipe de confirmation.',
      'The pricing page does not mention cash on delivery or a confirmation team.',
    ),
  ],
})

const DISCLOSURE = l(
  'Transparence : cette page est publiée par Zuri. On a mis notre propre outil dans le classement, avec ses limites. Les prix des autres outils viennent de leurs pages officielles, relevés en novembre 2026.',
  'Disclosure: this page is published by Zuri. We included our own tool in the ranking, with its limits. Other tools’ prices come from their official pages, checked in November 2026.',
)

/* ------------------------------------------------------------------ */
/* 1. Meilleure plateforme e-commerce pour l’Afrique                    */
/* ------------------------------------------------------------------ */

const pageAfrica: BestPage = {
  slug: l('meilleure-plateforme-ecommerce-afrique', 'best-ecommerce-platform-africa'),
  title: l('Meilleure plateforme e-commerce en Afrique (2026) | Zuri', 'Best ecommerce platform for Africa (2026) | Zuri'),
  description: l(
    'Zuri, Shopify, YouCan, WooCommerce, EasyAfrik, Selika, Wix : quelle plateforme e-commerce choisir en Afrique pour le COD et le Mobile Money ?',
    'Zuri, Shopify, YouCan, WooCommerce, EasyAfrik, Selika, Wix: which ecommerce platform fits African sellers using COD and Mobile Money?',
  ),
  h1: l('Meilleure plateforme e-commerce pour vendre en Afrique en 2026', 'Best ecommerce platform for selling in Africa in 2026'),
  intro: l(
    'En Afrique, une boutique en ligne doit d’abord gérer le paiement à la livraison, la confirmation par téléphone et le Mobile Money. Le design vient après. On a classé 7 plateformes selon ce qui compte vraiment pour un vendeur qui fait de la pub sur Facebook ou TikTok. ' +
      DISCLOSURE.fr,
    'In Africa, an online store must first handle cash on delivery, phone confirmation and Mobile Money. Design comes second. We ranked 7 platforms on what really matters to a seller running Facebook or TikTok ads. ' +
      DISCLOSURE.en,
  ),
  criteria: [
    l(
      'Paiement à la livraison (COD) : formulaire court, statuts de commande, confirmation par une équipe.',
      'Cash on delivery (COD): short form, order statuses, confirmation by a team.',
    ),
    l(
      'Mobile Money : peut-on encaisser Orange Money, MTN, Moov ou Wave, et via quel prestataire ?',
      'Mobile Money: can you collect Orange Money, MTN, Moov or Wave, and through which provider?',
    ),
    l(
      'Coût en monnaie locale : abonnement, commission, applications payantes, paiement par carte obligatoire ou non.',
      'Cost in local terms: subscription, commission, paid apps, whether a card is required.',
    ),
    l('Prise en main pour un débutant, sur téléphone.', 'Ease of use for a beginner, on a phone.'),
    l('Vitesse des pages sur mobile et outils pour la pub (pixel, API Conversions).', 'Page speed on mobile and ad tools (pixel, Conversions API).'),
    l('Maturité et écosystème : ancienneté, thèmes, applications, communauté.', 'Maturity and ecosystem: track record, themes, apps, community.'),
  ],
  items: [
    zuri({
      bestFor: l(
        'Le vendeur COD qui fait de la pub et veut closers, Mobile Money et pixels au même endroit, sans commission.',
        'The COD seller running ads who wants closers, Mobile Money and pixels in one place, with no commission.',
      ),
      score: 8.8,
    }),
    youcan({
      bestFor: l(
        'Le vendeur COD qui veut une plateforme déjà établie et des domaines personnalisés tout de suite.',
        'The COD seller who wants an established platform and custom domains right away.',
      ),
      score: 8.0,
    }),
    shopify({
      bestFor: l(
        'La marque avec un budget en dollars, un grand catalogue ou des ventes à l’international.',
        'The brand with a dollar budget, a large catalog or international sales.',
      ),
      score: 7.6,
    }),
    easyafrik({
      bestFor: l(
        'Le vendeur de la zone FCFA qui veut générer ses pages par IA et suivre ses commandes sur Telegram.',
        'The FCFA-zone seller who wants AI-generated pages and order tracking on Telegram.',
      ),
      score: 7.5,
    }),
    selika({
      bestFor: l(
        'Le vendeur qui gère ses propres livreurs et a un petit catalogue.',
        'The seller who manages their own riders and has a small catalog.',
      ),
      score: 7.2,
    }),
    woo({
      bestFor: l(
        'Celui qui a un développeur et veut tout contrôler, blog compris.',
        'Someone with a developer who wants full control, blog included.',
      ),
      score: 6.8,
    }),
    wix({
      bestFor: l(
        'Le site vitrine soigné ou l’activité de services avec réservations.',
        'A polished showcase site or a service business with bookings.',
      ),
      score: 6.0,
    }),
  ],
  blocks: [
    h2('Comment choisir ta plateforme e-commerce en Afrique', 'How to choose your ecommerce platform in Africa'),
    p(
      'Commence par la façon dont tes clients paient. Si la majorité veut payer à la livraison, la plateforme doit te donner un formulaire de commande court, des statuts clairs (nouvelle, confirmée, expédiée, livrée, refusée) et un moyen de répartir les appels entre tes closers. Si tu veux encaisser une partie en Mobile Money, vérifie quel prestataire la plateforme connecte et si ce prestataire marche dans ton pays.',
      'Start with how your customers pay. If most of them want to pay on delivery, the platform must give you a short order form, clear statuses (new, confirmed, shipped, delivered, refused) and a way to split calls between your closers. If you want part of your sales in Mobile Money, check which provider the platform connects and whether that provider works in your country.',
    ),
    p(
      'Ensuite, fais le calcul du coût réel sur un mois normal : abonnement, commission sur les ventes, applications en plus, et l’effet du taux de change si tout est en dollars. Une plateforme gratuite avec 1 % de commission peut coûter plus cher qu’un abonnement fixe quand tes ventes montent.',
      'Then work out the real cost over a normal month: subscription, commission on sales, extra apps, and the exchange rate effect if everything is in dollars. A free platform taking 1% can cost more than a fixed subscription once your sales grow.',
    ),
    h2('Les erreurs à éviter', 'Mistakes to avoid'),
    list([
      [
        'Choisir pour le design seulement : une belle boutique sans gestion COD te fera perdre des commandes au moment de la confirmation.',
        'Choosing on design alone: a beautiful store without COD management will lose orders at the confirmation stage.',
      ],
      [
        'Oublier le coût des applications : le formulaire COD, les avis, le compte à rebours s’ajoutent souvent un par un.',
        'Forgetting app costs: COD form, reviews and countdown are often added one by one.',
      ],
      [
        'Croire qu’une plateforme encaisse le Mobile Money partout : la couverture dépend du prestataire et du pays.',
        'Assuming a platform collects Mobile Money everywhere: coverage depends on the provider and the country.',
      ],
      [
        'Lancer la pub sans pixel ni API Conversions bien réglés : Facebook optimise alors à l’aveugle.',
        'Running ads without a properly set pixel and Conversions API: Facebook then optimizes blind.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Plateforme', 'Platform'], ['Prix d’entrée', 'Entry price'], ['COD et closers', 'COD and closers'], ['Mobile Money', 'Mobile Money'], ['Note', 'Score']],
      [['Zuri', 'Zuri'], ['Gratuit jusqu’au 30/11/2026, puis payant', 'Free until 11/30/2026, then paid'], ['Inclus, attribution auto', 'Built in, auto assignment'], ['FeexPay, FedaPay, PayDunya, pawaPay (ton compte)', 'FeexPay, FedaPay, PayDunya, pawaPay (your account)'], ['8,8', '8.8']],
      [['YouCan', 'YouCan'], ['0 $ puis 0,5 % COD / 1 % en ligne', '$0 then 0.5% COD / 1% online'], ['COD oui, comptes équipe', 'COD yes, staff accounts'], ['Non présenté pour l’Afrique de l’Ouest', 'Not presented for West Africa'], ['8,0', '8.0']],
      [['Shopify', 'Shopify'], ['27 $/mois (19 $ en annuel)', '$27/month ($19 yearly)'], ['Via applications', 'Through apps'], ['Via prestataire tiers (+2 % sur Basic)', 'Through third party (+2% on Basic)'], ['7,6', '7.6']],
      [['EasyAfrik', 'EasyAfrik'], ['8 900 FCFA/mois', '8,900 FCFA/month'], ['COD oui, membres d’équipe', 'COD yes, team members'], ['Non mentionné', 'Not mentioned'], ['7,5', '7.5']],
      [['Selika', 'Selika'], ['Gratuit (50 produits)', 'Free (50 products)'], ['Gestion des livreurs', 'Rider management'], ['Prestataire non précisé', 'Provider not named'], ['7,2', '7.2']],
      [['WooCommerce', 'WooCommerce'], ['Gratuit + hébergement 25 à 350 $/mois', 'Free + hosting $25 to $350/month'], ['Via plugins', 'Through plugins'], ['Via plugin du prestataire', 'Through provider plugin'], ['6,8', '6.8']],
      [['Wix', 'Wix'], ['Forfait payant pour vendre', 'Paid plan to sell'], ['Non présenté', 'Not presented'], ['Non mentionné', 'Not mentioned'], ['6,0', '6.0']],
    ]),
    tip(
      'Teste avant de payer',
      'Test before you pay',
      'Crée la même page produit sur deux plateformes, ouvre-la sur un téléphone en 3G ou 4G, et passe une commande test. Tu verras vite laquelle est la plus simple pour ton client et pour tes closers.',
      'Build the same product page on two platforms, open it on a phone over 3G or 4G, and place a test order. You will quickly see which one is simpler for your customer and your closers.',
    ),
  ],
  verdict: l(
    'Pour un vendeur africain qui vend surtout en paiement à la livraison avec de la pub, Zuri arrive premier parce que COD, closers, Mobile Money et pixels sont inclus sans commission. Mais c’est un outil jeune, sans domaine personnalisé pour l’instant, et il devient payant après le 30 novembre 2026. YouCan reste une valeur sûre si tu veux une plateforme COD déjà installée, et Shopify reste imbattable pour l’écosystème si ton budget est en dollars. Cette page est publiée par Zuri.',
    'For an African seller who mostly sells cash on delivery with ads, Zuri comes first because COD, closers, Mobile Money and pixels are included with no commission. But it is a young tool, with no custom domain yet, and it becomes paid after November 30, 2026. YouCan is a safe bet if you want an established COD platform, and Shopify is unbeatable on ecosystem if your budget is in dollars. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Quelle est la meilleure plateforme e-commerce en Afrique ?',
      'What is the best ecommerce platform in Africa?',
      'Ça dépend de ta façon de vendre. Pour le COD avec closers et Mobile Money, Zuri et YouCan sont les plus adaptés. Pour une marque internationale payée par carte, Shopify. Pour un contrôle total avec un développeur, WooCommerce.',
      'It depends on how you sell. For COD with closers and Mobile Money, Zuri and YouCan fit best. For an international brand paid by card, Shopify. For full control with a developer, WooCommerce.',
    ),
    faq(
      'Shopify marche-t-il en Afrique ?',
      'Does Shopify work in Africa?',
      'Oui, tu peux ouvrir une boutique Shopify depuis l’Afrique et prendre le COD en paiement manuel. Par contre, Shopify Payments n’est disponible dans aucun pays africain : pour le paiement en ligne, il faut un prestataire tiers, et Shopify prend alors 2 % sur le forfait Basic.',
      'Yes, you can open a Shopify store from Africa and take COD as a manual payment. However, Shopify Payments is not available in any African country: online payments need a third-party provider, and Shopify then charges 2% on the Basic plan.',
    ),
    faq(
      'Zuri est-il vraiment gratuit ?',
      'Is Zuri really free?',
      'Zuri est gratuit jusqu’au 30 novembre 2026, puis devient payant. Si tu t’inscris avant cette date, ton premier mois est offert. Il n’y a pas de commission sur tes ventes ; seuls les frais de ton prestataire de paiement s’appliquent quand tu encaisses en ligne.',
      'Zuri is free until November 30, 2026, then becomes paid. If you sign up before that date, your first month is free. There is no commission on your sales; only your payment provider’s fees apply when you collect online.',
    ),
    faq(
      'Faut-il une carte bancaire pour créer sa boutique ?',
      'Do I need a credit card to create my store?',
      'Pas toujours. Zuri, Selika et EasyAfrik (pendant l’essai) n’en demandent pas. L’essai de Storeino demande une carte ou PayPal, et les abonnements Shopify sont facturés en dollars.',
      'Not always. Zuri, Selika and EasyAfrik (during the trial) do not ask for one. Storeino’s trial requires a card or PayPal, and Shopify subscriptions are billed in dollars.',
    ),
    faq(
      'Peut-on changer de plateforme plus tard ?',
      'Can I switch platforms later?',
      'Oui. Garde tes photos, tes textes et ta liste de clients hors de la plateforme. Sur Zuri, l’import par fichier CSV (l’export produits de Shopify est reconnu) t’aide à recréer ton catalogue rapidement.',
      'Yes. Keep your photos, copy and customer list outside the platform. On Zuri, CSV import (Shopify’s product export is recognised) helps you rebuild your catalog quickly.',
    ),
  ],
  sources: [S.zuri, S.shopifyPricing, S.shopifyPaymentsCountries, S.shopifyManual, S.easySell, S.almanac, S.youcanPricing, S.easyafrik, S.selika, S.wooPricing, S.wixPlans],
}

/* ------------------------------------------------------------------ */
/* 2. Meilleures alternatives à Shopify en Afrique                      */
/* ------------------------------------------------------------------ */

const pageShopifyAlt: BestPage = {
  slug: l('meilleures-alternatives-shopify-afrique', 'best-shopify-alternatives-africa'),
  title: l('Meilleures alternatives à Shopify en Afrique | Zuri', 'Best Shopify alternatives for Africa (2026) | Zuri'),
  description: l(
    'Les meilleures alternatives à Shopify pour vendre en Afrique en 2026 : COD inclus, Mobile Money, prix en FCFA. Zuri, YouCan, WooCommerce et plus.',
    'The best Shopify alternatives for selling in Africa in 2026: COD built in, Mobile Money, local pricing. Zuri, YouCan, WooCommerce and more.',
  ),
  h1: l('Les meilleures alternatives à Shopify pour vendre en Afrique', 'The best Shopify alternatives for selling in Africa'),
  intro: l(
    'Shopify est une excellente plateforme, rapide et très complète. Mais pour un vendeur africain, l’abonnement en dollars, les applications COD payantes et l’absence de Shopify Payments en Afrique poussent souvent à regarder ailleurs. Voici 7 alternatives classées pour le COD et le Mobile Money. ' +
      DISCLOSURE.fr,
    'Shopify is an excellent platform, fast and very complete. But for an African seller, the dollar subscription, paid COD apps and the lack of Shopify Payments in Africa often lead to looking elsewhere. Here are 7 alternatives ranked for COD and Mobile Money. ' +
      DISCLOSURE.en,
  ),
  criteria: [
    l(
      'Ce que tu économises par rapport à Shopify : abonnement, applications, frais sur paiements tiers.',
      'What you save compared with Shopify: subscription, apps, fees on third-party payments.',
    ),
    l('COD inclus de base : formulaire, statuts, closers.', 'COD built in: form, statuses, closers.'),
    l('Mobile Money disponible dans ton pays.', 'Mobile Money available in your country.'),
    l('Facilité pour recréer tes pages (import de produit, modèles).', 'How easily you can rebuild your pages (product import, templates).'),
    l('Ce que tu perds : écosystème, domaine, ancienneté.', 'What you give up: ecosystem, domain, track record.'),
  ],
  items: [
    zuri({
      bestFor: l(
        'Remplacer Shopify + applications COD par un seul outil sans commission.',
        'Replacing Shopify plus COD apps with one tool and no commission.',
      ),
      score: 8.7,
      pros: [
        l(
          'Import du catalogue par fichier CSV, pratique pour reprendre tes produits Shopify.',
          'CSV catalog import, handy to bring over your Shopify products.',
        ),
      ],
    }),
    youcan({
      bestFor: l(
        'Le vendeur COD qui veut garder des domaines personnalisés et une plateforme établie.',
        'The COD seller who wants custom domains and an established platform.',
      ),
      score: 8.1,
    }),
    woo({
      bestFor: l('Celui qui veut posséder son site et a un développeur.', 'Someone who wants to own their site and has a developer.'),
      score: 7.4,
    }),
    lightfunnels({
      bestFor: l(
        'Le vendeur COD international qui vit des tunnels et des upsells.',
        'The international COD seller who lives on funnels and upsells.',
      ),
      score: 7.3,
    }),
    easyafrik({
      bestFor: l(
        'Recréer vite tes pages Shopify par IA, avec un prix en FCFA.',
        'Quickly rebuilding your Shopify pages with AI, priced in FCFA.',
      ),
      score: 7.3,
    }),
    storeino({
      bestFor: l('Le vendeur au Maroc avec des transporteurs connectés.', 'The seller in Morocco with connected carriers.'),
      score: 7.0,
    }),
    wix({
      bestFor: l('Un site vitrine plus qu’une boutique COD.', 'A showcase site more than a COD store.'),
      score: 6.2,
    }),
  ],
  blocks: [
    h2('Pourquoi chercher une alternative à Shopify ?', 'Why look for a Shopify alternative?'),
    p(
      'Ce n’est pas une question de qualité : Shopify est fiable et ses boutiques sont parmi les plus rapides selon le Web Almanac 2025. Le problème, c’est l’addition pour un vendeur africain : 27 $ par mois sur Basic, plus une application de formulaire COD (EasySell passe à 9,95 $ par mois au-delà de 60 commandes), plus 2 % si tu encaisses en ligne via un prestataire tiers, puisque Shopify Payments n’existe dans aucun pays africain.',
      'It is not about quality: Shopify is reliable and its stores are among the fastest according to the 2025 Web Almanac. The issue is the bill for an African seller: $27 a month on Basic, plus a COD form app (EasySell goes to $9.95 a month above 60 orders), plus 2% if you collect online through a third-party provider, since Shopify Payments exists in no African country.',
    ),
    h2('Comment bien choisir ton alternative', 'How to pick the right alternative'),
    list([
      [
        'Liste tout ce que tu paies aujourd’hui sur Shopify (abonnement et applications) et compare au prix complet de l’alternative.',
        'List everything you pay on Shopify today (subscription and apps) and compare with the alternative’s full price.',
      ],
      [
        'Vérifie que le COD, les closers et les statuts de livraison sont inclus, pas en option.',
        'Check that COD, closers and delivery statuses are included, not add-ons.',
      ],
      [
        'Vérifie le Mobile Money de ton pays chez le prestataire proposé.',
        'Check your country’s Mobile Money with the provider offered.',
      ],
      [
        'Si ton domaine est essentiel dès demain, choisis une plateforme qui le gère déjà (YouCan, WooCommerce, Shopify).',
        'If your domain is essential tomorrow, pick a platform that already supports it (YouCan, WooCommerce, Shopify).',
      ],
    ]),
    h2('Erreurs fréquentes en quittant Shopify', 'Common mistakes when leaving Shopify'),
    list([
      [
        'Couper Shopify avant que la nouvelle boutique soit testée avec de vraies commandes.',
        'Shutting Shopify before the new store is tested with real orders.',
      ],
      [
        'Oublier de réinstaller le pixel Meta, l’API Conversions et le pixel TikTok sur la nouvelle boutique.',
        'Forgetting to reinstall the Meta pixel, Conversions API and TikTok pixel on the new store.',
      ],
      [
        'Changer les liens de pub sans mettre à jour les publicités qui tournent.',
        'Changing ad links without updating running ads.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Outil', 'Tool'], ['Prix d’entrée', 'Entry price'], ['COD inclus', 'COD built in'], ['Domaine perso', 'Custom domain'], ['Note', 'Score']],
      [['Zuri', 'Zuri'], ['Gratuit jusqu’au 30/11/2026', 'Free until 11/30/2026'], ['Oui, avec closers', 'Yes, with closers'], ['Bientôt', 'Coming'], ['8,7', '8.7']],
      [['YouCan', 'YouCan'], ['0 $ puis commission', '$0 then commission'], ['Oui', 'Yes'], ['Oui', 'Yes'], ['8,1', '8.1']],
      [['WooCommerce', 'WooCommerce'], ['Gratuit + hébergement', 'Free + hosting'], ['Via plugins', 'Through plugins'], ['Oui', 'Yes'], ['7,4', '7.4']],
      [['Lightfunnels', 'Lightfunnels'], ['9,99 $/mois', '$9.99/month'], ['Oui, forfait COD', 'Yes, COD plan'], ['Oui', 'Yes'], ['7,3', '7.3']],
      [['EasyAfrik', 'EasyAfrik'], ['8 900 FCFA/mois', '8,900 FCFA/month'], ['Oui', 'Yes'], ['Voir le site', 'See website'], ['7,3', '7.3']],
      [['Storeino', 'Storeino'], ['Gratuit (0,3 %/commande)', 'Free (0.3%/order)'], ['Oui', 'Yes'], ['Oui', 'Yes'], ['7,0', '7.0']],
      [['Wix', 'Wix'], ['Forfait payant', 'Paid plan'], ['Non mis en avant', 'Not highlighted'], ['Oui', 'Yes'], ['6,2', '6.2']],
    ]),
  ],
  verdict: l(
    'Si tu quittes Shopify pour vendre en COD en Afrique, Zuri est l’alternative la plus complète sur le COD (closers, statuts, Mobile Money, pixels) et sans commission, mais c’est un outil récent, sans domaine personnalisé pour l’instant, payant après le 30 novembre 2026. YouCan est le meilleur choix si tu veux une plateforme COD établie avec domaine. Si tu as besoin de l’écosystème d’applications, rester sur Shopify peut être la bonne décision. Cette page est publiée par Zuri.',
    'If you leave Shopify to sell COD in Africa, Zuri is the most complete alternative on COD (closers, statuses, Mobile Money, pixels) with no commission, but it is a recent tool, with no custom domain yet, and paid after November 30, 2026. YouCan is the best pick if you want an established COD platform with a domain. If you need the app ecosystem, staying on Shopify can be the right call. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Quelle est la meilleure alternative gratuite à Shopify ?',
      'What is the best free Shopify alternative?',
      'Pour vendre en COD, Zuri (gratuit jusqu’au 30 novembre 2026), YouCan (rien avant 5 000 $ de ventes, puis commission) et Storeino (gratuit avec 0,3 % par commande). WooCommerce est gratuit mais l’hébergement est payant.',
      'For COD selling, Zuri (free until November 30, 2026), YouCan (nothing until $5,000 in sales, then commission) and Storeino (free with 0.3% per order). WooCommerce is free but hosting is paid.',
    ),
    faq(
      'Shopify est-il trop cher pour l’Afrique ?',
      'Is Shopify too expensive for Africa?',
      'Shopify coûte 27 $ par mois sur Basic (19 $ en annuel), plus les applications. Pour une marque qui vend bien, c’est raisonnable. Pour un débutant qui teste des produits en COD, le total avec applications et taux de change pèse plus lourd.',
      'Shopify costs $27 a month on Basic ($19 yearly), plus apps. For a brand selling well, that is reasonable. For a beginner testing products on COD, the total with apps and exchange rate weighs more.',
    ),
    faq(
      'Peut-on importer ses produits Shopify ailleurs ?',
      'Can I import my Shopify products elsewhere?',
      'Oui. Zuri importe un produit par IA à partir de son lien, et EasyAfrik crée une page à partir d’un lien Shopify. WooCommerce accepte l’import CSV.',
      'Yes. Zuri imports a product with AI from its link, and EasyAfrik builds a page from a Shopify link. WooCommerce accepts CSV import.',
    ),
    faq(
      'Est-ce que je perds mon domaine en quittant Shopify ?',
      'Do I lose my domain when leaving Shopify?',
      'Ton domaine t’appartient et peut être transféré. Attention : Zuri ne gère pas encore les domaines personnalisés, c’est prévu. Si ton domaine est indispensable maintenant, choisis YouCan, WooCommerce ou Lightfunnels.',
      'Your domain is yours and can be transferred. Note: Zuri does not support custom domains yet, it is coming. If your domain is essential now, choose YouCan, WooCommerce or Lightfunnels.',
    ),
  ],
  sources: [S.zuri, S.shopifyPricing, S.shopifyPaymentsCountries, S.easySell, S.almanac, S.youcanPricing, S.wooPricing, S.lfPricing, S.easyafrik, S.storeino, S.wixPlans],
}

/* ------------------------------------------------------------------ */
/* 3. Meilleur site pour créer une boutique en ligne gratuite           */
/* ------------------------------------------------------------------ */

const pageFree: BestPage = {
  slug: l('meilleur-site-boutique-en-ligne-gratuite', 'best-free-online-store-builder-africa'),
  title: l('Meilleur site de boutique en ligne gratuite (2026) | Zuri', 'Best free online store builder in Africa | Zuri'),
  description: l(
    'Boutique en ligne gratuite en Afrique : ce qui est vraiment gratuit chez Zuri, Selika, YouCan, Storeino, OwaShop, WooCommerce et Wix, et les limites.',
    'Free online store in Africa: what is really free at Zuri, Selika, YouCan, Storeino, OwaShop, WooCommerce and Wix, and the limits.',
  ),
  h1: l('Meilleur site pour créer une boutique en ligne gratuite en Afrique', 'Best free online store builder for African sellers'),
  intro: l(
    '« Gratuit » ne veut pas dire la même chose partout : limite de produits, commission sur les ventes, période d’essai, ou pas de paiement en ligne. On a regardé ce qui est vraiment gratuit sur 7 outils et ce qui se passe après. ' +
      DISCLOSURE.fr,
    '« Free » does not mean the same everywhere: product limits, commission on sales, trial period, or no online payments. We looked at what is really free on 7 tools and what happens after. ' +
      DISCLOSURE.en,
  ),
  criteria: [
    l('Ce qui est vraiment gratuit, et pour combien de temps.', 'What is really free, and for how long.'),
    l('Peut-on vendre (COD, paiement en ligne) sans payer ?', 'Can you actually sell (COD, online payment) without paying?'),
    l('Coûts cachés : commission, hébergement, applications.', 'Hidden costs: commission, hosting, apps.'),
    l('Prise en main sur téléphone.', 'Ease of use on a phone.'),
    l('Ce que coûte la suite, en monnaie locale.', 'What comes next costs, in local terms.'),
  ],
  items: [
    zuri({
      bestFor: l(
        'Lancer une boutique COD complète maintenant, sans commission et sans carte bancaire.',
        'Launching a full COD store now, with no commission and no credit card.',
      ),
      score: 8.6,
    }),
    selika({
      bestFor: l('Un petit catalogue de moins de 50 produits, gratuit sans limite de durée.', 'A small catalog under 50 products, free with no time limit.'),
      score: 8.0,
    }),
    youcan({
      bestFor: l('Démarrer sans rien payer jusqu’à 5 000 $ de ventes.', 'Starting with nothing to pay until $5,000 in sales.'),
      score: 7.8,
    }),
    storeino({
      bestFor: l('Un gratuit sans fin, en acceptant 0,3 % par commande.', 'A free plan with no end, accepting 0.3% per order.'),
      score: 7.4,
    }),
    owashop({
      bestFor: l('Tester avec très peu de ventes au départ.', 'Testing with very few sales at first.'),
      score: 7.0,
    }),
    woo({
      bestFor: l('Celui qui a déjà un hébergement et un développeur.', 'Someone who already has hosting and a developer.'),
      score: 6.6,
    }),
    wix({
      bestFor: l('Tester l’éditeur avant de prendre un forfait payant.', 'Trying the editor before taking a paid plan.'),
      score: 5.5,
    }),
  ],
  blocks: [
    h2('Ce que « gratuit » veut dire chez chacun', 'What « free » means at each one'),
    list([
      [
        'Zuri : tout est inclus et gratuit jusqu’au 30 novembre 2026, puis payant. Inscription avant cette date : premier mois offert.',
        'Zuri: everything included and free until November 30, 2026, then paid. Sign up before that date: first month free.',
      ],
      [
        'Selika : gratuit sans limite de durée, mais 50 produits maximum et sous-domaine selika.io.',
        'Selika: free with no time limit, but 50 products max and a selika.io subdomain.',
      ],
      [
        'YouCan : aucun frais avant 5 000 $ de ventes, puis commission de 0,5 % (COD) et 1 % (en ligne).',
        'YouCan: no fees until $5,000 in sales, then 0.5% (COD) and 1% (online) commission.',
      ],
      [
        'Storeino : gratuit sans fin, avec 0,3 % par commande et variantes limitées.',
        'Storeino: free forever, with 0.3% per order and limited variants.',
      ],
      [
        'OwaShop : gratuit jusqu’à 1 an, 10 ventes ou 85 $ de ventes, la première limite atteinte compte.',
        'OwaShop: free up to 1 year, 10 sales or $85 in sales, whichever comes first.',
      ],
      [
        'WooCommerce : logiciel gratuit, mais l’hébergement (25 à 350 $ par mois selon WooCommerce) est à payer.',
        'WooCommerce: free software, but hosting ($25 to $350 a month according to WooCommerce) must be paid.',
      ],
      [
        'Wix : forfait gratuit pour créer un site, mais pas pour accepter des paiements.',
        'Wix: free plan to build a site, but not to accept payments.',
      ],
    ]),
    h2('Les pièges des boutiques gratuites', 'Traps of free stores'),
    list([
      [
        'La limite de ventes qui tombe en pleine campagne de pub : 10 ventes peuvent arriver en une journée.',
        'A sales limit that hits mid ad campaign: 10 sales can come in one day.',
      ],
      [
        'La petite commission qui grossit avec tes ventes.',
        'The small commission that grows with your sales.',
      ],
      [
        'La facturation automatique en dollars à la fin de l’essai.',
        'Automatic dollar billing at the end of the trial.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Outil', 'Tool'], ['Gratuit jusqu’à', 'Free until'], ['Limite principale', 'Main limit'], ['Après', 'After'], ['Note', 'Score']],
      [['Zuri', 'Zuri'], ['30 novembre 2026', 'November 30, 2026'], ['Aucune limite de ventes', 'No sales limit'], ['Payant, 1er mois offert si inscrit avant', 'Paid, 1st month free if signed up before'], ['8,6', '8.6']],
      [['Selika', 'Selika'], ['Sans limite de durée', 'No time limit'], ['50 produits', '50 products'], ['Pro 15 000 FCFA/mois', 'Pro 15,000 FCFA/month'], ['8,0', '8.0']],
      [['YouCan', 'YouCan'], ['5 000 $ de ventes', '$5,000 in sales'], ['Commission ensuite', 'Commission after'], ['0,25 à 1 % ou 29 $+/mois', '0.25 to 1% or $29+/month'], ['7,8', '7.8']],
      [['Storeino', 'Storeino'], ['Sans limite de durée', 'No time limit'], ['0,3 %/commande', '0.3%/order'], ['16,99 à 89 $/mois', '$16.99 to $89/month'], ['7,4', '7.4']],
      [['OwaShop', 'OwaShop'], ['1 an, 10 ventes ou 85 $', '1 year, 10 sales or $85'], ['10 ventes', '10 sales'], ['10,99 $/mois/boutique', '$10.99/month/store'], ['7,0', '7.0']],
      [['WooCommerce', 'WooCommerce'], ['Logiciel gratuit', 'Free software'], ['Hébergement payant', 'Paid hosting'], ['25 à 350 $/mois', '$25 to $350/month'], ['6,6', '6.6']],
      [['Wix', 'Wix'], ['Gratuit sans paiements', 'Free without payments'], ['Pas de vente', 'No selling'], ['Forfait Core ou plus', 'Core plan or higher'], ['5,5', '5.5']],
    ]),
    tip(
      'Pense au mois 3, pas au jour 1',
      'Think of month 3, not day 1',
      'Prends le chiffre d’affaires que tu vises dans 3 mois et calcule ce que chaque outil te coûtera à ce niveau. C’est ce chiffre qui doit décider, pas le mot « gratuit ».',
      'Take the revenue you aim for in 3 months and work out what each tool will cost at that level. That number should decide, not the word « free ».',
    ),
  ],
  verdict: l(
    'Pour lancer une boutique COD complète sans rien payer tout de suite, Zuri est le plus généreux : pas de limite de ventes ni de produits, 0 % de commission. Mais sa gratuité s’arrête le 30 novembre 2026, et c’est un outil nouveau sans domaine personnalisé pour l’instant. Pour du gratuit sans date de fin, Selika (50 produits) et Storeino (0,3 % par commande) sont les plus honnêtes. Cette page est publiée par Zuri.',
    'To launch a full COD store without paying right away, Zuri is the most generous: no sales or product limit, 0% commission. But its free period ends on November 30, 2026, and it is a new tool with no custom domain yet. For free with no end date, Selika (50 products) and Storeino (0.3% per order) are the most straightforward. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Peut-on vraiment créer une boutique en ligne gratuitement ?',
      'Can you really create an online store for free?',
      'Oui, mais regarde la limite : nombre de produits (Selika), commission (Storeino, YouCan), nombre de ventes (OwaShop) ou date de fin (Zuri, gratuit jusqu’au 30 novembre 2026). Sur Wix, le forfait gratuit ne permet pas d’encaisser.',
      'Yes, but check the limit: number of products (Selika), commission (Storeino, YouCan), number of sales (OwaShop) or end date (Zuri, free until November 30, 2026). On Wix, the free plan does not let you collect payments.',
    ),
    faq(
      'Que se passe-t-il chez Zuri après le 30 novembre 2026 ?',
      'What happens at Zuri after November 30, 2026?',
      'Zuri devient payant. Si tu t’es inscrit avant le 30 novembre, ton premier mois est offert, avec toutes les fonctions et 0 % de commission.',
      'Zuri becomes paid. If you signed up before November 30, your first month is free, with every feature and 0% commission.',
    ),
    faq(
      'Une boutique gratuite peut-elle encaisser le Mobile Money ?',
      'Can a free store collect Mobile Money?',
      'Sur Zuri, oui, via ton propre compte FeexPay, FedaPay, PayDunya ou pawaPay ; leurs frais s’appliquent. Les autres outils gratuits de cette liste ne présentent pas de prestataire Mobile Money précis sur leur page.',
      'On Zuri, yes, through your own FeexPay, FedaPay, PayDunya or pawaPay account; their fees apply. The other free tools in this list do not name a specific Mobile Money provider on their pages.',
    ),
    faq(
      'Faut-il un nom de domaine pour commencer ?',
      'Do I need a domain name to start?',
      'Non. Pour tester des produits avec de la pub, une adresse en sous-domaine suffit. Le domaine personnalisé devient utile quand tu construis une marque.',
      'No. To test products with ads, a subdomain address is enough. A custom domain becomes useful when you build a brand.',
    ),
  ],
  sources: [S.zuri, S.selika, S.youcanPricing, S.storeino, S.owashop, S.wooPricing, S.wixPlans],
}

/* ------------------------------------------------------------------ */
/* 4. Meilleure boutique en paiement à la livraison                     */
/* ------------------------------------------------------------------ */

const pageCod: BestPage = {
  slug: l('meilleure-boutique-paiement-a-la-livraison', 'best-cash-on-delivery-store-builder'),
  title: l('Meilleure boutique en paiement à la livraison | Zuri', 'Best cash on delivery store builder (2026) | Zuri'),
  description: l(
    'Quel outil choisir pour vendre en paiement à la livraison ? Formulaire COD, closers, statuts, anti fausses commandes : Zuri, YouCan, Lightfunnels et plus.',
    'Which tool to sell cash on delivery? COD form, closers, statuses, fake order filtering: Zuri, YouCan, Lightfunnels and more, compared.',
  ),
  h1: l('Meilleur outil pour créer une boutique en paiement à la livraison', 'Best tool to build a cash on delivery store'),
  intro: l(
    'En COD, la vente ne se fait pas au clic mais à la livraison. Ce qui compte : un formulaire court, une équipe qui confirme vite, des statuts clairs et un taux de livraison suivi. On a classé 7 outils sur ces points. ' +
      DISCLOSURE.fr,
    'With COD, the sale is not made at the click but at delivery. What matters: a short form, a team that confirms fast, clear statuses and a tracked delivery rate. We ranked 7 tools on these points. ' +
      DISCLOSURE.en,
  ),
  criteria: [
    l('Formulaire de commande COD en une page, sans création de compte.', 'One-page COD order form, no account creation.'),
    l('Confirmation : closers, attribution des commandes, statuts COD.', 'Confirmation: closers, order assignment, COD statuses.'),
    l('Lutte contre les fausses commandes et suivi de la livraison.', 'Fighting fake orders and tracking delivery.'),
    l('Outils de conversion : packs, compte à rebours, prix barré.', 'Conversion tools: bundles, countdown, strikethrough price.'),
    l('Coût par commande ou par mois.', 'Cost per order or per month.'),
    l('Mobile Money en complément (acompte, paiement avant livraison).', 'Mobile Money as a complement (deposit, payment before delivery).'),
  ],
  items: [
    zuri({
      bestFor: l(
        'Le vendeur COD avec une équipe de closers et de la pub Facebook ou TikTok.',
        'The COD seller with a closers team and Facebook or TikTok ads.',
      ),
      score: 9.0,
    }),
    youcan({
      bestFor: l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.'),
      score: 8.2,
    }),
    lightfunnels({
      bestFor: l(
        'Le gros volume COD qui veut 0 % sur le COD avec le forfait à 99,99 $.',
        'High COD volume wanting 0% on COD with the $99.99 plan.',
      ),
      score: 7.8,
    }),
    easyafrik({
      bestFor: l('Le vendeur FCFA qui pilote ses commandes depuis Telegram.', 'The FCFA seller who manages orders from Telegram.'),
      score: 7.8,
    }),
    storeino({
      bestFor: l('Le vendeur qui veut bannir les faux clients et brancher son transporteur.', 'The seller who wants to ban fake customers and connect a carrier.'),
      score: 7.4,
    }),
    shopify({
      bestFor: l('La marque déjà sur Shopify qui ajoute le COD par une application.', 'The brand already on Shopify adding COD through an app.'),
      score: 7.2,
      price: l(
        '27 $/mois (Basic) + application COD, ex. EasySell gratuit jusqu’à 60 commandes puis 9,95 $/mois',
        '$27/month (Basic) + COD app, e.g. EasySell free up to 60 orders then $9.95/month',
      ),
    }),
    owashop({
      bestFor: l('Le petit vendeur qui relance ses clients sur WhatsApp.', 'The small seller who follows up customers on WhatsApp.'),
      score: 6.8,
    }),
  ],
  blocks: [
    h2('Comment choisir un outil COD', 'How to choose a COD tool'),
    p(
      'Regarde ce qui se passe après le clic sur « Commander ». La commande doit arriver chez un closer, qui appelle le client, confirme l’adresse et la date, puis passe le statut à « confirmée ». Ensuite le livreur, puis « livrée » ou « refusée ». Si l’outil ne suit pas ces étapes, tu le feras sur un cahier ou un tableur, et tu perdras des commandes.',
      'Look at what happens after the « Order » click. The order must reach a closer, who calls the customer, confirms address and date, then sets the status to « confirmed ». Then the rider, then « delivered » or « refused ». If the tool does not track these steps, you will do it in a notebook or spreadsheet, and lose orders.',
    ),
    h2('Erreurs à éviter en COD', 'COD mistakes to avoid'),
    list([
      [
        'Un formulaire trop long : nom, téléphone, ville et quartier suffisent souvent.',
        'A form that is too long: name, phone, city and area are often enough.',
      ],
      [
        'Appeler le lendemain : le client oublie vite. Rappelle dans l’heure si possible.',
        'Calling the next day: customers forget fast. Call back within the hour if you can.',
      ],
      [
        'Ne pas suivre le taux de livraison : c’est lui qui dit si ta pub est rentable, pas le nombre de commandes.',
        'Not tracking delivery rate: that tells you if your ads pay off, not the order count.',
      ],
      [
        'Envoyer à Facebook un achat pour chaque commande non confirmée : tu apprends à l’algorithme à chercher des faux clients.',
        'Sending Facebook a purchase for every unconfirmed order: you teach the algorithm to find fake buyers.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Outil', 'Tool'], ['Formulaire COD', 'COD form'], ['Closers', 'Closers'], ['Coût COD', 'COD cost'], ['Note', 'Score']],
      [['Zuri', 'Zuri'], ['Inclus, personnalisable', 'Built in, customizable'], ['Attribution automatique', 'Automatic assignment'], ['0 %', '0%'], ['9,0', '9.0']],
      [['YouCan', 'YouCan'], ['Inclus', 'Built in'], ['Comptes équipe selon forfait', 'Staff accounts by plan'], ['0,5 % puis 0,25 % (sans abonnement)', '0.5% then 0.25% (pay as you go)'], ['8,2', '8.2']],
      [['Lightfunnels', 'Lightfunnels'], ['Inclus', 'Built in'], ['Non présenté sur la page tarifs', 'Not shown on pricing page'], ['0,20 %, 0,10 % ou 0 %', '0.20%, 0.10% or 0%'], ['7,8', '7.8']],
      [['EasyAfrik', 'EasyAfrik'], ['Inclus', 'Built in'], ['Membres d’équipe', 'Team members'], ['Abonnement FCFA', 'FCFA subscription'], ['7,8', '7.8']],
      [['Storeino', 'Storeino'], ['Inclus', 'Built in'], ['Non présenté', 'Not presented'], ['0,3 % en gratuit, 0 % payant', '0.3% free, 0% paid'], ['7,4', '7.4']],
      [['Shopify', 'Shopify'], ['Via application', 'Through an app'], ['Via application', 'Through an app'], ['Prix de l’application', 'App price'], ['7,2', '7.2']],
      [['OwaShop', 'OwaShop'], ['Inclus', 'Built in'], ['Non présenté', 'Not presented'], ['10,99 $/mois/boutique', '$10.99/month/store'], ['6,8', '6.8']],
    ]),
    tip(
      'Le Mobile Money réduit les refus',
      'Mobile Money cuts refusals',
      'Propose un petit acompte en Mobile Money pour les commandes loin de ta ville ou les gros montants. Un client qui a payé une partie ouvre plus souvent la porte au livreur.',
      'Offer a small Mobile Money deposit for orders far from your city or large amounts. A customer who has paid part is more likely to open the door to the rider.',
    ),
  ],
  verdict: l(
    'Pour le COD, Zuri est l’outil le plus complet de ce classement : formulaire, closers avec attribution automatique, statuts, zones de livraison et Mobile Money en complément, sans commission. Ses limites : outil récent, pas encore de domaine personnalisé, payant après le 30 novembre 2026. YouCan est la meilleure alternative établie, et Lightfunnels devient intéressant à gros volume avec son forfait COD à 0 %. Cette page est publiée par Zuri.',
    'For COD, Zuri is the most complete tool in this ranking: form, closers with automatic assignment, statuses, delivery zones and Mobile Money as a complement, with no commission. Its limits: a recent tool, no custom domain yet, paid after November 30, 2026. YouCan is the best established alternative, and Lightfunnels becomes interesting at high volume with its 0% COD plan. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Quel est le meilleur outil pour vendre en paiement à la livraison ?',
      'What is the best tool to sell cash on delivery?',
      'Pour un vendeur avec des closers, Zuri, car la confirmation et les statuts sont inclus sans commission. YouCan et Lightfunnels sont de bons choix établis ; sur Shopify, le COD passe par une application.',
      'For a seller with closers, Zuri, because confirmation and statuses are built in with no commission. YouCan and Lightfunnels are good established choices; on Shopify, COD goes through an app.',
    ),
    faq(
      'Comment réduire les fausses commandes en COD ?',
      'How do I reduce fake COD orders?',
      'Appelle chaque commande avant d’expédier, demande une confirmation sur WhatsApp, et propose un acompte en Mobile Money pour les gros montants ou les zones lointaines.',
      'Call every order before shipping, ask for confirmation on WhatsApp, and offer a Mobile Money deposit for large amounts or distant areas.',
    ),
    faq(
      'Combien coûte le COD sur Shopify ?',
      'How much does COD cost on Shopify?',
      'Le COD en paiement manuel n’a pas de frais de transaction tiers selon l’aide Shopify. Mais il faut l’abonnement (27 $ par mois sur Basic) et souvent une application de formulaire, par exemple EasySell, gratuite jusqu’à 60 commandes puis 9,95 $ par mois.',
      'COD as a manual payment has no third-party transaction fee according to Shopify Help. But you need the subscription ($27 a month on Basic) and often a form app, for example EasySell, free up to 60 orders then $9.95 a month.',
    ),
    faq(
      'Faut-il un compte de paiement pour faire du COD sur Zuri ?',
      'Do I need a payment account for COD on Zuri?',
      'Non. Le COD marche sans prestataire. Le compte FeexPay, FedaPay, PayDunya ou pawaPay sert seulement si tu veux aussi encaisser en Mobile Money.',
      'No. COD works without a provider. A FeexPay, FedaPay, PayDunya or pawaPay account is only needed if you also want to collect Mobile Money.',
    ),
  ],
  sources: [S.zuri, S.youcanPricing, S.lfPricing, S.easyafrik, S.storeino, S.shopifyPricing, S.shopifyManual, S.easySell, S.owashop],
}

/* ------------------------------------------------------------------ */
/* 5. Meilleur moyen de paiement Mobile Money pour un site              */
/* ------------------------------------------------------------------ */

const gw = (name: string, url: string, o: Omit<BestItem, 'name' | 'url'>): BestItem => ({ name, url, ...o })

const pageGateways: BestPage = {
  slug: l('meilleur-moyen-paiement-mobile-money-site', 'best-mobile-money-payment-gateway'),
  title: l('Meilleur moyen de paiement Mobile Money (2026) | Zuri', 'Best Mobile Money payment gateway (2026) | Zuri'),
  description: l(
    'FeexPay, FedaPay, PayDunya, pawaPay, CinetPay, Paystack, Flutterwave : quelle passerelle Mobile Money choisir pour ton site ? Pays, frais, versements.',
    'FeexPay, FedaPay, PayDunya, pawaPay, CinetPay, Paystack, Flutterwave: which Mobile Money gateway for your website? Countries, fees, payouts.',
  ),
  h1: l('Meilleure passerelle de paiement Mobile Money pour ton site', 'Best Mobile Money payment gateway for your website'),
  intro: l(
    'Pour encaisser Orange Money, MTN, Moov, Wave ou M-Pesa sur un site, il te faut une passerelle (un agrégateur de paiement). Le bon choix dépend surtout de ton pays et des opérateurs de tes clients. Zuri n’est pas une passerelle : c’est une boutique qui se connecte à certaines d’entre elles, donc il n’est pas classé ici. Transparence : cette page est publiée par Zuri. Frais relevés sur les pages officielles en novembre 2026 quand ils sont publiés.',
    'To collect Orange Money, MTN, Moov, Wave or M-Pesa on a website, you need a gateway (a payment aggregator). The right choice mostly depends on your country and your customers’ operators. Zuri is not a gateway: it is a store that connects to some of them, so it is not ranked here. Disclosure: this page is published by Zuri. Fees checked on official pages in November 2026 where published.',
  ),
  criteria: [
    l('Couverture : pays et opérateurs Mobile Money pris en charge.', 'Coverage: countries and Mobile Money operators supported.'),
    l('Frais publiés et clairs.', 'Published, clear fees.'),
    l('Versements : vers Mobile Money ou banque, frais de retrait.', 'Payouts: to Mobile Money or bank, withdrawal fees.'),
    l('Intégration : plugins, boutiques compatibles, liens de paiement.', 'Integration: plugins, compatible stores, payment links.'),
    l('Accès pour un petit vendeur : forfait de base, conditions d’ouverture.', 'Access for a small seller: basic plan, account opening conditions.'),
  ],
  items: [
    gw('FeexPay', 'https://feexpay.me', {
      bestFor: l(
        'Le vendeur en Côte d’Ivoire, au Bénin, au Sénégal, au Togo ou au Burkina Faso qui veut Wave, Orange, MTN et Moov.',
        'The seller in Côte d’Ivoire, Benin, Senegal, Togo or Burkina Faso who wants Wave, Orange, MTN and Moov.',
      ),
      price: l(
        'Côte d’Ivoire : 1,8 % Orange Money, 1,5 % Wave, MTN, Moov et Djamo',
        'Côte d’Ivoire: 1.8% Orange Money, 1.5% Wave, MTN, Moov and Djamo',
      ),
      pros: [
        l('Frais publiés par pays et par opérateur sur la page Tarification.', 'Fees published by country and operator on the pricing page.'),
        l(
          'Pays listés : Bénin, Burkina Faso, Congo Brazzaville, Côte d’Ivoire, Sénégal, Togo.',
          'Countries listed: Benin, Burkina Faso, Congo Brazzaville, Côte d’Ivoire, Senegal, Togo.',
        ),
        l('Reversement vers compte bancaire gratuit au Bénin.', 'Free payout to a bank account in Benin.'),
        l('Connecté à Zuri.', 'Connected to Zuri.'),
      ],
      cons: [
        l(
          'Reversements vers Mobile Money payants, et frais selon le pays hors Bénin.',
          'Payouts to Mobile Money are charged, and fees apply outside Benin.',
        ),
        l('Pas de couverture en Afrique de l’Est ou anglophone.', 'No coverage in East or English-speaking Africa.'),
      ],
      score: 8.3,
    }),
    gw('pawaPay', 'https://pawapay.io', {
      bestFor: l(
        'Le vendeur qui vise plusieurs pays, y compris l’Afrique centrale, le Ghana ou la RD Congo.',
        'The seller targeting several countries, including Central Africa, Ghana or DR Congo.',
      ),
      price: l(
        'Standard : 1 % + frais de l’opérateur, sans frais d’installation ni mensuels',
        'Standard: 1% + operator fee, no setup or monthly fee',
      ),
      pros: [
        l(
          'Une seule API pour de nombreux pays : Bénin, Burkina, Cameroun, Côte d’Ivoire, RD Congo, Gabon, Ghana, Kenya, Nigeria, Sénégal et d’autres.',
          'One API for many countries: Benin, Burkina, Cameroon, Côte d’Ivoire, DR Congo, Gabon, Ghana, Kenya, Nigeria, Senegal and more.',
        ),
        l('Forfait Standard sans frais d’installation ni abonnement.', 'Standard plan with no setup or monthly fee.'),
        l('En RD Congo, paiements en francs congolais ou en dollars.', 'In DR Congo, payments in Congolese francs or dollars.'),
        l('Connecté à Zuri.', 'Connected to Zuri.'),
      ],
      cons: [
        l(
          'Frais des opérateurs en plus du 1 %, non détaillés sur la page Plans.',
          'Operator fees on top of the 1%, not detailed on the Plans page.',
        ),
        l(
          'Selon la page Plans, certains opérateurs sont réservés au forfait Enterprise : M-Pesa au Kenya, MTN et Airtel au Nigeria ; Orange en Côte d’Ivoire est annoncé « bientôt ».',
          'According to the Plans page, some operators are Enterprise only: M-Pesa in Kenya, MTN and Airtel in Nigeria; Orange in Côte d’Ivoire is listed as « coming soon ».',
        ),
      ],
      score: 8.2,
    }),
    gw('Paystack', 'https://paystack.com', {
      bestFor: l(
        'Le vendeur au Nigeria, au Ghana, au Kenya ou en Côte d’Ivoire qui veut cartes et Mobile Money.',
        'The seller in Nigeria, Ghana, Kenya or Côte d’Ivoire who wants cards and Mobile Money.',
      ),
      price: l(
        'Nigeria : 1,5 % + 100 ₦ (plafond 2 000 ₦) ; Ghana : 1,95 % ; Kenya M-Pesa : 1,5 % ; Côte d’Ivoire Mobile Money : 1,95 % HT',
        'Nigeria: 1.5% + ₦100 (capped at ₦2,000); Ghana: 1.95%; Kenya M-Pesa: 1.5%; Côte d’Ivoire mobile money: 1.95% excl. VAT',
      ),
      pros: [
        l('Frais publiés par pays, avec un plafond au Nigeria.', 'Fees published by country, with a cap in Nigeria.'),
        l(
          'Mobile Money en Côte d’Ivoire (Wave, MTN, Orange Money), au Ghana et M-Pesa au Kenya.',
          'Mobile money in Côte d’Ivoire (Wave, MTN, Orange Money), in Ghana and M-Pesa in Kenya.',
        ),
        l('Cartes locales et internationales.', 'Local and international cards.'),
      ],
      cons: [
        l('Couverture limitée à quelques pays (6 dans sa grille tarifaire).', 'Coverage limited to a few countries (6 in its fee table).'),
        l('Pas connecté à Zuri aujourd’hui.', 'Not connected to Zuri today.'),
      ],
      score: 8.0,
    }),
    gw('FedaPay', 'https://www.fedapay.com', {
      bestFor: l(
        'Le vendeur de l’UEMOA ou de Guinée qui veut une passerelle locale reconnue.',
        'The seller in WAEMU countries or Guinea who wants a recognized local gateway.',
      ),
      price: l('Voir le site (frais selon le moyen de paiement)', 'See website (fees depend on payment method)'),
      pros: [
        l(
          'Pays : Bénin, Burkina Faso, Côte d’Ivoire, Guinée, Mali, Niger, Sénégal, Togo.',
          'Countries: Benin, Burkina Faso, Côte d’Ivoire, Guinea, Mali, Niger, Senegal, Togo.',
        ),
        l('Couvre la Guinée et le franc guinéen.', 'Covers Guinea and the Guinean franc.'),
        l('Connecté à Zuri.', 'Connected to Zuri.'),
      ],
      cons: [
        l(
          'Demande une présence légale dans l’un des pays pris en charge.',
          'Requires a legal presence in one of the supported countries.',
        ),
        l(
          'Les taux ne sont pas affichés sur la page d’aide sur les frais.',
          'Rates are not shown on the fees help page.',
        ),
      ],
      score: 7.8,
    }),
    gw('PayDunya', 'https://paydunya.com', {
      bestFor: l(
        'Le vendeur au Sénégal et dans l’UEMOA qui veut aussi des outils de facturation et de paiement de masse.',
        'The seller in Senegal and WAEMU who also wants invoicing and bulk payout tools.',
      ),
      price: l('Voir le site', 'See website'),
      pros: [
        l(
          'Opérateurs au Sénégal, en Côte d’Ivoire, au Mali, au Burkina, au Bénin et au Togo, dont Wave et Orange Money.',
          'Operators in Senegal, Côte d’Ivoire, Mali, Burkina, Benin and Togo, including Wave and Orange Money.',
        ),
        l(
          'Plusieurs solutions : paiement sur site, demande de paiement par SMS ou e-mail, paiements de masse.',
          'Several products: website checkout, payment requests by SMS or email, bulk payouts.',
        ),
        l('Connecté à Zuri.', 'Connected to Zuri.'),
      ],
      cons: [
        l('Grille de frais non vérifiée sur une page publique.', 'Fee schedule not verified on a public page.'),
        l('Couverture centrée sur l’Afrique de l’Ouest francophone.', 'Coverage focused on French-speaking West Africa.'),
      ],
      score: 7.6,
    }),
    gw('Flutterwave', 'https://flutterwave.com', {
      bestFor: l(
        'Le vendeur qui encaisse en plusieurs devises, surtout au Nigeria et dans les pays anglophones.',
        'The seller collecting in several currencies, mostly in Nigeria and English-speaking countries.',
      ),
      price: l(
        'Nigeria : 2 % sur cartes locales, 4,8 % sur cartes internationales',
        'Nigeria: 2% on local cards, 4.8% on international cards',
      ),
      pros: [
        l(
          'Présent dans de nombreux pays, dont Cameroun, Côte d’Ivoire, Ghana, Kenya, Nigeria et Sénégal.',
          'Present in many countries, including Cameroon, Côte d’Ivoire, Ghana, Kenya, Nigeria and Senegal.',
        ),
        l('Plus de 15 moyens de paiement, dont Mobile Money et M-Pesa.', '15+ payment options, including mobile money and M-Pesa.'),
      ],
      cons: [
        l(
          'Frais Mobile Money non détaillés sur la page Nigeria ; TVA de 7,5 % sur les frais au Nigeria.',
          'Mobile money fees not detailed on the Nigeria page; 7.5% VAT on fees in Nigeria.',
        ),
        l('Pas connecté à Zuri aujourd’hui.', 'Not connected to Zuri today.'),
      ],
      score: 7.5,
    }),
    gw('CinetPay', 'https://cinetpay.com', {
      bestFor: l(
        'Le vendeur d’Afrique francophone qui veut comparer une autre passerelle locale.',
        'The seller in French-speaking Africa who wants to compare another local gateway.',
      ),
      price: l('Voir le site', 'See website'),
      pros: [
        l('Agrégateur Mobile Money et cartes pour l’Afrique francophone.', 'Mobile money and card aggregator for French-speaking Africa.'),
        l('Plusieurs devises de la région.', 'Several regional currencies.'),
      ],
      cons: [
        l(
          'Nous n’avons pas pu consulter sa grille de frais ni sa liste de pays officielle : vérifie-les avec eux.',
          'We could not check its official fee schedule or country list: verify them directly.',
        ),
        l('Pas connecté à Zuri aujourd’hui.', 'Not connected to Zuri today.'),
      ],
      score: 7.2,
    }),
  ],
  blocks: [
    h2('Comment choisir ta passerelle Mobile Money', 'How to choose your Mobile Money gateway'),
    p(
      'Pars de tes clients, pas de la passerelle. Note les 2 ou 3 opérateurs qu’ils utilisent le plus (par exemple Wave et Orange Money au Sénégal, MTN et Moov au Bénin, M-Pesa au Kenya), puis garde seulement les passerelles qui couvrent ces opérateurs dans ton pays. Compare ensuite le pourcentage, les frais de retrait vers ton Mobile Money ou ta banque, et les papiers demandés pour ouvrir le compte.',
      'Start from your customers, not the gateway. Write down the 2 or 3 operators they use most (for example Wave and Orange Money in Senegal, MTN and Moov in Benin, M-Pesa in Kenya), then keep only the gateways that cover those operators in your country. Then compare the percentage, the payout fees to your Mobile Money or bank, and the documents needed to open an account.',
    ),
    h2('Et Zuri dans tout ça ?', 'Where does Zuri fit?'),
    p(
      'Zuri n’encaisse pas l’argent. Tu connectes ton propre compte FeexPay, FedaPay, PayDunya ou pawaPay à ta boutique, et les paiements arrivent directement chez ton prestataire. Zuri ne prend pas de commission, seuls les frais du prestataire s’appliquent. Paystack, Flutterwave et CinetPay ne sont pas connectés à Zuri aujourd’hui.',
      'Zuri does not collect the money. You connect your own FeexPay, FedaPay, PayDunya or pawaPay account to your store, and payments land directly with your provider. Zuri takes no commission, only the provider’s fees apply. Paystack, Flutterwave and CinetPay are not connected to Zuri today.',
    ),
    h2('Erreurs à éviter', 'Mistakes to avoid'),
    list([
      [
        'Choisir le taux le plus bas sans vérifier que l’opérateur principal de tes clients est couvert.',
        'Choosing the lowest rate without checking that your customers’ main operator is covered.',
      ],
      [
        'Oublier les frais de retrait : un petit taux d’encaissement peut cacher un retrait payant.',
        'Forgetting payout fees: a low collection rate can hide a paid withdrawal.',
      ],
      [
        'Ouvrir le compte la veille d’une campagne : la validation peut demander des documents.',
        'Opening the account the day before a campaign: approval may require documents.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Passerelle', 'Gateway'], ['Zone', 'Region'], ['Frais publiés', 'Published fees'], ['Connecté à Zuri', 'Connected to Zuri'], ['Note', 'Score']],
      [['FeexPay', 'FeexPay'], ['UEMOA + Congo', 'WAEMU + Congo'], ['1,5 à 1,8 % (Côte d’Ivoire)', '1.5 to 1.8% (Côte d’Ivoire)'], ['Oui', 'Yes'], ['8,3', '8.3']],
      [['pawaPay', 'pawaPay'], ['Ouest, Centre, Est', 'West, Central, East'], ['1 % + frais opérateur', '1% + operator fee'], ['Oui', 'Yes'], ['8,2', '8.2']],
      [['Paystack', 'Paystack'], ['NG, GH, KE, CI, ZA, EG', 'NG, GH, KE, CI, ZA, EG'], ['1,5 à 1,95 % selon pays', '1.5 to 1.95% by country'], ['Non', 'No'], ['8,0', '8.0']],
      [['FedaPay', 'FedaPay'], ['UEMOA + Guinée', 'WAEMU + Guinea'], ['Voir le site', 'See website'], ['Oui', 'Yes'], ['7,8', '7.8']],
      [['PayDunya', 'PayDunya'], ['UEMOA', 'WAEMU'], ['Voir le site', 'See website'], ['Oui', 'Yes'], ['7,6', '7.6']],
      [['Flutterwave', 'Flutterwave'], ['Plusieurs pays', 'Many countries'], ['2 % cartes locales (Nigeria)', '2% local cards (Nigeria)'], ['Non', 'No'], ['7,5', '7.5']],
      [['CinetPay', 'CinetPay'], ['Afrique francophone', 'French-speaking Africa'], ['Voir le site', 'See website'], ['Non', 'No'], ['7,2', '7.2']],
    ]),
    tip(
      'Garde le COD à côté',
      'Keep COD alongside',
      'Même avec la meilleure passerelle, beaucoup de clients préfèrent payer à la livraison. Propose les deux : Mobile Money pour ceux qui te font confiance, COD pour les autres.',
      'Even with the best gateway, many customers prefer to pay on delivery. Offer both: Mobile Money for those who trust you, COD for the rest.',
    ),
  ],
  verdict: l(
    'Il n’y a pas une meilleure passerelle pour toute l’Afrique. En Afrique de l’Ouest francophone, FeexPay, FedaPay et PayDunya couvrent les opérateurs du quotidien ; FedaPay est le seul des trois à couvrir la Guinée. Pour plusieurs pays d’un coup, y compris l’Afrique centrale, pawaPay est le plus large, avec des opérateurs réservés à l’Enterprise dans certains pays. Au Nigeria, au Ghana et au Kenya, Paystack a les frais publiés les plus clairs. Zuri n’est pas classé ici : c’est une boutique qui se connecte à FeexPay, FedaPay, PayDunya et pawaPay. Cette page est publiée par Zuri.',
    'There is no single best gateway for all of Africa. In French-speaking West Africa, FeexPay, FedaPay and PayDunya cover everyday operators; FedaPay is the only one of the three covering Guinea. For several countries at once, including Central Africa, pawaPay is the widest, with some operators reserved for Enterprise in certain countries. In Nigeria, Ghana and Kenya, Paystack has the clearest published fees. Zuri is not ranked here: it is a store that connects to FeexPay, FedaPay, PayDunya and pawaPay. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Quelle est la meilleure passerelle Mobile Money en Côte d’Ivoire ?',
      'What is the best Mobile Money gateway in Côte d’Ivoire?',
      'FeexPay publie ses frais : 1,8 % pour Orange Money et 1,5 % pour Wave, MTN et Moov. Paystack affiche 1,95 % HT en Mobile Money. FedaPay, PayDunya et pawaPay y sont aussi présents ; chez pawaPay, Orange est annoncé « bientôt » selon sa page Plans.',
      'FeexPay publishes its fees: 1.8% for Orange Money and 1.5% for Wave, MTN and Moov. Paystack shows 1.95% excl. VAT for mobile money. FedaPay, PayDunya and pawaPay operate there too; at pawaPay, Orange is listed as « coming soon » on its Plans page.',
    ),
    faq(
      'Quelle passerelle pour le Cameroun ou le Gabon ?',
      'Which gateway for Cameroon or Gabon?',
      'pawaPay couvre MTN et Orange au Cameroun, Airtel et Moov au Gabon. Flutterwave est aussi présent au Cameroun.',
      'pawaPay covers MTN and Orange in Cameroon, Airtel and Moov in Gabon. Flutterwave also operates in Cameroon.',
    ),
    faq(
      'Zuri est-il une passerelle de paiement ?',
      'Is Zuri a payment gateway?',
      'Non. Zuri est une boutique en ligne. Tu connectes ton compte FeexPay, FedaPay, PayDunya ou pawaPay, et l’argent arrive chez ce prestataire. Zuri ne touche jamais tes fonds et ne prend pas de commission.',
      'No. Zuri is an online store builder. You connect your FeexPay, FedaPay, PayDunya or pawaPay account, and the money lands with that provider. Zuri never touches your funds and takes no commission.',
    ),
    faq(
      'Faut-il une entreprise enregistrée pour ouvrir un compte ?',
      'Do I need a registered business to open an account?',
      'Ça dépend du prestataire. FedaPay demande une présence légale dans l’un de ses pays. Pour les autres, vérifie les documents demandés au moment de l’inscription.',
      'It depends on the provider. FedaPay requires a legal presence in one of its countries. For the others, check the documents requested at signup.',
    ),
    faq(
      'Combien coûte pawaPay ?',
      'How much does pawaPay cost?',
      'Le forfait Standard affiche 1 % plus les frais de l’opérateur, sans frais d’installation ni abonnement. Le forfait Enterprise est sur devis.',
      'The Standard plan shows 1% plus the operator’s fee, with no setup or monthly fee. The Enterprise plan is quoted.',
    ),
  ],
  sources: [S.feexpayPricing, S.pawapayPlans, S.pawapayProviders, S.paystackPricing, S.fedapayCountries, S.fedapayFees, S.paydunya, S.paydunyaDoc, S.flutterwaveNg, S.cinetpay, S.zuri],
}

/* ------------------------------------------------------------------ */
/* 6. Meilleure plateforme pour vendre des produits digitaux en Afrique */
/* ------------------------------------------------------------------ */

const pageDigital: BestPage = {
  slug: l('meilleure-plateforme-produits-digitaux-afrique', 'best-platform-sell-digital-products-africa'),
  title: l('Meilleure plateforme produits digitaux Afrique | Zuri', 'Best platform to sell digital products in Africa | Zuri'),
  description: l(
    'Ebooks, formations, coaching : Chariow, Maketou, Selar, Gumroad, Payhip ou Zuri ? Commissions, Mobile Money et versements comparés pour l’Afrique.',
    'Ebooks, courses, coaching: Chariow, Maketou, Selar, Gumroad, Payhip or Zuri? Fees, Mobile Money and payouts compared for Africa.',
  ),
  h1: l('Meilleure plateforme pour vendre des produits digitaux en Afrique', 'Best platform to sell digital products in Africa'),
  intro: l(
    'Pour vendre un ebook, une formation ou un coaching en Afrique, la vraie question est : ton client peut-il payer en Mobile Money, et combien la plateforme garde sur chaque vente ? On a comparé 6 options. ' +
      DISCLOSURE.fr,
    'To sell an ebook, a course or coaching in Africa, the real question is: can your customer pay with Mobile Money, and how much does the platform keep on each sale? We compared 6 options. ' +
      DISCLOSURE.en,
  ),
  criteria: [
    l('Commission et frais par vente.', 'Commission and fees per sale.'),
    l('Mobile Money pour l’acheteur dans ton pays.', 'Mobile Money for the buyer in your country.'),
    l('Qui encaisse l’argent, et en combien de temps tu le reçois.', 'Who collects the money, and how fast you get it.'),
    l('Livraison automatique des fichiers et accès.', 'Automatic delivery of files and access.'),
    l('Adapté à ton marché : francophone ou anglophone.', 'Fit with your market: French or English-speaking.'),
    l('Possibilité de vendre aussi du physique en COD.', 'Ability to also sell physical products on COD.'),
  ],
  items: [
    chariow({
      bestFor: l(
        'Le créateur francophone qui vend seulement du digital et ne veut pas ouvrir de compte prestataire.',
        'The French-speaking creator who sells only digital and does not want to open a provider account.',
      ),
      score: 8.6,
    }),
    zuri({
      bestFor: l(
        'Le vendeur qui mélange produits physiques en COD et produits digitaux, sans commission.',
        'The seller mixing physical COD products and digital products, with no commission.',
      ),
      score: 8.3,
      pros: [
        l(
          'Tu peux aussi mettre un lien de paiement Chariow, Maketou ou Selar sur tes pages.',
          'You can also put a Chariow, Maketou or Selar payment link on your pages.',
        ),
      ],
      cons: [ZURI_PSP],
    }),
    maketou({
      bestFor: l(
        'Le créateur qui veut la commission la plus basse sans abonnement, ou revendre des PLR.',
        'The creator who wants the lowest commission with no subscription, or to resell PLR.',
      ),
      score: 8.2,
    }),
    selar({
      bestFor: l('Le créateur au Nigeria ou dans un pays anglophone.', 'The creator in Nigeria or an English-speaking country.'),
      score: 7.8,
    }),
    gw('Gumroad', 'https://gumroad.com', {
      bestFor: l('Le créateur qui vend surtout à l’international, payé par carte.', 'The creator selling mostly internationally, paid by card.'),
      price: l('Sans abonnement : 10 % + 0,50 $ par vente directe, 30 % via Discover', 'No subscription: 10% + $0.50 per direct sale, 30% via Discover'),
      pros: [
        l('Plateforme connue des créateurs dans le monde entier.', 'Platform known to creators worldwide.'),
        l('Aucun abonnement.', 'No subscription.'),
      ],
      cons: [
        l('10 % + 0,50 $ par vente directe, 30 % sur sa marketplace Discover.', '10% + $0.50 per direct sale, 30% on its Discover marketplace.'),
        l(
          'Versements par virement ou PayPal selon le pays ; pas de Mobile Money présenté sur la page tarifs.',
          'Payouts by bank deposit or PayPal depending on country; no Mobile Money presented on the pricing page.',
        ),
      ],
      score: 6.6,
    }),
    gw('Payhip', 'https://payhip.com', {
      bestFor: l('Le créateur qui encaisse déjà via PayPal ou Stripe.', 'The creator already collecting through PayPal or Stripe.'),
      price: l('Gratuit avec 5 % par vente ; Plus 29 $/mois (2 %) ; Pro 99 $/mois (0 %)', 'Free with 5% per sale; Plus $29/month (2%); Pro $99/month (0%)'),
      pros: [
        l('Toutes les fonctions sur tous les forfaits, produits illimités.', 'Every feature on every plan, unlimited products.'),
        l('Formule gratuite à 5 %.', 'Free plan at 5%.'),
      ],
      cons: [
        l(
          'Encaissement via PayPal et Stripe, avec leurs frais ; pas de Mobile Money présenté.',
          'Payments through PayPal and Stripe, with their fees; no Mobile Money presented.',
        ),
        l('Forfaits payants en dollars.', 'Paid plans in US dollars.'),
      ],
      score: 6.4,
    }),
  ],
  blocks: [
    h2('Comment choisir ta plateforme de produits digitaux', 'How to choose your digital product platform'),
    p(
      'Fais le calcul sur un mois type. Avec 500 000 FCFA de ventes, 15 % font 75 000 FCFA chez Chariow, 5 % font 25 000 FCFA chez Maketou. Sur Zuri, il n’y a pas de commission, mais tu paies les frais de ton prestataire de paiement et l’abonnement après le 30 novembre 2026. Ensuite, regarde le confort : une plateforme qui encaisse pour toi t’évite d’ouvrir un compte prestataire, mais l’argent passe par son portefeuille avant de t’arriver.',
      'Run the numbers on a typical month. With 500,000 FCFA in sales, 15% is 75,000 FCFA at Chariow, 5% is 25,000 FCFA at Maketou. On Zuri there is no commission, but you pay your payment provider’s fees and the subscription after November 30, 2026. Then look at convenience: a platform that collects for you saves you opening a provider account, but the money goes through its wallet before reaching you.',
    ),
    h2('Erreurs à éviter', 'Mistakes to avoid'),
    list([
      [
        'Choisir une plateforme sans Mobile Money pour un public africain : beaucoup de tes clients n’ont pas de carte.',
        'Choosing a platform without Mobile Money for an African audience: many of your customers have no card.',
      ],
      [
        'Ignorer le délai de versement quand tu finances ta pub avec tes ventes.',
        'Ignoring payout delay when your ads are funded by your sales.',
      ],
      [
        'Vendre un PLR sans le retravailler : ton client le trouve peut-être déjà ailleurs.',
        'Selling PLR without reworking it: your customer may already find it elsewhere.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Plateforme', 'Platform'], ['Frais par vente', 'Fee per sale'], ['Mobile Money', 'Mobile Money'], ['Qui encaisse', 'Who collects'], ['Note', 'Score']],
      [['Chariow', 'Chariow'], ['15 % puis 10 %', '15% then 10%'], ['Oui, géré par Chariow', 'Yes, handled by Chariow'], ['Chariow (crédit sous 72 h)', 'Chariow (credited within 72h)'], ['8,6', '8.6']],
      [['Zuri', 'Zuri'], ['0 % (frais du prestataire)', '0% (provider fees)'], ['Via ton compte FeexPay, FedaPay, PayDunya, pawaPay', 'Through your FeexPay, FedaPay, PayDunya, pawaPay account'], ['Ton prestataire', 'Your provider'], ['8,3', '8.3']],
      [['Maketou', 'Maketou'], ['5 %', '5%'], ['Voir le site', 'See website'], ['Maketou (sous 72 h max)', 'Maketou (within 72h max)'], ['8,2', '8.2']],
      [['Selar', 'Selar'], ['4 % + 50 ₦ (naira)', '4% + ₦50 (naira)'], ['Voir le site', 'See website'], ['Selar', 'Selar'], ['7,8', '7.8']],
      [['Gumroad', 'Gumroad'], ['10 % + 0,50 $', '10% + $0.50'], ['Non présenté', 'Not presented'], ['Gumroad', 'Gumroad'], ['6,6', '6.6']],
      [['Payhip', 'Payhip'], ['5 %, 2 % ou 0 %', '5%, 2% or 0%'], ['Non présenté', 'Not presented'], ['PayPal ou Stripe', 'PayPal or Stripe'], ['6,4', '6.4']],
    ]),
    tip(
      'Tu n’es pas obligé de choisir',
      'You do not have to choose',
      'Beaucoup de vendeurs gardent Chariow, Maketou ou Selar pour livrer leurs formations et mettent le lien de paiement sur leur boutique Zuri, à côté de leurs produits physiques.',
      'Many sellers keep Chariow, Maketou or Selar to deliver their courses and put the payment link on their Zuri store, next to their physical products.',
    ),
  ],
  verdict: l(
    'Si tu vends uniquement du digital en Afrique francophone, Chariow est le plus simple : Mobile Money et livraison gérés pour toi, contre 15 % puis 10 % de commission. Maketou est le moins cher en commission (5 %). Zuri est le meilleur choix si tu vends aussi des produits physiques en COD et veux garder 100 % de tes ventes, à condition d’avoir ton compte de paiement ; il devient payant après le 30 novembre 2026. Au Nigeria et dans les pays anglophones, Selar est la référence. Cette page est publiée par Zuri.',
    'If you sell only digital products in French-speaking Africa, Chariow is the simplest: Mobile Money and delivery handled for you, for 15% then 10% commission. Maketou is the cheapest on commission (5%). Zuri is the best pick if you also sell physical products on COD and want to keep 100% of your sales, provided you have your own payment account; it becomes paid after November 30, 2026. In Nigeria and English-speaking countries, Selar is the reference. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Quelle plateforme prend le moins de commission ?',
      'Which platform takes the lowest commission?',
      'Zuri ne prend pas de commission (seuls les frais de ton prestataire s’appliquent). Parmi les plateformes qui encaissent pour toi, Maketou est à 5 %, Selar à 4 % + 50 ₦ en naira, Chariow à 15 % puis 10 %.',
      'Zuri takes no commission (only your provider’s fees apply). Among platforms that collect for you, Maketou is at 5%, Selar at 4% + ₦50 in naira, Chariow at 15% then 10%.',
    ),
    faq(
      'Peut-on vendre une formation payée en Mobile Money ?',
      'Can I sell a course paid with Mobile Money?',
      'Oui. Chariow accepte Mobile Money, Orange Money, Wave et MTN Money. Sur Zuri, le Mobile Money passe par ton compte FeexPay, FedaPay, PayDunya ou pawaPay.',
      'Yes. Chariow accepts Mobile Money, Orange Money, Wave and MTN Money. On Zuri, Mobile Money goes through your FeexPay, FedaPay, PayDunya or pawaPay account.',
    ),
    faq(
      'Gumroad marche-t-il en Afrique ?',
      'Does Gumroad work in Africa?',
      'Gumroad verse par virement ou PayPal selon le pays et ne présente pas de Mobile Money sur sa page tarifs. Vérifie que ton pays est pris en charge avant de t’y lancer.',
      'Gumroad pays out by bank deposit or PayPal depending on country and does not present Mobile Money on its pricing page. Check your country is supported before starting.',
    ),
    faq(
      'Combien de temps pour recevoir l’argent ?',
      'How long until I get the money?',
      'Chez Chariow, les revenus sont crédités sur ton portefeuille 72 heures après la vente. Maketou indique des paiements traités sous 72 heures maximum. Sur Zuri, ça dépend de ton prestataire de paiement.',
      'At Chariow, earnings reach your wallet 72 hours after the sale. Maketou says payouts are processed within 72 hours at most. On Zuri, it depends on your payment provider.',
    ),
  ],
  sources: [S.chariowPricing, S.chariowHome, S.chariowTerms, S.maketou, S.selarFees, S.gumroad, S.payhip, S.zuri],
}

/* ------------------------------------------------------------------ */
/* 7. Meilleurs outils de dropshipping en Afrique                       */
/* ------------------------------------------------------------------ */

const pageDropship: BestPage = {
  slug: l('meilleurs-outils-dropshipping-afrique', 'best-dropshipping-tools-africa'),
  title: l('Meilleurs outils de dropshipping en Afrique | Zuri', 'Best dropshipping tools for Africa (2026) | Zuri'),
  description: l(
    'Boutique COD, import de produits, fournisseurs : les meilleurs outils de dropshipping pour l’Afrique en 2026. Zuri, YouCan, EasyAfrik, DSers et plus.',
    'COD store, product import, suppliers: the best dropshipping tools for Africa in 2026. Zuri, YouCan, EasyAfrik, DSers and more, compared.',
  ),
  h1: l('Les meilleurs outils de dropshipping pour vendre en Afrique', 'The best dropshipping tools for selling in Africa'),
  intro: l(
    'En Afrique, le dropshipping se fait souvent en local : tu achètes ou fais venir un stock, tu lances la pub, et tu livres en paiement à la livraison. Il te faut donc une boutique COD, un moyen d’importer vite tes produits, et parfois un outil de sourcing. Voici 7 outils classés pour ce modèle. ' +
      DISCLOSURE.fr,
    'In Africa, dropshipping is often local: you buy or import stock, run ads, and deliver cash on delivery. So you need a COD store, a fast way to import products, and sometimes a sourcing tool. Here are 7 tools ranked for this model. ' +
      DISCLOSURE.en,
  ),
  criteria: [
    l('COD et confirmation des commandes (closers, statuts).', 'COD and order confirmation (closers, statuses).'),
    l('Import du catalogue par fichier CSV (export Shopify reconnu).', 'Catalog import by CSV file (Shopify export recognised).'),
    l('Outils de test de produits : pages courtes, packs, pixels.', 'Product testing tools: short pages, bundles, pixels.'),
    l('Coût total par mois en monnaie locale.', 'Total monthly cost in local terms.'),
    l('Adapté à la livraison en Afrique (zones, délais).', 'Fit with delivery in Africa (zones, lead times).'),
  ],
  items: [
    zuri({
      bestFor: l(
        'Le dropshipper local en COD qui teste beaucoup de produits avec la pub.',
        'The local COD dropshipper testing many products with ads.',
      ),
      score: 8.6,
      pros: [
        l(
          'Une page de vente prête en quelques minutes, sans rien de technique à apprendre.',
          'A sales page ready in minutes, with nothing technical to learn.',
        ),
      ],
    }),
    youcan({
      bestFor: l('Le dropshipper COD qui veut une plateforme établie.', 'The COD dropshipper who wants an established platform.'),
      score: 8.0,
    }),
    easyafrik({
      bestFor: l('Créer des pages par IA depuis AliExpress, avec un prix en FCFA.', 'Building pages with AI from AliExpress, priced in FCFA.'),
      score: 7.8,
    }),
    lightfunnels({
      bestFor: l('Le dropshipper COD international qui vend avec des upsells.', 'The international COD dropshipper who sells with upsells.'),
      score: 7.5,
    }),
    shopify({
      bestFor: l(
        'Le dropshipper international qui veut l’écosystème d’applications (DSers, etc.).',
        'The international dropshipper who wants the app ecosystem (DSers and more).',
      ),
      score: 7.3,
    }),
    gw('DSers', 'https://www.dsers.com', {
      bestFor: l(
        'Importer et commander des produits AliExpress depuis une boutique Shopify.',
        'Importing and ordering AliExpress products from a Shopify store.',
      ),
      price: l('Basic gratuit ; Advanced 19,90 $/mois ; Pro 49,90 $/mois', 'Basic free; Advanced $19.90/month; Pro $49.90/month'),
      pros: [
        l('Fournisseurs AliExpress, Alibaba et 1688.', 'AliExpress, Alibaba and 1688 suppliers.'),
        l('Forfait gratuit jusqu’à 3 boutiques et 3 000 produits.', 'Free plan up to 3 stores and 3,000 products.'),
      ],
      cons: [
        l(
          'Ce n’est pas une boutique : il faut une plateforme compatible (Shopify est mise en avant).',
          'It is not a store: you need a compatible platform (Shopify is highlighted).',
        ),
        l(
          'Commandes groupées et mises à jour automatiques des prix non incluses en gratuit.',
          'Bulk orders and automatic price updates not included on the free plan.',
        ),
      ],
      score: 7.0,
    }),
    gw('CJdropshipping', 'https://cjdropshipping.com', {
      bestFor: l(
        'Trouver un fournisseur et faire expédier depuis ses entrepôts, pour une boutique Shopify ou WooCommerce.',
        'Finding a supplier and shipping from its warehouses, for a Shopify or WooCommerce store.',
      ),
      price: l('Voir le site', 'See website'),
      pros: [
        l(
          'Intégrations avec Shopify, WooCommerce, TikTok Shop et d’autres plateformes.',
          'Integrations with Shopify, WooCommerce, TikTok Shop and other platforms.',
        ),
        l('Plus de 10 entrepôts dans le monde selon son site.', '10+ warehouses worldwide according to its site.'),
      ],
      cons: [
        l(
          'Sa page d’accueil ne mentionne pas l’Afrique : vérifie les délais et frais vers ton pays.',
          'Its homepage does not mention Africa: check lead times and costs to your country.',
        ),
        l('Pas de boutique ni de gestion COD.', 'No store and no COD management.'),
      ],
      score: 6.6,
    }),
  ],
  blocks: [
    h2('Comment choisir tes outils de dropshipping', 'How to choose your dropshipping tools'),
    p(
      'Sépare deux besoins. D’abord, la boutique qui reçoit les commandes et gère la confirmation : c’est là que se joue ta rentabilité en COD. Ensuite, le sourcing : AliExpress via DSers, CJdropshipping, ou un fournisseur local. Pour le COD en Afrique, beaucoup de vendeurs font venir un petit stock avant de lancer la pub, pour livrer en 24 à 72 heures dans leur ville.',
      'Separate two needs. First, the store that receives orders and handles confirmation: that is where your COD profit is decided. Then sourcing: AliExpress through DSers, CJdropshipping, or a local supplier. For COD in Africa, many sellers bring in a small stock before running ads, so they can deliver within 24 to 72 hours in their city.',
    ),
    h2('Erreurs à éviter', 'Mistakes to avoid'),
    list([
      [
        'Lancer la pub sur un produit qui met des semaines à arriver : en COD, le client annule souvent avant.',
        'Running ads on a product that takes weeks to arrive: with COD, customers often cancel before.',
      ],
      [
        'Empiler les applications payantes avant d’avoir trouvé un produit gagnant.',
        'Stacking paid apps before finding a winning product.',
      ],
      [
        'Ne pas calculer la marge après livraison, retours et pub.',
        'Not computing margin after delivery, returns and ads.',
      ],
    ]),
    h2('Tableau comparatif', 'Comparison table'),
    table([
      [['Outil', 'Tool'], ['Type', 'Type'], ['COD', 'COD'], ['Import produit', 'Product import'], ['Note', 'Score']],
      [['Zuri', 'Zuri'], ['Boutique', 'Store'], ['Inclus, closers', 'Built in, closers'], ['IA par lien', 'AI from link'], ['8,6', '8.6']],
      [['YouCan', 'YouCan'], ['Boutique', 'Store'], ['Inclus', 'Built in'], ['Voir le site', 'See website'], ['8,0', '8.0']],
      [['EasyAfrik', 'EasyAfrik'], ['Boutique', 'Store'], ['Inclus', 'Built in'], ['IA par lien (quota)', 'AI from link (quota)'], ['7,8', '7.8']],
      [['Lightfunnels', 'Lightfunnels'], ['Tunnels', 'Funnels'], ['Inclus', 'Built in'], ['Voir le site', 'See website'], ['7,5', '7.5']],
      [['Shopify', 'Shopify'], ['Boutique', 'Store'], ['Via application', 'Through an app'], ['Via applications', 'Through apps'], ['7,3', '7.3']],
      [['DSers', 'DSers'], ['Sourcing', 'Sourcing'], ['Non', 'No'], ['AliExpress', 'AliExpress'], ['7,0', '7.0']],
      [['CJdropshipping', 'CJdropshipping'], ['Sourcing', 'Sourcing'], ['Non', 'No'], ['Catalogue CJ', 'CJ catalog'], ['6,6', '6.6']],
    ]),
  ],
  verdict: l(
    'Pour le dropshipping local en COD, Zuri est le plus adapté : import par IA, closers, zones de livraison et pixels inclus, sans commission. Il reste récent, sans domaine personnalisé pour l’instant, et payant après le 30 novembre 2026. YouCan et EasyAfrik sont de bonnes alternatives COD. Si tu fais du dropshipping international depuis AliExpress, Shopify avec DSers reste le duo le plus connu. Cette page est publiée par Zuri.',
    'For local COD dropshipping, Zuri fits best: AI import, closers, delivery zones and pixels included, with no commission. It is still recent, with no custom domain yet, and paid after November 30, 2026. YouCan and EasyAfrik are good COD alternatives. If you do international dropshipping from AliExpress, Shopify with DSers is still the best-known pair. This page is published by Zuri.',
  ),
  faqs: [
    faq(
      'Quel est le meilleur outil pour faire du dropshipping en Afrique ?',
      'What is the best tool for dropshipping in Africa?',
      'Pour le COD local, une boutique avec confirmation intégrée comme Zuri, YouCan ou EasyAfrik. Pour importer depuis AliExpress vers Shopify, DSers.',
      'For local COD, a store with built-in confirmation like Zuri, YouCan or EasyAfrik. To import from AliExpress into Shopify, DSers.',
    ),
    faq(
      'Peut-on faire du dropshipping depuis la Chine vers l’Afrique ?',
      'Can I dropship from China to Africa?',
      'C’est possible, mais vérifie les délais et frais de livraison vers ton pays chez ton fournisseur avant de lancer la pub. En COD, beaucoup de vendeurs préfèrent avoir un petit stock local.',
      'It is possible, but check lead times and shipping costs to your country with your supplier before running ads. With COD, many sellers prefer a small local stock.',
    ),
    faq(
      'DSers marche-t-il avec Zuri ?',
      'Does DSers work with Zuri?',
      'Non, la page tarifs de DSers met en avant Shopify. Sur Zuri, tu crées ta page produit en quelques minutes, puis tu gères ton stock et tes fournisseurs toi-même.',
      'No, the DSers pricing page highlights Shopify. On Zuri, you create your product page in a few minutes, then manage your stock and suppliers yourself.',
    ),
    faq(
      'Combien faut-il pour commencer le dropshipping COD ?',
      'How much do I need to start COD dropshipping?',
      'Il te faut un budget pour un petit stock de test et pour la pub. La boutique peut être gratuite au départ : Zuri l’est jusqu’au 30 novembre 2026.',
      'You need a budget for a small test stock and for ads. The store can be free at first: Zuri is free until November 30, 2026.',
    ),
  ],
  sources: [S.zuri, S.youcanPricing, S.easyafrik, S.lfPricing, S.shopifyPricing, S.easySell, S.dsers, S.cj],
}

/* ------------------------------------------------------------------ */
/* 8. Déclinaisons pays : meilleur site pour créer une boutique en ligne */
/* ------------------------------------------------------------------ */

interface CItem {
  item: BestItem
  cod: L10n
  momo: L10n
}

interface CountryData {
  slug: string
  enSlug: string
  name: L10n
  /** « en Côte d’Ivoire », « au Sénégal » */
  inFr: string
  /** « in Côte d’Ivoire », « in Senegal » */
  inEn: string
  currency: L10n
  intro: L10n
  items: CItem[]
  payments: L10n
  delivery: L10n
  tips: [string, string][]
  verdict: L10n
  faqs: Faq[]
  sources: Source[]
}

const sc = (n: number) => l(n.toFixed(1).replace('.', ','), n.toFixed(1))

const countryPage = (c: CountryData): BestPage => {
  const titleFr = `Meilleur site de boutique en ligne ${c.inFr}`
  const titleEn = `Best online store builder ${c.inEn} (2026)`
  const names = c.items.map((i) => i.item.name).join(', ')
  return {
    slug: l(`meilleur-site-boutique-en-ligne-${c.slug}`, `best-online-store-builder-${c.enSlug}`),
    title: l(titleFr.length + 7 <= 60 ? `${titleFr} | Zuri` : titleFr, titleEn.length + 7 <= 60 ? `${titleEn} | Zuri` : titleEn),
    description: l(
      `Quel site choisir pour créer ta boutique en ligne ${c.inFr} ? ${names} comparés : COD, Mobile Money, prix.`,
      `Which site to build your online store ${c.inEn}? ${names} compared: COD, Mobile Money, price.`,
    ),
    h1: l(`Meilleur site pour créer une boutique en ligne ${c.inFr} en 2026`, `Best site to create an online store ${c.inEn} in 2026`),
    intro: l(`${c.intro.fr} ${DISCLOSURE.fr}`, `${c.intro.en} ${DISCLOSURE.en}`),
    criteria: [
      l(
        `Paiement à la livraison et confirmation des commandes, comme le veulent les clients ${c.inFr}.`,
        `Cash on delivery and order confirmation, the way buyers ${c.inEn} expect.`,
      ),
      l(
        `Mobile Money local : quels opérateurs, via quel prestataire, ${c.inFr}.`,
        `Local Mobile Money: which operators, through which provider, ${c.inEn}.`,
      ),
      l(`Coût en ${c.currency.fr}, sans carte bancaire si possible.`, `Cost in ${c.currency.en}, ideally with no credit card.`),
      l('Prise en main sur téléphone et pages rapides en 3G ou 4G.', 'Ease of use on a phone and fast pages over 3G or 4G.'),
      l('Maturité et écosystème de l’outil.', 'Tool maturity and ecosystem.'),
    ],
    items: c.items.map((i) => i.item),
    blocks: [
      h2(`Payer en ligne ${c.inFr} : ce qu’il faut savoir`, `Paying online ${c.inEn}: what to know`),
      p(c.payments.fr, c.payments.en),
      h2('Livraison et paiement à la livraison', 'Delivery and cash on delivery'),
      p(c.delivery.fr, c.delivery.en),
      h2('Comment choisir', 'How to choose'),
      list(c.tips),
      h2('Erreurs à éviter', 'Mistakes to avoid'),
      list([
        [
          `Afficher tes prix dans une autre devise que le ${c.currency.fr} : le client doit voir tout de suite ce qu’il paiera.`,
          `Showing prices in another currency than the ${c.currency.en}: buyers must see right away what they will pay.`,
        ],
        [
          'Choisir une plateforme dont le Mobile Money ne couvre pas l’opérateur principal de tes clients.',
          'Choosing a platform whose Mobile Money does not cover your customers’ main operator.',
        ],
        [
          'Expédier sans appeler le client : en COD, la confirmation fait la différence entre un colis livré et un colis refusé.',
          'Shipping without calling the customer: with COD, confirmation makes the difference between a delivered and a refused parcel.',
        ],
      ]),
      h2('Tableau comparatif', 'Comparison table'),
      table([
        [['Outil', 'Tool'], ['Prix d’entrée', 'Entry price'], ['COD', 'COD'], ['Mobile Money local', 'Local Mobile Money'], ['Note', 'Score']],
        ...c.items.map((i): [string, string][] => [
          [i.item.name, i.item.name],
          [i.item.price.fr, i.item.price.en],
          [i.cod.fr, i.cod.en],
          [i.momo.fr, i.momo.en],
          [sc(i.item.score).fr, sc(i.item.score).en],
        ]),
      ]),
    ],
    verdict: l(`${c.verdict.fr} Cette page est publiée par Zuri.`, `${c.verdict.en} This page is published by Zuri.`),
    faqs: [
      ...c.faqs,
      faq(
        `Zuri est-il gratuit ${c.inFr} ?`,
        `Is Zuri free ${c.inEn}?`,
        'Zuri est gratuit jusqu’au 30 novembre 2026, puis devient payant. Si tu t’inscris avant cette date, ton premier mois est offert. Aucune commission sur tes ventes.',
        'Zuri is free until November 30, 2026, then becomes paid. If you sign up before that date, your first month is free. No commission on your sales.',
      ),
      faq(
        'Peut-on avoir son propre nom de domaine sur Zuri ?',
        'Can I use my own domain on Zuri?',
        'Pas encore : c’est prévu. Pour l’instant, ta boutique tourne sur une adresse Zuri. Si un domaine personnalisé est indispensable tout de suite, Shopify, WooCommerce ou YouCan le proposent déjà.',
        'Not yet: it is coming. For now, your store runs on a Zuri address. If a custom domain is essential right away, Shopify, WooCommerce or YouCan already offer it.',
      ),
    ],
    sources: c.sources,
    country: c.slug,
  }
}

/* Entrées pays réutilisables */
const zC = (momoFr: string, momoEn: string, score: number, bestFor: L10n, extraCons: L10n[] = []): CItem => ({
  item: zuri({ bestFor, score, cons: [...extraCons, ZURI_PSP] }),
  cod: l('Inclus, avec closers', 'Built in, with closers'),
  momo: l(momoFr, momoEn),
})
const shopC = (score: number, bestFor: L10n): CItem => ({
  item: shopify({ bestFor, score }),
  cod: l('Paiement manuel + application', 'Manual payment + app'),
  momo: l('Via prestataire tiers (+2 % sur Basic)', 'Through a third party (+2% on Basic)'),
})
const wooC = (score: number, bestFor: L10n): CItem => ({
  item: woo({ bestFor, score }),
  cod: l('Via plugins', 'Through plugins'),
  momo: l('Via plugin d’un prestataire', 'Through a provider plugin'),
})
const youC = (score: number, bestFor: L10n): CItem => ({
  item: youcan({ bestFor, score }),
  cod: l('Inclus', 'Built in'),
  momo: l('Non présenté sur la page tarifs', 'Not presented on pricing page'),
})
const easyC = (score: number, bestFor: L10n, pros: L10n[] = []): CItem => ({
  item: easyafrik({ bestFor, score, pros }),
  cod: l('Inclus (espèces)', 'Built in (cash)'),
  momo: l('Non mentionné', 'Not mentioned'),
})
const selC = (score: number, bestFor: L10n): CItem => ({
  item: selika({ bestFor, score }),
  cod: l('Livraison intégrée', 'Built-in delivery'),
  momo: l('Prestataire non précisé', 'Provider not named'),
})
const bumpaC = (score: number, bestFor: L10n, price?: L10n, cons: L10n[] = []): CItem => ({
  item: bumpa({ bestFor, score, price, cons }),
  cod: l('Non mentionné sur la page tarifs', 'Not mentioned on pricing page'),
  momo: l('Passerelle de paiement Bumpa', 'Bumpa payment gateway'),
})
const selarC = (score: number, bestFor: L10n): CItem => ({
  item: selar({ bestFor, score }),
  cod: l('Non (produits numériques)', 'No (digital products)'),
  momo: l('Voir le site', 'See website'),
})
const wixC = (score: number, bestFor: L10n): CItem => ({
  item: wix({ bestFor, score }),
  cod: l('Non mis en avant', 'Not highlighted'),
  momo: l('Non mentionné', 'Not mentioned'),
})

const FCFA_SRC = [S.zuri, S.easyafrik, S.selika, S.youcanPricing, S.shopifyPricing, S.shopifyPaymentsCountries, S.almanac]

const COUNTRY_DATA: CountryData[] = [
  {
    slug: 'cote-d-ivoire',
    enSlug: 'cote-d-ivoire',
    name: l('Côte d’Ivoire', 'Côte d’Ivoire'),
    inFr: 'en Côte d’Ivoire',
    inEn: 'in Côte d’Ivoire',
    currency: l('franc CFA (XOF)', 'CFA franc (XOF)'),
    intro: l(
      'D’Abidjan à Bouaké, tes clients découvrent tes produits sur Facebook, TikTok et WhatsApp, et beaucoup veulent payer quand le livreur arrive. Ceux qui te font confiance paient par Wave, Orange Money, MTN MoMo ou Moov Money. Voici les sites qui gèrent le mieux tout ça.',
      'From Abidjan to Bouaké, your customers find your products on Facebook, TikTok and WhatsApp, and many want to pay when the rider arrives. Those who trust you pay with Wave, Orange Money, MTN MoMo or Moov Money. Here are the sites that handle this best.',
    ),
    items: [
      zC(
        'Wave, Orange, MTN, Moov via FeexPay, FedaPay, PayDunya ou pawaPay',
        'Wave, Orange, MTN, Moov through FeexPay, FedaPay, PayDunya or pawaPay',
        8.9,
        l('Le vendeur ivoirien en COD avec closers, qui veut aussi encaisser Wave et Orange Money.', 'The Ivorian COD seller with closers who also wants Wave and Orange Money payments.'),
      ),
      easyC(
        7.8,
        l('Le vendeur d’Abidjan qui veut des pages générées par IA et ses commandes sur Telegram.', 'The Abidjan seller who wants AI-generated pages and orders on Telegram.'),
        [l('Des clients d’Abidjan mis en avant sur sa page d’accueil.', 'Abidjan customers featured on its homepage.')],
      ),
      youC(7.6, l('Le vendeur COD qui veut une plateforme établie et un domaine tout de suite.', 'The COD seller who wants an established platform and a domain right away.')),
      selC(7.3, l('Le vendeur avec ses propres livreurs à Abidjan et un petit catalogue.', 'The seller with their own riders in Abidjan and a small catalog.')),
      shopC(7.0, l('La marque ivoirienne qui vend aussi à la diaspora par carte.', 'The Ivorian brand also selling to the diaspora by card.')),
    ],
    payments: l(
      'Wave, Orange Money, MTN MoMo et Moov Money sont les portefeuilles les plus courants. Côté passerelles, FeexPay publie ses frais pour la Côte d’Ivoire : 1,8 % pour Orange Money, 1,5 % pour Wave, MTN, Moov et Djamo. Paystack affiche 1,95 % HT en Mobile Money (Wave, MTN, Orange). Zuri se connecte à ton compte FeexPay, FedaPay, PayDunya ou pawaPay ; attention, chez pawaPay, Orange en Côte d’Ivoire est annoncé « bientôt » selon sa page Plans, donc passe par FeexPay ou FedaPay si Orange Money compte pour toi.',
      'Wave, Orange Money, MTN MoMo and Moov Money are the most common wallets. On gateways, FeexPay publishes its Côte d’Ivoire fees: 1.8% for Orange Money, 1.5% for Wave, MTN, Moov and Djamo. Paystack shows 1.95% excl. VAT for mobile money (Wave, MTN, Orange). Zuri connects to your FeexPay, FedaPay, PayDunya or pawaPay account; note that at pawaPay, Orange in Côte d’Ivoire is listed as « coming soon » on its Plans page, so use FeexPay or FedaPay if Orange Money matters to you.',
    ),
    delivery: l(
      'À Abidjan, découpe tes zones par commune (Cocody, Yopougon, Abobo, Marcory, Treichville…) avec un tarif par zone, et livre l’intérieur (Bouaké, Yamoussoukro, San-Pédro) par car ou par transporteur, avec un acompte en Mobile Money. Sur Zuri, les zones de livraison et leurs frais se règlent dans la boutique.',
      'In Abidjan, split your zones by commune (Cocody, Yopougon, Abobo, Marcory, Treichville and so on) with one price per zone, and ship inland (Bouaké, Yamoussoukro, San-Pédro) by bus or courier, with a Mobile Money deposit. On Zuri, delivery zones and fees are set in the store.',
    ),
    tips: [
      ['Vérifie que Wave est bien proposé : beaucoup de clients ivoiriens l’utilisent au quotidien.', 'Check that Wave is offered: many Ivorian buyers use it daily.'],
      ['Affiche des prix ronds en FCFA, faciles à envoyer par Mobile Money.', 'Show round FCFA prices, easy to send by Mobile Money.'],
      ['Teste ta page sur un téléphone d’entrée de gamme en 4G avant de lancer la pub.', 'Test your page on an entry-level phone over 4G before running ads.'],
      ['Prévois un closer qui rappelle dans l’heure, surtout pour les commandes du soir.', 'Have a closer call back within the hour, especially for evening orders.'],
    ],
    verdict: l(
      'En Côte d’Ivoire, Zuri arrive premier pour le COD avec closers et Wave, Orange Money, MTN et Moov via ton propre compte de paiement, sans commission. C’est un outil récent, sans domaine personnalisé pour l’instant, payant après le 30 novembre 2026. EasyAfrik est une bonne alternative locale en FCFA, et YouCan reste solide si tu veux une plateforme établie.',
      'In Côte d’Ivoire, Zuri comes first for COD with closers and Wave, Orange Money, MTN and Moov through your own payment account, with no commission. It is a recent tool, with no custom domain yet, paid after November 30, 2026. EasyAfrik is a good local FCFA alternative, and YouCan stays solid if you want an established platform.',
    ),
    faqs: [
      faq(
        'Comment encaisser Wave sur ma boutique en Côte d’Ivoire ?',
        'How do I collect Wave payments on my store in Côte d’Ivoire?',
        'Ouvre un compte chez une passerelle qui couvre Wave en Côte d’Ivoire, comme FeexPay (1,5 % selon sa grille) ou pawaPay, puis connecte-le à ta boutique. Sur Zuri, l’argent arrive directement sur ton compte prestataire.',
        'Open an account with a gateway covering Wave in Côte d’Ivoire, such as FeexPay (1.5% per its fee table) or pawaPay, then connect it to your store. On Zuri, the money lands directly in your provider account.',
      ),
      faq(
        'Jumia est-il une bonne option pour vendre en Côte d’Ivoire ?',
        'Is Jumia a good option to sell in Côte d’Ivoire?',
        'Jumia est une marketplace présente en Côte d’Ivoire : tu vends sur leur site, à leurs conditions. C’est un complément possible, mais pas ta propre boutique avec tes pubs, tes pixels et tes clients.',
        'Jumia is a marketplace active in Côte d’Ivoire: you sell on their site, on their terms. It can complement your sales, but it is not your own store with your ads, pixels and customers.',
      ),
    ],
    sources: [...FCFA_SRC, S.feexpayPricing, S.paystackPricing, S.pawapayPlans, S.pawapayProviders, S.fedapayCountries, S.jumia],
  },
  {
    slug: 'senegal',
    enSlug: 'senegal',
    name: l('Sénégal', 'Senegal'),
    inFr: 'au Sénégal',
    inEn: 'in Senegal',
    currency: l('franc CFA (XOF)', 'CFA franc (XOF)'),
    intro: l(
      'À Dakar comme à Thiès ou Touba, le client sénégalais commande souvent après une vidéo TikTok ou un statut WhatsApp, et paie à la livraison ou par Wave. Orange Money et Free Money (Mixx by Yas) complètent le tableau. Voici les sites qui s’adaptent le mieux.',
      'In Dakar as in Thiès or Touba, Senegalese buyers often order after a TikTok video or a WhatsApp status, and pay on delivery or with Wave. Orange Money and Free Money (Mixx by Yas) complete the picture. Here are the sites that adapt best.',
    ),
    items: [
      zC(
        'Wave, Orange Money, Free via FeexPay, FedaPay, PayDunya ou pawaPay',
        'Wave, Orange Money, Free through FeexPay, FedaPay, PayDunya or pawaPay',
        8.9,
        l('Le vendeur sénégalais en COD qui veut encaisser Wave et Orange Money sur son propre compte.', 'The Senegalese COD seller who wants Wave and Orange Money on their own account.'),
      ),
      selC(7.6, l('Le vendeur dakarois qui gère ses livreurs lui-même.', 'The Dakar seller who manages their own riders.')),
      easyC(7.6, l('Le vendeur qui veut créer ses pages par IA, avec un abonnement en FCFA.', 'The seller who wants AI-built pages with an FCFA subscription.')),
      youC(7.4, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      shopC(7.0, l('La marque sénégalaise qui vise aussi la diaspora.', 'The Senegalese brand also targeting the diaspora.')),
    ],
    payments: l(
      'Wave est très présent au Sénégal, avec Orange Money et Free Money (Mixx by Yas). PayDunya couvre Wave et Orange Money ; FeexPay, FedaPay et pawaPay (Free, Orange, Wave) sont aussi disponibles. Zuri se connecte à ces quatre prestataires : choisis celui qui couvre tes opérateurs et compare ses frais avant d’ouvrir ton compte.',
      'Wave is very present in Senegal, along with Orange Money and Free Money (Mixx by Yas). PayDunya covers Wave and Orange Money; FeexPay, FedaPay and pawaPay (Free, Orange, Wave) are also available. Zuri connects to these four providers: pick the one covering your operators and compare fees before opening your account.',
    ),
    delivery: l(
      'À Dakar, sépare Plateau, Médina, Parcelles Assainies, Pikine, Guédiawaye et Rufisque en zones avec leur propre tarif. Pour Thiès, Touba, Saint-Louis ou Ziguinchor, demande un acompte par Wave avant d’expédier : le client qui a payé une partie refuse moins souvent le colis.',
      'In Dakar, split Plateau, Médina, Parcelles Assainies, Pikine, Guédiawaye and Rufisque into zones with their own price. For Thiès, Touba, Saint-Louis or Ziguinchor, ask for a Wave deposit before shipping: a customer who paid part refuses the parcel less often.',
    ),
    tips: [
      ['Propose Wave en premier : c’est souvent le réflexe du client sénégalais.', 'Offer Wave first: it is often the Senegalese buyer’s reflex.'],
      ['Prévois des closers qui parlent wolof et français.', 'Have closers who speak Wolof and French.'],
      ['Garde des pages courtes et légères, ouvertes depuis TikTok et WhatsApp.', 'Keep short, light pages, opened from TikTok and WhatsApp.'],
      ['Compare le coût total en FCFA, pas seulement le prix affiché en dollars.', 'Compare total cost in FCFA, not just the dollar price shown.'],
    ],
    verdict: l(
      'Au Sénégal, Zuri est le plus complet pour le COD avec closers et Wave, Orange Money et Free via ton compte PayDunya, FeexPay, FedaPay ou pawaPay, sans commission. Ses limites : outil récent, pas encore de domaine personnalisé, payant après le 30 novembre 2026. Selika est intéressant si tu gères tes livreurs, EasyAfrik si tu veux des pages par IA.',
      'In Senegal, Zuri is the most complete for COD with closers and Wave, Orange Money and Free through your PayDunya, FeexPay, FedaPay or pawaPay account, with no commission. Its limits: recent tool, no custom domain yet, paid after November 30, 2026. Selika is interesting if you manage your riders, EasyAfrik if you want AI-built pages.',
    ),
    faqs: [
      faq(
        'Quelle passerelle choisir pour Wave au Sénégal ?',
        'Which gateway for Wave in Senegal?',
        'PayDunya, FeexPay et pawaPay couvrent Wave au Sénégal. Compare leurs frais et leurs délais de versement, puis connecte celle que tu choisis à ta boutique Zuri.',
        'PayDunya, FeexPay and pawaPay cover Wave in Senegal. Compare their fees and payout times, then connect the one you pick to your Zuri store.',
      ),
      faq(
        'Faut-il un NINEA pour vendre en ligne au Sénégal ?',
        'Do I need a NINEA to sell online in Senegal?',
        'Pour la boutique et le COD, non. Pour ouvrir un compte chez une passerelle de paiement, des documents peuvent être demandés : vérifie leurs conditions à l’inscription.',
        'For the store and COD, no. To open an account with a payment gateway, documents may be required: check their conditions at signup.',
      ),
    ],
    sources: [...FCFA_SRC, S.paydunyaDoc, S.feexpayPricing, S.fedapayCountries, S.pawapayProviders, S.jumia],
  },
  {
    slug: 'benin',
    enSlug: 'benin',
    name: l('Bénin', 'Benin'),
    inFr: 'au Bénin',
    inEn: 'in Benin',
    currency: l('franc CFA (XOF)', 'CFA franc (XOF)'),
    intro: l(
      'À Cotonou, Abomey-Calavi ou Porto-Novo, on vend beaucoup sur Facebook et WhatsApp, et le client paie souvent à la livraison ou par MTN MoMo et Moov Money. Celtiis Cash arrive aussi. Voici les sites les mieux adaptés au marché béninois.',
      'In Cotonou, Abomey-Calavi or Porto-Novo, selling happens a lot on Facebook and WhatsApp, and buyers often pay on delivery or with MTN MoMo and Moov Money. Celtiis Cash is also growing. Here are the sites best suited to Benin.',
    ),
    items: [
      zC(
        'MTN MoMo, Moov via FeexPay, FedaPay, PayDunya ou pawaPay',
        'MTN MoMo, Moov through FeexPay, FedaPay, PayDunya or pawaPay',
        8.9,
        l('Le vendeur béninois en COD qui veut MTN MoMo et Moov Money sur son propre compte.', 'The Beninese COD seller who wants MTN MoMo and Moov Money on their own account.'),
      ),
      selC(7.4, l('Le vendeur qui gère ses livreurs et a moins de 50 produits.', 'The seller who manages riders and has under 50 products.')),
      easyC(7.4, l('Le vendeur qui veut des pages générées par IA, en FCFA.', 'The seller who wants AI-generated pages, in FCFA.')),
      youC(7.3, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      wooC(6.6, l('Celui qui a un développeur à Cotonou et veut tout contrôler.', 'Someone with a developer in Cotonou who wants full control.')),
    ],
    payments: l(
      'MTN MoMo et Moov Money dominent, Celtiis Cash se développe. Le Bénin est bien servi en passerelles : FeexPay (reversement vers compte bancaire gratuit au Bénin selon sa grille), FedaPay, PayDunya et pawaPay (MTN et Moov). Zuri se connecte aux quatre. Pour Celtiis, vérifie la couverture auprès du prestataire : chez pawaPay, Celtiis au Bénin est réservé à certains marchands en Enterprise.',
      'MTN MoMo and Moov Money lead, Celtiis Cash is growing. Benin is well served by gateways: FeexPay (free payout to bank account in Benin per its fee table), FedaPay, PayDunya and pawaPay (MTN and Moov). Zuri connects to all four. For Celtiis, check coverage with the provider: at pawaPay, Celtiis in Benin is limited to certain Enterprise merchants.',
    ),
    delivery: l(
      'Cotonou et Abomey-Calavi peuvent former deux ou trois zones avec des tarifs différents ; Porto-Novo, Bohicon et Parakou se livrent par transporteur, avec un acompte MoMo pour les gros montants. Les zones et frais de livraison se règlent directement dans Zuri.',
      'Cotonou and Abomey-Calavi can form two or three zones with different prices; Porto-Novo, Bohicon and Parakou are served by courier, with a MoMo deposit for large amounts. Delivery zones and fees are set directly in Zuri.',
    ),
    tips: [
      ['Propose MTN MoMo et Moov Money : ce sont les deux réflexes des clients béninois.', 'Offer MTN MoMo and Moov Money: they are Beninese buyers’ two reflexes.'],
      ['Si tu veux encaisser sur ton compte bancaire, regarde FeexPay : reversement gratuit au Bénin.', 'If you want payouts to your bank, look at FeexPay: free payout in Benin.'],
      ['Confirme chaque commande par appel ou WhatsApp avant d’envoyer le livreur.', 'Confirm every order by call or WhatsApp before sending the rider.'],
    ],
    verdict: l(
      'Au Bénin, Zuri est le meilleur choix pour vendre en COD avec closers et MTN MoMo et Moov Money via FeexPay, FedaPay, PayDunya ou pawaPay, sans commission. Il est récent, sans domaine personnalisé pour l’instant, et payant après le 30 novembre 2026. Selika et EasyAfrik sont des alternatives en FCFA, YouCan une plateforme COD établie.',
      'In Benin, Zuri is the best pick to sell COD with closers and MTN MoMo and Moov Money through FeexPay, FedaPay, PayDunya or pawaPay, with no commission. It is recent, with no custom domain yet, and paid after November 30, 2026. Selika and EasyAfrik are FCFA alternatives, YouCan an established COD platform.',
    ),
    faqs: [
      faq(
        'Quelle passerelle de paiement choisir au Bénin ?',
        'Which payment gateway should I choose in Benin?',
        'FeexPay, FedaPay, PayDunya et pawaPay couvrent MTN et Moov au Bénin. FeexPay offre le reversement gratuit vers compte bancaire au Bénin selon sa grille. Les quatre se connectent à Zuri.',
        'FeexPay, FedaPay, PayDunya and pawaPay cover MTN and Moov in Benin. FeexPay offers free payouts to bank accounts in Benin per its fee table. All four connect to Zuri.',
      ),
      faq(
        'Peut-on vendre au Bénin sans paiement en ligne ?',
        'Can I sell in Benin without online payment?',
        'Oui. Le paiement à la livraison marche sans prestataire. Tu peux ajouter le Mobile Money plus tard, quand tes clients le demandent.',
        'Yes. Cash on delivery works without a provider. You can add Mobile Money later, when customers ask for it.',
      ),
    ],
    sources: [...FCFA_SRC, S.feexpayPricing, S.fedapayCountries, S.paydunyaDoc, S.pawapayProviders, S.pawapayPlans, S.wooPricing],
  },
  {
    slug: 'cameroun',
    enSlug: 'cameroon',
    name: l('Cameroun', 'Cameroon'),
    inFr: 'au Cameroun',
    inEn: 'in Cameroon',
    currency: l('franc CFA (XAF)', 'CFA franc (XAF)'),
    intro: l(
      'À Douala et Yaoundé, la vente en ligne passe par Facebook, WhatsApp et de plus en plus TikTok. Les clients paient à la livraison ou par MTN MoMo et Orange Money. Voici les sites les plus adaptés au Cameroun.',
      'In Douala and Yaoundé, online selling goes through Facebook, WhatsApp and more and more TikTok. Buyers pay on delivery or with MTN MoMo and Orange Money. Here are the sites best suited to Cameroon.',
    ),
    items: [
      zC(
        'MTN MoMo, Orange Money via pawaPay',
        'MTN MoMo, Orange Money through pawaPay',
        8.6,
        l('Le vendeur camerounais en COD avec closers, qui veut MTN MoMo et Orange Money sur son compte pawaPay.', 'The Cameroonian COD seller with closers who wants MTN MoMo and Orange Money on their pawaPay account.'),
        [l('Au Cameroun, un seul prestataire connecté : pawaPay.', 'In Cameroon, only one connected provider: pawaPay.')],
      ),
      youC(7.6, l('Le vendeur COD qui veut une plateforme établie et un domaine.', 'The COD seller who wants an established platform and a domain.')),
      shopC(7.2, l('La marque qui vend aussi à la diaspora par carte.', 'The brand also selling to the diaspora by card.')),
      easyC(7.0, l('Le vendeur qui veut des pages par IA et un abonnement en FCFA.', 'The seller who wants AI pages and an FCFA subscription.')),
      wooC(6.6, l('Celui qui a un développeur et veut un site complet avec blog.', 'Someone with a developer who wants a full site with a blog.')),
    ],
    payments: l(
      'MTN MoMo et Orange Money sont les deux grands portefeuilles. Au Cameroun, Zuri se connecte à pawaPay, qui couvre MTN et Orange en XAF, avec un forfait Standard à 1 % plus les frais de l’opérateur. Flutterwave est aussi présent au Cameroun si tu utilises une autre plateforme. Attention aux abonnements affichés en FCFA par des outils d’Afrique de l’Ouest : vérifie qu’ils gèrent bien le franc CFA d’Afrique centrale (XAF) pour tes prix.',
      'MTN MoMo and Orange Money are the two big wallets. In Cameroon, Zuri connects to pawaPay, which covers MTN and Orange in XAF, with a Standard plan at 1% plus the operator fee. Flutterwave also operates in Cameroon if you use another platform. Be careful with subscriptions priced in FCFA by West African tools: check they support the Central African CFA franc (XAF) for your prices.',
    ),
    delivery: l(
      'À Douala, découpe par quartiers (Akwa, Bonapriso, Bonamoussadi, Makepe, Bépanda…), à Yaoundé par grands secteurs (Bastos, Mvan, Biyem-Assi, Essos…). Pour Bafoussam, Garoua ou Bamenda, passe par une agence de voyage ou un transporteur, avec un acompte MoMo. Les zones de livraison et leurs frais se règlent dans Zuri.',
      'In Douala, split by neighborhoods (Akwa, Bonapriso, Bonamoussadi, Makepe, Bépanda and so on), in Yaoundé by large areas (Bastos, Mvan, Biyem-Assi, Essos and so on). For Bafoussam, Garoua or Bamenda, use a bus agency or courier, with a MoMo deposit. Delivery zones and fees are set in Zuri.',
    ),
    tips: [
      ['Affiche tes prix en XAF, pas en XOF.', 'Show your prices in XAF, not XOF.'],
      ['Ouvre ton compte pawaPay avant de lancer la pub si tu veux encaisser MoMo.', 'Open your pawaPay account before running ads if you want MoMo payments.'],
      ['Prévois des closers en français et en anglais pour les régions anglophones.', 'Plan French and English-speaking closers for the English-speaking regions.'],
      ['Demande un acompte pour les envois inter-villes.', 'Ask for a deposit on intercity shipments.'],
    ],
    verdict: l(
      'Au Cameroun, Zuri arrive premier pour le COD avec closers et MTN MoMo et Orange Money via ton compte pawaPay, sans commission. Ses limites : un seul prestataire Mobile Money connecté ici, outil récent sans domaine personnalisé, payant après le 30 novembre 2026. YouCan est la meilleure alternative établie, Shopify si tu vends surtout par carte.',
      'In Cameroon, Zuri comes first for COD with closers and MTN MoMo and Orange Money through your pawaPay account, with no commission. Its limits: only one Mobile Money provider connected here, a recent tool without custom domain, paid after November 30, 2026. YouCan is the best established alternative, Shopify if you sell mostly by card.',
    ),
    faqs: [
      faq(
        'Comment encaisser MTN MoMo et Orange Money sur ma boutique au Cameroun ?',
        'How do I collect MTN MoMo and Orange Money on my store in Cameroon?',
        'Ouvre un compte pawaPay (forfait Standard : 1 % plus frais de l’opérateur) et connecte-le à Zuri. L’argent arrive sur ton compte pawaPay, jamais chez Zuri.',
        'Open a pawaPay account (Standard plan: 1% plus operator fee) and connect it to Zuri. The money lands in your pawaPay account, never with Zuri.',
      ),
      faq(
        'Les outils en FCFA marchent-ils au Cameroun ?',
        'Do FCFA-priced tools work in Cameroon?',
        'Le franc CFA d’Afrique centrale (XAF) et celui d’Afrique de l’Ouest (XOF) ont la même valeur, mais ce sont deux monnaies. Vérifie que l’outil affiche tes prix en XAF et que son Mobile Money couvre le Cameroun. Zuri gère le XAF.',
        'The Central African CFA franc (XAF) and the West African one (XOF) have the same value, but they are two currencies. Check the tool shows your prices in XAF and that its Mobile Money covers Cameroon. Zuri supports XAF.',
      ),
    ],
    sources: [S.zuri, S.pawapayProviders, S.pawapayPlans, S.youcanPricing, S.shopifyPricing, S.shopifyPaymentsCountries, S.easyafrik, S.wooPricing, S.flutterwaveNg],
  },
  {
    slug: 'togo',
    enSlug: 'togo',
    name: l('Togo', 'Togo'),
    inFr: 'au Togo',
    inEn: 'in Togo',
    currency: l('franc CFA (XOF)', 'CFA franc (XOF)'),
    intro: l(
      'À Lomé, Kara ou Kpalimé, tes clients te trouvent sur Facebook, TikTok et WhatsApp et paient souvent à la livraison, ou par Mixx by Yas (ex T-Money) et Moov Money (Flooz). Voici les sites qui gèrent le mieux le marché togolais.',
      'In Lomé, Kara or Kpalimé, your customers find you on Facebook, TikTok and WhatsApp and often pay on delivery, or with Mixx by Yas (formerly T-Money) and Moov Money (Flooz). Here are the sites that handle the Togolese market best.',
    ),
    items: [
      zC(
        'Mixx by Yas, Moov (Flooz) via FeexPay, FedaPay ou PayDunya',
        'Mixx by Yas, Moov (Flooz) through FeexPay, FedaPay or PayDunya',
        8.8,
        l('Le vendeur togolais en COD qui veut encaisser Mixx by Yas et Flooz sur son propre compte.', 'The Togolese COD seller who wants Mixx by Yas and Flooz on their own account.'),
      ),
      easyC(
        7.7,
        l('Le vendeur de Lomé qui veut des pages par IA et un abonnement en FCFA.', 'The Lomé seller who wants AI pages and an FCFA subscription.'),
        [l('Des clients de Lomé mis en avant sur sa page d’accueil.', 'Lomé customers featured on its homepage.')],
      ),
      selC(7.3, l('Le vendeur qui gère ses livreurs et a un petit catalogue.', 'The seller who manages riders and has a small catalog.')),
      youC(7.2, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      shopC(6.8, l('La marque togolaise qui vend à l’international par carte.', 'The Togolese brand selling internationally by card.')),
    ],
    payments: l(
      'Mixx by Yas (ex T-Money) et Moov Money (Flooz) sont les deux portefeuilles du quotidien. Au Togo, Zuri se connecte à FeexPay, FedaPay et PayDunya, qui couvrent le pays. pawaPay ne fait pas partie des prestataires connectés pour le Togo. Compare les frais de chacun et la couverture de Mixx by Yas avant d’ouvrir ton compte.',
      'Mixx by Yas (formerly T-Money) and Moov Money (Flooz) are the everyday wallets. In Togo, Zuri connects to FeexPay, FedaPay and PayDunya, which cover the country. pawaPay is not among the connected providers for Togo. Compare fees and Mixx by Yas coverage before opening your account.',
    ),
    delivery: l(
      'Lomé se découpe facilement en zones (Bè, Tokoin, Adidogomé, Agoè, Baguida…) avec un tarif chacune. Pour Kara, Sokodé ou Atakpamé, envoie par car ou transporteur et demande un acompte Flooz ou Mixx by Yas. Les zones et frais se règlent dans Zuri.',
      'Lomé splits easily into zones (Bè, Tokoin, Adidogomé, Agoè, Baguida and so on) with a price each. For Kara, Sokodé or Atakpamé, ship by bus or courier and ask for a Flooz or Mixx by Yas deposit. Zones and fees are set in Zuri.',
    ),
    tips: [
      ['Vérifie que Mixx by Yas (ex T-Money) est couvert par ta passerelle.', 'Check that Mixx by Yas (formerly T-Money) is covered by your gateway.'],
      ['Affiche des prix ronds en FCFA.', 'Show round FCFA prices.'],
      ['Rappelle chaque commande avant d’envoyer le livreur.', 'Call back every order before sending the rider.'],
    ],
    verdict: l(
      'Au Togo, Zuri est le plus complet pour le COD avec closers et Mobile Money via FeexPay, FedaPay ou PayDunya, sans commission. C’est un outil récent, sans domaine personnalisé pour l’instant, payant après le 30 novembre 2026. EasyAfrik est une bonne alternative locale en FCFA, Selika si tu gères tes livreurs.',
      'In Togo, Zuri is the most complete for COD with closers and Mobile Money through FeexPay, FedaPay or PayDunya, with no commission. It is a recent tool, with no custom domain yet, paid after November 30, 2026. EasyAfrik is a good local FCFA alternative, Selika if you manage your riders.',
    ),
    faqs: [
      faq(
        'Quelle passerelle pour Flooz et Mixx by Yas au Togo ?',
        'Which gateway for Flooz and Mixx by Yas in Togo?',
        'FeexPay, FedaPay et PayDunya couvrent le Togo et se connectent à Zuri. Vérifie chez chacun les opérateurs couverts et les frais avant de choisir.',
        'FeexPay, FedaPay and PayDunya cover Togo and connect to Zuri. Check each one’s operators and fees before choosing.',
      ),
      faq(
        'Peut-on vendre dans tout le Togo depuis Lomé ?',
        'Can I sell across Togo from Lomé?',
        'Oui. Livre Lomé en COD avec tes zones, et l’intérieur par car ou transporteur avec un acompte en Mobile Money.',
        'Yes. Deliver Lomé on COD with your zones, and inland by bus or courier with a Mobile Money deposit.',
      ),
    ],
    sources: [...FCFA_SRC, S.feexpayPricing, S.fedapayCountries, S.paydunyaDoc],
  },
  {
    slug: 'mali',
    enSlug: 'mali',
    name: l('Mali', 'Mali'),
    inFr: 'au Mali',
    inEn: 'in Mali',
    currency: l('franc CFA (XOF)', 'CFA franc (XOF)'),
    intro: l(
      'À Bamako, Sikasso ou Ségou, la vente en ligne passe par Facebook, TikTok et WhatsApp, et le client paie surtout à la livraison ou par Orange Money, Moov Money et Wave. Voici les sites les plus adaptés au Mali.',
      'In Bamako, Sikasso or Ségou, online selling goes through Facebook, TikTok and WhatsApp, and buyers mostly pay on delivery or with Orange Money, Moov Money and Wave. Here are the sites best suited to Mali.',
    ),
    items: [
      zC(
        'Orange Money, Moov, Wave via FedaPay ou PayDunya',
        'Orange Money, Moov, Wave through FedaPay or PayDunya',
        8.7,
        l('Le vendeur malien en COD qui veut encaisser Orange Money sur son propre compte.', 'The Malian COD seller who wants Orange Money on their own account.'),
      ),
      selC(7.3, l('Le vendeur de Bamako qui gère ses livreurs.', 'The Bamako seller who manages their own riders.')),
      easyC(7.3, l('Le vendeur qui veut des pages par IA en FCFA.', 'The seller who wants AI pages in FCFA.')),
      youC(7.2, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      shopC(6.8, l('La marque malienne qui vend à la diaspora par carte.', 'The Malian brand selling to the diaspora by card.')),
    ],
    payments: l(
      'Orange Money est le portefeuille le plus répandu, avec Moov Money et Wave. Au Mali, Zuri se connecte à FedaPay et PayDunya, qui couvrent le pays ; PayDunya couvre Orange Money au Mali. Vérifie la couverture de Wave et Moov chez ton prestataire avant de les afficher.',
      'Orange Money is the most widespread wallet, with Moov Money and Wave. In Mali, Zuri connects to FedaPay and PayDunya, which cover the country; PayDunya covers Orange Money in Mali. Check Wave and Moov coverage with your provider before showing them.',
    ),
    delivery: l(
      'Bamako se découpe par communes (de la Commune I à la Commune VI) et par rive : un tarif rive gauche, un tarif rive droite, c’est simple pour le client. Pour Sikasso, Ségou ou Kayes, passe par un transporteur avec un acompte Orange Money. Tes zones se règlent dans Zuri.',
      'Bamako splits by communes (Commune I to Commune VI) and by river bank: one price for the left bank, one for the right, simple for the customer. For Sikasso, Ségou or Kayes, use a courier with an Orange Money deposit. Your zones are set in Zuri.',
    ),
    tips: [
      ['Mets Orange Money en avant : c’est le plus utilisé.', 'Put Orange Money first: it is the most used.'],
      ['Prévois des closers qui parlent bambara et français.', 'Have closers who speak Bambara and French.'],
      ['Garde ta page légère : beaucoup de clients sont en connexion mobile.', 'Keep your page light: many buyers are on mobile data.'],
    ],
    verdict: l(
      'Au Mali, Zuri arrive premier pour le COD avec closers et Orange Money via FedaPay ou PayDunya, sans commission. Ses limites : deux prestataires connectés ici, outil récent sans domaine personnalisé, payant après le 30 novembre 2026. Selika et EasyAfrik sont des alternatives en FCFA.',
      'In Mali, Zuri comes first for COD with closers and Orange Money through FedaPay or PayDunya, with no commission. Its limits: two connected providers here, a recent tool without custom domain, paid after November 30, 2026. Selika and EasyAfrik are FCFA alternatives.',
    ),
    faqs: [
      faq(
        'Comment encaisser Orange Money sur ma boutique au Mali ?',
        'How do I collect Orange Money on my store in Mali?',
        'Ouvre un compte FedaPay ou PayDunya, qui couvrent le Mali, puis connecte-le à Zuri. L’argent arrive chez ton prestataire, jamais chez Zuri.',
        'Open a FedaPay or PayDunya account, both covering Mali, then connect it to Zuri. The money lands with your provider, never with Zuri.',
      ),
      faq(
        'Le COD marche-t-il bien au Mali ?',
        'Does COD work well in Mali?',
        'Le paiement à la livraison rassure le client qui ne te connaît pas encore. Confirme chaque commande par téléphone avant d’envoyer le livreur pour limiter les refus.',
        'Cash on delivery reassures buyers who do not know you yet. Confirm every order by phone before sending the rider to limit refusals.',
      ),
    ],
    sources: [...FCFA_SRC, S.fedapayCountries, S.paydunyaDoc],
  },
  {
    slug: 'burkina-faso',
    enSlug: 'burkina-faso',
    name: l('Burkina Faso', 'Burkina Faso'),
    inFr: 'au Burkina Faso',
    inEn: 'in Burkina Faso',
    currency: l('franc CFA (XOF)', 'CFA franc (XOF)'),
    intro: l(
      'À Ouagadougou et Bobo-Dioulasso, on vend beaucoup sur Facebook et WhatsApp, et les clients paient à la livraison ou par Orange Money et Moov Money. Voici les sites les mieux adaptés au Burkina.',
      'In Ouagadougou and Bobo-Dioulasso, selling happens a lot on Facebook and WhatsApp, and buyers pay on delivery or with Orange Money and Moov Money. Here are the sites best suited to Burkina Faso.',
    ),
    items: [
      zC(
        'Orange Money, Moov via FeexPay, FedaPay, PayDunya ou pawaPay',
        'Orange Money, Moov through FeexPay, FedaPay, PayDunya or pawaPay',
        8.9,
        l('Le vendeur burkinabè en COD qui veut Orange Money et Moov Money sur son propre compte.', 'The Burkinabe COD seller who wants Orange Money and Moov Money on their own account.'),
      ),
      selC(7.3, l('Le vendeur qui gère ses livreurs et a un petit catalogue.', 'The seller who manages riders and has a small catalog.')),
      easyC(7.3, l('Le vendeur qui veut des pages par IA en FCFA.', 'The seller who wants AI pages in FCFA.')),
      youC(7.2, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      shopC(6.8, l('La marque qui vend à l’international par carte.', 'The brand selling internationally by card.')),
    ],
    payments: l(
      'Orange Money et Moov Money sont les deux grands portefeuilles. Le Burkina est couvert par les quatre prestataires connectés à Zuri : FeexPay, FedaPay, PayDunya et pawaPay (Orange et Moov). Tu peux donc comparer les frais et choisir celui qui verse le plus simplement sur ton compte.',
      'Orange Money and Moov Money are the two big wallets. Burkina Faso is covered by all four providers connected to Zuri: FeexPay, FedaPay, PayDunya and pawaPay (Orange and Moov). So you can compare fees and pick the one that pays out most simply to your account.',
    ),
    delivery: l(
      'À Ouagadougou, découpe par arrondissements ou grands quartiers (Ouaga 2000, Pissy, Tampouy, Dassasgho…) avec un tarif par zone. Pour Bobo-Dioulasso, Koudougou ou Banfora, envoie par car avec un acompte en Mobile Money. Les zones se règlent dans Zuri.',
      'In Ouagadougou, split by districts or large neighborhoods (Ouaga 2000, Pissy, Tampouy, Dassasgho and so on) with one price per zone. For Bobo-Dioulasso, Koudougou or Banfora, ship by bus with a Mobile Money deposit. Zones are set in Zuri.',
    ),
    tips: [
      ['Compare les quatre prestataires disponibles avant d’ouvrir ton compte.', 'Compare the four available providers before opening your account.'],
      ['Prévois des closers qui parlent mooré et français.', 'Have closers who speak Mooré and French.'],
      ['Affiche les frais de livraison par zone dès la page produit.', 'Show delivery fees by zone right on the product page.'],
    ],
    verdict: l(
      'Au Burkina Faso, Zuri est le meilleur choix pour le COD avec closers et Orange Money et Moov Money via quatre prestataires possibles, sans commission. Il reste récent, sans domaine personnalisé pour l’instant, et payant après le 30 novembre 2026. Selika et EasyAfrik sont des alternatives en FCFA.',
      'In Burkina Faso, Zuri is the best pick for COD with closers and Orange Money and Moov Money through four possible providers, with no commission. It is still recent, with no custom domain yet, and paid after November 30, 2026. Selika and EasyAfrik are FCFA alternatives.',
    ),
    faqs: [
      faq(
        'Quelle passerelle choisir au Burkina Faso ?',
        'Which gateway should I choose in Burkina Faso?',
        'FeexPay, FedaPay, PayDunya et pawaPay couvrent le Burkina et se connectent tous à Zuri. Compare les frais d’encaissement et de retrait.',
        'FeexPay, FedaPay, PayDunya and pawaPay cover Burkina Faso and all connect to Zuri. Compare collection and payout fees.',
      ),
      faq(
        'Peut-on livrer à Bobo-Dioulasso depuis Ouagadougou ?',
        'Can I deliver to Bobo-Dioulasso from Ouagadougou?',
        'Oui, par car ou transporteur. Demande un acompte en Mobile Money pour couvrir l’envoi.',
        'Yes, by bus or courier. Ask for a Mobile Money deposit to cover shipping.',
      ),
    ],
    sources: [...FCFA_SRC, S.feexpayPricing, S.fedapayCountries, S.paydunyaDoc, S.pawapayProviders],
  },
  {
    slug: 'guinee',
    enSlug: 'guinea',
    name: l('Guinée', 'Guinea'),
    inFr: 'en Guinée',
    inEn: 'in Guinea',
    currency: l('franc guinéen (GNF)', 'Guinean franc (GNF)'),
    intro: l(
      'À Conakry, Kankan ou Labé, les clients commandent sur Facebook et WhatsApp et paient surtout à la livraison ou par Orange Money et MTN MoMo. Les prix sont en francs guinéens. Voici les sites les plus adaptés à la Guinée.',
      'In Conakry, Kankan or Labé, buyers order on Facebook and WhatsApp and mostly pay on delivery or with Orange Money and MTN MoMo. Prices are in Guinean francs. Here are the sites best suited to Guinea.',
    ),
    items: [
      zC(
        'Orange Money, MTN via FedaPay',
        'Orange Money, MTN through FedaPay',
        8.5,
        l('Le vendeur guinéen en COD avec closers, qui veut des prix en GNF.', 'The Guinean COD seller with closers who wants prices in GNF.'),
        [l('En Guinée, un seul prestataire connecté : FedaPay.', 'In Guinea, only one connected provider: FedaPay.')],
      ),
      youC(7.4, l('Le vendeur COD qui veut une plateforme établie et le multidevise.', 'The COD seller who wants an established platform and multi-currency.')),
      shopC(7.0, l('La marque guinéenne qui vend à la diaspora par carte.', 'The Guinean brand selling to the diaspora by card.')),
      wooC(6.6, l('Celui qui a un développeur et veut tout contrôler.', 'Someone with a developer who wants full control.')),
      wixC(5.8, l('Un site vitrine pour présenter ton activité.', 'A showcase site to present your business.')),
    ],
    payments: l(
      'Orange Money et MTN MoMo sont les deux portefeuilles principaux. En Guinée, Zuri se connecte à FedaPay, qui prend en charge le pays et le franc guinéen (GNF). FedaPay demande une présence légale dans l’un de ses pays pour ouvrir un compte. Les outils facturés en FCFA d’Afrique de l’Ouest ne sont pas pensés pour le GNF : vérifie la devise avant de t’inscrire.',
      'Orange Money and MTN MoMo are the two main wallets. In Guinea, Zuri connects to FedaPay, which supports the country and the Guinean franc (GNF). FedaPay requires a legal presence in one of its countries to open an account. Tools priced in West African FCFA are not built for GNF: check the currency before signing up.',
    ),
    delivery: l(
      'À Conakry, découpe par communes (Kaloum, Dixinn, Ratoma, Matam, Matoto) et grands quartiers de la banlieue, avec un tarif par zone. Pour Kindia, Kankan, Labé ou Nzérékoré, passe par un transporteur et demande un acompte Orange Money. Les zones se règlent dans Zuri.',
      'In Conakry, split by communes (Kaloum, Dixinn, Ratoma, Matam, Matoto) and large suburban areas, with one price per zone. For Kindia, Kankan, Labé or Nzérékoré, use a courier and ask for an Orange Money deposit. Zones are set in Zuri.',
    ),
    tips: [
      ['Affiche tes prix en GNF, arrondis.', 'Show your prices in GNF, rounded.'],
      ['Vérifie les conditions d’ouverture de compte FedaPay avant de compter sur le Mobile Money.', 'Check FedaPay account opening conditions before relying on Mobile Money.'],
      ['Commence en COD à Conakry, puis élargis.', 'Start with COD in Conakry, then expand.'],
    ],
    verdict: l(
      'En Guinée, Zuri arrive premier pour le COD avec closers et des prix en GNF, avec Orange Money et MTN via ton compte FedaPay, sans commission. Ses limites : un seul prestataire connecté ici, outil récent sans domaine personnalisé, payant après le 30 novembre 2026. YouCan et Shopify sont les alternatives établies.',
      'In Guinea, Zuri comes first for COD with closers and prices in GNF, with Orange Money and MTN through your FedaPay account, with no commission. Its limits: only one connected provider here, a recent tool without custom domain, paid after November 30, 2026. YouCan and Shopify are the established alternatives.',
    ),
    faqs: [
      faq(
        'Quelle passerelle Mobile Money pour la Guinée ?',
        'Which Mobile Money gateway for Guinea?',
        'FedaPay prend en charge la Guinée et le franc guinéen. C’est le prestataire connecté à Zuri pour ce pays.',
        'FedaPay supports Guinea and the Guinean franc. It is the provider connected to Zuri for this country.',
      ),
      faq(
        'Peut-on vendre en GNF sur Zuri ?',
        'Can I sell in GNF on Zuri?',
        'Oui, tu peux afficher tes prix en francs guinéens, pour que le client voie exactement ce qu’il paiera.',
        'Yes, you can show prices in Guinean francs, so buyers see exactly what they will pay.',
      ),
    ],
    sources: [S.zuri, S.fedapayCountries, S.youcanPricing, S.shopifyPricing, S.shopifyPaymentsCountries, S.wooPricing, S.wixPlans],
  },
  {
    slug: 'rd-congo',
    enSlug: 'dr-congo',
    name: l('RD Congo', 'DR Congo'),
    inFr: 'en RD Congo',
    inEn: 'in DR Congo',
    currency: l('franc congolais (CDF) ou dollar US', 'Congolese franc (CDF) or US dollar'),
    intro: l(
      'À Kinshasa, Lubumbashi ou Goma, on vend sur Facebook, WhatsApp et TikTok, en francs congolais ou en dollars. Les clients paient à la livraison ou par M-Pesa, Airtel Money et Orange Money. Voici les sites les plus adaptés à la RDC.',
      'In Kinshasa, Lubumbashi or Goma, selling happens on Facebook, WhatsApp and TikTok, in Congolese francs or dollars. Buyers pay on delivery or with M-Pesa, Airtel Money and Orange Money. Here are the sites best suited to DR Congo.',
    ),
    items: [
      zC(
        'M-Pesa, Airtel, Orange via pawaPay (CDF ou USD)',
        'M-Pesa, Airtel, Orange through pawaPay (CDF or USD)',
        8.6,
        l('Le vendeur congolais en COD avec closers, qui veut M-Pesa, Airtel et Orange Money.', 'The Congolese COD seller with closers who wants M-Pesa, Airtel and Orange Money.'),
        [l('En RD Congo, un seul prestataire connecté : pawaPay.', 'In DR Congo, only one connected provider: pawaPay.')],
      ),
      youC(7.4, l('Le vendeur COD qui veut une plateforme établie et le multidevise.', 'The COD seller who wants an established platform and multi-currency.')),
      shopC(7.2, l('La marque qui vend en dollars, aussi à l’international.', 'The brand selling in dollars, including internationally.')),
      wooC(6.6, l('Celui qui a un développeur à Kinshasa et veut tout contrôler.', 'Someone with a developer in Kinshasa who wants full control.')),
      wixC(5.8, l('Un site vitrine pour présenter ton activité.', 'A showcase site to present your business.')),
    ],
    payments: l(
      'Vodacom M-Pesa, Airtel Money et Orange Money sont les portefeuilles les plus utilisés, en francs ou en dollars. Zuri se connecte à pawaPay, qui couvre ces trois opérateurs en CDF et en USD selon sa documentation. Le forfait Standard de pawaPay coûte 1 % plus les frais de l’opérateur, sans abonnement.',
      'Vodacom M-Pesa, Airtel Money and Orange Money are the most used wallets, in francs or dollars. Zuri connects to pawaPay, which covers these three operators in CDF and USD according to its documentation. pawaPay’s Standard plan costs 1% plus the operator fee, with no subscription.',
    ),
    delivery: l(
      'Kinshasa est très étendue : découpe par communes (Gombe, Limete, Ngaliema, Lingwala, Kintambo, Masina…) avec un tarif par groupe de communes. Pour Lubumbashi, Goma ou Kisangani, demande un acompte M-Pesa ou Airtel Money avant d’expédier. Les zones se règlent dans Zuri.',
      'Kinshasa is very large: split by communes (Gombe, Limete, Ngaliema, Lingwala, Kintambo, Masina and so on) with one price per group of communes. For Lubumbashi, Goma or Kisangani, ask for an M-Pesa or Airtel Money deposit before shipping. Zones are set in Zuri.',
    ),
    tips: [
      ['Choisis une seule devise par produit (francs ou dollars) pour ne pas embrouiller le client.', 'Pick one currency per product (francs or dollars) so buyers are not confused.'],
      ['Pour les grosses commandes en dollars, demande un acompte Mobile Money.', 'For large dollar orders, ask for a Mobile Money deposit.'],
      ['Prévois des closers qui parlent lingala et français.', 'Have closers who speak Lingala and French.'],
    ],
    verdict: l(
      'En RD Congo, Zuri est le meilleur choix pour le COD avec closers et M-Pesa, Airtel Money et Orange Money via ton compte pawaPay, en francs ou en dollars, sans commission. Ses limites : un seul prestataire connecté ici, outil récent sans domaine personnalisé, payant après le 30 novembre 2026. YouCan et Shopify restent les alternatives établies.',
      'In DR Congo, Zuri is the best pick for COD with closers and M-Pesa, Airtel Money and Orange Money through your pawaPay account, in francs or dollars, with no commission. Its limits: only one connected provider here, a recent tool without custom domain, paid after November 30, 2026. YouCan and Shopify remain the established alternatives.',
    ),
    faqs: [
      faq(
        'Peut-on encaisser en dollars en RD Congo ?',
        'Can I collect in dollars in DR Congo?',
        'Oui. Selon la documentation de pawaPay, M-Pesa, Airtel Money et Orange Money y fonctionnent en francs congolais et en dollars. Connecte ton compte pawaPay à Zuri.',
        'Yes. According to pawaPay’s documentation, M-Pesa, Airtel Money and Orange Money work there in Congolese francs and dollars. Connect your pawaPay account to Zuri.',
      ),
      faq(
        'Le COD marche-t-il à Kinshasa ?',
        'Does COD work in Kinshasa?',
        'Oui, c’est même le mode de paiement qui rassure le plus un nouveau client. Confirme chaque commande par appel ou WhatsApp, et fixe un tarif de livraison par groupe de communes.',
        'Yes, it is the payment method that reassures new buyers most. Confirm every order by call or WhatsApp, and set a delivery price per group of communes.',
      ),
    ],
    sources: [S.zuri, S.pawapayProviders, S.pawapayPlans, S.youcanPricing, S.shopifyPricing, S.shopifyPaymentsCountries, S.wooPricing, S.wixPlans],
  },
  {
    slug: 'gabon',
    enSlug: 'gabon',
    name: l('Gabon', 'Gabon'),
    inFr: 'au Gabon',
    inEn: 'in Gabon',
    currency: l('franc CFA (XAF)', 'CFA franc (XAF)'),
    intro: l(
      'À Libreville, Port-Gentil ou Franceville, les clients commandent sur Facebook et WhatsApp et paient à la livraison ou par Airtel Money et Moov Money. Voici les sites les plus adaptés au Gabon.',
      'In Libreville, Port-Gentil or Franceville, buyers order on Facebook and WhatsApp and pay on delivery or with Airtel Money and Moov Money. Here are the sites best suited to Gabon.',
    ),
    items: [
      zC(
        'Airtel Money, Moov via pawaPay',
        'Airtel Money, Moov through pawaPay',
        8.6,
        l('Le vendeur gabonais en COD avec closers, qui veut Airtel Money et Moov Money.', 'The Gabonese COD seller with closers who wants Airtel Money and Moov Money.'),
        [l('Au Gabon, un seul prestataire connecté : pawaPay.', 'In Gabon, only one connected provider: pawaPay.')],
      ),
      youC(7.4, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      shopC(7.2, l('La marque qui vend aussi par carte.', 'The brand also selling by card.')),
      wooC(6.6, l('Celui qui a un développeur et veut tout contrôler.', 'Someone with a developer who wants full control.')),
      wixC(5.8, l('Un site vitrine pour présenter ton activité.', 'A showcase site to present your business.')),
    ],
    payments: l(
      'Airtel Money et Moov Money sont les deux portefeuilles principaux. Zuri se connecte à pawaPay, qui couvre Airtel et Moov au Gabon en XAF selon sa documentation, avec un forfait Standard à 1 % plus les frais de l’opérateur.',
      'Airtel Money and Moov Money are the two main wallets. Zuri connects to pawaPay, which covers Airtel and Moov in Gabon in XAF according to its documentation, with a Standard plan at 1% plus the operator fee.',
    ),
    delivery: l(
      'À Libreville, découpe par arrondissements et grands quartiers (Louis, Glass, Nzeng-Ayong, Akanda, Owendo…) avec un tarif par zone. Pour Port-Gentil, Franceville ou Oyem, demande un acompte Airtel Money avant d’expédier. Les zones se règlent dans Zuri.',
      'In Libreville, split by districts and large neighborhoods (Louis, Glass, Nzeng-Ayong, Akanda, Owendo and so on) with one price per zone. For Port-Gentil, Franceville or Oyem, ask for an Airtel Money deposit before shipping. Zones are set in Zuri.',
    ),
    tips: [
      ['Affiche tes prix en XAF.', 'Show your prices in XAF.'],
      ['Ouvre ton compte pawaPay avant de lancer la pub si tu veux encaisser Airtel Money.', 'Open your pawaPay account before running ads if you want Airtel Money payments.'],
      ['Confirme chaque commande par appel avant la livraison.', 'Confirm every order by call before delivery.'],
    ],
    verdict: l(
      'Au Gabon, Zuri arrive premier pour le COD avec closers et Airtel Money et Moov Money via ton compte pawaPay, sans commission. Ses limites : un seul prestataire connecté ici, outil récent sans domaine personnalisé, payant après le 30 novembre 2026. YouCan et Shopify sont les alternatives établies.',
      'In Gabon, Zuri comes first for COD with closers and Airtel Money and Moov Money through your pawaPay account, with no commission. Its limits: only one connected provider here, a recent tool without custom domain, paid after November 30, 2026. YouCan and Shopify are the established alternatives.',
    ),
    faqs: [
      faq(
        'Comment encaisser Airtel Money sur ma boutique au Gabon ?',
        'How do I collect Airtel Money on my store in Gabon?',
        'Ouvre un compte pawaPay et connecte-le à Zuri. pawaPay couvre Airtel et Moov au Gabon. L’argent arrive sur ton compte pawaPay.',
        'Open a pawaPay account and connect it to Zuri. pawaPay covers Airtel and Moov in Gabon. The money lands in your pawaPay account.',
      ),
      faq(
        'Faut-il un abonnement pawaPay ?',
        'Do I need a pawaPay subscription?',
        'Non. Le forfait Standard n’a ni frais d’installation ni abonnement : 1 % plus les frais de l’opérateur par transaction.',
        'No. The Standard plan has no setup or monthly fee: 1% plus the operator fee per transaction.',
      ),
    ],
    sources: [S.zuri, S.pawapayProviders, S.pawapayPlans, S.youcanPricing, S.shopifyPricing, S.shopifyPaymentsCountries, S.wooPricing, S.wixPlans],
  },
  {
    slug: 'nigeria',
    enSlug: 'nigeria',
    name: l('Nigeria', 'Nigeria'),
    inFr: 'au Nigeria',
    inEn: 'in Nigeria',
    currency: l('naira (NGN)', 'naira (NGN)'),
    intro: l(
      'À Lagos, Abuja ou Port Harcourt, les clients achètent sur Instagram, WhatsApp et TikTok, paient par virement instantané ou avec OPay et PalmPay, et beaucoup préfèrent encore payer à la livraison. Voici les sites qui s’adaptent le mieux au Nigeria.',
      'In Lagos, Abuja or Port Harcourt, buyers shop on Instagram, WhatsApp and TikTok, pay by instant bank transfer or with OPay and PalmPay, and many still prefer to pay on delivery. Here are the sites that fit Nigeria best.',
    ),
    items: [
      zC(
        'MTN, Airtel via pawaPay (forfait Enterprise selon pawaPay)',
        'MTN, Airtel through pawaPay (Enterprise plan per pawaPay)',
        8.2,
        l('Le vendeur nigérian en pay on delivery avec une équipe de confirmation.', 'The Nigerian pay on delivery seller with a confirmation team.'),
        [
          l(
            'Selon la page Plans de pawaPay, MTN et Airtel au Nigeria sont réservés au forfait Enterprise ; Paystack et Flutterwave ne sont pas connectés à Zuri.',
            'According to pawaPay’s Plans page, MTN and Airtel in Nigeria are Enterprise only; Paystack and Flutterwave are not connected to Zuri.',
          ),
        ],
      ),
      bumpaC(8.0, l('Le vendeur des réseaux sociaux qui veut site, stock et paiements dans une app, en naira.', 'The social media seller who wants website, inventory and payments in one app, in naira.')),
      shopC(7.4, l('La marque qui vend aussi à l’international et veut l’écosystème Shopify.', 'The brand also selling internationally that wants the Shopify ecosystem.')),
      selarC(7.2, l('Le créateur qui vend des produits numériques en naira.', 'The creator selling digital products in naira.')),
      wooC(6.8, l('Celui qui a un développeur et veut brancher Paystack ou Flutterwave lui-même.', 'Someone with a developer who wants to plug in Paystack or Flutterwave themselves.')),
    ],
    payments: l(
      'Au Nigeria, les virements instantanés et les applis comme OPay, PalmPay et Moniepoint sont très courants. Paystack affiche 1,5 % + 100 ₦ par transaction locale, plafonné à 2 000 ₦, et Flutterwave 2 % sur les cartes locales. Zuri se connecte à pawaPay, qui couvre MTN et Airtel au Nigeria, mais selon sa page Plans ces opérateurs sont réservés au forfait Enterprise : renseigne-toi avant de compter dessus. Pour la plupart des vendeurs qui démarrent, le pay on delivery reste la base.',
      'In Nigeria, instant bank transfers and apps like OPay, PalmPay and Moniepoint are very common. Paystack shows 1.5% + ₦100 per local transaction, capped at ₦2,000, and Flutterwave 2% on local cards. Zuri connects to pawaPay, which covers MTN and Airtel in Nigeria, but according to its Plans page these operators are Enterprise only: check before relying on them. For most sellers starting out, pay on delivery remains the foundation.',
    ),
    delivery: l(
      'À Lagos, sépare Island (Lekki, Victoria Island, Ikoyi) et Mainland (Ikeja, Yaba, Surulere, Ikorodu) avec des tarifs différents. Abuja, Port Harcourt et Ibadan se livrent par service de logistique ; demande un paiement partiel avant d’expédier hors de ta ville. Les zones se règlent dans Zuri.',
      'In Lagos, split Island (Lekki, Victoria Island, Ikoyi) and Mainland (Ikeja, Yaba, Surulere, Ikorodu) with different prices. Abuja, Port Harcourt and Ibadan are served by logistics companies; ask for part payment before shipping outside your city. Zones are set in Zuri.',
    ),
    tips: [
      ['Affiche tes prix en naira et le tarif de livraison par zone.', 'Show prices in naira and the delivery fee per zone.'],
      ['Si tu veux surtout encaisser par virement ou carte, regarde un outil connecté à Paystack ou Flutterwave.', 'If you mainly want bank transfer or card payments, look at a tool connected to Paystack or Flutterwave.'],
      ['Confirme chaque commande par appel ou WhatsApp avant d’envoyer le rider.', 'Confirm every order by call or WhatsApp before sending the rider.'],
    ],
    verdict: l(
      'Au Nigeria, Zuri arrive de peu en tête pour le pay on delivery avec une équipe de confirmation et 0 % de commission, mais son paiement en ligne passe seulement par pawaPay, dont MTN et Airtel sont réservés à l’Enterprise. Bumpa est très proche et plus fort sur les paiements locaux et la gestion du stock. Shopify reste le choix de l’écosystème, Selar celui des produits numériques. Zuri est récent, sans domaine personnalisé pour l’instant et payant après le 30 novembre 2026.',
      'In Nigeria, Zuri narrowly leads for pay on delivery with a confirmation team and 0% commission, but its online payment only goes through pawaPay, where MTN and Airtel are Enterprise only. Bumpa is very close and stronger on local payments and inventory. Shopify remains the ecosystem pick, Selar the digital products pick. Zuri is recent, has no custom domain yet and becomes paid after November 30, 2026.',
    ),
    faqs: [
      faq(
        'Quelle passerelle choisir au Nigeria ?',
        'Which payment gateway should I choose in Nigeria?',
        'Paystack (1,5 % + 100 ₦, plafonné à 2 000 ₦) et Flutterwave (2 % sur cartes locales) sont les plus connus pour les cartes et virements. Pour le Mobile Money, pawaPay couvre MTN et Airtel, en forfait Enterprise selon sa page Plans.',
        'Paystack (1.5% + ₦100, capped at ₦2,000) and Flutterwave (2% on local cards) are the best known for cards and transfers. For mobile money, pawaPay covers MTN and Airtel, on its Enterprise plan per its Plans page.',
      ),
      faq(
        'Jumia ou ma propre boutique au Nigeria ?',
        'Jumia or my own store in Nigeria?',
        'Jumia est une marketplace présente au Nigeria : tu profites de son trafic, à ses conditions. Ta propre boutique te laisse maîtriser tes prix, tes pixels et tes clients. Beaucoup de vendeurs font les deux.',
        'Jumia is a marketplace active in Nigeria: you get its traffic, on its terms. Your own store lets you control prices, pixels and customers. Many sellers do both.',
      ),
    ],
    sources: [S.zuri, S.pawapayPlans, S.pawapayProviders, S.paystackPricing, S.flutterwaveNg, S.bumpaPricing, S.selarFees, S.shopifyPricing, S.shopifyPaymentsCountries, S.wooPricing, S.jumia],
  },
  {
    slug: 'ghana',
    enSlug: 'ghana',
    name: l('Ghana', 'Ghana'),
    inFr: 'au Ghana',
    inEn: 'in Ghana',
    currency: l('cedi (GHS)', 'cedi (GHS)'),
    intro: l(
      'À Accra, Kumasi ou Takoradi, le MoMo fait partie du quotidien, mais beaucoup de clients qui découvrent une boutique par une pub préfèrent payer à la livraison. Voici les sites qui gèrent le mieux les deux au Ghana.',
      'In Accra, Kumasi or Takoradi, MoMo is part of daily life, but many buyers who discover a store through an ad prefer to pay on delivery. Here are the sites that handle both best in Ghana.',
    ),
    items: [
      zC(
        'MTN MoMo, AT, Telecel via pawaPay',
        'MTN MoMo, AT, Telecel through pawaPay',
        8.6,
        l('Le vendeur ghanéen en COD avec closers, qui veut aussi le MoMo sur son compte pawaPay.', 'The Ghanaian COD seller with closers who also wants MoMo on their pawaPay account.'),
        [l('Au Ghana, un seul prestataire connecté : pawaPay.', 'In Ghana, only one connected provider: pawaPay.')],
      ),
      shopC(7.5, l('La marque qui vend aussi à l’international et veut l’écosystème Shopify.', 'The brand also selling internationally that wants the Shopify ecosystem.')),
      youC(7.2, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
      selarC(7.0, l('Le créateur qui vend des produits numériques.', 'The creator selling digital products.')),
      wooC(6.8, l('Celui qui a un développeur et veut brancher Paystack lui-même.', 'Someone with a developer who wants to plug in Paystack themselves.')),
    ],
    payments: l(
      'MTN MoMo domine, avec Telecel Cash et AT Money. Zuri se connecte à pawaPay, qui couvre MTN, AT et Telecel (ex Vodafone) au Ghana, au forfait Standard : 1 % plus les frais de l’opérateur. Si tu passes par une autre plateforme, Paystack affiche 1,95 % au Ghana, cartes comme Mobile Money.',
      'MTN MoMo leads, with Telecel Cash and AT Money. Zuri connects to pawaPay, which covers MTN, AT and Telecel (formerly Vodafone) in Ghana, on the Standard plan: 1% plus the operator fee. If you use another platform, Paystack shows 1.95% in Ghana, for cards and mobile money alike.',
    ),
    delivery: l(
      'À Accra, sépare les zones (East Legon, Osu, Madina, Spintex, Kasoa, Tema…) avec un tarif chacune. Pour Kumasi, Tamale ou Cape Coast, envoie par bus ou coursier et demande le MoMo d’avance ou un acompte. Les zones se règlent dans Zuri.',
      'In Accra, split zones (East Legon, Osu, Madina, Spintex, Kasoa, Tema and so on) with a price each. For Kumasi, Tamale or Cape Coast, ship by bus or courier and ask for MoMo upfront or a deposit. Zones are set in Zuri.',
    ),
    tips: [
      ['Affiche tes prix en cedis.', 'Show your prices in cedis.'],
      ['Propose COD à Accra et Kumasi, MoMo d’avance pour les autres régions.', 'Offer COD in Accra and Kumasi, MoMo upfront for other regions.'],
      ['Un petit rabais pour le paiement MoMo d’avance réduit les refus.', 'A small discount for MoMo upfront cuts refusals.'],
    ],
    verdict: l(
      'Au Ghana, Zuri arrive premier pour le COD avec closers et MoMo (MTN, AT, Telecel) via ton compte pawaPay, sans commission. Ses limites : un seul prestataire connecté, outil récent sans domaine personnalisé, payant après le 30 novembre 2026. Shopify est la meilleure alternative si tu vends surtout par carte, Selar pour le numérique.',
      'In Ghana, Zuri comes first for COD with closers and MoMo (MTN, AT, Telecel) through your pawaPay account, with no commission. Its limits: one connected provider, a recent tool without custom domain, paid after November 30, 2026. Shopify is the best alternative if you sell mostly by card, Selar for digital.',
    ),
    faqs: [
      faq(
        'Comment encaisser MTN MoMo sur ma boutique au Ghana ?',
        'How do I collect MTN MoMo on my store in Ghana?',
        'Ouvre un compte pawaPay et connecte-le à Zuri : pawaPay couvre MTN, AT et Telecel au Ghana. L’argent arrive sur ton compte pawaPay.',
        'Open a pawaPay account and connect it to Zuri: pawaPay covers MTN, AT and Telecel in Ghana. The money lands in your pawaPay account.',
      ),
      faq(
        'Jumia ou ma propre boutique au Ghana ?',
        'Jumia or my own store in Ghana?',
        'Jumia est une marketplace active au Ghana. C’est un complément utile pour le trafic, mais ta boutique te donne la main sur tes prix, tes pubs et tes clients.',
        'Jumia is a marketplace active in Ghana. It is a useful complement for traffic, but your own store gives you control over prices, ads and customers.',
      ),
    ],
    sources: [S.zuri, S.pawapayProviders, S.pawapayPlans, S.paystackPricing, S.shopifyPricing, S.shopifyPaymentsCountries, S.youcanPricing, S.selarFees, S.wooPricing, S.jumia],
  },
  {
    slug: 'kenya',
    enSlug: 'kenya',
    name: l('Kenya', 'Kenya'),
    inFr: 'au Kenya',
    inEn: 'in Kenya',
    currency: l('shilling kényan (KES)', 'Kenyan shilling (KES)'),
    intro: l(
      'À Nairobi, Mombasa ou Kisumu, M-Pesa fait partie de la vie de tous les jours, mais un client qui découvre ta boutique par une pub TikTok préfère souvent payer à la livraison, en cash ou par M-Pesa devant le rider. Voici les sites les plus adaptés au Kenya.',
      'In Nairobi, Mombasa or Kisumu, M-Pesa is part of everyday life, but a buyer who finds your store through a TikTok ad often prefers to pay on delivery, in cash or by M-Pesa in front of the rider. Here are the sites best suited to Kenya.',
    ),
    items: [
      zC(
        'M-Pesa via pawaPay (forfait Enterprise selon pawaPay)',
        'M-Pesa through pawaPay (Enterprise plan per pawaPay)',
        8.0,
        l('Le vendeur kényan en pay on delivery avec une équipe de confirmation.', 'The Kenyan pay on delivery seller with a confirmation team.'),
        [
          l(
            'Selon la page Plans de pawaPay, M-Pesa au Kenya est réservé au forfait Enterprise : renseigne-toi avant de compter dessus.',
            'According to pawaPay’s Plans page, M-Pesa in Kenya is Enterprise only: check before relying on it.',
          ),
        ],
      ),
      bumpaC(
        7.9,
        l('Le vendeur des réseaux sociaux qui veut une app de gestion complète.', 'The social media seller who wants a complete business app.'),
        l('Voir le site (prix en KES non affichés)', 'See website (KES prices not shown)'),
        [l('Arrivé au Kenya en juin 2026 : encore récent sur ce marché.', 'Launched in Kenya in June 2026: still recent in this market.')],
      ),
      shopC(7.5, l('La marque qui vend aussi à l’international et veut l’écosystème Shopify.', 'The brand also selling internationally that wants the Shopify ecosystem.')),
      wooC(7.0, l('Celui qui a un développeur et veut brancher M-Pesa par un plugin.', 'Someone with a developer who wants to plug in M-Pesa through a plugin.')),
      youC(6.8, l('Le vendeur COD qui veut une plateforme établie.', 'The COD seller who wants an established platform.')),
    ],
    payments: l(
      'M-Pesa est partout, via Paybill ou numéro Till, et Airtel Money sert souvent de deuxième portefeuille. Paystack affiche 1,5 % pour M-Pesa au Kenya. Zuri se connecte à pawaPay, qui couvre M-Pesa au Kenya, mais selon sa page Plans cet opérateur est réservé au forfait Enterprise. Si le paiement en ligne M-Pesa est indispensable pour toi dès le départ, vérifie ce point avec pawaPay ou choisis un outil relié à Paystack. Le pay on delivery, avec M-Pesa payé au rider, marche sans passerelle.',
      'M-Pesa is everywhere, through Paybill or Till numbers, and Airtel Money is often a second wallet. Paystack shows 1.5% for M-Pesa in Kenya. Zuri connects to pawaPay, which covers M-Pesa in Kenya, but according to its Plans page this operator is Enterprise only. If online M-Pesa payment is essential for you from day one, check this with pawaPay or pick a tool linked to Paystack. Pay on delivery, with M-Pesa paid to the rider, works with no gateway.',
    ),
    delivery: l(
      'À Nairobi, découpe par zones (CBD, Westlands, Kilimani, Kasarani, Embakasi, Rongai…) avec un tarif chacune. Mombasa, Kisumu, Nakuru et Eldoret se servent par coursier ou matatu parcel ; demande un paiement M-Pesa partiel avant d’expédier. Les zones se règlent dans Zuri.',
      'In Nairobi, split by zones (CBD, Westlands, Kilimani, Kasarani, Embakasi, Rongai and so on) with a price each. Mombasa, Kisumu, Nakuru and Eldoret are served by courier or matatu parcel; ask for a partial M-Pesa payment before shipping. Zones are set in Zuri.',
    ),
    tips: [
      ['Affiche des prix ronds en KES, faciles à taper dans M-Pesa.', 'Show round KES prices, easy to type into M-Pesa.'],
      ['Laisse le client payer le rider par M-Pesa à la livraison.', 'Let buyers pay the rider by M-Pesa on delivery.'],
      ['Vérifie l’accès M-Pesa en ligne chez ta passerelle avant de lancer une campagne.', 'Check online M-Pesa access with your gateway before launching a campaign.'],
    ],
    verdict: l(
      'Au Kenya, Zuri arrive de justesse en tête pour le pay on delivery avec une équipe de confirmation et 0 % de commission. Mais le M-Pesa en ligne passe par pawaPay, réservé à l’Enterprise selon sa page Plans, ce qui pèse dans la note. Bumpa est très proche avec une app de gestion complète, Shopify reste le choix de l’écosystème. Zuri est récent, sans domaine personnalisé pour l’instant, payant après le 30 novembre 2026.',
      'In Kenya, Zuri narrowly leads for pay on delivery with a confirmation team and 0% commission. But online M-Pesa goes through pawaPay, Enterprise only according to its Plans page, which weighs on the score. Bumpa is very close with a complete business app, Shopify remains the ecosystem pick. Zuri is recent, has no custom domain yet, and becomes paid after November 30, 2026.',
    ),
    faqs: [
      faq(
        'Comment accepter M-Pesa sur ma boutique en ligne au Kenya ?',
        'How do I accept M-Pesa on my online store in Kenya?',
        'Le plus simple au départ : le client paie le rider par M-Pesa à la livraison. Pour le paiement en ligne, Paystack affiche 1,5 % pour M-Pesa ; pawaPay, connecté à Zuri, le propose en forfait Enterprise selon sa page Plans.',
        'Simplest at first: the buyer pays the rider by M-Pesa on delivery. For online payment, Paystack shows 1.5% for M-Pesa; pawaPay, connected to Zuri, offers it on its Enterprise plan per its Plans page.',
      ),
      faq(
        'Jumia ou ma propre boutique au Kenya ?',
        'Jumia or my own store in Kenya?',
        'Jumia est une marketplace active au Kenya, utile pour le trafic. Ta propre boutique te laisse maîtriser tes prix, tes pubs TikTok et tes clients.',
        'Jumia is a marketplace active in Kenya, useful for traffic. Your own store lets you control prices, TikTok ads and customers.',
      ),
    ],
    sources: [S.zuri, S.pawapayPlans, S.pawapayProviders, S.paystackPricing, S.bumpaPricing, S.bumpaKenya, S.shopifyPricing, S.shopifyPaymentsCountries, S.wooPricing, S.youcanPricing, S.jumia],
  },
]

export const BEST_PAGES: BestPage[] = [
  pageAfrica,
  pageShopifyAlt,
  pageFree,
  pageCod,
  pageGateways,
  pageDigital,
  pageDropship,
  ...COUNTRY_DATA.map(countryPage),
]
