import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  assignCoaches,
  createUser,
  deactivateUser,
  getAdminOverview,
  getUserById,
  getUsers,
  removeCoachAssignment,
  updateUser,
} from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import type {
  CoachAssignmentPayload,
  UserCreatePayload,
  UserListQueryParams,
  UserUpdatePayload,
} from '@/types/users'

const ADMIN_OVERVIEW_QUERY_KEY = ['admin-overview']
const ADMIN_USERS_QUERY_KEY = ['admin-users']
const ADMIN_USER_DETAIL_QUERY_KEY = ['admin-user-detail']
const COACH_OPTIONS_QUERY_KEY = ['admin-coach-options']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to access admin data.')
  }
  return token
}

export function useAdminOverviewQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: ADMIN_OVERVIEW_QUERY_KEY,
    queryFn: () => getAdminOverview(assertToken(accessToken)),
  })
}

export function useAdminUsersQuery(params: UserListQueryParams) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: () => getUsers(assertToken(accessToken), params),
  })
}

export function useAdminUserDetailQuery(userId: string | null, enabled = true) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...ADMIN_USER_DETAIL_QUERY_KEY, userId],
    queryFn: () => {
      if (!userId) {
        throw new Error('A user ID is required.')
      }
      return getUserById(assertToken(accessToken), userId)
    },
    enabled: Boolean(userId) && enabled,
  })
}

export function useCoachOptionsQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: COACH_OPTIONS_QUERY_KEY,
    queryFn: async () =>
      getUsers(assertToken(accessToken), {
        page: 1,
        page_size: 100,
        role: 'coach',
        is_active: true,
      }),
  })
}

export function useCreateUserMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(assertToken(accessToken), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: COACH_OPTIONS_QUERY_KEY })
    },
  })
}

export function useUpdateUserMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UserUpdatePayload }) =>
      updateUser(assertToken(accessToken), userId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_QUERY_KEY })
      void queryClient.invalidateQueries({
        queryKey: [...ADMIN_USER_DETAIL_QUERY_KEY, variables.userId],
      })
      void queryClient.invalidateQueries({ queryKey: COACH_OPTIONS_QUERY_KEY })
    },
  })
}

export function useDeactivateUserMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deactivateUser(assertToken(accessToken), userId),
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...ADMIN_USER_DETAIL_QUERY_KEY, userId] })
      void queryClient.invalidateQueries({ queryKey: COACH_OPTIONS_QUERY_KEY })
    },
  })
}

export function useAssignCoachesMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: CoachAssignmentPayload }) =>
      assignCoaches(assertToken(accessToken), userId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({
        queryKey: [...ADMIN_USER_DETAIL_QUERY_KEY, variables.userId],
      })
    },
  })
}

export function useRemoveCoachAssignmentMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, coachId }: { userId: string; coachId: string }) =>
      removeCoachAssignment(assertToken(accessToken), userId, coachId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void queryClient.invalidateQueries({
        queryKey: [...ADMIN_USER_DETAIL_QUERY_KEY, variables.userId],
      })
    },
  })
}
