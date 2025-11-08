import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Client Configuration for AI Feedback Analyzer
 * 
 * This module provides:
 * 1. Browser client (uses anon key, respects RLS)
 * 2. Server client (uses service role key, bypasses RLS)
 * 3. Typed helper functions for common database operations
 * 
 * Required Environment Variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (for browser/client-side)
 * - SUPABASE_SERVICE_ROLE_KEY (for server-side)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database schema types
 * These match the tables created in supabase/sql/init.sql
 */

export interface Feedback {
  id: string
  user_id: string
  source: string | null
  product_id: string | null
  username: string | null
  rating: number | null
  text: string
  created_at: string
  updated_at: string
  embedding: number[] | null
}

export interface FeedbackInsert {
  user_id: string
  text: string
  rating?: number | null
  source?: string | null
  product_id?: string | null
  username?: string | null
}

export interface FeedbackAnalysis {
  id: string
  feedback_id: string
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | null
  sentiment_score: number | null
  topics: string[] | null
  summary: string | null
  recommendation: string | null
  confidence_score: number | null
  created_at: string
  updated_at: string
}

export interface AnalysisInsert {
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed'
  sentiment_score?: number
  topics?: string[]
  summary?: string
  recommendation?: string
  confidence_score?: number
}

export interface Upload {
  id: string
  user_id: string
  filename: string
  file_size: number | null
  row_count: number | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface FeedbackWithAnalysis extends Feedback {
  feedback_analysis: FeedbackAnalysis | null
}

// ============================================================================
// CLIENT CREATORS
// ============================================================================

/**
 * Create a Supabase client for browser/client-side use
 * 
 * - Uses anon key (safe to expose)
 * - Respects Row Level Security (RLS)
 * - Automatically uses user's JWT token from auth
 * 
 * @returns Supabase client instance
 * 
 * @example
 * ```typescript
 * // In a Client Component
 * 'use client'
 * 
 * import { createBrowserClient } from '@/lib/supabase'
 * 
 * export function MyComponent() {
 *   const supabase = createBrowserClient()
 *   
 *   const fetchFeedback = async () => {
 *     const { data } = await supabase.from('feedback').select('*')
 *     console.log(data)
 *   }
 * }
 * ```
 */
export function createBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY required')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Create a Supabase client for server-side use
 * 
 * - Uses service role key (NEVER expose to client)
 * - Bypasses Row Level Security (RLS)
 * - Full admin access to database
 * - Use only in API Routes and Server Components
 * 
 * @returns Supabase client with admin privileges
 * 
 * @example
 * ```typescript
 * // In an API Route (app/api/feedback/route.ts)
 * import { createServerClient } from '@/lib/supabase'
 * import { NextResponse } from 'next/server'
 * 
 * export async function GET() {
 *   const supabase = createServerClient()
 *   const { data } = await supabase.from('feedback').select('*')
 *   return NextResponse.json(data)
 * }
 * ```
 */
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ============================================================================
// TYPED HELPER FUNCTIONS
// ============================================================================

/**
 * Insert feedback into the database
 * 
 * @param userId - Clerk user ID
 * @param text - Feedback text content
 * @param metadata - Optional metadata (rating, source, product_id, username)
 * @returns Inserted feedback record or null on error
 * 
 * @example
 * ```typescript
 * // In an API Route
 * import { insertFeedback } from '@/lib/supabase'
 * import { auth } from '@clerk/nextjs/server'
 * 
 * export async function POST(req: Request) {
 *   const { userId } = await auth()
 *   const { text, rating, source } = await req.json()
 *   
 *   const feedback = await insertFeedback(userId!, text, { rating, source })
 *   
 *   if (!feedback) {
 *     return NextResponse.json({ error: 'Failed to insert feedback' }, { status: 500 })
 *   }
 *   
 *   return NextResponse.json({ success: true, data: feedback })
 * }
 * ```
 */
export async function insertFeedback(
  userId: string,
  text: string,
  metadata: {
    rating?: number
    source?: string
    product_id?: string
    username?: string
  } = {}
): Promise<Feedback | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        text,
        rating: metadata.rating || null,
        source: metadata.source || null,
        product_id: metadata.product_id || null,
        username: metadata.username || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting feedback:', error)
      return null
    }

    return data as Feedback
  } catch (error) {
    console.error('Exception in insertFeedback:', error)
    return null
  }
}

/**
 * Insert analysis for a feedback entry
 * 
 * @param feedbackId - UUID of the feedback to analyze
 * @param analysis - Analysis data (sentiment, topics, summary, etc.)
 * @returns Inserted analysis record or null on error
 * 
 * @example
 * ```typescript
 * // After analyzing feedback with OpenAI
 * import { insertAnalysis } from '@/lib/supabase'
 * 
 * const analysis = await insertAnalysis(feedbackId, {
 *   sentiment: 'positive',
 *   sentiment_score: 0.85,
 *   topics: ['product quality', 'customer service'],
 *   summary: 'Customer is very satisfied',
 *   recommendation: 'Share with product team',
 *   confidence_score: 0.92
 * })
 * 
 * if (!analysis) {
 *   console.error('Failed to save analysis')
 * }
 * ```
 */
export async function insertAnalysis(
  feedbackId: string,
  analysis: AnalysisInsert
): Promise<FeedbackAnalysis | null> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('feedback_analysis')
      .insert({
        feedback_id: feedbackId,
        sentiment: analysis.sentiment || null,
        sentiment_score: analysis.sentiment_score || null,
        topics: analysis.topics || null,
        summary: analysis.summary || null,
        recommendation: analysis.recommendation || null,
        confidence_score: analysis.confidence_score || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting analysis:', error)
      return null
    }

    return data as FeedbackAnalysis
  } catch (error) {
    console.error('Exception in insertAnalysis:', error)
    return null
  }
}

/**
 * Get all feedback for a specific user
 * 
 * @param userId - Clerk user ID
 * @param options - Optional query options (limit, orderBy)
 * @returns Array of feedback records
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * import { getUserFeedback } from '@/lib/supabase'
 * import { auth } from '@clerk/nextjs/server'
 * 
 * export default async function DashboardPage() {
 *   const { userId } = await auth()
 *   const feedback = await getUserFeedback(userId!)
 *   
 *   return (
 *     <div>
 *       <h1>Your Feedback ({feedback.length})</h1>
 *       {feedback.map(f => <div key={f.id}>{f.text}</div>)}
 *     </div>
 *   )
 * }
 * ```
 */
export async function getUserFeedback(
  userId: string,
  options: {
    limit?: number
    orderBy?: 'created_at' | 'rating'
    ascending?: boolean
  } = {}
): Promise<Feedback[]> {
  try {
    const supabase = createServerClient()

    const { limit = 100, orderBy = 'created_at', ascending = false } = options

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order(orderBy, { ascending })
      .limit(limit)

    if (error) {
      console.error('Error fetching user feedback:', error)
      return []
    }

    return data as Feedback[]
  } catch (error) {
    console.error('Exception in getUserFeedback:', error)
    return []
  }
}

/**
 * Get recent feedback with their analysis
 * 
 * @param userId - Clerk user ID
 * @param limit - Maximum number of records to return (default: 20)
 * @returns Array of feedback with analysis data
 * 
 * @example
 * ```typescript
 * // In an API Route for analytics
 * import { getRecentAnalyses } from '@/lib/supabase'
 * import { NextResponse } from 'next/server'
 * 
 * export async function GET(req: Request) {
 *   const { searchParams } = new URL(req.url)
 *   const userId = searchParams.get('userId')
 *   
 *   const analyses = await getRecentAnalyses(userId!, 50)
 *   
 *   const sentimentCounts = analyses.reduce((acc, item) => {
 *     const sentiment = item.feedback_analysis?.sentiment || 'unknown'
 *     acc[sentiment] = (acc[sentiment] || 0) + 1
 *     return acc
 *   }, {} as Record<string, number>)
 *   
 *   return NextResponse.json({ analyses, sentimentCounts })
 * }
 * ```
 */
export async function getRecentAnalyses(
  userId: string,
  limit: number = 20
): Promise<FeedbackWithAnalysis[]> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        feedback_analysis (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching recent analyses:', error)
      return []
    }

    return data as unknown as FeedbackWithAnalysis[]
  } catch (error) {
    console.error('Exception in getRecentAnalyses:', error)
    return []
  }
}

/**
 * Update feedback with embedding vector
 * 
 * @param feedbackId - UUID of the feedback
 * @param embedding - Vector embedding array (1536 dimensions)
 * @returns Success boolean
 * 
 * @example
 * ```typescript
 * import { updateFeedbackEmbedding } from '@/lib/supabase'
 * import { openai } from '@/lib/openai'
 * 
 * // Generate embedding
 * const response = await openai.embeddings.create({
 *   model: 'text-embedding-3-small',
 *   input: feedbackText
 * })
 * 
 * const embedding = response.data[0].embedding
 * 
 * // Store in database
 * await updateFeedbackEmbedding(feedbackId, embedding)
 * ```
 */
export async function updateFeedbackEmbedding(
  feedbackId: string,
  embedding: number[]
): Promise<boolean> {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('feedback')
      .update({ embedding })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating embedding:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception in updateFeedbackEmbedding:', error)
    return false
  }
}

/**
 * Search for similar feedback using vector similarity
 * 
 * @param queryEmbedding - Query vector embedding
 * @param userId - Clerk user ID (optional, for filtering)
 * @param threshold - Similarity threshold (0-1, default: 0.7)
 * @param limit - Maximum results (default: 10)
 * @returns Array of similar feedback with similarity scores
 * 
 * @example
 * ```typescript
 * import { searchSimilarFeedback } from '@/lib/supabase'
 * import { openai } from '@/lib/openai'
 * 
 * // Get query embedding
 * const response = await openai.embeddings.create({
 *   model: 'text-embedding-3-small',
 *   input: 'product quality issues'
 * })
 * 
 * const queryEmbedding = response.data[0].embedding
 * 
 * // Search for similar feedback
 * const similar = await searchSimilarFeedback(queryEmbedding, userId, 0.7, 5)
 * console.log('Found', similar.length, 'similar feedback items')
 * ```
 */
export async function searchSimilarFeedback(
  queryEmbedding: number[],
  userId?: string,
  threshold: number = 0.7,
  limit: number = 10
): Promise<Array<{ id: string; text: string; similarity: number }>> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase.rpc('match_feedback', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: userId || null,
    })

    if (error) {
      console.error('Error searching similar feedback:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception in searchSimilarFeedback:', error)
    return []
  }
}

/**
 * Get aggregated sentiment statistics for a user
 * 
 * @param userId - Clerk user ID
 * @returns Sentiment breakdown and statistics
 * 
 * @example
 * ```typescript
 * import { getSentimentStats } from '@/lib/supabase'
 * 
 * const stats = await getSentimentStats(userId)
 * console.log('Positive:', stats.positive)
 * console.log('Negative:', stats.negative)
 * console.log('Average score:', stats.averageScore)
 * ```
 */
export async function getSentimentStats(userId: string): Promise<{
  positive: number
  negative: number
  neutral: number
  mixed: number
  total: number
  averageScore: number
}> {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        feedback_analysis (
          sentiment,
          sentiment_score
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching sentiment stats:', error)
      return { positive: 0, negative: 0, neutral: 0, mixed: 0, total: 0, averageScore: 0 }
    }

    const stats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
      total: data.length,
      averageScore: 0,
    }

    let scoreSum = 0
    let scoreCount = 0

    data.forEach((item: any) => {
      const analysis = item.feedback_analysis?.[0]
      if (analysis) {
        const sentiment = analysis.sentiment
        if (sentiment) {
          stats[sentiment as keyof typeof stats]++
        }
        if (analysis.sentiment_score !== null) {
          scoreSum += analysis.sentiment_score
          scoreCount++
        }
      }
    })

    stats.averageScore = scoreCount > 0 ? scoreSum / scoreCount : 0

    return stats
  } catch (error) {
    console.error('Exception in getSentimentStats:', error)
    return { positive: 0, negative: 0, neutral: 0, mixed: 0, total: 0, averageScore: 0 }
  }
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use createBrowserClient() instead
 * Legacy browser client instance
 * 
 * Note: This creates the client lazily to avoid environment variable
 * issues during module loading (e.g., in scripts that use dotenv)
 */
let _supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    if (!_supabaseInstance) {
      _supabaseInstance = createBrowserClient()
    }
    return (_supabaseInstance as any)[prop]
  }
})
