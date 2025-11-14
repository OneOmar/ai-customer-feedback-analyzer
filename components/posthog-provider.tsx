'use client'

import { usePostHog } from '@/lib/analytics'
import { useEffect } from 'react'

/**
 * PostHog Provider Component
 * 
 * Initializes PostHog analytics in a client component.
 * Add this to your root layout to enable PostHog tracking.
 * 
 * Usage:
 * ```tsx
 * // In app/layout.tsx
 * import { PostHogProvider } from '@/components/posthog-provider'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <PostHogProvider />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function PostHogProvider() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  
  usePostHog(apiKey)

  // PostHog is automatically exposed to window.posthog after initialization
  // No console logging needed in production

  return null
}

