import type { Permission } from '@zuri/shared'
import {
  Bell,
  Check,
  Crown,
  PauseCircle,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
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
import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate, useNavigation } from 'react-router'
import { useCurrentStore, useLogout, usePermissions } from '@/hooks/auth'
import { useOrders } from '@/hooks/resources'
import { useOrderAlerts } from '@/hooks/orderAlerts'
import { EnableNotificationsBanner } from '@/components/EnableNotificationsBanner'
import { syncPushSubscription } from '@/lib/push'
import { ROLE_LABEL } from '@/lib/labels'
import { LAST_STORE_KEY, readLocal, THEME_KEY, writeLocal } from '@/lib/storage'

const SIDEBAR_KEY = 'zuri:sidebar-collapsed'
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

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || 'Z'

/**
 * Sélecteur de boutique : liste des boutiques + « Nouvelle boutique », toujours disponible
 * (même avec une seule boutique). `collapsed` : seule l'initiale est affichée (menu replié).
 */
function StoreSwitcher({ compact, collapsed }: { compact?: boolean; collapsed?: boolean }) {
  const { me, store } = useCurrentStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  if (!me || !store) return null
  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }
  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? `${store.name} : changer de boutique` : undefined}
        className={cx('flex w-full min-w-0 items-center gap-2.5 rounded-lg text-left hover:bg-surface-2', compact ? 'px-1 py-1' : 'p-1.5', collapsed && 'justify-center')}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-sm font-bold text-accent">{initial(store.name)}</span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className={cx('block truncate font-semibold', compact ? 'text-[15px]' : 'text-sm')}>{store.name}</span>
              {!compact && <span className="block truncate text-[12px] text-muted">{ROLE_LABEL[store.role]}</span>}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
          </>
        )}
      </button>
      {open && (
        <div role="menu" className={cx('absolute z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lg', collapsed ? 'left-0' : 'inset-x-0 w-auto min-w-56')}>
          <p className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Mes boutiques</p>
          <div className="max-h-72 overflow-y-auto">
            {me.stores.map((s) => (
              <button key={s.id} type="button" role="menuitem" onClick={() => go(`/stores/${s.id}`)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-bold">{initial(s.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.name}</span>
                  <span className="block truncate text-[12px] text-muted">{ROLE_LABEL[s.role]}</span>
                </span>
                {s.id === store.id && <Check className="size-4 shrink-0 text-accent" aria-label="Boutique actuelle" />}
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-line pt-1">
            <button type="button" role="menuitem" onClick={() => go('/onboarding')} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium hover:bg-surface-2">
              <span className="flex size-7 items-center justify-center rounded-md border border-dashed border-line-strong">
                <Plus className="size-4" />
              </span>
              Nouvelle boutique
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [collapsed, setCollapsed] = useState(() => readLocal(SIDEBAR_KEY) === '1')
  const toggleSidebar = () => {
    setCollapsed((v) => {
      writeLocal(SIDEBAR_KEY, v ? null : '1')
      return !v
    })
  }
  const permissions = usePermissions()
  const nav = NAV.filter((i) => (i.to === 'settings' ? SETTINGS_PERMS.some((p) => permissions.includes(p)) : !i.perm || permissions.includes(i.perm)))
  const primaryMobile = nav.slice(0, 4)
  const moreMobile = nav.slice(4)
  const canOrders = permissions.includes('orders.view')
  // Commandes à traiter (nouvelles) : pastille sur l'onglet Commandes.
  const pending = useOrders({ fulfillmentStatus: 'new', pageSize: 1 }, canOrders)
  const newCount = pending.data?.total
  // Annonce les ventes dans l'app ouverte, pour tous les comptes (push activé ou non).
  useOrderAlerts(storeId, canOrders)
  // Ce navigateur notifie le compte connecté, pas celui qui l'avait abonné avant.
  useEffect(() => {
    if (me?.id) void syncPushSubscription()
  }, [me?.id])

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
    <div className={cx('min-h-dvh transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
      {navigation.state === 'loading' && <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-accent" role="progressbar" aria-label="Chargement" />}

      {/* Barre latérale desktop (repliable) */}
      <aside className={cx('fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex', collapsed ? 'w-[72px]' : 'w-64')}>
        <div className={cx('flex h-14 items-center', collapsed ? 'justify-center' : 'justify-between pr-2 pl-5')}>
          {!collapsed && <Logo />}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'} title={collapsed ? 'Déplier le menu' : 'Replier le menu'}>
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          </Button>
        </div>
        <div className={cx('mb-2 rounded-lg border border-line', collapsed ? 'mx-2 p-1' : 'mx-3 p-1')}>
          <StoreSwitcher collapsed={collapsed} />
        </div>
        <nav className={cx('flex-1 space-y-0.5 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')} aria-label="Navigation principale">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={href(item.to)}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cx(
                  'relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  isActive ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cx('size-[18px] shrink-0', isActive && 'text-accent')} aria-hidden />
                  {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                  {item.to === 'orders' &&
                    (collapsed ? (
                      !!newCount && <span className="absolute top-1 right-2 size-2 rounded-full bg-accent" aria-label={`${newCount} nouvelles`} />
                    ) : (
                      <NavBadge count={newCount} />
                    ))}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className={cx('space-y-0.5 border-t border-line py-2', collapsed ? 'px-2' : 'px-3')}>
          <NavLink to="/billing" title={collapsed ? 'Abonnement' : undefined} className={cx('flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg', collapsed ? 'justify-center' : 'px-3')}>
            <Crown className="size-[18px] shrink-0" aria-hidden />
            {collapsed ? <span className="sr-only">Abonnement</span> : 'Abonnement'}
          </NavLink>
          {me?.isPlatformAdmin && (
            <NavLink to="/admin" title={collapsed ? 'Super admin' : undefined} className={cx('flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg', collapsed ? 'justify-center' : 'px-3')}>
              <Shield className="size-[18px] shrink-0" aria-hidden />
              {collapsed ? <span className="sr-only">Super admin</span> : 'Super admin'}
            </NavLink>
          )}
        </div>
        <div className="border-t border-line p-3">
          <div className={cx('flex items-center gap-2', collapsed && 'flex-col')}>
            {!collapsed && (
              <div className="min-w-0 flex-1 px-2">
                <p className="truncate text-sm font-medium">{me?.name}</p>
                <p className="truncate text-[12px] text-muted">{me?.email}</p>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={theme.toggle} aria-label={theme.dark ? 'Mode clair' : 'Mode sombre'} title={theme.dark ? 'Mode clair' : 'Mode sombre'}>
              {theme.dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={doLogout} aria-label="Se déconnecter" title="Se déconnecter" loading={logout.isPending}>
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
        {store?.status === 'paused' && (
          <NavLink to={href('settings')} className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <PauseCircle className="size-4 shrink-0" /> Ta boutique est en pause : personne ne peut commander. <span className="font-semibold underline">Rouvrir</span>
          </NavLink>
        )}
        {me?.plan && ['early', 'free', 'expired'].includes(me.plan.reason) && (
          <NavLink to="/billing" className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:border-accent">
            <Crown className="size-4 shrink-0 text-accent" />
            <span className="flex-1">
              {me.plan.reason === 'early' && <>Ton mois offert en Pro se termine le {new Date(me.plan.until!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}.</>}
              {me.plan.reason === 'free' && <>Tu es sur l’offre gratuite (limitée) jusqu’au {new Date(me.plan.until!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}.</>}
              {me.plan.reason === 'expired' && <>L’offre gratuite est terminée : choisis une formule pour continuer.</>}
            </span>
            <span className="font-semibold text-accent">Voir les formules</span>
          </NavLink>
        )}
        <EnableNotificationsBanner settingsHref={`/stores/${storeId}/notifications`} />
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
          <NavLink to="/billing" className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-surface-2">
            <Crown className="size-5 text-muted" aria-hidden />
            Abonnement
          </NavLink>
          {me?.isPlatformAdmin && (
            <NavLink to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-surface-2">
              <Shield className="size-5 text-muted" aria-hidden />
              Super admin
            </NavLink>
          )}
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
