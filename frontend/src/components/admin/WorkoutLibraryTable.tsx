import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Workout Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Muscle Groups</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-600">
                    Loading workouts...
                  </td>
                </tr>
              ) : null}

              {!isLoading && workouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-600">
                    No workouts match the current filters.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? workouts.map((workout) => (
                    <tr key={workout.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 text-slate-900">{workout.name}</td>
                      <td className="py-3 pr-4 text-slate-700 capitalize">{workout.type}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {workout.muscle_groups.map((group) => group.name).join(', ')}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            workout.is_archived
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {workout.is_archived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => onEdit(workout)}>
                            Edit
                          </Button>
                          {workout.is_archived ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUnarchive(workout)}
                            >
                              Unarchive
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onArchive(workout)}
                            >
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {start}-{end} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {Math.max(totalPages, 1)}
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
      </CardContent>
    </Card>
  )
}
