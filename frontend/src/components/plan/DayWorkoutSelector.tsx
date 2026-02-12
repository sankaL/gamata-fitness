import { Button } from '@/components/ui/button'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayWorkoutSelectorProps {
  dayWorkouts: Record<number, string[]>
  workoutNameById: Record<string, string>
  onEditDay: (dayOfWeek: number) => void
}

export function DayWorkoutSelector({
  dayWorkouts,
  workoutNameById,
  onEditDay,
}: DayWorkoutSelectorProps) {
  return (
    <div className="grid gap-3 grid-cols-2">
      {dayLabels.map((label, index) => {
        const workoutIds = dayWorkouts[index] ?? []
        return (
          <div key={label} className="rounded-lg border border-border bg-secondary p-3">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{workoutIds.length} workout(s)</p>
            <ul className="mt-2 space-y-1">
              {workoutIds.slice(0, 3).map((workoutId) => (
                <li key={workoutId} className="truncate text-xs text-muted-foreground">
                  {workoutNameById[workoutId] ?? 'Selected workout'}
                </li>
              ))}
              {workoutIds.length > 3 ? (
                <li className="text-xs text-muted-foreground">+{workoutIds.length - 3} more</li>
              ) : null}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => onEditDay(index)}
            >
              Edit Day
            </Button>
          </div>
        )
      })}
    </div>
  )
}
