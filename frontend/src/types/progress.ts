export type WorkoutType = 'strength' | 'cardio'
export type SessionType = 'assigned' | 'swap' | 'adhoc'
export type FrequencyPeriod = 'weekly' | 'monthly'

export interface SessionHistoryLog {
  id: string
  sets: number | null
  reps: number | null
  weight: string | null
  duration: number | null
  notes: string | null
  logged_at: string
  updated_at: string
}

export interface SessionHistoryItem {
  id: string
  workout_id: string
  workout_name: string
  workout_type: WorkoutType
  session_type: SessionType
  plan_id: string | null
  completed_at: string | null
  updated_at: string
  muscle_groups: string[]
  total_logs: number
  total_sets: number
  total_reps: number
  total_duration: number
  total_volume: number
  max_weight: string | null
  logs: SessionHistoryLog[]
}

export interface PaginatedUserSessionsResponse {
  items: SessionHistoryItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface UserSessionHistoryQueryParams {
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
  workout_type?: WorkoutType
  muscle_group_id?: string
}

export interface MuscleGroupProgressItem {
  muscle_group_id: string
  muscle_group_name: string
  total_volume: number
  total_duration: number
  total_sessions: number
}

export interface MuscleGroupProgressResponse {
  start_date: string
  end_date: string
  items: MuscleGroupProgressItem[]
}

export interface FrequencyBucket {
  label: string
  start_date: string
  end_date: string
  session_count: number
}

export interface FrequencyProgressResponse {
  period: FrequencyPeriod
  start_date: string
  end_date: string
  total_sessions: number
  buckets: FrequencyBucket[]
}

export interface ProgressDateRangeQueryParams {
  start_date?: string
  end_date?: string
}

export interface FrequencyProgressQueryParams extends ProgressDateRangeQueryParams {
  period?: FrequencyPeriod
}
