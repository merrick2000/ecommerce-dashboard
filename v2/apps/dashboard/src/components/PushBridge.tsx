import type { PushPayload } from '@zuri/shared'
import { useQueryClient } from '@tanstack/react-query'
import { BellRing, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { registerServiceWorker } from '@/lib/push'
import { playSound, unlockAudioOnFirstGesture } from '@/lib/sound'
import { router } from '@/router'

interface Banner {
  id: number
  payload: PushPayload
}

/** Chemin interne à partir de l'URL absolue envoyée dans la notification. */
const toPath = (url: string) => {
  try {
    const u = new URL(url, window.location.origin)
    return u.origin === window.location.origin ? u.pathname + u.search : '/'
  } catch {
    return '/'
  }
}

/** Alertes déjà affichées (par tag) : le push et la surveillance des commandes ne doublonnent pas. */
const shown = new Set<string>()
let push: ((payload: PushPayload) => void) | null = null

/**
 * Affiche une alerte dans l'app (bannière + son), même sans notifications push activées.
 * Renvoie false si une alerte avec ce tag a déjà été montrée.
 */
export function showInAppAlert(payload: PushPayload): boolean {
  if (payload.tag) {
    if (shown.has(payload.tag)) return false
    shown.add(payload.tag)
  }
  push?.(payload)
  return true
}

/**
 * Pont entre le service worker et l'app ouverte : quand une notification arrive
 * pendant que Zuri est à l'écran, on joue le son choisi, on affiche une bannière
 * cliquable et on rafraîchit les données (commandes, stats).
 */
export function PushBridge() {
  const qc = useQueryClient()
  const [banners, setBanners] = useState<Banner[]>([])

  useEffect(() => {
    void registerServiceWorker()
    unlockAudioOnFirstGesture()
    if (!('serviceWorker' in navigator)) return undefined
    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { type?: string; payload?: PushPayload } | null
      if (!msg?.payload) return
      void qc.invalidateQueries({ queryKey: ['store'] })
      // Déjà affichée en notification système (onglet caché) : pas de seconde annonce dans l'app.
      if (msg.type === 'zuri:refresh' && msg.payload.tag) shown.add(msg.payload.tag)
      if (msg.type !== 'zuri:push') return
      showInAppAlert(msg.payload)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [qc])

  useEffect(() => {
    push = (payload) => {
      playSound(payload.sound === 'soft' ? 'drop' : undefined)
      const id = Date.now() + Math.random()
      setBanners((list) => [...list.slice(-2), { id, payload }])
      setTimeout(() => setBanners((list) => list.filter((b) => b.id !== id)), 12000)
    }
    return () => {
      push = null
    }
  }, [])

  if (!banners.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-5" aria-live="polite">
      {banners.map(({ id, payload }) => (
        <div key={id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lg">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <BellRing className="size-4" />
          </span>
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => {
              setBanners((list) => list.filter((b) => b.id !== id))
              void router.navigate(toPath(payload.url))
            }}
          >
            <p className="truncate text-sm font-semibold">{payload.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{payload.body}</p>
          </button>
          <button type="button" onClick={() => setBanners((list) => list.filter((b) => b.id !== id))} className="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
