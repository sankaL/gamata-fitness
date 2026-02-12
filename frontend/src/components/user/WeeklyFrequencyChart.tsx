import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FrequencyBucket } from '@/types/progress'

interface WeeklyFrequencyChartProps {
  buckets: FrequencyBucket[]
  isLoading: boolean
}

export function WeeklyFrequencyChart({ buckets, isLoading }: WeeklyFrequencyChartProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Weekly Frequency</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        ) : buckets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for selected range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
              <XAxis
                dataKey="label"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
                tick={{ fill: 'hsl(0, 0%, 60%)' }}
              />
              <YAxis allowDecimals={false} tick={{ fill: 'hsl(0, 0%, 60%)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 11%)',
                  border: '1px solid hsl(0, 0%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(0, 0%, 90%)',
                }}
              />
              <Bar dataKey="session_count" fill="hsl(14, 100%, 55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
