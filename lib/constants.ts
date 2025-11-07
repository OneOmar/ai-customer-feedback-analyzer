/**
 * Application-wide constants
 * Centralized configuration values
 */

/**
 * Subscription tier limits
 */
export const TIER_LIMITS = {
  FREE: {
    maxFeedback: 100,
    maxUploadsPerMonth: 5,
    maxFileSize: 1024 * 1024, // 1MB
  },
  PRO: {
    maxFeedback: 1000,
    maxUploadsPerMonth: 50,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  ENTERPRISE: {
    maxFeedback: Infinity,
    maxUploadsPerMonth: Infinity,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
} as const

/**
 * Sentiment categories and their color codes
 */
export const SENTIMENT_COLORS = {
  positive: '#10b981', // green
  negative: '#ef4444', // red
  neutral: '#6b7280', // gray
} as const

/**
 * CSV upload configuration
 */
export const CSV_CONFIG = {
  allowedExtensions: ['.csv', '.txt'],
  requiredColumns: ['feedback', 'content', 'text'], // At least one of these
  maxRows: 10000,
  encoding: 'utf-8',
} as const

/**
 * API rate limits
 */
export const RATE_LIMITS = {
  FREE: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
  },
  PRO: {
    requestsPerMinute: 50,
    requestsPerHour: 1000,
  },
  ENTERPRISE: {
    requestsPerMinute: 200,
    requestsPerHour: 10000,
  },
} as const

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  UPLOAD: '/dashboard/upload',
  ANALYTICS: '/dashboard/analytics',
  SETTINGS: '/dashboard/settings',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  PRICING: '/pricing',
} as const

