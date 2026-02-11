import { Button } from '@/components/ui/button'
import type { Workout } from '@/types/workouts'

interface SwapWorkoutModalProps {
  open: boolean
  sourceWorkoutName: string
  alternatives: Workout[]
  isLoading: boolean
  isSubmitting: boolean
  onClose: () => void
  onSelect: (workout: Workout) => void
}

export function SwapWorkoutModal({
  open,
  sourceWorkoutName,
  alternatives,
  isLoading,
  isSubmitting,
  onClose,
  onSelect,
}: SwapWorkoutModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 md:items-center">
      <div className="w-full max-w-xl rounded-xl border border-slate-300 bg-white p-4 shadow-xl md:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Swap Workout</h2>
            <p className="text-sm text-slate-600">Replace {sourceWorkoutName} for today.</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {isLoading ? <p className="text-sm text-slate-600">Loading alternatives...</p> : null}
          {!isLoading && alternatives.length === 0 ? (
            <p className="text-sm text-slate-600">No alternatives found for this workout.</p>
          ) : null}
          {alternatives.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{workout.name}</p>
                <p className="text-xs text-slate-600 capitalize">{workout.type}</p>
              </div>
              <Button disabled={isSubmitting} onClick={() => onSelect(workout)}>
                Select
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
