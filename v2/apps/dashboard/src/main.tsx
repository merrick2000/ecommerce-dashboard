import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { z } from 'zod'
import fr from 'zod/v4/locales/fr.js'
import { ToastProvider } from '@/components/Toast'
import { meKey } from '@/hooks/auth'
import { ApiError, onUnauthorized } from '@/lib/api'
import { router } from '@/router'
import './index.css'
import { PushBridge } from '@/components/PushBridge'

// Messages de validation zod en français (schémas partagés compris : même instance de zod).
z.config(fr())

/**
 * Erreurs « métier » (4xx) : inutile de réessayer. Coupure réseau (status 0) ou serveur
 * momentanément indisponible (5xx, redéploiement) : on réessaie plus longtemps
 * (1 s, 2 s, 4 s, 8 s), le temps qu'un réseau mobile ou un ordinateur sorti de veille se reconnecte.
 */
const retry = (count: number, e: unknown) => {
  if (e instanceof ApiError && e.status >= 400 && e.status < 500) return false
  return count < 4
}
const retryDelay = (attempt: number) => Math.min(1000 * 2 ** attempt, 8000)

const queryClient = new QueryClient({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
  defaultOptions: {
    queries: { staleTime: 30_000, retry, retryDelay, refetchOnWindowFocus: true, refetchOnReconnect: true },
    mutations: { retry: false },
  },
})

// Session expirée → retour à la connexion, en gardant la page demandée.
onUnauthorized(() => {
  queryClient.setQueryData(meKey, null)
  const here = window.location.pathname + window.location.search
  // Les écrans publics (connexion, inscription, mot de passe oublié) ne redirigent pas.
  const isPublic = ['/login', '/register', '/forgot-password', '/reset-password', '/invite'].some((p) => window.location.pathname.startsWith(p))
  if (!isPublic) void router.navigate(`/login?next=${encodeURIComponent(here)}`, { replace: true })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
        <PushBridge />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
