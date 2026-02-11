import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '@/components/shared/EmptyState'
import { UserShell } from '@/components/user/UserShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-provider'
import { useCreateSessionMutation, useUserWorkoutLibraryQuery } from '@/hooks/use-user-dashboard'
import type { Workout } from '@/types/workouts'

export function AdHocWorkoutPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const workoutsQuery = useUserWorkoutLibraryQuery(search)
  const createSessionMutation = useCreateSessionMutation()

  async function handleStartWorkout(workout: Workout) {
    try {
      setError(null)
      const session = await createSessionMutation.mutateAsync({
        workout_id: workout.id,
        session_type: 'adhoc',
        plan_id: null,
      })
      showToast('Ad hoc workout started.', 'success')
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
      title="Ad Hoc Workout"
      description="Browse the workout library and start immediately."
    >
      <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <div className="space-y-1">
          <label htmlFor="workout-search" className="text-sm font-medium text-slate-700">
            Search workouts
          </label>
          <Input
            id="workout-search"
            value={search}
            placeholder="Workout name"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          {workoutsQuery.isLoading ? (
            <p className="text-sm text-slate-600">Loading workouts...</p>
          ) : null}
          {!workoutsQuery.isLoading && (workoutsQuery.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              title="No Workouts Found"
              description="Try a broader search to discover available workouts."
            />
          ) : null}

          {workoutsQuery.data?.items.map((workout) => (
            <div
              key={workout.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{workout.name}</p>
                <p className="text-xs text-slate-600 capitalize">{workout.type}</p>
              </div>
              <Button
                disabled={createSessionMutation.isPending}
                onClick={() => handleStartWorkout(workout)}
              >
                Start
              </Button>
            </div>
          ))}
        </div>

        {workoutsQuery.error ? (
          <p className="text-sm text-rose-700">
            {workoutsQuery.error instanceof Error
              ? workoutsQuery.error.message
              : 'Unable to load workouts.'}
          </p>
        ) : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </section>
    </UserShell>
  )
}
