import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { AuthCardLayout } from '@/components/auth/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Password confirmation is required.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

function readAccessTokenFromUrl(): string | null {
  const searchParams = new URLSearchParams(window.location.search)
  const tokenInQuery = searchParams.get('access_token')
  if (tokenInQuery) {
    return tokenInQuery
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const hashParams = new URLSearchParams(hash)
  return hashParams.get('access_token')
}

export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const { updatePassword, error, isLoading } = useAuth()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const token = useMemo(() => readAccessTokenFromUrl(), [])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      return
    }

    await updatePassword(token, values.password)
    setSuccessMessage('Password updated successfully. Redirecting to login...')
    setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1000)
  })

  return (
    <AuthCardLayout
      title="Set a new password"
      description="Choose a new password for your account."
      footer={
        <Link className="font-medium text-primary underline" to="/login">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <p className="text-sm text-destructive">
          Password reset token is missing or invalid. Request a new reset link from the login page.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}

          <Button className="w-full" type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthCardLayout>
  )
}
