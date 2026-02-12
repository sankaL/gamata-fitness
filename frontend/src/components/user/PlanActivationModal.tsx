import { Button } from '@/components/ui/button'
import type { PendingPlanAssignment } from '@/types/plan-activation'

interface PlanActivationModalProps {
  open: boolean
  plans: PendingPlanAssignment[]
  isSubmitting: boolean
  onActivate: (assignmentId: string) => Promise<void>
  onDecline: (assignmentId: string) => Promise<void>
}

function formatRange(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export function PlanActivationModal({
  open,
  plans,
  isSubmitting,
  onActivate,
  onDecline,
}: PlanActivationModalProps) {
  if (!open || plans.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xl">
        <h2 className="text-xl font-semibold text-foreground">New Plan Assignment Available</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your coach assigned one or more plans. Activate one now or decline.
        </p>

        <div className="mt-4 space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.assignment_id}
              className="rounded-lg border border-border bg-secondary p-4"
            >
              <p className="text-base font-semibold text-foreground">{plan.plan_name}</p>
              <p className="text-sm text-muted-foreground">Coach: {plan.coach_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatRange(plan.start_date, plan.end_date)}
              </p>
              <p className="text-xs text-muted-foreground">
                {plan.total_days} day(s), {plan.total_workouts} workout(s)
              </p>
              {plan.plan_is_archived ? (
                <p className="mt-2 text-xs text-amber-700">
                  This plan is archived and cannot be activated.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  disabled={isSubmitting || plan.plan_is_archived}
                  onClick={() => {
                    void onActivate(plan.assignment_id)
                  }}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    void onDecline(plan.assignment_id)
                  }}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
