import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MuscleGroup, WorkoutType } from '@/types/workouts'

type WorkoutFilterType = 'all' | WorkoutType
type WorkoutStatusFilter = 'all' | 'active' | 'archived'

interface AdminWorkoutsToolbarProps {
  searchDraft: string
  typeFilter: WorkoutFilterType
  statusFilter: WorkoutStatusFilter
  muscleGroupFilter: string
  muscleGroups: MuscleGroup[]
  isExporting: boolean
  onSearchDraftChange: (value: string) => void
  onTypeFilterChange: (value: WorkoutFilterType) => void
  onStatusFilterChange: (value: WorkoutStatusFilter) => void
  onMuscleGroupFilterChange: (value: string) => void
  onApplyFilters: () => void
  onCreateWorkout: () => void
  onExportCsv: () => void
  onImportCsv: () => void
}

export function AdminWorkoutsToolbar({
  searchDraft,
  typeFilter,
  statusFilter,
  muscleGroupFilter,
  muscleGroups,
  isExporting,
  onSearchDraftChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onMuscleGroupFilterChange,
  onApplyFilters,
  onCreateWorkout,
  onExportCsv,
  onImportCsv,
}: AdminWorkoutsToolbarProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="workout-search" className="text-sm font-medium text-slate-700">
            Search
          </label>
          <Input
            id="workout-search"
            value={searchDraft}
            placeholder="Name or description"
            onChange={(event) => onSearchDraftChange(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="workout-type" className="text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            id="workout-type"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value as WorkoutFilterType)}
          >
            <option value="all">All</option>
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="workout-status" className="text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="workout-status"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as WorkoutStatusFilter)}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="muscle-filter" className="text-sm font-medium text-slate-700">
            Muscle Group
          </label>
          <select
            id="muscle-filter"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={muscleGroupFilter}
            onChange={(event) => onMuscleGroupFilterChange(event.target.value)}
          >
            <option value="all">All groups</option>
            {muscleGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onApplyFilters}>
          Apply Filters
        </Button>
        <Button onClick={onCreateWorkout}>Create Workout</Button>
        <Button variant="outline" disabled={isExporting} onClick={onExportCsv}>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
        <Button variant="outline" onClick={onImportCsv}>
          Import CSV
        </Button>
      </div>
    </section>
  )
}
