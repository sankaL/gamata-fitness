import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      message: '',
    }
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
          <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">{this.state.message}</p>
            <div className="mt-5">
              <Button
                onClick={() => {
                  window.location.reload()
                }}
              >
                Reload app
              </Button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
