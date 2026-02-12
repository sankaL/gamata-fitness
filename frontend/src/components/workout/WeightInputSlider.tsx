import { Button } from '@/components/ui/button'

interface WeightInputSliderProps {
  value: number
  min?: number
  max?: number
  step?: number
  presets?: number[]
  onChange: (next: number) => void
}

export function WeightInputSlider({
  value,
  min = 0,
  max = 500,
  step = 2.5,
  presets = [20, 40, 60],
  onChange,
}: WeightInputSliderProps) {
  function clamp(nextValue: number): number {
    return Math.max(min, Math.min(max, nextValue))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-14 w-14"
          onClick={() => onChange(clamp(value - step))}
        >
          -
        </Button>
        <div className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Weight</p>
          <p className="text-2xl font-semibold text-foreground">{value.toFixed(1)} kg</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-14 w-14"
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </Button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="h-3 w-full accent-primary"
      />
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant="outline"
            onClick={() => onChange(clamp(preset))}
          >
            {preset} kg
          </Button>
        ))}
      </div>
    </div>
  )
}
