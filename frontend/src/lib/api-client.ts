import { appConfig } from '@/lib/runtime-config'
import type {
  AuthResponse,
  LoginPayload,
  MessageResponse,
  PasswordResetPayload,
  PasswordUpdatePayload,
  RegisterPayload,
  UserProfile,
} from '@/types/auth'
import type {
  AdminUser,
  AdminOverview,
  AdminUserDetail,
  CoachAssignmentPayload,
  CoachAssignmentResponse,
  PaginatedUsersResponse,
  UserCreatePayload,
  UserListQueryParams,
  UserUpdatePayload,
} from '@/types/users'
import type {
  CardioType,
  MuscleGroup,
  MuscleGroupCreatePayload,
  PaginatedWorkoutsResponse,
  Workout,
  WorkoutArchiveResponse,
  WorkoutCreatePayload,
  WorkoutListQueryParams,
  WorkoutUpdatePayload,
} from '@/types/workouts'
import type {
  CoachRosterResponse,
  PaginatedPlansResponse,
  PlanAssignPayload,
  PlanAssignResponse,
  PlanCreatePayload,
  PlanDetail,
  PlanListQueryParams,
  PlanUpdatePayload,
  PlanUsersResponse,
} from '@/types/plans'

export interface HealthResponse {
  status: 'ok'
}

interface ApiErrorPayload {
  detail?: string
  message?: string
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }
    searchParams.set(key, String(value))
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`
    try {
      const payload = (await response.json()) as ApiErrorPayload
      if (payload.detail) {
        errorDetail = payload.detail
      } else if (payload.message) {
        errorDetail = payload.message
      }
    } catch {
      // Keep default error detail when error body is not JSON.
    }
    throw new Error(errorDetail)
  }

  return (await response.json()) as T
}

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health', { method: 'GET' })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  return request<UserProfile>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function sendPasswordReset(payload: PasswordResetPayload): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function submitPasswordUpdate(
  token: string,
  payload: PasswordUpdatePayload,
): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/password-update', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function getAdminOverview(token: string): Promise<AdminOverview> {
  return request<AdminOverview>('/users/overview', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getUsers(
  token: string,
  params: UserListQueryParams,
): Promise<PaginatedUsersResponse> {
  const queryString = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    role: params.role,
    search: params.search,
    is_active: params.is_active,
  })

  return request<PaginatedUsersResponse>(`/users${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getUserById(token: string, userId: string): Promise<AdminUserDetail> {
  return request<AdminUserDetail>(`/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createUser(token: string, payload: UserCreatePayload): Promise<AdminUser> {
  return request<AdminUser>('/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateUser(
  token: string,
  userId: string,
  payload: UserUpdatePayload,
): Promise<AdminUser> {
  return request<AdminUser>(`/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function deactivateUser(token: string, userId: string): Promise<AdminUser> {
  return request<AdminUser>(`/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function assignCoaches(
  token: string,
  userId: string,
  payload: CoachAssignmentPayload,
): Promise<CoachAssignmentResponse> {
  return request<CoachAssignmentResponse>(`/users/${userId}/coaches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function removeCoachAssignment(
  token: string,
  userId: string,
  coachId: string,
): Promise<CoachAssignmentResponse> {
  return request<CoachAssignmentResponse>(`/users/${userId}/coaches/${coachId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getWorkouts(
  token: string,
  params: WorkoutListQueryParams,
): Promise<PaginatedWorkoutsResponse> {
  const queryString = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    type: params.type,
    muscle_group_id: params.muscle_group_id,
    is_archived: params.is_archived,
    search: params.search,
  })

  return request<PaginatedWorkoutsResponse>(`/workouts${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getWorkoutById(token: string, workoutId: string): Promise<Workout> {
  return request<Workout>(`/workouts/${workoutId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createWorkout(
  token: string,
  payload: WorkoutCreatePayload,
): Promise<Workout> {
  return request<Workout>('/workouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updateWorkout(
  token: string,
  workoutId: string,
  payload: WorkoutUpdatePayload,
): Promise<Workout> {
  return request<Workout>(`/workouts/${workoutId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function archiveWorkout(
  token: string,
  workoutId: string,
): Promise<WorkoutArchiveResponse> {
  return request<WorkoutArchiveResponse>(`/workouts/${workoutId}/archive`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function unarchiveWorkout(token: string, workoutId: string): Promise<Workout> {
  return request<Workout>(`/workouts/${workoutId}/unarchive`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getMuscleGroups(token: string): Promise<MuscleGroup[]> {
  return request<MuscleGroup[]>('/muscle-groups', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createMuscleGroup(
  token: string,
  payload: MuscleGroupCreatePayload,
): Promise<MuscleGroup> {
  return request<MuscleGroup>('/muscle-groups', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function getCardioTypes(token: string): Promise<CardioType[]> {
  return request<CardioType[]>('/cardio-types', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getPlans(
  token: string,
  params: PlanListQueryParams,
): Promise<PaginatedPlansResponse> {
  const queryString = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    is_archived: params.is_archived,
    search: params.search,
  })

  return request<PaginatedPlansResponse>(`/plans${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getPlanById(token: string, planId: string): Promise<PlanDetail> {
  return request<PlanDetail>(`/plans/${planId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createPlan(token: string, payload: PlanCreatePayload): Promise<PlanDetail> {
  return request<PlanDetail>('/plans', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function updatePlan(
  token: string,
  planId: string,
  payload: PlanUpdatePayload,
): Promise<PlanDetail> {
  return request<PlanDetail>(`/plans/${planId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function archivePlan(token: string, planId: string): Promise<PlanDetail> {
  return request<PlanDetail>(`/plans/${planId}/archive`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function unarchivePlan(token: string, planId: string): Promise<PlanDetail> {
  return request<PlanDetail>(`/plans/${planId}/unarchive`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function softDeletePlan(token: string, planId: string): Promise<PlanDetail> {
  return request<PlanDetail>(`/plans/${planId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function assignPlan(
  token: string,
  planId: string,
  payload: PlanAssignPayload,
): Promise<PlanAssignResponse> {
  return request<PlanAssignResponse>(`/plans/${planId}/assign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function getPlanUsers(token: string, planId: string): Promise<PlanUsersResponse> {
  return request<PlanUsersResponse>(`/plans/${planId}/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getCoachUsers(token: string, coachId: string): Promise<CoachRosterResponse> {
  return request<CoachRosterResponse>(`/coaches/${coachId}/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
