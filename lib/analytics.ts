/**
 * Analytics Tracking Utility
 * 
 * Provides functions to track user events for analytics and experiments
 * 
 * Usage:
 * ```typescript
 * import { trackEvent } from '@/lib/analytics'
 * 
 * // Track an event
 * await trackEvent('upgrade_cta_impression', { plan: 'free' })
 * 
 * // Track a click
 * await trackEvent('upgrade_cta_click', { source: 'dashboard' })
 * ```
 */

/**
 * Track an analytics event
 * 
 * @param event - Event name (e.g., 'upgrade_cta_impression', 'upgrade_cta_click')
 * @param properties - Optional event properties
 * @returns Promise that resolves when event is tracked
 * 
 * @example
 * ```typescript
 * // Track upgrade CTA impression
 * await trackEvent('upgrade_cta_impression', {
 *   plan: 'free',
 *   location: 'dashboard',
 *   remaining_quota: 50
 * })
 * 
 * // Track upgrade CTA click
 * await trackEvent('upgrade_cta_click', {
 *   plan: 'free',
 *   source: 'dashboard',
 *   button_text: 'Upgrade to Pro'
 * })
 * ```
 */
export async function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    // Only track on client side
    if (typeof window === 'undefined') {
      return
    }

    // Send event to analytics API
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        properties,
      }),
    })
  } catch (error) {
    // Fail silently - don't break the app if analytics fails
    console.error('Failed to track event:', error)
  }
}

/**
 * Track upgrade CTA impression
 * 
 * @param plan - User's current plan
 * @param location - Where the CTA is shown (e.g., 'dashboard', 'home')
 * @param remaining - Remaining quota
 */
export async function trackUpgradeCTAImpression(
  plan: string,
  location: string,
  remaining?: number
): Promise<void> {
  await trackEvent('upgrade_cta_impression', {
    plan,
    location,
    remaining_quota: remaining,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track upgrade CTA click
 * 
 * @param plan - User's current plan
 * @param location - Where the CTA was clicked (e.g., 'dashboard', 'home')
 * @param buttonText - Text on the button that was clicked
 */
export async function trackUpgradeCTAClick(
  plan: string,
  location: string,
  buttonText?: string
): Promise<void> {
  await trackEvent('upgrade_cta_click', {
    plan,
    location,
    button_text: buttonText,
    timestamp: new Date().toISOString(),
  })
}

