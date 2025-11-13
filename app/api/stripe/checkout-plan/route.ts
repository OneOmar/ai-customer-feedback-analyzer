import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { PLANS, type PlanType } from '@/lib/billing'

/**
 * Create checkout session for a specific plan
 * POST /api/stripe/checkout-plan
 * 
 * Creates a Stripe checkout session for upgrading to a specific plan.
 * Automatically uses the plan's Stripe price ID from configuration.
 * 
 * Request Body:
 * - plan: 'pro' | 'business' (required)
 * 
 * Requires authentication via Clerk
 */
interface CheckoutPlanRequest {
  plan: PlanType
}

export const POST = withAuth(async (req, { userId: authenticatedUserId }) => {
  try {
    // Parse request body
    const body: CheckoutPlanRequest = await req.json()
    const { plan } = body

    // Validate plan
    if (!plan || (plan !== 'pro' && plan !== 'business')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid plan. Must be "pro" or "business".' 
        },
        { status: 400 }
      )
    }

    // Get plan price ID from configuration
    const planConfig = PLANS[plan]
    const priceId = planConfig.stripePriceId

    if (!priceId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan price ID not configured. Please contact support.` 
        },
        { status: 500 }
      )
    }

    // Create checkout session for the plan
    const session = await createCheckoutSession(authenticatedUserId, priceId)

    return NextResponse.json({
      success: true,
      url: session.url,
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
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

