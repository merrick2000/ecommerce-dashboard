import type { OrderForm } from '@zuri/shared'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Spinner } from '@/components/ui'
import { formPreviewUrl, storefrontProductUrl } from '@/lib/storefront'

/**
 * Aperçu RÉEL du formulaire : la vraie page de vente (même rendu que pour le client),
 * dans une iframe, à laquelle on envoie le brouillon à chaque modification.
 * Si la page ne répond pas (produit inactif, storefront injoignable), on affiche `fallback`.
 */
export function LiveFormPreview({ form, storeSlug, productId, fallback }: { form: OrderForm; storeSlug: string; productId: string; fallback: ReactNode }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [height, setHeight] = useState(640)
  const [reloadKey, setReloadKey] = useState(0)
  const url = formPreviewUrl(storeSlug, productId)
  const origin = new URL(url).origin
  const readyRef = useRef(false)

  // Nouveau produit ou rechargement : on attend le signal « prêt » de la page (12 s maximum).
  useEffect(() => {
    readyRef.current = false
    setReady(false)
    setFailed(false)
    const timer = setTimeout(() => {
      if (!readyRef.current) setFailed(true)
    }, 12_000)
    return () => clearTimeout(timer)
  }, [url, reloadKey])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return
      const d = e.data as { type?: string; height?: number } | null
      if (d?.type === 'zuri:preview-ready') {
        readyRef.current = true
        setReady(true)
        setFailed(false)
      } else if (d?.type === 'zuri:preview-height' && typeof d.height === 'number') setHeight(Math.min(Math.max(d.height, 200), 4000))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [origin])

  // Envoi du brouillon (léger délai pour ne pas inonder la page pendant la frappe).
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => frame.current?.contentWindow?.postMessage({ type: 'zuri:preview-form', form }, origin), 150)
    return () => clearTimeout(t)
  }, [form, ready, origin])

  if (failed)
    return (
      <div className="space-y-2">
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-[12px] text-muted">
          Aperçu réel indisponible (produit inactif ou page injoignable). Voici une simulation.{' '}
          <button type="button" className="font-medium text-accent hover:underline" onClick={() => setReloadKey((k) => k + 1)}>
            Réessayer
          </button>
        </p>
        {fallback}
      </div>
    )

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {!ready && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center bg-surface">
            <Spinner />
          </div>
        )}
        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto">
          <iframe key={reloadKey} ref={frame} src={url} title="Aperçu réel du formulaire de commande" className="block w-full border-0" style={{ height }} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-[12px] text-muted">
        <span>Exactement ce que verra le client (téléphone).</span>
        <span className="flex items-center gap-3">
          <button type="button" className="inline-flex items-center gap-1 hover:text-fg" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="size-3" /> Recharger
          </button>
          <a className="inline-flex items-center gap-1 hover:text-fg" href={`${storefrontProductUrl(storeSlug, productId)}?notrack`} target="_blank" rel="noopener">
            <ExternalLink className="size-3" /> Page
          </a>
        </span>
      </div>
    </div>
  )
}
