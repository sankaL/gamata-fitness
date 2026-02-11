import { useMemo, useState } from 'react'

import { DayWorkoutSelector } from '@/components/plan/DayWorkoutSelector'
import { WorkoutPickerModal } from '@/components/plan/WorkoutPickerModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PlanCreatePayload, PlanDetail, PlanUpdatePayload } from '@/types/plans'
import type { Workout } from '@/types/workouts'

type PlanBuilderMode = 'create' | 'edit'

interface PlanBuilderFormProps {
  mode: PlanBuilderMode
  plan: PlanDetail | null
  workouts: Workout[]
  workoutSearch: string
  isWorkoutsLoading: boolean
  isSubmitting: boolean
  onWorkoutSearchChange: (value: string) => void
  onSave: (payload: PlanCreatePayload | PlanUpdatePayload) => Promise<void>
}

function toDayWorkoutMap(plan: PlanDetail | null): Record<number, string[]> {
  if (!plan) {
    return {}
  }

  return plan.days.reduce<Record<number, string[]>>((acc, day) => {
    acc[day.day_of_week] = day.workouts.map((workout) => workout.id)
    return acc
  }, {})
}

export function PlanBuilderForm({
  mode,
  plan,
  workouts,
  workoutSearch,
  isWorkoutsLoading,
  isSubmitting,
  onWorkoutSearchChange,
  onSave,
}: PlanBuilderFormProps) {
  const [name, setName] = useState(() => plan?.name ?? '')
  const [startDate, setStartDate] = useState(() => plan?.start_date ?? '')
  const [endDate, setEndDate] = useState(() => plan?.end_date ?? '')
  const [dayWorkouts, setDayWorkouts] = useState<Record<number, string[]>>(() =>
    toDayWorkoutMap(plan),
  )
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workoutNameById = useMemo(
    () =>
      workouts.reduce<Record<string, string>>((acc, workout) => {
        acc[workout.id] = workout.name
        return acc
      }, {}),
    [workouts],
  )

  const selectedWorkoutIdsForModal = selectedDay !== null ? (dayWorkouts[selectedDay] ?? []) : []

  async function handleSavePlan() {
    setError(null)

    if (!name.trim()) {
      setError('Plan name is required.')
      return
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required.')
      return
    }

    const days = Object.entries(dayWorkouts)
      .filter(([, workoutIds]) => workoutIds.length > 0)
      .map(([day, workoutIds]) => ({
        day_of_week: Number(day),
        workout_ids: workoutIds,
      }))
      .sort((a, b) => a.day_of_week - b.day_of_week)

    if (days.length === 0) {
      setError('Assign at least one workout to the weekly grid before saving.')
      return
    }

    const payload = {
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      days,
    }

    await onSave(payload)
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === 'create' ? 'Create Plan' : 'Edit Plan'}
        </h2>
        <p className="text-sm text-slate-600">
          Build a weekly template from Monday through Sunday.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-1">
          <label className="text-sm font-medium text-slate-700">Plan Name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">End Date</label>
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </div>

      <DayWorkoutSelector
        dayWorkouts={dayWorkouts}
        workoutNameById={workoutNameById}
        onEditDay={(dayOfWeek) => setSelectedDay(dayOfWeek)}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            void handleSavePlan()
          }}
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Save Plan' : 'Save Changes'}
        </Button>
      </div>

      <WorkoutPickerModal
        open={selectedDay !== null}
        workouts={workouts}
        search={workoutSearch}
        selectedWorkoutIds={selectedWorkoutIdsForModal}
        isLoading={isWorkoutsLoading}
        onSearchChange={onWorkoutSearchChange}
        onToggleWorkout={(workoutId) => {
          if (selectedDay === null) {
            return
          }

          setDayWorkouts((current) => {
            const existing = current[selectedDay] ?? []
            const nextForDay = existing.includes(workoutId)
              ? existing.filter((id) => id !== workoutId)
              : [...existing, workoutId]
            return {
              ...current,
              [selectedDay]: nextForDay,
            }
          })
        }}
        onClose={() => setSelectedDay(null)}
      />
    </section>
  )
}
