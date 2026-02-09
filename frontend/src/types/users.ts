import type { UserRole } from '@/types/auth'

export interface CoachSummary {
  id: string
  name: string
  email: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  deactivated_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminUserListItem extends AdminUser {
  coach_count: number
}

export interface AdminUserDetail extends AdminUser {
  coaches: CoachSummary[]
}

export interface PaginatedUsersResponse {
  items: AdminUserListItem[]
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface UserCreatePayload {
  name: string
  email: string
  role: UserRole
  password: string
}

export interface UserUpdatePayload {
  name?: string
  email?: string
  role?: UserRole
}

export interface CoachAssignmentPayload {
  coach_ids: string[]
}

export interface CoachAssignmentResponse {
  user_id: string
  coaches: CoachSummary[]
}

export interface UserListQueryParams {
  page?: number
  page_size?: number
  role?: UserRole
  search?: string
  is_active?: boolean
}

export interface AdminOverview {
  total_users: number
  total_coaches: number
  total_workouts: number
  active_users: number
  inactive_users: number
}
