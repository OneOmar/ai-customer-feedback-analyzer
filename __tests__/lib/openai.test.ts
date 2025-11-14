/// <reference types="jest" />

import { embedText, runLLM, getOpenAIClient } from '@/lib/openai';

// Mock the OpenAI module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import OpenAI from 'openai';

describe('lib/openai', () => {
  let mockClient: {
    embeddings: { create: jest.Mock };
    chat: { completions: { create: jest.Mock } };
  };

  // Suppress console output during tests for cleaner test output
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Create a fresh mock client instance
    mockClient = {
      embeddings: {
        create: jest.fn(),
      },
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    // Mock the OpenAI constructor to return our mock client
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockClient as any);
  });

  describe('getOpenAIClient', () => {
    it('should return OpenAI client instance when API key is set', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const client = getOpenAIClient();

      expect(OpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
      expect(client).toBeDefined();
    });

    it('should throw error when OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY environment variable is not set');
    });
  });

  describe('embedText', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      process.env.OPENAI_EMBED_MODEL = 'text-embedding-3-small';
    });

    it('should return an array of numbers', async () => {
      // Mock embedding response with numeric array
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      mockClient.embeddings.create.mockResolvedValue({
        data: [
          {
            embedding: mockEmbedding,
            index: 0,
            object: 'embedding',
          },
        ],
        model: 'text-embedding-3-small',
        object: 'list',
        usage: {
          prompt_tokens: 5,
          total_tokens: 5,
        },
      });

      const result = await embedText('test text');

      // Assert returned value is an array
      expect(Array.isArray(result)).toBe(true);
      // Assert every item is a number
      expect(result.every((item) => typeof item === 'number')).toBe(true);
      // Assert the values match
      expect(result).toEqual(mockEmbedding);
    });

    it('should return array with correct shape for different embedding dimensions', async () => {
      // Test with 1536 dimensions (common for text-embedding-ada-002)
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockClient.embeddings.create.mockResolvedValue({
        data: [
          {
            embedding: mockEmbedding,
            index: 0,
            object: 'embedding',
          },
        ],
        model: 'text-embedding-3-small',
        object: 'list',
        usage: {
          prompt_tokens: 10,
          total_tokens: 10,
        },
      });

      const result = await embedText('longer test text');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1536);
      expect(result.every((item) => typeof item === 'number')).toBe(true);
    });

    it('should call OpenAI client with correct parameters', async () => {
      const testText = 'Hello, world!';
      const testModel = 'text-embedding-3-small';
      process.env.OPENAI_EMBED_MODEL = testModel;

      mockClient.embeddings.create.mockResolvedValue({
        data: [
          {
            embedding: [0.1, 0.2, 0.3],
            index: 0,
            object: 'embedding',
          },
        ],
        model: testModel,
        object: 'list',
        usage: {
          prompt_tokens: 3,
          total_tokens: 3,
        },
      });

      await embedText(testText);

      // Verify the client was called with expected shape
      expect(mockClient.embeddings.create).toHaveBeenCalledTimes(1);
      expect(mockClient.embeddings.create).toHaveBeenCalledWith({
        model: testModel,
        input: testText,
      });
    });

    it('should throw error when OPENAI_EMBED_MODEL is not set', async () => {
      delete process.env.OPENAI_EMBED_MODEL;

      await expect(embedText('test')).rejects.toThrow(
        'OPENAI_EMBED_MODEL environment variable is not set'
      );
    });

    it('should handle API errors and surface them appropriately', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockClient.embeddings.create.mockRejectedValue(apiError);

      await expect(embedText('test')).rejects.toThrow('Failed to generate embedding');
      await expect(embedText('test')).rejects.toThrow('API rate limit exceeded');
    });

    it('should provide helpful message for quota/billing errors', async () => {
      const quotaError = new Error('429 Too Many Requests');
      mockClient.embeddings.create.mockRejectedValue(quotaError);

      await expect(embedText('test')).rejects.toThrow('quota exceeded');
      await expect(embedText('test')).rejects.toThrow('platform.openai.com/usage');
    });

    it('should handle errors with billing keyword', async () => {
      const billingError = new Error('billing issue detected');
      mockClient.embeddings.create.mockRejectedValue(billingError);

      await expect(embedText('test')).rejects.toThrow('quota exceeded');
    });
  });

  describe('runLLM', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      process.env.OPENAI_LLM_MODEL = 'gpt-4o-mini';
    });

    it('should call OpenAI client with expected prompt shape', async () => {
      const testPrompt = 'Explain quantum computing';
      const testModel = 'gpt-4o-mini';
      process.env.OPENAI_LLM_MODEL = testModel;

      mockClient.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: testModel,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Quantum computing is...',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 50,
          total_tokens: 60,
        },
      });

      await runLLM(testPrompt);

      // Verify the client was called with expected payload shape
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];

      // Check keys and types, not exact text
      expect(callArgs).toHaveProperty('model');
      expect(callArgs).toHaveProperty('messages');
      expect(callArgs).toHaveProperty('temperature');
      expect(callArgs).toHaveProperty('max_tokens');

      // Verify types
      expect(typeof callArgs.model).toBe('string');
      expect(Array.isArray(callArgs.messages)).toBe(true);
      expect(typeof callArgs.temperature).toBe('number');
      expect(typeof callArgs.max_tokens).toBe('number');

      // Verify message structure
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0]).toHaveProperty('role', 'user');
      expect(callArgs.messages[0]).toHaveProperty('content', testPrompt);

      // Verify default values
      expect(callArgs.temperature).toBe(0.1);
      expect(callArgs.max_tokens).toBe(1000);
    });

    it('should use custom maxTokens parameter', async () => {
      const customMaxTokens = 500;
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Response text',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15,
        },
      });

      await runLLM('test prompt', customMaxTokens);

      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      expect(callArgs.max_tokens).toBe(customMaxTokens);
    });

    it('should return the generated text content', async () => {
      const expectedContent = 'This is the generated response';
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: expectedContent,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 10,
          total_tokens: 15,
        },
      });

      const result = await runLLM('test prompt');

      expect(result).toBe(expectedContent);
      expect(typeof result).toBe('string');
    });

    it('should throw error when OPENAI_LLM_MODEL is not set', async () => {
      delete process.env.OPENAI_LLM_MODEL;

      await expect(runLLM('test')).rejects.toThrow(
        'OPENAI_LLM_MODEL environment variable is not set'
      );
    });

    it('should throw error when no content is returned', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: null,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 0,
          total_tokens: 5,
        },
      });

      await expect(runLLM('test')).rejects.toThrow('No content returned from OpenAI API');
    });

    it('should handle API errors and surface them appropriately', async () => {
      const apiError = new Error('Network timeout');
      mockClient.chat.completions.create.mockRejectedValue(apiError);

      await expect(runLLM('test')).rejects.toThrow('Failed to run LLM');
      await expect(runLLM('test')).rejects.toThrow('Network timeout');
    });

    it('should provide helpful message for quota/billing errors', async () => {
      const quotaError = new Error('429 Too Many Requests');
      mockClient.chat.completions.create.mockRejectedValue(quotaError);

      await expect(runLLM('test')).rejects.toThrow('quota exceeded');
      await expect(runLLM('test')).rejects.toThrow('platform.openai.com/usage');
    });

    it('should handle errors with billing keyword', async () => {
      const billingError = new Error('billing issue detected');
      mockClient.chat.completions.create.mockRejectedValue(billingError);

      await expect(runLLM('test')).rejects.toThrow('quota exceeded');
    });

    it('should handle unknown error types gracefully', async () => {
      // Simulate a non-Error rejection
      mockClient.chat.completions.create.mockRejectedValue('string error');

      await expect(runLLM('test')).rejects.toThrow('Failed to run LLM');
      await expect(runLLM('test')).rejects.toThrow('Unknown error');
    });
  });
});

