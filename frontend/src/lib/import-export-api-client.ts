import { appConfig } from '@/lib/runtime-config'
import type { CSVImportResponse } from '@/types/import-export'

interface ApiErrorPayload {
  detail?: string
  message?: string
}

function parseFileName(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) {
    return fallback
  }
  const match = contentDisposition.match(/filename="(.+)"/)
  return match?.[1] ?? fallback
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) {
    return
  }
  let detail = `Request failed with status ${response.status}`
  try {
    const payload = (await response.json()) as ApiErrorPayload
    if (payload.detail) {
      detail = payload.detail
    } else if (payload.message) {
      detail = payload.message
    }
  } catch {
    // Keep fallback detail when error body is not JSON.
  }
  throw new Error(detail)
}

async function downloadCsv(path: string, token: string, fallbackFileName: string): Promise<File> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
      Authorization: `Bearer ${token}`,
    },
  })

  await ensureOk(response)
  const blob = await response.blob()
  const filename = parseFileName(response.headers.get('content-disposition'), fallbackFileName)
  return new File([blob], filename, { type: 'text/csv' })
}

async function uploadCsv(path: string, token: string, file: File): Promise<CSVImportResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  await ensureOk(response)
  return (await response.json()) as CSVImportResponse
}

export async function exportUsersCsv(token: string): Promise<File> {
  return downloadCsv('/users/export', token, 'users-export.csv')
}

export async function exportWorkoutsCsv(token: string): Promise<File> {
  return downloadCsv('/workouts/export', token, 'workouts-export.csv')
}

export async function exportPlanCsv(token: string, planId: string): Promise<File> {
  return downloadCsv(`/plans/${planId}/export`, token, 'plan-export.csv')
}

export async function importUsersCsv(token: string, file: File): Promise<CSVImportResponse> {
  return uploadCsv('/users/import', token, file)
}

export async function importWorkoutsCsv(token: string, file: File): Promise<CSVImportResponse> {
  return uploadCsv('/workouts/import', token, file)
}
