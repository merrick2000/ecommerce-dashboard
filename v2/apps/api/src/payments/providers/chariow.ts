import { digits, httpJson, type InitiateResult, type PaymentProviderClient, type PaymentRequest, type StatusResult } from '../types'

const BASE = 'https://api.chariow.com/v1'

export class Chariow implements PaymentProviderClient {
  readonly name = 'chariow' as const
  constructor(private creds: { apiKey: string }) {}

  async initiate(req: PaymentRequest): Promise<InitiateResult> {
    if (!req.chariowProductId) return { status: 'failed', error: 'Identifiant Chariow non configuré pour ce produit' }
    const [first, ...rest] = (req.customerName ?? 'Client').trim().split(/\s+/)
    const { ok, status, data } = await httpJson(`${BASE}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.creds.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: req.chariowProductId,
        email: req.customerEmail,
        first_name: first,
        last_name: rest.join(' '),
        phone: { number: digits(req.phone), country_code: req.country },
        redirect_url: req.returnUrl,
        payment_currency: req.currency,
        custom_metadata: { order_id: String(req.orderId) },
      }),
      timeoutMs: 30_000,
    })
    if (!ok) return { status: 'failed', error: data?.message ?? `Chariow HTTP ${status}`, raw: data }
    const step = data?.data?.step
    const saleId = data?.data?.purchase?.id
    if (step === 'payment' && saleId && data?.data?.payment?.checkout_url) return { status: 'redirect', ref: String(saleId), redirectUrl: data.data.payment.checkout_url }
    if (step === 'completed' && saleId) return { status: 'processing', ref: String(saleId) }
    if (step === 'already_purchased') return { status: 'failed', error: 'Ce client a déjà acheté ce produit' }
    return { status: 'failed', error: `Chariow : réponse inattendue (${step ?? 'aucune étape'})`, raw: data }
  }

  async checkStatus(ref: string): Promise<StatusResult> {
    const { ok, data } = await httpJson(`${BASE}/sales/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${this.creds.apiKey}` }, timeoutMs: 15_000 })
    if (!ok) return { status: 'pending', raw: data }
    const s = String(data?.data?.status ?? '')
    return { status: ['completed', 'settled'].includes(s) ? 'paid' : ['failed', 'abandoned'].includes(s) ? 'failed' : 'pending', raw: { status: s } }
  }

  webhookRef(payload: any): string | null {
    const id = payload?.data?.purchase?.id ?? payload?.data?.sale?.id ?? payload?.data?.id
    return id ? String(id) : null
  }
}
