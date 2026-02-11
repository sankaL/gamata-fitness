import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuth } from '@/hooks/use-auth'
import { getDashboardPath } from '@/lib/auth-routing'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminWorkoutsPage } from '@/pages/admin/AdminWorkoutsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { UpdatePasswordPage } from '@/pages/auth/UpdatePasswordPage'
import { CoachDashboardPage } from '@/pages/coach/CoachDashboardPage'
import { CoachPlansPage } from '@/pages/coach/CoachPlansPage'
import { UserDashboardPage } from '@/pages/user/UserDashboardPage'

function RootRedirect() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDashboardPath(user.role)} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <AdminUsersPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workouts"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin']}>
              <AdminWorkoutsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['coach']}>
              <CoachDashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coach/plans"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['coach']}>
              <CoachPlansPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['user']}>
              <UserDashboardPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
