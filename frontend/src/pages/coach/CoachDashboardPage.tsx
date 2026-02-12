import { Link } from 'react-router-dom'

import { CoachRosterTable } from '@/components/coach/CoachRosterTable'
import { CoachShell } from '@/components/coach/CoachShell'
import { Button } from '@/components/ui/button'
import { useCoachRosterQuery } from '@/hooks/use-coach-plans'

export function CoachDashboardPage() {
  const rosterQuery = useCoachRosterQuery()

  return (
    <CoachShell>
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Build and assign plans from your plan management workspace.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/coach/plans">Manage Plans</Link>
          </Button>
        </div>
      </section>

      <CoachRosterTable users={rosterQuery.data?.users ?? []} isLoading={rosterQuery.isLoading} />

      {rosterQuery.error ? (
        <p className="text-sm text-destructive">
          {rosterQuery.error instanceof Error
            ? rosterQuery.error.message
            : 'Unable to load assigned athletes.'}
        </p>
      ) : null}
    </CoachShell>
  )
}
