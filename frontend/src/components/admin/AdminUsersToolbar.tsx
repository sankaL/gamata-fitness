import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserRole } from '@/types/auth'

type RoleFilter = 'all' | UserRole
type StatusFilter = 'all' | 'active' | 'inactive'

interface AdminUsersToolbarProps {
  searchDraft: string
  roleFilter: RoleFilter
  statusFilter: StatusFilter
  isExporting: boolean
  onSearchDraftChange: (value: string) => void
  onRoleFilterChange: (value: RoleFilter) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onApplyFilters: () => void
  onCreateUser: () => void
  onExportCsv: () => void
  onImportCsv: () => void
}

export function AdminUsersToolbar({
  searchDraft,
  roleFilter,
  statusFilter,
  isExporting,
  onSearchDraftChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onApplyFilters,
  onCreateUser,
  onExportCsv,
  onImportCsv,
}: AdminUsersToolbarProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <label htmlFor="search-users" className="text-sm font-medium text-foreground">
            Search
          </label>
          <Input
            id="search-users"
            value={searchDraft}
            placeholder="Name or email"
            onChange={(event) => onSearchDraftChange(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="role-filter" className="text-sm font-medium text-foreground">
            Role
          </label>
          <select
            id="role-filter"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(event) => onRoleFilterChange(event.target.value as RoleFilter)}
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="coach">Coach</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="status-filter" className="text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="status-filter"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onApplyFilters}>
          Apply Filters
        </Button>
        <Button onClick={onCreateUser}>Create User</Button>
        <Button variant="outline" disabled={isExporting} onClick={onExportCsv}>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
        <Button variant="outline" onClick={onImportCsv}>
          Import CSV
        </Button>
      </div>
    </section>
  )
}
