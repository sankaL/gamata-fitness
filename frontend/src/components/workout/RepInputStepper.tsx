import { Button } from '@/components/ui/button'

interface RepInputStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
}

export function RepInputStepper({ value, min = 0, max = 100, onChange }: RepInputStepperProps) {
  function clamp(next: number): number {
    return Math.max(min, Math.min(max, next))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-14 w-14"
          onClick={() => onChange(clamp(value - 1))}
        >
          -
        </Button>
        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
          <p className="text-xs text-slate-500">Reps</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-14 w-14"
          onClick={() => onChange(clamp(value + 1))}
        >
          +
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[8, 10, 12].map((quickValue) => (
          <Button
            key={quickValue}
            type="button"
            variant="outline"
            onClick={() => onChange(quickValue)}
          >
            {quickValue}
          </Button>
        ))}
      </div>
    </div>
  )
}
