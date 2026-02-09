import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { AuthCardLayout } from '@/components/auth/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, error, clearError, isLoading } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => clearError, [clearError])

  const onSubmit = handleSubmit(async (values) => {
    await login(values)
    navigate('/', { replace: true })
  })

  return (
    <AuthCardLayout
      title="Welcome back"
      description="Sign in to continue your training plan."
      footer={
        <span>
          New to GamataFitness?{' '}
          <Link className="font-medium text-slate-900 underline" to="/register">
            Create an account
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-sm text-rose-700">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password ? (
            <p className="text-sm text-rose-700">{errors.password.message}</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}

        <Button className="w-full" type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm">
          <Link className="text-slate-900 underline" to="/forgot-password">
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthCardLayout>
  )
}
