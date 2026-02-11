import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { getAdminOverview, getPlans, getUsers, getWorkouts } from '@/lib/api-client'
import {
  getPendingPlans,
  getUserQuickStats,
  getUserTodayWorkout,
  getUserWeekPlan,
} from '@/lib/user-api-client'

export function RoleDataPrefetcher() {
  const queryClient = useQueryClient()
  const { user, accessToken, isAuthenticated } = useAuth()
  const canPrefetch = isAuthenticated && Boolean(user) && Boolean(accessToken)

  useEffect(() => {
    if (!canPrefetch || !user || !accessToken) {
      return
    }

    if (user.role === 'admin') {
      void queryClient.prefetchQuery({
        queryKey: ['admin-overview'],
        queryFn: () => getAdminOverview(accessToken),
      })
      void queryClient.prefetchQuery({
        queryKey: ['admin-users', { page: 1, page_size: 10, is_active: true }],
        queryFn: () => getUsers(accessToken, { page: 1, page_size: 10, is_active: true }),
      })
      void queryClient.prefetchQuery({
        queryKey: ['admin-workouts', { page: 1, page_size: 10, is_archived: false }],
        queryFn: () => getWorkouts(accessToken, { page: 1, page_size: 10, is_archived: false }),
      })
      return
    }

    if (user.role === 'coach') {
      void queryClient.prefetchQuery({
        queryKey: ['coach-plans', { page: 1, page_size: 10, is_archived: false }],
        queryFn: () => getPlans(accessToken, { page: 1, page_size: 10, is_archived: false }),
      })
      return
    }

    void queryClient.prefetchQuery({
      queryKey: ['user-today-workout'],
      queryFn: () => getUserTodayWorkout(accessToken),
    })
    void queryClient.prefetchQuery({
      queryKey: ['user-week-plan'],
      queryFn: () => getUserWeekPlan(accessToken),
    })
    void queryClient.prefetchQuery({
      queryKey: ['user-quick-stats'],
      queryFn: () => getUserQuickStats(accessToken),
    })
    void queryClient.prefetchQuery({
      queryKey: ['user-pending-plans'],
      queryFn: () => getPendingPlans(accessToken),
    })
  }, [accessToken, canPrefetch, queryClient, user])

  if (!canPrefetch) {
    return null
  }

  return null
}
