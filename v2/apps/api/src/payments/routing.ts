/** Pays → réseau → providers, par ordre de priorité (repli automatique). Repris de config/payment.php. */
export const ROUTING: Record<string, Record<string, string[]>> = {
  BJ: { mtn: ['feexpay', 'fedapay', 'paydunya', 'pawapay'], moov: ['feexpay', 'fedapay', 'paydunya', 'pawapay'], celtiis: ['feexpay'] },
  TG: { tmoney: ['feexpay', 'paydunya'], moov: ['feexpay', 'fedapay', 'paydunya', 'pawapay'] },
  SN: { wave: ['paydunya', 'pawapay'], orange: ['feexpay', 'paydunya', 'pawapay'], free: ['feexpay', 'paydunya', 'pawapay'] },
  CI: { mtn: ['feexpay', 'fedapay', 'paydunya', 'pawapay'], moov: ['feexpay', 'fedapay', 'paydunya', 'pawapay'], orange: ['feexpay', 'paydunya', 'pawapay'], wave: ['feexpay', 'paydunya', 'pawapay'] },
  BF: { orange: ['paydunya', 'pawapay'], moov: ['paydunya', 'pawapay'] },
  CM: { mtn: ['paydunya', 'pawapay'], orange: ['pawapay'] },
  CG: { mtn: ['feexpay', 'pawapay'], airtel: ['pawapay'] },
  GH: { mtn: ['pawapay'], airteltigo: ['pawapay'], telecel: ['pawapay'] },
  NG: { mtn: ['pawapay'], airtel: ['pawapay'] },
  SL: { orange: ['pawapay'], africell: ['pawapay'] },
  GA: { airtel: ['pawapay'] },
  CD: { vodacom: ['pawapay'], airtel: ['pawapay'], orange: ['pawapay'] },
  ET: { telebirr: ['pawapay'], mpesa: ['pawapay'] },
  KE: { mpesa: ['pawapay'] },
  RW: { mtn: ['pawapay'], airtel: ['pawapay'] },
  TZ: { vodacom: ['pawapay'], airtel: ['pawapay'], tigo: ['pawapay'], halopesa: ['pawapay'] },
  UG: { mtn: ['pawapay'], airtel: ['pawapay'] },
  LS: { vodacom: ['pawapay'] },
  MW: { airtel: ['pawapay'], tnm: ['pawapay'] },
  MZ: { vodacom: ['pawapay'], movitel: ['pawapay'] },
  ZM: { mtn: ['pawapay'], airtel: ['pawapay'], zamtel: ['pawapay'] },
}

export const PAWAPAY_CORRESPONDENTS: Record<string, string> = {
  BJ_mtn: 'MTN_MOMO_BEN', BJ_moov: 'MOOV_BEN', TG_mtn: 'MTN_MOMO_TGO', TG_moov: 'MOOV_TGO',
  SN_wave: 'WAVE_SEN', SN_orange: 'ORANGE_SEN', SN_free: 'FREE_SEN',
  CI_mtn: 'MTN_MOMO_CIV', CI_moov: 'MOOV_CIV', CI_orange: 'ORANGE_CIV', CI_wave: 'WAVE_CIV',
  BF_orange: 'ORANGE_BFA', BF_moov: 'MOOV_BFA', CM_mtn: 'MTN_MOMO_CMR', CM_orange: 'ORANGE_CMR',
  CG_mtn: 'MTN_MOMO_COG', CG_airtel: 'AIRTEL_COG', GH_mtn: 'MTN_MOMO_GHA', GH_airteltigo: 'AIRTELTIGO_GHA', GH_telecel: 'TELECEL_GHA',
  NG_mtn: 'MTN_MOMO_NGA', NG_airtel: 'AIRTEL_NGA', SL_orange: 'ORANGE_SLE', SL_africell: 'AFRICELL_SLE', GA_airtel: 'AIRTEL_GAB',
  CD_vodacom: 'VODACOM_COD', CD_airtel: 'AIRTEL_COD', CD_orange: 'ORANGE_COD', ET_telebirr: 'TELEBIRR_ETH', ET_mpesa: 'MPESA_ETH',
  KE_mpesa: 'MPESA_KEN', RW_mtn: 'MTN_MOMO_RWA', RW_airtel: 'AIRTEL_RWA',
  TZ_vodacom: 'VODACOM_TZA', TZ_airtel: 'AIRTEL_TZA', TZ_tigo: 'TIGO_TZA', TZ_halopesa: 'HALOPESA_TZA',
  UG_mtn: 'MTN_MOMO_UGA', UG_airtel: 'AIRTEL_UGA', LS_vodacom: 'VODACOM_LSO', MW_airtel: 'AIRTEL_MWI', MW_tnm: 'TNM_MWI',
  MZ_vodacom: 'VODACOM_MOZ', MZ_movitel: 'MOVITEL_MOZ', ZM_mtn: 'MTN_MOMO_ZMB', ZM_airtel: 'AIRTEL_ZMB', ZM_zamtel: 'ZAMTEL_ZMB',
}

/** Indicatifs pour TOUS les pays routés (l'ancien code n'en connaissait que 6). */
export const DIAL_CODES: Record<string, string> = {
  BJ: '229', TG: '228', SN: '221', CI: '225', BF: '226', CM: '237', CG: '242', GH: '233', NG: '234', SL: '232', GA: '241',
  CD: '243', ET: '251', KE: '254', RW: '250', TZ: '255', UG: '256', LS: '266', MW: '265', MZ: '258', ZM: '260', ML: '223', NE: '227', GN: '224',
}

/** Format international sans « + » ni zéro national, tel qu'attendu par les opérateurs. */
export function toMsisdn(phone: string, country: string): string {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  const code = DIAL_CODES[country]
  if (!code || d.startsWith(code)) return d
  return code + d.replace(/^0+/, '')
}

/** Numéro local (sans indicatif), certains providers (FeexPay) le veulent ainsi ou avec indicatif selon le pays. */
export function toLocal(phone: string, country: string): string {
  const full = toMsisdn(phone, country)
  const code = DIAL_CODES[country]
  return code && full.startsWith(code) ? full.slice(code.length) : full
}
