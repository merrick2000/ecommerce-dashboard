import type { Block, Faq, NichePage, Source } from './types'

/**
 * Pages « vendre par métier / type de produit » (SEO programmatique) du site Zuri, en français et en anglais.
 * Voir les règles de rédaction dans ./types.ts.
 */

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
const l = (fr: string, en: string) => ({ fr, en })
const ls = (items: [string, string][]) => items.map(([fr, en]) => l(fr, en))

/* Sources vérifiées (pages officielles des plateformes et de l’OMS) */
const S = {
  metaStd: { label: 'Meta Transparency Center : Introduction to the Advertising Standards', url: 'https://transparency.meta.com/policies/ad-standards/' },
  metaAttr: { label: 'Meta Transparency Center : Privacy Violations and Personal Attributes', url: 'https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/' },
  metaHealth: { label: 'Meta Transparency Center : Health and Wellness (ads)', url: 'https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness/' },
  metaIp: { label: 'Meta Transparency Center : Third-Party Intellectual Property Infringement', url: 'https://transparency.meta.com/policies/ad-standards/intellectual-property-infringement/third-party-infringement/' },
  metaTm: { label: 'Meta Transparency Center : Copyrights and Trademarks', url: 'https://transparency.meta.com/policies/ad-standards/intellectual-property-infringement/copyright-and-trademarks/' },
  ttMisleading: { label: 'TikTok Advertising Policies : Misleading and false content', url: 'https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content' },
  ttHealth: { label: 'TikTok Advertising Policies : Healthcare and Pharmaceuticals', url: 'https://ads.tiktok.com/help/article/tiktok-ads-policy-healthcare-pharmaceuticals' },
  ttWeight: { label: 'TikTok Advertising Policies : Weight Management', url: 'https://ads.tiktok.com/help/article/tiktok-ads-policy-weight-management' },
  ttIp: { label: 'TikTok Advertising Policies : Intellectual Property Infringement', url: 'https://ads.tiktok.com/help/article/tiktok-ads-policy-intellectual-property-infringement' },
  whoMercury: { label: 'OMS : Mercury in skin lightening products (note d’information, 2019)', url: 'https://www.who.int/publications/i/item/WHO-CED-PHE-EPE-19.13' },
  whoCode: { label: 'OMS : Code international de commercialisation des substituts du lait maternel', url: 'https://www.who.int/publications/i/item/9241541601' },
} satisfies Record<string, Source>

/* 1. Vêtements */
const vetements: NichePage = {
  slug: l('vetements-en-ligne', 'clothes-online'),
  icon: 'tag',
  accent: '#E8577E',
  name: l('Vêtements', 'Clothes'),
  title: l('Vendre des vêtements en ligne en Afrique | Zuri', 'Sell clothes online in Africa | Zuri'),
  description: l(
    'Vends tes vêtements en ligne en paiement à la livraison : photos, tailles, packs, confirmation, livraison et règles des pubs Facebook et TikTok.',
    'A practical guide to selling clothes online with cash on delivery: photos, sizes, bundles, order confirmation, delivery and Facebook and TikTok ad rules.',
  ),
  h1: l('Vendre des vêtements en ligne en Afrique, en paiement à la livraison', 'How to sell clothes online in Africa with cash on delivery'),
  intro: l(
    'Robes, ensembles, pagnes, tenues de sport, habits d’enfants : les vêtements font partie des produits que les gens achètent le plus sur Facebook, TikTok et WhatsApp. Mais c’est aussi un produit où les retours font mal, surtout à cause des tailles. Ce guide t’explique comment présenter tes articles, gérer les tailles et les couleurs, confirmer les commandes et livrer sans perdre ta marge.',
    'Dresses, matching sets, wax prints, sportswear, kids’ clothes: clothing is one of the things people buy most through Facebook, TikTok and WhatsApp. It is also a product where returns hurt, mostly because of sizing. This guide shows you how to present your items, handle sizes and colors, confirm orders and deliver without losing your margin.',
  ),
  why: ls([
    ['Tout le monde s’habille, et souvent. Les occasions ne manquent pas : fêtes, mariages, baptêmes, rentrée, fin d’année. Un client satisfait revient, et il en parle à ses proches.', 'Everyone wears clothes, and buys them often. There is always an occasion: celebrations, weddings, baptisms, back to school, year end. A happy customer comes back and tells friends and family.'],
    ['Les vêtements se montrent très bien en vidéo. Une cliente qui voit la robe portée, en mouvement, dans une vraie lumière, se décide plus vite qu’avec une simple photo de catalogue.', 'Clothes look great on video. A customer who sees the dress worn, moving, in real light, decides faster than with a catalog photo.'],
    ['Le paiement à la livraison rassure : le client peut voir le vêtement avant de payer. C’est aussi un risque pour toi, car un vêtement qui ne va pas sera refusé à la porte. Bien gérer les tailles, c’est la moitié du métier.', 'Cash on delivery reassures buyers: they see the item before paying. It is also a risk for you, because an item that does not fit gets refused at the door. Getting sizes right is half the job.'],
    ['Tu peux démarrer petit, avec quelques modèles achetés en gros au marché ou chez un grossiste, puis élargir ce qui marche.', 'You can start small with a few styles bought wholesale at the market or from a supplier, then expand what works.'],
  ]),
  products: ls([
    ['Robes de soirée et robes de cérémonie', 'Evening and ceremony dresses'],
    ['Ensembles en wax ou en pagne prêts à porter', 'Ready to wear wax print sets'],
    ['Ensembles jogging et tenues de sport', 'Tracksuits and sportswear sets'],
    ['Chemises et polos homme', 'Men’s shirts and polo shirts'],
    ['Vêtements d’enfants par tranche d’âge', 'Kids’ clothes by age group'],
    ['Abayas, boubous et tenues traditionnelles', 'Abayas, boubous and traditional outfits'],
    ['Jeans et pantalons avec guide des tailles', 'Jeans and trousers with a size guide'],
    ['Lingerie et pyjamas', 'Underwear and pajamas'],
  ]),
  blocks: [
    h2('Photos et vidéos qui font vendre', 'Photos and videos that sell'),
    p(
      'Le client ne peut pas toucher le tissu, alors tes images doivent répondre à ses questions : comment ça tombe, quelle est la vraie couleur, est-ce que le tissu est épais. Prends tes photos à la lumière du jour, près d’une fenêtre, sur une personne de taille moyenne. Ajoute une courte vidéo où le vêtement est porté et où l’on voit le tissu de près.',
      'The customer cannot touch the fabric, so your images must answer their questions: how it hangs, what the true color is, whether the fabric is thick. Shoot in daylight near a window, on a person of average build. Add a short video of the item being worn with a close up of the fabric.',
    ),
    list([
      ['Une photo de face, une de dos et une de profil pour chaque modèle.', 'One front, one back and one side photo for each style.'],
      ['Un gros plan sur le tissu, les coutures et les boutons.', 'A close up of the fabric, seams and buttons.'],
      ['Une photo par couleur : le client doit voir exactement ce qu’il va recevoir.', 'One photo per color: the customer must see exactly what they will get.'],
      ['Indique la taille du mannequin et la taille qu’il porte (par exemple « 1,65 m, porte un M »).', 'State the model’s height and size worn (for example "5 ft 5, wearing M").'],
    ]),
    h2('Tailles et couleurs : la clé pour éviter les refus', 'Sizes and colors: the key to avoiding refusals'),
    p(
      'La première cause de colis refusé en vêtements, c’est la taille qui ne va pas. Ne te contente pas de « S, M, L » : donne les mesures en centimètres (tour de poitrine, tour de taille, tour de hanches, longueur). Sur Zuri, tu crées chaque modèle avec ses variantes de taille et de couleur, chacune avec son stock, pour que le client choisisse la bonne combinaison dans le formulaire.',
      'The number one reason clothing parcels get refused is the wrong size. Do not stop at "S, M, L": give measurements in centimeters (chest, waist, hips, length). On Zuri you set up each style with size and color variants, each with its own stock, so customers pick the right combination in the order form.',
    ),
    table([
      [['Taille', 'Size'], ['Tour de poitrine (exemple)', 'Chest (example)'], ['Tour de taille (exemple)', 'Waist (example)']],
      [['S', 'S'], ['84 à 88 cm', '84 to 88 cm'], ['66 à 70 cm', '66 to 70 cm']],
      [['M', 'M'], ['89 à 94 cm', '89 to 94 cm'], ['71 à 76 cm', '71 to 76 cm']],
      [['L', 'L'], ['95 à 100 cm', '95 to 100 cm'], ['77 à 82 cm', '77 to 82 cm']],
      [['XL', 'XL'], ['101 à 108 cm', '101 to 108 cm'], ['83 à 90 cm', '83 to 90 cm']],
    ]),
    tip(
      'Mesure toi-même tes articles',
      'Measure your items yourself',
      'Les tailles changent d’un fournisseur à l’autre. Un M chinois peut correspondre à un S local. Prends un mètre ruban et mesure un exemplaire de chaque modèle avant de publier ton tableau.',
      'Sizes vary from one supplier to another. An M from one factory can be a local S. Take a tape measure and check one piece of each style before you publish your size chart.',
    ),
    h2('Prix, packs et offres', 'Pricing, bundles and offers'),
    p(
      'Calcule ton prix à partir de ton coût d’achat, de la livraison, de la pub et des retours. En vêtements, les packs marchent bien : deux t-shirts, un ensemble plus un foulard, trois tenues d’enfant. Le livreur fait un seul trajet pour un montant plus élevé.',
      'Set your price from your purchase cost, delivery, ads and returns. Bundles work well for clothes: two t-shirts, a set plus a scarf, three kids’ outfits. The courier makes one trip for a bigger amount.',
    ),
    list([
      ['Par exemple : 1 ensemble à 12 000 FCFA, 2 ensembles à 21 000 FCFA.', 'For example: 1 set at 12,000 FCFA, 2 sets at 21,000 FCFA.'],
      ['Un petit cadeau (foulard, chouchou, chaussettes) coûte souvent moins cher qu’une remise.', 'A small free gift (scarf, scrunchie, socks) often costs less than a discount.'],
      ['Affiche un prix barré seulement s’il correspond à un vrai ancien prix.', 'Show a strike through price only if it matches a real former price.'],
    ]),
    h2('Confirmer la commande sans surprise', 'Confirming orders without surprises'),
    p(
      'Au téléphone ou sur WhatsApp, ton closer doit reconfirmer la taille, la couleur et le prix total avec la livraison. Pose une question simple : « Tu portes quelle taille d’habitude ? » ou « Tu peux me donner ton tour de taille ? ». Si le client hésite entre deux tailles, propose de choisir selon le tableau ou d’envoyer les deux et qu’il garde celle qui va (si ton livreur peut attendre).',
      'On the phone or WhatsApp, your closer should double check the size, color and total price with delivery. Ask a simple question: "What size do you usually wear?" or "Can you give me your waist measurement?". If the customer hesitates between two sizes, help them choose from the chart, or send both and let them keep the one that fits (if your courier can wait).',
    ),
    tip(
      'Envoie la photo du modèle exact',
      'Send a photo of the exact item',
      'Avant d’expédier, envoie sur WhatsApp la photo de l’article emballé, avec la taille et la couleur. Le client ne pourra pas dire « ce n’est pas ce que j’ai commandé ».',
      'Before shipping, send a WhatsApp photo of the packed item showing size and color. The customer cannot then say "this is not what I ordered".',
    ),
    h2('Livraison, emballage et essayage', 'Delivery, packaging and fitting'),
    p(
      'Plie proprement, mets le vêtement dans un sachet transparent puis dans une pochette opaque. Un emballage soigné donne envie de payer. Décide à l’avance si le client peut essayer devant le livreur et dis-le clairement sur ta page : ça évite les disputes à la porte.',
      'Fold neatly, put the item in a clear bag then an opaque mailer. Neat packaging makes people happy to pay. Decide in advance whether customers can try on in front of the courier, and say so clearly on your page: it avoids arguments at the door.',
    ),
    h2('Stock et nouveautés', 'Stock and new arrivals'),
    p(
      'Ne commande pas toutes les tailles en même quantité. Commence avec un petit stock, regarde quelles tailles partent, puis réassortis. Garde une liste des tailles épuisées et coupe la variante dans ta boutique dès qu’elle est vide, pour ne pas prendre de commandes que tu ne pourras pas livrer.',
      'Do not order every size in the same quantity. Start with small stock, see which sizes sell, then restock. Keep track of sold out sizes and switch off the variant in your store as soon as it runs out, so you never take orders you cannot fill.',
    ),
    h2('Gagner la confiance des clientes', 'Earning customer trust'),
    list([
      ['Publie des photos de vraies clientes livrées, avec leur accord.', 'Post photos of real delivered customers, with their permission.'],
      ['Affiche ta politique d’échange de taille en une phrase simple.', 'Show your size exchange policy in one simple sentence.'],
      ['Réponds vite sur WhatsApp : une question sans réponse est une vente perdue.', 'Reply fast on WhatsApp: an unanswered question is a lost sale.'],
      ['Propose aussi le paiement Mobile Money pour les clients qui préfèrent payer avant.', 'Also offer Mobile Money for customers who prefer to pay upfront.'],
    ]),
  ],
  adRules: ls([
    ['Ne vise pas le physique de la personne : pas de « Tu as des kilos en trop ? » ni de « Tu es complexée par ton ventre ? ». Meta refuse les pubs qui supposent un attribut personnel.', 'Do not target the viewer’s body: no "Carrying extra weight?" or "Ashamed of your belly?". Meta rejects ads that assert personal attributes.'],
    ['Ne promets pas qu’une gaine ou un vêtement fait maigrir. Meta et TikTok encadrent strictement les promesses de perte de poids.', 'Do not claim that shapewear or a garment makes you lose weight. Meta and TikTok strictly limit weight loss claims.'],
    ['Pas de logo ou de nom de grande marque sur des copies. Les pubs qui vendent des contrefaçons sont refusées et ton compte peut être bloqué.', 'No big brand logos or names on copies. Ads selling counterfeits get rejected and your account can be restricted.'],
    ['N’utilise pas les photos d’un autre vendeur ou d’une marque sans autorisation.', 'Do not use another seller’s or brand’s photos without permission.'],
    ['Évite les images trop dénudées pour la lingerie : montre le produit, pas le corps.', 'Avoid overly revealing images for underwear: show the product, not the body.'],
    ['Pas de faux prix barré ni de fausse rupture de stock.', 'No fake strike through prices or fake sold out claims.'],
  ]),
  faqs: [
    faq('Comment éviter les retours pour cause de taille ?', 'How do I avoid returns because of size?', 'Donne les mesures en centimètres, mesure toi-même chaque modèle, et fais reconfirmer la taille par ton closer avant l’envoi.', 'Give measurements in centimeters, measure each style yourself, and have your closer double check the size before shipping.'),
    faq('Faut-il laisser le client essayer devant le livreur ?', 'Should customers try on in front of the courier?', 'C’est à toi de décider. Ça rassure le client mais ça prend du temps au livreur. Dans tous les cas, écris la règle clairement sur ta page.', 'It is your call. It reassures customers but takes the courier’s time. Either way, write the rule clearly on your page.'),
    faq('Comment gérer plusieurs tailles et couleurs sur Zuri ?', 'How do I handle several sizes and colors on Zuri?', 'Tu crées un seul produit avec des variantes (taille, couleur), chacune avec son stock et, si besoin, son prix et sa photo.', 'You create one product with variants (size, color), each with its own stock and, if needed, its own price and photo.'),
    faq('Je peux vendre des copies de marques ?', 'Can I sell brand copies?', 'Non. La vente de contrefaçons est interdite dans les pubs Meta et TikTok, et souvent par la loi. Vends tes propres modèles ou des articles sans marque.', 'No. Selling counterfeits is banned in Meta and TikTok ads, and often by law. Sell your own designs or unbranded items.'),
  ],
  sources: [S.metaStd, S.metaAttr, S.metaHealth, S.metaTm, S.ttWeight],
  related: ['astuces-vendre-en-ligne', 'reduire-retours-paiement-livraison', 'page-de-vente-qui-convertit'],
}

/* 2. Chaussures */
const chaussures: NichePage = {
  slug: l('chaussures', 'shoes'),
  icon: 'cart',
  accent: '#C47A3D',
  name: l('Chaussures', 'Shoes'),
  title: l('Vendre des chaussures en ligne en Afrique | Zuri', 'Sell shoes online in Africa | Zuri'),
  description: l(
    'Vends tes chaussures en ligne en COD : pointures, photos, packs, confirmation, emballage et règles des pubs. Un guide simple pour moins de colis refusés.',
    'Sell shoes online with cash on delivery: sizing, photos, bundles, confirmation, packaging and ad rules. A simple guide to fewer refused parcels.',
  ),
  h1: l('Vendre des chaussures en ligne en Afrique sans exploser les retours', 'How to sell shoes online in Africa without a flood of returns'),
  intro: l(
    'Baskets, sandales, escarpins, mocassins, chaussures d’enfants : les chaussures se vendent bien en ligne, à condition de régler le problème de la pointure. Ce guide te montre comment présenter tes modèles, aider le client à choisir sa pointure, confirmer et livrer pour que le colis soit accepté.',
    'Sneakers, sandals, heels, loafers, kids’ shoes: footwear sells well online, as long as you solve the sizing problem. This guide shows you how to present your styles, help customers pick their size, confirm and deliver so the parcel gets accepted.',
  ),
  why: ls([
    ['Les chaussures s’usent et se renouvellent. Beaucoup de gens en achètent plusieurs paires par an, pour le travail, le sport, l’église ou les sorties.', 'Shoes wear out and get replaced. Many people buy several pairs a year, for work, sport, church or going out.'],
    ['Dans beaucoup de villes, trouver le bon modèle dans la bonne pointure oblige à faire plusieurs boutiques. Une page claire avec les pointures disponibles fait gagner du temps.', 'In many cities, finding the right style in the right size means visiting several shops. A clear page with available sizes saves time.'],
    ['En vidéo, une paire portée et vue sous tous les angles convainc vite. Les clients aiment voir la semelle et la matière de près.', 'On video, a pair worn and seen from every angle convinces fast. Customers like to see the sole and material up close.'],
  ]),
  products: ls([
    ['Baskets tendance homme et femme', 'Trendy sneakers for men and women'],
    ['Sandales et claquettes', 'Sandals and slides'],
    ['Escarpins et chaussures de soirée', 'Heels and evening shoes'],
    ['Mocassins et chaussures de ville', 'Loafers and dress shoes'],
    ['Chaussures d’enfants et de rentrée', 'Kids’ and back to school shoes'],
    ['Babouches et chaussures traditionnelles', 'Babouches and traditional footwear'],
    ['Chaussures de sécurité pour le travail', 'Safety shoes for work'],
    ['Packs chaussures et sac assortis', 'Matching shoe and bag sets'],
  ]),
  blocks: [
    h2('Photos et vidéos', 'Photos and videos'),
    list([
      ['Montre la paire sous 5 angles : côté, dessus, arrière, semelle, et portée.', 'Show the pair from 5 angles: side, top, back, sole, and worn.'],
      ['Fais un gros plan sur la matière, les coutures et la semelle.', 'Close up on the material, stitching and sole.'],
      ['Une courte vidéo où quelqu’un marche avec les chaussures rassure sur le confort.', 'A short video of someone walking in them reassures on comfort.'],
      ['Une photo par couleur, prise dans la même lumière.', 'One photo per color, shot in the same light.'],
    ]),
    h2('Pointures : la question qui décide de tout', 'Sizing: the question that decides everything'),
    p(
      'Une mauvaise pointure, c’est un colis refusé et un aller-retour payé pour rien. Donne un tableau de correspondance avec la longueur du pied en centimètres et explique comment se mesurer : poser le pied sur une feuille, tracer le talon et le plus long orteil, mesurer. Précise si le modèle taille petit ou grand.',
      'A wrong size means a refused parcel and a wasted round trip. Give a conversion chart with foot length in centimeters and explain how to measure: stand on a sheet of paper, mark the heel and longest toe, measure. Say whether the style runs small or large.',
    ),
    table([
      [['Pointure EU', 'EU size'], ['Longueur du pied (exemple)', 'Foot length (example)']],
      [['38', '38'], ['24 cm', '24 cm']],
      [['40', '40'], ['25,3 cm', '25.3 cm']],
      [['42', '42'], ['26,7 cm', '26.7 cm']],
      [['44', '44'], ['28 cm', '28 cm']],
    ]),
    tip(
      'Vérifie avec ton fournisseur',
      'Check with your supplier',
      'Les longueurs ci-dessus sont des exemples. Les pointures varient selon les usines : mesure l’intérieur d’une paire de chaque modèle avant de publier.',
      'The lengths above are examples. Sizes vary by factory: measure the inside of one pair of each style before publishing.',
    ),
    p(
      'Sur Zuri, chaque pointure est une variante avec son propre stock. Quand une pointure est épuisée, elle n’est plus proposée dans le formulaire, ce qui t’évite de prendre une commande impossible.',
      'On Zuri each size is a variant with its own stock. When a size sells out it disappears from the order form, so you never take an order you cannot fill.',
    ),
    h2('Prix et packs', 'Pricing and bundles'),
    p(
      'Les chaussures prennent de la place et coûtent cher à renvoyer. Intègre le coût des retours dans ton prix. Les packs « chaussures + sac » ou « deux paires d’enfant » augmentent le panier sans doubler la livraison.',
      'Shoes are bulky and costly to send back. Build the cost of returns into your price. Bundles like "shoes + bag" or "two kids’ pairs" raise the basket without doubling delivery.',
    ),
    h2('Confirmation : les bonnes questions', 'Confirmation: the right questions'),
    list([
      ['« Tu chausses du combien d’habitude ? » puis compare avec le tableau du modèle.', '"What size do you usually wear?" then compare with the style’s chart.'],
      ['Rappelle si le modèle taille petit : « Celui-ci taille petit, je te conseille de prendre une pointure au-dessus. »', 'Mention if it runs small: "This one runs small, I suggest going one size up."'],
      ['Reconfirme couleur, pointure, prix total et adresse.', 'Double check color, size, total price and address.'],
      ['Demande à quelle heure le client sera disponible pour recevoir le livreur.', 'Ask what time the customer will be available for the courier.'],
    ], true),
    h2('Emballage et livraison', 'Packaging and delivery'),
    p(
      'Garde la boîte d’origine si tu l’as, ou mets la paire dans un sachet propre avec du papier pour garder la forme. Une boîte écrasée donne une mauvaise impression avant même l’ouverture. Si tu acceptes l’essayage à la livraison, dis-le sur ta page et préviens ton livreur.',
      'Keep the original box if you have it, or put the pair in a clean bag with paper to hold the shape. A crushed box looks bad before it is even opened. If you allow try on at delivery, say so on your page and tell your courier.',
    ),
    h2('Stock et confiance', 'Stock and trust'),
    p(
      'Les pointures du milieu partent souvent plus vite que les extrêmes : réassortis-les en priorité, mais vérifie avec tes propres ventes. Publie des avis et photos de clients livrés, et réponds vite aux questions de pointure sur WhatsApp.',
      'Middle sizes often sell faster than the extremes: restock them first, but check against your own sales. Post reviews and photos from delivered customers, and answer sizing questions on WhatsApp quickly.',
    ),
  ],
  adRules: ls([
    ['N’utilise pas le nom ou le logo d’une grande marque sur des chaussures qui ne sont pas d’elle. Meta et TikTok refusent les pubs de contrefaçons.', 'Do not use a big brand’s name or logo on shoes that are not theirs. Meta and TikTok reject counterfeit ads.'],
    ['Évite les mots comme « réplique », « copie conforme » ou « qualité originale » pour des copies : c’est justement ce que les plateformes recherchent.', 'Avoid words like "replica", "1:1 copy" or "original quality" for copies: that is exactly what platforms look for.'],
    ['Ne promets pas de bienfaits médicaux (« guérit le mal de dos ») pour des semelles ou chaussures confort.', 'Do not promise medical benefits ("cures back pain") for insoles or comfort shoes.'],
    ['Pas de photos volées sur le site d’une marque ou d’un autre vendeur.', 'No photos stolen from a brand’s site or another seller.'],
    ['Pas de faux compte à rebours ni de fausse promo permanente.', 'No fake countdown or never ending fake sale.'],
  ]),
  faqs: [
    faq('Comment aider le client à choisir sa pointure ?', 'How do I help customers choose their size?', 'Donne la longueur du pied en centimètres pour chaque pointure, explique comment se mesurer et indique si le modèle taille petit ou grand.', 'Give foot length in centimeters for each size, explain how to measure and say whether the style runs small or large.'),
    faq('Que faire si la pointure ne va pas à la livraison ?', 'What if the size is wrong at delivery?', 'Prévois une règle d’échange simple, par exemple un échange contre la pointure au-dessus avec des frais de livraison à la charge du client. Écris-la sur ta page.', 'Have a simple exchange rule, for example swapping for the next size up with delivery paid by the customer. Write it on your page.'),
    faq('Dois-je garder les boîtes ?', 'Should I keep the boxes?', 'Oui si possible. Une boîte propre protège la paire et donne une meilleure image au moment de la livraison.', 'Yes if you can. A clean box protects the pair and looks better at delivery.'),
    faq('Puis-je vendre des baskets de marque ?', 'Can I sell branded sneakers?', 'Seulement des produits authentiques que tu peux prouver. Les copies avec logo sont refusées en pub et peuvent te valoir des ennuis.', 'Only genuine products you can prove. Copies with logos get rejected in ads and can get you into trouble.'),
  ],
  sources: [S.metaStd, S.metaTm, S.metaIp, S.ttIp],
  related: ['reduire-retours-paiement-livraison', 'script-confirmation-commande', 'calculer-marge-paiement-livraison'],
}

/* 3. Cosmétiques */
const cosmetiques: NichePage = {
  slug: l('cosmetiques', 'cosmetics'),
  icon: 'star',
  accent: '#B5679B',
  name: l('Cosmétiques', 'Cosmetics'),
  title: l('Vendre des cosmétiques en ligne en Afrique | Zuri', 'Sell cosmetics online in Africa | Zuri'),
  description: l(
    'Vends tes cosmétiques en ligne en COD : photos, teintes, packs, confirmation et règles strictes des pubs (avant/après, éclaircissants, allégations).',
    'Sell cosmetics online with cash on delivery: photos, shades, bundles, confirmation and strict ad rules (before and after, lightening, claims).',
  ),
  h1: l('Vendre des cosmétiques en ligne en Afrique, proprement et durablement', 'How to sell cosmetics online in Africa, the clean and lasting way'),
  intro: l(
    'Crèmes, sérums, maquillage, soins du corps, produits capillaires : les cosmétiques se vendent très bien sur les réseaux, mais c’est aussi le secteur où les pubs sont le plus souvent refusées. Ce guide t’aide à présenter tes produits honnêtement, gérer les teintes, confirmer les commandes et respecter les règles de Meta et TikTok.',
    'Creams, serums, makeup, body care, hair products: cosmetics sell very well on social media, but it is also the category where ads get rejected most often. This guide helps you present products honestly, manage shades, confirm orders and follow Meta and TikTok rules.',
  ),
  why: ls([
    ['Les produits de beauté se rachètent régulièrement. Une cliente contente d’une crème revient quand le pot est fini, et c’est là que tu fais ta marge.', 'Beauty products get rebought regularly. A customer happy with a cream comes back when the jar is empty, and that is where you make your margin.'],
    ['Les petits formats sont légers et faciles à livrer, ce qui réduit les frais et la casse.', 'Small items are light and easy to deliver, which keeps costs and breakage down.'],
    ['La vidéo est parfaite pour montrer la texture, l’application et le rendu sur différentes carnations.', 'Video is perfect to show texture, application and how it looks on different skin tones.'],
    ['La confiance est tout : beaucoup de clientes ont déjà acheté des produits douteux. Une vendeuse claire sur la composition et l’origine se démarque vite.', 'Trust is everything: many customers have bought dubious products before. A seller who is clear about ingredients and origin stands out quickly.'],
  ]),
  products: ls([
    ['Beurres et laits corporels hydratants', 'Moisturizing body butters and lotions'],
    ['Rouges à lèvres et gloss par teinte', 'Lipsticks and glosses by shade'],
    ['Fonds de teint adaptés aux peaux foncées', 'Foundations made for darker skin'],
    ['Soins capillaires pour cheveux crépus et bouclés', 'Hair care for kinky and curly hair'],
    ['Crèmes solaires', 'Sunscreens'],
    ['Coffrets cadeaux de soins', 'Skincare gift sets'],
    ['Accessoires : pinceaux, éponges, trousses', 'Accessories: brushes, sponges, pouches'],
    ['Parfums d’ambiance et brumes pour le corps', 'Body mists and home scents'],
  ]),
  blocks: [
    h2('Photos et vidéos honnêtes', 'Honest photos and videos'),
    p(
      'Montre le produit tel qu’il est : le pot, l’étiquette lisible, la texture sur le dos de la main. Pour le maquillage, fais des swatches sur plusieurs carnations, à la lumière du jour, sans filtre. Une vidéo d’application de 15 secondes vaut plus qu’une belle photo retouchée.',
      'Show the product as it is: the jar, a readable label, the texture on the back of a hand. For makeup, do swatches on several skin tones in daylight with no filter. A 15 second application video beats a polished retouched photo.',
    ),
    list([
      ['Photographie l’étiquette avec la liste des ingrédients et la date de péremption.', 'Photograph the label with the ingredient list and expiry date.'],
      ['Pas de filtre beauté sur les vidéos de rendu : la cliente doit voir le vrai résultat.', 'No beauty filter on result videos: customers must see the real result.'],
      ['Montre le format réel à côté d’un objet connu (une main, un téléphone).', 'Show the real size next to a familiar object (a hand, a phone).'],
    ]),
    h2('Teintes et variantes', 'Shades and variants'),
    p(
      'Pour le fond de teint ou le rouge à lèvres, chaque teinte est une variante. Nomme-les clairement (par exemple « Caramel », « Chocolat », « Ébène ») avec une photo de swatch pour chacune. Sur Zuri, la cliente choisit sa teinte dans le formulaire, et ton stock est suivi teinte par teinte.',
      'For foundation or lipstick, each shade is a variant. Name them clearly (for example "Caramel", "Chocolate", "Ebony") with a swatch photo for each. On Zuri customers pick their shade in the order form and your stock is tracked shade by shade.',
    ),
    tip(
      'Aide à choisir la teinte',
      'Help them choose a shade',
      'Propose à la cliente d’envoyer une photo d’elle à la lumière du jour sur WhatsApp, et conseille-la. Une teinte bien choisie, c’est un colis accepté et une cliente qui revient.',
      'Offer customers to send a daylight selfie on WhatsApp and advise them. A well chosen shade means an accepted parcel and a returning customer.',
    ),
    h2('Prix, packs et routines', 'Pricing, bundles and routines'),
    p(
      'Les routines se vendent bien en pack : nettoyant + crème + protection solaire, ou shampoing + masque + huile. Le pack augmente le panier et la cliente teste plusieurs produits d’un coup. Par exemple : 1 crème à 8 000 FCFA, la routine complète de 3 produits à 19 500 FCFA.',
      'Routines sell well as bundles: cleanser + cream + sunscreen, or shampoo + mask + oil. The bundle raises the basket and the customer tries several products at once. For example: 1 cream at 8,000 FCFA, the full 3 product routine at 19,500 FCFA.',
    ),
    h2('Ce que tu ne dois pas vendre ni promettre', 'What you must not sell or promise'),
    p(
      'Les produits éclaircissants ou « de clarification » posent un vrai problème : l’OMS alerte sur le mercure présent dans certains produits éclaircissants, que de nombreux pays ont interdits, et Meta refuse les pubs de produits qui blanchissent la peau de façon permanente. Ne les mets pas en avant. Ne promets pas non plus de soigner l’acné, l’eczéma ou les taches : ce sont des allégations médicales.',
      'Skin lightening or "clarifying" products are a real problem: WHO warns about mercury in some lightening products, which many countries have banned, and Meta rejects ads for products that permanently whiten skin. Do not promote them. Do not promise to treat acne, eczema or dark spots either: those are medical claims.',
    ),
    list([
      ['Vends des produits avec une étiquette claire, une composition et une date de péremption.', 'Sell products with a clear label, ingredient list and expiry date.'],
      ['Parle de sensations et d’usage (« hydrate », « laisse la peau douce »), pas de guérison.', 'Talk about feel and use ("moisturizes", "leaves skin soft"), not cures.'],
      ['Conseille un test sur une petite zone de peau avant la première utilisation.', 'Recommend a patch test before first use.'],
    ]),
    h2('Confirmation et refus', 'Confirmation and refusals'),
    p(
      'En cosmétique, les refus viennent souvent d’un doute sur l’authenticité ou d’une mauvaise teinte. Au téléphone, reconfirme le produit exact, la teinte, le prix total et rassure sur l’origine. Envoie la photo du colis préparé avant le départ du livreur.',
      'In cosmetics, refusals often come from doubts about authenticity or the wrong shade. On the call, double check the exact product, shade and total price, and reassure on origin. Send a photo of the packed parcel before the courier leaves.',
    ),
    h2('Emballage, stockage et confiance', 'Packaging, storage and trust'),
    list([
      ['Stocke tes produits au frais, à l’abri du soleil : la chaleur abîme crèmes et rouges à lèvres.', 'Store products somewhere cool and out of the sun: heat ruins creams and lipsticks.'],
      ['Ferme les pots avec du film et emballe dans du papier bulle pour éviter les fuites.', 'Seal jars with film and wrap in bubble wrap to prevent leaks.'],
      ['Vends d’abord les lots les plus anciens et retire tout produit périmé.', 'Sell the oldest batches first and remove anything expired.'],
      ['Publie des avis de vraies clientes, sans retouche.', 'Post reviews from real customers, without retouching.'],
    ]),
  ],
  adRules: ls([
    ['Pas d’attaque sur un attribut personnel : « Tu as des boutons ? », « Ta peau est terne ? » sont refusés par Meta. Parle du produit, pas des défauts de la personne.', 'No personal attribute hooks: "Do you have acne?", "Is your skin dull?" get rejected by Meta. Talk about the product, not the viewer’s flaws.'],
    ['Ne fais pas la promotion de produits qui éclaircissent ou blanchissent la peau. Meta interdit les produits de blanchiment permanent, et beaucoup de pays les encadrent.', 'Do not promote skin lightening or whitening products. Meta bans permanent whitening products, and many countries regulate them.'],
    ['Pas d’avant/après retouché ou exagéré pour un soin (rides, taches, acné). TikTok cite ce type d’image comme contenu trompeur.', 'No retouched or exaggerated before and after for skincare (wrinkles, spots, acne). TikTok lists this as misleading content.'],
    ['Pas d’allégation médicale : « soigne l’eczéma », « fait disparaître l’acné en 7 jours ».', 'No medical claims: "treats eczema", "clears acne in 7 days".'],
    ['Pas de message qui rabaisse l’apparence ou qui présente une seule peau « parfaite ».', 'No message that puts down someone’s looks or presents one "perfect" skin.'],
    ['Pas de faux produits de marque ni de logos de grandes marques sans droit.', 'No fake branded products or big brand logos without rights.'],
  ]),
  faqs: [
    faq('Puis-je montrer un avant/après dans mes pubs ?', 'Can I show before and after in my ads?', 'Pour le maquillage, Meta l’accepte en général car l’effet n’est pas permanent. Pour un soin de la peau, évite : les images exagérées ou retouchées sont refusées comme trompeuses.', 'For makeup, Meta generally allows it because the effect is temporary. For skincare, avoid it: exaggerated or retouched images get rejected as misleading.'),
    faq('Pourquoi éviter les produits éclaircissants ?', 'Why avoid skin lightening products?', 'L’OMS alerte sur le mercure dans certains de ces produits, de nombreux pays les ont interdits, et Meta refuse les pubs de blanchiment permanent. C’est un risque pour tes clientes et pour ton compte.', 'WHO warns about mercury in some of these products, many countries have banned them, and Meta rejects permanent whitening ads. It is a risk for your customers and your account.'),
    faq('Comment gérer les teintes de fond de teint ?', 'How do I manage foundation shades?', 'Crée une variante par teinte avec une photo de swatch et son stock. Propose un conseil sur WhatsApp à partir d’un selfie à la lumière du jour.', 'Create one variant per shade with a swatch photo and its own stock. Offer advice on WhatsApp from a daylight selfie.'),
    faq('Que dire sur l’efficacité de mes produits ?', 'What can I say about how well my products work?', 'Décris l’usage et les sensations (hydratation, douceur, parfum), pas une guérison. Reste sur ce que tu peux prouver.', 'Describe use and feel (moisture, softness, scent), not a cure. Stick to what you can prove.'),
  ],
  sources: [S.metaStd, S.metaAttr, S.metaHealth, S.ttMisleading, S.ttHealth, S.whoMercury],
  related: ['publicite-facebook-paiement-livraison', 'publicite-tiktok-afrique', 'reduire-retours-paiement-livraison'],
}

/* 4. Perruques et mèches */
const perruques: NichePage = {
  slug: l('perruques-meches', 'wigs-hair-extensions'),
  icon: 'users',
  accent: '#8E5BD6',
  name: l('Perruques et mèches', 'Wigs and hair extensions'),
  title: l('Vendre perruques et mèches en ligne en Afrique | Zuri', 'Sell wigs and hair extensions online in Africa | Zuri'),
  description: l(
    'Vends perruques et mèches en ligne en COD : longueurs, densités, couleurs, vidéos, confirmation et pubs sans contenu trompeur. Le guide des vendeuses.',
    'Sell wigs and hair extensions online with cash on delivery: lengths, density, colors, videos, confirmation and honest ads. A practical guide.',
  ),
  h1: l('Vendre des perruques et des mèches en ligne en Afrique', 'How to sell wigs and hair extensions online in Africa'),
  intro: l(
    'Perruques lace, mèches naturelles, tissages, nattes et accessoires : le cheveu est un vrai métier en Afrique, avec des clientes fidèles et exigeantes. Les paniers sont souvent élevés, donc un refus coûte cher. Ce guide t’explique comment décrire tes produits sans ambiguïté, gérer les longueurs et les densités, confirmer et livrer.',
    'Lace wigs, human hair bundles, weaves, braiding hair and accessories: hair is a real trade in Africa, with loyal and demanding customers. Orders are often high value, so a refusal is expensive. This guide shows you how to describe products without ambiguity, handle lengths and densities, confirm and deliver.',
  ),
  why: ls([
    ['Beaucoup de femmes changent de coiffure régulièrement et cherchent de nouveaux styles. Une cliente satisfaite revient pour sa prochaine coiffure et te recommande.', 'Many women change hairstyles regularly and look for new styles. A happy customer comes back for her next look and recommends you.'],
    ['Les perruques et mèches se montrent très bien en vidéo : mouvement, brillance, pose de la lace, résultat final.', 'Wigs and extensions look great on video: movement, shine, lace install, final look.'],
    ['Les paniers sont plus élevés que pour beaucoup d’autres produits, ce qui laisse de la place pour la pub et la livraison, à condition de bien confirmer.', 'Orders are bigger than for many other products, leaving room for ads and delivery, as long as you confirm carefully.'],
  ]),
  products: ls([
    ['Perruques lace frontal et closure', 'Lace frontal and closure wigs'],
    ['Perruques courtes prêtes à porter', 'Short ready to wear wigs'],
    ['Mèches naturelles en paquets (bundles)', 'Human hair bundles'],
    ['Mèches synthétiques pour tresses', 'Synthetic braiding hair'],
    ['Perruques colorées et ombré', 'Colored and ombre wigs'],
    ['Accessoires : colle, bonnets, bandeaux, peignes', 'Accessories: glue, wig caps, bands, combs'],
    ['Produits d’entretien pour perruques', 'Wig care products'],
    ['Packs mèches + closure', 'Bundles plus closure sets'],
  ]),
  blocks: [
    h2('Photos et vidéos', 'Photos and videos'),
    p(
      'Filme la perruque portée, en lumière naturelle, avec des mouvements de tête. Montre la lace de près, l’intérieur du bonnet, et passe la main dans les cheveux. Une vidéo de pose courte rassure les clientes qui hésitent.',
      'Film the wig being worn in natural light, with head movement. Show the lace up close, the inside of the cap, and run your hand through the hair. A short install video reassures hesitant customers.',
    ),
    list([
      ['Une vidéo portée, une photo à plat avec un mètre ruban pour la longueur.', 'One worn video, one flat photo with a tape measure for length.'],
      ['Un gros plan sur la lace et les finitions.', 'A close up of the lace and finishing.'],
      ['Pas de filtre qui change la couleur : la cliente doit recevoir la teinte vue.', 'No filter that changes the color: customers must get the shade they saw.'],
    ]),
    h2('Longueurs, densités et types de cheveux', 'Lengths, densities and hair types'),
    p(
      'Les malentendus viennent souvent de la description. Indique toujours : la longueur en pouces et en centimètres, la densité, le type (naturel ou synthétique), la texture (lisse, ondulé, bouclé), la taille de lace et la taille du bonnet. Sur Zuri, la longueur et la couleur peuvent être des variantes avec un prix différent pour chacune.',
      'Misunderstandings often come from the description. Always state: length in inches and centimeters, density, type (human or synthetic), texture (straight, wavy, curly), lace size and cap size. On Zuri, length and color can be variants with a different price for each.',
    ),
    table([
      [['Info', 'Detail'], ['Exemple à écrire', 'Example to write']],
      [['Longueur', 'Length'], ['16 pouces (environ 40 cm)', '16 inches (about 40 cm)']],
      [['Type', 'Type'], ['Cheveux naturels ou synthétiques, à dire clairement', 'Human or synthetic hair, stated clearly']],
      [['Lace', 'Lace'], ['Lace frontal 13x4', '13x4 lace frontal']],
      [['Bonnet', 'Cap'], ['Taille moyenne, ajustable', 'Medium, adjustable']],
    ]),
    tip(
      'Ne joue pas sur les mots',
      'Do not play with words',
      'Si une perruque est synthétique ou mélangée, dis-le. Une cliente qui découvre à la livraison que ce n’est pas ce qu’elle croyait refuse le colis et ne revient jamais.',
      'If a wig is synthetic or blended, say so. A customer who finds out at delivery that it is not what she thought will refuse the parcel and never come back.',
    ),
    h2('Prix et packs', 'Pricing and bundles'),
    p(
      'Les packs « mèches + closure » ou « perruque + kit d’entretien » augmentent le panier. Affiche clairement le prix par longueur. Par exemple : 14 pouces à 45 000 FCFA, 18 pouces à 60 000 FCFA. Pour ces montants, propose aussi l’acompte ou le paiement complet par Mobile Money.',
      'Bundles like "hair + closure" or "wig + care kit" raise the basket. Show the price per length clearly. For example: 14 inches at 45,000 FCFA, 18 inches at 60,000 FCFA. For amounts like these, also offer a deposit or full payment by Mobile Money.',
    ),
    h2('Confirmation et risques de refus', 'Confirmation and refusal risks'),
    list([
      ['Reconfirme longueur, couleur, type de cheveux, taille de lace et prix total.', 'Double check length, color, hair type, lace size and total price.'],
      ['Envoie une vidéo de la perruque exacte avant l’envoi.', 'Send a video of the exact wig before shipping.'],
      ['Pour un gros panier, demande un acompte par Mobile Money : une cliente qui a payé une partie refuse beaucoup plus rarement.', 'For a big order, ask for a Mobile Money deposit: a customer who paid part upfront rarely refuses.'],
      ['Explique ta règle d’hygiène : une perruque portée ne peut pas être reprise.', 'Explain your hygiene rule: a worn wig cannot be taken back.'],
    ], true),
    h2('Emballage, stock et confiance', 'Packaging, stock and trust'),
    p(
      'Range chaque perruque dans un filet ou un sachet, sur une forme si possible, dans une boîte rigide. Note les références par longueur et couleur pour suivre ton stock. Publie des vidéos de vraies clientes, et propose un petit service de conseil sur WhatsApp pour l’entretien : c’est ce qui fait revenir.',
      'Store each wig in a net or bag, on a form if possible, inside a rigid box. Track references by length and color to follow your stock. Post videos from real customers, and offer care advice on WhatsApp: that is what brings them back.',
    ),
  ],
  adRules: ls([
    ['Ne vise pas la perte de cheveux de la personne : « Tu perds tes cheveux ? », « Ton crâne se dégarnit ? » sont des attributs personnels refusés par Meta.', 'Do not target the viewer’s hair loss: "Losing your hair?", "Is your hairline thinning?" are personal attributes Meta rejects.'],
    ['Ne promets pas qu’un produit fait repousser les cheveux. C’est une allégation médicale que TikTok cite parmi les contenus non autorisés.', 'Do not promise a product regrows hair. That is a medical claim TikTok lists as not allowed.'],
    ['Ne présente pas une perruque synthétique comme du cheveu naturel.', 'Do not present a synthetic wig as human hair.'],
    ['Pas de photos ou vidéos copiées chez une autre vendeuse ou une marque.', 'No photos or videos copied from another seller or brand.'],
    ['Pas de message qui rabaisse les cheveux naturels ou une apparence.', 'No message that puts down natural hair or anyone’s looks.'],
  ]),
  faqs: [
    faq('Comment éviter les refus sur des perruques chères ?', 'How do I avoid refusals on expensive wigs?', 'Décris tout clairement, envoie une vidéo de la perruque exacte avant l’envoi et demande un acompte par Mobile Money pour les gros montants.', 'Describe everything clearly, send a video of the exact wig before shipping and ask for a Mobile Money deposit on big amounts.'),
    faq('Faut-il reprendre une perruque essayée ?', 'Should I take back a wig that was tried on?', 'C’est une question d’hygiène. Beaucoup de vendeuses refusent les retours de perruques portées. Fixe ta règle et écris-la avant la commande.', 'It is a hygiene issue. Many sellers refuse returns on worn wigs. Set your rule and state it before the order.'),
    faq('Comment gérer les longueurs sur ma boutique ?', 'How do I handle lengths in my store?', 'Crée une variante par longueur (et par couleur si besoin), chacune avec son prix et son stock.', 'Create a variant per length (and color if needed), each with its own price and stock.'),
    faq('Puis-je parler de repousse des cheveux ?', 'Can I talk about hair regrowth?', 'Non dans tes pubs. Les promesses de repousse sont des allégations médicales, refusées par les plateformes.', 'Not in your ads. Regrowth promises are medical claims and get rejected.'),
  ],
  sources: [S.metaStd, S.metaAttr, S.ttHealth, S.ttMisleading],
  related: ['script-confirmation-commande', 'integrer-mobile-money-site', 'publicite-tiktok-afrique'],
}

/* 5. Bijoux et montres */
const bijoux: NichePage = {
  slug: l('bijoux-montres', 'jewelry-watches'),
  icon: 'gift',
  accent: '#D4A017',
  name: l('Bijoux et montres', 'Jewelry and watches'),
  title: l('Vendre bijoux et montres en ligne en Afrique | Zuri', 'Sell jewelry and watches online in Africa | Zuri'),
  description: l(
    'Vends bijoux et montres en ligne en COD : photos, matières, packs cadeaux, confirmation, emballage et pubs sans contrefaçon. Un guide clair et pratique.',
    'Sell jewelry and watches online with cash on delivery: photos, materials, gift sets, confirmation, packaging and counterfeit free ads.',
  ),
  h1: l('Vendre des bijoux et des montres en ligne en Afrique', 'How to sell jewelry and watches online in Africa'),
  intro: l(
    'Colliers, bracelets, boucles d’oreilles, bagues, montres : ce sont des produits légers, faciles à livrer et parfaits pour les cadeaux. Leur point faible, c’est la confiance : le client veut savoir en quelle matière c’est fait et si ça va noircir. Ce guide t’aide à vendre honnêtement et à faire des ventes cadeaux toute l’année.',
    'Necklaces, bracelets, earrings, rings, watches: light items, easy to deliver and perfect as gifts. Their weak point is trust: customers want to know what it is made of and whether it will tarnish. This guide helps you sell honestly and make gift sales all year round.',
  ),
  why: ls([
    ['Les bijoux et montres sont des cadeaux faciles pour les anniversaires, la Saint-Valentin, la fête des mères, les fêtes de fin d’année et les mariages.', 'Jewelry and watches are easy gifts for birthdays, Valentine’s Day, Mother’s Day, year end holidays and weddings.'],
    ['Ils sont petits et légers : livraison simple, peu de casse, pas de problème de taille pour la plupart des modèles.', 'They are small and light: easy delivery, little breakage, no sizing issue for most styles.'],
    ['Une belle vidéo en gros plan, avec des reflets, fait beaucoup d’effet sur TikTok et Instagram.', 'A good close up video with sparkle works very well on TikTok and Instagram.'],
  ]),
  products: ls([
    ['Bijoux en acier inoxydable qui ne noircissent pas', 'Stainless steel jewelry that does not tarnish'],
    ['Parures collier et boucles d’oreilles', 'Necklace and earring sets'],
    ['Bijoux personnalisés avec prénom', 'Personalized name jewelry'],
    ['Montres homme sans marque, style classique', 'Unbranded classic men’s watches'],
    ['Montres connectées d’entrée de gamme', 'Entry level smartwatches'],
    ['Bracelets en perles et bijoux artisanaux', 'Beaded bracelets and handmade jewelry'],
    ['Coffrets cadeaux montre + bracelet', 'Watch and bracelet gift boxes'],
    ['Bijoux de mariage et de cérémonie', 'Wedding and ceremony jewelry'],
  ]),
  blocks: [
    h2('Photos et vidéos', 'Photos and videos'),
    p(
      'Les bijoux sont petits : sans gros plan net, ils ont l’air bon marché. Photographie sur un fond neutre, à la lumière du jour, puis porté sur une main, un cou ou un poignet pour montrer la taille réelle. Une vidéo qui fait tourner la pièce sous la lumière montre l’éclat mieux que n’importe quelle photo.',
      'Jewelry is small: without a sharp close up it looks cheap. Shoot on a neutral background in daylight, then worn on a hand, neck or wrist to show the real size. A video turning the piece in the light shows the shine better than any photo.',
    ),
    h2('Matières : dis la vérité', 'Materials: tell the truth'),
    p(
      'Écris clairement la matière : acier inoxydable, plaqué or, argent 925, laiton, fantaisie. N’écris pas « or » si ce n’est pas de l’or massif. Un client trompé refuse le colis, laisse un mauvais avis et le raconte dans ses groupes WhatsApp.',
      'State the material clearly: stainless steel, gold plated, 925 silver, brass, costume. Do not write "gold" if it is not solid gold. A misled customer refuses the parcel, leaves a bad review and tells their WhatsApp groups.',
    ),
    table([
      [['Matière', 'Material'], ['Ce que tu peux dire', 'What you can say']],
      [['Acier inoxydable', 'Stainless steel'], ['Résiste bien à l’eau et au temps', 'Holds up well to water and time']],
      [['Plaqué or', 'Gold plated'], ['Couche d’or sur un autre métal, à entretenir', 'Gold layer over another metal, needs care']],
      [['Argent 925', 'Sterling silver'], ['Argent véritable, peut ternir, se nettoie', 'Real silver, can tarnish, cleans up']],
      [['Fantaisie', 'Costume'], ['Prix doux, pour le style, durée plus courte', 'Low price, for style, shorter life']],
    ]),
    h2('Variantes : tailles de bague, couleurs, longueurs', 'Variants: ring sizes, colors, lengths'),
    p(
      'Les bagues ont des tailles, les colliers des longueurs, les montres des couleurs de bracelet. Sur Zuri, crée une variante pour chaque option avec son stock. Pour les bagues, explique comment mesurer le tour de doigt avec un fil et une règle.',
      'Rings have sizes, necklaces have lengths, watches have strap colors. On Zuri, create a variant for each option with its own stock. For rings, explain how to measure finger size with a string and a ruler.',
    ),
    h2('Packs cadeaux et prix', 'Gift sets and pricing'),
    list([
      ['Propose des coffrets prêts à offrir : montre + bracelet, collier + boucles.', 'Offer ready to give boxes: watch + bracelet, necklace + earrings.'],
      ['Ajoute la gravure ou un petit mot comme option.', 'Add engraving or a gift note as an option.'],
      ['Par exemple : bracelet seul à 6 000 FCFA, coffret montre + bracelet à 15 000 FCFA.', 'For example: bracelet alone at 6,000 FCFA, watch + bracelet box at 15,000 FCFA.'],
      ['Prépare tes offres avant les grandes fêtes, pas la veille.', 'Prepare your offers before major holidays, not the day before.'],
    ]),
    h2('Confirmation et livraison', 'Confirmation and delivery'),
    p(
      'Pour un cadeau, demande si le colis doit être livré à une autre personne et à quel moment, et s’il faut éviter de montrer le prix. Reconfirme le modèle, la couleur, la taille de bague et le prix total. Emballe dans une petite boîte ou pochette, elle-même dans un sachet opaque : les petits objets brillants attirent l’attention.',
      'For a gift, ask whether it goes to someone else and when, and whether the price should stay hidden. Double check style, color, ring size and total price. Pack in a small box or pouch inside an opaque bag: small shiny items attract attention.',
    ),
    tip(
      'La surprise qui échoue',
      'The surprise that fails',
      'Un cadeau livré au mauvais moment ou à la mauvaise personne est souvent refusé. Note bien le nom et le numéro du destinataire, et préviens l’acheteur quand le livreur part.',
      'A gift delivered at the wrong time or to the wrong person often gets refused. Note the recipient’s name and number carefully, and alert the buyer when the courier leaves.',
    ),
    h2('Stock et confiance', 'Stock and trust'),
    p(
      'Garde tes bijoux dans des sachets séparés pour éviter rayures et nœuds. Publie des photos de clients et des vidéos après quelques semaines d’usage pour montrer que l’acier ne noircit pas. Les notifications WhatsApp de suivi rassurent les acheteurs de cadeaux.',
      'Keep each piece in its own bag to avoid scratches and tangles. Post customer photos and videos after a few weeks of wear to show the steel does not tarnish. WhatsApp tracking notifications reassure gift buyers.',
    ),
  ],
  adRules: ls([
    ['Pas de montres ou bijoux de marque copiés avec le logo ou le nom de la marque. Meta et TikTok interdisent les pubs de contrefaçons.', 'No copied branded watches or jewelry with the brand’s logo or name. Meta and TikTok ban counterfeit ads.'],
    ['N’écris pas « inspiré de » suivi du nom d’une grande marque pour vendre une imitation.', 'Do not write "inspired by" plus a big brand name to sell an imitation.'],
    ['N’annonce pas « or » ou « argent » si ce n’est pas la vraie matière.', 'Do not say "gold" or "silver" if that is not the real material.'],
    ['Ne promets pas d’effets sur la santé (bracelets magnétiques qui soignent, pierres qui guérissent).', 'Do not promise health effects (healing magnetic bracelets, curing stones).'],
    ['Pas de faux prix barré ou de fausse rupture de stock.', 'No fake strike through prices or fake sold out claims.'],
  ]),
  faqs: [
    faq('Quels bijoux choisir pour limiter les plaintes ?', 'Which jewelry gets fewer complaints?', 'L’acier inoxydable est souvent un bon choix car il résiste bien à l’eau et à la sueur. Dans tous les cas, indique clairement la matière.', 'Stainless steel is often a good choice because it holds up to water and sweat. Either way, state the material clearly.'),
    faq('Puis-je vendre des montres de marque ?', 'Can I sell branded watches?', 'Seulement si elles sont authentiques et que tu peux le prouver. Les copies sont refusées en pub et peuvent fermer ton compte.', 'Only if they are genuine and you can prove it. Copies get rejected in ads and can get your account closed.'),
    faq('Comment vendre plus pendant les fêtes ?', 'How do I sell more during holidays?', 'Prépare des coffrets cadeaux, une option message ou gravure, et commence la promotion une à deux semaines avant la date.', 'Prepare gift boxes, a message or engraving option, and start promoting one to two weeks before the date.'),
    faq('Comment gérer les tailles de bague ?', 'How do I handle ring sizes?', 'Crée une variante par taille et explique comment mesurer le doigt avec un fil. Les bagues ajustables évitent le problème.', 'Create a variant per size and explain how to measure a finger with a string. Adjustable rings avoid the issue.'),
  ],
  sources: [S.metaStd, S.metaTm, S.metaIp, S.ttIp, S.ttMisleading],
  related: ['fetes-et-saisons-vente-en-ligne', 'trouver-produit-gagnant', 'page-de-vente-qui-convertit'],
}

/* 6. Parfums */
const parfums: NichePage = {
  slug: l('parfums', 'perfume'),
  icon: 'flame',
  accent: '#C2577A',
  name: l('Parfums', 'Perfume'),
  title: l('Vendre des parfums en ligne en Afrique | Zuri', 'Sell perfume online in Africa | Zuri'),
  description: l(
    'Vends tes parfums en ligne en COD : décrire une odeur, formats, packs, confirmation, emballage anti-casse et pubs sans contrefaçon. Le guide pratique.',
    'Sell perfume online with cash on delivery: describing scents, sizes, bundles, confirmation, breakage proof packing and counterfeit free ads.',
  ),
  h1: l('Vendre des parfums en ligne en Afrique quand le client ne peut pas sentir', 'How to sell perfume online in Africa when customers cannot smell it'),
  intro: l(
    'Parfums, eaux de toilette, huiles parfumées, encens, brumes : le parfum compte beaucoup dans de nombreuses cultures africaines. Le défi en ligne est simple à dire : le client ne peut pas sentir. Ce guide t’explique comment décrire une odeur, proposer des formats d’essai, emballer sans casse et faire des pubs qui passent.',
    'Perfumes, eaux de toilette, perfume oils, incense, body mists: scent matters a lot in many African cultures. The online challenge is simple to state: customers cannot smell it. This guide shows you how to describe a scent, offer trial sizes, pack without breakage and run ads that get approved.',
  ),
  why: ls([
    ['Le parfum se rachète quand le flacon est fini, et les clients fidèles à une odeur reviennent chez la vendeuse qui la leur a fait découvrir.', 'Perfume gets rebought when the bottle runs out, and customers loyal to a scent come back to the seller who introduced it.'],
    ['C’est un cadeau très apprécié pour les fêtes, les mariages et les grandes occasions religieuses.', 'It is a well loved gift for holidays, weddings and major religious occasions.'],
    ['Les huiles parfumées, les encens et les créations locales permettent de proposer des produits originaux, loin des copies de marques.', 'Perfume oils, incense and local creations let you offer original products, far from brand copies.'],
  ]),
  products: ls([
    ['Huiles parfumées en petits flacons', 'Perfume oils in small bottles'],
    ['Parfums de créateurs locaux', 'Perfumes from local makers'],
    ['Encens, thiouraye et bakhour', 'Incense, thiouraye and bakhoor'],
    ['Brumes parfumées pour le corps', 'Body mists'],
    ['Coffrets découverte de miniatures', 'Discovery sets of minis'],
    ['Parfums d’ambiance et diffuseurs', 'Home fragrance and diffusers'],
    ['Déodorants et laits parfumés assortis', 'Matching deodorants and scented lotions'],
    ['Coffrets cadeaux couple', 'Couple gift sets'],
  ]),
  blocks: [
    h2('Décrire une odeur avec des mots simples', 'Describing a scent in simple words'),
    p(
      'Remplace les termes techniques par des comparaisons que tout le monde comprend : frais comme un agrume, doux comme la vanille, boisé, fleuri, épicé. Dis pour quelle occasion il convient (journée, soirée, cérémonie) et combien de temps il tient sur la peau d’après tes propres essais.',
      'Swap technical terms for comparisons everyone gets: fresh like citrus, sweet like vanilla, woody, floral, spicy. Say what occasion it suits (day, evening, ceremony) and how long it lasts on skin based on your own tests.',
    ),
    list([
      ['Trois mots pour l’odeur : par exemple « vanille, musc, bois ».', 'Three words for the scent: for example "vanilla, musk, wood".'],
      ['Une phrase pour l’occasion : « parfait pour les soirées et les mariages ».', 'One line for the occasion: "great for evenings and weddings".'],
      ['Une vidéo où tu parles de l’odeur avec ton ressenti, sans exagérer.', 'A video where you describe the scent honestly, without exaggerating.'],
    ]),
    h2('Photos et vidéos', 'Photos and videos'),
    p(
      'Montre le flacon sous plusieurs angles, le bouchon, le vaporisateur et le niveau de remplissage. Filme quelqu’un qui vaporise et réagit naturellement. Montre aussi le format réel dans la main, pour éviter la déception sur la taille.',
      'Show the bottle from several angles, the cap, the sprayer and the fill level. Film someone spraying and reacting naturally. Also show the real size in a hand, to avoid disappointment about size.',
    ),
    h2('Formats, variantes et packs', 'Sizes, variants and bundles'),
    p(
      'Les formats d’essai réduisent le risque pour le client : un petit flacon pour découvrir, un grand pour les fidèles. Sur Zuri, la contenance (par exemple 10 ml, 30 ml, 100 ml) est une variante avec son prix et son stock. Les coffrets découverte de plusieurs miniatures aident à choisir.',
      'Trial sizes lower the risk for customers: a small bottle to discover, a big one for regulars. On Zuri the volume (for example 10 ml, 30 ml, 100 ml) is a variant with its own price and stock. Discovery sets of several minis help people choose.',
    ),
    table([
      [['Format', 'Size'], ['Pour qui', 'Who it is for'], ['Prix (exemple)', 'Price (example)']],
      [['10 ml', '10 ml'], ['Découverte', 'First try'], ['3 500 FCFA', '3,500 FCFA']],
      [['30 ml', '30 ml'], ['Usage régulier', 'Regular use'], ['9 000 FCFA', '9,000 FCFA']],
      [['Coffret 3 x 10 ml', '3 x 10 ml set'], ['Cadeau ou hésitation', 'Gift or undecided'], ['9 500 FCFA', '9,500 FCFA']],
    ]),
    h2('Confirmation et refus', 'Confirmation and refusals'),
    p(
      'Les refus en parfum viennent souvent d’une attente déçue : le client pensait recevoir un parfum de grande marque, ou un plus grand flacon. Au téléphone, reconfirme le nom exact du produit, la contenance et le prix total. Si c’est une création maison ou une huile, dis-le clairement.',
      'Perfume refusals often come from mismatched expectations: the customer thought they were getting a big brand, or a bigger bottle. On the call, double check the exact product name, volume and total price. If it is a house creation or an oil, say so clearly.',
    ),
    h2('Emballage, transport et stock', 'Packaging, transport and stock'),
    list([
      ['Entoure chaque flacon de papier bulle et cale-le dans une boîte rigide.', 'Wrap each bottle in bubble wrap and wedge it in a rigid box.'],
      ['Mets du ruban adhésif autour du bouchon pour éviter les fuites.', 'Tape around the cap to prevent leaks.'],
      ['Stocke au frais, loin du soleil : la chaleur abîme le parfum.', 'Store somewhere cool, away from the sun: heat ruins perfume.'],
      ['Vérifie les règles de ton livreur pour les liquides inflammables, surtout en envoi interurbain.', 'Check your courier’s rules on flammable liquids, especially for intercity shipping.'],
    ]),
    tip(
      'Construis ta propre signature',
      'Build your own signature',
      'Une gamme maison avec ton nom et tes noms de parfums est plus durable que les copies : personne ne peut te la faire retirer, et les clients ne peuvent la racheter que chez toi.',
      'A house range with your name and your own scent names lasts longer than copies: nobody can get it taken down, and customers can only rebuy it from you.',
    ),
  ],
  adRules: ls([
    ['Ne cite pas le nom d’un grand parfum de marque pour vendre une copie ou un « équivalent ». Meta et TikTok refusent les pubs qui créent une confusion avec une marque.', 'Do not use a famous brand perfume’s name to sell a copy or "dupe". Meta and TikTok reject ads that create confusion with a brand.'],
    ['Pas de flacon qui imite la forme ou le logo d’une marque connue dans tes visuels.', 'No bottle imitating a famous brand’s shape or logo in your visuals.'],
    ['Ne promets pas d’effet de séduction garanti ou d’effet sur la santé.', 'Do not promise guaranteed seduction or health effects.'],
    ['Pas de contenu sexuellement suggestif pour vendre un parfum.', 'No sexually suggestive content to sell perfume.'],
    ['Ne présente pas une huile ou une création maison comme un parfum de grande marque.', 'Do not present an oil or house creation as a big brand perfume.'],
  ]),
  faqs: [
    faq('Comment vendre un parfum que le client ne peut pas sentir ?', 'How do I sell a scent customers cannot smell?', 'Décris l’odeur avec des mots simples, propose des petits formats et des coffrets découverte, et partage les avis de vrais clients.', 'Describe the scent in simple words, offer small sizes and discovery sets, and share real customer reviews.'),
    faq('Puis-je vendre des « équivalents » de grandes marques ?', 'Can I sell "dupes" of big brands?', 'Utiliser le nom d’une marque pour vendre une copie pose un problème de propriété intellectuelle et fait refuser tes pubs. Mise plutôt sur ta propre gamme.', 'Using a brand’s name to sell a copy raises intellectual property issues and gets your ads rejected. Build your own range instead.'),
    faq('Comment éviter la casse ?', 'How do I avoid breakage?', 'Papier bulle, boîte rigide, adhésif sur le bouchon, et des flacons bien calés pour qu’ils ne bougent pas.', 'Bubble wrap, a rigid box, tape on the cap, and bottles wedged so they do not move.'),
    faq('Le parfum peut-il voyager entre deux villes ?', 'Can perfume travel between cities?', 'Souvent oui, mais certains transporteurs ont des règles pour les liquides inflammables. Demande à ton livreur avant de promettre une livraison.', 'Often yes, but some carriers have rules for flammable liquids. Ask your courier before promising delivery.'),
  ],
  sources: [S.metaStd, S.metaTm, S.metaIp, S.ttIp],
  related: ['fetes-et-saisons-vente-en-ligne', 'astuces-vendre-en-ligne', 'calculer-marge-paiement-livraison'],
}

/* 7. Accessoires de téléphone */
const accessoiresTelephone: NichePage = {
  slug: l('accessoires-telephone', 'phone-accessories'),
  icon: 'phone',
  accent: '#2F80ED',
  name: l('Accessoires de téléphone', 'Phone accessories'),
  title: l('Vendre des accessoires de téléphone en ligne | Zuri', 'Sell phone accessories online in Africa | Zuri'),
  description: l(
    'Vends coques, chargeurs, écouteurs et power banks en ligne en COD : compatibilité, packs, confirmation, tests et pubs honnêtes. Le guide pratique.',
    'Sell cases, chargers, earbuds and power banks online with cash on delivery: compatibility, bundles, confirmation, testing and honest ads.',
  ),
  h1: l('Vendre des accessoires de téléphone en ligne en Afrique', 'How to sell phone accessories online in Africa'),
  intro: l(
    'Coques, verres trempés, chargeurs, câbles, écouteurs, power banks, supports : presque tout le monde a un téléphone, et tout le monde a besoin d’accessoires. Ce sont des produits petits, faciles à livrer, avec de bonnes marges. Le piège, c’est la compatibilité et la qualité. Ce guide t’aide à éviter les deux.',
    'Cases, screen protectors, chargers, cables, earbuds, power banks, holders: almost everyone has a phone, and everyone needs accessories. They are small, easy to deliver and offer good margins. The traps are compatibility and quality. This guide helps you avoid both.',
  ),
  why: ls([
    ['Le téléphone est l’outil de tous les jours pour parler, travailler et payer avec Mobile Money. Un câble cassé ou une batterie faible, c’est un besoin immédiat.', 'The phone is the everyday tool to talk, work and pay with Mobile Money. A broken cable or weak battery is an immediate need.'],
    ['Les accessoires sont petits et légers : livraison facile, peu de casse, stockage simple.', 'Accessories are small and light: easy delivery, little breakage, simple storage.'],
    ['Les petits prix se prêtent bien aux packs et aux achats d’impulsion, et les clients reviennent pour le prochain téléphone.', 'Low prices suit bundles and impulse buys, and customers come back with their next phone.'],
  ]),
  products: ls([
    ['Coques et verres trempés par modèle de téléphone', 'Cases and screen protectors by phone model'],
    ['Chargeurs rapides et câbles renforcés', 'Fast chargers and reinforced cables'],
    ['Power banks', 'Power banks'],
    ['Écouteurs sans fil', 'Wireless earbuds'],
    ['Supports de téléphone pour moto et voiture', 'Phone holders for motorbikes and cars'],
    ['Trépieds et anneaux lumineux pour vidéos', 'Tripods and ring lights for videos'],
    ['Cartes mémoire et clés USB', 'Memory cards and USB drives'],
    ['Packs protection : coque + verre + câble', 'Protection bundles: case + screen + cable'],
  ]),
  blocks: [
    h2('La compatibilité avant tout', 'Compatibility first'),
    p(
      'Une coque pour le mauvais modèle est un retour assuré. Liste précisément les modèles compatibles, avec leur nom complet. Pour les chargeurs et câbles, indique le type de prise (USB-C, Lightning, micro USB) et la puissance. Sur Zuri, chaque modèle de téléphone peut être une variante de la même coque, avec son stock.',
      'A case for the wrong model is a guaranteed return. List compatible models precisely, with their full names. For chargers and cables, state the connector type (USB-C, Lightning, micro USB) and the power. On Zuri each phone model can be a variant of the same case, with its own stock.',
    ),
    tip(
      'Demande le modèle exact',
      'Ask for the exact model',
      'Beaucoup de clients ne connaissent pas le nom exact de leur téléphone. Explique où le trouver dans les réglages, ou demande une photo de l’arrière du téléphone sur WhatsApp.',
      'Many customers do not know their phone’s exact model name. Explain where to find it in settings, or ask for a photo of the back of the phone on WhatsApp.',
    ),
    h2('Photos, vidéos et tests', 'Photos, videos and tests'),
    list([
      ['Montre la coque posée sur le vrai téléphone, avec les découpes de caméra bien visibles.', 'Show the case on the real phone, with camera cutouts clearly visible.'],
      ['Filme un test réel : charge du téléphone, son des écouteurs, autonomie d’un power bank sur une journée.', 'Film a real test: phone charging, earbud sound, a power bank over a day.'],
      ['Affiche les vraies caractéristiques écrites sur le produit, pas celles de la boîte si elles sont différentes.', 'Show the real specs printed on the product, not the box if they differ.'],
    ]),
    h2('Prix et packs', 'Pricing and bundles'),
    p(
      'Les accessoires ont des petits prix : seuls, ils supportent mal le coût de la livraison et de la pub. Les packs sont la solution. Par exemple : une coque à 3 000 FCFA, le pack coque + verre trempé + câble à 7 000 FCFA. Le livreur fait un trajet pour un montant qui couvre ses frais.',
      'Accessories are cheap: alone, they struggle to cover delivery and ad costs. Bundles are the answer. For example: a case at 3,000 FCFA, the case + screen protector + cable bundle at 7,000 FCFA. The courier makes one trip for an amount that covers costs.',
    ),
    h2('Confirmation et refus', 'Confirmation and refusals'),
    list([
      ['Reconfirme le modèle exact du téléphone et le type de prise.', 'Double check the exact phone model and connector type.'],
      ['Pour les power banks et écouteurs, rappelle les caractéristiques réelles pour éviter la déception.', 'For power banks and earbuds, restate real specs to avoid disappointment.'],
      ['Demande au livreur de laisser le client tester le chargeur ou les écouteurs à la livraison si possible.', 'Ask the courier to let customers test chargers or earbuds at delivery if possible.'],
    ], true),
    h2('Qualité, sécurité et garantie', 'Quality, safety and warranty'),
    p(
      'Un chargeur ou une batterie de mauvaise qualité peut chauffer et abîmer le téléphone. Teste un exemplaire de chaque lot avant de vendre, et retire les produits qui chauffent anormalement. Propose une petite garantie écrite (par exemple 7 jours) : elle rassure et elle t’oblige à choisir de bons fournisseurs.',
      'A poor quality charger or battery can overheat and damage the phone. Test one piece from each batch before selling, and pull anything that gets abnormally hot. Offer a short written warranty (for example 7 days): it reassures customers and forces you to pick good suppliers.',
    ),
    h2('Stock et emballage', 'Stock and packaging'),
    p(
      'Range par modèle de téléphone et note ce qui part. Les modèles récents changent vite : n’achète pas trop de coques pour un téléphone en fin de vie. Emballe dans un sachet fermé, avec l’étiquette du modèle compatible bien visible.',
      'Sort by phone model and note what sells. Recent models change fast: do not overbuy cases for a phone at the end of its life. Pack in a sealed bag with the compatible model label clearly visible.',
    ),
  ],
  adRules: ls([
    ['N’annonce pas « original Apple » ou « original Samsung » pour un accessoire qui ne l’est pas. C’est une contrefaçon au sens des règles Meta et TikTok.', 'Do not say "original Apple" or "original Samsung" for an accessory that is not. That counts as counterfeit under Meta and TikTok rules.'],
    ['Pas de logo de marque de téléphone sur tes produits ou visuels sans autorisation.', 'No phone brand logos on your products or visuals without permission.'],
    ['Pas de fausse capacité : un power bank « 30 000 mAh » doit vraiment avoir cette capacité. TikTok refuse les promesses trompeuses sur un produit.', 'No fake capacity: a "30,000 mAh" power bank must really have it. TikTok rejects misleading product claims.'],
    ['Ne promets pas de « charge en 5 minutes » ou d’autonomie irréaliste.', 'Do not promise "full charge in 5 minutes" or unrealistic battery life.'],
    ['Pas de fausses notifications ou de faux boutons dans tes visuels pour faire cliquer.', 'No fake notifications or fake buttons in your visuals to drive clicks.'],
  ]),
  faqs: [
    faq('Comment éviter les erreurs de modèle ?', 'How do I avoid wrong model orders?', 'Liste les modèles compatibles, crée une variante par modèle et demande au client une photo de son téléphone si il hésite.', 'List compatible models, create a variant per model and ask customers for a photo of their phone if unsure.'),
    faq('Les accessoires sont-ils rentables en COD ?', 'Are accessories profitable with COD?', 'Oui si tu vends en pack. Un accessoire seul à petit prix couvre mal la livraison et la pub.', 'Yes if you sell bundles. A single cheap accessory barely covers delivery and ads.'),
    faq('Puis-je écrire « original » sur mes chargeurs ?', 'Can I write "original" on my chargers?', 'Seulement s’ils viennent vraiment du fabricant du téléphone. Sinon, écris « compatible avec » suivi du modèle.', 'Only if they really come from the phone maker. Otherwise write "compatible with" plus the model.'),
    faq('Faut-il proposer une garantie ?', 'Should I offer a warranty?', 'Une courte garantie écrite rassure beaucoup, surtout pour les chargeurs, power banks et écouteurs.', 'A short written warranty reassures a lot, especially for chargers, power banks and earbuds.'),
  ],
  sources: [S.metaStd, S.metaTm, S.metaIp, S.ttIp, S.ttMisleading],
  related: ['trouver-produit-gagnant', 'calculer-marge-paiement-livraison', 'dropshipping-local-afrique'],
}

/* 8. Électroménager */
const electromenager: NichePage = {
  slug: l('electromenager', 'home-appliances'),
  icon: 'zap',
  accent: '#0F9D8A',
  name: l('Électroménager', 'Home appliances'),
  title: l('Vendre de l’électroménager en ligne en Afrique | Zuri', 'Sell home appliances online in Africa | Zuri'),
  description: l(
    'Vends ton électroménager en ligne en COD : démos vidéo, fiches claires, packs, confirmation, livraison des gros colis et garantie. Le guide pratique.',
    'Sell home appliances online with cash on delivery: video demos, clear specs, bundles, confirmation, bulky deliveries and warranties.',
  ),
  h1: l('Vendre de l’électroménager en ligne en Afrique', 'How to sell home appliances online in Africa'),
  intro: l(
    'Blenders, ventilateurs, fers à repasser, friteuses sans huile, bouilloires, petits frigos : l’électroménager se vend bien en ligne parce qu’une vidéo de démonstration explique tout. Mais ce sont des produits plus chers et parfois volumineux. Ce guide t’explique comment les présenter, les confirmer et les livrer sans mauvaise surprise.',
    'Blenders, fans, irons, air fryers, kettles, small fridges: home appliances sell well online because a demo video explains everything. But they cost more and can be bulky. This guide shows you how to present, confirm and deliver them without bad surprises.',
  ),
  why: ls([
    ['Un appareil utile au quotidien répond à un vrai besoin : gagner du temps en cuisine, avoir de l’air frais, repasser plus vite.', 'A useful everyday appliance meets a real need: saving time in the kitchen, staying cool, ironing faster.'],
    ['La vidéo de démonstration fait le travail du vendeur en boutique : le client voit l’appareil fonctionner.', 'A demo video does the shop assistant’s job: customers see the appliance working.'],
    ['Le paiement à la livraison rassure pour un achat plus cher : le client voit l’appareil, et peut le tester, avant de payer.', 'Cash on delivery reassures on a bigger purchase: customers see, and can test, the appliance before paying.'],
  ]),
  products: ls([
    ['Blenders et mixeurs', 'Blenders and mixers'],
    ['Ventilateurs rechargeables', 'Rechargeable fans'],
    ['Friteuses sans huile', 'Air fryers'],
    ['Fers à repasser et défroisseurs vapeur', 'Irons and garment steamers'],
    ['Bouilloires et cafetières', 'Kettles and coffee makers'],
    ['Plaques de cuisson électriques', 'Electric hot plates'],
    ['Robots de cuisine et hachoirs', 'Food processors and choppers'],
    ['Lampes solaires et rechargeables', 'Solar and rechargeable lamps'],
  ]),
  blocks: [
    h2('Démonstrations vidéo', 'Video demos'),
    p(
      'Pour l’électroménager, la vidéo est ton meilleur vendeur. Filme l’appareil en action dans une vraie cuisine ou un vrai salon : le blender qui mixe, la friteuse qui cuit, le ventilateur qui tourne. Montre le déballage, les accessoires fournis et la prise. Reste réaliste sur le bruit et la vitesse.',
      'For appliances, video is your best salesperson. Film the appliance in action in a real kitchen or living room: the blender mixing, the air fryer cooking, the fan running. Show unboxing, included accessories and the plug. Stay realistic about noise and speed.',
    ),
    h2('Une fiche produit claire', 'A clear product sheet'),
    table([
      [['Info', 'Detail'], ['Pourquoi c’est important', 'Why it matters']],
      [['Puissance et tension', 'Power and voltage'], ['Le client doit savoir si l’appareil marche sur son courant', 'Customers need to know it works on their power supply']],
      [['Type de prise', 'Plug type'], ['Évite les surprises à l’arrivée', 'Avoids surprises on arrival']],
      [['Dimensions et poids', 'Size and weight'], ['Le client vérifie la place chez lui', 'Customers check they have room']],
      [['Autonomie (si rechargeable)', 'Battery life (if rechargeable)'], ['Mesure-la toi-même', 'Measure it yourself']],
      [['Garantie', 'Warranty'], ['Rassure pour un achat plus cher', 'Reassures on a bigger purchase']],
    ]),
    h2('Variantes et packs', 'Variants and bundles'),
    p(
      'Propose les couleurs ou capacités en variantes (par exemple friteuse 4 litres ou 6 litres) avec leur prix et leur stock. Les packs logiques marchent bien : blender + gourde, friteuse + papier de cuisson, ventilateur + câble de recharge de rechange.',
      'Offer colors or capacities as variants (for example a 4 liter or 6 liter air fryer) with their own price and stock. Logical bundles work well: blender + bottle, air fryer + liners, fan + spare charging cable.',
    ),
    h2('Confirmation : un achat qui se réfléchit', 'Confirmation: a considered purchase'),
    p(
      'Pour un appareil cher, le client peut changer d’avis entre la commande et la livraison. Rappelle-le vite, reconfirme le modèle, la capacité, le prix total et la date. Un rappel la veille de la livraison limite les absences. Pour les gros montants, propose un acompte ou le paiement complet par Mobile Money.',
      'For an expensive appliance, customers can change their mind between order and delivery. Call back quickly, double check model, capacity, total price and date. A reminder the day before delivery cuts no shows. For big amounts, offer a deposit or full payment by Mobile Money.',
    ),
    tip(
      'Teste avant de livrer',
      'Test before delivering',
      'Branche chaque appareil avant de l’envoyer, ou au moins un exemplaire par lot. Un appareil qui ne s’allume pas devant le client, c’est un refus, un aller-retour payé et un mauvais avis.',
      'Plug in each appliance before shipping, or at least one per batch. An appliance that does not turn on in front of the customer means a refusal, a paid round trip and a bad review.',
    ),
    h2('Livraison des gros colis', 'Delivering bulky parcels'),
    list([
      ['Garde le carton d’origine et ajoute du calage si besoin.', 'Keep the original box and add padding if needed.'],
      ['Vérifie que ton livreur moto peut transporter le colis, sinon prévois un tricycle ou un taxi.', 'Check your motorbike courier can carry the parcel, otherwise plan a tricycle or taxi.'],
      ['Règle des frais de livraison plus élevés pour les gros articles, par ville.', 'Set higher delivery fees for bulky items, per city.'],
      ['Laisse le client brancher et tester devant le livreur si c’est possible.', 'Let the customer plug in and test in front of the courier if possible.'],
    ]),
    h2('Stock, garantie et service après-vente', 'Stock, warranty and after sales'),
    p(
      'Garde quelques pièces de rechange simples (lames, câbles, joints) et note les problèmes signalés par produit. Un fournisseur dont les appareils tombent souvent en panne te coûte plus cher qu’il ne te rapporte. Un bon service après-vente sur WhatsApp transforme un client en ambassadeur.',
      'Keep a few simple spare parts (blades, cables, seals) and track reported issues per product. A supplier whose appliances often fail costs you more than they earn you. Good after sales support on WhatsApp turns a customer into an ambassador.',
    ),
  ],
  adRules: ls([
    ['Pas de fausses caractéristiques (puissance, capacité, autonomie). TikTok refuse les pubs qui exagèrent l’effet d’un produit.', 'No fake specs (power, capacity, battery life). TikTok rejects ads that exaggerate what a product does.'],
    ['N’utilise pas le nom ou le logo d’une grande marque pour un appareil générique.', 'Do not use a big brand’s name or logo for a generic appliance.'],
    ['Ne promets pas d’effet minceur ou santé pour une friteuse sans huile ou un blender.', 'Do not promise slimming or health effects for an air fryer or blender.'],
    ['Pas de vidéo accélérée ou truquée qui montre un résultat impossible.', 'No sped up or faked video showing an impossible result.'],
    ['Pas de « garantie » annoncée que tu ne peux pas honorer.', 'No "warranty" announced that you cannot honor.'],
  ]),
  faqs: [
    faq('Comment rassurer pour un achat plus cher ?', 'How do I reassure buyers on a bigger purchase?', 'Une vraie vidéo de démonstration, une fiche claire, une garantie écrite et le droit de tester à la livraison.', 'A real demo video, a clear spec sheet, a written warranty and the right to test at delivery.'),
    faq('Comment livrer les appareils volumineux ?', 'How do I deliver bulky appliances?', 'Garde le carton d’origine, choisis un moyen de transport adapté et fixe des frais de livraison spécifiques aux gros colis.', 'Keep the original box, pick a suitable vehicle and set specific delivery fees for bulky items.'),
    faq('Faut-il demander un acompte ?', 'Should I ask for a deposit?', 'Pour les gros montants, un acompte par Mobile Money réduit les refus. Garde aussi le paiement à la livraison pour les clients qui préfèrent.', 'For big amounts, a Mobile Money deposit reduces refusals. Keep cash on delivery for customers who prefer it.'),
    faq('Que faire si l’appareil tombe en panne ?', 'What if the appliance breaks?', 'Applique ta garantie : échange ou réparation selon ce que tu as écrit. Note les pannes par fournisseur pour choisir les meilleurs.', 'Honor your warranty: exchange or repair as written. Track failures by supplier to keep the best ones.'),
  ],
  sources: [S.metaStd, S.metaTm, S.ttMisleading],
  related: ['integrer-mobile-money-site', 'reduire-retours-paiement-livraison', 'calculer-marge-paiement-livraison'],
}

/* 9. Produits bébé */
const produitsBebe: NichePage = {
  slug: l('produits-bebe', 'baby-products'),
  icon: 'shield',
  accent: '#5BB5E8',
  name: l('Produits bébé', 'Baby products'),
  title: l('Vendre des produits bébé en ligne en Afrique | Zuri', 'Sell baby products online in Africa | Zuri'),
  description: l(
    'Vends tes produits bébé en ligne en COD : sécurité, tailles par âge, packs naissance, confirmation et pubs responsables. Un guide simple pour les vendeurs.',
    'Sell baby products online with cash on delivery: safety, sizes by age, newborn bundles, confirmation and responsible ads. A simple seller guide.',
  ),
  h1: l('Vendre des produits bébé en ligne en Afrique, avec sérieux', 'How to sell baby products online in Africa, responsibly'),
  intro: l(
    'Vêtements de naissance, couches, porte-bébés, biberons, jouets d’éveil, produits de toilette : les parents achètent souvent en ligne parce que sortir avec un bébé n’est pas simple. Ils sont aussi très exigeants sur la sécurité. Ce guide t’aide à choisir tes produits, les présenter, confirmer et faire des pubs responsables.',
    'Newborn clothes, diapers, baby carriers, bottles, sensory toys, toiletries: parents often buy online because going out with a baby is hard. They are also very demanding about safety. This guide helps you choose, present and confirm products and run responsible ads.',
  ),
  why: ls([
    ['Les besoins de bébé changent tous les quelques mois : nouvelles tailles, nouveaux jouets, nouveaux accessoires. Un parent satisfait revient souvent.', 'A baby’s needs change every few months: new sizes, new toys, new accessories. A happy parent often comes back.'],
    ['Les naissances et les baptêmes sont des occasions de cadeau : la famille et les amis cherchent des coffrets prêts à offrir.', 'Births and baptisms are gift occasions: family and friends look for ready to give sets.'],
    ['La livraison à domicile rend service aux jeunes parents qui ont peu de temps.', 'Home delivery helps new parents who have little time.'],
  ]),
  products: ls([
    ['Packs naissance (bodies, pyjamas, bonnets)', 'Newborn bundles (bodysuits, sleepsuits, hats)'],
    ['Couches et lingettes en lot', 'Diapers and wipes in bulk'],
    ['Porte-bébés et écharpes de portage', 'Baby carriers and wraps'],
    ['Biberons, tétines et goupillons', 'Bottles, teats and brushes'],
    ['Jouets d’éveil adaptés à l’âge', 'Age appropriate sensory toys'],
    ['Baignoires et accessoires de bain', 'Baby baths and bath accessories'],
    ['Sacs à langer', 'Diaper bags'],
    ['Coffrets cadeaux de naissance', 'Newborn gift boxes'],
  ]),
  blocks: [
    h2('La sécurité d’abord', 'Safety first'),
    p(
      'Pour les produits bébé, la confiance passe par la sécurité. Choisis des fournisseurs sérieux, vérifie les étiquettes (âge conseillé, matières, avertissements) et évite les jouets avec de petites pièces pour les tout-petits. N’affirme jamais qu’un produit est « certifié » sans document qui le prouve.',
      'With baby products, trust comes from safety. Pick serious suppliers, check labels (recommended age, materials, warnings) and avoid toys with small parts for toddlers. Never claim a product is "certified" without a document proving it.',
    ),
    list([
      ['Indique l’âge conseillé pour chaque jouet et accessoire.', 'State the recommended age for every toy and accessory.'],
      ['Photographie l’étiquette et les avertissements du fabricant.', 'Photograph the label and the maker’s warnings.'],
      ['Retire tout produit cassé, coupant ou dont la peinture s’écaille.', 'Remove any product that is broken, sharp or has flaking paint.'],
    ]),
    h2('Tailles par âge et variantes', 'Sizes by age and variants'),
    p(
      'Les tailles bébé se lisent en mois (0-3 mois, 3-6 mois, 6-12 mois), mais les bébés grandissent à des rythmes différents. Ajoute la taille en centimètres et conseille de prendre un peu plus grand en cas de doute. Sur Zuri, chaque tranche d’âge peut être une variante avec son stock.',
      'Baby sizes go by months (0 to 3, 3 to 6, 6 to 12 months), but babies grow at different rates. Add the height in centimeters and suggest sizing up when in doubt. On Zuri each age range can be a variant with its own stock.',
    ),
    h2('Packs naissance et cadeaux', 'Newborn and gift bundles'),
    p(
      'Les packs sont très demandés : trousseau de naissance, kit de bain, coffret cadeau pour un baptême. Ils facilitent le choix pour les proches qui ne savent pas quoi offrir. Par exemple : un body à 2 500 FCFA, le pack de 5 bodies à 10 000 FCFA, le coffret naissance complet à 25 000 FCFA.',
      'Bundles are in high demand: newborn kit, bath kit, baptism gift box. They make choosing easy for relatives who do not know what to give. For example: one bodysuit at 2,500 FCFA, a 5 pack at 10,000 FCFA, a complete newborn box at 25,000 FCFA.',
    ),
    h2('Lait infantile : prudence', 'Infant formula: be careful'),
    p(
      'L’OMS a adopté un code international qui encadre la commercialisation des substituts du lait maternel, et beaucoup de pays l’ont repris dans leur loi. Si tu vends ce type de produit, renseigne-toi sur les règles de ton pays, ne fais pas de promotions agressives et ne présente jamais un lait comme meilleur que l’allaitement.',
      'WHO adopted an international code governing how breast milk substitutes are marketed, and many countries have written it into law. If you sell these products, check your country’s rules, avoid aggressive promotions and never present formula as better than breastfeeding.',
    ),
    h2('Confirmation et livraison', 'Confirmation and delivery'),
    list([
      ['Reconfirme l’âge du bébé, la taille, la couleur et le prix total.', 'Double check the baby’s age, size, color and total price.'],
      ['Pour un cadeau, note le nom et le numéro de la personne qui reçoit, et le bon moment.', 'For a gift, note the recipient’s name and number, and the right time.'],
      ['Emballe proprement dans un sachet fermé : les parents sont sensibles à l’hygiène.', 'Pack cleanly in a sealed bag: parents care about hygiene.'],
      ['Propose un créneau de livraison pratique : les jeunes parents sont souvent à la maison mais pas toujours disponibles.', 'Offer a convenient delivery slot: new parents are often home but not always free.'],
    ], true),
    tip(
      'Pas de retours sur l’hygiène',
      'No returns on hygiene items',
      'Biberons, tétines et produits de toilette ouverts ne se reprennent pas. Écris clairement ta règle d’échange avant la commande.',
      'Opened bottles, teats and toiletries cannot be taken back. State your exchange rule clearly before the order.',
    ),
    h2('Stock et confiance', 'Stock and trust'),
    p(
      'Vérifie les dates de péremption des couches, lingettes et produits de toilette, et vends d’abord les lots les plus anciens. Les avis de vrais parents comptent beaucoup : demande une photo du produit utilisé, sans montrer le visage du bébé si les parents préfèrent.',
      'Check expiry dates on diapers, wipes and toiletries, and sell the oldest batches first. Reviews from real parents count a lot: ask for a photo of the product in use, without the baby’s face if parents prefer.',
    ),
  ],
  adRules: ls([
    ['Ne joue pas sur la peur des parents (« Ton bébé est en danger si tu n’achètes pas… »).', 'Do not play on parents’ fears ("Your baby is at risk if you do not buy...").'],
    ['Pas d’allégation médicale : « soulage les coliques », « guérit l’érythème ». Les plateformes refusent les promesses médicales.', 'No medical claims: "relieves colic", "cures diaper rash". Platforms reject medical promises.'],
    ['Ne fais pas de promotion agressive pour le lait infantile : le code de l’OMS et beaucoup de lois nationales l’encadrent.', 'No aggressive promotion of infant formula: the WHO code and many national laws regulate it.'],
    ['N’annonce pas « certifié » ou « approuvé par les médecins » sans preuve.', 'Do not claim "certified" or "doctor approved" without proof.'],
    ['Ne publie pas de photos d’enfants sans l’accord des parents.', 'Do not post photos of children without parents’ consent.'],
    ['Pas de supposition sur la situation de la personne (« Tu es enceinte ? »). Meta refuse les pubs qui affirment un attribut personnel.', 'No assumptions about the viewer ("Are you pregnant?"). Meta rejects ads that assert personal attributes.'],
  ]),
  faqs: [
    faq('Quels produits bébé vendre pour commencer ?', 'Which baby products should I start with?', 'Les packs naissance, les vêtements par âge et les coffrets cadeaux sont simples à gérer. Évite au début les produits qui demandent des autorisations.', 'Newborn bundles, clothes by age and gift boxes are easy to handle. At first, avoid products that need authorizations.'),
    faq('Puis-je vendre du lait infantile en ligne ?', 'Can I sell infant formula online?', 'Renseigne-toi sur les règles de ton pays, car beaucoup reprennent le code de l’OMS. Dans tous les cas, pas de promotion agressive.', 'Check your country’s rules, as many follow the WHO code. Either way, no aggressive promotion.'),
    faq('Comment gérer les tailles bébé ?', 'How do I handle baby sizes?', 'Donne l’âge et la taille en centimètres, conseille de prendre plus grand en cas de doute, et crée une variante par tranche d’âge.', 'Give age and height in centimeters, suggest sizing up when unsure, and create a variant per age range.'),
    faq('Comment rassurer les parents ?', 'How do I reassure parents?', 'Montre les étiquettes, l’âge conseillé, des avis de vrais parents, et réponds vite à leurs questions sur WhatsApp.', 'Show labels, recommended age, real parent reviews, and answer their questions fast on WhatsApp.'),
  ],
  sources: [S.metaStd, S.metaAttr, S.ttHealth, S.whoCode],
  related: ['fetes-et-saisons-vente-en-ligne', 'page-de-vente-qui-convertit', 'script-confirmation-commande'],
}

/* 10. Sport et fitness */
const sportFitness: NichePage = {
  slug: l('sport-fitness', 'sport-fitness'),
  icon: 'target',
  accent: '#27AE60',
  name: l('Sport et fitness', 'Sport and fitness'),
  title: l('Vendre des articles de sport en ligne en Afrique | Zuri', 'Sell sport and fitness gear online in Africa | Zuri'),
  description: l(
    'Vends ton matériel de sport en ligne en COD : démos, tailles, packs, confirmation, livraison et pubs sans promesse minceur. Le guide pour les vendeurs.',
    'Sell sport and fitness gear online with cash on delivery: demos, sizes, bundles, confirmation, delivery and ads without weight loss promises.',
  ),
  h1: l('Vendre des articles de sport et de fitness en ligne en Afrique', 'How to sell sport and fitness gear online in Africa'),
  intro: l(
    'Tenues de sport, tapis, élastiques, haltères, cordes à sauter, ballons, maillots : de plus en plus de gens font du sport à la maison, au quartier ou en salle. Ce guide t’aide à présenter ton matériel, gérer tailles et poids, livrer des articles parfois lourds et surtout faire des pubs qui respectent les règles sur le poids et le corps.',
    'Sportswear, mats, resistance bands, dumbbells, jump ropes, balls, jerseys: more and more people work out at home, in the neighborhood or at the gym. This guide helps you present your gear, handle sizes and weights, deliver sometimes heavy items and, above all, run ads that respect the rules on weight and body image.',
  ),
  why: ls([
    ['Le sport à la maison demande peu de place et peu de matériel : tapis, élastiques, petits haltères. Ce sont des produits faciles à montrer en vidéo.', 'Home workouts need little space and little gear: mats, bands, small dumbbells. These are easy to show on video.'],
    ['Le football et les grandes compétitions créent des pics de demande pour les maillots, ballons et équipements.', 'Football and major tournaments create demand peaks for jerseys, balls and gear.'],
    ['Les tenues de sport se portent aussi au quotidien, ce qui élargit ta clientèle.', 'Sportswear is also worn every day, which widens your customer base.'],
  ]),
  products: ls([
    ['Tapis de sol et de yoga', 'Exercise and yoga mats'],
    ['Élastiques et bandes de résistance', 'Resistance bands'],
    ['Haltères et kettlebells', 'Dumbbells and kettlebells'],
    ['Cordes à sauter', 'Jump ropes'],
    ['Leggings et brassières de sport', 'Leggings and sports bras'],
    ['Ballons de football et de basket', 'Footballs and basketballs'],
    ['Maillots sans marque ou d’équipes locales autorisés', 'Unbranded or licensed local team jerseys'],
    ['Gourdes et sacs de sport', 'Water bottles and gym bags'],
  ]),
  blocks: [
    h2('Démos vidéo qui donnent envie de bouger', 'Demo videos that make people want to move'),
    p(
      'Montre l’exercice, pas la transformation. Une vidéo de 20 secondes où quelqu’un utilise les élastiques ou la corde à sauter à la maison, avec deux ou trois exercices simples, explique le produit mieux que tout. Montre aussi la qualité : épaisseur du tapis, poignées, coutures.',
      'Show the exercise, not the transformation. A 20 second video of someone using bands or a jump rope at home, with two or three simple moves, explains the product better than anything. Show quality too: mat thickness, handles, stitching.',
    ),
    h2('Tailles, poids et variantes', 'Sizes, weights and variants'),
    p(
      'Pour les vêtements, donne un tableau de tailles en centimètres. Pour le matériel, le poids ou la résistance est la variante clé (par exemple haltères de 2, 5 ou 10 kg, élastiques légers, moyens, forts). Sur Zuri, chaque option est une variante avec son prix et son stock.',
      'For clothing, give a size chart in centimeters. For equipment, weight or resistance is the key variant (for example 2, 5 or 10 kg dumbbells, light, medium, strong bands). On Zuri each option is a variant with its own price and stock.',
    ),
    h2('Packs et prix', 'Bundles and pricing'),
    list([
      ['Pack « sport à la maison » : tapis + élastiques + corde à sauter.', '"Home workout" bundle: mat + bands + jump rope.'],
      ['Pack tenue : legging + brassière, ou short + t-shirt.', 'Outfit bundle: leggings + sports bra, or shorts + t-shirt.'],
      ['Par exemple : élastiques seuls à 5 000 FCFA, pack maison complet à 15 000 FCFA.', 'For example: bands alone at 5,000 FCFA, full home bundle at 15,000 FCFA.'],
    ]),
    h2('Confirmation et refus', 'Confirmation and refusals'),
    p(
      'Reconfirme la taille pour les vêtements et le poids exact pour le matériel. Les refus viennent souvent d’une attente irréaliste créée par la pub : si tu promets des résultats rapides, le client sera déçu. Reste honnête dès le départ.',
      'Double check size for clothing and exact weight for equipment. Refusals often come from unrealistic expectations set by the ad: if you promise fast results, customers will be disappointed. Stay honest from the start.',
    ),
    h2('Livraison des articles lourds', 'Delivering heavy items'),
    p(
      'Les haltères et kettlebells sont lourds : vérifie avec ton livreur ce qu’il peut transporter et fixe des frais adaptés au poids. Emballe solidement pour éviter qu’un poids ne déchire le carton. Pour les ballons, livre-les gonflés ou avec une pompe, et dis-le dans la description.',
      'Dumbbells and kettlebells are heavy: check with your courier what they can carry and set fees that match the weight. Pack firmly so a weight does not tear the box. For balls, deliver them inflated or with a pump, and say so in the description.',
    ),
    tip(
      'Maillots : attention aux marques',
      'Jerseys: watch out for brands',
      'Les maillots de grands clubs et de sélections portent des marques et logos protégés. Vendre des copies expose ton compte publicitaire. Préfère des maillots sans marque, personnalisables, ou des produits officiels que tu peux justifier.',
      'Big club and national team jerseys carry protected brands and logos. Selling copies puts your ad account at risk. Go for unbranded, customizable jerseys, or official products you can prove.',
    ),
    h2('Stock et confiance', 'Stock and trust'),
    p(
      'Suis tes ventes par poids et par taille pour réassortir ce qui part. Partage des vidéos de vrais clients qui s’entraînent avec ton matériel, et propose quelques conseils d’exercices simples sur WhatsApp ou TikTok : ça crée une communauté qui revient.',
      'Track sales by weight and size to restock what moves. Share videos of real customers training with your gear, and post simple exercise tips on WhatsApp or TikTok: it builds a community that comes back.',
    ),
  ],
  adRules: ls([
    ['Pas d’avant/après de perte de poids côte à côte : Meta l’interdit pour les produits minceur.', 'No side by side weight loss before and after: Meta bans it for weight loss products.'],
    ['Ne promets pas « moins 10 kg en 2 semaines » ni des résultats garantis. TikTok refuse les promesses de poids irréalistes ou faciles.', 'Do not promise "lose 10 kg in 2 weeks" or guaranteed results. TikTok rejects unrealistic or easy weight claims.'],
    ['Ne dis pas qu’une ceinture de sudation ou un vêtement fait maigrir tout seul.', 'Do not say a sweat belt or garment makes you slim on its own.'],
    ['Pas de « Tu es en surpoids ? » ni de moquerie sur le corps : attributs personnels et body shaming sont refusés.', 'No "Are you overweight?" or body mocking: personal attributes and body shaming get rejected.'],
    ['Pour toute pub qui parle de poids, cible les 18 ans et plus, comme le demandent Meta et TikTok.', 'For any ad about weight, target 18 and over, as Meta and TikTok require.'],
    ['Pas de maillots ou équipements copiés avec logos de clubs ou de marques.', 'No copied jerseys or gear with club or brand logos.'],
    ['Pas de complément alimentaire présenté comme miracle.', 'No supplement presented as a miracle.'],
  ]),
  faqs: [
    faq('Puis-je montrer un avant/après dans mes pubs ?', 'Can I show a before and after in my ads?', 'Pas pour la perte de poids : Meta interdit les comparaisons côte à côte. Montre plutôt l’exercice et le produit en action.', 'Not for weight loss: Meta bans side by side comparisons. Show the exercise and the product in action instead.'),
    faq('Comment livrer des haltères ?', 'How do I deliver dumbbells?', 'Emballe solidement, vérifie ce que ton livreur peut porter et fixe des frais de livraison selon le poids.', 'Pack firmly, check what your courier can carry and set delivery fees by weight.'),
    faq('Puis-je vendre des maillots de clubs ?', 'Can I sell club jerseys?', 'Seulement des produits officiels que tu peux prouver. Les copies avec logo sont refusées en pub.', 'Only official products you can prove. Logo copies get rejected in ads.'),
    faq('Quels produits pour commencer ?', 'Which products to start with?', 'Le matériel léger pour le sport à la maison (tapis, élastiques, cordes) est facile à livrer et se montre bien en vidéo.', 'Light home workout gear (mats, bands, ropes) is easy to deliver and shows well on video.'),
  ],
  sources: [S.metaStd, S.metaAttr, S.metaHealth, S.ttWeight, S.metaTm],
  related: ['publicite-tiktok-afrique', 'trouver-produit-gagnant', 'fetes-et-saisons-vente-en-ligne'],
}

/* 11. Maison et déco */
const maisonDeco: NichePage = {
  slug: l('maison-deco', 'home-decor'),
  icon: 'store',
  accent: '#E07B39',
  name: l('Maison et déco', 'Home decor'),
  title: l('Vendre de la déco maison en ligne en Afrique | Zuri', 'Sell home decor online in Africa | Zuri'),
  description: l(
    'Vends ta déco et tes articles maison en ligne en COD : photos en situation, dimensions, packs, confirmation et emballage des objets fragiles.',
    'Sell home decor and homeware online with cash on delivery: lifestyle photos, dimensions, bundles, confirmation and packing fragile items.',
  ),
  h1: l('Vendre de la décoration et des articles maison en ligne en Afrique', 'How to sell home decor and homeware online in Africa'),
  intro: l(
    'Rideaux, draps, coussins, tapis, vaisselle, rangements, lampes, objets artisanaux : la maison est un marché où les clients aiment se faire plaisir, surtout avant les fêtes ou après un déménagement. Ce guide t’aide à montrer tes produits en situation, donner les bonnes dimensions et livrer les objets fragiles intacts.',
    'Curtains, bed sheets, cushions, rugs, tableware, storage, lamps, handmade pieces: home is a market where customers like to treat themselves, especially before holidays or after a move. This guide helps you show products in context, give the right dimensions and deliver fragile items intact.',
  ),
  why: ls([
    ['Les gens veulent une maison belle et pratique, et les réseaux sociaux donnent beaucoup d’idées. Une photo de salon bien décoré donne envie d’acheter.', 'People want a beautiful, practical home, and social media is full of ideas. A photo of a nicely styled living room makes people want to buy.'],
    ['Emménagement, mariage, fêtes de fin d’année, Tabaski ou Pâques : les occasions de refaire sa déco ou d’offrir sont nombreuses.', 'Moving in, weddings, year end holidays, Tabaski or Easter: there are many occasions to redecorate or give gifts.'],
    ['Les objets artisanaux locaux permettent de proposer des pièces uniques, difficiles à trouver ailleurs.', 'Local handmade pieces let you offer unique items that are hard to find elsewhere.'],
  ]),
  products: ls([
    ['Parures de draps et couvre-lits', 'Bed sheet sets and bedspreads'],
    ['Rideaux et voilages', 'Curtains and sheers'],
    ['Housses de coussin en wax ou bogolan', 'Wax print or bogolan cushion covers'],
    ['Tapis et paillassons', 'Rugs and doormats'],
    ['Services de vaisselle et verres', 'Tableware and glass sets'],
    ['Boîtes et paniers de rangement', 'Storage boxes and baskets'],
    ['Lampes et guirlandes lumineuses', 'Lamps and string lights'],
    ['Objets artisanaux : vannerie, poterie, sculptures', 'Handmade pieces: baskets, pottery, carvings'],
  ]),
  blocks: [
    h2('Photos en situation', 'Lifestyle photos'),
    p(
      'Un coussin seul sur fond blanc ne fait pas rêver. Montre-le sur un canapé, dans une vraie pièce, avec une bonne lumière. Ajoute ensuite une photo détaillée de la matière et une photo qui montre la taille réelle à côté d’un objet connu. Une courte vidéo de la pièce avant et après la déco donne une idée concrète.',
      'A cushion alone on a white background does not inspire. Show it on a sofa, in a real room, with good light. Then add a detail shot of the material and one showing real size next to a familiar object. A short video of the room before and after styling gives a concrete idea.',
    ),
    h2('Dimensions et matières', 'Dimensions and materials'),
    p(
      'La déception la plus fréquente : « je pensais que c’était plus grand ». Donne toujours les dimensions en centimètres, et pour les draps la taille de lit correspondante. Indique la matière (coton, polyester, bois, céramique) et l’entretien.',
      'The most common letdown: "I thought it was bigger". Always give dimensions in centimeters, and for sheets the matching bed size. State the material (cotton, polyester, wood, ceramic) and care instructions.',
    ),
    table([
      [['Produit', 'Product'], ['Info à donner', 'Info to give']],
      [['Draps', 'Sheets'], ['Taille de lit (par exemple 2 places, 160 x 200 cm)', 'Bed size (for example double, 160 x 200 cm)']],
      [['Rideaux', 'Curtains'], ['Largeur, hauteur, type de fixation', 'Width, height, hanging type']],
      [['Tapis', 'Rugs'], ['Longueur, largeur, épaisseur', 'Length, width, thickness']],
      [['Vaisselle', 'Tableware'], ['Nombre de pièces, va au micro-ondes ou non', 'Number of pieces, microwave safe or not']],
    ]),
    h2('Variantes, packs et ensembles', 'Variants, bundles and sets'),
    p(
      'Couleurs, tailles de lit et motifs se gèrent en variantes sur Zuri, chacune avec son stock et sa photo. Les ensembles coordonnés marchent bien : draps + taies + couvre-lit, ou 4 housses de coussin assorties. Par exemple : une housse à 3 500 FCFA, le lot de 4 à 12 000 FCFA.',
      'Colors, bed sizes and patterns are handled as variants on Zuri, each with its own stock and photo. Matching sets work well: sheets + pillowcases + bedspread, or 4 matching cushion covers. For example: one cover at 3,500 FCFA, a set of 4 at 12,000 FCFA.',
    ),
    h2('Confirmation et refus', 'Confirmation and refusals'),
    list([
      ['Reconfirme les dimensions, la couleur et le motif exact, avec une photo sur WhatsApp.', 'Double check dimensions, color and exact pattern, with a WhatsApp photo.'],
      ['Pour les draps, demande la taille du lit du client.', 'For sheets, ask the size of the customer’s bed.'],
      ['Préviens que les couleurs peuvent varier légèrement selon l’écran.', 'Mention that colors may vary slightly depending on the screen.'],
    ], true),
    h2('Emballer les objets fragiles', 'Packing fragile items'),
    p(
      'Vaisselle, verres, lampes et poteries cassent facilement. Emballe chaque pièce séparément dans du papier bulle ou du papier journal, cale bien dans un carton solide et écris « fragile ». Demande à ton livreur de transporter le colis à plat. Une pièce cassée coûte une livraison, un produit et un client.',
      'Tableware, glasses, lamps and pottery break easily. Wrap each piece separately in bubble wrap or newspaper, wedge it tightly in a sturdy box and write "fragile". Ask your courier to carry it flat. A broken piece costs a delivery, a product and a customer.',
    ),
    tip(
      'Vérifie devant le client',
      'Check in front of the customer',
      'Pour les objets fragiles, demande au livreur de laisser le client ouvrir le colis devant lui. En cas de casse, tu le sais tout de suite et tu peux organiser un remplacement.',
      'For fragile items, ask the courier to let the customer open the parcel in front of them. If something broke, you know straight away and can arrange a replacement.',
    ),
    h2('Stock et confiance', 'Stock and trust'),
    p(
      'Les articles volumineux prennent de la place : commence avec de petites quantités et réassortis ce qui part. Pour l’artisanat, explique qui fabrique et comment : c’est une vraie raison d’acheter chez toi. Publie les photos que tes clients t’envoient de leur intérieur, avec leur accord.',
      'Bulky items take up space: start with small quantities and restock what sells. For handmade items, explain who makes them and how: that is a real reason to buy from you. Post photos customers send of their homes, with their permission.',
    ),
  ],
  adRules: ls([
    ['N’utilise pas les photos de catalogues de grandes enseignes ou de créateurs sans autorisation.', 'Do not use photos from big retailers’ or designers’ catalogs without permission.'],
    ['Pas de copies de motifs ou de logos de marques déposées sur tes textiles.', 'No copies of trademarked patterns or logos on your textiles.'],
    ['Ne montre pas un produit plus grand ou plus beau qu’en réalité (montage, perspective trompeuse).', 'Do not show a product bigger or nicer than it really is (editing, misleading angles).'],
    ['Ne présente pas un objet industriel comme fait main.', 'Do not present a factory item as handmade.'],
    ['Pas de faux prix barré ni de faux stock limité.', 'No fake strike through prices or fake limited stock.'],
  ]),
  faqs: [
    faq('Comment éviter la déception sur la taille ?', 'How do I avoid size disappointment?', 'Donne les dimensions en centimètres et montre le produit à côté d’un objet connu ou dans une vraie pièce.', 'Give dimensions in centimeters and show the product next to a familiar object or in a real room.'),
    faq('Comment livrer de la vaisselle sans casse ?', 'How do I deliver tableware without breakage?', 'Emballe chaque pièce séparément, cale bien dans un carton solide, écris « fragile » et demande une ouverture devant le livreur.', 'Wrap each piece separately, wedge it in a sturdy box, write "fragile" and ask for opening in front of the courier.'),
    faq('Les objets artisanaux se vendent-ils en ligne ?', 'Do handmade items sell online?', 'Oui, surtout si tu racontes qui les fabrique et comment. Les pièces uniques donnent une raison d’acheter chez toi.', 'Yes, especially if you tell who makes them and how. Unique pieces give people a reason to buy from you.'),
    faq('Comment gérer les tailles de draps ?', 'How do I handle sheet sizes?', 'Crée une variante par taille de lit, avec les dimensions en centimètres et le stock de chacune.', 'Create a variant per bed size, with dimensions in centimeters and stock for each.'),
  ],
  sources: [S.metaStd, S.metaTm, S.ttIp, S.ttMisleading],
  related: ['fetes-et-saisons-vente-en-ligne', 'page-de-vente-qui-convertit', 'astuces-vendre-en-ligne'],
}

/* 12. Produits naturels */
const produitsNaturels: NichePage = {
  slug: l('produits-naturels', 'natural-products'),
  icon: 'globe',
  accent: '#6B8E23',
  name: l('Produits naturels', 'Natural products'),
  title: l('Vendre des produits naturels en ligne en Afrique | Zuri', 'Sell natural products online in Africa | Zuri'),
  description: l(
    'Vends karité, savon noir, huiles et tisanes en ligne en COD : étiquettes, conditionnement, packs, confirmation et pubs sans allégations santé.',
    'Sell shea butter, black soap, oils and herbal teas online with cash on delivery: labels, packaging, bundles, confirmation and claim free ads.',
  ),
  h1: l('Vendre des produits naturels en ligne en Afrique, sans fausses promesses', 'How to sell natural products online in Africa, without false promises'),
  intro: l(
    'Beurre de karité, savon noir, huile de coco, huile de baobab, moringa, bissap, tisanes, miel : les produits naturels d’Afrique ont une vraie demande, sur place et dans la diaspora. Ce guide t’aide à les présenter proprement, soigner l’étiquette et le conditionnement, et surtout à faire des pubs sans promesse de santé, car c’est là que la plupart des vendeurs se font bloquer.',
    'Shea butter, black soap, coconut oil, baobab oil, moringa, hibiscus, herbal teas, honey: African natural products are in real demand, locally and in the diaspora. This guide helps you present them properly, get labels and packaging right and, above all, run ads with no health promises, because that is where most sellers get blocked.',
  ),
  why: ls([
    ['Beaucoup de clients recherchent des produits simples, locaux, avec peu d’ingrédients, pour la peau, les cheveux ou la cuisine.', 'Many customers look for simple, local products with few ingredients, for skin, hair or cooking.'],
    ['Ces produits sont souvent fabriqués par des coopératives ou des artisans : tu peux raconter une vraie histoire d’origine.', 'These products are often made by cooperatives or artisans: you can tell a real origin story.'],
    ['Ils se rachètent régulièrement et se prêtent bien aux abonnements informels (« je te livre ton pot tous les mois »).', 'They get rebought regularly and suit informal subscriptions ("I deliver your jar every month").'],
  ]),
  products: ls([
    ['Beurre de karité brut ou parfumé', 'Raw or scented shea butter'],
    ['Savon noir africain', 'African black soap'],
    ['Huiles : coco, baobab, ricin, avocat', 'Oils: coconut, baobab, castor, avocado'],
    ['Feuilles et poudre de moringa', 'Moringa leaves and powder'],
    ['Bissap (hibiscus) séché et autres tisanes', 'Dried hibiscus and other herbal teas'],
    ['Miel local', 'Local honey'],
    ['Épices et poudres (gingembre, piment, soumbala)', 'Spices and powders (ginger, chili, soumbala)'],
    ['Coffrets découverte de produits naturels', 'Natural product discovery sets'],
  ]),
  blocks: [
    h2('Ce que tu peux dire, et ce que tu ne dois pas dire', 'What you can say, and what you must not say'),
    p(
      'C’est la règle la plus importante de ce métier. Tu peux décrire l’usage, l’origine, la texture, le goût et l’odeur. Tu ne dois pas promettre de soigner, guérir ou prévenir une maladie. Meta refuse les pubs qui prétendent guérir des maladies comme le diabète ou le cancer, même si l’affirmation vient d’un professionnel, et TikTok interdit les allégations médicales pour les produits de beauté.',
      'This is the most important rule in this trade. You can describe use, origin, texture, taste and scent. You must not promise to treat, cure or prevent a disease. Meta rejects ads claiming to cure diseases like diabetes or cancer, even when the claim comes from a professional, and TikTok bans medical claims for beauty products.',
    ),
    table([
      [['À éviter', 'Avoid'], ['À dire à la place', 'Say instead']],
      [['« Le moringa soigne le diabète »', '"Moringa cures diabetes"'], ['« Feuilles de moringa séchées, à ajouter à tes plats »', '"Dried moringa leaves to add to your dishes"']],
      [['« Le savon noir guérit l’acné »', '"Black soap cures acne"'], ['« Savon noir traditionnel pour la toilette du visage et du corps »', '"Traditional black soap for face and body washing"']],
      [['« Cette tisane fait baisser la tension »', '"This tea lowers blood pressure"'], ['« Infusion de bissap, à boire chaude ou glacée »', '"Hibiscus infusion, to drink hot or iced"']],
      [['« Le ricin fait repousser les cheveux »', '"Castor oil regrows hair"'], ['« Huile de ricin pour nourrir et assouplir les cheveux »', '"Castor oil to nourish and soften hair"']],
    ]),
    tip(
      'Pas de mélange « miracle »',
      'No "miracle" blends',
      'Évite de vendre des mélanges à avaler présentés comme traitements (pour la fertilité, la tension, le poids, la force sexuelle). En plus d’être refusés en pub, ils peuvent être dangereux et relever de la réglementation sur les médicaments.',
      'Avoid selling blends to swallow presented as treatments (for fertility, blood pressure, weight, sexual performance). Besides being rejected in ads, they can be dangerous and fall under medicine regulations.',
    ),
    h2('Étiquette et conditionnement', 'Labels and packaging'),
    p(
      'Un produit naturel vendu dans un sachet sans étiquette inspire peu confiance. Mets chaque produit dans un pot ou flacon propre et bien fermé, avec une étiquette simple : nom du produit, ingrédients, poids ou volume, origine, date de fabrication et de péremption, ton nom et ton numéro WhatsApp.',
      'A natural product sold in an unlabeled bag inspires little trust. Put each product in a clean, well sealed jar or bottle with a simple label: product name, ingredients, weight or volume, origin, production and expiry dates, your name and WhatsApp number.',
    ),
    list([
      ['Pots en plastique alimentaire ou verre, bien fermés.', 'Food grade plastic or glass jars, tightly closed.'],
      ['Une étiquette lisible, même imprimée simplement.', 'A readable label, even simply printed.'],
      ['Un numéro de lot pour retrouver la provenance en cas de problème.', 'A batch number to trace origin if there is an issue.'],
    ]),
    h2('Photos, vidéos et histoire du produit', 'Photos, videos and the product story'),
    p(
      'Montre la texture du karité, la mousse du savon noir, la couleur de l’huile au soleil. Raconte d’où vient le produit : la coopérative, la région, la façon de le préparer. Les clients de la diaspora aiment particulièrement retrouver les produits de chez eux avec leur histoire.',
      'Show the texture of the shea butter, the lather of the black soap, the color of the oil in sunlight. Tell where the product comes from: the cooperative, the region, how it is made. Diaspora customers especially love finding products from home with their story.',
    ),
    h2('Formats, packs et prix', 'Sizes, bundles and pricing'),
    p(
      'Propose plusieurs contenances en variantes sur Zuri (par exemple 100 g, 250 g, 500 g), et des coffrets routine : karité + savon noir + huile. Par exemple : savon noir à 2 000 FCFA, coffret de 3 produits à 7 500 FCFA. Les gros formats fidélisent les clients réguliers.',
      'Offer several sizes as variants on Zuri (for example 100 g, 250 g, 500 g), and routine boxes: shea + black soap + oil. For example: black soap at 2,000 FCFA, a 3 product box at 7,500 FCFA. Large sizes keep regulars loyal.',
    ),
    h2('Confirmation, livraison et stock', 'Confirmation, delivery and stock'),
    list([
      ['Reconfirme le produit, la contenance et le prix total.', 'Double check the product, size and total price.'],
      ['Ferme les pots avec du film et emballe les flacons d’huile dans un sachet pour éviter les fuites.', 'Seal jars with film and bag oil bottles to prevent leaks.'],
      ['Le karité fond à la chaleur : stocke au frais et préviens le client qu’il peut être plus mou à l’arrivée.', 'Shea melts in heat: store somewhere cool and tell customers it may arrive softer.'],
      ['Vends d’abord les lots les plus anciens et respecte les dates.', 'Sell the oldest batches first and respect dates.'],
    ], true),
  ],
  adRules: ls([
    ['Aucune promesse de guérison : diabète, tension, fertilité, cancer, infections. Meta refuse ces allégations, même venant d’un professionnel.', 'No cure claims: diabetes, blood pressure, fertility, cancer, infections. Meta rejects these claims, even from a professional.'],
    ['Pas d’allégation médicale pour les soins (« guérit l’acné », « fait repousser les cheveux »). TikTok les interdit pour les produits de beauté.', 'No medical claims for care products ("cures acne", "regrows hair"). TikTok bans them for beauty products.'],
    ['Pas de promesse minceur pour une tisane ou une poudre. Les plateformes encadrent strictement la perte de poids.', 'No slimming promises for a tea or powder. Platforms strictly regulate weight loss claims.'],
    ['Pas de « Tu as des problèmes de peau ? » ou « Tu n’arrives pas à avoir d’enfant ? » : ce sont des attributs personnels refusés par Meta.', 'No "Got skin problems?" or "Struggling to have a baby?": these are personal attributes Meta rejects.'],
    ['Ne présente pas un mélange éclaircissant comme naturel : Meta refuse les produits de blanchiment permanent et l’OMS alerte sur certains éclaircissants.', 'Do not present a lightening blend as natural: Meta rejects permanent whitening products and WHO warns about some lighteners.'],
    ['Pas de faux témoignages de « guérison ».', 'No fake "healing" testimonials.'],
  ]),
  faqs: [
    faq('Puis-je dire que mes produits sont bons pour la santé ?', 'Can I say my products are good for health?', 'Évite toute promesse de soin ou de guérison. Décris l’usage, l’origine et la qualité. C’est plus sûr pour tes clients et pour ton compte publicitaire.', 'Avoid any treatment or cure promise. Describe use, origin and quality. It is safer for customers and for your ad account.'),
    faq('Quelle étiquette mettre sur mes pots ?', 'What label should my jars have?', 'Nom, ingrédients, poids ou volume, origine, dates de fabrication et de péremption, numéro de lot et ton contact.', 'Name, ingredients, weight or volume, origin, production and expiry dates, batch number and your contact.'),
    faq('Comment vendre à la diaspora ?', 'How do I sell to the diaspora?', 'Raconte l’origine du produit, soigne l’emballage et propose le paiement par Mobile Money pour qu’un proche paie depuis l’étranger et fasse livrer la famille sur place.', 'Tell the product’s origin story, take care of packaging and offer Mobile Money so a relative abroad can pay and have family delivered locally.'),
    faq('Le karité fond pendant la livraison, que faire ?', 'Shea melts during delivery, what should I do?', 'Utilise des pots bien fermés, stocke au frais et préviens le client : le karité redevient solide au frais sans perdre ses qualités.', 'Use tightly sealed jars, store somewhere cool and tell customers: shea firms up again when cool without losing quality.'),
  ],
  sources: [S.metaStd, S.metaAttr, S.metaHealth, S.ttHealth, S.ttWeight, S.whoMercury],
  related: ['publicite-facebook-paiement-livraison', 'astuces-vendre-en-ligne', 'integrer-mobile-money-site'],
}

export const NICHES: NichePage[] = [
  vetements,
  chaussures,
  cosmetiques,
  perruques,
  bijoux,
  parfums,
  accessoiresTelephone,
  electromenager,
  produitsBebe,
  sportFitness,
  maisonDeco,
  produitsNaturels,
]
