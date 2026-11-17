import type { NotificationConfig, NotificationDevice, NotificationPreferencesView, NotificationPrefs } from '@zuri/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useStoreId } from './auth'

export const notifKeys = {
  config: ['notifications', 'config'] as const,
  devices: ['notifications', 'devices'] as const,
  prefs: (s: string) => ['store', s, 'notifications', 'prefs'] as const,
}

export function useNotificationConfig() {
  return useQuery({ queryKey: notifKeys.config, queryFn: () => api.get<NotificationConfig>('/notifications/config'), staleTime: 60_000 })
}

export function useDevices() {
  return useQuery({ queryKey: notifKeys.devices, queryFn: () => api.get<NotificationDevice[]>('/notifications/devices') })
}

export function useRemoveDevice() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number) => api.del(`/notifications/devices/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.devices }) })
}

export function useNotificationPrefs() {
  const s = useStoreId()
  return useQuery({ queryKey: notifKeys.prefs(s), queryFn: () => api.get<NotificationPreferencesView>(`/stores/${s}/notifications/preferences`) })
}

export function useSaveNotificationPrefs() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prefs: NotificationPrefs) => api.put(`/stores/${s}/notifications/preferences`, { prefs }),
    onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.prefs(s) }),
  })
}

export function useTestNotification() {
  return useMutation({ mutationFn: () => api.post<{ push: number; telegram: boolean }>('/notifications/test') })
}

export function useTelegramLink() {
  return useMutation({ mutationFn: () => api.post<{ url: string }>('/notifications/telegram/link') })
}

export function useTelegramUnlink() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => api.del('/notifications/telegram'), onSuccess: () => qc.invalidateQueries({ queryKey: notifKeys.config }) })
}
