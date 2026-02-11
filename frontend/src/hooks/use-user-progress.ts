import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getMuscleGroups } from '@/lib/api-client'
import {
  getUserCoaches,
  getFrequencyProgress,
  getMuscleGroupProgress,
  getUserSessions,
  updateSession,
  updateSessionLog,
} from '@/lib/user-api-client'
import { useAuth } from '@/hooks/use-auth'
import type {
  FrequencyProgressQueryParams,
  ProgressDateRangeQueryParams,
  UserSessionHistoryQueryParams,
} from '@/types/progress'
import type { SessionLogUpdatePayload, SessionUpdatePayload } from '@/types/sessions'

const USER_COACHES_QUERY_KEY = ['user-coaches']
const USER_SESSIONS_QUERY_KEY = ['user-progress-sessions']
const USER_MUSCLE_PROGRESS_QUERY_KEY = ['user-progress-muscle-groups']
const USER_FREQUENCY_PROGRESS_QUERY_KEY = ['user-progress-frequency']
const USER_MUSCLE_GROUP_OPTIONS_QUERY_KEY = ['user-muscle-group-options']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to access user progress data.')
  }
  return token
}

export function useUserCoachesQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: USER_COACHES_QUERY_KEY,
    queryFn: () => getUserCoaches(assertToken(accessToken)),
  })
}

export function useUserMuscleGroupsQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: USER_MUSCLE_GROUP_OPTIONS_QUERY_KEY,
    queryFn: () => getMuscleGroups(assertToken(accessToken)),
    staleTime: 30 * 60 * 1000,
  })
}

export function useUserSessionsQuery(params: UserSessionHistoryQueryParams) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...USER_SESSIONS_QUERY_KEY, params],
    queryFn: () => getUserSessions(assertToken(accessToken), params),
  })
}

export function useMuscleGroupProgressQuery(params: ProgressDateRangeQueryParams) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...USER_MUSCLE_PROGRESS_QUERY_KEY, params],
    queryFn: () => getMuscleGroupProgress(assertToken(accessToken), params),
  })
}

export function useFrequencyProgressQuery(params: FrequencyProgressQueryParams) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...USER_FREQUENCY_PROGRESS_QUERY_KEY, params],
    queryFn: () => getFrequencyProgress(assertToken(accessToken), params),
  })
}

function invalidateProgressQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: USER_SESSIONS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_MUSCLE_PROGRESS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_FREQUENCY_PROGRESS_QUERY_KEY })
}

export function useUpdateSessionMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: SessionUpdatePayload }) =>
      updateSession(assertToken(accessToken), sessionId, payload),
    onSuccess: () => {
      invalidateProgressQueries(queryClient)
    },
  })
}

export function useUpdateSessionLogMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      logId,
      payload,
    }: {
      sessionId: string
      logId: string
      payload: SessionLogUpdatePayload
    }) => updateSessionLog(assertToken(accessToken), sessionId, logId, payload),
    onSuccess: () => {
      invalidateProgressQueries(queryClient)
    },
  })
}
