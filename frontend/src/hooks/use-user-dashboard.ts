import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getWorkouts } from '@/lib/api-client'
import {
  completeSession,
  createSession,
  getUserQuickStats,
  getUserTodayWorkout,
  getUserWeekPlan,
  getWorkoutAlternatives,
} from '@/lib/user-api-client'
import { useAuth } from '@/hooks/use-auth'
import type { SessionCreatePayload } from '@/types/sessions'

const USER_TODAY_QUERY_KEY = ['user-today-workout']
const USER_WEEK_PLAN_QUERY_KEY = ['user-week-plan']
const USER_STATS_QUERY_KEY = ['user-quick-stats']
const USER_WORKOUTS_QUERY_KEY = ['user-workout-library']
const USER_WORKOUT_ALTERNATIVES_QUERY_KEY = ['user-workout-alternatives']
const USER_SESSIONS_QUERY_KEY = ['user-progress-sessions']
const USER_PROGRESS_QUERY_KEY = ['user-progress']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to access user dashboard data.')
  }
  return token
}

export function useUserTodayWorkoutQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: USER_TODAY_QUERY_KEY,
    queryFn: () => getUserTodayWorkout(assertToken(accessToken)),
    staleTime: 15 * 1000,
  })
}

export function useUserWeekPlanQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: USER_WEEK_PLAN_QUERY_KEY,
    queryFn: () => getUserWeekPlan(assertToken(accessToken)),
    staleTime: 30 * 1000,
  })
}

export function useUserQuickStatsQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: USER_STATS_QUERY_KEY,
    queryFn: () => getUserQuickStats(assertToken(accessToken)),
    staleTime: 15 * 1000,
  })
}

export function useUserWorkoutAlternativesQuery(workoutId: string | null) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...USER_WORKOUT_ALTERNATIVES_QUERY_KEY, workoutId],
    queryFn: () => {
      if (!workoutId) {
        return Promise.resolve([])
      }
      return getWorkoutAlternatives(assertToken(accessToken), workoutId, 12)
    },
    enabled: Boolean(workoutId),
  })
}

export function useUserWorkoutLibraryQuery(search: string) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...USER_WORKOUTS_QUERY_KEY, search],
    queryFn: () =>
      getWorkouts(assertToken(accessToken), {
        page: 1,
        page_size: 100,
        search: search || undefined,
        is_archived: false,
      }),
  })
}

function invalidateUserDashQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: USER_TODAY_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_WEEK_PLAN_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_STATS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_SESSIONS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_PROGRESS_QUERY_KEY })
}

export function useCreateSessionMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SessionCreatePayload) => createSession(assertToken(accessToken), payload),
    onSuccess: () => {
      invalidateUserDashQueries(queryClient)
    },
  })
}

export function useCompleteSessionMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => completeSession(assertToken(accessToken), sessionId),
    onSuccess: () => {
      invalidateUserDashQueries(queryClient)
    },
  })
}
