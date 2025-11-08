import { NextRequest, NextResponse } from 'next/server';
import { insertFeedback, insertAnalysis, updateFeedbackEmbedding } from '@/lib/supabase';
import { generateEmbedding, analyzeFeedback } from '@/lib/langchain';
import { embedText } from '@/lib/openai';
// import { auth } from '@clerk/nextjs/server';
// import { checkQuota } from '@/lib/billing'; // TODO: Import when billing module is ready

/**
 * Single feedback item interface
 */
interface FeedbackItem {
  text: string;
  rating?: number;
  source?: string;
  productId?: string;
  username?: string;
}

/**
 * Request body interface for batch processing
 */
interface AnalyzeRequestBody {
  userId: string;
  items: FeedbackItem[];
}

/**
 * Result for a single processed item
 */
interface ProcessedItemResult {
  index: number;
  success: boolean;
  feedbackId?: string;
  analysis?: {
    sentiment: string;
    sentiment_score?: number;
    topics: string[];
    summary: string;
    recommendation: string;
  };
  error?: string;
}

/**
 * Concurrency limiter - processes promises with a maximum concurrency limit
 * Simple implementation without external dependencies
 */
async function processConcurrently<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    
    const promise = processor(item, index).then((result) => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * POST /api/analyze
 * 
 * Batch analyzes customer feedback items by:
 * 1. Validating request (max 200 items per batch)
 * 2. Inserting feedback records into database
 * 3. Generating and storing embeddings (batched where possible)
 * 4. Running AI analysis with concurrency control (sentiment, topics, summary, recommendation)
 * 5. Storing analysis results
 * 
 * Cost: ~3 LLM API calls per item (sentiment, topics, summary)
 * Rate limiting: Uses concurrency control to avoid overwhelming APIs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalyzeRequestBody = await request.json();
    const { userId, items } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items must be an array' },
        { status: 400 }
      );
    }

    // Validate batch size
    const MAX_ITEMS_PER_BATCH = 200;
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Empty items array: at least one item is required' },
        { status: 400 }
      );
    }

    if (items.length > MAX_ITEMS_PER_BATCH) {
      return NextResponse.json(
        { 
          error: `Batch size exceeds maximum: ${items.length} items provided, maximum is ${MAX_ITEMS_PER_BATCH}` 
        },
        { status: 400 }
      );
    }

    // Validate each item has required text field
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.text || typeof item.text !== 'string' || item.text.trim().length === 0) {
        return NextResponse.json(
          { error: `Invalid item at index ${i}: text is required and must be a non-empty string` },
          { status: 400 }
        );
      }
    }

    // TODO: Verify userId via Clerk authentication
    // Uncomment when Clerk is configured:
    /*
    const { userId: authenticatedUserId } = await auth();
    
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session found' },
        { status: 401 }
      );
    }
    
    // Verify the userId in the request matches the authenticated user
    if (authenticatedUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: User ID mismatch' },
        { status: 403 }
      );
    }
    */

    // TODO: Check billing quota before performing heavy operations
    // Important: Check quota BEFORE processing batch to avoid charging for denied requests
    // Uncomment when billing module is ready:
    /*
    const quotaCheck = await checkQuota(userId, {
      operationType: 'analyze',
      itemCount: items.length
    });
    
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Quota exceeded', 
          message: quotaCheck.message,
          remaining: quotaCheck.remaining,
          upgradeUrl: '/pricing'
        },
        { status: 429 } // Too Many Requests
      );
    }
    */

    // Configuration for rate limiting and concurrency
    const EMBEDDING_CONCURRENCY = 5; // OpenAI embeddings can handle ~5 concurrent requests
    const ANALYSIS_CONCURRENCY = 3;  // LLM analysis is more expensive, limit to 3 concurrent

    // Results array to track per-item status
    const results: ProcessedItemResult[] = [];

    // Step 1: Insert all feedback records into database first
    console.log(`Inserting ${items.length} feedback records...`);
    
    const feedbackRecords = await Promise.all(
      items.map(async (item, index) => {
        try {
          const feedback = await insertFeedback(userId, item.text, {
            rating: item.rating,
            source: item.source,
            product_id: item.productId,
            username: item.username,
          });

          if (!feedback) {
            results[index] = {
              index,
              success: false,
              error: 'Failed to insert feedback into database',
            };
            return null;
          }

          return { feedback, item, index };
        } catch (error) {
          console.error(`Error inserting feedback at index ${index}:`, error);
          results[index] = {
            index,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error during insertion',
          };
          return null;
        }
      })
    );

    // Filter out failed insertions
    const successfulInsertions = feedbackRecords.filter((record) => record !== null);

    if (successfulInsertions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'All feedback insertions failed',
          results,
        },
        { status: 500 }
      );
    }

    console.log(`Successfully inserted ${successfulInsertions.length}/${items.length} feedback records`);

    // Step 2: Generate and store embeddings with concurrency control
    console.log('Generating embeddings...');
    
    await processConcurrently(
      successfulInsertions,
      async (record) => {
        try {
          const embedding = await embedText(record.item.text);
          const updated = await updateFeedbackEmbedding(record.feedback.id, embedding);
          
          if (!updated) {
            console.warn(`Failed to update embedding for feedback ${record.feedback.id}`);
          }
        } catch (error) {
          console.error(`Error generating embedding for feedback ${record.feedback.id}:`, error);
          // Non-critical: continue even if embedding fails
        }
      },
      EMBEDDING_CONCURRENCY
    );

    console.log('Embeddings generation complete');

    // Step 3: Analyze feedback with AI and store results (with concurrency control)
    console.log('Running AI analysis...');
    
    await processConcurrently(
      successfulInsertions,
      async (record) => {
        const { feedback, index } = record;
        
        try {
          // Run AI analysis
          const analysisResult = await analyzeFeedback(record.item.text);

          // Insert analysis results
          const analysis = await insertAnalysis(feedback.id, {
            sentiment: analysisResult.sentiment,
            sentiment_score: analysisResult.sentiment_score,
            topics: analysisResult.topics,
            summary: analysisResult.summary,
            recommendation: analysisResult.recommendation,
          });

          if (!analysis) {
            results[index] = {
              index,
              success: false,
              feedbackId: feedback.id,
              error: 'Failed to save analysis results',
            };
            return;
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
          };
        } catch (error) {
          console.error(`Error analyzing feedback ${feedback.id}:`, error);
          results[index] = {
            index,
            success: false,
            feedbackId: feedback.id,
            error: error instanceof Error ? error.message : 'Unknown error during analysis',
          };
        }
      },
      ANALYSIS_CONCURRENCY
    );

    console.log('AI analysis complete');

    // Calculate summary statistics
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    // Return batch results
    return NextResponse.json({
      success: successCount > 0,
      message: `Processed ${results.length} items: ${successCount} succeeded, ${failureCount} failed`,
      total: results.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    });

  } catch (error) {
    console.error('Unexpected error in /api/analyze:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze feedback.' },
    { status: 405 }
  );
}
