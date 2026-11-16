import type { ProviderMode } from '../types'
import { digits, httpJson, intAmount, type InitiateResult, type PaymentProviderClient, type PaymentRequest, type StatusResult } from '../types'

export class PayDunya implements PaymentProviderClient {
  readonly name = 'paydunya' as const
  private base: string
  constructor(
    private creds: { masterKey: string; publicKey: string; privateKey: string; token: string },
    mode: ProviderMode,
  ) {
    this.base = mode === 'live' ? 'https://app.paydunya.com/api/v1' : 'https://app.paydunya.com/sandbox-api/v1'
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': this.creds.masterKey,
      'PAYDUNYA-PUBLIC-KEY': this.creds.publicKey,
      'PAYDUNYA-PRIVATE-KEY': this.creds.privateKey,
      'PAYDUNYA-TOKEN': this.creds.token,
    }
  }

  async initiate(req: PaymentRequest): Promise<InitiateResult> {
    const amount = intAmount(req.amount)
    const inv = await httpJson(`${this.base}/checkout-invoice/create`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        invoice: { items: { item_0: { name: `Commande ${req.orderNumber}`, quantity: 1, unit_price: amount, total_price: amount } }, total_amount: amount, description: `Commande ${req.orderNumber}` },
        store: { name: 'Sellit' },
        custom_data: { order_id: String(req.orderId) },
        actions: { callback_url: req.webhookUrl, return_url: req.returnUrl, cancel_url: req.returnUrl },
      }),
    })
    if (!inv.ok || inv.data?.response_code !== '00' || !inv.data?.token) return { status: 'failed', error: inv.data?.response_text ?? `PayDunya HTTP ${inv.status}`, raw: inv.data }
    const invoiceToken: string = inv.data.token
    const invoiceUrl: string | undefined = typeof inv.data.response_text === 'string' && inv.data.response_text.startsWith('http') ? inv.data.response_text : undefined

    // Paiement sans redirection (OPR) : le client reçoit un code par SMS.
    const opr = await httpJson(`${this.base}/opr/create`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ invoice_token: invoiceToken, account_alias: digits(req.phone) }) })
    if (opr.ok && opr.data?.response_code === '00' && opr.data?.token) {
      return { status: 'otp_required', ref: invoiceToken, otp: { flow: 'paydunya_opr', oprToken: opr.data.token } }
    }
    if (invoiceUrl) return { status: 'redirect', ref: invoiceToken, redirectUrl: invoiceUrl }
    return { status: 'failed', error: opr.data?.response_text ?? 'PayDunya : échec OPR', raw: opr.data }
  }

  async confirmOtp(_req: PaymentRequest, ref: string, otp: string, otpData: Record<string, unknown>): Promise<InitiateResult> {
    const { ok, data } = await httpJson(`${this.base}/opr/charge`, { method: 'POST', headers: this.headers(), body: JSON.stringify({ token: otpData.oprToken, confirm_token: otp }) })
    if (!ok || data?.response_code !== '00') return { status: 'failed', error: data?.response_text ?? 'Code invalide', raw: data }
    // La confirmation définitive passe par checkStatus (jamais crue sur parole).
    return { status: 'processing', ref }
  }

  async checkStatus(ref: string): Promise<StatusResult> {
    const { ok, data } = await httpJson(`${this.base}/checkout-invoice/confirm/${encodeURIComponent(ref)}`, { headers: this.headers(), timeoutMs: 8000 })
    if (!ok) return { status: 'pending', raw: data }
    const s = String(data?.status ?? '')
    const amount = Number(data?.invoice?.total_amount)
    return { status: s === 'completed' ? 'paid' : ['failed', 'cancelled'].includes(s) ? 'failed' : 'pending', amount: Number.isFinite(amount) && amount > 0 ? amount : undefined, raw: { status: s } }
  }

  webhookRef(payload: any): string | null {
    const d = payload?.data ?? payload
    const ref = d?.invoice?.token ?? d?.token
    return ref ? String(ref) : null
  }
}
