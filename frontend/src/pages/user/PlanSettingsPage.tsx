import { useState } from 'react'

import { UserShell } from '@/components/user/UserShell'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import {
  useActivatePendingPlanMutation,
  useDeclinePendingPlanMutation,
  useUserPendingPlansQuery,
} from '@/hooks/use-user-plan-activation'
import { useUserWeekPlanQuery } from '@/hooks/use-user-dashboard'

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export function PlanSettingsPage() {
  const { showToast } = useToast()
  const [actionError, setActionError] = useState<string | null>(null)
  const weekPlanQuery = useUserWeekPlanQuery()
  const pendingPlansQuery = useUserPendingPlansQuery()
  const activateMutation = useActivatePendingPlanMutation()
  const declineMutation = useDeclinePendingPlanMutation()

  const activePlan = pendingPlansQuery.data?.active_plan ?? null
  const pendingAssignments = pendingPlansQuery.data?.pending_assignments ?? []
  const isSubmitting = activateMutation.isPending || declineMutation.isPending

  async function handleActivate(assignmentId: string) {
    try {
      setActionError(null)
      await activateMutation.mutateAsync(assignmentId)
      showToast('Pending plan activated.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to activate pending plan.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  async function handleDecline(assignmentId: string) {
    try {
      setActionError(null)
      await declineMutation.mutateAsync(assignmentId)
      showToast('Pending plan declined.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to decline pending plan.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  return (
    <UserShell
      title="Plan Settings"
      description="Review your active plan and manage newly assigned pending plans."
    >
      <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Current Active Plan</h2>
        {weekPlanQuery.isLoading || pendingPlansQuery.isLoading ? (
          <p className="text-sm text-slate-600">Loading plan settings...</p>
        ) : activePlan ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{activePlan.plan_name}</p>
            <p className="text-sm text-slate-600">
              Week of {new Date(weekPlanQuery.data?.week_start ?? '').toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No active plan is currently assigned.
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Pending Plans</h2>
        {pendingPlansQuery.isLoading ? (
          <p className="text-sm text-slate-600">Loading pending plans...</p>
        ) : pendingAssignments.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            You have no pending plan assignments.
          </p>
        ) : (
          pendingAssignments.map((assignment) => (
            <div
              key={assignment.assignment_id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="font-semibold text-slate-900">{assignment.plan_name}</p>
              <p className="text-sm text-slate-600">Coach: {assignment.coach_name}</p>
              <p className="text-sm text-slate-600">
                {formatDateRange(assignment.start_date, assignment.end_date)}
              </p>
              <p className="text-xs text-slate-500">
                {assignment.total_days} day(s), {assignment.total_workouts} workout(s)
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  disabled={isSubmitting || assignment.plan_is_archived}
                  onClick={() => {
                    void handleActivate(assignment.assignment_id)
                  }}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleDecline(assignment.assignment_id)
                  }}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))
        )}

        {pendingPlansQuery.error ? (
          <p className="text-sm text-rose-700">
            {pendingPlansQuery.error instanceof Error
              ? pendingPlansQuery.error.message
              : 'Unable to load pending plans.'}
          </p>
        ) : null}
        {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
      </section>
    </UserShell>
  )
}
