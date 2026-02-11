import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addSessionLog,
  completeSession,
  getSession,
  updateSession,
  updateSessionLog,
} from '@/lib/user-api-client'
import { useAuth } from '@/hooks/use-auth'
import type {
  SessionLogCreatePayload,
  SessionLogUpdatePayload,
  SessionUpdatePayload,
} from '@/types/sessions'

const USER_SESSIONS_QUERY_KEY = ['user-progress-sessions']
const USER_STATS_QUERY_KEY = ['user-quick-stats']
const USER_TODAY_QUERY_KEY = ['user-today-workout']
const USER_PROGRESS_QUERY_KEY = ['user-progress']
const USER_SESSION_DETAIL_QUERY_KEY = ['user-session-detail']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to manage workout sessions.')
  }
  return token
}

function invalidateSessionRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: USER_SESSIONS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_STATS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_TODAY_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_PROGRESS_QUERY_KEY })
}

export function useUpdateWorkoutSessionMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: SessionUpdatePayload }) =>
      updateSession(assertToken(accessToken), sessionId, payload),
    onSuccess: (_, variables) => {
      invalidateSessionRelatedQueries(queryClient)
      void queryClient.invalidateQueries({
        queryKey: [...USER_SESSION_DETAIL_QUERY_KEY, variables.sessionId],
      })
    },
  })
}

export function useWorkoutSessionQuery(sessionId: string | null) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...USER_SESSION_DETAIL_QUERY_KEY, sessionId],
    queryFn: () => {
      if (!sessionId) {
        throw new Error('Session ID is required.')
      }
      return getSession(assertToken(accessToken), sessionId)
    },
    enabled: Boolean(sessionId),
  })
}

export function useAddWorkoutSessionLogMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: SessionLogCreatePayload }) =>
      addSessionLog(assertToken(accessToken), sessionId, payload),
    onSuccess: (_, variables) => {
      invalidateSessionRelatedQueries(queryClient)
      void queryClient.invalidateQueries({
        queryKey: [...USER_SESSION_DETAIL_QUERY_KEY, variables.sessionId],
      })
    },
  })
}

export function useUpdateWorkoutSessionLogMutation() {
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
    onSuccess: (_, variables) => {
      invalidateSessionRelatedQueries(queryClient)
      void queryClient.invalidateQueries({
        queryKey: [...USER_SESSION_DETAIL_QUERY_KEY, variables.sessionId],
      })
    },
  })
}

export function useCompleteWorkoutSessionMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => completeSession(assertToken(accessToken), sessionId),
    onSuccess: (_, sessionId) => {
      invalidateSessionRelatedQueries(queryClient)
      void queryClient.invalidateQueries({
        queryKey: [...USER_SESSION_DETAIL_QUERY_KEY, sessionId],
      })
    },
  })
}
