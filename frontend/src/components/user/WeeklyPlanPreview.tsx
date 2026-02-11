import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserWeekPlanResponse } from '@/types/user-dashboard'

interface WeeklyPlanPreviewProps {
  weekPlan: UserWeekPlanResponse | null
  isLoading: boolean
}

export function WeeklyPlanPreview({ weekPlan, isLoading }: WeeklyPlanPreviewProps) {
  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Weekly Plan Preview</CardTitle>
        <p className="text-sm text-slate-600">Monday to Sunday workout schedule.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-2 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : !weekPlan ? (
          <EmptyState
            title="No Active Plan"
            description="You do not have an active weekly plan yet."
          />
        ) : (
          <div className="grid gap-2 md:grid-cols-7">
            {weekPlan.days.map((day) => {
              const dayDateValue = new Date(day.date)
              const dayLabel = dayDateValue.toLocaleDateString(undefined, { weekday: 'short' })
              const dayDate = dayDateValue.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
              const workoutLabel =
                day.workouts.length === 0
                  ? 'Rest'
                  : `${day.workouts[0].name}${day.workouts.length > 1 ? ` +${day.workouts.length - 1}` : ''}`

              return (
                <div
                  key={day.date}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                >
                  <p className="font-semibold text-slate-900">{dayLabel}</p>
                  <p className="text-[11px] text-slate-500">{dayDate}</p>
                  <p className="mt-2 line-clamp-3">{workoutLabel}</p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
