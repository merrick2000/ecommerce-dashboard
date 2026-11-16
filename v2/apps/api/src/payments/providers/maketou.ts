import { httpJson, intAmount, type InitiateResult, type PaymentProviderClient, type PaymentRequest, type StatusResult } from '../types'

const BASE = 'https://api.maketou.net'

/** Maketou n'a pas de webhook : le job de réconciliation vérifie les paniers en attente. */
export class Maketou implements PaymentProviderClient {
  readonly name = 'maketou' as const
  constructor(private creds: { apiKey: string }) {}

  async initiate(req: PaymentRequest): Promise<InitiateResult> {
    if (!req.maketouProductId) return { status: 'failed', error: 'Identifiant Maketou non configuré pour ce produit' }
    const [first, ...rest] = (req.customerName ?? 'Client').trim().split(/\s+/)
    const { status, data } = await httpJson(`${BASE}/api/v1/stores/cart/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.creds.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productDocumentId: req.maketouProductId,
        email: req.customerEmail,
        firstName: first,
        lastName: rest.join(' ') || '.',
        phone: req.phone,
        redirectURL: req.returnUrl,
        customerPrice: intAmount(req.amount),
        meta: { order_id: String(req.orderId) },
      }),
      timeoutMs: 30_000,
    })
    if (status === 201 && data?.cart?.id && data?.redirectUrl) return { status: 'redirect', ref: String(data.cart.id), redirectUrl: data.redirectUrl }
    return { status: 'failed', error: data?.message ?? data?.code ?? `Maketou HTTP ${status}`, raw: data }
  }

  async checkStatus(ref: string): Promise<StatusResult> {
    const { ok, data } = await httpJson(`${BASE}/api/v1/stores/cart/${encodeURIComponent(ref)}`, { headers: { Authorization: `Bearer ${this.creds.apiKey}` }, timeoutMs: 15_000 })
    if (!ok) return { status: 'pending', raw: data }
    const s = String(data?.status ?? '')
    return { status: s === 'completed' ? 'paid' : ['payment_failed', 'abandoned'].includes(s) ? 'failed' : 'pending', raw: { status: s } }
  }

  webhookRef(): string | null {
    return null
  }
}
