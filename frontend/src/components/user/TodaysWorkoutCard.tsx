import { ArrowRightLeft, Play, Sparkles } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserTodayWorkoutResponse } from '@/types/user-dashboard'

interface TodaysWorkoutCardProps {
  today: UserTodayWorkoutResponse | null
  isLoading: boolean
  isStarting: boolean
  onStartAssignedWorkout: () => void
  onOpenSwap: () => void
  onOpenAdHoc: () => void
}

export function TodaysWorkoutCard({
  today,
  isLoading,
  isStarting,
  onStartAssignedWorkout,
  onOpenSwap,
  onOpenAdHoc,
}: TodaysWorkoutCardProps) {
  const primaryWorkout = today?.workouts[0] ?? null
  const muscleGroupLabel = primaryWorkout?.muscle_groups.map((g) => g.name).join(' \u00b7 ') ?? ''

  return (
    <div className="space-y-3">
      <SectionHeader title="Today's Workout" />
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2 rounded-xl bg-card p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : primaryWorkout ? (
          <div className="rounded-xl bg-secondary p-4 space-y-1">
            <p className="text-base font-semibold text-foreground">{primaryWorkout.name}</p>
            <p className="text-sm text-muted-foreground">
              <span className="capitalize">{primaryWorkout.type}</span>
              {muscleGroupLabel ? ` \u00b7 ${muscleGroupLabel}` : ''}
              {today?.plan_name ? ` \u00b7 ${today.plan_name}` : ''}
            </p>
            {today && today.workouts.length > 1 ? (
              <p className="text-xs text-muted-foreground">
                +{today.workouts.length - 1} additional workout(s) scheduled
              </p>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title="Rest Day"
            description="No assigned workout for today. Start an ad hoc session if you want extra training."
          />
        )}

        <Button
          className="h-12 w-full rounded-xl text-base font-semibold"
          onClick={onStartAssignedWorkout}
          disabled={isStarting || !primaryWorkout || !today?.plan_id}
        >
          <Play className="h-5 w-5" />
          Start Workout
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onOpenSwap}
            disabled={!primaryWorkout || !today?.plan_id || isStarting}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Swap
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onOpenAdHoc}
            disabled={isStarting}
          >
            <Sparkles className="h-4 w-4" />
            Ad Hoc
          </Button>
        </div>
      </div>
    </div>
  )
}
