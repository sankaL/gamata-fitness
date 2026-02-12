import type { UserWeekPlanResponse } from '@/types/user-dashboard'
import { cn } from '@/lib/utils'

interface CalendarWeekStripProps {
  weekPlan: UserWeekPlanResponse | null
  isLoading: boolean
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function CalendarWeekStrip({ weekPlan, isLoading }: CalendarWeekStripProps) {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex justify-between gap-1 rounded-xl bg-card p-3">
      {DAY_LABELS.map((label, index) => {
        const day = weekPlan?.days[index]
        const dateStr = day?.date ?? ''
        const dayNum = dateStr ? new Date(dateStr).getDate() : index + 1
        const isToday = dateStr === today
        const hasWorkouts = (day?.workouts.length ?? 0) > 0

        return (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
              )}
            >
              {isLoading ? (
                <div className="h-3 w-3 animate-pulse rounded-full bg-secondary" />
              ) : (
                dayNum
              )}
            </div>
            {hasWorkouts && !isLoading ? (
              <div className="h-1.5 w-1.5 rounded-full bg-success" />
            ) : (
              <div className="h-1.5 w-1.5" />
            )}
          </div>
        )
      })}
    </div>
  )
}
