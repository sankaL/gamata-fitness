import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MuscleGroupProgressItem } from '@/types/progress'

interface MuscleGroupChartProps {
  items: MuscleGroupProgressItem[]
  isLoading: boolean
}

export function MuscleGroupChart({ items, isLoading }: MuscleGroupChartProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Muscle Group Volume</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for selected range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" />
              <XAxis dataKey="muscle_group_name" tick={{ fill: 'hsl(0, 0%, 60%)' }} />
              <YAxis tick={{ fill: 'hsl(0, 0%, 60%)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 11%)',
                  border: '1px solid hsl(0, 0%, 18%)',
                  borderRadius: '8px',
                  color: 'hsl(0, 0%, 90%)',
                }}
              />
              <Bar dataKey="total_volume" fill="hsl(14, 100%, 55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
