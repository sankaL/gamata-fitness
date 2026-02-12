import { Mail } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { UserShell } from '@/components/user/UserShell'
import { useUserCoachesQuery } from '@/hooks/use-user-progress'

export function MyCoachesPage() {
  const coachesQuery = useUserCoachesQuery()

  return (
    <UserShell>
      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        {coachesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading coaches...</p>
        ) : (coachesQuery.data?.coaches.length ?? 0) === 0 ? (
          <EmptyState
            title="No Coaches Assigned"
            description="Your account is not assigned to any coach yet."
          />
        ) : (
          coachesQuery.data?.coaches.map((coach) => (
            <div
              key={coach.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-semibold text-foreground">{coach.name}</p>
                <p className="text-sm text-muted-foreground">{coach.email}</p>
              </div>
              <a
                href={`mailto:${coach.email}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
          ))
        )}

        {coachesQuery.error ? (
          <p className="text-sm text-destructive">
            {coachesQuery.error instanceof Error
              ? coachesQuery.error.message
              : 'Unable to load coaches.'}
          </p>
        ) : null}
      </section>
    </UserShell>
  )
}
