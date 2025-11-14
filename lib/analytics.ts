/**
 * PostHog Analytics Wrapper
 * 
 * Provides a simple wrapper around PostHog for analytics tracking.
 * Ensures GDPR compliance by not sending sensitive data (raw feedback texts).
 * 
 * Installation:
 *   npm install posthog-js
 * 
 * Usage in client layout:
 * ```typescript
 * 'use client'
 * import { initPostHog } from '@/lib/analytics'
 * import { useEffect } from 'react'
 * 
 * useEffect(() => {
 *   initPostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!)
 * }, [])
 * ```
 * 
 * Usage for tracking events:
 * ```typescript
 * import { trackEvent } from '@/lib/analytics'
 * 
 * await trackEvent(userId, 'feedback_analyzed', {
 *   feedback_count: 5,
 *   sentiment_distribution: { positive: 3, negative: 1, neutral: 1 }
 * })
 * ```
 * 
 * GDPR Compliance:
 * - Users can opt-out via PostHog's built-in opt-out mechanism
 * - We never send raw feedback text content (only metadata like counts, sizes)
 * - All sensitive data is sanitized before sending
 * - See PostHog documentation for opt-out: https://posthog.com/docs/privacy/opting-out
 */

'use client'

import { useEffect, useRef } from 'react'

// PostHog type definitions (will be available after installing posthog-js)
type PostHog = {
  init: (apiKey: string, options?: Record<string, unknown>) => void
  capture: (eventName: string, properties?: Record<string, unknown>) => void
  identify: (userId: string, properties?: Record<string, unknown>) => void
  reset: () => void
  opt_out_capturing: () => void
  opt_in_capturing: () => void
  has_opted_out_capturing: () => boolean
}

// Extend Window interface to include posthog
declare global {
  interface Window {
    posthog?: PostHog
  }
}

// Global PostHog instance
let posthogInstance: PostHog | null = null
let isInitialized = false

/**
 * Initialize PostHog analytics
 * 
 * Call this once in your client layout component (useEffect).
 * 
 * @param apiKey - PostHog project API key (from NEXT_PUBLIC_POSTHOG_KEY env var)
 * 
 * @example
 * ```typescript
 * 'use client'
 * import { initPostHog } from '@/lib/analytics'
 * import { useEffect } from 'react'
 * 
 * export default function ClientLayout() {
 *   useEffect(() => {
 *     const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
 *     if (apiKey) {
 *       initPostHog(apiKey)
 *     }
 *   }, [])
 *   
 *   return <div>...</div>
 * }
 * ```
 * 
 * GDPR Note: PostHog respects user opt-out preferences. Users can opt-out
 * via PostHog's built-in mechanism or by calling posthog.opt_out_capturing().
 * See: https://posthog.com/docs/privacy/opting-out
 */
export function initPostHog(apiKey: string): void {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    return
  }

  // Prevent double initialization
  if (isInitialized) {
    return
  }

  // Validate API key format
  if (!apiKey || typeof apiKey !== 'string') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog: Invalid API key provided')
    }
    return
  }

  // Validate API key format (should start with phc_ for project API keys)
  if (!apiKey.startsWith('phc_') && !apiKey.startsWith('phx_')) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('PostHog: API key format appears invalid. Expected phc_ or phx_ prefix.')
    }
    return
  }

  try {
    // Dynamically import PostHog (lazy load to avoid SSR issues)
    import('posthog-js').then((posthogModule) => {
      const posthog = posthogModule.default
      
      // Determine API host - auto-detect based on API key or use env var
      // PostHog US: https://app.posthog.com or https://us.i.posthog.com
      // PostHog EU: https://eu.posthog.com
      const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
      
      // Initialize PostHog
      posthog.init(apiKey, {
        api_host: apiHost,
        // Enable autocapture for better insights (can be disabled for GDPR)
        autocapture: true,
        // Capture pageviews automatically
        capture_pageview: true,
        // Respect user opt-out preferences
        opt_out_capturing_by_default: false,
        // Disable loading external dependencies that cause 404 errors
        // This prevents the config.js 404 error
        loaded: (ph) => {
          // Check if user has opted out
          if (ph.has_opted_out_capturing()) {
            return
          }
          posthogInstance = ph as unknown as PostHog
          isInitialized = true
          
          // Explicitly expose PostHog to window for debugging/console access
          // PostHog should do this automatically, but we ensure it's available
          if (typeof window !== 'undefined') {
            // @ts-expect-error - posthog-js types
            window.posthog = ph
          }
        },
        // Handle initialization errors
        _capture_metrics: false, // Disable metrics to avoid 401 errors during init
        // Disable feature flags if causing 401 errors (can be re-enabled later)
        advanced_disable_feature_flags_on_first_load: true,
      })
    }).catch((error) => {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('PostHog: Failed to load posthog-js module:', error)
      }
    })
  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('PostHog: Failed to initialize:', error)
    }
  }
}

/**
 * Sanitize event properties to remove sensitive data
 * 
 * This function ensures we never send raw feedback text content.
 * Only metadata (counts, sizes, aggregated data) is allowed.
 * 
 * @param props - Event properties to sanitize
 * @returns Sanitized properties object
 */
function sanitizeProperties(props?: Record<string, unknown>): Record<string, unknown> {
  if (!props) {
    return {}
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    // Skip any properties that might contain raw text content
    if (
      key.toLowerCase().includes('text') ||
      key.toLowerCase().includes('content') ||
      key.toLowerCase().includes('message') ||
      key.toLowerCase().includes('feedback_text') ||
      key.toLowerCase().includes('raw')
    ) {
      // Replace with metadata instead
      if (typeof value === 'string') {
        sanitized[`${key}_length`] = value.length
        sanitized[`${key}_word_count`] = value.split(/\s+/).filter(Boolean).length
      }
      continue
    }

    // Allow metadata: numbers, booleans, arrays of strings (for topics), objects with counts
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number')) ||
      (typeof value === 'object' && value !== null && !Array.isArray(value))
    ) {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Track an analytics event with PostHog
 * 
 * Automatically sanitizes properties to ensure no sensitive data (raw feedback text)
 * is sent. Only metadata like counts, sizes, and aggregated data is included.
 * 
 * @param userId - User ID (Clerk user ID or other identifier)
 * @param eventName - Event name (e.g., 'feedback_analyzed', 'upgrade_clicked')
 * @param properties - Event properties (will be sanitized - no raw text allowed)
 * 
 * @example
 * ```typescript
 * // ✅ Good - only metadata
 * await trackEvent(userId, 'feedback_analyzed', {
 *   feedback_count: 5,
 *   sentiment_distribution: { positive: 3, negative: 1, neutral: 1 },
 *   average_sentiment_score: 0.75,
 *   topics: ['product quality', 'delivery']
 * })
 * 
 * // ❌ Bad - raw text will be sanitized
 * await trackEvent(userId, 'feedback_analyzed', {
 *   feedback_text: 'Great product!' // Will be converted to feedback_text_length: 13
 * })
 * ```
 * 
 * GDPR Note: This function respects user opt-out preferences. If a user has
 * opted out, events will not be sent. Users can opt-out via PostHog's UI or
 * by calling posthog.opt_out_capturing() in the browser console.
 */
export async function trackEvent(
  userId: string,
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  // Only track on client side
  if (typeof window === 'undefined') {
    return
  }

  // Wait for PostHog to be initialized
  if (!isInitialized || !posthogInstance) {
    return
  }

  try {
    // Check if user has opted out (GDPR compliance)
    // PostHog automatically respects opt-out preferences
    if (posthogInstance.has_opted_out_capturing()) {
      // User has opted out - don't track
      return
    }

    // Sanitize properties to remove any sensitive data (raw feedback text)
    const sanitizedProps = sanitizeProperties(properties)

    // Identify user first (if not already identified)
    posthogInstance.identify(userId, {
      // Add any user properties here (non-sensitive only)
      // Example: plan: 'pro', created_at: '2024-01-01'
    })

    // Capture the event with sanitized properties
    posthogInstance.capture(eventName, {
      ...sanitizedProps,
      // Add timestamp
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Fail silently - don't break the app if analytics fails
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to track event:', error)
    }
  }
}

/**
 * React hook for initializing PostHog in client components
 * 
 * Use this in your root layout or a client wrapper component.
 * 
 * @example
 * ```typescript
 * 'use client'
 * import { usePostHog } from '@/lib/analytics'
 * 
 * export default function ClientLayout({ children }) {
 *   usePostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!)
 *   return <>{children}</>
 * }
 * ```
 */
export function usePostHog(apiKey: string | undefined): void {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!apiKey || initializedRef.current) {
      return
    }

    initPostHog(apiKey)
    initializedRef.current = true
  }, [apiKey])
}

/**
 * Helper function to track feedback analysis events
 * 
 * Automatically sanitizes feedback data - only sends metadata, never raw text.
 * 
 * @param userId - User ID
 * @param metadata - Analysis metadata (counts, distributions, etc.)
 * 
 * @example
 * ```typescript
 * await trackFeedbackAnalysis(userId, {
 *   feedback_count: 10,
 *   sentiment_distribution: { positive: 7, negative: 2, neutral: 1 },
 *   average_sentiment_score: 0.82,
 *   topics_count: 5,
 *   plan: 'pro'
 * })
 * ```
 */
export async function trackFeedbackAnalysis(
  userId: string,
  metadata: {
    feedback_count?: number
    sentiment_distribution?: Record<string, number>
    average_sentiment_score?: number
    topics_count?: number
    plan?: string
    [key: string]: unknown
  }
): Promise<void> {
  await trackEvent(userId, 'feedback_analyzed', metadata)
}

/**
 * Helper function to track upgrade CTA events
 * 
 * @param userId - User ID
 * @param metadata - Event metadata
 */
export async function trackUpgradeCTA(
  userId: string,
  action: 'impression' | 'click',
  metadata?: {
    plan?: string
    location?: string
    remaining_quota?: number
    [key: string]: unknown
  }
): Promise<void> {
  await trackEvent(userId, `upgrade_cta_${action}`, metadata)
}

/**
 * Get PostHog instance (for debugging/console access)
 * 
 * Returns the PostHog instance if initialized, or null if not ready.
 * Use this instead of directly accessing window.posthog to handle timing.
 * 
 * @returns PostHog instance or null
 * 
 * @example
 * ```typescript
 * // In browser console
 * const posthog = getPostHogInstance()
 * if (posthog) {
 *   posthog.capture('test_event')
 * }
 * ```
 */
export function getPostHogInstance(): PostHog | null {
  if (typeof window === 'undefined') {
    return null
  }

  // Try window.posthog first (most reliable after initialization)
  if (window.posthog) {
    return window.posthog
  }

  // Fallback to module-level instance
  return posthogInstance
}
