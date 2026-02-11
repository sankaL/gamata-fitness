import type { MuscleGroup } from '@/types/workouts'

interface MuscleGroupMultiSelectProps {
  options: MuscleGroup[]
  selectedIds: string[]
  onChange: (nextIds: string[]) => void
  disabled?: boolean
}

export function MuscleGroupMultiSelect({
  options,
  selectedIds,
  onChange,
  disabled = false,
}: MuscleGroupMultiSelectProps) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 p-2">
      <ul className="space-y-1">
        {options.map((group) => {
          const isChecked = selectedIds.includes(group.id)
          return (
            <li key={group.id}>
              <label className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50">
                <span className="truncate text-sm text-slate-700">{group.name}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => {
                    if (isChecked) {
                      onChange(selectedIds.filter((id) => id !== group.id))
                    } else {
                      onChange([...selectedIds, group.id])
                    }
                  }}
                />
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
