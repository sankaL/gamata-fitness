import { useState, type ReactNode } from 'react'

import { BottomNav } from '@/components/shared/BottomNav'
import { TopBar } from '@/components/shared/TopBar'
import { PlanActivationModal } from '@/components/user/PlanActivationModal'
import { useToast } from '@/components/ui/toast-provider'
import {
  useActivatePendingPlanMutation,
  useDeclinePendingPlanMutation,
  useUserPendingPlansQuery,
} from '@/hooks/use-user-plan-activation'

interface UserShellProps {
  children: ReactNode
}

export function UserShell({ children }: UserShellProps) {
  const { showToast } = useToast()
  const [modalError, setModalError] = useState<string | null>(null)
  const pendingPlansQuery = useUserPendingPlansQuery()
  const activateMutation = useActivatePendingPlanMutation()
  const declineMutation = useDeclinePendingPlanMutation()

  const pendingAssignments = pendingPlansQuery.data?.pending_assignments ?? []
  const showActivationModal = pendingAssignments.length > 0
  const isSubmitting = activateMutation.isPending || declineMutation.isPending

  async function handleActivate(assignmentId: string) {
    try {
      setModalError(null)
      await activateMutation.mutateAsync(assignmentId)
      showToast('Pending plan activated.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to activate pending plan.'
      setModalError(message)
      showToast(message, 'error')
    }
  }

  async function handleDecline(assignmentId: string) {
    try {
      setModalError(null)
      await declineMutation.mutateAsync(assignmentId)
      showToast('Pending plan declined.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to decline pending plan.'
      setModalError(message)
      showToast(message, 'error')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <section className="pb-20 pt-14 px-4 space-y-4">
        {modalError ? <p className="text-sm text-destructive">{modalError}</p> : null}
        {children}
      </section>
      <BottomNav role="user" />

      <PlanActivationModal
        open={showActivationModal}
        plans={pendingAssignments}
        isSubmitting={isSubmitting}
        onActivate={handleActivate}
        onDecline={handleDecline}
      />
    </main>
  )
}
