import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

interface CardioTimerProps {
  initialSeconds: number
  onChange: (seconds: number) => void
}

export function CardioTimer({ initialSeconds, onChange }: CardioTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    setSeconds(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    onChange(seconds)
  }, [onChange, seconds])

  useEffect(() => {
    if (!isRunning) {
      return
    }
    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)
    return () => {
      window.clearInterval(timer)
    }
  }, [isRunning])

  const formattedTime = useMemo(() => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [seconds])

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
      <p className="text-xs text-slate-500">Elapsed Time</p>
      <p className="text-4xl font-semibold tracking-widest text-slate-900">{formattedTime}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => setIsRunning((current) => !current)}>
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsRunning(false)
            setSeconds(0)
          }}
        >
          Stop
        </Button>
      </div>
    </div>
  )
}
