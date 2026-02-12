import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

interface RoleDashboardShellProps {
  heading: string
  description: string
}

export function RoleDashboardShell({ heading, description }: RoleDashboardShellProps) {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-background p-4">
      <section className="mx-auto max-w-[430px]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{heading}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Signed in as:</span> {user?.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">Role:</span> {user?.role}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
