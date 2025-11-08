# Scripts

Utility scripts for development, testing, and maintenance.

## Available Scripts

### test-analyze.ts

Tests the `/api/analyze` endpoint with sample feedback data.

**Usage:**

```bash
# Basic usage (requires TEST_USER_ID)
TEST_USER_ID=user_test_123 npm run test:analyze

# With custom API URL
LOCAL_API_URL=http://localhost:4000 TEST_USER_ID=user_test_123 npm run test:analyze
```

**Environment Variables:**

- `TEST_USER_ID` (required) - User ID for testing
- `LOCAL_API_URL` (optional) - API base URL (default: `http://localhost:3000`)

**Prerequisites:**

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Ensure required environment variables are set in `.env`:
   ```
   OPENAI_API_KEY=your_key
   OPENAI_EMBED_MODEL=text-embedding-3-small
   OPENAI_LLM_MODEL=gpt-4o-mini
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

**Output:**

The script will:
- Send a sample feedback item to the analyze API
- Display the full request and response
- Show analysis results (sentiment, topics, summary, recommendation)
- Exit with code 0 on success, 1 on failure

**Example Output:**

```
🔍 Testing /api/analyze endpoint
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 API URL: http://localhost:3000/api/analyze
👤 User ID: user_test_123

📤 Request Body:
{
  "userId": "user_test_123",
  "items": [
    {
      "text": "The product quality is excellent...",
      "rating": 5,
      "source": "test-script"
    }
  ]
}

⏳ Sending request...

📥 Response received
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Duration: 3542ms
📊 Status: 200 OK

✅ Test PASSED

📊 Analysis Summary:
   Sentiment: positive (0.92)
   Topics: product quality, satisfaction
   Summary: Customer is very satisfied with product quality
   Recommendation: Continue maintaining high quality standards

✓ Total: 1
✓ Succeeded: 1
✓ Failed: 0
```

### seed-supabase.ts

Seeds the Supabase database with test data.

**Usage:**

```bash
# Seed database
npm run seed:supabase

# Cleanup (remove test data)
npm run seed:cleanup
```

## Adding New Scripts

When creating new scripts:

1. Create TypeScript file in `scripts/` directory
2. Add shebang line: `#!/usr/bin/env tsx`
3. Use dotenv to load environment variables
4. Add proper error handling and exit codes
5. Add helpful console output with status indicators
6. Document in this README
7. Add npm script to `package.json`

**Template:**

```typescript
#!/usr/bin/env tsx

import * as dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  try {
    console.log('🚀 Starting...');
    
    // Your logic here
    
    console.log('✅ Success');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
```

