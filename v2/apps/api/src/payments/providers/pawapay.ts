import { PAWAPAY_CORRESPONDENTS, toMsisdn } from '../routing'
import type { ProviderMode } from '../types'
import { httpJson, intAmount, type InitiateResult, type PaymentProviderClient, type PaymentRequest, type StatusResult } from '../types'

export class PawaPay implements PaymentProviderClient {
  readonly name = 'pawapay' as const
  private base: string
  constructor(
    private creds: { apiKey: string },
    mode: ProviderMode,
  ) {
    this.base = mode === 'live' ? 'https://api.pawapay.cloud' : 'https://api.sandbox.pawapay.cloud'
  }

  async initiate(req: PaymentRequest): Promise<InitiateResult> {
    const correspondent = PAWAPAY_CORRESPONDENTS[`${req.country}_${req.network}`]
    if (!correspondent) return { status: 'failed', error: `PawaPay ne gère pas ${req.country}/${req.network}` }
    const depositId = crypto.randomUUID()
    const { ok, status, data } = await httpJson(`${this.base}/deposits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.creds.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositId,
        amount: String(intAmount(req.amount)),
        currency: req.currency,
        correspondent,
        payer: { type: 'MSISDN', address: { value: toMsisdn(req.phone, req.country) } },
        customerTimestamp: new Date().toISOString(),
        statementDescription: `Cmd ${req.orderNumber}`.slice(0, 22),
      }),
    })
    if (!ok) return { status: 'failed', error: `PawaPay HTTP ${status}`, raw: data }
    if (['ACCEPTED', 'ENQUEUED'].includes(data?.status)) return { status: 'processing', ref: depositId, raw: data }
    return { status: 'failed', error: data?.rejectionReason?.rejectionMessage ?? `PawaPay : ${data?.status}`, raw: data }
  }

  async checkStatus(ref: string): Promise<StatusResult> {
    const { ok, data } = await httpJson(`${this.base}/deposits/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${this.creds.apiKey}` }, timeoutMs: 8000 })
    if (!ok) return { status: 'pending', raw: data }
    const d = Array.isArray(data) ? data[0] : data
    const s = String(d?.status ?? '')
    const amount = Number(d?.depositedAmount ?? d?.requestedAmount)
    return { status: s === 'COMPLETED' ? 'paid' : ['FAILED', 'REJECTED', 'CANCELLED'].includes(s) ? 'failed' : 'pending', amount: Number.isFinite(amount) && amount > 0 ? amount : undefined, raw: { status: s } }
  }

  webhookRef(payload: any): string | null {
    return payload?.depositId ? String(payload.depositId) : null
  }
}
