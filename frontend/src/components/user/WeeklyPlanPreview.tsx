import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserWeekPlanResponse } from '@/types/user-dashboard'
import { cn } from '@/lib/utils'

interface WeeklyPlanPreviewProps {
  weekPlan: UserWeekPlanResponse | null
  isLoading: boolean
}

export function WeeklyPlanPreview({ weekPlan, isLoading }: WeeklyPlanPreviewProps) {
  const today = new Date().toISOString().slice(0, 10)

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!weekPlan) {
    return (
      <EmptyState title="No Active Plan" description="You do not have an active weekly plan yet." />
    )
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekPlan.days.map((day) => {
        const dateVal = new Date(day.date)
        const dayLabel = dateVal.toLocaleDateString(undefined, { weekday: 'narrow' })
        const isToday = day.date === today
        const workoutLabel = day.workouts.length === 0 ? 'Rest' : day.workouts[0].name.split(' ')[0]

        return (
          <div
            key={day.date}
            className={cn(
              'rounded-lg bg-secondary p-1.5 text-center text-[10px]',
              isToday && 'ring-1 ring-primary',
            )}
          >
            <p className="font-semibold text-foreground">{dayLabel}</p>
            <p className="mt-0.5 line-clamp-1 text-muted-foreground">{workoutLabel}</p>
          </div>
        )
      })}
    </div>
  )
}
