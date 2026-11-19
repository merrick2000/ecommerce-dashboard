import type { AlternativePage } from './types'

/**
 * Pages « Alternative à X » (SEO programmatique), en français et en anglais.
 * Faits vérifiés sur les sites officiels en novembre 2026. Chaque limite citée a sa source.
 */

const SRC = {
  shopifyPricing: { label: "Shopify, page Tarifs (novembre 2026)", url: "https://www.shopify.com/pricing" },
  shopifyPaymentsCountries: { label: "Shopify Help Center, pays où Shopify Payments est disponible", url: "https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries" },
  shopifyManual: { label: "Shopify Help Center, paiements manuels (COD)", url: "https://help.shopify.com/en/manual/payments/manual-payments" },
  easySell: { label: "Shopify App Store, EasySell COD Form & Upsells (tarifs)", url: "https://apps.shopify.com/easy-order-form" },
  releasit: { label: "Shopify App Store, Releasit COD Form & Upsells (tarifs)", url: "https://apps.shopify.com/releasit-cod-order-form" },
  almanac: { label: "HTTP Archive, Web Almanac 2025, chapitre Ecommerce (Core Web Vitals mobile)", url: "https://almanac.httparchive.org/en/2025/ecommerce" },
  wooPricing: { label: "WooCommerce, page Pricing (coûts d'hébergement et d'extensions)", url: "https://woocommerce.com/pricing/" },
  wixPlans: { label: "Wix, page des forfaits", url: "https://www.wix.com/plans" },
  youcanPricing: { label: "YouCan, page Pricing", url: "https://youcan.shop/en/pricing" },
  youcanTrustpilot: { label: "Trustpilot, avis sur youcan.shop", url: "https://www.trustpilot.com/review/youcan.shop" },
  lfPricing: { label: "Lightfunnels, page Pricing", url: "https://lightfunnels.com/pricing" },
  lfTrustpilot: { label: "Trustpilot, avis sur lightfunnels.com", url: "https://www.trustpilot.com/review/lightfunnels.com" },
  easyafrik: { label: "EasyAfrik, page d'accueil et tarifs", url: "https://easyafrik.com" },
  selika: { label: "Selika, page d'accueil et tarifs", url: "https://selika.io" },
  owashop: { label: "OwaShop, page d'accueil et tarifs", url: "https://owashop.com" },
  storeino: { label: "Storeino, page Pricing", url: "https://storeino.com/en/pricing" },
  chariowPricing: { label: "Chariow, page Pricing", url: "https://chariow.com/pricing" },
  chariowTerms: { label: "Chariow, conditions générales (art. 9.3, 11.2, 13.2)", url: "https://chariow.com/terms-of-service" },
  chariowHome: { label: "Chariow, page d'accueil (moyens de paiement)", url: "https://chariow.com" },
  maketou: { label: "Maketou, page d'accueil et FAQ", url: "https://www.maketou.com/" },
  selarFees: { label: "Selar Help Center, frais de transaction en naira", url: "https://help.selar.com/portal/en/kb/articles/how-to-pass-transaction-fees-to-your-customers-from-your-selar-dashboard" },
  selarTrustpilot: { label: "Trustpilot, avis sur selar.co", url: "https://www.trustpilot.com/review/selar.co" },
} as const

export const ALTERNATIVES: AlternativePage[] = [
  // ---------------------------------------------------------------- SHOPIFY
  {
    slug: "shopify",
    competitor: "Shopify",
    competitorUrl: "https://www.shopify.com",
    title: {
      fr: "Alternative à Shopify en Afrique : gratuite, COD et Mobile Money | Zuri",
      en: "Shopify alternative for Africa: cash on delivery and Mobile Money | Zuri",
    },
    description: {
      fr: "Shopify est solide, mais pensé pour la carte bancaire. Zuri te donne le COD, les closers et le Mobile Money en FCFA, sans abonnement pendant le lancement.",
      en: "Shopify is solid but built around card payments. Zuri gives you cash on delivery, closers and Mobile Money in CFA francs, free during launch.",
    },
    h1: {
      fr: "L'alternative à Shopify pensée pour vendre en Afrique",
      en: "The Shopify alternative built for selling in Africa",
    },
    intro: {
      fr: "Shopify est l'une des meilleures plateformes e-commerce au monde, et ce n'est pas un hasard : boutique rapide, thèmes soignés, énorme catalogue d'applications. Mais si tu vends en Afrique de l'Ouest ou centrale, ton quotidien ressemble plutôt à ça : des commandes en paiement à la livraison, des clients qu'il faut appeler pour confirmer, des paiements en Mobile Money et des prix en FCFA. Sur Shopify, tout ça se construit en ajoutant des applications payantes en dollars. Zuri part de ce quotidien : formulaire COD, closers, statuts de livraison et Mobile Money sont inclus dès le départ. Voici une comparaison honnête pour t'aider à choisir.",
      en: "Shopify is one of the best ecommerce platforms in the world, and for good reason: fast stores, polished themes and a huge app catalog. But if you sell in West or Central Africa, your daily work looks different: cash on delivery orders, customers you must call to confirm, Mobile Money payments and prices in CFA francs. On Shopify, you build all of this by adding paid apps billed in dollars. Zuri starts from that daily reality: the COD form, closers, delivery statuses and Mobile Money are included from day one. Here is an honest comparison to help you choose.",
    },
    strengths: [
      {
        fr: "Des boutiques rapides : selon le Web Almanac 2025, environ 76 % des boutiques Shopify passent les Core Web Vitals sur mobile, le meilleur score parmi les grandes plateformes.",
        en: "Fast stores: according to the 2025 Web Almanac, about 76% of Shopify stores pass Core Web Vitals on mobile, the best score among large platforms.",
      },
      {
        fr: "Un écosystème immense : des milliers d'applications et de thèmes, et beaucoup de tutoriels en ligne.",
        en: "A huge ecosystem: thousands of apps and themes, and plenty of tutorials online.",
      },
      {
        fr: "Une plateforme fiable et éprouvée, utilisée par des marques de toutes tailles.",
        en: "A reliable, proven platform used by brands of every size.",
      },
      {
        fr: "Le COD est possible en « paiement manuel », sans frais de transaction tiers sur ces commandes selon l'aide officielle de Shopify.",
        en: "Cash on delivery works as a \"manual payment\", with no third party transaction fees on those orders according to Shopify's official help.",
      },
    ],
    limits: [
      {
        fr: "Un abonnement en dollars : le forfait Basic coûte 27 $ par mois sans engagement (19 $ par mois en annuel), le forfait Grow 72 $ (54 $ en annuel), après un essai de 3 jours puis 1 $ par mois pendant 3 mois.",
        en: "A subscription in dollars: the Basic plan costs $27 per month billed monthly ($19 per month billed yearly), Grow costs $72 ($54 yearly), after a 3 day trial and then $1 per month for 3 months.",
      },
      {
        fr: "Shopify Payments est disponible dans 41 pays, dont aucun pays africain. Pour encaisser en ligne, il faut passer par un prestataire tiers, avec des frais Shopify de 2 % (Basic) à 0,6 % (Advanced) sur ces paiements.",
        en: "Shopify Payments is available in 41 countries, none of them in Africa. To get paid online you must use a third party provider, and Shopify then charges 2% (Basic) down to 0.6% (Advanced) on those payments.",
      },
      {
        fr: "Le formulaire COD en une page, très utilisé en Afrique, passe par une application. Exemple : EasySell est gratuit jusqu'à 60 commandes par mois, puis 9,95 $ par mois (formule PRO, 440 commandes). Releasit propose une formule à 11,49 $ par mois.",
        en: "The one page COD form, widely used in Africa, requires an app. Example: EasySell is free up to 60 orders per month, then $9.95 per month (PRO plan, 440 orders). Releasit has a plan at $11.49 per month.",
      },
      {
        fr: "Chaque besoin supplémentaire (avis clients, compte à rebours, packs, suivi des closers) s'ajoute avec sa propre application et son propre tarif, ce qui fait grimper la facture mensuelle.",
        en: "Each extra need (customer reviews, countdown timer, bundles, closer tracking) comes with its own app and its own price, so the monthly bill grows.",
      },
      {
        fr: "L'abonnement et les applications sont affichés en dollars : en FCFA, ton coût mensuel bouge avec le taux de change entre l'euro et le dollar.",
        en: "The subscription and apps are priced in dollars: in CFA francs, your monthly cost moves with the euro to dollar exchange rate.",
      },
    ],
    compare: [
      [{ fr: "Prix de départ", en: "Starting price" }, { fr: "27 $/mois (19 $ en annuel)", en: "$27/month ($19 yearly)" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Commission sur les ventes", en: "Commission on sales" }, { fr: "2 % à 0,6 % avec un prestataire tiers", en: "2% to 0.6% with a third party provider" }, { fr: "0 %", en: "0%" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Via applications ou prestataires tiers", en: "Through third party apps or providers" }, { fr: "Inclus via tes comptes FeexPay, FedaPay, PayDunya, PawaPay", en: "Included through your FeexPay, FedaPay, PayDunya, PawaPay accounts" }],
      [{ fr: "Formulaire COD en une page", en: "One page COD form" }, { fr: "Application (ex. EasySell, 0 à 9,95 $ et plus)", en: "App (e.g. EasySell, $0 to $9.95 and up)" }, { fr: "Inclus et personnalisable", en: "Included and customizable" }],
      [{ fr: "Closers et attribution des commandes", en: "Closers and order assignment" }, { fr: "Non inclus de base", en: "Not included by default" }, { fr: "Inclus, attribution automatique", en: "Included, automatic assignment" }],
      [{ fr: "Statuts COD et taux de livraison", en: "COD statuses and delivery rate" }, { fr: "Non inclus de base", en: "Not included by default" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Packs, prix barré, compte à rebours", en: "Bundles, strikethrough price, countdown" }, { fr: "Prix barré inclus, le reste via applications", en: "Strikethrough price included, the rest via apps" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Pixel Facebook, API Conversions, TikTok", en: "Facebook pixel, Conversions API, TikTok" }, { fr: "Oui, via les canaux de vente", en: "Yes, through sales channels" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Écosystème d'applications et de thèmes", en: "App and theme ecosystem" }, { fr: "Très large", en: "Very large" }, { fr: "Plus limité, fonctions clés intégrées", en: "Smaller, key features built in" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Oui", en: "Yes" }, { fr: "Bientôt", en: "Coming soon" }],
      [{ fr: "Application mobile native", en: "Native mobile app" }, { fr: "Oui", en: "Yes" }, { fr: "Non (site adapté au mobile)", en: "No (mobile friendly web app)" }],
    ],
    stillGoodFor: {
      fr: "Shopify reste un excellent choix si tu vends surtout par carte bancaire, à l'international ou depuis un pays où Shopify Payments est disponible, si tu as besoin d'un écosystème d'applications très riche, ou si tu construis une marque avec un catalogue large et un budget mensuel confortable.",
      en: "Shopify is still an excellent choice if you mostly sell with bank cards, sell internationally or from a country where Shopify Payments is available, need a very rich app ecosystem, or are building a brand with a large catalog and a comfortable monthly budget.",
    },
    migration: [
      {
        fr: "Dans Shopify, va dans Produits puis Exporter, et télécharge le fichier CSV de tes produits.",
        en: "In Shopify, go to Products then Export, and download the CSV file of your products.",
      },
      {
        fr: "Dans Zuri, utilise l'import Shopify ou l'import CSV : titres, descriptions, prix, variantes et images sont repris.",
        en: "In Zuri, use the Shopify import or the CSV import: titles, descriptions, prices, variants and images are brought over.",
      },
      {
        fr: "Pour un produit isolé, colle simplement l'URL de ta page Shopify : l'IA de Zuri recrée la page de vente.",
        en: "For a single product, just paste the URL of your Shopify page: Zuri's AI rebuilds the sales page.",
      },
      {
        fr: "Reconnecte ton pixel Facebook, ton API Conversions et ton pixel TikTok dans les réglages, puis branche ton compte FeexPay, FedaPay, PayDunya ou PawaPay.",
        en: "Reconnect your Facebook pixel, Conversions API and TikTok pixel in the settings, then connect your FeexPay, FedaPay, PayDunya or PawaPay account.",
      },
      {
        fr: "Teste une commande COD, invite tes closers, puis change le lien de tes publicités.",
        en: "Test a COD order, invite your closers, then switch the link in your ads.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Shopify en Afrique ?", en: "What is the best Shopify alternative in Africa?" },
        a: {
          fr: "Ça dépend de ta façon de vendre. Si tes ventes passent surtout par le paiement à la livraison et le Mobile Money, cherche une plateforme qui inclut le formulaire COD, la gestion des closers et le paiement local sans applications en plus. C'est exactement le terrain de Zuri. Si tu vends surtout par carte à l'international, Shopify reste une référence.",
          en: "It depends on how you sell. If most of your sales come from cash on delivery and Mobile Money, look for a platform that includes the COD form, closer management and local payments without extra apps. That is exactly what Zuri is built for. If you mostly sell by card internationally, Shopify remains a benchmark.",
        },
      },
      {
        q: { fr: "Shopify est-il gratuit ?", en: "Is Shopify free?" },
        a: {
          fr: "Non. Shopify propose un essai de 3 jours sans carte, puis 1 $ par mois pendant 3 mois, puis le forfait Basic à 27 $ par mois sans engagement (19 $ en annuel). Zuri est gratuit pendant la phase de lancement, sans carte bancaire.",
          en: "No. Shopify offers a 3 day trial without a card, then $1 per month for 3 months, then the Basic plan at $27 per month billed monthly ($19 billed yearly). Zuri is free during its launch phase, with no bank card needed.",
        },
      },
      {
        q: { fr: "Shopify fonctionne-t-il avec Mobile Money ?", en: "Does Shopify work with Mobile Money?" },
        a: {
          fr: "Pas nativement : Shopify Payments n'est disponible dans aucun pays africain. Tu peux passer par un prestataire tiers compatible, mais Shopify facture alors des frais de 2 % à 0,6 % selon ton forfait. Sur Zuri, tu branches directement ton compte FeexPay, FedaPay, PayDunya ou PawaPay et l'argent va sur ton compte.",
          en: "Not natively: Shopify Payments is not available in any African country. You can use a compatible third party provider, but Shopify then charges 2% to 0.6% depending on your plan. On Zuri, you connect your own FeexPay, FedaPay, PayDunya or PawaPay account and the money goes to you.",
        },
      },
      {
        q: { fr: "Shopify prend-il une commission sur les commandes COD ?", en: "Does Shopify take a fee on COD orders?" },
        a: {
          fr: "Non. Le COD est un paiement manuel sur Shopify, et l'aide officielle indique qu'il n'y a pas de frais de transaction tiers sur les paiements manuels. Le coût vient surtout de l'abonnement et des applications COD.",
          en: "No. COD is a manual payment on Shopify, and the official help says there are no third party transaction fees on manual payments. The cost mostly comes from the subscription and COD apps.",
        },
      },
      {
        q: { fr: "Est-ce que je perds mes produits si je quitte Shopify ?", en: "Will I lose my products if I leave Shopify?" },
        a: {
          fr: "Non. Tu exportes ton catalogue en CSV depuis Shopify et tu l'importes dans Zuri en quelques minutes. Tu peux même garder les deux boutiques en parallèle le temps de tester.",
          en: "No. You export your catalog as a CSV from Shopify and import it into Zuri in a few minutes. You can even keep both stores running while you test.",
        },
      },
    ],
    sources: [SRC.shopifyPricing, SRC.shopifyPaymentsCountries, SRC.shopifyManual, SRC.easySell, SRC.releasit, SRC.almanac],
  },
  // ------------------------------------------------------------ WOOCOMMERCE
  {
    slug: "woocommerce",
    competitor: "WooCommerce",
    competitorUrl: "https://woocommerce.com",
    title: {
      fr: "Alternative à WooCommerce en Afrique : sans hébergement ni plugins | Zuri",
      en: "WooCommerce alternative for Africa: no hosting, no plugins | Zuri",
    },
    description: {
      fr: "WooCommerce est gratuit et très flexible, mais demande hébergement, plugins et maintenance. Zuri te donne des pages légères, le COD et le Mobile Money, prêts à vendre.",
      en: "WooCommerce is free and very flexible but needs hosting, plugins and upkeep. Zuri gives you light pages, cash on delivery and Mobile Money, ready to sell.",
    },
    h1: {
      fr: "L'alternative à WooCommerce sans hébergement ni plugins à gérer",
      en: "The WooCommerce alternative with no hosting or plugins to manage",
    },
    intro: {
      fr: "WooCommerce est l'extension e-commerce gratuite de WordPress, et c'est la plateforme la plus utilisée au monde par nombre de sites. Elle est libre, très personnalisable, et tu restes propriétaire de tout. En contrepartie, tu dois t'occuper toi-même de l'hébergement, des mises à jour, de la sécurité et des plugins. Pour un vendeur qui fait du COD en Afrique et veut surtout lancer vite des produits avec des publicités Facebook ou TikTok, ce travail technique prend du temps et de l'argent. Zuri est une plateforme hébergée : pas de serveur à gérer, et les outils COD et Mobile Money sont déjà là.",
      en: "WooCommerce is the free ecommerce plugin for WordPress, and it is the most used platform in the world by number of sites. It is open source, very customizable, and you own everything. In return, you handle hosting, updates, security and plugins yourself. For a seller doing cash on delivery in Africa who mainly wants to launch products fast with Facebook or TikTok ads, this technical work costs time and money. Zuri is a hosted platform: no server to manage, and the COD and Mobile Money tools are already there.",
    },
    strengths: [
      {
        fr: "Le cœur de WooCommerce est gratuit et open source, sans abonnement mensuel.",
        en: "The WooCommerce core is free and open source, with no monthly subscription.",
      },
      {
        fr: "Une liberté totale : tu choisis ton hébergeur, ton thème, et tu peux tout modifier dans le code.",
        en: "Total freedom: you choose your host and theme, and you can change anything in the code.",
      },
      {
        fr: "La puissance de WordPress pour le contenu et le blog, utile pour le référencement à long terme.",
        en: "The power of WordPress for content and blogging, useful for long term SEO.",
      },
      {
        fr: "Une très grande communauté, des milliers d'extensions et beaucoup de développeurs disponibles, y compris en Afrique.",
        en: "A very large community, thousands of extensions and many available developers, including in Africa.",
      },
    ],
    limits: [
      {
        fr: "Des coûts cachés : la page tarifs de WooCommerce estime l'hébergement entre 25 $ et 350 $ par mois pour la plupart des boutiques, et chaque extension payante entre 29 $ et 299 $ par an.",
        en: "Hidden costs: WooCommerce's own pricing page estimates hosting at $25 to $350 per month for most stores, and each paid extension at $29 to $299 per year.",
      },
      {
        fr: "La vitesse dépend de ton installation : selon le Web Almanac 2025, environ 35 % des sites WooCommerce passent les Core Web Vitals sur mobile, contre 76 % pour Shopify. Une page lente coûte cher en publicité.",
        en: "Speed depends on your setup: according to the 2025 Web Almanac, about 35% of WooCommerce sites pass Core Web Vitals on mobile, versus 76% for Shopify. A slow page makes ads more expensive.",
      },
      {
        fr: "La maintenance est à ta charge : mises à jour de WordPress, du thème et des plugins, sauvegardes, sécurité.",
        en: "Maintenance is on you: WordPress, theme and plugin updates, backups and security.",
      },
      {
        fr: "Le COD avec closers, les statuts de livraison et le suivi du taux de confirmation demandent des plugins supplémentaires ou du développement sur mesure.",
        en: "COD with closers, delivery statuses and confirmation rate tracking need extra plugins or custom development.",
      },
    ],
    compare: [
      [{ fr: "Prix du logiciel", en: "Software price" }, { fr: "Gratuit", en: "Free" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Hébergement", en: "Hosting" }, { fr: "À payer (25 $ à 350 $/mois selon WooCommerce)", en: "Paid separately ($25 to $350/month per WooCommerce)" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Maintenance et sécurité", en: "Maintenance and security" }, { fr: "À ta charge", en: "Your job" }, { fr: "Gérées par Zuri", en: "Handled by Zuri" }],
      [{ fr: "Vitesse mobile", en: "Mobile speed" }, { fr: "≈ 35 % des sites passent les Core Web Vitals", en: "About 35% of sites pass Core Web Vitals" }, { fr: "Pages ultra légères (≈ 23 Ko de JS)", en: "Ultra light pages (about 23 KB of JS)" }],
      [{ fr: "Commission sur les ventes", en: "Commission on sales" }, { fr: "0 % (frais du prestataire de paiement)", en: "0% (payment provider fees)" }, { fr: "0 % (frais de ton prestataire)", en: "0% (your provider's fees)" }],
      [{ fr: "Formulaire COD en une page", en: "One page COD form" }, { fr: "Via plugin", en: "Via plugin" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Closers et statuts COD", en: "Closers and COD statuses" }, { fr: "Via plugins ou sur mesure", en: "Via plugins or custom work" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Via plugin du prestataire", en: "Via the provider's plugin" }, { fr: "Inclus (FeexPay, FedaPay, PayDunya, PawaPay)", en: "Included (FeexPay, FedaPay, PayDunya, PawaPay)" }],
      [{ fr: "Personnalisation du code", en: "Code customization" }, { fr: "Totale", en: "Total" }, { fr: "Limitée aux réglages", en: "Limited to settings" }],
      [{ fr: "Blog et contenu", en: "Blog and content" }, { fr: "Excellent (WordPress)", en: "Excellent (WordPress)" }, { fr: "Non, centré sur la vente", en: "No, focused on selling" }],
    ],
    stillGoodFor: {
      fr: "WooCommerce reste un très bon choix si tu as des compétences techniques ou un développeur, si tu veux un contrôle total sur ton site et tes données, si le blog et le contenu sont au cœur de ta stratégie, ou si tu as besoin de fonctions très spécifiques qu'aucune plateforme hébergée ne propose.",
      en: "WooCommerce is still a very good choice if you have technical skills or a developer, want full control over your site and data, rely heavily on blogging and content, or need very specific features no hosted platform offers.",
    },
    migration: [
      {
        fr: "Dans WooCommerce, va dans Produits puis Exporter pour télécharger ton catalogue en CSV.",
        en: "In WooCommerce, go to Products then Export to download your catalog as a CSV.",
      },
      {
        fr: "Importe ce fichier dans Zuri avec l'import CSV, ou colle l'URL d'une page produit pour que l'IA la recrée.",
        en: "Import that file into Zuri with the CSV import, or paste a product page URL so the AI rebuilds it.",
      },
      {
        fr: "Configure tes zones de livraison, ton formulaire COD et tes closers.",
        en: "Set up your delivery zones, your COD form and your closers.",
      },
      {
        fr: "Reconnecte ton pixel Facebook, l'API Conversions et TikTok, branche ton compte de paiement, puis redirige tes publicités vers Zuri.",
        en: "Reconnect your Facebook pixel, Conversions API and TikTok, connect your payment account, then point your ads to Zuri.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à WooCommerce en Afrique ?", en: "What is the best WooCommerce alternative in Africa?" },
        a: {
          fr: "Si tu veux arrêter de gérer un serveur et des plugins, une plateforme hébergée est plus simple. Pour le COD et le Mobile Money en FCFA, Zuri inclut tout ce qu'il faut sans extension. Si tu veux une grosse boutique très personnalisée, WooCommerce reste pertinent avec un bon hébergeur.",
          en: "If you want to stop managing a server and plugins, a hosted platform is simpler. For cash on delivery and Mobile Money in CFA francs, Zuri includes everything without extensions. If you want a large, highly customized store, WooCommerce still makes sense with good hosting.",
        },
      },
      {
        q: { fr: "WooCommerce est-il gratuit ?", en: "Is WooCommerce free?" },
        a: {
          fr: "Le logiciel est gratuit, mais pas la boutique complète. Il faut payer un hébergement, un nom de domaine, souvent un thème et des extensions. WooCommerce lui-même estime l'hébergement entre 25 $ et 350 $ par mois pour la plupart des boutiques.",
          en: "The software is free, but the full store is not. You pay for hosting, a domain, often a theme and extensions. WooCommerce itself estimates hosting at $25 to $350 per month for most stores.",
        },
      },
      {
        q: { fr: "WooCommerce fonctionne-t-il avec Mobile Money ?", en: "Does WooCommerce work with Mobile Money?" },
        a: {
          fr: "Oui, plusieurs prestataires africains proposent un plugin WooCommerce. Il faut l'installer, le configurer et le maintenir à jour. Sur Zuri, la connexion à FeexPay, FedaPay, PayDunya ou PawaPay se fait dans les réglages, sans plugin.",
          en: "Yes, several African providers offer a WooCommerce plugin. You need to install, configure and keep it updated. On Zuri, connecting FeexPay, FedaPay, PayDunya or PawaPay is done in the settings, without a plugin.",
        },
      },
      {
        q: { fr: "Pourquoi la vitesse de la page compte autant ?", en: "Why does page speed matter so much?" },
        a: {
          fr: "La plupart de tes clients arrivent depuis une publicité, sur mobile, souvent avec une connexion 3G ou 4G instable. Une page qui met trop de temps à s'afficher perd des visiteurs que tu as déjà payés. Les pages Zuri chargent environ 23 Ko de JavaScript pour rester rapides.",
          en: "Most of your customers come from an ad, on mobile, often with an unstable 3G or 4G connection. A page that loads too slowly loses visitors you already paid for. Zuri pages load about 23 KB of JavaScript to stay fast.",
        },
      },
      {
        q: { fr: "Puis-je garder mon site WordPress ?", en: "Can I keep my WordPress site?" },
        a: {
          fr: "Oui. Beaucoup de vendeurs gardent WordPress pour leur blog et utilisent Zuri pour les pages de vente des produits qu'ils poussent en publicité.",
          en: "Yes. Many sellers keep WordPress for their blog and use Zuri for the sales pages of the products they push with ads.",
        },
      },
      {
        q: { fr: "Comment fonctionnent les closers sur Zuri ?", en: "How do closers work on Zuri?" },
        a: {
          fr: "Tu invites les membres de ton équipe comme closers. Chaque nouvelle commande COD est attribuée automatiquement à l'un d'eux, qui appelle le client, confirme l'adresse et met à jour le statut : confirmée, injoignable, annulée, expédiée, livrée ou retournée. Tu vois en temps réel ton taux de confirmation, ton taux de livraison et le chiffre réellement encaissé, ce qui t'aide à repérer un produit ou une publicité qui attire de mauvaises commandes.",
          en: "You invite your team members as closers. Each new COD order is automatically assigned to one of them, who calls the customer, confirms the address and updates the status: confirmed, unreachable, cancelled, shipped, delivered or returned. You see your confirmation rate, delivery rate and the revenue actually collected in real time, which helps you spot a product or an ad that brings in bad orders and fix it before you spend more.",
        },
      },
    ],
    sources: [SRC.wooPricing, SRC.almanac],
  },
  // ------------------------------------------------------------------- WIX
  {
    slug: "wix",
    competitor: "Wix",
    competitorUrl: "https://www.wix.com",
    title: {
      fr: "Alternative à Wix en Afrique : COD, closers et Mobile Money | Zuri",
      en: "Wix alternative for Africa: cash on delivery and Mobile Money | Zuri",
    },
    description: {
      fr: "Wix est un excellent créateur de sites. Pour vendre en COD avec des closers et du Mobile Money en FCFA, Zuri est pensé pour ton terrain.",
      en: "Wix is a great website builder. To sell with cash on delivery, closers and Mobile Money in CFA francs, Zuri is built for your market.",
    },
    h1: {
      fr: "L'alternative à Wix pour vendre en paiement à la livraison",
      en: "The Wix alternative for selling with cash on delivery",
    },
    intro: {
      fr: "Wix est connu pour son éditeur glisser-déposer : tu peux créer un beau site vitrine, un portfolio ou une petite boutique sans écrire une ligne de code. C'est un outil généraliste, très complet, qui convient à beaucoup de métiers. Mais un vendeur e-commerce en Afrique a des besoins précis : un formulaire de commande COD court, des closers qui appellent les clients, des statuts de livraison, du Mobile Money et des prix en FCFA. Zuri ne cherche pas à faire tous les types de sites : il se concentre sur la page de vente qui convertit et sur la gestion des commandes COD.",
      en: "Wix is known for its drag and drop editor: you can build a beautiful showcase site, portfolio or small store without writing code. It is a general purpose, very complete tool that suits many businesses. But an ecommerce seller in Africa has specific needs: a short COD order form, closers who call customers, delivery statuses, Mobile Money and prices in CFA francs. Zuri does not try to build every kind of site: it focuses on the sales page that converts and on managing COD orders.",
    },
    strengths: [
      {
        fr: "Un éditeur visuel très intuitif, idéal pour créer un site sans compétences techniques.",
        en: "A very intuitive visual editor, ideal for building a site without technical skills.",
      },
      {
        fr: "De bonnes performances : selon le Web Almanac 2025, environ 66 % des boutiques Wix passent les Core Web Vitals sur mobile.",
        en: "Good performance: according to the 2025 Web Almanac, about 66% of Wix stores pass Core Web Vitals on mobile.",
      },
      {
        fr: "Une offre très large au même endroit : site vitrine, réservations, blog, e-mails marketing.",
        en: "A very broad offer in one place: showcase site, bookings, blog, email marketing.",
      },
      {
        fr: "Un forfait gratuit pour tester l'éditeur et créer un site simple.",
        en: "A free plan to try the editor and build a simple site.",
      },
    ],
    limits: [
      {
        fr: "Pour accepter des paiements et vendre, il faut un forfait payant : sur la page officielle, les fonctions e-commerce commencent au forfait Core, et les prix varient selon le pays.",
        en: "To accept payments and sell, you need a paid plan: on the official page, ecommerce features start with the Core plan, and prices vary by country.",
      },
      {
        fr: "La page des forfaits Wix met en avant les cartes bancaires et ne mentionne pas le Mobile Money.",
        en: "The Wix plans page highlights bank cards and does not mention Mobile Money.",
      },
      {
        fr: "La gestion des closers (attribution automatique des commandes, statuts COD, taux de confirmation) n'est pas présentée sur la page des forfaits Wix.",
        en: "Closer management (automatic order assignment, COD statuses, confirmation rate) is not presented on the Wix plans page.",
      },
      {
        fr: "Un outil généraliste demande plus de réglages pour obtenir une page de vente courte, centrée sur un seul produit, comme celles qui marchent en publicité.",
        en: "A general purpose tool needs more setup to get a short, single product sales page like the ones that work with ads.",
      },
    ],
    compare: [
      [{ fr: "Vendre en ligne", en: "Selling online" }, { fr: "Forfait payant (Core ou plus)", en: "Paid plan (Core or higher)" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Type d'outil", en: "Type of tool" }, { fr: "Créateur de sites généraliste", en: "General website builder" }, { fr: "Pages de vente et gestion COD", en: "Sales pages and COD management" }],
      [{ fr: "Éditeur visuel libre", en: "Free form visual editor" }, { fr: "Oui, très complet", en: "Yes, very complete" }, { fr: "Sections prêtes à l'emploi", en: "Ready made sections" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Non mentionné sur la page des forfaits", en: "Not mentioned on the plans page" }, { fr: "Inclus via tes comptes PSP", en: "Included through your PSP accounts" }],
      [{ fr: "Formulaire COD personnalisable", en: "Customizable COD form" }, { fr: "Non mis en avant", en: "Not highlighted" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Closers et statuts COD", en: "Closers and COD statuses" }, { fr: "Non présenté", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Packs, compte à rebours, stock limité", en: "Bundles, countdown, low stock" }, { fr: "Selon applications", en: "Depends on apps" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Prix en FCFA", en: "Prices in CFA francs" }, { fr: "Selon réglages de devise", en: "Depends on currency settings" }, { fr: "Oui, par défaut", en: "Yes, by default" }],
      [{ fr: "Blog, réservations, site vitrine", en: "Blog, bookings, showcase site" }, { fr: "Oui", en: "Yes" }, { fr: "Non", en: "No" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Oui (forfait payant)", en: "Yes (paid plan)" }, { fr: "Bientôt", en: "Coming soon" }],
    ],
    stillGoodFor: {
      fr: "Wix reste un très bon choix pour un site vitrine soigné, un portfolio, une activité de services avec réservations, ou une boutique qui encaisse surtout par carte bancaire. Si tu veux un seul outil pour tout ton site et pas seulement pour vendre, Wix est pertinent.",
      en: "Wix is still a very good choice for a polished showcase site, a portfolio, a service business with bookings, or a store that mostly takes card payments. If you want one tool for your whole website and not only for selling, Wix makes sense.",
    },
    migration: [
      {
        fr: "Exporte tes produits Wix en CSV depuis ton tableau de bord, puis importe le fichier dans Zuri.",
        en: "Export your Wix products as a CSV from your dashboard, then import the file into Zuri.",
      },
      {
        fr: "Pour un produit phare, colle l'URL de sa page : l'IA de Zuri génère une page de vente complète, que tu peux modifier.",
        en: "For a best seller, paste its page URL: Zuri's AI generates a full sales page that you can edit.",
      },
      {
        fr: "Ajoute tes zones de livraison, ton formulaire COD et ton compte Mobile Money.",
        en: "Add your delivery zones, your COD form and your Mobile Money account.",
      },
      {
        fr: "Reconnecte tes pixels Facebook et TikTok, puis utilise le lien Zuri dans tes publicités. Ton site Wix peut rester en ligne comme vitrine.",
        en: "Reconnect your Facebook and TikTok pixels, then use the Zuri link in your ads. Your Wix site can stay online as a showcase.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Wix en Afrique ?", en: "What is the best Wix alternative in Africa?" },
        a: {
          fr: "Pour un site vitrine, Wix reste très bien. Pour vendre des produits en paiement à la livraison avec des closers et du Mobile Money, un outil spécialisé comme Zuri te fait gagner du temps parce que tout est déjà prévu pour ce mode de vente.",
          en: "For a showcase site, Wix is still great. For selling products with cash on delivery, closers and Mobile Money, a specialized tool like Zuri saves you time because everything is already set up for that way of selling.",
        },
      },
      {
        q: { fr: "Wix est-il gratuit ?", en: "Is Wix free?" },
        a: {
          fr: "Wix a un forfait gratuit pour créer un site, mais il ne permet pas d'accepter des paiements. Pour vendre, il faut un forfait payant (Core ou supérieur), dont le prix varie selon le pays. Zuri est gratuit pendant le lancement, ventes comprises.",
          en: "Wix has a free plan to build a site, but it does not let you accept payments. To sell, you need a paid plan (Core or higher), with prices that vary by country. Zuri is free during launch, sales included.",
        },
      },
      {
        q: { fr: "Wix fonctionne-t-il avec Mobile Money ?", en: "Does Wix work with Mobile Money?" },
        a: {
          fr: "La page des forfaits Wix ne mentionne pas le Mobile Money et indique que d'autres moyens de paiement peuvent exister selon ta région. Vérifie directement dans ton pays. Sur Zuri, tu connectes ton compte FeexPay, FedaPay, PayDunya ou PawaPay.",
          en: "The Wix plans page does not mention Mobile Money and says other payment options may be available depending on your region. Check directly for your country. On Zuri, you connect your FeexPay, FedaPay, PayDunya or PawaPay account.",
        },
      },
      {
        q: { fr: "Wix est-il lent ?", en: "Is Wix slow?" },
        a: {
          fr: "Non. D'après le Web Almanac 2025, environ 66 % des boutiques Wix passent les Core Web Vitals sur mobile, ce qui est un bon résultat. La différence avec Zuri se joue surtout sur les fonctions COD et le paiement local.",
          en: "No. According to the 2025 Web Almanac, about 66% of Wix stores pass Core Web Vitals on mobile, which is a good result. The difference with Zuri is mainly about COD features and local payments.",
        },
      },
      {
        q: { fr: "Combien coûte vraiment Zuri ?", en: "How much does Zuri really cost?" },
        a: {
          fr: "Zuri est gratuit pendant la phase de lancement, sans carte bancaire et sans commission sur tes ventes. Les commandes en paiement à la livraison n'ont aucun frais Zuri. Pour les paiements Mobile Money, seul ton prestataire (FeexPay, FedaPay, PayDunya ou PawaPay) prend ses frais habituels, que tu retrouves dans ton contrat avec lui. Zuri ne touche jamais ton argent : il arrive directement sur ton compte.",
          en: "Zuri is free during its launch phase, with no bank card and no commission on your sales. Cash on delivery orders have no Zuri fees. For Mobile Money payments, only your provider (FeexPay, FedaPay, PayDunya or PawaPay) takes its usual fees, as set in your contract with them. Zuri never touches your money: it goes straight to your account, and you can follow what you actually collected in your dashboard.",
        },
      },
    ],
    sources: [SRC.wixPlans, SRC.almanac],
  },
  // ---------------------------------------------------------------- YOUCAN
  {
    slug: "youcan",
    competitor: "YouCan",
    competitorUrl: "https://youcan.shop",
    title: {
      fr: "Alternative à YouCan en Afrique de l'Ouest : 0 % de commission, FCFA | Zuri",
      en: "YouCan alternative for West Africa: 0% commission, CFA francs | Zuri",
    },
    description: {
      fr: "YouCan est une bonne plateforme COD venue du Maroc. Zuri cible l'Afrique francophone avec le Mobile Money en FCFA, des closers et 0 % de commission.",
      en: "YouCan is a solid COD platform from Morocco. Zuri targets French speaking Africa with Mobile Money in CFA francs, closers and 0% commission.",
    },
    h1: {
      fr: "L'alternative à YouCan pensée pour le Mobile Money et le FCFA",
      en: "The YouCan alternative built for Mobile Money and CFA francs",
    },
    intro: {
      fr: "YouCan est une plateforme e-commerce marocaine très utilisée par les vendeurs COD en Afrique du Nord et au-delà. Elle a popularisé un modèle intéressant : tu peux démarrer sans abonnement et ne payer qu'une petite commission sur tes ventes. Si tu vends en Afrique de l'Ouest ou centrale, la question est différente : est-ce que la plateforme encaisse le Mobile Money de tes clients, affiche les prix en FCFA et t'aide à gérer tes closers ? Voici une comparaison factuelle entre YouCan et Zuri.",
      en: "YouCan is a Moroccan ecommerce platform widely used by COD sellers in North Africa and beyond. It made an interesting model popular: you can start without a subscription and only pay a small commission on your sales. If you sell in West or Central Africa, the question is different: does the platform collect your customers' Mobile Money, show prices in CFA francs and help you manage your closers? Here is a factual comparison between YouCan and Zuri.",
    },
    strengths: [
      {
        fr: "Une formule sans abonnement : rien n'est facturé avant 5 000 $ de ventes, puis 0,5 % sur le COD et 1 % sur le paiement en ligne (0,25 % et 0,5 % au-delà de 5 000 $).",
        en: "A no subscription option: nothing is billed until $5,000 in sales, then 0.5% on COD and 1% on online payments (0.25% and 0.5% above $5,000).",
      },
      {
        fr: "Une plateforme pensée pour le COD, avec thèmes gratuits, hébergement et certificat SSL inclus.",
        en: "A platform designed for COD, with free themes, hosting and SSL certificate included.",
      },
      {
        fr: "Jusqu'à 6 domaines personnalisés par boutique et le multidevise sur tous les forfaits.",
        en: "Up to 6 custom domains per store and multicurrency on every plan.",
      },
      {
        fr: "Des avis qui saluent la simplicité de prise en main pour les débutants (Trustpilot).",
        en: "Reviews that praise how easy it is for beginners (Trustpilot).",
      },
    ],
    limits: [
      {
        fr: "Une commission sur chaque vente en formule sans abonnement (0,5 % puis 0,25 % sur le COD, 1 % puis 0,5 % en ligne). Les abonnements sans commission vont de 29 $ à 229 $ par mois.",
        en: "A fee on every sale on the no subscription option (0.5% then 0.25% on COD, 1% then 0.5% online). Subscriptions with no fee range from $29 to $229 per month.",
      },
      {
        fr: "Les prix sont affichés en dollars sur la page tarifs, et le forfait Unlimited se paie par carte bancaire.",
        en: "Prices are shown in dollars on the pricing page, and the Unlimited plan is billed to a bank card.",
      },
      {
        fr: "La page tarifs cite Stripe comme exemple de prestataire, mais ne présente pas de connexion Mobile Money pour l'Afrique de l'Ouest.",
        en: "The pricing page cites Stripe as an example provider, but does not present a Mobile Money connection for West Africa.",
      },
      {
        fr: "Des avis publics mitigés : note Trustpilot de 2,9 sur 5 sur 73 avis en novembre 2026, avec des remarques sur la réactivité du support. Trustpilot précise ne pas vérifier tous les avis.",
        en: "Mixed public reviews: a Trustpilot score of 2.9 out of 5 from 73 reviews in November 2026, with comments about support response times. Trustpilot notes it does not verify every review.",
      },
    ],
    compare: [
      [{ fr: "Prix de départ", en: "Starting price" }, { fr: "Sans abonnement jusqu'à 5 000 $ de ventes", en: "No subscription until $5,000 in sales" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Commission COD (sans abonnement)", en: "COD fee (no subscription)" }, { fr: "0,5 % puis 0,25 %", en: "0.5% then 0.25%" }, { fr: "0 %", en: "0%" }],
      [{ fr: "Commission paiement en ligne", en: "Online payment fee" }, { fr: "1 % puis 0,5 %", en: "1% then 0.5%" }, { fr: "0 % (frais de ton prestataire)", en: "0% (your provider's fees)" }],
      [{ fr: "Abonnements", en: "Subscriptions" }, { fr: "29 $ à 229 $/mois", en: "$29 to $229/month" }, { fr: "Aucun pendant le lancement", en: "None during launch" }],
      [{ fr: "Mobile Money Afrique de l'Ouest", en: "West Africa Mobile Money" }, { fr: "Non présenté sur la page tarifs", en: "Not presented on the pricing page" }, { fr: "FeexPay, FedaPay, PayDunya, PawaPay", en: "FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "Formulaire COD", en: "COD form" }, { fr: "Oui", en: "Yes" }, { fr: "Oui, personnalisable", en: "Yes, customizable" }],
      [{ fr: "Closers avec attribution automatique", en: "Closers with automatic assignment" }, { fr: "Comptes équipe (1 à 19 selon forfait)", en: "Staff accounts (1 to 19 by plan)" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Oui, jusqu'à 6", en: "Yes, up to 6" }, { fr: "Bientôt", en: "Coming soon" }],
      [{ fr: "Ancienneté", en: "Track record" }, { fr: "Plateforme établie", en: "Established platform" }, { fr: "Nouvelle plateforme", en: "New platform" }],
      [{ fr: "Liens produits digitaux (Chariow, Maketou, Selar)", en: "Digital product links (Chariow, Maketou, Selar)" }, { fr: "Non présenté", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
    ],
    stillGoodFor: {
      fr: "YouCan reste un bon choix si tu vends surtout au Maroc ou en Afrique du Nord, si tu veux un outil déjà éprouvé par beaucoup de vendeurs COD, ou si tu as besoin dès aujourd'hui de plusieurs domaines personnalisés.",
      en: "YouCan is still a good choice if you mostly sell in Morocco or North Africa, want a tool already proven by many COD sellers, or need several custom domains today.",
    },
    migration: [
      {
        fr: "Pour chaque produit, colle l'URL de ta page YouCan dans Zuri : l'IA reprend les photos, le texte et le prix.",
        en: "For each product, paste the URL of your YouCan page into Zuri: the AI picks up photos, text and price.",
      },
      {
        fr: "Pour un gros catalogue, prépare un fichier CSV et utilise l'import CSV.",
        en: "For a large catalog, prepare a CSV file and use the CSV import.",
      },
      {
        fr: "Recrée tes packs, ton prix barré et ton compte à rebours, puis configure tes zones de livraison en FCFA.",
        en: "Recreate your bundles, strikethrough price and countdown, then set up your delivery zones in CFA francs.",
      },
      {
        fr: "Reconnecte ton pixel Facebook, l'API Conversions et TikTok, invite tes closers et change le lien de tes publicités.",
        en: "Reconnect your Facebook pixel, Conversions API and TikTok, invite your closers and switch the link in your ads.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à YouCan en Afrique ?", en: "What is the best YouCan alternative in Africa?" },
        a: {
          fr: "En Afrique de l'Ouest et centrale francophone, regarde surtout la gestion du Mobile Money et du FCFA. Zuri se connecte à FeexPay, FedaPay, PayDunya et PawaPay, sans commission sur tes ventes. Au Maroc, YouCan reste une référence locale.",
          en: "In French speaking West and Central Africa, focus on Mobile Money and CFA franc support. Zuri connects to FeexPay, FedaPay, PayDunya and PawaPay, with no commission on your sales. In Morocco, YouCan remains a local reference.",
        },
      },
      {
        q: { fr: "YouCan est-il gratuit ?", en: "Is YouCan free?" },
        a: {
          fr: "L'inscription est gratuite et la formule sans abonnement ne facture rien avant 5 000 $ de ventes. Ensuite, une commission s'applique (0,5 % sur le COD, 1 % en ligne, puis moins au-delà). Les abonnements commencent à 29 $ par mois.",
          en: "Sign up is free and the no subscription option charges nothing until $5,000 in sales. After that, a fee applies (0.5% on COD, 1% online, then less above). Subscriptions start at $29 per month.",
        },
      },
      {
        q: { fr: "YouCan fonctionne-t-il avec Mobile Money ?", en: "Does YouCan work with Mobile Money?" },
        a: {
          fr: "La page tarifs de YouCan ne présente pas de connexion Mobile Money pour l'Afrique de l'Ouest. Renseigne-toi auprès de leur support pour ton pays. Sur Zuri, le Mobile Money passe par ton propre compte chez un prestataire local.",
          en: "YouCan's pricing page does not present a Mobile Money connection for West Africa. Ask their support about your country. On Zuri, Mobile Money goes through your own account with a local provider.",
        },
      },
      {
        q: { fr: "Zuri prend-il une commission comme YouCan ?", en: "Does Zuri take a commission like YouCan?" },
        a: {
          fr: "Non, Zuri prend 0 % sur tes ventes. Seul ton prestataire de paiement facture ses frais habituels sur les paiements Mobile Money. Les commandes COD n'ont aucun frais Zuri.",
          en: "No, Zuri takes 0% of your sales. Only your payment provider charges its usual fees on Mobile Money payments. COD orders have no Zuri fees.",
        },
      },
      {
        q: { fr: "Zuri est-il aussi éprouvé que YouCan ?", en: "Is Zuri as proven as YouCan?" },
        a: {
          fr: "Soyons honnêtes : Zuri est nouveau sur le marché, YouCan existe depuis plus longtemps. Tu peux tester Zuri gratuitement en parallèle sur un produit avant de déplacer toute ta boutique.",
          en: "To be honest: Zuri is new on the market, and YouCan has been around longer. You can test Zuri for free on one product before moving your whole store.",
        },
      },
      {
        q: { fr: "Comment fonctionnent les closers sur Zuri ?", en: "How do closers work on Zuri?" },
        a: {
          fr: "Tu invites les membres de ton équipe comme closers. Chaque nouvelle commande COD est attribuée automatiquement à l'un d'eux, qui appelle le client, confirme l'adresse et met à jour le statut : confirmée, injoignable, annulée, expédiée, livrée ou retournée. Tu vois en temps réel ton taux de confirmation, ton taux de livraison et le chiffre réellement encaissé, ce qui t'aide à repérer un produit ou une publicité qui attire de mauvaises commandes.",
          en: "You invite your team members as closers. Each new COD order is automatically assigned to one of them, who calls the customer, confirms the address and updates the status: confirmed, unreachable, cancelled, shipped, delivered or returned. You see your confirmation rate, delivery rate and the revenue actually collected in real time, which helps you spot a product or an ad that brings in bad orders and fix it before you spend more.",
        },
      },
    ],
    sources: [SRC.youcanPricing, SRC.youcanTrustpilot],
  },
  // ----------------------------------------------------------- LIGHTFUNNELS
  {
    slug: "lightfunnels",
    competitor: "Lightfunnels",
    competitorUrl: "https://lightfunnels.com",
    title: {
      fr: "Alternative à Lightfunnels en Afrique : en français, FCFA et Mobile Money | Zuri",
      en: "Lightfunnels alternative for Africa: CFA francs and Mobile Money | Zuri",
    },
    description: {
      fr: "Lightfunnels crée des tunnels de vente COD efficaces, en anglais et en dollars. Zuri fait le même travail en français, en FCFA, avec Mobile Money et sans commission.",
      en: "Lightfunnels builds strong COD funnels in English and dollars. Zuri does the same job in French and English, in CFA francs, with Mobile Money and no commission.",
    },
    h1: {
      fr: "L'alternative à Lightfunnels en français, en FCFA et avec Mobile Money",
      en: "The Lightfunnels alternative in CFA francs, with Mobile Money",
    },
    intro: {
      fr: "Lightfunnels est un constructeur de tunnels de vente apprécié des vendeurs COD qui font de la publicité : pages produit rapides, upsells, et un forfait dédié au COD. C'est un outil sérieux. Pour un vendeur en Afrique francophone, quelques points comptent pourtant : l'interface est en anglais, les forfaits sont en dollars, et le paiement local doit passer par tes propres solutions. Zuri reprend la logique de la page de vente unique qui convertit, mais en français, en FCFA, avec Mobile Money et la gestion des closers incluse.",
      en: "Lightfunnels is a funnel builder popular with COD sellers who run ads: fast product pages, upsells and a plan dedicated to COD. It is a serious tool. For a seller in French speaking Africa, a few points still matter: the interface is in English, plans are in dollars, and local payment has to go through your own solutions. Zuri follows the same idea of a single sales page that converts, but in French, in CFA francs, with Mobile Money and closer management included.",
    },
    strengths: [
      {
        fr: "Un outil pensé pour les tunnels de vente et la publicité, avec un forfait spécial COD.",
        en: "A tool built for funnels and ads, with a dedicated COD plan.",
      },
      {
        fr: "Un essai gratuit de 30 jours, sans carte bancaire selon leur site.",
        en: "A 30 day free trial, with no card required according to their site.",
      },
      {
        fr: "Des frais COD bas : 0,20 % sur Newbie, 0,10 % sur Standard et 0 % sur le forfait COD.",
        en: "Low COD fees: 0.20% on Newbie, 0.10% on Standard and 0% on the COD plan.",
      },
      {
        fr: "Une plateforme connue dans la communauté e-commerce COD internationale.",
        en: "A well known platform in the international COD ecommerce community.",
      },
    ],
    limits: [
      {
        fr: "Des forfaits en dollars : Newbie à 9,99 $ par mois, Standard à 49,99 $ et COD à 99,99 $.",
        en: "Plans in dollars: Newbie at $9.99 per month, Standard at $49.99 and COD at $99.99.",
      },
      {
        fr: "Des frais sur les paiements en ligne : 1,5 % sur Newbie et 0,50 % sur Standard et COD, en plus des frais COD sur les petits forfaits.",
        en: "Fees on online payments: 1.5% on Newbie and 0.50% on Standard and COD, on top of COD fees on smaller plans.",
      },
      {
        fr: "La page tarifs est uniquement en anglais, sans option de langue visible.",
        en: "The pricing page is only in English, with no visible language option.",
      },
      {
        fr: "Une note Trustpilot de 3,4 sur 5 sur 79 avis en novembre 2026.",
        en: "A Trustpilot score of 3.4 out of 5 from 79 reviews in November 2026.",
      },
    ],
    compare: [
      [{ fr: "Prix de départ", en: "Starting price" }, { fr: "9,99 $/mois après 30 jours d'essai", en: "$9.99/month after a 30 day trial" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Frais sur le COD", en: "COD fees" }, { fr: "0,20 %, 0,10 % ou 0 % selon forfait", en: "0.20%, 0.10% or 0% by plan" }, { fr: "0 %", en: "0%" }],
      [{ fr: "Frais sur le paiement en ligne", en: "Online payment fees" }, { fr: "1,5 % ou 0,50 % selon forfait", en: "1.5% or 0.50% by plan" }, { fr: "0 % (frais de ton prestataire)", en: "0% (your provider's fees)" }],
      [{ fr: "Langue", en: "Language" }, { fr: "Anglais", en: "English" }, { fr: "Français et anglais", en: "French and English" }],
      [{ fr: "Devise des forfaits", en: "Plan currency" }, { fr: "Dollar", en: "US dollar" }, { fr: "FCFA, sans carte bancaire", en: "CFA francs, no bank card" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Non présenté sur la page tarifs", en: "Not presented on the pricing page" }, { fr: "FeexPay, FedaPay, PayDunya, PawaPay", en: "FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "Tunnels et upsells", en: "Funnels and upsells" }, { fr: "Point fort", en: "Core strength" }, { fr: "Packs et offres sur la page", en: "Bundles and offers on the page" }],
      [{ fr: "Closers et statuts COD", en: "Closers and COD statuses" }, { fr: "Non présenté sur la page tarifs", en: "Not presented on the pricing page" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Oui", en: "Yes" }, { fr: "Bientôt", en: "Coming soon" }],
    ],
    stillGoodFor: {
      fr: "Lightfunnels reste un bon choix si tu vends en anglais, sur plusieurs marchés internationaux, si tu construis des tunnels avec plusieurs étapes d'upsell, ou si tu fais assez de volume COD pour que le forfait à 99,99 $ sans frais soit rentable.",
      en: "Lightfunnels is still a good choice if you sell in English across several international markets, build funnels with several upsell steps, or do enough COD volume for the $99.99 no fee plan to pay off.",
    },
    migration: [
      {
        fr: "Colle l'URL de chaque page produit Lightfunnels dans Zuri : l'IA recrée la page de vente en français.",
        en: "Paste the URL of each Lightfunnels product page into Zuri: the AI rebuilds the sales page.",
      },
      {
        fr: "Ajoute tes packs et tes offres de quantité pour retrouver l'effet de tes upsells.",
        en: "Add your bundles and quantity offers to get the effect of your upsells back.",
      },
      {
        fr: "Reconnecte ton pixel Facebook, l'API Conversions et TikTok, puis branche ton compte de paiement local.",
        en: "Reconnect your Facebook pixel, Conversions API and TikTok, then connect your local payment account.",
      },
      {
        fr: "Teste une commande, invite tes closers, puis bascule tes publicités vers Zuri.",
        en: "Test an order, invite your closers, then switch your ads to Zuri.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Lightfunnels en Afrique ?", en: "What is the best Lightfunnels alternative in Africa?" },
        a: {
          fr: "Si tu vends en Afrique francophone avec du COD et du Mobile Money, Zuri te donne une page de vente rapide, la gestion des closers et le paiement local, en français et sans commission. Pour des tunnels multi-étapes en anglais, Lightfunnels reste solide.",
          en: "If you sell in French speaking Africa with COD and Mobile Money, Zuri gives you a fast sales page, closer management and local payments, with no commission. For multi step funnels in English, Lightfunnels is still solid.",
        },
      },
      {
        q: { fr: "Lightfunnels est-il gratuit ?", en: "Is Lightfunnels free?" },
        a: {
          fr: "Non, mais il propose 30 jours d'essai. Ensuite, le forfait le moins cher est à 9,99 $ par mois, avec 0,20 % de frais sur le COD et 1,5 % sur les paiements en ligne.",
          en: "No, but it offers a 30 day trial. After that, the cheapest plan is $9.99 per month, with a 0.20% COD fee and 1.5% on online payments.",
        },
      },
      {
        q: { fr: "Lightfunnels fonctionne-t-il avec Mobile Money ?", en: "Does Lightfunnels work with Mobile Money?" },
        a: {
          fr: "La page tarifs de Lightfunnels ne présente pas de solution Mobile Money. Sur Zuri, tes clients paient en Mobile Money via ton compte FeexPay, FedaPay, PayDunya ou PawaPay, et l'argent arrive chez toi.",
          en: "Lightfunnels' pricing page does not present a Mobile Money option. On Zuri, your customers pay with Mobile Money through your FeexPay, FedaPay, PayDunya or PawaPay account, and the money comes to you.",
        },
      },
      {
        q: { fr: "Mes pages Zuri seront-elles aussi rapides ?", en: "Will my Zuri pages be as fast?" },
        a: {
          fr: "Les pages Zuri sont conçues pour être très légères, avec environ 23 Ko de JavaScript, pour bien charger même en 3G. C'est important quand tes visiteurs viennent de la publicité sur mobile.",
          en: "Zuri pages are designed to be very light, with about 23 KB of JavaScript, so they load well even on 3G. That matters when your visitors come from mobile ads.",
        },
      },
      {
        q: { fr: "Comment fonctionnent les closers sur Zuri ?", en: "How do closers work on Zuri?" },
        a: {
          fr: "Tu invites les membres de ton équipe comme closers. Chaque nouvelle commande COD est attribuée automatiquement à l'un d'eux, qui appelle le client, confirme l'adresse et met à jour le statut : confirmée, injoignable, annulée, expédiée, livrée ou retournée. Tu vois en temps réel ton taux de confirmation, ton taux de livraison et le chiffre réellement encaissé, ce qui t'aide à repérer un produit ou une publicité qui attire de mauvaises commandes.",
          en: "You invite your team members as closers. Each new COD order is automatically assigned to one of them, who calls the customer, confirms the address and updates the status: confirmed, unreachable, cancelled, shipped, delivered or returned. You see your confirmation rate, delivery rate and the revenue actually collected in real time, which helps you spot a product or an ad that brings in bad orders and fix it before you spend more.",
        },
      },
    ],
    sources: [SRC.lfPricing, SRC.lfTrustpilot],
  },
  // --------------------------------------------------------------- EASYAFRIK
  {
    slug: "easyafrik",
    competitor: "EasyAfrik",
    competitorUrl: "https://easyafrik.com",
    title: {
      fr: "Alternative à EasyAfrik : COD, Mobile Money et closers, gratuit au lancement | Zuri",
      en: "EasyAfrik alternative: COD, Mobile Money and closers, free at launch | Zuri",
    },
    description: {
      fr: "EasyAfrik crée des pages COD avec l'IA, en FCFA. Zuri fait aussi l'import par IA, ajoute le Mobile Money via tes comptes et reste gratuit pendant le lancement.",
      en: "EasyAfrik builds COD pages with AI, in CFA francs. Zuri also imports with AI, adds Mobile Money through your accounts and is free during launch.",
    },
    h1: {
      fr: "L'alternative à EasyAfrik avec Mobile Money et closers inclus",
      en: "The EasyAfrik alternative with Mobile Money and closers included",
    },
    intro: {
      fr: "EasyAfrik est une plateforme africaine pensée pour le COD : tu colles le lien d'un produit AliExpress, Shopify ou YouCan et l'IA génère ta page avec photos, textes et avis. Les prix sont en FCFA, et les outils d'urgence sont là. C'est un concurrent sérieux et proche de Zuri. Les différences se jouent sur le prix, le paiement Mobile Money et la gestion de l'équipe de closers. Voici la comparaison, point par point.",
      en: "EasyAfrik is an African platform built for COD: you paste the link of an AliExpress, Shopify or YouCan product and the AI generates your page with photos, text and reviews. Prices are in CFA francs, and urgency tools are included. It is a serious competitor and close to Zuri. The differences are price, Mobile Money payments and managing your closer team. Here is the comparison, point by point.",
    },
    strengths: [
      {
        fr: "Une création de page par IA à partir d'un lien AliExpress, Shopify ou YouCan.",
        en: "AI page creation from an AliExpress, Shopify or YouCan link.",
      },
      {
        fr: "Des prix en FCFA, sans engagement, et 7 jours d'essai sans paiement.",
        en: "Prices in CFA francs, no commitment, and a 7 day trial with no payment.",
      },
      {
        fr: "Des outils d'urgence complets : minuteur, prix barré, alerte de stock bas, compteur de visiteurs, packs.",
        en: "Complete urgency tools: timer, strikethrough price, low stock alert, live visitor counter, bundles.",
      },
      {
        fr: "Un agent de commande sur Telegram et des commandes illimitées sur tous les forfaits.",
        en: "An order agent on Telegram and unlimited orders on every plan.",
      },
    ],
    limits: [
      {
        fr: "Un abonnement mensuel après l'essai : 8 900 FCFA (Starter, 1 boutique), 14 900 FCFA (Pro, 3 boutiques) ou 34 900 FCFA (Premium, 10 boutiques).",
        en: "A monthly subscription after the trial: 8,900 CFA francs (Starter, 1 store), 14,900 (Pro, 3 stores) or 34,900 (Premium, 10 stores).",
      },
      {
        fr: "La page d'accueil présente le COD comme un paiement en espèces à la réception et ne mentionne pas le Mobile Money.",
        en: "The home page presents COD as cash payment on delivery and does not mention Mobile Money.",
      },
      {
        fr: "Le Studio IA est limité selon le forfait : 5 pages par mois sur Pro, 30 sur Premium.",
        en: "The AI Studio is limited by plan: 5 pages per month on Pro, 30 on Premium.",
      },
    ],
    compare: [
      [{ fr: "Prix", en: "Price" }, { fr: "8 900 à 34 900 FCFA/mois", en: "8,900 to 34,900 CFA francs/month" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Essai", en: "Trial" }, { fr: "7 jours", en: "7 days" }, { fr: "Pas besoin, gratuit au lancement", en: "Not needed, free at launch" }],
      [{ fr: "Création de page par IA", en: "AI page creation" }, { fr: "Oui, quota selon forfait", en: "Yes, quota by plan" }, { fr: "Oui, import par URL", en: "Yes, import by URL" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Non mentionné sur la page d'accueil", en: "Not mentioned on the home page" }, { fr: "FeexPay, FedaPay, PayDunya, PawaPay", en: "FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "Outils d'urgence", en: "Urgency tools" }, { fr: "Oui", en: "Yes" }, { fr: "Oui, avec popup des ventes réelles", en: "Yes, with real sales popup" }],
      [{ fr: "Closers avec attribution automatique", en: "Closers with automatic assignment" }, { fr: "Membres d'équipe (3 à illimité)", en: "Team members (3 to unlimited)" }, { fr: "Inclus, attribution automatique", en: "Included, automatic assignment" }],
      [{ fr: "Notifications de commande", en: "Order notifications" }, { fr: "Telegram", en: "Telegram" }, { fr: "Notifications avec son, WhatsApp", en: "Sound notifications, WhatsApp" }],
      [{ fr: "Multi-boutiques", en: "Multiple stores" }, { fr: "1, 3 ou 10 selon forfait", en: "1, 3 or 10 by plan" }, { fr: "Oui", en: "Yes" }],
      [{ fr: "Produits digitaux", en: "Digital products" }, { fr: "Non présenté", en: "Not presented" }, { fr: "Oui, et liens Chariow, Maketou, Selar", en: "Yes, plus Chariow, Maketou, Selar links" }],
      [{ fr: "Commission", en: "Commission" }, { fr: "Non mentionnée", en: "Not mentioned" }, { fr: "0 %", en: "0%" }],
    ],
    stillGoodFor: {
      fr: "EasyAfrik reste un bon choix si tu aimes piloter tes commandes depuis Telegram, si tu veux un Studio IA qui génère aussi les avis et les textes complets, ou si tu préfères une plateforme qui a déjà une base d'utilisateurs en Afrique.",
      en: "EasyAfrik is still a good choice if you like managing orders from Telegram, want an AI Studio that also generates reviews and full copy, or prefer a platform that already has a user base in Africa.",
    },
    migration: [
      {
        fr: "Colle l'URL de ta page EasyAfrik (ou du produit AliExpress d'origine) dans Zuri : l'IA recrée la page.",
        en: "Paste the URL of your EasyAfrik page (or the original AliExpress product) into Zuri: the AI rebuilds the page.",
      },
      {
        fr: "Réactive tes outils d'urgence : compte à rebours, stock limité, prix barré, packs.",
        en: "Turn your urgency tools back on: countdown, low stock, strikethrough price, bundles.",
      },
      {
        fr: "Branche ton compte Mobile Money, ajoute tes zones de livraison et invite tes closers.",
        en: "Connect your Mobile Money account, add your delivery zones and invite your closers.",
      },
      {
        fr: "Reconnecte tes pixels Facebook et TikTok, puis change le lien de tes publicités.",
        en: "Reconnect your Facebook and TikTok pixels, then switch the link in your ads.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à EasyAfrik ?", en: "What is the best EasyAfrik alternative?" },
        a: {
          fr: "Si tu veux le même type de page COD rapide en FCFA, mais avec le Mobile Money et la gestion des closers inclus, Zuri est une option directe, gratuite pendant le lancement. Teste les deux sur un produit et compare tes taux de confirmation.",
          en: "If you want the same kind of fast COD page in CFA francs, but with Mobile Money and closer management included, Zuri is a direct option, free during launch. Test both on one product and compare your confirmation rates.",
        },
      },
      {
        q: { fr: "EasyAfrik est-il gratuit ?", en: "Is EasyAfrik free?" },
        a: {
          fr: "EasyAfrik propose 7 jours d'essai sans paiement, puis un abonnement à partir de 8 900 FCFA par mois.",
          en: "EasyAfrik offers a 7 day trial with no payment, then a subscription from 8,900 CFA francs per month.",
        },
      },
      {
        q: { fr: "EasyAfrik fonctionne-t-il avec Mobile Money ?", en: "Does EasyAfrik work with Mobile Money?" },
        a: {
          fr: "Sa page d'accueil présente le paiement à la livraison en espèces et ne parle pas de Mobile Money. Demande à leur équipe si c'est prévu. Sur Zuri, tes clients peuvent payer en Mobile Money via ton propre compte de paiement.",
          en: "Its home page presents cash on delivery and does not mention Mobile Money. Ask their team if it is planned. On Zuri, your customers can pay with Mobile Money through your own payment account.",
        },
      },
      {
        q: { fr: "Zuri crée-t-il aussi les pages avec l'IA ?", en: "Does Zuri also build pages with AI?" },
        a: {
          fr: "Oui. Tu colles l'URL d'un produit et l'IA de Zuri prépare la page de vente, que tu peux ensuite modifier. Tu peux aussi importer un fichier CSV ou un export Shopify.",
          en: "Yes. You paste a product URL and Zuri's AI prepares the sales page, which you can then edit. You can also import a CSV file or a Shopify export.",
        },
      },
      {
        q: { fr: "Combien coûte vraiment Zuri ?", en: "How much does Zuri really cost?" },
        a: {
          fr: "Zuri est gratuit pendant la phase de lancement, sans carte bancaire et sans commission sur tes ventes. Les commandes en paiement à la livraison n'ont aucun frais Zuri. Pour les paiements Mobile Money, seul ton prestataire (FeexPay, FedaPay, PayDunya ou PawaPay) prend ses frais habituels, que tu retrouves dans ton contrat avec lui. Zuri ne touche jamais ton argent : il arrive directement sur ton compte.",
          en: "Zuri is free during its launch phase, with no bank card and no commission on your sales. Cash on delivery orders have no Zuri fees. For Mobile Money payments, only your provider (FeexPay, FedaPay, PayDunya or PawaPay) takes its usual fees, as set in your contract with them. Zuri never touches your money: it goes straight to your account, and you can follow what you actually collected in your dashboard.",
        },
      },
      {
        q: { fr: "Quelles sont les limites de Zuri aujourd'hui ?", en: "What are Zuri's limits today?" },
        a: {
          fr: "Soyons transparents : Zuri est nouveau sur le marché, le domaine personnalisé arrive bientôt, il n'y a pas d'application mobile native (le tableau de bord fonctionne très bien sur le navigateur du téléphone) et Zuri ne propose pas de marketplace de produits gagnants. Si l'un de ces points est bloquant pour toi, garde ton outil actuel et teste Zuri sur un seul produit.",
          en: "To be transparent: Zuri is new on the market, custom domains are coming soon, there is no native mobile app (the dashboard works well in your phone's browser) and Zuri does not offer a marketplace of winning products. If one of these points is a deal breaker for you, keep your current tool and test Zuri on a single product first, then decide with your own numbers.",
        },
      },
    ],
    sources: [SRC.easyafrik],
  },
  // ----------------------------------------------------------------- SELIKA
  {
    slug: "selika",
    competitor: "Selika",
    competitorUrl: "https://selika.io",
    title: {
      fr: "Alternative à Selika : pages de vente COD, Mobile Money et closers | Zuri",
      en: "Selika alternative: COD sales pages, Mobile Money and closers | Zuri",
    },
    description: {
      fr: "Selika propose une boutique en FCFA avec gestion des livreurs. Zuri mise sur des pages de vente qui convertissent, le Mobile Money et les closers, sans limite de produits.",
      en: "Selika offers a store in CFA francs with delivery driver management. Zuri focuses on converting sales pages, Mobile Money and closers, with no product limit.",
    },
    h1: {
      fr: "L'alternative à Selika pour vendre avec des pages qui convertissent",
      en: "The Selika alternative for selling with pages that convert",
    },
    intro: {
      fr: "Selika est une plateforme e-commerce pensée pour les marchés qui utilisent le FCFA. Son point fort : la livraison intégrée, avec un rôle « livreur », l'attribution des colis et le suivi des statuts. Elle propose aussi un forfait gratuit. Zuri vise un besoin un peu différent : la page de vente produit, poussée en publicité, qui transforme un visiteur en commande COD, puis l'équipe de closers qui confirme. Les deux outils peuvent convenir à un vendeur africain, selon ce qui compte le plus pour toi.",
      en: "Selika is an ecommerce platform designed for markets that use the CFA franc. Its strength is built in delivery management, with a \"driver\" role, parcel assignment and status tracking. It also has a free plan. Zuri targets a slightly different need: the product sales page, pushed with ads, that turns a visitor into a COD order, then the closer team that confirms it. Both tools can suit an African seller, depending on what matters most to you.",
    },
    strengths: [
      {
        fr: "Un forfait gratuit avec une boutique complète et un sous-domaine selika.io.",
        en: "A free plan with a complete store and a selika.io subdomain.",
      },
      {
        fr: "Une gestion de la livraison intégrée : attribution des livreurs, suivi de chaque colis, rôle dédié au livreur.",
        en: "Built in delivery management: driver assignment, tracking of each parcel and a dedicated driver role.",
      },
      {
        fr: "Des prix et paiements adaptés aux marchés du FCFA, et un seul abonnement pour toutes tes boutiques.",
        en: "Prices and payments adapted to CFA franc markets, and one subscription for all your stores.",
      },
      {
        fr: "Le domaine personnalisé disponible sur le forfait Pro.",
        en: "Custom domain available on the Pro plan.",
      },
    ],
    limits: [
      {
        fr: "Le forfait gratuit est limité à 50 produits.",
        en: "The free plan is limited to 50 products.",
      },
      {
        fr: "Le domaine personnalisé, les statistiques avancées et le multi-utilisateur demandent le forfait Pro à 15 000 FCFA par mois.",
        en: "Custom domain, advanced analytics and multiple users require the Pro plan at 15,000 CFA francs per month.",
      },
      {
        fr: "La page d'accueil ne cite pas de prestataire Mobile Money précis.",
        en: "The home page does not name a specific Mobile Money provider.",
      },
      {
        fr: "Les outils de conversion pour la publicité (compte à rebours, popup des ventes, packs, API Conversions) ne sont pas présentés sur la page d'accueil.",
        en: "Conversion tools for ads (countdown, sales popup, bundles, Conversions API) are not presented on the home page.",
      },
    ],
    compare: [
      [{ fr: "Prix", en: "Price" }, { fr: "Gratuit ou Pro à 15 000 FCFA/mois", en: "Free or Pro at 15,000 CFA francs/month" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Nombre de produits", en: "Number of products" }, { fr: "50 en gratuit, illimité en Pro", en: "50 on free, unlimited on Pro" }, { fr: "Illimité", en: "Unlimited" }],
      [{ fr: "Gestion des livreurs", en: "Driver management" }, { fr: "Point fort, intégrée", en: "Core strength, built in" }, { fr: "Zones de livraison et statuts COD", en: "Delivery zones and COD statuses" }],
      [{ fr: "Closers avec attribution automatique", en: "Closers with automatic assignment" }, { fr: "Multi-utilisateur en Pro", en: "Multiple users on Pro" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Prestataire non précisé sur la page", en: "Provider not named on the page" }, { fr: "FeexPay, FedaPay, PayDunya, PawaPay", en: "FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "Compte à rebours, popup des ventes, packs", en: "Countdown, sales popup, bundles" }, { fr: "Non présentés", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Pixel Facebook, API Conversions, TikTok", en: "Facebook pixel, Conversions API, TikTok" }, { fr: "Non présentés", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Import par URL avec IA", en: "AI import by URL" }, { fr: "Non présenté", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Oui, en Pro", en: "Yes, on Pro" }, { fr: "Bientôt", en: "Coming soon" }],
    ],
    stillGoodFor: {
      fr: "Selika reste un bon choix si tu gères tes propres livreurs et veux suivre chaque colis dans le même outil, si tu as un petit catalogue de moins de 50 produits, ou si tu as besoin d'un domaine personnalisé dès maintenant.",
      en: "Selika is still a good choice if you manage your own drivers and want to track each parcel in the same tool, have a small catalog under 50 products, or need a custom domain right now.",
    },
    migration: [
      {
        fr: "Colle l'URL de tes pages produit Selika dans Zuri pour que l'IA recrée chaque page de vente.",
        en: "Paste your Selika product page URLs into Zuri so the AI rebuilds each sales page.",
      },
      {
        fr: "Pour un catalogue plus large, prépare un fichier CSV et importe-le.",
        en: "For a larger catalog, prepare a CSV file and import it.",
      },
      {
        fr: "Configure tes zones de livraison et tes frais, puis invite tes closers.",
        en: "Set up your delivery zones and fees, then invite your closers.",
      },
      {
        fr: "Ajoute ton pixel Facebook, l'API Conversions et TikTok, branche ton compte Mobile Money et lance ta publicité.",
        en: "Add your Facebook pixel, Conversions API and TikTok, connect your Mobile Money account and launch your ads.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Selika ?", en: "What is the best Selika alternative?" },
        a: {
          fr: "Si ta priorité est la conversion de tes publicités et la confirmation des commandes COD par des closers, Zuri est pensé pour ça. Si ta priorité est le suivi de tes propres livreurs, Selika est très adapté.",
          en: "If your priority is converting your ads and confirming COD orders with closers, Zuri is built for that. If your priority is tracking your own drivers, Selika fits very well.",
        },
      },
      {
        q: { fr: "Selika est-il gratuit ?", en: "Is Selika free?" },
        a: {
          fr: "Oui, Selika a un forfait gratuit limité à 50 produits avec un sous-domaine selika.io. Le forfait Pro coûte 15 000 FCFA par mois.",
          en: "Yes, Selika has a free plan limited to 50 products with a selika.io subdomain. The Pro plan costs 15,000 CFA francs per month.",
        },
      },
      {
        q: { fr: "Selika fonctionne-t-il avec Mobile Money ?", en: "Does Selika work with Mobile Money?" },
        a: {
          fr: "Selika indique des paiements adaptés aux marchés du FCFA, sans citer de prestataire précis sur sa page d'accueil. Sur Zuri, tu connectes ton propre compte FeexPay, FedaPay, PayDunya ou PawaPay.",
          en: "Selika says its payments are adapted to CFA franc markets, without naming a provider on its home page. On Zuri, you connect your own FeexPay, FedaPay, PayDunya or PawaPay account.",
        },
      },
      {
        q: { fr: "Zuri gère-t-il les livreurs ?", en: "Does Zuri manage drivers?" },
        a: {
          fr: "Zuri gère les zones de livraison, les frais et les statuts COD (confirmée, expédiée, livrée, retournée), avec ton taux de livraison. Il n'a pas d'application dédiée aux livreurs comme Selika.",
          en: "Zuri manages delivery zones, fees and COD statuses (confirmed, shipped, delivered, returned), with your delivery rate. It does not have a dedicated driver role like Selika.",
        },
      },
      {
        q: { fr: "Combien coûte vraiment Zuri ?", en: "How much does Zuri really cost?" },
        a: {
          fr: "Zuri est gratuit pendant la phase de lancement, sans carte bancaire et sans commission sur tes ventes. Les commandes en paiement à la livraison n'ont aucun frais Zuri. Pour les paiements Mobile Money, seul ton prestataire (FeexPay, FedaPay, PayDunya ou PawaPay) prend ses frais habituels, que tu retrouves dans ton contrat avec lui. Zuri ne touche jamais ton argent : il arrive directement sur ton compte.",
          en: "Zuri is free during its launch phase, with no bank card and no commission on your sales. Cash on delivery orders have no Zuri fees. For Mobile Money payments, only your provider (FeexPay, FedaPay, PayDunya or PawaPay) takes its usual fees, as set in your contract with them. Zuri never touches your money: it goes straight to your account, and you can follow what you actually collected in your dashboard.",
        },
      },
      {
        q: { fr: "Quelles sont les limites de Zuri aujourd'hui ?", en: "What are Zuri's limits today?" },
        a: {
          fr: "Soyons transparents : Zuri est nouveau sur le marché, le domaine personnalisé arrive bientôt, il n'y a pas d'application mobile native (le tableau de bord fonctionne très bien sur le navigateur du téléphone) et Zuri ne propose pas de marketplace de produits gagnants. Si l'un de ces points est bloquant pour toi, garde ton outil actuel et teste Zuri sur un seul produit.",
          en: "To be transparent: Zuri is new on the market, custom domains are coming soon, there is no native mobile app (the dashboard works well in your phone's browser) and Zuri does not offer a marketplace of winning products. If one of these points is a deal breaker for you, keep your current tool and test Zuri on a single product first, then decide with your own numbers.",
        },
      },
    ],
    sources: [SRC.selika],
  },
  // ---------------------------------------------------------------- OWASHOP
  {
    slug: "owashop",
    competitor: "OwaShop",
    competitorUrl: "https://owashop.com",
    title: {
      fr: "Alternative à OwaShop : COD, Mobile Money et closers en FCFA | Zuri",
      en: "OwaShop alternative: COD, Mobile Money and closers in CFA francs | Zuri",
    },
    description: {
      fr: "OwaShop propose une boutique COD avec WhatsApp et pixel Meta à 10,99 $ par boutique. Zuri inclut les closers, le Mobile Money et le multi-boutiques, gratuit au lancement.",
      en: "OwaShop offers a COD store with WhatsApp and Meta pixel at $10.99 per store. Zuri includes closers, Mobile Money and multiple stores, free at launch.",
    },
    h1: {
      fr: "L'alternative à OwaShop avec closers et Mobile Money inclus",
      en: "The OwaShop alternative with closers and Mobile Money included",
    },
    intro: {
      fr: "OwaShop est une plateforme pour créer une boutique en ligne avec paiement à la livraison, notifications WhatsApp et pixel Meta. Son modèle est simple : un prix par boutique, avec une longue période gratuite pour la première. C'est une option accessible pour démarrer. Zuri va plus loin sur la partie COD (closers, statuts, taux de confirmation) et sur le Mobile Money via tes propres comptes. Voici les différences, avec les chiffres de leur site.",
      en: "OwaShop is a platform to build an online store with cash on delivery, WhatsApp notifications and Meta pixel. Its model is simple: one price per store, with a long free period for the first one. It is an accessible option to get started. Zuri goes further on COD (closers, statuses, confirmation rate) and on Mobile Money through your own accounts. Here are the differences, with the figures from their site.",
    },
    strengths: [
      {
        fr: "Une première boutique gratuite jusqu'à 1 an, 10 ventes ou 85 $ de ventes cumulées.",
        en: "A first store free for up to 1 year, 10 sales or $85 in total sales.",
      },
      {
        fr: "Le paiement à la livraison, les notifications et campagnes WhatsApp et le pixel Meta inclus.",
        en: "Cash on delivery, WhatsApp notifications and campaigns, and Meta pixel included.",
      },
      {
        fr: "Une seule formule, facile à comprendre, avec des boutiques illimitées.",
        en: "A single plan, easy to understand, with unlimited stores.",
      },
    ],
    limits: [
      {
        fr: "La période gratuite s'arrête dès que l'une des limites est atteinte : 1 an, 10 ventes ou 85 $ de ventes. Pour un vendeur qui fait de la publicité, 10 ventes peuvent arriver très vite.",
        en: "The free period ends as soon as one limit is reached: 1 year, 10 sales or $85 in sales. For a seller running ads, 10 sales can come very quickly.",
      },
      {
        fr: "Ensuite, 10,99 $ par mois et par boutique, facturés automatiquement : 3 boutiques coûtent environ 33 $ par mois.",
        en: "After that, $10.99 per month per store, billed automatically: 3 stores cost about $33 per month.",
      },
      {
        fr: "Le Mobile Money apparaît comme logo partenaire, mais n'est pas listé comme fonction de la formule.",
        en: "Mobile Money appears as a partner logo but is not listed as a plan feature.",
      },
      {
        fr: "La gestion des closers (attribution, statuts COD, taux de confirmation) n'est pas présentée sur la page d'accueil.",
        en: "Closer management (assignment, COD statuses, confirmation rate) is not presented on the home page.",
      },
    ],
    compare: [
      [{ fr: "Prix", en: "Price" }, { fr: "10,99 $/mois par boutique", en: "$10.99/month per store" }, { fr: "Gratuit pendant le lancement", en: "Free during launch" }],
      [{ fr: "Période gratuite", en: "Free period" }, { fr: "1 an, 10 ventes ou 85 $ de ventes", en: "1 year, 10 sales or $85 in sales" }, { fr: "Toute la phase de lancement, sans limite de ventes", en: "The whole launch phase, no sales limit" }],
      [{ fr: "Multi-boutiques", en: "Multiple stores" }, { fr: "Oui, chacune payante", en: "Yes, each one paid" }, { fr: "Oui, inclus", en: "Yes, included" }],
      [{ fr: "Paiement à la livraison", en: "Cash on delivery" }, { fr: "Oui", en: "Yes" }, { fr: "Oui, formulaire personnalisable", en: "Yes, customizable form" }],
      [{ fr: "Closers et statuts COD", en: "Closers and COD statuses" }, { fr: "Non présentés", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Logo partenaire, pas listé en fonction", en: "Partner logo, not listed as a feature" }, { fr: "FeexPay, FedaPay, PayDunya, PawaPay", en: "FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "WhatsApp", en: "WhatsApp" }, { fr: "Notifications et campagnes", en: "Notifications and campaigns" }, { fr: "Bouton WhatsApp et relance", en: "WhatsApp button and follow up" }],
      [{ fr: "Pixels publicitaires", en: "Ad pixels" }, { fr: "Pixel Meta", en: "Meta pixel" }, { fr: "Pixel Facebook, API Conversions, TikTok", en: "Facebook pixel, Conversions API, TikTok" }],
      [{ fr: "Compte à rebours, packs, popup des ventes", en: "Countdown, bundles, sales popup" }, { fr: "Non présentés", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Facturation", en: "Billing" }, { fr: "En dollars", en: "In dollars" }, { fr: "En FCFA, sans carte bancaire", en: "In CFA francs, no bank card" }],
    ],
    stillGoodFor: {
      fr: "OwaShop reste un bon choix si tu veux une boutique simple avec des campagnes WhatsApp intégrées, si tu vends peu au début et profites de la première année gratuite, ou si tu n'as besoin que d'une seule boutique.",
      en: "OwaShop is still a good choice if you want a simple store with built in WhatsApp campaigns, sell little at first and benefit from the free first year, or only need one store.",
    },
    migration: [
      {
        fr: "Colle l'URL de tes pages produit OwaShop dans Zuri : l'IA recrée les pages de vente.",
        en: "Paste your OwaShop product page URLs into Zuri: the AI rebuilds the sales pages.",
      },
      {
        fr: "Personnalise ton formulaire COD et ajoute packs, compte à rebours et garantie.",
        en: "Customize your COD form and add bundles, countdown and guarantee.",
      },
      {
        fr: "Reconnecte ton pixel Meta, ajoute l'API Conversions et TikTok, et branche ton compte Mobile Money.",
        en: "Reconnect your Meta pixel, add Conversions API and TikTok, and connect your Mobile Money account.",
      },
      {
        fr: "Invite tes closers, teste une commande et change le lien de tes publicités.",
        en: "Invite your closers, test an order and switch the link in your ads.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à OwaShop ?", en: "What is the best OwaShop alternative?" },
        a: {
          fr: "Si tu fais déjà plus de 10 ventes par mois ou si tu as plusieurs boutiques, Zuri t'évite de payer par boutique pendant le lancement et ajoute la gestion des closers et le Mobile Money.",
          en: "If you already make more than 10 sales a month or run several stores, Zuri saves you from paying per store during launch and adds closer management and Mobile Money.",
        },
      },
      {
        q: { fr: "OwaShop est-il gratuit ?", en: "Is OwaShop free?" },
        a: {
          fr: "La première boutique est gratuite jusqu'à 1 an, 10 ventes ou 85 $ de ventes cumulées, selon la limite atteinte en premier. Ensuite, c'est 10,99 $ par mois et par boutique.",
          en: "The first store is free for up to 1 year, 10 sales or $85 in total sales, whichever comes first. After that, it is $10.99 per month per store.",
        },
      },
      {
        q: { fr: "OwaShop fonctionne-t-il avec Mobile Money ?", en: "Does OwaShop work with Mobile Money?" },
        a: {
          fr: "Le Mobile Money apparaît parmi les logos partenaires d'OwaShop, mais pas dans la liste des fonctions. Vérifie avec eux pour ton pays. Sur Zuri, tu connectes ton propre compte de paiement Mobile Money.",
          en: "Mobile Money appears among OwaShop's partner logos, but not in the feature list. Check with them for your country. On Zuri, you connect your own Mobile Money payment account.",
        },
      },
      {
        q: { fr: "Zuri envoie-t-il des notifications de commande ?", en: "Does Zuri send order notifications?" },
        a: {
          fr: "Oui. Tu reçois une notification avec son à chaque commande, et ton client peut te contacter sur WhatsApp depuis la page.",
          en: "Yes. You get a sound notification for each order, and your customer can reach you on WhatsApp from the page.",
        },
      },
      {
        q: { fr: "Comment fonctionnent les closers sur Zuri ?", en: "How do closers work on Zuri?" },
        a: {
          fr: "Tu invites les membres de ton équipe comme closers. Chaque nouvelle commande COD est attribuée automatiquement à l'un d'eux, qui appelle le client, confirme l'adresse et met à jour le statut : confirmée, injoignable, annulée, expédiée, livrée ou retournée. Tu vois en temps réel ton taux de confirmation, ton taux de livraison et le chiffre réellement encaissé, ce qui t'aide à repérer un produit ou une publicité qui attire de mauvaises commandes.",
          en: "You invite your team members as closers. Each new COD order is automatically assigned to one of them, who calls the customer, confirms the address and updates the status: confirmed, unreachable, cancelled, shipped, delivered or returned. You see your confirmation rate, delivery rate and the revenue actually collected in real time, which helps you spot a product or an ad that brings in bad orders and fix it before you spend more.",
        },
      },
      {
        q: { fr: "Quelles sont les limites de Zuri aujourd'hui ?", en: "What are Zuri's limits today?" },
        a: {
          fr: "Soyons transparents : Zuri est nouveau sur le marché, le domaine personnalisé arrive bientôt, il n'y a pas d'application mobile native (le tableau de bord fonctionne très bien sur le navigateur du téléphone) et Zuri ne propose pas de marketplace de produits gagnants. Si l'un de ces points est bloquant pour toi, garde ton outil actuel et teste Zuri sur un seul produit.",
          en: "To be transparent: Zuri is new on the market, custom domains are coming soon, there is no native mobile app (the dashboard works well in your phone's browser) and Zuri does not offer a marketplace of winning products. If one of these points is a deal breaker for you, keep your current tool and test Zuri on a single product first, then decide with your own numbers.",
        },
      },
    ],
    sources: [SRC.owashop],
  },
  // --------------------------------------------------------------- STOREINO
  {
    slug: "storeino",
    competitor: "Storeino",
    competitorUrl: "https://storeino.com",
    title: {
      fr: "Alternative à Storeino en Afrique de l'Ouest : FCFA et Mobile Money | Zuri",
      en: "Storeino alternative for West Africa: CFA francs and Mobile Money | Zuri",
    },
    description: {
      fr: "Storeino est une plateforme COD marocaine avec forfait gratuit et outils anti fausses commandes. Zuri cible l'Afrique francophone avec Mobile Money et closers inclus.",
      en: "Storeino is a Moroccan COD platform with a free plan and fake order protection. Zuri targets French speaking Africa with Mobile Money and closers included.",
    },
    h1: {
      fr: "L'alternative à Storeino pour le COD et le Mobile Money en FCFA",
      en: "The Storeino alternative for COD and Mobile Money in CFA francs",
    },
    intro: {
      fr: "Storeino est une plateforme e-commerce basée à Agadir, au Maroc, pensée pour le paiement à la livraison. Elle propose un forfait gratuit, un constructeur de landing pages avec IA sur le forfait Pro et une option pour bannir les faux clients. C'est un outil sérieux pour le COD au Maghreb. Si tu vends en Afrique de l'Ouest ou centrale, regarde surtout le paiement Mobile Money, la devise et la gestion des closers.",
      en: "Storeino is an ecommerce platform based in Agadir, Morocco, built for cash on delivery. It offers a free plan, an AI landing page builder on the Pro plan and an option to ban fake customers. It is a serious tool for COD in North Africa. If you sell in West or Central Africa, look mainly at Mobile Money payments, currency and closer management.",
    },
    strengths: [
      {
        fr: "Un forfait gratuit avec visiteurs illimités.",
        en: "A free plan with unlimited visitors.",
      },
      {
        fr: "Une fonction pour bannir les faux clients et un paiement sécurisé.",
        en: "A feature to ban fake customers and a secure checkout.",
      },
      {
        fr: "Une API pour les sociétés de livraison et la synchronisation automatique.",
        en: "An API for shipping companies and automatic syncing.",
      },
      {
        fr: "Un constructeur de landing pages avec IA sur le forfait Pro, et 0 % de frais par commande sur les forfaits payants.",
        en: "An AI landing page builder on the Pro plan, and 0% order fees on paid plans.",
      },
    ],
    limits: [
      {
        fr: "Le forfait gratuit prend 0,3 % par commande et limite les variantes de produit.",
        en: "The free plan takes 0.3% per order and limits product variants.",
      },
      {
        fr: "Les forfaits payants sont en dollars : Startup à 16,99 $ (100 produits), Pro à 39 $ (1 000 produits), Business à 89 $ par mois.",
        en: "Paid plans are in dollars: Startup at $16.99 (100 products), Pro at $39 (1,000 products), Business at $89 per month.",
      },
      {
        fr: "L'essai de 14 jours demande une carte bancaire ou un compte PayPal à l'inscription.",
        en: "The 14 day trial requires a bank card or PayPal account at sign up.",
      },
      {
        fr: "La page tarifs indique que les moyens de paiement dépendent du pays, sans citer de solution Mobile Money pour l'Afrique de l'Ouest.",
        en: "The pricing page says payment options depend on the country, without naming a Mobile Money option for West Africa.",
      },
    ],
    compare: [
      [{ fr: "Prix de départ", en: "Starting price" }, { fr: "Gratuit (0,3 % par commande)", en: "Free (0.3% per order)" }, { fr: "Gratuit pendant le lancement, 0 %", en: "Free during launch, 0%" }],
      [{ fr: "Forfaits payants", en: "Paid plans" }, { fr: "16,99 $, 39 $, 89 $/mois", en: "$16.99, $39, $89/month" }, { fr: "Aucun pendant le lancement", en: "None during launch" }],
      [{ fr: "Limite de produits", en: "Product limit" }, { fr: "100 ou 1 000 selon forfait, illimité en Business", en: "100 or 1,000 by plan, unlimited on Business" }, { fr: "Illimité", en: "Unlimited" }],
      [{ fr: "Inscription", en: "Sign up" }, { fr: "Carte ou PayPal pour l'essai", en: "Card or PayPal for the trial" }, { fr: "Sans carte bancaire", en: "No bank card" }],
      [{ fr: "Mobile Money Afrique de l'Ouest", en: "West Africa Mobile Money" }, { fr: "Non cité sur la page tarifs", en: "Not named on the pricing page" }, { fr: "FeexPay, FedaPay, PayDunya, PawaPay", en: "FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "Anti fausses commandes", en: "Fake order protection" }, { fr: "Bannir les faux clients", en: "Ban fake customers" }, { fr: "Confirmation par closers et statuts", en: "Closer confirmation and statuses" }],
      [{ fr: "Sociétés de livraison", en: "Shipping companies" }, { fr: "API transporteurs", en: "Carrier API" }, { fr: "Zones et frais de livraison", en: "Delivery zones and fees" }],
      [{ fr: "Landing page avec IA", en: "AI landing page" }, { fr: "Forfait Pro", en: "Pro plan" }, { fr: "Import par URL avec IA, inclus", en: "AI import by URL, included" }],
      [{ fr: "Closers avec attribution automatique", en: "Closers with automatic assignment" }, { fr: "Non présenté", en: "Not presented" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Oui", en: "Yes" }, { fr: "Bientôt", en: "Coming soon" }],
    ],
    stillGoodFor: {
      fr: "Storeino reste un bon choix si tu vends au Maroc et que tes transporteurs y sont connectés, si tu veux un forfait gratuit sans durée limitée, ou si tu as besoin d'un gestionnaire de compte dédié avec le forfait Business.",
      en: "Storeino is still a good choice if you sell in Morocco and your carriers are connected there, want a free plan with no time limit, or need a dedicated account manager with the Business plan.",
    },
    migration: [
      {
        fr: "Colle l'URL de tes pages produit Storeino dans Zuri pour que l'IA les recrée.",
        en: "Paste your Storeino product page URLs into Zuri so the AI rebuilds them.",
      },
      {
        fr: "Pour un catalogue plus grand, utilise l'import CSV.",
        en: "For a bigger catalog, use the CSV import.",
      },
      {
        fr: "Configure tes zones de livraison en FCFA, ton formulaire COD et ton compte Mobile Money.",
        en: "Set up your delivery zones in CFA francs, your COD form and your Mobile Money account.",
      },
      {
        fr: "Reconnecte tes pixels, invite tes closers et redirige tes publicités.",
        en: "Reconnect your pixels, invite your closers and redirect your ads.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Storeino en Afrique ?", en: "What is the best Storeino alternative in Africa?" },
        a: {
          fr: "En Afrique de l'Ouest et centrale, Zuri est une option adaptée : paiement Mobile Money via des prestataires locaux, prix en FCFA, closers inclus et 0 % de commission. Au Maroc, Storeino reste très pertinent.",
          en: "In West and Central Africa, Zuri is a good fit: Mobile Money through local providers, prices in CFA francs, closers included and 0% commission. In Morocco, Storeino remains very relevant.",
        },
      },
      {
        q: { fr: "Storeino est-il gratuit ?", en: "Is Storeino free?" },
        a: {
          fr: "Oui, Storeino a un forfait gratuit, avec 0,3 % de frais par commande. Les forfaits payants commencent à 16,99 $ par mois, sans frais par commande.",
          en: "Yes, Storeino has a free plan, with a 0.3% fee per order. Paid plans start at $16.99 per month, with no order fee.",
        },
      },
      {
        q: { fr: "Storeino fonctionne-t-il avec Mobile Money ?", en: "Does Storeino work with Mobile Money?" },
        a: {
          fr: "La page tarifs indique que les moyens de paiement dépendent de ton pays, sans citer de solution Mobile Money pour l'Afrique de l'Ouest. Sur Zuri, tu branches ton compte FeexPay, FedaPay, PayDunya ou PawaPay.",
          en: "The pricing page says payment options depend on your country, without naming a Mobile Money option for West Africa. On Zuri, you connect your FeexPay, FedaPay, PayDunya or PawaPay account.",
        },
      },
      {
        q: { fr: "Comment Zuri limite les fausses commandes ?", en: "How does Zuri limit fake orders?" },
        a: {
          fr: "Chaque commande COD est attribuée automatiquement à un closer qui appelle le client et met à jour le statut. Tu vois ton taux de confirmation et de livraison, et donc où tu perds de l'argent.",
          en: "Each COD order is automatically assigned to a closer who calls the customer and updates the status. You see your confirmation and delivery rates, so you know where you lose money.",
        },
      },
      {
        q: { fr: "Combien coûte vraiment Zuri ?", en: "How much does Zuri really cost?" },
        a: {
          fr: "Zuri est gratuit pendant la phase de lancement, sans carte bancaire et sans commission sur tes ventes. Les commandes en paiement à la livraison n'ont aucun frais Zuri. Pour les paiements Mobile Money, seul ton prestataire (FeexPay, FedaPay, PayDunya ou PawaPay) prend ses frais habituels, que tu retrouves dans ton contrat avec lui. Zuri ne touche jamais ton argent : il arrive directement sur ton compte.",
          en: "Zuri is free during its launch phase, with no bank card and no commission on your sales. Cash on delivery orders have no Zuri fees. For Mobile Money payments, only your provider (FeexPay, FedaPay, PayDunya or PawaPay) takes its usual fees, as set in your contract with them. Zuri never touches your money: it goes straight to your account, and you can follow what you actually collected in your dashboard.",
        },
      },
      {
        q: { fr: "Quelles sont les limites de Zuri aujourd'hui ?", en: "What are Zuri's limits today?" },
        a: {
          fr: "Soyons transparents : Zuri est nouveau sur le marché, le domaine personnalisé arrive bientôt, il n'y a pas d'application mobile native (le tableau de bord fonctionne très bien sur le navigateur du téléphone) et Zuri ne propose pas de marketplace de produits gagnants. Si l'un de ces points est bloquant pour toi, garde ton outil actuel et teste Zuri sur un seul produit.",
          en: "To be transparent: Zuri is new on the market, custom domains are coming soon, there is no native mobile app (the dashboard works well in your phone's browser) and Zuri does not offer a marketplace of winning products. If one of these points is a deal breaker for you, keep your current tool and test Zuri on a single product first, then decide with your own numbers.",
        },
      },
    ],
    sources: [SRC.storeino],
  },
  // ---------------------------------------------------------------- CHARIOW
  {
    slug: "chariow",
    competitor: "Chariow",
    competitorUrl: "https://chariow.com",
    title: {
      fr: "Alternative à Chariow : vends aussi en physique et en COD, sans commission | Zuri",
      en: "Chariow alternative: sell physical products with COD too, no commission | Zuri",
    },
    description: {
      fr: "Chariow est une référence pour les produits digitaux en Afrique. Zuri te permet de vendre aussi des produits physiques en COD, sans commission, et s'intègre à Chariow.",
      en: "Chariow is a reference for digital products in Africa. Zuri lets you also sell physical products with COD, with no commission, and works with Chariow.",
    },
    h1: {
      fr: "L'alternative à Chariow pour vendre du digital et du physique, sans commission",
      en: "The Chariow alternative for selling digital and physical products, no commission",
    },
    intro: {
      fr: "Chariow est une plateforme très populaire pour vendre des produits digitaux en Afrique : ebooks, formations, templates, licences ou coaching. Elle gère la livraison des fichiers, les paiements Mobile Money et la relation client. Zuri n'est pas un remplaçant pur et simple : c'est un complément, ou une alternative si tu veux aussi vendre des produits physiques en paiement à la livraison et garder 100 % de ton prix de vente. D'ailleurs, tu peux brancher ton lien de paiement Chariow sur une page Zuri. Voici ce qui distingue les deux.",
      en: "Chariow is a very popular platform for selling digital products in Africa: ebooks, courses, templates, licenses or coaching. It handles file delivery, Mobile Money payments and customer management. Zuri is not a pure replacement: it is a complement, or an alternative if you also want to sell physical products with cash on delivery and keep 100% of your sale price. In fact, you can plug your Chariow payment link into a Zuri page. Here is what sets them apart.",
    },
    strengths: [
      {
        fr: "Une plateforme spécialisée dans les produits digitaux : fichiers, formations, licences, packs et coaching, avec livraison automatique.",
        en: "A platform specialized in digital products: files, courses, licenses, bundles and coaching, with automatic delivery.",
      },
      {
        fr: "De nombreux moyens de paiement : Mobile Money, Orange Money, Wave, MTN Money, cartes bancaires et virements internationaux, avec conversion des devises.",
        en: "Many payment methods: Mobile Money, Orange Money, Wave, MTN Money, bank cards and international transfers, with currency conversion.",
      },
      {
        fr: "Aucun abonnement mensuel ni frais d'installation : tu ne paies que lorsque tu vends.",
        en: "No monthly subscription or setup fee: you only pay when you sell.",
      },
      {
        fr: "Une solution clé en main : tu n'as pas besoin de compte chez un prestataire de paiement pour commencer.",
        en: "A turnkey solution: you do not need your own payment provider account to get started.",
      },
    ],
    limits: [
      {
        fr: "Une commission sur chaque vente : 15 % jusqu'à 5 000 $ de ventes, puis 10 %. Sur un ebook à 50 €, Chariow prend 7,50 € selon leur propre exemple.",
        en: "A commission on every sale: 15% up to $5,000 in sales, then 10%. On a €50 ebook, Chariow takes €7.50 according to their own example.",
      },
      {
        fr: "Les revenus sont crédités sur ton portefeuille Chariow 72 heures après la transaction (article 11.2 des conditions générales).",
        en: "Earnings are credited to your Chariow wallet 72 hours after the transaction (article 11.2 of the terms).",
      },
      {
        fr: "Comme sur toute plateforme qui encaisse pour toi, les conditions prévoient une rétention possible des fonds en cas d'infraction aux règles (article 9.3) ou de litige sur un paiement, jusqu'à sa résolution (article 13.2).",
        en: "As with any platform that collects payments for you, the terms allow funds to be withheld in case of a rule violation (article 9.3) or a payment dispute, until it is resolved (article 13.2).",
      },
      {
        fr: "La plateforme est pensée pour le digital : la vente de produits physiques en paiement à la livraison n'est pas son cœur de métier.",
        en: "The platform is built for digital goods: selling physical products with cash on delivery is not its core business.",
      },
    ],
    compare: [
      [{ fr: "Abonnement", en: "Subscription" }, { fr: "Aucun", en: "None" }, { fr: "Aucun pendant le lancement", en: "None during launch" }],
      [{ fr: "Commission", en: "Commission" }, { fr: "15 % puis 10 % au-delà de 5 000 $", en: "15% then 10% above $5,000" }, { fr: "0 % (frais de ton prestataire seulement)", en: "0% (only your provider's fees)" }],
      [{ fr: "Qui encaisse l'argent", en: "Who collects the money" }, { fr: "Chariow, puis crédit sur ton portefeuille", en: "Chariow, then credited to your wallet" }, { fr: "Ton propre compte PSP, Zuri ne détient jamais l'argent", en: "Your own PSP account, Zuri never holds the money" }],
      [{ fr: "Délai de crédit des revenus", en: "Earnings credit delay" }, { fr: "72 heures (art. 11.2)", en: "72 hours (art. 11.2)" }, { fr: "Selon ton prestataire", en: "Depends on your provider" }],
      [{ fr: "Produits digitaux", en: "Digital products" }, { fr: "Point fort", en: "Core strength" }, { fr: "Oui", en: "Yes" }],
      [{ fr: "Produits physiques en COD", en: "Physical products with COD" }, { fr: "Non, ce n'est pas son usage", en: "No, not its purpose" }, { fr: "Oui, formulaire COD et closers", en: "Yes, COD form and closers" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Oui, géré par Chariow", en: "Yes, handled by Chariow" }, { fr: "Oui, via FeexPay, FedaPay, PayDunya, PawaPay", en: "Yes, via FeexPay, FedaPay, PayDunya, PawaPay" }],
      [{ fr: "Compte prestataire nécessaire", en: "Provider account needed" }, { fr: "Non", en: "No" }, { fr: "Oui, pour le paiement en ligne", en: "Yes, for online payments" }],
      [{ fr: "Outils de conversion (compte à rebours, popup, packs)", en: "Conversion tools (countdown, popup, bundles)" }, { fr: "Packs", en: "Bundles" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Intégration entre les deux", en: "Integration between both" }, { fr: "Lien de paiement Chariow", en: "Chariow payment link" }, { fr: "Accepte les liens Chariow sur tes pages", en: "Accepts Chariow links on your pages" }],
    ],
    stillGoodFor: {
      fr: "Chariow reste un excellent choix si tu vends uniquement des produits digitaux, si tu ne veux pas ouvrir de compte chez un prestataire de paiement, ou si tu veux que la livraison des fichiers et l'accès aux formations soient gérés pour toi. Tu peux aussi le garder et l'utiliser avec Zuri.",
      en: "Chariow is still an excellent choice if you only sell digital products, do not want to open a payment provider account, or want file delivery and course access handled for you. You can also keep it and use it with Zuri.",
    },
    migration: [
      {
        fr: "Option 1, complémentaire : garde ton produit sur Chariow et colle ton lien de paiement Chariow dans une page de vente Zuri, avec compte à rebours, avis et FAQ.",
        en: "Option 1, complementary: keep your product on Chariow and paste your Chariow payment link into a Zuri sales page, with countdown, reviews and FAQ.",
      },
      {
        fr: "Option 2, sans commission : ouvre un compte FeexPay, FedaPay, PayDunya ou PawaPay, connecte-le à Zuri et crée ton produit digital directement sur Zuri.",
        en: "Option 2, no commission: open a FeexPay, FedaPay, PayDunya or PawaPay account, connect it to Zuri and create your digital product directly on Zuri.",
      },
      {
        fr: "Ajoute tes produits physiques à côté, avec le formulaire COD et tes closers.",
        en: "Add your physical products alongside, with the COD form and your closers.",
      },
      {
        fr: "Reconnecte ton pixel Facebook, l'API Conversions et TikTok pour suivre tes ventes.",
        en: "Reconnect your Facebook pixel, Conversions API and TikTok to track your sales.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Chariow en Afrique ?", en: "What is the best Chariow alternative in Africa?" },
        a: {
          fr: "Pour du digital uniquement, Maketou ou Selar sont des plateformes du même type. Si tu veux aussi vendre des produits physiques en COD et ne payer aucune commission, Zuri est une option, et il fonctionne même avec ton lien Chariow.",
          en: "For digital only, Maketou or Selar are similar platforms. If you also want to sell physical products with COD and pay no commission, Zuri is an option, and it even works with your Chariow link.",
        },
      },
      {
        q: { fr: "Chariow est-il gratuit ?", en: "Is Chariow free?" },
        a: {
          fr: "Il n'y a pas d'abonnement, mais une commission de 15 % sur chaque vente jusqu'à 5 000 $ de ventes, puis 10 %.",
          en: "There is no subscription, but a 15% commission on each sale up to $5,000 in sales, then 10%.",
        },
      },
      {
        q: { fr: "Chariow fonctionne-t-il avec Mobile Money ?", en: "Does Chariow work with Mobile Money?" },
        a: {
          fr: "Oui. Chariow accepte notamment Orange Money, Wave et MTN Money, en plus des cartes bancaires. C'est l'un de ses points forts.",
          en: "Yes. Chariow accepts Orange Money, Wave and MTN Money, among others, as well as bank cards. It is one of its strengths.",
        },
      },
      {
        q: { fr: "Quand reçoit-on l'argent sur Chariow ?", en: "When do you get paid on Chariow?" },
        a: {
          fr: "Selon l'article 11.2 des conditions générales, les revenus sont crédités sur ton portefeuille 72 heures après la transaction, frais déduits. Sur Zuri, l'argent va directement sur ton compte chez ton prestataire, selon ses propres délais.",
          en: "According to article 11.2 of the terms, earnings are credited to your wallet 72 hours after the transaction, minus fees. On Zuri, the money goes directly to your provider account, on its own timeline.",
        },
      },
      {
        q: { fr: "Puis-je utiliser Chariow et Zuri ensemble ?", en: "Can I use Chariow and Zuri together?" },
        a: {
          fr: "Oui. Beaucoup de vendeurs gardent Chariow pour la livraison de leurs formations et utilisent une page Zuri, plus persuasive, comme page de vente, avec le lien de paiement Chariow.",
          en: "Yes. Many sellers keep Chariow for course delivery and use a more persuasive Zuri page as their sales page, with the Chariow payment link.",
        },
      },
    ],
    sources: [SRC.chariowPricing, SRC.chariowTerms, SRC.chariowHome],
  },
  // ---------------------------------------------------------------- MAKETOU
  {
    slug: "maketou",
    competitor: "Maketou",
    competitorUrl: "https://www.maketou.com",
    title: {
      fr: "Alternative à Maketou : produits digitaux et physiques, 0 % de commission | Zuri",
      en: "Maketou alternative: digital and physical products, 0% commission | Zuri",
    },
    description: {
      fr: "Maketou permet de vendre des produits digitaux pour 5 % de commission. Zuri vend le digital et le physique en COD, sans commission, et accepte aussi tes liens Maketou.",
      en: "Maketou lets you sell digital products for a 5% commission. Zuri sells digital and physical products with COD, no commission, and also accepts your Maketou links.",
    },
    h1: {
      fr: "L'alternative à Maketou pour vendre plus que des produits digitaux",
      en: "The Maketou alternative for selling more than digital products",
    },
    intro: {
      fr: "Maketou est une plateforme africaine pour vendre des produits digitaux : ebooks, formations, templates, fichiers audio et vidéo, logiciels. Sa commission est basse, seulement 5 % par vente, sans abonnement, et elle propose une marketplace de produits PLR à revendre. Si tu vends uniquement du digital, c'est une option très compétitive. Zuri devient intéressant quand tu veux aussi vendre des produits physiques en paiement à la livraison, ou garder 100 % de ton prix sur le digital avec ton propre compte de paiement.",
      en: "Maketou is an African platform for selling digital products: ebooks, courses, templates, audio and video files, software. Its commission is low, only 5% per sale, with no subscription, and it offers a marketplace of PLR products to resell. If you only sell digital goods, it is a very competitive option. Zuri becomes interesting when you also want to sell physical products with cash on delivery, or keep 100% of your price on digital goods with your own payment account.",
    },
    strengths: [
      {
        fr: "Une commission basse : 5 % par vente, sans abonnement. Tu ne paies que lorsque tu vends.",
        en: "A low commission: 5% per sale, with no subscription. You only pay when you sell.",
      },
      {
        fr: "Une marketplace de produits PLR que tu peux revendre sous ton nom.",
        en: "A marketplace of PLR products you can resell under your own name.",
      },
      {
        fr: "Une vente multidevise, avec des prix en FCFA, en euros et en dollars.",
        en: "Multicurrency selling, with prices in CFA francs, euros and dollars.",
      },
      {
        fr: "Des paiements généralement traités sous 72 heures maximum après chaque vente, selon leur FAQ.",
        en: "Payments generally processed within 72 hours at most after each sale, according to their FAQ.",
      },
    ],
    limits: [
      {
        fr: "Une commission de 5 % sur chaque vente : sur 1 000 000 FCFA de ventes, cela représente 50 000 FCFA.",
        en: "A 5% commission on every sale: on 1,000,000 CFA francs in sales, that is 50,000 CFA francs.",
      },
      {
        fr: "La plateforme est centrée sur les produits digitaux : la page d'accueil ne présente pas la vente de produits physiques.",
        en: "The platform focuses on digital products: the home page does not present selling physical products.",
      },
      {
        fr: "Les gains passent par un solde Maketou avant d'être versés sur ton compte.",
        en: "Earnings go through a Maketou balance before being paid out to your account.",
      },
    ],
    compare: [
      [{ fr: "Abonnement", en: "Subscription" }, { fr: "Aucun", en: "None" }, { fr: "Aucun pendant le lancement", en: "None during launch" }],
      [{ fr: "Commission", en: "Commission" }, { fr: "5 % par vente", en: "5% per sale" }, { fr: "0 % (frais de ton prestataire seulement)", en: "0% (only your provider's fees)" }],
      [{ fr: "Qui encaisse l'argent", en: "Who collects the money" }, { fr: "Maketou, puis versement", en: "Maketou, then payout" }, { fr: "Ton propre compte PSP", en: "Your own PSP account" }],
      [{ fr: "Délai de versement", en: "Payout delay" }, { fr: "Généralement sous 72 h", en: "Generally within 72 hours" }, { fr: "Selon ton prestataire", en: "Depends on your provider" }],
      [{ fr: "Produits digitaux", en: "Digital products" }, { fr: "Point fort", en: "Core strength" }, { fr: "Oui", en: "Yes" }],
      [{ fr: "Marketplace PLR", en: "PLR marketplace" }, { fr: "Oui", en: "Yes" }, { fr: "Non", en: "No" }],
      [{ fr: "Produits physiques en COD", en: "Physical products with COD" }, { fr: "Non présenté", en: "Not presented" }, { fr: "Oui, avec closers", en: "Yes, with closers" }],
      [{ fr: "Compte prestataire nécessaire", en: "Provider account needed" }, { fr: "Non", en: "No" }, { fr: "Oui, pour le paiement en ligne", en: "Yes, for online payments" }],
      [{ fr: "Outils de conversion", en: "Conversion tools" }, { fr: "Non détaillés sur la page", en: "Not detailed on the page" }, { fr: "Compte à rebours, popup, packs, avis", en: "Countdown, popup, bundles, reviews" }],
      [{ fr: "Intégration entre les deux", en: "Integration between both" }, { fr: "Lien de paiement Maketou", en: "Maketou payment link" }, { fr: "Accepte les liens Maketou", en: "Accepts Maketou links" }],
    ],
    stillGoodFor: {
      fr: "Maketou reste un très bon choix si tu vends uniquement des produits digitaux, si tu veux revendre des produits PLR, ou si tu préfères ne pas ouvrir de compte chez un prestataire de paiement. Avec 5 %, sa commission fait partie des plus basses du marché.",
      en: "Maketou is still a very good choice if you only sell digital products, want to resell PLR products, or prefer not to open a payment provider account. At 5%, its commission is among the lowest on the market.",
    },
    migration: [
      {
        fr: "Option 1 : garde ton produit sur Maketou et place ton lien de paiement Maketou sur une page de vente Zuri.",
        en: "Option 1: keep your product on Maketou and put your Maketou payment link on a Zuri sales page.",
      },
      {
        fr: "Option 2 : connecte ton compte FeexPay, FedaPay, PayDunya ou PawaPay à Zuri et crée ton produit digital sans commission.",
        en: "Option 2: connect your FeexPay, FedaPay, PayDunya or PawaPay account to Zuri and create your digital product with no commission.",
      },
      {
        fr: "Ajoute tes produits physiques avec le formulaire COD si tu veux élargir ton offre.",
        en: "Add your physical products with the COD form if you want to expand your offer.",
      },
      {
        fr: "Branche ton pixel Facebook, l'API Conversions et TikTok pour mesurer tes campagnes.",
        en: "Connect your Facebook pixel, Conversions API and TikTok to measure your campaigns.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Maketou en Afrique ?", en: "What is the best Maketou alternative in Africa?" },
        a: {
          fr: "Pour le digital seul, Chariow et Selar sont des plateformes proches. Pour vendre digital et physique au même endroit, sans commission, Zuri est une option, compatible avec tes liens Maketou.",
          en: "For digital only, Chariow and Selar are similar platforms. To sell digital and physical goods in one place with no commission, Zuri is an option, compatible with your Maketou links.",
        },
      },
      {
        q: { fr: "Maketou est-il gratuit ?", en: "Is Maketou free?" },
        a: {
          fr: "Il n'y a pas d'abonnement : Maketou prend 5 % de commission sur chaque vente.",
          en: "There is no subscription: Maketou takes a 5% commission on each sale.",
        },
      },
      {
        q: { fr: "Maketou fonctionne-t-il avec Mobile Money ?", en: "Does Maketou work with Mobile Money?" },
        a: {
          fr: "La page d'accueil de Maketou ne détaille pas les opérateurs acceptés : vérifie sur leur site pour ton pays. Sur Zuri, tes clients paient en Mobile Money via ton compte FeexPay, FedaPay, PayDunya ou PawaPay.",
          en: "Maketou's home page does not list the accepted operators: check their site for your country. On Zuri, your customers pay with Mobile Money through your FeexPay, FedaPay, PayDunya or PawaPay account.",
        },
      },
      {
        q: { fr: "Zuri prend-il une commission sur les produits digitaux ?", en: "Does Zuri take a commission on digital products?" },
        a: {
          fr: "Non, 0 %. Ton prestataire de paiement facture ses frais habituels, et l'argent arrive directement sur ton compte. Zuri ne détient jamais ton argent.",
          en: "No, 0%. Your payment provider charges its usual fees, and the money goes straight to your account. Zuri never holds your money.",
        },
      },
      {
        q: { fr: "Comment vendre un produit digital sur Zuri ?", en: "How do I sell a digital product on Zuri?" },
        a: {
          fr: "Tu as deux façons de faire. Soit tu crées le produit sur Zuri et tu connectes ton compte FeexPay, FedaPay, PayDunya ou PawaPay : le client paie en Mobile Money et l'argent arrive chez toi, sans commission Zuri. Soit tu gardes ta plateforme actuelle et tu colles ton lien de paiement Chariow, Maketou ou Selar sur ta page Zuri, pour profiter du compte à rebours, des avis, de la garantie et de la FAQ.",
          en: "There are two ways. Either you create the product on Zuri and connect your FeexPay, FedaPay, PayDunya or PawaPay account: the customer pays with Mobile Money and the money comes to you, with no Zuri commission. Or you keep your current platform and paste your Chariow, Maketou or Selar payment link on your Zuri page, so you still benefit from the countdown, reviews, guarantee and FAQ that help visitors decide to buy.",
        },
      },
      {
        q: { fr: "Quelles sont les limites de Zuri aujourd'hui ?", en: "What are Zuri's limits today?" },
        a: {
          fr: "Soyons transparents : Zuri est nouveau sur le marché, le domaine personnalisé arrive bientôt, il n'y a pas d'application mobile native (le tableau de bord fonctionne très bien sur le navigateur du téléphone) et Zuri ne propose pas de marketplace de produits gagnants. Si l'un de ces points est bloquant pour toi, garde ton outil actuel et teste Zuri sur un seul produit.",
          en: "To be transparent: Zuri is new on the market, custom domains are coming soon, there is no native mobile app (the dashboard works well in your phone's browser) and Zuri does not offer a marketplace of winning products. If one of these points is a deal breaker for you, keep your current tool and test Zuri on a single product first, then decide with your own numbers.",
        },
      },
    ],
    sources: [SRC.maketou],
  },
  // ------------------------------------------------------------------ SELAR
  {
    slug: "selar",
    competitor: "Selar",
    competitorUrl: "https://selar.com",
    title: {
      fr: "Alternative à Selar en Afrique francophone : COD, FCFA, 0 % de commission | Zuri",
      en: "Selar alternative for Africa: COD, Mobile Money, 0% commission | Zuri",
    },
    description: {
      fr: "Selar est une plateforme reconnue pour vendre des produits digitaux. Zuri vend le digital et le physique en COD, en FCFA, sans commission, et accepte tes liens Selar.",
      en: "Selar is a well known platform for selling digital products. Zuri sells digital and physical products with COD, in CFA francs, no commission, and accepts your Selar links.",
    },
    h1: {
      fr: "L'alternative à Selar pour vendre en COD et en FCFA",
      en: "The Selar alternative for selling with COD and Mobile Money",
    },
    intro: {
      fr: "Selar est une plateforme née au Nigeria pour vendre des produits numériques en ligne : ebooks, formations, fichiers et abonnements. Elle est bien notée par ses utilisateurs et très utilisée par les créateurs anglophones. Pour un vendeur d'Afrique francophone qui vend aussi des produits physiques en paiement à la livraison, Zuri peut être un meilleur point de départ, ou un complément : tu peux placer ton lien Selar sur une page de vente Zuri.",
      en: "Selar is a platform born in Nigeria for selling digital products online: ebooks, courses, files and memberships. It is well rated by its users and widely used by English speaking creators. For a seller in French speaking Africa who also sells physical products with cash on delivery, Zuri can be a better starting point, or a complement: you can put your Selar link on a Zuri sales page.",
    },
    strengths: [
      {
        fr: "Une plateforme établie et bien notée : 3,9 sur 5 sur Trustpilot, sur 313 avis en novembre 2026.",
        en: "An established, well rated platform: 3.9 out of 5 on Trustpilot from 313 reviews in November 2026.",
      },
      {
        fr: "Une spécialisation dans les produits numériques, avec livraison automatique.",
        en: "A focus on digital products, with automatic delivery.",
      },
      {
        fr: "La possibilité de faire payer les frais de transaction Selar par le client, réglable dans le tableau de bord.",
        en: "The option to have the customer pay the Selar transaction fee, set in the dashboard.",
      },
      {
        fr: "Une forte communauté de créateurs, surtout au Nigeria et dans les pays anglophones.",
        en: "A strong creator community, especially in Nigeria and English speaking countries.",
      },
    ],
    limits: [
      {
        fr: "Des frais sur chaque vente : pour les ventes en naira, Selar indique 4 % plus 50 ₦ par transaction.",
        en: "A fee on every sale: for naira sales, Selar states 4% plus ₦50 per transaction.",
      },
      {
        fr: "Une plateforme centrée sur les produits numériques : le paiement à la livraison pour des produits physiques n'est pas son usage.",
        en: "A platform focused on digital products: cash on delivery for physical goods is not its purpose.",
      },
      {
        fr: "L'argent est encaissé par Selar avant d'être reversé, au lieu d'arriver directement sur ton compte de paiement.",
        en: "Money is collected by Selar before being paid out, instead of going straight to your payment account.",
      },
    ],
    compare: [
      [{ fr: "Abonnement", en: "Subscription" }, { fr: "Non requis pour vendre", en: "Not required to sell" }, { fr: "Aucun pendant le lancement", en: "None during launch" }],
      [{ fr: "Frais par vente", en: "Fee per sale" }, { fr: "4 % + 50 ₦ (ventes en naira)", en: "4% + ₦50 (naira sales)" }, { fr: "0 % (frais de ton prestataire seulement)", en: "0% (only your provider's fees)" }],
      [{ fr: "Faire payer les frais au client", en: "Pass fees to the customer" }, { fr: "Oui, en option", en: "Yes, optional" }, { fr: "Pas de frais Zuri à répercuter", en: "No Zuri fee to pass on" }],
      [{ fr: "Qui encaisse l'argent", en: "Who collects the money" }, { fr: "Selar, puis versement", en: "Selar, then payout" }, { fr: "Ton propre compte PSP", en: "Your own PSP account" }],
      [{ fr: "Produits numériques", en: "Digital products" }, { fr: "Point fort", en: "Core strength" }, { fr: "Oui", en: "Yes" }],
      [{ fr: "Produits physiques en COD", en: "Physical products with COD" }, { fr: "Non, ce n'est pas son usage", en: "No, not its purpose" }, { fr: "Oui, avec closers", en: "Yes, with closers" }],
      [{ fr: "Langue et marché principal", en: "Main language and market" }, { fr: "Anglais, Nigeria et pays anglophones", en: "English, Nigeria and English speaking countries" }, { fr: "Français et anglais, zone FCFA", en: "French and English, CFA franc zone" }],
      [{ fr: "Outils de conversion", en: "Conversion tools" }, { fr: "Selon la page produit", en: "Depends on the product page" }, { fr: "Compte à rebours, popup, packs, avis, FAQ", en: "Countdown, popup, bundles, reviews, FAQ" }],
      [{ fr: "Ancienneté", en: "Track record" }, { fr: "Plateforme établie", en: "Established platform" }, { fr: "Nouvelle plateforme", en: "New platform" }],
      [{ fr: "Intégration entre les deux", en: "Integration between both" }, { fr: "Lien de paiement Selar", en: "Selar payment link" }, { fr: "Accepte les liens Selar", en: "Accepts Selar links" }],
    ],
    stillGoodFor: {
      fr: "Selar reste un très bon choix si tu vends des produits numériques au Nigeria ou dans des pays anglophones, si tu veux une plateforme établie avec une bonne réputation, ou si tu ne veux pas gérer de compte chez un prestataire de paiement.",
      en: "Selar is still a very good choice if you sell digital products in Nigeria or English speaking countries, want an established platform with a good reputation, or do not want to manage a payment provider account.",
    },
    migration: [
      {
        fr: "Option 1 : garde ton produit sur Selar et utilise ton lien Selar comme bouton de paiement sur une page Zuri.",
        en: "Option 1: keep your product on Selar and use your Selar link as the payment button on a Zuri page.",
      },
      {
        fr: "Option 2 : connecte un compte FeexPay, FedaPay, PayDunya ou PawaPay et crée ton produit digital directement sur Zuri.",
        en: "Option 2: connect a FeexPay, FedaPay, PayDunya or PawaPay account and create your digital product directly on Zuri.",
      },
      {
        fr: "Ajoute tes produits physiques avec le formulaire COD et tes zones de livraison.",
        en: "Add your physical products with the COD form and your delivery zones.",
      },
      {
        fr: "Reconnecte ton pixel Facebook, l'API Conversions et TikTok.",
        en: "Reconnect your Facebook pixel, Conversions API and TikTok.",
      },
    ],
    faqs: [
      {
        q: { fr: "Quelle est la meilleure alternative à Selar en Afrique ?", en: "What is the best Selar alternative in Africa?" },
        a: {
          fr: "En Afrique francophone, Chariow et Maketou sont des plateformes digitales proches. Pour vendre digital et physique sans commission, en FCFA, Zuri est une option, compatible avec ton lien Selar.",
          en: "In French speaking Africa, Chariow and Maketou are similar digital platforms. To sell digital and physical goods with no commission, Zuri is an option, compatible with your Selar link.",
        },
      },
      {
        q: { fr: "Selar est-il gratuit ?", en: "Is Selar free?" },
        a: {
          fr: "Tu peux vendre sans abonnement, mais Selar prend des frais sur chaque vente : 4 % plus 50 ₦ pour les ventes en naira. Tu peux choisir de les faire payer à ton client.",
          en: "You can sell without a subscription, but Selar charges a fee on each sale: 4% plus ₦50 for naira sales. You can choose to have your customer pay it.",
        },
      },
      {
        q: { fr: "Selar fonctionne-t-il avec Mobile Money ?", en: "Does Selar work with Mobile Money?" },
        a: {
          fr: "Les moyens de paiement disponibles dépendent du pays et de la devise : vérifie sur le site de Selar pour ton marché. Sur Zuri, le Mobile Money passe par ton propre compte chez un prestataire local.",
          en: "Available payment methods depend on the country and currency: check Selar's site for your market. On Zuri, Mobile Money goes through your own account with a local provider.",
        },
      },
      {
        q: { fr: "Zuri est-il aussi connu que Selar ?", en: "Is Zuri as well known as Selar?" },
        a: {
          fr: "Non, Zuri est nouveau. Il est gratuit pendant le lancement, donc tu peux le tester sur un produit sans risque avant de décider.",
          en: "No, Zuri is new. It is free during launch, so you can test it on one product without risk before deciding.",
        },
      },
      {
        q: { fr: "Comment vendre un produit digital sur Zuri ?", en: "How do I sell a digital product on Zuri?" },
        a: {
          fr: "Tu as deux façons de faire. Soit tu crées le produit sur Zuri et tu connectes ton compte FeexPay, FedaPay, PayDunya ou PawaPay : le client paie en Mobile Money et l'argent arrive chez toi, sans commission Zuri. Soit tu gardes ta plateforme actuelle et tu colles ton lien de paiement Chariow, Maketou ou Selar sur ta page Zuri, pour profiter du compte à rebours, des avis, de la garantie et de la FAQ.",
          en: "There are two ways. Either you create the product on Zuri and connect your FeexPay, FedaPay, PayDunya or PawaPay account: the customer pays with Mobile Money and the money comes to you, with no Zuri commission. Or you keep your current platform and paste your Chariow, Maketou or Selar payment link on your Zuri page, so you still benefit from the countdown, reviews, guarantee and FAQ that help visitors decide to buy.",
        },
      },
      {
        q: { fr: "Combien coûte vraiment Zuri ?", en: "How much does Zuri really cost?" },
        a: {
          fr: "Zuri est gratuit pendant la phase de lancement, sans carte bancaire et sans commission sur tes ventes. Les commandes en paiement à la livraison n'ont aucun frais Zuri. Pour les paiements Mobile Money, seul ton prestataire (FeexPay, FedaPay, PayDunya ou PawaPay) prend ses frais habituels, que tu retrouves dans ton contrat avec lui. Zuri ne touche jamais ton argent : il arrive directement sur ton compte.",
          en: "Zuri is free during its launch phase, with no bank card and no commission on your sales. Cash on delivery orders have no Zuri fees. For Mobile Money payments, only your provider (FeexPay, FedaPay, PayDunya or PawaPay) takes its usual fees, as set in your contract with them. Zuri never touches your money: it goes straight to your account, and you can follow what you actually collected in your dashboard.",
        },
      },
    ],
    sources: [SRC.selarFees, SRC.selarTrustpilot],
  },
]
