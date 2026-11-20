import { PERMISSIONS, type Me, type Permission, type StoreRole } from '@zuri/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { api, ApiError, request } from '@/lib/api'
import { detachPushFromAccount } from '@/lib/push'

export const meKey = ['me'] as const

/** null = non connecté (le 401 de /me n'est pas une erreur). */
export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await request<Me>('/auth/me', { silent401: true })
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => request<Me>('/auth/login', { method: 'POST', body, silent401: true }),
    onSuccess: (me) => {
      qc.clear()
      qc.setQueryData(meKey, me)
    },
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string; phone?: string; source?: { from?: string } }) => api.post<Me>('/auth/register', body),
    onSuccess: (me) => qc.setQueryData(meKey, me),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      // Avant la fin de session : ce navigateur cesse de recevoir les notifications de ce compte.
      await detachPushFromAccount()
      return api.post<{ ok: true }>('/auth/logout')
    },
    onSettled: () => {
      qc.clear()
      qc.setQueryData(meKey, null)
    },
  })
}

/** Boutique courante (depuis l'URL) + rôle de l'utilisateur. */
export function useCurrentStore() {
  const { storeId } = useParams()
  const { data: me } = useMe()
  const id = storeId ?? ''
  const store = me?.stores.find((s) => s.id === id) ?? null
  const role: StoreRole | null = store?.role ?? (me?.isPlatformAdmin ? 'owner' : null)
  // Admin plateforme sans appartenance : accès complet, comme côté API.
  const permissions: readonly Permission[] = store?.permissions ?? (me?.isPlatformAdmin ? PERMISSIONS : [])
  const productIds = store ? store.productIds : null
  return { storeId: id, store, me: me ?? null, role, permissions, productIds }
}

/** Identifiant numérique de la boutique de l'URL, utilisé par tous les hooks de ressources. */
export function useStoreId(): string {
  const { storeId } = useParams()
  return storeId ?? ''
}

/** Devise de la boutique courante (FCFA par défaut). */
export function useCurrency(): string {
  return useCurrentStore().store?.currency ?? 'XOF'
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: { email: string }) => api.post<{ ok: true }>('/auth/password/forgot', body),
  })
}

/** Le lien de réinitialisation connecte directement : on repart d'un cache propre. */
export function useResetPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { token: string; password: string }) => api.post<Me>('/auth/password/reset', body),
    onSuccess: (me) => {
      qc.clear()
      qc.setQueryData(meKey, me)
    },
  })
}

/** Permissions du membre connecté dans la boutique courante. */
export function usePermissions() {
  const { permissions } = useCurrentStore()
  return permissions
}

/** Vrai si le membre connecté a cette permission (ou au moins une si plusieurs). */
export function useCan(...perms: Permission[]) {
  const permissions = usePermissions()
  return perms.some((p) => permissions.includes(p))
}
