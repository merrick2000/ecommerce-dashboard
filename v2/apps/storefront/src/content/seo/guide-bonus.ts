import type { GuidePage, WidgetId } from './types'

/**
 * Guide bonus offert (mis en avant sur la page d’accueil) :
 * trouver un produit gagnant, réussir sa pub Facebook en Afrique, et respecter les règles Meta.
 * Voir les règles de rédaction dans ./types.ts.
 */

type Block = GuidePage['blocks'][number]
type Faq = GuidePage['faqs'][number]
type Source = GuidePage['sources'][number]

const p = (fr: string, en: string): Block => ({ type: 'p', text: { fr, en } })
const h2 = (fr: string, en: string): Block => ({ type: 'h2', text: { fr, en } })
const h3 = (fr: string, en: string): Block => ({ type: 'h3', text: { fr, en } })
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
const cta = (titleFr: string, titleEn: string, fr: string, en: string): Block => ({
  type: 'cta',
  title: { fr: titleFr, en: titleEn },
  text: { fr, en },
})
const w = (id: WidgetId): Block => ({ type: 'widget', id })
const checklist = (items: [string, string][]): Block => ({ type: 'checklist', items: items.map(([fr, en]) => ({ fr, en })) })
const faq = (qFr: string, qEn: string, aFr: string, aEn: string): Faq => ({
  q: { fr: qFr, en: qEn },
  a: { fr: aFr, en: aEn },
})
const l = (fr: string, en: string) => ({ fr, en })

/* Sources officielles vérifiées (novembre 2026) */
const S = {
  adStandards: { label: 'Meta Transparency Center : Standards publicitaires (introduction)', url: 'https://transparency.meta.com/policies/ad-standards/' },
  personalAttributes: { label: 'Meta Transparency Center : Atteintes à la vie privée et caractéristiques personnelles', url: 'https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/' },
  healthWellness: { label: 'Meta Transparency Center : Santé et bien-être', url: 'https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/' },
  drugs: { label: 'Meta Transparency Center : Drogues et produits pharmaceutiques', url: 'https://transparency.meta.com/policies/ad-standards/restricted-goods-services/drugs-pharmaceuticals/' },
  weapons: { label: 'Meta Transparency Center : Armes, munitions et explosifs', url: 'https://transparency.meta.com/policies/ad-standards/restricted-goods-services/weapons-ammunitions-explosives/' },
  adult: { label: 'Meta Transparency Center : Nudité et activité sexuelle chez les adultes', url: 'https://transparency.meta.com/policies/ad-standards/objectionable-content/adult-nudity-and-sexual-activity/' },
  commercial: { label: 'Meta Transparency Center : Pratiques commerciales interdites', url: 'https://transparency.meta.com/policies/ad-standards/deceptive-content/prohibited-commercial-practices/' },
  trademarks: { label: 'Meta Transparency Center : Droits d’auteur et marques déposées', url: 'https://transparency.meta.com/policies/ad-standards/intellectual-property-infringement/copyright-and-trademarks/' },
  reviewPolicy: { label: 'Meta for Business : Politique d’examen des publicités', url: 'https://www.facebook.com/business/ads/review-policy-guidelines' },
  inReview: { label: 'Meta Business Help Center : À propos des publicités en cours d’examen', url: 'https://www.facebook.com/business/help/204798856225114' },
  restrictions: { label: 'Meta Business Help Center : À propos des restrictions publicitaires', url: 'https://www.facebook.com/business/help/975570072950669' },
  disabled: { label: 'Meta Business Help Center : Résoudre les problèmes de compte désactivé ou restreint', url: 'https://www.facebook.com/business/help/968402779873601' },
  enforcement: { label: 'Meta Business Help Center : Mise en application des Standards publicitaires', url: 'https://www.facebook.com/business/help/505720160452817' },
  verification: { label: 'Meta Business Help Center : Faire vérifier ton entreprise', url: 'https://www.facebook.com/business/help/2058515294227817' },
  twoFactor: { label: 'Meta Business Help Center : Exiger l’authentification à deux facteurs dans ton portefeuille business', url: 'https://www.facebook.com/business/help/280940009201586' },
  securityCenter: { label: 'Meta Business Help Center : À propos du Centre de sécurité', url: 'https://www.facebook.com/business/help/216940652189296' },
  personalHealth: { label: 'Meta Business Help Center : Règles publicitaires de Meta en matière de santé et de bien-être', url: 'https://www.facebook.com/business/help/2489235377779939' },
  sensitiveHealth: { label: 'Meta Business Help Center : À propos des informations interdites (données de santé sensibles)', url: 'https://www.facebook.com/business/help/361948878201809' },
  advSales: { label: 'Meta Business Help Center : À propos des campagnes de ventes Advantage+', url: 'https://www.facebook.com/business/help/1362234537597370' },
  advAudience: { label: 'Meta Business Help Center : À propos de l’audience Advantage+', url: 'https://www.facebook.com/business/help/273363992030035' },
  advBlog: { label: 'Meta for Developers : Advantage+ Campaign Experience for Sales and App (juin 2025)', url: 'https://developers.facebook.com/blog/post/2025/06/03/advantage-plus-campaign-experience-for-sales-and-app/' },
  customAudiences: { label: 'Meta for Developers : Audiences personnalisées (restrictions depuis le 2 septembre 2025)', url: 'https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences' },
  attribution: { label: 'Meta for Developers : Ads Insights API metric availability updates (octobre 2025)', url: 'https://developers.facebook.com/blog/post/2025/10/16/ads-insights-api-metric-availability-updates/' },
  whatsappAds: { label: 'Meta Newsroom : Helping You Find More Channels and Businesses on WhatsApp (juin 2025)', url: 'https://about.fb.com/news/2025/06/helping-you-find-more-channels-businesses-on-whatsapp/' },
  learning: { label: 'Meta Business Help Center : À propos de la phase d’apprentissage', url: 'https://www.facebook.com/business/help/112167992830700' },
  learningLimited: { label: 'Meta Business Help Center : À propos de l’apprentissage limité', url: 'https://www.facebook.com/business/help/269269737396981' },
  capi: { label: 'Meta Business Help Center : À propos de l’API Conversions', url: 'https://www.facebook.com/business/help/2041148702652965' },
  pixel: { label: 'Meta Business Help Center : En savoir plus sur le pixel Meta', url: 'https://www.facebook.com/business/help/742478679120153' },
  dedup: { label: 'Meta Business Help Center : Déduplication des événements du pixel et de l’API Conversions', url: 'https://www.facebook.com/business/help/823677331451951' },
  adLibrary: { label: 'Bibliothèque publicitaire Meta (Meta Ad Library)', url: 'https://www.facebook.com/ads/library/' },
  ttCreative: { label: 'TikTok Creative Center', url: 'https://ads.tiktok.com/business/creativecenter' },
} satisfies Record<string, Source>

export const BONUS_GUIDE: GuidePage = {
  slug: l('guide-offert-produit-gagnant-pub-facebook', 'free-guide-winning-product-facebook-ads'),
  category: 'publicite',
  title: l('Guide offert 2026 : produit gagnant et pub Facebook en Afrique', 'Free 2026 guide: winning products and Facebook ads in Africa'),
  description: l(
    'Le guide offert 2026 : trouve un produit gagnant, lance ta pub Facebook en COD pas à pas et respecte les règles Meta pour éviter les blocages.',
    'Our free 2026 guide: find a winning product, launch cash on delivery Facebook ads step by step and follow Meta’s rules to avoid getting blocked.',
  ),
  h1: l(
    'Le guide offert 2026 : trouver un produit gagnant et réussir ta pub Facebook en Afrique, avec les règles Meta à respecter',
    'The free 2026 guide: find a winning product and run Facebook ads that work in Africa, while following Meta’s rules',
  ),
  intro: l(
    'Ce guide rassemble en un seul endroit tout ce qu’il faut pour passer d’une idée à des commandes livrées et payées : où chercher les produits, comment les valider avec un vrai calcul de marge en COD, comment construire l’offre et la page de vente, quelles vidéos tourner, comment monter une campagne Facebook et Instagram en 2026, et surtout quelles règles Meta respecter pour ne pas voir tes pubs refusées ou ton compte bloqué. Chaque règle citée renvoie à une page officielle de Meta. Les chiffres donnés en exemple sont là pour montrer la méthode : remplace-les par les tiens.',
    'This guide puts everything in one place to go from an idea to delivered, paid orders: where to look for products, how to validate them with real cash on delivery margin math, how to build the offer and the sales page, which videos to shoot, how to set up a Facebook and Instagram campaign in 2026, and above all which Meta rules to follow so your ads are not rejected and your account is not blocked. Every rule mentioned links back to an official Meta page. The numbers used as examples are there to show the method: swap them for your own.',
  ),
  readingMinutes: 22,
  blocks: [
    /* 1. La méthode en 5 étapes */
    h2('1. La méthode en 5 étapes', '1. The method in 5 steps'),
    p(
      'Beaucoup de vendeurs commencent par la pub. C’est l’erreur qui coûte le plus cher. La pub ne fait qu’amplifier ce qui existe déjà : un bon produit avec une bonne offre devient rentable, un produit moyen brûle ton budget plus vite. Voici l’ordre à suivre, et chaque étape a sa section plus bas.',
      'Many sellers start with ads. That is the most expensive mistake. Ads only amplify what already exists: a good product with a good offer becomes profitable, an average product burns your budget faster. Here is the order to follow, and each step has its own section below.',
    ),
    list([
      ['Chercher : rassembler chaque jour des idées de produits à partir de sources réelles (pubs qui tournent, tendances, marché, statuts WhatsApp, fournisseurs).', 'Search: collect product ideas every day from real sources (running ads, trends, the market, WhatsApp statuses, suppliers).'],
      ['Valider : noter chaque idée sur des critères simples et faire le calcul de marge en COD avant de dépenser un franc.', 'Validate: score each idea on simple criteria and do the cash on delivery margin math before spending a cent.'],
      ['Construire l’offre : prix, pack, garantie, zones et délais de livraison, page de vente claire avec formulaire court.', 'Build the offer: price, bundle, guarantee, delivery areas and times, a clear sales page with a short form.'],
      ['Créer les vidéos : plusieurs accroches, une démonstration réelle, des sous-titres, le tout dans le respect des règles Meta.', 'Create the videos: several hooks, a real demonstration, captions, all within Meta’s rules.'],
      ['Lancer, mesurer, décider : une campagne simple, un budget de test fixé à l’avance, et une décision par jour basée sur le coût par commande livrée.', 'Launch, measure, decide: one simple campaign, a test budget set in advance, and one decision a day based on cost per delivered order.'],
    ], true),
    tip(
      'La règle d’or du COD',
      'The golden rule of cash on delivery',
      'En paiement à la livraison, une commande n’est pas une vente. Une vente, c’est un colis livré et payé. Tout ce guide est construit autour de ce chiffre : le coût publicitaire par commande livrée.',
      'With cash on delivery, an order is not a sale. A sale is a parcel delivered and paid for. This whole guide is built around one number: ad cost per delivered order.',
    ),

    /* 2. Trouver des idées */
    h2('2. Trouver des idées de produits : les sources et la routine', '2. Finding product ideas: the sources and the routine'),
    p(
      'Un produit gagnant se trouve rarement par chance. Il se trouve en regardant un peu chaque jour aux bons endroits, et en notant tout dans un même tableau (un simple fichier ou une note sur ton téléphone) : nom du produit, où tu l’as vu, prix de vente constaté, accroche utilisée, fournisseur possible.',
      'A winning product is rarely found by luck. You find it by looking a little every day in the right places, and writing everything in one sheet (a simple file or a note on your phone): product name, where you saw it, observed selling price, hook used, possible supplier.',
    ),
    h3('La bibliothèque publicitaire Meta', 'Meta Ad Library'),
    p(
      'La bibliothèque publicitaire Meta est gratuite et ouverte à tous, sans compte publicitaire. Choisis ton pays, la catégorie « Toutes les publicités », puis tape des mots que les vendeurs COD utilisent : « paiement à la livraison », « livraison gratuite », « payez à la réception », « commandez maintenant », ou le nom de ta ville. Ouvre les publicités et regarde depuis quand elles sont actives, et si le même vendeur fait tourner plusieurs versions du même produit. Une pub qui tourne depuis des semaines, déclinée en plusieurs vidéos, est un signal à noter, pas une preuve : tu ne vois ni ses ventes ni ses retours.',
      'Meta Ad Library is free and open to everyone, no ad account needed. Pick your country, the "All ads" category, then type words cash on delivery sellers use: "paiement à la livraison", "livraison gratuite", "pay on delivery", "order now", or your city name. Open the ads and check how long they have been active, and whether the same seller runs several versions of the same product. An ad that has run for weeks, in several video versions, is a signal worth noting, not proof: you see neither its sales nor its returns.',
    ),
    h3('TikTok Creative Center', 'TikTok Creative Center'),
    p(
      'Le TikTok Creative Center montre des publicités qui ont bien fonctionné, des hashtags et des sons en tendance, filtrables par pays et par secteur quand ton pays est disponible. Même si tu vends surtout via Facebook, c’est une mine d’idées d’accroches et de formats de vidéo. Complète avec ton fil « Pour toi » sur un compte dédié à la recherche : like et enregistre les vidéos de produits, l’algorithme t’en proposera d’autres.',
      'TikTok Creative Center shows ads that performed well, plus trending hashtags and sounds, filterable by country and industry when your country is available. Even if you sell mostly through Facebook, it is a goldmine of hooks and video formats. Add your For You feed on an account used only for research: like and save product videos and the algorithm will show you more.',
    ),
    h3('Le marché et la rue', 'The market and the street'),
    p(
      'Adjamé, Dantokpa, Sandaga, Marché Central, Mokolo, Marché de la Liberté : les grands marchés te disent ce que les gens achètent vraiment, à quel prix, et ce qui manque. Regarde ce que les vendeurs ambulants proposent dans les embouteillages : si un produit s’y vend, il répond à un besoin simple et se comprend en deux secondes. Ton avantage en ligne : mieux présenter, mieux expliquer, et livrer à domicile.',
      'Adjamé, Dantokpa, Sandaga, Marché Central, Mokolo, Marché de la Liberté: big markets tell you what people really buy, at what price, and what is missing. Watch what street vendors sell in traffic jams: if a product sells there, it meets a simple need and is understood in two seconds. Your online advantage: better presentation, better explanation, and home delivery.',
    ),
    h3('Les statuts WhatsApp', 'WhatsApp statuses'),
    p(
      'Les statuts WhatsApp de ton entourage, des revendeuses et des groupes de quartier sont un baromètre gratuit. Note les produits qui reviennent chez plusieurs personnes différentes, et les questions posées en réponse : « c’est combien ? », « vous livrez à Yopougon ? ». Une question qui revient souvent, c’est une demande réelle.',
      'WhatsApp statuses from people around you, resellers and neighbourhood groups are a free barometer. Note products that show up from several different people, and the questions asked in reply: "how much?", "do you deliver to Yopougon?". A question that keeps coming back is real demand.',
    ),
    h3('Les fournisseurs et grossistes', 'Suppliers and wholesalers'),
    p(
      'Demande à tes grossistes ce qu’ils réapprovisionnent le plus souvent et ce qui vient d’arriver. Un fournisseur local qui a du stock te permet de tester vite et de livrer en 24 à 48 heures, ce qui aide la confirmation en COD. Si tu importes, compte le délai et le coût d’arrivée avant de te lancer, et commence par une petite quantité.',
      'Ask your wholesalers what they restock most often and what just arrived. A local supplier with stock lets you test fast and deliver within 24 to 48 hours, which helps confirmation with cash on delivery. If you import, count the lead time and landed cost before you start, and begin with a small quantity.',
    ),
    h3('Ta routine de 30 minutes par jour', 'Your 30 minute daily routine'),
    table([
      [['Moment', 'When'], ['Action', 'Action'], ['Durée', 'Time']],
      [['Matin', 'Morning'], ['Bibliothèque publicitaire Meta : 3 recherches avec des mots COD, note 3 produits', 'Meta Ad Library: 3 searches with cash on delivery keywords, note 3 products'], ['10 min', '10 min']],
      [['Midi', 'Midday'], ['TikTok Creative Center ou fil « Pour toi » : note 2 accroches et 1 format de vidéo', 'TikTok Creative Center or For You feed: note 2 hooks and 1 video format'], ['10 min', '10 min']],
      [['Soir', 'Evening'], ['Statuts WhatsApp et messages clients : note les demandes qui reviennent', 'WhatsApp statuses and customer messages: note recurring requests'], ['5 min', '5 min']],
      [['Soir', 'Evening'], ['Donne une note rapide à chaque nouvelle idée (section suivante)', 'Give each new idea a quick score (next section)'], ['5 min', '5 min']],
      [['Une fois par semaine', 'Once a week'], ['Tour au marché ou appel à 2 grossistes pour vérifier prix et stock', 'Visit the market or call 2 wholesalers to check prices and stock'], ['1 à 2 h', '1 to 2 h']],
    ]),
    tip(
      'Copier une idée, oui. Copier une pub, non',
      'Copy an idea, yes. Copy an ad, no',
      'S’inspirer d’un produit qui marche est normal. Reprendre la vidéo, les photos ou le logo d’un autre vendeur ou d’une marque, c’est risquer un signalement pour atteinte à la propriété intellectuelle, et Meta peut refuser la pub. Tourne tes propres images.',
      'Taking inspiration from a product that works is normal. Reusing another seller’s or a brand’s video, photos or logo means risking an intellectual property report, and Meta can reject the ad. Shoot your own footage.',
    ),

    /* 3. Valider */
    h2('3. Valider un produit avant de dépenser', '3. Validating a product before spending'),
    h3('Les critères à vérifier', 'The criteria to check'),
    list([
      ['Problème ou envie évidente : douleur, gain de temps, propreté, beauté, sécurité de la maison, fierté.', 'An obvious problem or desire: pain, time saving, cleanliness, beauty, home safety, pride.'],
      ['Démontrable en vidéo en quelques secondes, sans long discours.', 'Can be shown on video in a few seconds, no long explanation.'],
      ['Marge suffisante une fois livraison, retours et pub payés (calcul plus bas).', 'Enough margin once delivery, returns and ads are paid (math below).'],
      ['Facile à livrer : léger, solide, sans taille ni couleur compliquée au début.', 'Easy to deliver: light, sturdy, no tricky sizes or colours at first.'],
      ['Stock disponible localement, ou réapprovisionnement fiable.', 'Stock available locally, or reliable restocking.'],
      ['Autorisé en publicité Meta : pas d’arme, pas de médicament, pas de promesse santé impossible (voir la section 7).', 'Allowed in Meta ads: no weapons, no medicines, no impossible health claims (see section 7).'],
      ['Pas une contrefaçon : pas de faux produits de marque, pas de logo copié.', 'Not a counterfeit: no fake branded products, no copied logo.'],
    ]),
    w('product-score'),
    h3('Le calcul de marge en COD, sur 100 commandes', 'Cash on delivery margin math, on 100 orders'),
    p(
      'Exemple, avec des chiffres choisis uniquement pour montrer la méthode (ce ne sont pas des moyennes) : un produit acheté 3 500 FCFA, vendu 12 000 FCFA, une livraison à 1 500 FCFA payée au livreur pour chaque colis sorti, et un closer payé 300 FCFA par commande livrée. On suppose 70 commandes confirmées sur 100, et 50 livrées sur ces 70.',
      'Example, with numbers chosen only to show the method (they are not averages): a product bought for 3,500 FCFA, sold for 12,000 FCFA, delivery at 1,500 FCFA paid to the courier for every parcel sent out, and a closer paid 300 FCFA per delivered order. We assume 70 confirmed orders out of 100, and 50 delivered out of those 70.',
    ),
    table([
      [['Exemple : 100 commandes', 'Example: 100 orders'], ['Calcul', 'Calculation'], ['Montant', 'Amount']],
      [['Chiffre encaissé', 'Cash collected'], ['50 x 12 000', '50 x 12,000'], ['600 000 FCFA', '600,000 FCFA']],
      [['Coût des produits livrés', 'Cost of delivered products'], ['50 x 3 500', '50 x 3,500'], ['175 000 FCFA', '175,000 FCFA']],
      [['Livraisons payées (livrées et refusées)', 'Deliveries paid (delivered and refused)'], ['70 x 1 500', '70 x 1,500'], ['105 000 FCFA', '105,000 FCFA']],
      [['Closer', 'Closer'], ['50 x 300', '50 x 300'], ['15 000 FCFA', '15,000 FCFA']],
      [['Marge avant pub', 'Margin before ads'], ['600 000 moins 295 000', '600,000 minus 295,000'], ['305 000 FCFA', '305,000 FCFA']],
      [['Marge avant pub par commande livrée', 'Margin before ads per delivered order'], ['305 000 divisé par 50', '305,000 divided by 50'], ['6 100 FCFA', '6,100 FCFA']],
    ]),
    p(
      'Dans cet exemple, tu es à l’équilibre si ta pub te coûte 6 100 FCFA par commande livrée. Pour garder un vrai bénéfice, fixe-toi une cible plus basse, par exemple la moitié : 3 000 FCFA par commande livrée. Comme seulement 50 commandes sur 100 sont livrées dans cet exemple, cela correspond à un coût par commande d’environ 1 500 FCFA dans le gestionnaire de publicités. C’est ce chiffre, calculé avec tes propres taux, que tu regarderas pendant le test.',
      'In this example, you break even if ads cost you 6,100 FCFA per delivered order. To keep a real profit, set a lower target, for example half: 3,000 FCFA per delivered order. Since only 50 orders out of 100 get delivered in this example, that matches a cost per order of about 1,500 FCFA in Ads Manager. That number, worked out with your own rates, is what you will watch during the test.',
    ),
    tip(
      'Tes taux, pas ceux des autres',
      'Your rates, not other people’s',
      'Les taux de confirmation et de livraison changent selon le produit, la ville, le livreur et la qualité de ton closing. Au début, prends des hypothèses prudentes, puis remplace-les par tes vrais chiffres après les premières dizaines de commandes. Zuri calcule pour toi les taux de confirmation et de livraison et le chiffre encaissé.',
      'Confirmation and delivery rates change with the product, the city, the courier and how good your closing is. At first, use cautious assumptions, then replace them with your real numbers after the first few dozen orders. Zuri calculates your confirmation and delivery rates and cash collected for you.',
    ),
    h3('Un petit budget de test, fixé à l’avance', 'A small test budget, set in advance'),
    p(
      'Avant de lancer, écris noir sur blanc trois chiffres : ton budget de test total, ton coût par commande cible, et ton seuil d’arrêt. Exemple : 5 000 FCFA par jour pendant 4 jours, soit 20 000 FCFA au total pour ce produit. Seuil d’arrêt : si une pub dépense deux à trois fois ton coût par commande cible sans aucune commande, tu la coupes ou tu changes la vidéo. Ce budget doit être une somme que tu acceptes de perdre : un test raté n’est pas un échec, c’est une information achetée.',
      'Before launching, write down three numbers: your total test budget, your target cost per order, and your stop threshold. Example: 5,000 FCFA a day for 4 days, so 20,000 FCFA in total for this product. Stop threshold: if an ad spends two to three times your target cost per order with no orders at all, cut it or change the video. This budget must be money you accept to lose: a failed test is not a failure, it is information you paid for.',
    ),

    /* 4. Offre et page */
    h2('4. Construire l’offre et la page de vente pour le COD', '4. Building the offer and the sales page for cash on delivery'),
    p(
      'En COD, ta page de vente doit faire deux choses : donner envie de commander, et préparer un client qui sera vraiment là, avec l’argent, quand le livreur appellera. Une page qui promet trop fait des commandes qui ne se livrent pas.',
      'With cash on delivery, your sales page has two jobs: make people want to order, and prepare a customer who will actually be there, with the money, when the courier calls. A page that overpromises brings orders that never get delivered.',
    ),
    h3('L’offre', 'The offer'),
    list([
      ['Un prix clair, affiché en FCFA (ou ta monnaie), sans frais cachés découverts au moment de la livraison.', 'A clear price, shown in FCFA (or your currency), with no hidden fees discovered at delivery.'],
      ['Un pack qui augmente le panier : « 1 pour 12 000, 2 pour 20 000 ». Il améliore ta marge par livraison, puisque tu paies une seule course.', 'A bundle that raises the basket: "1 for 12,000, 2 for 20,000". It improves your margin per delivery, since you pay for one trip.'],
      ['Les zones et délais de livraison écrits noir sur blanc : « Abidjan en 24 h, intérieur en 48 à 72 h ».', 'Delivery areas and times written plainly: "Abidjan within 24 h, other cities within 48 to 72 h".'],
      ['« Paiement à la livraison » bien visible, et le Mobile Money en option pour ceux qui préfèrent payer avant.', '"Pay on delivery" clearly visible, with Mobile Money as an option for those who prefer to pay upfront.'],
      ['Une garantie simple que tu peux tenir : échange si le produit arrive abîmé, par exemple.', 'A simple guarantee you can keep: exchange if the product arrives damaged, for example.'],
    ]),
    h3('La page', 'The page'),
    list([
      ['En haut : une photo ou vidéo réelle du produit, le bénéfice principal en une phrase, le prix et le bouton de commande.', 'At the top: a real photo or video of the product, the main benefit in one sentence, the price and the order button.'],
      ['Ensuite : comment ça marche, en 3 étapes avec des images tournées par toi.', 'Then: how it works, in 3 steps with images you shot yourself.'],
      ['De vrais avis de vrais clients, avec leur accord. N’invente jamais d’avis : c’est trompeur pour les clients et contraire aux règles de Meta sur les pratiques commerciales.', 'Real reviews from real customers, with their permission. Never invent reviews: it misleads customers and goes against Meta’s rules on commercial practices.'],
      ['Une FAQ courte : livraison, paiement, garantie, contact.', 'A short FAQ: delivery, payment, guarantee, contact.'],
      ['Un formulaire court : nom, téléphone, ville ou commune, quantité. Chaque champ en plus fait perdre des commandes.', 'A short form: name, phone, city or area, quantity. Every extra field loses orders.'],
      ['Un contact WhatsApp visible pour rassurer.', 'A visible WhatsApp contact to reassure people.'],
      ['Une page rapide sur téléphone, testée avec une connexion mobile ordinaire.', 'A page that loads fast on a phone, tested on an ordinary mobile connection.'],
    ]),
    tip(
      'Pas de faux compte à rebours',
      'No fake countdown timers',
      'Un minuteur qui repart à zéro à chaque visite ou un « stock limité » imaginaire sont des prix et des urgences trompeurs. Les règles de Meta sur les pratiques commerciales interdisent de tromper les gens pour de l’argent. Une vraie promotion avec une vraie date de fin, oui.',
      'A timer that resets on every visit or an imaginary "limited stock" is deceptive pricing and fake urgency. Meta’s rules on commercial practices forbid misleading people for money. A real promotion with a real end date is fine.',
    ),

    /* 5. Créatives */
    h2('5. Les créatives qui convertissent', '5. Creatives that convert'),
    p(
      'En 2026, avec des campagnes de plus en plus automatisées, la créative fait l’essentiel du ciblage : c’est ta vidéo qui attire ou fait fuir les bons acheteurs. Prévois toujours plusieurs vidéos par produit, avec des accroches différentes.',
      'In 2026, with campaigns becoming more and more automated, the creative does most of the targeting: your video is what attracts or repels the right buyers. Always plan several videos per product, with different hooks.',
    ),
    h3('Les accroches des 3 premières secondes', 'Hooks for the first 3 seconds'),
    list([
      ['Le problème vécu : « Ton ventilateur fait plus de bruit que d’air ? »', 'The everyday problem: "Your fan makes more noise than air?"'],
      ['Le résultat montré tout de suite : le produit qui nettoie, coupe, éclaire, dès la première image.', 'The result shown right away: the product cleaning, cutting, lighting up from the very first frame.'],
      ['La surprise : un geste inattendu, un objet que personne n’a encore vu au quartier.', 'Surprise: an unexpected gesture, an object nobody in the neighbourhood has seen yet.'],
      ['La comparaison honnête : l’ancienne façon de faire contre la nouvelle (sans avant et après physique pour la minceur, voir la section 7).', 'An honest comparison: the old way versus the new way (no physical before and after for weight loss, see section 7).'],
      ['La réaction d’un vrai client à la livraison, avec son accord.', 'A real customer’s reaction at delivery, with their permission.'],
    ]),
    w('hook-3s'),
    h3('Le format UGC', 'The UGC format'),
    p(
      'UGC veut dire contenu créé par un utilisateur : une personne ordinaire qui parle du produit face caméra, au téléphone, chez elle ou dans la rue. Ce format paraît naturel dans le fil d’actualité. Tu peux le tourner toi-même, avec un proche, ou payer une créatrice locale. Donne-lui un plan simple, pas un texte à réciter : accroche, problème, démonstration, offre et livraison.',
      'UGC means user generated content: an ordinary person talking about the product to camera, on a phone, at home or in the street. This format feels natural in the feed. You can shoot it yourself, with someone close to you, or pay a local creator. Give them a simple outline, not a script to recite: hook, problem, demonstration, offer and delivery.',
    ),
    h3('Les formats à préparer', 'Formats to prepare'),
    table([
      [['Format', 'Format'], ['Usage', 'Use'], ['Conseil', 'Tip']],
      [['Vidéo verticale 9:16', 'Vertical video 9:16'], ['Reels et Stories', 'Reels and Stories'], ['Garde le texte loin des bords haut et bas', 'Keep text away from the top and bottom edges']],
      [['Vidéo 4:5', 'Video 4:5'], ['Fil d’actualité Facebook et Instagram', 'Facebook and Instagram feed'], ['Même vidéo, recadrée', 'Same video, reframed']],
      [['Image ou carrousel', 'Image or carousel'], ['Produits simples, offres de pack', 'Simple products, bundle offers'], ['Une image par bénéfice ou par variante', 'One image per benefit or variant']],
    ]),
    list([
      ['Sous-titres sur toutes les vidéos : beaucoup regardent sans le son.', 'Captions on every video: many people watch with the sound off.'],
      ['Français simple, et une version en langue locale si ta clientèle la parle : wolof, dioula, fon, lingala, ewondo…', 'Simple French, and a local language version if your customers speak it: Wolof, Dioula, Fon, Lingala, Ewondo…'],
      ['Termine toujours par l’offre, la zone de livraison et « paiement à la livraison ».', 'Always end with the offer, the delivery area and "pay on delivery".'],
      ['Montre le vrai produit, celui que le client recevra. Un écart entre la vidéo et le colis fait exploser les refus.', 'Show the real product, the one the customer will receive. A gap between the video and the parcel makes refusals soar.'],
    ]),

    /* 6. Campagne */
    h2('6. Monter ta campagne pas à pas en 2026', '6. Setting up your campaign step by step in 2026'),
    h3('Les bases à avoir avant de cliquer sur « Créer »', 'The basics before you click "Create"'),
    list([
      ['Un portefeuille business Meta avec ta page Facebook, ton compte Instagram et ton compte publicitaire, à ton vrai nom ou au nom de ton entreprise.', 'A Meta business portfolio with your Facebook page, Instagram account and ad account, under your real name or your business name.'],
      ['Le pixel Meta installé sur ta boutique, et l’API Conversions qui envoie les mêmes événements depuis le serveur. Meta recommande d’utiliser les deux ensemble avec déduplication, pour qu’une commande ne soit pas comptée deux fois.', 'The Meta pixel installed on your store, and the Conversions API sending the same events from the server. Meta recommends using both together with deduplication, so an order is not counted twice.'],
      ['Des événements propres : vue de contenu, début de commande, achat avec le montant et la devise.', 'Clean events: view content, initiate checkout, purchase with amount and currency.'],
      ['Un moyen de paiement publicitaire stable, à ton nom.', 'A stable ad payment method, in your name.'],
    ]),
    p(
      'Sur Zuri, le pixel Facebook et l’API Conversions sont intégrés : tu colles ton identifiant de pixel et ton jeton, et les événements partent de la boutique et du serveur. Le guide « Pixel Facebook et API Conversions » détaille la vérification avec l’outil de test d’événements.',
      'On Zuri, the Facebook pixel and the Conversions API are built in: you paste your pixel ID and token, and events are sent from both the store and the server. The "Facebook pixel and Conversions API" guide explains how to check everything with the test events tool.',
    ),
    h3('Ce qui a changé : les campagnes de ventes Advantage+', 'What changed: Advantage+ sales campaigns'),
    p(
      'Depuis 2025, Meta a simplifié la création des campagnes de ventes : tu ne choisis plus au départ entre une campagne « manuelle » et une campagne Advantage+ shopping. Tu crées une campagne Ventes, et elle est considérée comme Advantage+ quand trois réglages automatiques sont actifs : le budget de campagne Advantage+, l’audience Advantage+ dans au moins un ensemble de publicités, et les placements Advantage+ dans tous les ensembles. Si tu modifies certains de ces réglages, la campagne fonctionne toujours, mais elle perd ce statut Advantage+.',
      'Since 2025, Meta has simplified sales campaign creation: you no longer choose upfront between a "manual" campaign and an Advantage+ shopping campaign. You create a Sales campaign, and it counts as Advantage+ when three automatic settings are on: Advantage+ campaign budget, Advantage+ audience in at least one ad set, and Advantage+ placements in all ad sets. If you change some of these settings, the campaign still runs, but it loses its Advantage+ status.',
    ),
    h3('La création, étape par étape', 'Creating it, step by step'),
    list([
      ['Dans le gestionnaire de publicités, clique sur Créer et choisis l’objectif Ventes.', 'In Ads Manager, click Create and choose the Sales objective.'],
      ['Garde la configuration Advantage+ proposée par Meta, sauf raison précise. Une campagne par produit, pour lire tes chiffres produit par produit.', 'Keep the Advantage+ setup Meta suggests, unless you have a specific reason. One campaign per product, so you read your numbers product by product.'],
      ['Emplacement de la conversion : site web. Choisis ton pixel (ou ton jeu de données) et l’événement Achat. Si ton pixel reçoit encore très peu d’achats, tu peux commencer sur un événement plus fréquent comme le début de commande, puis passer à l’achat.', 'Conversion location: website. Pick your pixel (or dataset) and the Purchase event. If your pixel still gets very few purchases, you can start with a more frequent event like initiate checkout, then switch to purchase.'],
      ['Budget : un budget quotidien au niveau de la campagne, égal à ton budget de test par jour.', 'Budget: a daily budget at campaign level, equal to your daily test budget.'],
      ['Audience : laisse l’audience Advantage+ trouver les acheteurs, mais fixe les limites qui comptent en COD : les pays, villes ou zones où tu livres vraiment, et l’âge minimum si ton produit l’exige. Ne paie pas pour montrer ta pub là où ton livreur ne va pas.', 'Audience: let Advantage+ audience find buyers, but set the limits that matter for cash on delivery: the countries, cities or areas you really deliver to, and the minimum age if your product requires it. Do not pay to show ads where your courier does not go.'],
      ['Placements : Advantage+ (automatiques), pour laisser Meta diffuser sur Facebook, Instagram et ses autres emplacements.', 'Placements: Advantage+ (automatic), to let Meta deliver across Facebook, Instagram and its other placements.'],
      ['Publicités : 3 à 5 créatives différentes (accroches différentes), avec le lien de ta page produit et un texte qui rappelle l’offre et le paiement à la livraison.', 'Ads: 3 to 5 different creatives (different hooks), with your product page link and copy that recalls the offer and pay on delivery.'],
      ['Vérifie l’aperçu sur mobile, puis publie. La pub passe en examen avant de diffuser.', 'Check the mobile preview, then publish. The ad goes into review before delivering.'],
    ], true),
    w('ad-budget'),
    h3('La phase d’apprentissage', 'The learning phase'),
    p(
      'Après le lancement, et après chaque modification importante, ton ensemble de publicités passe par une phase d’apprentissage pendant laquelle les résultats sont instables. Meta indique qu’un ensemble est en « apprentissage limité » quand il a peu de chances d’obtenir environ 50 événements d’optimisation dans la semaine qui suit la dernière modification importante. Avec un petit budget COD, c’est fréquent, et ce n’est pas grave : ça veut dire que tu dois juger sur ton coût par commande livrée plutôt que sur l’étiquette.',
      'After launch, and after every significant edit, your ad set goes through a learning phase during which results are unstable. Meta says an ad set is "learning limited" when it is unlikely to get around 50 optimization events in the week after its last significant edit. With a small cash on delivery budget this is common, and it is fine: it means you should judge on cost per delivered order rather than on the label.',
    ),
    list([
      ['Évite de toucher chaque jour au budget, à l’audience ou aux créatives : ce sont des modifications importantes qui relancent l’apprentissage.', 'Avoid touching budget, audience or creatives every day: these are significant edits that restart learning.'],
      ['Si tu veux sortir de l’apprentissage limité, Meta suggère notamment de regrouper les ensembles, d’élargir l’audience, d’augmenter le budget ou de choisir un événement plus fréquent.', 'If you want to get out of learning limited, Meta suggests combining ad sets, broadening the audience, raising the budget or choosing a more frequent event.'],
    ]),
    h3('Ce qu’il faut regarder chaque jour', 'What to look at every day'),
    table([
      [['Indicateur', 'Metric'], ['Où le trouver', 'Where to find it'], ['Ce qu’il te dit', 'What it tells you']],
      [['Dépense', 'Spend'], ['Gestionnaire de publicités', 'Ads Manager'], ['Ce que tu as payé hier', 'What you paid yesterday']],
      [['Coût par achat', 'Cost per purchase'], ['Gestionnaire de publicités', 'Ads Manager'], ['À comparer à ton coût par commande cible', 'Compare to your target cost per order']],
      [['CTR (taux de clic)', 'CTR (click through rate)'], ['Gestionnaire de publicités', 'Ads Manager'], ['Si ta vidéo donne envie de cliquer', 'Whether your video makes people click']],
      [['Taux de confirmation', 'Confirmation rate'], ['Ta boutique, tes closers', 'Your store, your closers'], ['Si l’offre et la page attirent de vrais acheteurs', 'Whether the offer and page attract real buyers']],
      [['Taux de livraison', 'Delivery rate'], ['Ta boutique, tes livreurs', 'Your store, your couriers'], ['Si les clients confirmés paient vraiment', 'Whether confirmed customers actually pay']],
      [['Coût par commande livrée', 'Cost per delivered order'], ['Dépense divisée par commandes livrées', 'Spend divided by delivered orders'], ['Le seul chiffre qui dit si tu gagnes de l’argent', 'The only number that tells you if you make money']],
    ]),
    h3('Quand couper, quand augmenter', 'When to cut, when to scale'),
    list([
      ['Coupe une publicité qui atteint ton seuil d’arrêt sans commande.', 'Cut an ad that hits your stop threshold with no orders.'],
      ['Si le CTR est bon mais qu’il n’y a pas de commande, le problème est souvent la page ou le prix, pas la vidéo.', 'If CTR is good but there are no orders, the problem is often the page or the price, not the video.'],
      ['Si les commandes arrivent mais se confirment mal, regarde l’offre, la promesse de la vidéo et la rapidité de ton closing.', 'If orders come in but confirm poorly, check the offer, the video’s promise and how fast you call.'],
      ['Augmente par paliers raisonnables une campagne dont le coût par commande livrée reste sous ta cible plusieurs jours de suite, plutôt que de multiplier le budget d’un coup.', 'Raise in reasonable steps a campaign whose cost per delivered order stays under target several days in a row, instead of multiplying the budget overnight.'],
      ['Ajoute de nouvelles vidéos quand les résultats baissent, au lieu de tout recréer.', 'Add new videos when results drop, instead of rebuilding everything.'],
    ]),
    tip(
      'N’envoie pas de données de santé à Meta',
      'Do not send health data to Meta',
      'Meta demande aux sites de ne pas lui envoyer d’informations sensibles sur les personnes, et filtre les données de santé jugées sensibles pour qu’elles ne servent pas à l’optimisation des pubs. Concrètement : ne nomme pas tes événements, tes URL ou tes audiences avec une maladie ou un état de santé (« diabète », « hémorroïdes »). Utilise des noms neutres.',
      'Meta asks websites not to send it sensitive information about people, and filters health data it considers sensitive so it is not used to optimize ads. In practice: do not name your events, URLs or audiences after a disease or health condition ("diabetes", "hemorrhoids"). Use neutral names.',
    ),

    /* 7. Règles Meta */
    h2('7. Les règles Meta à respecter en 2026', '7. Meta’s rules to follow in 2026'),
    p(
      'Toute publicité passe par un examen, en grande partie automatisé, qui regarde les images, les vidéos, le texte, le ciblage et la page de destination. L’examen prend généralement moins de 24 heures, et une pub peut être réexaminée même après le début de la diffusion. Voici les règles qui piègent le plus souvent les vendeurs COD. Meta indique appliquer les mêmes Standards publicitaires partout dans le monde, sauf exceptions par pays précisées ci-dessous.',
      'Every ad goes through a review, largely automated, that checks images, videos, text, targeting and the landing page. Review usually takes less than 24 hours, and an ad can be reviewed again even after it starts delivering. Here are the rules that most often trip up cash on delivery sellers. Meta says it applies the same Advertising Standards worldwide, except for the country specific exceptions noted below.',
    ),
    h3('Les caractéristiques personnelles : ne dis pas « Tu as… ? »', 'Personal attributes: do not say "Do you have…?"'),
    p(
      'Une pub ne doit pas affirmer ni sous-entendre qu’elle connaît une caractéristique personnelle de la personne qui la voit : origine, religion, âge, orientation sexuelle, identité de genre, handicap, santé physique ou mentale, situation financière difficile, casier judiciaire, nom. Le piège, c’est la phrase qui parle directement à la personne de cette caractéristique.',
      'An ad must not assert or imply that it knows a personal attribute of the person viewing it: ethnicity, religion, age, sexual orientation, gender identity, disability, physical or mental health, vulnerable financial status, criminal record, name. The trap is the sentence that speaks directly to the person about that attribute.',
    ),
    table([
      [['À éviter', 'Avoid'], ['Version acceptable', 'Acceptable version']],
      [['« Tu as du diabète ? »', '"Do you have diabetes?"'], ['« Un tensiomètre simple à utiliser à la maison »', '"An easy to use blood pressure monitor for home"']],
      [['« Tu es endetté ? Ce business est pour toi »', '"In debt? This business is for you"'], ['« Une activité à lancer avec un petit capital »', '"A business you can start with small capital"']],
      [['« Tu as plus de 50 ans ? »', '"Are you over 50?"'], ['« Pensé pour les seniors »', '"Designed for seniors"']],
      [['« Tu es musulman ? Ce tapis est pour toi »', '"Are you Muslim? This mat is for you"'], ['« Tapis de prière en velours, livré chez toi »', '"Velvet prayer mat, delivered to your door"']],
    ]),
    h3('Avant et après, promesses irréalistes', 'Before and after, unrealistic promises'),
    list([
      ['Les pubs pour la perte de poids, les compléments diététiques et les actes esthétiques doivent cibler uniquement les 18 ans et plus.', 'Ads for weight loss, dietary supplements and cosmetic procedures must target only people 18 and over.'],
      ['Pas de comparaison côte à côte « avant et après » pour la perte de poids, ni de gros plan sur une partie du corps où l’on pince la graisse.', 'No side by side "before and after" comparison for weight loss, and no close up of a body part pinching fat.'],
      ['Un complément minceur peut montrer son utilisation, mais doit indiquer clairement le temps nécessaire pour voir un résultat. Pas de promesse de résultat « juste en portant » un produit (ceinture, patch…).', 'A slimming supplement can show its use, but must clearly state the time needed to see results. No promise of results "just by wearing" a product (belt, patch…).'],
      ['Rien qui fasse se sentir mal dans son corps : pas de « débarrasse-toi de ce ventre affreux », pas de corps « parfait » à atteindre.', 'Nothing that makes people feel bad about their body: no "get rid of that ugly belly", no "perfect" body to aim for.'],
      ['Aucune promesse de guérir une maladie incurable (diabète, cancer, VIH…). Parler d’atténuer des symptômes reste possible dans les limites des règles.', 'No promise to cure an incurable disease (diabetes, cancer, HIV…). Talking about relieving symptoms is possible within the rules.'],
      ['Les produits éclaircissants ou dépigmentants qui changent la couleur de la peau de façon permanente sont interdits.', 'Skin lightening or bleaching products that permanently change skin colour are prohibited.'],
      ['Pas de titre accrocheur exagéré sur la santé ou le poids, du type « moins 10 kilos en une semaine » sans nuance.', 'No exaggerated clickbait on health or weight, like "lose 10 kilos in a week" with no qualifier.'],
    ]),
    tip(
      'Bonne nouvelle pour la beauté',
      'Good news for beauty',
      'Les cosmétiques non permanents (crèmes, maquillage, produits capillaires), les extensions de cheveux et les perruques peuvent montrer une transformation avant et après, tant que la pub ne joue pas sur le complexe. Les produits de blanchiment dentaire et la nourriture générale ne sont pas soumis à la limite d’âge de 18 ans.',
      'Non permanent cosmetics (creams, makeup, hair products), hair extensions and wigs can show a before and after transformation, as long as the ad does not play on insecurities. Teeth whitening products and general food are not subject to the 18 plus age limit.',
    ),
    h3('Produits interdits et produits encadrés', 'Prohibited and restricted products'),
    table([
      [['Catégorie', 'Category'], ['Règle Meta', 'Meta rule']],
      [['Armes et autodéfense', 'Weapons and self defence'], ['Interdits : armes à feu, munitions, bombes lacrymogènes, tasers, matraques, couteaux non culinaires, feux d’artifice. Les accessoires comme les étuis ou gilets de protection sont possibles, ciblés 18 ans et plus.', 'Prohibited: firearms, ammunition, pepper spray, tasers, batons, non kitchen knives, fireworks. Accessories like cases or protective vests are allowed, targeted 18 plus.']],
      [['Drogues', 'Drugs'], ['Interdit de vendre ou d’encourager les drogues illicites ou récréatives, et le matériel associé.', 'Selling or encouraging illicit or recreational drugs, and related paraphernalia, is prohibited.']],
      [['Médicaments sur ordonnance', 'Prescription drugs'], ['Seulement pour des annonceurs certifiés et autorisés par Meta, et seulement aux États-Unis, au Canada et en Nouvelle-Zélande. En Afrique, un vendeur COD ne peut donc pas en faire la pub.', 'Only for advertisers certified and authorized by Meta, and only in the United States, Canada and New Zealand. In Africa, a cash on delivery seller therefore cannot advertise them.']],
      [['Médicaments sans ordonnance', 'Over the counter medicines'], ['Possible seulement en respectant la loi du pays et sans cibler les moins de 18 ans.', 'Only if local law is followed and under 18s are not targeted.']],
      [['Compléments jugés dangereux', 'Supplements deemed unsafe'], ['Meta décide quelles substances sont dangereuses, et leur pub est interdite.', 'Meta decides which substances are unsafe, and ads for them are prohibited.']],
      [['Produits pour adultes', 'Adult products'], ['Interdits : produits axés sur le plaisir sexuel ou la performance (jouets sexuels, « boosters »). Les produits de santé reproductive doivent cibler les adultes et parler de santé, pas de plaisir.', 'Prohibited: products focused on sexual pleasure or performance (sex toys, "boosters"). Reproductive health products must target adults and focus on health, not pleasure.']],
      [['Nudité et images suggestives', 'Nudity and suggestive images'], ['Nudité interdite. Les images centrées sur certaines parties du corps ou les poses suggestives sont réservées aux 18 ans et plus.', 'Nudity is prohibited. Images focused on certain body parts or suggestive poses are restricted to 18 plus.']],
      [['Produits illégaux dans ton pays', 'Products illegal in your country'], ['Interdits, même s’ils sont autorisés ailleurs.', 'Prohibited, even if allowed elsewhere.']],
    ]),
    h3('La page de destination', 'The landing page'),
    list([
      ['La page de destination fait partie de l’examen. Elle doit fonctionner, s’ouvrir sur téléphone et correspondre au produit et à l’offre de la pub.', 'The landing page is part of the review. It must work, open on a phone and match the product and offer in the ad.'],
      ['Même prix, même offre, mêmes frais de livraison que dans la pub. Si la pub dit « livraison gratuite », la page aussi.', 'Same price, same offer, same delivery fees as in the ad. If the ad says "free delivery", so does the page.'],
      ['Ne montre jamais une page différente au robot de Meta et aux clients : cacher la vraie destination à l’examen est une façon de contourner le système, sanctionnée.', 'Never show Meta’s reviewer a different page from the one customers see: hiding the real destination from review is a way of circumventing the system, and it gets punished.'],
      ['Affiche un moyen de contact et tes conditions de livraison et d’échange : un client rassuré commande et confirme plus facilement.', 'Show a contact method and your delivery and exchange terms: a reassured customer orders and confirms more easily.'],
    ]),
    h3('Contrefaçons et noms de marque', 'Counterfeits and brand names'),
    p(
      'Meta interdit les pubs pour des contrefaçons, copies ou répliques des produits d’une autre entreprise, et celles qui risquent de faire croire à un lien avec une marque. Pas de « type Nike », pas de logo copié, pas de photos officielles d’une marque sur un produit générique. Une pub peut être refusée après le signalement du titulaire de la marque. Si tu revends un vrai produit de marque, garde tes factures d’achat.',
      'Meta prohibits ads for counterfeits, knockoffs or replicas of another company’s products, and ads likely to make people think there is a link with a brand. No "Nike style", no copied logo, no official brand photos on a generic product. An ad can be rejected after the brand owner reports it. If you resell a genuine branded product, keep your purchase invoices.',
    ),
    h3('Protéger ton compte publicitaire', 'Protecting your ad account'),
    p(
      'Meta peut restreindre un compte publicitaire, une page ou un portefeuille business en cas de violations graves ou répétées, de tentative de contourner l’examen, d’utilisation de comptes non authentiques, ou de liens avec des comptes déjà sanctionnés. Voici les gestes qui réduisent le risque.',
      'Meta can restrict an ad account, a page or a business portfolio for serious or repeated violations, attempts to circumvent review, use of inauthentic accounts, or links to accounts already sanctioned. Here are the habits that lower the risk.',
    ),
    list([
      ['Utilise ton vrai profil Facebook, ancien et actif, pas un faux compte créé pour la pub.', 'Use your real Facebook profile, old and active, not a fake account created for ads.'],
      ['Active la double authentification sur ton profil et exige-la dans ton portefeuille business. Meta indique qu’elle est obligatoire pour les portefeuilles business de 90 jours et plus.', 'Turn on two factor authentication on your profile and require it in your business portfolio. Meta says it is mandatory for business portfolios that are 90 days old or more.'],
      ['Fais vérifier ton entreprise dans Meta Business Suite si tu as les documents (registre de commerce, par exemple). Ce n’est pas toujours obligatoire, mais cela renforce la confiance et débloque certaines fonctions.', 'Get your business verified in Meta Business Suite if you have the documents (business registration, for example). It is not always required, but it builds trust and unlocks some features.'],
      ['Garde un moyen de paiement stable, à ton nom. Changer de carte sans arrêt ou utiliser la carte de quelqu’un d’autre ressemble à une activité suspecte.', 'Keep a stable payment method in your name. Constantly switching cards or using someone else’s card looks like suspicious activity.'],
      ['Commence doucement avec un nouveau compte : quelques jours avec un petit budget et une pub conforme, plutôt qu’un gros budget dès la première heure. Meta ne publie pas de règle de « chauffe », mais un démarrage progressif limite les surprises.', 'Start gently with a new account: a few days with a small budget and a compliant ad, rather than a big budget in the first hour. Meta publishes no "warm up" rule, but a gradual start limits surprises.'],
      ['Ne crée jamais un nouveau compte pour contourner un compte bloqué : Meta considère cela comme une tentative de contournement, ce qui aggrave la sanction.', 'Never create a new account to get around a blocked one: Meta treats it as an attempt to circumvent enforcement, which makes things worse.'],
      ['Réponds aux commentaires et livre ce que tu promets : les retours négatifs des clients comptent aussi.', 'Reply to comments and deliver what you promise: negative customer feedback counts too.'],
    ]),
    h3('Si ta pub ou ton compte est bloqué : faire appel', 'If your ad or account gets blocked: appealing'),
    list([
      ['Pub refusée : lis la raison dans l’Espace d’assistance Meta Business (Business Support Home). Corrige la pub ou crée-en une nouvelle conforme. Si tu penses que c’est une erreur, demande un nouvel examen.', 'Ad rejected: read the reason in Business Support Home. Fix the ad or create a new compliant one. If you think it is a mistake, request another review.'],
      ['Compte restreint : depuis l’Espace d’assistance ou la Qualité du compte, ouvre le compte concerné et clique sur Demander un examen si l’option apparaît. Il faut être administrateur.', 'Account restricted: from Business Support Home or Account Quality, open the affected account and click Request review if the option appears. You need to be an admin.'],
      ['Meta indique qu’un examen prend généralement environ 48 heures, parfois plus. Si aucune violation n’est retenue, le compte est rétabli.', 'Meta says a review usually takes about 48 hours, sometimes longer. If no violation is found, the account is restored.'],
      ['Explique calmement, preuves à l’appui (factures, photos du produit, page corrigée). Pendant l’examen, ne multiplie pas les comptes.', 'Explain calmly, with evidence (invoices, product photos, corrected page). During the review, do not create extra accounts.'],
    ], true),

    /* 8. Changements récents */
    h2('8. Les changements Meta récents qui concernent les petits annonceurs', '8. Recent Meta changes that matter to small advertisers'),
    p(
      'Nous ne listons ici que des changements confirmés par une page officielle de Meta. Les fonctions arrivent souvent progressivement selon les comptes et les pays : si tu ne vois pas encore une option, c’est peut-être normal.',
      'We only list changes confirmed by an official Meta page. Features often roll out gradually depending on accounts and countries: if you do not see an option yet, that may be normal.',
    ),
    table([
      [['Changement', 'Change'], ['Ce que ça change pour toi', 'What it means for you'], ['Où ça s’applique', 'Where it applies']],
      [
        ['Création simplifiée des campagnes de ventes Advantage+ (annoncée par Meta en mai 2025)', 'Streamlined Advantage+ sales campaign creation (announced by Meta in May 2025)'],
        ['Plus de choix au départ entre campagne manuelle et Advantage+ shopping : une campagne Ventes devient Advantage+ quand budget, audience et placements Advantage+ sont actifs. Côté API, Meta a annoncé la fin de la création des anciennes campagnes Advantage+ shopping à partir de la version 25.0 (premier trimestre 2026).', 'No more upfront choice between manual and Advantage+ shopping: a Sales campaign becomes Advantage+ when Advantage+ budget, audience and placements are on. On the API side, Meta announced that the old Advantage+ shopping campaigns can no longer be created from version 25.0 (first quarter of 2026).'],
        ['Déploiement progressif, tous pays', 'Gradual rollout, all countries'],
      ],
      [
        ['Audience Advantage+ appliquée par défaut sur les nouvelles campagnes quand elle est disponible', 'Advantage+ audience applied by default on new campaigns when available'],
        ['Tes choix d’audience servent de suggestions. Tu gardes des limites fixes comme le lieu, l’âge minimum, la langue et les exclusions d’audiences personnalisées : utilise-les pour rester dans tes zones de livraison.', 'Your audience choices act as suggestions. You keep fixed limits such as location, minimum age, language and custom audience exclusions: use them to stay within your delivery areas.'],
        ['Selon les comptes et les objectifs', 'Depending on accounts and objectives'],
      ],
      [
        ['Restrictions sur les audiences personnalisées sensibles (depuis le 2 septembre 2025)', 'Restrictions on sensitive custom audiences (since September 2, 2025)'],
        ['Une audience personnalisée ou similaire qui suggère un état de santé (« arthrose », « diabète ») ou une situation financière (« score de crédit », « hauts revenus ») peut être signalée et bloquée pour la diffusion. Nomme tes audiences de façon neutre.', 'A custom or lookalike audience that suggests a health condition ("arthritis", "diabetes") or financial status ("credit score", "high income") can be flagged and blocked from running ads. Name your audiences neutrally.'],
        ['Tous pays', 'All countries'],
      ],
      [
        ['Filtrage des données de santé sensibles envoyées par les outils business', 'Filtering of sensitive health data sent through business tools'],
        ['Meta filtre les données de santé qu’il juge sensibles pour qu’elles ne servent pas à l’optimisation. Si tu vends des produits liés à la santé, l’optimisation sur tes événements peut être limitée : ne mets pas de termes de santé dans tes événements et URL.', 'Meta filters health data it considers sensitive so it is not used for optimization. If you sell health related products, optimization on your events may be limited: keep health terms out of your events and URLs.'],
        ['Tous pays', 'All countries'],
      ],
      [
        ['Pubs dans les Statuts WhatsApp (annoncées en juin 2025)', 'Ads in WhatsApp Status (announced in June 2025)'],
        ['Meta a annoncé des pubs dans l’onglet Actus de WhatsApp, entre les statuts, avec la possibilité d’ouvrir une discussion avec l’entreprise. Pour un vendeur COD, c’est une porte d’entrée naturelle vers ton WhatsApp.', 'Meta announced ads in WhatsApp’s Updates tab, between statuses, with the option to start a chat with the business. For a cash on delivery seller, it is a natural door into your WhatsApp.'],
        ['Déploiement progressif sur plusieurs mois : pas forcément disponible dans ton pays', 'Gradual rollout over several months: not necessarily available in your country'],
      ],
      [
        ['Fin des fenêtres d’attribution « 7 jours après vue » et « 28 jours après vue » dans l’API Ads Insights (depuis le 12 janvier 2026)', 'End of the "7 day view" and "28 day view" attribution windows in the Ads Insights API (since January 12, 2026)'],
        ['Si tu utilises un outil de reporting externe branché sur l’API, tes anciens chiffres ne se comparent plus directement aux nouveaux. Une raison de plus pour juger sur tes commandes livrées réelles.', 'If you use an external reporting tool connected to the API, your old numbers no longer compare directly with new ones. One more reason to judge on your real delivered orders.'],
        ['Tous pays (API)', 'All countries (API)'],
      ],
      [
        ['Double authentification exigée pour les portefeuilles business de 90 jours et plus', 'Two factor authentication required for business portfolios 90 days or older'],
        ['Active-la dès maintenant pour toi et pour toute personne qui a accès à ton portefeuille (closer, monteur vidéo, agence).', 'Turn it on now for yourself and for anyone with access to your portfolio (closer, video editor, agency).'],
        ['Tous pays', 'All countries'],
      ],
    ]),

    /* 9. Plan 30 jours */
    h2('9. Ton plan d’action sur 30 jours', '9. Your 30 day action plan'),
    table([
      [['Période', 'Period'], ['Objectif', 'Goal'], ['Actions', 'Actions']],
      [['Jours 1 à 3', 'Days 1 to 3'], ['Mettre en place', 'Set up'], ['Crée ta boutique, ton portefeuille business, active la double authentification, installe pixel et API Conversions, vérifie les événements.', 'Create your store and business portfolio, turn on two factor authentication, install pixel and Conversions API, check events.']],
      [['Jours 4 à 7', 'Days 4 to 7'], ['Chercher', 'Search'], ['Routine quotidienne de recherche, 20 idées notées, 3 retenues après le score et le calcul de marge.', 'Daily research routine, 20 ideas noted, 3 kept after scoring and margin math.']],
      [['Jours 8 à 10', 'Days 8 to 10'], ['Préparer le premier produit', 'Prepare the first product'], ['Échantillon en main, offre et pack, page de vente, 3 à 5 vidéos avec des accroches différentes, script d’appel pour le closer.', 'Sample in hand, offer and bundle, sales page, 3 to 5 videos with different hooks, call script for the closer.']],
      [['Jours 11 à 14', 'Days 11 to 14'], ['Tester', 'Test'], ['Campagne Ventes, budget de test fixé, appels de confirmation dans l’heure, suivi quotidien du coût par commande livrée.', 'Sales campaign, fixed test budget, confirmation calls within the hour, daily tracking of cost per delivered order.']],
      [['Jours 15 à 17', 'Days 15 to 17'], ['Décider', 'Decide'], ['Garder, corriger (vidéo, offre, page) ou arrêter. Si tu arrêtes, lance le deuxième produit retenu.', 'Keep, fix (video, offer, page) or stop. If you stop, launch the second shortlisted product.']],
      [['Jours 18 à 24', 'Days 18 to 24'], ['Améliorer', 'Improve'], ['Nouvelles accroches sur le produit qui marche, test d’un pack, relance des clients livrés pour un avis.', 'New hooks on the product that works, test a bundle, follow up with delivered customers for a review.']],
      [['Jours 25 à 30', 'Days 25 to 30'], ['Augmenter avec prudence', 'Scale carefully'], ['Budget augmenté par paliers si le coût par commande livrée reste sous la cible, stock et livreurs prévus pour suivre.', 'Budget raised in steps if cost per delivered order stays under target, stock and couriers planned to keep up.']],
    ]),
    tip(
      'Un produit à la fois au début',
      'One product at a time at first',
      'Avec un petit budget, tester cinq produits en même temps divise ton argent et ton attention. Teste un produit, décide, puis passe au suivant. Tu apprendras plus vite.',
      'With a small budget, testing five products at once splits your money and attention. Test one product, decide, then move to the next. You will learn faster.',
    ),
    cta(
      'Lance ta boutique COD gratuitement',
      'Launch your cash on delivery store for free',
      'Crée ta boutique Zuri en quelques minutes : paiement à la livraison, Mobile Money, pixel Facebook et API Conversions intégrés, suivi des confirmations et des livraisons. 0 % de commission.',
      'Create your Zuri store in minutes: cash on delivery, Mobile Money, built in Facebook pixel and Conversions API, confirmation and delivery tracking. 0% commission.',
    ),

    /* 10. Checklist */
    h2('10. La checklist avant de lancer ta pub', '10. The checklist before launching your ad'),
    p(
      'Coche chaque point avant de cliquer sur Publier. Ta progression est gardée dans ton navigateur.',
      'Tick every item before you click Publish. Your progress is saved in your browser.',
    ),
    checklist([
      ['Le produit a passé le score et le calcul de marge sur 100 commandes.', 'The product passed the score and the margin math on 100 orders.'],
      ['J’ai écrit mon budget de test, mon coût par commande cible et mon seuil d’arrêt.', 'I wrote down my test budget, target cost per order and stop threshold.'],
      ['Le produit n’est ni une arme, ni un médicament, ni un produit pour adultes, ni une contrefaçon.', 'The product is not a weapon, a medicine, an adult product or a counterfeit.'],
      ['Mes textes ne disent pas « Tu as… ? » à propos de la santé, de l’âge, de la religion ou de l’argent.', 'My copy does not say "Do you have…?" about health, age, religion or money.'],
      ['Pas d’avant et après pour la minceur, pas de promesse de guérison, pas de corps « parfait ».', 'No before and after for weight loss, no cure promise, no "perfect" body.'],
      ['Ciblage 18 ans et plus si le produit touche à la minceur, aux compléments ou à l’esthétique.', '18 plus targeting if the product involves weight loss, supplements or cosmetic procedures.'],
      ['Les vidéos montrent le vrai produit, avec mes propres images et des sous-titres.', 'Videos show the real product, with my own footage and captions.'],
      ['Même prix, même offre et mêmes frais dans la pub et sur la page.', 'Same price, offer and fees in the ad and on the page.'],
      ['La page s’ouvre vite sur téléphone, le formulaire est court, le WhatsApp est visible.', 'The page opens fast on a phone, the form is short, WhatsApp is visible.'],
      ['Aucun faux avis, aucun faux compte à rebours.', 'No fake reviews, no fake countdown.'],
      ['Pixel et API Conversions vérifiés avec l’outil de test d’événements, sans doublon.', 'Pixel and Conversions API checked with the test events tool, no duplicates.'],
      ['Aucun terme de santé dans les noms d’événements, d’URL ou d’audiences.', 'No health terms in event, URL or audience names.'],
      ['La zone de diffusion correspond à mes zones de livraison.', 'The delivery area of the ads matches my delivery areas.'],
      ['Double authentification active, moyen de paiement à mon nom.', 'Two factor authentication on, payment method in my name.'],
      ['Un closer est prêt à appeler chaque commande dans l’heure, et le stock est disponible.', 'A closer is ready to call every order within the hour, and stock is available.'],
    ]),
  ],
  faqs: [
    faq(
      'Combien faut-il pour tester un produit avec la pub Facebook ?',
      'How much do I need to test a product with Facebook ads?',
      'Il n’y a pas de montant officiel. Fixe un budget que tu acceptes de perdre, à partir de ta marge. Exemple : 5 000 FCFA par jour pendant 4 jours. Décide à l’avance de ton seuil d’arrêt, par exemple deux à trois fois ton coût par commande cible sans aucune commande.',
      'There is no official amount. Set a budget you accept to lose, based on your margin. Example: 5,000 FCFA a day for 4 days. Decide your stop threshold in advance, for example two to three times your target cost per order with no orders at all.',
    ),
    faq(
      'Faut-il encore faire du ciblage par centres d’intérêt en 2026 ?',
      'Should I still use interest targeting in 2026?',
      'Meta pousse l’audience Advantage+, où tes choix servent de suggestions. Pour un vendeur COD, le plus important est de limiter la diffusion à tes zones de livraison et de soigner tes vidéos, qui font l’essentiel du ciblage. Tu peux tester des centres d’intérêt, mais juge toujours sur le coût par commande livrée.',
      'Meta pushes Advantage+ audience, where your choices act as suggestions. For a cash on delivery seller, the most important thing is to limit delivery to your delivery areas and to make strong videos, which do most of the targeting. You can test interests, but always judge on cost per delivered order.',
    ),
    faq(
      'Pourquoi ma pub pour un produit minceur a été refusée ?',
      'Why was my weight loss product ad rejected?',
      'Les causes les plus fréquentes selon les règles Meta : un avant et après côte à côte, une phrase qui fait se sentir mal dans son corps, une promesse de résultat rapide sans nuance, ou un ciblage qui n’est pas limité aux 18 ans et plus. Corrige ces points, puis demande un nouvel examen si tu penses que le refus est une erreur.',
      'The most common causes under Meta’s rules: a side by side before and after, copy that makes people feel bad about their body, a fast result promise with no qualifier, or targeting not limited to people 18 and over. Fix these, then request another review if you think the rejection was a mistake.',
    ),
    faq(
      'Mon compte publicitaire est restreint, que faire ?',
      'My ad account is restricted, what should I do?',
      'Va dans l’Espace d’assistance Meta Business ou la Qualité du compte, lis la raison, et clique sur Demander un examen si l’option apparaît (il faut être administrateur). Meta indique qu’un examen prend généralement environ 48 heures. Ne crée pas de nouveau compte pour contourner la restriction.',
      'Go to Business Support Home or Account Quality, read the reason, and click Request review if the option appears (you need to be an admin). Meta says a review usually takes about 48 hours. Do not create a new account to get around the restriction.',
    ),
    faq(
      'Est-ce que je peux vendre un produit « type marque » en COD avec la pub Facebook ?',
      'Can I sell a "brand style" product with cash on delivery using Facebook ads?',
      'Non, si le produit copie le nom, le logo ou les signes distinctifs d’une marque, ou si la pub laisse croire à un lien avec elle : Meta interdit les contrefaçons et répliques. Vends un produit générique sous ton propre nom, avec tes propres photos.',
      'No, if the product copies a brand’s name, logo or distinctive features, or if the ad suggests a link with it: Meta prohibits counterfeits and replicas. Sell a generic product under your own name, with your own photos.',
    ),
    faq(
      'Le pixel suffit-il, ou faut-il aussi l’API Conversions ?',
      'Is the pixel enough, or do I also need the Conversions API?',
      'Meta recommande d’utiliser les deux, avec déduplication. L’API Conversions envoie les événements depuis le serveur, ce qui rend le suivi plus fiable quand le navigateur bloque ou perd le signal. Sur Zuri, les deux sont intégrés.',
      'Meta recommends using both, with deduplication. The Conversions API sends events from the server, which makes tracking more reliable when the browser blocks or loses the signal. On Zuri, both are built in.',
    ),
  ],
  sources: [
    S.adStandards,
    S.personalAttributes,
    S.healthWellness,
    S.personalHealth,
    S.drugs,
    S.weapons,
    S.adult,
    S.commercial,
    S.trademarks,
    S.reviewPolicy,
    S.inReview,
    S.restrictions,
    S.disabled,
    S.enforcement,
    S.verification,
    S.twoFactor,
    S.securityCenter,
    S.sensitiveHealth,
    S.advSales,
    S.advAudience,
    S.advBlog,
    S.customAudiences,
    S.attribution,
    S.whatsappAds,
    S.learning,
    S.learningLimited,
    S.pixel,
    S.capi,
    S.dedup,
    S.adLibrary,
    S.ttCreative,
  ],
  related: ['trouver-produit-gagnant', 'publicite-facebook-paiement-livraison', 'pixel-facebook-api-conversions'],
}
