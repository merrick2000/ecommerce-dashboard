/**
 * Aperçu en direct du formulaire de commande, affiché dans le dashboard (iframe).
 * C'est le VRAI formulaire de la page de vente ; seul le réglage du formulaire vient du dashboard,
 * par postMessage, et uniquement depuis l'origine de l'app.
 */
import type { OrderForm as OrderFormConfig } from '@zuri/shared'
import { DEFAULT_FORM_TEXTS } from '@zuri/shared/form-runtime'
import { useEffect, useState } from 'preact/hooks'
import OrderForm, { type OrderFormProps } from './OrderForm'

interface Props extends OrderFormProps {
  appOrigin: string
  defaultTitle: string
  priceLabel: string
}

/** Brouillon reçu du dashboard : on ne garde que des formes attendues (sinon on conserve le précédent). */
function sanitize(raw: unknown, fallback: OrderFormConfig): OrderFormConfig {
  if (!raw || typeof raw !== 'object') return fallback
  const r = raw as Partial<OrderFormConfig>
  if (!Array.isArray(r.fields) || r.fields.some((f) => !f || typeof f.key !== 'string')) return fallback
  const texts = { ...DEFAULT_FORM_TEXTS, ...(r.texts && typeof r.texts === 'object' ? r.texts : {}) }
  if (!Array.isArray(texts.reassurance)) texts.reassurance = []
  return {
    fields: r.fields.slice(0, 40).map((f) => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })),
    texts,
    showPromo: r.showPromo !== false,
  }
}

export default function PreviewOrderForm({ appOrigin, defaultTitle, priceLabel, ...p }: Props) {
  const [form, setForm] = useState<OrderFormConfig>(p.form)

  useEffect(() => {
    const post = (msg: unknown) => {
      if (window.parent !== window) window.parent.postMessage(msg, appOrigin)
    }
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== appOrigin || e.source !== window.parent) return
      const d = e.data as { type?: string; form?: unknown } | null
      if (d?.type === 'zuri:preview-form') setForm((cur) => sanitize(d.form, cur))
    }
    window.addEventListener('message', onMessage)
    post({ type: 'zuri:preview-ready' })
    // Hauteur réelle du contenu : le dashboard ajuste l'iframe (pas de double barre de défilement).
    let last = 0
    const report = () => {
      const h = Math.ceil(document.documentElement.scrollHeight)
      if (h !== last) {
        last = h
        post({ type: 'zuri:preview-height', height: h })
      }
    }
    const ro = new ResizeObserver(report)
    ro.observe(document.body)
    report()
    return () => {
      window.removeEventListener('message', onMessage)
      ro.disconnect()
    }
  }, [appOrigin])

  return (
    <>
      {!(form.texts.title || form.texts.subtitle) && (
        <>
          <h2 class="order-title">{defaultTitle}</h2>
          <p class="muted" style="margin-bottom:14px">
            {p.productName} · <strong>{priceLabel}</strong>
          </p>
        </>
      )}
      <OrderForm {...p} form={form} preview />
    </>
  )
}
