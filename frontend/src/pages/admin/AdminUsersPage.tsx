import { useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/AdminShell'
import { CoachAssignmentModal } from '@/components/admin/CoachAssignmentModal'
import { DeactivateUserModal } from '@/components/admin/DeactivateUserModal'
import { UserFormModal } from '@/components/admin/UserFormModal'
import { UsersTable } from '@/components/admin/UsersTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useAdminUserDetailQuery,
  useAdminUsersQuery,
  useAssignCoachesMutation,
  useCoachOptionsQuery,
  useCreateUserMutation,
  useDeactivateUserMutation,
  useRemoveCoachAssignmentMutation,
  useUpdateUserMutation,
} from '@/hooks/use-admin-users'
import type { UserRole } from '@/types/auth'
import type { AdminUserListItem, UserCreatePayload, UserUpdatePayload } from '@/types/users'

const PAGE_SIZE = 10

type RoleFilter = 'all' | UserRole
type StatusFilter = 'all' | 'active' | 'inactive'
type FormMode = 'create' | 'edit'

export function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [actionError, setActionError] = useState<string | null>(null)

  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [userFormMode, setUserFormMode] = useState<FormMode>('create')
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
  const [coachModalUserId, setCoachModalUserId] = useState<string | null>(null)

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      role: roleFilter === 'all' ? undefined : roleFilter,
      search: search || undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active' ? true : false,
    }),
    [page, roleFilter, search, statusFilter],
  )

  const usersQuery = useAdminUsersQuery(queryParams)
  const coachOptionsQuery = useCoachOptionsQuery()
  const userDetailQuery = useAdminUserDetailQuery(coachModalUserId, Boolean(coachModalUserId))

  const createUserMutation = useCreateUserMutation()
  const updateUserMutation = useUpdateUserMutation()
  const deactivateUserMutation = useDeactivateUserMutation()
  const assignCoachesMutation = useAssignCoachesMutation()
  const removeCoachMutation = useRemoveCoachAssignmentMutation()

  const users = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0
  const totalPages = usersQuery.data?.total_pages ?? 0

  async function handleSubmitUserForm(payload: UserCreatePayload | UserUpdatePayload) {
    try {
      setActionError(null)
      if (userFormMode === 'create') {
        await createUserMutation.mutateAsync(payload as UserCreatePayload)
      } else if (selectedUser) {
        await updateUserMutation.mutateAsync({
          userId: selectedUser.id,
          payload: payload as UserUpdatePayload,
        })
      }
      setIsUserFormOpen(false)
      setSelectedUser(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save user.')
    }
  }

  async function handleDeactivateSelectedUser() {
    if (!selectedUser) {
      return
    }
    try {
      setActionError(null)
      await deactivateUserMutation.mutateAsync(selectedUser.id)
      setIsDeactivateOpen(false)
      setSelectedUser(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to deactivate user.')
    }
  }

  async function handleAssignCoaches(coachIds: string[]) {
    if (!coachModalUserId) {
      return
    }
    try {
      setActionError(null)
      await assignCoachesMutation.mutateAsync({
        userId: coachModalUserId,
        payload: { coach_ids: coachIds },
      })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to assign coaches.')
    }
  }

  async function handleRemoveCoach(coachId: string) {
    if (!coachModalUserId) {
      return
    }
    try {
      setActionError(null)
      await removeCoachMutation.mutateAsync({ userId: coachModalUserId, coachId })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to remove coach assignment.')
    }
  }

  return (
    <AdminShell
      title="Admin User Management"
      description="Create, update, and deactivate users, and manage coach assignments."
    >
      <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid w-full gap-3 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-1">
              <label htmlFor="search-users" className="text-sm font-medium text-slate-700">
                Search
              </label>
              <Input
                id="search-users"
                value={searchDraft}
                placeholder="Name or email"
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role-filter" className="text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="role-filter"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as RoleFilter)
                  setPage(1)
                }}
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="coach">Coach</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status-filter"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter)
                  setPage(1)
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearch(searchDraft.trim())
                setPage(1)
              }}
            >
              Apply Filters
            </Button>
            <Button
              onClick={() => {
                setUserFormMode('create')
                setSelectedUser(null)
                setIsUserFormOpen(true)
              }}
            >
              Create User
            </Button>
          </div>
        </div>

        {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
      </section>

      <UsersTable
        users={users}
        isLoading={usersQuery.isLoading}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={(user) => {
          setActionError(null)
          setSelectedUser(user)
          setUserFormMode('edit')
          setIsUserFormOpen(true)
        }}
        onDeactivate={(user) => {
          setActionError(null)
          setSelectedUser(user)
          setIsDeactivateOpen(true)
        }}
        onManageCoaches={(user) => {
          setActionError(null)
          setCoachModalUserId(user.id)
        }}
      />

      {isUserFormOpen ? (
        <UserFormModal
          key={`${userFormMode}-${selectedUser?.id ?? 'new'}`}
          open={isUserFormOpen}
          mode={userFormMode}
          user={selectedUser}
          isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
          onClose={() => {
            setIsUserFormOpen(false)
            setSelectedUser(null)
          }}
          onSubmit={handleSubmitUserForm}
        />
      ) : null}

      {isDeactivateOpen ? (
        <DeactivateUserModal
          open={isDeactivateOpen}
          user={selectedUser}
          isSubmitting={deactivateUserMutation.isPending}
          onClose={() => {
            setIsDeactivateOpen(false)
            setSelectedUser(null)
          }}
          onConfirm={handleDeactivateSelectedUser}
        />
      ) : null}

      {coachModalUserId ? (
        <CoachAssignmentModal
          key={coachModalUserId}
          open={Boolean(coachModalUserId)}
          user={userDetailQuery.data ?? null}
          coachOptions={coachOptionsQuery.data?.items ?? []}
          isAssigning={assignCoachesMutation.isPending}
          isRemoving={removeCoachMutation.isPending}
          onClose={() => setCoachModalUserId(null)}
          onAssign={handleAssignCoaches}
          onRemove={handleRemoveCoach}
        />
      ) : null}
    </AdminShell>
  )
}
