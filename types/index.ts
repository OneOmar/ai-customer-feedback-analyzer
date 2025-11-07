/**
 * Type definitions for the AI Customer Feedback Analyzer
 * Centralized type definitions for better type safety and maintainability
 */

/**
 * Customer feedback entry
 */
export interface Feedback {
  id: string
  userId: string
  content: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  score?: number // Sentiment score from -1 to 1
  category?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * CSV upload data structure
 */
export interface CSVUpload {
  id: string
  userId: string
  filename: string
  rowCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
}

/**
 * Analysis result for a batch of feedback
 */
export interface AnalysisResult {
  totalFeedback: number
  sentimentBreakdown: {
    positive: number
    negative: number
    neutral: number
  }
  averageScore: number
  topCategories: Array<{
    category: string
    count: number
  }>
  trends: Array<{
    date: string
    positive: number
    negative: number
    neutral: number
  }>
}

/**
 * User subscription information
 */
export interface Subscription {
  userId: string
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'
  status: 'active' | 'cancelled' | 'past_due'
  currentPeriodEnd: Date
  feedbackCount: number
  feedbackLimit: number
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

