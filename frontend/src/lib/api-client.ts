import { appConfig } from '@/lib/runtime-config'

export interface HealthResponse {
  status: 'ok'
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${appConfig.apiBaseUrl}/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as HealthResponse
  if (payload.status !== 'ok') {
    throw new Error('Unexpected health response payload from backend')
  }

  return payload
}
