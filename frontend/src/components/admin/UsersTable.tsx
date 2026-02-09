import type { AdminUserListItem } from '@/types/users'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface UsersTableProps {
  users: AdminUserListItem[]
  isLoading: boolean
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (nextPage: number) => void
  onEdit: (user: AdminUserListItem) => void
  onDeactivate: (user: AdminUserListItem) => void
  onManageCoaches: (user: AdminUserListItem) => void
}

function RoleBadge({ role }: { role: AdminUserListItem['role'] }) {
  const roleStyles: Record<AdminUserListItem['role'], string> = {
    admin: 'bg-violet-100 text-violet-800',
    coach: 'bg-amber-100 text-amber-800',
    user: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', roleStyles[role])}>
      {role}
    </span>
  )
}

export function UsersTable({
  users,
  isLoading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onEdit,
  onDeactivate,
  onManageCoaches,
}: UsersTableProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">User Directory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Coaches</th>
                <th className="py-2 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-600">
                    Loading users...
                  </td>
                </tr>
              ) : null}

              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-600">
                    No users match the current filters.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-4 text-slate-900">{user.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{user.email}</td>
                      <td className="py-3 pr-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700',
                          )}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{user.coach_count}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onEdit(user)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onManageCoaches(user)
                            }}
                            disabled={user.role !== 'user' || !user.is_active}
                          >
                            Coaches
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              onDeactivate(user)
                            }}
                            disabled={!user.is_active}
                          >
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>
            Showing {start}-{end} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || totalPages === 0}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
