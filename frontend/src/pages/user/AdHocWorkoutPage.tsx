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
    <UserShell>
      <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="workout-search" className="text-sm font-medium text-foreground">
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
            <p className="text-sm text-muted-foreground">Loading workouts...</p>
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-foreground">{workout.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{workout.type}</p>
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
          <p className="text-sm text-destructive">
            {workoutsQuery.error instanceof Error
              ? workoutsQuery.error.message
              : 'Unable to load workouts.'}
          </p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </section>
    </UserShell>
  )
}
