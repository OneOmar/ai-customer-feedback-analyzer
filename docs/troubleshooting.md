# Troubleshooting Guide

Common issues and solutions for the AI Customer Feedback Analyzer.

## OpenAI API Quota Exceeded (429 Error)

### Symptoms

- All analysis results show fallback values:
  - Sentiment: "neutral"
  - Topics: empty array `[]`
  - Summary: "Unable to generate summary"
  - Recommendation: "Review feedback manually"
- Server logs show:
  ```
  [OpenAI] ✗ embedText (2016ms) Error: 429 You exceeded your current quota
  [OpenAI] ✗ runLLM (2130ms) Error: 429 You exceeded your current quota
  ```

### Cause

Your OpenAI account has exceeded its usage quota or billing limit.

### Solutions

#### 1. Check Your OpenAI Usage

1. Go to: https://platform.openai.com/usage
2. Check your current usage and limits
3. Verify your billing information

#### 2. Add Payment Method

1. Go to: https://platform.openai.com/account/billing
2. Add a payment method if not already added
3. Set up billing limits if needed

#### 3. Upgrade Your Plan

1. Go to: https://platform.openai.com/account/billing
2. Check your current plan
3. Upgrade if you need higher limits

#### 4. Check API Key Limits

1. Go to: https://platform.openai.com/api-keys
2. Verify your API key is active
3. Check if there are any rate limits on your key

#### 5. Wait for Quota Reset

- Free tier quotas reset monthly
- Paid tier quotas depend on your plan
- Check your usage dashboard for reset dates

### Cost Estimates

Per feedback item analyzed:
- **Embedding**: ~$0.00001 (1,000 characters)
- **Analysis (3 LLM calls)**: ~$0.00015 (450 tokens total)
- **Total**: ~$0.00016 per item

For 100 items: ~$0.016

### Verification

After fixing the quota issue:

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Test the API:
   ```bash
   npm run test:analyze
   ```

3. You should see real analysis results instead of fallback values.

## Environment Variables Not Loading

### Symptoms

- `npm run check:env` shows variables as "NOT SET"
- API calls fail with authentication errors
- Server logs show "Missing environment variable" errors

### Solutions

#### 1. Verify File Location

Ensure `.env.local` is in the project root:
```
ai-customer-feedback-analyzer/
  ├── .env.local          ← Should be here
  ├── package.json
  ├── lib/
  └── ...
```

#### 2. Check File Format

`.env.local` should have this format (no spaces around `=`):
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_EMBED_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini
```

#### 3. Restart Dev Server

Environment variables are loaded at startup:
```bash
# Stop server (Ctrl+C)
npm run dev
```

#### 4. Verify Variables

```bash
npm run check:env
```

Should show all variables as ✅ set.

## Database Connection Issues

### Symptoms

- "Failed to insert feedback into database"
- "Connection refused" errors
- "Permission denied" errors

### Solutions

#### 1. Verify Supabase Configuration

Check `.env.local` has correct Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### 2. Test Database Connection

```typescript
import { createServerClient } from '@/lib/supabase';

const supabase = createServerClient();
const { data, error } = await supabase.from('feedback').select('count');

if (error) {
  console.error('Database error:', error);
}
```

#### 3. Check Supabase Project Status

1. Go to: https://supabase.com/dashboard
2. Verify your project is active
3. Check if project is paused (free tier projects pause after inactivity)

#### 4. Verify Database Tables

Run the SQL migrations:
```bash
# In Supabase SQL Editor, run:
# 1. supabase/sql/init.sql
# 2. supabase/sql/billing.sql (if needed)
```

## API Endpoint Not Responding

### Symptoms

- "fetch failed" errors
- Connection refused
- Timeout errors

### Solutions

#### 1. Verify Dev Server is Running

```bash
npm run dev
```

Should see:
```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

#### 2. Check Port

Default is `3000`. If occupied, Next.js will use the next available port.

#### 3. Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Should return `{ "status": "ok" }`

#### 4. Check for Errors

Look at server console for compilation errors or runtime errors.

## Analysis Returns Fallback Values

### Symptoms

- Sentiment always "neutral"
- Empty topics array
- "Unable to generate summary" messages

### Possible Causes

1. **OpenAI API quota exceeded** (see above)
2. **Invalid API key** - Check your OpenAI API key
3. **Network issues** - Check internet connection
4. **Rate limiting** - Too many requests too quickly

### Solutions

#### 1. Check Server Logs

Look for error messages in the dev server console:
```
[OpenAI] ✗ runLLM Error: ...
Sentiment analysis failed: ...
```

#### 2. Verify API Key

```bash
npm run check:env
```

Ensure `OPENAI_API_KEY` is set and valid.

#### 3. Test OpenAI Connection

```typescript
import { embedText } from '@/lib/openai';

try {
  const embedding = await embedText('test');
  console.log('OpenAI connection works!');
} catch (error) {
  console.error('OpenAI error:', error);
}
```

#### 4. Check Rate Limits

- Free tier: Limited requests per minute
- Paid tier: Higher limits
- Consider adding delays between requests for batch processing

## Test Failures

### Symptoms

- Jest tests fail
- Type errors
- Mock errors

### Solutions

#### 1. Install Test Dependencies

```bash
npm install --save-dev jest @types/jest jest-environment-node ts-jest @jest/globals
```

#### 2. Run Tests

```bash
npm test
```

#### 3. Check TypeScript Configuration

Ensure `tsconfig.json` includes Jest types:
```json
{
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
```

## Getting Help

### Debug Steps

1. **Check environment variables:**
   ```bash
   npm run check:env
   ```

2. **Check server logs:**
   - Look for error messages
   - Check telemetry logs `[OpenAI]` and `[Langchain]`

3. **Test individual components:**
   ```bash
   npm run test:analyze
   ```

4. **Verify API keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - Supabase: https://supabase.com/dashboard/project/_/settings/api

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `429 quota exceeded` | OpenAI quota limit | Add payment method, upgrade plan |
| `401 Unauthorized` | Invalid API key | Check API key in `.env.local` |
| `Connection refused` | Server not running | Start dev server: `npm run dev` |
| `Missing environment variable` | Env vars not set | Create `.env.local` file |
| `Failed to insert feedback` | Database issue | Check Supabase connection |

### Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

