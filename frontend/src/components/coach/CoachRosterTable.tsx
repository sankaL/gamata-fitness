import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CoachRosterUser } from '@/types/plans'

interface CoachRosterTableProps {
  users: CoachRosterUser[]
  isLoading: boolean
}

export function CoachRosterTable({ users, isLoading }: CoachRosterTableProps) {
  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Assigned Athletes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-4 font-medium">Athlete</th>
                <th className="py-2 pr-4 font-medium">Active Plan</th>
                <th className="py-2 pr-4 font-medium">Pending Plans</th>
                <th className="py-2 pr-4 font-medium">Weekly Completion</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-600">
                    Loading assigned athletes...
                  </td>
                </tr>
              ) : null}

              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-600">
                    No athletes are currently assigned to you.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? users.map((user) => (
                    <tr key={user.user_id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 text-slate-900">
                        <p className="font-medium">{user.user_name}</p>
                        <p className="text-xs text-slate-500">{user.user_email}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">
                        {user.active_plan_name ?? 'None'}
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{user.pending_plan_count}</td>
                      <td className="py-3 pr-4 text-slate-700">
                        {user.weekly_completion_percent.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
