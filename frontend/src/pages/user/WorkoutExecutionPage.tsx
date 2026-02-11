import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { UserShell } from '@/components/user/UserShell'
import { Button } from '@/components/ui/button'
import { CardioExerciseCard } from '@/components/workout/CardioExerciseCard'
import { StrengthExerciseCard } from '@/components/workout/StrengthExerciseCard'
import { WorkoutCelebration } from '@/components/workout/WorkoutCelebration'
import {
  useAddWorkoutSessionLogMutation,
  useCompleteWorkoutSessionMutation,
  useUpdateWorkoutSessionMutation,
  useWorkoutSessionQuery,
} from '@/hooks/use-workout-session'
import type { Session } from '@/types/sessions'

export function WorkoutExecutionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const sessionQuery = useWorkoutSessionQuery(sessionId)
  const addLogMutation = useAddWorkoutSessionLogMutation()
  const updateSessionMutation = useUpdateWorkoutSessionMutation()
  const completeSessionMutation = useCompleteWorkoutSessionMutation()

  const [initializedSessionId, setInitializedSessionId] = useState<string | null>(null)
  const [logId, setLogId] = useState<string | null>(null)
  const [hasAttemptedInitialLogCreate, setHasAttemptedInitialLogCreate] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [completedSession, setCompletedSession] = useState<Session | null>(null)

  const [strengthState, setStrengthState] = useState({
    sets: 0,
    reps: 10,
    weight: 20,
    notes: '',
  })
  const [cardioState, setCardioState] = useState({
    duration: 0,
    notes: '',
  })

  const activeSession = sessionQuery.data

  useEffect(() => {
    if (!activeSession) {
      return
    }
    if (initializedSessionId === activeSession.id) {
      return
    }

    const existingLog = activeSession.logs[0] ?? null
    const defaultWeight = activeSession.workout.suggested_weight
      ? Number(activeSession.workout.suggested_weight)
      : 20

    setStrengthState({
      sets: existingLog?.sets ?? activeSession.workout.target_sets ?? 0,
      reps: existingLog?.reps ?? activeSession.workout.target_reps ?? 10,
      weight: existingLog?.weight ? Number(existingLog.weight) : defaultWeight,
      notes: existingLog?.notes ?? '',
    })
    setCardioState({
      duration: existingLog?.duration ?? 0,
      notes: existingLog?.notes ?? '',
    })
    setLogId(existingLog?.id ?? null)
    setHasAttemptedInitialLogCreate(false)
    setInitializedSessionId(activeSession.id)
    setCompletedSession(activeSession.completed_at ? activeSession : null)
  }, [activeSession, initializedSessionId])

  useEffect(() => {
    async function createInitialLog() {
      if (!activeSession || activeSession.completed_at) {
        return
      }
      if (logId || hasAttemptedInitialLogCreate || addLogMutation.isPending) {
        return
      }

      try {
        setHasAttemptedInitialLogCreate(true)
        const created = await addLogMutation.mutateAsync({
          sessionId: activeSession.id,
          payload:
            activeSession.workout.type === 'strength'
              ? {
                  sets: strengthState.sets,
                  reps: strengthState.reps,
                  weight: strengthState.weight,
                  notes: strengthState.notes,
                }
              : {
                  duration: cardioState.duration,
                  notes: cardioState.notes,
                },
        })
        const createdLog = created.logs[0]
        setLogId(createdLog?.id ?? null)
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Unable to initialize workout log.')
      }
    }

    void createInitialLog()
  }, [
    activeSession,
    logId,
    hasAttemptedInitialLogCreate,
    addLogMutation,
    strengthState,
    cardioState,
  ])

  const updatePayload = useMemo(() => {
    if (!logId || !activeSession) {
      return null
    }
    if (activeSession.workout.type === 'strength') {
      return {
        logs: [
          {
            id: logId,
            sets: strengthState.sets,
            reps: strengthState.reps,
            weight: strengthState.weight,
            notes: strengthState.notes,
          },
        ],
      }
    }
    return {
      logs: [
        {
          id: logId,
          duration: cardioState.duration,
          notes: cardioState.notes,
        },
      ],
    }
  }, [activeSession, cardioState, logId, strengthState])

  useEffect(() => {
    if (!activeSession || !updatePayload || completedSession) {
      return
    }
    if (activeSession.completed_at) {
      return
    }

    const timer = window.setTimeout(async () => {
      try {
        setSyncError(null)
        await updateSessionMutation.mutateAsync({
          sessionId: activeSession.id,
          payload: updatePayload,
        })
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Unable to sync workout log.')
      }
    }, 800)

    return () => {
      window.clearTimeout(timer)
    }
  }, [activeSession, updatePayload, completedSession, updateSessionMutation])

  async function handleFinishWorkout() {
    if (!activeSession || !updatePayload) {
      return
    }
    setIsFinishing(true)
    try {
      setSyncError(null)
      await updateSessionMutation.mutateAsync({
        sessionId: activeSession.id,
        payload: updatePayload,
      })
      const completed = await completeSessionMutation.mutateAsync(activeSession.id)
      setCompletedSession(completed)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unable to finish workout.')
    } finally {
      setIsFinishing(false)
    }
  }

  if (!sessionId) {
    return (
      <UserShell title="Workout Execution" description="Start a workout from your dashboard first.">
        <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">No session selected.</p>
          <Button className="mt-4" asChild>
            <Link to="/user/dashboard">Go to Dashboard</Link>
          </Button>
        </section>
      </UserShell>
    )
  }

  if (sessionQuery.isLoading) {
    return (
      <UserShell title="Workout Execution" description="Loading workout session...">
        <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">Loading session...</p>
        </section>
      </UserShell>
    )
  }

  if (sessionQuery.error || !activeSession) {
    return (
      <UserShell title="Workout Execution" description="Unable to load this session.">
        <section className="rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
          <p className="text-sm text-rose-700">
            {sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : 'Unable to load session.'}
          </p>
          <Button className="mt-4" asChild>
            <Link to="/user/dashboard">Back to Dashboard</Link>
          </Button>
        </section>
      </UserShell>
    )
  }

  return (
    <UserShell title="Workout Execution" description="Log your training with large touch controls.">
      {completedSession ? (
        <WorkoutCelebration session={completedSession} onDone={() => navigate('/user/dashboard')} />
      ) : (
        <section className="space-y-4">
          {activeSession.workout.type === 'strength' ? (
            <StrengthExerciseCard
              workout={activeSession.workout}
              value={strengthState}
              onChange={setStrengthState}
            />
          ) : (
            <CardioExerciseCard
              workout={activeSession.workout}
              value={cardioState}
              onChange={setCardioState}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
            <Button disabled={isFinishing} onClick={handleFinishWorkout}>
              Finish Workout
            </Button>
            <Button variant="outline" asChild>
              <Link to="/user/dashboard">Save & Exit</Link>
            </Button>
          </div>

          {syncError ? <p className="text-sm text-rose-700">{syncError}</p> : null}
        </section>
      )}
    </UserShell>
  )
}
