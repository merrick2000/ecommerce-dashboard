/**
 * Partie vivante de la page commande : Purchase (une fois), suivi du paiement en attente,
 * finalisation du paiement, téléchargement des produits digitaux.
 */
import { useEffect, useRef, useState } from 'preact/hooks'
import { api } from '../client/http'
import { getJSON } from '../client/storage'
import { purchaseOnce, setTrackConfig } from '../client/track'
import type { OrderStrings, PayStrings } from '../lib/i18n'
import PaymentStep from './PaymentStep'

export interface OrderLiveProps {
  token: string
  slug: string
  storeId: string
  storeCountry: string
  locale: string
  total: number
  currency: string
  eventId: string | null
  numItems: number
  paymentMethod: string
  paymentStatus: string
  fulfillmentStatus: string
  canDownload: boolean
  t: OrderStrings
  pt: PayStrings
}

const POLL_MS = 4000
const POLL_MAX_MS = 3 * 60_000

export default function OrderLive(p: OrderLiveProps) {
  const pendingOnline = p.paymentStatus === 'pending' && p.paymentMethod !== 'cod'
  const [showPay, setShowPay] = useState(false)
  const [links, setLinks] = useState<{ name: string; url: string }[] | null>(null)
  const [dlBusy, setDlBusy] = useState(false)
  const [dlError, setDlError] = useState<string | null>(null)
  const [stalled, setStalled] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Purchase : COD dès la commande, paiement en ligne une fois payé — une seule fois par commande.
  useEffect(() => {
    const isSale = p.paymentStatus === 'paid' || (p.paymentMethod === 'cod' && p.fulfillmentStatus !== 'cancelled')
    const saved = getJSON<{ fb: string | null; tt: string | null; productId: string; name: string; storeId: string }>(`sf_o_${p.token}`)
    if (isSale && saved && (saved.fb || saved.tt)) {
      setTrackConfig({ storeId: saved.storeId, productId: saved.productId, fb: saved.fb, tt: saved.tt, name: saved.name, value: p.total, currency: p.currency })
      purchaseOnce(p.token, { value: p.total, currency: p.currency, eventId: p.eventId, numItems: p.numItems })
    }
  }, [])

  // Paiement en ligne en attente : on interroge le statut (le provider peut confirmer à tout moment).
  const poll = (start: number) => {
    timer.current = setTimeout(async () => {
      const r = await api<{ status: string }>(`/orders/${p.token}/payment-status`, { timeoutMs: 15_000 })
      if (r.data?.status === 'paid') return location.reload()
      if (Date.now() - start > POLL_MAX_MS) return setStalled(true)
      poll(start)
    }, POLL_MS)
  }
  useEffect(() => {
    if (pendingOnline) poll(Date.now())
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const download = async () => {
    setDlBusy(true)
    setDlError(null)
    const r = await api<{ links: { name: string; url: string }[] }>(`/orders/${p.token}/download`, { body: {} })
    setDlBusy(false)
    if (!r.ok || !r.data) return setDlError(r.error?.error ?? p.pt.failed)
    setLinks(r.data.links)
    // Un seul lien : on l'ouvre directement (même onglet, pas de pop-up bloquée après await).
    if (r.data.links.length === 1) location.href = r.data.links[0]!.url
  }

  return (
    <div class="live">
      {p.canDownload && (
        <div class="dl">
          <button type="button" class="btn btn-block btn-lg" onClick={download} disabled={dlBusy}>
            ⬇ {dlBusy ? p.t.downloading : p.t.download}
          </button>
          {dlError && <p class="err">{dlError}</p>}
          {links && links.length > 0 && (
            <ul class="links">
              {links.map((l) => (
                <li key={l.url}>
                  <span>{l.name}</span>
                  <a class="btn btn-ghost" href={l.url} target="_blank" rel="noopener">
                    {p.t.open}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {links && <p class="muted small">{p.t.linksExpire}</p>}
        </div>
      )}

      {pendingOnline && (
        <div class="pending">
          {!showPay && (
            <p class="notice" aria-live="polite">
              {!stalled && <span class="spinner" aria-hidden="true" />} {stalled ? p.pt.stillPending : p.t.waiting}
            </p>
          )}
          {p.paymentMethod === 'mobile_money' &&
            (showPay ? (
              <PaymentStep token={p.token} slug={p.slug} total={p.total} currency={p.currency} locale={p.locale} storeCountry={p.storeCountry} t={p.pt} onPaid={() => location.reload()} />
            ) : (
              <button type="button" class="btn btn-block btn-lg" onClick={() => setShowPay(true)}>
                {p.t.finish}
              </button>
            ))}
          {stalled && (
            <button type="button" class="btn btn-ghost btn-block" onClick={() => (setStalled(false), poll(Date.now()))}>
              {p.pt.checkAgain}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
