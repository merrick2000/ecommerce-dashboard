import { useEffect } from 'react'
import { Navigate, Outlet, isRouteErrorResponse, useLocation, useRouteError } from 'react-router'
import { isStaleChunkError, reloadForNewVersion } from '@/lib/newVersion'
import { useMe } from '@/hooks/auth'
import { LAST_STORE_KEY, readLocal } from '@/lib/storage'
import { ButtonLink, ErrorState, Spinner } from '../ui'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className ?? ''}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#f59e0b" />
        <path d="M10.5 10.5h11l-11 11h11" fill="none" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Zuri
    </span>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

/** Toute l'app (sauf /login, /register) exige une session. */
export function RequireAuth() {
  const { data: me, isPending, error, refetch } = useMe()
  const location = useLocation()
  if (isPending) return <FullPageSpinner />
  if (error && !me)
    return (
      <div className="mx-auto max-w-md p-6 pt-24">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    )
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}

/** « / » → dernière boutique utilisée, première boutique, ou création. */
export function HomeRedirect() {
  const { data: me } = useMe()
  if (!me) return null
  if (!me.stores.length) return <Navigate to="/onboarding" replace />
  const last = readLocal(LAST_STORE_KEY)
  const target = me.stores.find((s) => s.id === last) ?? me.stores[0]!
  return <Navigate to={`/stores/${target.id}`} replace />
}

export function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-semibold text-subtle">404</p>
      <h1 className="mt-3 text-lg font-semibold">Page introuvable</h1>
      <p className="mt-1 text-sm text-muted">Le lien est peut-être ancien ou incomplet.</p>
      <ButtonLink to="/" variant="primary" className="mt-6">
        Retour à l’accueil
      </ButtonLink>
    </div>
  )
}

export function RouteError() {
  const err = useRouteError()
  if (isRouteErrorResponse(err) && err.status === 404) return <NotFound />
  // Nouvelle version déployée pendant que la page était ouverte : rechargement silencieux, jamais de message d'erreur.
  const chunk = isStaleChunkError(err)
  useEffect(() => {
    if (chunk) reloadForNewVersion()
  }, [chunk])
  if (chunk)
    return (
      <div className="flex min-h-[60dvh] items-center justify-center gap-2 text-sm text-muted" role="status">
        <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden /> Mise à jour de Zuri…
      </div>
    )
  return (
    <div className="mx-auto max-w-md p-6 pt-24">
      <ErrorState error={err} onRetry={() => window.location.reload()} />
    </div>
  )
}
