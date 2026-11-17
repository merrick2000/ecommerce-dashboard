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
              { path: 'products/:productId', lazy: page(() => import('@/pages/products/ProductEditor')) },
              { path: 'customers', lazy: page(() => import('@/pages/customers/CustomersList')) },
              { path: 'customers/:customerId', lazy: page(() => import('@/pages/customers/CustomerDetail')) },
              { path: 'zones', lazy: page(() => import('@/pages/Zones')) },
              { path: 'promo-codes', lazy: page(() => import('@/pages/PromoCodes')) },
              { path: 'settings', lazy: page(() => import('@/pages/settings/Settings')) },
              { path: 'team', lazy: page(() => import('@/pages/team/Team')) },
              { path: 'activity', lazy: page(() => import('@/pages/Activity')) },
              { path: '*', element: <NotFound /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
