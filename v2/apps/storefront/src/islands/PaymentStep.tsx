/** Paiement Mobile Money natif : pays + réseau → /pay → redirection, OTP ou attente (polling). */
import { useEffect, useRef, useState } from 'preact/hooks'
import type { PayStrings } from '../lib/i18n'
import type { PaymentResponse } from '../lib/types'
import { money } from '../lib/format'
import { api, fmt } from '../client/http'
import { dialFor, flag, fullPhone } from '../client/phone'

const NETWORK: Record<string, string> = {
  mtn: 'MTN MoMo', moov: 'Moov Money', orange: 'Orange Money', wave: 'Wave', free: 'Free Money', celtiis: 'Celtiis Cash', tmoney: 'T-Money',
  airtel: 'Airtel Money', airteltigo: 'AirtelTigo', telecel: 'Telecel Cash', mpesa: 'M-Pesa', vodacom: 'Vodacom M-Pesa', africell: 'Africell', telebirr: 'telebirr',
}

const POLL_MS = 4000
const POLL_MAX_MS = 3 * 60_000

export interface PaymentStepProps {
  token: string
  slug: string
  total: number
  currency: string
  locale: string
  storeCountry: string
  phone?: string
  t: PayStrings
  /** Appelé une fois le paiement confirmé. */
  onPaid: () => void
}

type Stage = 'form' | 'sending' | 'otp' | 'processing' | 'stalled' | 'paid'

function countryName(cc: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(cc) ?? cc
  } catch {
    return cc
  }
}

export default function PaymentStep(p: PaymentStepProps) {
  const [networks, setNetworks] = useState<{ country: string; networks: string[] }[] | null>(null)
  const [country, setCountry] = useState(p.storeCountry)
  const [network, setNetwork] = useState('')
  const [phone, setPhone] = useState(p.phone ?? '')
  const [otp, setOtp] = useState('')
  const [ussd, setUssd] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('form')
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollStart = useRef(0)

  const load = async () => {
    setError(null)
    const r = await api<{ country: string; networks: string[] }[]>(`/stores/${encodeURIComponent(p.slug)}/payment-networks`)
    if (!r.ok || !r.data) {
      setNetworks([])
      setError(r.network ? null : p.t.noNetwork)
      return
    }
    setNetworks(r.data)
    const c = r.data.find((x) => x.country === p.storeCountry) ?? r.data[0]
    if (c) {
      setCountry(c.country)
      setNetwork(c.networks[0] ?? '')
    }
  }

  useEffect(() => {
    load()
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const paid = () => {
    if (timer.current) clearTimeout(timer.current)
    setStage('paid')
    p.onPaid()
  }

  const poll = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const r = await api<{ status: 'paid' | 'pending' | 'failed' }>(`/orders/${p.token}/payment-status`, { timeoutMs: 15_000 })
      if (r.data?.status === 'paid') return paid()
      if (r.data?.status === 'failed') {
        setStage('form')
        setError(p.t.failed)
        return
      }
      if (Date.now() - pollStart.current > POLL_MAX_MS) return setStage('stalled')
      poll()
    }, POLL_MS)
  }

  const startPolling = () => {
    pollStart.current = Date.now()
    setStage('processing')
    poll()
  }

  const handle = (r: PaymentResponse) => {
    if (r.status === 'paid') return paid()
    if (r.status === 'redirect') {
      location.href = r.redirectUrl
      return
    }
    if (r.status === 'otp_required') {
      setUssd(r.ussdInstruction ?? null)
      setStage('otp')
      return
    }
    startPolling()
  }

  const errorOf = (r: { network: boolean; error: { error?: string } | null }) => (r.network ? p.t.failed : r.error?.error || p.t.failed)

  const pay = async (e: Event) => {
    e.preventDefault()
    if (stage === 'sending') return
    const full = fullPhone(dialFor(country), phone)
    if (!full || !network) {
      setError(p.t.badPhone)
      return
    }
    setError(null)
    setStage('sending')
    const r = await api<PaymentResponse>(`/orders/${p.token}/pay`, { body: { country, network, phone: full }, timeoutMs: 45_000 })
    if (!r.ok || !r.data) {
      setStage('form')
      setError(errorOf(r))
      return
    }
    handle(r.data)
  }

  const sendOtp = async (e: Event) => {
    e.preventDefault()
    if (otp.trim().length < 3) return
    setError(null)
    setStage('sending')
    const r = await api<PaymentResponse>(`/orders/${p.token}/otp`, { body: { otp: otp.trim() }, timeoutMs: 45_000 })
    if (!r.ok || !r.data) {
      setStage('otp')
      setError(errorOf(r))
      return
    }
    handle(r.data)
  }

  const current = networks?.find((n) => n.country === country)
  const amount = money(p.total, p.currency, p.locale)

  if (stage === 'paid') return <div class="notice ok" role="status">✓ {p.t.paid}</div>

  if (stage === 'processing' || stage === 'stalled') {
    return (
      <div class="pay" aria-live="polite">
        {stage === 'processing' ? (
          <div class="notice">
            <span class="spinner" aria-hidden="true" /> {p.t.processing}
          </div>
        ) : (
          <div class="notice warn">
            <p>{p.t.stillPending}</p>
            <div class="row">
              <button type="button" class="btn" onClick={startPolling}>
                {p.t.checkAgain}
              </button>
              <button type="button" class="btn btn-ghost" onClick={() => setStage('form')}>
                {p.t.retryPay}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (stage === 'otp' || (stage === 'sending' && otp)) {
    return (
      <form class="pay" onSubmit={sendOtp} noValidate>
        {ussd && <p class="notice">{ussd}</p>}
        <label class="field">
          <span>{p.t.otp}</span>
          <input class="input" inputMode="numeric" autoComplete="one-time-code" placeholder={p.t.otpPh} value={otp} onInput={(e) => setOtp(e.currentTarget.value)} />
        </label>
        {error && <p class="err" role="alert">{error}</p>}
        <button class="btn btn-block" disabled={stage === 'sending'}>
          {stage === 'sending' ? p.t.paying : p.t.otpSend}
        </button>
      </form>
    )
  }

  return (
    <form class="pay" onSubmit={pay} noValidate>
      <h3 class="pay-title">{p.t.title}</h3>
      {networks === null ? (
        <p class="muted">{p.t.loading}</p>
      ) : networks.length === 0 ? (
        <p class="notice warn">{error ?? p.t.noNetwork}</p>
      ) : (
        <>
          {networks.length > 1 && (
            <label class="field">
              <span>{p.t.country}</span>
              <select
                class="input"
                value={country}
                onChange={(e) => {
                  const c = e.currentTarget.value
                  setCountry(c)
                  setNetwork(networks.find((n) => n.country === c)?.networks[0] ?? '')
                }}
              >
                {networks.map((n) => (
                  <option value={n.country} key={n.country}>
                    {flag(n.country)} {countryName(n.country, p.locale)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <fieldset class="field">
            <legend>{p.t.network}</legend>
            <div class="chips">
              {current?.networks.map((n) => (
                <label class={`chip${network === n ? ' on' : ''}`} key={n}>
                  <input type="radio" name="network" value={n} checked={network === n} onChange={() => setNetwork(n)} />
                  {NETWORK[n] ?? n.toUpperCase()}
                </label>
              ))}
            </div>
          </fieldset>
          <label class="field">
            <span>{p.t.phone}</span>
            <div class="tel">
              <span class="dial">+{dialFor(country)}</span>
              <input class="input" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onInput={(e) => setPhone(e.currentTarget.value)} />
            </div>
          </label>
          {error && (
            <p class="err" role="alert">
              {error}
            </p>
          )}
          <button class="btn btn-block" disabled={stage === 'sending'}>
            {stage === 'sending' ? p.t.paying : fmt(p.t.pay, amount)}
          </button>
        </>
      )}
    </form>
  )
}
