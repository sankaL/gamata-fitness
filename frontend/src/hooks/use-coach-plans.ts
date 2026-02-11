import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { exportPlanCsv } from '@/lib/import-export-api-client'
import {
  archivePlan,
  assignPlan,
  createPlan,
  getCoachUsers,
  getPlanById,
  getPlanUsers,
  getPlans,
  getWorkouts,
  softDeletePlan,
  unarchivePlan,
  updatePlan,
} from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import type {
  PlanAssignPayload,
  PlanCreatePayload,
  PlanListQueryParams,
  PlanUpdatePayload,
} from '@/types/plans'

const PLANS_QUERY_KEY = ['coach-plans']
const PLAN_DETAIL_QUERY_KEY = ['coach-plan-detail']
const PLAN_USERS_QUERY_KEY = ['coach-plan-users']
const COACH_USERS_QUERY_KEY = ['coach-users']
const WORKOUT_PICKER_QUERY_KEY = ['coach-workout-picker']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to access coach plan data.')
  }
  return token
}

function assertCoachId(coachId: string | undefined): string {
  if (!coachId) {
    throw new Error('Coach profile is required.')
  }
  return coachId
}

export function useCoachPlansQuery(params: PlanListQueryParams) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...PLANS_QUERY_KEY, params],
    queryFn: () => getPlans(assertToken(accessToken), params),
  })
}

export function useCoachPlanDetailQuery(planId: string | null, enabled = true) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...PLAN_DETAIL_QUERY_KEY, planId],
    queryFn: () => {
      if (!planId) {
        throw new Error('Plan ID is required.')
      }
      return getPlanById(assertToken(accessToken), planId)
    },
    enabled: Boolean(planId) && enabled,
  })
}

export function useCoachPlanUsersQuery(planId: string | null, enabled = true) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...PLAN_USERS_QUERY_KEY, planId],
    queryFn: () => {
      if (!planId) {
        throw new Error('Plan ID is required.')
      }
      return getPlanUsers(assertToken(accessToken), planId)
    },
    enabled: Boolean(planId) && enabled,
  })
}

export function useCoachRosterQuery() {
  const { accessToken, user } = useAuth()
  return useQuery({
    queryKey: [...COACH_USERS_QUERY_KEY, user?.id],
    queryFn: () => getCoachUsers(assertToken(accessToken), assertCoachId(user?.id)),
    enabled: Boolean(user?.id),
    staleTime: 60 * 1000,
  })
}

export function useWorkoutPickerQuery(search: string) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...WORKOUT_PICKER_QUERY_KEY, search],
    queryFn: () =>
      getWorkouts(assertToken(accessToken), {
        page: 1,
        page_size: 100,
        is_archived: false,
        search: search || undefined,
      }),
  })
}

export function useCreatePlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PlanCreatePayload) => createPlan(assertToken(accessToken), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: COACH_USERS_QUERY_KEY })
    },
  })
}

export function useUpdatePlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PlanUpdatePayload }) =>
      updatePlan(assertToken(accessToken), planId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...PLAN_DETAIL_QUERY_KEY, variables.planId] })
      void queryClient.invalidateQueries({ queryKey: [...PLAN_USERS_QUERY_KEY, variables.planId] })
      void queryClient.invalidateQueries({ queryKey: COACH_USERS_QUERY_KEY })
    },
  })
}

export function useArchivePlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => archivePlan(assertToken(accessToken), planId),
    onSuccess: (_, planId) => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...PLAN_DETAIL_QUERY_KEY, planId] })
      void queryClient.invalidateQueries({ queryKey: COACH_USERS_QUERY_KEY })
    },
  })
}

export function useUnarchivePlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => unarchivePlan(assertToken(accessToken), planId),
    onSuccess: (_, planId) => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...PLAN_DETAIL_QUERY_KEY, planId] })
      void queryClient.invalidateQueries({ queryKey: COACH_USERS_QUERY_KEY })
    },
  })
}

export function useSoftDeletePlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: string) => softDeletePlan(assertToken(accessToken), planId),
    onSuccess: (_, planId) => {
      void queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...PLAN_DETAIL_QUERY_KEY, planId] })
      void queryClient.invalidateQueries({ queryKey: COACH_USERS_QUERY_KEY })
    },
  })
}

export function useAssignPlanMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: PlanAssignPayload }) =>
      assignPlan(assertToken(accessToken), planId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...PLAN_USERS_QUERY_KEY, variables.planId] })
      void queryClient.invalidateQueries({ queryKey: COACH_USERS_QUERY_KEY })
    },
  })
}

export function useExportPlanCsvMutation() {
  const { accessToken } = useAuth()
  return useMutation({
    mutationFn: (planId: string) => exportPlanCsv(assertToken(accessToken), planId),
  })
}
