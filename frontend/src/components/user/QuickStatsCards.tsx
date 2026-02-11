import { Activity, Calendar, Flame, Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserQuickStatsResponse } from '@/types/user-dashboard'

interface QuickStatsCardsProps {
  stats: UserQuickStatsResponse | null
  isLoading: boolean
}

const statConfig = [
  {
    key: 'sessions_this_week',
    label: 'Sessions This Week',
    icon: Activity,
  },
  {
    key: 'current_streak_days',
    label: 'Current Streak',
    icon: Flame,
  },
  {
    key: 'completed_today',
    label: 'Completed Today',
    icon: Calendar,
  },
  {
    key: 'total_completed_sessions',
    label: 'Total Completed',
    icon: Trophy,
  },
] as const

export function QuickStatsCards({ stats, isLoading }: QuickStatsCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statConfig.map((item) => {
        const Icon = item.icon
        const value = stats?.[item.key] ?? 0
        return (
          <Card key={item.key} className="border-slate-300 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
              <Icon className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-16" />
              ) : (
                <p className="text-3xl font-semibold text-slate-900">{value}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
