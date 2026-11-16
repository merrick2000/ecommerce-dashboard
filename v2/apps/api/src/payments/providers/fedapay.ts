import type { ProviderMode } from '../types'
import { digits, httpJson, intAmount, type InitiateResult, type PaymentProviderClient, type PaymentRequest, type StatusResult } from '../types'

const mapStatus = (s: string): StatusResult['status'] => (['approved', 'transferred'].includes(s) ? 'paid' : ['declined', 'canceled', 'refunded', 'expired'].includes(s) ? 'failed' : 'pending')

export class FedaPay implements PaymentProviderClient {
  readonly name = 'fedapay' as const
  private base: string
  constructor(
    private creds: { apiKey: string },
    mode: ProviderMode,
  ) {
    this.base = mode === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1'
  }

  private headers() {
    return { Authorization: `Bearer ${this.creds.apiKey}`, 'Content-Type': 'application/json' }
  }

  async initiate(req: PaymentRequest): Promise<InitiateResult> {
    const tx = await httpJson(`${this.base}/transactions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        description: `Commande ${req.orderNumber}`,
        amount: intAmount(req.amount),
        currency: { iso: req.currency },
        callback_url: req.returnUrl,
        customer: { firstname: req.customerName ?? 'Client', email: req.customerEmail ?? undefined, phone_number: { number: digits(req.phone), country: req.country.toLowerCase() } },
      }),
    })
    if (!tx.ok) return { status: 'failed', error: `FedaPay HTTP ${tx.status}`, raw: tx.data }
    const id = tx.data?.['v1/transaction']?.id ?? tx.data?.v1?.transaction?.id ?? tx.data?.transaction?.id
    if (!id) return { status: 'failed', error: 'FedaPay : transaction sans identifiant', raw: tx.data }
    const token = await httpJson(`${this.base}/transactions/${id}/token`, { method: 'POST', headers: this.headers(), body: '{}' })
    if (!token.ok || !token.data?.url) return { status: 'failed', error: `FedaPay token HTTP ${token.status}`, raw: token.data }
    return { status: 'redirect', ref: String(id), redirectUrl: token.data.url, raw: { id } }
  }

  async checkStatus(ref: string): Promise<StatusResult> {
    const { ok, data } = await httpJson(`${this.base}/transactions/${encodeURIComponent(ref)}`, { headers: this.headers(), timeoutMs: 8000 })
    if (!ok) return { status: 'pending', raw: data }
    const t = data?.['v1/transaction'] ?? data?.v1?.transaction ?? data?.transaction ?? {}
    return { status: mapStatus(String(t.status ?? '')), amount: typeof t.amount === 'number' ? t.amount : undefined, raw: { status: t.status, amount: t.amount } }
  }

  webhookRef(payload: any): string | null {
    const id = payload?.entity?.id ?? payload?.id
    return id ? String(id) : null
  }
}
