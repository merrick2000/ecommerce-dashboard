/**
 * Widget Payment Orchestrator (payment.zurisell.store/widget.js), chargé à la demande.
 * Ses retours ne servent qu'à l'affichage : le paiement est confirmé par notre serveur.
 */
type Widget = { open: (o: Record<string, unknown>) => { close(): void } }
declare global {
  interface Window {
    PaymentOrchestrator?: Widget
  }
}

let loading: Promise<Widget | null> | null = null

export function loadPoWidget(src: string): Promise<Widget | null> {
  if (window.PaymentOrchestrator) return Promise.resolve(window.PaymentOrchestrator)
  loading ??= new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    const done = () => resolve(window.PaymentOrchestrator ?? null)
    s.onload = done
    s.onerror = () => resolve(null)
    setTimeout(done, 8000)
    document.head.appendChild(s)
  })
  return loading
}

/** Ouvre le paiement : fenêtre, page séparée ou auto ; repli sur la page hébergée si le widget ne charge pas. */
export async function openPoCheckout(opts: { widgetUrl: string; sessionId: string; url: string; mode: 'auto' | 'modal' | 'redirect'; locale?: string | null; onSuccess: () => void; onFailed?: () => void; onClose?: () => void }) {
  if (opts.mode === 'redirect') return window.location.assign(opts.url)
  const w = await loadPoWidget(opts.widgetUrl)
  if (!w) return window.location.assign(opts.url)
  w.open({ session: opts.sessionId, mode: opts.mode, locale: opts.locale ?? 'fr', redirectOnSuccess: false, onSuccess: opts.onSuccess, onFailed: opts.onFailed, onClose: opts.onClose })
}
