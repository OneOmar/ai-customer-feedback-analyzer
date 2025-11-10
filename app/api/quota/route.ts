import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { checkUserQuota } from '@/lib/billing'

/**
 * Get user quota information
 * GET /api/quota
 * 
 * Returns the current user's quota information including:
 * - allowed: boolean - whether user can perform analysis
 * - remaining: number - remaining analyses in current period
 * - plan: PlanType - current subscription plan
 * 
 * Requires authentication via Clerk
 */
export const GET = withAuth(async (req, { userId }) => {
  try {
    const quota = await checkUserQuota(userId)

    return NextResponse.json({
      success: true,
      quota,
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

