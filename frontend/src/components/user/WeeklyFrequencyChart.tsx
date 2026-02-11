import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FrequencyBucket } from '@/types/progress'

interface WeeklyFrequencyChartProps {
  buckets: FrequencyBucket[]
  isLoading: boolean
}

export function WeeklyFrequencyChart({ buckets, isLoading }: WeeklyFrequencyChartProps) {
  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Weekly Frequency</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <p className="text-sm text-slate-600">Loading chart...</p>
        ) : buckets.length === 0 ? (
          <p className="text-sm text-slate-600">No data for selected range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="session_count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
