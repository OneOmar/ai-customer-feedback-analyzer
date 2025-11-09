#!/usr/bin/env ts-node

/**
 * Test script for /api/analyze endpoint
 * 
 * Tests the analyze API with sample feedback data.
 * Useful for CI pipelines or local manual testing.
 * 
 * Environment Variables:
 * - TEST_USER_ID: User ID to use for testing (optional, defaults to test_user_<timestamp>)
 * - LOCAL_API_URL: Base API URL (default: http://localhost:3000)
 * - DISABLE_AUTH: Set to "true" to disable authentication for testing (REQUIRED for test script)
 * 
 * Usage:
 *   # Basic usage with auth disabled (PowerShell)
 *   $env:DISABLE_AUTH="true"; npm run test:analyze
 * 
 *   # With specific user ID (PowerShell)
 *   $env:DISABLE_AUTH="true"; $env:TEST_USER_ID="user_123"; npm run test:analyze
 * 
 *   # With specific user ID (Bash/Unix)
 *   DISABLE_AUTH=true TEST_USER_ID=user_123 npm run test:analyze
 * 
 *   # With custom API URL (PowerShell)
 *   $env:DISABLE_AUTH="true"; $env:LOCAL_API_URL="http://localhost:4000"; $env:TEST_USER_ID="user_123"; npm run test:analyze
 * 
 *   # Or add to .env file:
 *   DISABLE_AUTH=true
 *   TEST_USER_ID=user_123
 *   LOCAL_API_URL=http://localhost:3000
 * 
 * Note: DISABLE_AUTH should only be used in development/test environments!
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface AnalyzeRequestBody {
  userId: string;
  items: Array<{
    text: string;
    rating?: number;
    source?: string;
    productId?: string;
    username?: string;
  }>;
}

interface AnalyzeResponse {
  success: boolean;
  message?: string;
  total?: number;
  succeeded?: number;
  failed?: number;
  warning?: string;
  results?: Array<{
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
  }>;
  error?: string;
}

async function testAnalyzeEndpoint(): Promise<void> {
  // Read configuration from environment
  // Default to a test user ID if not provided (useful for local testing)
  const TEST_USER_ID = process.env.TEST_USER_ID || 'test_user_' + Date.now();
  const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:3000';

  // Warn if using default test user ID
  if (!process.env.TEST_USER_ID) {
    console.warn('⚠️  Warning: TEST_USER_ID not set, using default test user ID');
    console.warn(`   To use a specific user ID:`);
    console.warn(`   PowerShell: $env:TEST_USER_ID="user_123"; npm run test:analyze`);
    console.warn(`   Bash/Unix: TEST_USER_ID=user_123 npm run test:analyze`);
    console.warn(`   Or add TEST_USER_ID to your .env file`);
    console.warn('');
  }

  // Check if authentication is disabled
  // Note: This only checks the test script's environment, not the server's
  // The server reads from .env.local, which needs to be loaded when the server starts
  const disableAuth = process.env.DISABLE_AUTH === 'true' || process.env.NODE_ENV === 'test';
  
  console.log('📋 Authentication Status:');
  console.log(`   DISABLE_AUTH in test script: ${process.env.DISABLE_AUTH || '(not set)'}`);
  console.log(`   Note: Server reads from .env.local - make sure DISABLE_AUTH=true is in .env.local`);
  console.log(`   and the Next.js dev server has been restarted after adding it.`);
  console.log('');
  
  if (!disableAuth) {
    console.warn('⚠️  Warning: DISABLE_AUTH not set in test script environment.');
    console.warn('   However, if DISABLE_AUTH=true is in .env.local and the server was restarted,');
    console.warn('   authentication should still be disabled on the server side.');
    console.warn('');
  }
  
  console.log('💡 Important: Make sure your Next.js dev server was started AFTER adding DISABLE_AUTH=true to .env.local');
  console.log('   If the server was running before, restart it with: npm run dev');
  console.log('');

  const apiUrl = `${LOCAL_API_URL}/api/analyze`;

  console.log('🔍 Testing /api/analyze endpoint');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 API URL: ${apiUrl}`);
  console.log(`👤 User ID: ${TEST_USER_ID}`);
  console.log('');

  // Sample feedback data
  const requestBody: AnalyzeRequestBody = {
    userId: TEST_USER_ID,
    items: [
      {
        text: 'The product quality is excellent and delivery was fast. Very satisfied with my purchase!',
        rating: 5,
        source: 'test-script',
        productId: 'prod_test_001',
        username: 'test_user',
      },
    ],
  };

  console.log('📤 Request Body:');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('');

  try {
    const startTime = Date.now();

    console.log('⏳ Sending request...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;

    console.log('');
    console.log('📥 Response received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('');

    const responseData: AnalyzeResponse = await response.json();

    console.log('📋 Response Body:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    // Evaluate result
    if (response.ok && responseData.success) {
      // Show warning if present (quota/API issues)
      if (responseData.warning) {
        console.log('⚠️  WARNING:');
        console.log(`   ${responseData.warning}`);
        console.log('');
      }
      
      console.log('✅ Test PASSED');
      console.log('');
      
      if (responseData.results && responseData.results.length > 0) {
        const result = responseData.results[0];
        if (result.success && result.analysis) {
          console.log('📊 Analysis Summary:');
          console.log(`   Sentiment: ${result.analysis.sentiment} (${result.analysis.sentiment_score || 'N/A'})`);
          console.log(`   Topics: ${result.analysis.topics.length > 0 ? result.analysis.topics.join(', ') : 'None'}`);
          console.log(`   Summary: ${result.analysis.summary}`);
          console.log(`   Recommendation: ${result.analysis.recommendation}`);
          console.log('');
        }
      }

      console.log(`✓ Total: ${responseData.total || 0}`);
      console.log(`✓ Succeeded: ${responseData.succeeded || 0}`);
      console.log(`✓ Failed: ${responseData.failed || 0}`);
      
      // Note: Exit code 0 even with warnings (warning is informational)
      process.exit(0);
    } else {
      console.log('❌ Test FAILED');
      console.log('');
      console.log(`Error: ${responseData.error || 'Unknown error'}`);
      console.log(`Message: ${responseData.message || 'No message provided'}`);
      process.exit(1);
    }
  } catch (error) {
    console.log('');
    console.log('❌ Request FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      
      const errorMsg = error.message.toLowerCase();
      
      // Check for common connection errors
      if (errorMsg.includes('econnrefused') || 
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('connect econnrefused') ||
          errorMsg.includes('networkerror') ||
          errorMsg.includes('failed to fetch')) {
        console.error('');
        console.error('💡 The server is not reachable. Please check:');
        console.error('');
        console.error('   1. Is your Next.js dev server running?');
        console.error('      → Start it with: npm run dev');
        console.error('');
        console.error('   2. Is the server running on the correct port?');
        console.error(`      → Current URL: ${LOCAL_API_URL}`);
        console.error('      → Default is: http://localhost:3000');
        console.error('');
        console.error('   3. Check if the server is accessible:');
        console.error(`      → Open ${LOCAL_API_URL} in your browser`);
        console.error('');
      } else if (errorMsg.includes('timeout')) {
        console.error('');
        console.error('💡 Request timed out. The server may be slow or unresponsive.');
        console.error('   Try increasing the timeout or check server logs.');
      } else {
        console.error('');
        console.error('💡 Troubleshooting tips:');
        console.error(`   - Check that the API URL is correct: ${LOCAL_API_URL}`);
        console.error('   - Ensure your Next.js dev server is running: npm run dev');
        console.error('   - Check server logs for errors');
      }
    } else {
      console.error('Unknown error occurred');
      console.error('');
      console.error('💡 Try starting your dev server: npm run dev');
    }
    
    console.error('');
    process.exit(1);
  }
}

// Run the test
testAnalyzeEndpoint().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

