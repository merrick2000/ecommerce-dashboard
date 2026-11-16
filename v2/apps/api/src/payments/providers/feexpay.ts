import { digits, httpJson, intAmount, type InitiateResult, type PaymentProviderClient, type PaymentRequest, type StatusResult } from '../types'

const BASE = 'https://api.feexpay.me/api' // même URL en sandbox et live : c'est la clé qui détermine l'environnement

const ENDPOINTS: Record<string, string> = {
  BJ_mtn: 'mtn', BJ_moov: 'moov', BJ_celtiis: 'celtiis_bj',
  CI_mtn: 'mtn_ci', CI_moov: 'moov_ci', CI_orange: 'orange_ci', CI_wave: 'wave_ci',
  SN_orange: 'orange_sn', SN_free: 'free_sn',
  TG_tmoney: 'togocom_tg', TG_moov: 'moov_tg',
  CG_mtn: 'mtn_cg',
}
/** Orange Sénégal : le client doit d'abord générer un code via USSD. */
const PRE_OTP = new Set(['SN_orange'])

const mapStatus = (s: string): StatusResult['status'] => (['SUCCESSFUL', 'SUCCESS'].includes(s) ? 'paid' : ['FAILED', 'CANCELLED'].includes(s) ? 'failed' : 'pending')

export class FeexPay implements PaymentProviderClient {
  readonly name = 'feexpay' as const
  constructor(private creds: { apiKey: string; shopId: string }) {}

  private async pay(req: PaymentRequest, otp?: string): Promise<InitiateResult> {
    const key = `${req.country}_${req.network}`
    const endpoint = ENDPOINTS[key]
    if (!endpoint) return { status: 'failed', error: `FeexPay ne gère pas ${req.country}/${req.network}` }
    const body: Record<string, unknown> = { shop: this.creds.shopId, amount: intAmount(req.amount), phoneNumber: digits(req.phone), description: `Commande ${req.orderNumber}` }
    if (otp) body.otp = otp
    if (key === 'SN_free') body.return_url = req.returnUrl
    const { ok, status, data } = await httpJson(`${BASE}/transactions/public/requesttopay/${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.creds.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!ok) return { status: 'failed', error: `FeexPay HTTP ${status}`, raw: data }
    const ref = data?.reference ?? data?.id
    // Pas de référence = impossible de vérifier le paiement ensuite : on refuse (l'ancien code inventait « feex_<id> »).
    if (!ref) return { status: 'failed', error: 'FeexPay : aucune référence renvoyée', raw: data }
    if (data.payment_url) return { status: 'redirect', ref: String(ref), redirectUrl: data.payment_url, raw: data }
    return { status: 'processing', ref: String(ref), raw: data }
  }

  async initiate(req: PaymentRequest): Promise<InitiateResult> {
    const key = `${req.country}_${req.network}`
    if (PRE_OTP.has(key)) {
      return { status: 'otp_required', ref: `pending:${req.orderId}`, otp: { flow: 'feexpay_pre_otp', ussdInstruction: `#144*${intAmount(req.amount)}*${digits(req.phone)}#` } }
    }
    return this.pay(req)
  }

  confirmOtp(req: PaymentRequest, _ref: string, otp: string) {
    return this.pay(req, otp)
  }

  async checkStatus(ref: string): Promise<StatusResult> {
    const { ok, data } = await httpJson(`${BASE}/transactions/${encodeURIComponent(ref)}/status`, { headers: { Authorization: `Bearer ${this.creds.apiKey}` }, timeoutMs: 8000 })
    if (!ok) return { status: 'pending', raw: data }
    const amount = Number(data?.amount)
    return { status: mapStatus(String(data?.status ?? '').toUpperCase()), amount: Number.isFinite(amount) && amount > 0 ? amount : undefined, raw: data }
  }

  webhookRef(payload: any): string | null {
    const ref = payload?.reference ?? payload?.id
    return ref ? String(ref) : null
  }
}
