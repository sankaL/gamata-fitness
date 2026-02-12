import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { PlanListItem } from '@/types/plans'

interface CoachPlansTableProps {
  plans: PlanListItem[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (nextPage: number) => void
  onEdit: (plan: PlanListItem) => void
  onArchive: (plan: PlanListItem) => Promise<void>
  onUnarchive: (plan: PlanListItem) => Promise<void>
  onDelete: (plan: PlanListItem) => Promise<void>
}

export function CoachPlansTable({
  plans,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: CoachPlansTableProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Saved Plans</h2>
      <p className="text-sm text-muted-foreground">Select a plan to edit or assign.</p>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {!isLoading && plans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No plans found. Create a new plan to get started.
          </p>
        ) : null}

        {!isLoading
          ? plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.start_date} to {plan.end_date}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      plan.is_archived
                        ? 'bg-amber-900/40 text-amber-300'
                        : 'bg-emerald-900/40 text-emerald-300'
                    }`}
                  >
                    {plan.is_archived ? 'Archived' : 'Active'}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.total_workouts} workout(s)
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(plan)}>
                    Edit
                  </Button>

                  {plan.is_archived ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void onUnarchive(plan)
                      }}
                    >
                      Unarchive
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void onArchive(plan)
                      }}
                    >
                      Archive
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      void onDelete(plan)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          : null}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
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
    </section>
  )
}
