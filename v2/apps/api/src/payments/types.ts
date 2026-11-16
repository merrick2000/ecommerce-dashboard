import type { PaymentProvider } from '@sellit/shared'

export type ProviderMode = 'sandbox' | 'live'

export interface PaymentRequest {
  orderId: number
  orderNumber: string
  amount: number
  currency: string
  phone: string
  country: string
  network: string
  customerName: string | null
  customerEmail: string | null
  /** Où renvoyer le client après un paiement hébergé (page commande du storefront). */
  returnUrl: string
  /** URL de webhook propre au compte de la boutique. */
  webhookUrl: string
  /** Identifiants produit chez les plateformes hébergées (Chariow/Maketou). */
  chariowProductId?: string | null
  maketouProductId?: string | null
}

export type InitiateResult =
  | { status: 'processing'; ref: string; message?: string; raw?: unknown }
  | { status: 'redirect'; ref: string; redirectUrl: string; raw?: unknown }
  | { status: 'otp_required'; ref: string; otp: { flow: string; ussdInstruction?: string; oprToken?: string }; raw?: unknown }
  | { status: 'failed'; error: string; raw?: unknown }

export interface StatusResult {
  status: 'paid' | 'failed' | 'pending'
  /** Montant confirmé par le provider, quand son API le renvoie : vérifié contre la commande. */
  amount?: number
  raw?: unknown
}

export interface PaymentProviderClient {
  readonly name: PaymentProvider
  initiate(req: PaymentRequest): Promise<InitiateResult>
  checkStatus(ref: string): Promise<StatusResult>
  /** Extrait la référence d'un webhook. Le statut n'est JAMAIS cru : on revérifie via checkStatus. */
  webhookRef(payload: unknown): string | null
  confirmOtp?(req: PaymentRequest, ref: string, otp: string, otpData: Record<string, unknown>): Promise<InitiateResult>
}

export class ProviderHttpError extends Error {}

/** fetch JSON avec délai — un provider lent ne doit pas bloquer la requête du client. */
export async function httpJson(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(init.timeoutMs ?? 15_000) })
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text.slice(0, 500) }
  }
  return { ok: res.ok, status: res.status, data }
}

export const digits = (s: string) => s.replace(/\D/g, '')
export const intAmount = (n: number) => Math.ceil(n)
