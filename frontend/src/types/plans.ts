export type PlanAssignmentStatus = 'pending' | 'active' | 'inactive'

export interface PlanWorkoutSummary {
  id: string
  name: string
  type: 'strength' | 'cardio'
  is_archived: boolean
}

export interface PlanDay {
  day_of_week: number
  workouts: PlanWorkoutSummary[]
}

export interface PlanListItem {
  id: string
  name: string
  coach_id: string
  start_date: string
  end_date: string
  is_archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  total_days: number
  total_workouts: number
}

export interface PlanDetail {
  id: string
  name: string
  coach_id: string
  start_date: string
  end_date: string
  is_archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  days: PlanDay[]
}

export interface PaginatedPlansResponse {
  items: PlanListItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface PlanListQueryParams {
  page?: number
  page_size?: number
  is_archived?: boolean
  search?: string
}

export interface PlanDayInput {
  day_of_week: number
  workout_ids: string[]
}

export interface PlanCreatePayload {
  name: string
  start_date: string
  end_date: string
  days: PlanDayInput[]
}

export interface PlanUpdatePayload {
  name?: string
  start_date?: string
  end_date?: string
  days?: PlanDayInput[]
}

export interface PlanAssignPayload {
  user_ids: string[]
}

export interface PlanAssignmentResponseItem {
  assignment_id: string
  user_id: string
  status: PlanAssignmentStatus
  assigned_at: string
  activated_at: string | null
  deactivated_at: string | null
}

export interface PlanAssignResponse {
  plan_id: string
  assignments: PlanAssignmentResponseItem[]
}

export interface PlanUserStatus {
  user_id: string
  user_name: string
  user_email: string
  status: PlanAssignmentStatus
  assigned_at: string
  activated_at: string | null
  deactivated_at: string | null
  weekly_completion_percent: number
}

export interface PlanUsersResponse {
  plan_id: string
  users: PlanUserStatus[]
}

export interface CoachRosterUser {
  user_id: string
  user_name: string
  user_email: string
  active_plan_id: string | null
  active_plan_name: string | null
  active_plan_status: PlanAssignmentStatus | null
  pending_plan_count: number
  weekly_completion_percent: number
}

export interface CoachRosterResponse {
  coach_id: string
  users: CoachRosterUser[]
}
