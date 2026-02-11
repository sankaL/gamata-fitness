export type PlanAssignmentStatus = 'pending' | 'active' | 'inactive'

export interface ActivePlanSummary {
  assignment_id: string
  plan_id: string
  plan_name: string
  activated_at: string | null
}

export interface PendingPlanAssignment {
  assignment_id: string
  plan_id: string
  plan_name: string
  coach_id: string
  coach_name: string
  start_date: string
  end_date: string
  total_days: number
  total_workouts: number
  assigned_at: string
  plan_is_archived: boolean
}

export interface UserPendingPlansResponse {
  active_plan: ActivePlanSummary | null
  pending_assignments: PendingPlanAssignment[]
}

export interface PlanAssignmentActionResponse {
  assignment_id: string
  plan_id: string
  status: PlanAssignmentStatus
  activated_at: string | null
  deactivated_at: string | null
  deactivated_assignment_ids: string[]
}
