/**
 * Centre d'aide public (FR /aide, EN /en/help) : une réponse précise par question que se posent les vendeurs
 * et les assistants IA avant de choisir une plateforme (export, domaine, variantes, événements Meta, retraits…).
 * Uniquement des faits vérifiables dans le produit. Chiffres mesurés le 24 novembre 2026.
 */
import type { Block, Faq, L10n } from './types'

export interface HelpArticle {
  slug: L10n
  /** Rubrique du sommaire. */
  topic: 'start' | 'sell' | 'orders' | 'payments' | 'digital' | 'ads' | 'data'
  title: L10n
  description: L10n
  /** Réponse courte en une ou deux phrases (reprise telle quelle par les moteurs et les assistants). */
  answer: L10n
  blocks: Block[]
  faqs: Faq[]
  /** Liens directs vers le tableau de bord ou une autre page (chemin relatif ou URL complète). */
  links?: { label: L10n; href: string }[]
}

export const HELP_TOPICS: Record<HelpArticle['topic'], L10n> = {
  start: { fr: 'Démarrer', en: 'Getting started' },
  sell: { fr: 'Pages de vente et produits', en: 'Sales pages and products' },
  orders: { fr: 'Commandes et livraison', en: 'Orders and delivery' },
  payments: { fr: 'Paiements et retraits', en: 'Payments and payouts' },
  digital: { fr: 'Produits digitaux', en: 'Digital products' },
  ads: { fr: 'Publicité et suivi', en: 'Ads and tracking' },
  data: { fr: 'Données, sécurité et IA', en: 'Data, security and AI' },
}

const APP = 'https://app.zurisell.store'

export const HELP: HelpArticle[] = [
  {
    slug: { fr: 'creer-sa-boutique-en-2-minutes', en: 'create-your-store-in-2-minutes' },
    topic: 'start',
    title: { fr: 'Créer sa boutique Zuri en 2 minutes', en: 'Create your Zuri store in 2 minutes' },
    description: { fr: 'Les étapes exactes pour ouvrir une boutique Zuri, ajouter un produit et partager sa page de vente le jour même.', en: 'The exact steps to open a Zuri store, add a product and share your sales page the same day.' },
    answer: {
      fr: 'Créez un compte sur app.zurisell.store, donnez un nom à votre boutique, choisissez le pays, la devise, la langue et le type (produits physiques ou digitaux) : la boutique est en ligne tout de suite à l’adresse votre-nom.zurisell.store, sans carte bancaire.',
      en: 'Create an account on app.zurisell.store, name your store, pick the country, currency, language and type (physical or digital products): the store is live right away at your-name.zurisell.store, with no credit card.',
    },
    blocks: [
      { type: 'h2', text: { fr: 'Les étapes', en: 'The steps' } },
      {
        type: 'list',
        ordered: true,
        items: [
          { fr: 'Inscription par email ou avec Google, sans carte bancaire.', en: 'Sign up with email or Google, no credit card.' },
          { fr: 'Boutique : nom, adresse (votre-nom.zurisell.store), pays, devise (FCFA, naira, cedi, shilling, dirham, euro, dollar…), langue de la boutique (français ou anglais, celle de votre navigateur par défaut) et type : physique ou digital.', en: 'Store: name, address (your-name.zurisell.store), country, currency (CFA franc, naira, cedi, shilling, dirham, euro, dollar…), store language (French or English, your browser language by default) and type: physical or digital.' },
          { fr: 'Premier produit : photos, prix, description. Ou importez-le depuis un lien : le nom, le prix, les photos et la description sont repris, et l’IA remet le texte en ordre.', en: 'First product: photos, price, description. Or import it from a link: name, price, photos and description are filled in, and the AI organises the text.' },
          { fr: 'Produit physique : ajoutez vos zones de livraison (villes, frais, délai). Produit digital : ajoutez le fichier ou le lien livré après paiement.', en: 'Physical product: add your delivery zones (cities, fee, delivery time). Digital product: add the file or link delivered after payment.' },
          { fr: 'Partagez le lien de la page de vente en statut WhatsApp, dans vos pubs Facebook ou TikTok, ou dans votre bio.', en: 'Share the sales page link in your WhatsApp status, Facebook or TikTok ads, or your bio.' },
        ],
      },
      { type: 'tip', title: { fr: 'Accompagnement', en: 'Guidance' }, text: { fr: 'Si vous bloquez à une étape (pas de boutique, pas de produit, pas encore de commande), Zuri vous envoie un email avec la marche à suivre, dans la langue de votre boutique.', en: 'If you get stuck at a step (no store, no product, no order yet), Zuri sends you an email with what to do next, in your store language.' } },
    ],
    faqs: [
      { q: { fr: 'Faut-il savoir coder ?', en: 'Do I need to code?' }, a: { fr: 'Non. Tout se fait depuis le tableau de bord, sur téléphone ou ordinateur.', en: 'No. Everything is done from the dashboard, on phone or computer.' } },
      { q: { fr: 'Puis-je avoir plusieurs boutiques ?', en: 'Can I have several stores?' }, a: { fr: 'Oui : 1 boutique en Gratuit et Starter, 3 en Pro, 10 en Business.', en: 'Yes: 1 store on Free and Starter, 3 on Pro, 10 on Business.' } },
    ],
    links: [{ label: { fr: 'Créer ma boutique', en: 'Create my store' }, href: `${APP}/register` }],
  },
  {
    slug: { fr: 'domaine-personnalise', en: 'custom-domain' },
    topic: 'start',
    title: { fr: 'Connecter son propre nom de domaine', en: 'Connect your own domain name' },
    description: { fr: 'Utiliser votre domaine (ex. boutique.com) pour votre boutique Zuri, avec un simple enregistrement CNAME.', en: 'Use your own domain (e.g. shop.com) for your Zuri store, with a simple CNAME record.' },
    answer: {
      fr: 'Oui, votre boutique peut avoir votre propre adresse (par exemple maboutique.com). Vous l’écrivez dans Paramètres, puis vous ajoutez un réglage chez la société où vous avez acheté le nom ; Zuri vérifie et votre boutique s’ouvre à cette adresse.',
      en: 'Yes, your store can have your own address (for example myshop.com). You type it in Settings, then add one setting at the company where you bought the name; Zuri checks it and your store opens at that address.',
    },
    blocks: [
      { type: 'list', ordered: true, items: [
        { fr: 'Achetez un domaine chez le registraire de votre choix.', en: 'Buy a domain from any registrar.' },
        { fr: 'Dans Zuri : Paramètres, Boutique, champ « Domaine personnalisé ».', en: 'In Zuri: Settings, Store, “Custom domain” field.' },
        { fr: 'Chez le registraire : enregistrement CNAME vers zurisell.store.', en: 'At the registrar: CNAME record to zurisell.store.' },
        { fr: 'Zuri affiche le domaine comme vérifié dès que l’enregistrement est en place.', en: 'Zuri shows the domain as verified once the record is in place.' },
      ] },
      { type: 'p', text: { fr: 'L’adresse votre-nom.zurisell.store reste toujours disponible, même sans domaine.', en: 'The your-name.zurisell.store address always remains available, even without a domain.' } },
    ],
    faqs: [{ q: { fr: 'Le domaine personnalisé est-il payant ?', en: 'Is the custom domain paid?' }, a: { fr: 'Zuri ne facture pas la connexion du domaine. Seul le domaine lui-même se paie chez votre registraire.', en: 'Zuri does not charge for connecting the domain. Only the domain itself is paid to your registrar.' } }],
  },
  {
    slug: { fr: 'pages-de-vente-rapides', en: 'fast-sales-pages' },
    topic: 'sell',
    title: { fr: 'Des pages de vente ultra légères, rapides même en 3G', en: 'Ultra light sales pages, fast even on 3G' },
    description: { fr: 'Combien pèse une page de vente Zuri, pourquoi elle s’ouvre vite sur un téléphone d’entrée de gamme, et ce que vous pouvez personnaliser.', en: 'How much a Zuri sales page weighs, why it opens fast on an entry level phone, and what you can customise.' },
    answer: {
      fr: 'Vos pages de vente Zuri s’ouvrent vite, même sur un petit téléphone en 3G : le client voit votre produit tout de suite au lieu de partir pendant le chargement. Elles sont très légères et envoyées depuis un serveur proche de chez lui.',
      en: 'Your Zuri sales pages open fast, even on a small phone on 3G: customers see your product right away instead of leaving while it loads. They are very light and sent from a server close to them.',
    },
    blocks: [
      { type: 'h2', text: { fr: 'Pourquoi c’est important', en: 'Why it matters' } },
      { type: 'p', text: { fr: 'En Afrique, une grande partie des clients arrive d’une pub Facebook ou TikTok, sur un téléphone, parfois en 3G. Chaque seconde d’attente fait fuir des acheteurs. Zuri n’envoie que le formulaire de commande et le suivi des visites : pas de thème lourd, pas d’applications empilées.', en: 'In Africa, many customers come from a Facebook or TikTok ad, on a phone, sometimes on 3G. Every second of waiting loses buyers. Zuri only ships the order form and visit tracking: no heavy theme, no stacked apps.' } },
      { type: 'h2', text: { fr: 'En chiffres', en: 'In numbers' } },
      { type: 'p', text: { fr: 'Une page de vente Zuri charge environ 20 Ko de JavaScript compressé (mesuré le 24 novembre 2026), le style étant intégré à la page, et elle est servie par le réseau mondial de Cloudflare. Le site zurisell.store ne charge aucun JavaScript applicatif.', en: 'A Zuri sales page loads about 20 KB of compressed JavaScript (measured on 24 November 2026), with styles inlined, and it is served by Cloudflare’s global network. The zurisell.store site loads no application JavaScript.' } },
      { type: 'h2', text: { fr: 'Ce que vous personnalisez', en: 'What you customise' } },
      { type: 'list', items: [
        { fr: '3 modèles de page (classique, sombre premium, carte minimaliste) et la couleur de votre marque.', en: '3 page templates (classic, dark premium, minimalist card) and your brand colour.' },
        { fr: 'En-tête (sur-titre, titre accrocheur, accroche), description riche avec images, points forts, vidéo, questions fréquentes, témoignages, boutons d’appel à l’action dans la description.', en: 'Header (kicker, headline, tagline), rich description with images, key features, video, FAQ, testimonials, call to action buttons inside the description.' },
        { fr: 'Packs et offres par quantité, prix barré, promotion, compte à rebours, stock limité, bouton de commande collant, bouton WhatsApp flottant.', en: 'Bundles and quantity offers, compare at price, promotion, countdown, limited stock, sticky order button, floating WhatsApp button.' },
        { fr: 'Ou votre propre page HTML (faite avec ChatGPT, Lovable ou un constructeur) : Zuri y ajoute son formulaire, ses prix et son suivi.', en: 'Or your own HTML page (made with ChatGPT, Lovable or a builder): Zuri adds its form, prices and tracking.' },
      ] },
    ],
    faqs: [{ q: { fr: 'Ma boutique a-t-elle une page d’accueil ?', en: 'Does my store have a home page?' }, a: { fr: 'Oui : votre-nom.zurisell.store présente tous vos produits en vente, et chaque produit a sa page de vente.', en: 'Yes: your-name.zurisell.store lists all your products on sale, and each product has its own sales page.' } }],
  },
  {
    slug: { fr: 'variantes-stock-et-packs', en: 'variants-stock-and-bundles' },
    topic: 'sell',
    title: { fr: 'Variantes, stock, packs et prix dans plusieurs devises', en: 'Variants, stock, bundles and multi currency prices' },
    description: { fr: 'Tailles, couleurs, stock suivi par variante, packs de produits et prix affichés dans la devise du client.', en: 'Sizes, colours, stock tracked per variant, product bundles and prices shown in the customer’s currency.' },
    answer: {
      fr: 'Chaque produit Zuri peut avoir des variantes (taille, couleur…) avec leur prix, leur référence et leur stock, un suivi de stock automatique, des packs qui réservent le stock de chaque produit inclus, et des prix dans 11 devises.',
      en: 'Each Zuri product can have variants (size, colour…) with their own price, SKU and stock, automatic stock tracking, bundles that reserve the stock of each included product, and prices in 11 currencies.',
    },
    blocks: [
      { type: 'list', items: [
        { fr: 'Variantes : un nom d’option (ex. Couleur) et autant de choix que nécessaire, chacun avec prix, référence et stock.', en: 'Variants: an option name (e.g. Colour) and as many choices as needed, each with price, SKU and stock.' },
        { fr: 'Stock : décompté à chaque commande, rendu si la commande est annulée ou retournée, signalé dans la liste des produits quand il devient bas.', en: 'Stock: deducted on each order, restored if the order is cancelled or returned, flagged in the product list when it gets low.' },
        { fr: 'Packs : vendez plusieurs produits ensemble à un prix de pack ; le stock et le prix d’achat de chaque produit sont pris en compte.', en: 'Bundles: sell several products together at a bundle price; the stock and cost of each product are taken into account.' },
        { fr: 'Devises : XOF, XAF, GNF, CDF, NGN, GHS, KES, MAD, EUR, USD, CAD, avec un prix par devise pour les clients d’autres pays.', en: 'Currencies: XOF, XAF, GNF, CDF, NGN, GHS, KES, MAD, EUR, USD, CAD, with a price per currency for customers in other countries.' },
        { fr: 'Prix d’achat (coût) : sert à calculer votre bénéfice réel, jamais visible des clients.', en: 'Cost price: used to compute your real profit, never shown to customers.' },
      ] },
    ],
    faqs: [{ q: { fr: 'Puis-je importer mon catalogue ?', en: 'Can I import my catalog?' }, a: { fr: 'Oui : par fichier CSV (l’export produits de Shopify est reconnu), ou produit par produit depuis un lien.', en: 'Yes: by CSV file (Shopify’s product export is recognised), or product by product from a link.' } }],
  },
  {
    slug: { fr: 'import-par-lien-et-ia', en: 'import-from-link-and-ai' },
    topic: 'sell',
    title: { fr: 'Importer un produit depuis un lien, et la rédaction IA', en: 'Import a product from a link, and AI copywriting' },
    description: { fr: 'Collez un lien Shopify, AliExpress, Amazon, Jumia, Chariow ou Selar : Zuri reprend le produit, l’IA réécrit la description en PASA ou AIDA et peut régénérer les images.', en: 'Paste a Shopify, AliExpress, Amazon, Jumia, Chariow or Selar link: Zuri picks up the product, the AI rewrites the description with PASA or AIDA and can regenerate images.' },
    answer: {
      fr: 'Collez le lien d’une page produit : Zuri reprend le nom, le prix, les photos, les variantes, la vidéo, les questions et la description complète (en moins d’une minute, même pour les sites protégés), puis l’IA réécrit la description selon la méthode PASA ou AIDA et propose de régénérer les images de la description.',
      en: 'Paste a product page link: Zuri picks up the name, price, photos, variants, video, questions and full description (in under a minute, even for protected sites), then the AI rewrites the description with the PASA or AIDA method and offers to regenerate the description images.',
    },
    blocks: [
      { type: 'h2', text: { fr: 'Sites pris en charge', en: 'Supported sites' } },
      { type: 'p', text: { fr: 'Boutiques Shopify et WooCommerce, AliExpress, Jumia, Amazon, et produits digitaux sur Selar, Chariow, Gumroad ou Systeme.io. Si un site bloque toute lecture, collez simplement le texte de la page : l’IA remplit la fiche.', en: 'Shopify and WooCommerce stores, AliExpress, Jumia, Amazon, and digital products on Selar, Chariow, Gumroad or Systeme.io. If a site blocks all reading, just paste the page text: the AI fills in the product.' } },
      { type: 'h2', text: { fr: 'Rédaction PASA ou AIDA', en: 'PASA or AIDA copywriting' } },
      { type: 'p', text: { fr: 'L’IA choisit la méthode la plus adaptée : PASA (Problème, Agitation, Solution, Action) pour un produit qui règle une gêne, AIDA (Attention, Intérêt, Désir, Action) pour un produit qui se vend par l’envie. Le texte est découpé en sections, avec avantages en liste, mode d’emploi en étapes, témoignages et questions repris mot pour mot, sans emoji et sans rien inventer. Pour un produit digital : pour qui, ce qu’on apprend, les modules, le format, l’accès et les bonus.', en: 'The AI picks the best method: PASA (Problem, Agitation, Solution, Action) for a product that solves a pain, AIDA (Attention, Interest, Desire, Action) for a product sold on desire. The text is split into sections, with benefits as a list, how to use as steps, testimonials and questions kept word for word, no emoji and nothing invented. For a digital product: who it is for, what you learn, the modules, format, access and bonuses.' } },
      { type: 'h2', text: { fr: 'Images de la description', en: 'Description images' } },
      { type: 'p', text: { fr: 'Chaque image trouvée dans la description peut être gardée, retirée ou régénérée : même produit, photo propre, sans texte étranger ni logo (maquette de couverture ou d’écrans pour un produit digital).', en: 'Each image found in the description can be kept, removed or regenerated: same product, clean photo, no foreign text or logo (cover or screen mockup for a digital product).' } },
    ],
    faqs: [{ q: { fr: 'Combien de temps prend un import ?', en: 'How long does an import take?' }, a: { fr: 'Quelques secondes pour une page lisible, environ une minute pour un site protégé ou rendu en JavaScript ; la réécriture IA prend ensuite 20 à 60 secondes.', en: 'A few seconds for a readable page, about a minute for a protected or JavaScript rendered site; the AI rewrite then takes 20 to 60 seconds.' } }],
  },
  {
    slug: { fr: 'paiement-a-la-livraison-et-closers', en: 'cash-on-delivery-and-closers' },
    topic: 'orders',
    title: { fr: 'Paiement à la livraison, confirmation et équipe de closers', en: 'Cash on delivery, confirmation and closer team' },
    description: { fr: 'Formulaire de commande court, zones de livraison par ville, statuts de commande, attribution aux closers et traitement en lot.', en: 'Short order form, delivery zones by city, order statuses, assignment to closers and bulk processing.' },
    answer: {
      fr: 'Le client commande sans payer, en quelques champs ; la commande arrive en direct dans Zuri (notification sur le téléphone, Telegram ou email), est attribuée à un closer qui appelle, puis suit les statuts Nouvelle, Injoignable, Confirmée, Expédiée, Livrée, Retournée ou Annulée jusqu’à l’encaissement.',
      en: 'The customer orders without paying, in a few fields; the order arrives live in Zuri (phone notification, Telegram or email), is assigned to a closer who calls, then moves through New, Unreachable, Confirmed, Shipped, Delivered, Returned or Cancelled until cash is collected.',
    },
    blocks: [
      { type: 'list', items: [
        { fr: 'Zones de livraison : villes ou quartiers, frais, livraison offerte au-delà d’un montant, délai annoncé, paiement à la livraison autorisé ou non par zone.', en: 'Delivery zones: cities or areas, fee, free delivery above an amount, announced delivery time, cash on delivery allowed or not per zone.' },
        { fr: 'Équipe : rôles (propriétaire, administrateur, gérant de boutique, gestionnaire de commandes, closer), périmètre par produit, chiffre d’affaires masqué si besoin, attribution des commandes aux closers.', en: 'Team: roles (owner, admin, store manager, order manager, closer), scope per product, revenue hidden if needed, order assignment to closers.' },
        { fr: 'Traitement en lot : confirmer, expédier, livrer, annuler ou archiver plusieurs commandes en une fois.', en: 'Bulk processing: confirm, ship, deliver, cancel or archive several orders at once.' },
        { fr: 'Le client reçoit des emails de suivi (commande reçue, confirmée, en route) dans la langue de la boutique.', en: 'The customer receives tracking emails (order received, confirmed, on its way) in the store language.' },
        { fr: 'Tunnel : produit ajouté au formulaire (order bump), offre après commande (upsell) et offre de repli (downsell) sur la même commande.', en: 'Funnel: product added on the form (order bump), offer after the order (upsell) and fallback offer (downsell) on the same order.' },
      ] },
      { type: 'tip', title: { fr: 'Bénéfice réel', en: 'Real profit' }, text: { fr: 'Taux de confirmation, taux de livraison, chiffre réellement encaissé, dépenses (pubs, livraison) et bénéfice net sont calculés automatiquement.', en: 'Confirmation rate, delivery rate, cash actually collected, expenses (ads, delivery) and net profit are computed automatically.' } },
    ],
    faqs: [{ q: { fr: 'Zuri fournit-il des livreurs ?', en: 'Does Zuri provide couriers?' }, a: { fr: 'Non. Zuri est le logiciel qui gère les commandes et le suivi ; vous travaillez avec vos livreurs ou votre société de livraison.', en: 'No. Zuri is the software that manages orders and tracking; you work with your own couriers or delivery company.' } }],
  },
  {
    slug: { fr: 'mobile-money-et-retraits', en: 'mobile-money-and-payouts' },
    topic: 'payments',
    title: { fr: 'Mobile Money, carte et retraits de vos ventes', en: 'Mobile Money, card and payouts of your sales' },
    description: { fr: 'Encaisser par Mobile Money ou carte avec FedaPay, FeexPay, PayDunya ou pawaPay, et retirer son argent le jour même ou sous 24 heures.', en: 'Collect payments by Mobile Money or card with FedaPay, FeexPay, PayDunya or pawaPay, and withdraw your money the same day or within 24 hours.' },
    answer: {
      fr: 'Zuri connecte vos propres comptes FedaPay, FeexPay, PayDunya ou pawaPay (Orange Money, MTN MoMo, Moov, Wave, M-Pesa, Airtel… selon le pays) : l’argent arrive directement sur votre compte, Zuri ne le garde jamais et ne prend aucune commission, et vous retirez vos ventes le jour même ou sous 24 heures selon le statut de votre compte et votre formule.',
      en: 'Zuri connects your own FedaPay, FeexPay, PayDunya or pawaPay accounts (Orange Money, MTN MoMo, Moov, Wave, M-Pesa, Airtel… depending on the country): the money goes straight to your account, Zuri never holds it and takes no commission, and you withdraw your sales the same day or within 24 hours depending on your account status and plan.',
    },
    blocks: [
      { type: 'list', items: [
        { fr: '0 % de commission Zuri sur les ventes, quel que soit le moyen de paiement.', en: '0% Zuri commission on sales, whatever the payment method.' },
        { fr: 'Paiement en ligne, à la livraison, ou les deux, réglable par produit.', en: 'Online payment, cash on delivery, or both, set per product.' },
        { fr: 'Paiement refusé (solde insuffisant, délai dépassé…) : la raison s’affiche en clair, et vous relancez le client en un clic par email ou WhatsApp.', en: 'Declined payment (insufficient balance, timeout…): the reason is shown in plain words, and you follow up with the customer in one click by email or WhatsApp.' },
        { fr: 'Vérification automatique des paiements en attente toutes les 5 minutes : une vente payée n’est jamais oubliée.', en: 'Automatic check of pending payments every 5 minutes: a paid sale is never missed.' },
      ] },
    ],
    faqs: [
      { q: { fr: 'Quand puis-je retirer mon argent ?', en: 'When can I withdraw my money?' }, a: { fr: 'Le jour même ou sous 24 heures, selon le statut de votre compte et votre formule.', en: 'The same day or within 24 hours, depending on your account status and plan.' } },
      { q: { fr: 'Zuri garde-t-il une partie de mes ventes ?', en: 'Does Zuri keep part of my sales?' }, a: { fr: 'Non. Les paiements en ligne vont sur votre compte de paiement, les paiements à la livraison sont encaissés par vous ou votre livreur.', en: 'No. Online payments go to your payment account, cash on delivery is collected by you or your courier.' } },
    ],
  },
  {
    slug: { fr: 'vendre-des-produits-digitaux', en: 'sell-digital-products' },
    topic: 'digital',
    title: { fr: 'Vendre des produits digitaux : ebooks, formations, coaching', en: 'Sell digital products: ebooks, courses, coaching' },
    description: { fr: 'Livraison automatique du fichier ou du lien après paiement, page d’accès, retéléchargement, relances et traitement en lot des ventes.', en: 'Automatic delivery of the file or link after payment, access page, re-download, follow ups and bulk processing of sales.' },
    answer: {
      fr: 'Avec une boutique digitale Zuri, le client paie par Mobile Money ou carte et reçoit aussitôt son accès par email (fichier téléchargeable ou lien vers votre formation), avec une page pour le retrouver à tout moment ; les paniers abandonnés et les paiements refusés sont relancés, et les ventes se traitent en lot.',
      en: 'With a Zuri digital store, the customer pays by Mobile Money or card and immediately receives access by email (downloadable file or link to your course), with a page to find it at any time; abandoned carts and declined payments are followed up, and sales are processed in bulk.',
    },
    blocks: [
      { type: 'list', items: [
        { fr: 'Livraison : fichier stocké en privé (liens de téléchargement temporaires) ou lien externe (Google Drive, plateforme de formation, groupe privé).', en: 'Delivery: privately stored file (temporary download links) or external link (Google Drive, course platform, private group).' },
        { fr: 'Accès immédiat : email avec bouton d’accès dès la confirmation du paiement, dans la langue de la boutique, et compteur de téléchargements.', en: 'Instant access: email with an access button as soon as payment is confirmed, in the store language, and a download counter.' },
        { fr: 'Relances : paniers abandonnés relancés par email, avec un code promo dans les derniers rappels si vous en choisissez un ; paiement refusé relancé en un clic.', en: 'Follow ups: abandoned carts followed up by email, with a promo code in the last reminders if you pick one; declined payment followed up in one click.' },
        { fr: 'Ventes en lot : marquer payées (l’accès part aussitôt), relancer le paiement, renvoyer l’accès, annuler, archiver.', en: 'Bulk sales: mark as paid (access is sent right away), follow up payment, resend access, cancel, archive.' },
        { fr: 'Retraits le jour même ou sous 24 heures selon le statut du compte et la formule, sans commission Zuri.', en: 'Payouts the same day or within 24 hours depending on account status and plan, with no Zuri commission.' },
        { fr: 'Import depuis Chariow, Selar, Gumroad ou Systeme.io : le contenu complet de la page (modules, bonus, garantie) est repris.', en: 'Import from Chariow, Selar, Gumroad or Systeme.io: the full page content (modules, bonuses, guarantee) is picked up.' },
      ] },
    ],
    faqs: [{ q: { fr: 'Le client peut-il retélécharger ?', en: 'Can the customer download again?' }, a: { fr: 'Oui, depuis le bouton de son email d’accès, à tout moment.', en: 'Yes, from the button in their access email, at any time.' } }],
  },
  {
    slug: { fr: 'pixel-facebook-api-conversions-tiktok', en: 'facebook-pixel-conversions-api-tiktok' },
    topic: 'ads',
    title: { fr: 'Pixel Facebook, API Conversions et pixel TikTok : quels événements ?', en: 'Facebook pixel, Conversions API and TikTok pixel: which events?' },
    description: { fr: 'Les événements envoyés à Meta et TikTok, et le choix du moment où l’achat est déclaré en paiement à la livraison (commande, confirmation ou livraison).', en: 'The events sent to Meta and TikTok, and when the purchase is reported for cash on delivery (order, confirmation or delivery).' },
    answer: {
      fr: 'Zuri dit à Facebook et TikTok qui a visité votre page, qui a commencé à commander et qui a acheté, pour que vos pubs trouvent plus d’acheteurs. En paiement à la livraison, vous pouvez ne compter une vente qu’une fois la commande confirmée ou livrée : Facebook apprend alors à trouver des clients qui paient vraiment.',
      en: 'Zuri tells Facebook and TikTok who visited your page, who started ordering and who bought, so your ads find more buyers. With cash on delivery, you can count a sale only once the order is confirmed or delivered: Facebook then learns to find customers who actually pay.',
    },
    blocks: [
      { type: 'p', text: { fr: 'Détail technique : événements PageView, InitiateCheckout et Purchase envoyés par le pixel et par l’API Conversions de Meta avec le même identifiant (pas de doublon) ; en paiement à la livraison, la commande est déclarée comme prospect (Lead) jusqu’au moment choisi.', en: 'Technical detail: PageView, InitiateCheckout and Purchase events sent through the pixel and Meta’s Conversions API with the same ID (no duplicates); with cash on delivery, the order is reported as a Lead until the chosen moment.' } },
      { type: 'table', rows: [
        [{ fr: 'Moment', en: 'Moment' }, { fr: 'Événement Meta', en: 'Meta event' }, { fr: 'Événement TikTok', en: 'TikTok event' }],
        [{ fr: 'Visite de la page', en: 'Page visit' }, { fr: 'PageView', en: 'PageView' }, { fr: 'Pageview', en: 'Pageview' }],
        [{ fr: 'Début du formulaire', en: 'Form started' }, { fr: 'InitiateCheckout', en: 'InitiateCheckout' }, { fr: 'InitiateCheckout', en: 'InitiateCheckout' }],
        [{ fr: 'Paiement en ligne réussi', en: 'Successful online payment' }, { fr: 'Purchase (navigateur et serveur)', en: 'Purchase (browser and server)' }, { fr: 'CompletePayment', en: 'CompletePayment' }],
        [{ fr: 'Commande à la livraison', en: 'Cash on delivery order' }, { fr: 'Purchase, ou Lead si l’achat est déclaré plus tard', en: 'Purchase, or Lead if purchase is reported later' }, { fr: 'CompletePayment ou PlaceAnOrder', en: 'CompletePayment or PlaceAnOrder' }],
        [{ fr: 'Commande confirmée ou livrée (selon votre réglage)', en: 'Order confirmed or delivered (per your setting)' }, { fr: 'Purchase par l’API Conversions', en: 'Purchase through the Conversions API' }, { fr: 'Non envoyé', en: 'Not sent' }],
      ] },
      { type: 'p', text: { fr: 'Pourquoi c’est important : en paiement à la livraison, une partie des commandes n’est jamais livrée. Déclarer l’achat seulement à la confirmation ou à la livraison apprend à Meta à trouver des clients qui paient vraiment. Le réglage se trouve dans Paramètres, Suivi publicitaire.', en: 'Why it matters: with cash on delivery, part of the orders is never delivered. Reporting the purchase only at confirmation or delivery teaches Meta to find customers who actually pay. The setting is in Settings, Ad tracking.' } },
      { type: 'p', text: { fr: 'Pour mesurer quelle pub vend vraiment, ajoutez les paramètres de suivi fournis par Zuri dans vos pubs Facebook et TikTok : chaque campagne et chaque pub apparaît dans la page Trafic avec ses visiteurs, commandes et taux de conversion, en premier et en dernier clic.', en: 'To measure which ad really sells, add the tracking parameters provided by Zuri to your Facebook and TikTok ads: each campaign and ad appears in the Traffic page with its visitors, orders and conversion rate, first click and last click.' } },
    ],
    faqs: [{ q: { fr: 'Faut-il un jeton pour l’API Conversions ?', en: 'Do I need a token for the Conversions API?' }, a: { fr: 'Oui, un jeton d’accès créé dans le gestionnaire d’événements Meta, à coller dans Paramètres, Suivi publicitaire. Il est chiffré et jamais réaffiché.', en: 'Yes, an access token created in Meta Events Manager, pasted in Settings, Ad tracking. It is encrypted and never shown again.' } }],
  },
  {
    slug: { fr: 'exporter-commandes-et-clients', en: 'export-orders-and-customers' },
    topic: 'data',
    title: { fr: 'Exporter ses commandes et ses clients', en: 'Export your orders and customers' },
    description: { fr: 'Vos données vous appartiennent : export CSV des commandes et des clients, compatible Excel et Google Sheets.', en: 'Your data is yours: CSV export of orders and customers, compatible with Excel and Google Sheets.' },
    answer: {
      fr: 'Oui : en un clic, vous récupérez toutes vos commandes et tous vos clients dans un fichier qui s’ouvre dans Excel ou Google Sheets. Vos données restent les vôtres.',
      en: 'Yes: in one click, you get all your orders and customers in a file that opens in Excel or Google Sheets. Your data stays yours.',
    },
    blocks: [
      { type: 'list', items: [
        { fr: 'Commandes : numéro, date, client, téléphone, ville, adresse, articles, total, devise, moyen et statut de paiement, statut de livraison, livreur, numéro de suivi, champs personnalisés.', en: 'Orders: number, date, customer, phone, city, address, items, total, currency, payment method and status, delivery status, courier, tracking number, custom fields.' },
        { fr: 'Clients : nom, téléphone, email, ville, adresse, commandes, livrées, retournées, total dépensé, client bloqué, client depuis.', en: 'Customers: name, phone, email, city, address, orders, delivered, returned, total spent, blocked customer, customer since.' },
        { fr: 'Fichiers au format CSV (séparateur point-virgule), ouverts directement par Excel et Google Sheets.', en: 'Files in CSV format (semicolon separator), opened directly by Excel and Google Sheets.' },
      ] },
    ],
    faqs: [{ q: { fr: 'Puis-je partir avec mes données ?', en: 'Can I leave with my data?' }, a: { fr: 'Oui, à tout moment : commandes et clients s’exportent, et vos produits restent les vôtres.', en: 'Yes, at any time: orders and customers export, and your products remain yours.' } }],
  },
  {
    slug: { fr: 'assistants-ia-chatgpt-claude-mcp', en: 'ai-assistants-chatgpt-claude-mcp' },
    topic: 'data',
    title: { fr: 'Piloter sa boutique avec ChatGPT ou Claude (MCP)', en: 'Run your store with ChatGPT or Claude (MCP)' },
    description: { fr: 'Connecter un assistant IA à votre boutique Zuri pour suivre ventes, commandes et trafic en langage naturel.', en: 'Connect an AI assistant to your Zuri store to follow sales, orders and traffic in plain language.' },
    answer: {
      fr: 'Vous pouvez relier ChatGPT ou Claude à votre boutique et leur poser des questions comme à un assistant : « combien j’ai vendu aujourd’hui ? », « quelles commandes reste-t-il à confirmer ? », « quelle pub marche le mieux ? ».',
      en: 'You can link ChatGPT or Claude to your store and ask them questions like an assistant: “how much did I sell today?”, “which orders are left to confirm?”, “which ad works best?”.',
    },
    blocks: [
      { type: 'p', text: { fr: 'Détail technique : Zuri propose un serveur MCP de 46 outils ; la connexion se fait avec une clé d’API créée dans la page « API et IA » du tableau de bord.', en: 'Technical detail: Zuri provides an MCP server with 46 tools; you connect with an API key created in the “API and AI” page of the dashboard.' } },
      { type: 'p', text: { fr: 'Les droits de la clé suivent ceux du membre qui la crée : un closer ne voit que ses produits, et le chiffre d’affaires reste masqué si son rôle le prévoit.', en: 'The key’s permissions follow those of the member who creates it: a closer only sees their products, and revenue stays hidden if their role says so.' } },
    ],
    faqs: [],
  },
  {
    slug: { fr: 'securite-support-et-fiabilite', en: 'security-support-and-reliability' },
    topic: 'data',
    title: { fr: 'Sécurité, support et fiabilité', en: 'Security, support and reliability' },
    description: { fr: 'Comment Zuri protège vos données et celles de vos clients, et comment joindre le support.', en: 'How Zuri protects your data and your customers’ data, and how to reach support.' },
    answer: {
      fr: 'Vos accès de paiement sont protégés, vos ebooks ne peuvent pas être téléchargés par n’importe qui, vous êtes prévenu par email à chaque nouvelle connexion à votre compte, et une vraie personne vous répond sur WhatsApp, par email ou par le formulaire de zurisell.store/contact.',
      en: 'Your payment access is protected, your ebooks cannot be downloaded by just anyone, you are warned by email at every new sign in to your account, and a real person answers you on WhatsApp, by email or through the form on zurisell.store/contact.',
    },
    blocks: [
      { type: 'list', items: [
        { fr: 'Détail technique : clés de paiement et jetons publicitaires chiffrés (AES-256-GCM), fichiers digitaux stockés en privé avec des liens de téléchargement temporaires.', en: 'Technical detail: payment keys and ad tokens encrypted (AES-256-GCM), digital files stored privately with temporary download links.' },
        { fr: 'Aucune donnée de carte bancaire n’est stockée par Zuri : le paiement se fait chez le prestataire.', en: 'No card data is stored by Zuri: payment happens at the provider.' },
        { fr: 'Pages servies par le réseau mondial de Cloudflare.', en: 'Pages served by Cloudflare’s global network.' },
        { fr: 'Rôles et droits par membre de l’équipe, historique des actions (page Activité).', en: 'Roles and permissions per team member, action history (Activity page).' },
      ] },
    ],
    faqs: [],
    links: [{ label: { fr: 'Contacter le support', en: 'Contact support' }, href: '/contact' }],
  },
]
