import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuth } from '@/hooks/use-auth'
import { getDashboardPath } from '@/lib/auth-routing'
import {
  AdHocWorkoutPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminWorkoutsPage,
  CoachDashboardPage,
  CoachPlansPage,
  ForgotPasswordPage,
  LoginPage,
  MyCoachesPage,
  PlanSettingsPage,
  ProgressDashboardPage,
  RegisterPage,
  UpdatePasswordPage,
  UserDashboardPage,
  WorkoutExecutionPage,
} from '@/routes/lazy-pages'
import { RoleDataPrefetcher } from '@/routes/RoleDataPrefetcher'

function RootRedirect() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDashboardPath(user.role)} replace />
}

function RouteLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="rounded-xl border border-border bg-card px-6 py-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </section>
    </main>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <RoleDataPrefetcher />
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
        <Route
          path="/user/plans"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['user']}>
                <PlanSettingsPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/coaches"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['user']}>
                <MyCoachesPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/workout"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['user']}>
                <WorkoutExecutionPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/workouts/adhoc"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['user']}>
                <AdHocWorkoutPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/progress"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['user']}>
                <ProgressDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
