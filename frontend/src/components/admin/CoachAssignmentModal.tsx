import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { AdminUserDetail, AdminUserListItem } from '@/types/users'

interface CoachAssignmentModalProps {
  open: boolean
  user: AdminUserDetail | null
  coachOptions: AdminUserListItem[]
  isAssigning: boolean
  isRemoving: boolean
  onClose: () => void
  onAssign: (coachIds: string[]) => Promise<void>
  onRemove: (coachId: string) => Promise<void>
}

export function CoachAssignmentModal({
  open,
  user,
  coachOptions,
  isAssigning,
  isRemoving,
  onClose,
  onAssign,
  onRemove,
}: CoachAssignmentModalProps) {
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([])

  if (!open || !user) {
    return null
  }

  const assignedCoachIdSet = new Set(user.coaches.map((coach) => coach.id))
  const assignableCoaches = coachOptions.filter((coach) => !assignedCoachIdSet.has(coach.id))

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">Coach Assignments</h2>
        <p className="mt-1 text-sm text-slate-600">
          Manage coach relationships for <span className="font-medium">{user.name}</span>.
        </p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Assigned Coaches</h3>
            {user.coaches.length === 0 ? (
              <p className="text-sm text-slate-500">No coaches assigned.</p>
            ) : (
              <ul className="space-y-2">
                {user.coaches.map((coach) => (
                  <li
                    key={coach.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{coach.name}</p>
                      <p className="truncate text-xs text-slate-600">{coach.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void onRemove(coach.id)
                      }}
                      disabled={isRemoving}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Assign Coaches</h3>
            {assignableCoaches.length === 0 ? (
              <p className="text-sm text-slate-500">No available coaches to assign.</p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {assignableCoaches.map((coach) => {
                  const isChecked = selectedCoachIds.includes(coach.id)
                  return (
                    <li key={coach.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setSelectedCoachIds((current) => [...current, coach.id])
                              return
                            }
                            setSelectedCoachIds((current) =>
                              current.filter((coachId) => coachId !== coach.id),
                            )
                          }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-800">
                            {coach.name}
                          </span>
                          <span className="block truncate text-xs text-slate-600">
                            {coach.email}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}

            <Button
              className="w-full"
              onClick={() => {
                void onAssign(selectedCoachIds)
              }}
              disabled={isAssigning || selectedCoachIds.length === 0}
            >
              {isAssigning ? 'Assigning...' : 'Assign Selected Coaches'}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} disabled={isAssigning || isRemoving}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
