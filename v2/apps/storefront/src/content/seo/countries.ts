import type { CountryPage } from './types'

export const COUNTRIES: CountryPage[] = [
  {
    slug: 'cote-d-ivoire',
    iso: 'CI',
    name: { fr: 'Côte d’Ivoire', en: 'Côte d’Ivoire' },
    inName: 'en Côte d’Ivoire',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo'],
    mobileMoney: ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave'],
    zuriPsps: ['FeexPay', 'FedaPay', 'PayDunya', 'PawaPay'],
    title: {
      fr: 'Vendre en ligne en Côte d’Ivoire : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Côte d’Ivoire: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Côte d’Ivoire : boutique en ligne gratuite, paiement à la livraison, Wave et Orange Money, closers et livraison à Abidjan.',
      en: 'Sell online in Côte d’Ivoire: free online store, cash on delivery, Wave and Orange Money, closers and delivery zones across Abidjan.',
    },
    h1: {
      fr: 'Vendre en ligne en Côte d’Ivoire, d’Abidjan à Korhogo',
      en: 'Sell online in Côte d’Ivoire, from Abidjan to Korhogo',
    },
    intro: {
      fr: 'En Côte d’Ivoire, la vente en ligne se joue sur Facebook, TikTok et WhatsApp, et le client veut payer quand il voit le colis. Avec Zuri, tu montes une boutique légère, tu reçois des commandes en paiement à la livraison et tu encaisses aussi par Wave, Orange Money, MTN ou Moov via ton propre compte de paiement.',
      en: 'In Côte d’Ivoire, online selling happens on Facebook, TikTok and WhatsApp, and buyers want to pay when they see the parcel. Zuri gives you a light store, cash on delivery orders, and Wave, Orange Money, MTN or Moov payments through your own payment account.',
    },
    market: [
      {
        fr: 'Abidjan concentre l’essentiel des commandes en ligne : Cocody, Yopougon, Abobo, Marcory, Koumassi ou Treichville n’ont pas les mêmes délais ni les mêmes frais de livraison. Beaucoup de vendeurs font le gros de leur chiffre à Abidjan, puis expédient vers Bouaké, Yamoussoukro ou San-Pédro par car ou par un transporteur, souvent avec un acompte.',
        en: 'Abidjan carries most online orders, and districts like Cocody, Yopougon, Abobo, Marcory or Treichville each have their own delivery times and fees. Many sellers make most of their sales in Abidjan, then ship to Bouaké, Yamoussoukro or San-Pédro by bus or courier, often asking for a deposit first.',
      },
      {
        fr: 'Le paiement à la livraison reste la norme pour un premier achat : le client ne te connaît pas et préfère payer le livreur. Mais Wave a changé les habitudes. Beaucoup de clients sont à l’aise pour payer par Wave ou Orange Money au moment de la livraison, voire avant pour un client déjà fidèle. MTN MoMo et Moov Money restent utiles selon les quartiers et les villes de l’intérieur.',
        en: 'Cash on delivery is still the default for a first purchase: the buyer does not know you yet and prefers to pay the rider. Wave changed habits, though. Plenty of customers happily pay with Wave or Orange Money at the door, or even upfront once they trust you. MTN MoMo and Moov Money still matter depending on the area.',
      },
      {
        fr: 'La livraison se fait surtout à moto, avec des livreurs indépendants ou des sociétés de livraison locales qui facturent par commune. Le vrai risque, ce sont les colis refusés et les clients injoignables : un client qui a commandé sur un coup de tête ne décroche plus quand le livreur arrive. C’est pour ça que la confirmation par téléphone ou WhatsApp avant d’expédier est indispensable.',
        en: 'Delivery mostly runs on motorbikes, through independent riders or local delivery companies that charge per district. The real risk is refused parcels and unreachable customers: someone who ordered on impulse stops picking up when the rider arrives. That is why confirming each order by phone or WhatsApp before shipping is essential.',
      },
      {
        fr: 'Côté pub, Facebook et Instagram restent la base, et TikTok monte vite chez les jeunes Abidjanais. Les vidéos tournées en nouchi ou avec un ton local, une démonstration du produit et un prix clair convertissent mieux qu’une image de catalogue. Les périodes fortes : Noël et les fêtes de fin d’année, la rentrée de septembre, le Ramadan et la Tabaski, le Black Friday, et la fête de l’Indépendance le 7 août.',
        en: 'For ads, Facebook and Instagram are the base, and TikTok is growing fast with young people in Abidjan. Videos with a local tone, a real product demo and a clear price beat catalog pictures. Peak periods include Christmas and year end, back to school in September, Ramadan and Tabaski, Black Friday, and Independence Day on 7 August.',
      },
    ],
    tips: [
      {
        fr: 'Découpe Abidjan en zones de livraison dans Zuri (Cocody, Yopougon, Abobo, Plateau, Port-Bouët…) avec un frais différent par zone, et une zone « intérieur du pays » avec acompte. Le client voit le vrai prix avant de valider, tu évites les disputes au moment de la livraison.',
        en: 'Split Abidjan into delivery zones in Zuri (Cocody, Yopougon, Abobo, Plateau, Port-Bouët and so on) with a fee per zone, plus an “inland cities” zone with a deposit. Buyers see the real price before ordering, so there is no argument at the door.',
      },
      {
        fr: 'Appelle chaque nouvelle commande dans l’heure. Mets tes closers dans Zuri : les commandes leur sont attribuées automatiquement, et chacun passe le statut en confirmée ou injoignable. Un client rappelé vite refuse beaucoup moins le colis.',
        en: 'Call every new order within the hour. Add your closers in Zuri: orders are assigned to them automatically, and each one marks the order as confirmed or unreachable. A buyer called back quickly refuses the parcel far less often.',
      },
      {
        fr: 'Propose Wave en plus du paiement à la livraison. Avec ton compte FeexPay, FedaPay, PayDunya ou PawaPay branché sur Zuri, le client peut payer en ligne, et l’argent arrive sur ton compte chez le prestataire, jamais chez Zuri.',
        en: 'Offer Wave next to cash on delivery. With your FeexPay, FedaPay, PayDunya or PawaPay account connected to Zuri, buyers can pay online, and the money lands in your account with that provider, never with Zuri.',
      },
      {
        fr: 'Fais des packs : « 1 pièce, 2 pièces, 3 pièces » avec un prix dégressif. À Abidjan, l’offre par quantité aide à absorber le coût de livraison et augmente le panier moyen sans baisser ta marge unitaire.',
        en: 'Build bundles: “1 piece, 2 pieces, 3 pieces” with a lower unit price. In Abidjan, quantity offers help cover the delivery fee and raise the average order without cutting your margin per unit.',
      },
      {
        fr: 'Installe ton pixel Facebook avec l’API Conversions et ton pixel TikTok dans Zuri. Sans données de conversion, tes pubs optimisent sur les clics, pas sur les commandes.',
        en: 'Set up your Facebook pixel with the Conversions API and your TikTok pixel in Zuri. Without conversion data, your ads optimize for clicks, not for orders.',
      },
      {
        fr: 'Tourne tes vidéos sur place, avec le produit en main et une phrase en français de tous les jours. Une vidéo verticale de 20 à 30 secondes qui montre le produit marcher vaut mieux qu’un montage trop propre.',
        en: 'Shoot your videos locally, product in hand, with everyday French. A short vertical clip that shows the product working beats an overly polished edit.',
      },
      {
        fr: 'Suis ton taux de livraison, pas seulement tes commandes. Dans Zuri, regarde le chiffre encaissé et le taux de retour par zone : si une commune renvoie trop de colis, demande un acompte Wave pour cette zone.',
        en: 'Track your delivery rate, not just your orders. In Zuri, check cash collected and return rate per zone: if one district sends back too many parcels, ask for a Wave deposit there.',
      },
    ],
    productIdeas: [
      { fr: 'Soins de la peau et du cheveu : sérums, huiles, beurres naturels, souvent demandés sur TikTok (évite les produits éclaircissants douteux).', en: 'Skin and hair care: serums, oils, natural butters, often requested on TikTok (stay away from dubious skin lightening products).' },
      { fr: 'Petit électroménager de cuisine : blenders, friteuses sans huile, machines à jus, appréciés pour les démonstrations vidéo.', en: 'Small kitchen appliances: blenders, air fryers, juicers, which work well in video demos.' },
      { fr: 'Accessoires téléphone : écouteurs sans fil, chargeurs rapides, power banks, utiles avec les coupures de courant.', en: 'Phone accessories: wireless earbuds, fast chargers, power banks, handy during power cuts.' },
      { fr: 'Mode et pagnes modernes, perruques et mèches, très recherchés avant les fêtes et les mariages.', en: 'Fashion, modern wax prints, wigs and hair extensions, popular before holidays and weddings.' },
      { fr: 'Articles pour bébé et maman : porte-bébés, biberons, petits jouets éducatifs.', en: 'Baby and mother products: baby carriers, bottles, small educational toys.' },
      { fr: 'Fournitures et sacs de rentrée, à préparer dès août.', en: 'School bags and supplies, to prepare from August.' },
      { fr: 'Produits de bien-être et de sport à domicile : ceintures, tapis, petits appareils de massage.', en: 'Home wellness and fitness items: waist trainers, mats, small massage devices.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Côte d’Ivoire ?', en: 'How do I sell online in Côte d’Ivoire?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute ton produit (tu peux l’importer par URL avec l’IA), règle tes zones de livraison à Abidjan et dans les villes de l’intérieur, puis lance une pub Facebook ou TikTok vers ta page de vente. Les commandes arrivent en paiement à la livraison, ton équipe les confirme, et tu suis tout jusqu’à la livraison.',
          en: 'Create your Zuri store, add your product (you can import it from a URL with AI), set delivery zones in Abidjan and inland cities, then run a Facebook or TikTok ad to your sales page. Orders come in as cash on delivery, your team confirms them, and you track everything until delivery.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Côte d’Ivoire ?', en: 'What product should I sell online in Côte d’Ivoire?' },
        a: {
          fr: 'Cherche un produit qui règle un problème visible et qui se montre bien en vidéo : beauté, cuisine, accessoires téléphone, mode. Teste avec un petit budget pub, regarde le taux de confirmation et de livraison, et garde uniquement les produits gagnants qui laissent une marge après livraison et retours.',
          en: 'Look for a product that solves a visible problem and shows well on video: beauty, kitchen, phone accessories, fashion. Test with a small ad budget, check confirmation and delivery rates, and keep only winning products that leave a margin after delivery and returns.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money en Côte d’Ivoire ?', en: 'How do I accept Mobile Money in Côte d’Ivoire?' },
        a: {
          fr: 'Ouvre un compte chez FeexPay, FedaPay, PayDunya ou PawaPay, qui couvrent la Côte d’Ivoire, puis connecte-le dans Zuri. Tes clients paient par Wave, Orange Money, MTN MoMo ou Moov Money selon ce que propose ton prestataire, et l’argent va directement sur ton compte.',
          en: 'Open an account with FeexPay, FedaPay, PayDunya or PawaPay, which all cover Côte d’Ivoire, then connect it in Zuri. Buyers pay with Wave, Orange Money, MTN MoMo or Moov Money depending on your provider, and the money goes straight to your account.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Côte d’Ivoire ?', en: 'Is there a free online store builder in Côte d’Ivoire?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert et 0 % de commission sur tes ventes. Tu paies seulement les frais de ton prestataire de paiement si tu encaisses en ligne, et tes frais de pub et de livraison.',
          en: 'Zuri is free during launch, with a free subdomain and 0% commission on your sales. You only pay your payment provider’s fees if you collect online, plus your own ad and delivery costs.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Côte d’Ivoire ?', en: 'How do I do dropshipping in Côte d’Ivoire?' },
        a: {
          fr: 'Le dropshipping qui marche ici est surtout du dropshipping local : un fournisseur à Abidjan ou un stock déjà dédouané, livré en 24 à 48 heures en paiement à la livraison. Attendre plusieurs semaines un colis venu de Chine fait exploser les refus. Commence avec un petit stock, confirme chaque commande et fais livrer vite.',
          en: 'The dropshipping that works here is mostly local: a supplier in Abidjan or stock already cleared through customs, delivered within a day or two with cash on delivery. Making buyers wait weeks for a parcel from China drives refusals up. Start with small stock, confirm every order and deliver fast.',
        },
      },
    ],
    sources: [
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'senegal',
    iso: 'SN',
    name: { fr: 'Sénégal', en: 'Senegal' },
    inName: 'au Sénégal',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Dakar', 'Thiès', 'Touba', 'Saint-Louis', 'Mbour', 'Ziguinchor'],
    mobileMoney: ['Wave', 'Orange Money', 'Free Money (Mixx by Yas)'],
    zuriPsps: ['FeexPay', 'FedaPay', 'PayDunya', 'PawaPay'],
    title: {
      fr: 'Vendre en ligne au Sénégal : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Senegal: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Sénégal : boutique en ligne gratuite, paiement à la livraison ou Wave, dropshipping local et livraison à Dakar et en régions.',
      en: 'Sell online in Senegal: free online store, cash on delivery or Wave, local dropshipping and delivery in Dakar and the regions.',
    },
    h1: {
      fr: 'Vendre en ligne au Sénégal, avec Wave et le paiement à la livraison',
      en: 'Sell online in Senegal with Wave and cash on delivery',
    },
    intro: {
      fr: 'Au Sénégal, Wave est dans presque toutes les poches et WhatsApp sert de vitrine à des milliers de vendeurs. Zuri te donne une vraie page de vente rapide, un formulaire de commande en paiement à la livraison et l’encaissement Wave, Orange Money ou Free Money via ton propre compte de paiement.',
      en: 'In Senegal, Wave is in almost every pocket and WhatsApp works as a shop window for thousands of sellers. Zuri gives you a fast sales page, a cash on delivery order form, and Wave, Orange Money or Free Money payments through your own payment account.',
    },
    market: [
      {
        fr: 'Dakar et sa banlieue (Pikine, Guédiawaye, Rufisque, Keur Massar) font l’essentiel du volume. Les livreurs à moto, les « Jakarta », traversent la ville rapidement, mais les embouteillages et l’étalement de la banlieue font varier le délai et le prix. Pour Thiès, Mbour, Touba ou Saint-Louis, les vendeurs passent souvent par un transporteur ou un car, avec un paiement d’avance ou un acompte.',
        en: 'Dakar and its suburbs (Pikine, Guédiawaye, Rufisque, Keur Massar) make up most of the volume. Motorbike riders cross the city quickly, but traffic and the spread of the suburbs change delivery time and price. For Thiès, Mbour, Touba or Saint-Louis, sellers often use a courier or bus, with prepayment or a deposit.',
      },
      {
        fr: 'Le grand atout du Sénégal, c’est Wave. Les clients ont l’habitude d’envoyer de l’argent en quelques secondes, ce qui rend le paiement avant livraison beaucoup plus facile qu’ailleurs dès que la confiance est là. Orange Money reste très utilisé, et Free Money (devenu Mixx by Yas) complète le paysage. Pour un premier achat, le paiement à la livraison rassure toujours.',
        en: 'Senegal’s big advantage is Wave. Customers are used to sending money in seconds, so paying before delivery is much easier than elsewhere once trust exists. Orange Money is still widely used, and Free Money (now Mixx by Yas) completes the picture. For a first purchase, cash on delivery still reassures people.',
      },
      {
        fr: 'Beaucoup de ventes se font encore en statut WhatsApp, en direct sur TikTok et sur des pages Facebook. Le problème : tout se gère à la main, les commandes se perdent dans les conversations et personne ne sait combien de colis ont vraiment été livrés. Une boutique avec suivi des statuts change la donne dès que tu dépasses quelques commandes par jour.',
        en: 'Many sales still happen through WhatsApp status, TikTok lives and Facebook pages. The issue: everything is manual, orders get lost in chats, and nobody knows how many parcels were actually delivered. A store with order status tracking makes a real difference once you pass a few orders a day.',
      },
      {
        fr: 'Le calendrier commercial est rythmé par la Tabaski, la Korité (fin du Ramadan), le Magal de Touba, la rentrée d’octobre, Noël et le Black Friday. Avant la Tabaski et la Korité, la demande en habits, chaussures, parfums, encens et accessoires explose : prépare ton stock et tes livreurs plusieurs semaines à l’avance.',
        en: 'The selling calendar follows Tabaski, Korité (end of Ramadan), the Magal of Touba, the October school start, Christmas and Black Friday. Before Tabaski and Korité, demand for clothes, shoes, perfumes, incense and accessories surges: get your stock and riders ready weeks in advance.',
      },
    ],
    tips: [
      {
        fr: 'Mets Wave en avant. Connecte ton compte FeexPay, FedaPay, PayDunya ou PawaPay dans Zuri pour proposer le paiement Mobile Money, et garde le paiement à la livraison pour les nouveaux clients.',
        en: 'Put Wave front and center. Connect your FeexPay, FedaPay, PayDunya or PawaPay account in Zuri to offer Mobile Money, and keep cash on delivery for new customers.',
      },
      {
        fr: 'Crée une zone « Dakar centre », une zone « banlieue » et une zone « régions » avec des frais différents. Pour les régions, demande un acompte Wave avant d’envoyer par car.',
        en: 'Create a “central Dakar” zone, a “suburbs” zone and a “regions” zone with different fees. For the regions, ask for a Wave deposit before shipping by bus.',
      },
      {
        fr: 'Garde le bouton WhatsApp sur ta page de vente : beaucoup de clients sénégalais veulent poser une question avant de commander. Réponds vite, puis renvoie-les vers le formulaire pour que la commande soit enregistrée.',
        en: 'Keep the WhatsApp button on your sales page: many Senegalese buyers want to ask a question before ordering. Reply fast, then send them back to the form so the order is recorded.',
      },
      {
        fr: 'Prévois tes campagnes Tabaski et Korité tôt, avec un compte à rebours et une offre « stock limité » honnête sur ta page. Les clients achètent en avance pour être livrés à temps.',
        en: 'Plan your Tabaski and Korité campaigns early, with a countdown and an honest “limited stock” offer on your page. Buyers order ahead to be delivered on time.',
      },
      {
        fr: 'Écris tes pubs en français simple et n’hésite pas à glisser du wolof dans tes vidéos. Un ton proche des gens marche mieux qu’un texte trop formel.',
        en: 'Write ads in plain French and feel free to mix some Wolof into your videos. A friendly tone works better than formal copy.',
      },
      {
        fr: 'Active la relance de panier abandonné : un client qui a rempli son numéro sans valider peut être rappelé par ton closer le jour même.',
        en: 'Turn on abandoned cart recovery: a buyer who entered a phone number without confirming can be called back by your closer the same day.',
      },
      {
        fr: 'Suis le taux de livraison par livreur dans Zuri. Si un livreur accumule les colis retournés, le problème vient parfois de lui et pas du client.',
        en: 'Track delivery rate per rider in Zuri. If one rider piles up returned parcels, the problem is sometimes the rider, not the buyer.',
      },
    ],
    productIdeas: [
      { fr: 'Parfums, encens (thiouraye) et brûle-parfums, souvent demandés avant les fêtes religieuses.', en: 'Perfumes, incense (thiouraye) and burners, often requested before religious holidays.' },
      { fr: 'Habits et chaussures pour la Tabaski et la Korité : boubous, ensembles, sandales.', en: 'Clothes and shoes for Tabaski and Korité: boubous, outfits, sandals.' },
      { fr: 'Produits capillaires et perruques, très présents sur TikTok au Sénégal.', en: 'Hair products and wigs, very present on TikTok in Senegal.' },
      { fr: 'Petits appareils de cuisine et de maison : mixeurs, ventilateurs rechargeables pour la saison chaude.', en: 'Small kitchen and home appliances: blenders, rechargeable fans for the hot season.' },
      { fr: 'Accessoires téléphone et gadgets : écouteurs, power banks, supports.', en: 'Phone accessories and gadgets: earbuds, power banks, stands.' },
      { fr: 'Produits digitaux : formations, ebooks, accès à des groupes privés, vendus avec paiement Wave.', en: 'Digital products: courses, ebooks, private group access, sold with Wave payment.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Sénégal ?', en: 'How do I sell online in Senegal?' },
        a: {
          fr: 'Ouvre une boutique Zuri, ajoute tes produits, définis tes zones de livraison (Dakar, banlieue, régions) et partage ta page sur WhatsApp, Facebook et TikTok. Les clients commandent en paiement à la livraison ou paient par Wave, et tu suis chaque commande jusqu’à l’encaissement.',
          en: 'Open a Zuri store, add your products, set delivery zones (Dakar, suburbs, regions) and share your page on WhatsApp, Facebook and TikTok. Buyers order with cash on delivery or pay with Wave, and you track every order until you are paid.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Wave et Orange Money au Sénégal ?', en: 'How do I accept Wave and Orange Money in Senegal?' },
        a: {
          fr: 'FeexPay, FedaPay, PayDunya et PawaPay fonctionnent au Sénégal. Ouvre un compte chez l’un d’eux, connecte-le à Zuri, et tes clients paient par Wave, Orange Money ou Free Money selon les moyens proposés par ton prestataire. Zuri ne touche jamais ton argent.',
          en: 'FeexPay, FedaPay, PayDunya and PawaPay all work in Senegal. Open an account with one of them, connect it to Zuri, and buyers pay with Wave, Orange Money or Free Money depending on your provider. Zuri never holds your money.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Sénégal ?', en: 'How do I do dropshipping in Senegal?' },
        a: {
          fr: 'Travaille avec un fournisseur à Dakar ou garde un petit stock pour livrer vite. Publie ta page de vente, fais confirmer chaque commande par un closer, puis envoie le livreur. Les longs délais d’importation font fuir les clients en paiement à la livraison.',
          en: 'Work with a supplier in Dakar or keep a small stock so you can deliver fast. Publish your sales page, have a closer confirm each order, then send the rider. Long import delays push cash on delivery buyers away.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Sénégal ?', en: 'What product should I sell online in Senegal?' },
        a: {
          fr: 'Regarde ce qui se partage en statut WhatsApp et sur TikTok autour de toi, puis teste. Les parfums, la mode de fête, les produits capillaires et les petits appareils sont souvent demandés, mais seul un test avec un petit budget te dira si ton produit tient la route.',
          en: 'Look at what people share on WhatsApp status and TikTok around you, then test. Perfumes, holiday fashion, hair products and small appliances are often requested, but only a small budget test will tell you if your product works.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Sénégal ?', en: 'Is there a free online store builder in Senegal?' },
        a: {
          fr: 'Oui, Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine offert. Tu peux vendre des produits physiques et digitaux depuis la même boutique.',
          en: 'Yes, Zuri is free during launch, with no commission on your sales and a free subdomain. You can sell physical and digital products from the same store.',
        },
      },
    ],
    sources: [
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'benin',
    iso: 'BJ',
    name: { fr: 'Bénin', en: 'Benin' },
    inName: 'au Bénin',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou', 'Bohicon'],
    mobileMoney: ['MTN MoMo', 'Moov Money', 'Celtiis Cash'],
    zuriPsps: ['FeexPay', 'FedaPay', 'PayDunya', 'PawaPay'],
    title: {
      fr: 'Vendre en ligne au Bénin : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Benin: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Bénin : boutique en ligne gratuite, paiement à la livraison, MTN MoMo et Moov Money, dropshipping local à Cotonou et Calavi.',
      en: 'Sell online in Benin: free online store, cash on delivery, MTN MoMo and Moov Money, local dropshipping in Cotonou and Calavi.',
    },
    h1: {
      fr: 'Vendre en ligne au Bénin, de Cotonou à Parakou',
      en: 'Sell online in Benin, from Cotonou to Parakou',
    },
    intro: {
      fr: 'Au Bénin, MTN MoMo fait partie du quotidien et le zémidjan livre partout à Cotonou. Zuri te permet de vendre avec une page rapide, des commandes en paiement à la livraison et l’encaissement MoMo, Moov ou Celtiis via ton compte chez un prestataire béninois ou régional.',
      en: 'In Benin, MTN MoMo is part of daily life and motorbike taxis deliver all over Cotonou. Zuri lets you sell with a fast page, cash on delivery orders, and MoMo, Moov or Celtiis payments through your own account with a local or regional provider.',
    },
    market: [
      {
        fr: 'Le gros du commerce en ligne se passe dans le triangle Cotonou, Abomey-Calavi, Porto-Novo. Calavi, avec son campus et sa population jeune, est une zone très active pour la mode, les accessoires et les gadgets. Parakou et Bohicon commandent aussi, mais l’envoi passe souvent par une agence de transport, avec un paiement anticipé ou un acompte.',
        en: 'Most online trade happens in the Cotonou, Abomey-Calavi, Porto-Novo triangle. Calavi, with its campus and young population, is a very active zone for fashion, accessories and gadgets. Parakou and Bohicon also order, but shipping usually goes through a transport agency, with prepayment or a deposit.',
      },
      {
        fr: 'MTN MoMo est le réflexe numéro un pour payer, Moov Money suit, et Celtiis Cash s’installe. Les clients béninois sont donc à l’aise pour payer par Mobile Money, mais pour un premier achat auprès d’une page inconnue, beaucoup veulent encore voir le produit avant de payer. Proposer les deux options te fait gagner des commandes.',
        en: 'MTN MoMo is the first reflex for payment, Moov Money follows, and Celtiis Cash is growing. Beninese buyers are comfortable with Mobile Money, but for a first purchase from an unknown page, many still want to see the product before paying. Offering both options wins you more orders.',
      },
      {
        fr: 'Le Bénin a un avantage rare : plusieurs prestataires de paiement y sont nés ou très implantés, comme FedaPay et FeexPay. Ouvrir un compte marchand et encaisser par Mobile Money est donc plus accessible qu’ailleurs. Avec Zuri, tu connectes ce compte et l’argent arrive directement chez toi.',
        en: 'Benin has a rare advantage: several payment providers were born or are well established there, such as FedaPay and FeexPay. Opening a merchant account and collecting Mobile Money is more accessible than in many countries. With Zuri, you connect that account and the money goes straight to you.',
      },
      {
        fr: 'Côté livraison, les zémidjans et les livreurs indépendants assurent l’essentiel, souvent pour un prix fixe par quartier. Dantokpa reste le grand marché de référence : beaucoup de vendeurs en ligne s’y approvisionnent, et les clients comparent tes prix avec ceux du marché. Les fêtes de fin d’année, la rentrée, la Tabaski, le Ramadan, la fête de l’Indépendance du 1er août et le Black Friday sont les moments forts.',
        en: 'For delivery, motorbike taxis and independent riders do most of the work, often at a fixed price per neighborhood. Dantokpa remains the big reference market: many online sellers buy stock there, and buyers compare your prices with market prices. Year end, back to school, Tabaski, Ramadan, Independence Day on 1 August and Black Friday are the strong moments.',
      },
    ],
    tips: [
      {
        fr: 'Ouvre ton compte marchand chez FedaPay, FeexPay, PayDunya ou PawaPay, puis connecte-le à Zuri. Tes clients paient en MTN MoMo ou Moov Money sans quitter ta page.',
        en: 'Open your merchant account with FedaPay, FeexPay, PayDunya or PawaPay, then connect it to Zuri. Buyers pay with MTN MoMo or Moov Money without leaving your page.',
      },
      {
        fr: 'Règle tes frais de livraison par quartier et par ville : Cotonou, Calavi, Porto-Novo, Ouidah, puis une zone « autres villes » avec envoi par agence. Le client sait ce qu’il paie avant de commander.',
        en: 'Set delivery fees per neighborhood and per city: Cotonou, Calavi, Porto-Novo, Ouidah, then an “other cities” zone shipped by agency. Buyers know what they pay before ordering.',
      },
      {
        fr: 'Justifie ton prix face à Dantokpa. Mets en avant la livraison à domicile, la garantie, la qualité ou un pack avantageux, sinon le client ira au marché.',
        en: 'Justify your price against Dantokpa. Highlight home delivery, warranty, quality or a good bundle, otherwise buyers will just go to the market.',
      },
      {
        fr: 'Cible les étudiants de Calavi avec des vidéos TikTok courtes et un prix rond. Les produits utiles et pas chers (accessoires, gadgets, mode) tournent bien dans cette zone.',
        en: 'Target Calavi students with short TikTok videos and a round price. Useful, affordable products (accessories, gadgets, fashion) do well there.',
      },
      {
        fr: 'Confirme chaque commande avant d’envoyer le zém. Dans Zuri, ton closer passe la commande en confirmée ou injoignable, et tu n’envoies le livreur que pour les commandes confirmées.',
        en: 'Confirm each order before sending the rider. In Zuri, your closer marks the order as confirmed or unreachable, and you only dispatch confirmed orders.',
      },
      {
        fr: 'Utilise la popup des ventes réelles et le bouton d’achat collant : sur mobile, le client garde le bouton « Commander » sous le pouce et voit que d’autres achètent.',
        en: 'Use the real sales popup and the sticky buy button: on mobile, the “Order” button stays under the thumb and buyers see that others are buying.',
      },
      {
        fr: 'Écoute le son d’encaissement. Active les notifications Zuri pour savoir tout de suite quand un paiement MoMo arrive ou qu’une commande tombe, et rappelle le client pendant qu’il est encore chaud.',
        en: 'Listen for the cash sound. Turn on Zuri notifications so you know right away when a MoMo payment arrives or a new order comes in, and call the buyer while they are still keen.',
      },
    ],
    productIdeas: [
      { fr: 'Mode homme et femme, chaussures et sacs, souvent demandés à Calavi et Cotonou.', en: 'Men’s and women’s fashion, shoes and bags, often requested in Calavi and Cotonou.' },
      { fr: 'Accessoires téléphone et ordinateur : chargeurs, écouteurs, claviers, utiles pour les étudiants.', en: 'Phone and laptop accessories: chargers, earbuds, keyboards, useful for students.' },
      { fr: 'Cosmétiques et soins naturels, y compris des produits locaux comme le beurre de karité.', en: 'Cosmetics and natural care, including local products like shea butter.' },
      { fr: 'Petit électroménager : ventilateurs rechargeables, blenders, fers à repasser.', en: 'Small appliances: rechargeable fans, blenders, irons.' },
      { fr: 'Articles de maison et de décoration à petit prix.', en: 'Affordable home and decor items.' },
      { fr: 'Produits digitaux et formations, faciles à encaisser par MoMo.', en: 'Digital products and courses, easy to sell with MoMo payment.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Bénin ?', en: 'How do I sell online in Benin?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute ton produit, configure tes zones de livraison à Cotonou et dans les autres villes, puis lance ta pub Facebook ou TikTok. Tu reçois les commandes en paiement à la livraison ou en Mobile Money, ton équipe les confirme, et tu suis tes livraisons.',
          en: 'Create your Zuri store, add your product, set delivery zones in Cotonou and other cities, then run a Facebook or TikTok ad. You receive cash on delivery or Mobile Money orders, your team confirms them, and you track deliveries.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Bénin ?', en: 'How do I accept Mobile Money in Benin?' },
        a: {
          fr: 'FeexPay, FedaPay, PayDunya et PawaPay couvrent le Bénin. Connecte ton compte à Zuri et tes clients paient par MTN MoMo ou Moov Money (Celtiis selon le prestataire). L’argent va directement sur ton compte marchand.',
          en: 'FeexPay, FedaPay, PayDunya and PawaPay cover Benin. Connect your account to Zuri and buyers pay with MTN MoMo or Moov Money (Celtiis depending on the provider). The money goes straight to your merchant account.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Bénin ?', en: 'How do I do dropshipping in Benin?' },
        a: {
          fr: 'Trouve un fournisseur fiable à Cotonou (ou à Dantokpa) qui garde le stock, publie ta page de vente sur Zuri et fais livrer en paiement à la livraison après confirmation. Tu peux aussi importer en petite quantité depuis le Nigeria ou la Chine, mais garde un stock local pour livrer vite.',
          en: 'Find a reliable supplier in Cotonou (or at Dantokpa) who holds stock, publish your Zuri sales page and deliver cash on delivery after confirmation. You can import small quantities from Nigeria or China, but keep local stock to deliver fast.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Bénin ?', en: 'What product should I sell online in Benin?' },
        a: {
          fr: 'Commence par ce que tu peux livrer vite et montrer en vidéo : mode, accessoires, cosmétiques, petit électroménager. Compare ton prix avec Dantokpa et garde le produit seulement si ta marge tient après livraison et retours.',
          en: 'Start with what you can deliver fast and show on video: fashion, accessories, cosmetics, small appliances. Compare your price with Dantokpa and keep the product only if your margin survives delivery and returns.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Bénin ?', en: 'Is there a free online store builder in Benin?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec 0 % de commission et un sous-domaine offert. Seuls les frais de ton prestataire de paiement s’appliquent si tu encaisses en Mobile Money.',
          en: 'Zuri is free during launch, with 0% commission and a free subdomain. Only your payment provider’s fees apply if you collect Mobile Money.',
        },
      },
    ],
    sources: [
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'togo',
    iso: 'TG',
    name: { fr: 'Togo', en: 'Togo' },
    inName: 'au Togo',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé'],
    mobileMoney: ['Mixx by Yas (ex T-Money)', 'Moov Money (Flooz)'],
    zuriPsps: ['FeexPay', 'FedaPay', 'PayDunya'],
    title: {
      fr: 'Vendre en ligne au Togo : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Togo: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Togo : boutique en ligne gratuite, paiement à la livraison, Mixx by Yas et Flooz, dropshipping local à Lomé et dans les régions.',
      en: 'Sell online in Togo: free online store, cash on delivery, Mixx by Yas and Flooz payments, local dropshipping in Lomé and the regions.',
    },
    h1: {
      fr: 'Vendre en ligne au Togo, avec Flooz, Mixx et le paiement à la livraison',
      en: 'Sell online in Togo with Flooz, Mixx and cash on delivery',
    },
    intro: {
      fr: 'Au Togo, presque tout se joue à Lomé, sur WhatsApp et Facebook, avec un client qui paie le livreur ou envoie un Flooz. Zuri te donne une boutique rapide, un formulaire de commande en paiement à la livraison et l’encaissement Mixx by Yas ou Moov Money via ton compte FeexPay, FedaPay ou PayDunya.',
      en: 'In Togo, almost everything happens in Lomé, on WhatsApp and Facebook, with buyers who pay the rider or send a Flooz. Zuri gives you a fast store, a cash on delivery order form, and Mixx by Yas or Moov Money payments through your FeexPay, FedaPay or PayDunya account.',
    },
    market: [
      {
        fr: 'Lomé concentre la grande majorité des acheteurs en ligne, d’Adidogomé à Agoè en passant par Bè, Tokoin et Baguida. La ville est assez compacte pour livrer le jour même à moto. Pour Kara, Sokodé ou Kpalimé, les vendeurs envoient par bus ou par des agences de transport, en demandant généralement le paiement avant l’envoi.',
        en: 'Lomé holds the vast majority of online buyers, from Adidogomé to Agoè through Bè, Tokoin and Baguida. The city is compact enough for same day motorbike delivery. For Kara, Sokodé or Kpalimé, sellers ship by bus or transport agencies, usually asking for payment before shipping.',
      },
      {
        fr: 'Les Togolais disent souvent « faire un Flooz » pour envoyer de l’argent, du nom du service de Moov Africa. T-Money, le service de Togocom, est devenu Mixx by Yas. Ces deux portefeuilles couvrent l’essentiel des paiements mobiles. Le paiement à la livraison reste la règle pour les nouveaux clients, mais beaucoup acceptent un acompte Mobile Money quand le vendeur inspire confiance.',
        en: 'Togolese people often say “send a Flooz” for sending money, after Moov Africa’s service. T-Money, Togocom’s service, has become Mixx by Yas. These two wallets cover most mobile payments. Cash on delivery remains the rule for new buyers, but many accept a Mobile Money deposit once the seller looks trustworthy.',
      },
      {
        fr: 'Le grand marché d’Adawlato et les boutiques du centre restent des références de prix. Beaucoup de vendeurs en ligne au Togo s’approvisionnent aussi au Ghana voisin, au Bénin ou au Nigeria, et Lomé, avec son port, sert de point d’entrée pour les marchandises importées. Garder un stock à Lomé est la clé pour livrer vite.',
        en: 'The big Adawlato market and downtown shops remain price references. Many online sellers in Togo also source from neighboring Ghana, Benin or Nigeria, and Lomé, with its port, is an entry point for imported goods. Keeping stock in Lomé is key to fast delivery.',
      },
      {
        fr: 'Facebook et WhatsApp dominent, TikTok progresse vite chez les jeunes. Les temps forts commerciaux sont les fêtes de fin d’année, la fête de l’Indépendance du 27 avril, la rentrée scolaire, le Ramadan et la Tabaski dans le nord, et le Black Friday qui commence à être connu en ligne.',
        en: 'Facebook and WhatsApp dominate, and TikTok is growing fast among young people. Key selling moments are year end holidays, Independence Day on 27 April, back to school, Ramadan and Tabaski in the north, and Black Friday, which is gaining awareness online.',
      },
    ],
    tips: [
      {
        fr: 'Connecte ton compte FeexPay, FedaPay ou PayDunya à Zuri pour accepter Mixx by Yas et Moov Money. Le client peut payer un acompte ou la totalité sans quitter ta page.',
        en: 'Connect your FeexPay, FedaPay or PayDunya account to Zuri to accept Mixx by Yas and Moov Money. Buyers can pay a deposit or the full amount without leaving your page.',
      },
      {
        fr: 'Propose la livraison le jour même à Lomé et dis-le clairement sur ta page. C’est un argument fort face aux vendeurs qui livrent « quand le livreur passe ».',
        en: 'Offer same day delivery in Lomé and say it clearly on your page. It is a strong argument against sellers who deliver “whenever the rider comes by”.',
      },
      {
        fr: 'Pour Kara, Sokodé et l’intérieur, crée une zone avec paiement Mobile Money avant expédition. Tu évites les colis qui reviennent après un long trajet.',
        en: 'For Kara, Sokodé and inland towns, create a zone with Mobile Money payment before shipping. You avoid parcels coming back after a long trip.',
      },
      {
        fr: 'Montre le produit en vrai, à Lomé, dans tes vidéos. Les clients togolais se méfient des photos trop parfaites copiées sur internet.',
        en: 'Show the real product, in Lomé, in your videos. Togolese buyers distrust perfect photos copied from the internet.',
      },
      {
        fr: 'Utilise les codes promo pour tes clients fidèles sur WhatsApp. Un petit geste ramène des commandes sans payer de pub.',
        en: 'Use promo codes for loyal customers on WhatsApp. A small discount brings orders back without paying for ads.',
      },
      {
        fr: 'Note chaque commande injoignable dans Zuri et rappelle à deux moments de la journée différents. Beaucoup de clients répondent le soir après le travail.',
        en: 'Mark every unreachable order in Zuri and call again at two different times of day. Many buyers answer in the evening after work.',
      },
    ],
    productIdeas: [
      { fr: 'Mode, wax et tenues pour cérémonies, souvent demandés avant les fêtes et les mariages.', en: 'Fashion, wax prints and ceremony outfits, often requested before holidays and weddings.' },
      { fr: 'Accessoires téléphone, power banks et lampes rechargeables.', en: 'Phone accessories, power banks and rechargeable lamps.' },
      { fr: 'Produits de beauté, perruques et soins capillaires.', en: 'Beauty products, wigs and hair care.' },
      { fr: 'Ustensiles et petits appareils de cuisine pratiques.', en: 'Practical kitchen tools and small appliances.' },
      { fr: 'Articles pour enfants et fournitures scolaires avant la rentrée.', en: 'Kids’ items and school supplies before the school year.' },
      { fr: 'Produits digitaux (formations, guides), payés en Mobile Money.', en: 'Digital products (courses, guides), paid with Mobile Money.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Togo ?', en: 'How do I sell online in Togo?' },
        a: {
          fr: 'Ouvre une boutique Zuri, ajoute ton produit, règle tes zones de livraison à Lomé et dans les régions, puis partage ta page sur Facebook, TikTok et WhatsApp. Les clients commandent en paiement à la livraison ou paient par Mobile Money, et tu suis chaque commande.',
          en: 'Open a Zuri store, add your product, set delivery zones in Lomé and the regions, then share your page on Facebook, TikTok and WhatsApp. Buyers order with cash on delivery or pay with Mobile Money, and you track every order.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Togo ?', en: 'How do I accept Mobile Money in Togo?' },
        a: {
          fr: 'FeexPay, FedaPay et PayDunya fonctionnent au Togo. Ouvre un compte chez l’un d’eux et connecte-le dans Zuri : tes clients paient par Mixx by Yas (ex T-Money) ou Moov Money, et l’argent arrive sur ton compte marchand, pas chez Zuri.',
          en: 'FeexPay, FedaPay and PayDunya work in Togo. Open an account with one of them and connect it in Zuri: buyers pay with Mixx by Yas (formerly T-Money) or Moov Money, and the money reaches your merchant account, not Zuri.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Togo ?', en: 'How do I do dropshipping in Togo?' },
        a: {
          fr: 'Associe-toi à un fournisseur de Lomé qui a le stock, ou garde quelques pièces chez toi. Publie ta page, confirme chaque commande par téléphone, puis fais livrer. Le dropshipping depuis l’étranger sans stock local donne des délais trop longs pour le paiement à la livraison.',
          en: 'Partner with a Lomé supplier who has stock, or keep a few pieces yourself. Publish your page, confirm every order by phone, then deliver. Dropshipping from abroad without local stock means delays too long for cash on delivery.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Togo ?', en: 'What product should I sell online in Togo?' },
        a: {
          fr: 'Les produits utiles du quotidien, la mode et la beauté sont souvent demandés. Teste deux ou trois produits avec un petit budget, puis garde ceux qui ont un bon taux de livraison, pas seulement beaucoup de commandes.',
          en: 'Everyday useful products, fashion and beauty are often requested. Test two or three products with a small budget, then keep those with a good delivery rate, not just many orders.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Togo ?', en: 'Is there a free online store builder in Togo?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine gratuit. Tu peux commencer avec un seul produit et ajouter le reste plus tard.',
          en: 'Zuri is free during launch, with no commission on your sales and a free subdomain. You can start with a single product and add more later.',
        },
      },
    ],
    sources: [
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
      { label: 'pawaPay : opérateurs par pays (Togo non listé)', url: 'https://docs.pawapay.io/v2/docs/providers' },
    ],
  },
  {
    slug: 'mali',
    iso: 'ML',
    name: { fr: 'Mali', en: 'Mali' },
    inName: 'au Mali',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Bamako', 'Sikasso', 'Ségou', 'Kayes', 'Mopti'],
    mobileMoney: ['Orange Money', 'Moov Money', 'Wave'],
    zuriPsps: ['FedaPay', 'PayDunya'],
    title: {
      fr: 'Vendre en ligne au Mali : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Mali: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Mali : boutique en ligne gratuite, paiement à la livraison à Bamako, Orange Money et Moov Money, dropshipping local et closers.',
      en: 'Sell online in Mali: free online store, cash on delivery in Bamako, Orange Money and Moov Money payments, local dropshipping and closers.',
    },
    h1: {
      fr: 'Vendre en ligne au Mali, à Bamako et au-delà',
      en: 'Sell online in Mali, in Bamako and beyond',
    },
    intro: {
      fr: 'Au Mali, Orange Money est un réflexe et Bamako concentre la vente en ligne, avec des clients qui commandent sur Facebook, TikTok et WhatsApp. Zuri te donne une page de vente légère qui charge même avec une connexion faible, le paiement à la livraison et l’encaissement Orange Money ou Moov Money via ton compte FedaPay ou PayDunya.',
      en: 'In Mali, Orange Money is a reflex and Bamako is the center of online selling, with buyers ordering through Facebook, TikTok and WhatsApp. Zuri gives you a light sales page that loads even on a weak connection, cash on delivery, and Orange Money or Moov Money payments through your FedaPay or PayDunya account.',
    },
    market: [
      {
        fr: 'Bamako, de part et d’autre du fleuve Niger, fait l’essentiel du volume : ACI 2000, Hamdallaye, Badalabougou, Kalaban Coura, Magnambougou. Les distances et les ponts rendent les délais variables, donc les frais de livraison doivent tenir compte de la rive. Sikasso, Ségou et Kayes commandent aussi, mais l’envoi passe par les compagnies de cars, avec paiement d’avance.',
        en: 'Bamako, on both banks of the Niger river, carries most of the volume: ACI 2000, Hamdallaye, Badalabougou, Kalaban Coura, Magnambougou. Distances and bridges make delivery times vary, so fees should depend on the bank of the river. Sikasso, Ségou and Kayes also order, but shipping goes through bus companies, with prepayment.',
      },
      {
        fr: 'Orange Money est très ancré au Mali, Moov Money suit et Wave s’est fait une place à Bamako. Pour un premier achat, le client préfère payer cash au livreur. Une fois qu’il te connaît, il paie volontiers par Mobile Money, surtout pour les commandes envoyées hors de Bamako.',
        en: 'Orange Money is deeply rooted in Mali, Moov Money follows and Wave has carved out a place in Bamako. For a first purchase, buyers prefer paying cash to the rider. Once they know you, they gladly pay by Mobile Money, especially for orders shipped outside Bamako.',
      },
      {
        fr: 'La connexion n’est pas toujours stable et les données coûtent cher pour beaucoup de gens. Une page de vente lourde, avec des vidéos qui ne chargent pas, fait perdre des clients avant même qu’ils voient le prix. C’est un point où une page légère, comme celles de Zuri (environ 23 Ko de JavaScript), fait une vraie différence.',
        en: 'Connections are not always stable and data is expensive for many people. A heavy sales page with videos that never load loses buyers before they even see the price. This is where a light page, like Zuri’s (about 23 KB of JavaScript), makes a real difference.',
      },
      {
        fr: 'Le calendrier commercial suit surtout le Ramadan, la fête de fin du Ramadan, la Tabaski, la rentrée d’octobre, les mariages de la saison sèche et la fête de l’Indépendance du 22 septembre. Les tenues en bazin, les parfums, l’encens et les articles de cuisine se vendent particulièrement avant les fêtes.',
        en: 'The selling calendar mostly follows Ramadan, the end of Ramadan celebration, Tabaski, the October school start, dry season weddings and Independence Day on 22 September. Bazin outfits, perfumes, incense and kitchenware sell especially well before holidays.',
      },
    ],
    tips: [
      {
        fr: 'Sépare tes zones de livraison par rive à Bamako, avec un frais rive gauche et un frais rive droite, plus une zone « régions » payée d’avance par Orange Money.',
        en: 'Split Bamako delivery zones by river bank, with a left bank fee and a right bank fee, plus a “regions” zone paid upfront by Orange Money.',
      },
      {
        fr: 'Connecte ton compte FedaPay ou PayDunya à Zuri pour encaisser Orange Money et Moov Money directement depuis ta page. L’argent arrive chez ton prestataire, Zuri ne le touche pas.',
        en: 'Connect your FedaPay or PayDunya account to Zuri to collect Orange Money and Moov Money right from your page. The money goes to your provider account, Zuri never touches it.',
      },
      {
        fr: 'Garde des photos légères et une vidéo courte. Sur une connexion lente, une page qui s’affiche vite garde le client jusqu’au formulaire.',
        en: 'Keep photos light and the video short. On a slow connection, a page that shows up fast keeps the buyer until the order form.',
      },
      {
        fr: 'Fais confirmer par un closer qui parle bambara. Un appel dans la langue du client rassure, réduit les refus et permet de vérifier l’adresse exacte, souvent donnée par repère (« près de la mosquée », « après le marché »).',
        en: 'Have orders confirmed by a closer who speaks Bambara. A call in the buyer’s language reassures, reduces refusals and lets you check the exact address, often given by landmark (“near the mosque”, “past the market”).',
      },
      {
        fr: 'Prépare tes stocks avant le Ramadan et la Tabaski : les délais d’approvisionnement peuvent être longs, et les ruptures en pleine période de fête coûtent cher.',
        en: 'Build stock before Ramadan and Tabaski: supply times can be long, and running out in the middle of the holiday season is costly.',
      },
      {
        fr: 'Propose des packs familiaux (par exemple 3 pièces au lieu d’une). Au Mali, les achats se font souvent pour plusieurs membres de la famille.',
        en: 'Offer family bundles (for example 3 pieces instead of one). In Mali, purchases are often made for several family members.',
      },
      {
        fr: 'Regarde ton chiffre encaissé dans Zuri chaque semaine, pas seulement le nombre de commandes. C’est le seul chiffre qui dit si ta pub est rentable.',
        en: 'Check your cash collected in Zuri every week, not just the number of orders. It is the only number that tells you if your ads pay off.',
      },
    ],
    productIdeas: [
      { fr: 'Bazin, tissus et tenues de fête, souvent demandés avant la Tabaski et les mariages.', en: 'Bazin, fabrics and festive outfits, often requested before Tabaski and weddings.' },
      { fr: 'Parfums, encens et brûle-parfums.', en: 'Perfumes, incense and burners.' },
      { fr: 'Ventilateurs rechargeables, lampes solaires et power banks, utiles en saison chaude et pendant les coupures.', en: 'Rechargeable fans, solar lamps and power banks, handy in the hot season and during power cuts.' },
      { fr: 'Ustensiles et appareils de cuisine pour les grandes familles.', en: 'Kitchen tools and appliances for large families.' },
      { fr: 'Cosmétiques et soins naturels, dont le karité.', en: 'Cosmetics and natural care, including shea butter.' },
      { fr: 'Accessoires téléphone et petits gadgets.', en: 'Phone accessories and small gadgets.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Mali ?', en: 'How do I sell online in Mali?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute ton produit, découpe Bamako en zones de livraison et ajoute une zone pour les régions. Lance une pub Facebook ou TikTok, fais confirmer chaque commande par téléphone, puis livre en paiement à la livraison ou encaisse par Orange Money.',
          en: 'Create your Zuri store, add your product, split Bamako into delivery zones and add a zone for the regions. Run a Facebook or TikTok ad, confirm each order by phone, then deliver with cash on delivery or collect via Orange Money.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Orange Money au Mali ?', en: 'How do I accept Orange Money in Mali?' },
        a: {
          fr: 'FedaPay et PayDunya couvrent le Mali. Ouvre un compte chez l’un des deux, connecte-le à Zuri, et tes clients paient par Orange Money ou Moov Money selon les moyens proposés par ton prestataire.',
          en: 'FedaPay and PayDunya cover Mali. Open an account with one of them, connect it to Zuri, and buyers pay with Orange Money or Moov Money depending on your provider’s options.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Mali ?', en: 'How do I do dropshipping in Mali?' },
        a: {
          fr: 'Le dropshipping local marche mieux : un fournisseur à Bamako qui a le produit en stock et te le prépare dès qu’une commande est confirmée. Évite de vendre des produits qui mettent des semaines à arriver, les clients en paiement à la livraison ne patientent pas.',
          en: 'Local dropshipping works best: a Bamako supplier who has the product in stock and prepares it as soon as an order is confirmed. Avoid selling products that take weeks to arrive, cash on delivery buyers will not wait.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Mali ?', en: 'What product should I sell online in Mali?' },
        a: {
          fr: 'Les tenues de fête, les parfums, les appareils utiles pendant la chaleur et les coupures, et les articles de cuisine sont souvent demandés. Teste avec un petit budget et suis ton taux de livraison avant d’investir plus.',
          en: 'Festive outfits, perfumes, devices that help with heat and power cuts, and kitchenware are often requested. Test with a small budget and track your delivery rate before investing more.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Mali ?', en: 'Is there a free online store builder in Mali?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec 0 % de commission et un sous-domaine offert. Tes pages sont légères, ce qui aide quand la connexion est lente.',
          en: 'Zuri is free during launch, with 0% commission and a free subdomain. Pages are light, which helps when the connection is slow.',
        },
      },
    ],
    sources: [
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
      { label: 'pawaPay : opérateurs par pays (Mali non listé)', url: 'https://docs.pawapay.io/v2/docs/providers' },
    ],
  },
  {
    slug: 'burkina-faso',
    iso: 'BF',
    name: { fr: 'Burkina Faso', en: 'Burkina Faso' },
    inName: 'au Burkina Faso',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora'],
    mobileMoney: ['Orange Money', 'Moov Money'],
    zuriPsps: ['FeexPay', 'FedaPay', 'PayDunya', 'PawaPay'],
    title: {
      fr: 'Vendre en ligne au Burkina Faso : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Burkina Faso: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Burkina Faso : boutique en ligne gratuite, paiement à la livraison et Mobile Money Orange et Moov. Idéal pour le dropshipping local.',
      en: 'Sell online in Burkina Faso: free online store, cash on delivery and Orange or Moov Mobile Money. Built for local dropshipping and slow networks.',
    },
    h1: {
      fr: 'Vendre en ligne au Burkina Faso, de Ouaga à Bobo',
      en: 'Sell online in Burkina Faso, from Ouaga to Bobo',
    },
    intro: {
      fr: 'Au Burkina, le client veut voir le produit avant de payer, et il commande souvent depuis Facebook ou WhatsApp. Zuri te donne une page de vente légère avec un formulaire de paiement à la livraison, et l’option Orange Money ou Moov Money pour ceux qui préfèrent payer d’avance. Tu gardes ton argent : il arrive sur tes propres comptes.',
      en: 'In Burkina Faso, most buyers want to see the product before paying, and they usually order from Facebook or WhatsApp. Zuri gives you a light sales page with a cash on delivery form, plus Orange Money or Moov Money for customers who prefer to pay upfront. Your money stays yours: it lands in your own accounts.',
    },
    market: [
      {
        fr: 'Le commerce en ligne burkinabè se joue surtout à Ouagadougou et à Bobo-Dioulasso. Les clients découvrent les produits sur Facebook, dans des groupes de vente, sur TikTok et dans les statuts WhatsApp, puis ils appellent ou écrivent pour commander. Les grands marchés comme Rood Woko à Ouaga restent la référence pour comparer les prix : ton annonce doit donc montrer clairement pourquoi commander chez toi est plus simple.',
        en: 'Online selling in Burkina Faso happens mainly in Ouagadougou and Bobo-Dioulasso. Buyers discover products on Facebook, in sales groups, on TikTok and in WhatsApp statuses, then call or text to order. Big markets like Rood Woko in Ouaga are still where people compare prices, so your ad has to show clearly why ordering from you is easier.',
      },
      {
        fr: 'Le paiement à la livraison (COD) domine. Le client paie le livreur en espèces ou par Orange Money au moment de recevoir son colis. Le paiement d’avance existe, mais surtout avec des clients qui te connaissent déjà. La confiance se construit avec des vidéos réelles du produit, des avis de clients et un numéro joignable.',
        en: 'Cash on delivery (COD) is the norm. The customer pays the rider in cash or with Orange Money when the parcel arrives. Prepayment exists, but mostly with customers who already know you. Trust comes from real product videos, customer reviews and a phone number that actually answers.',
      },
      {
        fr: 'Côté Mobile Money, Orange Money et Moov Money couvrent l’essentiel des portefeuilles. Les prestataires intégrés à Zuri (FeexPay, FedaPay, PayDunya et PawaPay) fonctionnent tous au Burkina selon leurs pages officielles : tu connectes ton propre compte marchand et les paiements arrivent chez toi, jamais chez Zuri.',
        en: 'For Mobile Money, Orange Money and Moov Money cover most wallets. All four providers built into Zuri (FeexPay, FedaPay, PayDunya and PawaPay) list Burkina Faso on their official pages: you connect your own merchant account and payments go straight to you, never to Zuri.',
      },
      {
        fr: 'La livraison se fait surtout à moto, avec des livreurs indépendants ou des petites sociétés de livraison en ville. Entre villes, beaucoup de vendeurs passent par les gares routières et les compagnies de transport. Le réseau mobile peut être lent hors des centres : une page qui charge vite, même en 3G, fait une vraie différence sur le nombre de commandes.',
        en: 'Delivery is mostly done by motorbike, with independent riders or small delivery companies in town. Between cities, many sellers ship through bus stations and transport companies. Mobile data can be slow outside city centres, so a page that loads fast on 3G makes a real difference to how many orders you get.',
      },
    ],
    tips: [
      {
        fr: 'Commence par Ouaga et Bobo uniquement. Dans Zuri, crée une zone de livraison par ville avec ses propres frais, et désactive les zones où tu n’as pas encore de livreur fiable.',
        en: 'Start with Ouaga and Bobo only. In Zuri, create one delivery zone per city with its own fee, and switch off areas where you do not have a reliable rider yet.',
      },
      {
        fr: 'Appelle chaque commande avant d’expédier. Tes closers voient les commandes arriver, les marquent confirmée ou injoignable, et tu évites de payer un livreur pour un colis refusé.',
        en: 'Call every order before shipping. Your closers see orders come in, mark them confirmed or unreachable, and you avoid paying a rider for a refused parcel.',
      },
      {
        fr: 'Filme le produit en vrai, dans un décor local, et utilise cette vidéo en pub Facebook ou TikTok. Les clients burkinabè se méfient des photos trop parfaites copiées sur internet.',
        en: 'Film the product for real, in a local setting, and use that video in your Facebook or TikTok ads. Burkinabè buyers are wary of perfect photos copied from the internet.',
      },
      {
        fr: 'Propose des packs : 1 pièce, 2 pièces avec petite remise, 3 pièces avec livraison offerte. Le panier moyen monte et le coût de livraison par article baisse.',
        en: 'Offer bundles: 1 item, 2 items with a small discount, 3 items with free delivery. Your average order goes up and delivery cost per item goes down.',
      },
      {
        fr: 'Mets le bouton WhatsApp bien visible. Beaucoup de clients veulent poser une question en mooré, en dioula ou en français avant de commander, et une réponse rapide rassure.',
        en: 'Keep the WhatsApp button visible. Many customers want to ask a question in Mooré, Dioula or French before ordering, and a quick reply builds trust.',
      },
      {
        fr: 'Prépare tes campagnes pour Tabaski, la fin du Ramadan, Noël et la fête du 11 décembre. Utilise le compte à rebours et un code promo limité dans le temps pour créer l’urgence sans mentir.',
        en: 'Plan campaigns for Tabaski, the end of Ramadan, Christmas and the 11 December national holiday. Use the countdown timer and a time-limited promo code to create urgency without lying.',
      },
      {
        fr: 'Installe le pixel Facebook et l’API Conversions dès le premier jour. Quand Facebook sait qui a vraiment commandé, tes pubs trouvent plus vite les bons acheteurs.',
        en: 'Set up the Facebook pixel and Conversions API from day one. When Facebook knows who really ordered, your ads find the right buyers faster.',
      },
      {
        fr: 'Suis ton taux de livraison, pas seulement tes commandes. Dans Zuri, compare commandes confirmées, livrées et argent encaissé pour savoir quel produit rapporte vraiment.',
        en: 'Track your delivery rate, not just orders. In Zuri, compare confirmed orders, delivered orders and cash collected to see which product really makes money.',
      },
    ],
    productIdeas: [
      {
        fr: 'Ventilateurs rechargeables et petits appareils solaires, souvent demandés pendant les fortes chaleurs et les coupures.',
        en: 'Rechargeable fans and small solar devices, often in demand during hot months and power cuts.',
      },
      {
        fr: 'Tenues en Faso Dan Fani et accessoires en pagne local, appréciés pour les cérémonies et les fêtes.',
        en: 'Faso Dan Fani outfits and local fabric accessories, popular for ceremonies and celebrations.',
      },
      {
        fr: 'Produits de soin pour la peau et les cheveux adaptés au climat sec, souvent recherchés sur Facebook.',
        en: 'Skin and hair care products suited to the dry climate, often searched for on Facebook.',
      },
      {
        fr: 'Accessoires de téléphone (power banks, écouteurs, câbles), une catégorie qui se vend régulièrement.',
        en: 'Phone accessories (power banks, earphones, cables), a category that tends to sell steadily.',
      },
      {
        fr: 'Petits équipements de cuisine pratiques (mixeurs, ustensiles), souvent demandés à l’approche de la Tabaski.',
        en: 'Handy kitchen gear (blenders, utensils), often requested in the run-up to Tabaski.',
      },
      {
        fr: 'Fournitures et sacs scolaires au moment de la rentrée d’octobre.',
        en: 'School supplies and bags around the October back-to-school period.',
      },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Burkina Faso ?', en: 'How do I sell online in Burkina Faso?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute ton produit (tu peux l’importer depuis un lien), active le formulaire de paiement à la livraison et définis tes frais pour Ouaga et Bobo. Lance ensuite une pub Facebook ou TikTok vers ta page de vente et confirme chaque commande par téléphone avant d’envoyer le livreur.',
          en: 'Create your store on Zuri, add your product (you can import it from a link), turn on the cash on delivery form and set your fees for Ouaga and Bobo. Then run a Facebook or TikTok ad to your sales page and confirm every order by phone before sending the rider.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Burkina Faso ?', en: 'How do I accept Mobile Money in Burkina Faso?' },
        a: {
          fr: 'Ouvre un compte marchand chez FeexPay, FedaPay, PayDunya ou PawaPay (tous listent le Burkina), puis connecte-le à Zuri. Tes clients paient par Orange Money ou Moov Money et l’argent arrive sur ton compte chez le prestataire. Zuri ne touche jamais à tes fonds.',
          en: 'Open a merchant account with FeexPay, FedaPay, PayDunya or PawaPay (all of them list Burkina Faso), then connect it to Zuri. Customers pay with Orange Money or Moov Money and the money lands in your account with that provider. Zuri never holds your funds.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Burkina Faso ?', en: 'What product should I sell online in Burkina Faso?' },
        a: {
          fr: 'Cherche un produit qui règle un problème visible (chaleur, coupures, soin, cuisine), facile à montrer en vidéo et assez léger pour la moto. Teste deux ou trois produits avec un petit budget pub, garde celui qui a le meilleur taux de livraison.',
          en: 'Look for a product that solves a visible problem (heat, power cuts, skin care, cooking), is easy to show on video and light enough for a motorbike. Test two or three products on a small ad budget and keep the one with the best delivery rate.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Burkina Faso ?', en: 'How does dropshipping work in Burkina Faso?' },
        a: {
          fr: 'Au Burkina, on parle surtout de dropshipping local : un fournisseur à Ouaga garde le stock, toi tu vends et ton équipe confirme. Avec Zuri, tu peux gérer plusieurs boutiques, suivre chaque statut (nouvelle, confirmée, expédiée, livrée, retournée) et voir ce qui a été encaissé.',
          en: 'In Burkina Faso it is mostly local dropshipping: a supplier in Ouaga holds the stock, you sell and your team confirms. With Zuri you can run several stores, track every status (new, confirmed, shipped, delivered, returned) and see what has been collected.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Burkina Faso ?', en: 'Is there a free online store builder in Burkina Faso?' },
        a: {
          fr: 'Oui : Zuri est gratuit pendant la période de lancement, avec un sous-domaine offert et 0 % de commission sur tes ventes. Tu paies seulement les frais de ton prestataire de paiement si tu encaisses par Mobile Money.',
          en: 'Yes: Zuri is free during the launch period, with a free subdomain and 0% commission on your sales. You only pay your payment provider’s fees if you collect by Mobile Money.',
        },
      },
    ],
    sources: [
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'niger',
    iso: 'NE',
    name: { fr: 'Niger', en: 'Niger' },
    inName: 'au Niger',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'XOF', label: { fr: 'franc CFA (XOF)', en: 'West African CFA franc (XOF)' } },
    cities: ['Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Agadez'],
    mobileMoney: ['Airtel Money', 'Moov Money'],
    zuriPsps: ['FedaPay'],
    title: {
      fr: 'Vendre en ligne au Niger : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Niger: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Niger : boutique en ligne gratuite, paiement à la livraison à Niamey et Maradi, Mobile Money via FedaPay. Pour le dropshipping local.',
      en: 'Sell online in Niger: free online store, cash on delivery in Niamey and Maradi, Mobile Money through FedaPay. Made for local dropshipping on 3G.',
    },
    h1: {
      fr: 'Vendre en ligne au Niger, simplement, depuis Niamey',
      en: 'Sell online in Niger, simply, starting from Niamey',
    },
    intro: {
      fr: 'Au Niger, la vente en ligne passe par WhatsApp, Facebook et le bouche à oreille, et le client paie presque toujours à la livraison. Zuri te donne une page de commande rapide, même sur un réseau faible, et un suivi clair de chaque colis. Pour le Mobile Money, tu peux brancher ton compte FedaPay.',
      en: 'In Niger, online selling runs on WhatsApp, Facebook and word of mouth, and customers almost always pay on delivery. Zuri gives you a fast order page, even on a weak network, and clear tracking for every parcel. For Mobile Money, you can connect your own FedaPay account.',
    },
    market: [
      {
        fr: 'Niamey concentre la plus grande partie des commandes en ligne. Maradi, ville commerçante tournée vers le Nigeria voisin, et Zinder ont aussi des acheteurs actifs, mais la livraison y demande une organisation à part. La plupart des vendeurs démarrent à Niamey et s’étendent ensuite avec un partenaire local dans chaque ville.',
        en: 'Niamey accounts for most online orders. Maradi, a trading city facing neighbouring Nigeria, and Zinder also have active buyers, but delivery there needs its own setup. Most sellers start in Niamey and expand later with a local partner in each city.',
      },
      {
        fr: 'Les clients nigériens découvrent les produits sur Facebook, dans les statuts WhatsApp et de plus en plus sur TikTok. Ils commandent souvent par message vocal. Beaucoup préfèrent parler en haoussa ou en zarma : avoir un closer qui parle la langue du client augmente nettement les confirmations.',
        en: 'Nigerien buyers find products on Facebook, in WhatsApp statuses and more and more on TikTok. They often order by voice note. Many prefer to speak Hausa or Zarma, so having a closer who speaks the customer’s language really helps confirmations.',
      },
      {
        fr: 'Le paiement à la livraison reste la règle : le client veut toucher le produit avant de sortir l’argent. Le Mobile Money est très présent avec Airtel Money et Moov Money. Parmi les prestataires intégrés à Zuri, seul FedaPay liste le Niger, avec Airtel Money dans sa documentation. Vérifie dans ton compte FedaPay les moyens réellement activés avant de les annoncer à tes clients.',
        en: 'Cash on delivery is the rule: buyers want to hold the product before paying. Mobile Money is widespread with Airtel Money and Moov Money. Among the providers built into Zuri, only FedaPay lists Niger, with Airtel Money in its documentation. Check which methods are actually active in your FedaPay account before you promise them to customers.',
      },
      {
        fr: 'La chaleur pèse sur le commerce : livraisons tôt le matin ou en fin d’après-midi, produits qui supportent la température, emballages solides contre la poussière. Le Ramadan change aussi les horaires : les clients répondent plus volontiers après la rupture du jeûne, c’est le bon moment pour les appels de confirmation.',
        en: 'The heat shapes trade: deliveries early in the morning or late afternoon, products that handle high temperatures, sturdy packaging against dust. Ramadan also changes routines: customers pick up the phone more easily after breaking the fast, which is a good time for confirmation calls.',
      },
    ],
    tips: [
      {
        fr: 'Recrute au moins un closer qui parle haoussa et un qui parle zarma. Dans Zuri, les commandes sont attribuées automatiquement à ton équipe, chacun voit les siennes.',
        en: 'Hire at least one closer who speaks Hausa and one who speaks Zarma. In Zuri, orders are assigned automatically to your team, and each closer sees their own.',
      },
      {
        fr: 'Garde ta page très légère : peu de photos, une vidéo courte, un texte simple. Les pages Zuri pèsent environ 23 Ko de JavaScript, mais des images trop lourdes peuvent quand même ralentir la page en 3G.',
        en: 'Keep your page very light: few photos, one short video, simple text. Zuri pages ship about 23 KB of JavaScript, but heavy images can still slow the page down on 3G.',
      },
      {
        fr: 'Planifie tes livraisons hors des heures les plus chaudes et indique-le sur ta page. Un client prévenu est un client qui décroche quand le livreur appelle.',
        en: 'Schedule deliveries outside the hottest hours and say so on your page. A customer who knows when to expect the rider picks up when the rider calls.',
      },
      {
        fr: 'Marque vite les clients injoignables et rappelle-les à un autre moment de la journée. Beaucoup ne sont pas de mauvaise foi, ils étaient juste occupés ou sans batterie.',
        en: 'Mark unreachable customers quickly and call them back at another time of day. Most are not acting in bad faith, they were just busy or their phone was dead.',
      },
      {
        fr: 'Prépare la Tabaski et le Ramadan à l’avance : stock, livreurs supplémentaires, pub lancée une à deux semaines avant. Pense aussi à la fête du 18 décembre et à la rentrée scolaire.',
        en: 'Prepare for Tabaski and Ramadan early: stock, extra riders, ads running one to two weeks before. Also think about the 18 December holiday and back-to-school.',
      },
      {
        fr: 'Utilise la relance de panier abandonné : un client qui a rempli son numéro sans valider peut être rappelé par ton équipe le jour même.',
        en: 'Use abandoned cart recovery: a customer who typed their number but did not submit can be called by your team the same day.',
      },
      {
        fr: 'Si tu vends vers Maradi ou Zinder, fixe des frais de livraison réalistes par ville dans Zuri plutôt qu’un prix unique qui te fait perdre de l’argent.',
        en: 'If you sell to Maradi or Zinder, set realistic per-city delivery fees in Zuri instead of a flat price that loses you money.',
      },
    ],
    productIdeas: [
      {
        fr: 'Ventilateurs rechargeables, glacières et gourdes isothermes, souvent demandés pendant la saison chaude.',
        en: 'Rechargeable fans, cool boxes and insulated bottles, often in demand in the hot season.',
      },
      {
        fr: 'Lampes et kits solaires, utiles en cas de coupure et dans les quartiers mal desservis.',
        en: 'Solar lamps and kits, handy during power cuts and in poorly served areas.',
      },
      {
        fr: 'Voiles, abayas et tenues de fête, recherchés à l’approche du Ramadan et de la Tabaski.',
        en: 'Veils, abayas and festive outfits, sought after ahead of Ramadan and Tabaski.',
      },
      {
        fr: 'Parfums, encens et produits de beauté, une catégorie qui marche souvent bien sur WhatsApp.',
        en: 'Perfumes, incense and beauty products, a category that often does well on WhatsApp.',
      },
      {
        fr: 'Accessoires de téléphone et power banks, utiles quand l’électricité est irrégulière.',
        en: 'Phone accessories and power banks, useful when electricity is unreliable.',
      },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Niger ?', en: 'How do I sell online in Niger?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute ton produit avec une vidéo courte, active le paiement à la livraison et ta zone Niamey. Diffuse ta page sur Facebook, TikTok et WhatsApp, et fais confirmer chaque commande par téléphone avant la livraison.',
          en: 'Create your Zuri store, add your product with a short video, turn on cash on delivery and your Niamey zone. Share your page on Facebook, TikTok and WhatsApp, and have every order confirmed by phone before delivery.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Niger ?', en: 'How do I accept Mobile Money in Niger?' },
        a: {
          fr: 'FedaPay est le prestataire intégré à Zuri qui couvre le Niger, et sa documentation cite Airtel Money. Ouvre ton compte FedaPay, connecte-le à Zuri, et vérifie les opérateurs actifs. Pour les autres clients, le paiement à la livraison reste la solution la plus sûre.',
          en: 'FedaPay is the Zuri-integrated provider that covers Niger, and its documentation lists Airtel Money. Open your FedaPay account, connect it to Zuri, and check which operators are active. For everyone else, cash on delivery remains the safest option.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Niger ?', en: 'What product should I sell online in Niger?' },
        a: {
          fr: 'Les produits qui aident à vivre avec la chaleur et les coupures, les tenues de fête et la beauté sont souvent demandés. Teste avec un petit stock, regarde ton taux de livraison, puis augmente le budget pub sur ce qui part vraiment.',
          en: 'Products that help with heat and power cuts, festive clothing and beauty are often in demand. Test with small stock, watch your delivery rate, then increase ad spend on what really sells.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Niger ?', en: 'How does dropshipping work in Niger?' },
        a: {
          fr: 'Le plus réaliste est le dropshipping local : un fournisseur à Niamey stocke, tu fais la pub et ton équipe confirme. Zuri te montre les commandes confirmées, livrées et retournées pour savoir si le partenariat est rentable.',
          en: 'The realistic approach is local dropshipping: a supplier in Niamey holds stock, you run the ads and your team confirms. Zuri shows confirmed, delivered and returned orders so you can tell if the partnership pays off.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Niger ?', en: 'Is there a free online store builder in Niger?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine offert. Tu n’as besoin ni de carte bancaire ni de développeur pour commencer.',
          en: 'Zuri is free during launch, with no commission on your sales and a free subdomain. You do not need a bank card or a developer to get started.',
        },
      },
    ],
    sources: [
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'pawaPay : opérateurs par pays (Niger absent)', url: 'https://docs.pawapay.io/v2/docs/providers' },
    ],
  },
  {
    slug: 'guinee',
    iso: 'GN',
    name: { fr: 'Guinée', en: 'Guinea' },
    inName: 'en Guinée',
    region: 'afrique-ouest',
    primaryLang: 'fr',
    currency: { code: 'GNF', label: { fr: 'franc guinéen (GNF)', en: 'Guinean franc (GNF)' } },
    cities: ['Conakry', 'Kankan', 'Nzérékoré', 'Kindia', 'Labé'],
    mobileMoney: ['Orange Money', 'MTN MoMo'],
    zuriPsps: ['FedaPay'],
    title: {
      fr: 'Vendre en ligne en Guinée : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Guinea: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Guinée : boutique en ligne gratuite en francs guinéens, paiement à la livraison à Conakry, Mobile Money via FedaPay, dropshipping local.',
      en: 'Sell online in Guinea: free online store priced in Guinean francs, cash on delivery in Conakry, Mobile Money through FedaPay, local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne en Guinée, en francs guinéens',
      en: 'Sell online in Guinea, priced in Guinean francs',
    },
    intro: {
      fr: 'À Conakry, on commande sur Facebook, on discute sur WhatsApp et on paie le livreur à la porte. Zuri affiche tes prix en francs guinéens (GNF), gère le paiement à la livraison et t’aide à suivre chaque colis, de Kaloum à Ratoma. Tu peux aussi brancher ton compte FedaPay pour le Mobile Money.',
      en: 'In Conakry, people order on Facebook, chat on WhatsApp and pay the rider at the door. Zuri shows your prices in Guinean francs (GNF), handles cash on delivery and helps you track every parcel, from Kaloum to Ratoma. You can also connect your FedaPay account for Mobile Money.',
    },
    market: [
      {
        fr: 'Conakry est le cœur du commerce en ligne guinéen. La ville s’étire en longueur, de Kaloum jusqu’à Ratoma, Matoto et au-delà, et les embouteillages rendent chaque livraison plus longue qu’on ne le pense. Les vendeurs qui réussissent découpent la ville en zones et ne promettent pas la même heure de livraison partout.',
        en: 'Conakry is the heart of online selling in Guinea. The city stretches along a peninsula, from Kaloum out to Ratoma, Matoto and beyond, and traffic makes every delivery take longer than expected. Sellers who do well split the city into zones and do not promise the same delivery time everywhere.',
      },
      {
        fr: 'Le grand marché de Madina reste la référence des prix pour beaucoup de clients. Pour vendre en ligne, tu dois apporter ce que le marché n’offre pas : pas de déplacement, pas de bousculade, un produit livré chez soi et une explication claire. Facebook et WhatsApp sont les canaux principaux, TikTok monte chez les plus jeunes.',
        en: 'The huge Madina market is still the price benchmark for many customers. To sell online, you have to offer what the market cannot: no trip, no crowds, delivery to the door and a clear explanation. Facebook and WhatsApp are the main channels, with TikTok growing among younger buyers.',
      },
      {
        fr: 'Le paiement à la livraison domine largement. Côté Mobile Money, Orange Money et MTN MoMo sont les noms que tout le monde connaît. Parmi les prestataires intégrés à Zuri, FedaPay liste la Guinée (en GNF), et sa documentation cite MTN. Vérifie dans ton compte FedaPay les opérateurs actifs avant de proposer le paiement en ligne.',
        en: 'Cash on delivery dominates. For Mobile Money, Orange Money and MTN MoMo are the names everyone knows. Among the providers built into Zuri, FedaPay lists Guinea (in GNF), and its documentation mentions MTN. Check which operators are active in your FedaPay account before you offer online payment.',
      },
      {
        fr: 'Hors de Conakry, des villes comme Kankan, Labé, Kindia ou Nzérékoré ont une vraie demande, mais la livraison passe souvent par des transporteurs routiers et prend plus de temps. Beaucoup de vendeurs demandent alors une avance par Mobile Money pour couvrir le transport, et encaissent le reste à la réception.',
        en: 'Outside Conakry, cities like Kankan, Labé, Kindia or Nzérékoré have real demand, but delivery often goes through road carriers and takes longer. Many sellers ask for a Mobile Money deposit to cover transport and collect the rest on delivery.',
      },
    ],
    tips: [
      {
        fr: 'Crée tes zones de livraison par commune de Conakry dans Zuri, avec des frais différents pour Kaloum, Dixinn, Matam, Ratoma et Matoto. Le client voit le vrai prix avant de commander.',
        en: 'Create delivery zones for each Conakry commune in Zuri, with different fees for Kaloum, Dixinn, Matam, Ratoma and Matoto. Customers see the real price before ordering.',
      },
      {
        fr: 'Affiche tes prix en francs guinéens, sans conversion compliquée. Arrondis les montants pour que le livreur rende la monnaie facilement.',
        en: 'Show prices in Guinean francs, with no confusing conversion. Round amounts so the rider can give change easily.',
      },
      {
        fr: 'Confirme chaque commande le jour même. Plus le délai est long, plus le client risque d’acheter ailleurs ou de devenir injoignable.',
        en: 'Confirm every order the same day. The longer you wait, the more likely the customer buys elsewhere or stops answering.',
      },
      {
        fr: 'Pour les villes de l’intérieur, demande une petite avance par Mobile Money et explique pourquoi. Un client sérieux accepte, et tu limites les colis refusés coûteux.',
        en: 'For inland cities, ask for a small Mobile Money deposit and explain why. A serious customer accepts, and you cut costly refused parcels.',
      },
      {
        fr: 'Montre le produit en vidéo avec ton numéro et le nom de ta boutique. Ajoute la popup des ventes réelles pour rassurer les nouveaux visiteurs.',
        en: 'Show the product on video with your number and store name. Turn on the real-sales popup to reassure new visitors.',
      },
      {
        fr: 'Prépare la Tabaski, le Ramadan, la fête de l’indépendance du 2 octobre et la rentrée. Commande ton stock tôt : les arrivages peuvent prendre du retard au port.',
        en: 'Prepare for Tabaski, Ramadan, the 2 October independence day and back-to-school. Order stock early, since shipments can be delayed at the port.',
      },
      {
        fr: 'Utilise les codes promo pour tes clients fidèles et envoie-les par WhatsApp. Un client déjà livré une fois commande plus facilement la deuxième fois.',
        en: 'Use promo codes for loyal customers and send them on WhatsApp. A customer who got a delivery once orders more easily the second time.',
      },
    ],
    productIdeas: [
      {
        fr: 'Mèches, perruques et produits capillaires, souvent demandés à Conakry.',
        en: 'Hair extensions, wigs and hair products, often requested in Conakry.',
      },
      {
        fr: 'Tenues de fête et bazin pour les cérémonies, la Tabaski et la fin du Ramadan.',
        en: 'Festive outfits and bazin fabric for ceremonies, Tabaski and the end of Ramadan.',
      },
      {
        fr: 'Petit électroménager et accessoires de cuisine, utiles et faciles à montrer en vidéo.',
        en: 'Small appliances and kitchen gadgets, practical and easy to demo on video.',
      },
      {
        fr: 'Power banks, lampes rechargeables et accessoires de téléphone, recherchés quand le courant manque.',
        en: 'Power banks, rechargeable lamps and phone accessories, sought after during power cuts.',
      },
      {
        fr: 'Parfums et cosmétiques, une catégorie qui se partage bien dans les statuts WhatsApp.',
        en: 'Perfumes and cosmetics, a category that spreads well through WhatsApp statuses.',
      },
      {
        fr: 'Articles pour bébé et enfants, souvent achetés par les familles qui veulent éviter le marché.',
        en: 'Baby and kids items, often bought by families who would rather skip the market.',
      },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Guinée ?', en: 'How do I sell online in Guinea?' },
        a: {
          fr: 'Ouvre ta boutique Zuri, fixe tes prix en GNF, crée tes zones de livraison à Conakry et active le paiement à la livraison. Lance une pub Facebook ou TikTok, et appelle chaque client pour confirmer avant d’envoyer le livreur.',
          en: 'Open your Zuri store, set prices in GNF, create your Conakry delivery zones and turn on cash on delivery. Run a Facebook or TikTok ad, and call each customer to confirm before sending the rider.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money en Guinée ?', en: 'How do I accept Mobile Money in Guinea?' },
        a: {
          fr: 'Connecte ton compte FedaPay à Zuri : FedaPay liste la Guinée et cite MTN dans sa documentation. Vérifie les opérateurs actifs sur ton compte. Pour les clients Orange Money, tu peux encaisser une avance sur ton propre numéro marchand en dehors de Zuri, puis valider la commande.',
          en: 'Connect your FedaPay account to Zuri: FedaPay lists Guinea and mentions MTN in its documentation. Check which operators are active on your account. For Orange Money customers, you can take a deposit on your own merchant number outside Zuri, then confirm the order.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Guinée ?', en: 'What product should I sell online in Guinea?' },
        a: {
          fr: 'Beauté, mode de fête, petits appareils et accessoires de téléphone sont souvent demandés. Choisis un produit léger, difficile à trouver au bon prix sans se déplacer, et teste-le avant de remplir ton stock.',
          en: 'Beauty, festive fashion, small appliances and phone accessories are often in demand. Pick a light product that is hard to find at a good price without travelling, and test it before stocking up.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Guinée ?', en: 'How does dropshipping work in Guinea?' },
        a: {
          fr: 'Travaille avec un fournisseur à Conakry qui garde le stock et prépare les colis. Toi, tu gères la pub et la confirmation. Avec Zuri, tu peux importer la fiche produit depuis un lien et suivre les retours pour savoir si le fournisseur est fiable.',
          en: 'Work with a Conakry supplier who holds stock and packs parcels. You handle ads and confirmation. With Zuri you can import the product page from a link and track returns to see whether the supplier is reliable.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Guinée ?', en: 'Is there a free online store builder in Guinea?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec 0 % de commission, un sous-domaine offert et l’affichage en francs guinéens. Tu peux créer plusieurs boutiques depuis le même compte.',
          en: 'Zuri is free during launch, with 0% commission, a free subdomain and prices shown in Guinean francs. You can run several stores from the same account.',
        },
      },
    ],
    sources: [
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'pawaPay : opérateurs par pays (Guinée absente)', url: 'https://docs.pawapay.io/v2/docs/providers' },
    ],
  },
  {
    slug: 'cameroun',
    iso: 'CM',
    name: { fr: 'Cameroun', en: 'Cameroon' },
    inName: 'au Cameroun',
    region: 'afrique-centrale',
    primaryLang: 'fr',
    currency: { code: 'XAF', label: { fr: 'franc CFA (XAF)', en: 'Central African CFA franc (XAF)' } },
    cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda'],
    mobileMoney: ['MTN MoMo', 'Orange Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne au Cameroun : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Cameroon: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Cameroun : boutique en ligne gratuite, paiement à la livraison à Douala et Yaoundé, Mobile Money MTN et Orange (PawaPay), dropshipping.',
      en: 'Sell online in Cameroon: free online store, cash on delivery in Douala and Yaoundé, MTN and Orange Mobile Money through PawaPay. Great for dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne au Cameroun, de Douala à Yaoundé',
      en: 'Sell online in Cameroon, from Douala to Yaoundé',
    },
    intro: {
      fr: 'Le Cameroun a une vraie culture du « je commande, tu me livres, je paie ». Zuri te donne une boutique en ligne pensée pour ça : formulaire de paiement à la livraison, équipe de closers, et MTN MoMo ou Orange Money via ton compte PawaPay. En français comme en anglais, selon tes clients.',
      en: 'Cameroon has a strong "I order, you deliver, I pay" culture. Zuri gives you an online store built for exactly that: a cash on delivery form, a team of closers, and MTN MoMo or Orange Money through your own PawaPay account. In French or English, depending on your customers.',
    },
    market: [
      {
        fr: 'Douala, capitale économique, et Yaoundé concentrent l’essentiel des commandes en ligne. Les deux villes ont leurs habitudes : Douala est plus commerçante et pressée, Yaoundé plus administrative. Bafoussam, Garoua et les villes anglophones comme Bamenda ou Buea ont aussi des acheteurs, souvent servis par agences de voyage et transporteurs.',
        en: 'Douala, the economic capital, and Yaoundé account for most online orders. Each city has its own rhythm: Douala is busier and more commercial, Yaoundé more administrative. Bafoussam, Garoua and English-speaking cities like Bamenda or Buea also have buyers, often served through bus agencies and carriers.',
      },
      {
        fr: 'Facebook reste le premier canal de vente, avec des pages et des groupes très actifs, suivi de WhatsApp et TikTok. Les vendeurs camerounais sont nombreux sur les produits tendance : pour sortir du lot, il faut une offre claire, une vraie vidéo et une confirmation rapide. Le pays étant bilingue, prévoir une page en anglais pour le Nord-Ouest et le Sud-Ouest peut t’ouvrir une clientèle moins sollicitée.',
        en: 'Facebook is still the first sales channel, with very active pages and groups, followed by WhatsApp and TikTok. Many Cameroonian sellers chase the same trending products, so you stand out with a clear offer, a real video and fast confirmation. As the country is bilingual, an English page for the North-West and South-West can open up customers who see fewer ads.',
      },
      {
        fr: 'Le paiement à la livraison domine. Le Mobile Money est entré dans les habitudes avec MTN MoMo et Orange Money, et beaucoup de clients paient le livreur par MoMo plutôt qu’en espèces. Parmi les prestataires intégrés à Zuri, PawaPay couvre le Cameroun avec MTN et Orange selon sa documentation officielle.',
        en: 'Cash on delivery dominates. Mobile Money is part of daily life with MTN MoMo and Orange Money, and many customers pay the rider by MoMo rather than cash. Among the providers built into Zuri, PawaPay covers Cameroon with MTN and Orange according to its official documentation.',
      },
      {
        fr: 'En ville, la livraison se fait surtout à moto, les fameux bendskins, avec des livreurs indépendants ou des petites structures de livraison. Entre villes, les colis voyagent par les agences de transport, et le client récupère à l’agence. Le principal risque reste le client injoignable ou le colis refusé : ton process de confirmation fait la différence.',
        en: 'In town, deliveries are mostly done by motorbike taxis, the famous bendskins, with independent riders or small delivery outfits. Between cities, parcels travel with bus agencies and customers pick up at the agency. The main risk is still the unreachable customer or the refused parcel, so your confirmation process makes the difference.',
      },
    ],
    tips: [
      {
        fr: 'Sépare Douala et Yaoundé en deux zones Zuri avec leurs propres frais, puis ajoute une zone « expédition par agence » pour les autres villes avec un paiement Mobile Money d’avance.',
        en: 'Split Douala and Yaoundé into two Zuri zones with their own fees, then add a "ship by bus agency" zone for other cities with Mobile Money paid upfront.',
      },
      {
        fr: 'Confirme vite : une commande appelée dans l’heure se livre beaucoup mieux qu’une commande appelée le lendemain. Avec l’attribution automatique, chaque closer reçoit sa part de commandes dès qu’elles tombent.',
        en: 'Confirm fast: an order called within the hour gets delivered far more often than one called the next day. With automatic assignment, each closer gets their share of orders as soon as they arrive.',
      },
      {
        fr: 'Crée une version anglaise de ta page pour Bamenda, Buea et Limbe. Zuri gère le français et l’anglais, et ta pub peut cibler chaque région dans sa langue.',
        en: 'Create an English version of your page for Bamenda, Buea and Limbe. Zuri handles French and English, and your ads can target each region in its own language.',
      },
      {
        fr: 'Teste des offres par quantité avec une vraie économie visible. Au Cameroun, le client compare beaucoup : montre le prix barré seulement s’il est réel.',
        en: 'Test quantity offers with a real, visible saving. Cameroonian buyers compare a lot, so show a crossed-out price only if it is genuine.',
      },
      {
        fr: 'Branche le pixel Facebook, l’API Conversions et le pixel TikTok. Envoie à Facebook les vraies commandes, pas seulement les visites, pour que l’algorithme apprenne sur des acheteurs.',
        en: 'Connect the Facebook pixel, Conversions API and TikTok pixel. Send real orders to Facebook, not just visits, so the algorithm learns from actual buyers.',
      },
      {
        fr: 'Prépare la fête nationale du 20 mai, la rentrée de septembre, Noël et le Ramadan selon ta cible. Ce sont des moments où les clients dépensent davantage.',
        en: 'Plan around the 20 May national day, September back-to-school, Christmas and Ramadan depending on your audience. Customers spend more at these times.',
      },
      {
        fr: 'Garde une liste des clients qui refusent souvent leurs colis et demande-leur une avance MoMo la prochaine fois. Les statuts Zuri t’aident à repérer ces cas.',
        en: 'Keep a list of customers who often refuse parcels and ask them for a MoMo deposit next time. Zuri’s order statuses help you spot them.',
      },
    ],
    productIdeas: [
      {
        fr: 'Produits de beauté et soins du corps, une catégorie souvent demandée à Douala et Yaoundé.',
        en: 'Beauty and body care products, a category often in demand in Douala and Yaoundé.',
      },
      {
        fr: 'Gadgets de cuisine et petit électroménager, faciles à démontrer en vidéo.',
        en: 'Kitchen gadgets and small appliances, easy to demonstrate on video.',
      },
      {
        fr: 'Montres, sacs et accessoires de mode, souvent achetés comme cadeaux.',
        en: 'Watches, bags and fashion accessories, often bought as gifts.',
      },
      {
        fr: 'Articles scolaires et cartables à l’approche de la rentrée de septembre.',
        en: 'School supplies and bags ahead of the September school year.',
      },
      {
        fr: 'Accessoires de téléphone et power banks, qui se vendent régulièrement.',
        en: 'Phone accessories and power banks, which tend to sell steadily.',
      },
      {
        fr: 'Formations et produits digitaux vendus par Mobile Money, de plus en plus recherchés.',
        en: 'Online courses and digital products sold through Mobile Money, increasingly popular.',
      },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Cameroun ?', en: 'How do I sell online in Cameroon?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute ton produit et ton offre, active le paiement à la livraison pour Douala et Yaoundé, puis lance ta pub Facebook ou TikTok. Fais confirmer chaque commande par téléphone avant de la confier au livreur.',
          en: 'Create your store on Zuri, add your product and offer, turn on cash on delivery for Douala and Yaoundé, then launch your Facebook or TikTok ad. Have every order confirmed by phone before handing it to the rider.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Cameroun ?', en: 'How do I accept Mobile Money in Cameroon?' },
        a: {
          fr: 'Ouvre un compte marchand PawaPay, qui prend en charge MTN et Orange au Cameroun, et connecte-le à Zuri. Le client paie depuis son téléphone et l’argent arrive sur ton compte PawaPay. Zuri ne garde jamais tes fonds.',
          en: 'Open a PawaPay merchant account, which supports MTN and Orange in Cameroon, and connect it to Zuri. The customer pays from their phone and the money lands in your PawaPay account. Zuri never holds your funds.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Cameroun ?', en: 'What product should I sell online in Cameroon?' },
        a: {
          fr: 'Beauté, cuisine, mode et accessoires de téléphone sont souvent demandés, mais la concurrence y est forte. Cherche un angle différent (meilleure vidéo, meilleure offre, page en anglais) et teste avant d’acheter du stock.',
          en: 'Beauty, kitchen, fashion and phone accessories are often in demand, but competition is tough. Find a different angle (better video, better offer, English page) and test before buying stock.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Cameroun ?', en: 'How does dropshipping work in Cameroon?' },
        a: {
          fr: 'Le dropshipping local est courant : un fournisseur à Douala stocke et livre, tu t’occupes de la pub et de la confirmation. Zuri te montre ton taux de confirmation, ton taux de livraison et le chiffre encaissé pour chaque produit.',
          en: 'Local dropshipping is common: a supplier in Douala stores and delivers, you handle ads and confirmation. Zuri shows your confirmation rate, delivery rate and cash collected for each product.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Cameroun ?', en: 'Is there a free online store builder in Cameroon?' },
        a: {
          fr: 'Oui : Zuri est gratuit pendant le lancement, avec 0 % de commission sur tes ventes et un sous-domaine offert. Tu peux importer tes produits depuis Shopify ou un fichier CSV si tu changes de plateforme.',
          en: 'Yes: Zuri is free during launch, with 0% commission on your sales and a free subdomain. You can import products from Shopify or a CSV file if you are switching platforms.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FedaPay : pays pris en charge (Cameroun absent)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'gabon',
    iso: 'GA',
    name: { fr: 'Gabon', en: 'Gabon' },
    inName: 'au Gabon',
    region: 'afrique-centrale',
    primaryLang: 'fr',
    currency: { code: 'XAF', label: { fr: 'franc CFA (XAF)', en: 'Central African CFA franc (XAF)' } },
    cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem'],
    mobileMoney: ['Airtel Money', 'Moov Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne au Gabon : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Gabon: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Gabon : boutique en ligne gratuite, paiement à la livraison à Libreville, Mobile Money Airtel et Moov via PawaPay. Pour le dropshipping.',
      en: 'Sell online in Gabon: free online store, cash on delivery in Libreville, Airtel and Moov Mobile Money through PawaPay. Built for local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne au Gabon, de Libreville à Port-Gentil',
      en: 'Sell online in Gabon, from Libreville to Port-Gentil',
    },
    intro: {
      fr: 'Au Gabon, beaucoup de produits viennent de l’étranger et les clients cherchent qui peut les livrer vite, sans mauvaise surprise. Avec Zuri, tu crées une page de vente claire, tu encaisses à la livraison ou par Airtel Money et Moov Money via PawaPay, et tu suis chaque commande jusqu’au paiement.',
      en: 'In Gabon, many products are imported and customers look for sellers who can deliver quickly with no bad surprises. With Zuri, you build a clear sales page, collect cash on delivery or Airtel Money and Moov Money through PawaPay, and follow every order until it is paid.',
    },
    market: [
      {
        fr: 'Libreville, avec Owendo et Akanda autour, regroupe la majorité des acheteurs en ligne. Port-Gentil est une autre ville importante, mais elle n’est pas reliée à la capitale par la route : les colis voyagent par bateau ou par avion, ce qui change ton organisation et tes délais. Franceville et Oyem demandent aussi un transport longue distance.',
        en: 'Libreville, with Owendo and Akanda around it, holds most online buyers. Port-Gentil is another major city, but it is not linked to the capital by road: parcels travel by boat or plane, which changes your logistics and timelines. Franceville and Oyem also need long-distance transport.',
      },
      {
        fr: 'Le marché est plus petit qu’au Cameroun ou en Côte d’Ivoire, mais les clients gabonais achètent volontiers en ligne quand ils ont confiance. Facebook et WhatsApp sont les canaux principaux, TikTok prend de la place. Le marché Mont-Bouët à Libreville reste un repère pour les prix : ton avantage, c’est la livraison à domicile et le service.',
        en: 'The market is smaller than Cameroon or Côte d’Ivoire, but Gabonese customers happily buy online once they trust you. Facebook and WhatsApp are the main channels, and TikTok is growing. Mont-Bouët market in Libreville is still a price reference, so your edge is home delivery and service.',
      },
      {
        fr: 'Le paiement à la livraison reste le choix par défaut. Airtel Money et Moov Money sont les deux grands portefeuilles mobiles. Parmi les prestataires intégrés à Zuri, PawaPay prend en charge le Gabon avec Airtel et Moov selon sa documentation : tu connectes ton compte et l’argent arrive chez toi.',
        en: 'Cash on delivery is still the default. Airtel Money and Moov Money are the two main mobile wallets. Among the providers built into Zuri, PawaPay supports Gabon with Airtel and Moov according to its documentation: you connect your account and the money comes straight to you.',
      },
      {
        fr: 'Comme beaucoup de produits sont importés, la question du stock compte : un client déçu par un délai trop long annule vite. Les vendeurs qui marchent bien gardent un petit stock à Libreville et annoncent des délais honnêtes. La livraison en ville se fait surtout en voiture ou à moto selon les quartiers.',
        en: 'Since many products are imported, stock matters: a customer let down by a long wait cancels quickly. Successful sellers keep a small stock in Libreville and give honest lead times. Delivery in town is done by car or motorbike depending on the area.',
      },
    ],
    tips: [
      {
        fr: 'Garde un stock local à Libreville pour tes produits phares et annonce « livré en 24 à 48 h » seulement si c’est vrai. La promesse tenue fait revenir le client.',
        en: 'Keep local stock in Libreville for your best sellers and only promise "delivered in 24 to 48 hours" if it is true. A kept promise brings the customer back.',
      },
      {
        fr: 'Pour Port-Gentil et l’intérieur, crée une zone Zuri à part avec des frais adaptés au bateau ou à l’avion, et demande un paiement Airtel Money ou Moov Money avant l’envoi.',
        en: 'For Port-Gentil and inland towns, create a separate Zuri zone with fees that match boat or air freight, and ask for Airtel Money or Moov Money payment before shipping.',
      },
      {
        fr: 'Mise sur la qualité perçue : belles photos réelles, emballage soigné, message de remerciement. Le client gabonais compare avec ce qu’il voit à l’étranger.',
        en: 'Focus on perceived quality: real, good-looking photos, careful packaging, a thank-you note. Gabonese customers compare with what they see abroad.',
      },
      {
        fr: 'Active la popup des ventes réelles et le stock limité seulement avec des données vraies. Sur un petit marché, le bouche à oreille punit vite les fausses promesses.',
        en: 'Turn on the real-sales popup and limited stock only with true data. In a small market, word of mouth quickly punishes fake claims.',
      },
      {
        fr: 'Fais confirmer chaque commande et note la bonne adresse avec un point de repère. À Libreville, un repère précis (carrefour, pharmacie, école) évite des allers-retours coûteux.',
        en: 'Confirm every order and write down the address with a landmark. In Libreville, a precise landmark (junction, pharmacy, school) saves costly back-and-forth trips.',
      },
      {
        fr: 'Prépare la fête de l’indépendance du 17 août, la rentrée scolaire et Noël. Lance tes pubs avant le pic et utilise un compte à rebours pour la date limite de livraison.',
        en: 'Plan for the 17 August independence day, back-to-school and Christmas. Launch ads before the peak and use a countdown for the last delivery date.',
      },
      {
        fr: 'Fidélise par WhatsApp avec des codes promo réservés aux anciens clients. Sur un marché de cette taille, chaque client fidèle compte.',
        en: 'Build loyalty on WhatsApp with promo codes for past customers. In a market this size, every loyal customer counts.',
      },
    ],
    productIdeas: [
      {
        fr: 'Cosmétiques, parfums et soins capillaires, souvent demandés à Libreville.',
        en: 'Cosmetics, perfumes and hair care, often requested in Libreville.',
      },
      {
        fr: 'Vêtements et chaussures de marque ou de bonne qualité, une demande fréquente vu l’offre locale limitée.',
        en: 'Branded or good-quality clothing and shoes, a frequent request given limited local supply.',
      },
      {
        fr: 'Petit électroménager et objets pour la maison, faciles à expliquer en vidéo.',
        en: 'Small appliances and home items, easy to explain on video.',
      },
      {
        fr: 'Accessoires high-tech (écouteurs, montres connectées, power banks), souvent recherchés.',
        en: 'Tech accessories (earbuds, smartwatches, power banks), often searched for.',
      },
      {
        fr: 'Produits pour bébé, appréciés par les parents qui veulent éviter les déplacements.',
        en: 'Baby products, valued by parents who want to avoid trips to the shops.',
      },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Gabon ?', en: 'How do I sell online in Gabon?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute tes produits et une zone Libreville avec le paiement à la livraison. Diffuse ta page sur Facebook et WhatsApp, et confirme chaque commande avec un point de repère précis avant de livrer.',
          en: 'Create your Zuri store, add your products and a Libreville zone with cash on delivery. Share your page on Facebook and WhatsApp, and confirm every order with a precise landmark before delivering.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Gabon ?', en: 'How do I accept Mobile Money in Gabon?' },
        a: {
          fr: 'Connecte ton compte PawaPay à Zuri. PawaPay prend en charge Airtel Money et Moov Money au Gabon. Le client paie depuis son téléphone et l’argent arrive sur ton compte marchand, pas chez Zuri.',
          en: 'Connect your PawaPay account to Zuri. PawaPay supports Airtel Money and Moov Money in Gabon. The customer pays from their phone and the money goes to your merchant account, not to Zuri.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Gabon ?', en: 'What product should I sell online in Gabon?' },
        a: {
          fr: 'Les produits importés de bonne qualité (beauté, mode, high-tech, maison) sont souvent demandés. Vérifie surtout que tu peux les avoir en stock à Libreville, car les longs délais font annuler.',
          en: 'Good-quality imported products (beauty, fashion, tech, home) are often in demand. Above all, make sure you can keep them in stock in Libreville, since long delays cause cancellations.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Gabon ?', en: 'How does dropshipping work in Gabon?' },
        a: {
          fr: 'Le dropshipping local fonctionne avec un fournisseur basé à Libreville. L’import direct depuis l’étranger commande par commande est risqué à cause des délais. Zuri t’aide à suivre les retours pour juger ton fournisseur.',
          en: 'Local dropshipping works with a supplier based in Libreville. Importing from abroad one order at a time is risky because of delays. Zuri helps you track returns so you can judge your supplier.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Gabon ?', en: 'Is there a free online store builder in Gabon?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec 0 % de commission et un sous-domaine offert. Tu peux aussi vendre des produits digitaux et ajouter un lien Chariow, Maketou ou Selar si tu en utilises déjà un.',
          en: 'Zuri is free during launch, with 0% commission and a free subdomain. You can also sell digital products and add a Chariow, Maketou or Selar link if you already use one.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FedaPay : pays pris en charge (Gabon absent)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'congo-brazzaville',
    iso: 'CG',
    name: { fr: 'Congo-Brazzaville', en: 'Republic of the Congo' },
    inName: 'au Congo-Brazzaville',
    region: 'afrique-centrale',
    primaryLang: 'fr',
    currency: { code: 'XAF', label: { fr: 'franc CFA (XAF)', en: 'Central African CFA franc (XAF)' } },
    cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie'],
    mobileMoney: ['MTN MoMo', 'Airtel Money'],
    zuriPsps: ['FeexPay', 'PawaPay'],
    title: {
      fr: 'Vendre en ligne au Congo-Brazzaville : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Congo-Brazzaville: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Congo-Brazzaville : boutique en ligne gratuite, paiement à la livraison et Mobile Money MTN ou Airtel. Idéal pour le dropshipping local.',
      en: 'Sell online in Congo-Brazzaville: free online store, cash on delivery and MTN or Airtel Mobile Money. Built for local dropshipping in Brazza.',
    },
    h1: {
      fr: 'Vendre en ligne au Congo-Brazzaville, de Brazza à Pointe-Noire',
      en: 'Sell online in Congo-Brazzaville, from Brazza to Pointe-Noire',
    },
    intro: {
      fr: 'Au Congo, le client veut voir le produit avant de payer, et il commande souvent depuis un lien Facebook ou WhatsApp. Avec Zuri, tu montes une boutique en ligne légère, tu prends les commandes en paiement à la livraison et tu peux encaisser par MTN MoMo ou Airtel Money via ton propre compte FeexPay ou PawaPay.',
      en: 'In Congo, buyers like to see the product before they pay, and most orders start from a Facebook post or a WhatsApp link. With Zuri you build a light online store, take cash on delivery orders and can collect MTN MoMo or Airtel Money through your own FeexPay or PawaPay account.',
    },
    market: [
      {
        fr: 'Le commerce en ligne au Congo-Brazzaville tourne autour de deux villes : Brazzaville, la capitale, et Pointe-Noire, la ville portuaire et pétrolière. Dolisie suit derrière. La plupart des vendeurs travaillent dans une seule ville au départ, parce que la livraison entre Brazza et Pointe-Noire coûte cher et prend du temps. Commence là où tu peux livrer vite, puis élargis.',
        en: 'Online selling in Congo-Brazzaville revolves around two cities: Brazzaville, the capital, and Pointe-Noire, the oil and port city. Dolisie comes next. Most sellers start in one city only, because shipping between Brazza and Pointe-Noire is slow and costly. Start where you can deliver fast, then expand.',
      },
      {
        fr: 'Le paiement à la livraison reste la norme. Le client commande, ton closer l’appelle pour confirmer, le livreur à moto ou en taxi apporte le colis et repart avec les francs CFA. Le risque, ce sont les clients injoignables et les colis refusés : chaque aller-retour inutile te coûte la course. Une confirmation par téléphone sérieuse avant d’expédier fait toute la différence.',
        en: 'Cash on delivery is still the norm. The customer orders, your closer calls to confirm, a rider on a motorbike or in a taxi brings the parcel and comes back with the CFA francs. The risk is unreachable customers and refused parcels: every wasted trip costs you the ride. A serious confirmation call before you ship makes all the difference.',
      },
      {
        fr: 'Côté Mobile Money, MTN MoMo et Airtel Money sont les deux portefeuilles que tout le monde connaît. Ils servent surtout à payer un acompte, les frais de livraison ou une commande d’un client qui ne sera pas chez lui. Le pays utilise le franc CFA d’Afrique centrale (XAF), ce qui simplifie l’affichage des prix.',
        en: 'For Mobile Money, MTN MoMo and Airtel Money are the two wallets everyone knows. People mostly use them for a deposit, the delivery fee, or to pay for an order when they will not be home. The country uses the Central African CFA franc (XAF), which keeps pricing simple.',
      },
      {
        fr: 'La vente se fait beaucoup sur Facebook, dans les groupes de vente et via les statuts WhatsApp, avec une montée de TikTok chez les plus jeunes. Les marchés comme Total à Bacongo ou le Grand Marché de Pointe-Noire restent des repères : beaucoup de clients comparent ce qu’ils voient en ligne avec les prix du marché. Ton offre doit donc être claire et ta page rassurante.',
        en: 'Selling happens mostly on Facebook, in buy and sell groups and through WhatsApp statuses, with TikTok growing among younger buyers. Physical markets remain a reference point: many customers compare what they see online with market prices. Your offer has to be clear and your page has to feel trustworthy.',
      },
    ],
    tips: [
      {
        fr: 'Commence par une seule ville. Dans Zuri, crée tes zones de livraison par quartier de Brazzaville (Poto-Poto, Bacongo, Moungali, Talangaï) avec des frais différents selon la distance.',
        en: 'Start with one city. In Zuri, set delivery zones by Brazzaville district (Poto-Poto, Bacongo, Moungali, Talangaï) with fees that match the distance.',
      },
      {
        fr: 'Fais appeler chaque commande dans l’heure. Avec l’équipe de closers et l’attribution automatique, la commande arrive directement chez un closer, qui la passe en « confirmée » ou « injoignable ».',
        en: 'Have every order called within the hour. With the closer team and automatic assignment, each order lands with a closer who marks it confirmed or unreachable.',
      },
      {
        fr: 'Pour Pointe-Noire, demande un petit acompte par MTN MoMo ou Airtel Money avant d’expédier depuis Brazza. Ça filtre les commandes pas sérieuses et couvre une partie du transport.',
        en: 'For Pointe-Noire, ask for a small deposit by MTN MoMo or Airtel Money before you ship from Brazza. It filters out non-serious orders and covers part of the transport.',
      },
      {
        fr: 'Installe ton pixel Facebook et l’API Conversions dès le premier jour. Tes pubs Facebook apprennent plus vite qui achète vraiment, même quand la connexion du client est lente.',
        en: 'Install your Facebook pixel and the Conversions API from day one. Your Facebook ads learn faster who actually buys, even when the customer’s connection is slow.',
      },
      {
        fr: 'Propose des packs : 1 produit, 2 produits avec remise, 3 produits avec livraison offerte. Le panier moyen monte et le coût de livraison pèse moins sur ta marge.',
        en: 'Offer bundles: one item, two with a discount, three with free delivery. Your average order goes up and delivery costs weigh less on your margin.',
      },
      {
        fr: 'Ajoute le bouton WhatsApp sur ta page produit. Beaucoup de Congolais veulent poser une question avant d’acheter, et une réponse rapide transforme souvent la visite en commande.',
        en: 'Add the WhatsApp button to your product page. Many buyers want to ask a question before ordering, and a quick reply often turns a visit into a sale.',
      },
      {
        fr: 'Suis ton taux de livraison, pas seulement tes commandes. Si beaucoup de colis sont retournés dans un quartier, augmente les frais ou exige un acompte pour cette zone.',
        en: 'Track your delivery rate, not just your orders. If many parcels come back from one area, raise the fee or require a deposit for that zone.',
      },
    ],
    productIdeas: [
      { fr: 'Ventilateurs rechargeables et petites lampes solaires, souvent demandés quand le courant coupe.', en: 'Rechargeable fans and small solar lamps, often asked for when the power goes out.' },
      { fr: 'Perruques, mèches et produits capillaires, une catégorie qui marche souvent bien sur Facebook.', en: 'Wigs, hair extensions and hair care, a category that often does well on Facebook.' },
      { fr: 'Accessoires de téléphone : écouteurs sans fil, power banks, coques.', en: 'Phone accessories: wireless earbuds, power banks, cases.' },
      { fr: 'Petits appareils de cuisine (mixeurs, friteuses à air), à présenter en vidéo.', en: 'Small kitchen appliances such as blenders and air fryers, best shown on video.' },
      { fr: 'Pagnes, tenues et sacs pour les fêtes et les cérémonies.', en: 'Wax fabrics, outfits and bags for celebrations and ceremonies.' },
      { fr: 'Produits de soin et de beauté, à condition de bien expliquer l’utilisation.', en: 'Skin care and beauty products, as long as you explain clearly how to use them.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Congo-Brazzaville ?', en: 'How do I sell online in Congo-Brazzaville?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute tes produits, fixe tes frais de livraison par ville ou par quartier, puis lance une pub Facebook ou TikTok vers ta page. Les commandes arrivent en paiement à la livraison, tes closers les confirment et ton livreur encaisse.',
          en: 'Create your store on Zuri, add your products, set delivery fees by city or district, then run a Facebook or TikTok ad to your page. Orders come in as cash on delivery, your closers confirm them and your rider collects the money.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Congo ?', en: 'How do I collect Mobile Money in Congo?' },
        a: {
          fr: 'Zuri se connecte à ton propre compte FeexPay ou PawaPay, qui gèrent MTN MoMo et Airtel Money au Congo-Brazzaville. L’argent va sur ton compte chez le prestataire : Zuri ne le touche jamais.',
          en: 'Zuri connects to your own FeexPay or PawaPay account, which handle MTN MoMo and Airtel Money in Congo-Brazzaville. The money goes to your account with the provider: Zuri never holds it.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Congo-Brazzaville ?', en: 'What should I sell online in Congo-Brazzaville?' },
        a: {
          fr: 'Cherche des produits qui règlent un problème du quotidien (coupures de courant, chaleur, beauté, cuisine) et qui se montrent bien en vidéo. Teste plusieurs produits avec un petit budget pub et garde ceux qui ont un bon taux de livraison.',
          en: 'Look for products that solve an everyday problem (power cuts, heat, beauty, cooking) and look good on video. Test several with a small ad budget and keep the ones with a good delivery rate.',
        },
      },
      {
        q: { fr: 'Peut-on faire du dropshipping au Congo-Brazzaville ?', en: 'Can I do dropshipping in Congo-Brazzaville?' },
        a: {
          fr: 'Oui, surtout le dropshipping local : tu travailles avec un fournisseur qui a du stock à Brazza ou Pointe-Noire, et tu t’occupes de la boutique, de la pub et de la confirmation. Les délais d’import trop longs font fuir le client COD.',
          en: 'Yes, especially local dropshipping: you work with a supplier who holds stock in Brazza or Pointe-Noire, and you handle the store, the ads and the confirmation calls. Long import delays tend to kill cash on delivery orders.',
        },
      },
      {
        q: { fr: 'Zuri est-il un site de vente en ligne gratuit au Congo ?', en: 'Is Zuri a free online store in Congo?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert et 0 % de commission sur tes ventes. Tu paies seulement les frais de ton prestataire de paiement si tu encaisses par Mobile Money.',
          en: 'Zuri is free during the launch period, with a free subdomain and 0% commission on your sales. You only pay your payment provider’s fees if you collect by Mobile Money.',
        },
      },
    ],
    sources: [
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'rd-congo',
    iso: 'CD',
    name: { fr: 'RD Congo', en: 'DR Congo' },
    inName: 'en RD Congo',
    region: 'afrique-centrale',
    primaryLang: 'fr',
    currency: { code: 'CDF', label: { fr: 'franc congolais (CDF), dollar US très utilisé', en: 'Congolese franc (CDF), with US dollars widely used' } },
    cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Mbuji-Mayi', 'Kisangani'],
    mobileMoney: ['M-Pesa (Vodacom)', 'Airtel Money', 'Orange Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne en RD Congo : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in DR Congo: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en RD Congo : boutique en ligne gratuite, prix en francs ou en dollars, paiement à la livraison et Mobile Money M-Pesa, Airtel, Orange.',
      en: 'Sell online in DR Congo: free online store, prices in francs or dollars, cash on delivery and Mobile Money via M-Pesa, Airtel and Orange. Start today.',
    },
    h1: {
      fr: 'Vendre en ligne en RD Congo, en francs ou en dollars',
      en: 'Sell online in DR Congo, in francs or in dollars',
    },
    intro: {
      fr: 'À Kinshasa comme à Lubumbashi, on achète en ligne comme on achète au marché : on regarde, on négocie sur WhatsApp, on paie quand le colis arrive. Zuri te donne une boutique en ligne rapide, affichée en francs congolais ou en dollars, avec paiement à la livraison et Mobile Money via ton compte PawaPay.',
      en: 'In Kinshasa and Lubumbashi alike, people shop online the way they shop at the market: look, chat on WhatsApp, pay when the parcel arrives. Zuri gives you a fast online store priced in Congolese francs or US dollars, with cash on delivery and Mobile Money through your own PawaPay account.',
    },
    market: [
      {
        fr: 'La RD Congo est immense, et le e-commerce se joue ville par ville. Kinshasa concentre la plus grosse demande, avec des communes très différentes : Gombe, Limete, Ngaliema, Lemba, Masina. Lubumbashi et Goma ont leurs propres circuits, souvent liés à la Zambie, à la Tanzanie ou au Rwanda pour l’approvisionnement. Pense ta logistique par ville, pas par pays.',
        en: 'DR Congo is huge, and e-commerce plays out city by city. Kinshasa has the biggest demand, with very different communes such as Gombe, Limete, Ngaliema, Lemba and Masina. Lubumbashi and Goma have their own supply routes, often through Zambia, Tanzania or Rwanda. Plan your logistics city by city, not for the whole country.',
      },
      {
        fr: 'La particularité congolaise, c’est la double monnaie. Les petits achats se paient souvent en francs congolais, les produits plus chers (téléphones, électroménager) en dollars. Zuri gère les deux devises : choisis celle que tes clients utilisent pour ton type de produit, et reste cohérent sur la page et à la livraison.',
        en: 'The Congolese twist is the dual currency. Small purchases are often paid in Congolese francs, pricier items such as phones and appliances in US dollars. Zuri handles both currencies: pick the one your customers use for your type of product, and stay consistent on the page and at the door.',
      },
      {
        fr: 'Le paiement à la livraison domine. Les livreurs à moto se faufilent dans les embouteillages de Kinshasa, mais les adresses précises manquent souvent : le livreur appelle le client et se fait guider jusqu’à un repère (une église, une pharmacie, un arrêt). Un client injoignable, c’est une course perdue. D’où l’importance de bien confirmer le numéro et le repère avant d’expédier.',
        en: 'Cash on delivery dominates. Motorbike riders weave through Kinshasa traffic, but precise addresses are often missing: the rider calls the customer and gets guided to a landmark such as a church, a pharmacy or a bus stop. An unreachable customer means a wasted trip, so confirm the phone number and the landmark before you ship.',
      },
      {
        fr: 'M-Pesa de Vodacom, Airtel Money et Orange Money sont les portefeuilles les plus utilisés, et ils fonctionnent en francs comme en dollars. Pour la vente, Facebook et WhatsApp restent les canaux principaux, TikTok prend de la place, et beaucoup de vendeurs gèrent des groupes WhatsApp de clients fidèles.',
        en: 'Vodacom M-Pesa, Airtel Money and Orange Money are the most used wallets, and they work in both francs and dollars. For selling, Facebook and WhatsApp remain the main channels, TikTok is growing, and many sellers run WhatsApp groups of loyal customers.',
      },
    ],
    tips: [
      {
        fr: 'Dans ton formulaire de commande, rends le champ « repère » obligatoire (près de quelle église, école ou station). Ton livreur gagnera un temps fou et tu perdras moins de colis.',
        en: 'In your order form, make a landmark field required (near which church, school or fuel station). Your rider will save a lot of time and you will lose fewer parcels.',
      },
      {
        fr: 'Choisis une devise par boutique. Électronique et électroménager en dollars, cosmétiques et petits produits en francs congolais : avec le multi-boutiques de Zuri, tu peux séparer les deux.',
        en: 'Pick one currency per store. Electronics and appliances in dollars, cosmetics and small items in Congolese francs: with Zuri multi-store, you can keep them separate.',
      },
      {
        fr: 'Découpe Kinshasa en zones de livraison. Gombe et Limete n’ont pas le même coût que Kimbanseke ou Maluku : fixe des frais par zone dans Zuri pour ne pas livrer à perte.',
        en: 'Split Kinshasa into delivery zones. Gombe and Limete do not cost the same as Kimbanseke or Maluku: set fees per zone in Zuri so you never deliver at a loss.',
      },
      {
        fr: 'Pour les commandes en dollars au-delà d’un certain montant, demande un acompte par M-Pesa, Airtel Money ou Orange Money via ton compte PawaPay. Les clients sérieux acceptent volontiers.',
        en: 'For larger dollar orders, ask for a deposit by M-Pesa, Airtel Money or Orange Money through your PawaPay account. Serious customers usually agree.',
      },
      {
        fr: 'Tes closers doivent parler comme tes clients : français, lingala à Kinshasa, swahili à Lubumbashi et Goma. Attribue les commandes par ville à des closers différents.',
        en: 'Your closers should speak like your customers: French, Lingala in Kinshasa, Swahili in Lubumbashi and Goma. Assign orders by city to different closers.',
      },
      {
        fr: 'Filme ton produit dans un vrai décor congolais pour tes pubs TikTok et Facebook. Une vidéo simple tournée à Kin rassure plus qu’une photo de fournisseur.',
        en: 'Film your product in a real local setting for your TikTok and Facebook ads. A simple video shot in Kinshasa builds more trust than a supplier photo.',
      },
      {
        fr: 'Active la relance panier abandonné : beaucoup de visiteurs remplissent le formulaire à moitié quand le réseau saute. Un rappel les ramène sur la commande.',
        en: 'Turn on abandoned cart recovery: many visitors fill half the form when the network drops. A reminder brings them back to finish the order.',
      },
      {
        fr: 'Prépare les fêtes : Noël, le Nouvel An et la fête de l’Indépendance du 30 juin sont des moments où les gens achètent tenues et cadeaux. Lance tes offres une à deux semaines avant.',
        en: 'Plan for the holidays: Christmas, New Year and Independence Day on 30 June are times when people buy outfits and gifts. Launch your offers one or two weeks ahead.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires et gadgets de téléphone, souvent demandés à Kinshasa.', en: 'Phone accessories and gadgets, often in demand in Kinshasa.' },
      { fr: 'Lampes, ventilateurs et kits solaires rechargeables, utiles avec les délestages.', en: 'Rechargeable lamps, fans and solar kits, useful with power cuts.' },
      { fr: 'Mode homme et femme : chemises, robes, chaussures pour les sorties et les cérémonies.', en: 'Men’s and women’s fashion: shirts, dresses and shoes for nights out and ceremonies.' },
      { fr: 'Cosmétiques, perruques et soins capillaires.', en: 'Cosmetics, wigs and hair care.' },
      { fr: 'Petit électroménager vendu en dollars (blenders, fers à repasser, plaques).', en: 'Small appliances sold in dollars, such as blenders, irons and hot plates.' },
      { fr: 'Articles pour bébés et enfants, avec une bonne explication des tailles.', en: 'Baby and kids’ items, with clear size guidance.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en RD Congo ?', en: 'How do I sell online in DR Congo?' },
        a: {
          fr: 'Ouvre ta boutique Zuri, choisis francs congolais ou dollars, ajoute tes produits et tes zones de livraison, puis envoie du trafic avec Facebook, TikTok et WhatsApp. Le client commande en paiement à la livraison, ton closer confirme, le livreur encaisse.',
          en: 'Open your Zuri store, pick Congolese francs or dollars, add products and delivery zones, then drive traffic with Facebook, TikTok and WhatsApp. The customer orders with cash on delivery, your closer confirms and the rider collects.',
        },
      },
      {
        q: { fr: 'Peut-on afficher les prix en dollars en RDC ?', en: 'Can I show prices in dollars in DR Congo?' },
        a: {
          fr: 'Oui. Zuri gère le franc congolais (CDF) et le dollar US (USD). Beaucoup de vendeurs mettent l’électronique en dollars et les petits produits en francs.',
          en: 'Yes. Zuri supports the Congolese franc (CDF) and the US dollar (USD). Many sellers price electronics in dollars and small items in francs.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money en RD Congo ?', en: 'How do I collect Mobile Money in DR Congo?' },
        a: {
          fr: 'Connecte ton compte PawaPay à Zuri : il prend en charge M-Pesa (Vodacom), Airtel Money et Orange Money en RDC. L’argent arrive sur ton compte PawaPay, jamais chez Zuri.',
          en: 'Connect your PawaPay account to Zuri: it supports Vodacom M-Pesa, Airtel Money and Orange Money in DR Congo. The money lands in your PawaPay account, never with Zuri.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en RD Congo ?', en: 'How do I do dropshipping in DR Congo?' },
        a: {
          fr: 'Le plus sûr est le dropshipping local : trouve un grossiste à Kinshasa ou Lubumbashi qui garde le stock, vends sur ta boutique Zuri et organise la livraison avec lui. Importe ensuite toi-même les produits qui se vendent bien.',
          en: 'The safest route is local dropshipping: find a wholesaler in Kinshasa or Lubumbashi who holds the stock, sell on your Zuri store and organise delivery with them. Later, import the winners yourself.',
        },
      },
      {
        q: { fr: 'Quel site de vente en ligne gratuit en RDC ?', en: 'Is there a free online store builder for DR Congo?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine offert. Tes pages sont légères (environ 23 Ko de JavaScript), donc elles s’ouvrent même sur une connexion faible.',
          en: 'Zuri is free during the launch period, with no commission on your sales and a free subdomain. Your pages are light (around 23 KB of JavaScript), so they open even on a weak connection.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'tchad',
    iso: 'TD',
    name: { fr: 'Tchad', en: 'Chad' },
    inName: 'au Tchad',
    region: 'afrique-centrale',
    primaryLang: 'fr',
    currency: { code: 'XAF', label: { fr: 'franc CFA (XAF)', en: 'Central African CFA franc (XAF)' } },
    cities: ['N’Djamena', 'Moundou', 'Abéché', 'Sarh'],
    mobileMoney: ['Airtel Money', 'Moov Money'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne au Tchad : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Chad: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Tchad : boutique en ligne gratuite en francs CFA, commandes en paiement à la livraison, closers et livraison à N’Djamena.',
      en: 'Sell online in Chad: free online store in CFA francs, cash on delivery orders, closers and delivery zones in N’Djamena. Zero commission, built for 3G.',
    },
    h1: {
      fr: 'Vendre en ligne au Tchad, en commençant par N’Djamena',
      en: 'Sell online in Chad, starting with N’Djamena',
    },
    intro: {
      fr: 'Au Tchad, la vente en ligne passe par Facebook et WhatsApp, et presque tout se règle en espèces à la livraison. Zuri te donne une boutique simple et rapide pour prendre ces commandes proprement, les faire confirmer par tes closers et suivre ce qui est vraiment livré.',
      en: 'In Chad, online selling runs through Facebook and WhatsApp, and almost everything is paid in cash on delivery. Zuri gives you a simple, fast store to capture those orders cleanly, have your closers confirm them and track what actually gets delivered.',
    },
    market: [
      {
        fr: 'Le e-commerce tchadien est encore jeune et très concentré à N’Djamena. Les quartiers comme Moursal, Chagoua, Klemat ou Farcha ont chacun leurs habitudes, et la plupart des vendeurs en ligne livrent d’abord dans la capitale. Moundou, Abéché et Sarh se servent plutôt par envoi via les compagnies de transport, ce qui demande plus d’organisation.',
        en: 'Chadian e-commerce is still young and very focused on N’Djamena. Districts such as Moursal, Chagoua, Klemat and Farcha each have their own habits, and most online sellers deliver in the capital first. Moundou, Abéché and Sarh are usually served by sending parcels with bus and transport companies, which takes more planning.',
      },
      {
        fr: 'Le paiement à la livraison est la règle. Le client veut toucher le produit, et il paie le livreur en francs CFA. La confiance se gagne avec une page claire, des photos réelles et un numéro joignable. Les commandes non confirmées finissent souvent en colis refusé, donc l’appel avant expédition n’est pas une option.',
        en: 'Cash on delivery is the rule. Customers want to hold the product, and they pay the rider in CFA francs. Trust comes from a clear page, real photos and a phone number that answers. Unconfirmed orders often end up as refused parcels, so the call before shipping is not optional.',
      },
      {
        fr: 'Airtel Money et Moov Money sont les portefeuilles mobiles connus au Tchad. Attention : aucun des prestataires intégrés à Zuri (FeexPay, FedaPay, PayDunya, PawaPay) ne couvre le Tchad aujourd’hui. Concrètement, tu vends en paiement à la livraison, et si un client préfère payer avant, il t’envoie le montant sur ton numéro Airtel Money ou Moov Money, puis tu passes la commande en confirmée à la main.',
        en: 'Airtel Money and Moov Money are the known mobile wallets in Chad. Be aware: none of the providers built into Zuri (FeexPay, FedaPay, PayDunya, PawaPay) covers Chad today. In practice, you sell with cash on delivery, and if a customer prefers to pay first, they send the amount to your Airtel Money or Moov Money number and you mark the order as confirmed by hand.',
      },
      {
        fr: 'Le calendrier compte beaucoup. Le Ramadan, la Korité et la Tabaski font bouger les ventes de vêtements, de parfums, d’encens et d’articles pour la maison. Noël et la fête nationale du 11 août comptent aussi. Prépare ton stock et tes pubs avant ces périodes, quand les livreurs sont aussi plus demandés.',
        en: 'The calendar matters a lot. Ramadan, Eid al-Fitr and Tabaski drive sales of clothing, perfume, incense and home goods. Christmas and the national day on 11 August count too. Prepare stock and ads ahead of these periods, when riders are also in higher demand.',
      },
    ],
    tips: [
      {
        fr: 'Écris ta page en français simple et ajoute un bouton WhatsApp : beaucoup de clients préfèrent poser leur question en message vocal, parfois en arabe tchadien. Une réponse rapide rassure.',
        en: 'Write your page in plain French and add a WhatsApp button: many customers prefer to ask by voice note, sometimes in Chadian Arabic. A quick reply builds trust.',
      },
      {
        fr: 'Crée tes zones de livraison à N’Djamena avec des frais par quartier, et une zone « envoi en province » avec un tarif à part pour Moundou, Abéché ou Sarh.',
        en: 'Set up N’Djamena delivery zones with fees per district, plus a separate “upcountry shipping” zone for Moundou, Abéché or Sarh.',
      },
      {
        fr: 'Pour les envois en province, demande au client de payer la livraison d’avance sur ton numéro Mobile Money. Tu évites de payer le transport d’un colis qui reviendra.',
        en: 'For upcountry orders, ask the customer to pay the delivery fee upfront to your Mobile Money number. You avoid paying transport on a parcel that comes back.',
      },
      {
        fr: 'Utilise les statuts COD de Zuri (nouvelle, injoignable, confirmée, expédiée, livrée, retournée) pour voir quel closer confirme le mieux et quel livreur ramène le plus d’argent.',
        en: 'Use Zuri’s cash on delivery statuses (new, unreachable, confirmed, shipped, delivered, returned) to see which closer confirms best and which rider brings back the most cash.',
      },
      {
        fr: 'Garde des vidéos courtes et légères pour tes pubs Facebook. Le réseau est parfois lent : une page Zuri qui charge vite évite de perdre le client entre la pub et le formulaire.',
        en: 'Keep your Facebook ad videos short and light. The network can be slow: a fast Zuri page keeps you from losing the customer between the ad and the form.',
      },
      {
        fr: 'Avant la Tabaski et le Ramadan, active le compte à rebours et le stock limité sur tes offres. Les gens achètent tôt pour les fêtes, et l’urgence aide à décider.',
        en: 'Before Tabaski and Ramadan, turn on the countdown timer and limited stock on your offers. People shop early for the holidays, and urgency helps them decide.',
      },
      {
        fr: 'Commence avec peu de références. Deux ou trois produits bien présentés avec des packs par quantité marchent souvent mieux qu’un catalogue entier.',
        en: 'Start with a few products. Two or three well-presented items with quantity bundles often work better than a full catalogue.',
      },
    ],
    productIdeas: [
      { fr: 'Parfums, encens et diffuseurs, souvent demandés autour des fêtes religieuses.', en: 'Perfume, incense and diffusers, often in demand around religious holidays.' },
      { fr: 'Ventilateurs rechargeables et glacières, utiles pendant les fortes chaleurs.', en: 'Rechargeable fans and cool boxes, handy during the hottest months.' },
      { fr: 'Tenues traditionnelles, voiles et boubous pour la Korité et la Tabaski.', en: 'Traditional outfits, veils and boubous for Eid and Tabaski.' },
      { fr: 'Accessoires de téléphone et power banks.', en: 'Phone accessories and power banks.' },
      { fr: 'Ustensiles et petits appareils de cuisine pour la maison.', en: 'Kitchen tools and small appliances for the home.' },
      { fr: 'Soins de la peau et cosmétiques adaptés au climat sec.', en: 'Skin care and cosmetics suited to a dry climate.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Tchad ?', en: 'How do I sell online in Chad?' },
        a: {
          fr: 'Crée ta boutique Zuri en francs CFA, ajoute tes produits et tes frais de livraison à N’Djamena, puis fais de la pub sur Facebook ou TikTok. Les clients commandent en paiement à la livraison, tes closers confirment par téléphone, ton livreur encaisse.',
          en: 'Create your Zuri store in CFA francs, add products and N’Djamena delivery fees, then advertise on Facebook or TikTok. Customers order with cash on delivery, your closers confirm by phone and your rider collects.',
        },
      },
      {
        q: { fr: 'Peut-on encaisser par Mobile Money au Tchad avec Zuri ?', en: 'Can I collect Mobile Money in Chad with Zuri?' },
        a: {
          fr: 'Pas automatiquement pour l’instant : aucun prestataire intégré à Zuri ne couvre le Tchad. Tu peux recevoir un paiement Airtel Money ou Moov Money directement sur ton numéro, hors Zuri, puis confirmer la commande à la main.',
          en: 'Not automatically for now: no provider built into Zuri covers Chad. You can receive an Airtel Money or Moov Money payment directly on your number, outside Zuri, then confirm the order by hand.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Tchad ?', en: 'What should I sell online in Chad?' },
        a: {
          fr: 'Regarde ce qui se vend pendant les fêtes (parfums, tenues, cuisine) et ce qui aide contre la chaleur. Teste avec un petit budget et garde les produits qui se livrent bien, pas seulement ceux qui reçoivent des commandes.',
          en: 'Look at what sells during holidays (perfume, outfits, kitchen goods) and what helps with the heat. Test with a small budget and keep the products that get delivered, not just ordered.',
        },
      },
      {
        q: { fr: 'Zuri est-il gratuit au Tchad ?', en: 'Is Zuri free in Chad?' },
        a: {
          fr: 'Oui, Zuri est gratuit pendant le lancement, sans commission sur tes ventes et avec un sous-domaine offert. Tu peux ouvrir ta boutique et vendre en paiement à la livraison dès aujourd’hui.',
          en: 'Yes, Zuri is free during the launch period, with no commission on your sales and a free subdomain. You can open your store and sell with cash on delivery today.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays (Tchad non listé)', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'FedaPay : pays pris en charge (Tchad non listé)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'centrafrique',
    iso: 'CF',
    name: { fr: 'Centrafrique', en: 'Central African Republic' },
    inName: 'en Centrafrique',
    region: 'afrique-centrale',
    primaryLang: 'fr',
    currency: { code: 'XAF', label: { fr: 'franc CFA (XAF)', en: 'Central African CFA franc (XAF)' } },
    cities: ['Bangui', 'Bimbo', 'Berbérati'],
    mobileMoney: ['Orange Money'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne en Centrafrique : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in the Central African Republic: store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Centrafrique : boutique en ligne gratuite en francs CFA, commandes en paiement à la livraison à Bangui, page légère faite pour la 3G.',
      en: 'Sell online in the Central African Republic: free online store in CFA francs, cash on delivery orders in Bangui and a light page made for 3G networks.',
    },
    h1: {
      fr: 'Vendre en ligne en Centrafrique, à Bangui et autour',
      en: 'Sell online in the Central African Republic, in and around Bangui',
    },
    intro: {
      fr: 'En Centrafrique, la vente en ligne reste un petit marché, surtout à Bangui, où les vendeurs passent par Facebook et WhatsApp. Si tu veux te démarquer, une vraie boutique en ligne avec un formulaire de commande en paiement à la livraison te donne un air sérieux que peu de concurrents ont.',
      en: 'In the Central African Republic, online selling is still a small market, mostly in Bangui, where sellers work through Facebook and WhatsApp. If you want to stand out, a real online store with a cash on delivery order form makes you look more serious than most competitors.',
    },
    market: [
      {
        fr: 'Bangui et sa voisine Bimbo concentrent l’essentiel des acheteurs en ligne. Les vendeurs y livrent eux-mêmes ou avec des taxis-motos, quartier par quartier, du PK5 au centre-ville. En dehors de la capitale, l’envoi de colis est plus compliqué, et il vaut mieux commencer par Bangui avant de penser aux provinces comme Berbérati.',
        en: 'Bangui and neighbouring Bimbo hold most of the online buyers. Sellers deliver themselves or with motorbike taxis, district by district, from PK5 to the city centre. Outside the capital, shipping is harder, so start with Bangui before thinking about towns such as Berbérati.',
      },
      {
        fr: 'Ici, la confiance passe avant tout. Les clients achètent à des gens qu’ils peuvent appeler, et ils paient en espèces quand ils voient le produit. Le paiement à la livraison n’est pas un choix, c’est la base. Ton travail : des photos réelles, un prix clair, une livraison rapide et un appel de confirmation avant chaque départ.',
        en: 'Trust comes first here. Customers buy from people they can call, and they pay cash when they see the product. Cash on delivery is not a choice, it is the baseline. Your job: real photos, a clear price, fast delivery and a confirmation call before every trip.',
      },
      {
        fr: 'Orange Money est le portefeuille mobile le plus connu en Centrafrique. Mais sois au courant : aucun prestataire intégré à Zuri (FeexPay, FedaPay, PayDunya, PawaPay) ne couvre le pays. Tu ne peux donc pas encaisser automatiquement par Mobile Money via Zuri. Si un client veut payer à l’avance, il t’envoie l’argent sur ton numéro, et tu confirmes la commande toi-même.',
        en: 'Orange Money is the best-known mobile wallet in the Central African Republic. But be aware: no provider built into Zuri (FeexPay, FedaPay, PayDunya, PawaPay) covers the country. So you cannot collect Mobile Money automatically through Zuri. If a customer wants to pay ahead, they send money to your number and you confirm the order yourself.',
      },
      {
        fr: 'La connexion internet peut être lente et chère, ce qui rend le poids des pages important. Une page Zuri pèse environ 23 Ko de JavaScript, elle s’ouvre vite même avec peu de réseau. Les fêtes de fin d’année et la fête nationale du 1er décembre sont des moments où les achats de vêtements et de cadeaux augmentent.',
        en: 'Internet can be slow and expensive, so page weight matters. A Zuri page carries around 23 KB of JavaScript, so it opens quickly even on a weak signal. The end-of-year holidays and the national day on 1 December are times when clothing and gift purchases pick up.',
      },
    ],
    tips: [
      {
        fr: 'Montre ton visage ou ta boutique physique dans tes publications Facebook. À Bangui, savoir qui vend compte autant que le produit.',
        en: 'Show your face or your physical shop in your Facebook posts. In Bangui, knowing who sells matters as much as the product.',
      },
      {
        fr: 'Garde un formulaire de commande très court : nom, téléphone, quartier et repère. Plus il est court, plus il est rempli, surtout sur un téléphone d’entrée de gamme.',
        en: 'Keep your order form very short: name, phone, district and landmark. The shorter it is, the more it gets filled in, especially on an entry-level phone.',
      },
      {
        fr: 'Fixe tes frais de livraison par zone dans Zuri : centre-ville, quartiers périphériques, Bimbo. Tes clients voient le prix total avant de commander, donc moins de disputes à la porte.',
        en: 'Set delivery fees by zone in Zuri: city centre, outer districts, Bimbo. Customers see the total before ordering, so fewer arguments at the door.',
      },
      {
        fr: 'Appelle chaque commande avant de sortir le colis, et passe-la en « injoignable » après deux essais. Tu évites de payer des courses pour rien.',
        en: 'Call every order before the parcel leaves, and mark it unreachable after two attempts. You avoid paying for wasted trips.',
      },
      {
        fr: 'Réponds sur WhatsApp avec des messages vocaux, en français ou en sango selon ton client. Le bouton WhatsApp de Zuri ouvre la conversation directement depuis la page produit.',
        en: 'Reply on WhatsApp with voice notes, in French or Sango depending on the customer. Zuri’s WhatsApp button opens the chat straight from the product page.',
      },
      {
        fr: 'Pour les produits chers, demande un acompte par Orange Money sur ton numéro avant d’acheter le stock. Ça protège ta trésorerie.',
        en: 'For expensive items, ask for an Orange Money deposit to your number before you buy the stock. It protects your cash flow.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires de téléphone et power banks, souvent demandés.', en: 'Phone accessories and power banks, often in demand.' },
      { fr: 'Lampes solaires et ventilateurs rechargeables.', en: 'Solar lamps and rechargeable fans.' },
      { fr: 'Vêtements, chaussures et sacs, surtout avant les fêtes de fin d’année.', en: 'Clothes, shoes and bags, especially before the end-of-year holidays.' },
      { fr: 'Cosmétiques et produits capillaires.', en: 'Cosmetics and hair products.' },
      { fr: 'Petits articles de cuisine pratiques.', en: 'Handy small kitchen items.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Centrafrique ?', en: 'How do I sell online in the Central African Republic?' },
        a: {
          fr: 'Ouvre ta boutique Zuri en francs CFA, ajoute quelques produits et tes zones de livraison à Bangui, puis partage ton lien sur Facebook et WhatsApp. Les commandes arrivent en paiement à la livraison et tu les confirmes par téléphone.',
          en: 'Open your Zuri store in CFA francs, add a few products and your Bangui delivery zones, then share your link on Facebook and WhatsApp. Orders arrive as cash on delivery and you confirm them by phone.',
        },
      },
      {
        q: { fr: 'Puis-je encaisser par Mobile Money en Centrafrique avec Zuri ?', en: 'Can I collect Mobile Money in the Central African Republic with Zuri?' },
        a: {
          fr: 'Pas de façon automatique : aucun prestataire intégré à Zuri ne couvre le pays pour le moment. Le paiement à la livraison fonctionne, et tu peux recevoir un paiement Orange Money sur ton propre numéro en dehors de Zuri.',
          en: 'Not automatically: no provider built into Zuri covers the country for now. Cash on delivery works, and you can receive an Orange Money payment on your own number outside Zuri.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne à Bangui ?', en: 'What should I sell online in Bangui?' },
        a: {
          fr: 'Des produits utiles au quotidien, faciles à livrer et à expliquer : accessoires de téléphone, éclairage, mode, beauté. Commence petit, observe ce qui est réellement livré et payé, puis augmente ton stock.',
          en: 'Everyday products that are easy to deliver and explain: phone accessories, lighting, fashion, beauty. Start small, watch what actually gets delivered and paid, then grow your stock.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Centrafrique ?', en: 'Is there a free online store option in the Central African Republic?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert et sans commission sur tes ventes. Tu as une vraie boutique, pas seulement une page Facebook.',
          en: 'Zuri is free during the launch period, with a free subdomain and no commission on your sales. You get a real store, not just a Facebook page.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays (Centrafrique non listée)', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'FedaPay : pays pris en charge (Centrafrique non listée)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'madagascar',
    iso: 'MG',
    name: { fr: 'Madagascar', en: 'Madagascar' },
    inName: 'à Madagascar',
    region: 'ocean-indien',
    primaryLang: 'fr',
    currency: { code: 'MGA', label: { fr: 'ariary (MGA), prix affichés en USD ou EUR sur Zuri', en: 'Malagasy ariary (MGA), prices shown in USD or EUR on Zuri' } },
    cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Mahajanga', 'Fianarantsoa'],
    mobileMoney: ['MVola', 'Orange Money', 'Airtel Money'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne à Madagascar : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Madagascar: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne à Madagascar : boutique en ligne gratuite, commandes en paiement à la livraison à Tana, closers et pub Facebook. Sans commission.',
      en: 'Sell online in Madagascar: free online store, cash on delivery orders in Tana, closers and Facebook ads tracking. Zero commission on your sales.',
    },
    h1: {
      fr: 'Vendre en ligne à Madagascar, de Tana à Toamasina',
      en: 'Sell online in Madagascar, from Tana to Toamasina',
    },
    intro: {
      fr: 'À Madagascar, Facebook est la grande place du marché en ligne : on y découvre les produits, on commente « prix ? » et on se fait livrer à Tana. Zuri transforme ces commentaires en vraies commandes, avec un formulaire en paiement à la livraison, des closers et un suivi clair de ce qui est livré.',
      en: 'In Madagascar, Facebook is the big online marketplace: people discover products there, comment “price?” and get delivered in Tana. Zuri turns those comments into real orders, with a cash on delivery form, closers and clear tracking of what gets delivered.',
    },
    market: [
      {
        fr: 'Antananarivo, que tout le monde appelle Tana, concentre la majorité des ventes en ligne. Les vendeurs livrent dans les différents arrondissements, souvent à moto ou en taxi, avec des créneaux horaires pour éviter les embouteillages. Toamasina, Antsirabe et Mahajanga se développent, mais les envois en province se font surtout par taxi-brousse et coopératives de transport, avec des délais plus longs.',
        en: 'Antananarivo, which everyone calls Tana, holds most online sales. Sellers deliver across the city districts, often by motorbike or taxi, with time slots to avoid traffic jams. Toamasina, Antsirabe and Mahajanga are growing, but upcountry shipping mostly goes by taxi-brousse and transport cooperatives, with longer delays.',
      },
      {
        fr: 'La vente sur Facebook a ses codes : publication avec photos, commentaires, puis échange en message privé. Beaucoup de pages de vente font aussi des lives. Le paiement à la livraison est très courant à Tana. En province, l’usage est plutôt de payer d’avance par Mobile Money avant l’envoi, parce que personne ne veut payer un taxi-brousse pour un colis refusé.',
        en: 'Selling on Facebook has its own codes: a post with photos, comments, then a private message exchange. Many shop pages also go live. Cash on delivery is very common in Tana. Upcountry, people usually pay ahead by Mobile Money before shipping, because nobody wants to pay a taxi-brousse for a refused parcel.',
      },
      {
        fr: 'MVola de Telma est le portefeuille mobile le plus répandu, devant Orange Money et Airtel Money. Point important pour être honnête : aucun prestataire intégré à Zuri ne couvre Madagascar, et l’ariary ne fait pas partie des devises gérées par Zuri. Tu affiches donc tes prix en euros ou en dollars, ou tu précises le prix en ariary dans la description, et l’encaissement MVola se fait sur ton numéro, en dehors de Zuri.',
        en: 'Telma’s MVola is the most widespread mobile wallet, ahead of Orange Money and Airtel Money. To be honest about it: no provider built into Zuri covers Madagascar, and the ariary is not one of the currencies Zuri handles. So you show prices in euros or dollars, or state the ariary price in the description, and MVola payments go to your number, outside Zuri.',
      },
      {
        fr: 'Côté saisons, la fête de l’Indépendance du 26 juin est un temps fort pour les vêtements et les sorties en famille, tout comme Noël et la rentrée scolaire. Les clients suivent beaucoup les pages qui publient régulièrement : la constance compte plus qu’un gros coup de pub isolé.',
        en: 'Seasonally, Independence Day on 26 June is a big moment for clothing and family outings, as are Christmas and back to school. Customers follow pages that post regularly: consistency matters more than one big isolated ad push.',
      },
    ],
    tips: [
      {
        fr: 'Remplace le « prix en MP » par un lien vers ta page Zuri en commentaire. Le client voit le prix, les photos et commande seul, sans attendre ta réponse.',
        en: 'Replace “price in DM” with a link to your Zuri page in the comments. The customer sees the price and photos and orders alone, without waiting for your reply.',
      },
      {
        fr: 'Indique clairement le prix en ariary dans le texte de ta page, même si la boutique affiche une autre devise. Tes clients pensent en ariary, ne les fais pas calculer.',
        en: 'State the ariary price clearly in your page text, even if the store shows another currency. Your customers think in ariary, so do not make them do the maths.',
      },
      {
        fr: 'Crée deux types de zones : Tana en paiement à la livraison, province avec paiement MVola d’avance sur ton numéro. Explique-le dans le formulaire pour éviter les surprises.',
        en: 'Create two kinds of zones: Tana with cash on delivery, upcountry with MVola payment ahead to your number. Say it in the form to avoid surprises.',
      },
      {
        fr: 'Fais confirmer chaque commande par un closer, en malgache si possible. Un appel chaleureux fait baisser le nombre de colis refusés.',
        en: 'Have a closer confirm every order, in Malagasy if possible. A friendly call lowers the number of refused parcels.',
      },
      {
        fr: 'Installe le pixel Facebook et l’API Conversions : à Madagascar, presque tout ton trafic viendra de Facebook, autant que tes pubs apprennent sur les vrais acheteurs.',
        en: 'Install the Facebook pixel and Conversions API: in Madagascar almost all your traffic will come from Facebook, so let your ads learn from real buyers.',
      },
      {
        fr: 'Profite de tes lives : partage le lien de ta boutique pendant le direct et active le popup des ventes réelles pour montrer que d’autres commandent en même temps.',
        en: 'Use your live videos: share your store link during the stream and turn on the real sales popup to show others are ordering at the same time.',
      },
      {
        fr: 'Lance une offre pack avant le 26 juin et avant Noël, avec un compte à rebours. Les familles achètent pour plusieurs enfants à la fois.',
        en: 'Run a bundle offer before 26 June and before Christmas, with a countdown. Families buy for several children at once.',
      },
    ],
    productIdeas: [
      { fr: 'Vêtements et chaussures pour enfants, souvent demandés avant la rentrée et les fêtes.', en: 'Kids’ clothes and shoes, often in demand before back to school and holidays.' },
      { fr: 'Accessoires de téléphone et petits gadgets électroniques.', en: 'Phone accessories and small electronic gadgets.' },
      { fr: 'Articles de cuisine et rangement pour la maison.', en: 'Kitchen and storage items for the home.' },
      { fr: 'Cosmétiques, soins de la peau et produits capillaires.', en: 'Cosmetics, skin care and hair products.' },
      { fr: 'Lampes solaires et rechargeables, utiles lors des délestages.', en: 'Solar and rechargeable lamps, useful during power cuts.' },
      { fr: 'Vêtements chauds pour la saison fraîche sur les Hautes Terres.', en: 'Warm clothing for the cool season in the Highlands.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne à Madagascar ?', en: 'How do I sell online in Madagascar?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute tes produits avec le prix en ariary dans la description, configure tes zones de livraison à Tana et en province, puis partage ton lien sur Facebook. Tes closers confirment chaque commande avant la livraison.',
          en: 'Create your Zuri store, add products with the ariary price in the description, set up delivery zones for Tana and upcountry, then share your link on Facebook. Your closers confirm each order before delivery.',
        },
      },
      {
        q: { fr: 'Peut-on encaisser MVola avec Zuri ?', en: 'Can I collect MVola payments with Zuri?' },
        a: {
          fr: 'Pas automatiquement : aucun prestataire intégré à Zuri ne couvre Madagascar. Le client peut payer par MVola, Orange Money ou Airtel Money sur ton numéro, et tu passes ensuite la commande en confirmée dans Zuri.',
          en: 'Not automatically: no provider built into Zuri covers Madagascar. The customer can pay by MVola, Orange Money or Airtel Money to your number, then you mark the order as confirmed in Zuri.',
        },
      },
      {
        q: { fr: 'Zuri affiche-t-il les prix en ariary ?', en: 'Does Zuri show prices in ariary?' },
        a: {
          fr: 'Non, l’ariary ne fait pas partie des devises gérées. Tu peux afficher tes prix en euros ou en dollars, et écrire le prix en ariary dans la description du produit.',
          en: 'No, the ariary is not one of the supported currencies. You can show prices in euros or dollars and write the ariary price in the product description.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping à Madagascar ?', en: 'How do I do dropshipping in Madagascar?' },
        a: {
          fr: 'Travaille avec un fournisseur qui a du stock à Tana : tu gères la page, la pub Facebook et la confirmation, il prépare les colis. Les importations sont longues, donc le dropshipping local est bien plus adapté au paiement à la livraison.',
          en: 'Work with a supplier who holds stock in Tana: you run the page, the Facebook ads and the confirmation calls, they pack the parcels. Imports take a long time, so local dropshipping suits cash on delivery much better.',
        },
      },
      {
        q: { fr: 'Zuri est-il gratuit à Madagascar ?', en: 'Is Zuri free in Madagascar?' },
        a: {
          fr: 'Oui, pendant le lancement, avec un sous-domaine gratuit et 0 % de commission. Tes pages sont légères et s’ouvrent vite, même en 3G.',
          en: 'Yes, during the launch period, with a free subdomain and 0% commission. Your pages are light and open fast, even on 3G.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays (Madagascar non listé)', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'FedaPay : pays pris en charge (Madagascar non listé)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'comores',
    iso: 'KM',
    name: { fr: 'Comores', en: 'Comoros' },
    inName: 'aux Comores',
    region: 'ocean-indien',
    primaryLang: 'fr',
    currency: { code: 'KMF', label: { fr: 'franc comorien', en: 'Comorian franc' } },
    cities: ['Moroni', 'Mutsamudu', 'Fomboni'],
    mobileMoney: ['Huri Money', 'MVola'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne aux Comores : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Comoros: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne aux Comores : boutique en ligne gratuite, paiement à la livraison, commandes WhatsApp et clients de la diaspora. Lance-toi avec Zuri.',
      en: 'Sell online in Comoros: free online store, cash on delivery, WhatsApp orders and diaspora buyers in France. Start selling with Zuri.',
    },
    h1: {
      fr: 'Vendre en ligne aux Comores, de Moroni à Mutsamudu',
      en: 'Sell online in Comoros, from Moroni to Mutsamudu',
    },
    intro: {
      fr: 'Aux Comores, tout se vend par le bouche-à-oreille, WhatsApp et Facebook, souvent avec un proche de la diaspora qui paie depuis Marseille ou Paris. Une boutique Zuri te donne une vraie page de vente légère, un formulaire de commande paiement à la livraison et un suivi propre de chaque client, île par île.',
      en: 'In Comoros, most selling happens through word of mouth, WhatsApp and Facebook, often with a relative in France paying for someone back home. A Zuri store gives you a real, lightweight sales page, a cash on delivery order form and clean tracking of every customer, island by island.',
    },
    market: [
      {
        fr: 'Le marché comorien est petit mais très connecté par les liens familiaux. Entre Grande Comore, Anjouan et Mohéli, les clients se connaissent, comparent et recommandent. Une mauvaise livraison se sait vite, une bonne aussi. Ta réputation compte autant que ta pub.',
        en: 'The Comorian market is small but tightly connected through family ties. Across Grande Comore, Anjouan and Mohéli, customers know each other, compare and recommend. A bad delivery spreads fast, and so does a good one. Your reputation matters as much as your ads.',
      },
      {
        fr: 'Pour le paiement, le cash à la livraison reste la norme. Huri Money (Comores Telecom) et MVola (Telma) servent aussi à payer et transférer, mais aucun prestataire intégré à Zuri (FeexPay, FedaPay, PayDunya, PawaPay) ne couvre les Comores aujourd’hui. Concrètement : tu encaisses en COD, ou le client t’envoie l’argent sur ton numéro Huri Money ou MVola et tu confirmes la commande à la main.',
        en: 'For payment, cash on delivery is still the norm. Huri Money (Comores Telecom) and MVola (Telma) are also used to pay and send money, but none of the payment providers built into Zuri (FeexPay, FedaPay, PayDunya, PawaPay) covers Comoros today. In practice: you collect cash on delivery, or the customer sends money to your Huri Money or MVola number and you confirm the order manually.',
      },
      {
        fr: 'La diaspora, surtout en France, est un vrai moteur d’achat. Beaucoup de commandes sont passées depuis l’étranger pour un parent à Moroni ou à Mutsamudu. Le paiement à la livraison par le proche sur place, ou un transfert avant envoi, rassure tout le monde.',
        en: 'The diaspora, mainly in France, is a real buying engine. Many orders are placed from abroad for a relative in Moroni or Mutsamudu. Cash on delivery paid by the family member on site, or a transfer before shipping, reassures everyone.',
      },
      {
        fr: 'La saison des grands mariages (le anda), le Ramadan et l’Aïd sont des pics nets : tenues, parfums, bijoux, cadeaux, articles de cuisine. Prépare ton stock avant, parce que les arrivages par bateau ou par avion prennent du temps et coûtent cher.',
        en: 'The grand wedding season (the anda), Ramadan and Eid are clear peaks: outfits, perfumes, jewelry, gifts, kitchenware. Stock up early, because goods arriving by boat or plane take time and cost money.',
      },
    ],
    tips: [
      {
        fr: 'Crée une zone de livraison par île dans Zuri (Grande Comore, Anjouan, Mohéli) avec des frais différents. Le client voit le vrai prix avant de commander, tu évites les disputes au moment de la livraison.',
        en: 'Create one delivery zone per island in Zuri (Grande Comore, Anjouan, Mohéli) with different fees. The customer sees the real price before ordering, and you avoid arguments at the door.',
      },
      {
        fr: 'Ajoute un champ « Commande pour un proche ? » dans ton formulaire de commande. Tu sais tout de suite si c’est un client de la diaspora et qui récupère le colis sur place.',
        en: 'Add a “Ordering for a relative?” field to your order form. You know right away if it is a diaspora customer and who will receive the parcel locally.',
      },
      {
        fr: 'Affiche tes prix en EUR si tu vises surtout la diaspora en France. Le franc comorien n’est pas géré par Zuri, donc pour le marché local, indique aussi le montant en KMF dans ta description produit.',
        en: 'Show prices in EUR if your main buyers are the diaspora in France. Zuri does not support the Comorian franc, so for local buyers also write the KMF amount in your product description.',
      },
      {
        fr: 'Mets le bouton WhatsApp bien visible. Aux Comores, beaucoup de clients veulent poser une question avant d’acheter, et une réponse rapide ferme la vente.',
        en: 'Make the WhatsApp button easy to see. In Comoros, many customers want to ask a question before buying, and a quick reply closes the sale.',
      },
      {
        fr: 'Appelle chaque commande avant d’expédier. Avec les statuts COD de Zuri (nouvelle, injoignable, confirmée), tu ne perds pas la trace des clients qui ne répondent pas.',
        en: 'Call every order before shipping. With Zuri’s cash on delivery statuses (new, unreachable, confirmed), you never lose track of customers who do not pick up.',
      },
      {
        fr: 'Lance des packs avant les grands mariages : « 2 parfums + 1 coffret », par exemple. Les offres par quantité font monter ton panier moyen sans baisser ton prix unitaire.',
        en: 'Launch bundles before wedding season, for example “2 perfumes + 1 gift box”. Quantity offers raise your average order without cutting your unit price.',
      },
      {
        fr: 'Pour les produits digitaux (formations, guides, recettes), utilise un lien Chariow, Maketou ou Selar si ton client peut payer par ce biais. Sinon, garde le paiement manuel par Huri Money ou MVola.',
        en: 'For digital products (courses, guides, recipes), use a Chariow, Maketou or Selar link if your customer can pay that way. Otherwise, keep manual payment through Huri Money or MVola.',
      },
    ],
    productIdeas: [
      { fr: 'Parfums, encens et huiles parfumées, souvent demandés pour les fêtes et les mariages.', en: 'Perfumes, incense and scented oils, often requested for celebrations and weddings.' },
      { fr: 'Tenues de cérémonie, voiles et boubous, surtout avant la saison des grands mariages.', en: 'Ceremony outfits, veils and boubous, especially before the grand wedding season.' },
      { fr: 'Bijoux fantaisie et coffrets cadeaux, que la diaspora commande volontiers pour la famille.', en: 'Fashion jewelry and gift boxes, which diaspora buyers often order for family.' },
      { fr: 'Accessoires de téléphone (coques, chargeurs, écouteurs), des achats rapides et fréquents.', en: 'Phone accessories (cases, chargers, earbuds), quick and frequent purchases.' },
      { fr: 'Petit électroménager de cuisine, souvent recherché pendant le Ramadan.', en: 'Small kitchen appliances, often looked for during Ramadan.' },
      { fr: 'Produits de soin et cosmétiques, à condition de bien expliquer l’usage.', en: 'Skincare and cosmetics, as long as you explain clearly how to use them.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne aux Comores ?', en: 'How do I sell online in Comoros?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute tes produits, configure tes zones de livraison par île et partage ton lien sur WhatsApp, Facebook et TikTok. Les commandes arrivent avec paiement à la livraison, tu les confirmes par téléphone puis tu livres.',
          en: 'Create your store on Zuri, add your products, set delivery zones per island and share your link on WhatsApp, Facebook and TikTok. Orders come in with cash on delivery, you confirm them by phone, then deliver.',
        },
      },
      {
        q: { fr: 'Puis-je encaisser par Mobile Money aux Comores avec Zuri ?', en: 'Can I collect Mobile Money payments in Comoros with Zuri?' },
        a: {
          fr: 'Pas automatiquement pour l’instant : aucun prestataire intégré à Zuri ne couvre les Comores. Tu peux encaisser en COD, ou demander au client d’envoyer le montant sur ton numéro Huri Money ou MVola, puis marquer la commande comme confirmée.',
          en: 'Not automatically for now: none of Zuri’s built-in providers covers Comoros. You can collect cash on delivery, or ask the customer to send the amount to your Huri Money or MVola number, then mark the order as confirmed.',
        },
      },
      {
        q: { fr: 'Comment vendre aux Comoriens de la diaspora ?', en: 'How do I sell to Comorians abroad?' },
        a: {
          fr: 'Fais ta pub Facebook ou TikTok vers la France, affiche tes prix en EUR et propose la livraison au proche sur place, qui paie à la réception. Le formulaire Zuri peut demander le nom et le numéro du destinataire.',
          en: 'Run Facebook or TikTok ads aimed at France, show prices in EUR and offer delivery to the relative back home, who pays on receipt. The Zuri form can ask for the recipient’s name and phone number.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit aux Comores ?', en: 'Is there a free online store builder for Comoros?' },
        a: {
          fr: 'Oui, Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine offert. Tu peux ouvrir ta boutique aujourd’hui et vendre dès que tes produits sont en ligne.',
          en: 'Yes, Zuri is free during launch, takes no commission on your sales and includes a free subdomain. You can open your store today and start selling as soon as your products are online.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne aux Comores ?', en: 'What should I sell online in Comoros?' },
        a: {
          fr: 'Regarde ce que ton entourage demande déjà : parfums, tenues, bijoux, accessoires de téléphone reviennent souvent, surtout avant les mariages et le Ramadan. Teste petit, avec peu de stock, avant de commander en grande quantité.',
          en: 'Look at what people around you already ask for: perfumes, outfits, jewelry and phone accessories come up often, especially before weddings and Ramadan. Test small, with little stock, before ordering in bulk.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'djibouti',
    iso: 'DJ',
    name: { fr: 'Djibouti', en: 'Djibouti' },
    inName: 'à Djibouti',
    region: 'afrique-est',
    primaryLang: 'fr',
    currency: { code: 'DJF', label: { fr: 'franc djiboutien', en: 'Djiboutian franc' } },
    cities: ['Djibouti-ville', 'Ali Sabieh', 'Tadjourah'],
    mobileMoney: ['D-Money', 'Waafi'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne à Djibouti : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Djibouti: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne à Djibouti : boutique en ligne gratuite, paiement à la livraison en ville, commandes WhatsApp et pub Facebook. Crée ta boutique sur Zuri.',
      en: 'Sell online in Djibouti: free online store, cash on delivery across the city, WhatsApp orders and Facebook ads. Build your store with Zuri.',
    },
    h1: {
      fr: 'Vendre en ligne à Djibouti : une boutique simple, des livraisons rapides',
      en: 'Sell online in Djibouti: a simple store, fast deliveries',
    },
    intro: {
      fr: 'À Djibouti, l’essentiel des clients vit dans la capitale, ce qui rend la livraison rapide et le paiement à la livraison très pratique. Avec Zuri, tu passes des messages WhatsApp éparpillés à une vraie boutique, avec un formulaire de commande clair et un suivi de chaque livraison.',
      en: 'In Djibouti, most customers live in the capital, which makes delivery fast and cash on delivery very practical. With Zuri, you move from scattered WhatsApp messages to a real store, with a clear order form and tracking for every delivery.',
    },
    market: [
      {
        fr: 'Djibouti-ville concentre la majorité de la demande : quartiers du centre, Balbala, Plateau du Serpent, Haramous. Un livreur peut faire plusieurs tournées dans la journée, donc un client qui commande le matin peut être livré l’après-midi. C’est un vrai avantage pour le COD, car moins d’attente veut dire moins de colis refusés.',
        en: 'Djibouti City holds most of the demand: the central districts, Balbala, Plateau du Serpent, Haramous. A delivery rider can do several rounds a day, so a customer who orders in the morning can get the parcel in the afternoon. That is a real advantage for cash on delivery, because less waiting means fewer refused parcels.',
      },
      {
        fr: 'Côté paiement, D-Money (Djibouti Telecom) et Waafi sont connus pour payer et transférer de l’argent. Aucun prestataire intégré à Zuri ne couvre Djibouti pour le moment, donc l’encaissement Mobile Money automatique n’est pas disponible. Tu encaisses en espèces à la livraison, ou le client te paie sur ton compte D-Money ou Waafi et tu valides la commande toi-même.',
        en: 'For payment, D-Money (Djibouti Telecom) and Waafi are known ways to pay and send money. None of Zuri’s built-in providers covers Djibouti for now, so automatic Mobile Money collection is not available. You collect cash on delivery, or the customer pays to your D-Money or Waafi account and you validate the order yourself.',
      },
      {
        fr: 'Les clients parlent français, arabe, somali ou afar, et passent beaucoup de temps sur Facebook, WhatsApp et TikTok. Une vidéo courte qui montre le produit en vrai, avec le prix et la zone de livraison, marche mieux qu’un long texte. Il y a aussi une clientèle d’expatriés et de familles qui achètent en ligne par habitude.',
        en: 'Customers speak French, Arabic, Somali or Afar, and spend a lot of time on Facebook, WhatsApp and TikTok. A short video showing the real product, with the price and delivery area, works better than a long text. There is also a customer base of expats and families who are used to buying online.',
      },
      {
        fr: 'Le climat très chaud influence ce qui se vend : ventilateurs, brumisateurs, vêtements légers, gourdes isothermes. Le Ramadan, l’Aïd et la fête de l’Indépendance le 27 juin sont des moments forts pour les promotions.',
        en: 'The very hot climate shapes what sells: fans, misting sprays, light clothing, insulated bottles. Ramadan, Eid and Independence Day on 27 June are strong moments for promotions.',
      },
    ],
    tips: [
      {
        fr: 'Découpe Djibouti-ville en zones de livraison dans Zuri (centre, Balbala, quartiers éloignés) avec un frais par zone. Ajoute une zone séparée pour Ali Sabieh ou Tadjourah si tu livres là-bas.',
        en: 'Split Djibouti City into delivery zones in Zuri (center, Balbala, outer districts) with one fee per zone. Add a separate zone for Ali Sabieh or Tadjourah if you deliver there.',
      },
      {
        fr: 'Promets une livraison le jour même ou le lendemain seulement si tu peux la tenir. Un client livré vite paie presque toujours, un client qui attend trois jours devient injoignable.',
        en: 'Promise same-day or next-day delivery only if you can keep it. A customer served quickly almost always pays, a customer waiting three days becomes unreachable.',
      },
      {
        fr: 'Affiche tes prix en USD sur Zuri (le franc djiboutien n’est pas géré) et rappelle le montant en DJF dans la description. Le client sait exactement combien préparer pour le livreur.',
        en: 'Show your prices in USD on Zuri (the Djiboutian franc is not supported) and repeat the DJF amount in the description. The customer knows exactly how much to have ready for the rider.',
      },
      {
        fr: 'Tourne tes vidéos produit en extérieur, en situation réelle : un ventilateur qui tourne en pleine chaleur parle plus qu’une photo de catalogue. Branche ensuite ton pixel Facebook et ton pixel TikTok pour mesurer quelles pubs ramènent des commandes.',
        en: 'Film your product videos outdoors, in real conditions: a fan running in the heat says more than a catalog photo. Then connect your Facebook pixel and TikTok pixel to see which ads bring orders.',
      },
      {
        fr: 'Garde un modèle de message WhatsApp de confirmation en français et en somali ou en arabe selon ta clientèle. Le client se sent respecté et confirme plus facilement.',
        en: 'Keep a WhatsApp confirmation template in French and in Somali or Arabic depending on your customers. People feel respected and confirm more easily.',
      },
      {
        fr: 'Pendant le Ramadan, pousse tes pubs le soir, après la rupture du jeûne, et active un compte à rebours sur tes offres de l’Aïd.',
        en: 'During Ramadan, push your ads in the evening after the fast is broken, and turn on a countdown timer for your Eid offers.',
      },
      {
        fr: 'Suis ton taux de livraison dans Zuri. S’il baisse dans un quartier, change de livreur ou demande un acompte D-Money ou Waafi pour cette zone.',
        en: 'Watch your delivery rate in Zuri. If it drops in one district, change rider or ask for a D-Money or Waafi deposit for that area.',
      },
    ],
    productIdeas: [
      { fr: 'Ventilateurs portables, brumisateurs et petits climatiseurs, souvent recherchés pendant les mois les plus chauds.', en: 'Portable fans, misting sprays and small coolers, often searched for in the hottest months.' },
      { fr: 'Vêtements légers, abayas et tenues pour l’Aïd, très demandés avant les fêtes.', en: 'Light clothing, abayas and Eid outfits, in high demand before the holidays.' },
      { fr: 'Parfums, oud et encens, une valeur sûre pour les cadeaux.', en: 'Perfumes, oud and incense, a safe choice for gifts.' },
      { fr: 'Accessoires de téléphone et petits gadgets électroniques.', en: 'Phone accessories and small electronic gadgets.' },
      { fr: 'Gourdes isothermes et glacières, utiles au quotidien et pour les sorties à la plage.', en: 'Insulated bottles and coolers, useful every day and for beach trips.' },
      { fr: 'Soins de la peau et protection solaire, à présenter avec des conseils d’usage clairs.', en: 'Skincare and sun protection, presented with clear usage advice.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne à Djibouti ?', en: 'How do I sell online in Djibouti?' },
        a: {
          fr: 'Ouvre une boutique Zuri, ajoute tes produits avec de bonnes photos, configure tes zones de livraison dans la capitale et diffuse ton lien sur Facebook, TikTok et WhatsApp. Tu reçois les commandes, tu les confirmes par téléphone, et le client paie à la livraison.',
          en: 'Open a Zuri store, add your products with good photos, set up delivery zones in the capital and share your link on Facebook, TikTok and WhatsApp. You receive orders, confirm them by phone, and the customer pays on delivery.',
        },
      },
      {
        q: { fr: 'Peut-on encaisser via D-Money ou Waafi avec Zuri ?', en: 'Can I collect payments through D-Money or Waafi with Zuri?' },
        a: {
          fr: 'Pas de façon automatique : aucun prestataire intégré à Zuri ne couvre Djibouti aujourd’hui. Tu peux demander au client de payer sur ton compte D-Money ou Waafi, puis passer la commande en confirmée dans ton tableau de bord.',
          en: 'Not automatically: none of Zuri’s built-in providers covers Djibouti today. You can ask the customer to pay to your D-Money or Waafi account, then move the order to confirmed in your dashboard.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne à Djibouti ?', en: 'What should I sell online in Djibouti?' },
        a: {
          fr: 'Les produits liés à la chaleur, la mode pour les fêtes, les parfums et les accessoires de téléphone sont souvent demandés. Teste deux ou trois produits avec un petit budget pub avant de remplir ton stock.',
          en: 'Products for the heat, holiday fashion, perfumes and phone accessories are often requested. Test two or three products with a small ad budget before filling your stock.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit à Djibouti ?', en: 'Is there a free online store builder in Djibouti?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, prend 0 % de commission et te donne un sous-domaine gratuit. Tu gardes tout ce que tu encaisses.',
          en: 'Zuri is free during launch, takes 0% commission and gives you a free subdomain. You keep everything you collect.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'burundi',
    iso: 'BI',
    name: { fr: 'Burundi', en: 'Burundi' },
    inName: 'au Burundi',
    region: 'afrique-est',
    primaryLang: 'fr',
    currency: { code: 'BIF', label: { fr: 'franc burundais', en: 'Burundian franc' } },
    cities: ['Bujumbura', 'Gitega', 'Ngozi'],
    mobileMoney: ['Lumicash'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne au Burundi : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Burundi: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Burundi : boutique en ligne gratuite, paiement à la livraison à Bujumbura et Gitega, commandes WhatsApp. Démarre avec Zuri.',
      en: 'Sell online in Burundi: free online store, cash on delivery in Bujumbura and Gitega, WhatsApp orders. Get started with Zuri.',
    },
    h1: {
      fr: 'Vendre en ligne au Burundi avec une boutique qui inspire confiance',
      en: 'Sell online in Burundi with a store people trust',
    },
    intro: {
      fr: 'Au Burundi, la vente en ligne passe surtout par WhatsApp, Facebook et le réseau de connaissances, avec un paiement en main propre. Une boutique Zuri te donne une vitrine sérieuse, légère à charger même avec une connexion faible, et un formulaire de commande paiement à la livraison qui range tout pour toi.',
      en: 'In Burundi, online selling mostly runs through WhatsApp, Facebook and personal networks, with payment in hand. A Zuri store gives you a serious storefront that loads fast even on a weak connection, and a cash on delivery order form that keeps everything organized.',
    },
    market: [
      {
        fr: 'Bujumbura reste le cœur commercial du pays, et c’est là que se concentrent la plupart des acheteurs en ligne. Gitega, capitale politique, et Ngozi suivent. Beaucoup de vendeurs commencent par livrer seulement à Bujumbura, puis élargissent quand la logistique est rodée.',
        en: 'Bujumbura remains the commercial heart of the country, and most online buyers are there. Gitega, the political capital, and Ngozi come next. Many sellers start by delivering only in Bujumbura, then expand once their logistics are solid.',
      },
      {
        fr: 'La confiance est le vrai sujet. Les clients préfèrent voir le produit avant de payer, d’où l’importance du paiement à la livraison. Lumicash est connu pour les paiements et transferts, mais aucun prestataire intégré à Zuri ne couvre le Burundi. Tu encaisses donc en COD, ou le client te paie sur ton numéro Lumicash et tu confirmes à la main.',
        en: 'Trust is the real issue. Customers prefer to see the product before paying, which is why cash on delivery matters so much. Lumicash is known for payments and transfers, but none of Zuri’s built-in providers covers Burundi. So you collect cash on delivery, or the customer pays to your Lumicash number and you confirm manually.',
      },
      {
        fr: 'Les connexions peuvent être lentes et les forfaits data comptent. Une page de vente lourde fait fuir le client avant même qu’il voie le prix. Les pages Zuri pèsent environ 23 Ko de JavaScript, pensées pour la 3G : le client voit la photo, le prix et le bouton commander rapidement.',
        en: 'Connections can be slow and data bundles matter. A heavy sales page loses the customer before they even see the price. Zuri pages weigh around 23 KB of JavaScript, built for 3G: the customer quickly sees the photo, the price and the order button.',
      },
      {
        fr: 'Côté calendrier, Noël, le Nouvel An et la rentrée scolaire sont des périodes d’achat importantes, tout comme la fête de l’Indépendance le 1er juillet. Les mariages et les dots créent aussi une demande régulière en tenues, pagnes et cadeaux.',
        en: 'On the calendar, Christmas, New Year and back to school are key buying periods, as is Independence Day on 1 July. Weddings and dowry ceremonies also create steady demand for outfits, fabrics and gifts.',
      },
    ],
    tips: [
      {
        fr: 'Commence avec une seule zone de livraison, Bujumbura, et un frais clair. Ajoute Gitega et Ngozi dans Zuri quand tu as un livreur ou un transporteur fiable pour ces villes.',
        en: 'Start with a single delivery zone, Bujumbura, and a clear fee. Add Gitega and Ngozi in Zuri once you have a reliable rider or transporter for those cities.',
      },
      {
        fr: 'Écris tes fiches produit en français et ajoute quelques mots en kirundi. Le client comprend mieux et se sent proche de toi.',
        en: 'Write your product pages in French and add a few words in Kirundi. Customers understand better and feel closer to you.',
      },
      {
        fr: 'Affiche tes prix en USD sur Zuri (le franc burundais n’est pas géré) et précise le prix en BIF dans le texte du produit, pour que le client sache combien remettre au livreur.',
        en: 'Show prices in USD on Zuri (the Burundian franc is not supported) and state the BIF price in the product text, so customers know how much to hand the rider.',
      },
      {
        fr: 'Publie des vidéos de déballage et des témoignages de vrais clients sur Facebook et WhatsApp Status. Au Burundi, la preuve sociale vaut plus qu’une belle promesse.',
        en: 'Post unboxing videos and real customer testimonials on Facebook and WhatsApp Status. In Burundi, social proof beats a nice promise.',
      },
      {
        fr: 'Rappelle chaque client dans l’heure qui suit sa commande. Plus tu attends, plus il risque de devenir injoignable ou de changer d’avis.',
        en: 'Call every customer within an hour of their order. The longer you wait, the more likely they become unreachable or change their mind.',
      },
      {
        fr: 'Utilise les codes promo pour récompenser les clients qui reviennent : un petit rabais sur la deuxième commande fidélise mieux qu’une grosse remise unique.',
        en: 'Use promo codes to reward returning customers: a small discount on the second order builds loyalty better than one big markdown.',
      },
      {
        fr: 'Pour un produit cher, demande un petit acompte par Lumicash avant de livrer hors de Bujumbura. Le client motivé accepte, et tu limites les colis retournés.',
        en: 'For an expensive item, ask for a small Lumicash deposit before delivering outside Bujumbura. Serious customers accept, and you cut down on returned parcels.',
      },
    ],
    productIdeas: [
      { fr: 'Pagnes, tissus et tenues de cérémonie, souvent demandés pour les mariages et les dots.', en: 'Fabrics and ceremony outfits, often requested for weddings and dowry events.' },
      { fr: 'Fournitures et sacs scolaires, à pousser avant la rentrée.', en: 'School supplies and bags, worth pushing before back to school.' },
      { fr: 'Accessoires de téléphone, power banks et lampes solaires, utiles quand le courant manque.', en: 'Phone accessories, power banks and solar lamps, useful during power cuts.' },
      { fr: 'Produits de beauté et soins capillaires, avec des explications simples.', en: 'Beauty and hair care products, with simple explanations.' },
      { fr: 'Petits ustensiles et appareils de cuisine pratiques.', en: 'Small, practical kitchen tools and appliances.' },
      { fr: 'Formations et guides en ligne (produits digitaux), vendus via un lien Chariow, Maketou ou Selar si le client peut payer ainsi.', en: 'Online courses and guides (digital products), sold through a Chariow, Maketou or Selar link if the customer can pay that way.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Burundi ?', en: 'How do I sell online in Burundi?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute tes produits, configure la livraison à Bujumbura et partage ton lien sur Facebook et WhatsApp. Le client remplit le formulaire, tu l’appelles pour confirmer, puis tu livres et tu encaisses à la livraison.',
          en: 'Create your store on Zuri, add your products, set up delivery in Bujumbura and share your link on Facebook and WhatsApp. The customer fills in the form, you call to confirm, then you deliver and collect cash on delivery.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Burundi ?', en: 'How do I collect Mobile Money payments in Burundi?' },
        a: {
          fr: 'Zuri n’a pas de prestataire Mobile Money intégré au Burundi pour l’instant. Le plus simple : le client t’envoie le montant sur ton numéro Lumicash, tu vérifies la réception, puis tu passes la commande en confirmée.',
          en: 'Zuri has no built-in Mobile Money provider in Burundi for now. The simplest way: the customer sends the amount to your Lumicash number, you check you received it, then you mark the order as confirmed.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Burundi ?', en: 'How do I do dropshipping in Burundi?' },
        a: {
          fr: 'Le dropshipping local marche mieux que l’import à la commande : trouve un fournisseur à Bujumbura qui garde le stock, vends sur ta boutique Zuri et organise la livraison avec lui. Les délais d’import trop longs font annuler les clients COD.',
          en: 'Local dropshipping works better than importing per order: find a supplier in Bujumbura who holds the stock, sell through your Zuri store and arrange delivery with them. Long import delays make cash on delivery customers cancel.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit au Burundi ?', en: 'Is there a free online store builder in Burundi?' },
        a: {
          fr: 'Oui : Zuri est gratuit pendant le lancement, sans commission, avec un sous-domaine gratuit. Tu peux tester sans risque avant d’investir dans la pub.',
          en: 'Yes: Zuri is free during launch, with no commission and a free subdomain. You can test with no risk before spending on ads.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'rwanda',
    iso: 'RW',
    name: { fr: 'Rwanda', en: 'Rwanda' },
    inName: 'au Rwanda',
    region: 'afrique-est',
    primaryLang: 'fr',
    currency: { code: 'RWF', label: { fr: 'franc rwandais', en: 'Rwandan franc' } },
    cities: ['Kigali', 'Huye', 'Musanze', 'Rubavu'],
    mobileMoney: ['MTN MoMo', 'Airtel Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne au Rwanda : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Rwanda: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Rwanda : boutique en ligne gratuite, Mobile Money MTN et Airtel via PawaPay, paiement à la livraison à Kigali. Lance-toi sur Zuri.',
      en: 'Sell online in Rwanda: free online store, MTN and Airtel Mobile Money via PawaPay, cash on delivery in Kigali. Launch your shop on Zuri.',
    },
    h1: {
      fr: 'Vendre en ligne au Rwanda : MoMo, livraison à moto et boutique pro',
      en: 'Sell online in Rwanda: MoMo, moto delivery and a pro store',
    },
    intro: {
      fr: 'Au Rwanda, payer avec MoMo est entré dans les habitudes, et Kigali a un réseau dense de motos pour livrer vite. Avec Zuri, tu combines les deux : paiement Mobile Money via ton compte PawaPay, ou paiement à la livraison pour ceux qui préfèrent voir avant de payer.',
      en: 'In Rwanda, paying with MoMo is part of daily life, and Kigali has a dense network of moto riders for fast delivery. With Zuri, you combine both: Mobile Money payment through your own PawaPay account, or cash on delivery for people who want to see before they pay.',
    },
    market: [
      {
        fr: 'Kigali est le centre de la vente en ligne : Kimihurura, Remera, Kicukiro, Nyamirambo, Kacyiru. Les motos taxis sont partout et servent aussi de livreurs, ce qui permet des livraisons dans la journée. Hors de Kigali, Huye, Musanze et Rubavu se servent souvent par les bus interurbains, avec un colis à récupérer en agence.',
        en: 'Kigali is the hub of online selling: Kimihurura, Remera, Kicukiro, Nyamirambo, Kacyiru. Moto taxis are everywhere and also work as couriers, which makes same-day delivery possible. Outside Kigali, Huye, Musanze and Rubavu are often served through intercity buses, with the parcel picked up at the agency.',
      },
      {
        fr: 'MTN MoMo et Airtel Money sont les deux grands moyens de paiement mobile. PawaPay prend en charge les deux au Rwanda, et Zuri s’y connecte via ton propre compte PawaPay : l’argent arrive chez toi, jamais chez Zuri. Le paiement à la livraison reste utile pour les nouveaux clients qui ne te connaissent pas encore.',
        en: 'MTN MoMo and Airtel Money are the two main mobile payment options. PawaPay supports both in Rwanda, and Zuri connects to it through your own PawaPay account: the money goes to you, never to Zuri. Cash on delivery is still useful for new customers who do not know you yet.',
      },
      {
        fr: 'Le pays est trilingue (kinyarwanda, anglais, français) et beaucoup de clients naviguent en anglais ou en kinyarwanda. Instagram, WhatsApp, TikTok et X sont actifs à Kigali, surtout chez les jeunes actifs. Une boutique bilingue, avec une version anglaise propre, élargit nettement ton public.',
        en: 'The country is trilingual (Kinyarwanda, English, French) and many customers browse in English or Kinyarwanda. Instagram, WhatsApp, TikTok and X are active in Kigali, especially among young professionals. A bilingual store, with a clean English version, widens your audience a lot.',
      },
      {
        fr: 'Point important : les sacs plastiques sont interdits au Rwanda. Prévois des emballages en papier ou en tissu, sinon tes colis peuvent poser problème. Côté calendrier, Noël, la rentrée et les fêtes nationales comme le Jour de la Libération le 4 juillet rythment les achats.',
        en: 'Important point: plastic bags are banned in Rwanda. Plan paper or fabric packaging, otherwise your parcels can cause trouble. On the calendar, Christmas, back to school and national holidays such as Liberation Day on 4 July drive buying.',
      },
    ],
    tips: [
      {
        fr: 'Connecte ton compte PawaPay dans Zuri pour accepter MTN MoMo et Airtel Money directement sur ta page. Laisse aussi le paiement à la livraison actif : chaque client choisit ce qui le rassure.',
        en: 'Connect your PawaPay account in Zuri to accept MTN MoMo and Airtel Money right on your page. Keep cash on delivery on too: each customer picks what reassures them.',
      },
      {
        fr: 'Affiche tes prix en USD sur Zuri (le franc rwandais n’est pas géré) et mets le prix en RWF dans le titre ou la description du produit. Les clients rwandais raisonnent en francs.',
        en: 'Show prices in USD on Zuri (the Rwandan franc is not supported) and put the RWF price in the product title or description. Rwandan customers think in francs.',
      },
      {
        fr: 'Rédige tes fiches en anglais et en français, et ajoute une phrase en kinyarwanda pour l’appel à l’action. Ta boutique paraît tout de suite plus locale.',
        en: 'Write your product pages in English and French, and add a line in Kinyarwanda for the call to action. It makes your store feel local.',
      },
      {
        fr: 'Utilise des emballages papier ou carton dès le départ, et montre-les dans tes vidéos. Ça rassure le client et respecte la loi.',
        en: 'Use paper or cardboard packaging from day one, and show it in your videos. It reassures customers and respects the law.',
      },
      {
        fr: 'Pour Huye, Musanze ou Rubavu, crée des zones de livraison avec un frais « envoi par bus » et explique au client où récupérer le colis. Demande un paiement MoMo avant l’envoi pour ces villes.',
        en: 'For Huye, Musanze or Rubavu, create delivery zones with a “bus shipping” fee and tell the customer where to pick up the parcel. Ask for MoMo payment before shipping to those cities.',
      },
      {
        fr: 'Active le popup des ventes réelles et le bouton d’achat collant. Sur mobile, le client voit que d’autres achètent et peut commander sans remonter la page.',
        en: 'Turn on the real sales popup and the sticky buy button. On mobile, customers see that others are buying and can order without scrolling back up.',
      },
      {
        fr: 'Relance les paniers abandonnés par WhatsApp. Un message court avec le lien de la commande récupère des ventes que tu aurais perdues.',
        en: 'Follow up on abandoned carts through WhatsApp. A short message with the order link recovers sales you would have lost.',
      },
    ],
    productIdeas: [
      { fr: 'Mode et chaussures, souvent demandées par les jeunes actifs de Kigali.', en: 'Fashion and shoes, often requested by young professionals in Kigali.' },
      { fr: 'Cosmétiques et soins naturels, avec une présentation sérieuse.', en: 'Cosmetics and natural skincare, presented seriously.' },
      { fr: 'Accessoires tech : écouteurs, chargeurs, supports de téléphone.', en: 'Tech accessories: earbuds, chargers, phone stands.' },
      { fr: 'Articles pour la maison et la décoration, populaires dans les nouveaux appartements.', en: 'Home and decor items, popular in new apartments.' },
      { fr: 'Sacs réutilisables et emballages écologiques, cohérents avec l’interdiction du plastique.', en: 'Reusable bags and eco packaging, in line with the plastic ban.' },
      { fr: 'Formations en ligne et produits digitaux, payables par MoMo.', en: 'Online courses and digital products, payable by MoMo.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Rwanda ?', en: 'How do I sell online in Rwanda?' },
        a: {
          fr: 'Crée ta boutique Zuri, connecte ton compte PawaPay pour MoMo, configure tes zones de livraison à Kigali et partage ton lien sur Instagram, TikTok et WhatsApp. Tu reçois les commandes payées ou en paiement à la livraison dans un seul tableau de bord.',
          en: 'Create your Zuri store, connect your PawaPay account for MoMo, set your delivery zones in Kigali and share your link on Instagram, TikTok and WhatsApp. You get paid and cash on delivery orders in one dashboard.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Rwanda ?', en: 'How do I collect Mobile Money payments in Rwanda?' },
        a: {
          fr: 'Ouvre un compte marchand chez PawaPay, qui prend en charge MTN MoMo et Airtel Money au Rwanda, puis connecte-le dans Zuri. Le client paie sur ta page et l’argent arrive sur ton compte PawaPay.',
          en: 'Open a merchant account with PawaPay, which supports MTN MoMo and Airtel Money in Rwanda, then connect it in Zuri. The customer pays on your page and the money lands in your PawaPay account.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Rwanda ?', en: 'What should I sell online in Rwanda?' },
        a: {
          fr: 'La mode, les cosmétiques, les accessoires tech et la déco sont souvent demandés à Kigali. Choisis un produit facile à montrer en vidéo et teste-le avec un petit budget pub avant d’acheter du stock.',
          en: 'Fashion, cosmetics, tech accessories and home decor are often requested in Kigali. Pick a product that is easy to show on video and test it with a small ad budget before buying stock.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Rwanda ?', en: 'How do I do dropshipping in Rwanda?' },
        a: {
          fr: 'Mise sur le dropshipping local : un fournisseur à Kigali garde le stock, tu vends sur Zuri et un livreur à moto récupère le colis. Les délais restent courts, ce qui compte beaucoup pour le paiement à la livraison.',
          en: 'Go for local dropshipping: a supplier in Kigali holds the stock, you sell on Zuri and a moto rider picks up the parcel. Delivery stays fast, which matters a lot for cash on delivery.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit au Rwanda ?', en: 'Is there a free online store builder in Rwanda?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec 0 % de commission et un sous-domaine gratuit. Les frais du prestataire de paiement restent ceux de ton compte PawaPay.',
          en: 'Zuri is free during launch, with 0% commission and a free subdomain. Payment fees are only those of your own PawaPay account.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'maroc',
    iso: 'MA',
    name: { fr: 'Maroc', en: 'Morocco' },
    inName: 'au Maroc',
    region: 'afrique-nord',
    primaryLang: 'fr',
    currency: { code: 'MAD', label: { fr: 'dirham marocain', en: 'Moroccan dirham' } },
    cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir'],
    mobileMoney: [],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne au Maroc : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Morocco: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Maroc : boutique en ligne gratuite en dirhams, paiement à la livraison, closers, dropshipping local et pixels Facebook/TikTok. Zuri.',
      en: 'Sell online in Morocco: free online store in dirhams, cash on delivery, confirmation team, local dropshipping and Facebook/TikTok pixels. Zuri.',
    },
    h1: {
      fr: 'Vendre en ligne au Maroc : le COD bien organisé, de la commande à la livraison',
      en: 'Sell online in Morocco: cash on delivery done right, from order to doorstep',
    },
    intro: {
      fr: 'Au Maroc, le paiement à la livraison est la règle pour la plupart des acheteurs en ligne, et le vrai combat se joue sur la confirmation et le taux de livraison. Zuri est fait pour ça : pages de vente rapides en dirhams, équipe de closers, statuts COD et suivi du chiffre réellement encaissé.',
      en: 'In Morocco, cash on delivery is the rule for most online buyers, and the real battle is confirmation and delivery rate. Zuri is built for that: fast sales pages in dirhams, a confirmation team, cash on delivery statuses and tracking of the money you actually collect.',
    },
    market: [
      {
        fr: 'Le e-commerce COD est très installé au Maroc : beaucoup de vendeurs font de la pub Facebook, Instagram ou TikTok, reçoivent des commandes avec nom, téléphone et ville, puis passent par une société de livraison qui encaisse à la porte et reverse l’argent. Casablanca, Rabat, Marrakech, Tanger, Fès et Agadir concentrent une grosse part des commandes, mais les livraisons couvrent aussi les petites villes.',
        en: 'Cash on delivery e-commerce is well established in Morocco: many sellers run Facebook, Instagram or TikTok ads, receive orders with name, phone and city, then use a delivery company that collects at the door and pays them back. Casablanca, Rabat, Marrakech, Tangier, Fes and Agadir account for a large share of orders, but deliveries also reach smaller towns.',
      },
      {
        fr: 'Soyons honnêtes sur le paiement : le Mobile Money opérateur n’est pas un réflexe au Maroc, et Zuri n’a pas de prestataire de paiement en ligne intégré pour ce pays. Le COD, lui, fonctionne parfaitement avec Zuri : formulaire de commande, confirmation, expédition, livraison, retour. Pour les produits digitaux, tu peux ajouter un lien de paiement externe si ton client l’accepte.',
        en: 'Let us be honest about payment: operator Mobile Money is not a habit in Morocco, and Zuri has no built-in online payment provider for this country. Cash on delivery, on the other hand, works perfectly with Zuri: order form, confirmation, shipping, delivery, return. For digital products, you can add an external payment link if your customer accepts it.',
      },
      {
        fr: 'La confirmation par téléphone est décisive. Les clients commandent vite sur un coup de cœur, et un appel en darija, poli et rapide, fait la différence entre un colis livré et un colis refusé. Beaucoup de boutiques ont des closers dédiés qui appellent, rappellent les injoignables et vérifient l’adresse.',
        en: 'Phone confirmation is decisive. Customers order quickly on impulse, and a polite, fast call in Darija makes the difference between a delivered parcel and a refused one. Many stores have dedicated confirmation agents who call, call back unreachable customers and check the address.',
      },
      {
        fr: 'Le calendrier commercial est marqué par le Ramadan, l’Aïd al-Fitr, l’Aïd al-Adha, la rentrée scolaire et le Black Friday. Pendant le Ramadan, les gens sont sur leur téléphone le soir et la nuit : c’est souvent là que les pubs tournent le mieux.',
        en: 'The selling calendar follows Ramadan, Eid al-Fitr, Eid al-Adha, back to school and Black Friday. During Ramadan, people are on their phones in the evening and at night: that is often when ads perform best.',
      },
    ],
    tips: [
      {
        fr: 'Affiche tes prix en MAD, la devise est gérée par Zuri. Écris « Livraison gratuite » ou le frais exact par ville, pour que le client ne découvre rien au moment de payer.',
        en: 'Show your prices in MAD, a currency Zuri supports. Write “Free delivery” or the exact fee per city, so the customer has no surprise at the door.',
      },
      {
        fr: 'Monte une équipe de closers dans Zuri avec l’attribution automatique des commandes. Chaque closer voit ses commandes, appelle, et passe le statut en confirmée ou injoignable.',
        en: 'Set up a confirmation team in Zuri with automatic order assignment. Each agent sees their orders, calls, and moves the status to confirmed or unreachable.',
      },
      {
        fr: 'Appelle dans les minutes qui suivent la commande, en darija. Le client a encore le produit en tête, et la confirmation est beaucoup plus facile.',
        en: 'Call within minutes of the order, in Darija. The customer still has the product in mind, and confirmation is much easier.',
      },
      {
        fr: 'Suis ton taux de confirmation et ton taux de livraison chaque semaine dans Zuri, pas seulement le nombre de commandes. Un produit qui vend beaucoup mais revient beaucoup te fait perdre de l’argent en frais de retour.',
        en: 'Track your confirmation rate and delivery rate every week in Zuri, not just order count. A product that sells a lot but comes back a lot loses you money in return fees.',
      },
      {
        fr: 'Installe le pixel Facebook avec l’API Conversions et le pixel TikTok. Optimise tes campagnes sur les achats, et pas seulement sur les clics, pour que l’algorithme trouve des acheteurs qui confirment.',
        en: 'Install the Facebook pixel with the Conversions API and the TikTok pixel. Optimize campaigns for purchases, not just clicks, so the algorithm finds buyers who confirm.',
      },
      {
        fr: 'Propose des offres par quantité (« 2 achetés, le 3e à moitié prix ») et un compte à rebours pendant le Ramadan ou le Black Friday. Le panier moyen monte, et tes frais de livraison pèsent moins.',
        en: 'Offer quantity deals (“buy 2, get the 3rd half price”) and a countdown during Ramadan or Black Friday. Average order value goes up, and delivery costs weigh less.',
      },
      {
        fr: 'Pour le dropshipping local, importe tes fiches produit par URL avec l’IA de Zuri, puis réécris le texte à ta façon avec des photos réelles. Les clients marocains repèrent vite les visuels copiés.',
        en: 'For local dropshipping, import product pages by URL with Zuri’s AI, then rewrite the text in your own words with real photos. Moroccan customers quickly spot copied visuals.',
      },
      {
        fr: 'Note la raison de chaque colis retourné. Si une ville revient souvent, augmente le frais de livraison ou demande une confirmation par message WhatsApp en plus de l’appel.',
        en: 'Write down why each parcel came back. If one city keeps showing up, raise the delivery fee or ask for a WhatsApp confirmation on top of the call.',
      },
    ],
    productIdeas: [
      { fr: 'Produits de beauté et soins (huiles, sérums, appareils de soin), souvent demandés en COD.', en: 'Beauty and skincare products (oils, serums, care devices), often requested with cash on delivery.' },
      { fr: 'Gadgets de cuisine et articles pour la maison, surtout avant le Ramadan.', en: 'Kitchen gadgets and household items, especially before Ramadan.' },
      { fr: 'Mode modeste, djellabas et tenues de fête pour l’Aïd.', en: 'Modest fashion, djellabas and festive outfits for Eid.' },
      { fr: 'Accessoires auto et moto, faciles à montrer en vidéo.', en: 'Car and motorbike accessories, easy to show on video.' },
      { fr: 'Fournitures et sacs scolaires au moment de la rentrée.', en: 'School supplies and bags around back to school.' },
      { fr: 'Produits pour bébé et jouets éducatifs, avec des explications rassurantes.', en: 'Baby products and educational toys, with reassuring explanations.' },
      { fr: 'Accessoires de téléphone et petits appareils électroniques.', en: 'Phone accessories and small electronics.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Maroc ?', en: 'How do I sell online in Morocco?' },
        a: {
          fr: 'Crée ta boutique Zuri en dirhams, ajoute tes produits, configure tes frais de livraison par ville et lance une pub Facebook, Instagram ou TikTok. Chaque commande arrive dans ton tableau de bord, tes closers la confirment, puis ta société de livraison encaisse à la porte.',
          en: 'Create your Zuri store in dirhams, add your products, set delivery fees per city and launch a Facebook, Instagram or TikTok ad. Each order lands in your dashboard, your agents confirm it, then your delivery company collects at the door.',
        },
      },
      {
        q: { fr: 'Zuri accepte-t-il le paiement en ligne au Maroc ?', en: 'Does Zuri support online payment in Morocco?' },
        a: {
          fr: 'Pas pour l’instant : aucun prestataire de paiement intégré à Zuri ne couvre le Maroc. En revanche, tout le flux COD fonctionne, et c’est le mode de paiement préféré de la plupart des acheteurs marocains en ligne.',
          en: 'Not for now: none of Zuri’s built-in payment providers covers Morocco. However, the whole cash on delivery flow works, and that is the payment method most Moroccan online buyers prefer.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Maroc ?', en: 'How do I do dropshipping in Morocco?' },
        a: {
          fr: 'Travaille avec un fournisseur ou un stock local pour livrer en quelques jours, vends sur Zuri en COD et confie la livraison à une société qui encaisse pour toi. Surveille ton taux de livraison : c’est lui qui décide si tu gagnes de l’argent.',
          en: 'Work with a local supplier or stock so you can deliver within days, sell on Zuri with cash on delivery and hand delivery to a company that collects for you. Watch your delivery rate: it decides whether you make money.',
        },
      },
      {
        q: { fr: 'Comment réduire les colis refusés au Maroc ?', en: 'How do I reduce refused parcels in Morocco?' },
        a: {
          fr: 'Appelle vite, confirme le prix total et l’adresse, envoie un récapitulatif WhatsApp et livre rapidement. Dans Zuri, suis les statuts injoignable et retournée pour repérer les produits, les villes ou les pubs qui posent problème.',
          en: 'Call fast, confirm the total price and address, send a WhatsApp summary and deliver quickly. In Zuri, follow the unreachable and returned statuses to spot the products, cities or ads causing trouble.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit au Maroc ?', en: 'Is there a free online store builder in Morocco?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine gratuit et l’affichage en dirhams.',
          en: 'Zuri is free during launch, with no commission on your sales, a free subdomain and prices shown in dirhams.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'tunisie',
    iso: 'TN',
    name: { fr: 'Tunisie', en: 'Tunisia' },
    inName: 'en Tunisie',
    region: 'afrique-nord',
    primaryLang: 'fr',
    currency: { code: 'TND', label: { fr: 'dinar tunisien', en: 'Tunisian dinar' } },
    cities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Nabeul', 'Monastir'],
    mobileMoney: [],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne en Tunisie : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Tunisia: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Tunisie avec une boutique en ligne gratuite : paiement à la livraison, closers, pub Facebook et Instagram, dropshipping local.',
      en: 'Sell online in Tunisia with a free online store: cash on delivery order form, closers team, Facebook and Instagram ads, local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne en Tunisie avec le paiement à la livraison',
      en: 'Sell online in Tunisia with cash on delivery',
    },
    intro: {
      fr: 'En Tunisie, le client commande souvent depuis une page Facebook ou Instagram et paie le livreur à la porte. Zuri te donne une page de vente rapide, un formulaire COD et un suivi des commandes pour que tes confirmations et tes livraisons ne se perdent plus dans les messages. On te dit aussi honnêtement ce que Zuri ne fait pas encore ici.',
      en: 'In Tunisia, shoppers often order from a Facebook or Instagram page and pay the courier at the door. Zuri gives you a fast sales page, a cash on delivery order form and order tracking, so your confirmations and deliveries stop getting lost in your inbox. We also tell you plainly what Zuri does not do here yet.',
    },
    market: [
      {
        fr: 'Le e-commerce tunisien s’est construit sur les réseaux sociaux. Beaucoup de boutiques vivent sur une page Facebook ou un compte Instagram, répondent en messages privés et prennent la commande à la main. Ça marche tant que tu fais quelques commandes par jour. Dès que la pub tourne bien, tu perds des clients faute de réponse rapide, et les commandes notées sur un cahier ou un tableur finissent par se mélanger.',
        en: 'Tunisian e-commerce grew up on social media. Many shops live on a Facebook page or an Instagram account, answer in private messages and take orders by hand. That works while you handle a few orders a day. Once your ads take off, you lose buyers because replies come too late, and orders written in a notebook or a spreadsheet start to get mixed up.',
      },
      {
        fr: 'Le paiement à la livraison reste le réflexe. Le client tunisien veut voir le produit avant de payer, surtout quand il ne connaît pas la marque. Il existe des solutions de paiement mobile comme D17 de La Poste Tunisienne ou Flouci, mais elles ne remplacent pas le COD pour la vente aux particuliers. Zuri n’a pas de prestataire Mobile Money intégré en Tunisie : ton encaissement passera par le livreur, et c’est très bien comme ça pour démarrer.',
        en: 'Cash on delivery is still the default. Tunisian buyers want to see the product before paying, especially when they do not know the brand. Mobile payment options exist, such as D17 from La Poste Tunisienne or Flouci, but they do not replace cash on delivery for consumer sales. Zuri has no integrated mobile money provider in Tunisia: you collect through the courier, and that is perfectly fine to get started.',
      },
      {
        fr: 'La livraison se fait surtout via des sociétés de livraison qui encaissent le COD pour toi et te reversent l’argent, ou via ton propre livreur sur le Grand Tunis. Le vrai coût caché, ce sont les colis refusés et les clients injoignables : chaque retour te coûte l’aller, le retour et le produit bloqué. D’où l’importance de confirmer chaque commande par téléphone avant d’expédier.',
        en: 'Deliveries mostly go through courier companies that collect the cash for you and pay you back, or through your own rider in Greater Tunis. The real hidden cost is refused parcels and unreachable buyers: every return costs you the outbound trip, the return trip and stock sitting idle. That is why calling every customer to confirm before shipping matters so much.',
      },
      {
        fr: 'Les grands moments de vente suivent le calendrier local : Ramadan et l’Aïd el-Fitr pour la maison, la cuisine et les vêtements, l’Aïd el-Kébir, la rentrée scolaire en septembre, l’été avec les mariages et les touristes, puis Black Friday qui prend de plus en plus de place en ligne. Prépare tes pubs et ton stock quelques semaines avant.',
        en: 'Peak sales follow the local calendar: Ramadan and Eid al-Fitr for home goods, kitchenware and clothing, Eid al-Adha, back to school in September, summer with weddings and tourists, then Black Friday, which keeps growing online. Plan your ads and stock a few weeks ahead.',
      },
      {
        fr: 'Point important sur la devise : Zuri n’affiche pas encore le dinar tunisien. Tu peux afficher tes prix en EUR ou en USD, ce qui convient surtout si tu vends à la diaspora ou à l’étranger. Si ta clientèle est 100 % locale et paie en dinars, garde ça en tête avant de te lancer et indique clairement le prix en dinars dans la description et au téléphone.',
        en: 'An important note on currency: Zuri does not display the Tunisian dinar yet. You can show prices in EUR or USD, which mainly suits sales to the diaspora or abroad. If your buyers are all local and pay in dinars, keep this in mind before you start and state the dinar price clearly in your product description and on the phone.',
      },
    ],
    tips: [
      {
        fr: 'Appelle chaque commande dans l’heure. Avec l’équipe de closers de Zuri, les commandes sont attribuées automatiquement et chaque closer passe la commande en « confirmée » ou « injoignable ». Tu vois tout de suite qui travaille et où ça bloque.',
        en: 'Call every order within the hour. With Zuri’s closers team, orders are assigned automatically and each closer marks them as confirmed or unreachable. You see right away who is working and where things get stuck.',
      },
      {
        fr: 'Demande au client sa délégation et un repère précis dans le formulaire. Les zones de livraison par ville te permettent de fixer un frais différent pour le Grand Tunis et pour l’intérieur du pays.',
        en: 'Ask for the customer’s district and a clear landmark in the order form. Delivery zones by city let you set one fee for Greater Tunis and another for the rest of the country.',
      },
      {
        fr: 'Écris ta page en français et en arabe tunisien simple si ta cible le comprend mieux. Une page courte, avec des photos réelles et une vidéo du produit, convertit mieux qu’un long texte.',
        en: 'Write your page in French, and add simple Tunisian Arabic if your audience reads it more easily. A short page with real photos and a product video converts better than a long text.',
      },
      {
        fr: 'Installe le pixel Facebook et l’API Conversions dès le premier jour. Instagram et Facebook restent les canaux principaux en Tunisie, et le pixel a besoin de données pour trouver les bons acheteurs.',
        en: 'Set up the Facebook pixel and the Conversions API on day one. Instagram and Facebook remain the main channels in Tunisia, and the pixel needs data to find the right buyers.',
      },
      {
        fr: 'Propose des packs par quantité (1, 2 ou 3 pièces) plutôt que des remises au hasard. Le panier moyen monte, et le coût de livraison par commande baisse.',
        en: 'Offer quantity packs (1, 2 or 3 items) instead of random discounts. Your average order goes up and your delivery cost per order goes down.',
      },
      {
        fr: 'Suis ton taux de livraison, pas seulement ton nombre de commandes. Zuri calcule le taux de confirmation, le taux de livraison et le chiffre encaissé : c’est ce dernier qui compte vraiment.',
        en: 'Track your delivery rate, not just your order count. Zuri shows your confirmation rate, delivery rate and cash collected: the last one is what really counts.',
      },
      {
        fr: 'Relance les paniers abandonnés par WhatsApp avec un message court et poli. Un client qui a rempli son numéro mais n’a pas validé est souvent juste hésitant.',
        en: 'Follow up abandoned carts on WhatsApp with a short, polite message. A buyer who typed a phone number but did not submit is often just hesitating.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires de cuisine et ustensiles pratiques, souvent demandés avant Ramadan.', en: 'Kitchen gadgets and practical utensils, often in demand before Ramadan.' },
      { fr: 'Cosmétiques et soins de la peau, à condition de bien expliquer la composition.', en: 'Cosmetics and skincare, as long as you explain the ingredients clearly.' },
      { fr: 'Vêtements modestes et tenues pour l’Aïd, souvent recherchés en ligne.', en: 'Modest fashion and Eid outfits, often searched for online.' },
      { fr: 'Accessoires pour téléphone et petits gadgets électroniques.', en: 'Phone accessories and small electronic gadgets.' },
      { fr: 'Articles de rangement et de décoration pour la maison.', en: 'Storage and home decor items.' },
      { fr: 'Fournitures et sacs pour la rentrée scolaire, en septembre.', en: 'School supplies and bags for back to school in September.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Tunisie ?', en: 'How do I sell online in Tunisia?' },
        a: {
          fr: 'Crée une page de vente par produit, ajoute un formulaire de commande paiement à la livraison, lance une pub Facebook ou Instagram, puis confirme chaque commande par téléphone avant d’expédier avec ta société de livraison. Zuri regroupe la page, le formulaire, le suivi des statuts COD et l’équipe de closers.',
          en: 'Build one sales page per product, add a cash on delivery order form, run a Facebook or Instagram ad, then confirm every order by phone before shipping with your courier. Zuri brings the page, the form, COD status tracking and your closers team together.',
        },
      },
      {
        q: { fr: 'Est-ce que Zuri encaisse le paiement mobile en Tunisie ?', en: 'Does Zuri collect mobile payments in Tunisia?' },
        a: {
          fr: 'Non. Aucun des prestataires intégrés à Zuri (FeexPay, FedaPay, PayDunya, PawaPay) ne couvre la Tunisie. Tu vends en paiement à la livraison, ce qui correspond déjà à l’habitude de la plupart des acheteurs tunisiens.',
          en: 'No. None of the providers integrated with Zuri (FeexPay, FedaPay, PayDunya, PawaPay) covers Tunisia. You sell with cash on delivery, which already matches how most Tunisian buyers prefer to pay.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Tunisie ?', en: 'What product should I sell online in Tunisia?' },
        a: {
          fr: 'Cherche un produit qui règle un problème visible, facile à montrer en vidéo et assez léger pour la livraison. La cuisine, la beauté, la maison et les accessoires sont souvent demandés. Teste avec un petit budget pub avant d’acheter du stock en quantité.',
          en: 'Look for a product that solves a visible problem, is easy to show on video and light enough to ship. Kitchen, beauty, home and accessories are often in demand. Test with a small ad budget before buying stock in bulk.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Tunisie ?', en: 'How do I do dropshipping in Tunisia?' },
        a: {
          fr: 'Le dropshipping qui marche ici est surtout local : tu travailles avec un grossiste ou un fournisseur qui a le stock en Tunisie, et tu t’occupes de la pub, de la confirmation et de la livraison COD. Les délais d’importation à la commande sont trop longs pour un client qui paie à la porte.',
          en: 'The dropshipping that works here is mostly local: you work with a wholesaler or supplier who holds stock in Tunisia, and you handle ads, confirmation and COD delivery. Ordering from abroad after each sale takes too long for a buyer who pays at the door.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit en Tunisie ?', en: 'Is there a free online store builder for Tunisia?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine gratuit et 0 % de commission sur tes ventes. Retiens seulement que les prix s’affichent en EUR ou en USD, le dinar n’étant pas encore géré.',
          en: 'Zuri is free during launch, with a free subdomain and 0% commission on your sales. Just keep in mind that prices display in EUR or USD, since the dinar is not supported yet.',
        },
      },
    ],
    sources: [
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'algerie',
    iso: 'DZ',
    name: { fr: 'Algérie', en: 'Algeria' },
    inName: 'en Algérie',
    region: 'afrique-nord',
    primaryLang: 'fr',
    currency: { code: 'DZD', label: { fr: 'dinar algérien', en: 'Algerian dinar' } },
    cities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif', 'Blida'],
    mobileMoney: [],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne en Algérie : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Algeria: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Algérie : boutique en ligne gratuite avec paiement à la livraison, confirmation par closers, livraison par wilaya et dropshipping.',
      en: 'Sell online in Algeria: free online store with cash on delivery, phone confirmation by closers, delivery fees by wilaya and local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne en Algérie : le COD bien organisé',
      en: 'Sell online in Algeria: cash on delivery, well organised',
    },
    intro: {
      fr: 'En Algérie, vendre en ligne veut presque toujours dire vendre en paiement à la livraison. La différence entre une boutique rentable et une boutique qui perd de l’argent se joue sur la confirmation, les frais par wilaya et les retours. Zuri t’aide à tenir ces trois points, sans te promettre un paiement en ligne qu’il ne gère pas ici.',
      en: 'In Algeria, selling online almost always means selling with cash on delivery. What separates a profitable shop from one that loses money is confirmation, delivery fees by wilaya and returns. Zuri helps you control those three things, without promising online payments it does not handle here.',
    },
    market: [
      {
        fr: 'Le modèle dominant est connu de tous les vendeurs : pub Facebook ou Instagram, formulaire de commande, appel de confirmation, envoi par une société de livraison qui encaisse en espèces et te reverse le montant. TikTok monte vite, surtout chez les plus jeunes, et sert de plus en plus à faire découvrir un produit avant la commande.',
        en: 'The dominant model is familiar to every seller: a Facebook or Instagram ad, an order form, a confirmation call, then shipping through a courier company that collects cash and pays you back. TikTok is growing fast, especially among younger buyers, and is increasingly used to discover a product before ordering.',
      },
      {
        fr: 'Côté paiement électronique, Algérie Poste propose la carte Edahabia et l’application BaridiMob, et les banques ont la carte CIB. Ce ne sont pas des portefeuilles Mobile Money d’opérateur comme en Afrique de l’Ouest, et la majorité des acheteurs en ligne continue de payer en espèces au livreur. Zuri n’a pas de prestataire de paiement intégré en Algérie : le COD est ton mode d’encaissement, et il fonctionne très bien avec Zuri.',
        en: 'For electronic payments, Algérie Poste offers the Edahabia card and the BaridiMob app, and banks issue CIB cards. These are not operator mobile money wallets like in West Africa, and most online buyers still pay the courier in cash. Zuri has no integrated payment provider in Algeria: cash on delivery is how you collect, and it works very well with Zuri.',
      },
      {
        fr: 'La livraison se calcule par wilaya, avec souvent deux options : livraison à domicile ou retrait au bureau du transporteur, moins cher. Ton formulaire doit donc demander la wilaya et la commune, et afficher le bon frais tout de suite. Un client qui découvre un frais plus élevé au téléphone a plus de chances d’annuler.',
        en: 'Delivery is priced by wilaya, often with two options: home delivery or pickup at the courier’s office, which is cheaper. Your order form should ask for the wilaya and the commune and show the right fee right away. A buyer who discovers a higher fee on the phone is more likely to cancel.',
      },
      {
        fr: 'Le gros risque, ce sont les retours : client injoignable, colis refusé à la porte, faux numéros. Chaque retour te coûte la livraison aller et retour. Les vendeurs qui durent appellent vite, rappellent les injoignables à des heures différentes, et ne gardent pas les commandes douteuses en stock trop longtemps.',
        en: 'The big risk is returns: unreachable buyers, parcels refused at the door, fake numbers. Every return costs you delivery both ways. Sellers who last call fast, call unreachable buyers back at different times of day and do not leave doubtful orders sitting for too long.',
      },
      {
        fr: 'Les pics de vente suivent Ramadan et l’Aïd el-Fitr, l’Aïd el-Adha, la saison des mariages en été et la rentrée scolaire. Pour la devise, Zuri n’affiche pas encore le dinar algérien : tes prix peuvent être affichés en EUR ou en USD. Si tu vends uniquement en dinars, précise le prix en dinars dans le texte de la page et confirme-le au téléphone.',
        en: 'Sales peak around Ramadan and Eid al-Fitr, Eid al-Adha, the summer wedding season and back to school. On currency, Zuri does not display the Algerian dinar yet: your prices can show in EUR or USD. If you sell only in dinars, state the dinar price in your page text and confirm it on the phone.',
      },
    ],
    tips: [
      {
        fr: 'Configure tes zones de livraison par wilaya dans Zuri avec le bon frais pour chacune. Le client voit le total avant de valider, et tu évites les annulations au téléphone.',
        en: 'Set up your delivery zones by wilaya in Zuri with the right fee for each. The buyer sees the total before submitting, and you avoid cancellations on the phone.',
      },
      {
        fr: 'Monte une petite équipe de closers et laisse Zuri répartir les commandes automatiquement. Un closer qui appelle dans les minutes qui suivent la commande confirme beaucoup plus qu’un appel le lendemain.',
        en: 'Build a small closers team and let Zuri split orders automatically. A closer who calls within minutes of the order confirms far more than a call the next day.',
      },
      {
        fr: 'Utilise le statut « injoignable » sérieusement : rappelle trois fois à des moments différents avant d’annuler. Le soir et après la rupture du jeûne pendant Ramadan sont souvent les meilleurs créneaux.',
        en: 'Use the unreachable status properly: call back three times at different moments before cancelling. Evenings, and after iftar during Ramadan, are often the best times.',
      },
      {
        fr: 'Filme ton produit en darija ou en français simple pour TikTok et Facebook. Une vidéo qui montre le produit en main rassure plus qu’une image de catalogue.',
        en: 'Film your product in Darija or simple French for TikTok and Facebook. A video showing the product in hand reassures more than a catalogue picture.',
      },
      {
        fr: 'Affiche clairement ce que contient le colis et la politique d’échange. Les colis refusés viennent souvent d’un client qui s’attendait à autre chose.',
        en: 'Show clearly what is in the parcel and your exchange policy. Refused parcels often come from a buyer who expected something else.',
      },
      {
        fr: 'Teste un pack « 2 achetés, livraison offerte » ou une offre par quantité. Avec des frais de livraison qui pèsent lourd, augmenter le panier change ta marge.',
        en: 'Test a "buy 2, free delivery" pack or a quantity offer. With delivery fees weighing heavily, a bigger basket changes your margin.',
      },
      {
        fr: 'Regarde chaque semaine ton chiffre encaissé, pas seulement les commandes reçues. C’est l’argent réellement reversé par le livreur qui dit si ta pub est rentable.',
        en: 'Check your cash collected every week, not just orders received. The money the courier actually pays back is what tells you whether your ads are profitable.',
      },
    ],
    productIdeas: [
      { fr: 'Ustensiles et appareils de cuisine, souvent demandés avant Ramadan.', en: 'Kitchen tools and small appliances, often in demand before Ramadan.' },
      { fr: 'Soins capillaires et cosmétiques, avec des explications claires.', en: 'Hair care and cosmetics, with clear explanations.' },
      { fr: 'Vêtements et accessoires pour l’Aïd et les mariages.', en: 'Clothing and accessories for Eid and weddings.' },
      { fr: 'Gadgets pour la voiture et accessoires de téléphone.', en: 'Car gadgets and phone accessories.' },
      { fr: 'Jouets éducatifs et articles pour enfants.', en: 'Educational toys and kids’ items.' },
      { fr: 'Articles de maison pratiques : rangement, nettoyage, linge.', en: 'Practical home items: storage, cleaning, linen.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Algérie ?', en: 'How do I sell online in Algeria?' },
        a: {
          fr: 'Choisis un produit, crée une page de vente avec un formulaire paiement à la livraison qui demande la wilaya, lance une pub Facebook, Instagram ou TikTok, confirme par téléphone puis expédie avec ta société de livraison. Zuri gère la page, le formulaire, les frais par zone et le suivi des statuts.',
          en: 'Pick a product, build a sales page with a cash on delivery form that asks for the wilaya, run a Facebook, Instagram or TikTok ad, confirm by phone, then ship with your courier. Zuri handles the page, the form, zone fees and status tracking.',
        },
      },
      {
        q: { fr: 'Peut-on encaisser en ligne en Algérie avec Zuri ?', en: 'Can I take online payments in Algeria with Zuri?' },
        a: {
          fr: 'Pas pour l’instant. Zuri n’a aucun prestataire de paiement intégré en Algérie. Tu encaisses en paiement à la livraison via ton livreur, ce que la grande majorité des acheteurs préfère de toute façon.',
          en: 'Not for now. Zuri has no integrated payment provider in Algeria. You collect with cash on delivery through your courier, which most buyers prefer anyway.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Algérie ?', en: 'How do I do dropshipping in Algeria?' },
        a: {
          fr: 'Travaille avec un fournisseur qui a déjà le stock en Algérie et qui peut préparer les colis. Toi, tu gères la pub, la confirmation et le suivi des livraisons. Mets-toi d’accord sur qui paie les retours avant de commencer.',
          en: 'Work with a supplier who already has stock in Algeria and can pack orders. You handle ads, confirmation and delivery tracking. Agree on who pays for returns before you start.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Algérie ?', en: 'What product should I sell online in Algeria?' },
        a: {
          fr: 'Un produit facile à montrer en vidéo, qui ne casse pas pendant le transport et qui laisse une marge après la livraison et les retours. La cuisine, la maison, la beauté et les accessoires sont souvent demandés, mais teste toujours avec un petit budget.',
          en: 'A product that is easy to show on video, does not break in transit and leaves a margin after delivery and returns. Kitchen, home, beauty and accessories are often in demand, but always test with a small budget.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit en Algérie ?', en: 'Free online store builder in Algeria?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, sans commission sur tes ventes et avec un sous-domaine offert. Les prix s’affichent en EUR ou en USD, car le dinar n’est pas encore géré.',
          en: 'Zuri is free during launch, with no commission on your sales and a free subdomain. Prices display in EUR or USD because the dinar is not supported yet.',
        },
      },
    ],
    sources: [
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'nigeria',
    iso: 'NG',
    name: { fr: 'Nigeria', en: 'Nigeria' },
    inName: 'au Nigeria',
    region: 'afrique-ouest',
    primaryLang: 'en',
    currency: { code: 'NGN', label: { fr: 'naira', en: 'naira' } },
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City'],
    mobileMoney: ['MTN MoMo', 'Airtel SmartCash', 'OPay', 'PalmPay'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne au Nigeria : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Nigeria: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Nigeria : boutique en ligne gratuite en naira, paiement à la livraison, closers, dropshipping local et paiement à la livraison d’abord.',
      en: 'Sell online in Nigeria: free online store in naira, pay on delivery order form, closers team and local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne au Nigeria, du formulaire au cash encaissé',
      en: 'Sell online in Nigeria, from order form to cash collected',
    },
    intro: {
      fr: 'Au Nigeria, l’acheteur en ligne veut une page qui charge vite, un prix clair en naira et la possibilité de payer à la livraison. Zuri te donne tout ça, plus une équipe de closers pour confirmer les commandes avant l’envoi.',
      en: 'In Nigeria, online shoppers want a page that loads fast, a clear price in naira and the option to pay on delivery. Zuri gives you all of that, plus a closers team to confirm orders before shipping.',
    },
    market: [
      {
        fr: 'Le Nigeria est l’un des marchés les plus actifs du continent pour la vente sur les réseaux. Instagram et WhatsApp sont au cœur du commerce, Facebook reste fort pour la pub, et TikTok sert énormément à faire découvrir des produits. Beaucoup de vendeurs commencent avec un catalogue WhatsApp et des DM, puis passent à une vraie page de commande quand le volume augmente.',
        en: 'Nigeria is one of the most active markets on the continent for social selling. Instagram and WhatsApp sit at the heart of trade, Facebook is still strong for ads, and TikTok does a lot of the product discovery. Many sellers start with a WhatsApp catalogue and DMs, then move to a proper order page once volume grows.',
      },
      {
        fr: 'Côté paiement, le virement bancaire instantané est très courant, tout comme les applis de paiement comme OPay, PalmPay ou Moniepoint. Le paiement à la livraison (« pay on delivery ») reste pourtant le moyen le plus sûr de convaincre un client qui ne te connaît pas, surtout après une pub. Pour le Mobile Money, Zuri se connecte à ton compte PawaPay, mais au Nigeria MTN et Airtel y sont réservés aux comptes Entreprise de PawaPay (page officielle de ses offres) : vérifie ton éligibilité avec eux, et compte d’abord sur le paiement à la livraison.',
        en: 'On payments, instant bank transfers are very common, and so are payment apps like OPay, PalmPay and Moniepoint. Pay on delivery is still the safest way to convince a buyer who does not know you, especially after an ad. For mobile money, Zuri connects to your own PawaPay account, but in Nigeria MTN and Airtel are only available on PawaPay’s Enterprise plan (per its official plans page): check your eligibility with them, and rely on pay on delivery first.',
      },
      {
        fr: 'La livraison est le vrai défi. À Lagos, les embouteillages rendent les livraisons de l’après-midi incertaines, et les livreurs à moto restent la solution la plus rapide pour le dernier kilomètre. Entre États, tu passes par des sociétés de logistique ou des agences de transport. Les livraisons en dehors de ta ville prennent plus de temps, et c’est là que les clients injoignables et les colis refusés coûtent le plus cher.',
        en: 'Delivery is the real challenge. In Lagos, traffic makes afternoon drops unpredictable, and motorbike riders remain the fastest option for the last mile. Between states, you go through logistics companies or transport parks. Deliveries outside your city take longer, and that is where unreachable buyers and refused parcels cost the most.',
      },
      {
        fr: 'Les clients nigérians comparent vite et se méfient des arnaques en ligne. Une page avec de vraies photos, des avis, un numéro WhatsApp joignable et une politique de livraison claire rassure beaucoup. Les grosses périodes : Black Friday, la saison de Noël et les fêtes de fin d’année, Pâques, la Sallah dans le Nord, et la rentrée scolaire en septembre.',
        en: 'Nigerian buyers compare quickly and are wary of online scams. A page with real photos, reviews, a reachable WhatsApp number and a clear delivery policy builds a lot of trust. Big seasons: Black Friday, Christmas and the year end festive period, Easter, Sallah in the North, and back to school in September.',
      },
    ],
    tips: [
      {
        fr: 'Fixe des zones de livraison par ville (Lagos Island, Mainland, Abuja, autres États) avec des frais différents. Le client voit le total tout de suite et tu ne perds pas de marge sur les longues distances.',
        en: 'Set delivery zones by area (Lagos Island, Mainland, Abuja, other states) with different fees. The buyer sees the total right away and you do not lose margin on long distances.',
      },
      {
        fr: 'Demande un acompte par Mobile Money ou virement pour les commandes hors de ta ville. Ça filtre les commandes peu sérieuses et réduit les retours coûteux.',
        en: 'Ask for a small deposit by mobile money or transfer for orders outside your city. It filters out unserious orders and cuts expensive returns.',
      },
      {
        fr: 'Confirme chaque commande par appel ou WhatsApp avant de la confier au livreur. Avec les closers de Zuri, chaque commande passe de « nouvelle » à « confirmée » ou « injoignable », et tu vois qui avance.',
        en: 'Confirm every order by call or WhatsApp before handing it to a rider. With Zuri closers, each order moves from new to confirmed or unreachable, and you can see who is making progress.',
      },
      {
        fr: 'Utilise le pixel TikTok en plus du pixel Facebook. Une vidéo courte, filmée au téléphone, avec un hook dans les deux premières secondes, marche souvent mieux qu’un visuel trop léché.',
        en: 'Use the TikTok pixel alongside the Facebook pixel. A short phone video with a hook in the first two seconds often beats an overly polished visual.',
      },
      {
        fr: 'Mets le bouton WhatsApp bien visible. Beaucoup d’acheteurs veulent poser une question avant de commander, et une réponse rapide transforme souvent la visite en commande.',
        en: 'Make the WhatsApp button easy to see. Many buyers want to ask a question before ordering, and a quick reply often turns the visit into an order.',
      },
      {
        fr: 'Garde ta page légère. Les pages Zuri pèsent environ 23 Ko de JavaScript, ce qui aide sur une connexion mobile lente. Évite d’ajouter des vidéos lourdes en lecture automatique.',
        en: 'Keep your page light. Zuri pages ship about 23 KB of JavaScript, which helps on a slow mobile connection. Avoid adding heavy autoplay videos.',
      },
      {
        fr: 'Propose des offres par quantité pour Noël et Black Friday, avec un compte à rebours honnête. Ne fais pas de fausse urgence : les clients nigérians repèrent vite les faux chronos.',
        en: 'Run quantity offers for Christmas and Black Friday with an honest countdown. Avoid fake urgency: Nigerian buyers spot fake timers quickly.',
      },
    ],
    productIdeas: [
      { fr: 'Soins de la peau et des cheveux, très souvent demandés en ligne.', en: 'Skincare and hair care, very often in demand online.' },
      { fr: 'Perruques, extensions et accessoires de coiffure.', en: 'Wigs, extensions and hair accessories.' },
      { fr: 'Accessoires de téléphone, power banks et petits gadgets.', en: 'Phone accessories, power banks and small gadgets.' },
      { fr: 'Petits appareils de cuisine pratiques.', en: 'Practical small kitchen appliances.' },
      { fr: 'Vêtements, sneakers et sacs tendance.', en: 'Trendy clothing, sneakers and bags.' },
      { fr: 'Produits numériques : formations, ebooks, modèles, que tu peux vendre directement sur Zuri.', en: 'Digital products: courses, ebooks, templates, which you can sell directly on Zuri.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Nigeria ?', en: 'How do I sell online in Nigeria?' },
        a: {
          fr: 'Crée ta boutique, ajoute une page de vente par produit avec un formulaire paiement à la livraison, branche ton pixel Facebook ou TikTok, puis confirme et livre chaque commande. Zuri suit les statuts et calcule le cash encaissé.',
          en: 'Create your store, add one sales page per product with a pay on delivery form, connect your Facebook or TikTok pixel, then confirm and deliver each order. Zuri tracks statuses and works out the cash you collected.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Nigeria ?', en: 'How do I collect mobile money in Nigeria?' },
        a: {
          fr: 'Au Nigeria, MTN et Airtel ne sont proposés par PawaPay qu’avec son offre Entreprise. Si ton compte y a accès, connecte-le à Zuri : le paiement arrive sur ton compte PawaPay et Zuri ne garde jamais l’argent. Sinon, le paiement à la livraison fonctionne partout.',
          en: 'In Nigeria, PawaPay only offers MTN and Airtel on its Enterprise plan. If your account has access, connect it to Zuri: payments land in your PawaPay account and Zuri never holds the money. Otherwise, pay on delivery works everywhere.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Nigeria ?', en: 'How do I do dropshipping in Nigeria?' },
        a: {
          fr: 'Le plus fiable est le dropshipping local : un fournisseur à Lagos ou dans ta ville garde le stock, toi tu fais la pub et la confirmation. Les délais d’import après chaque commande font exploser les annulations en paiement à la livraison.',
          en: 'The most reliable route is local dropshipping: a supplier in Lagos or your city holds the stock while you handle ads and confirmation. Import delays after each order send cancellations through the roof with pay on delivery.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Nigeria ?', en: 'What should I sell online in Nigeria?' },
        a: {
          fr: 'La beauté, les cheveux, la mode et les gadgets sont souvent demandés, mais la concurrence est forte. Cherche un angle précis, teste avec un petit budget et garde ce qui se livre vraiment, pas seulement ce qui se commande.',
          en: 'Beauty, hair, fashion and gadgets are often in demand, but competition is tough. Find a specific angle, test on a small budget and keep what actually gets delivered, not just what gets ordered.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Nigeria ?', en: 'Is there a free online store builder in Nigeria?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert, des prix en naira et 0 % de commission sur tes ventes.',
          en: 'Zuri is free during launch, with a free subdomain, prices in naira and 0% commission on your sales.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'ghana',
    iso: 'GH',
    name: { fr: 'Ghana', en: 'Ghana' },
    inName: 'au Ghana',
    region: 'afrique-ouest',
    primaryLang: 'en',
    currency: { code: 'GHS', label: { fr: 'cedi ghanéen', en: 'Ghanaian cedi' } },
    cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema'],
    mobileMoney: ['MTN MoMo', 'Telecel Cash', 'AT Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne au Ghana : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Ghana: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Ghana : boutique en ligne gratuite en cedis, Mobile Money MTN MoMo via PawaPay, paiement à la livraison et dropshipping local.',
      en: 'Sell online in Ghana: free online store in cedis, MTN MoMo and mobile money via PawaPay, cash on delivery order form and local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne au Ghana avec MoMo et le paiement à la livraison',
      en: 'Sell online in Ghana with MoMo and cash on delivery',
    },
    intro: {
      fr: 'Au Ghana, MoMo fait partie du quotidien, et beaucoup de clients préfèrent quand même payer quand le colis arrive. Avec Zuri, tu proposes les deux : le Mobile Money via ton compte PawaPay et le paiement à la livraison, sur une page en cedis pensée pour les connexions mobiles.',
      en: 'In Ghana, MoMo is part of everyday life, yet many buyers still prefer to pay when the parcel arrives. With Zuri you offer both: mobile money through your own PawaPay account and cash on delivery, on a page priced in cedis and built for mobile connections.',
    },
    market: [
      {
        fr: 'Le Mobile Money est très installé au Ghana. MTN MoMo est le plus connu, avec Telecel Cash (ex Vodafone Cash) et AT Money. Les gens paient leurs factures, envoient de l’argent à la famille et règlent de petits achats avec leur téléphone. Pour un vendeur en ligne, ça veut dire que le paiement d’avance ou l’acompte est plus facile à demander qu’ailleurs, surtout à un client fidèle.',
        en: 'Mobile money is deeply rooted in Ghana. MTN MoMo is the best known, alongside Telecel Cash (formerly Vodafone Cash) and AT Money. People pay bills, send money to family and settle small purchases from their phones. For an online seller, that means upfront payment or a deposit is easier to ask for than in many places, especially from repeat buyers.',
      },
      {
        fr: 'Pour un nouveau client venu d’une pub, le paiement à la livraison reste rassurant. Beaucoup de vendeurs proposent « pay on delivery » à Accra et Kumasi, et demandent un paiement MoMo d’avance pour les autres régions, où l’envoi se fait par bus ou par société de livraison. Zuri te laisse choisir : COD, Mobile Money via PawaPay (MTN, AirtelTigo et Telecel pris en charge), ou les deux.',
        en: 'For a new buyer coming from an ad, cash on delivery is still reassuring. Many sellers offer pay on delivery in Accra and Kumasi and ask for MoMo upfront for other regions, where parcels travel by bus or through a courier company. Zuri lets you choose: COD, mobile money through PawaPay (MTN, AirtelTigo and Telecel supported), or both.',
      },
      {
        fr: 'Les ventes se font beaucoup sur WhatsApp, Instagram, Facebook et TikTok. Le livreur à moto est la norme dans les grandes villes, et les embouteillages d’Accra rendent les créneaux importants : un client qui attend toute la journée sans nouvelles devient vite injoignable. Préviens-le avant le passage du livreur.',
        en: 'Sales happen a lot on WhatsApp, Instagram, Facebook and TikTok. Motorbike riders are the norm in big cities, and Accra traffic makes time slots important: a buyer who waits all day without news quickly becomes unreachable. Let them know before the rider sets off.',
      },
      {
        fr: 'Les temps forts : Noël et la fin d’année, Black Friday qui prend de l’ampleur, la fête de l’Indépendance le 6 mars, Pâques, et la rentrée scolaire. Le Ramadan et l’Aïd comptent aussi pour une partie de la clientèle, surtout dans le Nord.',
        en: 'Key seasons: Christmas and the year end, Black Friday which keeps growing, Independence Day on 6 March, Easter, and back to school. Ramadan and Eid also matter for part of your audience, especially in the North.',
      },
    ],
    tips: [
      {
        fr: 'Active le Mobile Money via ton compte PawaPay et propose une petite remise pour le paiement d’avance. Tu réduis les colis refusés et tu encaisses plus vite.',
        en: 'Turn on mobile money through your PawaPay account and offer a small discount for paying upfront. You cut refused parcels and get paid faster.',
      },
      {
        fr: 'Garde le paiement à la livraison pour Accra et Kumasi, et demande un acompte MoMo pour les envois longue distance. Configure les zones et les frais par ville dans Zuri.',
        en: 'Keep cash on delivery for Accra and Kumasi and ask for a MoMo deposit on long distance shipments. Set zones and fees by city in Zuri.',
      },
      {
        fr: 'Écris ta page en anglais simple, et ajoute une phrase en twi si ta cible s’y retrouve. Le ton local crée la confiance plus vite qu’un texte corporate.',
        en: 'Write your page in simple English, and add a line in Twi if your audience connects with it. A local tone builds trust faster than corporate copy.',
      },
      {
        fr: 'Envoie un message WhatsApp au client le matin de la livraison. Les injoignables baissent quand le client sait que le livreur arrive.',
        en: 'Send the buyer a WhatsApp message on the morning of delivery. Unreachable rates drop when buyers know the rider is coming.',
      },
      {
        fr: 'Utilise le son d’encaissement de Zuri pour réagir tout de suite aux nouvelles commandes. Plus tu appelles vite, plus le taux de confirmation monte.',
        en: 'Use Zuri’s cash register sound to react to new orders right away. The faster you call, the higher your confirmation rate.',
      },
      {
        fr: 'Teste des packs pour Noël (coffrets, lots de deux) avec un stock limité réel affiché. L’effet cadeau marche bien en décembre.',
        en: 'Test Christmas bundles (gift sets, two packs) with real limited stock displayed. Gift buying works well in December.',
      },
      {
        fr: 'Compare chaque semaine commandes, livraisons et cash encaissé dans le tableau de bord. Coupe les pubs qui font des commandes mais peu de livraisons.',
        en: 'Compare orders, deliveries and cash collected every week on your dashboard. Cut ads that bring orders but few deliveries.',
      },
    ],
    productIdeas: [
      { fr: 'Produits de beauté et soins naturels (karité, huiles), souvent demandés.', en: 'Beauty and natural care products (shea butter, oils), often in demand.' },
      { fr: 'Vêtements et accessoires en tissu wax ou kente revisités.', en: 'Clothing and accessories in wax print or modern kente styles.' },
      { fr: 'Accessoires de téléphone et petits appareils électroniques.', en: 'Phone accessories and small electronics.' },
      { fr: 'Articles de cuisine et de maison pratiques.', en: 'Practical kitchen and home items.' },
      { fr: 'Fournitures scolaires et sacs, à la rentrée.', en: 'School supplies and bags at back to school.' },
      { fr: 'Coffrets cadeaux pour Noël et la Saint-Valentin.', en: 'Gift sets for Christmas and Valentine’s Day.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Ghana ?', en: 'How do I sell online in Ghana?' },
        a: {
          fr: 'Ouvre ta boutique Zuri, crée une page par produit en cedis, active le paiement à la livraison et le Mobile Money via PawaPay, puis fais connaître ta page sur WhatsApp, Instagram, Facebook ou TikTok.',
          en: 'Open your Zuri store, create a page per product in cedis, turn on cash on delivery and mobile money through PawaPay, then share your page on WhatsApp, Instagram, Facebook or TikTok.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money au Ghana ?', en: 'How do I collect mobile money in Ghana?' },
        a: {
          fr: 'Connecte ton compte PawaPay à Zuri. PawaPay prend en charge MTN, AirtelTigo et Telecel au Ghana. L’argent arrive sur ton compte PawaPay, Zuri ne le touche jamais.',
          en: 'Connect your PawaPay account to Zuri. PawaPay supports MTN, AirtelTigo and Telecel in Ghana. The money goes to your PawaPay account; Zuri never touches it.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Ghana ?', en: 'How do I do dropshipping in Ghana?' },
        a: {
          fr: 'Associe-toi à un fournisseur local à Accra ou Kumasi qui garde le stock, puis occupe-toi de la pub, de la confirmation et du suivi des livraisons. Fixe les règles de retour avec lui dès le départ.',
          en: 'Partner with a local supplier in Accra or Kumasi who holds the stock, then handle ads, confirmation and delivery tracking yourself. Agree on return rules with them from the start.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Ghana ?', en: 'What product should I sell online in Ghana?' },
        a: {
          fr: 'La beauté, la mode, la maison et les accessoires de téléphone sont souvent demandés. Le bon produit est celui qui se livre bien et que tu peux montrer en vidéo ; valide-le avec un petit test de pub.',
          en: 'Beauty, fashion, home goods and phone accessories are often in demand. The right product is one that ships well and that you can show on video; validate it with a small ad test.',
        },
      },
      {
        q: { fr: 'Site de vente en ligne gratuit au Ghana ?', en: 'Free online store builder in Ghana?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert, des prix en cedis et 0 % de commission.',
          en: 'Zuri is free during launch, with a free subdomain, prices in cedis and 0% commission.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'kenya',
    iso: 'KE',
    name: { fr: 'Kenya', en: 'Kenya' },
    inName: 'au Kenya',
    region: 'afrique-est',
    primaryLang: 'en',
    currency: { code: 'KES', label: { fr: 'shilling kényan (KES)', en: 'Kenyan shilling (KES)' } },
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    mobileMoney: ['M-Pesa', 'Airtel Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne au Kenya : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Kenya: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Kenya : boutique en ligne gratuite, paiement à la livraison, closers et pub TikTok. Idéal pour le dropshipping.',
      en: 'Sell online in Kenya with a free online store: pay on delivery, order confirmation team and TikTok ads. Built for local dropshipping.',
    },
    h1: {
      fr: 'Vendre en ligne au Kenya, du statut WhatsApp au paiement M-Pesa',
      en: 'Sell online in Kenya, from WhatsApp status to M-Pesa payment',
    },
    intro: {
      fr: 'Au Kenya, M-Pesa fait partie du quotidien et beaucoup de clients préfèrent payer quand le colis arrive. Avec Zuri, tu crées une boutique légère en shillings, tu reçois des commandes en paiement à la livraison, et ton client peut régler le livreur par M-Pesa.',
      en: 'In Kenya, M-Pesa is part of daily life, yet many buyers still want to pay when the parcel reaches them. Zuri gives you a light store priced in shillings, a pay on delivery order form, and customers can pay the rider with M-Pesa.',
    },
    market: [
      {
        fr: 'Le Kenya est un des marchés où le Mobile Money est le plus ancré : les gens paient le loyer, le taxi et le marché avec M-Pesa, via Paybill ou numéro Till. Pour un vendeur en ligne, ça change la donne : tu peux demander un paiement M-Pesa au moment de la livraison au lieu de gérer des billets, et ton livreur n’a plus besoin de transporter de liquide. Airtel Money existe aussi, surtout chez une partie des clients qui ont une seconde puce.',
        en: 'Kenya is one of the markets where mobile money runs deepest: people pay rent, rides and groceries with M-Pesa through Paybill or a Till number. For an online seller this matters: you can ask for an M-Pesa payment at the door instead of handling cash, and your rider does not have to carry money around. Airtel Money is also used, often by buyers who keep a second SIM.',
      },
      {
        fr: 'Même si le paiement mobile est simple, la confiance reste le vrai frein. Un client qui découvre ta pub sur TikTok ou Facebook ne te connaît pas, et il a souvent déjà entendu parler d’arnaques. C’est pour ça que le paiement à la livraison (souvent appelé « pay on delivery ») reste le modèle qui convertit le mieux pour les nouvelles boutiques : le client voit le produit, puis paie en cash ou par M-Pesa devant le livreur.',
        en: 'Paying by phone is easy, but trust is still the real barrier. Someone who finds your ad on TikTok or Facebook does not know you yet, and has probably heard stories about online scams. That is why pay on delivery is still what converts best for a new store: the buyer sees the item first, then pays cash or M-Pesa in front of the rider.',
      },
      {
        fr: 'La livraison à Nairobi se fait surtout en boda boda, ces motos taxis qui se faufilent dans les embouteillages de Westlands, du CBD ou de Rongai. Pour les autres villes comme Mombasa, Kisumu, Nakuru ou Eldoret, beaucoup de vendeurs passent par des colis envoyés en matatu ou en bus longue distance, puis le client récupère au bureau. Prévois des frais et des délais différents pour la capitale et pour les envois vers les comtés.',
        en: 'Inside Nairobi, most deliveries go by boda boda, the motorbike taxis that weave through traffic from the CBD to Westlands or Rongai. For Mombasa, Kisumu, Nakuru or Eldoret, many sellers send parcels through matatu or long distance bus parcel services and the buyer collects at the office. Set different fees and delivery times for Nairobi and for upcountry orders.',
      },
      {
        fr: 'Côté réseaux, TikTok est devenu une vitrine énorme pour les jeunes urbains, Instagram reste fort sur la mode et la beauté, et Facebook touche un public plus large. Les conversations finissent presque toujours sur WhatsApp, où le client pose ses questions en anglais ou en swahili. Les pics de vente suivent le calendrier local : rentrée scolaire en janvier, Madaraka Day en juin, Mashujaa Day en octobre, Black Friday puis Jamhuri Day et Noël en décembre.',
        en: 'On social media, TikTok has become a huge shop window for young urban buyers, Instagram is strong for fashion and beauty, and Facebook reaches a wider crowd. Conversations almost always end up on WhatsApp, where buyers ask questions in English or Swahili. Sales peaks follow the local calendar: back to school in January, Madaraka Day in June, Mashujaa Day in October, then Black Friday, Jamhuri Day and Christmas in December.',
      },
    ],
    tips: [
      {
        fr: 'Affiche tes prix en KES, avec des montants ronds faciles à taper sur M-Pesa. Zuri gère le shilling kényan, ton client voit donc exactement ce qu’il va payer.',
        en: 'Show prices in KES with round amounts that are easy to type into M-Pesa. Zuri supports the Kenyan shilling, so your buyer sees exactly what they will pay.',
      },
      {
        fr: 'Garde le paiement à la livraison et laisse le client payer le livreur par M-Pesa. Le paiement M-Pesa en ligne via PawaPay n’est ouvert qu’aux comptes Entreprise de PawaPay au Kenya : vérifie ton éligibilité avec eux.',
        en: 'Keep pay on delivery and let customers pay the rider with M-Pesa. Online M-Pesa through PawaPay is only available on PawaPay’s Enterprise plan in Kenya: check your eligibility with them.',
      },
      {
        fr: 'Crée tes zones de livraison par ville : Nairobi en boda boda avec un tarif, puis Mombasa, Kisumu, Nakuru et Eldoret avec un tarif colis et un délai plus long. Le client voit les frais avant de valider, donc moins de refus.',
        en: 'Set up delivery zones by city: Nairobi by boda boda at one rate, then Mombasa, Kisumu, Nakuru and Eldoret at a parcel rate with a longer delay. Buyers see the fee before they order, so fewer refusals at the door.',
      },
      {
        fr: 'Appelle chaque commande vite, idéalement dans l’heure. Avec l’équipe de closers de Zuri, les commandes sont attribuées automatiquement et chaque statut (nouvelle, injoignable, confirmée, expédiée, livrée, retournée) est suivi.',
        en: 'Call every order fast, ideally within the hour. With Zuri’s closer team feature, orders are assigned automatically and every status (new, unreachable, confirmed, shipped, delivered, returned) is tracked.',
      },
      {
        fr: 'Filme tes produits en vrai, à Nairobi, avec une voix en anglais ou en sheng. Les vidéos TikTok simples et authentiques rassurent plus qu’une photo de catalogue, et le pixel TikTok de Zuri te permet de mesurer quelles vidéos vendent.',
        en: 'Film your products for real, in Nairobi, with a voiceover in English or Sheng. Simple, honest TikTok videos reassure more than catalogue photos, and Zuri’s TikTok pixel shows you which videos actually sell.',
      },
      {
        fr: 'Utilise les packs par quantité (« 2 pour », « 3 pour ») pour augmenter le panier moyen. Comme le coût de livraison est le même, chaque article en plus améliore ta marge.',
        en: 'Use quantity bundles (buy 2, buy 3) to raise your average order. The delivery cost stays the same, so every extra item improves your margin.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires de téléphone (chargeurs rapides, coques, écouteurs sans fil), souvent demandés en ville.', en: 'Phone accessories (fast chargers, cases, wireless earbuds), often requested in cities.' },
      { fr: 'Produits de soin de la peau et des cheveux naturels, populaires sur TikTok et Instagram.', en: 'Skin care and natural hair products, popular on TikTok and Instagram.' },
      { fr: 'Petits appareils de cuisine (blenders, friteuses à air) qui se démontrent bien en vidéo.', en: 'Small kitchen appliances (blenders, air fryers) that demo well on video.' },
      { fr: 'Sacs, chaussures et vêtements pour la rentrée et le bureau.', en: 'Bags, shoes and clothing for back to school and the office.' },
      { fr: 'Lampes solaires et petites batteries externes, utiles lors des coupures.', en: 'Solar lamps and power banks, useful during power cuts.' },
      { fr: 'Articles pour bébé et pour la maison, souvent achetés en pack.', en: 'Baby items and home goods, often bought in bundles.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Kenya ?', en: 'How do I sell online in Kenya?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute tes produits en KES, active le paiement à la livraison et règle tes zones de livraison. Lance ensuite une pub TikTok ou Facebook vers ta page, confirme chaque commande par téléphone et livre en boda boda à Nairobi ou par colis vers les autres villes.',
          en: 'Create your Zuri store, add products in KES, turn on pay on delivery and set your delivery zones. Then run a TikTok or Facebook ad to your page, confirm every order by phone, and deliver by boda boda in Nairobi or by parcel to other towns.',
        },
      },
      {
        q: { fr: 'Comment encaisser M-Pesa avec Zuri au Kenya ?', en: 'How do I collect M-Pesa payments with Zuri in Kenya?' },
        a: {
          fr: 'Zuri se connecte à ton propre compte PawaPay, mais au Kenya M-Pesa n’y est proposé qu’avec l’offre Entreprise de PawaPay. Si tu y as accès, l’argent arrive sur ton compte marchand et Zuri ne détient jamais tes fonds. Sinon, le paiement à la livraison (avec M-Pesa au livreur) reste la solution simple.',
          en: 'Zuri connects to your own PawaPay account, but in Kenya M-Pesa is only offered on PawaPay’s Enterprise plan. If you have access, money lands in your merchant account and Zuri never holds your funds. Otherwise, pay on delivery (with M-Pesa to the rider) is the simple option.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Kenya ?', en: 'What products sell online in Kenya?' },
        a: {
          fr: 'Les accessoires de téléphone, la beauté, les petits appareils de cuisine et la mode sont souvent demandés. Teste un produit avec un petit budget pub, regarde ton taux de confirmation et de livraison dans Zuri, puis augmente seulement si les chiffres suivent.',
          en: 'Phone accessories, beauty, small kitchen appliances and fashion are often in demand. Test one product with a small ad budget, check your confirmation and delivery rates in Zuri, and only scale when the numbers hold up.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Kenya ?', en: 'How does dropshipping work in Kenya?' },
        a: {
          fr: 'Le plus fiable est le dropshipping local : un fournisseur à Nairobi garde le stock, tu vends en ligne et tu fais livrer en paiement à la livraison. L’import par URL avec IA de Zuri t’aide à créer la fiche produit en quelques minutes.',
          en: 'The most reliable model is local dropshipping: a Nairobi supplier holds the stock, you sell online and deliver with pay on delivery. Zuri’s AI import from a product URL helps you build the product page in minutes.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Kenya ?', en: 'Is there a free online store builder in Kenya?' },
        a: {
          fr: 'Oui : Zuri est gratuit pendant la période de lancement, avec un sous-domaine offert et 0 % de commission sur tes ventes. Tu ne paies que ta pub et ta livraison.',
          en: 'Yes: Zuri is free during the launch period, with a free subdomain and 0% commission on your sales. You only pay for your ads and delivery.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'Safaricom (M-Pesa)', url: 'https://www.safaricom.co.ke' },
    ],
  },
  {
    slug: 'liberia',
    iso: 'LR',
    name: { fr: 'Liberia', en: 'Liberia' },
    inName: 'au Liberia',
    region: 'afrique-ouest',
    primaryLang: 'en',
    currency: { code: 'USD', label: { fr: 'dollar américain (USD), à côté du dollar libérien (LRD)', en: 'US dollar (USD), alongside the Liberian dollar (LRD)' } },
    cities: ['Monrovia', 'Gbarnga', 'Buchanan'],
    mobileMoney: ['MTN MoMo (Lonestar Cell MTN)', 'Orange Money'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne au Liberia : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Liberia: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne au Liberia : boutique en ligne gratuite en USD, paiement à la livraison, commandes WhatsApp et Mobile Money confirmé à la main.',
      en: 'Sell online in Liberia with a free online store in USD: cash on delivery, WhatsApp orders and mobile money you confirm yourself. No commission on sales.',
    },
    h1: {
      fr: 'Vendre en ligne au Liberia : une boutique en dollars, payée à la livraison',
      en: 'Sell online in Liberia: a store in dollars, paid on delivery',
    },
    intro: {
      fr: 'À Monrovia, les prix se discutent souvent en dollars américains et les achats se décident sur Facebook et WhatsApp. Zuri te donne une page de vente rapide en USD, un formulaire de commande en paiement à la livraison et un suivi clair de chaque colis.',
      en: 'In Monrovia, prices are often quoted in US dollars and buying decisions happen on Facebook and WhatsApp. Zuri gives you a fast sales page in USD, a cash on delivery order form and clear tracking for every parcel.',
    },
    market: [
      {
        fr: 'Le Liberia vit avec deux monnaies : le dollar américain pour une bonne partie des achats importants, et le dollar libérien pour la petite monnaie du quotidien. Pour une boutique en ligne, afficher en USD est souvent le plus simple, et c’est une devise que Zuri gère. Indique clairement sur ta page si ton livreur accepte aussi des dollars libériens, pour éviter les discussions à la porte.',
        en: 'Liberia runs on two currencies: the US dollar for many bigger purchases, and the Liberian dollar for everyday small change. For an online store, pricing in USD is usually the simplest choice, and it is a currency Zuri supports. Say clearly on your page whether your rider also accepts Liberian dollars, so there is no argument at the door.',
      },
      {
        fr: 'Le Mobile Money passe par MTN MoMo (Lonestar Cell MTN) et Orange Money. Aucun des prestataires intégrés à Zuri (FeexPay, FedaPay, PayDunya, PawaPay) ne couvre le Liberia aujourd’hui, donc il n’y a pas d’encaissement Mobile Money automatique dans ta boutique. Ce qui marche : le paiement à la livraison, ou un paiement sur ton numéro MoMo que tu vérifies toi-même avant d’expédier. Pour un produit digital, un lien de paiement Chariow, Maketou ou Selar peut aussi servir.',
        en: 'Mobile money runs through MTN MoMo (Lonestar Cell MTN) and Orange Money. None of the payment providers built into Zuri (FeexPay, FedaPay, PayDunya, PawaPay) covers Liberia today, so there is no automatic mobile money checkout in your store. What works: cash on delivery, or a payment to your own MoMo number that you check yourself before shipping. For digital products, a Chariow, Maketou or Selar payment link can also do the job.',
      },
      {
        fr: 'La majorité des commandes vient de Monrovia et de ses quartiers comme Sinkor, Paynesville, Congo Town ou Red Light. Les livraisons se font souvent à moto ou en keke (tricycle), et les adresses précises sont rares : le livreur appelle le client pour trouver un repère. Pour Gbarnga, Buchanan ou d’autres comtés, les envois passent par des transporteurs ou des bus, avec un délai plus long et un risque de refus plus élevé.',
        en: 'Most orders come from Monrovia and areas like Sinkor, Paynesville, Congo Town or Red Light. Deliveries often go by motorbike or keke (tricycle), and exact addresses are rare: the rider calls the buyer to find a landmark. For Gbarnga, Buchanan or other counties, parcels travel with transport companies or buses, which means longer delays and a higher chance of refusal.',
      },
      {
        fr: 'Facebook reste le grand marché en ligne au Liberia : pages de vendeurs, groupes de ventes, lives. WhatsApp sert à confirmer, envoyer des photos et négocier. Les pics d’achat tournent autour de la rentrée scolaire, de la fête de l’Indépendance le 26 juillet, de Thanksgiving (célébré au Liberia en novembre) et surtout des fêtes de fin d’année.',
        en: 'Facebook is still the big online marketplace in Liberia: seller pages, buy and sell groups, live videos. WhatsApp is where people confirm, swap photos and negotiate. Buying peaks come around back to school, Independence Day on July 26, Liberian Thanksgiving in November, and above all the end of year holidays.',
      },
    ],
    tips: [
      {
        fr: 'Fixe tes prix en USD avec des montants simples (10, 15, 25 dollars). Ça facilite la monnaie pour le livreur et rassure le client.',
        en: 'Price in USD with simple amounts (10, 15, 25 dollars). It makes change easy for the rider and reassures the buyer.',
      },
      {
        fr: 'Demande un repère dans ton formulaire de commande (église, école, station, carrefour) en plus du quartier. Zuri te laisse personnaliser les champs : un bon repère, c’est moins de clients injoignables le jour J.',
        en: 'Ask for a landmark in your order form (church, school, gas station, junction) as well as the neighborhood. Zuri lets you customize the fields: a good landmark means fewer unreachable buyers on delivery day.',
      },
      {
        fr: 'Commence par Monrovia seulement. Crée une zone avec un tarif fixe, et n’ouvre les autres comtés qu’une fois ton taux de livraison stable.',
        en: 'Start with Monrovia only. Create one zone with a flat fee, and open other counties only once your delivery rate is stable.',
      },
      {
        fr: 'Si un client veut payer par MoMo avant la livraison, donne ton numéro et attends la confirmation du paiement avant d’expédier. Note-le dans la commande pour que ton équipe ne demande pas l’argent deux fois.',
        en: 'If a buyer wants to pay by MoMo before delivery, share your number and wait until you see the payment before shipping. Note it on the order so your team does not ask for the money twice.',
      },
      {
        fr: 'Ajoute le bouton WhatsApp sur ta page : beaucoup de clients veulent poser une question avant de commander. Réponds vite, avec une vraie photo du produit.',
        en: 'Add the WhatsApp button to your page: many buyers want to ask a question before ordering. Answer fast, with a real photo of the item.',
      },
      {
        fr: 'Appelle chaque commande avant d’envoyer le livreur. Le statut « injoignable » de Zuri t’aide à relancer plus tard au lieu de perdre la vente.',
        en: 'Call every order before sending the rider out. Zuri’s unreachable status helps you follow up later instead of losing the sale.',
      },
      {
        fr: 'Garde ta page légère et tes vidéos courtes : sur une connexion mobile lente, une page qui s’affiche vite fait la différence. Les pages Zuri pèsent environ 23 Ko de JavaScript.',
        en: 'Keep your page light and your videos short: on a slow mobile connection, a page that loads fast makes the difference. Zuri sales pages ship about 23 KB of JavaScript.',
      },
    ],
    productIdeas: [
      { fr: 'Téléphones d’entrée de gamme et accessoires (chargeurs, écouteurs), souvent demandés.', en: 'Entry level phones and accessories (chargers, earphones), often requested.' },
      { fr: 'Lampes solaires, ventilateurs rechargeables et batteries externes.', en: 'Solar lamps, rechargeable fans and power banks.' },
      { fr: 'Perruques, mèches et produits capillaires.', en: 'Wigs, hair extensions and hair care products.' },
      { fr: 'Vêtements et chaussures pour les fêtes et la rentrée.', en: 'Clothes and shoes for holidays and back to school.' },
      { fr: 'Petits appareils de cuisine et ustensiles pratiques.', en: 'Small kitchen appliances and handy utensils.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne au Liberia ?', en: 'How do I sell online in Liberia?' },
        a: {
          fr: 'Ouvre une boutique Zuri en USD, ajoute ton produit, active le paiement à la livraison et crée une zone de livraison pour Monrovia. Fais de la pub sur Facebook, confirme chaque commande par téléphone ou WhatsApp, puis livre à moto.',
          en: 'Open a Zuri store in USD, add your product, turn on cash on delivery and create a delivery zone for Monrovia. Advertise on Facebook, confirm each order by phone or WhatsApp, then deliver by motorbike.',
        },
      },
      {
        q: { fr: 'Puis-je encaisser MTN MoMo ou Orange Money avec Zuri au Liberia ?', en: 'Can I collect MTN MoMo or Orange Money with Zuri in Liberia?' },
        a: {
          fr: 'Pas automatiquement : aucun prestataire intégré à Zuri ne couvre le Liberia pour l’instant. Tu peux demander au client d’envoyer le paiement sur ton numéro et confirmer toi-même, ou rester en paiement à la livraison.',
          en: 'Not automatically: none of Zuri’s built in payment providers covers Liberia for now. You can ask buyers to send money to your own number and confirm it yourself, or stick with cash on delivery.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne au Liberia ?', en: 'What products sell online in Liberia?' },
        a: {
          fr: 'Les accessoires de téléphone, l’énergie solaire, la beauté et la mode sont souvent demandés. Teste un produit à la fois avec un petit budget et garde celui qui se livre bien.',
          en: 'Phone accessories, solar products, beauty and fashion are often in demand. Test one product at a time on a small budget and keep the one that actually gets delivered.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping au Liberia ?', en: 'How does dropshipping work in Liberia?' },
        a: {
          fr: 'Travaille avec un fournisseur local à Monrovia qui garde le stock et livre en paiement à la livraison. L’import de produits depuis l’étranger prend du temps, donc le stock local est plus sûr pour démarrer.',
          en: 'Work with a local supplier in Monrovia who holds stock and delivers cash on delivery. Importing takes time, so local stock is safer to start with.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit au Liberia ?', en: 'Is there a free online store builder in Liberia?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert et 0 % de commission. Tu ne paies que ta publicité et tes livraisons.',
          en: 'Zuri is free during the launch period, with a free subdomain and 0% commission. You only pay for ads and deliveries.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays (Liberia absent)', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'FedaPay : pays pris en charge (Liberia absent)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
    ],
  },
  {
    slug: 'sierra-leone',
    iso: 'SL',
    name: { fr: 'Sierra Leone', en: 'Sierra Leone' },
    inName: 'en Sierra Leone',
    region: 'afrique-ouest',
    primaryLang: 'en',
    currency: { code: 'SLE', label: { fr: 'leone (SLE), prix affichés en USD sur Zuri', en: 'leone (SLE), prices shown in USD on Zuri' } },
    cities: ['Freetown', 'Bo', 'Kenema', 'Makeni'],
    mobileMoney: ['Orange Money', 'Afrimoney'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne en Sierra Leone : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Sierra Leone: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Sierra Leone : boutique en ligne gratuite, paiement à la livraison, Orange Money via PawaPay et commandes WhatsApp. Sans commission.',
      en: 'Sell online in Sierra Leone with a free online store: cash on delivery, Orange Money through PawaPay, WhatsApp orders and an order confirmation team.',
    },
    h1: {
      fr: 'Vendre en ligne en Sierra Leone, de Freetown à Makeni',
      en: 'Sell online in Sierra Leone, from Freetown to Makeni',
    },
    intro: {
      fr: 'En Sierra Leone, beaucoup d’achats en ligne commencent par une vidéo Facebook et se terminent avec un okada devant la porte. Zuri t’aide à transformer ces clics en commandes confirmées, avec paiement à la livraison et Orange Money via ton propre compte PawaPay.',
      en: 'In Sierra Leone, a lot of online shopping starts with a Facebook video and ends with an okada at the door. Zuri helps you turn those clicks into confirmed orders, with cash on delivery and Orange Money through your own PawaPay account.',
    },
    market: [
      {
        fr: 'La monnaie locale est le leone (SLE), une devise que Zuri n’affiche pas encore. La solution pratique : afficher tes prix en USD sur la page et convenir du montant en leones au moment de la confirmation téléphonique. Sois clair sur le taux que tu appliques, c’est ce qui évite les disputes avec le livreur.',
        en: 'The local currency is the leone (SLE), which Zuri does not display yet. The practical fix: show prices in USD on your page and agree the leone amount during the confirmation call. Be clear about the rate you use, that is what prevents arguments with the rider.',
      },
      {
        fr: 'Orange Money est le service de Mobile Money le plus visible, et Afrimoney (Africell) est aussi utilisé. D’après la documentation officielle de pawaPay, Orange est pris en charge en Sierra Leone : si tu ouvres ton compte marchand PawaPay, Zuri peut proposer l’encaissement Orange Money directement sur ta page, l’argent restant chez PawaPay sur ton compte. Afrimoney n’apparaît pas dans cette liste, donc pour ces clients, reste sur le paiement à la livraison ou un envoi sur ton numéro.',
        en: 'Orange Money is the most visible mobile money service, and Afrimoney (Africell) is also used. According to pawaPay’s official documentation, Orange is supported in Sierra Leone: with your own PawaPay merchant account, Zuri can offer Orange Money checkout on your page, with the money staying in your PawaPay account. Afrimoney is not on that list, so for those buyers, stick with cash on delivery or a transfer to your own number.',
      },
      {
        fr: 'Freetown concentre la majorité des commandes, de Lumley à Wellington en passant par Aberdeen, Kissy ou Congo Cross. Les livraisons se font surtout en okada ou en keke, et le trafic sur certains axes peut rallonger les délais. Pour Bo, Kenema ou Makeni, les colis passent par des transporteurs routiers : prévois plus de temps et un tarif à part.',
        en: 'Freetown brings in most orders, from Lumley to Wellington via Aberdeen, Kissy or Congo Cross. Deliveries mostly go by okada or keke, and traffic on some roads can stretch delivery times. For Bo, Kenema or Makeni, parcels travel with road transport companies: allow more time and a separate fee.',
      },
      {
        fr: 'Facebook et WhatsApp portent l’essentiel du commerce en ligne, avec des groupes de vente très actifs. TikTok monte chez les plus jeunes. Les moments forts sont la fête de l’Indépendance le 27 avril, la fin du Ramadan et la Tabaski, la rentrée scolaire et les fêtes de fin d’année, où les vêtements et les cadeaux partent vite.',
        en: 'Facebook and WhatsApp carry most online commerce, with very active buy and sell groups. TikTok is growing with younger buyers. Big moments include Independence Day on April 27, the end of Ramadan and Eid al-Adha, back to school, and the end of year holidays, when clothes and gifts move fast.',
      },
    ],
    tips: [
      {
        fr: 'Indique « prix en USD, payable en leones au taux du jour » sur ta page et répète le montant exact en leones pendant l’appel de confirmation.',
        en: 'Write “price in USD, payable in leones at today’s rate” on your page and repeat the exact leone amount during the confirmation call.',
      },
      {
        fr: 'Connecte ton compte PawaPay pour proposer Orange Money en ligne. Les clients qui paient avant la livraison refusent rarement leur colis.',
        en: 'Connect your PawaPay account to offer Orange Money online. Buyers who pay before delivery rarely refuse their parcel.',
      },
      {
        fr: 'Crée une zone « Freetown centre » et une zone « Freetown périphérie » avec des frais différents, puis une zone colis pour les villes de province.',
        en: 'Create a “central Freetown” zone and an “outer Freetown” zone with different fees, then a parcel zone for upcountry towns.',
      },
      {
        fr: 'Confirme chaque commande dans les heures qui suivent. Plus tu attends, plus le client oublie ou achète ailleurs. Les closers de Zuri reçoivent les commandes automatiquement.',
        en: 'Confirm every order within hours. The longer you wait, the more buyers forget or buy elsewhere. Zuri’s closers get orders assigned automatically.',
      },
      {
        fr: 'Montre le produit dans une vraie vidéo filmée à Freetown. Les clients veulent voir que tu existes et que le produit est déjà sur place.',
        en: 'Show the product in a real video shot in Freetown. Buyers want proof that you exist and the item is already in the country.',
      },
      {
        fr: 'Active la popup des ventes réelles et le bouton d’achat collant : sur mobile, ça garde l’envie d’acheter visible pendant toute la lecture.',
        en: 'Turn on the real sales popup and the sticky buy button: on mobile, they keep the buying action in view the whole time.',
      },
      {
        fr: 'Suis ton taux de livraison, pas seulement tes commandes. Si beaucoup de colis sont retournés dans une zone, augmente l’avance ou retire cette zone.',
        en: 'Watch your delivery rate, not just your order count. If many parcels come back from one zone, ask for a deposit there or drop the zone.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires de téléphone et petits gadgets, souvent demandés à Freetown.', en: 'Phone accessories and small gadgets, often requested in Freetown.' },
      { fr: 'Produits solaires et ventilateurs rechargeables.', en: 'Solar products and rechargeable fans.' },
      { fr: 'Mèches, perruques et soins des cheveux.', en: 'Hair extensions, wigs and hair care.' },
      { fr: 'Tenues pour les fêtes religieuses et la fin d’année.', en: 'Outfits for religious holidays and the end of year.' },
      { fr: 'Fournitures et sacs pour la rentrée scolaire.', en: 'School supplies and bags for back to school.' },
      { fr: 'Ustensiles de cuisine pratiques qui se montrent bien en vidéo.', en: 'Handy kitchen tools that look good on video.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Sierra Leone ?', en: 'How do I sell online in Sierra Leone?' },
        a: {
          fr: 'Crée ta boutique Zuri, affiche tes prix en USD, active le paiement à la livraison et règle tes zones à Freetown. Lance une pub Facebook, confirme chaque commande par téléphone et livre en okada.',
          en: 'Create your Zuri store, show prices in USD, turn on cash on delivery and set your Freetown zones. Run a Facebook ad, confirm each order by phone and deliver by okada.',
        },
      },
      {
        q: { fr: 'Comment encaisser Orange Money en Sierra Leone avec Zuri ?', en: 'How do I collect Orange Money in Sierra Leone with Zuri?' },
        a: {
          fr: 'Ouvre un compte marchand PawaPay et connecte-le à Zuri. pawaPay liste Orange en Sierra Leone dans sa documentation. Zuri ne touche jamais l’argent : il va directement sur ton compte PawaPay.',
          en: 'Open a PawaPay merchant account and connect it to Zuri. pawaPay lists Orange in Sierra Leone in its documentation. Zuri never touches the money: it goes straight to your PawaPay account.',
        },
      },
      {
        q: { fr: 'Puis-je afficher mes prix en leones ?', en: 'Can I show my prices in leones?' },
        a: {
          fr: 'Pas pour l’instant : le leone ne fait pas partie des devises gérées par Zuri. Affiche en USD et précise le montant en leones au téléphone.',
          en: 'Not for now: the leone is not one of the currencies Zuri supports. Show USD and give the leone amount on the phone.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Sierra Leone ?', en: 'What products sell online in Sierra Leone?' },
        a: {
          fr: 'Les accessoires de téléphone, le solaire, la beauté et les tenues de fête sont souvent demandés. Teste petit, regarde ton taux de livraison, puis garde ce qui marche.',
          en: 'Phone accessories, solar, beauty and festive outfits are often in demand. Test small, check your delivery rate, then keep what works.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Sierra Leone ?', en: 'Is there a free online store builder in Sierra Leone?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec sous-domaine offert et 0 % de commission. Tu gardes 100 % de tes ventes, hors frais de ton prestataire de paiement.',
          en: 'Zuri is free during the launch period, with a free subdomain and 0% commission. You keep all your sales, apart from your payment provider’s fees.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'gambie',
    iso: 'GM',
    name: { fr: 'Gambie', en: 'The Gambia' },
    inName: 'en Gambie',
    region: 'afrique-ouest',
    primaryLang: 'en',
    currency: { code: 'GMD', label: { fr: 'dalasi (GMD), prix affichés en USD sur Zuri', en: 'dalasi (GMD), prices shown in USD on Zuri' } },
    cities: ['Banjul', 'Serekunda', 'Brikama'],
    mobileMoney: ['Wave', 'QMoney', 'Afrimoney'],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne en Gambie : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in The Gambia: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Gambie : boutique en ligne gratuite, paiement à la livraison, commandes WhatsApp et Wave confirmé à la main. Idéal pour démarrer petit.',
      en: 'Sell online in The Gambia with a free online store: cash on delivery, WhatsApp orders and Wave payments you confirm yourself. Easy to start small.',
    },
    h1: {
      fr: 'Vendre en ligne en Gambie : un petit pays, des clients très connectés',
      en: 'Sell online in The Gambia: a small country with well connected buyers',
    },
    intro: {
      fr: 'En Gambie, la zone de Serekunda, Banjul et Brikama est compacte : un livreur peut couvrir beaucoup de clients dans la journée. Zuri te donne une page de vente rapide, un formulaire de paiement à la livraison et un suivi simple, même si le Mobile Money doit encore être confirmé à la main.',
      en: 'In The Gambia, the Serekunda, Banjul and Brikama area is compact: one rider can reach a lot of buyers in a day. Zuri gives you a fast sales page, a cash on delivery form and simple tracking, even though mobile money still has to be confirmed by hand.',
    },
    market: [
      {
        fr: 'La Gambie est un marché anglophone entouré par le Sénégal, avec beaucoup d’échanges entre les deux pays et une forte influence du wolof. La plupart des acheteurs en ligne vivent dans la zone urbaine de Kanifing (Serekunda, Bakau, Westfield), à Banjul et autour de Brikama. Les distances courtes jouent en ta faveur : tu peux livrer vite et à un coût raisonnable sans réseau compliqué.',
        en: 'The Gambia is an English speaking market surrounded by Senegal, with a lot of trade between the two and a strong Wolof influence. Most online buyers live in the Kanifing urban area (Serekunda, Bakau, Westfield), in Banjul and around Brikama. Short distances work in your favor: you can deliver quickly and cheaply without a complicated network.',
      },
      {
        fr: 'La monnaie est le dalasi (GMD), que Zuri n’affiche pas encore : affiche tes prix en USD et donne le montant en dalasis au téléphone, ou indique les deux dans la description. Côté paiement mobile, Wave s’est fait une grande place, à côté de QMoney et Afrimoney. Aucun prestataire intégré à Zuri ne couvre la Gambie pour l’instant, donc pas d’encaissement automatique : le client paie au livreur, ou envoie l’argent sur ton numéro Wave et tu vérifies avant d’expédier.',
        en: 'The currency is the dalasi (GMD), which Zuri does not display yet: show prices in USD and give the dalasi amount on the phone, or list both in the product description. For mobile payments, Wave has grown big, alongside QMoney and Afrimoney. No payment provider built into Zuri covers The Gambia for now, so there is no automatic checkout: the buyer pays the rider, or sends money to your Wave number and you check it before shipping.',
      },
      {
        fr: 'La livraison se fait souvent à moto ou en taxi partagé, avec des adresses décrites par repères (« près de la mosquée de… », « après le rond-point de Westfield »). Pour les villages et la région de l’intérieur, les colis voyagent en gelegele ou en minibus, avec des délais plus longs. Commence par la zone urbaine avant d’élargir.',
        en: 'Deliveries often go by motorbike or shared taxi, with addresses described by landmarks (“near the mosque in…”, “after Westfield junction”). For villages and upcountry regions, parcels travel by gelegele minibus, with longer delays. Start with the urban area before expanding.',
      },
      {
        fr: 'Facebook et WhatsApp dominent : beaucoup de vendeurs vivent de leurs statuts WhatsApp et de groupes Facebook. Les grandes périodes d’achat sont la Koriteh (fin du Ramadan) et la Tobaski, où les tenues, tissus et parfums partent très vite, la fête de l’Indépendance le 18 février, la rentrée et Noël. La diaspora gambienne en Europe et aux États-Unis commande aussi pour ses proches restés au pays.',
        en: 'Facebook and WhatsApp dominate: many sellers live off their WhatsApp status and Facebook groups. The big shopping seasons are Koriteh (end of Ramadan) and Tobaski, when outfits, fabric and perfume sell fast, plus Independence Day on February 18, back to school and Christmas. The Gambian diaspora in Europe and the US also orders for family back home.',
      },
    ],
    tips: [
      {
        fr: 'Prépare tes stocks de tenues, tissus et parfums plusieurs semaines avant la Koriteh et la Tobaski, puis lance une offre avec compte à rebours sur ta page.',
        en: 'Stock up on outfits, fabric and perfume weeks before Koriteh and Tobaski, then launch an offer with a countdown timer on your page.',
      },
      {
        fr: 'Affiche les prix en USD et écris aussi le montant en dalasis dans la description pour que le client sache exactement quoi préparer.',
        en: 'Show prices in USD and also write the dalasi amount in the description so buyers know exactly what to have ready.',
      },
      {
        fr: 'Si le client préfère Wave, envoie ton numéro après la confirmation et attends de voir le paiement avant d’envoyer le colis. Note-le dans la commande.',
        en: 'If a buyer prefers Wave, share your number after confirmation and wait until you see the payment before sending the parcel. Note it on the order.',
      },
      {
        fr: 'Vise la diaspora : une personne à Londres ou aux États-Unis peut commander pour sa famille à Serekunda, et le proche paie ou reçoit à la livraison. Ajoute un champ « nom et téléphone du destinataire » dans ton formulaire.',
        en: 'Target the diaspora: someone in London or the US can order for family in Serekunda, and the relative receives the parcel (or pays) at delivery. Add a “recipient name and phone” field to your form.',
      },
      {
        fr: 'Crée deux ou trois zones simples (Kanifing, Banjul, Brikama) avec un tarif clair chacune. Moins de surprises, moins de colis refusés.',
        en: 'Create two or three simple zones (Kanifing, Banjul, Brikama) with one clear fee each. Fewer surprises, fewer refused parcels.',
      },
      {
        fr: 'Mets le bouton WhatsApp en évidence et réponds en wolof ou en anglais selon le client. La proximité rassure.',
        en: 'Make the WhatsApp button prominent and reply in Wolof or English depending on the buyer. Feeling close builds trust.',
      },
      {
        fr: 'Utilise les codes promo pour tes clients fidèles : dans un petit marché, le bouche à oreille et les clients qui reviennent comptent énormément.',
        en: 'Use promo codes for repeat buyers: in a small market, word of mouth and returning customers matter a lot.',
      },
    ],
    productIdeas: [
      { fr: 'Tissus, tenues et accessoires pour la Koriteh et la Tobaski, souvent demandés.', en: 'Fabric, outfits and accessories for Koriteh and Tobaski, often requested.' },
      { fr: 'Parfums, encens et produits de beauté.', en: 'Perfume, incense and beauty products.' },
      { fr: 'Accessoires de téléphone et petits gadgets.', en: 'Phone accessories and small gadgets.' },
      { fr: 'Ventilateurs rechargeables et lampes solaires pour la saison chaude.', en: 'Rechargeable fans and solar lamps for the hot season.' },
      { fr: 'Articles pour la maison et la cuisine, achetés aussi par la diaspora pour la famille.', en: 'Home and kitchen items, also bought by the diaspora for family.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Gambie ?', en: 'How do I sell online in The Gambia?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute tes produits avec les prix en USD, active le paiement à la livraison et définis tes zones (Kanifing, Banjul, Brikama). Fais ta pub sur Facebook ou partage le lien sur WhatsApp, confirme chaque commande et livre à moto.',
          en: 'Create your Zuri store, add products priced in USD, turn on cash on delivery and set your zones (Kanifing, Banjul, Brikama). Advertise on Facebook or share the link on WhatsApp, confirm every order and deliver by motorbike.',
        },
      },
      {
        q: { fr: 'Puis-je encaisser Wave avec Zuri en Gambie ?', en: 'Can I collect Wave payments with Zuri in The Gambia?' },
        a: {
          fr: 'Pas automatiquement : aucun prestataire intégré à Zuri ne couvre encore la Gambie. Tu peux recevoir le paiement Wave sur ton numéro et le confirmer toi-même, ou garder le paiement à la livraison.',
          en: 'Not automatically: no payment provider built into Zuri covers The Gambia yet. You can receive Wave payments on your own number and confirm them yourself, or keep cash on delivery.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Gambie ?', en: 'What products sell online in The Gambia?' },
        a: {
          fr: 'Les tenues de fête, tissus, parfums, la beauté et les accessoires de téléphone sont souvent demandés. Cale tes lancements sur la Koriteh, la Tobaski et la fin d’année.',
          en: 'Festive outfits, fabric, perfume, beauty and phone accessories are often in demand. Time your launches around Koriteh, Tobaski and the end of year.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Gambie ?', en: 'How does dropshipping work in The Gambia?' },
        a: {
          fr: 'Le plus simple est le dropshipping local : un fournisseur de Serekunda garde le stock, tu vends et tu fais livrer en paiement à la livraison. L’import de produit par URL de Zuri accélère la création de tes pages.',
          en: 'The easiest model is local dropshipping: a supplier in Serekunda holds stock, you sell and deliver cash on delivery. Zuri’s product import from a URL speeds up building your pages.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Gambie ?', en: 'Is there a free online store builder in The Gambia?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec sous-domaine offert et 0 % de commission. Tu peux ouvrir ta boutique aujourd’hui et vendre dès ta première pub.',
          en: 'Zuri is free during the launch period, with a free subdomain and 0% commission. You can open your store today and sell from your first ad.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays (Gambie absente)', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'FedaPay : pays pris en charge (Gambie absente)', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'Wave', url: 'https://www.wave.com' },
    ],
  },
  {
    slug: 'ouganda',
    iso: 'UG',
    name: { fr: 'Ouganda', en: 'Uganda' },
    inName: 'en Ouganda',
    region: 'afrique-est',
    primaryLang: 'en',
    currency: { code: 'UGX', label: { fr: 'shilling ougandais', en: 'Ugandan shilling' } },
    cities: ['Kampala', 'Entebbe', 'Gulu', 'Mbarara', 'Jinja'],
    mobileMoney: ['MTN MoMo', 'Airtel Money'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne en Ouganda : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Uganda: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Ouganda : boutique en ligne gratuite, paiement à la livraison et Mobile Money MTN ou Airtel via pawaPay, dropshipping local.',
      en: 'Sell online in Uganda with a free online store: cash on delivery, MTN and Airtel Mobile Money via pawaPay, boda boda delivery zones and WhatsApp orders.',
    },
    h1: {
      fr: 'Vendre en ligne en Ouganda, de Kampala à Gulu',
      en: 'Sell online in Uganda, from Kampala to Gulu',
    },
    intro: {
      fr: 'En Ouganda, le client veut voir le colis avant de payer, ou payer sur son téléphone en deux clics. Zuri te donne une boutique légère qui gère les deux : commande en paiement à la livraison et Mobile Money MTN ou Airtel via ton propre compte pawaPay.',
      en: 'In Uganda, customers either want to see the parcel before paying or pay from their phone in seconds. Zuri gives you a light online store that handles both: cash on delivery orders, and MTN or Airtel Mobile Money through your own pawaPay account.',
    },
    market: [
      {
        fr: 'Le Mobile Money fait partie du quotidien en Ouganda : on paie le transport, le loyer, l’école et les courses avec MTN MoMo ou Airtel Money. Pour un vendeur, c’est une chance, parce que le client a déjà l’habitude de payer depuis son téléphone. Mais pour un premier achat auprès d’une boutique qu’il ne connaît pas, beaucoup préfèrent encore payer au livreur, à la réception.',
        en: 'Mobile Money is part of daily life in Uganda: people pay for transport, rent, school fees and groceries with MTN MoMo or Airtel Money. That helps you as a seller, because your customer already knows how to pay from a phone. Still, for a first order from a shop they have never heard of, many buyers prefer to pay the rider when the parcel arrives.',
      },
      {
        fr: 'Kampala concentre l’essentiel des commandes en ligne, avec ses quartiers très étalés et ses embouteillages. La livraison se fait surtout en boda boda, ces motos-taxis qui passent partout. En dehors de la capitale, à Jinja, Mbarara ou Gulu, on passe souvent par les compagnies de bus ou de colis entre villes, et le client vient récupérer son paquet. Il faut donc des frais de livraison différents selon la ville.',
        en: 'Kampala drives most online orders, with sprawling neighbourhoods and heavy traffic. Deliveries mostly go by boda boda, the motorbike taxis that get through anywhere. Outside the capital, in Jinja, Mbarara or Gulu, parcels often travel with bus or courier companies between towns and the customer picks them up. That means your delivery fees need to change from one city to another.',
      },
      {
        fr: 'La découverte se fait sur les réseaux : pub Facebook et Instagram, vidéos TikTok, statuts et groupes WhatsApp. Beaucoup de clients écrivent d’abord sur WhatsApp pour poser des questions avant de commander. L’anglais domine en ligne, mais un message en luganda dans une vidéo ou au téléphone rassure souvent le client à Kampala.',
        en: 'Discovery happens on social media: Facebook and Instagram ads, TikTok videos, WhatsApp statuses and groups. Many customers send a WhatsApp message first to ask questions before they order. English dominates online, but a line in Luganda in a video or on a confirmation call often puts a Kampala customer at ease.',
      },
      {
        fr: 'Le vrai défi, c’est la commande fantôme : le client commande sur un coup de tête, puis devient injoignable ou refuse le colis. Chaque course de boda boda perdue te coûte. La solution, ce sont des closers qui appellent vite, des statuts clairs et un suivi de ton taux de livraison.',
        en: 'The real headache is the ghost order: someone orders on impulse, then stops answering or refuses the parcel. Every wasted boda boda trip costs you money. The fix is a team that calls fast, clear order statuses, and a close eye on your delivery rate.',
      },
    ],
    tips: [
      {
        fr: 'Affiche tes prix en USD sur Zuri, car le shilling ougandais n’est pas encore géré pour l’affichage, et indique clairement l’équivalent en shillings dans la description ou au téléphone pour éviter toute confusion.',
        en: 'Zuri does not display Ugandan shillings yet, so set your prices in USD and give the shilling amount clearly in your product text or on the confirmation call so nobody is surprised.',
      },
      {
        fr: 'Ouvre ton compte pawaPay et connecte-le à Zuri pour encaisser MTN MoMo et Airtel Money directement chez toi. Vérifie avec pawaPay les conditions d’ouverture et la devise d’encaissement. Zuri ne touche jamais ton argent.',
        en: 'Open your own pawaPay account and connect it to Zuri to collect MTN MoMo and Airtel Money straight into it. Check account requirements and settlement currency with pawaPay. Zuri never holds your money.',
      },
      {
        fr: 'Crée des zones de livraison par ville : un tarif pour le centre de Kampala, un autre pour Entebbe ou Mukono, un autre pour l’envoi par bus vers Gulu ou Mbarara.',
        en: 'Set delivery zones by city: one fee for central Kampala, another for Entebbe or Mukono, and another for bus parcels to Gulu or Mbarara.',
      },
      {
        fr: 'Appelle chaque commande COD dans l’heure. Avec l’attribution automatique, tes closers reçoivent les commandes à tour de rôle et passent le statut à confirmée ou injoignable sans perdre de temps.',
        en: 'Call every cash on delivery order within the hour. With automatic assignment, your closers get orders in turn and mark them confirmed or unreachable without wasting time.',
      },
      {
        fr: 'Propose une petite remise pour le paiement Mobile Money avant l’envoi. Un client qui a déjà payé refuse rarement son colis.',
        en: 'Offer a small discount for paying by Mobile Money before dispatch. A customer who has already paid rarely refuses the parcel.',
      },
      {
        fr: 'Installe le pixel Facebook, l’API Conversions et le pixel TikTok avant de lancer ta pub, pour que les algorithmes apprennent à partir de vraies commandes.',
        en: 'Install the Facebook pixel, the Conversions API and the TikTok pixel before you run ads, so the platforms learn from real orders.',
      },
      {
        fr: 'Mets le bouton WhatsApp sur ta page de vente. Les clients ougandais posent souvent une question avant d’acheter, et une réponse rapide transforme la question en commande.',
        en: 'Add the WhatsApp button to your sales page. Ugandan buyers often ask a question before buying, and a quick reply turns that question into an order.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires de téléphone (chargeurs, écouteurs, power banks), souvent demandés à Kampala.', en: 'Phone accessories such as chargers, earphones and power banks, often in demand in Kampala.' },
      { fr: 'Produits de beauté et soins des cheveux, qui tournent bien en vidéo TikTok.', en: 'Beauty and hair care products, which tend to do well in TikTok videos.' },
      { fr: 'Petits appareils de cuisine (blenders, mixeurs, ustensiles pratiques).', en: 'Small kitchen appliances like blenders and handy cooking tools.' },
      { fr: 'Lampes et kits solaires, utiles là où le courant coupe souvent.', en: 'Solar lamps and small solar kits, useful where power cuts are common.' },
      { fr: 'Vêtements et chaussures, avec un guide des tailles clair pour limiter les retours.', en: 'Clothes and shoes, with a clear size guide to reduce returns.' },
      { fr: 'Articles pour bébé et pour la rentrée scolaire, recherchés à chaque début de trimestre.', en: 'Baby items and school supplies, sought after at the start of each school term.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Ouganda ?', en: 'How do I sell online in Uganda?' },
        a: {
          fr: 'Crée ta boutique sur Zuri, ajoute tes produits (même par URL avec l’IA), règle tes frais de livraison par ville, puis lance une pub Facebook ou TikTok. Les commandes arrivent en paiement à la livraison ou en Mobile Money, et tes closers les confirment par téléphone.',
          en: 'Create your store on Zuri, add your products (you can even import them from a URL with AI), set delivery fees by city, then run Facebook or TikTok ads. Orders come in as cash on delivery or Mobile Money, and your closers confirm them by phone.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money en Ouganda ?', en: 'How do I accept Mobile Money in Uganda?' },
        a: {
          fr: 'pawaPay prend en charge MTN et Airtel en Ouganda. Tu ouvres ton compte pawaPay, tu le connectes à Zuri, et le client paie depuis son téléphone. L’argent va sur ton compte, Zuri ne le détient jamais.',
          en: 'pawaPay supports MTN and Airtel in Uganda. You open your own pawaPay account, connect it to Zuri, and your customer pays from their phone. The money goes to your account; Zuri never holds it.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Ouganda ?', en: 'What products sell online in Uganda?' },
        a: {
          fr: 'Les accessoires de téléphone, la beauté, les petits appareils de cuisine et le solaire sont souvent demandés. Teste plusieurs produits avec un petit budget pub et garde ceux qui ont un bon taux de livraison, pas seulement beaucoup de commandes.',
          en: 'Phone accessories, beauty, small kitchen appliances and solar products are often in demand. Test several products on a small ad budget and keep the ones with a good delivery rate, not just lots of orders.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Ouganda ?', en: 'How does dropshipping work in Uganda?' },
        a: {
          fr: 'Le dropshipping local marche mieux que l’import à l’unité : tu travailles avec un fournisseur ou un stock à Kampala, tu vends en COD, et tu livres en boda boda en un ou deux jours. Les délais d’import longs font fuir les clients qui paient à la livraison.',
          en: 'Local dropshipping works better than shipping single items from abroad: you work with a supplier or stock in Kampala, sell with cash on delivery, and deliver by boda boda within a day or two. Long import delays put off customers who pay on delivery.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Ouganda ?', en: 'Is there a free online store builder in Uganda?' },
        a: {
          fr: 'Oui, Zuri est gratuit pendant le lancement, avec un sous-domaine gratuit et 0 % de commission sur tes ventes. Tu paies seulement les frais de ton prestataire de paiement quand tu encaisses en Mobile Money.',
          en: 'Yes. Zuri is free during launch, with a free subdomain and 0% commission on your sales. You only pay your payment provider’s fees when you collect Mobile Money.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'tanzanie',
    iso: 'TZ',
    name: { fr: 'Tanzanie', en: 'Tanzania' },
    inName: 'en Tanzanie',
    region: 'afrique-est',
    primaryLang: 'en',
    currency: { code: 'TZS', label: { fr: 'shilling tanzanien', en: 'Tanzanian shilling' } },
    cities: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar'],
    mobileMoney: ['M-Pesa', 'Mixx by Yas (ex Tigo Pesa)', 'Airtel Money', 'HaloPesa'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne en Tanzanie : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Tanzania: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Tanzanie : boutique en ligne gratuite, paiement à la livraison, Mobile Money Airtel, Tigo et Halotel via pawaPay, dropshipping local.',
      en: 'Sell online in Tanzania: free online store, cash on delivery, Airtel, Tigo and Halotel Mobile Money via pawaPay, and delivery fees by city.',
    },
    h1: {
      fr: 'Vendre en ligne en Tanzanie avec une boutique pensée pour le mobile',
      en: 'Sell online in Tanzania with a store built for mobile',
    },
    intro: {
      fr: 'En Tanzanie, le téléphone sert à tout : discuter, regarder des vidéos et payer. Avec Zuri, tu montes une boutique qui charge vite même sur une connexion faible, tu prends les commandes en paiement à la livraison et tu encaisses Airtel, Tigo ou Halotel via ton compte pawaPay (M-Pesa avec l’offre Entreprise de pawaPay).',
      en: 'In Tanzania, the phone does everything: chatting, watching videos and paying. With Zuri you build a store that loads fast even on a weak connection, take cash on delivery orders, and collect Airtel, Tigo or Halotel payments through your own pawaPay account (M-Pesa on pawaPay’s Enterprise plan).',
    },
    market: [
      {
        fr: 'Le marché tanzanien a une particularité : plusieurs portefeuilles Mobile Money se partagent les clients. M-Pesa de Vodacom, Airtel Money, Mixx by Yas (l’ancien Tigo Pesa) et HaloPesa sont tous utilisés. Un client sur Airtel ne veut pas forcément passer par un agent pour payer sur un autre réseau. pawaPay couvre Airtel, Tigo et Halotel, et Vodacom M-Pesa avec son offre Entreprise : vérifie ce que ton compte permet.',
        en: 'Tanzania has one key feature: several Mobile Money wallets share the market. Vodacom M-Pesa, Airtel Money, Mixx by Yas (formerly Tigo Pesa) and HaloPesa are all widely used. A customer on Airtel does not want to find an agent just to pay on another network. pawaPay covers Airtel, Tigo and Halotel, plus Vodacom M-Pesa on its Enterprise plan: check what your account allows.',
      },
      {
        fr: 'Dar es Salaam est le cœur du commerce en ligne, avec Kariakoo, le grand marché où beaucoup de vendeurs s’approvisionnent. Arusha, Mwanza et Dodoma suivent, et Zanzibar a ses propres réalités, avec beaucoup de commerce lié au tourisme. Dans les villes, la livraison se fait en boda boda ou en bajaji ; entre les villes, les colis voyagent souvent par bus.',
        en: 'Dar es Salaam is the heart of online selling, with Kariakoo, the huge market where many sellers source their stock. Arusha, Mwanza and Dodoma follow, and Zanzibar has its own rhythm, with a lot of trade linked to tourism. Within cities, deliveries go by boda boda or bajaji; between cities, parcels often travel by bus.',
      },
      {
        fr: 'Le swahili est la langue de la rue et des réseaux. Une page de vente, une vidéo TikTok ou une pub Instagram en swahili parle bien plus au client qu’un texte en anglais traduit. Instagram et WhatsApp sont très utilisés par les petits vendeurs, et beaucoup de ventes se concluent encore en message privé.',
        en: 'Swahili is the language of the street and of social media. A sales page, a TikTok video or an Instagram ad in Swahili lands far better than translated English. Instagram and WhatsApp are heavily used by small sellers, and many sales still close in private messages.',
      },
      {
        fr: 'Le problème, quand tout se fait en message privé, c’est que tu perds le fil : qui a commandé, qui a payé, qui est injoignable. Une boutique avec formulaire de commande et statuts clairs remplace les captures d’écran et les carnets, et te montre ton vrai chiffre encaissé.',
        en: 'The problem when everything happens in DMs is that you lose track: who ordered, who paid, who stopped answering. A store with an order form and clear statuses replaces screenshots and notebooks, and shows you the money you actually collected.',
      },
    ],
    tips: [
      {
        fr: 'Écris tes pages de vente en swahili, ou au moins tes titres et ton formulaire. Garde l’anglais pour une clientèle d’expatriés ou de touristes, notamment à Arusha et Zanzibar.',
        en: 'Write your sales pages in Swahili, or at least the headlines and the order form. Keep English for expats and tourists, especially in Arusha and Zanzibar.',
      },
      {
        fr: 'Le shilling tanzanien n’est pas encore géré pour l’affichage sur Zuri : affiche tes prix en USD et précise le montant en shillings dans le texte ou à la confirmation.',
        en: 'Zuri does not display Tanzanian shillings yet, so price in USD and state the shilling amount in your text or on the confirmation call.',
      },
      {
        fr: 'Connecte ton compte pawaPay pour accepter Airtel, Tigo et Halotel (M-Pesa avec l’offre Entreprise). Vérifie avec pawaPay les conditions d’ouverture et la devise d’encaissement.',
        en: 'Connect your pawaPay account to accept Airtel, Tigo and Halotel (M-Pesa on the Enterprise plan). Check account requirements and settlement currency with pawaPay.',
      },
      {
        fr: 'Si tu achètes à Kariakoo, prends tes propres photos et vidéos. Les clients voient les mêmes visuels chez tous les vendeurs ; une vidéo du vrai produit en main fait la différence.',
        en: 'If you buy at Kariakoo, shoot your own photos and videos. Customers see the same pictures from every seller; a video of the real product in hand stands out.',
      },
      {
        fr: 'Utilise les packs par quantité (une pièce, deux pièces, trois pièces) pour augmenter le panier moyen et amortir le coût de la course.',
        en: 'Use quantity bundles (one, two or three pieces) to raise your average order and cover the delivery cost.',
      },
      {
        fr: 'Règle des zones de livraison : centre de Dar es Salaam, périphérie, envoi par bus vers Arusha ou Mwanza, et Zanzibar à part.',
        en: 'Set delivery zones: central Dar es Salaam, outer areas, bus parcels to Arusha or Mwanza, and Zanzibar on its own.',
      },
      {
        fr: 'Active la relance panier abandonné : beaucoup de clients remplissent le formulaire à moitié puis sont coupés par le réseau ou un appel.',
        en: 'Turn on abandoned cart recovery: many customers fill half the form and then get cut off by the network or a phone call.',
      },
      {
        fr: 'Prépare-toi pour le Ramadan, l’Eid et la fin d’année, des périodes où les achats de vêtements, de parfums et de cadeaux montent souvent.',
        en: 'Get ready for Ramadan, Eid and the end of the year, when purchases of clothes, perfume and gifts often rise.',
      },
    ],
    productIdeas: [
      { fr: 'Vêtements, kitenge et mode femme, souvent demandés sur Instagram.', en: 'Clothing, kitenge fabric and women’s fashion, often in demand on Instagram.' },
      { fr: 'Parfums et produits de beauté, surtout avant les fêtes.', en: 'Perfumes and beauty products, especially before holidays.' },
      { fr: 'Accessoires de téléphone et petits gadgets électroniques.', en: 'Phone accessories and small electronic gadgets.' },
      { fr: 'Ustensiles de cuisine et petits électroménagers.', en: 'Kitchen tools and small home appliances.' },
      { fr: 'Produits solaires et lampes rechargeables.', en: 'Solar products and rechargeable lamps.' },
      { fr: 'Articles de maison et de décoration pour les jeunes couples en ville.', en: 'Home and decor items for young urban couples.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Tanzanie ?', en: 'How do I sell online in Tanzania?' },
        a: {
          fr: 'Ouvre ta boutique Zuri, ajoute tes produits avec des textes en swahili, fixe tes frais de livraison par ville et lance ta pub Instagram, Facebook ou TikTok. Tu reçois les commandes en COD ou en Mobile Money et tes closers les confirment.',
          en: 'Open your Zuri store, add products with Swahili copy, set delivery fees per city and run Instagram, Facebook or TikTok ads. Orders arrive as cash on delivery or Mobile Money, and your closers confirm them.',
        },
      },
      {
        q: { fr: 'Comment encaisser M-Pesa en Tanzanie ?', en: 'How do I accept M-Pesa in Tanzania?' },
        a: {
          fr: 'pawaPay prend en charge Airtel, Tigo et Halotel en Tanzanie, et Vodacom (M-Pesa) avec son offre Entreprise. Tu connectes ton compte pawaPay à Zuri et l’argent arrive chez toi. Zuri ne détient jamais les fonds.',
          en: 'pawaPay supports Airtel, Tigo and Halotel in Tanzania, plus Vodacom (M-Pesa) on its Enterprise plan. You connect your pawaPay account to Zuri and the money lands with you. Zuri never holds the funds.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Tanzanie ?', en: 'What should I sell online in Tanzania?' },
        a: {
          fr: 'La mode, la beauté, les accessoires de téléphone et la cuisine sont souvent demandés. Le plus important est de tester vite, de suivre ton taux de livraison et de garder les produits que les clients acceptent vraiment à la porte.',
          en: 'Fashion, beauty, phone accessories and kitchen items are often in demand. What matters most is testing fast, tracking your delivery rate and keeping the products customers actually accept at the door.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Tanzanie ?', en: 'How do I do dropshipping in Tanzania?' },
        a: {
          fr: 'Travaille avec un stock local, par exemple chez un grossiste de Kariakoo, et livre en un ou deux jours à Dar es Salaam. Le client paie à la livraison ou en Mobile Money, et tu ne commandes en gros qu’après avoir validé le produit.',
          en: 'Work with local stock, for example from a Kariakoo wholesaler, and deliver within a day or two in Dar es Salaam. The customer pays on delivery or by Mobile Money, and you only buy in bulk once the product is proven.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Tanzanie ?', en: 'Is there a free online store builder for Tanzania?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, sans commission sur tes ventes, avec un sous-domaine offert. Tu paies seulement les frais pawaPay sur les paiements Mobile Money.',
          en: 'Zuri is free during launch, with 0% commission on your sales and a free subdomain. You only pay pawaPay’s fees on Mobile Money payments.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'zambie',
    iso: 'ZM',
    name: { fr: 'Zambie', en: 'Zambia' },
    inName: 'en Zambie',
    region: 'afrique-australe',
    primaryLang: 'en',
    currency: { code: 'ZMW', label: { fr: 'kwacha zambien', en: 'Zambian kwacha' } },
    cities: ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone'],
    mobileMoney: ['MTN MoMo', 'Airtel Money', 'Zamtel Kwacha'],
    zuriPsps: ['PawaPay'],
    title: {
      fr: 'Vendre en ligne en Zambie : boutique avec paiement à la livraison | Zuri',
      en: 'Sell online in Zambia: online store with cash on delivery | Zuri',
    },
    description: {
      fr: 'Vendre en ligne en Zambie : boutique en ligne gratuite, paiement à la livraison et Mobile Money MTN, Airtel ou Zamtel via pawaPay. Lusaka, Kitwe, Ndola.',
      en: 'Sell online in Zambia: free online store, cash on delivery and MTN, Airtel or Zamtel Mobile Money via pawaPay. Built for Lusaka and the Copperbelt.',
    },
    h1: {
      fr: 'Vendre en ligne en Zambie, de Lusaka au Copperbelt',
      en: 'Sell online in Zambia, from Lusaka to the Copperbelt',
    },
    intro: {
      fr: 'En Zambie, une bonne partie du commerce en ligne se passe encore dans les groupes Facebook et sur WhatsApp. Zuri t’aide à passer à une vraie boutique : page de vente rapide, commande en paiement à la livraison et Mobile Money MTN, Airtel ou Zamtel via ton compte pawaPay.',
      en: 'In Zambia, a lot of online selling still happens in Facebook groups and on WhatsApp. Zuri helps you move to a real store: a fast sales page, cash on delivery orders, and MTN, Airtel or Zamtel Mobile Money through your own pawaPay account.',
    },
    market: [
      {
        fr: 'Les groupes Facebook de vente et d’achat sont un réflexe en Zambie : on y poste une photo, un prix, un numéro, et la discussion continue sur WhatsApp. Ça marche pour démarrer, mais tu perds vite des commandes dans les messages, et le client n’a aucune page pour vérifier ce qu’il achète. Une boutique avec ses avis, ses photos et son formulaire inspire plus confiance.',
        en: 'Buy and sell Facebook groups are a habit in Zambia: post a photo, a price and a number, then carry on the chat on WhatsApp. It works to get started, but orders get lost in the messages and the customer has no page to check what they are buying. A store with photos, details and an order form builds more trust.',
      },
      {
        fr: 'Côté paiement, trois réseaux se partagent le Mobile Money : MTN MoMo, Airtel Money et Zamtel Kwacha. Le client paie volontiers depuis son téléphone quand il connaît le vendeur ; sinon, il préfère payer à la livraison. Proposer les deux options, c’est ne fermer la porte à personne.',
        en: 'For payments, three networks share Mobile Money: MTN MoMo, Airtel Money and Zamtel Kwacha. Customers happily pay from their phone when they know the seller; otherwise they prefer to pay on delivery. Offering both options means you do not turn anyone away.',
      },
      {
        fr: 'Lusaka concentre la demande, avec des quartiers éloignés les uns des autres. Le Copperbelt, autour de Kitwe et Ndola, est l’autre grand bassin de clients. Entre les villes, les colis partent souvent par bus ou par service de colis, et le client vient chercher son paquet à la gare routière. À Livingstone, la clientèle touristique a ses propres attentes.',
        en: 'Lusaka holds most of the demand, with neighbourhoods spread far apart. The Copperbelt, around Kitwe and Ndola, is the other big customer base. Between cities, parcels usually go by bus or courier service and customers collect them at the bus station. In Livingstone, tourist customers have their own expectations.',
      },
      {
        fr: 'Le kwacha bouge, et les prix des produits importés aussi. Pour un vendeur, ça veut dire revoir ses prix régulièrement et ne pas promettre un tarif fixe trop longtemps dans une pub qui tourne des semaines.',
        en: 'The kwacha moves, and so do prices of imported goods. As a seller, that means reviewing prices regularly and not locking a fixed price into an ad that runs for weeks.',
      },
    ],
    tips: [
      {
        fr: 'Le kwacha n’est pas encore géré pour l’affichage sur Zuri : affiche tes prix en USD et donne le montant en kwacha dans le texte ou à la confirmation par téléphone.',
        en: 'Zuri does not display kwacha yet, so set prices in USD and give the kwacha amount in your copy or on the confirmation call.',
      },
      {
        fr: 'Garde tes groupes Facebook, mais mets le lien de ta boutique Zuri dans chaque post. Le client commande lui-même et tu n’as plus à recopier les adresses à la main.',
        en: 'Keep posting in Facebook groups, but put your Zuri store link in every post. Customers order themselves and you stop copying addresses by hand.',
      },
      {
        fr: 'Connecte ton compte pawaPay pour encaisser MTN, Airtel et Zamtel. Vérifie avec pawaPay les conditions d’ouverture et la devise d’encaissement.',
        en: 'Connect your pawaPay account to collect MTN, Airtel and Zamtel. Check account requirements and settlement currency with pawaPay.',
      },
      {
        fr: 'Crée des zones de livraison : Lusaka centre, Lusaka périphérie, Copperbelt par bus, autres villes. Le client voit le bon prix tout de suite et refuse moins le colis.',
        en: 'Create delivery zones: central Lusaka, outer Lusaka, Copperbelt by bus, and other towns. The customer sees the right fee upfront and is less likely to refuse the parcel.',
      },
      {
        fr: 'Pour les envois par bus, demande un paiement Mobile Money avant l’expédition, au moins pour les frais de livraison. Un colis qui revient d’une autre ville te coûte deux fois.',
        en: 'For bus parcels, ask for Mobile Money before dispatch, at least for the delivery fee. A parcel coming back from another town costs you twice.',
      },
      {
        fr: 'Suis ton taux de confirmation et ton taux de livraison chaque semaine. Si un produit génère beaucoup de commandes mais peu de livraisons, revois ta page ou ton prix.',
        en: 'Check your confirmation and delivery rates every week. If a product gets plenty of orders but few deliveries, rework the page or the price.',
      },
      {
        fr: 'Utilise le compte à rebours et le stock limité avec honnêteté, pour une vraie promo, par exemple au Black Friday ou avant Noël.',
        en: 'Use the countdown timer and limited stock honestly, for a real promotion such as Black Friday or the run-up to Christmas.',
      },
    ],
    productIdeas: [
      { fr: 'Accessoires de téléphone et petits gadgets, souvent demandés à Lusaka.', en: 'Phone accessories and small gadgets, often in demand in Lusaka.' },
      { fr: 'Produits solaires et lampes rechargeables, utiles pendant les coupures de courant.', en: 'Solar products and rechargeable lamps, useful during power cuts.' },
      { fr: 'Perruques, extensions et soins des cheveux.', en: 'Wigs, hair extensions and hair care.' },
      { fr: 'Vêtements et chaussures, avec un guide des tailles précis.', en: 'Clothes and shoes, with an accurate size guide.' },
      { fr: 'Petits appareils de cuisine et ustensiles pratiques.', en: 'Small kitchen appliances and handy tools.' },
      { fr: 'Fournitures scolaires et articles pour enfants à la rentrée.', en: 'School supplies and kids’ items at the start of term.' },
    ],
    faqs: [
      {
        q: { fr: 'Comment vendre en ligne en Zambie ?', en: 'How do I sell online in Zambia?' },
        a: {
          fr: 'Crée ta boutique Zuri, ajoute tes produits, fixe tes frais de livraison par ville, puis partage ton lien dans tes groupes Facebook, sur WhatsApp et dans tes pubs. Les commandes arrivent avec l’adresse et le numéro, prêtes à être confirmées.',
          en: 'Create your Zuri store, add your products, set delivery fees by city, then share the link in Facebook groups, on WhatsApp and in your ads. Orders come in with address and phone number, ready to confirm.',
        },
      },
      {
        q: { fr: 'Comment encaisser par Mobile Money en Zambie ?', en: 'How do I accept Mobile Money in Zambia?' },
        a: {
          fr: 'pawaPay prend en charge Airtel, MTN et Zamtel en Zambie. Tu connectes ton compte pawaPay à Zuri, le client paie depuis son téléphone et l’argent va chez toi.',
          en: 'pawaPay supports Airtel, MTN and Zamtel in Zambia. You connect your pawaPay account to Zuri, the customer pays from their phone and the money goes to you.',
        },
      },
      {
        q: { fr: 'Quel produit vendre en ligne en Zambie ?', en: 'What products sell online in Zambia?' },
        a: {
          fr: 'Les accessoires de téléphone, le solaire, les soins des cheveux et la mode sont souvent demandés. Teste avec un petit budget et garde ce qui se livre bien.',
          en: 'Phone accessories, solar products, hair care and fashion are often in demand. Test on a small budget and keep what actually gets delivered.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Zambie ?', en: 'How do I start dropshipping in Zambia?' },
        a: {
          fr: 'Mise sur le dropshipping local : un fournisseur à Lusaka ou dans le Copperbelt, une livraison rapide et le paiement à la livraison. L’import à l’unité avec de longs délais marche mal quand le client paie à la réception.',
          en: 'Go for local dropshipping: a supplier in Lusaka or the Copperbelt, fast delivery and cash on delivery. Importing single items with long wait times works poorly when customers pay on arrival.',
        },
      },
      {
        q: { fr: 'Existe-t-il un site de vente en ligne gratuit en Zambie ?', en: 'Is there a free online store builder in Zambia?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert et 0 % de commission. Seuls les frais de ton prestataire Mobile Money s’appliquent quand tu encaisses.',
          en: 'Zuri is free during launch, with a free subdomain and 0% commission. Only your Mobile Money provider’s fees apply when you collect payments.',
        },
      },
    ],
    sources: [
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
    ],
  },
  {
    slug: 'france',
    iso: 'FR',
    name: { fr: 'France', en: 'France' },
    inName: 'en France',
    region: 'diaspora',
    primaryLang: 'fr',
    currency: { code: 'EUR', label: { fr: 'euro', en: 'euro' } },
    cities: ['Paris', 'Lyon', 'Marseille', 'Lille'],
    mobileMoney: [],
    zuriPsps: [],
    title: {
      fr: 'Vendre en ligne depuis la France vers l’Afrique : boutique COD | Zuri',
      en: 'Sell online from France to Africa: cash on delivery store | Zuri',
    },
    description: {
      fr: 'Tu vis en France et tu veux vendre en ligne en Afrique ? Boutique en ligne gratuite, paiement à la livraison sur place et Mobile Money dans le pays visé.',
      en: 'Living in France and selling to Africa? Free online store, cash on delivery in the target country and Mobile Money where your provider supports it.',
    },
    h1: {
      fr: 'Vendre en Afrique depuis la France, sans être sur place',
      en: 'Sell in Africa from France, without being there',
    },
    intro: {
      fr: 'Beaucoup de vendeurs de la diaspora pilotent un business en Afrique depuis Paris, Lyon ou Marseille. Zuri te donne la boutique, le formulaire paiement à la livraison et le suivi des commandes ; sur place, il te faut un stock, un livreur et quelqu’un de confiance.',
      en: 'Many diaspora sellers run a business in Africa from Paris, Lyon or Marseille. Zuri gives you the store, the cash on delivery order form and order tracking; on the ground, you need stock, a delivery partner and someone you trust.',
    },
    market: [
      {
        fr: 'Zuri n’est pas fait pour vendre aux clients français classiques avec paiement par carte : aucun prestataire intégré à Zuri n’encaisse en France. Zuri sert surtout à vendre dans un pays africain où tu as des relais, en paiement à la livraison ou en Mobile Money via les prestataires disponibles dans ce pays.',
        en: 'Zuri is not built for selling to regular French customers paying by card: none of the payment providers integrated with Zuri collect in France. Zuri is mainly for selling in an African country where you have people on the ground, with cash on delivery or Mobile Money through the providers available in that country.',
      },
      {
        fr: 'Le schéma le plus courant : tu gères la boutique, la pub Facebook ou TikTok et les closers depuis la France ; ton stock est à Abidjan, Dakar, Douala ou Cotonou ; un livreur ou une petite équipe livre et encaisse sur place. Tu suis tout depuis ton téléphone, avec les statuts de commande et le chiffre encaissé.',
        en: 'The most common setup: you run the store, the Facebook or TikTok ads and the closers from France; your stock sits in Abidjan, Dakar, Douala or Cotonou; a rider or small team delivers and collects payment locally. You follow everything from your phone, with order statuses and money collected.',
      },
      {
        fr: 'Autre cas : la diaspora qui achète pour un proche au pays. Le proche reçoit le colis et paie à la livraison, ou c’est toi qui paies en avance si un prestataire Mobile Money est disponible dans le pays. Dans ce cas, précise bien sur ta page qui paie et qui reçoit.',
        en: 'Another case: diaspora customers buying for a relative back home. The relative receives the parcel and pays on delivery, or the buyer pays upfront when a Mobile Money provider is available in that country. Make it very clear on your page who pays and who receives.',
      },
    ],
    tips: [
      {
        fr: 'Choisis la devise du pays où tu livres (XOF, XAF, GNF, CDF...), pas l’euro, sauf si tes clients sont eux-mêmes en Europe.',
        en: 'Use the currency of the country you deliver to (XOF, XAF, GNF, CDF and so on), not euros, unless your customers are in Europe too.',
      },
      {
        fr: 'Ouvre ton compte chez un prestataire actif dans le pays de livraison (FeexPay, FedaPay, PayDunya ou PawaPay selon le pays) et vérifie avec lui les conditions pour un titulaire vivant à l’étranger.',
        en: 'Open an account with a provider active in the delivery country (FeexPay, FedaPay, PayDunya or PawaPay depending on the country) and check its requirements for an account holder living abroad.',
      },
      {
        fr: 'Recrute tes closers sur place ou parmi des gens qui parlent la langue du terrain. Avec l’attribution automatique, ils reçoivent les commandes même quand tu dors, avec le décalage horaire.',
        en: 'Hire closers locally or people who speak the local language. With automatic assignment, they get orders even while you sleep across time zones.',
      },
      {
        fr: 'Suis le chiffre encaissé et les colis retournés chaque jour : à distance, c’est ton seul moyen de vérifier que l’argent du COD remonte bien.',
        en: 'Check money collected and returned parcels every day: from abroad, it is your only way to make sure cash on delivery money actually comes back to you.',
      },
      {
        fr: 'Active les notifications avec le son d’encaissement pour savoir en temps réel quand une commande tombe ou est payée.',
        en: 'Turn on notifications with the cash register sound so you know in real time when an order lands or gets paid.',
      },
      {
        fr: 'Pour la diaspora qui achète pour un proche, ajoute un champ « nom et téléphone du destinataire » dans ton formulaire de commande personnalisable.',
        en: 'For diaspora buyers ordering for a relative, add a recipient name and phone field to your customizable order form.',
      },
    ],
    productIdeas: [
      { fr: 'Produits de beauté et cosmétiques achetés en Europe, souvent demandés en Afrique francophone.', en: 'Beauty products and cosmetics sourced in Europe, often in demand in French-speaking Africa.' },
      { fr: 'Produits digitaux (formations, guides) vendus à la diaspora et en Afrique.', en: 'Digital products such as courses and guides, sold to the diaspora and in Africa.' },
      { fr: 'Cadeaux pour les proches au pays lors des fêtes (Tabaski, Noël, rentrée).', en: 'Gifts for relatives back home during holidays such as Tabaski, Christmas or back to school.' },
      { fr: 'Petits appareils électroniques et accessoires de téléphone.', en: 'Small electronics and phone accessories.' },
      { fr: 'Vêtements et chaussures de marque en petite quantité.', en: 'Branded clothes and shoes in small quantities.' },
    ],
    faqs: [
      {
        q: { fr: 'Peut-on vendre en Afrique depuis la France avec Zuri ?', en: 'Can I sell in Africa from France with Zuri?' },
        a: {
          fr: 'Oui. Tu gères la boutique, la pub et les commandes à distance, et la livraison se fait sur place en paiement à la livraison ou en Mobile Money si un prestataire intégré couvre le pays. Il te faut un stock et un livreur de confiance sur place.',
          en: 'Yes. You run the store, ads and orders remotely, and delivery happens locally with cash on delivery, or Mobile Money where an integrated provider covers the country. You need stock and a trusted delivery partner there.',
        },
      },
      {
        q: { fr: 'Zuri encaisse-t-il des paiements par carte en France ?', en: 'Does Zuri take card payments in France?' },
        a: {
          fr: 'Non, aucun prestataire intégré à Zuri n’encaisse en France. Pour un produit digital, tu peux passer par un lien Chariow, Maketou ou Selar ; pour les produits physiques, Zuri est pensé pour le COD et le Mobile Money en Afrique.',
          en: 'No, none of the providers integrated with Zuri collect payments in France. For digital products you can use a Chariow, Maketou or Selar link; for physical goods, Zuri is designed for cash on delivery and Mobile Money in Africa.',
        },
      },
      {
        q: { fr: 'Comment faire du dropshipping en Afrique depuis la France ?', en: 'How do I dropship to Africa from France?' },
        a: {
          fr: 'Fais du dropshipping local : un fournisseur ou un stock dans le pays visé, une livraison rapide et le paiement à la livraison. Toi, tu t’occupes de la boutique, de la pub et du suivi des closers.',
          en: 'Do local dropshipping: a supplier or stock in the target country, fast delivery and cash on delivery. You handle the store, the ads and your closers.',
        },
      },
      {
        q: { fr: 'Le site de vente en ligne est-il gratuit ?', en: 'Is the online store free?' },
        a: {
          fr: 'Zuri est gratuit pendant le lancement, avec un sous-domaine offert et 0 % de commission sur tes ventes.',
          en: 'Zuri is free during launch, with a free subdomain and 0% commission on your sales.',
        },
      },
    ],
    sources: [
      { label: 'FedaPay : pays pris en charge', url: 'https://support.fedapay.com/portal/en/kb/articles/fedapay-fonctionne-t-il-dans-mon-pays' },
      { label: 'pawaPay : opérateurs par pays', url: 'https://docs.pawapay.io/v2/docs/providers' },
      { label: 'pawaPay : offres et opérateurs réservés à l’offre Entreprise (novembre 2026)', url: 'https://pawapay.io/plans' },
      { label: 'FeexPay : FAQ pays disponibles', url: 'https://feexpay.me' },
      { label: 'PayDunya : opérateurs Mobile Money disponibles', url: 'https://developers.paydunya.com/doc/FR/introduction' },
    ],
  },
]
