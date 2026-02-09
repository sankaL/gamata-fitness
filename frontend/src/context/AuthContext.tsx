import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  sendPasswordReset,
  submitPasswordUpdate,
} from '@/lib/api-client'
import type { LoginPayload, RegisterPayload, UserProfile } from '@/types/auth'

interface RegisterResult {
  requiresEmailConfirmation: boolean
}

interface AuthContextValue {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  clearError: () => void
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<RegisterResult>
  logout: () => void
  refreshProfile: () => Promise<void>
  requestPasswordReset: (email: string, redirectTo?: string) => Promise<void>
  updatePassword: (token: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    setError(null)
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await loginRequest(payload)
      if (!response.access_token) {
        throw new Error('Login succeeded but no access token was returned.')
      }
      setUser(response.user)
      setAccessToken(response.access_token)
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to complete login.'
      setError(message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterResult> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await registerRequest(payload)
      if (response.access_token) {
        setUser(response.user)
        setAccessToken(response.access_token)
      } else {
        setUser(null)
        setAccessToken(null)
      }

      return { requiresEmailConfirmation: response.requires_email_confirmation }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to complete registration.'
      setError(message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const profile = await getCurrentUser(accessToken)
      setUser(profile)
    } catch (requestError) {
      logout()
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to refresh profile.'
      setError(message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, logout])

  const requestPasswordReset = useCallback(async (email: string, redirectTo?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await sendPasswordReset({
        email,
        redirect_to: redirectTo,
      })
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to request password reset.'
      setError(message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePassword = useCallback(async (token: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await submitPasswordUpdate(token, { password })
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Unable to update password.'
      setError(message)
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      error,
      clearError,
      login,
      register,
      logout,
      refreshProfile,
      requestPasswordReset,
      updatePassword,
    }),
    [
      accessToken,
      clearError,
      error,
      isLoading,
      login,
      logout,
      refreshProfile,
      register,
      requestPasswordReset,
      updatePassword,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
