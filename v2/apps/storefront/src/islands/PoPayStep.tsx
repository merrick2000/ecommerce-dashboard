/**
 * Paiement via Payment Orchestrator : le serveur crée la session (montant calculé en base),
 * puis le widget s'ouvre (fenêtre sur la page, redirection, ou auto selon la boutique).
 * Les retours du widget ne servent qu'à l'affichage : la commande n'est payée que lorsque
 * NOTRE serveur l'a confirmé (webhook signé ou lecture de la session), la page commande l'attend.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { api, fmt } from '../client/http'
import { money } from '../lib/format'
import type { PayStrings } from '../lib/i18n'
import type { PaymentGateway } from '../lib/types'

type Gateway = Extract<PaymentGateway, { kind: 'orchestrator' }>
type Widget = { open: (o: Record<string, unknown>) => { close(): void } }
declare global {
  interface Window {
    PaymentOrchestrator?: Widget
  }
}

let widgetPromise: Promise<Widget | null> | null = null
/** Charge widget.js une seule fois (environ 6 Ko), au clic : rien ne ralentit la page de vente. */
function loadWidget(src: string): Promise<Widget | null> {
  if (window.PaymentOrchestrator) return Promise.resolve(window.PaymentOrchestrator)
  widgetPromise ??= new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    const done = () => resolve(window.PaymentOrchestrator ?? null)
    s.onload = done
    s.onerror = () => resolve(null)
    setTimeout(done, 8000)
    document.head.appendChild(s)
  })
  return widgetPromise
}

export interface PoPayStepProps {
  token: string
  total: number
  currency: string
  locale: string
  gateway: Gateway
  /** Page commande : affiche « confirmation en cours » puis le statut confirmé par le serveur. */
  orderUrl: string
  t: PayStrings
  /** Juste après la commande : le paiement s'ouvre tout seul (aucun clic de plus). Le bouton reste pour réessayer. */
  autoStart?: boolean
}

export default function PoPayStep(p: PoPayStepProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const pay = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    const r = await api<{ paid: true } | { paid: false; sessionId: string; url: string; mode: Gateway['widgetMode']; locale: string | null }>(`/orders/${p.token}/po-session`, { body: {}, timeoutMs: 25_000 })
    if (!r.ok || !r.data) {
      setBusy(false)
      return setError(r.error?.error ?? p.t.failed)
    }
    const d = r.data
    if (d.paid) return location.assign(p.orderUrl)
    const mode = d.mode ?? p.gateway.widgetMode
    if (mode === 'redirect') return location.assign(d.url)
    const widget = await loadWidget(p.gateway.widgetUrl)
    // Widget indisponible (réseau, bloqueur) : la page de paiement hébergée fait le même travail.
    if (!widget) return location.assign(d.url)
    widget.open({
      session: d.sessionId,
      mode,
      locale: d.locale ?? p.gateway.locale ?? p.locale,
      redirectOnSuccess: false,
      onSuccess: () => {
        setConfirming(true)
        location.assign(`${p.orderUrl}?session=${encodeURIComponent(d.sessionId)}`)
      },
      onFailed: () => setError(p.t.poFailed),
      onClose: () => setBusy(false),
    })
  }

  // Ouverture automatique, une seule fois : le client vient déjà de cliquer sur « Commander ».
  const started = useRef(false)
  useEffect(() => {
    if (p.autoStart && !started.current) {
      started.current = true
      void pay()
    }
  }, [])

  return (
    <div class="pay po-pay">
      <p class="pay-title">{p.t.title}</p>
      {confirming ? (
        <p class="notice" role="status">
          <span class="spinner" aria-hidden="true" /> {p.t.poConfirming}
        </p>
      ) : (
        <>
          <button type="button" class="btn btn-block btn-lg" onClick={pay} disabled={busy} aria-busy={busy}>
            {busy ? p.t.loading : fmt(p.t.poPay, money(p.total, p.currency, p.locale))}
          </button>
          <p class="muted small" style="margin-top:8px">{p.t.poHint}</p>
          {p.gateway.test && <p class="notice warn small">{p.t.poTest}</p>}
          {error && (
            <p class="err" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
