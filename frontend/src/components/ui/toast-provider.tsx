import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const TOAST_DURATION_MS = 3600

function ToastCard({ item }: { item: ToastItem }) {
  const toneStyles: Record<ToastType, string> = {
    success: 'border-emerald-800 bg-emerald-900/80 text-emerald-200',
    error: 'border-rose-800 bg-rose-900/80 text-rose-200',
    info: 'border-border bg-card text-foreground',
  }

  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm shadow-lg', toneStyles[item.type])}>
      {item.message}
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, number>>(new Map())

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      setToasts((current) => [...current, { id, message, type }])
      const timerId = window.setTimeout(() => removeToast(id), TOAST_DURATION_MS)
      timersRef.current.set(id, timerId)
    },
    [removeToast],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[100] mx-auto flex max-w-[430px] flex-col gap-2">
        {toasts.map((item) => (
          <button
            key={item.id}
            type="button"
            className="pointer-events-auto text-left"
            onClick={() => removeToast(item.id)}
          >
            <ToastCard item={item} />
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.')
  }
  return context
}
