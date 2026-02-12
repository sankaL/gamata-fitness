import { LogOut } from 'lucide-react'

import { UserAvatar } from '@/components/shared/UserAvatar'
import { useAuth } from '@/hooks/use-auth'

export function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between px-4">
        <span className="text-lg font-bold italic text-primary">GamataFitness</span>
        <div className="flex items-center gap-3">
          <UserAvatar name={user?.name} />
          <button
            type="button"
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
