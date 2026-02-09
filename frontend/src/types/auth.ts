export type UserRole = 'admin' | 'coach' | 'user'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: UserProfile
  access_token: string | null
  refresh_token: string | null
  expires_in: number | null
  token_type: string
  requires_email_confirmation: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface PasswordResetPayload {
  email: string
  redirect_to?: string
}

export interface PasswordUpdatePayload {
  password: string
}

export interface MessageResponse {
  message: string
}
