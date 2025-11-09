import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Papa from 'papaparse'
import { analyzeFeedbackBatch, type FeedbackItem } from '@/lib/analyze'

/**
 * POST /api/upload
 * 
 * Handles multipart/form-data CSV file uploads:
 * 1. Parses CSV file using PapaParse
 * 2. Converts to JSON items format
 * 3. Calls analyzeFeedbackBatch internally (batch processing)
 * 
 * Form data:
 * - file: CSV file (multipart/form-data)
 * 
 * Returns:
 * - Analysis results from batch processing
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    // Allow bypassing auth in test/development mode via DISABLE_AUTH environment variable
    const disableAuthEnv = process.env.DISABLE_AUTH
    const disableAuth = disableAuthEnv === 'true' || disableAuthEnv === '1' || process.env.NODE_ENV === 'test'
    
    let userId: string | null = null
    
    if (!disableAuth) {
      const authResult = await auth()
      userId = authResult.userId

      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized: No valid session found' },
          { status: 401 }
        )
      }
    } else {
      // In test mode, use a test user ID from environment or default
      userId = process.env.TEST_USER_ID || 'test_user_' + Date.now()
      console.warn(`⚠️  Authentication bypassed (DISABLE_AUTH=${disableAuthEnv}, NODE_ENV=${process.env.NODE_ENV}). Using test user: ${userId}`)
    }

    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum is 10MB.` },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await file.text()

    // Parse CSV using PapaParse
    return new Promise<NextResponse>((resolve) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            // Check for parsing errors
            if (results.errors.length > 0) {
              return resolve(
                NextResponse.json(
                  {
                    error: 'CSV parsing error',
                    message: results.errors[0].message || 'Failed to parse CSV file',
                    errors: results.errors,
                  },
                  { status: 400 }
                )
              )
            }

            const rows = results.data as Record<string, any>[]

            if (rows.length === 0) {
              return resolve(
                NextResponse.json(
                  { error: 'Empty CSV file. Please provide a CSV file with data.' },
                  { status: 400 }
                )
              )
            }

            // Convert CSV rows to FeedbackItem format
            const feedbackItems = convertCsvToFeedbackItems(rows)

            if (feedbackItems.length === 0) {
              return resolve(
                NextResponse.json(
                  { error: 'No valid feedback items found in CSV. Please check your CSV format.' },
                  { status: 400 }
                )
              )
            }

            // Call analyzeFeedbackBatch internally
            // userId is guaranteed to be non-null at this point (either from auth or test mode)
            if (!userId) {
              return resolve(
                NextResponse.json(
                  { error: 'Internal error: User ID not available' },
                  { status: 500 }
                )
              )
            }
            
            const analysisResult = await analyzeFeedbackBatch(userId, feedbackItems)

            // Return analysis results
            resolve(NextResponse.json(analysisResult))
          } catch (error) {
            console.error('Error processing CSV upload:', error)
            resolve(
              NextResponse.json(
                {
                  error: 'Internal server error',
                  message: error instanceof Error ? error.message : 'Unknown error',
                },
                { status: 500 }
              )
            )
          }
        },
        error: (error) => {
          resolve(
            NextResponse.json(
              {
                error: 'CSV parsing error',
                message: error.message || 'Failed to parse CSV file',
              },
              { status: 400 }
            )
          )
        },
      })
    })
  } catch (error) {
    console.error('Unexpected error in /api/upload:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Common text column names to look for in CSV
 */
const TEXT_COLUMN_NAMES = [
  'text',
  'feedback',
  'content',
  'comment',
  'review',
  'message',
  'description',
]

/**
 * Find the text column in CSV data
 */
function findTextColumn(headers: string[]): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim())
  for (const textCol of TEXT_COLUMN_NAMES) {
    const index = lowerHeaders.findIndex((h) => h === textCol)
    if (index !== -1) {
      return headers[index]
    }
  }
  // If no common name found, use first column
  return headers[0] || null
}

/**
 * Convert CSV rows to FeedbackItem array
 */
function convertCsvToFeedbackItems(rows: Record<string, any>[]): FeedbackItem[] {
  if (rows.length === 0) return []

  const headers = Object.keys(rows[0])
  const textColumn = findTextColumn(headers)

  if (!textColumn) {
    throw new Error('Could not find text column in CSV')
  }

  return rows
    .map((row) => {
      const item: FeedbackItem = {
        text: String(row[textColumn] || '').trim(),
      }

      // Skip empty text
      if (!item.text) {
        return null
      }

      // Try to extract optional fields
      if (row.rating !== undefined && row.rating !== null && row.rating !== '') {
        const rating =
          typeof row.rating === 'number' ? row.rating : parseFloat(String(row.rating))
        if (!isNaN(rating)) {
          item.rating = rating
        }
      }

      if (row.source && String(row.source).trim()) {
        item.source = String(row.source).trim()
      }

      if (row.product_id || row.productId) {
        item.productId = String(row.product_id || row.productId).trim()
      }

      if (row.username || row.user_name || row.user) {
        item.username = String(row.username || row.user_name || row.user).trim()
      }

      return item
    })
    .filter((item): item is FeedbackItem => item !== null)
}

/**
 * Prevent GET requests
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload CSV files.' },
    { status: 405 }
  )
}

