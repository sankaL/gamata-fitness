import { Mail } from 'lucide-react'

import { UserShell } from '@/components/user/UserShell'
import { useUserCoachesQuery } from '@/hooks/use-user-progress'

export function MyCoachesPage() {
  const coachesQuery = useUserCoachesQuery()

  return (
    <UserShell title="My Coaches" description="Your assigned coaching team and contact details.">
      <section className="space-y-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        {coachesQuery.isLoading ? (
          <p className="text-sm text-slate-600">Loading coaches...</p>
        ) : (coachesQuery.data?.coaches.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-600">No coaches are currently assigned.</p>
        ) : (
          coachesQuery.data?.coaches.map((coach) => (
            <div
              key={coach.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
            >
              <div>
                <p className="font-semibold text-slate-900">{coach.name}</p>
                <p className="text-sm text-slate-600">{coach.email}</p>
              </div>
              <a
                href={`mailto:${coach.email}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
          ))
        )}

        {coachesQuery.error ? (
          <p className="text-sm text-rose-700">
            {coachesQuery.error instanceof Error
              ? coachesQuery.error.message
              : 'Unable to load coaches.'}
          </p>
        ) : null}
      </section>
    </UserShell>
  )
}
