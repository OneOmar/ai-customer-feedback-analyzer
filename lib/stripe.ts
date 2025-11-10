import Stripe from 'stripe'

/**
 * Stripe client configuration
 * Handles payment processing and subscription management
 */

/**
 * Gets a configured Stripe client instance
 * 
 * Creates and returns a new Stripe client with the secret key from environment variables.
 * The client is configured with the latest API version and TypeScript support.
 * 
 * @returns {Stripe} A configured Stripe client instance
 * @throws {Error} If STRIPE_SECRET_KEY environment variable is not set
 * 
 * @example
 * ```typescript
 * const stripe = getStripeClient()
 * const customer = await stripe.customers.create({ email: 'user@example.com' })
 * ```
 */
export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY

  if (!apiKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  return new Stripe(apiKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  })
}

/**
 * Subscription information returned from Stripe
 */
export interface SubscriptionInfo {
  status: Stripe.Subscription.Status
  period_end: number
}

/**
 * Creates a Stripe checkout session for subscription
 * 
 * Creates a checkout session in subscription mode with the specified price ID.
 * The session includes user metadata and redirect URLs from environment variables.
 * 
 * @param {string} userId - The user ID to associate with the checkout session (stored in metadata)
 * @param {string} priceId - The Stripe price ID for the subscription
 * @returns {Promise<Stripe.Checkout.Session>} The created checkout session
 * @throws {Error} If required environment variables are missing or Stripe API call fails
 * 
 * @example
 * ```typescript
 * const session = await createCheckoutSession('user_123', 'price_abc123')
 * // Redirect user to session.url
 * ```
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string
): Promise<Stripe.Checkout.Session> {
  try {
    const stripe = getStripeClient()

    // Validate environment variables
    const successUrl = process.env.STRIPE_SUCCESS_URL
    const cancelUrl = process.env.STRIPE_CANCEL_URL

    if (!successUrl) {
      throw new Error('Missing STRIPE_SUCCESS_URL environment variable')
    }

    if (!cancelUrl) {
      throw new Error('Missing STRIPE_CANCEL_URL environment variable')
    }

    if (!userId) {
      throw new Error('User ID is required')
    }

    if (!priceId) {
      throw new Error('Price ID is required')
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return session
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe API error: ${error.message}`)
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to create checkout session: Unknown error')
  }
}

/**
 * Gets subscription information from Stripe
 * 
 * Retrieves a subscription from Stripe and returns its status and period end date.
 * This is useful for checking subscription status and renewal dates.
 * 
 * @param {string} subscriptionId - The Stripe subscription ID
 * @returns {Promise<SubscriptionInfo>} Object containing subscription status and period end timestamp
 * @throws {Error} If subscription ID is invalid or Stripe API call fails
 * 
 * @example
 * ```typescript
 * const info = await getSubscriptionInfo('sub_1234567890')
 * console.log(`Status: ${info.status}, Renews: ${new Date(info.period_end * 1000)}`)
 * ```
 */
export async function getSubscriptionInfo(
  subscriptionId: string
): Promise<SubscriptionInfo> {
  try {
    const stripe = getStripeClient()

    if (!subscriptionId) {
      throw new Error('Subscription ID is required')
    }

    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    return {
      status: subscription.status,
      period_end: subscription.current_period_end,
    }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === 'resource_missing') {
        throw new Error(`Subscription not found: ${subscriptionId}`)
      }
      throw new Error(`Stripe API error: ${error.message}`)
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to get subscription info: Unknown error')
  }
}

/**
 * Subscription tier configuration
 * Define your pricing tiers here
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    maxFeedback: 100,
    features: ['Basic sentiment analysis', 'CSV upload', 'Basic charts'],
  },
  PRO: {
    name: 'Pro',
    priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
    maxFeedback: 1000,
    features: ['Advanced sentiment analysis', 'Bulk upload', 'Advanced analytics', 'Export reports'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: 'price_enterprise_monthly', // Replace with actual Stripe price ID
    maxFeedback: Infinity,
    features: ['Unlimited feedback', 'Custom AI models', 'API access', 'Priority support'],
  },
}

