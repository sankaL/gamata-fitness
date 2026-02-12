import { Link } from 'react-router-dom'

import { AdminShell } from '@/components/admin/AdminShell'
import { SectionHeader } from '@/components/shared/SectionHeader'
import { Button } from '@/components/ui/button'
import { useAdminOverviewQuery } from '@/hooks/use-admin-users'

const metricCards = [
  { key: 'total_users', label: 'Athletes' },
  { key: 'total_coaches', label: 'Coaches' },
  { key: 'total_workouts', label: 'Workouts' },
  { key: 'active_users', label: 'Active' },
  { key: 'inactive_users', label: 'Inactive' },
] as const

export function AdminDashboardPage() {
  const overviewQuery = useAdminOverviewQuery()

  return (
    <AdminShell>
      <section className="grid grid-cols-2 gap-3">
        {metricCards.map((metric) => (
          <div key={metric.key} className="rounded-xl bg-card p-3">
            <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {overviewQuery.isLoading ? '-' : (overviewQuery.data?.[metric.key] ?? 0)}
            </p>
          </div>
        ))}
      </section>

      {overviewQuery.error ? (
        <p className="text-sm text-destructive">
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : 'Unable to load admin overview.'}
        </p>
      ) : null}

      <div className="space-y-3">
        <SectionHeader title="Quick Actions" />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/users">Coach Assignments</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/admin/workouts">Workout Library</Link>
          </Button>
        </div>
      </div>
    </AdminShell>
  )
}
