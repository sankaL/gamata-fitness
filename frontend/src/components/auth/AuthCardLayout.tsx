import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthCardLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCardLayout({ title, description, children, footer }: AuthCardLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <span className="mb-6 text-2xl font-bold italic text-primary">GamataFitness</span>
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-foreground">{title}</CardTitle>
          <CardDescription className="text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {footer ? <div className="text-sm text-muted-foreground">{footer}</div> : null}
        </CardContent>
      </Card>
    </main>
  )
}
