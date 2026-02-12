import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Workout } from '@/types/workouts'

interface WorkoutLibraryTableProps {
  workouts: Workout[]
  isLoading: boolean
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (nextPage: number) => void
  onEdit: (workout: Workout) => void
  onArchive: (workout: Workout) => void
  onUnarchive: (workout: Workout) => void
}

export function WorkoutLibraryTable({
  workouts,
  isLoading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onEdit,
  onArchive,
  onUnarchive,
}: WorkoutLibraryTableProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : workouts.length === 0 ? (
        <p className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground">
          No workouts match your filters.
        </p>
      ) : (
        workouts.map((workout) => (
          <div key={workout.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{workout.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{workout.type}</p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  workout.is_archived
                    ? 'bg-amber-900/40 text-amber-300'
                    : 'bg-emerald-900/40 text-emerald-300'
                }`}
              >
                {workout.is_archived ? 'Archived' : 'Active'}
              </span>
            </div>
            {workout.muscle_groups.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {workout.muscle_groups.map((g) => g.name).join(', ')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(workout)}>
                Edit
              </Button>
              {workout.is_archived ? (
                <Button size="sm" variant="secondary" onClick={() => onUnarchive(workout)}>
                  Unarchive
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => onArchive(workout)}>
                  Archive
                </Button>
              )}
            </div>
          </div>
        ))
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
        <p>
          {start}-{end} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span>
            {page}/{Math.max(totalPages, 1)}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
