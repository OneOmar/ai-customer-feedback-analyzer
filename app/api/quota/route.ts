import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getQuotaDisplay, getSubscription } from '@/lib/billing'

/**
 * Get user quota information
 * GET /api/quota
 * 
 * Returns the current user's quota information including:
 * - plan: string - current subscription plan name
 * - used: number - analyses used in current period
 * - limit: number - total analyses allowed in current period
 * - percentage: number - usage percentage (0-100)
 * - resetsAt: string - date when quota resets
 * 
 * Requires authentication via Clerk
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    const quotaDisplay = await getQuotaDisplay(userId)
    const subscription = await getSubscription(userId)

    return NextResponse.json({
      success: true,
      data: quotaDisplay,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching quota:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quota information',
      },
      { status: 500 }
    )
  }
})

