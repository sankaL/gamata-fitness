import { Activity, Calendar, Flame, Trophy } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import type { UserQuickStatsResponse } from '@/types/user-dashboard'

interface QuickStatsCardsProps {
  stats: UserQuickStatsResponse | null
  isLoading: boolean
}

const statConfig = [
  { key: 'sessions_this_week', label: 'This Week', icon: Activity },
  { key: 'current_streak_days', label: 'Streak', icon: Flame },
  { key: 'completed_today', label: 'Today', icon: Calendar },
  { key: 'total_completed_sessions', label: 'Total', icon: Trophy },
] as const

export function QuickStatsCards({ stats, isLoading }: QuickStatsCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {statConfig.map((item) => {
        const Icon = item.icon
        const value = stats?.[item.key] ?? 0
        return (
          <div key={item.key} className="rounded-xl bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            )}
          </div>
        )
      })}
    </section>
  )
}
