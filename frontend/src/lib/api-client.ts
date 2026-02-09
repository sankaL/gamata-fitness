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

export interface HealthResponse {
  status: 'ok'
}

interface ApiErrorPayload {
  detail?: string
  message?: string
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
