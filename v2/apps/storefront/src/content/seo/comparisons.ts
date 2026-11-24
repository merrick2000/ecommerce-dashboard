import type { ComparisonPage } from './types'

/**
 * Pages « A vs B » (SEO programmatique), en français et en anglais.
 * Neutres : le lecteur cherche vraiment à choisir entre A et B. Faits vérifiés sur les sites officiels en novembre 2026.
 */

const SRC = {
  shopifyPricing: { label: "Shopify, page Tarifs (novembre 2026)", url: "https://www.shopify.com/pricing" },
  shopifyPaymentsCountries: { label: "Shopify Help Center, pays où Shopify Payments est disponible", url: "https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries" },
  shopifyManual: { label: "Shopify Help Center, paiements manuels (COD)", url: "https://help.shopify.com/en/manual/payments/manual-payments" },
  easySell: { label: "Shopify App Store, EasySell COD Form & Upsells (tarifs)", url: "https://apps.shopify.com/easy-order-form" },
  almanac: { label: "HTTP Archive, Web Almanac 2025, chapitre Ecommerce (Core Web Vitals mobile)", url: "https://almanac.httparchive.org/en/2025/ecommerce" },
  wooPricing: { label: "WooCommerce, page Pricing (coûts d'hébergement et d'extensions)", url: "https://woocommerce.com/pricing/" },
  wixPlans: { label: "Wix, page des forfaits", url: "https://www.wix.com/plans" },
  youcanPricing: { label: "YouCan, page Pricing", url: "https://youcan.shop/en/pricing" },
  youcanTrustpilot: { label: "Trustpilot, avis sur youcan.shop", url: "https://www.trustpilot.com/review/youcan.shop" },
  lfPricing: { label: "Lightfunnels, page Pricing", url: "https://lightfunnels.com/pricing" },
  lfTrustpilot: { label: "Trustpilot, avis sur lightfunnels.com", url: "https://www.trustpilot.com/review/lightfunnels.com" },
  easyafrik: { label: "EasyAfrik, page d'accueil et tarifs", url: "https://easyafrik.com" },
  chariowPricing: { label: "Chariow, page Pricing", url: "https://chariow.com/pricing" },
  chariowTerms: { label: "Chariow, conditions générales (art. 9.3, 11.2, 13.2)", url: "https://chariow.com/terms-of-service" },
  chariowHome: { label: "Chariow, page d'accueil (moyens de paiement)", url: "https://chariow.com" },
  maketou: { label: "Maketou, page d'accueil et FAQ", url: "https://www.maketou.com/" },
  selarFees: { label: "Selar Help Center, frais de transaction en naira", url: "https://help.selar.com/portal/en/kb/articles/how-to-pass-transaction-fees-to-your-customers-from-your-selar-dashboard" },
  selarTrustpilot: { label: "Trustpilot, avis sur selar.co", url: "https://www.trustpilot.com/review/selar.co" },
  shopxHome: { label: "ShopX, page d'accueil et FAQ (novembre 2026)", url: "https://shopx.bj/" },
  shopxFeatures: { label: "ShopX, page Fonctionnalités", url: "https://shopx.bj/features" },
  shopxIntegrations: { label: "ShopX, page Intégrations (FedaPay, livraison)", url: "https://shopx.bj/integrations" },
  bumpaHome: { label: "Bumpa, page d'accueil et FAQ (novembre 2026)", url: "https://www.getbumpa.com/" },
  bumpaPricing: { label: "Bumpa, page Pricing", url: "https://www.getbumpa.com/pricing" },
  zuriPricing: { label: "Zuri, page Tarifs", url: "https://zurisell.store/tarifs" },
  zuriFeatures: { label: "Zuri, page Fonctionnalités et centre d'aide", url: "https://zurisell.store/fonctionnalites" },
} as const

export const COMPARISONS: ComparisonPage[] = [
  // ------------------------------------------------------------ SHOPX VS ZURI
  {
    slug: "shopx-vs-zuri",
    a: "ShopX",
    b: "Zuri",
    title: {
      fr: "ShopX ou Zuri en 2026 : quelle boutique pour vendre au Bénin ? | Zuri",
      en: "ShopX vs Zuri in 2026: which store to sell in Benin? | Zuri",
    },
    description: {
      fr: "ShopX ou Zuri pour vendre au Bénin et en Afrique de l'Ouest ? Commissions, Mobile Money, paiement à la livraison, domaine, pixel Meta et IA comparés avec les pages officielles.",
      en: "ShopX or Zuri to sell in Benin and West Africa? Fees, Mobile Money, cash on delivery, domain, Meta pixel and AI compared with official pages.",
    },
    h1: {
      fr: "ShopX ou Zuri : laquelle choisir pour vendre au Bénin ?",
      en: "ShopX vs Zuri: which one to sell in Benin?",
    },
    intro: {
      fr: "ShopX est une plateforme béninoise (Ola Solutions, Cotonou) qui permet de créer sa boutique et d'encaisser par FedaPay. Zuri est la plateforme qui publie cette page : nous le disons clairement, et nous ne citons que ce que chaque site affiche en novembre 2026, avec les liens. Les deux visent les vendeurs d'Afrique de l'Ouest, avec des choix différents.",
      en: "ShopX is a Beninese platform (Ola Solutions, Cotonou) to create a store and collect payments through FedaPay. Zuri is the platform publishing this page: we say it plainly, and we only cite what each site shows in November 2026, with links. Both target West African sellers, with different choices.",
    },
    compare: [
      [{ fr: "Origine", en: "Origin" }, { fr: "Bénin (Cotonou)", en: "Benin (Cotonou)" }, { fr: "Afrique francophone et anglophone", en: "French and English speaking Africa" }],
      [{ fr: "Créer la boutique", en: "Create the store" }, { fr: "Gratuit", en: "Free" }, { fr: "Gratuit pendant le lancement, puis dès 4 900 FCFA/mois", en: "Free during launch, then from 4,900 CFA/month" }],
      [{ fr: "Commission sur les ventes en ligne", en: "Fee on online sales" }, { fr: "4 % sur les ventes que ShopX encaisse", en: "4% on sales ShopX collects" }, { fr: "0 %", en: "0%" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Via FedaPay (MTN MoMo, Moov, Celtiis, Coris, BMO au Bénin ; 6 pays)", en: "Through FedaPay (MTN MoMo, Moov, Celtiis, Coris, BMO in Benin; 6 countries)" }, { fr: "Via vos comptes FedaPay, FeexPay, PayDunya ou pawaPay", en: "Through your FedaPay, FeexPay, PayDunya or pawaPay accounts" }],
      [{ fr: "Carte bancaire", en: "Bank card" }, { fr: "« Pas encore disponible »", en: "“Not yet available”" }, { fr: "Selon le prestataire connecté", en: "Depending on the connected provider" }],
      [{ fr: "Paiement à la livraison", en: "Cash on delivery" }, { fr: "Oui ; avec le coursier ShopX, acompte pour la course à la commande", en: "Yes; with the ShopX courier, a deposit for the ride at order time" }, { fr: "Oui, avec zones, frais et confirmation par closers", en: "Yes, with zones, fees and confirmation by closers" }],
      [{ fr: "Domaine personnalisé", en: "Custom domain" }, { fr: "Non (votre-nom.shop.shopx.bj)", en: "No (your-name.shop.shopx.bj)" }, { fr: "Oui, par CNAME", en: "Yes, by CNAME" }],
      [{ fr: "Pixel Meta, API Conversions", en: "Meta pixel, Conversions API" }, { fr: "Non mentionnés", en: "Not mentioned" }, { fr: "Oui, avec achat déclaré à la commande, confirmation ou livraison", en: "Yes, with purchase reported at order, confirmation or delivery" }],
      [{ fr: "IA", en: "AI" }, { fr: "Fiche depuis une photo, studio photo, réponses aux commentaires Facebook", en: "Product from a photo, photo studio, Facebook comment replies" }, { fr: "Serveur MCP : piloter la boutique depuis ChatGPT ou Claude", en: "MCP server: run the store from ChatGPT or Claude" }],
      [{ fr: "Autres", en: "Other" }, { fr: "Messenger, points de fidélité, caisse Facto", en: "Messenger, loyalty points, Facto point of sale" }, { fr: "Produits digitaux, tunnel (upsell), export CSV, vue en direct", en: "Digital products, funnel (upsell), CSV export, live view" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Deux modèles de prix", en: "Two pricing models" } },
      { type: "p", text: { fr: "ShopX est gratuit à la création et se rémunère par une commission : 4 % sur les ventes qu'il encaisse pour vous, rien sur celles que vous encaissez vous-même, et 8 % annoncés sur les ventes de sa future place de marché OlaShop. Zuri fonctionne par abonnement en FCFA (gratuit pendant le lancement) et ne prend aucune commission : l'argent va directement sur votre compte de paiement, avec retrait le jour même ou sous 24 heures selon le statut du compte et la formule.", en: "ShopX is free to create and earns a commission: 4% on sales it collects for you, nothing on those you collect yourself, and 8% announced on sales from its upcoming OlaShop marketplace. Zuri works by subscription in CFA francs (free during launch) and takes no commission: money goes straight to your payment account, with payout the same day or within 24 hours depending on account status and plan." } },
      { type: "h2", text: { fr: "Livraison", en: "Delivery" } },
      { type: "p", text: { fr: "ShopX propose son propre coursier dans les villes du Bénin qu'il dessert : il encaisse à la remise du colis, et un acompte couvrant la course est demandé à la commande. Zuri ne fournit pas de livreurs : il gère vos zones, vos frais, la confirmation par votre équipe et le suivi jusqu'à l'encaissement, avec vos propres livreurs, dans plusieurs pays.", en: "ShopX offers its own courier in the Benin cities it serves: it collects at handover, and a deposit covering the ride is required at order time. Zuri does not provide couriers: it manages your zones, fees, confirmation by your team and tracking until cash is collected, with your own couriers, in several countries." } },
      { type: "h2", text: { fr: "Publicité", en: "Advertising" } },
      { type: "p", text: { fr: "Si vous vendez avec des pubs Facebook ou TikTok, le suivi compte beaucoup. Les pages de ShopX ne mentionnent ni pixel ni API Conversions (seulement Messenger et les commentaires de votre page). Zuri envoie les événements au pixel et à l'API Conversions sans doublons, et vous laisse déclarer l'achat seulement à la confirmation ou à la livraison, pour que Meta apprenne des vraies ventes.", en: "If you sell with Facebook or TikTok ads, tracking matters a lot. ShopX pages mention neither a pixel nor the Conversions API (only Messenger and your page comments). Zuri sends events to the pixel and Conversions API without duplicates, and lets you report the purchase only at confirmation or delivery, so Meta learns from real sales." } },
    ],
    verdict: {
      fr: "ShopX convient bien à un commerçant béninois qui veut démarrer sans abonnement, vendre aussi en boutique physique (caisse Facto) et profiter d'un coursier intégré à Cotonou, en acceptant 4 % sur les ventes encaissées en ligne. Zuri convient mieux si vous vendez avec de la publicité, en paiement à la livraison avec une équipe de confirmation, dans plusieurs pays, avec votre domaine et sans commission sur vos ventes.",
      en: "ShopX suits a Beninese merchant who wants to start with no subscription, also sell in a physical shop (Facto point of sale) and use a built in courier in Cotonou, accepting 4% on sales collected online. Zuri fits better if you sell with ads, with cash on delivery and a confirmation team, in several countries, with your own domain and no commission on your sales.",
    },
    faqs: [
      { q: { fr: "ShopX prend-il une commission ?", en: "Does ShopX take a commission?" }, a: { fr: "Oui, selon sa FAQ : 4 % sur les ventes qu'il encaisse pour vous, rien sur celles que vous encaissez vous-même.", en: "Yes, per its FAQ: 4% on sales it collects for you, nothing on those you collect yourself." } },
      { q: { fr: "Peut-on utiliser son propre domaine avec ShopX ?", en: "Can you use your own domain with ShopX?" }, a: { fr: "Sa FAQ indique une adresse du type votre-nom.shop.shopx.bj. Zuri accepte un domaine personnalisé.", en: "Its FAQ shows an address like your-name.shop.shopx.bj. Zuri accepts a custom domain." } },
      { q: { fr: "Lequel est le moins cher ?", en: "Which one is cheaper?" }, a: { fr: "Pour de petits volumes, ShopX (aucun abonnement). Dès que les ventes en ligne grossissent, 4 % pèse plus qu'un abonnement fixe Zuri sans commission.", en: "For small volumes, ShopX (no subscription). As online sales grow, 4% weighs more than a fixed Zuri subscription with no commission." } },
    ],
    sources: [SRC.shopxHome, SRC.shopxFeatures, SRC.shopxIntegrations, SRC.zuriPricing, SRC.zuriFeatures],
  },
  // ------------------------------------------------------------ BUMPA VS ZURI
  {
    slug: "bumpa-vs-zuri",
    a: "Bumpa",
    b: "Zuri",
    title: {
      fr: "Bumpa ou Zuri en 2026 : quelle plateforme pour vendre en Afrique ? | Zuri",
      en: "Bumpa vs Zuri in 2026: which platform to sell in Africa? | Zuri",
    },
    description: {
      fr: "Bumpa ou Zuri ? Prix, devises, Mobile Money, paiement à la livraison, langue et suivi publicitaire comparés avec les pages officielles.",
      en: "Bumpa or Zuri? Prices, currencies, Mobile Money, cash on delivery, language and ad tracking compared with official pages.",
    },
    h1: { fr: "Bumpa ou Zuri : laquelle choisir ?", en: "Bumpa vs Zuri: which one to choose?" },
    intro: {
      fr: "Bumpa est une application de gestion commerciale nigériane (site, stock, commandes, caisse). Zuri est la plateforme qui publie cette page : nous ne citons que ce que chaque site affiche en novembre 2026, avec les liens. Bumpa est pensé pour le Nigeria, Zuri pour la vente en paiement à la livraison et en Mobile Money en Afrique francophone et anglophone.",
      en: "Bumpa is a Nigerian business management app (website, inventory, orders, point of sale). Zuri is the platform publishing this page: we only cite what each site shows in November 2026, with links. Bumpa is built for Nigeria, Zuri for cash on delivery and Mobile Money sales across French and English speaking Africa.",
    },
    compare: [
      [{ fr: "Marché", en: "Market" }, { fr: "Nigeria (prix en naira, domaine .com.ng)", en: "Nigeria (naira prices, .com.ng domain)" }, { fr: "Afrique francophone et anglophone, diaspora", en: "French and English speaking Africa, diaspora" }],
      [{ fr: "Prix", en: "Price" }, { fr: "Starter 5 000 ₦/mois, Pro 10 000 ₦/mois (facturés au trimestre), essai 14 jours", en: "Starter ₦5,000/month, Pro ₦10,000/month (billed quarterly), 14 day trial" }, { fr: "Gratuit pendant le lancement, puis 4 900 à 24 900 FCFA/mois", en: "Free during launch, then 4,900 to 24,900 CFA/month" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Non mentionné", en: "Not mentioned" }, { fr: "Oui (FedaPay, FeexPay, PayDunya, pawaPay)", en: "Yes (FedaPay, FeexPay, PayDunya, pawaPay)" }],
      [{ fr: "Paiement à la livraison", en: "Cash on delivery" }, { fr: "Non mentionné", en: "Not mentioned" }, { fr: "Oui, avec closers et zones de livraison", en: "Yes, with closers and delivery zones" }],
      [{ fr: "Langue", en: "Language" }, { fr: "Anglais", en: "English" }, { fr: "Français et anglais", en: "French and English" }],
      [{ fr: "Pixels publicitaires", en: "Ad pixels" }, { fr: "Meta, TikTok, Snapchat", en: "Meta, TikTok, Snapchat" }, { fr: "Meta (pixel et API Conversions), TikTok", en: "Meta (pixel and Conversions API), TikTok" }],
      [{ fr: "Export", en: "Export" }, { fr: "CSV (produits, commandes, clients, dépenses…)", en: "CSV (products, orders, customers, expenses…)" }, { fr: "CSV (commandes, clients)", en: "CSV (orders, customers)" }],
      [{ fr: "Points forts propres", en: "Own strengths" }, { fr: "Stock, caisse Bumpa Terminal, codes-barres", en: "Inventory, Bumpa Terminal POS, barcodes" }, { fr: "Pages de vente de 20 Ko, produits digitaux, IA, tunnel d'upsell", en: "20 KB sales pages, digital products, AI, upsell funnel" }],
    ],
    blocks: [
      { type: "p", text: { fr: "Bumpa est un outil complet pour un commerçant nigérian qui gère un stock, une boutique physique et un site, payé en naira ou en dollars. Ses pages ne mentionnent ni Mobile Money, ni paiement à la livraison, ni français. Zuri est pensé pour la vente par publicité avec paiement à la livraison ou Mobile Money, la confirmation par une équipe de closers, et les produits digitaux livrés automatiquement.", en: "Bumpa is a complete tool for a Nigerian merchant managing inventory, a physical shop and a website, paid in naira or dollars. Its pages mention neither Mobile Money, nor cash on delivery, nor French. Zuri is built for ad driven sales with cash on delivery or Mobile Money, confirmation by a closer team, and automatically delivered digital products." } },
    ],
    verdict: {
      fr: "Bumpa est un bon choix au Nigeria pour gérer stock, caisse et site en naira. Zuri est plus adapté en Afrique francophone, au Kenya, au Ghana ou ailleurs, pour vendre en paiement à la livraison ou en Mobile Money, avec la publicité et une équipe de confirmation, en français ou en anglais.",
      en: "Bumpa is a good choice in Nigeria to manage inventory, point of sale and website in naira. Zuri fits better in French speaking Africa, Kenya, Ghana or elsewhere, to sell with cash on delivery or Mobile Money, with ads and a confirmation team, in French or English.",
    },
    faqs: [
      { q: { fr: "Bumpa fonctionne-t-il en Afrique francophone ?", en: "Does Bumpa work in French speaking Africa?" }, a: { fr: "Ses pages ne mentionnent ni le français ni le franc CFA : les prix sont en naira et le domaine offert est en .com.ng.", en: "Its pages mention neither French nor the CFA franc: prices are in naira and the offered domain is .com.ng." } },
      { q: { fr: "Lequel gère le paiement à la livraison ?", en: "Which one handles cash on delivery?" }, a: { fr: "Zuri, avec formulaire court, zones de livraison et confirmation par closers. Les pages de Bumpa ne le mentionnent pas.", en: "Zuri, with a short form, delivery zones and confirmation by closers. Bumpa pages do not mention it." } },
    ],
    sources: [SRC.bumpaHome, SRC.bumpaPricing, SRC.zuriPricing, SRC.zuriFeatures],
  },
  // ------------------------------------------------- SHOPIFY VS WOOCOMMERCE
  {
    slug: "shopify-vs-woocommerce",
    a: "Shopify",
    b: "WooCommerce",
    title: {
      fr: "Shopify ou WooCommerce en 2026 : prix, vitesse, paiement en Afrique | Zuri",
      en: "Shopify vs WooCommerce in 2026: price, speed, payments in Africa | Zuri",
    },
    description: {
      fr: "Shopify ou WooCommerce ? Comparatif honnête des coûts réels, de la vitesse mobile, de la maintenance et du paiement en Afrique, chiffres officiels à l'appui.",
      en: "Shopify or WooCommerce? An honest comparison of real costs, mobile speed, maintenance and payments in Africa, backed by official figures.",
    },
    h1: {
      fr: "Shopify ou WooCommerce : lequel choisir pour vendre en ligne ?",
      en: "Shopify vs WooCommerce: which one should you choose to sell online?",
    },
    intro: {
      fr: "Shopify et WooCommerce sont les deux plateformes e-commerce les plus utilisées au monde. Shopify est une solution hébergée et payante par abonnement : tout est géré pour toi. WooCommerce est une extension gratuite de WordPress : tu héberges ta boutique et tu gardes la main sur tout. Le bon choix dépend de ton budget, de ton temps et de tes compétences techniques. Voici une comparaison neutre, avec les chiffres publiés par les deux plateformes et par le Web Almanac 2025.",
      en: "Shopify and WooCommerce are the two most used ecommerce platforms in the world. Shopify is a hosted, subscription based solution: everything is managed for you. WooCommerce is a free WordPress plugin: you host your store and control everything. The right choice depends on your budget, your time and your technical skills. Here is a neutral comparison, with figures published by both platforms and by the 2025 Web Almanac.",
    },
    compare: [
      [{ fr: "Type", en: "Type" }, { fr: "Plateforme hébergée", en: "Hosted platform" }, { fr: "Extension WordPress à héberger", en: "WordPress plugin you host" }],
      [{ fr: "Prix du logiciel", en: "Software price" }, { fr: "27 $/mois (19 $ en annuel) pour Basic", en: "$27/month ($19 yearly) for Basic" }, { fr: "Gratuit", en: "Free" }],
      [{ fr: "Hébergement", en: "Hosting" }, { fr: "Inclus", en: "Included" }, { fr: "25 $ à 350 $/mois selon WooCommerce", en: "$25 to $350/month per WooCommerce" }],
      [{ fr: "Extensions payantes", en: "Paid extensions" }, { fr: "Applis à abonnement mensuel", en: "Apps with monthly subscriptions" }, { fr: "29 $ à 299 $/an par extension", en: "$29 to $299/year per extension" }],
      [{ fr: "Vitesse mobile (Core Web Vitals)", en: "Mobile speed (Core Web Vitals)" }, { fr: "≈ 76 % des boutiques passent", en: "About 76% of stores pass" }, { fr: "≈ 35 % des sites passent", en: "About 35% of sites pass" }],
      [{ fr: "Maintenance et sécurité", en: "Maintenance and security" }, { fr: "Gérées par Shopify", en: "Handled by Shopify" }, { fr: "À ta charge", en: "Your job" }],
      [{ fr: "Frais avec un prestataire tiers", en: "Fees with a third party provider" }, { fr: "2 % à 0,6 % selon forfait", en: "2% to 0.6% by plan" }, { fr: "Aucun frais WooCommerce", en: "No WooCommerce fee" }],
      [{ fr: "Paiement intégré en Afrique", en: "Built in payments in Africa" }, { fr: "Shopify Payments absent d'Afrique", en: "Shopify Payments not in Africa" }, { fr: "Plugins des prestataires locaux", en: "Local provider plugins" }],
      [{ fr: "Personnalisation", en: "Customization" }, { fr: "Thèmes et applis, code limité", en: "Themes and apps, limited code" }, { fr: "Totale, code ouvert", en: "Total, open source" }],
      [{ fr: "Prise en main", en: "Ease of use" }, { fr: "Très simple", en: "Very easy" }, { fr: "Demande des bases techniques", en: "Needs basic technical skills" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Le vrai coût de chaque plateforme", en: "The real cost of each platform" } },
      {
        type: "p",
        text: {
          fr: "Shopify affiche un prix clair : 27 $ par mois pour le forfait Basic sans engagement, 19 $ si tu paies à l'année, et 72 $ pour Grow. À cela s'ajoutent les applications : pour un formulaire COD en une page, par exemple, EasySell est gratuit jusqu'à 60 commandes par mois puis coûte 9,95 $ par mois. WooCommerce, lui, est gratuit, mais une boutique complète demande un hébergement, un domaine et souvent des extensions. La page tarifs officielle de WooCommerce estime l'hébergement entre 25 $ et 350 $ par mois pour la plupart des boutiques, et chaque extension payante entre 29 $ et 299 $ par an.",
          en: "Shopify shows a clear price: $27 per month for the Basic plan billed monthly, $19 if you pay yearly, and $72 for Grow. Then come the apps: for a one page COD form, for example, EasySell is free up to 60 orders per month and then costs $9.95 per month. WooCommerce is free, but a complete store needs hosting, a domain and often extensions. WooCommerce's official pricing page estimates hosting at $25 to $350 per month for most stores, and each paid extension at $29 to $299 per year.",
        },
      },
      {
        type: "tip",
        title: { fr: "À retenir", en: "Key point" },
        text: {
          fr: "« Gratuit » ne veut pas dire « sans coût ». Compare toujours le total mensuel : abonnement ou hébergement, applications ou extensions, et ton temps de maintenance.",
          en: "\"Free\" does not mean \"no cost\". Always compare the monthly total: subscription or hosting, apps or extensions, and your maintenance time.",
        },
      },
      { type: "h2", text: { fr: "Vitesse : un écart mesuré", en: "Speed: a measured gap" } },
      {
        type: "p",
        text: {
          fr: "Le Web Almanac 2025 de HTTP Archive mesure les Core Web Vitals sur des centaines de milliers de boutiques réelles. Sur mobile, environ 76 % des boutiques Shopify passent les trois indicateurs, contre environ 35 % des sites WooCommerce. La raison principale est le temps d'affichage du contenu principal (LCP), qui dépend beaucoup de l'hébergement, du thème et des plugins choisis. Une boutique WooCommerce bien optimisée peut être rapide, mais cela demande du travail. Pour un vendeur qui achète du trafic sur Facebook ou TikTok, chaque seconde de chargement compte.",
          en: "HTTP Archive's 2025 Web Almanac measures Core Web Vitals on hundreds of thousands of real stores. On mobile, about 76% of Shopify stores pass all three metrics, versus about 35% of WooCommerce sites. The main reason is the time to display the main content (LCP), which depends heavily on the hosting, theme and plugins you pick. A well optimized WooCommerce store can be fast, but it takes work. For a seller buying traffic on Facebook or TikTok, every second of loading matters.",
        },
      },
      { type: "h2", text: { fr: "Encaisser en Afrique", en: "Getting paid in Africa" } },
      {
        type: "p",
        text: {
          fr: "Shopify Payments est disponible dans 41 pays, dont aucun en Afrique. Un vendeur africain doit donc utiliser un prestataire tiers, et Shopify facture alors des frais de 2 % sur Basic, 1 % sur Grow et 0,6 % sur Advanced. Le paiement à la livraison, lui, est un paiement manuel sans frais de transaction tiers. Sur WooCommerce, il n'y a pas de frais de plateforme : tu installes le plugin de ton prestataire local de Mobile Money et seul ce prestataire facture ses frais.",
          en: "Shopify Payments is available in 41 countries, none of them in Africa. An African seller must therefore use a third party provider, and Shopify then charges 2% on Basic, 1% on Grow and 0.6% on Advanced. Cash on delivery is a manual payment with no third party transaction fees. On WooCommerce, there is no platform fee: you install your local Mobile Money provider's plugin and only that provider charges its fees.",
        },
      },
      { type: "h2", text: { fr: "Temps et compétences", en: "Time and skills" } },
      {
        type: "list",
        items: [
          { fr: "Shopify : tu te concentres sur tes produits et ta publicité, la plateforme gère serveurs, sécurité et mises à jour.", en: "Shopify: you focus on products and ads, the platform handles servers, security and updates." },
          { fr: "WooCommerce : tu gères les mises à jour de WordPress, du thème et des plugins, les sauvegardes et la sécurité, ou tu paies quelqu'un pour le faire.", en: "WooCommerce: you handle WordPress, theme and plugin updates, backups and security, or pay someone to do it." },
          { fr: "WooCommerce garde l'avantage pour le contenu et le blog, grâce à WordPress.", en: "WooCommerce keeps the edge for content and blogging, thanks to WordPress." },
        ],
      },
      {
        type: "cta",
        title: { fr: "Tu vends surtout en COD et Mobile Money ?", en: "Do you mostly sell with COD and Mobile Money?" },
        text: {
          fr: "Zuri inclut le formulaire COD, les closers et le Mobile Money, sans hébergement à gérer et gratuitement pendant le lancement.",
          en: "Zuri includes the COD form, closers and Mobile Money, with no hosting to manage, free during launch.",
        },
      },
    ],
    verdict: {
      fr: "Choisis Shopify si tu veux une boutique rapide et fiable sans t'occuper de la technique, et si ton budget mensuel le permet. Choisis WooCommerce si tu as des compétences techniques ou un développeur, si tu veux un contrôle total et si le contenu est au cœur de ta stratégie. Si tu es un vendeur africain qui vend surtout en paiement à la livraison et en Mobile Money, aucune des deux n'inclut nativement les closers ni le paiement local : Zuri est une troisième option pensée pour ce cas, avec des pages très légères, 0 % de commission et des prix en FCFA.",
      en: "Choose Shopify if you want a fast, reliable store without dealing with technical work, and your monthly budget allows it. Choose WooCommerce if you have technical skills or a developer, want full control and rely on content. If you are an African seller who mostly sells with cash on delivery and Mobile Money, neither includes closers or local payments natively: Zuri is a third option built for that case, with very light pages, 0% commission and prices in CFA francs.",
    },
    faqs: [
      {
        q: { fr: "Shopify ou WooCommerce, lequel est le moins cher ?", en: "Which is cheaper, Shopify or WooCommerce?" },
        a: {
          fr: "WooCommerce est gratuit, mais l'hébergement (25 $ à 350 $ par mois selon WooCommerce) et les extensions s'ajoutent. Shopify coûte 27 $ par mois en Basic sans engagement, plus les applications. Pour une petite boutique avec un hébergement d'entrée de gamme, WooCommerce peut revenir moins cher, à condition de faire la maintenance toi-même.",
          en: "WooCommerce is free, but hosting ($25 to $350 per month per WooCommerce) and extensions add up. Shopify costs $27 per month on Basic billed monthly, plus apps. For a small store on entry level hosting, WooCommerce can be cheaper, as long as you do the maintenance yourself.",
        },
      },
      {
        q: { fr: "Lequel est le plus rapide ?", en: "Which one is faster?" },
        a: {
          fr: "D'après le Web Almanac 2025, environ 76 % des boutiques Shopify passent les Core Web Vitals sur mobile, contre environ 35 % des sites WooCommerce. Un site WooCommerce peut être rapide, mais cela dépend de ton hébergeur et de tes plugins.",
          en: "According to the 2025 Web Almanac, about 76% of Shopify stores pass Core Web Vitals on mobile, versus about 35% of WooCommerce sites. A WooCommerce site can be fast, but it depends on your host and plugins.",
        },
      },
      {
        q: { fr: "Lequel fonctionne le mieux avec Mobile Money ?", en: "Which works best with Mobile Money?" },
        a: {
          fr: "WooCommerce a l'avantage de ne prendre aucun frais de plateforme : tu installes le plugin de ton prestataire. Sur Shopify, un prestataire tiers est nécessaire en Afrique, avec des frais Shopify de 2 % à 0,6 %.",
          en: "WooCommerce has the advantage of no platform fee: you install your provider's plugin. On Shopify, a third party provider is required in Africa, with Shopify fees of 2% to 0.6%.",
        },
      },
      {
        q: { fr: "Peut-on passer de WooCommerce à Shopify, ou l'inverse ?", en: "Can you move from WooCommerce to Shopify, or the other way?" },
        a: {
          fr: "Oui. Les deux plateformes permettent d'exporter les produits en CSV. Les avis clients, les redirections et les réglages de paiement demandent un peu plus de travail.",
          en: "Yes. Both platforms let you export products as CSV. Customer reviews, redirects and payment settings take a bit more work.",
        },
      },
      {
        q: { fr: "Quelle plateforme pour le COD en Afrique ?", en: "Which platform for COD in Africa?" },
        a: {
          fr: "Les deux acceptent le paiement à la livraison, mais la gestion des closers et des statuts COD demande des applications ou des plugins. Une plateforme spécialisée comme Zuri inclut ces outils dès le départ.",
          en: "Both accept cash on delivery, but managing closers and COD statuses needs apps or plugins. A specialized platform like Zuri includes these tools from the start.",
        },
      },
    ],
    sources: [SRC.shopifyPricing, SRC.shopifyPaymentsCountries, SRC.shopifyManual, SRC.easySell, SRC.wooPricing, SRC.almanac],
  },
  // ------------------------------------------------------- SHOPIFY VS WIX
  {
    slug: "shopify-vs-wix",
    a: "Shopify",
    b: "Wix",
    title: {
      fr: "Shopify ou Wix en 2026 : quel outil pour ta boutique en ligne ? | Zuri",
      en: "Shopify vs Wix in 2026: which tool for your online store? | Zuri",
    },
    description: {
      fr: "Shopify ou Wix ? Comparatif neutre : prix, vitesse mesurée, e-commerce, éditeur et paiement en Afrique, avec les chiffres officiels de novembre 2026.",
      en: "Shopify or Wix? A neutral comparison: price, measured speed, ecommerce, editor and payments in Africa, with official figures from November 2026.",
    },
    h1: {
      fr: "Shopify ou Wix : lequel choisir pour vendre en ligne ?",
      en: "Shopify vs Wix: which one should you choose to sell online?",
    },
    intro: {
      fr: "Shopify est une plateforme 100 % e-commerce. Wix est un créateur de sites généraliste qui propose aussi une boutique. Les deux sont hébergés, rapides et faciles à prendre en main, mais ils ne visent pas exactement le même besoin. Si ton activité tourne autour de la vente de produits, ou si tu veux surtout un beau site avec quelques ventes, la réponse change. Voici une comparaison neutre.",
      en: "Shopify is a 100% ecommerce platform. Wix is a general website builder that also offers a store. Both are hosted, fast and easy to use, but they do not target exactly the same need. Whether your business revolves around selling products, or you mainly want a beautiful site with a few sales, changes the answer. Here is a neutral comparison.",
    },
    compare: [
      [{ fr: "Positionnement", en: "Positioning" }, { fr: "E-commerce d'abord", en: "Ecommerce first" }, { fr: "Créateur de sites généraliste", en: "General website builder" }],
      [{ fr: "Prix pour vendre", en: "Price to sell" }, { fr: "Basic 27 $/mois (19 $ en annuel)", en: "Basic $27/month ($19 yearly)" }, { fr: "Forfait Core ou plus, prix selon le pays", en: "Core plan or higher, price by country" }],
      [{ fr: "Forfait gratuit", en: "Free plan" }, { fr: "Non (essai 3 jours puis 1 $/mois pendant 3 mois)", en: "No (3 day trial then $1/month for 3 months)" }, { fr: "Oui, sans paiements", en: "Yes, without payments" }],
      [{ fr: "Vitesse mobile (Core Web Vitals)", en: "Mobile speed (Core Web Vitals)" }, { fr: "≈ 76 % des boutiques passent", en: "About 76% of stores pass" }, { fr: "≈ 66 % des boutiques passent", en: "About 66% of stores pass" }],
      [{ fr: "Éditeur", en: "Editor" }, { fr: "Thèmes par sections", en: "Section based themes" }, { fr: "Glisser-déposer libre", en: "Free form drag and drop" }],
      [{ fr: "Applications", en: "Apps" }, { fr: "Écosystème très large", en: "Very large ecosystem" }, { fr: "Wix App Market", en: "Wix App Market" }],
      [{ fr: "Paiement intégré en Afrique", en: "Built in payments in Africa" }, { fr: "Shopify Payments absent d'Afrique", en: "Shopify Payments not in Africa" }, { fr: "Selon le pays, Mobile Money non cité", en: "Depends on country, Mobile Money not cited" }],
      [{ fr: "Paiement à la livraison", en: "Cash on delivery" }, { fr: "Oui, paiement manuel", en: "Yes, manual payment" }, { fr: "Selon réglages", en: "Depends on settings" }],
      [{ fr: "Blog, réservations, services", en: "Blog, bookings, services" }, { fr: "Blog basique, le reste via applis", en: "Basic blog, the rest via apps" }, { fr: "Inclus et complets", en: "Included and complete" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Deux philosophies différentes", en: "Two different philosophies" } },
      {
        type: "p",
        text: {
          fr: "Shopify a été conçu pour vendre : gestion du catalogue, des stocks, des commandes et des canaux de vente. Tout le reste passe par des applications. Wix a été conçu pour créer des sites : son éditeur glisser-déposer te laisse placer chaque élément où tu veux, et il ajoute la boutique, le blog, les réservations ou les e-mails marketing au même endroit. Si ton site est d'abord une boutique, Shopify est plus naturel. Si ton site est d'abord une vitrine ou une activité de services, Wix est souvent plus simple.",
          en: "Shopify was built for selling: catalog, inventory, orders and sales channels. Everything else goes through apps. Wix was built for creating websites: its drag and drop editor lets you place every element where you want, and it adds the store, blog, bookings or email marketing in one place. If your site is first a store, Shopify feels more natural. If your site is first a showcase or a service business, Wix is often simpler.",
        },
      },
      { type: "h2", text: { fr: "Prix", en: "Price" } },
      {
        type: "p",
        text: {
          fr: "Shopify coûte 27 $ par mois en Basic sans engagement, ou 19 $ par mois en annuel, après un essai de 3 jours puis 1 $ par mois pendant 3 mois. Wix a un forfait gratuit pour créer un site, mais sans paiement en ligne : sur la page officielle, la vente commence au forfait Core. Wix précise que ses prix varient selon le pays, donc vérifie le tarif affiché pour le tien.",
          en: "Shopify costs $27 per month on Basic billed monthly, or $19 per month billed yearly, after a 3 day trial and then $1 per month for 3 months. Wix has a free plan to build a site, but without online payments: on the official page, selling starts with the Core plan. Wix says its prices vary by country, so check the price shown for yours.",
        },
      },
      { type: "h2", text: { fr: "Vitesse : les deux sont bons", en: "Speed: both are good" } },
      {
        type: "p",
        text: {
          fr: "Selon le Web Almanac 2025, environ 76 % des boutiques Shopify et 66 % des boutiques Wix passent les Core Web Vitals sur mobile. Ce sont deux bons scores, bien au-dessus de la moyenne des grandes plateformes. La vitesse ne devrait donc pas être ton critère principal entre les deux.",
          en: "According to the 2025 Web Almanac, about 76% of Shopify stores and 66% of Wix stores pass Core Web Vitals on mobile. Both are good scores, well above the average of large platforms. Speed should not be your main criterion between the two.",
        },
      },
      { type: "h2", text: { fr: "Vendre depuis l'Afrique", en: "Selling from Africa" } },
      {
        type: "p",
        text: {
          fr: "Shopify Payments n'est disponible dans aucun pays africain : il faut un prestataire tiers, avec des frais Shopify de 2 % à 0,6 % selon le forfait. Le paiement à la livraison est possible en paiement manuel. La page des forfaits Wix met en avant les cartes bancaires, ne cite pas le Mobile Money et indique que d'autres moyens peuvent exister selon ta région. Dans les deux cas, renseigne-toi sur les prestataires disponibles dans ton pays avant de te lancer.",
          en: "Shopify Payments is not available in any African country: you need a third party provider, with Shopify fees of 2% to 0.6% depending on the plan. Cash on delivery works as a manual payment. The Wix plans page highlights bank cards, does not mention Mobile Money and says other options may exist depending on your region. In both cases, check which providers are available in your country before you start.",
        },
      },
      {
        type: "list",
        items: [
          { fr: "Tu vends beaucoup de produits et veux des outils e-commerce avancés : Shopify.", en: "You sell many products and want advanced ecommerce tools: Shopify." },
          { fr: "Tu veux un beau site vitrine, un portfolio ou des réservations avec quelques ventes : Wix.", en: "You want a beautiful showcase site, portfolio or bookings with some sales: Wix." },
          { fr: "Tu vends surtout un produit à la fois en publicité, en COD : regarde aussi les outils spécialisés.", en: "You mostly sell one product at a time with ads and COD: also look at specialized tools." },
        ],
      },
      {
        type: "cta",
        title: { fr: "Une page de vente COD prête en quelques minutes", en: "A COD sales page ready in minutes" },
        text: {
          fr: "Avec Zuri, ta page de vente est prête en quelques minutes, et tu reçois les commandes COD et Mobile Money en FCFA.",
          en: "With Zuri, your sales page is ready in minutes, and you receive COD and Mobile Money orders in CFA francs.",
        },
      },
    ],
    verdict: {
      fr: "Shopify est le meilleur choix si la vente est le cœur de ton activité et que tu veux un écosystème d'applications très large. Wix est le meilleur choix si tu veux un site complet et joli, avec la boutique comme une fonction parmi d'autres. Si tu es un vendeur africain qui vit du paiement à la livraison et du Mobile Money, les deux te demanderont d'ajouter des outils pour gérer tes closers et le paiement local : Zuri est une option qui les inclut, gratuitement pendant le lancement.",
      en: "Shopify is the best choice if selling is the core of your business and you want a very large app ecosystem. Wix is the best choice if you want a complete, beautiful website with the store as one feature among others. If you are an African seller who lives on cash on delivery and Mobile Money, both will require extra tools to manage closers and local payments: Zuri is an option that includes them, free during launch.",
    },
    faqs: [
      {
        q: { fr: "Shopify ou Wix, lequel est le plus simple ?", en: "Which is easier, Shopify or Wix?" },
        a: {
          fr: "Les deux sont faciles. Wix est souvent jugé plus intuitif pour la mise en page grâce au glisser-déposer. Shopify est plus simple pour gérer un catalogue et des commandes.",
          en: "Both are easy. Wix is often seen as more intuitive for layout thanks to drag and drop. Shopify is simpler for managing a catalog and orders.",
        },
      },
      {
        q: { fr: "Lequel est le moins cher ?", en: "Which one is cheaper?" },
        a: {
          fr: "Cela dépend de ton pays, car Wix adapte ses prix localement. Shopify Basic coûte 27 $ par mois sans engagement. Compare le forfait Wix Core affiché pour ton pays, puis ajoute les applications dont tu as besoin de chaque côté.",
          en: "It depends on your country, since Wix adapts its prices locally. Shopify Basic costs $27 per month billed monthly. Compare the Wix Core plan shown for your country, then add the apps you need on each side.",
        },
      },
      {
        q: { fr: "Wix est-il plus lent que Shopify ?", en: "Is Wix slower than Shopify?" },
        a: {
          fr: "Un peu, en moyenne : 66 % des boutiques Wix contre 76 % des boutiques Shopify passent les Core Web Vitals sur mobile selon le Web Almanac 2025. Les deux restent de bons élèves.",
          en: "Slightly, on average: 66% of Wix stores versus 76% of Shopify stores pass Core Web Vitals on mobile according to the 2025 Web Almanac. Both remain good performers.",
        },
      },
      {
        q: { fr: "Peut-on accepter le Mobile Money sur Shopify ou Wix ?", en: "Can you accept Mobile Money on Shopify or Wix?" },
        a: {
          fr: "Pas avec leurs solutions de paiement intégrées en Afrique. Sur Shopify, un prestataire tiers est possible, avec des frais Shopify. Sur Wix, les options dépendent de la région. Vérifie pour ton pays.",
          en: "Not with their built in payment solutions in Africa. On Shopify, a third party provider is possible, with Shopify fees. On Wix, options depend on the region. Check for your country.",
        },
      },
    ],
    sources: [SRC.shopifyPricing, SRC.shopifyPaymentsCountries, SRC.shopifyManual, SRC.wixPlans, SRC.almanac],
  },
  // ---------------------------------------------------- YOUCAN VS SHOPIFY
  {
    slug: "youcan-vs-shopify",
    a: "YouCan",
    b: "Shopify",
    title: {
      fr: "YouCan ou Shopify en 2026 : quel choix pour le COD ? | Zuri",
      en: "YouCan vs Shopify in 2026: which one for cash on delivery? | Zuri",
    },
    description: {
      fr: "YouCan ou Shopify pour vendre en paiement à la livraison ? Prix, commissions, outils COD et avis publics comparés avec les chiffres officiels.",
      en: "YouCan or Shopify for cash on delivery? Prices, fees, COD tools and public reviews compared with official figures.",
    },
    h1: {
      fr: "YouCan ou Shopify : lequel choisir pour vendre en COD ?",
      en: "YouCan vs Shopify: which one should you choose for COD?",
    },
    intro: {
      fr: "YouCan est une plateforme marocaine pensée pour le paiement à la livraison, avec une formule sans abonnement. Shopify est le leader mondial de l'e-commerce hébergé, avec un écosystème immense. Beaucoup de vendeurs COD hésitent entre les deux. Voici une comparaison neutre de leurs prix, de leur modèle et de leurs outils, avec les chiffres publiés en novembre 2026.",
      en: "YouCan is a Moroccan platform built for cash on delivery, with a no subscription option. Shopify is the global leader in hosted ecommerce, with a huge ecosystem. Many COD sellers hesitate between the two. Here is a neutral comparison of their prices, model and tools, with figures published in November 2026.",
    },
    compare: [
      [{ fr: "Origine et marché", en: "Origin and market" }, { fr: "Maroc, vendeurs COD", en: "Morocco, COD sellers" }, { fr: "Canada, marché mondial", en: "Canada, global market" }],
      [{ fr: "Démarrer sans abonnement", en: "Start with no subscription" }, { fr: "Oui, rien avant 5 000 $ de ventes", en: "Yes, nothing until $5,000 in sales" }, { fr: "Non, 3 jours d'essai puis 1 $/mois pendant 3 mois", en: "No, 3 day trial then $1/month for 3 months" }],
      [{ fr: "Abonnements", en: "Subscriptions" }, { fr: "29 $ à 229 $/mois", en: "$29 to $229/month" }, { fr: "27 $, 72 $, 399 $/mois (moins en annuel)", en: "$27, $72, $399/month (less yearly)" }],
      [{ fr: "Frais sur le COD", en: "Fees on COD" }, { fr: "0,5 % puis 0,25 % sans abonnement, 0 avec", en: "0.5% then 0.25% with no subscription, 0 with one" }, { fr: "Aucun frais tiers (paiement manuel)", en: "No third party fee (manual payment)" }],
      [{ fr: "Frais sur le paiement en ligne", en: "Fees on online payments" }, { fr: "1 % puis 0,5 % sans abonnement, 0 avec", en: "1% then 0.5% with no subscription, 0 with one" }, { fr: "2 % à 0,6 % avec un prestataire tiers", en: "2% to 0.6% with a third party provider" }],
      [{ fr: "Formulaire COD en une page", en: "One page COD form" }, { fr: "Pensé pour le COD", en: "Built for COD" }, { fr: "Via application (ex. EasySell)", en: "Via an app (e.g. EasySell)" }],
      [{ fr: "Écosystème d'applications", en: "App ecosystem" }, { fr: "Plus réduit", en: "Smaller" }, { fr: "Très large", en: "Very large" }],
      [{ fr: "Vitesse mesurée", en: "Measured speed" }, { fr: "Pas de mesure publique comparable", en: "No comparable public measure" }, { fr: "≈ 76 % passent les Core Web Vitals", en: "About 76% pass Core Web Vitals" }],
      [{ fr: "Avis Trustpilot (nov. 2026)", en: "Trustpilot reviews (Nov 2026)" }, { fr: "2,9/5 sur 73 avis", en: "2.9/5 from 73 reviews" }, { fr: "Non comparé ici", en: "Not compared here" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Deux modèles de prix", en: "Two pricing models" } },
      {
        type: "p",
        text: {
          fr: "La grande force de YouCan, c'est sa formule sans abonnement. Tu ne paies rien avant d'avoir fait 5 000 $ de ventes. Ensuite, YouCan prend 0,5 % sur les commandes COD et 1 % sur les paiements en ligne, puis 0,25 % et 0,5 % au-delà de 5 000 $. Si tu préfères un prix fixe, les abonnements vont de 29 $ (Solopreneur) à 229 $ (Unlimited, jusqu'à 5 boutiques), sans frais de transaction. Shopify fonctionne uniquement par abonnement : 27 $ par mois en Basic sans engagement, 72 $ en Grow, moins en annuel.",
          en: "YouCan's main strength is its no subscription option. You pay nothing until you reach $5,000 in sales. After that, YouCan takes 0.5% on COD orders and 1% on online payments, then 0.25% and 0.5% above $5,000. If you prefer a fixed price, subscriptions range from $29 (Solopreneur) to $229 (Unlimited, up to 5 stores), with no transaction fees. Shopify only works by subscription: $27 per month on Basic billed monthly, $72 on Grow, less yearly.",
        },
      },
      { type: "h2", text: { fr: "Les outils COD", en: "COD tools" } },
      {
        type: "p",
        text: {
          fr: "YouCan a été pensé dès le départ pour le paiement à la livraison. Sur Shopify, le COD est un « paiement manuel » sans frais de transaction tiers, mais le formulaire de commande en une page, très utilisé en Afrique, passe par une application. Exemple : EasySell est gratuit jusqu'à 60 commandes par mois, puis 9,95 $ par mois pour 440 commandes. Chaque fonction en plus (avis, compte à rebours, packs) peut demander une autre application.",
          en: "YouCan was designed for cash on delivery from the start. On Shopify, COD is a \"manual payment\" with no third party transaction fees, but the one page order form, widely used in Africa, requires an app. Example: EasySell is free up to 60 orders per month, then $9.95 per month for 440 orders. Each extra feature (reviews, countdown, bundles) can require another app.",
        },
      },
      { type: "h2", text: { fr: "Paiement en ligne en Afrique", en: "Online payments in Africa" } },
      {
        type: "p",
        text: {
          fr: "Shopify Payments n'est disponible dans aucun pays africain, donc un prestataire tiers est nécessaire, avec des frais Shopify de 2 % à 0,6 %. La page tarifs de YouCan cite Stripe comme exemple de prestataire et ne présente pas de connexion Mobile Money pour l'Afrique de l'Ouest. Si tes clients paient en Mobile Money, vérifie les deux options pour ton pays.",
          en: "Shopify Payments is not available in any African country, so a third party provider is required, with Shopify fees of 2% to 0.6%. YouCan's pricing page cites Stripe as an example provider and does not present a Mobile Money connection for West Africa. If your customers pay with Mobile Money, check both options for your country.",
        },
      },
      { type: "h2", text: { fr: "Fiabilité et réputation", en: "Reliability and reputation" } },
      {
        type: "p",
        text: {
          fr: "Shopify est une entreprise cotée en bourse, avec des boutiques mesurées parmi les plus rapides du Web Almanac 2025. YouCan est plus jeune et plus régional. Sur Trustpilot, YouCan a une note de 2,9 sur 5 sur 73 avis en novembre 2026, avec des avis très partagés : beaucoup saluent la simplicité et le démarrage gratuit, d'autres critiquent la réactivité du support. Trustpilot rappelle ne pas vérifier tous les avis.",
          en: "Shopify is a publicly listed company, with stores measured among the fastest in the 2025 Web Almanac. YouCan is younger and more regional. On Trustpilot, YouCan has a score of 2.9 out of 5 from 73 reviews in November 2026, with very split opinions: many praise its simplicity and free start, others criticize support response times. Trustpilot notes it does not verify every review.",
        },
      },
      {
        type: "cta",
        title: { fr: "Tu vends en Afrique de l'Ouest ?", en: "Selling in West Africa?" },
        text: {
          fr: "Zuri combine le meilleur des deux pour le COD : gratuit pendant le lancement, 0 % de commission, Mobile Money en FCFA et closers inclus.",
          en: "Zuri brings COD essentials together: free during launch, 0% commission, Mobile Money in CFA francs and closers included.",
        },
      },
    ],
    verdict: {
      fr: "YouCan est plus adapté si tu débutes en COD avec un petit budget, surtout au Maroc ou en Afrique du Nord, grâce à son démarrage sans abonnement. Shopify est plus adapté si tu veux une plateforme mondiale, très rapide et extensible, et que tu acceptes de payer un abonnement et des applications. Pour un vendeur d'Afrique de l'Ouest ou centrale qui vend en COD et en Mobile Money, Zuri est une troisième option : gratuit pendant le lancement, sans commission, avec les prestataires locaux FeexPay, FedaPay, PayDunya et PawaPay.",
      en: "YouCan fits better if you are starting COD on a small budget, especially in Morocco or North Africa, thanks to its no subscription start. Shopify fits better if you want a global, very fast and extensible platform, and accept paying for a subscription and apps. For a seller in West or Central Africa who sells with COD and Mobile Money, Zuri is a third option: free during launch, no commission, with local providers FeexPay, FedaPay, PayDunya and PawaPay.",
    },
    faqs: [
      {
        q: { fr: "YouCan est-il moins cher que Shopify ?", en: "Is YouCan cheaper than Shopify?" },
        a: {
          fr: "Au démarrage, oui : YouCan ne facture rien avant 5 000 $ de ventes, puis une petite commission. Shopify demande un abonnement de 27 $ par mois en Basic après la période d'essai, plus les applications COD.",
          en: "At the start, yes: YouCan charges nothing until $5,000 in sales, then a small fee. Shopify requires a $27 per month Basic subscription after the trial, plus COD apps.",
        },
      },
      {
        q: { fr: "Lequel est le meilleur pour le COD ?", en: "Which one is better for COD?" },
        a: {
          fr: "YouCan est pensé pour le COD dès le départ. Shopify le permet en paiement manuel, mais le formulaire COD en une page passe par une application. Pour la gestion des closers, regarde aussi les outils spécialisés.",
          en: "YouCan is built for COD from the start. Shopify allows it as a manual payment, but the one page COD form requires an app. For closer management, also look at specialized tools.",
        },
      },
      {
        q: { fr: "Shopify prend-il des frais sur le COD ?", en: "Does Shopify charge fees on COD?" },
        a: {
          fr: "Non. Selon l'aide officielle de Shopify, il n'y a pas de frais de transaction tiers sur les paiements manuels comme le COD.",
          en: "No. According to Shopify's official help, there are no third party transaction fees on manual payments like COD.",
        },
      },
      {
        q: { fr: "Peut-on passer de YouCan à Shopify ?", en: "Can you move from YouCan to Shopify?" },
        a: {
          fr: "Oui, en recréant ou en important tes produits. Certains vendeurs le font quand leur catalogue grandit. L'inverse est aussi possible.",
          en: "Yes, by recreating or importing your products. Some sellers do it as their catalog grows. The reverse is also possible.",
        },
      },
    ],
    sources: [SRC.youcanPricing, SRC.youcanTrustpilot, SRC.shopifyPricing, SRC.shopifyPaymentsCountries, SRC.shopifyManual, SRC.easySell, SRC.almanac],
  },
  // ----------------------------------------------------- WOOCOMMERCE VS WIX
  {
    slug: "woocommerce-vs-wix",
    a: "WooCommerce",
    b: "Wix",
    title: {
      fr: "WooCommerce ou Wix en 2026 : liberté ou simplicité ? | Zuri",
      en: "WooCommerce vs Wix in 2026: freedom or simplicity? | Zuri",
    },
    description: {
      fr: "WooCommerce ou Wix ? Coûts réels, vitesse mesurée, maintenance et paiement en Afrique comparés de façon neutre, avec les sources officielles.",
      en: "WooCommerce or Wix? Real costs, measured speed, maintenance and payments in Africa compared neutrally, with official sources.",
    },
    h1: {
      fr: "WooCommerce ou Wix : lequel choisir pour ta boutique ?",
      en: "WooCommerce vs Wix: which one should you choose for your store?",
    },
    intro: {
      fr: "WooCommerce et Wix représentent deux façons opposées de créer une boutique. WooCommerce est libre et gratuit, mais tu gères tout : hébergement, mises à jour, plugins. Wix est hébergé et tout-en-un : tu paies un forfait et tu construis ton site avec un éditeur visuel. Voici comment les départager selon ton profil.",
      en: "WooCommerce and Wix are two opposite ways to build a store. WooCommerce is open source and free, but you manage everything: hosting, updates, plugins. Wix is hosted and all in one: you pay a plan and build your site with a visual editor. Here is how to choose between them based on your profile.",
    },
    compare: [
      [{ fr: "Type", en: "Type" }, { fr: "Extension WordPress à héberger", en: "WordPress plugin you host" }, { fr: "Plateforme hébergée tout-en-un", en: "All in one hosted platform" }],
      [{ fr: "Prix du logiciel", en: "Software price" }, { fr: "Gratuit", en: "Free" }, { fr: "Forfait payant pour vendre (Core ou plus)", en: "Paid plan to sell (Core or higher)" }],
      [{ fr: "Hébergement", en: "Hosting" }, { fr: "25 $ à 350 $/mois selon WooCommerce", en: "$25 to $350/month per WooCommerce" }, { fr: "Inclus", en: "Included" }],
      [{ fr: "Vitesse mobile (Core Web Vitals)", en: "Mobile speed (Core Web Vitals)" }, { fr: "≈ 35 % des sites passent", en: "About 35% of sites pass" }, { fr: "≈ 66 % des boutiques passent", en: "About 66% of stores pass" }],
      [{ fr: "Maintenance", en: "Maintenance" }, { fr: "À ta charge", en: "Your job" }, { fr: "Gérée par Wix", en: "Handled by Wix" }],
      [{ fr: "Personnalisation", en: "Customization" }, { fr: "Totale, code ouvert", en: "Total, open source" }, { fr: "Large dans l'éditeur, code limité", en: "Wide in the editor, limited code" }],
      [{ fr: "Propriété et portabilité", en: "Ownership and portability" }, { fr: "Tu possèdes tout, hébergeur au choix", en: "You own everything, any host" }, { fr: "Site lié à la plateforme Wix", en: "Site tied to the Wix platform" }],
      [{ fr: "Paiement en Afrique", en: "Payments in Africa" }, { fr: "Plugins des prestataires locaux", en: "Local provider plugins" }, { fr: "Selon le pays, Mobile Money non cité", en: "Depends on country, Mobile Money not cited" }],
      [{ fr: "Prise en main", en: "Ease of use" }, { fr: "Demande des bases techniques", en: "Needs basic technical skills" }, { fr: "Très simple", en: "Very easy" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Coûts : gratuit contre forfait", en: "Cost: free versus plan" } },
      {
        type: "p",
        text: {
          fr: "WooCommerce est gratuit, mais une boutique en ligne a besoin d'un hébergement, d'un domaine et souvent d'extensions payantes. La page tarifs de WooCommerce estime l'hébergement entre 25 $ et 350 $ par mois pour la plupart des boutiques et chaque extension entre 29 $ et 299 $ par an. Wix inclut l'hébergement dans son forfait, mais il faut au moins le forfait Core pour accepter des paiements, et le prix varie selon ton pays.",
          en: "WooCommerce is free, but an online store needs hosting, a domain and often paid extensions. WooCommerce's pricing page estimates hosting at $25 to $350 per month for most stores and each extension at $29 to $299 per year. Wix includes hosting in its plan, but you need at least the Core plan to accept payments, and the price varies by country.",
        },
      },
      { type: "h2", text: { fr: "Vitesse et maintenance", en: "Speed and maintenance" } },
      {
        type: "p",
        text: {
          fr: "D'après le Web Almanac 2025, environ 66 % des boutiques Wix passent les Core Web Vitals sur mobile, contre environ 35 % des sites WooCommerce. Sur WooCommerce, la vitesse dépend de ton hébergeur, de ton thème et de tes plugins : un site bien optimisé peut être très rapide, mais il faut s'en occuper. Les mises à jour, les sauvegardes et la sécurité sont aussi de ta responsabilité. Sur Wix, tout cela est géré pour toi.",
          en: "According to the 2025 Web Almanac, about 66% of Wix stores pass Core Web Vitals on mobile, versus about 35% of WooCommerce sites. On WooCommerce, speed depends on your host, theme and plugins: a well optimized site can be very fast, but it needs care. Updates, backups and security are also your responsibility. On Wix, all of that is handled for you.",
        },
      },
      { type: "h2", text: { fr: "Liberté et propriété", en: "Freedom and ownership" } },
      {
        type: "p",
        text: {
          fr: "WooCommerce est open source : tu peux changer d'hébergeur, modifier le code et ajouter n'importe quelle fonction. C'est un vrai avantage si ton projet grandit ou a des besoins particuliers. Wix est plus fermé : tu travailles dans son éditeur et avec ses applications, ce qui est plus simple mais moins flexible.",
          en: "WooCommerce is open source: you can change hosts, modify the code and add any feature. That is a real advantage if your project grows or has special needs. Wix is more closed: you work inside its editor and apps, which is simpler but less flexible.",
        },
      },
      { type: "h2", text: { fr: "Paiement en Afrique", en: "Payments in Africa" } },
      {
        type: "p",
        text: {
          fr: "De nombreux prestataires africains de Mobile Money proposent un plugin WooCommerce, sans frais de plateforme en plus. Sur Wix, la page des forfaits cite les cartes bancaires et indique que d'autres moyens peuvent exister selon la région, sans mentionner le Mobile Money. Si tes clients paient surtout en Mobile Money, vérifie les options disponibles dans ton pays avant de choisir.",
          en: "Many African Mobile Money providers offer a WooCommerce plugin, with no extra platform fee. On Wix, the plans page cites bank cards and says other options may exist depending on the region, without mentioning Mobile Money. If your customers mostly pay with Mobile Money, check the options available in your country before choosing.",
        },
      },
      {
        type: "tip",
        title: { fr: "Conseil", en: "Tip" },
        text: {
          fr: "Fais le calcul sur 12 mois : forfait ou hébergement, extensions, et le temps que tu passeras sur la technique au lieu de vendre.",
          en: "Do the math over 12 months: plan or hosting, extensions, and the time you will spend on technical work instead of selling.",
        },
      },
      {
        type: "cta",
        title: { fr: "Ni serveur, ni éditeur compliqué", en: "No server, no complex editor" },
        text: {
          fr: "Zuri crée ta page de vente COD en quelques minutes, avec Mobile Money et closers inclus.",
          en: "Zuri builds your COD sales page in minutes, with Mobile Money and closers included.",
        },
      },
    ],
    verdict: {
      fr: "Choisis WooCommerce si tu veux la liberté totale, si tu as des compétences techniques ou un développeur, et si tu veux pouvoir tout changer plus tard. Choisis Wix si tu veux un site joli et complet sans te soucier de la technique, et que le forfait de ton pays te convient. Si ton activité est la vente de produits en paiement à la livraison et en Mobile Money en Afrique, ni l'un ni l'autre n'inclut nativement la gestion des closers : Zuri est une option pensée pour ce cas, gratuite pendant le lancement.",
      en: "Choose WooCommerce if you want total freedom, have technical skills or a developer, and want to be able to change anything later. Choose Wix if you want a beautiful, complete site without worrying about technical work, and the plan in your country suits you. If your business is selling products with cash on delivery and Mobile Money in Africa, neither includes closer management natively: Zuri is an option built for that case, free during launch.",
    },
    faqs: [
      {
        q: { fr: "WooCommerce ou Wix, lequel est le moins cher ?", en: "Which is cheaper, WooCommerce or Wix?" },
        a: {
          fr: "WooCommerce peut être moins cher avec un petit hébergement et peu d'extensions, à condition de faire la maintenance toi-même. Wix a un coût plus prévisible, car l'hébergement est inclus dans le forfait.",
          en: "WooCommerce can be cheaper with small hosting and few extensions, as long as you do the maintenance yourself. Wix has a more predictable cost, since hosting is included in the plan.",
        },
      },
      {
        q: { fr: "Lequel est le plus rapide ?", en: "Which one is faster?" },
        a: {
          fr: "En moyenne, Wix : environ 66 % de ses boutiques passent les Core Web Vitals sur mobile, contre environ 35 % pour WooCommerce, selon le Web Almanac 2025.",
          en: "On average, Wix: about 66% of its stores pass Core Web Vitals on mobile, versus about 35% for WooCommerce, according to the 2025 Web Almanac.",
        },
      },
      {
        q: { fr: "Lequel est le meilleur pour le référencement ?", en: "Which one is better for SEO?" },
        a: {
          fr: "Les deux permettent un bon référencement. WooCommerce profite de la puissance de WordPress pour le blog et le contenu. Wix propose des outils SEO intégrés simples à utiliser.",
          en: "Both allow good SEO. WooCommerce benefits from WordPress for blogging and content. Wix offers built in SEO tools that are simple to use.",
        },
      },
      {
        q: { fr: "Lequel accepte le Mobile Money ?", en: "Which one accepts Mobile Money?" },
        a: {
          fr: "WooCommerce, grâce aux plugins de nombreux prestataires africains. Pour Wix, les options dépendent de ta région : vérifie pour ton pays.",
          en: "WooCommerce, thanks to plugins from many African providers. For Wix, options depend on your region: check for your country.",
        },
      },
    ],
    sources: [SRC.wooPricing, SRC.wixPlans, SRC.almanac],
  },
  // ------------------------------------------------------ CHARIOW VS SELAR
  {
    slug: "chariow-vs-selar",
    a: "Chariow",
    b: "Selar",
    title: {
      fr: "Chariow ou Selar en 2026 : où vendre tes produits digitaux ? | Zuri",
      en: "Chariow vs Selar in 2026: where to sell your digital products? | Zuri",
    },
    description: {
      fr: "Chariow ou Selar pour vendre ebooks et formations en Afrique ? Commissions, paiements, délais et marchés comparés avec les sources officielles.",
      en: "Chariow or Selar to sell ebooks and courses in Africa? Fees, payments, payout timing and markets compared with official sources.",
    },
    h1: {
      fr: "Chariow ou Selar : quelle plateforme pour tes produits digitaux ?",
      en: "Chariow vs Selar: which platform for your digital products?",
    },
    intro: {
      fr: "Chariow et Selar sont deux plateformes africaines pour vendre des produits numériques : ebooks, formations, templates, fichiers. Toutes les deux encaissent pour toi et livrent le produit automatiquement, sans abonnement obligatoire. Elles diffèrent surtout par leur commission, leur marché principal et leurs moyens de paiement. Voici une comparaison neutre pour t'aider à choisir.",
      en: "Chariow and Selar are two African platforms for selling digital products: ebooks, courses, templates, files. Both collect payments for you and deliver the product automatically, with no mandatory subscription. They mainly differ in fees, main market and payment methods. Here is a neutral comparison to help you choose.",
    },
    compare: [
      [{ fr: "Marché principal", en: "Main market" }, { fr: "Afrique francophone et au-delà", en: "French speaking Africa and beyond" }, { fr: "Nigeria et pays anglophones", en: "Nigeria and English speaking countries" }],
      [{ fr: "Abonnement", en: "Subscription" }, { fr: "Aucun", en: "None" }, { fr: "Non requis pour vendre", en: "Not required to sell" }],
      [{ fr: "Commission", en: "Commission" }, { fr: "15 %, puis 10 % au-delà de 5 000 $ de ventes", en: "15%, then 10% above $5,000 in sales" }, { fr: "4 % + 50 ₦ par vente en naira", en: "4% + ₦50 per naira sale" }],
      [{ fr: "Faire payer les frais au client", en: "Pass fees to the customer" }, { fr: "Non mentionné sur la page tarifs", en: "Not mentioned on the pricing page" }, { fr: "Oui, en option", en: "Yes, optional" }],
      [{ fr: "Moyens de paiement cités", en: "Payment methods cited" }, { fr: "Orange Money, Wave, MTN Money, cartes, virements", en: "Orange Money, Wave, MTN Money, cards, transfers" }, { fr: "Selon pays et devise", en: "Depends on country and currency" }],
      [{ fr: "Crédit des revenus", en: "Earnings credit" }, { fr: "72 h après la transaction (art. 11.2)", en: "72 hours after the transaction (art. 11.2)" }, { fr: "Selon les conditions de Selar", en: "Per Selar's terms" }],
      [{ fr: "Types de produits", en: "Product types" }, { fr: "Fichiers, formations, licences, packs, coaching", en: "Files, courses, licenses, bundles, coaching" }, { fr: "Produits numériques", en: "Digital products" }],
      [{ fr: "Avis Trustpilot (nov. 2026)", en: "Trustpilot reviews (Nov 2026)" }, { fr: "Non comparé ici", en: "Not compared here" }, { fr: "3,9/5 sur 313 avis", en: "3.9/5 from 313 reviews" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Commission : l'écart principal", en: "Fees: the main difference" } },
      {
        type: "p",
        text: {
          fr: "Chariow ne facture aucun abonnement ni frais d'installation. Il prend 15 % sur chaque vente tant que tu as fait moins de 5 000 $ de ventes, puis 10 %, et des taux sur mesure pour les gros volumes. Sur un ebook à 50 €, Chariow donne lui-même l'exemple : 7,50 € pour la plateforme, 42,50 € pour toi. Selar indique, pour les ventes en naira, des frais de 4 % plus 50 ₦ par transaction, et te permet de faire payer ces frais par le client à la caisse.",
          en: "Chariow charges no subscription or setup fee. It takes 15% on each sale while you are under $5,000 in sales, then 10%, with custom rates for high volumes. On a €50 ebook, Chariow gives the example itself: €7.50 for the platform, €42.50 for you. Selar states, for naira sales, a fee of 4% plus ₦50 per transaction, and lets you have the customer pay that fee at checkout.",
        },
      },
      { type: "h2", text: { fr: "Marché et moyens de paiement", en: "Market and payment methods" } },
      {
        type: "p",
        text: {
          fr: "Chariow met en avant de nombreux moyens de paiement utilisés en Afrique francophone : Mobile Money, Orange Money, Wave, MTN Money, ainsi que les cartes et les virements internationaux, avec conversion automatique des devises. Selar est né au Nigeria et sa communauté est surtout anglophone. Si tes clients sont au Sénégal, en Côte d'Ivoire ou au Cameroun, vérifie quels moyens de paiement chaque plateforme propose dans leur pays.",
          en: "Chariow highlights many payment methods used in French speaking Africa: Mobile Money, Orange Money, Wave, MTN Money, plus cards and international transfers, with automatic currency conversion. Selar was born in Nigeria and its community is mostly English speaking. If your customers are in Senegal, Côte d'Ivoire or Cameroon, check which payment methods each platform offers in their country.",
        },
      },
      { type: "h2", text: { fr: "Délais et conditions", en: "Timing and terms" } },
      {
        type: "p",
        text: {
          fr: "Sur Chariow, l'article 11.2 des conditions générales prévoit que les revenus sont crédités sur ton portefeuille 72 heures après la transaction, frais déduits. Comme sur toute plateforme qui encaisse pour toi, les conditions prévoient aussi une rétention possible des fonds en cas d'infraction aux règles (article 9.3) ou de contestation de paiement, jusqu'à sa résolution (article 13.2). Avant de choisir, lis les conditions de versement des deux plateformes pour ton pays.",
          en: "On Chariow, article 11.2 of the terms says earnings are credited to your wallet 72 hours after the transaction, minus fees. As with any platform that collects payments for you, the terms also allow funds to be withheld in case of a rule violation (article 9.3) or a payment dispute, until it is resolved (article 13.2). Before choosing, read the payout terms of both platforms for your country.",
        },
      },
      { type: "h2", text: { fr: "Réputation", en: "Reputation" } },
      {
        type: "p",
        text: {
          fr: "Selar affiche une note Trustpilot de 3,9 sur 5 sur 313 avis en novembre 2026, ce qui est un bon niveau pour une plateforme de paiement. Chariow est très présent dans la communauté des créateurs francophones. Dans les deux cas, demande l'avis de créateurs de ton pays.",
          en: "Selar shows a Trustpilot score of 3.9 out of 5 from 313 reviews in November 2026, a good level for a payment platform. Chariow is very present in the French speaking creator community. In both cases, ask creators in your country.",
        },
      },
      {
        type: "cta",
        title: { fr: "Garde ta plateforme, booste ta page de vente", en: "Keep your platform, boost your sales page" },
        text: {
          fr: "Zuri accepte tes liens Chariow et Selar sur des pages de vente rapides, et te permet aussi de vendre en direct sans commission.",
          en: "Zuri accepts your Chariow and Selar links on fast sales pages, and also lets you sell directly with no commission.",
        },
      },
    ],
    verdict: {
      fr: "Chariow est souvent le choix le plus naturel en Afrique francophone, grâce à ses moyens de paiement locaux, même si sa commission est plus élevée. Selar est très adapté si tu vends au Nigeria ou à un public anglophone, avec des frais plus bas sur les ventes en naira. Les deux sont de bonnes plateformes digitales. Si tu veux aussi vendre des produits physiques en paiement à la livraison, ou garder 100 % de ton prix avec ton propre compte Mobile Money, Zuri est une option complémentaire, compatible avec les liens Chariow et Selar.",
      en: "Chariow is often the most natural choice in French speaking Africa, thanks to its local payment methods, even though its commission is higher. Selar fits very well if you sell in Nigeria or to an English speaking audience, with lower fees on naira sales. Both are good digital platforms. If you also want to sell physical products with cash on delivery, or keep 100% of your price with your own Mobile Money account, Zuri is a complementary option, compatible with Chariow and Selar links.",
    },
    faqs: [
      {
        q: { fr: "Chariow ou Selar, lequel prend le moins de commission ?", en: "Which takes less commission, Chariow or Selar?" },
        a: {
          fr: "Sur les ventes en naira, Selar indique 4 % plus 50 ₦. Chariow prend 15 % jusqu'à 5 000 $ de ventes, puis 10 %. Selar est donc moins cher sur ses frais affichés, mais compare aussi les moyens de paiement disponibles pour tes clients.",
          en: "On naira sales, Selar states 4% plus ₦50. Chariow takes 15% up to $5,000 in sales, then 10%. Selar is cheaper on its published fees, but also compare the payment methods available to your customers.",
        },
      },
      {
        q: { fr: "Lequel est le mieux pour l'Afrique francophone ?", en: "Which is better for French speaking Africa?" },
        a: {
          fr: "Chariow met en avant Orange Money, Wave et MTN Money, très utilisés en Afrique francophone. Selar est surtout tourné vers le Nigeria et les pays anglophones.",
          en: "Chariow highlights Orange Money, Wave and MTN Money, widely used in French speaking Africa. Selar is mainly focused on Nigeria and English speaking countries.",
        },
      },
      {
        q: { fr: "Quand reçoit-on son argent sur Chariow ?", en: "When do you get paid on Chariow?" },
        a: {
          fr: "Selon l'article 11.2 de ses conditions, les revenus sont crédités sur ton portefeuille 72 heures après la transaction.",
          en: "According to article 11.2 of its terms, earnings are credited to your wallet 72 hours after the transaction.",
        },
      },
      {
        q: { fr: "Peut-on utiliser Chariow ou Selar avec une autre page de vente ?", en: "Can you use Chariow or Selar with another sales page?" },
        a: {
          fr: "Oui. Les deux fournissent un lien de paiement que tu peux placer sur une page de vente externe, par exemple une page Zuri avec compte à rebours, avis et FAQ.",
          en: "Yes. Both provide a payment link you can place on an external sales page, for example a Zuri page with countdown, reviews and FAQ.",
        },
      },
    ],
    sources: [SRC.chariowPricing, SRC.chariowTerms, SRC.chariowHome, SRC.selarFees, SRC.selarTrustpilot],
  },
  // ---------------------------------------------------- CHARIOW VS MAKETOU
  {
    slug: "chariow-vs-maketou",
    a: "Chariow",
    b: "Maketou",
    title: {
      fr: "Chariow ou Maketou en 2026 : commission, paiement, délais | Zuri",
      en: "Chariow vs Maketou in 2026: fees, payments, payouts | Zuri",
    },
    description: {
      fr: "Chariow ou Maketou pour vendre tes produits digitaux en Afrique ? Commission, moyens de paiement, délais et fonctions comparés avec les sources officielles.",
      en: "Chariow or Maketou to sell your digital products in Africa? Fees, payment methods, payout timing and features compared with official sources.",
    },
    h1: {
      fr: "Chariow ou Maketou : quelle plateforme pour tes produits digitaux ?",
      en: "Chariow vs Maketou: which platform for your digital products?",
    },
    intro: {
      fr: "Chariow et Maketou sont deux plateformes africaines francophones pour vendre des produits numériques, sans abonnement. Elles encaissent pour toi, livrent les fichiers et te reversent tes gains. La différence la plus visible, c'est la commission : 15 % puis 10 % chez Chariow, 5 % chez Maketou. Mais le prix n'est pas le seul critère. Voici une comparaison neutre.",
      en: "Chariow and Maketou are two French speaking African platforms for selling digital products, with no subscription. They collect payments for you, deliver files and pay out your earnings. The most visible difference is the commission: 15% then 10% at Chariow, 5% at Maketou. But price is not the only criterion. Here is a neutral comparison.",
    },
    compare: [
      [{ fr: "Abonnement", en: "Subscription" }, { fr: "Aucun", en: "None" }, { fr: "Aucun", en: "None" }],
      [{ fr: "Commission", en: "Commission" }, { fr: "15 %, puis 10 % au-delà de 5 000 $", en: "15%, then 10% above $5,000" }, { fr: "5 %", en: "5%" }],
      [{ fr: "Moyens de paiement cités", en: "Payment methods cited" }, { fr: "Orange Money, Wave, MTN Money, cartes, virements", en: "Orange Money, Wave, MTN Money, cards, transfers" }, { fr: "Non détaillés sur la page d'accueil", en: "Not detailed on the home page" }],
      [{ fr: "Délai", en: "Timing" }, { fr: "Crédit au portefeuille 72 h après la transaction", en: "Wallet credit 72 hours after the transaction" }, { fr: "Paiements généralement sous 72 h maximum", en: "Payments generally within 72 hours at most" }],
      [{ fr: "Devises", en: "Currencies" }, { fr: "Conversion automatique", en: "Automatic conversion" }, { fr: "Multidevise (FCFA, euro, dollar)", en: "Multicurrency (CFA franc, euro, dollar)" }],
      [{ fr: "Types de produits", en: "Product types" }, { fr: "Fichiers, formations, licences, packs, coaching", en: "Files, courses, licenses, bundles, coaching" }, { fr: "Ebooks, formations, templates, audio, vidéo, logiciels", en: "Ebooks, courses, templates, audio, video, software" }],
      [{ fr: "Marketplace de produits à revendre", en: "Resale product marketplace" }, { fr: "Non présentée", en: "Not presented" }, { fr: "Oui, produits PLR", en: "Yes, PLR products" }],
      [{ fr: "Gros volumes", en: "High volumes" }, { fr: "Taux sur mesure (Scale)", en: "Custom rates (Scale)" }, { fr: "Non précisé", en: "Not specified" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Commission : un écart important", en: "Commission: a significant gap" } },
      {
        type: "p",
        text: {
          fr: "Sur 1 000 000 FCFA de ventes, Maketou prend 50 000 FCFA avec sa commission de 5 %. Chariow en prend 150 000 tant que tu es sous 5 000 $ de ventes, puis 100 000 avec le taux de 10 %. Pour un créateur qui débute, c'est une différence réelle. Chariow propose en revanche des taux sur mesure pour les très gros volumes.",
          en: "On 1,000,000 CFA francs in sales, Maketou takes 50,000 with its 5% commission. Chariow takes 150,000 while you are under $5,000 in sales, then 100,000 at the 10% rate. For a new creator, that is a real difference. Chariow does offer custom rates for very high volumes.",
        },
      },
      { type: "h2", text: { fr: "Moyens de paiement", en: "Payment methods" } },
      {
        type: "p",
        text: {
          fr: "Chariow détaille clairement les moyens acceptés : Mobile Money, Orange Money, Wave, MTN Money, cartes bancaires et virements internationaux. La page d'accueil de Maketou met en avant le multidevise (FCFA, euro, dollar), mais ne liste pas les opérateurs acceptés. Si tes clients utilisent un opérateur précis, comme Wave au Sénégal ou Moov au Bénin, vérifie sa disponibilité sur chaque plateforme.",
          en: "Chariow clearly lists accepted methods: Mobile Money, Orange Money, Wave, MTN Money, bank cards and international transfers. Maketou's home page highlights multicurrency (CFA franc, euro, dollar) but does not list accepted operators. If your customers use a specific operator, like Wave in Senegal or Moov in Benin, check its availability on each platform.",
        },
      },
      { type: "h2", text: { fr: "Délais de paiement", en: "Payout timing" } },
      {
        type: "p",
        text: {
          fr: "Les deux annoncent un délai proche. Chez Chariow, l'article 11.2 des conditions prévoit un crédit sur ton portefeuille 72 heures après la transaction. Chez Maketou, la FAQ indique des paiements généralement traités sous 72 heures maximum après chaque vente, via un solde Maketou. Comme sur toute plateforme qui encaisse pour toi, des règles de rétention peuvent s'appliquer en cas de litige : chez Chariow, ce sont les articles 9.3 et 13.2.",
          en: "Both announce similar timing. At Chariow, article 11.2 of the terms provides for a wallet credit 72 hours after the transaction. At Maketou, the FAQ says payments are generally processed within 72 hours at most after each sale, through a Maketou balance. As with any platform that collects payments for you, holding rules can apply in case of dispute: at Chariow, these are articles 9.3 and 13.2.",
        },
      },
      { type: "h2", text: { fr: "Fonctions à part", en: "Distinct features" } },
      {
        type: "list",
        items: [
          { fr: "Maketou : une marketplace de produits PLR que tu peux revendre sous ton nom, pratique pour démarrer sans créer de contenu.", en: "Maketou: a marketplace of PLR products you can resell under your name, handy to start without creating content." },
          { fr: "Chariow : licences, packs et coaching en plus des fichiers et formations.", en: "Chariow: licenses, bundles and coaching on top of files and courses." },
          { fr: "Les deux : livraison automatique du produit après paiement.", en: "Both: automatic product delivery after payment." },
        ],
      },
      {
        type: "cta",
        title: { fr: "Une page de vente qui convertit, sans commission", en: "A sales page that converts, no commission" },
        text: {
          fr: "Place ton lien Chariow ou Maketou sur une page Zuri, ou vends en direct avec ton compte Mobile Money, à 0 % de commission.",
          en: "Put your Chariow or Maketou link on a Zuri page, or sell directly with your Mobile Money account, at 0% commission.",
        },
      },
    ],
    verdict: {
      fr: "Maketou est le plus avantageux sur la commission (5 %) et intéressant si tu veux revendre des produits PLR. Chariow est plus transparent sur les moyens de paiement locaux et propose plus de formats (licences, coaching), avec une commission plus élevée. Les deux sont de bonnes options pour le digital. Si tu veux aussi vendre des produits physiques en paiement à la livraison, ou encaisser directement sur ton propre compte Mobile Money sans commission, Zuri est une option complémentaire, compatible avec les liens Chariow et Maketou.",
      en: "Maketou is the better deal on commission (5%) and interesting if you want to resell PLR products. Chariow is more transparent about local payment methods and offers more formats (licenses, coaching), with a higher commission. Both are good options for digital goods. If you also want to sell physical products with cash on delivery, or collect payments directly on your own Mobile Money account with no commission, Zuri is a complementary option, compatible with Chariow and Maketou links.",
    },
    faqs: [
      {
        q: { fr: "Chariow ou Maketou, lequel est le moins cher ?", en: "Which is cheaper, Chariow or Maketou?" },
        a: {
          fr: "Maketou, avec 5 % de commission par vente. Chariow prend 15 % jusqu'à 5 000 $ de ventes, puis 10 %. Aucun des deux n'a d'abonnement.",
          en: "Maketou, with a 5% commission per sale. Chariow takes 15% up to $5,000 in sales, then 10%. Neither has a subscription.",
        },
      },
      {
        q: { fr: "Lequel accepte le plus de moyens de paiement ?", en: "Which accepts more payment methods?" },
        a: {
          fr: "Chariow liste clairement Orange Money, Wave, MTN Money, les cartes et les virements. Maketou ne détaille pas les opérateurs sur sa page d'accueil : vérifie pour ton pays.",
          en: "Chariow clearly lists Orange Money, Wave, MTN Money, cards and transfers. Maketou does not list operators on its home page: check for your country.",
        },
      },
      {
        q: { fr: "Combien de temps pour recevoir son argent ?", en: "How long until you get paid?" },
        a: {
          fr: "Environ 72 heures dans les deux cas, selon leurs propres documents : crédit au portefeuille 72 heures après la transaction chez Chariow, paiements généralement sous 72 heures maximum chez Maketou.",
          en: "About 72 hours in both cases, according to their own documents: wallet credit 72 hours after the transaction at Chariow, payments generally within 72 hours at most at Maketou.",
        },
      },
      {
        q: { fr: "Peut-on vendre des produits physiques sur Chariow ou Maketou ?", en: "Can you sell physical products on Chariow or Maketou?" },
        a: {
          fr: "Les deux sont pensées pour le digital. Pour des produits physiques en paiement à la livraison, il faut un outil e-commerce comme Zuri.",
          en: "Both are built for digital goods. For physical products with cash on delivery, you need an ecommerce tool like Zuri.",
        },
      },
    ],
    sources: [SRC.chariowPricing, SRC.chariowTerms, SRC.chariowHome, SRC.maketou],
  },
  // --------------------------------------------------- EASYAFRIK VS YOUCAN
  {
    slug: "easyafrik-vs-youcan",
    a: "EasyAfrik",
    b: "YouCan",
    title: {
      fr: "EasyAfrik ou YouCan en 2026 : quelle plateforme COD choisir ? | Zuri",
      en: "EasyAfrik vs YouCan in 2026: which COD platform to choose? | Zuri",
    },
    description: {
      fr: "EasyAfrik ou YouCan pour vendre en paiement à la livraison ? Prix en FCFA ou en dollars, IA, outils COD et domaines comparés avec les sources officielles.",
      en: "EasyAfrik or YouCan for cash on delivery? CFA franc or dollar pricing, AI, COD tools and domains compared with official sources.",
    },
    h1: {
      fr: "EasyAfrik ou YouCan : lequel choisir pour vendre en COD ?",
      en: "EasyAfrik vs YouCan: which one should you choose for COD?",
    },
    intro: {
      fr: "EasyAfrik et YouCan sont deux plateformes pensées pour le paiement à la livraison en Afrique. EasyAfrik mise sur l'IA, qui crée ta page depuis un lien produit, et sur des abonnements en FCFA. YouCan, venu du Maroc, propose une formule sans abonnement avec une petite commission, ou des abonnements en dollars. Voici une comparaison neutre pour t'aider à choisir.",
      en: "EasyAfrik and YouCan are two platforms built for cash on delivery in Africa. EasyAfrik relies on AI, which builds your page from a product link, and on subscriptions in CFA francs. YouCan, from Morocco, offers a no subscription option with a small fee, or subscriptions in dollars. Here is a neutral comparison to help you choose.",
    },
    compare: [
      [{ fr: "Modèle de prix", en: "Pricing model" }, { fr: "Abonnement en FCFA", en: "Subscription in CFA francs" }, { fr: "Sans abonnement ou abonnement en dollars", en: "No subscription or subscription in dollars" }],
      [{ fr: "Prix", en: "Price" }, { fr: "8 900, 14 900 ou 34 900 FCFA/mois", en: "8,900, 14,900 or 34,900 CFA francs/month" }, { fr: "0 $ jusqu'à 5 000 $ de ventes, ou 29 $ à 229 $/mois", en: "$0 until $5,000 in sales, or $29 to $229/month" }],
      [{ fr: "Commission", en: "Commission" }, { fr: "Non mentionnée", en: "Not mentioned" }, { fr: "0,5 % COD et 1 % en ligne sans abonnement (moins au-delà de 5 000 $)", en: "0.5% COD and 1% online with no subscription (less above $5,000)" }],
      [{ fr: "Essai", en: "Trial" }, { fr: "7 jours sans paiement", en: "7 days with no payment" }, { fr: "Inscription gratuite", en: "Free sign up" }],
      [{ fr: "Création de page par IA", en: "AI page creation" }, { fr: "Oui, depuis un lien AliExpress, Shopify ou YouCan", en: "Yes, from an AliExpress, Shopify or YouCan link" }, { fr: "Non mise en avant sur la page tarifs", en: "Not highlighted on the pricing page" }],
      [{ fr: "Outils d'urgence", en: "Urgency tools" }, { fr: "Minuteur, prix barré, stock bas, visiteurs en direct, packs", en: "Timer, strikethrough, low stock, live visitors, bundles" }, { fr: "Selon thèmes et applications", en: "Depends on themes and apps" }],
      [{ fr: "Boutiques", en: "Stores" }, { fr: "1, 3 ou 10 selon forfait", en: "1, 3 or 10 by plan" }, { fr: "1 par forfait, jusqu'à 5 en Unlimited", en: "1 per plan, up to 5 on Unlimited" }],
      [{ fr: "Domaines personnalisés", en: "Custom domains" }, { fr: "Non précisé sur la page d'accueil", en: "Not specified on the home page" }, { fr: "Jusqu'à 6 par boutique", en: "Up to 6 per store" }],
      [{ fr: "Notifications", en: "Notifications" }, { fr: "Agent de commande sur Telegram", en: "Order agent on Telegram" }, { fr: "Non comparé ici", en: "Not compared here" }],
      [{ fr: "Mobile Money", en: "Mobile Money" }, { fr: "Non mentionné sur la page d'accueil", en: "Not mentioned on the home page" }, { fr: "Non présenté pour l'Afrique de l'Ouest", en: "Not presented for West Africa" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Abonnement fixe ou commission ?", en: "Fixed subscription or commission?" } },
      {
        type: "p",
        text: {
          fr: "EasyAfrik fonctionne avec un abonnement mensuel sans engagement, en FCFA : 8 900 FCFA pour 1 boutique, 14 900 FCFA pour 3 boutiques et 34 900 FCFA pour 10 boutiques, avec commandes et pages illimitées. Tu sais exactement ce que tu paies chaque mois. YouCan te laisse démarrer sans rien payer jusqu'à 5 000 $ de ventes, puis prend 0,5 % sur le COD et 1 % sur le paiement en ligne. Quand ton volume grandit, tu peux passer à un abonnement de 29 $ à 229 $ par mois sans commission.",
          en: "EasyAfrik works with a monthly subscription, no commitment, in CFA francs: 8,900 for 1 store, 14,900 for 3 stores and 34,900 for 10 stores, with unlimited orders and pages. You know exactly what you pay each month. YouCan lets you start without paying anything until $5,000 in sales, then takes 0.5% on COD and 1% on online payments. As your volume grows, you can switch to a $29 to $229 per month subscription with no fee.",
        },
      },
      {
        type: "tip",
        title: { fr: "Fais le calcul", en: "Do the math" },
        text: {
          fr: "Avec un petit volume, la formule sans abonnement de YouCan revient souvent moins cher. Avec plusieurs boutiques et un volume régulier, un abonnement fixe comme celui d'EasyAfrik peut devenir plus intéressant.",
          en: "With a small volume, YouCan's no subscription option is often cheaper. With several stores and steady volume, a fixed subscription like EasyAfrik's can become more attractive.",
        },
      },
      { type: "h2", text: { fr: "IA et rapidité de lancement", en: "AI and launch speed" } },
      {
        type: "p",
        text: {
          fr: "Le point fort d'EasyAfrik, c'est son Studio IA : tu colles le lien d'un produit AliExpress, Shopify ou YouCan, et l'IA génère la page avec photos, textes, avis et prix. Le nombre de pages IA dépend du forfait (5 par mois sur Pro, 30 sur Premium). YouCan mise plutôt sur des thèmes gratuits et des outils e-commerce classiques, avec hébergement et SSL inclus.",
          en: "EasyAfrik's strength is its AI Studio: you paste the link of an AliExpress, Shopify or YouCan product, and the AI generates the page with photos, text, reviews and price. The number of AI pages depends on the plan (5 per month on Pro, 30 on Premium). YouCan relies more on free themes and classic ecommerce tools, with hosting and SSL included.",
        },
      },
      { type: "h2", text: { fr: "Marché et devise", en: "Market and currency" } },
      {
        type: "p",
        text: {
          fr: "EasyAfrik affiche ses prix en FCFA, ce qui parle directement aux vendeurs d'Afrique de l'Ouest et centrale. YouCan affiche ses prix en dollars et propose le multidevise sur tous ses forfaits. Aucun des deux ne met en avant le Mobile Money sur la page consultée : si tes clients veulent payer en ligne en Mobile Money, demande à chaque équipe ce qui est disponible dans ton pays.",
          en: "EasyAfrik shows its prices in CFA francs, which speaks directly to sellers in West and Central Africa. YouCan shows its prices in dollars and offers multicurrency on all plans. Neither highlights Mobile Money on the page we checked: if your customers want to pay online with Mobile Money, ask each team what is available in your country.",
        },
      },
      { type: "h2", text: { fr: "Maturité", en: "Maturity" } },
      {
        type: "p",
        text: {
          fr: "YouCan est une plateforme établie, avec une note Trustpilot de 2,9 sur 5 sur 73 avis en novembre 2026 et des avis très partagés entre simplicité saluée et support critiqué. EasyAfrik est plus récent. Teste chacun sur un produit avant de t'engager.",
          en: "YouCan is an established platform, with a Trustpilot score of 2.9 out of 5 from 73 reviews in November 2026 and very split reviews between praised simplicity and criticized support. EasyAfrik is more recent. Test each on one product before committing.",
        },
      },
      {
        type: "cta",
        title: { fr: "Et si tu voulais le Mobile Money aussi ?", en: "What if you want Mobile Money too?" },
        text: {
          fr: "Zuri crée ta page COD en quelques minutes, se connecte à FeexPay, FedaPay, PayDunya et PawaPay, et reste gratuit pendant le lancement.",
          en: "Zuri builds your COD page in minutes, connects to FeexPay, FedaPay, PayDunya and PawaPay, and stays free during launch.",
        },
      },
    ],
    verdict: {
      fr: "EasyAfrik est un bon choix si tu veux lancer vite des pages COD grâce à l'IA, avec un prix fixe en FCFA et des outils d'urgence complets. YouCan est un bon choix si tu veux démarrer sans abonnement, avoir des domaines personnalisés ou si tu vends surtout au Maghreb. Si tu veux en plus encaisser en Mobile Money via des prestataires d'Afrique de l'Ouest et gérer tes closers avec attribution automatique, Zuri est une option à tester, gratuite pendant le lancement et sans commission.",
      en: "EasyAfrik is a good choice if you want to launch COD pages fast with AI, at a fixed price in CFA francs, with complete urgency tools. YouCan is a good choice if you want to start without a subscription, need custom domains or mostly sell in North Africa. If you also want to collect Mobile Money through West African providers and manage your closers with automatic assignment, Zuri is an option worth testing, free during launch with no commission.",
    },
    faqs: [
      {
        q: { fr: "EasyAfrik ou YouCan, lequel est le moins cher ?", en: "Which is cheaper, EasyAfrik or YouCan?" },
        a: {
          fr: "Pour débuter, YouCan : rien à payer avant 5 000 $ de ventes, puis une petite commission. EasyAfrik demande un abonnement à partir de 8 900 FCFA par mois après 7 jours d'essai, mais sans commission mentionnée.",
          en: "To start, YouCan: nothing to pay until $5,000 in sales, then a small fee. EasyAfrik requires a subscription from 8,900 CFA francs per month after a 7 day trial, but with no fee mentioned.",
        },
      },
      {
        q: { fr: "Lequel crée les pages avec l'IA ?", en: "Which one builds pages with AI?" },
        a: {
          fr: "EasyAfrik met en avant son Studio IA, qui crée une page depuis un lien AliExpress, Shopify ou YouCan. Sur YouCan, la création par IA n'est pas mise en avant sur la page tarifs.",
          en: "EasyAfrik highlights its AI Studio, which builds a page from an AliExpress, Shopify or YouCan link. On YouCan, AI creation is not highlighted on the pricing page.",
        },
      },
      {
        q: { fr: "Lequel accepte le Mobile Money ?", en: "Which one accepts Mobile Money?" },
        a: {
          fr: "Aucun des deux ne présente le Mobile Money sur la page consultée. Renseigne-toi auprès de leur support pour ton pays.",
          en: "Neither presents Mobile Money on the page we checked. Ask their support for your country.",
        },
      },
      {
        q: { fr: "Peut-on avoir son propre nom de domaine ?", en: "Can you use your own domain name?" },
        a: {
          fr: "YouCan permet jusqu'à 6 domaines personnalisés par boutique. La page d'accueil d'EasyAfrik ne le précise pas : vérifie avec eux.",
          en: "YouCan allows up to 6 custom domains per store. EasyAfrik's home page does not say: check with them.",
        },
      },
    ],
    sources: [SRC.easyafrik, SRC.youcanPricing, SRC.youcanTrustpilot],
  },
  // ----------------------------------------------- LIGHTFUNNELS VS SHOPIFY
  {
    slug: "lightfunnels-vs-shopify",
    a: "Lightfunnels",
    b: "Shopify",
    title: {
      fr: "Lightfunnels ou Shopify en 2026 : tunnel ou boutique ? | Zuri",
      en: "Lightfunnels vs Shopify in 2026: funnel or store? | Zuri",
    },
    description: {
      fr: "Lightfunnels ou Shopify pour vendre en COD avec de la publicité ? Prix, frais, essai, tunnels et écosystème comparés avec les chiffres officiels.",
      en: "Lightfunnels or Shopify for selling with COD and ads? Prices, fees, trial, funnels and ecosystem compared with official figures.",
    },
    h1: {
      fr: "Lightfunnels ou Shopify : lequel choisir pour vendre avec la publicité ?",
      en: "Lightfunnels vs Shopify: which one should you choose for selling with ads?",
    },
    intro: {
      fr: "Lightfunnels et Shopify répondent à deux logiques. Lightfunnels est un constructeur de tunnels de vente : une page produit, des upsells, et un parcours court pensé pour la publicité, avec un forfait dédié au COD. Shopify est une boutique complète, avec catalogue, thèmes et des milliers d'applications. Si tu vends un produit à la fois via Facebook ou TikTok, le choix mérite réflexion. Voici une comparaison neutre.",
      en: "Lightfunnels and Shopify follow two different logics. Lightfunnels is a funnel builder: a product page, upsells and a short path designed for ads, with a plan dedicated to COD. Shopify is a complete store, with catalog, themes and thousands of apps. If you sell one product at a time through Facebook or TikTok, the choice deserves some thought. Here is a neutral comparison.",
    },
    compare: [
      [{ fr: "Logique", en: "Approach" }, { fr: "Tunnels de vente", en: "Sales funnels" }, { fr: "Boutique complète", en: "Full store" }],
      [{ fr: "Prix de départ", en: "Starting price" }, { fr: "9,99 $/mois (Newbie)", en: "$9.99/month (Newbie)" }, { fr: "27 $/mois (19 $ en annuel)", en: "$27/month ($19 yearly)" }],
      [{ fr: "Autres forfaits", en: "Other plans" }, { fr: "49,99 $ (Standard), 99,99 $ (COD)", en: "$49.99 (Standard), $99.99 (COD)" }, { fr: "72 $ (Grow), 399 $ (Advanced)", en: "$72 (Grow), $399 (Advanced)" }],
      [{ fr: "Essai", en: "Trial" }, { fr: "30 jours", en: "30 days" }, { fr: "3 jours, puis 1 $/mois pendant 3 mois", en: "3 days, then $1/month for 3 months" }],
      [{ fr: "Frais sur le COD", en: "COD fees" }, { fr: "0,20 %, 0,10 % ou 0 % selon forfait", en: "0.20%, 0.10% or 0% by plan" }, { fr: "Aucun frais tiers (paiement manuel)", en: "No third party fee (manual payment)" }],
      [{ fr: "Frais sur le paiement en ligne", en: "Online payment fees" }, { fr: "1,5 % (Newbie) ou 0,50 %", en: "1.5% (Newbie) or 0.50%" }, { fr: "2 % à 0,6 % avec un prestataire tiers", en: "2% to 0.6% with a third party provider" }],
      [{ fr: "Formulaire COD", en: "COD form" }, { fr: "Forfait dédié au COD", en: "Dedicated COD plan" }, { fr: "Via application (ex. EasySell)", en: "Via an app (e.g. EasySell)" }],
      [{ fr: "Écosystème", en: "Ecosystem" }, { fr: "Plus ciblé", en: "More focused" }, { fr: "Très large", en: "Very large" }],
      [{ fr: "Langue de la page tarifs", en: "Pricing page language" }, { fr: "Anglais", en: "English" }, { fr: "Multilingue, dont le français", en: "Multilingual, including French" }],
      [{ fr: "Avis Trustpilot (nov. 2026)", en: "Trustpilot reviews (Nov 2026)" }, { fr: "3,4/5 sur 79 avis", en: "3.4/5 from 79 reviews" }, { fr: "Non comparé ici", en: "Not compared here" }],
    ],
    blocks: [
      { type: "h2", text: { fr: "Tunnel ou boutique : ce qui change", en: "Funnel or store: what changes" } },
      {
        type: "p",
        text: {
          fr: "Un tunnel de vente envoie le visiteur d'une publicité vers une seule page produit, puis vers des offres complémentaires, sans distraction. C'est la logique de Lightfunnels, très utilisée par les vendeurs qui testent beaucoup de produits. Une boutique comme Shopify présente un catalogue, des collections et une navigation complète : c'est mieux pour construire une marque avec plusieurs produits et des clients qui reviennent.",
          en: "A sales funnel sends the visitor from an ad to a single product page, then to complementary offers, without distraction. That is Lightfunnels' logic, widely used by sellers who test many products. A store like Shopify shows a catalog, collections and full navigation: better for building a brand with several products and returning customers.",
        },
      },
      { type: "h2", text: { fr: "Prix et frais", en: "Prices and fees" } },
      {
        type: "p",
        text: {
          fr: "Lightfunnels commence à 9,99 $ par mois avec 1,5 % de frais sur les paiements en ligne et 0,20 % sur le COD. Le forfait Standard à 49,99 $ baisse ces frais à 0,50 % et 0,10 %, et le forfait COD à 99,99 $ supprime les frais sur le COD. Shopify commence à 27 $ par mois en Basic sans engagement. Le COD y est un paiement manuel sans frais de transaction tiers, mais les paiements en ligne via un prestataire tiers (obligatoire en Afrique, où Shopify Payments n'est pas disponible) supportent des frais de 2 % à 0,6 %. Il faut aussi souvent une application de formulaire COD, comme EasySell, gratuite jusqu'à 60 commandes par mois puis à 9,95 $.",
          en: "Lightfunnels starts at $9.99 per month with a 1.5% fee on online payments and 0.20% on COD. The Standard plan at $49.99 lowers these to 0.50% and 0.10%, and the COD plan at $99.99 removes COD fees. Shopify starts at $27 per month on Basic billed monthly. COD is a manual payment there, with no third party transaction fees, but online payments through a third party provider (required in Africa, where Shopify Payments is not available) carry fees of 2% to 0.6%. You also often need a COD form app, like EasySell, free up to 60 orders per month and then $9.95.",
        },
      },
      { type: "h2", text: { fr: "Essai et prise en main", en: "Trial and onboarding" } },
      {
        type: "p",
        text: {
          fr: "Lightfunnels offre 30 jours d'essai, sans carte bancaire selon son site. Shopify propose 3 jours gratuits sans carte, puis 1 $ par mois pendant 3 mois. Lightfunnels est en anglais, alors que Shopify est disponible en plusieurs langues, dont le français. Shopify a aussi un très grand nombre de tutoriels et d'experts disponibles.",
          en: "Lightfunnels offers a 30 day trial, with no card required according to its site. Shopify offers 3 free days without a card, then $1 per month for 3 months. Lightfunnels is in English, while Shopify is available in several languages, including French. Shopify also has a huge number of tutorials and available experts.",
        },
      },
      { type: "h2", text: { fr: "Vitesse et fiabilité", en: "Speed and reliability" } },
      {
        type: "p",
        text: {
          fr: "Selon le Web Almanac 2025, environ 76 % des boutiques Shopify passent les Core Web Vitals sur mobile, le meilleur score parmi les grandes plateformes. Lightfunnels met aussi en avant des pages rapides pensées pour la publicité. Sur Trustpilot, Lightfunnels a une note de 3,4 sur 5 sur 79 avis en novembre 2026.",
          en: "According to the 2025 Web Almanac, about 76% of Shopify stores pass Core Web Vitals on mobile, the best score among large platforms. Lightfunnels also highlights fast pages designed for ads. On Trustpilot, Lightfunnels has a score of 3.4 out of 5 from 79 reviews in November 2026.",
        },
      },
      {
        type: "cta",
        title: { fr: "Le tunnel COD, version africaine", en: "The COD funnel, African edition" },
        text: {
          fr: "Zuri te donne une page de vente unique ultra légère, des packs, des closers et le Mobile Money en FCFA, sans commission.",
          en: "Zuri gives you an ultra light single sales page, bundles, closers and Mobile Money in CFA francs, with no commission.",
        },
      },
    ],
    verdict: {
      fr: "Lightfunnels est un bon choix si tu testes beaucoup de produits en publicité, si tu veux des tunnels avec upsells et si tu travailles en anglais. Shopify est un meilleur choix si tu construis une marque avec un catalogue, que tu veux un écosystème immense et une boutique parmi les plus rapides. Pour un vendeur d'Afrique francophone qui vend en COD et en Mobile Money, Zuri est une troisième option : une page de vente unique très légère comme un tunnel, la gestion des closers, les prestataires FeexPay, FedaPay, PayDunya et PawaPay, en français et gratuitement pendant le lancement.",
      en: "Lightfunnels is a good choice if you test many products with ads, want funnels with upsells and work in English. Shopify is a better choice if you are building a brand with a catalog and want a huge ecosystem and one of the fastest store platforms. For a seller in French speaking Africa who sells with COD and Mobile Money, Zuri is a third option: a very light single sales page like a funnel, closer management, FeexPay, FedaPay, PayDunya and PawaPay providers, in French and English, free during launch.",
    },
    faqs: [
      {
        q: { fr: "Lightfunnels est-il moins cher que Shopify ?", en: "Is Lightfunnels cheaper than Shopify?" },
        a: {
          fr: "Le forfait d'entrée de Lightfunnels (9,99 $) est moins cher que Shopify Basic (27 $ sans engagement), mais il prend 1,5 % sur les paiements en ligne et 0,20 % sur le COD. Compare selon ton volume et ta part de COD.",
          en: "Lightfunnels' entry plan ($9.99) is cheaper than Shopify Basic ($27 billed monthly), but it takes 1.5% on online payments and 0.20% on COD. Compare based on your volume and COD share.",
        },
      },
      {
        q: { fr: "Lequel est le meilleur pour le COD ?", en: "Which is better for COD?" },
        a: {
          fr: "Lightfunnels a un forfait dédié au COD à 99,99 $ sans frais COD. Shopify accepte le COD en paiement manuel sans frais tiers, mais le formulaire COD en une page passe par une application.",
          en: "Lightfunnels has a dedicated COD plan at $99.99 with no COD fees. Shopify accepts COD as a manual payment with no third party fees, but the one page COD form requires an app.",
        },
      },
      {
        q: { fr: "Lightfunnels est-il disponible en français ?", en: "Is Lightfunnels available in French?" },
        a: {
          fr: "Sa page tarifs est uniquement en anglais. Shopify est disponible en plusieurs langues, dont le français.",
          en: "Its pricing page is only in English. Shopify is available in several languages, including French.",
        },
      },
      {
        q: { fr: "Peut-on accepter le Mobile Money ?", en: "Can you accept Mobile Money?" },
        a: {
          fr: "Shopify Payments n'existe pas en Afrique : il faut un prestataire tiers, avec des frais Shopify. La page tarifs de Lightfunnels ne présente pas de solution Mobile Money. Vérifie pour ton pays.",
          en: "Shopify Payments does not exist in Africa: you need a third party provider, with Shopify fees. Lightfunnels' pricing page does not present a Mobile Money option. Check for your country.",
        },
      },
    ],
    sources: [SRC.lfPricing, SRC.lfTrustpilot, SRC.shopifyPricing, SRC.shopifyPaymentsCountries, SRC.shopifyManual, SRC.easySell, SRC.almanac],
  },
]
