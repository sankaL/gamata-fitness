import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveWorkout,
  createMuscleGroup,
  createWorkout,
  getCardioTypes,
  getMuscleGroups,
  getWorkoutById,
  getWorkouts,
  unarchiveWorkout,
  updateWorkout,
} from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import type {
  MuscleGroupCreatePayload,
  WorkoutCreatePayload,
  WorkoutListQueryParams,
  WorkoutUpdatePayload,
} from '@/types/workouts'

const WORKOUTS_QUERY_KEY = ['admin-workouts']
const WORKOUT_DETAIL_QUERY_KEY = ['admin-workout-detail']
const MUSCLE_GROUPS_QUERY_KEY = ['muscle-groups']
const CARDIO_TYPES_QUERY_KEY = ['cardio-types']

function assertToken(token: string | null): string {
  if (!token) {
    throw new Error('You must be signed in to access workout data.')
  }
  return token
}

export function useAdminWorkoutsQuery(params: WorkoutListQueryParams) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...WORKOUTS_QUERY_KEY, params],
    queryFn: () => getWorkouts(assertToken(accessToken), params),
  })
}

export function useWorkoutDetailQuery(workoutId: string | null, enabled = true) {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: [...WORKOUT_DETAIL_QUERY_KEY, workoutId],
    queryFn: () => {
      if (!workoutId) {
        throw new Error('A workout ID is required.')
      }
      return getWorkoutById(assertToken(accessToken), workoutId)
    },
    enabled: Boolean(workoutId) && enabled,
  })
}

export function useMuscleGroupsQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: MUSCLE_GROUPS_QUERY_KEY,
    queryFn: () => getMuscleGroups(assertToken(accessToken)),
  })
}

export function useCardioTypesQuery() {
  const { accessToken } = useAuth()
  return useQuery({
    queryKey: CARDIO_TYPES_QUERY_KEY,
    queryFn: () => getCardioTypes(assertToken(accessToken)),
  })
}

export function useCreateWorkoutMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: WorkoutCreatePayload) => createWorkout(assertToken(accessToken), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY })
    },
  })
}

export function useUpdateWorkoutMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workoutId, payload }: { workoutId: string; payload: WorkoutUpdatePayload }) =>
      updateWorkout(assertToken(accessToken), workoutId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY })
      void queryClient.invalidateQueries({
        queryKey: [...WORKOUT_DETAIL_QUERY_KEY, variables.workoutId],
      })
    },
  })
}

export function useArchiveWorkoutMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => archiveWorkout(assertToken(accessToken), workoutId),
    onSuccess: (_, workoutId) => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...WORKOUT_DETAIL_QUERY_KEY, workoutId] })
    },
  })
}

export function useUnarchiveWorkoutMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => unarchiveWorkout(assertToken(accessToken), workoutId),
    onSuccess: (_, workoutId) => {
      void queryClient.invalidateQueries({ queryKey: WORKOUTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...WORKOUT_DETAIL_QUERY_KEY, workoutId] })
    },
  })
}

export function useCreateMuscleGroupMutation() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MuscleGroupCreatePayload) =>
      createMuscleGroup(assertToken(accessToken), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MUSCLE_GROUPS_QUERY_KEY })
    },
  })
}
