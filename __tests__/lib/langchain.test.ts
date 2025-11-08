/// <reference types="jest" />

import { analyzeFeedback, chunkText, generateEmbedding } from '@/lib/langchain';
import { embedText, runLLM } from '@/lib/openai';

// Mock the openai module
jest.mock('@/lib/openai', () => ({
  embedText: jest.fn(),
  runLLM: jest.fn(),
}));

const mockEmbedText = embedText as jest.MockedFunction<typeof embedText>;
const mockRunLLM = runLLM as jest.MockedFunction<typeof runLLM>;

describe('lib/langchain', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should return embedding from embedText', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockEmbedText.mockResolvedValue(mockEmbedding);

      const result = await generateEmbedding('test text');

      expect(mockEmbedText).toHaveBeenCalledWith('test text');
      expect(result).toEqual(mockEmbedding);
      expect(result).toHaveLength(1536);
    });

    it('should propagate errors from embedText', async () => {
      mockEmbedText.mockRejectedValue(new Error('API Error'));

      await expect(generateEmbedding('test')).rejects.toThrow('API Error');
    });
  });

  describe('chunkText', () => {
    it('should return single chunk for short text', () => {
      const shortText = 'This is a short text.';
      const chunks = chunkText(shortText, 1000);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(shortText);
    });

    it('should split text at sentence boundaries', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const chunks = chunkText(text, 40);

      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should be a complete sentence or group of sentences
      chunks.forEach(chunk => {
        expect(chunk.trim()).toBeTruthy();
      });
    });

    it('should handle text longer than maxLen without sentences', () => {
      const longWord = 'a'.repeat(5000);
      const chunks = chunkText(longWord, 3000);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(3000);
      });
    });

    it('should respect maxLen parameter', () => {
      const text = 'Word '.repeat(1000); // Very long text
      const maxLen = 500;
      const chunks = chunkText(text, maxLen);

      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(maxLen + 50); // Allow some margin for word boundaries
      });
    });

    it('should use default maxLen of 3000', () => {
      const text = 'a'.repeat(2000);
      const chunks = chunkText(text);

      expect(chunks).toHaveLength(1); // Should fit in default 3000
    });

    it('should handle empty string', () => {
      const chunks = chunkText('', 1000);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('');
    });

    it('should handle text with multiple sentence types', () => {
      const text = 'This is a statement. Is this a question? This is exciting! Another statement.';
      const chunks = chunkText(text, 50);

      expect(chunks.length).toBeGreaterThan(0);
      const rejoined = chunks.join(' ').replace(/\s+/g, ' ');
      const original = text.replace(/\s+/g, ' ');
      // Content should be preserved (allowing for spacing differences)
      expect(rejoined).toContain('statement');
      expect(rejoined).toContain('question');
      expect(rejoined).toContain('exciting');
    });
  });

  describe('analyzeFeedback', () => {
    beforeEach(() => {
      // Set up default mock responses for all three LLM calls
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'positive', confidence: 0.85 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['product quality', 'customer service'] }))
        .mockResolvedValueOnce(JSON.stringify({ 
          summary: 'Customer is satisfied with the product',
          recommendation: 'Continue maintaining quality standards'
        }));
    });

    it('should return valid analysis with all required fields', async () => {
      const result = await analyzeFeedback('Great product, excellent service!');

      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('recommendation');
      expect(mockRunLLM).toHaveBeenCalledTimes(3);
    });

    it('should have sentiment in allowed set', async () => {
      const result = await analyzeFeedback('The product is okay.');

      expect(['positive', 'neutral', 'negative', 'mixed']).toContain(result.sentiment);
    });

    it('should return positive sentiment correctly', async () => {
      const result = await analyzeFeedback('Amazing product!');

      expect(result.sentiment).toBe('positive');
      expect(result.sentiment_score).toBe(0.85);
    });

    it('should return topics array with at least 1 item', async () => {
      const result = await analyzeFeedback('The shipping was fast but product quality needs improvement.');

      expect(Array.isArray(result.topics)).toBe(true);
      expect(result.topics.length).toBeGreaterThanOrEqual(1);
      expect(result.topics).toContain('product quality');
      expect(result.topics).toContain('customer service');
    });

    it('should return non-empty summary', async () => {
      const result = await analyzeFeedback('Good product overall.');

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
      expect(typeof result.summary).toBe('string');
    });

    it('should return non-empty recommendation', async () => {
      const result = await analyzeFeedback('Product needs better packaging.');

      expect(result.recommendation).toBeTruthy();
      expect(result.recommendation.length).toBeGreaterThan(0);
      expect(typeof result.recommendation).toBe('string');
    });

    it('should handle negative sentiment', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'negative', confidence: 0.92 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['poor quality', 'delivery issues'] }))
        .mockResolvedValueOnce(JSON.stringify({ 
          summary: 'Customer is dissatisfied',
          recommendation: 'Investigate quality control processes'
        }));

      const result = await analyzeFeedback('Terrible product, arrived damaged.');

      expect(result.sentiment).toBe('negative');
      expect(result.sentiment_score).toBe(0.92);
    });

    it('should handle mixed sentiment', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'mixed', confidence: 0.65 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['good features', 'high price'] }))
        .mockResolvedValueOnce(JSON.stringify({ 
          summary: 'Mixed feelings about product',
          recommendation: 'Consider pricing adjustments'
        }));

      const result = await analyzeFeedback('Love the features but too expensive.');

      expect(result.sentiment).toBe('mixed');
      expect(result.topics).toContain('good features');
    });

    it('should handle neutral sentiment', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'neutral', confidence: 0.70 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['standard features'] }))
        .mockResolvedValueOnce(JSON.stringify({ 
          summary: 'Product meets expectations',
          recommendation: 'Maintain current standards'
        }));

      const result = await analyzeFeedback('Product is as expected.');

      expect(result.sentiment).toBe('neutral');
    });

    it('should handle JSON in markdown code blocks', async () => {
      mockRunLLM
        .mockResolvedValueOnce('```json\n{"sentiment": "positive", "confidence": 0.88}\n```')
        .mockResolvedValueOnce('```\n{"topics": ["feature request"]}\n```')
        .mockResolvedValueOnce('```json\n{"summary": "Test", "recommendation": "Test rec"}\n```');

      const result = await analyzeFeedback('Nice product.');

      expect(result.sentiment).toBe('positive');
      expect(result.topics).toContain('feature request');
      expect(result.summary).toBe('Test');
    });

    it('should fallback to neutral on sentiment parsing error', async () => {
      mockRunLLM
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce(JSON.stringify({ topics: ['test'] }))
        .mockResolvedValueOnce(JSON.stringify({ summary: 'Test', recommendation: 'Test' }));

      const result = await analyzeFeedback('Test feedback');

      expect(result.sentiment).toBe('neutral');
      expect(result.topics).toEqual(['test']);
    });

    it('should handle empty topics array gracefully', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'positive', confidence: 0.8 }))
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce(JSON.stringify({ summary: 'Test', recommendation: 'Test' }));

      const result = await analyzeFeedback('Test feedback');

      expect(Array.isArray(result.topics)).toBe(true);
      expect(result.topics).toEqual([]);
    });

    it('should handle summary parsing error with fallback', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'positive', confidence: 0.8 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['test'] }))
        .mockResolvedValueOnce('invalid json');

      const result = await analyzeFeedback('Test feedback');

      expect(result.summary).toBe('Unable to generate summary');
      expect(result.recommendation).toBe('Review feedback manually');
    });

    it('should handle LLM API errors gracefully', async () => {
      mockRunLLM
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['test'] }))
        .mockResolvedValueOnce(JSON.stringify({ summary: 'Test', recommendation: 'Test' }));

      const result = await analyzeFeedback('Test feedback');

      // Should fallback to neutral and continue with other calls
      expect(result.sentiment).toBe('neutral');
      expect(result.topics).toEqual(['test']);
    });

    it('should filter out non-string topics', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'positive', confidence: 0.8 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['valid', 123, null, 'also valid', {}] }))
        .mockResolvedValueOnce(JSON.stringify({ summary: 'Test', recommendation: 'Test' }));

      const result = await analyzeFeedback('Test feedback');

      expect(result.topics).toEqual(['valid', 'also valid']);
    });

    it('should include sentiment_score when confidence is provided', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'positive', confidence: 0.95 }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['quality'] }))
        .mockResolvedValueOnce(JSON.stringify({ summary: 'Great', recommendation: 'Keep it up' }));

      const result = await analyzeFeedback('Excellent product!');

      expect(result.sentiment_score).toBe(0.95);
    });

    it('should handle missing confidence field', async () => {
      mockRunLLM
        .mockResolvedValueOnce(JSON.stringify({ sentiment: 'positive' }))
        .mockResolvedValueOnce(JSON.stringify({ topics: ['quality'] }))
        .mockResolvedValueOnce(JSON.stringify({ summary: 'Great', recommendation: 'Keep it up' }));

      const result = await analyzeFeedback('Excellent product!');

      expect(result.sentiment_score).toBeUndefined();
    });

    it('should call runLLM with appropriate prompts', async () => {
      const feedbackText = 'Test feedback text';
      await analyzeFeedback(feedbackText);

      // Check that runLLM was called with prompts containing the feedback text
      expect(mockRunLLM).toHaveBeenNthCalledWith(
        1, 
        expect.stringContaining('sentiment'),
        100
      );
      expect(mockRunLLM).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('topic'),
        150
      );
      expect(mockRunLLM).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('summary'),
        200
      );

      // All prompts should contain the feedback text
      const calls = mockRunLLM.mock.calls;
      calls.forEach((call: unknown[]) => {
        expect(call[0]).toContain(feedbackText);
      });
    });
  });
});

