import { lazy } from 'react'

export const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)

export const AdminWorkoutsPage = lazy(() =>
  import('@/pages/admin/AdminWorkoutsPage').then((module) => ({
    default: module.AdminWorkoutsPage,
  })),
)

export const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((module) => ({
    default: module.AdminUsersPage,
  })),
)

export const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)

export const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)

export const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((module) => ({
    default: module.RegisterPage,
  })),
)

export const UpdatePasswordPage = lazy(() =>
  import('@/pages/auth/UpdatePasswordPage').then((module) => ({
    default: module.UpdatePasswordPage,
  })),
)

export const CoachDashboardPage = lazy(() =>
  import('@/pages/coach/CoachDashboardPage').then((module) => ({
    default: module.CoachDashboardPage,
  })),
)

export const CoachPlansPage = lazy(() =>
  import('@/pages/coach/CoachPlansPage').then((module) => ({
    default: module.CoachPlansPage,
  })),
)

export const AdHocWorkoutPage = lazy(() =>
  import('@/pages/user/AdHocWorkoutPage').then((module) => ({
    default: module.AdHocWorkoutPage,
  })),
)

export const MyCoachesPage = lazy(() =>
  import('@/pages/user/MyCoachesPage').then((module) => ({
    default: module.MyCoachesPage,
  })),
)

export const PlanSettingsPage = lazy(() =>
  import('@/pages/user/PlanSettingsPage').then((module) => ({
    default: module.PlanSettingsPage,
  })),
)

export const ProgressDashboardPage = lazy(() =>
  import('@/pages/user/ProgressDashboardPage').then((module) => ({
    default: module.ProgressDashboardPage,
  })),
)

export const UserDashboardPage = lazy(() =>
  import('@/pages/user/UserDashboardPage').then((module) => ({
    default: module.UserDashboardPage,
  })),
)

export const WorkoutExecutionPage = lazy(() =>
  import('@/pages/user/WorkoutExecutionPage').then((module) => ({
    default: module.WorkoutExecutionPage,
  })),
)
