/**
 * Nouveautés de Zuri (FR /nouveautes, EN /en/changelog), tirées de l'historique réel des mises à jour.
 * Preuve publique que la plateforme avance chaque semaine. Plus récent en premier.
 */
import type { L10n } from './types'

export interface ChangelogEntry {
  date: string
  title: L10n
  items: L10n[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-11-25',
    title: { fr: 'Parrainage, liste de démarrage, panier en test', en: 'Referrals, launch checklist, cart in testing' },
    items: [
      { fr: 'Parrainage : un lien personnel par vendeur, un mois Pro offert au parrain et au filleul dès la première vente du filleul.', en: 'Referrals: a personal link per seller, one free Pro month for both when the referred seller makes a first sale.' },
      { fr: 'Liste de démarrage dans le tableau de bord : produit, livraison ou paiement, alertes, partage, première commande.', en: 'Launch checklist in the dashboard: product, delivery or payment, alerts, sharing, first order.' },
      { fr: 'Catégories de produits et filtres sur la page d’accueil des boutiques.', en: 'Product categories and filters on store home pages.' },
      { fr: 'Paiement abandonné : retour direct sur la page de vente du produit.', en: 'Abandoned payment: straight back to the product sales page.' },
    ],
  },
  {
    date: '2026-11-24',
    title: { fr: 'Suivi Meta pensé pour le paiement à la livraison, centre d’aide, emails dans la langue de la boutique', en: 'Meta tracking built for cash on delivery, help center, emails in the store language' },
    items: [
      { fr: 'Avis des vendeurs : question posée après les premières ventes, témoignages publiés sur le site avec leur accord.', en: 'Seller reviews: asked after the first sales, testimonials published on the site with their consent.' },
      { fr: 'Choix du moment où l’achat est déclaré à Meta en paiement à la livraison : à la commande, à la confirmation ou à la livraison (prospect en attendant).', en: 'Choose when the purchase is reported to Meta for cash on delivery: at order, confirmation or delivery (Lead in the meantime).' },
      { fr: 'Export CSV de tous les clients, en plus des commandes.', en: 'CSV export of all customers, in addition to orders.' },
      { fr: 'Emails aux clients (commande, accès digital, suivi, relances) et au vendeur dans la langue de la boutique, français ou anglais ; langue du navigateur par défaut à la création.', en: 'Emails to customers (order, digital access, tracking, reminders) and to the seller in the store language, French or English; browser language by default at creation.' },
      { fr: 'Page contact avec WhatsApp, emails d’accompagnement des nouveaux vendeurs, emails lisibles sur téléphone.', en: 'Contact page with WhatsApp, onboarding emails for new sellers, emails readable on phones.' },
      { fr: 'Éditeur de texte enrichi (couleurs, surlignage, alignement, menu sur la sélection), ventes digitales traitées en lot.', en: 'Richer text editor (colours, highlight, alignment, selection menu), digital sales processed in bulk.' },
    ],
  },
  {
    date: '2026-11-23',
    title: { fr: 'Vue en direct et page Trafic', en: 'Live view and Traffic page' },
    items: [
      { fr: 'Vue en direct : globe 3D des visiteurs et des commandes en temps réel, étape de chaque visiteur (page, formulaire, paiement).', en: 'Live view: 3D globe of visitors and orders in real time, each visitor’s stage (page, form, payment).' },
      { fr: 'Page Trafic : visiteurs, provenance, campagnes publicitaires, parcours, appareils, pays et heures de visite.', en: 'Traffic page: visitors, sources, ad campaigns, journey, devices, countries and visit hours.' },
      { fr: 'Attribution des commandes au premier et au dernier clic.', en: 'First click and last click order attribution.' },
    ],
  },
  {
    date: '2026-11-22',
    title: { fr: 'Produits digitaux, tunnel de vente, Payment Orchestrator', en: 'Digital products, sales funnel, Payment Orchestrator' },
    items: [
      { fr: 'Boutiques digitales : ventes par état de paiement, renvoi d’accès, lien de paiement, relance des paniers, tableau de bord digital.', en: 'Digital stores: sales by payment status, resend access, payment link, cart follow up, digital dashboard.' },
      { fr: 'Packs de produits, order bump, upsell et offre de repli ajoutés à la même commande, page de remerciement.', en: 'Product bundles, order bump, upsell and fallback offer added to the same order, thank you page.' },
      { fr: 'Page HTML libre : collez votre propre page, Zuri y ajoute formulaire, prix et suivi.', en: 'Custom HTML page: paste your own page, Zuri adds form, prices and tracking.' },
      { fr: 'Emails de commande refaits pour le vendeur et le client.', en: 'Redesigned order emails for seller and customer.' },
    ],
  },
  {
    date: '2026-11-20',
    title: { fr: 'Bénéfice réel, serveur MCP, alertes pour l’équipe', en: 'Real profit, MCP server, team alerts' },
    items: [
      { fr: 'Bénéfice réel : prix d’achat, coûts de livraison et de retour, dépenses, marge par produit et par période.', en: 'Real profit: cost price, delivery and return costs, expenses, margin per product and period.' },
      { fr: 'Serveur MCP et clés d’API : 46 outils pour piloter la boutique depuis ChatGPT, Claude ou un autre assistant.', en: 'MCP server and API keys: 46 tools to run the store from ChatGPT, Claude or another assistant.' },
      { fr: 'Notifications sur le téléphone pour toute l’équipe.', en: 'Phone notifications for the whole team.' },
    ],
  },
  {
    date: '2026-11-19',
    title: { fr: 'Abonnements par Mobile Money, archivage, site zurisell.store', en: 'Mobile Money subscriptions, archiving, zurisell.store site' },
    items: [
      { fr: 'Abonnements payables par Mobile Money, sans carte bancaire.', en: 'Subscriptions payable by Mobile Money, no credit card.' },
      { fr: 'Archivage des commandes, pause et fermeture d’une boutique.', en: 'Order archiving, store pause and closing.' },
      { fr: 'Guides, pages pays, comparatifs et outils gratuits en français et en anglais.', en: 'Guides, country pages, comparisons and free tools in French and English.' },
    ],
  },
  {
    date: '2026-11-17',
    title: { fr: 'Équipe, notifications, import CSV', en: 'Team, notifications, CSV import' },
    items: [
      { fr: 'Équipe : rôles, permissions, périmètre par produit, invitations, prise en charge des commandes, journal d’activité.', en: 'Team: roles, permissions, scope per product, invitations, order claiming, activity log.' },
      { fr: 'Notifications push, email et Telegram par événement.', en: 'Push, email and Telegram notifications per event.' },
      { fr: 'Import de produits par CSV et depuis l’export Shopify.', en: 'Product import by CSV and from the Shopify export.' },
      { fr: 'Formulaire de commande paramétrable, bouton de commande collant, glisser-déposer partout.', en: 'Customisable order form, sticky order button, drag and drop everywhere.' },
    ],
  },
]
