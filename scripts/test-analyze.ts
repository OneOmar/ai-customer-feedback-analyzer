#!/usr/bin/env ts-node

/**
 * Test script for /api/analyze endpoint
 * 
 * Tests the analyze API with sample feedback data.
 * Useful for CI pipelines or local manual testing.
 * 
 * Environment Variables:
 * - TEST_USER_ID: User ID to use for testing (required)
 * - LOCAL_API_URL: Base API URL (default: http://localhost:3000)
 * 
 * Usage:
 *   npm run test:analyze
 *   TEST_USER_ID=user_123 npm run test:analyze
 *   LOCAL_API_URL=http://localhost:4000 TEST_USER_ID=user_123 npm run test:analyze
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
  const TEST_USER_ID = process.env.TEST_USER_ID;
  const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:3000';

  // Validate required environment variables
  if (!TEST_USER_ID) {
    console.error('❌ Error: TEST_USER_ID environment variable is required');
    console.error('');
    console.error('Usage:');
    console.error('  TEST_USER_ID=user_123 npm run test:analyze');
    process.exit(1);
  }

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
      console.log('✅ Test PASSED');
      console.log('');
      
      if (responseData.results && responseData.results.length > 0) {
        const result = responseData.results[0];
        if (result.success && result.analysis) {
          console.log('📊 Analysis Summary:');
          console.log(`   Sentiment: ${result.analysis.sentiment} (${result.analysis.sentiment_score || 'N/A'})`);
          console.log(`   Topics: ${result.analysis.topics.join(', ')}`);
          console.log(`   Summary: ${result.analysis.summary}`);
          console.log(`   Recommendation: ${result.analysis.recommendation}`);
          console.log('');
        }
      }

      console.log(`✓ Total: ${responseData.total || 0}`);
      console.log(`✓ Succeeded: ${responseData.succeeded || 0}`);
      console.log(`✓ Failed: ${responseData.failed || 0}`);
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
      
      // Check for common connection errors
      if (error.message.includes('ECONNREFUSED')) {
        console.error('');
        console.error('💡 Tip: Make sure your Next.js dev server is running:');
        console.error('   npm run dev');
      } else if (error.message.includes('fetch')) {
        console.error('');
        console.error('💡 Tip: Check that LOCAL_API_URL is correct:');
        console.error(`   Current: ${LOCAL_API_URL}`);
      }
    } else {
      console.error('Unknown error occurred');
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

