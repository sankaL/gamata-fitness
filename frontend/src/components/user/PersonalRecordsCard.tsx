import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SessionHistoryItem } from '@/types/progress'

interface PersonalRecordsCardProps {
  sessions: SessionHistoryItem[]
}

interface PersonalRecord {
  workoutName: string
  maxWeight: number
}

export function PersonalRecordsCard({ sessions }: PersonalRecordsCardProps) {
  const recordMap = new Map<string, number>()

  sessions.forEach((session) => {
    const sessionMaxWeight = session.max_weight ? Number(session.max_weight) : 0
    if (!sessionMaxWeight) {
      return
    }
    const current = recordMap.get(session.workout_name) ?? 0
    if (sessionMaxWeight > current) {
      recordMap.set(session.workout_name, sessionMaxWeight)
    }
  })

  const records: PersonalRecord[] = Array.from(recordMap.entries())
    .map(([workoutName, maxWeight]) => ({
      workoutName,
      maxWeight,
    }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 6)

  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Max Weight Records</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-slate-600">No weight PRs logged yet.</p>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.workoutName}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-800">{record.workoutName}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {record.maxWeight.toFixed(1)} kg
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
