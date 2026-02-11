import { Button } from '@/components/ui/button'
import type { Workout } from '@/types/workouts'

interface ArchiveWorkoutModalProps {
  open: boolean
  workout: Workout | null
  isSubmitting: boolean
  dependencyError: string | null
  onClose: () => void
  onConfirmArchive: () => Promise<void>
}

export function ArchiveWorkoutModal({
  open,
  workout,
  isSubmitting,
  dependencyError,
  onClose,
  onConfirmArchive,
}: ArchiveWorkoutModalProps) {
  if (!open || !workout) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Archive Workout</h2>
        <p className="mt-2 text-sm text-slate-700">
          You are about to archive <span className="font-medium">{workout.name}</span>. Archived
          workouts can no longer be added to plans.
        </p>

        {dependencyError ? (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {dependencyError}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => {
              void onConfirmArchive()
            }}
          >
            {isSubmitting ? 'Archiving...' : 'Archive Workout'}
          </Button>
        </div>
      </div>
    </div>
  )
}
