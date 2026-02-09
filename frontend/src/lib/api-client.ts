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
