import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getStripeClient } from '@/lib/stripe'
import Stripe from 'stripe'

/**
 * Stripe Checkout Session Creation API Route
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe checkout session for subscription purchase.
 * Requires authentication via Clerk.
 * 
 * Request Body:
 * - userId: string (optional, will use authenticated user if not provided)
 * - priceId: string (required) - Stripe price ID for the subscription
 * 
 * Response:
 * - 200: { url: string } - Checkout session URL for redirect
 * - 400: Bad request (missing/invalid parameters)
 * - 401: Unauthorized (not authenticated)
 * - 500: Server error (Stripe API error, missing env vars)
 */

interface CheckoutRequest {
  userId?: string
  priceId: string
}

export const POST = withAuth(async (req, { userId: authenticatedUserId }) => {
  try {
    // Parse request body
    const body: CheckoutRequest = await req.json()
    const { userId: bodyUserId, priceId } = body

    // Validate priceId (required)
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing or invalid priceId. priceId is required.' 
        },
        { status: 400 }
      )
    }

    // Clerk server helper validation: withAuth wrapper (line 29) calls auth() from @clerk/nextjs/server
    // This validates the user's session and provides authenticatedUserId
    // Use authenticated userId for security (prevents users from creating sessions for others)
    const userId = authenticatedUserId

    // Optional: Validate that body userId (if provided) matches authenticated user
    // This ensures API consistency while maintaining security
    if (bodyUserId && bodyUserId !== authenticatedUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID in request body does not match authenticated user' 
        },
        { status: 403 }
      )
    }

    // Validate userId is present (should always be present after withAuth, but check for safety)
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required. Authentication may have failed.' 
        },
        { status: 401 }
      )
    }

    // Validate environment variables are set
    const successUrl = process.env.STRIPE_SUCCESS_URL
    const cancelUrl = process.env.STRIPE_CANCEL_URL

    if (!successUrl) {
      console.error('Missing STRIPE_SUCCESS_URL environment variable')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error: Missing STRIPE_SUCCESS_URL' 
        },
        { status: 500 }
      )
    }

    if (!cancelUrl) {
      console.error('Missing STRIPE_CANCEL_URL environment variable')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error: Missing STRIPE_CANCEL_URL' 
        },
        { status: 500 }
      )
    }

    // Get Stripe client
    const stripe = getStripeClient()

    // Create checkout session using Stripe client directly
    // Clerk userId validation: authenticatedUserId comes from withAuth wrapper
    // which calls auth() from @clerk/nextjs/server to validate the session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId, // Store userId in session metadata for webhook processing
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    // Return checkout session URL for client-side redirect
    return NextResponse.json({
      success: true,
      url: session.url,
    })

  } catch (error: unknown) {
    console.error('Error creating checkout session:', error)

    // Handle Stripe API errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Stripe API error: ${error.message}` 
        },
        { status: 500 }
      )
    }

    // Handle validation errors (missing env vars, etc.)
    if (error instanceof Error) {
      // Check if it's a configuration error (missing env vars)
      if (error.message.includes('STRIPE_SECRET_KEY') || 
          error.message.includes('environment variable')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Server configuration error: Missing Stripe configuration' 
          },
          { status: 500 }
        )
      }

      // Other validation errors
      if (error.message.includes('required') || 
          error.message.includes('Missing') || 
          error.message.includes('invalid')) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message 
          },
          { status: 400 }
        )
      }
    }

    // Generic server error
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error: Failed to create checkout session' 
      },
      { status: 500 }
    )
  }
})

