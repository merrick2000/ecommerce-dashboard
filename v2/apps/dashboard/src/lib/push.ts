/**
 * Notifications push du navigateur : service worker, permission, abonnement.
 * Android et PC : fonctionne dans le navigateur. iPhone/iPad : seulement une fois
 * Zuri ajouté à l'écran d'accueil (iOS 16.4+).
 */
import type { NotificationConfig } from '@zuri/shared'
import { api } from './api'

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export type PushState = 'unsupported' | 'ios-needs-install' | 'denied' | 'off' | 'on'

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (err) {
    console.warn('[push] service worker', err)
    return null
  }
}

export async function getPushState(): Promise<PushState> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-needs-install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Demande la permission et abonne cet appareil. Doit être appelé depuis un clic. */
export async function enablePush(label?: string): Promise<PushState> {
  if (!pushSupported()) return getPushState()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready)
  const config = await api.get<NotificationConfig>('/notifications/config')
  const key = urlBase64ToUint8Array(config.vapidPublicKey)
  let sub = await reg.pushManager.getSubscription()
  // Clé serveur différente (base réinitialisée…) : on repart d'un abonnement neuf.
  if (sub && sub.options.applicationServerKey) {
    const current = new Uint8Array(sub.options.applicationServerKey)
    if (current.length !== key.length || current.some((b, i) => b !== key[i])) {
      await sub.unsubscribe()
      sub = null
    }
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  await api.post('/notifications/push/subscribe', { endpoint: json.endpoint, keys: json.keys, label })
  return 'on'
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await api.post('/notifications/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => undefined)
  await sub.unsubscribe()
}
