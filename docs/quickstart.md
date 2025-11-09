# Quick Start Guide - AI Feedback Analysis Pipeline

This guide walks you through setting up and using the AI-powered customer feedback analysis system.

## Prerequisites

- Node.js 18+ installed
- OpenAI API account with API key
- Supabase project (see `docs/supabase-setup.md`)
- Optional: Clerk account for authentication

## Step 1: Install Dependencies

```bash
npm install
```

**Core packages installed:**
- `openai` - OpenAI API client
- `@supabase/supabase-js` - Database client
- `next` - Next.js framework

**Dev dependencies for testing:**
```bash
npm install --save-dev jest @types/jest jest-environment-node ts-jest @jest/globals
```

## Step 2: Configure Environment Variables

Create `.env.local` file in project root:

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBED_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Optional Configuration
MAX_ITEMS_PER_BATCH=100

# Clerk Authentication (Optional - for production)
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
# CLERK_SECRET_KEY=sk_xxx
```

## Step 3: Set Up Database

Run Supabase SQL migrations:

```bash
# From Supabase dashboard, run SQL files in order:
# 1. supabase/sql/init.sql
# 2. supabase/sql/billing.sql

# Or use Supabase CLI:
supabase db push
```

**Tables created:**
- `feedback` - Customer feedback with embeddings
- `feedback_analysis` - AI analysis results
- `uploads` - Bulk upload tracking
- Billing tables (if needed)

## Step 4: Verify Setup

### Test OpenAI Connection

Create test file `test-openai.ts`:

```typescript
import { embedText, runLLM } from './lib/openai';

async function test() {
  // Test embedding
  const embedding = await embedText('Hello world');
  console.log('✓ Embedding generated:', embedding.length, 'dimensions');
  
  // Test LLM
  const response = await runLLM('Say hello', 10);
  console.log('✓ LLM response:', response);
}

test();
```

Run: `npx tsx test-openai.ts`

### Test Database Connection

```typescript
import { createServerClient } from './lib/supabase';

async function test() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from('feedback').select('count');
  console.log('✓ Database connected:', data);
}

test();
```

## Step 5: Run the Application

### Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Test the API Endpoint

```bash
# In another terminal
TEST_USER_ID=user_test_123 npm run test:analyze
```

**Expected output:**
```
✅ Test PASSED
📊 Analysis Summary:
   Sentiment: positive (0.92)
   Topics: product quality, satisfaction
   Summary: Customer is very satisfied...
```

## Step 6: Using the API

### Single Item Analysis

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "items": [{
      "text": "Great product, fast shipping!",
      "rating": 5,
      "source": "web",
      "productId": "prod_001"
    }]
  }'
```

### Batch Analysis (Multiple Items)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "items": [
      {"text": "Excellent quality!", "rating": 5},
      {"text": "Shipping was slow", "rating": 3},
      {"text": "Product broke after one week", "rating": 1}
    ]
  }'
```

**Response format:**
```json
{
  "success": true,
  "message": "Processed 3 items: 3 succeeded, 0 failed",
  "total": 3,
  "succeeded": 3,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "success": true,
      "feedbackId": "uuid-xxx",
      "analysis": {
        "sentiment": "positive",
        "sentiment_score": 0.95,
        "topics": ["quality", "satisfaction"],
        "summary": "Customer is very satisfied with quality",
        "recommendation": "Share positive feedback with team"
      }
    }
  ]
}
```

## Step 7: Run Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Test

```bash
# Requires dev server running
npm run dev

# In another terminal
TEST_USER_ID=user_test npm run test:analyze
```

## Core Features

### 1. Text Embeddings

Generate vector embeddings for semantic search:

```typescript
import { generateEmbedding } from '@/lib/langchain';

const embedding = await generateEmbedding('Customer feedback text');
// Returns: number[] (1536 dimensions for text-embedding-3-small)
```

### 2. Feedback Analysis

Analyze sentiment, extract topics, generate summaries:

```typescript
import { analyzeFeedback } from '@/lib/langchain';

const analysis = await analyzeFeedback('Product is great but expensive');
// Returns: {
//   sentiment: 'mixed',
//   sentiment_score: 0.65,
//   topics: ['product quality', 'pricing'],
//   summary: 'Customer likes product but finds it expensive',
//   recommendation: 'Consider pricing adjustments'
// }
```

### 3. Text Chunking

Split long text for processing:

```typescript
import { chunkText } from '@/lib/langchain';

const chunks = chunkText(longText, 3000);
// Returns: string[] (chunks of max 3000 chars)
```

### 4. Batch Processing

API automatically handles:
- ✅ Concurrent embedding generation (5 at a time)
- ✅ Concurrent analysis (3 at a time)
- ✅ Per-item error handling
- ✅ Progress tracking
- ✅ Rate limiting

## API Limits

### Default Limits

- **Max items per batch:** 100 (configurable via `MAX_ITEMS_PER_BATCH`)
- **Embedding concurrency:** 5 simultaneous requests
- **Analysis concurrency:** 3 simultaneous requests

### Cost Estimates

Per feedback item (using gpt-4o-mini and text-embedding-3-small):

- **Embedding:** ~$0.00001 (1,000 chars)
- **Analysis:** ~$0.00015 (3 LLM calls, ~450 tokens total)
- **Total:** ~$0.00016 per feedback item

Batch of 100 items: ~$0.016

## Monitoring & Telemetry

All operations log telemetry:

```
[OpenAI] ✓ embedText (342ms) {"model":"text-embedding-3-small","textLength":150}
[OpenAI] ✓ runLLM (1823ms) {"model":"gpt-4o-mini","tokensUsed":128}
[Langchain] ✓ analyzeFeedback (5432ms) {"sentiment":"positive","topicsCount":3}
```

**See:** `docs/telemetry.md` for monitoring setup (Sentry, PostHog)

## Production Checklist

### Required

- [ ] Set all environment variables in production
- [ ] Enable Clerk authentication (uncomment in `/api/analyze/route.ts`)
- [ ] Set up billing quotas (uncomment quota checks)
- [ ] Configure CORS if needed
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limiting at infrastructure level

### Recommended

- [ ] Enable Sentry for error tracking
- [ ] Enable PostHog for analytics
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy for database
- [ ] Implement API key rotation
- [ ] Set up CI/CD pipeline with tests

### Security

- [ ] Never commit `.env.local` or API keys
- [ ] Use service role key only in server-side code
- [ ] Validate all user inputs
- [ ] Implement rate limiting per user
- [ ] Set up Supabase Row Level Security (RLS) policies

## Troubleshooting

### OpenAI API Errors

**Rate limit exceeded:**
- Reduce `MAX_ITEMS_PER_BATCH`
- Decrease concurrency limits in `/api/analyze/route.ts`
- Upgrade OpenAI plan

**Authentication failed:**
- Verify `OPENAI_API_KEY` is correct
- Check API key has sufficient permissions
- Ensure no extra spaces in `.env.local`

### Database Errors

**Connection refused:**
- Verify Supabase URL and keys
- Check network connectivity
- Ensure Supabase project is active

**Permission denied:**
- Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
- Check RLS policies if using anon key

### Test Failures

**Jest tests fail:**
```bash
# Ensure Jest packages are installed
npm install --save-dev jest @types/jest jest-environment-node ts-jest
```

**API test fails:**
```bash
# Ensure dev server is running
npm run dev

# Check TEST_USER_ID is set
TEST_USER_ID=user_123 npm run test:analyze
```

## Next Steps

1. **Integrate with your app:**
   - Call `/api/analyze` from your frontend
   - Display analysis results to users
   - Build feedback dashboard

2. **Add authentication:**
   - Set up Clerk
   - Uncomment auth checks in API routes
   - Protect endpoints

3. **Enable billing:**
   - Implement quota system
   - Set up Stripe integration
   - Track usage per user

4. **Scale:**
   - Set up background job queue for large batches
   - Implement caching for embeddings
   - Add CDN for static assets

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Detailed Supabase Setup](./supabase-setup.md)
- [Telemetry & Monitoring](./telemetry.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review relevant documentation
3. Check console logs for detailed error messages
4. Verify all environment variables are set correctly

---

**Estimated setup time:** 15-30 minutes  
**Difficulty:** Intermediate  
**Cost:** ~$0.00016 per feedback item analyzed

