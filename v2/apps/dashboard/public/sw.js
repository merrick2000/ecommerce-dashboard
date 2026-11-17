/* Service worker Zuri : notifications push uniquement (pas de cache hors ligne). */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Zuri', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Zuri'
  const url = data.url || '/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const visible = windows.find((c) => c.visibilityState === 'visible')
      if (visible) {
        // App ouverte et visible : elle joue son propre son (plus doux) et affiche un toast.
        visible.postMessage({ type: 'zuri:push', payload: data })
        return
      }
      await self.registration.showNotification(title, {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/badge-96.png',
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url },
        vibrate: [80, 40, 80],
        silent: false,
      })
      // Prévient les onglets en arrière-plan pour rafraîchir les données.
      windows.forEach((c) => c.postMessage({ type: 'zuri:refresh', payload: data }))
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const c of windows) {
        if (new URL(c.url).origin === self.location.origin) {
          await c.focus()
          if ('navigate' in c) return c.navigate(target)
          return
        }
      }
      return self.clients.openWindow(target)
    })(),
  )
})
