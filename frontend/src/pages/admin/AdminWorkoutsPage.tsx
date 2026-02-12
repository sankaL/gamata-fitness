import { useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/AdminShell'
import { ArchiveWorkoutModal } from '@/components/admin/ArchiveWorkoutModal'
import { CsvImportModal } from '@/components/admin/CsvImportModal'
import { AdminWorkoutsToolbar } from '@/components/admin/AdminWorkoutsToolbar'
import { WorkoutFormModal } from '@/components/admin/WorkoutFormModal'
import { WorkoutLibraryTable } from '@/components/admin/WorkoutLibraryTable'
import { useToast } from '@/components/ui/toast-provider'
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
import { useAdminWorkoutsCsv } from '@/hooks/use-admin-workouts-csv'
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
  const { showToast } = useToast()
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
  const csvTools = useAdminWorkoutsCsv({
    onError: (message) => setActionError(message),
    onToast: showToast,
  })

  async function handleSaveWorkout(payload: WorkoutCreatePayload | WorkoutUpdatePayload) {
    try {
      setActionError(null)
      if (formMode === 'create') {
        await createWorkoutMutation.mutateAsync(payload as WorkoutCreatePayload)
        showToast('Workout created successfully.', 'success')
      } else if (selectedWorkout) {
        await updateWorkoutMutation.mutateAsync({
          workoutId: selectedWorkout.id,
          payload: payload as WorkoutUpdatePayload,
        })
        showToast('Workout updated successfully.', 'success')
      }
      setIsFormOpen(false)
      setSelectedWorkout(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save workout.'
      setActionError(message)
      showToast(message, 'error')
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
      showToast('Workout archived.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to archive workout.'
      setArchiveError(message)
      setActionError(message)
      showToast(message, 'error')
    }
  }

  async function handleUnarchiveWorkout(workout: Workout) {
    try {
      setActionError(null)
      await unarchiveWorkoutMutation.mutateAsync(workout.id)
      showToast('Workout unarchived.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to unarchive workout.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  return (
    <AdminShell>
      <AdminWorkoutsToolbar
        searchDraft={searchDraft}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        muscleGroupFilter={muscleGroupFilter}
        muscleGroups={muscleGroupsQuery.data ?? []}
        isExporting={csvTools.exportWorkoutsMutation.isPending}
        onSearchDraftChange={setSearchDraft}
        onTypeFilterChange={(value) => {
          setTypeFilter(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onMuscleGroupFilterChange={(value) => {
          setMuscleGroupFilter(value)
          setPage(1)
        }}
        onApplyFilters={() => {
          setSearch(searchDraft.trim())
          setPage(1)
        }}
        onCreateWorkout={() => {
          setFormMode('create')
          setSelectedWorkout(null)
          setIsFormOpen(true)
        }}
        onExportCsv={() => {
          setActionError(null)
          void csvTools.handleExportWorkoutsCsv()
        }}
        onImportCsv={() => {
          csvTools.setImportResult(null)
          csvTools.setIsImportOpen(true)
        }}
      />

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

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

      <CsvImportModal
        open={csvTools.isImportOpen}
        title="Import Workouts"
        description="Upload a CSV with workout columns (name, type, muscle_groups, and required type-specific fields)."
        isSubmitting={csvTools.importWorkoutsMutation.isPending}
        result={csvTools.importResult}
        onClose={() => {
          csvTools.setIsImportOpen(false)
        }}
        onSubmit={csvTools.handleImportWorkoutsCsv}
      />
    </AdminShell>
  )
}
