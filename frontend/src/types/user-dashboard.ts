import type { WorkoutType } from '@/types/workouts'

export interface DashboardMuscleGroup {
  id: string
  name: string
  icon: string
}

export interface DashboardWorkoutSummary {
  id: string
  name: string
  type: WorkoutType
  muscle_groups: DashboardMuscleGroup[]
}

export interface UserTodayWorkoutResponse {
  date: string
  day_of_week: number
  plan_id: string | null
  plan_name: string | null
  workouts: DashboardWorkoutSummary[]
  completed_sessions_today: number
}

export interface UserWeekPlanDay {
  date: string
  day_of_week: number
  workouts: DashboardWorkoutSummary[]
}

export interface UserWeekPlanResponse {
  week_start: string
  week_end: string
  plan_id: string | null
  plan_name: string | null
  days: UserWeekPlanDay[]
}

export interface UserQuickStatsResponse {
  sessions_this_week: number
  current_streak_days: number
  completed_today: number
  total_completed_sessions: number
}

export interface UserCoach {
  id: string
  name: string
  email: string
}

export interface UserCoachesResponse {
  coaches: UserCoach[]
}
