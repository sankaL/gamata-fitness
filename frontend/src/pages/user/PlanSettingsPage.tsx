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
    <UserShell>
      <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Current Active Plan</h2>
        {weekPlanQuery.isLoading || pendingPlansQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading plan settings...</p>
        ) : activePlan ? (
          <div className="rounded-lg border border-border bg-secondary p-4">
            <p className="font-semibold text-foreground">{activePlan.plan_name}</p>
            <p className="text-sm text-muted-foreground">
              Week of {new Date(weekPlanQuery.data?.week_start ?? '').toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-secondary p-4 text-sm text-foreground">
            No active plan is currently assigned.
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Pending Plans</h2>
        {pendingPlansQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading pending plans...</p>
        ) : pendingAssignments.length === 0 ? (
          <p className="rounded-lg border border-border bg-secondary p-4 text-sm text-foreground">
            You have no pending plan assignments.
          </p>
        ) : (
          pendingAssignments.map((assignment) => (
            <div
              key={assignment.assignment_id}
              className="rounded-lg border border-border bg-secondary p-4"
            >
              <p className="font-semibold text-foreground">{assignment.plan_name}</p>
              <p className="text-sm text-muted-foreground">Coach: {assignment.coach_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateRange(assignment.start_date, assignment.end_date)}
              </p>
              <p className="text-xs text-muted-foreground">
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
          <p className="text-sm text-destructive">
            {pendingPlansQuery.error instanceof Error
              ? pendingPlansQuery.error.message
              : 'Unable to load pending plans.'}
          </p>
        ) : null}
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}
      </section>
    </UserShell>
  )
}
