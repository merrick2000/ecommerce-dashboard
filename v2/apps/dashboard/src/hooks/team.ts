/**
 * Équipe, invitations, attribution des commandes et journal d'activité.
 * Chaque hook est désactivé quand le membre n'a pas la permission (pas de 403 inutiles).
 */
import type { ActivityItem, InvitationCreate, InvitationPreview, Me, MemberUpdate, Paginated, TeamInvitation, TeamMember } from '@zuri/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, request } from '@/lib/api'
import { meKey, useCan, useStoreId } from './auth'
import { keys, refreshAfterOrderChange } from './resources'

const base = (s: string) => `/stores/${s}`

export const teamKeys = {
  team: (s: string) => ['store', s, 'team'] as const,
  assignees: (s: string) => ['store', s, 'team', 'assignees'] as const,
  activity: (s: string, q: ActivityQuery) => ['store', s, 'activity', q] as const,
  invitation: (token: string) => ['invitation', token] as const,
}

export interface Assignee {
  userId: number
  name: string
}

// ─── Équipe ──────────────────────────────────────────────────────────────────

export function useTeam() {
  const s = useStoreId()
  const can = useCan('team.manage')
  return useQuery({
    queryKey: teamKeys.team(s),
    queryFn: () => api.get<{ members: TeamMember[]; invitations: TeamInvitation[] }>(`${base(s)}/team`),
    enabled: can,
  })
}

/** Membres pouvant traiter des commandes : menu « Attribuer à ». */
export function useAssignees(enabled = true) {
  const s = useStoreId()
  return useQuery({
    queryKey: teamKeys.assignees(s),
    queryFn: () => api.get<Assignee[]>(`${base(s)}/team/assignees`),
    enabled,
    staleTime: 5 * 60_000,
  })
}

/** Tous les membres de la boutique : filtre « par membre » du fil d'activité. */
export function usePeople(enabled = true) {
  const s = useStoreId()
  return useQuery({
    queryKey: ['store', s, 'team', 'people'] as const,
    queryFn: () => api.get<Assignee[]>(`${base(s)}/team/people`),
    enabled,
    staleTime: 5 * 60_000,
  })
}

function useTeamMutation<TArgs, TRes>(fn: (s: string, args: TArgs) => Promise<TRes>) {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: TArgs) => fn(s, args),
    onSuccess: () => void qc.invalidateQueries({ queryKey: teamKeys.team(s) }),
  })
}

export const useInviteMember = () =>
  useTeamMutation((s, body: InvitationCreate) => api.post<{ invitation: TeamInvitation; inviteUrl: string }>(`${base(s)}/team/invitations`, body))

export const useResendInvitation = () => useTeamMutation((s, id: string) => api.post<{ inviteUrl: string }>(`${base(s)}/team/invitations/${id}/resend`))

export const useRevokeInvitation = () => useTeamMutation((s, id: string) => api.del<{ ok: true }>(`${base(s)}/team/invitations/${id}`))

export const useUpdateMember = () =>
  useTeamMutation((s, { userId, ...body }: MemberUpdate & { userId: number }) => api.patch<TeamMember>(`${base(s)}/team/members/${userId}`, body))

export function useRemoveMember() {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => api.del<{ ok: true }>(`${base(s)}/team/members/${userId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: teamKeys.team(s) })
      // Ses commandes en cours redeviennent libres.
      refreshAfterOrderChange(qc, s)
    },
  })
}

// ─── Invitation (page publique) ──────────────────────────────────────────────

export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: teamKeys.invitation(token),
    queryFn: () => request<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`, { silent401: true }),
    enabled: token.length >= 20,
    retry: false,
  })
}

function useJoinMutation<TArgs>(fn: (args: TArgs) => Promise<Me>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (me) => {
      qc.clear()
      qc.setQueryData(meKey, me)
    },
  })
}

export const useAcceptInvitation = () => useJoinMutation((token: string) => api.post<Me>('/invitations/accept', { token }))

export const useRegisterWithInvite = () => useJoinMutation((body: { token: string; name: string; password: string }) => api.post<Me>('/auth/register-invite', body))

// ─── Attribution des commandes ───────────────────────────────────────────────

function useOrderAssignMutation<TArgs>(id: string, fn: (s: string, args: TArgs) => Promise<unknown>) {
  const s = useStoreId()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: TArgs) => fn(s, args),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.order(s, id) })
      refreshAfterOrderChange(qc, s)
    },
  })
}

export const useClaimOrder = (id: string) => useOrderAssignMutation(id, (s, _: void) => api.post(`${base(s)}/orders/${id}/claim`))
export const useReleaseOrder = (id: string) => useOrderAssignMutation(id, (s, _: void) => api.post(`${base(s)}/orders/${id}/release`))
export const useAssignOrder = (id: string) => useOrderAssignMutation(id, (s, userId: number | null) => api.post(`${base(s)}/orders/${id}/assign`, { userId }))

// ─── Activité ────────────────────────────────────────────────────────────────

export interface ActivityQuery {
  page: number
  userId?: number
  entityType?: string
}

export function useActivity(q: ActivityQuery) {
  const s = useStoreId()
  const can = useCan('activity.view')
  return useQuery({
    queryKey: teamKeys.activity(s, q),
    queryFn: ({ signal }) => api.get<Paginated<ActivityItem>>(`${base(s)}/activity`, { page: q.page, userId: q.userId, entityType: q.entityType }, signal),
    enabled: can,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}
