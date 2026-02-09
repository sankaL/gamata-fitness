import { Link } from 'react-router-dom'

import { AdminShell } from '@/components/admin/AdminShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminOverviewQuery } from '@/hooks/use-admin-users'

const metricCards = [
  { key: 'total_users', label: 'Athletes' },
  { key: 'total_coaches', label: 'Coaches' },
  { key: 'total_workouts', label: 'Workouts' },
  { key: 'active_users', label: 'Active Accounts' },
  { key: 'inactive_users', label: 'Inactive Accounts' },
] as const

export function AdminDashboardPage() {
  const overviewQuery = useAdminOverviewQuery()

  return (
    <AdminShell
      title="Admin Dashboard"
      description="Platform overview with quick actions for user and workout administration."
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((metric) => (
          <Card key={metric.key} className="border-slate-300 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-slate-900">
                {overviewQuery.isLoading ? '-' : (overviewQuery.data?.[metric.key] ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {overviewQuery.error ? (
        <p className="text-sm text-rose-700">
          {overviewQuery.error instanceof Error
            ? overviewQuery.error.message
            : 'Unable to load admin overview.'}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use these shortcuts to move directly into high-frequency admin workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/users">Manage Coach Assignments</Link>
          </Button>
          <Button variant="outline" disabled>
            Workout Library (Phase 5)
          </Button>
        </div>
      </section>
    </AdminShell>
  )
}
