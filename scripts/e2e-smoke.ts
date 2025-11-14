#!/usr/bin/env tsx

/**
 * End-to-End Smoke Test Script
 * 
 * Performs a quick smoke test of the /api/analyze endpoint to verify
 * the system is working end-to-end. Useful for CI/CD pipelines and
 * quick health checks.
 * 
 * Environment Variables:
 * - LOCAL_API_URL: Base API URL (default: http://localhost:3000)
 * - TEST_USER_ID: User ID to use for testing (required)
 * 
 * Usage:
 *   # Basic usage (PowerShell)
 *   $env:TEST_USER_ID="user_123"; npm run test:e2e
 * 
 *   # With custom API URL (PowerShell)
 *   $env:LOCAL_API_URL="http://localhost:4000"; $env:TEST_USER_ID="user_123"; npm run test:e2e
 * 
 *   # Bash/Unix
 *   TEST_USER_ID=user_123 npm run test:e2e
 *   LOCAL_API_URL=http://localhost:4000 TEST_USER_ID=user_123 npm run test:e2e
 * 
 * Exit Codes:
 * - 0: Test passed
 * - 1: Test failed (connection error, API error, or validation failure)
 */

interface AnalyzeRequestBody {
  userId: string
  items: Array<{
    text: string
    rating?: number
    source?: string
    productId?: string
    username?: string
  }>
}

interface AnalyzeResponse {
  success: boolean
  message?: string
  total?: number
  succeeded?: number
  failed?: number
  results?: Array<{
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
  }>
  error?: string
}

async function runSmokeTest(): Promise<void> {
  // Read configuration from environment
  const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:3000'
  const TEST_USER_ID = process.env.TEST_USER_ID

  // Validate required environment variables
  if (!TEST_USER_ID) {
    console.error('❌ ERROR: TEST_USER_ID environment variable is required')
    console.error('')
    console.error('Usage:')
    console.error('  PowerShell: $env:TEST_USER_ID="user_123"; npm run test:e2e')
    console.error('  Bash/Unix: TEST_USER_ID=user_123 npm run test:e2e')
    console.error('')
    process.exit(1)
  }

  const apiUrl = `${LOCAL_API_URL}/api/analyze`

  console.log('🧪 E2E Smoke Test')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 API URL: ${apiUrl}`)
  console.log(`👤 User ID: ${TEST_USER_ID}`)
  console.log('')

  // Sample feedback data
  const requestBody: AnalyzeRequestBody = {
    userId: TEST_USER_ID,
    items: [
      {
        text: 'Great product! Very satisfied with the quality and fast delivery.',
        rating: 5,
        source: 'e2e-smoke-test',
      },
    ],
  }

  try {
    const startTime = Date.now()

    console.log('📤 Sending POST request to /api/analyze...')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const duration = Date.now() - startTime

    console.log(`⏱️  Response received in ${duration}ms`)
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log('')

    // Parse response
    let responseData: AnalyzeResponse
    try {
      responseData = await response.json()
    } catch (parseError) {
      console.error('❌ FAILED: Invalid JSON response')
      console.error(`   Status: ${response.status}`)
      const text = await response.text()
      console.error(`   Response body: ${text.substring(0, 200)}`)
      process.exit(1)
    }

    // Print response
    console.log('📥 Response:')
    console.log(JSON.stringify(responseData, null, 2))
    console.log('')

    // Validate response
    if (!response.ok) {
      console.error('❌ FAILED: API returned error status')
      console.error(`   Status: ${response.status}`)
      console.error(`   Error: ${responseData.error || 'Unknown error'}`)
      process.exit(1)
    }

    if (!responseData.success) {
      console.error('❌ FAILED: API returned success=false')
      console.error(`   Message: ${responseData.message || 'No message'}`)
      console.error(`   Error: ${responseData.error || 'Unknown error'}`)
      process.exit(1)
    }

    // Verify response structure
    if (!responseData.results || responseData.results.length === 0) {
      console.error('❌ FAILED: No results in response')
      process.exit(1)
    }

    const result = responseData.results[0]

    if (!result.success) {
      console.error('❌ FAILED: First result has success=false')
      console.error(`   Error: ${result.error || 'Unknown error'}`)
      process.exit(1)
    }

    // Verify analysis exists
    if (!result.analysis) {
      console.error('❌ FAILED: No analysis in result')
      process.exit(1)
    }

    // Verify analysis structure
    const analysis = result.analysis
    if (!analysis.sentiment || !analysis.topics || !analysis.summary || !analysis.recommendation) {
      console.error('❌ FAILED: Incomplete analysis structure')
      console.error(`   Has sentiment: ${!!analysis.sentiment}`)
      console.error(`   Has topics: ${!!analysis.topics}`)
      console.error(`   Has summary: ${!!analysis.summary}`)
      console.error(`   Has recommendation: ${!!analysis.recommendation}`)
      process.exit(1)
    }

    // Verify feedbackId exists (optional check)
    if (!result.feedbackId) {
      console.warn('⚠️  WARNING: No feedbackId in result (may be expected in some configurations)')
    }

    // Success!
    console.log('✅ PASSED: E2E smoke test successful')
    console.log('')
    console.log('📊 Analysis Summary:')
    console.log(`   Sentiment: ${analysis.sentiment}${analysis.sentiment_score ? ` (${analysis.sentiment_score})` : ''}`)
    console.log(`   Topics: ${analysis.topics.length > 0 ? analysis.topics.join(', ') : 'None'}`)
    console.log(`   Summary: ${analysis.summary.substring(0, 100)}${analysis.summary.length > 100 ? '...' : ''}`)
    console.log(`   Feedback ID: ${result.feedbackId || 'N/A'}`)
    console.log('')
    console.log(`✓ Total: ${responseData.total || 0}`)
    console.log(`✓ Succeeded: ${responseData.succeeded || 0}`)
    console.log(`✓ Failed: ${responseData.failed || 0}`)
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('❌ FAILED: Request error')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`)
      console.error('')

      const errorMsg = error.message.toLowerCase()

      // Check for common connection errors
      if (
        errorMsg.includes('econnrefused') ||
        errorMsg.includes('fetch failed') ||
        errorMsg.includes('connect econnrefused') ||
        errorMsg.includes('networkerror') ||
        errorMsg.includes('failed to fetch')
      ) {
        console.error('💡 The server is not reachable. Please check:')
        console.error('')
        console.error('   1. Is your Next.js dev server running?')
        console.error('      → Start it with: npm run dev')
        console.error('')
        console.error('   2. Is the server running on the correct port?')
        console.error(`      → Current URL: ${LOCAL_API_URL}`)
        console.error('      → Default is: http://localhost:3000')
        console.error('')
        console.error('   3. Check if the server is accessible:')
        console.error(`      → Open ${LOCAL_API_URL} in your browser`)
      } else if (errorMsg.includes('timeout')) {
        console.error('💡 Request timed out. The server may be slow or unresponsive.')
        console.error('   Try increasing the timeout or check server logs.')
      } else {
        console.error('💡 Troubleshooting tips:')
        console.error(`   - Check that the API URL is correct: ${LOCAL_API_URL}`)
        console.error('   - Ensure your Next.js dev server is running: npm run dev')
        console.error('   - Check server logs for errors')
      }
    } else {
      console.error('Unknown error occurred')
      console.error('')
      console.error('💡 Try starting your dev server: npm run dev')
    }

    console.error('')
    process.exit(1)
  }
}

// Run the smoke test
runSmokeTest().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})

