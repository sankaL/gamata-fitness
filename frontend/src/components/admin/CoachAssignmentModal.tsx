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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-foreground">Coach Assignments</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage coach relationships for <span className="font-medium">{user.name}</span>.
        </p>

        <div className="mt-4 grid gap-5">
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Assigned Coaches</h3>
            {user.coaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coaches assigned.</p>
            ) : (
              <ul className="space-y-2">
                {user.coaches.map((coach) => (
                  <li
                    key={coach.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{coach.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{coach.email}</p>
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

          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Assign Coaches</h3>
            {assignableCoaches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available coaches to assign.</p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {assignableCoaches.map((coach) => {
                  const isChecked = selectedCoachIds.includes(coach.id)
                  return (
                    <li key={coach.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/80">
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
                          <span className="block truncate font-medium text-foreground">
                            {coach.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
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
