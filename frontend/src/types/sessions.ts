import type { SessionType, WorkoutType } from '@/types/progress'

export interface SessionWorkoutMuscleGroup {
  id: string
  name: string
  icon: string
}

export interface SessionWorkoutSummary {
  id: string
  name: string
  type: WorkoutType
  target_sets: number | null
  target_reps: number | null
  suggested_weight: string | null
  target_duration: number | null
  muscle_groups: SessionWorkoutMuscleGroup[]
}

export interface SessionLog {
  id: string
  sets: number | null
  reps: number | null
  weight: string | null
  duration: number | null
  notes: string | null
  logged_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  workout_id: string
  plan_id: string | null
  session_type: SessionType
  completed_at: string | null
  updated_at: string
  workout: SessionWorkoutSummary
  logs: SessionLog[]
}

export interface SessionCreatePayload {
  workout_id: string
  plan_id?: string | null
  session_type?: SessionType
}

export interface SessionLogPayload {
  id?: string
  sets?: number | null
  reps?: number | null
  weight?: number | null
  duration?: number | null
  notes?: string | null
}

export interface SessionUpdatePayload {
  logs: SessionLogPayload[]
}

export interface SessionLogCreatePayload {
  sets?: number | null
  reps?: number | null
  weight?: number | null
  duration?: number | null
  notes?: string | null
}

export interface SessionLogUpdatePayload {
  sets?: number | null
  reps?: number | null
  weight?: number | null
  duration?: number | null
  notes?: string | null
}
