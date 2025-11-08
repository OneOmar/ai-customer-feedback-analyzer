import OpenAI from 'openai';

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
    
    return response.data[0].embedding;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
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
    
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to run LLM: ${message}`);
  }
}
