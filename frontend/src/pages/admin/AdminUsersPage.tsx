import { useMemo, useState } from 'react'

import { AdminShell } from '@/components/admin/AdminShell'
import { CoachAssignmentModal } from '@/components/admin/CoachAssignmentModal'
import { CsvImportModal } from '@/components/admin/CsvImportModal'
import { DeactivateUserModal } from '@/components/admin/DeactivateUserModal'
import { AdminUsersToolbar } from '@/components/admin/AdminUsersToolbar'
import { UserFormModal } from '@/components/admin/UserFormModal'
import { UsersTable } from '@/components/admin/UsersTable'
import { useToast } from '@/components/ui/toast-provider'
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
import { useAdminUsersCsv } from '@/hooks/use-admin-users-csv'
import type { UserRole } from '@/types/auth'
import type { AdminUserListItem, UserCreatePayload, UserUpdatePayload } from '@/types/users'

const PAGE_SIZE = 10

type RoleFilter = 'all' | UserRole
type StatusFilter = 'all' | 'active' | 'inactive'
type FormMode = 'create' | 'edit'

export function AdminUsersPage() {
  const { showToast } = useToast()
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
  const csvTools = useAdminUsersCsv({
    onError: (message) => setActionError(message),
    onToast: showToast,
  })

  const users = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0
  const totalPages = usersQuery.data?.total_pages ?? 0

  async function handleSubmitUserForm(payload: UserCreatePayload | UserUpdatePayload) {
    try {
      setActionError(null)
      if (userFormMode === 'create') {
        await createUserMutation.mutateAsync(payload as UserCreatePayload)
        showToast('User created successfully.', 'success')
      } else if (selectedUser) {
        await updateUserMutation.mutateAsync({
          userId: selectedUser.id,
          payload: payload as UserUpdatePayload,
        })
        showToast('User updated successfully.', 'success')
      }
      setIsUserFormOpen(false)
      setSelectedUser(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save user.'
      setActionError(message)
      showToast(message, 'error')
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
      showToast('User deactivated.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to deactivate user.'
      setActionError(message)
      showToast(message, 'error')
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
      showToast('Coach assignments updated.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to assign coaches.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  async function handleRemoveCoach(coachId: string) {
    if (!coachModalUserId) {
      return
    }
    try {
      setActionError(null)
      await removeCoachMutation.mutateAsync({ userId: coachModalUserId, coachId })
      showToast('Coach assignment removed.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove coach assignment.'
      setActionError(message)
      showToast(message, 'error')
    }
  }

  return (
    <AdminShell>
      <AdminUsersToolbar
        searchDraft={searchDraft}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        isExporting={csvTools.exportUsersMutation.isPending}
        onSearchDraftChange={setSearchDraft}
        onRoleFilterChange={(value) => {
          setRoleFilter(value)
          setPage(1)
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onApplyFilters={() => {
          setSearch(searchDraft.trim())
          setPage(1)
        }}
        onCreateUser={() => {
          setUserFormMode('create')
          setSelectedUser(null)
          setIsUserFormOpen(true)
        }}
        onExportCsv={() => {
          setActionError(null)
          void csvTools.handleExportUsersCsv()
        }}
        onImportCsv={() => {
          csvTools.setImportResult(null)
          csvTools.setIsImportOpen(true)
        }}
      />

      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

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

      <CsvImportModal
        open={csvTools.isImportOpen}
        title="Import Users"
        description="Upload a CSV with columns: name, email, role, password."
        isSubmitting={csvTools.importUsersMutation.isPending}
        result={csvTools.importResult}
        onClose={() => {
          csvTools.setIsImportOpen(false)
        }}
        onSubmit={csvTools.handleImportUsersCsv}
      />
    </AdminShell>
  )
}
