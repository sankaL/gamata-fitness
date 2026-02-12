import { CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Session } from '@/types/sessions'

interface WorkoutCelebrationProps {
  session: Session
  onDone: () => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function WorkoutCelebration({ session, onDone }: WorkoutCelebrationProps) {
  const totalDuration = session.logs.reduce((sum, log) => sum + (log.duration ?? 0), 0)
  const totalSets = session.logs.reduce((sum, log) => sum + (log.sets ?? 0), 0)
  const maxWeight = session.logs.reduce((current, log) => {
    const weight = log.weight ? Number(log.weight) : 0
    return Math.max(current, weight)
  }, 0)

  return (
    <section className="rounded-xl border border-primary bg-card p-6 text-center shadow-sm">
      <CheckCircle2 className="mx-auto h-14 w-14 animate-bounce text-success" />
      <h2 className="mt-3 text-2xl font-semibold text-foreground">Workout Complete</h2>
      <p className="mt-1 text-sm text-muted-foreground">Great work. Session saved successfully.</p>

      <div className="mt-5 grid gap-3 grid-cols-3">
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Sets Logged</p>
          <p className="text-xl font-semibold text-foreground">{totalSets}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="text-xl font-semibold text-foreground">{formatDuration(totalDuration)}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Max Weight</p>
          <p className="text-xl font-semibold text-foreground">{maxWeight.toFixed(1)} kg</p>
        </div>
      </div>

      <Button className="mt-6" onClick={onDone}>
        Back to Dashboard
      </Button>
    </section>
  )
}
