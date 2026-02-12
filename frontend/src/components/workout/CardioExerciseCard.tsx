import { Input } from '@/components/ui/input'
import { CardioTimer } from '@/components/workout/CardioTimer'
import type { SessionWorkoutSummary } from '@/types/sessions'

interface CardioExerciseState {
  duration: number
  notes: string
}

interface CardioExerciseCardProps {
  workout: SessionWorkoutSummary
  value: CardioExerciseState
  onChange: (next: CardioExerciseState) => void
}

export function CardioExerciseCard({ workout, value, onChange }: CardioExerciseCardProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{workout.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Target duration: {workout.target_duration ?? 20} minutes
        </p>
      </div>

      <CardioTimer
        initialSeconds={value.duration}
        onChange={(nextDuration) =>
          onChange({
            ...value,
            duration: nextDuration,
          })
        }
      />

      <div className="space-y-1">
        <label htmlFor="cardio-notes" className="text-sm font-medium text-foreground">
          Notes
        </label>
        <Input
          id="cardio-notes"
          value={value.notes}
          placeholder="Breathing, pace, effort"
          onChange={(event) =>
            onChange({
              ...value,
              notes: event.target.value,
            })
          }
        />
      </div>
    </div>
  )
}
