import { Input } from '@/components/ui/input'
import { RepInputStepper } from '@/components/workout/RepInputStepper'
import { SetCompletionChecklist } from '@/components/workout/SetCompletionChecklist'
import { WeightInputSlider } from '@/components/workout/WeightInputSlider'
import type { SessionWorkoutSummary } from '@/types/sessions'

interface StrengthExerciseState {
  sets: number
  reps: number
  weight: number
  notes: string
}

interface StrengthExerciseCardProps {
  workout: SessionWorkoutSummary
  value: StrengthExerciseState
  onChange: (next: StrengthExerciseState) => void
}

export function StrengthExerciseCard({ workout, value, onChange }: StrengthExerciseCardProps) {
  const targetSets = workout.target_sets ?? 3
  const targetReps = workout.target_reps ?? 10

  return (
    <div className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{workout.name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Target: {targetSets} sets x {targetReps} reps
        </p>
      </div>

      <SetCompletionChecklist
        targetSets={targetSets}
        completedSets={value.sets}
        onChange={(nextSets) =>
          onChange({
            ...value,
            sets: nextSets,
          })
        }
      />

      <RepInputStepper
        value={value.reps}
        onChange={(nextReps) =>
          onChange({
            ...value,
            reps: nextReps,
          })
        }
      />

      <WeightInputSlider
        value={value.weight}
        presets={[20, 40, 60, 80]}
        onChange={(nextWeight) =>
          onChange({
            ...value,
            weight: nextWeight,
          })
        }
      />

      <div className="space-y-1">
        <label htmlFor="strength-notes" className="text-sm font-medium text-slate-700">
          Notes
        </label>
        <Input
          id="strength-notes"
          value={value.notes}
          placeholder="Optional notes"
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
