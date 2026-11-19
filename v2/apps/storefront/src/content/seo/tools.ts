/** Mini-outils gratuits (calculateurs, générateurs) : textes en français et en anglais. Aucun tiret long ou moyen. */
import type { Faq, L10n } from './types'

export interface ToolPage {
  /** Identifiant interne du composant. */
  id: 'cod-profit' | 'shopify-cost' | 'whatsapp-message' | 'bundle-price'
  slug: L10n
  title: L10n
  description: L10n
  h1: L10n
  intro: L10n
  /** Mode d'emploi (étapes). */
  how: L10n[]
  faqs: Faq[]
  /** Slugs (fr) de guides liés. */
  related: string[]
}

export const TOOLS: ToolPage[] = [
  {
    id: 'cod-profit',
    slug: { fr: 'calculateur-marge-paiement-livraison', en: 'cash-on-delivery-profit-calculator' },
    title: { fr: 'Calculateur de marge en paiement à la livraison (gratuit)', en: 'Cash on delivery profit calculator (free)' },
    description: {
      fr: 'Calcule ta vraie marge en COD : taux de confirmation, taux de livraison, retours, frais de livraison et coût publicitaire par commande livrée.',
      en: 'Work out your real cash on delivery profit: confirmation rate, delivery rate, returns, shipping costs and ad cost per delivered order.',
    },
    h1: { fr: 'Calculateur de marge en paiement à la livraison', en: 'Cash on delivery profit calculator' },
    intro: {
      fr: '100 commandes ne font pas 100 ventes. Entre les injoignables, les refus et les retours, ta vraie marge se calcule sur les commandes livrées. Entre tes chiffres, le résultat se met à jour tout seul.',
      en: '100 orders are not 100 sales. Between unreachable customers, refusals and returns, your real profit is measured on delivered orders. Enter your numbers and the result updates instantly.',
    },
    how: [
      { fr: 'Indique ton prix de vente et ce que te coûte le produit.', en: 'Enter your selling price and what the product costs you.' },
      { fr: 'Ajoute les frais de livraison payés par toi, et le coût d’un colis refusé (aller et retour).', en: 'Add the delivery fee you pay, and the cost of a refused parcel (both trips).' },
      { fr: 'Renseigne ton budget publicitaire et le nombre de commandes reçues.', en: 'Enter your ad spend and the number of orders received.' },
      { fr: 'Ajuste les taux de confirmation et de livraison avec tes vrais chiffres : tu vois ton bénéfice net et le coût pub maximum à ne pas dépasser.', en: 'Adjust confirmation and delivery rates with your real figures: you see your net profit and the maximum ad cost not to exceed.' },
    ],
    faqs: [
      { q: { fr: 'Comment calculer sa marge en paiement à la livraison ?', en: 'How do I calculate cash on delivery profit?' }, a: { fr: 'Pars des commandes livrées, pas des commandes reçues : chiffre encaissé moins coût des produits livrés, frais de livraison, coût des colis refusés et budget publicitaire. Le calculateur fait ce calcul pour toi.', en: 'Start from delivered orders, not orders received: cash collected minus cost of delivered products, delivery fees, cost of refused parcels and ad spend. The calculator does it for you.' } },
      { q: { fr: 'C’est quoi le coût pub par commande livrée ?', en: 'What is ad cost per delivered order?' }, a: { fr: 'C’est ton budget publicitaire divisé par le nombre de commandes réellement livrées. C’est ce chiffre qu’il faut comparer à ta marge, pas le coût par commande affiché par Facebook.', en: 'It is your ad spend divided by the number of orders actually delivered. That is the number to compare with your margin, not the cost per order shown by Facebook.' } },
      { q: { fr: 'Mes données sont-elles enregistrées ?', en: 'Is my data saved?' }, a: { fr: 'Non. Tout est calculé dans ton navigateur, rien n’est envoyé.', en: 'No. Everything is calculated in your browser, nothing is sent.' } },
    ],
    related: ['calculer-marge-paiement-livraison', 'reduire-retours-paiement-livraison', 'publicite-facebook-paiement-livraison'],
  },
  {
    id: 'shopify-cost',
    slug: { fr: 'calculateur-cout-shopify-afrique', en: 'shopify-cost-calculator-africa' },
    title: { fr: 'Combien coûte Shopify avec les applis ? Calculateur', en: 'How much does Shopify cost with apps? Calculator' },
    description: {
      fr: 'Calcule le coût mensuel réel d’une boutique Shopify en paiement à la livraison : abonnement et applis (formulaire COD, packs, avis, pixel…), en dollars et en FCFA.',
      en: 'Calculate the real monthly cost of a cash on delivery Shopify store: subscription plus apps (COD form, bundles, reviews, pixel…), in dollars and local currency.',
    },
    h1: { fr: 'Combien coûte vraiment Shopify avec les applis ?', en: 'How much does Shopify really cost with apps?' },
    intro: {
      fr: 'L’abonnement n’est que le début. Coche les applis dont tu as besoin pour vendre à la livraison : le calculateur additionne le tout en dollars et dans ta devise.',
      en: 'The subscription is only the start. Tick the apps you need to sell with cash on delivery: the calculator adds everything up in dollars and in your currency.',
    },
    how: [
      { fr: 'Choisis ton forfait Shopify.', en: 'Pick your Shopify plan.' },
      { fr: 'Coche les applis que tu utilises ou comptes utiliser.', en: 'Tick the apps you use or plan to use.' },
      { fr: 'Ajuste le taux de change si besoin : tu obtiens le coût par mois et par an.', en: 'Adjust the exchange rate if needed: you get the monthly and yearly cost.' },
    ],
    faqs: [
      { q: { fr: 'D’où viennent les prix ?', en: 'Where do the prices come from?' }, a: { fr: 'Ce sont les prix publics relevés en novembre 2026 sur shopify.com et le Shopify App Store (première offre payante, sans engagement, hors taxes). Ils peuvent évoluer : vérifie sur les fiches officielles.', en: 'They are public prices checked in November 2026 on shopify.com and the Shopify App Store (first paid plan, no commitment, before tax). They may change: check the official listings.' } },
      { q: { fr: 'Les applis gratuites ne suffisent pas ?', en: 'Are free app plans not enough?' }, a: { fr: 'Plusieurs applis ont une offre gratuite limitée (souvent environ 60 commandes par mois). Dès que tu vends régulièrement, tu passes sur l’offre payante.', en: 'Several apps have a limited free plan (often around 60 orders a month). As soon as you sell regularly, you move to the paid plan.' } },
      { q: { fr: 'Et sur Zuri ?', en: 'And on Zuri?' }, a: { fr: 'Toutes ces fonctions sont incluses, sans appli à ajouter, et Zuri est gratuit pendant le lancement, avec 0 % de commission.', en: 'All these features are included, with no apps to add, and Zuri is free during launch, with 0% commission.' } },
    ],
    related: ['astuces-vendre-en-ligne', 'page-de-vente-qui-convertit', 'pixel-facebook-api-conversions'],
  },
  {
    id: 'whatsapp-message',
    slug: { fr: 'generateur-message-whatsapp-commande', en: 'whatsapp-order-message-generator' },
    title: { fr: 'Générateur de message WhatsApp de confirmation de commande', en: 'WhatsApp order confirmation message generator' },
    description: {
      fr: 'Génère en un clic tes messages WhatsApp : confirmation de commande, relance d’un client injoignable, rappel avant livraison. Copie ou ouvre WhatsApp directement.',
      en: 'Generate your WhatsApp messages in one click: order confirmation, follow-up for unreachable customers, reminder before delivery. Copy or open WhatsApp directly.',
    },
    h1: { fr: 'Générateur de messages WhatsApp pour tes commandes', en: 'WhatsApp message generator for your orders' },
    intro: {
      fr: 'Un message clair au bon moment réduit les refus à la livraison. Remplis les infos de la commande, choisis le modèle, puis copie le message ou ouvre WhatsApp.',
      en: 'A clear message at the right time cuts refusals at the door. Fill in the order details, pick a template, then copy the message or open WhatsApp.',
    },
    how: [
      { fr: 'Remplis le prénom du client, le produit, le prix, la ville et le jour de livraison.', en: 'Fill in the customer’s first name, product, price, city and delivery day.' },
      { fr: 'Choisis le modèle : confirmation, client injoignable ou rappel avant livraison.', en: 'Pick the template: confirmation, unreachable customer or delivery reminder.' },
      { fr: 'Copie le message, ou ajoute le numéro du client pour ouvrir WhatsApp avec le message prêt.', en: 'Copy the message, or add the customer’s number to open WhatsApp with the message ready.' },
    ],
    faqs: [
      { q: { fr: 'Quand envoyer le message de confirmation ?', en: 'When should I send the confirmation message?' }, a: { fr: 'Le plus vite possible après la commande, idéalement dans l’heure : le client se souvient de son achat et répond plus facilement.', en: 'As soon as possible after the order, ideally within the hour: the customer remembers the purchase and replies more easily.' } },
      { q: { fr: 'Le numéro doit-il avoir l’indicatif ?', en: 'Does the number need the country code?' }, a: { fr: 'Oui, pour ouvrir WhatsApp le numéro doit être au format international, par exemple 2250700000000 pour la Côte d’Ivoire, sans le signe plus.', en: 'Yes, to open WhatsApp the number must be in international format, for example 2348012345678 for Nigeria, without the plus sign.' } },
      { q: { fr: 'Rien n’est envoyé à Zuri ?', en: 'Is anything sent to Zuri?' }, a: { fr: 'Non, le message est créé dans ton navigateur.', en: 'No, the message is created in your browser.' } },
    ],
    related: ['script-confirmation-commande', 'reduire-retours-paiement-livraison', 'recruter-gerer-closers'],
  },
  {
    id: 'bundle-price',
    slug: { fr: 'calculateur-prix-pack', en: 'bundle-price-calculator' },
    title: { fr: 'Calculateur de prix de pack (2 achetés, 3 achetés)', en: 'Bundle price calculator (buy 2, buy 3)' },
    description: {
      fr: 'Trouve le bon prix pour tes packs « 2 achetés » et « 3 achetés » : réduction attractive pour le client, marge protégée pour toi, livraison comprise.',
      en: 'Find the right price for your buy 2 and buy 3 bundles: an attractive discount for customers, a protected margin for you, delivery included.',
    },
    h1: { fr: 'Calculateur de prix de pack', en: 'Bundle price calculator' },
    intro: {
      fr: 'Les packs augmentent ton panier moyen, à condition de garder une marge. Entre ton coût, ton prix et la réduction voulue : tu vois le prix du pack, l’économie pour le client et ta marge.',
      en: 'Bundles raise your average order, as long as you keep a margin. Enter your cost, your price and the discount you want: you see the bundle price, the customer saving and your margin.',
    },
    how: [
      { fr: 'Indique le coût d’une unité et ton prix de vente à l’unité.', en: 'Enter the cost of one unit and your single unit price.' },
      { fr: 'Ajoute les frais de livraison payés par toi pour une commande.', en: 'Add the delivery fee you pay for one order.' },
      { fr: 'Choisis la réduction pour 2 et pour 3 unités : le calculateur arrondit aux 100 près et affiche ta marge.', en: 'Choose the discount for 2 and 3 units: the calculator rounds to the nearest 100 and shows your margin.' },
    ],
    faqs: [
      { q: { fr: 'Quelle réduction proposer sur un pack ?', en: 'What discount should a bundle offer?' }, a: { fr: 'Assez pour être visible (le client doit sentir l’économie), mais pas au point de manger ta marge. Le calculateur te montre la marge restante pour chaque réduction.', en: 'Enough to be noticed (the customer must feel the saving), but not so much it eats your margin. The calculator shows the margin left for each discount.' } },
      { q: { fr: 'Pourquoi un pack rapporte plus ?', en: 'Why does a bundle earn more?' }, a: { fr: 'Parce que les frais de livraison et le coût publicitaire sont payés une seule fois pour plusieurs unités vendues.', en: 'Because delivery and ad costs are paid once for several units sold.' } },
    ],
    related: ['trouver-produit-gagnant', 'black-friday-afrique', 'calculer-marge-paiement-livraison'],
  },
]

export const findTool = (slug: string, lang: 'fr' | 'en') => TOOLS.find((x) => x.slug[lang] === slug)
