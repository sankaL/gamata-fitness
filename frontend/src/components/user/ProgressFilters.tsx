import { Input } from '@/components/ui/input'
import type { MuscleGroup, WorkoutType } from '@/types/workouts'

export type DateRangePreset = '7d' | '30d' | 'custom'
export type WorkoutTypeFilter = WorkoutType | 'all'

interface ProgressFiltersProps {
  rangePreset: DateRangePreset
  startDate: string
  endDate: string
  workoutType: WorkoutTypeFilter
  selectedMuscleGroupIds: string[]
  muscleGroups: MuscleGroup[]
  onRangePresetChange: (preset: DateRangePreset) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onWorkoutTypeChange: (value: WorkoutTypeFilter) => void
  onToggleMuscleGroup: (id: string) => void
}

export function ProgressFilters({
  rangePreset,
  startDate,
  endDate,
  workoutType,
  selectedMuscleGroupIds,
  muscleGroups,
  onRangePresetChange,
  onStartDateChange,
  onEndDateChange,
  onWorkoutTypeChange,
  onToggleMuscleGroup,
}: ProgressFiltersProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">Date Range</p>
          <select
            value={rangePreset}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(event) => onRangePresetChange(event.target.value as DateRangePreset)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-700">Workout Type</p>
          <select
            value={workoutType}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(event) => onWorkoutTypeChange(event.target.value as WorkoutTypeFilter)}
          >
            <option value="all">All</option>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="progress-start-date" className="text-sm font-medium text-slate-700">
            Start Date
          </label>
          <Input
            id="progress-start-date"
            type="date"
            value={startDate}
            disabled={rangePreset !== 'custom'}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="progress-end-date" className="text-sm font-medium text-slate-700">
            End Date
          </label>
          <Input
            id="progress-end-date"
            type="date"
            value={endDate}
            disabled={rangePreset !== 'custom'}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-slate-700">Muscle Group Filter</p>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((group) => {
            const isChecked = selectedMuscleGroupIds.includes(group.id)
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onToggleMuscleGroup(group.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  isChecked
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {group.name}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
