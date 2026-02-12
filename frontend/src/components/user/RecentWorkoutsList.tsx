import { Dumbbell, Clock, Flame } from 'lucide-react'

import { SectionHeader } from '@/components/shared/SectionHeader'
import type { SessionHistoryItem } from '@/types/progress'

interface RecentWorkoutsListProps {
  sessions: SessionHistoryItem[]
  isLoading: boolean
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.round(seconds / 60)
  return `${mins}m`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function RecentWorkoutsList({ sessions, isLoading }: RecentWorkoutsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Recent" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) return null

  return (
    <div className="space-y-3">
      <SectionHeader title="Recent" />
      {sessions.slice(0, 3).map((session) => (
        <div key={session.id} className="rounded-xl bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{session.workout_name}</p>
            <span className="text-[11px] text-muted-foreground">
              {session.completed_at ? formatDate(session.completed_at) : 'In progress'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {session.total_logs} exercises
            </span>
            {session.total_volume > 0 && (
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {session.total_volume.toLocaleString()} kg
              </span>
            )}
            {session.total_duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(session.total_duration)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
