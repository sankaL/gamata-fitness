import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { activatePendingPlan, declinePendingPlan, getPendingPlans } from '@/lib/user-api-client'

const USER_PENDING_PLANS_QUERY_KEY = ['user-pending-plans']
const USER_TODAY_QUERY_KEY = ['user-today-workout']
const USER_WEEK_PLAN_QUERY_KEY = ['user-week-plan']
const USER_STATS_QUERY_KEY = ['user-quick-stats']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to access plan activation data.')
  }
  return token
}

function invalidateRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: USER_PENDING_PLANS_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_TODAY_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_WEEK_PLAN_QUERY_KEY })
  void queryClient.invalidateQueries({ queryKey: USER_STATS_QUERY_KEY })
}

export function useUserPendingPlansQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: USER_PENDING_PLANS_QUERY_KEY,
    queryFn: () => getPendingPlans(assertToken(accessToken)),
    staleTime: 15_000,
  })
}

export function useActivatePendingPlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      activatePendingPlan(assertToken(accessToken), assignmentId),
    onSuccess: () => {
      invalidateRelatedQueries(queryClient)
    },
  })
}

export function useDeclinePendingPlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: string) =>
      declinePendingPlan(assertToken(accessToken), assignmentId),
    onSuccess: () => {
      invalidateRelatedQueries(queryClient)
    },
  })
}
