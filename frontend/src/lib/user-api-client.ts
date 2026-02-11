import { appConfig } from '@/lib/runtime-config'
import type {
  FrequencyProgressQueryParams,
  FrequencyProgressResponse,
  MuscleGroupProgressResponse,
  PaginatedUserSessionsResponse,
  ProgressDateRangeQueryParams,
  UserSessionHistoryQueryParams,
} from '@/types/progress'
import type {
  Session,
  SessionCreatePayload,
  SessionLogCreatePayload,
  SessionLogUpdatePayload,
  SessionUpdatePayload,
} from '@/types/sessions'
import type {
  UserCoachesResponse,
  UserQuickStatsResponse,
  UserTodayWorkoutResponse,
  UserWeekPlanResponse,
} from '@/types/user-dashboard'
import type { Workout } from '@/types/workouts'

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

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

export async function getUserTodayWorkout(token: string): Promise<UserTodayWorkoutResponse> {
  return request<UserTodayWorkoutResponse>('/users/me/today', token, {
    method: 'GET',
  })
}

export async function getUserWeekPlan(token: string): Promise<UserWeekPlanResponse> {
  return request<UserWeekPlanResponse>('/users/me/plan', token, {
    method: 'GET',
  })
}

export async function getUserQuickStats(token: string): Promise<UserQuickStatsResponse> {
  return request<UserQuickStatsResponse>('/users/me/stats', token, {
    method: 'GET',
  })
}

export async function getUserCoaches(token: string): Promise<UserCoachesResponse> {
  return request<UserCoachesResponse>('/users/me/coaches', token, {
    method: 'GET',
  })
}

export async function createSession(
  token: string,
  payload: SessionCreatePayload,
): Promise<Session> {
  return request<Session>('/sessions', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSession(token: string, sessionId: string): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}`, token, {
    method: 'GET',
  })
}

export async function updateSession(
  token: string,
  sessionId: string,
  payload: SessionUpdatePayload,
): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function completeSession(token: string, sessionId: string): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}/complete`, token, {
    method: 'POST',
  })
}

export async function addSessionLog(
  token: string,
  sessionId: string,
  payload: SessionLogCreatePayload,
): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}/logs`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateSessionLog(
  token: string,
  sessionId: string,
  logId: string,
  payload: SessionLogUpdatePayload,
): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}/logs/${logId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getWorkoutAlternatives(
  token: string,
  workoutId: string,
  limit = 12,
): Promise<Workout[]> {
  const query = buildQueryString({ limit })
  return request<Workout[]>(`/workouts/alternatives/${workoutId}${query}`, token, {
    method: 'GET',
  })
}

export async function getUserSessions(
  token: string,
  params: UserSessionHistoryQueryParams,
): Promise<PaginatedUserSessionsResponse> {
  const query = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    start_date: params.start_date,
    end_date: params.end_date,
    workout_type: params.workout_type,
    muscle_group_id: params.muscle_group_id,
  })
  return request<PaginatedUserSessionsResponse>(`/users/me/sessions${query}`, token, {
    method: 'GET',
  })
}

export async function getMuscleGroupProgress(
  token: string,
  params: ProgressDateRangeQueryParams,
): Promise<MuscleGroupProgressResponse> {
  const query = buildQueryString({
    start_date: params.start_date,
    end_date: params.end_date,
  })
  return request<MuscleGroupProgressResponse>(`/users/me/progress/muscle-groups${query}`, token, {
    method: 'GET',
  })
}

export async function getFrequencyProgress(
  token: string,
  params: FrequencyProgressQueryParams,
): Promise<FrequencyProgressResponse> {
  const query = buildQueryString({
    period: params.period,
    start_date: params.start_date,
    end_date: params.end_date,
  })
  return request<FrequencyProgressResponse>(`/users/me/progress/frequency${query}`, token, {
    method: 'GET',
  })
}
