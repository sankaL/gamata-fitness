import { Button } from '@/components/ui/button'
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
    <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Saved Plans</h2>
      <p className="text-sm text-slate-600">Select a plan to edit or assign.</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Date Range</th>
              <th className="py-2 pr-4 font-medium">Workouts</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-600">
                  Loading plans...
                </td>
              </tr>
            ) : null}

            {!isLoading && plans.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-600">
                  No plans found.
                </td>
              </tr>
            ) : null}

            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-4 text-slate-900">{plan.name}</td>
                <td className="py-3 pr-4 text-slate-700">
                  {plan.start_date} to {plan.end_date}
                </td>
                <td className="py-3 pr-4 text-slate-700">{plan.total_workouts}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      plan.is_archived
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {plan.is_archived ? 'Archived' : 'Active'}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <span className="text-sm text-slate-600">
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
