import { useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/AdminShell'
import { ArchiveWorkoutModal } from '@/components/admin/ArchiveWorkoutModal'
import { WorkoutFormModal } from '@/components/admin/WorkoutFormModal'
import { WorkoutLibraryTable } from '@/components/admin/WorkoutLibraryTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useAdminWorkoutsQuery,
  useArchiveWorkoutMutation,
  useCardioTypesQuery,
  useCreateMuscleGroupMutation,
  useCreateWorkoutMutation,
  useMuscleGroupsQuery,
  useUnarchiveWorkoutMutation,
  useUpdateWorkoutMutation,
} from '@/hooks/use-admin-workouts'
import type {
  Workout,
  WorkoutCreatePayload,
  WorkoutType,
  WorkoutUpdatePayload,
} from '@/types/workouts'

const PAGE_SIZE = 10

type WorkoutFilterType = 'all' | WorkoutType
type WorkoutStatusFilter = 'all' | 'active' | 'archived'
type FormMode = 'create' | 'edit'

export function AdminWorkoutsPage() {
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<WorkoutFilterType>('all')
  const [statusFilter, setStatusFilter] = useState<WorkoutStatusFilter>('active')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all')
  const [actionError, setActionError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<Workout | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      type: typeFilter === 'all' ? undefined : typeFilter,
      search: search || undefined,
      muscle_group_id: muscleGroupFilter === 'all' ? undefined : muscleGroupFilter,
      is_archived: statusFilter === 'all' ? undefined : statusFilter === 'archived' ? true : false,
    }),
    [page, typeFilter, search, muscleGroupFilter, statusFilter],
  )

  const workoutsQuery = useAdminWorkoutsQuery(queryParams)
  const muscleGroupsQuery = useMuscleGroupsQuery()
  const cardioTypesQuery = useCardioTypesQuery()

  const createWorkoutMutation = useCreateWorkoutMutation()
  const updateWorkoutMutation = useUpdateWorkoutMutation()
  const archiveWorkoutMutation = useArchiveWorkoutMutation()
  const unarchiveWorkoutMutation = useUnarchiveWorkoutMutation()
  const createMuscleGroupMutation = useCreateMuscleGroupMutation()

  async function handleSaveWorkout(payload: WorkoutCreatePayload | WorkoutUpdatePayload) {
    try {
      setActionError(null)
      if (formMode === 'create') {
        await createWorkoutMutation.mutateAsync(payload as WorkoutCreatePayload)
      } else if (selectedWorkout) {
        await updateWorkoutMutation.mutateAsync({
          workoutId: selectedWorkout.id,
          payload: payload as WorkoutUpdatePayload,
        })
      }
      setIsFormOpen(false)
      setSelectedWorkout(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save workout.')
    }
  }

  async function handleArchiveWorkout() {
    if (!archiveCandidate) {
      return
    }

    try {
      setArchiveError(null)
      setActionError(null)
      await archiveWorkoutMutation.mutateAsync(archiveCandidate.id)
      setArchiveCandidate(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to archive workout.'
      setArchiveError(message)
      setActionError(message)
    }
  }

  async function handleUnarchiveWorkout(workout: Workout) {
    try {
      setActionError(null)
      await unarchiveWorkoutMutation.mutateAsync(workout.id)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to unarchive workout.')
    }
  }

  return (
    <AdminShell
      title="Workout Library"
      description="Create, update, archive, and restore workouts used in coach plans."
    >
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
              onChange={(event) => setSearchDraft(event.target.value)}
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
              onChange={(event) => {
                setTypeFilter(event.target.value as WorkoutFilterType)
                setPage(1)
              }}
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
              onChange={(event) => {
                setStatusFilter(event.target.value as WorkoutStatusFilter)
                setPage(1)
              }}
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
              onChange={(event) => {
                setMuscleGroupFilter(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">All groups</option>
              {(muscleGroupsQuery.data ?? []).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSearch(searchDraft.trim())
              setPage(1)
            }}
          >
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setFormMode('create')
              setSelectedWorkout(null)
              setIsFormOpen(true)
            }}
          >
            Create Workout
          </Button>
        </div>

        {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
      </section>

      <WorkoutLibraryTable
        workouts={workoutsQuery.data?.items ?? []}
        isLoading={workoutsQuery.isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        total={workoutsQuery.data?.total ?? 0}
        totalPages={workoutsQuery.data?.total_pages ?? 0}
        onPageChange={setPage}
        onEdit={(workout) => {
          setActionError(null)
          setSelectedWorkout(workout)
          setFormMode('edit')
          setIsFormOpen(true)
        }}
        onArchive={(workout) => {
          setArchiveError(null)
          setArchiveCandidate(workout)
        }}
        onUnarchive={handleUnarchiveWorkout}
      />

      {isFormOpen ? (
        <WorkoutFormModal
          key={`${formMode}-${selectedWorkout?.id ?? 'new'}`}
          open={isFormOpen}
          mode={formMode}
          workout={selectedWorkout}
          muscleGroups={muscleGroupsQuery.data ?? []}
          cardioTypes={cardioTypesQuery.data ?? []}
          isSubmitting={createWorkoutMutation.isPending || updateWorkoutMutation.isPending}
          isCreatingMuscleGroup={createMuscleGroupMutation.isPending}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedWorkout(null)
          }}
          onSubmit={handleSaveWorkout}
          onCreateMuscleGroup={async (payload) => {
            await createMuscleGroupMutation.mutateAsync(payload)
          }}
        />
      ) : null}

      {archiveCandidate ? (
        <ArchiveWorkoutModal
          open={Boolean(archiveCandidate)}
          workout={archiveCandidate}
          isSubmitting={archiveWorkoutMutation.isPending}
          dependencyError={archiveError}
          onClose={() => {
            setArchiveCandidate(null)
            setArchiveError(null)
          }}
          onConfirmArchive={handleArchiveWorkout}
        />
      ) : null}
    </AdminShell>
  )
}
