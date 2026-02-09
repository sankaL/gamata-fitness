import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface AdminShellProps {
  title: string
  description: string
  children: ReactNode
}

function NavItem({ to, label }: { to: string; label: string }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200',
      )}
    >
      {label}
    </Link>
  )
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-slate-500">
                <p className="font-medium text-slate-700">{user?.name}</p>
                <p>{user?.email}</p>
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <nav className="mt-4 flex flex-wrap items-center gap-2">
            <NavItem to="/admin/dashboard" label="Overview" />
            <NavItem to="/admin/users" label="Users" />
          </nav>
        </header>

        {children}
      </section>
    </main>
  )
}
