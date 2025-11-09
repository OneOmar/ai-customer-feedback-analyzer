import { NextRequest, NextResponse } from 'next/server'
import { getRecentAnalyses } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/feedback
 * 
 * Fetches recent feedback with analyses for the authenticated user
 * 
 * Query parameters:
 * - limit: Maximum number of records to return (default: 50)
 * 
 * Returns:
 * - Array of feedback with analysis data
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid session found' },
        { status: 401 }
      )
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Fetch recent analyses
    const analyses = await getRecentAnalyses(userId, limit)

    // Normalize feedback_analysis (Supabase might return as array or single object)
    const normalizedAnalyses = analyses.map((item) => {
      const analysis = item.feedback_analysis
      return {
        ...item,
        feedback_analysis: Array.isArray(analysis)
          ? analysis.length > 0
            ? analysis[0]
            : null
          : analysis,
      }
    })

    return NextResponse.json({
      success: true,
      data: normalizedAnalyses,
      count: normalizedAnalyses.length,
    })
  } catch (error) {
    console.error('Error in GET /api/feedback:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

