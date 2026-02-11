import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { PlanActivationModal } from '@/components/user/PlanActivationModal'
import { QuickStatsCards } from '@/components/user/QuickStatsCards'

describe('QuickStatsCards', () => {
  it('renders stat values when loaded', () => {
    render(
      React.createElement(QuickStatsCards, {
        isLoading: false,
        stats: {
          sessions_this_week: 3,
          current_streak_days: 5,
          completed_today: 1,
          total_completed_sessions: 18,
        },
      }),
    )

    expect(screen.getByText('Sessions This Week')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('18')).toBeDefined()
  })
})

describe('PlanActivationModal', () => {
  it('calls activate callback with selected assignment id', () => {
    const onActivate = vi.fn(async () => Promise.resolve())
    const onDecline = vi.fn(async () => Promise.resolve())

    render(
      React.createElement(PlanActivationModal, {
        open: true,
        plans: [
          {
            assignment_id: 'assignment-1',
            plan_id: 'plan-1',
            plan_name: 'Strength Phase A',
            coach_id: 'coach-1',
            coach_name: 'Coach Test',
            start_date: '2026-02-01',
            end_date: '2026-02-28',
            total_days: 4,
            total_workouts: 12,
            assigned_at: '2026-02-11T10:00:00Z',
            plan_is_archived: false,
          },
        ],
        isSubmitting: false,
        onActivate,
        onDecline,
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Activate' }))

    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate).toHaveBeenCalledWith('assignment-1')
  })
})
