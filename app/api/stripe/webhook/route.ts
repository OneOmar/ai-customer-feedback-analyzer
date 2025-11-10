import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import type { PlanType } from '@/lib/billing'

/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events for subscription management.
 * This endpoint is public (no auth) as it's called by Stripe servers.
 * 
 * Events Handled:
 * - checkout.session.completed: When a checkout session is completed
 * - customer.subscription.created: When a subscription is created
 * - customer.subscription.updated: When a subscription is updated
 * - customer.subscription.deleted: When a subscription is cancelled/deleted
 * 
 * Required Environment Variables:
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe Dashboard
 * - STRIPE_SECRET_KEY: Stripe API secret key
 * 
 * Security:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Returns 400 if signature verification fails
 * - Logs all errors for debugging
 */

/**
 * Map Stripe price ID to plan type
 * @param priceId - Stripe price ID
 * @returns Plan type ('free', 'pro', or 'business')
 */
function getPlanFromPriceId(priceId: string): PlanType {
  const proPriceId = process.env.STRIPE_PRICE_ID_PRO
  const businessPriceId = process.env.STRIPE_PRICE_ID_BUSINESS

  if (priceId === proPriceId) {
    return 'pro'
  }
  if (priceId === businessPriceId) {
    return 'business'
  }
  
  // Default to free if price ID doesn't match known plans
  // This handles edge cases or new plans
  console.warn(`Unknown price ID: ${priceId}, defaulting to 'free' plan`)
  return 'free'
}

/**
 * Map Stripe subscription status to our status format
 * @param stripeStatus - Stripe subscription status
 * @returns Our subscription status format
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): 'active' | 'cancelled' | 'past_due' | 'trialing' {
  switch (stripeStatus) {
    case 'active':
      return 'active'
    case 'canceled':
    case 'unpaid':
      return 'cancelled'
    case 'past_due':
      return 'past_due'
    case 'trialing':
      return 'trialing'
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
    default:
      // Default to cancelled for unknown statuses
      return 'cancelled'
  }
}

/**
 * Upsert subscription into Supabase
 * @param subscriptionData - Subscription data to upsert
 */
async function upsertSubscription(subscriptionData: {
  user_id: string
  plan: PlanType
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  stripe_customer_id: string | null
  stripe_subscription_id: string
  current_period_start: string
  current_period_end: string
}): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: subscriptionData.user_id,
          plan: subscriptionData.plan,
          status: subscriptionData.status,
          stripe_customer_id: subscriptionData.stripe_customer_id,
          stripe_subscription_id: subscriptionData.stripe_subscription_id,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id', // Upsert based on user_id
        }
      )

    if (error) {
      console.error('Error upserting subscription to Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception in upsertSubscription:', error)
    return false
  }
}

/**
 * Handle checkout.session.completed event
 * This is triggered when a customer completes checkout
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<boolean> {
  try {
    const userId = session.metadata?.userId
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

    if (!userId) {
      console.error('Missing userId in checkout session metadata:', session.id)
      return false
    }

    if (!subscriptionId) {
      console.error('Missing subscription ID in checkout session:', session.id)
      return false
    }

    // Retrieve full subscription object from Stripe to get plan details
    const stripe = getStripeClient()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Get price ID from subscription (first item)
    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) {
      console.error('Missing price ID in subscription:', subscriptionId)
      return false
    }

    const plan = getPlanFromPriceId(priceId)
    const status = mapStripeStatus(subscription.status)

    // Upsert subscription
    const success = await upsertSubscription({
      user_id: userId,
      plan,
      status,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    if (success) {
      console.log(`Subscription created/updated for user ${userId}: ${plan} plan, status: ${status}`)
    }

    return success
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error)
    return false
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<boolean> {
  try {
    // Get customer ID
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id

    if (!customerId) {
      console.error('Missing customer ID in subscription:', subscription.id)
      return false
    }

    // For subscription.created, we need to get userId from customer metadata
    // or from a previous checkout session. Since we store userId in checkout session metadata,
    // we'll need to retrieve the customer to check metadata, or use the subscription metadata.
    // For now, we'll try to get it from subscription metadata (if set) or customer metadata.
    const stripe = getStripeClient()
    const customer = await stripe.customers.retrieve(customerId)
    
    const userId = 
      subscription.metadata?.userId || 
      (typeof customer !== 'deleted' ? customer.metadata?.userId : null)

    if (!userId) {
      console.error('Missing userId in subscription or customer metadata:', subscription.id)
      // Try to find existing subscription by customer_id
      const supabase = createServerClient()
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!existing) {
        console.error('Cannot find userId for subscription:', subscription.id)
        return false
      }

      // Use existing user_id
      const priceId = subscription.items.data[0]?.price.id
      if (!priceId) {
        console.error('Missing price ID in subscription:', subscription.id)
        return false
      }

      const plan = getPlanFromPriceId(priceId)
      const status = mapStripeStatus(subscription.status)

      return await upsertSubscription({
        user_id: existing.user_id,
        plan,
        status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
    }

    // Get price ID from subscription
    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) {
      console.error('Missing price ID in subscription:', subscription.id)
      return false
    }

    const plan = getPlanFromPriceId(priceId)
    const status = mapStripeStatus(subscription.status)

    return await upsertSubscription({
      user_id: userId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Error handling customer.subscription.created:', error)
    return false
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<boolean> {
  try {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id

    if (!customerId) {
      console.error('Missing customer ID in subscription:', subscription.id)
      return false
    }

    // Try to get userId from subscription metadata, customer metadata, or existing record
    const stripe = getStripeClient()
    const customer = await stripe.customers.retrieve(customerId)
    
    const userId = 
      subscription.metadata?.userId || 
      (typeof customer !== 'deleted' ? customer.metadata?.userId : null)

    // If no userId in metadata, look up existing subscription
    if (!userId) {
      const supabase = createServerClient()
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (!existing) {
        console.error('Cannot find existing subscription for update:', subscription.id)
        return false
      }

      const priceId = subscription.items.data[0]?.price.id
      if (!priceId) {
        console.error('Missing price ID in subscription:', subscription.id)
        return false
      }

      const plan = getPlanFromPriceId(priceId)
      const status = mapStripeStatus(subscription.status)

      return await upsertSubscription({
        user_id: existing.user_id,
        plan,
        status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
    }

    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) {
      console.error('Missing price ID in subscription:', subscription.id)
      return false
    }

    const plan = getPlanFromPriceId(priceId)
    const status = mapStripeStatus(subscription.status)

    return await upsertSubscription({
      user_id: userId,
      plan,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error)
    return false
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<boolean> {
  try {
    // Update subscription status to cancelled
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id

    if (!customerId) {
      console.error('Missing customer ID in subscription:', subscription.id)
      return false
    }

    // Look up existing subscription to get user_id
    const supabase = createServerClient()
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (!existing) {
      console.error('Cannot find existing subscription for deletion:', subscription.id)
      return false
    }

    // Get price ID to determine plan (or use existing plan from database)
    const priceId = subscription.items.data[0]?.price.id
    const plan = priceId ? getPlanFromPriceId(priceId) : 'free'

    // Update status to cancelled
    return await upsertSubscription({
      user_id: existing.user_id,
      plan,
      status: 'cancelled',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error)
    return false
  }
}

/**
 * POST handler for Stripe webhooks
 * 
 * In Next.js App Router, we read the raw body directly from the request.
 * No bodyParser configuration needed - we use req.text() to get raw body.
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body as text (required for Stripe signature verification)
    // Next.js App Router doesn't parse the body automatically for webhooks
    const body = await req.text()
    
    // Get Stripe signature from headers
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return NextResponse.json(
        { error: 'Server configuration error: Missing webhook secret' },
        { status: 500 }
      )
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event
    try {
      const stripe = getStripeClient()
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle different event types
    let success = false

    switch (event.type) {
      case 'checkout.session.completed':
        success = await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case 'customer.subscription.created':
        success = await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        )
        break

      case 'customer.subscription.updated':
        success = await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break

      case 'customer.subscription.deleted':
        success = await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
        // Return 200 for unhandled events (Stripe expects acknowledgment)
        return NextResponse.json({ received: true })
    }

    if (!success) {
      console.error(`Failed to process event: ${event.type}`)
      return NextResponse.json(
        { error: `Failed to process event: ${event.type}` },
        { status: 400 }
      )
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    )
  }
}

/**
 * Next.js route config - disable body parsing to get raw body
 * In Next.js 13+ App Router, we use the route segment config
 */
export const runtime = 'nodejs'

// Note: In Next.js App Router, we don't need bodyParser config.
// We read the raw body directly using req.text() in the handler above.

