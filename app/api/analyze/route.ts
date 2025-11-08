import { NextRequest, NextResponse } from 'next/server';
import { insertFeedback, insertAnalysis, updateFeedbackEmbedding } from '@/lib/supabase';
import { generateEmbedding, analyzeFeedback } from '@/lib/langchain';
// import { auth } from '@clerk/nextjs/server';
// import { checkQuota } from '@/lib/billing'; // TODO: Import when billing module is ready

/**
 * Request body interface
 */
interface AnalyzeRequestBody {
  userId: string;
  text: string;
  rating?: number;
  source?: string;
  productId?: string;
  username?: string;
}

/**
 * POST /api/analyze
 * 
 * Analyzes customer feedback by:
 * 1. Inserting feedback into database
 * 2. Generating and storing embeddings
 * 3. Running AI analysis (sentiment, topics, summary, recommendation)
 * 4. Storing analysis results
 * 
 * Cost: ~3 LLM API calls per request (sentiment, topics, summary)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: AnalyzeRequestBody = await request.json();
    const { userId, text, rating, source, productId, username } = body;

    // Validate required fields
    if (!userId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and text are required' },
        { status: 400 }
      );
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid text: must be a non-empty string' },
        { status: 400 }
      );
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
    // Uncomment when billing module is ready:
    /*
    const quotaCheck = await checkQuota(userId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Quota exceeded', 
          message: quotaCheck.message,
          upgradeUrl: '/pricing'
        },
        { status: 429 } // Too Many Requests
      );
    }
    */

    // Step 1: Insert feedback into database
    const feedback = await insertFeedback(userId, text, {
      rating,
      source,
      product_id: productId,
      username,
    });

    if (!feedback) {
      return NextResponse.json(
        { error: 'Failed to insert feedback into database' },
        { status: 500 }
      );
    }

    const feedbackId = feedback.id;

    // Step 2: Generate embedding and update feedback record
    try {
      const embedding = await generateEmbedding(text);
      
      const embeddingUpdated = await updateFeedbackEmbedding(feedbackId, embedding);
      
      if (!embeddingUpdated) {
        console.warn(`Failed to update embedding for feedback ${feedbackId}`);
        // Non-critical: continue with analysis even if embedding update fails
      }
    } catch (embeddingError) {
      console.error('Error generating/storing embedding:', embeddingError);
      // Non-critical: continue with analysis even if embedding generation fails
    }

    // Step 3: Analyze feedback with AI (sentiment, topics, summary, recommendation)
    let analysisResult;
    try {
      analysisResult = await analyzeFeedback(text);
    } catch (analysisError) {
      console.error('Error analyzing feedback:', analysisError);
      return NextResponse.json(
        { 
          error: 'Failed to analyze feedback', 
          feedbackId,
          message: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Step 4: Insert analysis results into database
    const analysis = await insertAnalysis(feedbackId, {
      sentiment: analysisResult.sentiment,
      sentiment_score: analysisResult.sentiment_score,
      topics: analysisResult.topics,
      summary: analysisResult.summary,
      recommendation: analysisResult.recommendation,
    });

    if (!analysis) {
      return NextResponse.json(
        { 
          error: 'Failed to save analysis results', 
          feedbackId,
          analysis: analysisResult 
        },
        { status: 500 }
      );
    }

    // Step 5: Return success response
    return NextResponse.json({
      success: true,
      feedbackId,
      analysis: {
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        topics: analysis.topics,
        summary: analysis.summary,
        recommendation: analysis.recommendation,
      },
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
