import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { analyzeFeedbackBatch, type FeedbackItem } from '@/lib/analyze'
import { checkUserQuota, incrementUsage } from '@/lib/billing'

/**
 * Request body interface for batch processing
 */
interface AnalyzeRequestBody {
  userId: string
  items: FeedbackItem[]
}

/**
 * POST /api/analyze
 * 
 * Batch analyzes customer feedback items by:
 * 1. Validating request (max 200 items per batch)
 * 2. Checking user quota before processing (returns 402 if quota exceeded)
 * 3. Inserting feedback records into database
 * 4. Generating and storing embeddings (batched where possible)
 * 5. Running AI analysis with concurrency control (sentiment, topics, summary, recommendation)
 * 6. Storing analysis results
 * 7. Incrementing usage count for successfully analyzed items
 * 
 * Quota Enforcement:
 * - Checks quota before processing to avoid charging for denied requests
 * - For batch mode, requires quota >= number of items being processed
 * - Returns 402 (Payment Required) if quota is insufficient
 * - Only increments usage for successfully analyzed items
 * 
 * Cost: ~3 LLM API calls per item (sentiment, topics, summary)
 * Rate limiting: Uses concurrency control to avoid overwhelming APIs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalyzeRequestBody = await request.json()
    const { userId, items } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 })
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request: items must be an array' },
        { status: 400 }
      )
    }

    // Verify userId via Clerk authentication
    // Allow bypassing auth in test/development mode via DISABLE_AUTH environment variable
    const disableAuthEnv = process.env.DISABLE_AUTH
    const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === '1' || process.env.NODE_ENV === 'test'
    
    if (!disableAuth) {
      const { userId: authenticatedUserId } = await auth()

      if (!authenticatedUserId) {
        return NextResponse.json(
          { error: 'Unauthorized: No valid session found' },
          { status: 401 }
        )
      }

      // Verify the userId in the request matches the authenticated user
      if (authenticatedUserId !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: User ID mismatch' },
          { status: 403 }
        )
      }
    } else {
      // In test mode, log a warning but allow the request
      console.warn(`⚠️  Authentication bypassed (DISABLE_AUTH=${disableAuthEnv}, NODE_ENV=${process.env.NODE_ENV})`)
    }

    // Check billing quota before performing heavy operations
    // Important: Check quota BEFORE processing batch to avoid charging for denied requests
    const quota = await checkUserQuota(userId)
    
    // For batch mode, check if user has enough quota for all items being processed
    const itemsCount = items.length
    if (!quota.allowed || quota.remaining < itemsCount) {
      return NextResponse.json(
        { 
          error: 'Upgrade required',
          plan: quota.plan,
          remaining: quota.remaining,
        },
        { status: 402 } // Payment Required
      )
    }

    // Call shared analyze function
    const result = await analyzeFeedbackBatch(userId, items)

    // Increment usage for each successfully analyzed item
    // Only count items that were successfully analyzed (not just inserted)
    const successfulAnalyses = result.results.filter((r) => r.success && r.analysis)
    
    // Increment usage for each successful analysis
    // Note: incrementUsage increments by 1 per call, so we call it sequentially for each successful item
    // Sequential calls prevent race conditions when updating the usage counter
    let usageIncremented = 0
    for (const _ of successfulAnalyses) {
      try {
        const success = await incrementUsage(userId)
        if (success) {
          usageIncremented++
        } else {
          console.warn(`Failed to increment usage for user ${userId}`)
        }
      } catch (error) {
        console.error(`Error incrementing usage for user ${userId}:`, error)
        // Continue processing even if usage increment fails
        // The analysis was successful, so we log the error but don't fail the request
      }
    }

    // Log usage increment summary
    if (usageIncremented !== successfulAnalyses.length) {
      console.warn(
        `Usage increment mismatch: ${usageIncremented}/${successfulAnalyses.length} increments succeeded`
      )
    }

    // Return batch results
    return NextResponse.json(result)

  } catch (error) {
    console.error('Unexpected error in /api/analyze:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Handle validation errors from analyzeFeedbackBatch
    if (error instanceof Error && error.message.includes('Batch size exceeds maximum')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Empty items array')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes('Invalid item at index')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Prevent GET requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to analyze feedback.' },
    { status: 405 }
  );
}
