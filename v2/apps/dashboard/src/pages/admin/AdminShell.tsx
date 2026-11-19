import { ArrowLeft, BarChart3, Settings, Shield, Store, Users } from 'lucide-react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { Logo } from '@/components/layout/Guards'
import { cx } from '@/components/ui'
import { useMe } from '@/hooks/auth'
import { LAST_STORE_KEY, readLocal } from '@/lib/storage'

const NAV = [
  { to: '/admin', label: 'Vue d’ensemble', icon: BarChart3, end: true },
  { to: '/admin/users', label: 'Comptes', icon: Users },
  { to: '/admin/stores', label: 'Boutiques', icon: Store },
  { to: '/admin/settings', label: 'Réglages', icon: Settings },
]

/** Cadre du super admin : réservé aux administrateurs de la plateforme. */
export default function AdminShell() {
  const { data: me } = useMe()
  if (me && !me.isPlatformAdmin) return <Navigate to="/" replace />
  const last = readLocal(LAST_STORE_KEY) ?? me?.stores[0]?.id
  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo />
          <span className="flex items-center gap-1 rounded-full bg-fg px-2.5 py-0.5 text-[11px] font-semibold text-bg">
            <Shield className="size-3" /> Super admin
          </span>
          <div className="flex-1" />
          {last && (
            <NavLink to={`/stores/${last}`} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
              <ArrowLeft className="size-4" /> Mon tableau de bord
            </NavLink>
          )}
        </div>
        <nav className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap', isActive ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-surface-2')}>
              <n.icon className="size-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
