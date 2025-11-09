# Telemetry & Monitoring

This document explains the telemetry and monitoring features built into the AI Customer Feedback Analyzer.

## Overview

All core library functions (`lib/openai.ts` and `lib/langchain.ts`) include built-in telemetry that logs:
- Start/end timestamps
- Operation duration (milliseconds)
- Success/failure status
- Relevant metadata (text length, model used, token usage, etc.)
- Error messages when operations fail

## Configuration

### Environment Variables

```bash
# Maximum items per batch operation (default: 100)
MAX_ITEMS_PER_BATCH=100
```

### Exported Constants

```typescript
import { MAX_ITEMS_PER_BATCH } from '@/lib/langchain';

console.log(`Max batch size: ${MAX_ITEMS_PER_BATCH}`);
```

## Telemetry Output

### Console Logs

All operations log to console with the following format:

```
[OpenAI] ✓ embedText (342ms) {"model":"text-embedding-3-small","textLength":150,"embeddingDimensions":1536}
[OpenAI] ✓ runLLM (1823ms) {"model":"gpt-4o-mini","promptLength":245,"tokensUsed":128}
[Langchain] ✓ analyzeFeedback (5432ms) {"textLength":150,"sentiment":"positive","topicsCount":3}
```

**Format:**
- `[Module]` - Source module (OpenAI or Langchain)
- `✓` or `✗` - Success or failure indicator
- Operation name - Function being called
- Duration - Time taken in milliseconds
- Metadata - JSON object with relevant details

### Error Logs

Failed operations include error details:

```
[OpenAI] ✗ embedText (523ms) {"model":"text-embedding-3-small","textLength":150}
[OpenAI] Error in embedText: Rate limit exceeded
```

## Integration with Monitoring Services

The codebase includes commented TODO sections showing where to integrate with popular monitoring services.

### Sentry Integration

For error tracking and exception monitoring:

**Example locations:**
- `lib/openai.ts` - Lines 44-50, 161-165, 253-257
- `lib/langchain.ts` - Lines 50-55

**Implementation:**

```typescript
import * as Sentry from '@sentry/nextjs';

// In logTelemetry function
if (!data.success && data.error) {
  Sentry.captureException(new Error(data.error), {
    tags: { operation: data.operation },
    extra: { duration, metadata: data.metadata }
  });
}
```

**Setup:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Then uncomment the Sentry integration code blocks.

### PostHog Integration

For analytics and product metrics:

**Example locations:**
- `lib/openai.ts` - Lines 52-58, 134-140, 225-232
- `lib/langchain.ts` - Lines 57-63, 333-349

**Implementation:**

```typescript
import { PostHog } from 'posthog-node';

const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
);

// In logTelemetry function
posthog.capture({
  distinctId: 'system',
  event: 'api_call',
  properties: {
    operation: data.operation,
    success: data.success,
    duration_ms: duration,
    ...data.metadata
  }
});
```

**Setup:**

```bash
npm install posthog-node posthog-js
```

Then uncomment the PostHog integration code blocks.

## Tracked Operations

### OpenAI Operations (`lib/openai.ts`)

#### `embedText(text: string)`

**Success metadata:**
- `model` - Embedding model used
- `textLength` - Input text length
- `embeddingDimensions` - Output vector dimensions

**Failure metadata:**
- `model` - Embedding model attempted
- `textLength` - Input text length

#### `runLLM(prompt: string, maxTokens: number)`

**Success metadata:**
- `model` - LLM model used
- `promptLength` - Input prompt length
- `maxTokens` - Token limit
- `responseLength` - Output text length
- `tokensUsed` - Total tokens consumed

**Failure metadata:**
- `model` - LLM model attempted
- `promptLength` - Input prompt length
- `maxTokens` - Token limit

### Langchain Operations (`lib/langchain.ts`)

#### `generateEmbedding(text: string)`

**Success metadata:**
- `textLength` - Input text length
- `dimensions` - Output vector dimensions

**Failure metadata:**
- `textLength` - Input text length

#### `analyzeFeedback(text: string)`

**Success metadata:**
- `textLength` - Input feedback length
- `sentiment` - Detected sentiment
- `topicsCount` - Number of topics extracted
- `hasScore` - Whether sentiment score is available

**Note:** This operation makes 3 LLM calls internally, each logged separately via `runLLM`.

## Business Metrics Examples

### Track Negative Feedback

```typescript
// In lib/langchain.ts analyzeFeedback function
if (sentiment === 'negative') {
  posthog.capture('negative_feedback_detected', {
    topics,
    sentiment_score,
    user_id: userId // if available
  });
  
  // Alert on Sentry
  Sentry.captureMessage('Negative feedback received', {
    level: 'warning',
    tags: { sentiment_score }
  });
}
```

### Track High-Value Customers

```typescript
// In API route
if (rating >= 4) {
  posthog.capture('positive_feedback', {
    user_id: userId,
    rating,
    topics
  });
}
```

### Monitor API Costs

```typescript
// Track token usage
posthog.capture('tokens_used', {
  user_id: userId,
  tokens: response.usage?.total_tokens,
  model,
  cost_estimate: calculateCost(response.usage?.total_tokens, model)
});
```

## Performance Monitoring

### Duration Tracking

All operations track duration automatically. Use this to:
- Identify slow operations
- Track performance degradation
- Optimize API calls

### Success Rate

Monitor success/failure rates:

```typescript
// In monitoring dashboard
const successRate = successfulCalls / totalCalls;

if (successRate < 0.95) {
  // Alert: API reliability issues
}
```

## Privacy Considerations

**What is logged:**
- Text lengths (not content)
- Model names
- Token counts
- Sentiment labels
- Topic counts

**What is NOT logged:**
- Actual feedback text
- User identifiable information
- API keys or secrets

When integrating with external services, ensure compliance with your privacy policy and data regulations (GDPR, CCPA, etc.).

## Customization

### Disable Telemetry

To disable console logging:

```typescript
// In lib/openai.ts or lib/langchain.ts
function logTelemetry(data) {
  // Comment out console.log calls
  // Keep only external service integrations
}
```

### Custom Telemetry Handler

Create a custom handler:

```typescript
// lib/telemetry.ts
export function logTelemetry(data: TelemetryData) {
  // Your custom logic
  if (process.env.NODE_ENV === 'production') {
    // Send to external service
  } else {
    // Log to console for development
    console.log(data);
  }
}
```

Then import and use in your modules.

## Best Practices

1. **Monitor in production** - Enable Sentry/PostHog in production environments
2. **Alert on failures** - Set up alerts for high error rates
3. **Track costs** - Monitor token usage to manage API costs
4. **Respect privacy** - Never log sensitive user data
5. **Aggregate metrics** - Use PostHog to create dashboards for key metrics
6. **Set baselines** - Track typical operation durations to detect anomalies

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [PostHog Next.js Documentation](https://posthog.com/docs/libraries/next-js)
- [OpenAI API Usage Tracking](https://platform.openai.com/docs/guides/production-best-practices)

