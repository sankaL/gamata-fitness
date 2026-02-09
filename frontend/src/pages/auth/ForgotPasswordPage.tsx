import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { AuthCardLayout } from '@/components/auth/AuthCardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const { requestPasswordReset, error, clearError, isLoading } = useAuth()
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  useEffect(() => clearError, [clearError])

  const onSubmit = handleSubmit(async (values) => {
    const redirectTo = `${window.location.origin}/auth/update-password`
    await requestPasswordReset(values.email, redirectTo)
    setSubmittedMessage('If an account exists for that email, reset instructions were sent.')
  })

  return (
    <AuthCardLayout
      title="Reset your password"
      description="Enter your email and we will send you a reset link."
      footer={
        <Link className="font-medium text-slate-900 underline" to="/login">
          Back to sign in
        </Link>
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

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {submittedMessage ? <p className="text-sm text-emerald-700">{submittedMessage}</p> : null}

        <Button className="w-full" type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? 'Sending reset link...' : 'Send reset link'}
        </Button>
      </form>
    </AuthCardLayout>
  )
}
