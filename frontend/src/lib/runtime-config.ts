type RuntimeConfigKey = 'VITE_API_BASE_URL' | 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'

type RuntimeConfig = Partial<Record<RuntimeConfigKey, string>>

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig
  }
}

function getRuntimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') {
    return {}
  }

  return window.__APP_CONFIG__ ?? {}
}

function getRequiredConfigValue(
  name: RuntimeConfigKey,
  buildTimeValue: string | undefined,
): string {
  const runtimeValue = getRuntimeConfig()[name]?.trim()
  const resolvedValue = runtimeValue || buildTimeValue?.trim()

  if (!resolvedValue) {
    throw new Error(`Missing ${name}. Set frontend environment variables before startup.`)
  }

  return resolvedValue
}

export const appConfig = {
  apiBaseUrl: getRequiredConfigValue('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL),
  supabaseUrl: getRequiredConfigValue('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: getRequiredConfigValue(
    'VITE_SUPABASE_ANON_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  ),
}
