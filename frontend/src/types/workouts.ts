export type WorkoutType = 'strength' | 'cardio'
export type CardioDifficultyLevel = 'easy' | 'medium' | 'hard'

export interface MuscleGroup {
  id: string
  name: string
  icon: string
  is_default: boolean
  created_at: string
}

export interface CardioType {
  id: string
  name: string
  description: string
}

export interface Workout {
  id: string
  name: string
  description: string | null
  instructions: string | null
  type: WorkoutType
  cardio_type_id: string | null
  cardio_type: CardioType | null
  target_sets: number | null
  target_reps: number | null
  suggested_weight: string | null
  target_duration: number | null
  difficulty_level: CardioDifficultyLevel | null
  is_archived: boolean
  created_at: string
  updated_at: string
  muscle_groups: MuscleGroup[]
}

export interface PaginatedWorkoutsResponse {
  items: Workout[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface WorkoutListQueryParams {
  page?: number
  page_size?: number
  type?: WorkoutType
  muscle_group_id?: string
  is_archived?: boolean
  search?: string
}

export interface WorkoutCreatePayload {
  name: string
  description?: string | null
  instructions?: string | null
  type: WorkoutType
  cardio_type_id?: string | null
  target_sets?: number | null
  target_reps?: number | null
  suggested_weight?: number | null
  target_duration?: number | null
  difficulty_level?: CardioDifficultyLevel | null
  muscle_group_ids: string[]
}

export interface WorkoutUpdatePayload {
  name?: string
  description?: string | null
  instructions?: string | null
  type?: WorkoutType
  cardio_type_id?: string | null
  target_sets?: number | null
  target_reps?: number | null
  suggested_weight?: number | null
  target_duration?: number | null
  difficulty_level?: CardioDifficultyLevel | null
  muscle_group_ids?: string[]
}

export interface WorkoutArchiveResponse {
  workout: Workout
  active_plan_count: number
}

export interface MuscleGroupCreatePayload {
  name: string
  icon: string
}
