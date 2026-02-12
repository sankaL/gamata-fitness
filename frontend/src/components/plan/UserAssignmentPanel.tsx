import { Button } from '@/components/ui/button'
import type { CoachRosterUser } from '@/types/plans'

interface UserAssignmentPanelProps {
  users: CoachRosterUser[]
  selectedUserIds: string[]
  isAssigning: boolean
  isDisabled?: boolean
  onChange: (nextUserIds: string[]) => void
  onAssign: () => Promise<void>
}

export function UserAssignmentPanel({
  users,
  selectedUserIds,
  isAssigning,
  isDisabled = false,
  onChange,
  onAssign,
}: UserAssignmentPanelProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Assign Plan</h2>
          <p className="text-sm text-muted-foreground">
            Select athletes from your roster and assign the selected plan.
          </p>
        </div>
        <Button
          type="button"
          disabled={isDisabled || isAssigning || selectedUserIds.length === 0}
          onClick={() => {
            void onAssign()
          }}
        >
          {isAssigning ? 'Assigning...' : `Assign to ${selectedUserIds.length} Athlete(s)`}
        </Button>
      </div>

      <div className="mt-4 max-h-64 overflow-y-auto rounded-md border border-border p-2">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned athletes found.</p>
        ) : null}

        <ul className="space-y-1">
          {users.map((user) => {
            const isChecked = selectedUserIds.includes(user.user_id)
            return (
              <li key={user.user_id}>
                <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-secondary">
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.user_name}</p>
                    <p className="text-xs text-muted-foreground">{user.user_email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        onChange(selectedUserIds.filter((id) => id !== user.user_id))
                      } else {
                        onChange([...selectedUserIds, user.user_id])
                      }
                    }}
                  />
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
