import { Navigate, Outlet, isRouteErrorResponse, useLocation, useRouteError } from 'react-router'
import { useMe } from '@/hooks/auth'
import { LAST_STORE_KEY, readLocal } from '@/lib/storage'
import { ButtonLink, ErrorState, Spinner } from '../ui'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className ?? ''}`}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#f59e0b" />
        <path d="M20.5 11.5c-.8-1.3-2.4-2-4.4-2-2.7 0-4.6 1.4-4.6 3.5 0 4.6 9.2 2.6 9.2 6.5 0 1.6-1.7 2.8-4.3 2.8-2.1 0-3.8-.8-4.7-2.3" fill="none" stroke="#1c1917" strokeWidth="2.6" strokeLinecap="round" />
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
  if (error)
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
  const last = Number(readLocal(LAST_STORE_KEY))
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
  // Chunk introuvable après un déploiement : un rechargement suffit.
  const chunk = err instanceof Error && /dynamically imported module|Importing a module script failed/i.test(err.message)
  return (
    <div className="mx-auto max-w-md p-6 pt-24">
      <ErrorState error={chunk ? new Error('Une nouvelle version est disponible. Rechargez la page.') : err} onRetry={() => window.location.reload()} />
    </div>
  )
}
