import { OpenAI } from 'openai'

/**
 * OpenAI client configuration
 * Provides AI capabilities for sentiment analysis and feedback processing
 */

// Validate API key
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('Missing OpenAI API key')
}

/**
 * OpenAI client instance
 * Use this for making AI API calls
 */
export const openai = new OpenAI({
  apiKey,
})

/**
 * Default model configuration
 */
export const DEFAULT_MODEL = 'gpt-4-turbo-preview'

/**
 * Analyze sentiment of customer feedback
 * @param feedback - The feedback text to analyze
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(feedback: string) {
  // Placeholder for sentiment analysis logic
  // Will be implemented in future iterations
  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a sentiment analysis assistant. Analyze the sentiment of customer feedback and respond with: positive, negative, or neutral.',
      },
      {
        role: 'user',
        content: feedback,
      },
    ],
  })

  return response.choices[0]?.message?.content || 'neutral'
}

