import { useMemo, useState } from 'react'

import { PersonalRecordsCard } from '@/components/user/PersonalRecordsCard'
import {
  ProgressFilters,
  type DateRangePreset,
  type WorkoutTypeFilter,
} from '@/components/user/ProgressFilters'
import { SessionEditModal } from '@/components/user/SessionEditModal'
import { SessionHistoryList } from '@/components/user/SessionHistoryList'
import { UserShell } from '@/components/user/UserShell'
import { WeeklyFrequencyChart } from '@/components/user/WeeklyFrequencyChart'
import { MuscleGroupChart } from '@/components/user/MuscleGroupChart'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'
import {
  useFrequencyProgressQuery,
  useMuscleGroupProgressQuery,
  useUpdateSessionMutation,
  useUserMuscleGroupsQuery,
  useUserSessionsQuery,
} from '@/hooks/use-user-progress'
import type { SessionHistoryItem } from '@/types/progress'

type ProgressTab = 'history' | 'trends' | 'stats'

const PAGE_SIZE = 20

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function getPresetDates(preset: DateRangePreset): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  if (preset === '7d') {
    start.setDate(end.getDate() - 6)
  } else {
    start.setDate(end.getDate() - 29)
  }
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  }
}

export function ProgressDashboardPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<ProgressTab>('history')
  const [page, setPage] = useState(1)
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('30d')
  const [startDate, setStartDate] = useState(() => getPresetDates('30d').startDate)
  const [endDate, setEndDate] = useState(() => getPresetDates('30d').endDate)
  const [workoutType, setWorkoutType] = useState<WorkoutTypeFilter>('all')
  const [selectedMuscleGroupIds, setSelectedMuscleGroupIds] = useState<string[]>([])
  const [editingSession, setEditingSession] = useState<SessionHistoryItem | null>(null)

  const sessionsQuery = useUserSessionsQuery({
    page,
    page_size: PAGE_SIZE,
    start_date: startDate,
    end_date: endDate,
    workout_type: workoutType === 'all' ? undefined : workoutType,
  })
  const muscleGroupsQuery = useUserMuscleGroupsQuery()
  const muscleProgressQuery = useMuscleGroupProgressQuery({
    start_date: startDate,
    end_date: endDate,
  })
  const frequencyProgressQuery = useFrequencyProgressQuery({
    period: 'weekly',
    start_date: startDate,
    end_date: endDate,
  })
  const updateSessionMutation = useUpdateSessionMutation()

  function handlePresetChange(nextPreset: DateRangePreset) {
    setRangePreset(nextPreset)
    setPage(1)
    if (nextPreset === 'custom') {
      return
    }
    const nextDates = getPresetDates(nextPreset)
    setStartDate(nextDates.startDate)
    setEndDate(nextDates.endDate)
  }

  const filteredSessions = useMemo(() => {
    const source = sessionsQuery.data?.items ?? []
    if (selectedMuscleGroupIds.length === 0) {
      return source
    }
    return source.filter((session) =>
      session.muscle_groups.some((groupName) =>
        muscleGroupsQuery.data
          ?.filter((group) => selectedMuscleGroupIds.includes(group.id))
          .some((group) => group.name === groupName),
      ),
    )
  }, [sessionsQuery.data?.items, selectedMuscleGroupIds, muscleGroupsQuery.data])

  const filteredMuscleProgress = useMemo(() => {
    const items = muscleProgressQuery.data?.items ?? []
    if (selectedMuscleGroupIds.length === 0) {
      return items
    }
    return items.filter((item) => selectedMuscleGroupIds.includes(item.muscle_group_id))
  }, [muscleProgressQuery.data?.items, selectedMuscleGroupIds])

  const tabs: ProgressTab[] = ['history', 'trends', 'stats']

  return (
    <UserShell
      title="Progress Dashboard"
      description="Review session history, trends, and lifting records."
    >
      <ProgressFilters
        rangePreset={rangePreset}
        startDate={startDate}
        endDate={endDate}
        workoutType={workoutType}
        selectedMuscleGroupIds={selectedMuscleGroupIds}
        muscleGroups={muscleGroupsQuery.data ?? []}
        onRangePresetChange={handlePresetChange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onWorkoutTypeChange={(nextType) => {
          setWorkoutType(nextType)
          setPage(1)
        }}
        onToggleMuscleGroup={(groupId) =>
          setSelectedMuscleGroupIds((current) =>
            current.includes(groupId)
              ? current.filter((id) => id !== groupId)
              : [...current, groupId],
          )
        }
      />

      <section className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {activeTab === 'history' ? (
          <div className="space-y-3">
            <SessionHistoryList
              sessions={filteredSessions}
              isLoading={sessionsQuery.isLoading}
              onEditSession={setEditingSession}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <p className="text-sm text-slate-700">
                Page {sessionsQuery.data?.page ?? page} / {sessionsQuery.data?.total_pages ?? 1}
              </p>
              <Button
                variant="outline"
                disabled={page >= (sessionsQuery.data?.total_pages ?? 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {activeTab === 'trends' ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <MuscleGroupChart
              items={filteredMuscleProgress}
              isLoading={muscleProgressQuery.isLoading}
            />
            <WeeklyFrequencyChart
              buckets={frequencyProgressQuery.data?.buckets ?? []}
              isLoading={frequencyProgressQuery.isLoading}
            />
          </div>
        ) : null}

        {activeTab === 'stats' ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <PersonalRecordsCard sessions={filteredSessions} />
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Totals</h3>
              <p className="mt-2 text-sm text-slate-700">
                Sessions: {sessionsQuery.data?.total ?? 0}
              </p>
              <p className="text-sm text-slate-700">
                Volume:{' '}
                {filteredSessions
                  .reduce((sum, session) => sum + session.total_volume, 0)
                  .toFixed(1)}
              </p>
              <p className="text-sm text-slate-700">
                Duration:{' '}
                {filteredSessions.reduce((sum, session) => sum + session.total_duration, 0)}s
              </p>
            </section>
          </div>
        ) : null}

        {sessionsQuery.error ? (
          <p className="text-sm text-rose-700">
            {sessionsQuery.error instanceof Error
              ? sessionsQuery.error.message
              : 'Unable to load sessions.'}
          </p>
        ) : null}
      </section>

      <SessionEditModal
        key={editingSession?.id ?? 'session-edit-modal'}
        open={Boolean(editingSession)}
        session={editingSession}
        isSaving={updateSessionMutation.isPending}
        onClose={() => setEditingSession(null)}
        onSave={async (sessionId, logs) => {
          try {
            await updateSessionMutation.mutateAsync({
              sessionId,
              payload: { logs },
            })
            showToast('Session updated successfully.', 'success')
            setEditingSession(null)
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Unable to update session.', 'error')
          }
        }}
      />
    </UserShell>
  )
}
