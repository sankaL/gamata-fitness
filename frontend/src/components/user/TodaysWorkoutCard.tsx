import { ArrowRightLeft, Play, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const muscleGroupLabel = primaryWorkout?.muscle_groups.map((group) => group.name).join(', ') ?? ''

  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">Today's Workout</CardTitle>
        <p className="text-sm text-slate-600">
          {today?.plan_name ? `Plan: ${today.plan_name}` : 'No active plan assigned.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-slate-600">Loading today's workout...</p>
        ) : primaryWorkout ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-base font-semibold text-slate-900">{primaryWorkout.name}</p>
            <p className="mt-1 text-sm text-slate-600 capitalize">{primaryWorkout.type}</p>
            <p className="mt-2 text-sm text-slate-700">{muscleGroupLabel}</p>
            {today && today.workouts.length > 1 ? (
              <p className="mt-2 text-xs text-slate-500">
                +{today.workouts.length - 1} additional workout(s) scheduled today.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Rest day. Start an ad hoc workout if you want extra training.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onStartAssignedWorkout}
            disabled={isStarting || !primaryWorkout || !today?.plan_id}
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={onOpenSwap}
            disabled={!primaryWorkout || !today?.plan_id || isStarting}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Swap
          </Button>
          <Button variant="outline" onClick={onOpenAdHoc} disabled={isStarting}>
            <Sparkles className="h-4 w-4" />
            Ad Hoc
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
