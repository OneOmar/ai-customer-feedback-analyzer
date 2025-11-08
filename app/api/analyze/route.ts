import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { insertFeedback, insertAnalysis } from '@/lib/supabase'
import { checkQuota, incrementUsage } from '@/lib/billing'
import { openai } from '@/lib/openai'

/**
 * Analyze Feedback Endpoint
 * POST /api/analyze
 * 
 * Analyzes customer feedback using AI with quota enforcement
 * 
 * Request Body:
 * {
 *   feedbackId?: string,     // Existing feedback ID (optional)
 *   text: string,            // Feedback text to analyze
 *   rating?: number,         // Rating 1-5
 *   source?: string         // Source (web, email, etc.)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     feedback: Feedback,
 *     analysis: FeedbackAnalysis,
 *     quota: QuotaResult
 *   }
 * }
 * 
 * Example Usage:
 * ```typescript
 * const response = await fetch('/api/analyze', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     text: 'Great product!',
 *     rating: 5,
 *     source: 'web'
 *   })
 * })
 * ```
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to analyze feedback' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const { feedbackId, text, rating, source } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Feedback text is required' },
        { status: 400 }
      )
    }

    // 3. Check quota BEFORE processing
    const quota = await checkQuota(userId)
    
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: `You've used all ${quota.limit} analyses this month. Upgrade your plan for more.`,
          quota: {
            used: quota.used,
            limit: quota.limit,
            plan: quota.plan,
            resetsAt: quota.resetsAt
          }
        },
        { status: 429 } // 429 Too Many Requests
      )
    }

    // 4. Insert or get feedback
    let feedback
    if (feedbackId) {
      // Analyzing existing feedback
      feedback = { id: feedbackId }
    } else {
      // Insert new feedback
      feedback = await insertFeedback(userId, text, {
        rating,
        source: source || 'api'
      })

      if (!feedback) {
        return NextResponse.json(
          { error: 'Database error', message: 'Failed to save feedback' },
          { status: 500 }
        )
      }
    }

    // 5. Perform AI sentiment analysis
    console.log('Analyzing feedback with OpenAI...')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the following customer feedback and respond with valid JSON only:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": number between -1 and 1,
  "topics": array of 2-5 key topics as strings,
  "summary": brief 1-2 sentence summary,
  "recommendation": suggested action for the business
}

Be concise and accurate. Extract meaningful topics from the feedback.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    // Parse AI response
    const aiResult = JSON.parse(completion.choices[0].message.content || '{}')

    // 6. Save analysis to database
    const analysis = await insertAnalysis(feedback.id, {
      sentiment: aiResult.sentiment,
      sentiment_score: aiResult.score,
      topics: aiResult.topics || [],
      summary: aiResult.summary,
      recommendation: aiResult.recommendation,
      confidence_score: 0.85 // Could be calculated from AI response
    })

    if (!analysis) {
      // Analysis failed to save, but we've already used the quota
      // Still increment usage since AI was called
      await incrementUsage(userId)
      
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to save analysis' },
        { status: 500 }
      )
    }

    // 7. Increment usage count AFTER successful analysis
    const usageIncremented = await incrementUsage(userId)
    
    if (!usageIncremented) {
      console.error('Warning: Failed to increment usage for user:', userId)
      // Continue anyway - don't fail the request
    }

    // 8. Get updated quota for response
    const updatedQuota = await checkQuota(userId)

    // 9. Return success response
    return NextResponse.json({
      success: true,
      data: {
        feedback,
        analysis,
        quota: {
          remaining: updatedQuota.remaining,
          used: updatedQuota.used,
          limit: updatedQuota.limit,
          plan: updatedQuota.plan,
          resetsAt: updatedQuota.resetsAt
        }
      }
    })

  } catch (error: any) {
    console.error('Error in POST /api/analyze:', error)
    
    // Check if it's an OpenAI API error
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded', message: 'Please contact support' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to analyze feedback' },
      { status: 500 }
    )
  }
}

/**
 * Get analysis status
 * GET /api/analyze?feedbackId=xxx
 * 
 * Returns existing analysis for a feedback item
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const feedbackId = searchParams.get('feedbackId')

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'feedbackId parameter required' },
        { status: 400 }
      )
    }

    // Query analysis from database
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = createServerClient()

    const { data: analysis, error } = await supabase
      .from('feedback_analysis')
      .select('*')
      .eq('feedback_id', feedbackId)
      .single()

    if (error || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: analysis
    })

  } catch (error) {
    console.error('Error in GET /api/analyze:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

