import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { FullPageSpinner, HomeRedirect, NotFound, RequireAuth, RouteError } from '@/components/layout/Guards'

/** Route chargée à la demande : chaque écran est un chunk séparé. */
const page = (load: () => Promise<{ default: ComponentType }>): RouteObject['lazy'] => async () => ({ Component: (await load()).default })

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    HydrateFallback: FullPageSpinner,
    children: [
      { path: '/login', lazy: page(() => import('@/pages/auth/Login')) },
      { path: '/register', lazy: page(() => import('@/pages/auth/Register')) },
      { path: '/forgot-password', lazy: page(() => import('@/pages/auth/ForgotPassword')) },
      { path: '/reset-password', lazy: page(() => import('@/pages/auth/ResetPassword')) },
      { path: '/invite', lazy: page(() => import('@/pages/auth/AcceptInvite')) },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'onboarding', lazy: page(() => import('@/pages/Onboarding')) },
          { path: 'billing', lazy: page(() => import('@/pages/billing/Billing')) },
          { path: 'referrals', lazy: page(() => import('@/pages/Referrals')) },
          {
            path: 'admin',
            lazy: page(() => import('@/pages/admin/AdminShell')),
            errorElement: <RouteError />,
            children: [
              { index: true, lazy: page(() => import('@/pages/admin/Overview')) },
              { path: 'users', lazy: page(() => import('@/pages/admin/Users')) },
              { path: 'users/:userId', lazy: page(() => import('@/pages/admin/UserDetail')) },
              { path: 'stores', lazy: page(() => import('@/pages/admin/Stores')) },
              { path: 'messages', lazy: page(() => import('@/pages/admin/Messages')) },
              { path: 'reviews', lazy: page(() => import('@/pages/admin/Reviews')) },
              { path: 'settings', lazy: page(() => import('@/pages/admin/Settings')) },
            ],
          },
          {
            path: 'stores/:storeId',
            element: <AppShell />,
            errorElement: <RouteError />,
            children: [
              { index: true, lazy: page(() => import('@/pages/Dashboard')) },
              { path: 'orders', lazy: page(() => import('@/pages/orders/OrdersList')) },
              { path: 'orders/new', lazy: page(() => import('@/pages/orders/ManualOrder')) },
              { path: 'orders/:orderId', lazy: page(() => import('@/pages/orders/OrderDetail')) },
              { path: 'products', lazy: page(() => import('@/pages/products/ProductsList')) },
              { path: 'products/new', lazy: page(() => import('@/pages/products/ProductEditor')) },
              { path: 'products/import/url', lazy: page(() => import('@/pages/products/import/ImportUrl')) },
              { path: 'products/import', lazy: page(() => import('@/pages/products/import/ImportHub')) },
              { path: 'products/import/csv', lazy: page(() => import('@/pages/products/import/ImportCsv')) },
              { path: 'products/:productId', lazy: page(() => import('@/pages/products/ProductEditor')) },
              { path: 'customers', lazy: page(() => import('@/pages/customers/CustomersList')) },
              { path: 'traffic', lazy: page(() => import('@/pages/Traffic')) },
              { path: 'traffic/live', lazy: page(() => import('@/pages/LiveView')) },
              { path: 'customers/:customerId', lazy: page(() => import('@/pages/customers/CustomerDetail')) },
              { path: 'zones', lazy: page(() => import('@/pages/Zones')) },
              { path: 'promo-codes', lazy: page(() => import('@/pages/PromoCodes')) },
              { path: 'settings', lazy: page(() => import('@/pages/settings/Settings')) },
              { path: 'team', lazy: page(() => import('@/pages/team/Team')) },
              { path: 'activity', lazy: page(() => import('@/pages/Activity')) },
              { path: 'notifications', lazy: page(() => import('@/pages/Notifications')) },
              { path: 'api', lazy: page(() => import('@/pages/ApiKeys')) },
              { path: 'expenses', lazy: page(() => import('@/pages/Expenses')) },
              { path: '*', element: <NotFound /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
