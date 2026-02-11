import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Workout } from '@/types/workouts'

interface WorkoutPickerModalProps {
  open: boolean
  workouts: Workout[]
  search: string
  selectedWorkoutIds: string[]
  isLoading: boolean
  onSearchChange: (value: string) => void
  onToggleWorkout: (workoutId: string) => void
  onClose: () => void
}

export function WorkoutPickerModal({
  open,
  workouts,
  search,
  selectedWorkoutIds,
  isLoading,
  onSearchChange,
  onToggleWorkout,
  onClose,
}: WorkoutPickerModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Select Workouts</h2>
        <p className="mt-1 text-sm text-slate-600">Search and select one or more workouts.</p>

        <div className="mt-4">
          <Input
            value={search}
            placeholder="Search workout name"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {isLoading ? <li className="text-sm text-slate-600">Loading workouts...</li> : null}
          {!isLoading && workouts.length === 0 ? (
            <li className="text-sm text-slate-600">No workouts found.</li>
          ) : null}

          {workouts.map((workout) => {
            const isSelected = selectedWorkoutIds.includes(workout.id)
            return (
              <li key={workout.id} className="rounded-md border border-slate-200 px-3 py-2">
                <label className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{workout.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{workout.type}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleWorkout(workout.id)}
                  />
                </label>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
