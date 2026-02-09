import { Button } from '@/components/ui/button'
import type { AdminUserListItem } from '@/types/users'

interface DeactivateUserModalProps {
  open: boolean
  user: AdminUserListItem | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeactivateUserModal({
  open,
  user,
  isSubmitting,
  onClose,
  onConfirm,
}: DeactivateUserModalProps) {
  if (!open || !user) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Deactivate User</h2>
        <p className="mt-2 text-sm text-slate-700">
          You are about to deactivate <span className="font-medium">{user.name}</span>. This keeps
          the record but blocks access to protected app features.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          This action can only be reversed in the database.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              void onConfirm()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deactivating...' : 'Confirm Deactivation'}
          </Button>
        </div>
      </div>
    </div>
  )
}
