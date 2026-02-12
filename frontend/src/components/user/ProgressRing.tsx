interface ProgressRingProps {
  completed: number
  total: number
}

export function ProgressRing({ completed, total }: ProgressRingProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const radius = 44
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="rounded-xl bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 flex-shrink-0">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth={stroke}
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
            {pct}%
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Progress this week</p>
          <p className="text-2xl font-bold text-foreground">
            {completed}
            <span className="text-base text-muted-foreground">/{total}</span>
          </p>
          <p className="text-xs text-muted-foreground">workouts completed</p>
        </div>
      </div>
    </div>
  )
}
