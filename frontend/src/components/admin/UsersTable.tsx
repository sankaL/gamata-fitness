import type { AdminUserListItem } from '@/types/users'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
    admin: 'bg-violet-900/40 text-violet-300',
    coach: 'bg-amber-900/40 text-amber-300',
    user: 'bg-emerald-900/40 text-emerald-300',
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
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : users.length === 0 ? (
        <p className="rounded-xl bg-card p-4 text-center text-sm text-muted-foreground">
          No users match your current filters.
        </p>
      ) : (
        users.map((user) => (
          <div key={user.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <RoleBadge role={user.role} />
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    user.is_active
                      ? 'bg-emerald-900/40 text-emerald-300'
                      : 'bg-rose-900/40 text-rose-300',
                  )}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Coaches: {user.coach_count}</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onManageCoaches(user)}
                disabled={user.role !== 'user' || !user.is_active}
              >
                Coaches
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDeactivate(user)}
                disabled={!user.is_active}
              >
                Deactivate
              </Button>
            </div>
          </div>
        ))
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
        <p>
          {start}-{end} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span>
            {page}/{Math.max(totalPages, 1)}
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
    </div>
  )
}
