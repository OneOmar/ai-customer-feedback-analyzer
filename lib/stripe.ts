import Stripe from 'stripe'

/**
 * Stripe client configuration
 * Handles payment processing and subscription management
 */

// Validate API key
const apiKey = process.env.STRIPE_SECRET_KEY

if (!apiKey) {
  throw new Error('Missing Stripe secret key')
}

/**
 * Stripe client instance (server-side only)
 * Use this for creating checkout sessions, managing subscriptions, etc.
 */
export const stripe = new Stripe(apiKey, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

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

