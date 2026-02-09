import type { UserRole } from '@/types/auth'

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'coach':
      return '/coach/dashboard'
    case 'user':
    default:
      return '/user/dashboard'
  }
}
