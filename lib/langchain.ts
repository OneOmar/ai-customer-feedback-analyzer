import { embedText, runLLM, MAX_ITEMS_PER_BATCH } from './openai';

// Export MAX_ITEMS_PER_BATCH for use in API routes
export { MAX_ITEMS_PER_BATCH };

// ============================================================================
// TYPES
// ============================================================================

/**
 * Type definition for feedback analysis result.
 */
export interface FeedbackAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentiment_score?: number;
  topics: string[];
  summary: string;
  recommendation: string;
}

// ============================================================================
// TELEMETRY HELPERS
// ============================================================================

/**
 * Logs telemetry data for monitoring and debugging
 */
function logTelemetry(data: {
  operation: string;
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  const duration = data.endTime - data.startTime;
  const status = data.success ? '✓' : '✗';
  
  console.log(
    `[Langchain] ${status} ${data.operation} (${duration}ms)`,
    data.metadata ? JSON.stringify(data.metadata) : ''
  );
  
  if (data.error) {
    console.error(`[Langchain] Error in ${data.operation}:`, data.error);
  }
  
  // TODO: Send telemetry to monitoring services
  // Example Sentry integration:
  // if (!data.success && data.error) {
  //   Sentry.captureException(new Error(data.error), {
  //     tags: { operation: data.operation },
  //     extra: { duration, metadata: data.metadata }
  //   });
  // }
  
  // Example PostHog integration:
  // posthog.capture('langchain_operation', {
  //   operation: data.operation,
  //   success: data.success,
  //   duration_ms: duration,
  //   ...data.metadata
  // });
}

// ============================================================================
// EMBEDDING FUNCTIONS
// ============================================================================

/**
 * Generates embeddings for the given text.
 * Thin wrapper around the OpenAI embedText function with telemetry.
 * 
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} Array of embedding values
 * 
 * @example
 * ```typescript
 * const embedding = await generateEmbedding('Customer loves the product!');
 * console.log(embedding.length); // e.g., 1536
 * ```
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const startTime = Date.now();
  
  try {
    const embedding = await embedText(text);
    const endTime = Date.now();
    
    logTelemetry({
      operation: 'generateEmbedding',
      startTime,
      endTime,
      success: true,
      metadata: {
        textLength: text.length,
        dimensions: embedding.length,
      },
    });
    
    return embedding;
  } catch (error) {
    const endTime = Date.now();
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    logTelemetry({
      operation: 'generateEmbedding',
      startTime,
      endTime,
      success: false,
      error: message,
      metadata: { textLength: text.length },
    });
    
    throw error;
  }
}

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Chunks text into smaller pieces based on approximate sentence boundaries.
 * Simple implementation that splits by sentences without exceeding maxLen.
 * 
 * @param {string} text - The text to chunk
 * @param {number} [maxLen=3000] - Maximum length per chunk (default: 3000)
 * @returns {string[]} Array of text chunks
 * 
 * @example
 * ```typescript
 * const chunks = chunkText('Very long text...', 1000);
 * console.log(chunks.length); // Number of chunks created
 * ```
 */
export function chunkText(text: string, maxLen: number = 3000): string[] {
  if (text.length <= maxLen) {
    return [text];
  }

  const chunks: string[] = [];
  // Split by sentence-ending punctuation followed by space
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    // If single sentence exceeds maxLen, split it by word boundaries
    if (sentence.length > maxLen) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if ((currentChunk + ' ' + word).length > maxLen) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
      continue;
    }
    
    // Check if adding this sentence would exceed maxLen
    if ((currentChunk + ' ' + sentence).length > maxLen) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

// ============================================================================
// ANALYSIS HELPERS
// ============================================================================

/**
 * Safely parses JSON with fallback to default value.
 * 
 * @param {string} jsonStr - JSON string to parse
 * @param {T} fallback - Fallback value if parsing fails
 * @returns {T} Parsed object or fallback
 */
function safeParseJSON<T>(jsonStr: string, fallback: T): T {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const cleanJson = jsonMatch ? jsonMatch[1] : jsonStr;
    
    return JSON.parse(cleanJson.trim()) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// FEEDBACK ANALYSIS
// ============================================================================

/**
 * Analyzes customer feedback using multiple LLM calls for sentiment, topics, and recommendations.
 * 
 * Cost note: Makes 3 separate LLM API calls per feedback item:
 * 1. Sentiment classification (~100 tokens)
 * 2. Topic extraction (~150 tokens)
 * 3. Summary + recommendation (~200 tokens)
 * 
 * @param {string} text - The customer feedback text to analyze
 * @returns {Promise<FeedbackAnalysis>} Analysis result with sentiment, topics, summary, and recommendation
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeFeedback(
 *   'The product is great but the shipping was delayed by 3 days.'
 * );
 * console.log(analysis.sentiment); // 'mixed'
 * console.log(analysis.topics); // ['product quality', 'shipping delay']
 * console.log(analysis.recommendation); // 'Improve shipping reliability...'
 * ```
 */
export async function analyzeFeedback(text: string): Promise<FeedbackAnalysis> {
  const startTime = Date.now();
  // Subtask 1: Sentiment classification
  const sentimentPrompt = `Analyze the sentiment of this customer feedback. Return ONLY JSON in this format: {"sentiment": "positive"|"neutral"|"negative"|"mixed", "confidence": 0.0-1.0}

Feedback: ${text}`;

  let sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  let sentiment_score: number | undefined;

  try {
    const sentimentResponse = await runLLM(sentimentPrompt, 100);
    const sentimentData = safeParseJSON<{ sentiment?: string; confidence?: number }>(
      sentimentResponse,
      { sentiment: 'neutral', confidence: 0.5 }
    );
    
    if (
      sentimentData.sentiment === 'positive' ||
      sentimentData.sentiment === 'neutral' ||
      sentimentData.sentiment === 'negative' ||
      sentimentData.sentiment === 'mixed'
    ) {
      sentiment = sentimentData.sentiment;
    }
    
    if (typeof sentimentData.confidence === 'number') {
      sentiment_score = sentimentData.confidence;
    }
  } catch (error) {
    // Fallback to neutral if sentiment analysis fails
    console.error('Sentiment analysis failed:', error);
  }

  // Subtask 2: Topic extraction
  const topicPrompt = `Extract key topics from this customer feedback. Return ONLY JSON in this format: {"topics": ["topic1", "topic2", ...]}

Feedback: ${text}`;

  let topics: string[] = [];

  try {
    const topicResponse = await runLLM(topicPrompt, 150);
    const topicData = safeParseJSON<{ topics?: string[] }>(
      topicResponse,
      { topics: [] }
    );
    
    if (Array.isArray(topicData.topics)) {
      topics = topicData.topics.filter(t => typeof t === 'string');
    }
  } catch (error) {
    console.error('Topic extraction failed:', error);
  }

  // Subtask 3: Summary + actionable recommendation
  const summaryPrompt = `Summarize this customer feedback and provide one actionable recommendation. Return ONLY JSON in this format: {"summary": "brief summary", "recommendation": "single actionable recommendation"}

Feedback: ${text}`;

  let summary = 'Unable to generate summary';
  let recommendation = 'Review feedback manually';

  try {
    const summaryResponse = await runLLM(summaryPrompt, 200);
    const summaryData = safeParseJSON<{ summary?: string; recommendation?: string }>(
      summaryResponse,
      { summary: 'Unable to generate summary', recommendation: 'Review feedback manually' }
    );
    
    if (typeof summaryData.summary === 'string' && summaryData.summary) {
      summary = summaryData.summary;
    }
    
    if (typeof summaryData.recommendation === 'string' && summaryData.recommendation) {
      recommendation = summaryData.recommendation;
    }
  } catch (error) {
    console.error('Summary generation failed:', error);
  }

  const endTime = Date.now();
  
  // Log successful analysis completion
  logTelemetry({
    operation: 'analyzeFeedback',
    startTime,
    endTime,
    success: true,
    metadata: {
      textLength: text.length,
      sentiment,
      topicsCount: topics.length,
      hasScore: sentiment_score !== undefined,
    },
  });
  
  // TODO: Track feedback analysis in analytics
  // Example PostHog:
  // posthog.capture('feedback_analyzed', {
  //   sentiment,
  //   topics_count: topics.length,
  //   text_length: text.length,
  //   has_sentiment_score: sentiment_score !== undefined
  // });
  
  // TODO: Track analysis metrics in monitoring
  // Example for business metrics:
  // if (sentiment === 'negative') {
  //   posthog.capture('negative_feedback_detected', {
  //     topics,
  //     sentiment_score
  //   });
  // }

  return {
    sentiment,
    sentiment_score,
    topics,
    summary,
    recommendation,
  };
}

