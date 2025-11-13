/// <reference types="jest" />

import { POST } from '@/app/api/analyze/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@/lib/supabase', () => {
  const mockInsertFeedback = jest.fn()
  const mockInsertAnalysis = jest.fn()
  const mockUpdateFeedbackEmbedding = jest.fn()

  return {
    createServerClient: jest.fn(() => ({
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
    insertFeedback: mockInsertFeedback,
    insertAnalysis: mockInsertAnalysis,
    updateFeedbackEmbedding: mockUpdateFeedbackEmbedding,
  }
})

// Mock OpenAI
jest.mock('@/lib/openai', () => ({
  embedText: jest.fn(),
  getOpenAIClient: jest.fn(),
}))

// Mock LangChain analyze function
jest.mock('@/lib/langchain', () => ({
  analyzeFeedback: jest.fn(),
}))

// Mock billing/quota functions
jest.mock('@/lib/billing', () => ({
  checkUserQuota: jest.fn(),
  incrementUsage: jest.fn(),
}))

import { insertFeedback, insertAnalysis, updateFeedbackEmbedding } from '@/lib/supabase'
import { embedText } from '@/lib/openai'
import { analyzeFeedback } from '@/lib/langchain'
import { checkUserQuota, incrementUsage } from '@/lib/billing'

const mockInsertFeedback = insertFeedback as jest.MockedFunction<typeof insertFeedback>
const mockInsertAnalysis = insertAnalysis as jest.MockedFunction<typeof insertAnalysis>
const mockUpdateFeedbackEmbedding = updateFeedbackEmbedding as jest.MockedFunction<typeof updateFeedbackEmbedding>
const mockEmbedText = embedText as jest.MockedFunction<typeof embedText>
const mockAnalyzeFeedback = analyzeFeedback as jest.MockedFunction<typeof analyzeFeedback>
const mockCheckUserQuota = checkUserQuota as jest.MockedFunction<typeof checkUserQuota>
const mockIncrementUsage = incrementUsage as jest.MockedFunction<typeof incrementUsage>

describe('POST /api/analyze - Integration Test', () => {
  const testUserId = 'user_test_123'
  const testFeedbackId = 'feedback_test_123'
  const testAnalysisId = 'analysis_test_123'

  // Suppress console output during tests
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  beforeAll(() => {
    console.log = jest.fn()
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  afterAll(() => {
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()

    // Set test environment
    process.env.NODE_ENV = 'test'
    process.env.DISABLE_AUTH = 'true'

    // Default mock implementations
    mockCheckUserQuota.mockResolvedValue({
      allowed: true,
      remaining: 100,
      plan: 'pro',
      status: 'active',
    })

    mockIncrementUsage.mockResolvedValue(true)
  })

  afterEach(() => {
    delete process.env.DISABLE_AUTH
  })

  function createMockRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('Successful analysis flow', () => {
    it('should insert feedback and analysis records with expected fields', async () => {
      const testItems = [
        {
          text: 'Great product, very satisfied!',
          rating: 5,
          source: 'web',
        },
      ]

      // Mock feedback insertion
      mockInsertFeedback.mockResolvedValue({
        id: testFeedbackId,
        user_id: testUserId,
        text: testItems[0].text,
        rating: 5,
        source: 'web',
        product_id: null,
        username: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding: null,
      })

      // Mock embedding generation
      mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5])

      // Mock embedding update
      mockUpdateFeedbackEmbedding.mockResolvedValue(true)

      // Mock AI analysis
      mockAnalyzeFeedback.mockResolvedValue({
        sentiment: 'positive',
        sentiment_score: 0.95,
        topics: ['satisfaction', 'product quality'],
        summary: 'Customer is very satisfied with the product',
        recommendation: 'Continue maintaining quality standards',
      })

      // Mock analysis insertion
      mockInsertAnalysis.mockResolvedValue({
        id: testAnalysisId,
        feedback_id: testFeedbackId,
        sentiment: 'positive',
        sentiment_score: 0.95,
        topics: ['satisfaction', 'product quality'],
        summary: 'Customer is very satisfied with the product',
        recommendation: 'Continue maintaining quality standards',
        confidence_score: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const request = createMockRequest({
        userId: testUserId,
        items: testItems,
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify response structure
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('total', 1)
      expect(data).toHaveProperty('succeeded', 1)
      expect(data).toHaveProperty('failed', 0)
      expect(data).toHaveProperty('results')
      expect(Array.isArray(data.results)).toBe(true)
      expect(data.results).toHaveLength(1)

      // Verify feedback insertion was called with expected fields
      expect(mockInsertFeedback).toHaveBeenCalledTimes(1)
      expect(mockInsertFeedback).toHaveBeenCalledWith(
        testUserId,
        testItems[0].text,
        {
          rating: 5,
          source: 'web',
          product_id: undefined,
          username: undefined,
        }
      )

      // Verify embedding was generated and updated
      expect(mockEmbedText).toHaveBeenCalledWith(testItems[0].text)
      expect(mockUpdateFeedbackEmbedding).toHaveBeenCalledWith(
        testFeedbackId,
        expect.arrayContaining([expect.any(Number)])
      )

      // Verify AI analysis was called
      expect(mockAnalyzeFeedback).toHaveBeenCalledWith(testItems[0].text)

      // Verify analysis insertion was called with expected fields
      expect(mockInsertAnalysis).toHaveBeenCalledTimes(1)
      expect(mockInsertAnalysis).toHaveBeenCalledWith(
        testFeedbackId,
        {
          sentiment: 'positive',
          sentiment_score: 0.95,
          topics: ['satisfaction', 'product quality'],
          summary: 'Customer is very satisfied with the product',
          recommendation: 'Continue maintaining quality standards',
        }
      )

      // Verify usage was incremented
      expect(mockIncrementUsage).toHaveBeenCalledTimes(1)
      expect(mockIncrementUsage).toHaveBeenCalledWith(testUserId)

      // Verify result structure
      const result = data.results[0]
      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('feedbackId', testFeedbackId)
      expect(result).toHaveProperty('analysis')
      expect(result.analysis).toHaveProperty('sentiment', 'positive')
      expect(result.analysis).toHaveProperty('sentiment_score', 0.95)
      expect(result.analysis).toHaveProperty('topics')
      expect(Array.isArray(result.analysis.topics)).toBe(true)
      expect(result.analysis).toHaveProperty('summary')
      expect(result.analysis).toHaveProperty('recommendation')
    })

    it('should handle batch of multiple items', async () => {
      const testItems = [
        { text: 'First feedback item', rating: 4 },
        { text: 'Second feedback item', rating: 3 },
      ]

      // Mock multiple feedback insertions
      mockInsertFeedback
        .mockResolvedValueOnce({
          id: 'feedback_1',
          user_id: testUserId,
          text: testItems[0].text,
          rating: 4,
          source: null,
          product_id: null,
          username: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          embedding: null,
        })
        .mockResolvedValueOnce({
          id: 'feedback_2',
          user_id: testUserId,
          text: testItems[1].text,
          rating: 3,
          source: null,
          product_id: null,
          username: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          embedding: null,
        })

      mockEmbedText
        .mockResolvedValueOnce([0.1, 0.2])
        .mockResolvedValueOnce([0.3, 0.4])

      mockUpdateFeedbackEmbedding.mockResolvedValue(true)

      mockAnalyzeFeedback
        .mockResolvedValueOnce({
          sentiment: 'positive',
          sentiment_score: 0.8,
          topics: ['topic1'],
          summary: 'Summary 1',
          recommendation: 'Rec 1',
        })
        .mockResolvedValueOnce({
          sentiment: 'neutral',
          sentiment_score: 0.6,
          topics: ['topic2'],
          summary: 'Summary 2',
          recommendation: 'Rec 2',
        })

      mockInsertAnalysis
        .mockResolvedValueOnce({
          id: 'analysis_1',
          feedback_id: 'feedback_1',
          sentiment: 'positive',
          sentiment_score: 0.8,
          topics: ['topic1'],
          summary: 'Summary 1',
          recommendation: 'Rec 1',
          confidence_score: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: 'analysis_2',
          feedback_id: 'feedback_2',
          sentiment: 'neutral',
          sentiment_score: 0.6,
          topics: ['topic2'],
          summary: 'Summary 2',
          recommendation: 'Rec 2',
          confidence_score: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      const request = createMockRequest({
        userId: testUserId,
        items: testItems,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(2)
      expect(data.succeeded).toBe(2)
      expect(data.results).toHaveLength(2)

      // Verify both items were processed
      expect(mockInsertFeedback).toHaveBeenCalledTimes(2)
      expect(mockAnalyzeFeedback).toHaveBeenCalledTimes(2)
      expect(mockInsertAnalysis).toHaveBeenCalledTimes(2)
      expect(mockIncrementUsage).toHaveBeenCalledTimes(2)
    })
  })

  describe('Database insert verification', () => {
    it('should insert feedback with all optional fields', async () => {
      const testItems = [
        {
          text: 'Test feedback',
          rating: 5,
          source: 'mobile',
          productId: 'prod_123',
          username: 'testuser',
        },
      ]

      mockInsertFeedback.mockResolvedValue({
        id: testFeedbackId,
        user_id: testUserId,
        text: testItems[0].text,
        rating: 5,
        source: 'mobile',
        product_id: 'prod_123',
        username: 'testuser',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding: null,
      })

      mockEmbedText.mockResolvedValue([0.1, 0.2])
      mockUpdateFeedbackEmbedding.mockResolvedValue(true)
      mockAnalyzeFeedback.mockResolvedValue({
        sentiment: 'positive',
        sentiment_score: 0.9,
        topics: ['test'],
        summary: 'Test summary',
        recommendation: 'Test rec',
      })
      mockInsertAnalysis.mockResolvedValue({
        id: testAnalysisId,
        feedback_id: testFeedbackId,
        sentiment: 'positive',
        sentiment_score: 0.9,
        topics: ['test'],
        summary: 'Test summary',
        recommendation: 'Test rec',
        confidence_score: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const request = createMockRequest({
        userId: testUserId,
        items: testItems,
      })

      await POST(request)

      // Verify insertFeedback was called with all fields
      expect(mockInsertFeedback).toHaveBeenCalledWith(
        testUserId,
        testItems[0].text,
        {
          rating: 5,
          source: 'mobile',
          product_id: 'prod_123',
          username: 'testuser',
        }
      )
    })

    it('should insert analysis with all expected fields', async () => {
      const testItems = [{ text: 'Test feedback' }]

      const mockAnalysis = {
        sentiment: 'negative' as const,
        sentiment_score: 0.2,
        topics: ['issue', 'bug'],
        summary: 'Customer reported an issue',
        recommendation: 'Investigate and fix the bug',
      }

      mockInsertFeedback.mockResolvedValue({
        id: testFeedbackId,
        user_id: testUserId,
        text: testItems[0].text,
        rating: null,
        source: null,
        product_id: null,
        username: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding: null,
      })

      mockEmbedText.mockResolvedValue([0.1, 0.2])
      mockUpdateFeedbackEmbedding.mockResolvedValue(true)
      mockAnalyzeFeedback.mockResolvedValue(mockAnalysis)
      mockInsertAnalysis.mockResolvedValue({
        id: testAnalysisId,
        feedback_id: testFeedbackId,
        ...mockAnalysis,
        confidence_score: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const request = createMockRequest({
        userId: testUserId,
        items: testItems,
      })

      await POST(request)

      // Verify insertAnalysis was called with all analysis fields
      expect(mockInsertAnalysis).toHaveBeenCalledWith(testFeedbackId, {
        sentiment: 'negative',
        sentiment_score: 0.2,
        topics: ['issue', 'bug'],
        summary: 'Customer reported an issue',
        recommendation: 'Investigate and fix the bug',
      })
    })
  })

  describe('Response structure verification', () => {
    it('should return expected analysis object structure', async () => {
      const testItems = [{ text: 'Great product!' }]

      mockInsertFeedback.mockResolvedValue({
        id: testFeedbackId,
        user_id: testUserId,
        text: testItems[0].text,
        rating: null,
        source: null,
        product_id: null,
        username: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding: null,
      })

      mockEmbedText.mockResolvedValue([0.1, 0.2])
      mockUpdateFeedbackEmbedding.mockResolvedValue(true)
      mockAnalyzeFeedback.mockResolvedValue({
        sentiment: 'positive',
        sentiment_score: 0.9,
        topics: ['quality'],
        summary: 'Positive feedback',
        recommendation: 'Keep it up',
      })
      mockInsertAnalysis.mockResolvedValue({
        id: testAnalysisId,
        feedback_id: testFeedbackId,
        sentiment: 'positive',
        sentiment_score: 0.9,
        topics: ['quality'],
        summary: 'Positive feedback',
        recommendation: 'Keep it up',
        confidence_score: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      const request = createMockRequest({
        userId: testUserId,
        items: testItems,
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify top-level response structure
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('succeeded')
      expect(data).toHaveProperty('failed')
      expect(data).toHaveProperty('results')

      // Verify result item structure
      const result = data.results[0]
      expect(result).toHaveProperty('index', 0)
      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('feedbackId', testFeedbackId)
      expect(result).toHaveProperty('analysis')

      // Verify analysis object structure
      const analysis = result.analysis
      expect(analysis).toHaveProperty('sentiment')
      expect(analysis).toHaveProperty('sentiment_score')
      expect(analysis).toHaveProperty('topics')
      expect(analysis).toHaveProperty('summary')
      expect(analysis).toHaveProperty('recommendation')

      // Verify types
      expect(typeof analysis.sentiment).toBe('string')
      expect(typeof analysis.sentiment_score).toBe('number')
      expect(Array.isArray(analysis.topics)).toBe(true)
      expect(typeof analysis.summary).toBe('string')
      expect(typeof analysis.recommendation).toBe('string')
    })
  })

  describe('Error handling', () => {
    it('should handle quota exceeded error', async () => {
      mockCheckUserQuota.mockResolvedValue({
        allowed: false,
        remaining: 0,
        plan: 'free',
        status: 'active',
      })

      const request = createMockRequest({
        userId: testUserId,
        items: [{ text: 'Test' }],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402) // Payment Required
      expect(data).toHaveProperty('error', 'Upgrade required')
      expect(data).toHaveProperty('plan')
      expect(data).toHaveProperty('remaining')

      // Should not call insertFeedback when quota is exceeded
      expect(mockInsertFeedback).not.toHaveBeenCalled()
    })

    it('should handle missing userId', async () => {
      const request = createMockRequest({
        items: [{ text: 'Test' }],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Missing required field: userId')
    })

    it('should handle invalid items array', async () => {
      const request = createMockRequest({
        userId: testUserId,
        items: 'not an array',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid request: items must be an array')
    })
  })
})

