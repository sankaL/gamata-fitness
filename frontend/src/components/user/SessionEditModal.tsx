import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SessionHistoryItem } from '@/types/progress'
import type { SessionLogPayload } from '@/types/sessions'

interface EditableLog {
  id: string
  sets: number | null
  reps: number | null
  weight: number | null
  duration: number | null
  notes: string
}

interface SessionEditModalProps {
  open: boolean
  session: SessionHistoryItem | null
  isSaving: boolean
  onClose: () => void
  onSave: (sessionId: string, logs: SessionLogPayload[]) => void
}

function toNumber(value: string): number | null {
  if (!value.trim()) {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function SessionEditModal({
  open,
  session,
  isSaving,
  onClose,
  onSave,
}: SessionEditModalProps) {
  const [logs, setLogs] = useState<EditableLog[]>(
    session
      ? session.logs.map((log) => ({
          id: log.id,
          sets: log.sets,
          reps: log.reps,
          weight: log.weight ? Number(log.weight) : null,
          duration: log.duration,
          notes: log.notes ?? '',
        }))
      : [],
  )

  if (!open || !session) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 md:items-center">
      <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white p-4 shadow-xl md:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edit Session</h2>
            <p className="text-sm text-slate-600">{session.workout_name}</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-5"
            >
              <Input
                type="number"
                value={log.sets ?? ''}
                placeholder="Sets"
                onChange={(event) =>
                  setLogs((current) =>
                    current.map((row) =>
                      row.id === log.id ? { ...row, sets: toNumber(event.target.value) } : row,
                    ),
                  )
                }
              />
              <Input
                type="number"
                value={log.reps ?? ''}
                placeholder="Reps"
                onChange={(event) =>
                  setLogs((current) =>
                    current.map((row) =>
                      row.id === log.id ? { ...row, reps: toNumber(event.target.value) } : row,
                    ),
                  )
                }
              />
              <Input
                type="number"
                value={log.weight ?? ''}
                placeholder="Weight"
                onChange={(event) =>
                  setLogs((current) =>
                    current.map((row) =>
                      row.id === log.id ? { ...row, weight: toNumber(event.target.value) } : row,
                    ),
                  )
                }
              />
              <Input
                type="number"
                value={log.duration ?? ''}
                placeholder="Duration"
                onChange={(event) =>
                  setLogs((current) =>
                    current.map((row) =>
                      row.id === log.id ? { ...row, duration: toNumber(event.target.value) } : row,
                    ),
                  )
                }
              />
              <Input
                value={log.notes}
                placeholder={`Notes ${index + 1}`}
                onChange={(event) =>
                  setLogs((current) =>
                    current.map((row) =>
                      row.id === log.id ? { ...row, notes: event.target.value } : row,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={isSaving}
            onClick={() =>
              onSave(
                session.id,
                logs.map((log) => ({
                  id: log.id,
                  sets: log.sets,
                  reps: log.reps,
                  weight: log.weight,
                  duration: log.duration,
                  notes: log.notes,
                })),
              )
            }
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
