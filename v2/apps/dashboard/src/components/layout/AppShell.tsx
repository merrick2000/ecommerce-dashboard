import type { Permission } from '@zuri/shared'
import {
  Bell,
  Activity,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Sun,
  Tag,
  Truck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate, useNavigation } from 'react-router'
import { useCurrentStore, useLogout, usePermissions } from '@/hooks/auth'
import { useOrders } from '@/hooks/resources'
import { ROLE_LABEL } from '@/lib/labels'
import { LAST_STORE_KEY, readLocal, THEME_KEY, writeLocal } from '@/lib/storage'
import { Dialog } from '../Dialog'
import { useToast } from '../Toast'
import { Button, cx } from '../ui'
import { Logo } from './Guards'

interface NavItem {
  to: string
  label: string
  short?: string
  icon: LucideIcon
  end?: boolean
  /** Entrée visible seulement avec cette permission. */
  perm?: Permission
}

const NAV: NavItem[] = [
  { to: '', label: 'Tableau de bord', short: 'Accueil', icon: LayoutDashboard, end: true },
  { to: 'orders', label: 'Commandes', icon: ShoppingBag, perm: 'orders.view' },
  { to: 'products', label: 'Produits', icon: Package, perm: 'products.view' },
  { to: 'customers', label: 'Clients', icon: Users, perm: 'customers.view' },
  { to: 'zones', label: 'Livraison', icon: Truck, perm: 'delivery.edit' },
  { to: 'promo-codes', label: 'Codes promo', icon: Tag, perm: 'marketing.edit' },
  { to: 'activity', label: 'Activité', icon: Activity, perm: 'activity.view' },
  { to: 'team', label: 'Équipe', icon: UserPlus, perm: 'team.manage' },
  { to: 'notifications', label: 'Notifications', icon: Bell },
  { to: 'settings', label: 'Paramètres', icon: Settings },
]

/** Les paramètres regroupent boutique, paiements et intégrations : visibles si au moins un onglet l'est. */
const SETTINGS_PERMS: Permission[] = ['store.settings', 'payments.manage', 'integrations.manage']

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    writeLocal(THEME_KEY, next ? 'dark' : 'light')
  }
  return { dark, toggle }
}

function StoreSwitcher({ compact }: { compact?: boolean }) {
  const { me, store } = useCurrentStore()
  const navigate = useNavigate()
  if (!me || !store) return null
  if (me.stores.length < 2)
    return (
      <div className="min-w-0">
        <p className={cx('truncate font-semibold', compact ? 'text-[15px]' : 'text-sm')}>{store.name}</p>
        {!compact && <p className="truncate text-[12px] text-muted">{ROLE_LABEL[store.role]}</p>}
      </div>
    )
  return (
    <label className="relative flex min-w-0 items-center">
      <span className="sr-only">Changer de boutique</span>
      <select
        value={store.id}
        onChange={(e) => (e.target.value === 'new' ? navigate('/onboarding') : navigate(`/stores/${e.target.value}`))}
        className={cx('w-full min-w-0 cursor-pointer appearance-none truncate rounded-lg bg-transparent py-1 pr-7 font-semibold hover:bg-surface-2 focus:outline-none', compact ? 'pl-1 text-[15px]' : 'pl-2 text-sm')}
      >
        {me.stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value="new">+ Nouvelle boutique</option>
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-1.5 size-4 text-muted" />
    </label>
  )
}

function NavBadge({ count }: { count?: number }) {
  if (!count) return null
  return <span className="tabular ml-auto min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] leading-5 font-semibold text-accent-fg">{count > 99 ? '99+' : count}</span>
}

export function AppShell() {
  const { storeId, store, me } = useCurrentStore()
  const logout = useLogout()
  const navigate = useNavigate()
  const toast = useToast()
  const theme = useTheme()
  const navigation = useNavigation()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const permissions = usePermissions()
  const nav = NAV.filter((i) => (i.to === 'settings' ? SETTINGS_PERMS.some((p) => permissions.includes(p)) : !i.perm || permissions.includes(i.perm)))
  const primaryMobile = nav.slice(0, 4)
  const moreMobile = nav.slice(4)
  const canOrders = permissions.includes('orders.view')
  // Commandes à traiter (nouvelles) : pastille sur l'onglet Commandes.
  const pending = useOrders({ fulfillmentStatus: 'new', pageSize: 1 }, canOrders)
  const newCount = pending.data?.total

  useEffect(() => {
    if (store) writeLocal(LAST_STORE_KEY, String(store.id))
  }, [store])
  useEffect(() => setMoreOpen(false), [location.pathname])

  if (me && !store && !me.isPlatformAdmin) {
    // Boutique inconnue (lien ancien, autre compte) : on retombe sur la dernière boutique valide.
    if (readLocal(LAST_STORE_KEY) === String(storeId)) writeLocal(LAST_STORE_KEY, null)
    return <Navigate to="/" replace />
  }

  const base = `/stores/${storeId}`
  const href = (to: string) => (to ? `${base}/${to}` : base)
  const doLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
      onError: (e) => toast.error(e),
    })

  return (
    <div className="min-h-dvh lg:pl-64">
      {navigation.state === 'loading' && <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-accent" role="progressbar" aria-label="Chargement" />}

      {/* Barre latérale desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-14 items-center px-5">
          <Logo />
        </div>
        <div className="mx-3 mb-2 rounded-lg border border-line p-1.5">
          <StoreSwitcher />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Navigation principale">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={href(item.to)}
              end={item.end}
              className={({ isActive }) =>
                cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg')
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cx('size-[18px]', isActive && 'text-accent')} aria-hidden />
                  {item.label}
                  {item.to === 'orders' && <NavBadge count={newCount} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 px-2">
              <p className="truncate text-sm font-medium">{me?.name}</p>
              <p className="truncate text-[12px] text-muted">{me?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={theme.toggle} aria-label={theme.dark ? 'Mode clair' : 'Mode sombre'}>
              {theme.dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={doLogout} aria-label="Se déconnecter" loading={logout.isPending}>
              {!logout.isPending && <LogOut className="size-[18px]" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* En-tête mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur pt-[env(safe-area-inset-top)] lg:hidden">
        <div className="min-w-0 flex-1">
          <StoreSwitcher compact />
        </div>
        <Button variant="ghost" size="icon" onClick={theme.toggle} aria-label={theme.dark ? 'Mode clair' : 'Mode sombre'}>
          {theme.dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
        <Outlet />
      </main>

      {/* Navigation basse mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navigation principale">
        <div className="grid grid-cols-5">
          {primaryMobile.map((item) => (
            <NavLink key={item.to} to={href(item.to)} end={item.end} className={({ isActive }) => cx('relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-accent' : 'text-muted')}>
              <item.icon className="size-[22px]" aria-hidden />
              {item.short ?? item.label}
              {item.to === 'orders' && !!newCount && (
                <span className="tabular absolute top-1 left-1/2 ml-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-accent-fg">{newCount > 99 ? '99+' : newCount}</span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted" aria-haspopup="dialog">
            <Menu className="size-[22px]" aria-hidden />
            Plus
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <div className="space-y-1">
          {moreMobile.map((item) => (
            <NavLink key={item.to} to={href(item.to)} className={({ isActive }) => cx('flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium', isActive ? 'bg-accent-soft' : 'hover:bg-surface-2')}>
              <item.icon className="size-5 text-muted" aria-hidden />
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/onboarding" className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-surface-2">
            <Plus className="size-5 text-muted" aria-hidden />
            Nouvelle boutique
          </NavLink>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{me?.name}</p>
            <p className="truncate text-[12px] text-muted">{me?.email}</p>
          </div>
          <Button onClick={doLogout} loading={logout.isPending}>
            <LogOut className="size-4" /> Déconnexion
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
