import { Activity, CheckCircle2, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getHealth } from '@/lib/api-client'
import { appConfig } from '@/lib/runtime-config'
import { supabase } from '@/lib/supabase'

type HealthState = 'loading' | 'healthy' | 'error'

function App() {
  const [healthState, setHealthState] = useState<HealthState>('loading')
  const [healthMessage, setHealthMessage] = useState('Checking backend health...')

  const checkHealth = async () => {
    setHealthState('loading')
    setHealthMessage('Checking backend health...')

    try {
      await getHealth()
      setHealthState('healthy')
      setHealthMessage('Backend responded with {"status":"ok"}.')
    } catch (error) {
      setHealthState('error')
      setHealthMessage(error instanceof Error ? error.message : 'Unexpected frontend error')
    }
  }

  useEffect(() => {
    let isMounted = true

    void getHealth()
      .then(() => {
        if (!isMounted) {
          return
        }

        setHealthState('healthy')
        setHealthMessage('Backend responded with {"status":"ok"}.')
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return
        }

        setHealthState('error')
        setHealthMessage(error instanceof Error ? error.message : 'Unexpected frontend error')
      })

    return () => {
      isMounted = false
    }
  }, [])

  const supabaseConfigured =
    Boolean(appConfig.supabaseUrl) &&
    Boolean(appConfig.supabaseAnonKey) &&
    typeof supabase === 'object'

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-100 p-4 md:p-8">
      <section className="mx-auto max-w-2xl">
        <Card className="border-slate-300 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-6 w-6" />
              GamataFitness Infrastructure Check
            </CardTitle>
            <CardDescription>
              Phase 1 connectivity check between the Vite frontend and FastAPI backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm md:text-base">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold">Backend health endpoint</p>
              <p className="mt-1 text-slate-700">GET {appConfig.apiBaseUrl}/health</p>
              <p className="mt-2 flex items-center gap-2">
                {healthState === 'healthy' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">{healthMessage}</span>
                  </>
                ) : null}
                {healthState === 'loading' ? (
                  <span className="text-slate-700">{healthMessage}</span>
                ) : null}
                {healthState === 'error' ? (
                  <>
                    <TriangleAlert className="h-5 w-5 text-rose-600" />
                    <span className="text-rose-700">{healthMessage}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold">Supabase client initialization</p>
              <p className="mt-1 text-slate-700">
                {supabaseConfigured
                  ? 'Configured from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
                  : 'Missing Supabase environment configuration.'}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => void checkHealth()} className="w-full md:w-auto">
              Recheck backend health
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  )
}

export default App
