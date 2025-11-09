import { insertFeedback, insertAnalysis, updateFeedbackEmbedding } from '@/lib/supabase'
import { analyzeFeedback } from '@/lib/langchain'
import { embedText } from '@/lib/openai'

/**
 * Shared types for analysis
 */
export interface FeedbackItem {
  text: string
  rating?: number
  source?: string
  productId?: string
  username?: string
}

export interface ProcessedItemResult {
  index: number
  success: boolean
  feedbackId?: string
  analysis?: {
    sentiment: string
    sentiment_score?: number
    topics: string[]
    summary: string
    recommendation: string
  }
  error?: string
}

/**
 * Concurrency limiter - processes promises with a maximum concurrency limit
 */
async function processConcurrently<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    
    const promise = processor(item, index).then((result) => {
      results[index] = result
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Analyze feedback items in batch
 * 
 * This function handles the core analysis logic:
 * 1. Inserts feedback records into database
 * 2. Generates and stores embeddings
 * 3. Runs AI analysis with concurrency control
 * 4. Stores analysis results
 * 
 * @param userId - User ID from authentication
 * @param items - Array of feedback items to analyze
 * @returns Analysis results for each item
 */
export async function analyzeFeedbackBatch(
  userId: string,
  items: FeedbackItem[]
): Promise<{
  success: boolean
  message: string
  total: number
  succeeded: number
  failed: number
  warning?: string
  results: ProcessedItemResult[]
}> {
  const MAX_ITEMS_PER_BATCH = 200
  const EMBEDDING_CONCURRENCY = 5
  const ANALYSIS_CONCURRENCY = 3

  // Validate batch size
  if (items.length === 0) {
    throw new Error('Empty items array: at least one item is required')
  }

  if (items.length > MAX_ITEMS_PER_BATCH) {
    throw new Error(
      `Batch size exceeds maximum: ${items.length} items provided, maximum is ${MAX_ITEMS_PER_BATCH}`
    )
  }

  // Validate each item has required text field
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item.text || typeof item.text !== 'string' || item.text.trim().length === 0) {
      throw new Error(`Invalid item at index ${i}: text is required and must be a non-empty string`)
    }
  }

  // Results array to track per-item status
  const results: ProcessedItemResult[] = []

  // Step 1: Insert all feedback records into database first
  console.log(`Inserting ${items.length} feedback records...`)
  
  const feedbackRecords = await Promise.all(
    items.map(async (item, index) => {
      try {
        const feedback = await insertFeedback(userId, item.text, {
          rating: item.rating,
          source: item.source,
          product_id: item.productId,
          username: item.username,
        })

        if (!feedback) {
          results[index] = {
            index,
            success: false,
            error: 'Failed to insert feedback into database',
          }
          return null
        }

        return { feedback, item, index }
      } catch (error) {
        console.error(`Error inserting feedback at index ${index}:`, error)
        results[index] = {
          index,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error during insertion',
        }
        return null
      }
    })
  )

  // Filter out failed insertions
  const successfulInsertions = feedbackRecords.filter((record) => record !== null)

  if (successfulInsertions.length === 0) {
    return {
      success: false,
      message: 'All feedback insertions failed',
      total: results.length,
      succeeded: 0,
      failed: results.length,
      results,
    }
  }

  console.log(`Successfully inserted ${successfulInsertions.length}/${items.length} feedback records`)

  // Step 2: Generate and store embeddings with concurrency control
  console.log('Generating embeddings...')
  
  await processConcurrently(
    successfulInsertions,
    async (record) => {
      try {
        const embedding = await embedText(record.item.text)
        const updated = await updateFeedbackEmbedding(record.feedback.id, embedding)
        
        if (!updated) {
          console.warn(`Failed to update embedding for feedback ${record.feedback.id}`)
        }
      } catch (error) {
        console.error(`Error generating embedding for feedback ${record.feedback.id}:`, error)
        // Non-critical: continue even if embedding fails
      }
    },
    EMBEDDING_CONCURRENCY
  )

  console.log('Embeddings generation complete')

  // Step 3: Analyze feedback with AI and store results (with concurrency control)
  console.log('Running AI analysis...')
  
  await processConcurrently(
    successfulInsertions,
    async (record) => {
      const { feedback, index } = record
      
      try {
        // Run AI analysis
        const analysisResult = await analyzeFeedback(record.item.text)

        // Insert analysis results
        const analysis = await insertAnalysis(feedback.id, {
          sentiment: analysisResult.sentiment,
          sentiment_score: analysisResult.sentiment_score,
          topics: analysisResult.topics,
          summary: analysisResult.summary,
          recommendation: analysisResult.recommendation,
        })

        if (!analysis) {
          results[index] = {
            index,
            success: false,
            feedbackId: feedback.id,
            error: 'Failed to save analysis results',
          }
          return
        }

        // Success - store result
        results[index] = {
          index,
          success: true,
          feedbackId: feedback.id,
          analysis: {
            sentiment: analysis.sentiment || 'neutral',
            sentiment_score: analysis.sentiment_score || undefined,
            topics: analysis.topics || [],
            summary: analysis.summary || '',
            recommendation: analysis.recommendation || '',
          },
        }
      } catch (error) {
        console.error(`Error analyzing feedback ${feedback.id}:`, error)
        results[index] = {
          index,
          success: false,
          feedbackId: feedback.id,
          error: error instanceof Error ? error.message : 'Unknown error during analysis',
        }
      }
    },
    ANALYSIS_CONCURRENCY
  )

  console.log('AI analysis complete')

  // Calculate summary statistics
  const successCount = results.filter((r) => r.success).length
  const failureCount = results.length - successCount

  // Check if any results used fallback values (indicating quota/API errors)
  const hasFallbackValues = results.some(
    (r) =>
      r.success &&
      r.analysis &&
      r.analysis.summary === 'Unable to generate summary' &&
      r.analysis.recommendation === 'Review feedback manually' &&
      r.analysis.topics.length === 0 &&
      !r.analysis.sentiment_score
  )

  // Build response
  const response: {
    success: boolean
    message: string
    total: number
    succeeded: number
    failed: number
    warning?: string
    results: ProcessedItemResult[]
  } = {
    success: successCount > 0,
    message: `Processed ${results.length} items: ${successCount} succeeded, ${failureCount} failed`,
    total: results.length,
    succeeded: successCount,
    failed: failureCount,
    results,
  }

  // Add warning if fallback values were used (likely quota error)
  if (hasFallbackValues) {
    response.warning =
      'Analysis completed with fallback values. This may indicate OpenAI API quota issues. Check your billing at https://platform.openai.com/usage'
  }

  return response
}

