import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Dumbbell,
  Home,
  LayoutDashboard,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface NavTab {
  to: string
  label: string
  icon: LucideIcon
}

const USER_TABS: NavTab[] = [
  { to: '/user/dashboard', label: 'Home', icon: Home },
  { to: '/user/workout', label: 'Workout', icon: Dumbbell },
  { to: '/user/progress', label: 'Analytics', icon: BarChart3 },
  { to: '/user/plans', label: 'Plans', icon: Calendar },
]

const ADMIN_TABS: NavTab[] = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/workouts', label: 'Workouts', icon: Dumbbell },
]

const COACH_TABS: NavTab[] = [
  { to: '/coach/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/coach/plans', label: 'Plans', icon: ClipboardList },
]

const TAB_MAP: Record<string, NavTab[]> = {
  user: USER_TABS,
  admin: ADMIN_TABS,
  coach: COACH_TABS,
}

interface BottomNavProps {
  role: 'user' | 'admin' | 'coach'
}

export function BottomNav({ role }: BottomNavProps) {
  const location = useLocation()
  const tabs = TAB_MAP[role]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-[430px] items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
