import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { PLANS } from '@/lib/billing'

/**
 * Upgrade to Pro plan
 * POST /api/stripe/upgrade
 * 
 * Creates a Stripe checkout session for upgrading to Pro plan.
 * Automatically uses the Pro plan's Stripe price ID from configuration.
 * 
 * Requires authentication via Clerk
 */
export const POST = withAuth(async (req, { userId: authenticatedUserId }) => {
  try {
    // Get Pro plan price ID from configuration
    const proPriceId = PLANS.pro.stripePriceId

    if (!proPriceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pro plan price ID not configured. Please contact support.' 
        },
        { status: 500 }
      )
    }

    // Create checkout session for Pro plan
    const session = await createCheckoutSession(authenticatedUserId, proPriceId)

    return NextResponse.json({
      success: true,
      url: session.url,
    })

  } catch (error) {
    console.error('Error creating upgrade checkout session:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create checkout session' 
      },
      { status: 500 }
    )
  }
})

