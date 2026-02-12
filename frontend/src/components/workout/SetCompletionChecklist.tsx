import { Button } from '@/components/ui/button'

interface SetCompletionChecklistProps {
  targetSets: number
  completedSets: number
  onChange: (next: number) => void
}

export function SetCompletionChecklist({
  targetSets,
  completedSets,
  onChange,
}: SetCompletionChecklistProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Set Completion</p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: targetSets }).map((_, index) => {
          const setNumber = index + 1
          const isCompleted = completedSets >= setNumber
          return (
            <Button
              key={setNumber}
              type="button"
              variant={isCompleted ? 'default' : 'outline'}
              className="h-14 min-w-14"
              onClick={() => onChange(isCompleted ? setNumber - 1 : setNumber)}
            >
              {setNumber}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
