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

// Messages de validation zod en français (schémas partagés compris : même instance de zod).
z.config(fr())

const retry = (count: number, e: unknown) => {
  if (e instanceof ApiError && e.status >= 400 && e.status < 500) return false
  return count < 2
}

const queryClient = new QueryClient({
  queryCache: new QueryCache(),
  mutationCache: new MutationCache(),
  defaultOptions: {
    queries: { staleTime: 30_000, retry, refetchOnWindowFocus: true },
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
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
