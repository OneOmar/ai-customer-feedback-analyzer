import OpenAI from 'openai';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum number of items to process per batch
 * Can be overridden via MAX_ITEMS_PER_BATCH environment variable
 */
export const MAX_ITEMS_PER_BATCH = parseInt(
  process.env.MAX_ITEMS_PER_BATCH || '100',
  10
);

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
    `[OpenAI] ${status} ${data.operation} (${duration}ms)`,
    data.metadata ? JSON.stringify(data.metadata) : ''
  );
  
  if (data.error) {
    console.error(`[OpenAI] Error in ${data.operation}:`, data.error);
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
  // posthog.capture('openai_api_call', {
  //   operation: data.operation,
  //   success: data.success,
  //   duration_ms: duration,
  //   ...data.metadata
  // });
}

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

/**
 * Returns a configured OpenAI client instance.
 * 
 * @returns {OpenAI} Configured OpenAI client
 * @throws {Error} If OPENAI_API_KEY is not set
 * 
 * @example
 * ```typescript
 * const client = getOpenAIClient();
 * ```
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  return new OpenAI({ apiKey });
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Generates embeddings for the given text using OpenAI's embedding model.
 * 
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} Array of embedding values
 * @throws {Error} If OPENAI_EMBED_MODEL is not set or API call fails
 * 
 * @example
 * ```typescript
 * const embedding = await embedText('Hello, world!');
 * console.log(embedding.length); // e.g., 1536 for text-embedding-ada-002
 * ```
 */
export async function embedText(text: string): Promise<number[]> {
  const startTime = Date.now();
  const model = process.env.OPENAI_EMBED_MODEL;
  
  if (!model) {
    throw new Error('OPENAI_EMBED_MODEL environment variable is not set');
  }
  
  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model,
      input: text,
    });
    
    const embedding = response.data[0].embedding;
    const endTime = Date.now();
    
    // Log successful embedding generation
    logTelemetry({
      operation: 'embedText',
      startTime,
      endTime,
      success: true,
      metadata: {
        model,
        textLength: text.length,
        embeddingDimensions: embedding.length,
      },
    });
    
    // TODO: Track successful embeddings in analytics
    // Example PostHog:
    // posthog.capture('embedding_generated', {
    //   model,
    //   text_length: text.length,
    //   dimensions: embedding.length
    // });
    
    return embedding;
  } catch (error) {
    const endTime = Date.now();
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed embedding generation
    logTelemetry({
      operation: 'embedText',
      startTime,
      endTime,
      success: false,
      error: message,
      metadata: {
        model,
        textLength: text.length,
      },
    });
    
    // TODO: Track embedding failures in error monitoring
    // Example Sentry:
    // Sentry.captureException(error, {
    //   tags: { operation: 'embedText', model },
    //   extra: { textLength: text.length }
    // });
    
    throw new Error(`Failed to generate embedding: ${message}`);
  }
}

/**
 * Runs a completion using OpenAI's language model.
 * 
 * @param {string} prompt - The prompt to send to the model
 * @param {number} [maxTokens=1000] - Maximum tokens to generate (default: 1000)
 * @returns {Promise<string>} The generated text response
 * @throws {Error} If OPENAI_LLM_MODEL is not set or API call fails
 * 
 * @example
 * ```typescript
 * const response = await runLLM('Explain quantum computing in simple terms', 150);
 * console.log(response);
 * ```
 */
export async function runLLM(prompt: string, maxTokens: number = 1000): Promise<string> {
  const startTime = Date.now();
  const model = process.env.OPENAI_LLM_MODEL;
  
  if (!model) {
    throw new Error('OPENAI_LLM_MODEL environment variable is not set');
  }
  
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: maxTokens,
    });
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }
    
    const endTime = Date.now();
    
    // Log successful LLM completion
    logTelemetry({
      operation: 'runLLM',
      startTime,
      endTime,
      success: true,
      metadata: {
        model,
        promptLength: prompt.length,
        maxTokens,
        responseLength: content.length,
        tokensUsed: response.usage?.total_tokens,
      },
    });
    
    // TODO: Track LLM usage in analytics
    // Example PostHog:
    // posthog.capture('llm_completion', {
    //   model,
    //   prompt_length: prompt.length,
    //   response_length: content.length,
    //   tokens_used: response.usage?.total_tokens
    // });
    
    return content;
  } catch (error) {
    const endTime = Date.now();
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed LLM completion
    logTelemetry({
      operation: 'runLLM',
      startTime,
      endTime,
      success: false,
      error: message,
      metadata: {
        model,
        promptLength: prompt.length,
        maxTokens,
      },
    });
    
    // TODO: Track LLM failures in error monitoring
    // Example Sentry:
    // Sentry.captureException(error, {
    //   tags: { operation: 'runLLM', model },
    //   extra: { promptLength: prompt.length, maxTokens }
    // });
    
    throw new Error(`Failed to run LLM: ${message}`);
  }
}
