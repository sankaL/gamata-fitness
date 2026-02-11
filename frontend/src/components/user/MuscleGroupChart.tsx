import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MuscleGroupProgressItem } from '@/types/progress'

interface MuscleGroupChartProps {
  items: MuscleGroupProgressItem[]
  isLoading: boolean
}

export function MuscleGroupChart({ items, isLoading }: MuscleGroupChartProps) {
  return (
    <Card className="border-slate-300 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">Muscle Group Volume</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <p className="text-sm text-slate-600">Loading chart...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-600">No data for selected range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="muscle_group_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_volume" fill="#0f172a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
