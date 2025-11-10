/**
 * Billing and Quota Management
 * 
 * Handles subscription plans, usage tracking, and quota enforcement
 * for the AI Feedback Analyzer application.
 * 
 * Plans:
 * - FREE: 50 analyses/month
 * - PRO: 2,000 analyses/month
 * - BUSINESS: 10,000 analyses/month
 * 
 * Usage:
 * ```typescript
 * // Check if user can analyze feedback
 * const quota = await checkQuota(userId)
 * if (!quota.allowed) {
 *   return NextResponse.json({ error: 'Quota exceeded' }, { status: 429 })
 * }
 * 
 * // After successful analysis
 * await incrementUsage(userId)
 * ```
 */

import { createServerClient } from '@/lib/supabase'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Subscription plan types
 */
export type PlanType = 'free' | 'pro' | 'business'

/**
 * Plan configuration with limits and features
 */
export interface PlanConfig {
  name: string
  monthlyAnalyses: number
  maxFeedbackStorage: number
  features: string[]
  priceMonthly: number
  stripePriceId?: string
}

/**
 * User subscription information
 */
export interface Subscription {
  id: string
  user_id: string
  plan: PlanType
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Usage tracking for billing period
 */
export interface Usage {
  id: string
  user_id: string
  period_start: string
  period_end: string
  analyses_count: number
  feedback_count: number
  created_at: string
  updated_at: string
}

/**
 * Quota check result
 */
export interface QuotaResult {
  allowed: boolean
  remaining: number
  used: number
  limit: number
  plan: PlanType
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'none'
  resetsAt: Date
}

// ============================================================================
// PLAN CONFIGURATIONS
// ============================================================================

/**
 * Available subscription plans and their limits
 */
export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    monthlyAnalyses: 50,
    maxFeedbackStorage: 500,
    features: [
      'Up to 50 AI analyses per month',
      'Basic sentiment analysis',
      'CSV upload',
      'Basic charts and analytics',
      'Email support'
    ],
    priceMonthly: 0,
  },
  pro: {
    name: 'Pro',
    monthlyAnalyses: 2000,
    maxFeedbackStorage: 10000,
    features: [
      'Up to 2,000 AI analyses per month',
      'Advanced sentiment analysis',
      'Topic extraction',
      'Bulk CSV upload (up to 10MB)',
      'Advanced analytics and charts',
      'Export reports (PDF/CSV)',
      'Priority email support',
      'API access'
    ],
    priceMonthly: 29,
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO, // Set in .env.local
  },
  business: {
    name: 'Business',
    monthlyAnalyses: 10000,
    maxFeedbackStorage: 100000,
    features: [
      'Up to 10,000 AI analyses per month',
      'Enterprise sentiment analysis',
      'Advanced topic modeling',
      'Unlimited CSV upload size',
      'Custom analytics dashboards',
      'White-label reports',
      'Dedicated support',
      'API access with higher limits',
      'Custom integrations',
      'Team collaboration'
    ],
    priceMonthly: 99,
    stripePriceId: process.env.STRIPE_PRICE_ID_BUSINESS, // Set in .env.local
  },
}

// ============================================================================
// PLAN LIMITS
// ============================================================================

/**
 * Get monthly analysis limit for a plan
 * 
 * @param plan - Plan type ('free', 'pro', or 'business')
 * @returns Monthly analysis limit for the plan
 * 
 * @example
 * ```typescript
 * const freeLimit = getPlanLimits('free') // Returns 50
 * const proLimit = getPlanLimits('pro') // Returns 2000
 * const businessLimit = getPlanLimits('business') // Returns 10000
 * ```
 */
export function getPlanLimits(plan: PlanType): number {
  return PLANS[plan].monthlyAnalyses
}

// ============================================================================
// QUOTA CHECKING
// ============================================================================

/**
 * Quota check result for checkUserQuota
 */
export interface UserQuotaResult {
  allowed: boolean
  remaining: number
  plan: PlanType
  status?: 'active' | 'cancelled' | 'past_due' | 'trialing'
}

/**
 * Check user quota for AI analysis
 * 
 * Reads subscription from Supabase, detects plan, and reads usage for current billing period.
 * Returns a simplified result with allowed status, remaining quota, and plan.
 * 
 * @param userId - Clerk user ID
 * @returns UserQuotaResult with allowed status, remaining quota, and plan
 * 
 * @example
 * ```typescript
 * // In an API route
 * import { checkUserQuota, incrementUsage } from '@/lib/billing'
 * 
 * export async function POST(req: Request) {
 *   const { userId } = await auth()
 *   
 *   // Check quota before processing
 *   const quota = await checkUserQuota(userId!)
 *   
 *   if (!quota.allowed) {
 *     return NextResponse.json({
 *       error: 'Quota exceeded',
 *       message: `You have ${quota.remaining} analyses remaining on your ${quota.plan} plan.`
 *     }, { status: 429 })
 *   }
 *   
 *   // Perform AI analysis...
 *   const result = await analyzeWithAI(feedbackText)
 *   
 *   // Increment usage after success
 *   await incrementUsage(userId!)
 *   
 *   return NextResponse.json({ 
 *     success: true,
 *     data: result,
 *     quota: {
 *       remaining: quota.remaining - 1
 *     }
 *   })
 * }
 * ```
 */
export async function checkUserQuota(userId: string): Promise<UserQuotaResult> {
  try {
    const supabase = createServerClient()

    // Read subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If no subscription exists, create a free one
    if (subError || !subscription) {
      const newSub = await createFreeSubscription(userId)
      const limit = getPlanLimits('free')
      return {
        allowed: true,
        remaining: limit,
        plan: 'free',
        status: 'active',
      }
    }

    // Detect plan from subscription
    const plan = subscription.plan as PlanType
    const limit = getPlanLimits(plan)

    // Get current billing period dates
    const periodStart = new Date(subscription.current_period_start)
    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()

    // Check if we're past the billing period (should be handled by webhook, but handle here too)
    if (now > periodEnd) {
      // Period expired - usage should be reset by webhook, but return fresh quota
      return {
        allowed: true,
        remaining: limit,
        plan,
        status: subscription.status,
      }
    }

    // Read usage for current billing period
    const { data: usage, error: usageError } = await supabase
      .from('usage')
      .select('analyses_count')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .single()

    const used = usage?.analyses_count || 0
    const remaining = Math.max(0, limit - used)
    
    // User is allowed if they have remaining quota and subscription is active or trialing
    const allowed = remaining > 0 && (subscription.status === 'active' || subscription.status === 'trialing')

    return {
      allowed,
      remaining,
      plan,
      status: subscription.status,
    }

  } catch (error) {
    console.error('Error checking user quota:', error)
    
    // On error, return restrictive result
    return {
      allowed: false,
      remaining: 0,
      plan: 'free',
      status: 'active',
    }
  }
}

/**
 * Check if user has quota remaining for AI analysis
 * 
 * Queries the subscriptions and usage tables to determine:
 * - Current plan type and status
 * - Usage in current billing period
 * - Remaining quota
 * 
 * @param userId - Clerk user ID
 * @returns QuotaResult with allowed status and usage details
 * 
 * @example
 * ```typescript
 * // In an API route (app/api/analyze/route.ts)
 * import { checkQuota, incrementUsage } from '@/lib/billing'
 * 
 * export async function POST(req: Request) {
 *   const { userId } = await auth()
 *   
 *   // Check quota before processing
 *   const quota = await checkQuota(userId!)
 *   
 *   if (!quota.allowed) {
 *     return NextResponse.json({
 *       error: 'Quota exceeded',
 *       message: `You've used ${quota.used}/${quota.limit} analyses this month.`,
 *       plan: quota.plan,
 *       resetsAt: quota.resetsAt
 *     }, { status: 429 })
 *   }
 *   
 *   // Perform AI analysis...
 *   const result = await analyzeWithAI(feedbackText)
 *   
 *   // Increment usage after success
 *   await incrementUsage(userId!)
 *   
 *   return NextResponse.json({ 
 *     success: true,
 *     data: result,
 *     quota: {
 *       remaining: quota.remaining - 1
 *     }
 *   })
 * }
 * ```
 */
export async function checkQuota(userId: string): Promise<QuotaResult> {
  try {
    const supabase = createServerClient()

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If no subscription exists, create a free one
    if (subError || !subscription) {
      const newSub = await createFreeSubscription(userId)
      return {
        allowed: true,
        remaining: PLANS.free.monthlyAnalyses,
        used: 0,
        limit: PLANS.free.monthlyAnalyses,
        plan: 'free',
        status: 'active',
        resetsAt: new Date(newSub.current_period_end)
      }
    }

    // Get current billing period dates
    const periodStart = new Date(subscription.current_period_start)
    const periodEnd = new Date(subscription.current_period_end)
    const now = new Date()

    // Check if we're past the billing period
    if (now > periodEnd) {
      // Period expired - reset usage
      await resetUsageForNewPeriod(userId, subscription.plan)
      
      return {
        allowed: true,
        remaining: PLANS[subscription.plan as PlanType].monthlyAnalyses,
        used: 0,
        limit: PLANS[subscription.plan as PlanType].monthlyAnalyses,
        plan: subscription.plan,
        status: subscription.status,
        resetsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    }

    // Get usage for current period
    const { data: usage, error: usageError } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .single()

    const used = usage?.analyses_count || 0
    const limit = PLANS[subscription.plan as PlanType].monthlyAnalyses
    const remaining = Math.max(0, limit - used)
    const allowed = remaining > 0 && subscription.status === 'active'

    return {
      allowed,
      remaining,
      used,
      limit,
      plan: subscription.plan,
      status: subscription.status,
      resetsAt: periodEnd
    }

  } catch (error) {
    console.error('Error checking quota:', error)
    
    // On error, return restrictive result
    return {
      allowed: false,
      remaining: 0,
      used: 0,
      limit: 0,
      plan: 'free',
      status: 'none',
      resetsAt: new Date()
    }
  }
}

/**
 * Increment usage count for the current billing period
 * 
 * Increments analyses_count by 1 for the user's current billing period.
 * Uses upsert to create or update the usage record.
 * Safe to call multiple times.
 * 
 * @param userId - Clerk user ID
 * @returns Success boolean
 * 
 * @example
 * ```typescript
 * // After successful AI analysis
 * await incrementUsage(userId)
 * ```
 */
export async function incrementUsage(userId: string): Promise<boolean> {
  try {
    const supabase = createServerClient()

    // Get subscription to determine period
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('current_period_start, current_period_end')
      .eq('user_id', userId)
      .single()

    if (!subscription) {
      console.error('No subscription found for user:', userId)
      return false
    }

    const periodStart = subscription.current_period_start
    const periodEnd = subscription.current_period_end

    // Try to get existing usage record
    const { data: existingUsage } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', periodStart)
      .lte('period_end', periodEnd)
      .single()

    if (existingUsage) {
      // Update existing record - increment analyses_count by 1
      const { error } = await supabase
        .from('usage')
        .update({ 
          analyses_count: existingUsage.analyses_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUsage.id)

      if (error) {
        console.error('Error updating usage:', error)
        return false
      }
    } else {
      // Create new usage record with analyses_count = 1
      const { error } = await supabase
        .from('usage')
        .insert({
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          analyses_count: 1,
          feedback_count: 0
        })

      if (error) {
        console.error('Error creating usage:', error)
        return false
      }
    }

    return true

  } catch (error) {
    console.error('Error incrementing usage:', error)
    return false
  }
}

/**
 * Increment feedback count for storage limits
 * 
 * @param userId - Clerk user ID
 * @param count - Number of feedback items added (default: 1)
 * @returns Success boolean
 */
export async function incrementFeedbackCount(
  userId: string,
  count: number = 1
): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('current_period_start, current_period_end')
      .eq('user_id', userId)
      .single()

    if (!subscription) return false

    const periodStart = subscription.current_period_start
    const periodEnd = subscription.current_period_end

    const { data: existingUsage } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', periodStart)
      .lte('period_end', periodEnd)
      .single()

    if (existingUsage) {
      await supabase
        .from('usage')
        .update({ 
          feedback_count: existingUsage.feedback_count + count,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUsage.id)
    } else {
      await supabase
        .from('usage')
        .insert({
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          analyses_count: 0,
          feedback_count: count
        })
    }

    return true
  } catch (error) {
    console.error('Error incrementing feedback count:', error)
    return false
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Create a free subscription for a new user
 * 
 * @param userId - Clerk user ID
 * @returns Subscription record
 */
async function createFreeSubscription(userId: string): Promise<Subscription> {
  const supabase = createServerClient()
  
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan: 'free',
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create free subscription: ${error.message}`)
  }

  return data as Subscription
}

/**
 * Reset usage counters for a new billing period
 * 
 * @param userId - Clerk user ID
 * @param plan - Current plan type
 */
async function resetUsageForNewPeriod(
  userId: string,
  plan: PlanType
): Promise<void> {
  const supabase = createServerClient()
  
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Update subscription period
  await supabase
    .from('subscriptions')
    .update({
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString()
    })
    .eq('user_id', userId)

  // Create new usage record for new period
  await supabase
    .from('usage')
    .insert({
      user_id: userId,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      analyses_count: 0,
      feedback_count: 0
    })
}

/**
 * Get user's subscription details
 * 
 * @param userId - Clerk user ID
 * @returns Subscription or null
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Subscription
  } catch (error) {
    console.error('Error getting subscription:', error)
    return null
  }
}

/**
 * Update user's subscription plan
 * 
 * @param userId - Clerk user ID
 * @param plan - New plan type
 * @param stripeSubscriptionId - Stripe subscription ID (optional)
 * @returns Success boolean
 */
export async function updateSubscription(
  userId: string,
  plan: PlanType,
  stripeSubscriptionId?: string
): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const updates: any = {
      plan,
      updated_at: new Date().toISOString()
    }

    if (stripeSubscriptionId) {
      updates.stripe_subscription_id = stripeSubscriptionId
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating subscription:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating subscription:', error)
    return false
  }
}

/**
 * Get usage statistics for the current period
 * 
 * @param userId - Clerk user ID
 * @returns Usage record or null
 */
export async function getCurrentUsage(userId: string): Promise<Usage | null> {
  try {
    const supabase = createServerClient()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('current_period_start, current_period_end')
      .eq('user_id', userId)
      .single()

    if (!subscription) return null

    const { data: usage } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', subscription.current_period_start)
      .lte('period_end', subscription.current_period_end)
      .single()

    return usage as Usage | null
  } catch (error) {
    console.error('Error getting current usage:', error)
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user can upload feedback based on storage quota
 * 
 * @param userId - Clerk user ID
 * @param count - Number of feedback items to add
 * @returns Whether upload is allowed
 */
export async function canUploadFeedback(
  userId: string,
  count: number = 1
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const supabase = createServerClient()

    // Get subscription
    const subscription = await getSubscription(userId)
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' }
    }

    // Get total feedback count
    const { count: totalCount, error } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) {
      return { allowed: false, reason: 'Error checking feedback count' }
    }

    const limit = PLANS[subscription.plan as PlanType].maxFeedbackStorage
    const newTotal = (totalCount || 0) + count

    if (newTotal > limit) {
      return { 
        allowed: false, 
        reason: `Storage limit exceeded. Plan allows ${limit} feedback items, you have ${totalCount}.` 
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking upload quota:', error)
    return { allowed: false, reason: 'Error checking quota' }
  }
}

/**
 * Get formatted quota information for display
 * 
 * @param userId - Clerk user ID
 * @returns Formatted quota information
 */
export async function getQuotaDisplay(userId: string): Promise<{
  plan: string
  used: number
  limit: number
  percentage: number
  resetsAt: string
}> {
  const quota = await checkQuota(userId)
  
  return {
    plan: PLANS[quota.plan].name,
    used: quota.used,
    limit: quota.limit,
    percentage: quota.limit > 0 ? Math.round((quota.used / quota.limit) * 100) : 0,
    resetsAt: quota.resetsAt.toLocaleDateString()
  }
}

