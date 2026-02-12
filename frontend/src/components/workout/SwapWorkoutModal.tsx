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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Swap Workout</h2>
            <p className="text-sm text-muted-foreground">Replace {sourceWorkoutName} for today.</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading alternatives...</p>
          ) : null}
          {!isLoading && alternatives.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alternatives found for this workout.</p>
          ) : null}
          {alternatives.map((workout) => (
            <div
              key={workout.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium text-foreground">{workout.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{workout.type}</p>
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
