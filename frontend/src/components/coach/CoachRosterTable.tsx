import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { CoachRosterUser } from '@/types/plans'

interface CoachRosterTableProps {
  users: CoachRosterUser[]
  isLoading: boolean
}

export function CoachRosterTable({ users, isLoading }: CoachRosterTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assigned Athletes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}

        {!isLoading && users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No athletes are currently assigned to you.
          </p>
        ) : null}

        {!isLoading && users.length > 0 ? (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.user_id}
                className="rounded-lg border border-border bg-secondary/40 p-3"
              >
                <p className="font-medium text-foreground">{user.user_name}</p>
                <p className="text-xs text-muted-foreground">{user.user_email}</p>

                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Plan</p>
                    <p className="text-foreground">{user.active_plan_name ?? 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-foreground">{user.pending_plan_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weekly</p>
                    <p className="text-foreground">{user.weekly_completion_percent.toFixed(1)}%</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}
