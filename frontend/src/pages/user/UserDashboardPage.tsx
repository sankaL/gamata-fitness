import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { QuickStatsCards } from '@/components/user/QuickStatsCards'
import { TodaysWorkoutCard } from '@/components/user/TodaysWorkoutCard'
import { UserShell } from '@/components/user/UserShell'
import { WeeklyPlanPreview } from '@/components/user/WeeklyPlanPreview'
import { SwapWorkoutModal } from '@/components/workout/SwapWorkoutModal'
import { useToast } from '@/components/ui/toast-provider'
import {
  useCreateSessionMutation,
  useUserQuickStatsQuery,
  useUserTodayWorkoutQuery,
  useUserWeekPlanQuery,
  useUserWorkoutAlternativesQuery,
} from '@/hooks/use-user-dashboard'
import type { DashboardWorkoutSummary } from '@/types/user-dashboard'

export function UserDashboardPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false)

  const todayQuery = useUserTodayWorkoutQuery()
  const weekPlanQuery = useUserWeekPlanQuery()
  const statsQuery = useUserQuickStatsQuery()
  const createSessionMutation = useCreateSessionMutation()

  const primaryWorkoutId = todayQuery.data?.workouts[0]?.id ?? null
  const alternativesQuery = useUserWorkoutAlternativesQuery(primaryWorkoutId)

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
    <UserShell
      title="User Dashboard"
      description="Today's workout, weekly preview, and progress at a glance."
    >
      <QuickStatsCards stats={statsQuery.data ?? null} isLoading={statsQuery.isLoading} />

      <TodaysWorkoutCard
        today={todayQuery.data ?? null}
        isLoading={todayQuery.isLoading}
        isStarting={createSessionMutation.isPending}
        onStartAssignedWorkout={async () => {
          const workout = todayQuery.data?.workouts[0]
          if (!workout) {
            return
          }
          await startWorkout(workout, 'assigned')
        }}
        onOpenSwap={() => setIsSwapModalOpen(true)}
        onOpenAdHoc={() => navigate('/user/workouts/adhoc')}
      />

      <WeeklyPlanPreview
        weekPlan={weekPlanQuery.data ?? null}
        isLoading={weekPlanQuery.isLoading}
      />

      {todayQuery.error ? (
        <p className="text-sm text-rose-700">
          {todayQuery.error instanceof Error
            ? todayQuery.error.message
            : 'Unable to load dashboard.'}
        </p>
      ) : null}
      {weekPlanQuery.error ? (
        <p className="text-sm text-rose-700">
          {weekPlanQuery.error instanceof Error
            ? weekPlanQuery.error.message
            : 'Unable to load weekly plan.'}
        </p>
      ) : null}
      {statsQuery.error ? (
        <p className="text-sm text-rose-700">
          {statsQuery.error instanceof Error
            ? statsQuery.error.message
            : 'Unable to load quick stats.'}
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

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
