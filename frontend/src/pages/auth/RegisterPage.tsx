import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { AuthCardLayout } from '@/components/auth/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(255, 'Name is too long.'),
    email: z.email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Password confirmation is required.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAccount, error, clearError, isLoading } = useAuth()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => clearError, [clearError])

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null)
    const result = await registerAccount({
      name: values.name,
      email: values.email,
      password: values.password,
    })

    if (result.requiresEmailConfirmation) {
      setSuccessMessage('Check your inbox and confirm your email before signing in.')
      return
    }

    navigate('/', { replace: true })
  })

  return (
    <AuthCardLayout
      title="Create your account"
      description="Start logging workouts and receiving coach plans."
      footer={
        <span>
          Already have an account?{' '}
          <Link className="font-medium text-primary underline" to="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input id="name" type="text" autoComplete="name" {...register('name')} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
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
          {isSubmitting || isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
