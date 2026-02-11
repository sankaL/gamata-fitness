import { useState } from 'react'

import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SessionHistoryItem } from '@/types/progress'

interface SessionHistoryListProps {
  sessions: SessionHistoryItem[]
  isLoading: boolean
  onEditSession: (session: SessionHistoryItem) => void
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'In progress'
  }
  return new Date(value).toLocaleString()
}

export function SessionHistoryList({
  sessions,
  isLoading,
  onEditSession,
}: SessionHistoryListProps) {
  const [expandedSessionIds, setExpandedSessionIds] = useState<string[]>([])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No Sessions Found"
        description="Adjust your filters or complete a workout to see history here."
      />
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const isExpanded = expandedSessionIds.includes(session.id)
        return (
          <div key={session.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{session.workout_name}</p>
                <p className="text-xs text-slate-600 capitalize">
                  {session.workout_type} • {session.session_type}
                </p>
                <p className="text-xs text-slate-500">{formatDateTime(session.completed_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setExpandedSessionIds((current) =>
                      isExpanded
                        ? current.filter((id) => id !== session.id)
                        : [...current, session.id],
                    )
                  }
                >
                  {isExpanded ? 'Hide' : 'Details'}
                </Button>
                <Button variant="outline" onClick={() => onEditSession(session)}>
                  Edit
                </Button>
              </div>
            </div>

            {isExpanded ? (
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm">
                <p className="text-slate-700">
                  Sets: {session.total_sets} | Reps: {session.total_reps} | Duration:{' '}
                  {session.total_duration}s | Volume: {session.total_volume}
                </p>
                <div className="space-y-1">
                  {session.logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                    >
                      sets={log.sets ?? '-'} reps={log.reps ?? '-'} weight={log.weight ?? '-'}{' '}
                      duration=
                      {log.duration ?? '-'} notes={log.notes ?? '-'}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
