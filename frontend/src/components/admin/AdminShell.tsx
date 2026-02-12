import type { ReactNode } from 'react'

import { BottomNav } from '@/components/shared/BottomNav'
import { TopBar } from '@/components/shared/TopBar'

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <section className="pb-20 pt-14 px-4 space-y-4">{children}</section>
      <BottomNav role="admin" />
    </main>
  )
}
