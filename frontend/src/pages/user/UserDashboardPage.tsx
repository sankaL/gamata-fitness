import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CalendarWeekStrip } from '@/components/user/CalendarWeekStrip'
import { ProgressRing } from '@/components/user/ProgressRing'
import { QuickStatsCards } from '@/components/user/QuickStatsCards'
import { RecentWorkoutsList } from '@/components/user/RecentWorkoutsList'
import { TodaysWorkoutCard } from '@/components/user/TodaysWorkoutCard'
import { UserShell } from '@/components/user/UserShell'
import { SwapWorkoutModal } from '@/components/workout/SwapWorkoutModal'
import { useToast } from '@/components/ui/toast-provider'
import {
  useCreateSessionMutation,
  useUserQuickStatsQuery,
  useUserTodayWorkoutQuery,
  useUserWeekPlanQuery,
  useUserWorkoutAlternativesQuery,
} from '@/hooks/use-user-dashboard'
import { useUserSessionsQuery } from '@/hooks/use-user-progress'
import type { DashboardWorkoutSummary } from '@/types/user-dashboard'

export function UserDashboardPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)

  const todayQuery = useUserTodayWorkoutQuery()
  const weekPlanQuery = useUserWeekPlanQuery()
  const statsQuery = useUserQuickStatsQuery()
  const sessionsQuery = useUserSessionsQuery({ page: 1, page_size: 3 })
  const createSessionMutation = useCreateSessionMutation()

  const primaryWorkoutId = todayQuery.data?.workouts[0]?.id ?? null
  const alternativesQuery = useUserWorkoutAlternativesQuery(primaryWorkoutId)

  const weekTotal = weekPlanQuery.data?.days.filter((d) => d.workouts.length > 0).length ?? 0
  const weekCompleted = statsQuery.data?.sessions_this_week ?? 0

  async function startWorkout(workout: DashboardWorkoutSummary, sessionType: 'assigned' | 'swap') {
    const planId = todayQuery.data?.plan_id
    if (!planId) {
      setError('No active plan is available for this workout.')
      return
    }
    try {
      setError(null)
      const session = await createSessionMutation.mutateAsync({
        workout_id: workout.id,
        session_type: sessionType,
        plan_id: planId,
      })
      setIsSwapModalOpen(false)
      showToast('Workout started.', 'success')
      navigate(`/user/workout?sessionId=${session.id}`)
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Unable to start workout.'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <UserShell>
      <CalendarWeekStrip
        weekPlan={weekPlanQuery.data ?? null}
        isLoading={weekPlanQuery.isLoading}
      />

      <ProgressRing completed={weekCompleted} total={weekTotal} />

      <QuickStatsCards stats={statsQuery.data ?? null} isLoading={statsQuery.isLoading} />

      <TodaysWorkoutCard
        today={todayQuery.data ?? null}
        isLoading={todayQuery.isLoading}
        isStarting={createSessionMutation.isPending}
        onStartAssignedWorkout={async () => {
          const workout = todayQuery.data?.workouts[0]
          if (!workout) return
          await startWorkout(workout, 'assigned')
        }}
        onOpenSwap={() => setIsSwapModalOpen(true)}
        onOpenAdHoc={() => navigate('/user/workouts/adhoc')}
      />

      <RecentWorkoutsList
        sessions={sessionsQuery.data?.items ?? []}
        isLoading={sessionsQuery.isLoading}
      />

      {todayQuery.error ? (
        <p className="text-sm text-destructive">
          {todayQuery.error instanceof Error
            ? todayQuery.error.message
            : 'Unable to load dashboard.'}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <SwapWorkoutModal
        open={isSwapModalOpen}
        sourceWorkoutName={todayQuery.data?.workouts[0]?.name ?? 'today workout'}
        alternatives={alternativesQuery.data ?? []}
        isLoading={alternativesQuery.isLoading}
        isSubmitting={createSessionMutation.isPending}
        onClose={() => setIsSwapModalOpen(false)}
        onSelect={(workout) => {
          void startWorkout(workout, 'swap')
        }}
      />
    </UserShell>
  )
}
