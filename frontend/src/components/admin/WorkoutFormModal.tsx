import { useMemo, useState } from 'react'

import { MuscleGroupMultiSelect } from '@/components/admin/MuscleGroupMultiSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  CardioType,
  MuscleGroup,
  MuscleGroupCreatePayload,
  Workout,
  WorkoutCreatePayload,
  WorkoutType,
  WorkoutUpdatePayload,
} from '@/types/workouts'

type WorkoutFormMode = 'create' | 'edit'

interface WorkoutFormModalProps {
  open: boolean
  mode: WorkoutFormMode
  workout: Workout | null
  muscleGroups: MuscleGroup[]
  cardioTypes: CardioType[]
  isSubmitting: boolean
  isCreatingMuscleGroup: boolean
  onClose: () => void
  onSubmit: (payload: WorkoutCreatePayload | WorkoutUpdatePayload) => Promise<void>
  onCreateMuscleGroup: (payload: MuscleGroupCreatePayload) => Promise<void>
}

interface FormState {
  name: string
  description: string
  instructions: string
  type: WorkoutType
  cardio_type_id: string
  target_sets: string
  target_reps: string
  suggested_weight: string
  target_duration: string
  difficulty_level: 'easy' | 'medium' | 'hard'
  muscle_group_ids: string[]
}

const defaultState: FormState = {
  name: '',
  description: '',
  instructions: '',
  type: 'strength',
  cardio_type_id: '',
  target_sets: '3',
  target_reps: '10',
  suggested_weight: '',
  target_duration: '20',
  difficulty_level: 'medium',
  muscle_group_ids: [],
}

function stateFromWorkout(workout: Workout | null): FormState {
  if (!workout) {
    return defaultState
  }

  return {
    name: workout.name,
    description: workout.description ?? '',
    instructions: workout.instructions ?? '',
    type: workout.type,
    cardio_type_id: workout.cardio_type_id ?? '',
    target_sets: workout.target_sets ? String(workout.target_sets) : '',
    target_reps: workout.target_reps ? String(workout.target_reps) : '',
    suggested_weight: workout.suggested_weight ?? '',
    target_duration: workout.target_duration ? String(workout.target_duration) : '',
    difficulty_level: workout.difficulty_level ?? 'medium',
    muscle_group_ids: workout.muscle_groups.map((group) => group.id),
  }
}

export function WorkoutFormModal({
  open,
  mode,
  workout,
  muscleGroups,
  cardioTypes,
  isSubmitting,
  isCreatingMuscleGroup,
  onClose,
  onSubmit,
  onCreateMuscleGroup,
}: WorkoutFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => stateFromWorkout(workout))
  const [error, setError] = useState<string | null>(null)
  const [newMuscleName, setNewMuscleName] = useState('')
  const [newMuscleIcon, setNewMuscleIcon] = useState('custom')

  const title = useMemo(() => (mode === 'create' ? 'Create Workout' : 'Edit Workout'), [mode])

  if (!open) {
    return null
  }

  async function submitForm() {
    setError(null)

    if (!formState.name.trim()) {
      setError('Workout name is required.')
      return
    }
    if (formState.muscle_group_ids.length === 0) {
      setError('Select at least one muscle group.')
      return
    }

    const basePayload = {
      name: formState.name.trim(),
      description: formState.description.trim() || null,
      instructions: formState.instructions.trim() || null,
      type: formState.type,
      muscle_group_ids: formState.muscle_group_ids,
    }

    if (formState.type === 'strength') {
      const targetSets = Number(formState.target_sets)
      const targetReps = Number(formState.target_reps)
      if (!targetSets || !targetReps) {
        setError('Strength workouts require target sets and target reps.')
        return
      }

      const payload: WorkoutCreatePayload | WorkoutUpdatePayload = {
        ...basePayload,
        cardio_type_id: null,
        target_duration: null,
        difficulty_level: null,
        target_sets: targetSets,
        target_reps: targetReps,
        suggested_weight: formState.suggested_weight ? Number(formState.suggested_weight) : null,
      }
      await onSubmit(payload)
      return
    }

    const targetDuration = Number(formState.target_duration)
    if (!formState.cardio_type_id || !targetDuration) {
      setError('Cardio workouts require cardio type and target duration.')
      return
    }

    const cardioPayload: WorkoutCreatePayload | WorkoutUpdatePayload = {
      ...basePayload,
      cardio_type_id: formState.cardio_type_id,
      target_duration: targetDuration,
      difficulty_level: formState.difficulty_level,
      target_sets: null,
      target_reps: null,
      suggested_weight: null,
    }
    await onSubmit(cardioPayload)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-300 bg-white p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Configure workout details and target parameters.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <Input
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select
              value={formState.type}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  type: event.target.value as WorkoutType,
                }))
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Muscle Groups</label>
            <MuscleGroupMultiSelect
              options={muscleGroups}
              selectedIds={formState.muscle_group_ids}
              onChange={(nextIds) =>
                setFormState((current) => ({ ...current, muscle_group_ids: nextIds }))
              }
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={formState.description}
              rows={2}
              onChange={(event) =>
                setFormState((current) => ({ ...current, description: event.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Instructions</label>
            <textarea
              value={formState.instructions}
              rows={3}
              onChange={(event) =>
                setFormState((current) => ({ ...current, instructions: event.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {formState.type === 'strength' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Target Sets</label>
                <Input
                  type="number"
                  min={1}
                  value={formState.target_sets}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, target_sets: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Target Reps</label>
                <Input
                  type="number"
                  min={1}
                  value={formState.target_reps}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, target_reps: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Suggested Weight (optional)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.25"
                  value={formState.suggested_weight}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      suggested_weight: event.target.value,
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Cardio Type</label>
                <select
                  value={formState.cardio_type_id}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, cardio_type_id: event.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select cardio type</option>
                  {cardioTypes.map((cardio) => (
                    <option key={cardio.id} value={cardio.id}>
                      {cardio.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Target Duration (minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formState.target_duration}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, target_duration: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Difficulty</label>
                <select
                  value={formState.difficulty_level}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      difficulty_level: event.target.value as 'easy' | 'medium' | 'hard',
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 space-y-2 rounded-md border border-slate-200 p-3">
          <p className="text-sm font-medium text-slate-700">Add Custom Muscle Group</p>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="Name"
              value={newMuscleName}
              onChange={(event) => setNewMuscleName(event.target.value)}
            />
            <Input
              placeholder="Icon key"
              value={newMuscleIcon}
              onChange={(event) => setNewMuscleIcon(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isCreatingMuscleGroup}
              onClick={async () => {
                if (!newMuscleName.trim() || !newMuscleIcon.trim()) {
                  return
                }
                await onCreateMuscleGroup({
                  name: newMuscleName.trim(),
                  icon: newMuscleIcon.trim(),
                })
                setNewMuscleName('')
              }}
            >
              {isCreatingMuscleGroup ? 'Adding...' : 'Add Group'}
            </Button>
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void submitForm()
            }}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Workout' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
