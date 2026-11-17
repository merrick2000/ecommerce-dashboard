/**
 * Hooks TanStack Query par ressource. Clés : ['store', storeId, ressource, ...].
 * Chaque mutation invalide ce qu'elle touche ; statuts de commande et
 * activation produit sont optimistes.
 */
import { FULFILLMENT_TRANSITIONS, type FulfillmentStatus, type PaymentStatus, type PaymentProvider } from '@zuri/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { api, type Query } from '@/lib/api'
import type {
  CheckoutSettingsResponse,
  Customer,
  CustomerDetail,
  IntegrationsInfo,
  DeliveryZone,
  OrderDetail,
  OrderList,
  OrderListItem,
  PaymentAccount,
  Product,
  ProductListItem,
  PromoCode,
  StatsOverview,
  Store,
} from '@/lib/types'
import { meKey, useStoreId } from './auth'

const base = (storeId: string) => `/stores/${storeId}`
export const keys = {
  store: (s: string) => ['store', s] as const,
  info: (s: string) => ['store', s, 'info'] as const,
  checkout: (s: string) => ['store', s, 'checkout'] as const,
  products: (s: string) => ['store', s, 'products'] as const,
  product: (s: string, id: string) => ['store', s, 'products', id] as const,
  orders: (s: string) => ['store', s, 'orders'] as const,
  orderList: (s: string, q: Query) => ['store', s, 'orders', 'list', q] as const,
  order: (s: string, id: string) => ['store', s, 'orders', 'detail', id] as const,
  customers: (s: string) => ['store', s, 'customers'] as const,
  customer: (s: string, id: string) => ['store', s, 'customers', id] as const,
  zones: (s: string) => ['store', s, 'zones'] as const,
  promos: (s: string) => ['store', s, 'promos'] as const,
  payments: (s: string) => ['store', s, 'payments'] as const,
  integrations: (s: string) => ['store', s, 'integrations'] as const,
  stats: (s: string, from: string, to: string) => ['store', s, 'stats', from, to] as const,
}

/**
 * Rafraîchissements centralisés : une action sur une commande touche aussi les clients,
 * le stock/les ventes des produits et les chiffres du tableau de bord.
 */
type QC = ReturnType<typeof useQueryClient>
export function refreshAfterOrderChange(qc: QC, s: string) {
  for (const k of [keys.orders(s), keys.customers(s), keys.products(s), [...keys.store(s), 'stats']]) void qc.invalidateQueries({ queryKey: k })
}
export function refreshAfterProductChange(qc: QC, s: string) {
  for (const k of [keys.products(s), [...keys.store(s), 'stats']]) void qc.invalidateQueries({ queryKey: k })
}

// ─── Boutique ────────────────────────────────────────────────────────────────

export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; slug: string; currency: string; country: string; locale?: string }) => api.post<Store>('/stores', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: meKey }),
  })
}

export function useStoreInfo() {
  const s = useStoreId()
  return useQuery({ queryKey: keys.info(s), queryFn: () => api.get<Store>(base(s)) })
}

export function useUpdateStore() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<Store>(base(s), body),
    onSuccess: (store) => {
      qc.setQueryData(keys.info(s), store)
      void qc.invalidateQueries({ queryKey: meKey })
    },
  })
}

export function useCheckoutSettings() {
  const s = useStoreId()
  return useQuery({ queryKey: keys.checkout(s), queryFn: () => api.get<CheckoutSettingsResponse>(`${base(s)}/checkout-settings`) })
}

export function useSaveCheckoutSettings() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: unknown) => api.put(`${base(s)}/checkout-settings`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.checkout(s) }),
  })
}

export function useSaveTracking() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: unknown) => api.put(`${base(s)}/tracking`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.checkout(s) }),
  })
}

// ─── Produits ────────────────────────────────────────────────────────────────

export function useProducts(enabled = true) {
  const s = useStoreId()
  return useQuery({ queryKey: keys.products(s), queryFn: () => api.get<ProductListItem[]>(`${base(s)}/products`), enabled })
}

export function useProduct(id: string | null) {
  const s = useStoreId()
  return useQuery({
    queryKey: keys.product(s, id ?? 'nouveau'),
    queryFn: () => api.get<Product>(`${base(s)}/products/${id}`),
    enabled: id != null,
  })
}

export function useSaveProduct() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: unknown }) =>
      id ? api.put<Product>(`${base(s)}/products/${id}`, body) : api.post<Product>(`${base(s)}/products`, body),
    onSuccess: (p) => {
      qc.setQueryData(keys.product(s, p.id), p)
      refreshAfterProductChange(qc, s)
    },
  })
}

export function useToggleProductActive() {
  const s = useStoreId()
  const qc = useQueryClient()
  const key = keys.products(s)
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`${base(s)}/products/${id}/active`, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: key, exact: true })
      const prev = qc.getQueryData<ProductListItem[]>(key)
      qc.setQueryData<ProductListItem[]>(key, (list) => list?.map((p) => (p.id === id ? { ...p, isActive } : p)))
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: (_d, _e, { id }) => {
      void qc.invalidateQueries({ queryKey: key, exact: true })
      void qc.invalidateQueries({ queryKey: keys.product(s, id) })
    },
  })
}

export function useBulkProductActive() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { ids: string[]; isActive: boolean }) => api.post(`${base(s)}/products/bulk-active`, body),
    onSettled: () => refreshAfterProductChange(qc, s),
  })
}

export function useDuplicateProduct() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Product>(`${base(s)}/products/${id}/duplicate`),
    onSuccess: () => refreshAfterProductChange(qc, s),
  })
}

export function useDeleteProduct() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`${base(s)}/products/${id}`),
    onSuccess: (_d, id) => {
      qc.setQueryData<ProductListItem[]>(keys.products(s), (l) => l?.filter((p) => p.id !== id))
      qc.removeQueries({ queryKey: keys.product(s, id) })
      refreshAfterProductChange(qc, s)
    },
  })
}

// ─── Commandes ───────────────────────────────────────────────────────────────

export function useOrders(q: Query, enabled = true) {
  const s = useStoreId()
  return useQuery({
    queryKey: keys.orderList(s, q),
    queryFn: ({ signal }) => api.get<OrderList>(`${base(s)}/orders`, q, signal),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

export function useOrder(id: string) {
  const s = useStoreId()
  return useQuery({ queryKey: keys.order(s, id), queryFn: () => api.get<OrderDetail>(`${base(s)}/orders/${id}`) })
}

export interface StatusChange {
  id: string
  fulfillmentStatus: FulfillmentStatus
  note?: string
  courier?: string
  trackingNumber?: string
}

/** Applique un statut dans toutes les listes et le détail en cache. */
function patchOrderCaches(qc: ReturnType<typeof useQueryClient>, s: string, ids: string[], status: FulfillmentStatus) {
  const snapshots: [QueryKey, unknown][] = qc.getQueriesData({ queryKey: keys.orders(s) })
  qc.setQueriesData<OrderList>({ queryKey: [...keys.orders(s), 'list'] }, (l) =>
    l ? { ...l, data: l.data.map((o: OrderListItem) => (ids.includes(o.id) ? { ...o, fulfillmentStatus: status } : o)) } : l,
  )
  for (const id of ids) {
    qc.setQueryData<OrderDetail>(keys.order(s, id), (o) => (o ? { ...o, fulfillmentStatus: status, allowedTransitions: FULFILLMENT_TRANSITIONS[status] } : o))
  }
  return snapshots
}

export function useOrderStatus() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: StatusChange) => api.post(`${base(s)}/orders/${id}/status`, body),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: keys.orders(s) })
      return { snapshots: patchOrderCaches(qc, s, [v.id], v.fulfillmentStatus) }
    },
    onError: (_e, _v, ctx) => ctx?.snapshots.forEach(([k, d]) => qc.setQueryData(k, d)),
    onSettled: () => {
      refreshAfterOrderChange(qc, s)
    },
  })
}

export function useBulkOrderStatus() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, ...body }: Omit<StatusChange, 'id'> & { ids: string[] }) =>
      api.post<{ results: { id: string; ok: boolean; error?: string }[] }>(`${base(s)}/orders/bulk-status`, { ids, ...body }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: keys.orders(s) })
      return { snapshots: patchOrderCaches(qc, s, v.ids, v.fulfillmentStatus) }
    },
    onError: (_e, _v, ctx) => ctx?.snapshots.forEach(([k, d]) => qc.setQueryData(k, d)),
    onSettled: () => {
      refreshAfterOrderChange(qc, s)
    },
  })
}

export function useOrderPayment(id: string) {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { paymentStatus: PaymentStatus; note?: string }) => api.post(`${base(s)}/orders/${id}/payment`, body),
    onSettled: () => refreshAfterOrderChange(qc, s),
  })
}

export function useOrderNote(id: string) {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (note: string) => api.post(`${base(s)}/orders/${id}/notes`, { note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.order(s, id) }),
  })
}

export function useUpdateOrder(id: string) {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, string | null>) => api.patch(`${base(s)}/orders/${id}`, body),
    onSuccess: () => refreshAfterOrderChange(qc, s),
  })
}

export function useCreateManualOrder() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: unknown) => api.post<{ id: string; orderNumber: string }>(`${base(s)}/orders`, body),
    onSuccess: () => {
      refreshAfterOrderChange(qc, s)
    },
  })
}

export const ordersCsvUrl = (storeId: string, q: Query) => {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) if (v != null && v !== '' && k !== 'page') qs.set(k, String(v))
  const str = qs.toString()
  return `/api/stores/${storeId}/orders/export.csv${str ? `?${str}` : ''}`
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export function useCustomers(q: string, page = 1) {
  const s = useStoreId()
  return useQuery({
    queryKey: [...keys.customers(s), 'list', q, page],
    queryFn: ({ signal }) => api.get<{ data: Customer[]; total: number; page: number; pageSize: number }>(`${base(s)}/customers`, { q, page }, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCustomer(id: string) {
  const s = useStoreId()
  return useQuery({ queryKey: keys.customer(s, id), queryFn: () => api.get<CustomerDetail>(`${base(s)}/customers/${id}`) })
}

export function useUpdateCustomer(id: string) {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { isBlocked?: boolean; notes?: string | null; name?: string; phone?: string; email?: string | null; city?: string | null; address?: string | null }) => api.patch<Customer>(`${base(s)}/customers/${id}`, body),
    onSuccess: (c) => {
      qc.setQueryData<CustomerDetail>(keys.customer(s, id), (d) => (d ? { ...d, ...c } : d))
      void qc.invalidateQueries({ queryKey: keys.customers(s) })
      void qc.invalidateQueries({ queryKey: keys.orders(s) })
    },
  })
}

// ─── Zones & codes promo (CRUD simples) ──────────────────────────────────────

function useCrud<T extends { id: number }>(resource: 'zones' | 'promo-codes', keyFn: (s: string) => QueryKey) {
  const s = useStoreId()
  const qc = useQueryClient()
  const key = keyFn(s)
  const list = useQuery({ queryKey: key, queryFn: () => api.get<T[]>(`${base(s)}/${resource}`) })
  const save = useMutation({
    mutationFn: ({ id, body }: { id: number | null; body: unknown }) =>
      id ? api.put<T>(`${base(s)}/${resource}/${id}`, body) : api.post<T>(`${base(s)}/${resource}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.del(`${base(s)}/${resource}/${id}`),
    onSuccess: (_d, id) => qc.setQueryData<T[]>(key, (l) => l?.filter((x) => x.id !== id)),
  })
  return { list, save, remove }
}

export const useZones = () => useCrud<DeliveryZone>('zones', keys.zones)
export const usePromoCodes = () => useCrud<PromoCode>('promo-codes', keys.promos)

// ─── Paiements ───────────────────────────────────────────────────────────────

export function usePaymentAccounts(enabled = true) {
  const s = useStoreId()
  return useQuery({
    queryKey: keys.payments(s),
    queryFn: () => api.get<PaymentAccount[]>(`${base(s)}/payment-accounts`),
    enabled,
    retry: (n, e) => !(e && 'status' in e && (e.status === 403 || e.status === 404)) && n < 2,
  })
}

export function useSavePaymentAccount() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ provider, body }: { provider: PaymentProvider; body: unknown }) => api.put(`${base(s)}/payment-accounts/${provider}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.payments(s) }),
  })
}

// ─── Intégrations (webhook Selar via n8n/Zapier) ─────────────────────────────

export function useIntegrations(enabled = true) {
  const s = useStoreId()
  return useQuery({ queryKey: keys.integrations(s), queryFn: () => api.get<IntegrationsInfo>(`${base(s)}/integrations`), enabled })
}

export function useRotateIntegrationSecret() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ secret: string }>(`${base(s)}/integrations/secret`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.integrations(s) })
      void qc.invalidateQueries({ queryKey: keys.info(s) })
    },
  })
}

// ─── Stats & uploads ─────────────────────────────────────────────────────────

export function useStats(from: string, to: string) {
  const s = useStoreId()
  return useQuery({
    queryKey: keys.stats(s, from, to),
    // Les nouvelles commandes apparaissent sans recharger la page.
    refetchInterval: 60_000,
    queryFn: () => api.get<StatsOverview>(`${base(s)}/stats/overview`, { from, to }),
    placeholderData: keepPreviousData,
  })
}

export function uploadImage(storeId: string, file: File, preset: 'cover' | 'thumbnail' | 'content' | 'gallery', onProgress?: (ratio: number) => void) {
  return api.upload<{ key: string; url: string | null; size: number }>(`${base(storeId)}/uploads/image`, file, { preset }, onProgress)
}

export function uploadFile(storeId: string, file: File, onProgress?: (ratio: number) => void) {
  return api.upload<{ key: string; name: string; size: number }>(`${base(storeId)}/uploads/file`, file, undefined, onProgress)
}
