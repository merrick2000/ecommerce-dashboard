/** Offre de lancement : date limite d'inscription et textes associés. Tout se masque automatiquement après la date. */
export const OFFER_DEADLINE = '2026-11-30T23:59:59Z'
export const offerActive = (now = Date.now()) => now < Date.parse(OFFER_DEADLINE)
export const OFFER = {
  fr: {
    short: 'Offre de lancement : inscris-toi avant le 30 novembre, ton premier mois est offert.',
    deadline: '30 novembre, 23 h 59 (GMT)',
    left: 'Il reste',
    units: ['j', 'h', 'min', 's'],
    cta: 'J’en profite',
    title: 'Avant le 30 novembre, tout est offert.',
    text: 'Après le 30 novembre, Zuri devient payant. Inscris-toi maintenant : ton premier mois est offert, avec toutes les fonctions et 0 % de commission.',
    points: ['1 mois offert, sans carte bancaire', 'Toutes les fonctions incluses', 'Le guide 2026 offert : produit gagnant et pub Facebook'],
  },
  en: {
    short: 'Launch offer: sign up before November 30 and your first month is free.',
    deadline: 'November 30, 11:59 pm (GMT)',
    left: 'Ends in',
    units: ['d', 'h', 'min', 's'],
    cta: 'Claim it',
    title: 'Before November 30, everything is free.',
    text: 'After November 30, Zuri becomes a paid service. Sign up now: your first month is free, with every feature and 0% commission.',
    points: ['1 month free, no credit card', 'Every feature included', 'Free 2026 guide: winning products and Facebook ads'],
  },
}
