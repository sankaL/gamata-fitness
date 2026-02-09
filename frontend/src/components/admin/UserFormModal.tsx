import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UserRole } from '@/types/auth'
import type { AdminUserListItem, UserCreatePayload, UserUpdatePayload } from '@/types/users'

type UserFormMode = 'create' | 'edit'

interface UserFormModalProps {
  open: boolean
  mode: UserFormMode
  user: AdminUserListItem | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: UserCreatePayload | UserUpdatePayload) => Promise<void>
}

interface FormState {
  name: string
  email: string
  role: UserRole
  password: string
}

const defaultState: FormState = {
  name: '',
  email: '',
  role: 'user',
  password: '',
}

function getInitialFormState(mode: UserFormMode, user: AdminUserListItem | null): FormState {
  if (mode === 'edit' && user) {
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    }
  }
  return defaultState
}

function validateForm(mode: UserFormMode, state: FormState): string | null {
  if (!state.name.trim()) {
    return 'Name is required.'
  }
  if (!state.email.trim() || !state.email.includes('@')) {
    return 'A valid email is required.'
  }
  if (mode === 'create' && state.password.length < 8) {
    return 'Password must be at least 8 characters.'
  }
  return null
}

export function UserFormModal({
  open,
  mode,
  user,
  isSubmitting,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => getInitialFormState(mode, user))
  const [error, setError] = useState<string | null>(null)

  const title = useMemo(() => (mode === 'create' ? 'Create User' : 'Edit User'), [mode])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'create'
            ? 'Create a new user account with a role.'
            : 'Update the selected user profile details.'}
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setError(null)

            const validationError = validateForm(mode, formState)
            if (validationError) {
              setError(validationError)
              return
            }

            const basePayload = {
              name: formState.name.trim(),
              email: formState.email.trim(),
              role: formState.role,
            }

            if (mode === 'create') {
              await onSubmit({
                ...basePayload,
                password: formState.password,
              })
              return
            }

            await onSubmit(basePayload)
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="user-name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <Input
              id="user-name"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="user-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="user-email"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="user-role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="user-role"
              value={formState.role}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  role: event.target.value as UserRole,
                }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="user">User</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {mode === 'create' ? (
            <div className="space-y-1.5">
              <label htmlFor="user-password" className="text-sm font-medium text-slate-700">
                Temporary Password
              </label>
              <Input
                id="user-password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, password: event.target.value }))
                }
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
