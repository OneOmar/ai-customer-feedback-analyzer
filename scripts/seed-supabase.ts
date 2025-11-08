/**
 * Supabase Database Seeding Script
 * 
 * Seeds the database with sample feedback and analysis data for testing
 * 
 * Usage:
 *   npm run seed:supabase
 * 
 * Required Environment Variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - TEST_USER_ID (Clerk user ID to seed data for)
 * 
 * This script will:
 *   1. Connect to Supabase using service role key
 *   2. Insert sample feedback entries
 *   3. Insert corresponding AI analysis data
 *   4. Log results and summary
 */

import { config } from 'dotenv'
import { createServerClient, insertFeedback, insertAnalysis } from '../lib/supabase'

// Load environment variables from .env.local
config({ path: '.env.local' })

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-123'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Make sure .env.local exists and contains these variables')
  process.exit(1)
}

console.log('✅ Environment variables loaded')
console.log(`📝 Seeding data for user: ${TEST_USER_ID}`)
console.log('')

// ============================================================================
// SAMPLE DATA
// ============================================================================

/**
 * Sample feedback data with various sentiments and ratings
 * Represents realistic customer feedback scenarios
 */
const SAMPLE_FEEDBACK = [
  {
    text: 'Absolutely love this product! It has completely transformed how I work. The interface is intuitive and the features are exactly what I needed. Highly recommend to anyone looking for a quality solution.',
    rating: 5,
    source: 'web',
    product_id: 'prod_001',
    username: 'happy_customer',
    sentiment: 'positive' as const,
    sentiment_score: 0.95,
    topics: ['product quality', 'user interface', 'recommendation'],
    summary: 'Extremely satisfied customer praising product quality and ease of use',
    recommendation: 'Feature this as a testimonial; share with product team'
  },
  {
    text: 'The product is good overall, but the setup process was a bit confusing. Once I got it working, everything has been smooth. Customer support was helpful when I reached out.',
    rating: 4,
    source: 'email',
    product_id: 'prod_001',
    username: 'john_doe',
    sentiment: 'mixed' as const,
    sentiment_score: 0.65,
    topics: ['setup experience', 'customer support', 'product quality'],
    summary: 'Positive experience with minor setup issues, good support response',
    recommendation: 'Review onboarding process and improve setup documentation'
  },
  {
    text: 'Very disappointed with this purchase. The product does not work as advertised and I\'ve had constant issues. The quality is poor and I feel I wasted my money. Would not recommend.',
    rating: 1,
    source: 'survey',
    product_id: 'prod_002',
    username: 'frustrated_user',
    sentiment: 'negative' as const,
    sentiment_score: -0.88,
    topics: ['product quality', 'false advertising', 'value for money'],
    summary: 'Highly dissatisfied customer citing quality issues and unmet expectations',
    recommendation: 'Urgent: Contact customer for resolution; review product quality control'
  },
  {
    text: 'Fast shipping and good packaging. The product arrived on time and in perfect condition. Everything works as expected. No complaints.',
    rating: 4,
    source: 'web',
    product_id: 'prod_001',
    username: 'satisfied_buyer',
    sentiment: 'positive' as const,
    sentiment_score: 0.75,
    topics: ['shipping', 'packaging', 'product quality'],
    summary: 'Satisfied with delivery and product condition, meeting expectations',
    recommendation: 'Standard positive feedback; maintain current service levels'
  },
  {
    text: 'It\'s okay. Does what it\'s supposed to do but nothing special. For the price, I expected more features. Might look at competitors next time.',
    rating: 3,
    source: 'survey',
    product_id: 'prod_001',
    username: 'average_joe',
    sentiment: 'neutral' as const,
    sentiment_score: 0.15,
    topics: ['features', 'pricing', 'competition'],
    summary: 'Neutral review citing adequate performance but limited value proposition',
    recommendation: 'Consider feature enhancements and competitive pricing analysis'
  },
  {
    text: 'Great customer service! I had an issue and they resolved it within hours. The team was professional and understanding. This level of support makes me want to continue using your products.',
    rating: 5,
    source: 'email',
    product_id: 'prod_003',
    username: 'loyal_customer',
    sentiment: 'positive' as const,
    sentiment_score: 0.92,
    topics: ['customer service', 'problem resolution', 'loyalty'],
    summary: 'Excellent support experience leading to increased customer loyalty',
    recommendation: 'Recognize support team; use as training example'
  },
  {
    text: 'The app crashes frequently and I lose my work. Very frustrating experience. The features are good when it works, but reliability is a major issue. Please fix the bugs!',
    rating: 2,
    source: 'social',
    product_id: 'prod_004',
    username: 'tech_user',
    sentiment: 'negative' as const,
    sentiment_score: -0.72,
    topics: ['reliability', 'bugs', 'user experience'],
    summary: 'Technical issues severely impacting user experience despite good features',
    recommendation: 'Priority: Investigate crash reports; schedule bug fix sprint'
  },
  {
    text: 'Simple and effective. Does exactly what I need without unnecessary complexity. Clean design and easy to navigate. Would buy again.',
    rating: 5,
    source: 'web',
    product_id: 'prod_003',
    username: 'minimalist_user',
    sentiment: 'positive' as const,
    sentiment_score: 0.88,
    topics: ['simplicity', 'design', 'usability'],
    summary: 'Appreciates straightforward design and effective functionality',
    recommendation: 'Maintain simplicity in future updates; highlight in marketing'
  },
  {
    text: 'Decent product but the price seems high compared to alternatives. Functionality is solid but not exceptional. I\'m on the fence about renewing my subscription.',
    rating: 3,
    source: 'survey',
    product_id: 'prod_002',
    username: 'price_conscious',
    sentiment: 'neutral' as const,
    sentiment_score: 0.25,
    topics: ['pricing', 'value', 'competition', 'subscription'],
    summary: 'Concerns about pricing relative to competitors, considering alternatives',
    recommendation: 'Review pricing strategy; consider retention offers'
  },
  {
    text: 'Best purchase I\'ve made this year! The product exceeded my expectations in every way. Quality is outstanding and the attention to detail is impressive. Thank you!',
    rating: 5,
    source: 'email',
    product_id: 'prod_001',
    username: 'enthusiast',
    sentiment: 'positive' as const,
    sentiment_score: 0.98,
    topics: ['product quality', 'expectations', 'satisfaction'],
    summary: 'Extremely positive review praising quality and exceeding expectations',
    recommendation: 'Request permission to use as testimonial; potential case study'
  }
]

// ============================================================================
// SEEDING LOGIC
// ============================================================================

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n')

  let feedbackInserted = 0
  let analysisInserted = 0
  const errors: string[] = []

  try {
    // Process each sample feedback entry
    for (let i = 0; i < SAMPLE_FEEDBACK.length; i++) {
      const sample = SAMPLE_FEEDBACK[i]
      
      try {
        console.log(`📝 [${i + 1}/${SAMPLE_FEEDBACK.length}] Processing: "${sample.text.substring(0, 50)}..."`)

        // Insert feedback
        const feedback = await insertFeedback(TEST_USER_ID, sample.text, {
          rating: sample.rating,
          source: sample.source,
          product_id: sample.product_id,
          username: sample.username
        })

        if (!feedback) {
          errors.push(`Failed to insert feedback ${i + 1}`)
          console.error(`   ❌ Failed to insert feedback`)
          continue
        }

        feedbackInserted++
        console.log(`   ✅ Feedback inserted (ID: ${feedback.id})`)

        // Insert corresponding analysis
        const analysis = await insertAnalysis(feedback.id, {
          sentiment: sample.sentiment,
          sentiment_score: sample.sentiment_score,
          topics: sample.topics,
          summary: sample.summary,
          recommendation: sample.recommendation,
          confidence_score: 0.85 + Math.random() * 0.10 // Random confidence between 0.85-0.95
        })

        if (!analysis) {
          errors.push(`Failed to insert analysis for feedback ${feedback.id}`)
          console.error(`   ❌ Failed to insert analysis`)
          continue
        }

        analysisInserted++
        console.log(`   ✅ Analysis inserted (Sentiment: ${sample.sentiment})`)
        console.log('')

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`   ❌ Error processing sample ${i + 1}:`, error)
        errors.push(`Error processing sample ${i + 1}: ${error}`)
      }
    }

    // Print summary
    console.log('=' .repeat(60))
    console.log('📊 SEEDING SUMMARY')
    console.log('=' .repeat(60))
    console.log(`✅ Feedback entries inserted: ${feedbackInserted}/${SAMPLE_FEEDBACK.length}`)
    console.log(`✅ Analysis entries inserted: ${analysisInserted}/${SAMPLE_FEEDBACK.length}`)
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${errors.length}`)
      errors.forEach(err => console.log(`   - ${err}`))
    } else {
      console.log('\n🎉 All data seeded successfully!')
    }

    console.log('\n📍 Test User ID:', TEST_USER_ID)
    console.log('💡 You can now view this data in your application')
    console.log('')

  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error)
    process.exit(1)
  }
}

// ============================================================================
// CLEANUP FUNCTION (OPTIONAL)
// ============================================================================

/**
 * Cleanup function to delete all test data
 * Uncomment and run separately if you want to reset the database
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n')

  try {
    const supabase = createServerClient()

    // Delete all feedback for test user (will cascade to analysis)
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('user_id', TEST_USER_ID)

    if (error) {
      console.error('❌ Error during cleanup:', error)
      return
    }

    console.log('✅ Test data cleaned up successfully')
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error)
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

// Check for cleanup flag
const args = process.argv.slice(2)
if (args.includes('--cleanup')) {
  cleanupTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
} else {
  // Run seeding
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
}

