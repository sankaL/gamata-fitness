import { createClient } from '@supabase/supabase-js'

import { appConfig } from '@/lib/runtime-config'

export const supabase = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey)
