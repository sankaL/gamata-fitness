import { useMemo, useState } from 'react'

import { CoachShell } from '@/components/coach/CoachShell'
import { CoachPlansTable } from '@/components/coach/CoachPlansTable'
import { PlanBuilderForm } from '@/components/plan/PlanBuilderForm'
import { UserAssignmentPanel } from '@/components/plan/UserAssignmentPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast-provider'
import {
  useArchivePlanMutation,
  useAssignPlanMutation,
  useCoachPlanDetailQuery,
  useCoachPlansQuery,
  useCoachRosterQuery,
  useCreatePlanMutation,
  useExportPlanCsvMutation,
  useSoftDeletePlanMutation,
  useUnarchivePlanMutation,
  useUpdatePlanMutation,
  useWorkoutPickerQuery,
} from '@/hooks/use-coach-plans'
import { downloadFile } from '@/lib/download'
import type { PlanCreatePayload, PlanUpdatePayload } from '@/types/plans'

const PAGE_SIZE = 10

type PlanStatusFilter = 'all' | 'active' | 'archived'

type BuilderMode = 'create' | 'edit'

export function CoachPlansPage() {
  const { showToast } = useToast()
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PlanStatusFilter>('active')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [builderMode, setBuilderMode] = useState<BuilderMode>('create')
  const [workoutSearch, setWorkoutSearch] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [actionError, setActionError] = useState<string | null>(null)

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: search || undefined,
      is_archived: statusFilter === 'all' ? undefined : statusFilter === 'archived' ? true : false,
    }),
    [page, search, statusFilter],
  )

  const plansQuery = useCoachPlansQuery(queryParams)
  const selectedPlanQuery = useCoachPlanDetailQuery(selectedPlanId, Boolean(selectedPlanId))
  const rosterQuery = useCoachRosterQuery()
  const workoutPickerQuery = useWorkoutPickerQuery(workoutSearch)

  const createPlanMutation = useCreatePlanMutation()
  const updatePlanMutation = useUpdatePlanMutation()
  const archivePlanMutation = useArchivePlanMutation()
  const unarchivePlanMutation = useUnarchivePlanMutation()
  const deletePlanMutation = useSoftDeletePlanMutation()
  const assignPlanMutation = useAssignPlanMutation()
  const exportPlanMutation = useExportPlanCsvMutation()

  async function handleSavePlan(payload: PlanCreatePayload | PlanUpdatePayload) {
    try {
      setActionError(null)

      if (builderMode === 'create') {
        const created = await createPlanMutation.mutateAsync(payload as PlanCreatePayload)
        setSelectedPlanId(created.id)
        setBuilderMode('edit')
        showToast('Plan created successfully.', 'success')
      } else if (selectedPlanId) {
        await updatePlanMutation.mutateAsync({
          planId: selectedPlanId,
          payload: payload as PlanUpdatePayload,
        })
        showToast('Plan updated successfully.', 'success')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save plan.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  async function handleAssignPlan() {
    if (!selectedPlanId || selectedUserIds.length === 0) {
      if (!selectedPlanId) {
        setActionError('Select a saved plan before assigning athletes.')
      }
      return
    }

    try {
      setActionError(null)
      await assignPlanMutation.mutateAsync({
        planId: selectedPlanId,
        payload: { user_ids: selectedUserIds },
      })
      setSelectedUserIds([])
      showToast('Plan assigned to selected athletes.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to assign plan.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  async function handleExportSelectedPlan() {
    if (!selectedPlanId) {
      return
    }
    try {
      setActionError(null)
      const file = await exportPlanMutation.mutateAsync(selectedPlanId)
      downloadFile(file)
      showToast('Plan CSV downloaded.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export plan CSV.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  return (
    <CoachShell
      title="Plan Management"
      description="Build weekly plans, assign athletes, and manage archived templates."
    >
      <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="plan-search" className="text-sm font-medium text-slate-700">
              Search
            </label>
            <Input
              id="plan-search"
              value={searchDraft}
              placeholder="Plan name"
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="plan-status" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="plan-status"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as PlanStatusFilter)
                setPage(1)
              }}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
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
              setBuilderMode('create')
              setSelectedPlanId(null)
            }}
          >
            New Plan
          </Button>
          <Button
            variant="outline"
            disabled={!selectedPlanId || exportPlanMutation.isPending}
            onClick={() => {
              void handleExportSelectedPlan()
            }}
          >
            {exportPlanMutation.isPending ? 'Exporting...' : 'Export Plan CSV'}
          </Button>
        </div>

        {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
      </section>

      <CoachPlansTable
        plans={plansQuery.data?.items ?? []}
        isLoading={plansQuery.isLoading}
        page={page}
        totalPages={plansQuery.data?.total_pages ?? 0}
        onPageChange={setPage}
        onEdit={(plan) => {
          setSelectedPlanId(plan.id)
          setBuilderMode('edit')
        }}
        onArchive={async (plan) => {
          try {
            setActionError(null)
            await archivePlanMutation.mutateAsync(plan.id)
            showToast('Plan archived.', 'success')
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to archive plan.'
            setActionError(message)
            showToast(message, 'error')
          }
        }}
        onUnarchive={async (plan) => {
          try {
            setActionError(null)
            await unarchivePlanMutation.mutateAsync(plan.id)
            showToast('Plan unarchived.', 'success')
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to unarchive plan.'
            setActionError(message)
            showToast(message, 'error')
          }
        }}
        onDelete={async (plan) => {
          try {
            setActionError(null)
            await deletePlanMutation.mutateAsync(plan.id)
            showToast('Plan deleted (archived).', 'success')
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to delete plan.'
            setActionError(message)
            showToast(message, 'error')
          }
        }}
      />

      <PlanBuilderForm
        key={`${builderMode}-${selectedPlanQuery.data?.id ?? selectedPlanId ?? 'new'}`}
        mode={builderMode}
        plan={selectedPlanQuery.data ?? null}
        workouts={workoutPickerQuery.data?.items ?? []}
        workoutSearch={workoutSearch}
        isWorkoutsLoading={workoutPickerQuery.isLoading}
        isSubmitting={createPlanMutation.isPending || updatePlanMutation.isPending}
        onWorkoutSearchChange={setWorkoutSearch}
        onSave={handleSavePlan}
      />

      <UserAssignmentPanel
        users={rosterQuery.data?.users ?? []}
        selectedUserIds={selectedUserIds}
        isAssigning={assignPlanMutation.isPending}
        isDisabled={!selectedPlanId}
        onChange={setSelectedUserIds}
        onAssign={handleAssignPlan}
      />
    </CoachShell>
  )
}
