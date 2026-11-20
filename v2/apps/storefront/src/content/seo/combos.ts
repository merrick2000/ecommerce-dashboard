/**
 * Pages « vendre [métier] à [ville] » / « sell [niche] in [city] » : une sélection courte et justifiée
 * (77 combinaisons, pas les 336 possibles). On ne garde que les métiers qui ont une vraie demande en ligne
 * dans chaque grande ville, pour viser des requêtes précises sans créer de pages pauvres.
 *
 * Chaque page assemble des données propres à la combinaison : paragraphe local écrit à la main (ci-dessous),
 * quartiers et conseil de livraison de la ville (cities.ts), devise et Mobile Money du pays (countries.ts),
 * réalité de livraison du pays (COUNTRY_DELIVERY), produits et règles pub du métier (niches.ts),
 * exemple de marge en devise locale (prix et coût ci-dessous) et FAQ adaptée.
 *
 * Règles : aucun tiret long ou moyen, aucun emoji, aucune statistique inventée, faits locaux prudents.
 * Les prix sont des EXEMPLES plausibles, présentés comme tels sur la page.
 */
import type { Faq, L10n } from './types'

export interface ComboPage {
  /** Clé (fr) du métier dans niches.ts. */
  niche: string
  /** Slug de la ville dans cities.ts. */
  city: string
  /** « Ce métier dans cette ville » : 1 à 3 phrases écrites à la main, prudentes et factuelles. */
  local: L10n
  /** Exemple de prix de vente (livraison comprise) et de coût d'achat, dans la monnaie d'exemple de la ville. */
  price: number
  cost: number
}

/** Données propres au métier pour les combinaisons. */
export interface ComboNicheMeta {
  /** Base courte de l'adresse : /vendre/<fr>-<ville>, /en/sell/<en>-<city>. */
  base: L10n
  /** « des perruques et mèches » / « wigs and hair extensions » (titres, H1, textes). */
  phrase: L10n
  /** Variante courte pour les titres trop longs. */
  short: L10n
  /** Article de l'exemple de marge. */
  item: L10n
  /** Question propre au métier, déclinée par ville. */
  faq: (city: string) => Faq
}

const l = (fr: string, en: string): L10n => ({ fr, en })
const faq = (qFr: string, qEn: string, aFr: string, aEn: string): Faq => ({ q: l(qFr, qEn), a: l(aFr, aEn) })

export const COMBO_NICHES: Record<string, ComboNicheMeta> = {
  'vetements-en-ligne': {
    base: l('vetements', 'clothes'),
    phrase: l('des vêtements', 'clothes'),
    short: l('des vêtements', 'clothes'),
    item: l('un ensemble ou une robe', 'an outfit or a dress'),
    faq: (c) =>
      faq(
        `Comment éviter les retours de taille sur les vêtements à ${c} ?`,
        `How do I avoid size returns on clothes in ${c}?`,
        'Donne un guide des tailles en centimètres, demande la taille habituelle au moment de la confirmation et propose l’échange plutôt que le remboursement quand c’est possible.',
        'Give a size guide in centimetres, ask for the usual size during the confirmation call and offer an exchange rather than a refund when you can.',
      ),
  },
  chaussures: {
    base: l('chaussures', 'shoes'),
    phrase: l('des chaussures', 'shoes'),
    short: l('des chaussures', 'shoes'),
    item: l('une paire de baskets', 'a pair of sneakers'),
    faq: (c) =>
      faq(
        `Comment gérer les pointures quand je vends des chaussures à ${c} ?`,
        `How do I handle sizes when selling shoes in ${c}?`,
        'Indique la correspondance entre pointure et longueur du pied en centimètres, redemande la pointure lors de l’appel de confirmation et prévois un échange simple si le modèle taille petit.',
        'Show how each size maps to foot length in centimetres, ask for the size again on the confirmation call and plan a simple exchange if a model runs small.',
      ),
  },
  cosmetiques: {
    base: l('cosmetiques', 'cosmetics'),
    phrase: l('des cosmétiques', 'cosmetics'),
    short: l('des cosmétiques', 'cosmetics'),
    item: l('un pack soin de 2 produits', 'a 2-product skincare pack'),
    faq: (c) =>
      faq(
        `Quels cosmétiques éviter de vendre à ${c} ?`,
        `Which cosmetics should I avoid selling in ${c}?`,
        'Évite les produits éclaircissants, ceux sans composition lisible ou sans date de péremption, et les promesses de résultat garanti : ils exposent tes clientes et font refuser tes pubs.',
        'Avoid skin lightening products, anything without a readable ingredient list or expiry date, and guaranteed result claims: they put customers at risk and get your ads rejected.',
      ),
  },
  'perruques-meches': {
    base: l('perruques', 'wigs'),
    phrase: l('des perruques et mèches', 'wigs and hair extensions'),
    short: l('des perruques', 'wigs'),
    item: l('une perruque', 'a wig'),
    faq: (c) =>
      faq(
        `Comment rassurer une cliente à ${c} qui ne peut pas toucher la perruque ?`,
        `How do I reassure a customer in ${c} who cannot touch the wig?`,
        'Filme la perruque portée en lumière naturelle, annonce la longueur, la densité et le type de cheveux, et accepte qu’elle vérifie le colis devant le livreur avant de payer.',
        'Film the wig being worn in daylight, state the length, density and hair type, and let her check the parcel in front of the rider before paying.',
      ),
  },
  'bijoux-montres': {
    base: l('bijoux', 'jewelry'),
    phrase: l('des bijoux et montres', 'jewelry and watches'),
    short: l('des bijoux', 'jewelry'),
    item: l('une montre ou une parure', 'a watch or a jewelry set'),
    faq: (c) =>
      faq(
        `Comment éviter les déceptions sur les bijoux vendus à ${c} ?`,
        `How do I avoid disappointment on jewelry sold in ${c}?`,
        'Annonce la matière exacte (acier, plaqué or, argent), montre le bijou porté pour donner l’échelle et emballe-le dans une pochette ou une boîte : beaucoup de commandes sont des cadeaux.',
        'State the exact material (steel, gold plated, silver), show the piece being worn for scale and pack it in a pouch or box: many orders are gifts.',
      ),
  },
  parfums: {
    base: l('parfums', 'perfume'),
    phrase: l('des parfums', 'perfume'),
    short: l('des parfums', 'perfume'),
    item: l('un flacon de parfum', 'a bottle of perfume'),
    faq: (c) =>
      faq(
        `Comment vendre un parfum en ligne à ${c} sans le faire sentir ?`,
        `How do I sell perfume online in ${c} when customers cannot smell it?`,
        'Décris les notes avec des mots simples (frais, sucré, boisé), compare avec des odeurs du quotidien et propose un petit format pour découvrir. Ne présente jamais une imitation comme un original de marque.',
        'Describe the notes in simple words (fresh, sweet, woody), compare them with everyday smells and offer a small discovery size. Never present an imitation as a branded original.',
      ),
  },
  'accessoires-telephone': {
    base: l('accessoires-telephone', 'phone-accessories'),
    phrase: l('des accessoires de téléphone', 'phone accessories'),
    short: l('des accessoires mobiles', 'phone accessories'),
    item: l('un pack écouteurs et câble', 'an earbuds and cable pack'),
    faq: (c) =>
      faq(
        `Comment éviter les retours sur les accessoires de téléphone à ${c} ?`,
        `How do I avoid returns on phone accessories in ${c}?`,
        'Demande le modèle exact du téléphone à la confirmation, teste chaque chargeur et câble avant l’envoi et indique la puissance réelle sans l’exagérer.',
        'Ask for the exact phone model at confirmation, test every charger and cable before shipping and state the real power output without exaggerating.',
      ),
  },
  electromenager: {
    base: l('electromenager', 'home-appliances'),
    phrase: l('de l’électroménager', 'home appliances'),
    short: l('de l’électroménager', 'appliances'),
    item: l('un mixeur', 'a blender'),
    faq: (c) =>
      faq(
        `Comment limiter les refus sur l’électroménager à ${c} ?`,
        `How do I limit refusals on home appliances in ${c}?`,
        'Montre l’appareil en marche en vidéo, teste-le avant l’envoi, propose de le brancher devant le client à la livraison et écris clairement la garantie que tu offres.',
        'Show the appliance running on video, test it before shipping, offer to plug it in in front of the customer at delivery and write down clearly the warranty you offer.',
      ),
  },
  'produits-bebe': {
    base: l('produits-bebe', 'baby-products'),
    phrase: l('des produits bébé', 'baby products'),
    short: l('des produits bébé', 'baby products'),
    item: l('un pack naissance', 'a newborn bundle'),
    faq: (c) =>
      faq(
        `Comment inspirer confiance aux parents de ${c} ?`,
        `How do I earn the trust of parents in ${c}?`,
        'Indique les matières, les âges et les tailles, montre les vrais produits, évite toute promesse médicale et réponds vite sur WhatsApp : les parents posent beaucoup de questions avant d’acheter.',
        'State materials, ages and sizes, show the real products, avoid any medical claim and reply fast on WhatsApp: parents ask a lot of questions before buying.',
      ),
  },
  'sport-fitness': {
    base: l('articles-sport', 'sports-gear'),
    phrase: l('des articles de sport', 'sports and fitness gear'),
    short: l('du matériel de sport', 'fitness gear'),
    item: l('un kit d’entraînement', 'a training kit'),
    faq: (c) =>
      faq(
        `Que dire et ne pas dire dans mes pubs sport à ${c} ?`,
        `What should my fitness ads in ${c} say and avoid?`,
        'Montre comment utiliser le produit et à quoi il sert. Évite les promesses de perte de poids, les photos avant et après et les délais de transformation : les régies publicitaires les refusent.',
        'Show how to use the product and what it is for. Avoid weight loss promises, before and after photos and transformation timelines: ad platforms reject them.',
      ),
  },
  'maison-deco': {
    base: l('deco-maison', 'home-decor'),
    phrase: l('de la déco maison', 'home decor'),
    short: l('de la déco', 'home decor'),
    item: l('un lot de coussins', 'a set of cushions'),
    faq: (c) =>
      faq(
        `Comment éviter la casse quand je livre de la déco à ${c} ?`,
        `How do I avoid breakage when delivering decor in ${c}?`,
        'Emballe chaque objet fragile avec du papier bulle ou du carton, écris « fragile » sur le colis et demande au client de vérifier l’état devant le livreur.',
        'Wrap every fragile item in bubble wrap or cardboard, write "fragile" on the parcel and ask the customer to check it in front of the rider.',
      ),
  },
  'produits-naturels': {
    base: l('produits-naturels', 'natural-products'),
    phrase: l('des produits naturels', 'natural products'),
    short: l('des produits naturels', 'natural products'),
    item: l('un pack karité et savon noir', 'a shea butter and black soap pack'),
    faq: (c) =>
      faq(
        `Que puis-je affirmer sur mes produits naturels vendus à ${c} ?`,
        `What can I claim about natural products sold in ${c}?`,
        'Décris l’origine, la composition, l’usage et le conditionnement. N’affirme pas qu’un produit soigne une maladie : c’est trompeur, risqué et refusé par les régies publicitaires.',
        'Describe the origin, ingredients, use and packaging. Do not claim a product cures a disease: it is misleading, risky and rejected by ad platforms.',
      ),
  },
}

/** Monnaie de l'exemple de marge et course de livreur indicative, par ville (exemples, pas des tarifs officiels). */
export interface ComboMoney {
  /** Code de la monnaie de l'exemple (USD à Kinshasa, où le dollar est très utilisé). */
  cur: 'XOF' | 'XAF' | 'GNF' | 'USD' | 'NGN' | 'GHS' | 'KES'
  delivery: number
  /** Pas d'arrondi pour la pub estimée. */
  step: number
}
export const COMBO_MONEY: Record<string, ComboMoney> = {
  abidjan: { cur: 'XOF', delivery: 1500, step: 500 },
  dakar: { cur: 'XOF', delivery: 1500, step: 500 },
  cotonou: { cur: 'XOF', delivery: 1000, step: 500 },
  lome: { cur: 'XOF', delivery: 1000, step: 500 },
  bamako: { cur: 'XOF', delivery: 1500, step: 500 },
  ouagadougou: { cur: 'XOF', delivery: 1000, step: 500 },
  douala: { cur: 'XAF', delivery: 1500, step: 500 },
  yaounde: { cur: 'XAF', delivery: 1500, step: 500 },
  libreville: { cur: 'XAF', delivery: 2500, step: 500 },
  conakry: { cur: 'GNF', delivery: 20000, step: 5000 },
  kinshasa: { cur: 'USD', delivery: 3, step: 1 },
  lagos: { cur: 'NGN', delivery: 3000, step: 500 },
  accra: { cur: 'GHS', delivery: 30, step: 5 },
  nairobi: { cur: 'KES', delivery: 300, step: 50 },
}

/** Réalité de livraison propre au pays (courte, prudente, écrite pour ces pages). */
export const COUNTRY_DELIVERY: Record<string, L10n> = {
  'cote-d-ivoire': l(
    'En Côte d’Ivoire, les livraisons dans Abidjan se font surtout à moto, le jour même ou le lendemain. Pour l’intérieur du pays, les vendeurs passent souvent par les compagnies de car ou des services de colis, avec un acompte.',
    'In Côte d’Ivoire, deliveries inside Abidjan are mostly done by motorbike, same day or next day. For the rest of the country, sellers often use bus companies or parcel services, with a deposit.',
  ),
  senegal: l(
    'Au Sénégal, la livraison à Dakar se fait surtout à moto, par les livreurs que l’on appelle souvent « tiak tiak ». Beaucoup de clients paient par Wave au moment de la livraison, sans espèces.',
    'In Senegal, deliveries in Dakar are mostly done by motorbike couriers, often called "tiak tiak". Many customers pay with Wave at the door, without cash.',
  ),
  benin: l(
    'Au Bénin, Cotonou et les communes voisines comme Abomey-Calavi se livrent à moto, souvent par zémidjan ou par des livreurs indépendants. Pour les autres villes, les colis voyagent souvent par bus.',
    'In Benin, Cotonou and nearby communes like Abomey-Calavi are served by motorbike, often by zemidjan riders or independent couriers. Parcels to other cities often travel by bus.',
  ),
  togo: l(
    'Au Togo, l’essentiel des commandes se livre dans le Grand Lomé, à moto. Vers les villes de l’intérieur, le colis part souvent par car, avec un acompte ou un paiement avant l’envoi.',
    'In Togo, most orders are delivered in Greater Lomé, by motorbike. To inland cities, parcels often go by bus, with a deposit or payment before shipping.',
  ),
  cameroun: l(
    'Au Cameroun, Douala et Yaoundé ont chacune leurs livreurs à moto. Entre les deux villes, les colis passent souvent par les agences de voyage, avec un acompte par MTN MoMo ou Orange Money.',
    'In Cameroon, Douala and Yaoundé each have their own motorbike couriers. Between the two cities, parcels often go through travel agencies, with a deposit by MTN MoMo or Orange Money.',
  ),
  mali: l(
    'Au Mali, les livraisons dans Bamako se font à moto, en tenant compte des deux rives du fleuve et des ponts aux heures de pointe. Orange Money sert souvent à payer un acompte.',
    'In Mali, deliveries in Bamako are done by motorbike, keeping in mind the two river banks and the bridges at rush hour. Orange Money is often used for a deposit.',
  ),
  'burkina-faso': l(
    'Au Burkina Faso, la livraison se fait surtout à moto. Entre Ouagadougou et Bobo-Dioulasso, les colis passent souvent par les compagnies de transport, avec un acompte.',
    'In Burkina Faso, deliveries are mostly done by motorbike. Between Ouagadougou and Bobo-Dioulasso, parcels often go through bus companies, with a deposit.',
  ),
  guinee: l(
    'En Guinée, les livraisons à Conakry se font à moto. Les embouteillages sur la presqu’île rallongent les trajets, donc annonce des créneaux réalistes à tes clients.',
    'In Guinea, deliveries in Conakry are done by motorbike. Traffic along the peninsula makes trips longer, so give your customers realistic time slots.',
  ),
  gabon: l(
    'Au Gabon, l’essentiel des commandes vient du Grand Libreville, avec Owendo et Akanda. Vers les autres villes, l’envoi passe par un transporteur, généralement avec paiement avant l’envoi.',
    'In Gabon, most orders come from Greater Libreville, including Owendo and Akanda. To other cities, parcels go through a carrier, usually paid before shipping.',
  ),
  'rd-congo': l(
    'En RD Congo, Kinshasa est immense : la livraison se fait à moto et le délai dépend beaucoup de la commune. Beaucoup de vendeurs fixent leurs prix en dollars, tout en acceptant les francs congolais et le Mobile Money.',
    'In the DR Congo, Kinshasa is huge: deliveries are done by motorbike and the delay depends a lot on the commune. Many sellers price in US dollars while accepting Congolese francs and Mobile Money.',
  ),
  nigeria: l(
    'Au Nigeria, Lagos se livre surtout par des sociétés de dispatch à moto. Passer du continent aux îles (Lekki, Victoria Island) change souvent le prix et le délai de la course.',
    'In Nigeria, Lagos is mostly served by motorbike dispatch companies. Going between the mainland and the islands (Lekki, Victoria Island) often changes the price and timing of a delivery.',
  ),
  ghana: l(
    'Au Ghana, la livraison se fait surtout par dispatch riders à moto, et beaucoup de clients paient par MTN MoMo à la réception plutôt qu’en espèces.',
    'In Ghana, deliveries are mostly done by dispatch riders on motorbikes, and many customers pay with MTN MoMo on receipt rather than in cash.',
  ),
  kenya: l(
    'Au Kenya, les livraisons à Nairobi se font par boda boda (moto) ou par des services de colis, et M-Pesa permet au client de payer au moment de la réception.',
    'In Kenya, deliveries in Nairobi are done by boda boda (motorbike) or parcel services, and M-Pesa lets customers pay when the parcel arrives.',
  ),
}

const c = (niche: string, city: string, price: number, cost: number, fr: string, en: string): ComboPage => ({ niche, city, price, cost, local: l(fr, en) })

export const COMBOS: ComboPage[] = [
  /* Abidjan : premier marché en ligne de Côte d’Ivoire, forte demande mode et beauté, beaucoup de grossistes. */
  c('vetements-en-ligne', 'abidjan', 12000, 5000,
    'À Abidjan, les tenues en pagne et le wax côtoient le prêt-à-porter importé, et beaucoup de commandes arrivent par Facebook et TikTok. Les clientes de Cocody, de Marcory ou de Yopougon demandent souvent les mesures exactes avant de confirmer : un guide des tailles clair évite des colis refusés.',
    'In Abidjan, pagne and wax outfits sit next to imported ready-to-wear, and many orders come through Facebook and TikTok. Customers in Cocody, Marcory or Yopougon often ask for exact measurements before confirming: a clear size guide avoids refused parcels.'),
  c('perruques-meches', 'abidjan', 35000, 18000,
    'Les perruques et les mèches font partie des achats beauté courants à Abidjan, et la concurrence y est forte sur Facebook et TikTok. Une vidéo de la perruque portée, avec la longueur et la densité annoncées, aide à se démarquer des simples photos de catalogue.',
    'Wigs and hair extensions are an everyday beauty purchase in Abidjan, and competition on Facebook and TikTok is strong. A video of the wig being worn, with length and density stated, helps you stand out from plain catalogue photos.'),
  c('cosmetiques', 'abidjan', 9000, 3500,
    'À Abidjan, la demande en soins de la peau et en produits capillaires est forte, mais les clientes se méfient des produits éclaircissants et des promesses miracles. Mise sur une composition lisible, la date de péremption et des photos réelles du produit.',
    'In Abidjan, demand for skincare and hair products is strong, but customers are wary of lightening products and miracle claims. Focus on a readable ingredient list, the expiry date and real photos of the product.'),
  c('parfums', 'abidjan', 15000, 6500,
    'Le parfum se vend bien à Abidjan, en grand flacon comme en format de poche, mais le client ne peut pas sentir avant d’acheter. Décris les notes avec des comparaisons simples et propose des formats découverte pour les premières commandes.',
    'Perfume sells well in Abidjan, in full bottles and pocket sizes alike, but customers cannot smell it before buying. Describe the notes with simple comparisons and offer discovery sizes for first orders.'),
  c('chaussures', 'abidjan', 15000, 7000,
    'À Abidjan, sandales, baskets et chaussures de soirée se vendent toute l’année. La pointure est la première cause de refus : demande-la au moment de la confirmation et indique la correspondance en centimètres.',
    'In Abidjan, sandals, sneakers and evening shoes sell all year round. Size is the first cause of refusals: ask for it on the confirmation call and show the matching length in centimetres.'),
  c('accessoires-telephone', 'abidjan', 7000, 2500,
    'À Abidjan, coques, chargeurs, écouteurs et power banks sont des achats d’impulsion faciles à vendre en paiement à la livraison. Précise toujours les modèles compatibles pour éviter les retours.',
    'In Abidjan, cases, chargers, earbuds and power banks are easy impulse buys with cash on delivery. Always state the compatible models to avoid returns.'),
  c('bijoux-montres', 'abidjan', 10000, 3500,
    'À Abidjan, bijoux et montres se vendent beaucoup comme cadeaux, surtout autour des fêtes de fin d’année et de la Saint-Valentin. Un emballage soigné et des photos portées, pour donner l’échelle, rassurent plus qu’une belle image de catalogue.',
    'In Abidjan, jewelry and watches sell a lot as gifts, especially around the end of year holidays and Valentine’s Day. Neat packaging and photos of the piece being worn, for scale, reassure more than a nice catalogue image.'),
  c('sport-fitness', 'abidjan', 15000, 7000,
    'À Abidjan, beaucoup de clients s’entraînent en salle ou à la maison, et les petits équipements (élastiques, tapis, cordes à sauter, tenues) s’envoient facilement à moto. Montre l’usage du produit, sans promesse de perte de poids.',
    'In Abidjan, many customers train at the gym or at home, and small equipment (resistance bands, mats, skipping ropes, outfits) is easy to send by motorbike. Show how the product is used, without weight loss promises.'),

  /* Dakar : cœur du e-commerce sénégalais, Wave très utilisé, fêtes (Tabaski, Korité) qui rythment la mode et les cadeaux. */
  c('vetements-en-ligne', 'dakar', 15000, 6500,
    'À Dakar, les tenues traditionnelles (boubous, ensembles en wax ou en bazin) et le prêt-à-porter se vendent beaucoup en ligne, avec des pics avant la Tabaski et la Korité. Prépare tes stocks et tes pubs quelques semaines avant ces fêtes.',
    'In Dakar, traditional outfits (boubous, wax or bazin sets) and ready-to-wear sell a lot online, with peaks before Tabaski and Korité. Prepare your stock and ads a few weeks before these holidays.'),
  c('parfums', 'dakar', 15000, 6500,
    'Le parfum et l’encens (thiouraye) occupent une vraie place dans les habitudes à Dakar, et les clients connaissent bien les senteurs. Décris honnêtement la composition et ne présente jamais une imitation comme un original de marque.',
    'Perfume and incense (thiouraye) are part of daily habits in Dakar, and customers know scents well. Describe the composition honestly and never present an imitation as a branded original.'),
  c('cosmetiques', 'dakar', 9000, 3500,
    'À Dakar, les soins naturels et les produits pour cheveux se vendent bien sur Instagram, TikTok et WhatsApp. Les clientes paient volontiers par Wave à la livraison si la page inspire confiance : photos réelles, composition, contact WhatsApp.',
    'In Dakar, natural skincare and hair products sell well on Instagram, TikTok and WhatsApp. Customers happily pay with Wave at delivery when the page feels trustworthy: real photos, ingredients, a WhatsApp contact.'),
  c('bijoux-montres', 'dakar', 12000, 4500,
    'À Dakar, bijoux dorés et parures se vendent pour les mariages, les baptêmes et les fêtes religieuses. Indique clairement la matière (plaqué or, acier, argent) : c’est souvent la première question des clientes.',
    'In Dakar, gold-tone jewelry and sets sell for weddings, naming ceremonies and religious holidays. State the material clearly (gold plated, steel, silver): it is often the first question customers ask.'),
  c('produits-naturels', 'dakar', 7000, 2500,
    'Karité, bissap, huiles et poudres naturelles ont une clientèle fidèle à Dakar, souvent sur WhatsApp. Soigne l’étiquetage (origine, poids, date) et évite les promesses de guérison, interdites dans les pubs.',
    'Shea butter, bissap, oils and natural powders have a loyal customer base in Dakar, often on WhatsApp. Take care of labels (origin, weight, date) and avoid healing claims, which ads do not allow.'),
  c('perruques-meches', 'dakar', 35000, 18000,
    'À Dakar, perruques et mèches se vendent beaucoup sur Instagram et TikTok, auprès de clientes attentives à la qualité des cheveux. Une vidéo en lumière naturelle et une règle d’échange claire font la différence.',
    'In Dakar, wigs and extensions sell a lot on Instagram and TikTok, to customers who pay close attention to hair quality. A daylight video and a clear exchange policy make the difference.'),
  c('produits-bebe', 'dakar', 15000, 7500,
    'À Dakar, beaucoup de jeunes parents achètent en ligne les articles de naissance : bodies, couvertures, porte-bébés, petits accessoires de soin. Les packs naissance se prêtent bien aux cadeaux de baptême.',
    'In Dakar, many young parents buy newborn items online: bodysuits, blankets, baby carriers, small care accessories. Newborn bundles work well as naming ceremony gifts.'),

  /* Cotonou : capitale économique du Bénin, marché Dantokpa, vendeuses qui combinent boutique, WhatsApp et page en ligne. */
  c('vetements-en-ligne', 'cotonou', 10000, 4500,
    'À Cotonou, le marché Dantokpa reste une référence pour le textile, et beaucoup de vendeuses prolongent leur boutique sur WhatsApp et Facebook. Une page en ligne permet de livrer à Fidjrossè, Akpakpa ou Calavi sans que la cliente se déplace au marché.',
    'In Cotonou, Dantokpa market is still the reference for textiles, and many sellers extend their shop to WhatsApp and Facebook. An online page lets you deliver to Fidjrossè, Akpakpa or Calavi without the customer going to the market.'),
  c('perruques-meches', 'cotonou', 30000, 16000,
    'Perruques et mèches ont une clientèle active à Cotonou et à Abomey-Calavi, notamment chez les étudiantes et les jeunes actives. Montre la perruque portée en vidéo et annonce le prix livraison comprise selon le quartier.',
    'Wigs and extensions have an active customer base in Cotonou and Abomey-Calavi, including students and young professionals. Show the wig being worn on video and state the price including delivery for each area.'),
  c('chaussures', 'cotonou', 13000, 6000,
    'À Cotonou, baskets, sandales et chaussures de cérémonie se vendent bien en ligne et se livrent facilement à moto. Mets la pointure dans le formulaire de commande et confirme-la par appel.',
    'In Cotonou, sneakers, sandals and ceremony shoes sell well online and are easy to deliver by motorbike. Put the size in the order form and confirm it by phone.'),
  c('cosmetiques', 'cotonou', 8000, 3000,
    'À Cotonou, les soins de la peau et des cheveux se vendent sur Facebook et WhatsApp, auprès de clientes attentives aux contrefaçons. Montre l’emballage d’origine et la date de péremption sur tes photos.',
    'In Cotonou, skin and hair care sells on Facebook and WhatsApp, to customers wary of fakes. Show the original packaging and the expiry date in your photos.'),
  c('electromenager', 'cotonou', 25000, 13000,
    'À Cotonou, beaucoup de petits appareils (mixeurs, ventilateurs, fers à repasser) se trouvent chez les importateurs et grossistes de la ville. Une courte vidéo de démonstration et une garantie écrite simple rassurent avant un achat plus cher.',
    'In Cotonou, many small appliances (blenders, fans, irons) are available from the city’s importers and wholesalers. A short demo video and a simple written warranty reassure customers before a bigger purchase.'),

  /* Lomé : ville portuaire, grossistes nombreux (dropshipping local), tradition du pagne. */
  c('vetements-en-ligne', 'lome', 10000, 4500,
    'À Lomé, la tradition du pagne est forte et les grossistes de la ville facilitent l’approvisionnement en prêt-à-porter. Les clientes de Tokoin, Bè ou Agoè commandent volontiers en ligne si les tailles et le prix livraison comprise sont clairs.',
    'In Lomé, the pagne tradition is strong and the city’s wholesalers make ready-to-wear easy to source. Customers in Tokoin, Bè or Agoè happily order online when sizes and the delivered price are clear.'),
  c('perruques-meches', 'lome', 30000, 16000,
    'Perruques et mèches se vendent bien à Lomé, où les clientes comparent souvent plusieurs pages avant de commander. Une vidéo de la perruque portée et une réponse rapide sur WhatsApp aident à conclure.',
    'Wigs and extensions sell well in Lomé, where customers often compare several pages before ordering. A video of the wig being worn and a fast WhatsApp reply help close the sale.'),
  c('accessoires-telephone', 'lome', 6000, 2000,
    'Avec son port, Lomé compte beaucoup de grossistes en accessoires de téléphone. Coques, câbles, écouteurs et power banks se vendent bien en packs, à condition de préciser les modèles compatibles.',
    'With its port, Lomé has plenty of phone accessory wholesalers. Cases, cables, earbuds and power banks sell well as bundles, as long as you state the compatible models.'),
  c('electromenager', 'lome', 22000, 12000,
    'À Lomé, petits appareils de cuisine et ventilateurs se trouvent facilement chez les grossistes de la ville portuaire. Pour ces produits, une vidéo de démonstration et un essai devant le client à la livraison limitent les refus.',
    'In Lomé, small kitchen appliances and fans are easy to find from the port city’s wholesalers. For these products, a demo video and a test in front of the customer at delivery limit refusals.'),
  c('cosmetiques', 'lome', 8000, 3000,
    'À Lomé, les produits de soin, les huiles et les cosmétiques pour cheveux se vendent bien sur Facebook et TikTok. Les clientes paient souvent par Mixx by Yas ou Flooz quand elles connaissent déjà la boutique.',
    'In Lomé, skincare, oils and hair cosmetics sell well on Facebook and TikTok. Customers often pay with Mixx by Yas or Flooz once they already know the store.'),

  /* Douala : capitale économique et premier port du Cameroun, nombreux grossistes et vendeurs en ligne. */
  c('vetements-en-ligne', 'douala', 12000, 5000,
    'Douala, ville portuaire et commerçante, compte de nombreux grossistes en vêtements, d’Akwa aux grands marchés. Vendre en ligne te permet de toucher Bonamoussadi, Makepe ou Bonabéri sans tenir de boutique physique.',
    'Douala, a port and trading city, has many clothing wholesalers, from Akwa to the big markets. Selling online lets you reach Bonamoussadi, Makepe or Bonabéri without running a physical shop.'),
  c('perruques-meches', 'douala', 35000, 18000,
    'À Douala, perruques et mèches font partie des produits phares des vendeuses en ligne, souvent sur Facebook et TikTok. Les clientes veulent voir la texture et la longueur réelles : filme la perruque portée, en plein jour.',
    'In Douala, wigs and extensions are among online sellers’ flagship products, often on Facebook and TikTok. Customers want to see the real texture and length: film the wig being worn, in daylight.'),
  c('chaussures', 'douala', 15000, 7000,
    'À Douala, les chaussures se vendent beaucoup en ligne, des baskets aux escarpins, avec un approvisionnement facile chez les grossistes de la ville. Tiens tes pointures disponibles à jour pour éviter les commandes impossibles à livrer.',
    'In Douala, shoes sell a lot online, from sneakers to heels, with easy sourcing from the city’s wholesalers. Keep your available sizes up to date to avoid orders you cannot fulfil.'),
  c('accessoires-telephone', 'douala', 7000, 2500,
    'Douala est une plaque tournante pour les téléphones et les accessoires au Cameroun. Pour te démarquer, vends des packs utiles (coque, verre trempé, câble) avec la compatibilité indiquée clairement.',
    'Douala is a hub for phones and accessories in Cameroon. To stand out, sell useful bundles (case, tempered glass, cable) with compatibility clearly stated.'),
  c('electromenager', 'douala', 25000, 13000,
    'À Douala, les petits électroménagers (blenders, plaques, ventilateurs) se vendent bien en ligne. Teste chaque appareil avant l’envoi et propose de le faire fonctionner devant le client.',
    'In Douala, small appliances (blenders, hot plates, fans) sell well online. Test every unit before shipping and offer to run it in front of the customer.'),
  c('cosmetiques', 'douala', 9000, 3500,
    'À Douala, les cosmétiques se vendent beaucoup via Facebook et WhatsApp, auprès d’une clientèle exigeante sur l’authenticité. Montre les numéros de lot, les dates et l’emballage d’origine.',
    'In Douala, cosmetics sell a lot through Facebook and WhatsApp, to customers who are demanding about authenticity. Show batch numbers, dates and original packaging.'),

  /* Yaoundé : capitale politique, fonctionnaires et étudiants, sensibles aux offres de fin de mois. */
  c('vetements-en-ligne', 'yaounde', 12000, 5000,
    'À Yaoundé, fonctionnaires et étudiants forment une clientèle importante, sensible aux offres de fin de mois. Programme tes promotions et tes pubs autour des jours de paie.',
    'In Yaoundé, civil servants and students are a large customer base, responsive to end of month offers. Schedule your promotions and ads around payday.'),
  c('perruques-meches', 'yaounde', 30000, 16000,
    'À Yaoundé, beaucoup d’étudiantes et de jeunes actives achètent perruques et mèches en ligne. Des modèles à prix doux et un paiement par MTN MoMo ou Orange Money à la livraison facilitent la décision.',
    'In Yaoundé, many students and young professionals buy wigs and extensions online. Affordable models and payment by MTN MoMo or Orange Money at delivery make the decision easier.'),
  c('cosmetiques', 'yaounde', 8000, 3000,
    'À Yaoundé, les soins du visage et des cheveux se vendent aussi bien près des quartiers étudiants comme Ngoa-Ekellé que dans des quartiers résidentiels comme Bastos. Adapte tes packs : format découverte pour les petits budgets, routine complète pour les autres.',
    'In Yaoundé, face and hair care sells near student areas like Ngoa-Ekellé as well as in residential areas like Bastos. Adapt your bundles: a discovery size for small budgets, a full routine for others.'),
  c('produits-bebe', 'yaounde', 15000, 7500,
    'À Yaoundé, beaucoup de jeunes familles cherchent des articles bébé fiables sans courir les marchés. Les packs naissance, avec la liste exacte des articles et les tailles par âge, rassurent les parents.',
    'In Yaoundé, many young families look for reliable baby items without going from market to market. Newborn bundles, with the exact item list and sizes by age, reassure parents.'),

  /* Bamako : capitale du Mali, Orange Money très utilisé, bazin, parfums et parures pour les fêtes. */
  c('vetements-en-ligne', 'bamako', 15000, 7000,
    'À Bamako, le bazin et les tenues de fête occupent une place importante, avec des pics avant les fêtes religieuses et les mariages. Montre les tissus en gros plan et précise les délais de couture si tu fais du sur-mesure.',
    'In Bamako, bazin and festive outfits matter a lot, with peaks before religious holidays and weddings. Show fabrics up close and state tailoring times if you make to measure.'),
  c('parfums', 'bamako', 12000, 5000,
    'À Bamako, parfums et encens font partie des cadeaux et des préparatifs des fêtes. Les clients connaissent bien les senteurs orientales : décris les notes honnêtement et propose des miniatures pour tester.',
    'In Bamako, perfume and incense are part of gifts and holiday preparations. Customers know oriental scents well: describe the notes honestly and offer miniatures to try.'),
  c('bijoux-montres', 'bamako', 12000, 4500,
    'À Bamako, bijoux et parures accompagnent les mariages et les grandes fêtes. Les photos portées et la mention claire de la matière évitent la déception à la livraison.',
    'In Bamako, jewelry and sets go with weddings and major holidays. Photos of pieces being worn and a clear statement of the material avoid disappointment at delivery.'),
  c('cosmetiques', 'bamako', 8000, 3000,
    'À Bamako, soins naturels et produits capillaires se vendent sur Facebook et WhatsApp. Orange Money est très utilisé, ce qui permet de demander un petit acompte pour les quartiers éloignés.',
    'In Bamako, natural skincare and hair products sell on Facebook and WhatsApp. Orange Money is widely used, so you can ask for a small deposit for distant areas.'),
  c('produits-naturels', 'bamako', 6000, 2000,
    'Au Mali, le karité fait partie du quotidien, et à Bamako les savons, beurres et huiles naturels se vendent bien en ligne quand l’emballage est propre et étiqueté. Évite toute promesse de guérison dans tes pubs.',
    'In Mali, shea butter is part of daily life, and in Bamako natural soaps, butters and oils sell well online when the packaging is clean and labelled. Avoid any healing claim in your ads.'),

  /* Ouagadougou : capitale du Burkina, ville de deux roues, karité et Faso Dan Fani. */
  c('vetements-en-ligne', 'ouagadougou', 12000, 5500,
    'À Ouagadougou, le Faso Dan Fani et les tenues en pagne côtoient le prêt-à-porter. Les clients commandent souvent sur WhatsApp et se font livrer à moto, de Ouaga 2000 à Tampouy.',
    'In Ouagadougou, Faso Dan Fani and pagne outfits sit next to ready-to-wear. Customers often order on WhatsApp and get deliveries by motorbike, from Ouaga 2000 to Tampouy.'),
  c('produits-naturels', 'ouagadougou', 6000, 2000,
    'Le Burkina Faso est connu pour son karité, et à Ouagadougou les beurres, savons et huiles naturels ont une clientèle locale et dans la diaspora. Un étiquetage soigné (origine, poids, date) fait la différence en ligne.',
    'Burkina Faso is known for its shea butter, and in Ouagadougou natural butters, soaps and oils have customers both locally and in the diaspora. Careful labelling (origin, weight, date) makes the difference online.'),
  c('cosmetiques', 'ouagadougou', 7000, 2500,
    'À Ouagadougou, les cosmétiques se vendent surtout via Facebook et WhatsApp, auprès de clientes attentives aux prix. Les petits formats et les packs routine aident à décrocher une première commande.',
    'In Ouagadougou, cosmetics sell mostly through Facebook and WhatsApp, to price conscious customers. Small sizes and routine bundles help win a first order.'),
  c('accessoires-telephone', 'ouagadougou', 6000, 2000,
    'À Ouagadougou, câbles, chargeurs et power banks sont des achats utiles du quotidien, par exemple pour garder son téléphone chargé en déplacement. Indique la capacité réelle des power banks, sans exagérer.',
    'In Ouagadougou, cables, chargers and power banks are useful everyday purchases, for example to keep a phone charged on the move. State the real capacity of power banks, without exaggerating.'),
  c('chaussures', 'ouagadougou', 12000, 5500,
    'À Ouagadougou, sandales, baskets et chaussures habillées se vendent bien en ligne et se livrent à moto. Mets en avant les modèles faciles à entretenir et confirme la pointure par appel avant l’envoi.',
    'In Ouagadougou, sandals, sneakers and dress shoes sell well online and are delivered by motorbike. Highlight easy care models and confirm the size by phone before shipping.'),

  /* Conakry : capitale de la Guinée, presqu’île étirée, Orange Money et MTN MoMo, ventes surtout sur Facebook et WhatsApp. */
  c('vetements-en-ligne', 'conakry', 150000, 65000,
    'À Conakry, tenues en pagne, bazins et prêt-à-porter se vendent beaucoup via Facebook et WhatsApp. La ville s’étire sur une presqu’île : regroupe tes livraisons par zone (Kaloum, Ratoma, Matoto) pour limiter les coûts.',
    'In Conakry, pagne outfits, bazin and ready-to-wear sell a lot through Facebook and WhatsApp. The city stretches along a peninsula: group deliveries by zone (Kaloum, Ratoma, Matoto) to keep costs down.'),
  c('perruques-meches', 'conakry', 450000, 230000,
    'À Conakry, perruques et mèches se vendent bien en ligne, souvent par des vendeuses qui importent elles-mêmes. Annonce le prix en francs guinéens livraison comprise et montre la perruque portée en vidéo.',
    'In Conakry, wigs and extensions sell well online, often by sellers who import their own stock. State the price in Guinean francs including delivery and show the wig being worn on video.'),
  c('cosmetiques', 'conakry', 110000, 45000,
    'À Conakry, les soins de la peau et des cheveux se vendent sur Facebook, TikTok et WhatsApp. Écarte les produits éclaircissants : ils sont risqués pour la santé et refusés par les régies publicitaires.',
    'In Conakry, skin and hair care sells on Facebook, TikTok and WhatsApp. Steer clear of lightening products: they are a health risk and rejected by ad platforms.'),
  c('accessoires-telephone', 'conakry', 90000, 35000,
    'À Conakry, les accessoires de téléphone se vendent bien en packs, et beaucoup de clients paient par Orange Money ou MTN MoMo. Précise les compatibilités et teste chaque article avant l’envoi.',
    'In Conakry, phone accessories sell well as bundles, and many customers pay with Orange Money or MTN MoMo. State compatibility and test every item before shipping.'),

  /* Libreville : pouvoir d’achat élevé pour la sous-région, beaucoup de produits importés. */
  c('vetements-en-ligne', 'libreville', 18000, 8000,
    'À Libreville, beaucoup de vêtements sont importés et la clientèle compare la qualité avant le prix. Des photos nettes, des matières décrites et des tailles précises justifient un prix plus élevé.',
    'In Libreville, many clothes are imported and customers compare quality before price. Sharp photos, described fabrics and precise sizes justify a higher price.'),
  c('perruques-meches', 'libreville', 45000, 23000,
    'À Libreville, les perruques de bonne qualité se vendent bien, auprès de clientes prêtes à payer plus pour un rendu naturel. Sois précise sur l’origine des cheveux, la longueur et la densité.',
    'In Libreville, good quality wigs sell well, to customers willing to pay more for a natural look. Be precise about hair origin, length and density.'),
  c('cosmetiques', 'libreville', 12000, 5000,
    'À Libreville, une grande partie des cosmétiques est importée, et les clientes comparent prix et authenticité. Une page claire avec composition, provenance et photos réelles inspire confiance.',
    'In Libreville, many cosmetics are imported, and customers compare price and authenticity. A clear page with ingredients, origin and real photos builds trust.'),
  c('maison-deco', 'libreville', 25000, 11000,
    'À Libreville, beaucoup d’articles de déco sont importés, et ils se vendent bien en ligne quand les photos montrent l’objet en situation. Emballe bien les pièces fragiles : les trajets jusqu’à Akanda ou Owendo peuvent être longs.',
    'In Libreville, much home decor is imported, and it sells well online when photos show the item in a real room. Pack fragile pieces carefully: trips to Akanda or Owendo can be long.'),
  c('produits-bebe', 'libreville', 20000, 10000,
    'À Libreville, les parents apprécient de recevoir les articles bébé sans courir les boutiques. Mets en avant la sécurité des produits, les matières et les tailles par âge.',
    'In Libreville, parents like getting baby items delivered without going from shop to shop. Highlight product safety, materials and sizes by age.'),

  /* Kinshasa : très grand marché, prix souvent en dollars, distances importantes entre communes. */
  c('vetements-en-ligne', 'kinshasa', 20, 8,
    'À Kinshasa, la mode compte beaucoup et la clientèle est très active sur Facebook, TikTok et WhatsApp. Beaucoup de vendeurs affichent leurs prix en dollars, en acceptant aussi les francs congolais et le Mobile Money.',
    'In Kinshasa, fashion matters a lot and customers are very active on Facebook, TikTok and WhatsApp. Many sellers show prices in US dollars while also accepting Congolese francs and Mobile Money.'),
  c('perruques-meches', 'kinshasa', 60, 30,
    'À Kinshasa, perruques et mèches se vendent beaucoup, de Gombe à Lemba. Les distances sont grandes : annonce un délai réaliste par commune et confirme l’adresse avec un repère précis.',
    'In Kinshasa, wigs and extensions sell a lot, from Gombe to Lemba. Distances are long: give a realistic delay per commune and confirm the address with a precise landmark.'),
  c('chaussures', 'kinshasa', 25, 12,
    'À Kinshasa, les chaussures se vendent bien en ligne, des baskets aux chaussures de cérémonie. Quand la commande vient d’une commune éloignée, confirme la pointure et l’adresse avant de faire partir le livreur.',
    'In Kinshasa, shoes sell well online, from sneakers to ceremony shoes. When an order comes from a distant commune, confirm the size and address before sending the rider.'),
  c('cosmetiques', 'kinshasa', 15, 6,
    'À Kinshasa, les cosmétiques se vendent beaucoup via WhatsApp et Facebook, auprès de clientes méfiantes envers les contrefaçons. Montre des photos réelles et écarte les produits éclaircissants, dangereux et refusés par les régies.',
    'In Kinshasa, cosmetics sell a lot through WhatsApp and Facebook, to customers wary of fakes. Show real photos and steer clear of lightening products, which are dangerous and rejected by ad platforms.'),
  c('accessoires-telephone', 'kinshasa', 10, 4,
    'À Kinshasa, les accessoires de téléphone sont des achats courants, payés en dollars ou en francs congolais, souvent par M-Pesa ou Airtel Money. Les packs à petit prix se vendent bien en paiement à la livraison.',
    'In Kinshasa, phone accessories are everyday purchases, paid in dollars or Congolese francs, often by M-Pesa or Airtel Money. Low priced bundles sell well with cash on delivery.'),

  /* Lagos : l’un des marchés en ligne les plus actifs d’Afrique, très concurrentiel, Instagram et TikTok. */
  c('vetements-en-ligne', 'lagos', 18000, 8000,
    'À Lagos, la mode est un très grand marché, de l’aso ebi pour les cérémonies au prêt-à-porter. La concurrence est forte sur Instagram et TikTok : des vidéos portées et un service client rapide font la différence.',
    'In Lagos, fashion is a very large market, from aso ebi for ceremonies to ready-to-wear. Competition on Instagram and TikTok is strong: try-on videos and fast customer service make the difference.'),
  c('perruques-meches', 'lagos', 85000, 45000,
    'À Lagos, perruques et bundles de cheveux forment un marché très concurrentiel, avec des clientes qui connaissent bien les termes (frontal, closure, densité). Sois précise sur chaque caractéristique et montre la perruque portée.',
    'In Lagos, wigs and hair bundles are a very competitive market, with customers who know the terms well (frontal, closure, density). Be precise on every detail and show the wig being worn.'),
  c('cosmetiques', 'lagos', 12000, 5000,
    'À Lagos, les soins de la peau se vendent beaucoup sur Instagram et TikTok. Les clientes cherchent des produits authentiques, enregistrés auprès de la NAFDAC quand c’est requis : montre l’emballage et évite toute promesse d’éclaircissement.',
    'In Lagos, skincare sells a lot on Instagram and TikTok. Customers look for authentic products, registered with NAFDAC where required: show the packaging and avoid any lightening claim.'),
  c('chaussures', 'lagos', 22000, 10000,
    'À Lagos, baskets, sliders et chaussures habillées se vendent bien en ligne. Avec le trafic, un échange coûte cher : demande la pointure et la longueur du pied en centimètres avant l’envoi.',
    'In Lagos, sneakers, sliders and dress shoes sell well online. With the traffic, an exchange is costly: ask for the size and foot length in centimetres before shipping.'),
  c('accessoires-telephone', 'lagos', 10000, 4000,
    'À Lagos, Computer Village à Ikeja est un repère connu pour les téléphones et les accessoires. En ligne, tu te démarques avec des packs clairs, la compatibilité indiquée et une livraison rapide.',
    'In Lagos, Computer Village in Ikeja is a well known spot for phones and accessories. Online, you stand out with clear bundles, stated compatibility and fast delivery.'),
  c('parfums', 'lagos', 20000, 9000,
    'À Lagos, parfums et huiles parfumées se vendent bien, en flacon comme en format de poche. Décris les notes simplement et propose des miniatures pour les premiers achats.',
    'In Lagos, perfume and perfume oils sell well, in full bottles and pocket sizes. Describe the notes simply and offer miniatures for first purchases.'),
  c('sport-fitness', 'lagos', 25000, 12000,
    'À Lagos, des clients achètent en ligne tenues de sport, haltères légers et accessoires d’entraînement. La livraison d’articles lourds coûte plus cher : intègre-la dans ton prix et évite toute promesse de perte de poids.',
    'In Lagos, customers buy sportswear, light dumbbells and training accessories online. Delivering heavy items costs more: build it into your price and avoid any weight loss promise.'),

  /* Accra : Mobile Money très développé (acompte possible), karité et savon noir, Instagram et WhatsApp. */
  c('vetements-en-ligne', 'accra', 180, 80,
    'À Accra, le kente et les tissus wax côtoient le prêt-à-porter, et beaucoup de commandes passent par Instagram et WhatsApp. Le paiement par MTN MoMo est courant, ce qui permet de demander un acompte pour le sur-mesure.',
    'In Accra, kente and wax prints sit next to ready-to-wear, and many orders come through Instagram and WhatsApp. MTN MoMo payment is common, so you can ask for a deposit on made to measure pieces.'),
  c('perruques-meches', 'accra', 900, 480,
    'À Accra, perruques et extensions se vendent bien en ligne, d’East Legon à Kasoa. Montre la perruque portée en vidéo et précise si le prix inclut la pose ou non.',
    'In Accra, wigs and extensions sell well online, from East Legon to Kasoa. Show the wig being worn on video and say whether the price includes installation.'),
  c('cosmetiques', 'accra', 120, 50,
    'À Accra, soins de la peau et cosmétiques naturels se vendent sur Instagram et TikTok. Beaucoup de clientes paient par MTN MoMo : affiche clairement les options de paiement sur ta page.',
    'In Accra, skincare and natural cosmetics sell on Instagram and TikTok. Many customers pay with MTN MoMo: show payment options clearly on your page.'),
  c('produits-naturels', 'accra', 120, 45,
    'Le Ghana produit beaucoup de karité et de savon noir, et à Accra ces produits se vendent bien en ligne, y compris vers la diaspora. Étiquette correctement et évite les promesses santé.',
    'Ghana produces a lot of shea butter and black soap, and in Accra these products sell well online, including to the diaspora. Label them properly and avoid health claims.'),
  c('accessoires-telephone', 'accra', 150, 55,
    'À Accra, les accessoires de téléphone se vendent bien en ligne et se livrent facilement par dispatch rider. Des packs utiles (chargeur rapide, câble, coque) avec la compatibilité indiquée limitent les retours.',
    'In Accra, phone accessories sell well online and are easy to deliver by dispatch rider. Useful bundles (fast charger, cable, case) with stated compatibility limit returns.'),
  c('maison-deco', 'accra', 250, 110,
    'À Accra, la déco et les articles maison se vendent bien sur Instagram, des coussins aux paniers tressés. Des photos en situation et des dimensions précises évitent les mauvaises surprises.',
    'In Accra, home decor and homeware sell well on Instagram, from cushions to woven baskets. Lifestyle photos and precise dimensions avoid bad surprises.'),

  /* Nairobi : ville de M-Pesa, Instagram et TikTok, clientèle qui compare beaucoup. */
  c('vetements-en-ligne', 'nairobi', 1800, 800,
    'À Nairobi, les commandes de vêtements passent beaucoup par Instagram, TikTok et WhatsApp, et la friperie (mitumba) est très présente. Pour te démarquer, mise sur des photos nettes, des tailles précises et une livraison rapide.',
    'In Nairobi, clothing orders come a lot through Instagram, TikTok and WhatsApp, and second-hand clothes (mitumba) are everywhere. To stand out, rely on sharp photos, precise sizes and fast delivery.'),
  c('cosmetiques', 'nairobi', 1500, 600,
    'À Nairobi, soins de la peau et des cheveux se vendent bien en ligne, auprès de clients qui paient souvent par M-Pesa à la réception. Une page claire avec composition et photos réelles inspire confiance.',
    'In Nairobi, skin and hair care sells well online, to customers who often pay with M-Pesa on receipt. A clear page with ingredients and real photos builds trust.'),
  c('accessoires-telephone', 'nairobi', 1200, 450,
    'À Nairobi, les accessoires de téléphone se vendent partout et les clients comparent beaucoup les prix. Précise les compatibilités, propose des packs et encaisse par M-Pesa à la livraison.',
    'In Nairobi, phone accessories are sold everywhere and customers compare prices a lot. State compatibility, offer bundles and collect with M-Pesa at delivery.'),
  c('maison-deco', 'nairobi', 2500, 1100,
    'À Nairobi, dans des quartiers comme Kilimani, Ruaka ou Rongai, beaucoup de clients aménagent leur logement et achètent déco et articles maison en ligne. Montre chaque article en situation et emballe soigneusement les pièces fragiles.',
    'In Nairobi, in areas like Kilimani, Ruaka or Rongai, many customers furnish their homes and buy decor and homeware online. Show every item in a real room and pack fragile pieces carefully.'),
  c('sport-fitness', 'nairobi', 2000, 900,
    'À Nairobi, la course à pied et les salles de sport ont beaucoup d’adeptes, et les accessoires d’entraînement se vendent bien en ligne. Évite toute promesse de perte de poids ou de transformation physique dans tes pubs.',
    'In Nairobi, running and gyms have plenty of fans, and training accessories sell well online. Avoid any weight loss or body transformation promise in your ads.'),
]

/** Clé interne d'une combinaison (sert aussi de clé d'adresse). */
export const comboKey = (niche: string, city: string) => `${niche}/${city}`
export const findCombo = (key: string) => COMBOS.find((x) => comboKey(x.niche, x.city) === key)
