/// <reference types="jest" />

import { POST } from '@/app/api/stripe/webhook/route'
import { NextRequest } from 'next/server'
import Stripe from 'stripe'

// Mock Stripe client
jest.mock('@/lib/stripe', () => ({
  getStripeClient: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(),
}))

import { getStripeClient } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'

const mockGetStripeClient = getStripeClient as jest.MockedFunction<typeof getStripeClient>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('POST /api/stripe/webhook - Integration Test', () => {
  let mockStripeClient: {
    webhooks: {
      constructEvent: jest.Mock
    }
    subscriptions: {
      retrieve: jest.Mock
    }
    customers: {
      retrieve: jest.Mock
    }
  }

  let mockSupabaseClient: {
    from: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()

    // Set required environment variables
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
    process.env.STRIPE_PRICE_ID_PRO = 'price_pro_test'
    process.env.STRIPE_PRICE_ID_BUSINESS = 'price_business_test'

    // Setup mock Stripe client
    mockStripeClient = {
      webhooks: {
        constructEvent: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
      },
      customers: {
        retrieve: jest.fn(),
      },
    }
    mockGetStripeClient.mockReturnValue(mockStripeClient as any)

    // Setup mock Supabase client
    const mockUpsert = jest.fn().mockResolvedValue({ error: null })
    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    })

    mockSupabaseClient = {
      from: jest.fn(() => ({
        upsert: mockUpsert,
        select: mockSelect,
      })),
    }
    mockCreateServerClient.mockReturnValue(mockSupabaseClient as any)
  })

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_PRICE_ID_PRO
    delete process.env.STRIPE_PRICE_ID_BUSINESS
  })

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

  function createMockRequest(
    eventType: string,
    eventData: any,
    signature: string = 'test_signature'
  ): NextRequest {
    const event: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2025-02-24.acacia',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: eventData,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: eventType as Stripe.Event.Type,
    }

    const body = JSON.stringify(event)

    return new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body,
    })
  }

  describe('checkout.session.completed event', () => {
    it('should upsert subscription with expected fields', async () => {
      const testUserId = 'user_test_123'
      const testCustomerId = 'cus_test_123'
      const testSubscriptionId = 'sub_test_123'
      const testPriceId = 'price_pro_test'

      // Mock checkout session
      const checkoutSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        object: 'checkout.session',
        customer: testCustomerId,
        subscription: testSubscriptionId,
        metadata: {
          userId: testUserId,
        },
      }

      // Mock subscription retrieval
      const subscription: Partial<Stripe.Subscription> = {
        id: testSubscriptionId,
        object: 'subscription',
        customer: testCustomerId,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_123',
              object: 'subscription_item',
              price: {
                id: testPriceId,
                object: 'price',
              } as any,
            },
          ],
        } as any,
      }

      // Mock webhook signature verification
      mockStripeClient.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: checkoutSession,
        },
      } as Stripe.Event)

      // Mock subscription retrieval
      mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription as Stripe.Subscription)

      const request = createMockRequest('checkout.session.completed', checkoutSession)

      const response = await POST(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('received', true)

      // Verify Supabase upsert was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions')
      const upsertCall = mockSupabaseClient.from().upsert
      expect(upsertCall).toHaveBeenCalledTimes(1)

      // Verify upsert was called with expected fields
      const [upsertData, upsertOptions] = upsertCall.mock.calls[0]
      expect(upsertData).toMatchObject({
        user_id: testUserId,
        plan: 'pro',
        status: 'active',
        stripe_customer_id: testCustomerId,
        stripe_subscription_id: testSubscriptionId,
        current_period_start: expect.any(String),
        current_period_end: expect.any(String),
        updated_at: expect.any(String),
      })

      // Verify upsert options
      expect(upsertOptions).toHaveProperty('onConflict', 'user_id')

      // Verify Stripe API calls
      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith(testSubscriptionId)
    })

    it('should handle business plan subscription', async () => {
      const testUserId = 'user_test_456'
      const testSubscriptionId = 'sub_test_456'
      const testPriceId = 'price_business_test'

      const checkoutSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_456',
        customer: 'cus_test_456',
        subscription: testSubscriptionId,
        metadata: {
          userId: testUserId,
        },
      }

      const subscription: Partial<Stripe.Subscription> = {
        id: testSubscriptionId,
        customer: 'cus_test_456',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_456',
              object: 'subscription_item',
              price: {
                id: testPriceId,
                object: 'price',
              } as any,
            },
          ],
        } as any,
      }

      mockStripeClient.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: checkoutSession,
        },
      } as Stripe.Event)

      mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription as Stripe.Subscription)

      const request = createMockRequest('checkout.session.completed', checkoutSession)

      const response = await POST(request)

      expect(response.status).toBe(200)

      // Verify plan is set to 'business'
      const upsertCall = mockSupabaseClient.from().upsert
      const [upsertData] = upsertCall.mock.calls[0]
      expect(upsertData).toHaveProperty('plan', 'business')
    })
  })

  describe('customer.subscription.updated event', () => {
    it('should upsert subscription with updated fields', async () => {
      const testUserId = 'user_test_789'
      const testCustomerId = 'cus_test_789'
      const testSubscriptionId = 'sub_test_789'
      const testPriceId = 'price_pro_test'

      // Mock subscription with metadata
      const subscription: Partial<Stripe.Subscription> = {
        id: testSubscriptionId,
        object: 'subscription',
        customer: testCustomerId,
        status: 'active',
        metadata: {
          userId: testUserId,
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_789',
              object: 'subscription_item',
              price: {
                id: testPriceId,
                object: 'price',
              } as any,
            },
          ],
        } as any,
      }

      // Mock customer retrieval
      const customer: Partial<Stripe.Customer> = {
        id: testCustomerId,
        object: 'customer',
        metadata: {},
      }

      // Mock webhook signature verification
      mockStripeClient.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: subscription,
        },
      } as Stripe.Event)

      mockStripeClient.customers.retrieve.mockResolvedValue(customer as Stripe.Customer)

      const request = createMockRequest('customer.subscription.updated', subscription)

      const response = await POST(request)
      const data = await response.json()

      // Verify response
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('received', true)

      // Verify Supabase upsert was called
      const upsertCall = mockSupabaseClient.from().upsert
      expect(upsertCall).toHaveBeenCalledTimes(1)

      // Verify upsert was called with expected fields
      const [upsertData] = upsertCall.mock.calls[0]
      expect(upsertData).toMatchObject({
        user_id: testUserId,
        plan: 'pro',
        status: 'active',
        stripe_customer_id: testCustomerId,
        stripe_subscription_id: testSubscriptionId,
        current_period_start: expect.any(String),
        current_period_end: expect.any(String),
        updated_at: expect.any(String),
      })

      // Verify customer was retrieved
      expect(mockStripeClient.customers.retrieve).toHaveBeenCalledWith(testCustomerId)
    })

    it('should handle status change to past_due', async () => {
      const testUserId = 'user_test_past_due'
      const testSubscriptionId = 'sub_test_past_due'

      const subscription: Partial<Stripe.Subscription> = {
        id: testSubscriptionId,
        customer: 'cus_test_past_due',
        status: 'past_due',
        metadata: {
          userId: testUserId,
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_past_due',
              object: 'subscription_item',
              price: {
                id: 'price_pro_test',
                object: 'price',
              } as any,
            },
          ],
        } as any,
      }

      mockStripeClient.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: subscription,
        },
      } as Stripe.Event)

      mockStripeClient.customers.retrieve.mockResolvedValue({
        id: 'cus_test_past_due',
        object: 'customer',
        metadata: {},
      } as Stripe.Customer)

      const request = createMockRequest('customer.subscription.updated', subscription)

      const response = await POST(request)

      expect(response.status).toBe(200)

      // Verify status is mapped to 'past_due'
      const upsertCall = mockSupabaseClient.from().upsert
      const [upsertData] = upsertCall.mock.calls[0]
      expect(upsertData).toHaveProperty('status', 'past_due')
    })

    it('should look up existing subscription when userId not in metadata', async () => {
      const testUserId = 'user_existing'
      const testSubscriptionId = 'sub_existing'

      const subscription: Partial<Stripe.Subscription> = {
        id: testSubscriptionId,
        customer: 'cus_existing',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_existing',
              object: 'subscription_item',
              price: {
                id: 'price_pro_test',
                object: 'price',
              } as any,
            },
          ],
        } as any,
      }

      // Mock customer without userId in metadata
      mockStripeClient.customers.retrieve.mockResolvedValue({
        id: 'cus_existing',
        object: 'customer',
        metadata: {},
      } as Stripe.Customer)

      // Create separate mocks for select and upsert
      const mockUpsert = jest.fn().mockResolvedValue({ error: null })
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: testUserId },
            error: null,
          }),
        }),
      })

      // Override the from mock to return both select and upsert
      mockSupabaseClient.from = jest.fn(() => ({
        upsert: mockUpsert,
        select: mockSelect,
      }))

      mockStripeClient.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: subscription,
        },
      } as Stripe.Event)

      const request = createMockRequest('customer.subscription.updated', subscription)

      const response = await POST(request)

      expect(response.status).toBe(200)

      // Verify existing subscription was looked up
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions')
      expect(mockSelect).toHaveBeenCalled()

      // Verify upsert was called with the looked-up userId
      expect(mockUpsert).toHaveBeenCalledTimes(1)
      const [upsertData] = mockUpsert.mock.calls[0]
      expect(upsertData).toHaveProperty('user_id', testUserId)
    })
  })

  describe('Error handling', () => {
    it('should return 400 when signature is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No stripe-signature header
        },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Missing stripe-signature header')
    })

    it('should return 400 when signature verification fails', async () => {
      mockStripeClient.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const request = createMockRequest('checkout.session.completed', {})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Webhook signature verification failed')
    })

    it('should return 500 when webhook secret is missing', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      const request = createMockRequest('checkout.session.completed', {})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error', 'Server configuration error: Missing webhook secret')
    })

    it('should return 200 for unhandled event types', async () => {
      mockStripeClient.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {},
        },
      } as Stripe.Event)

      const request = createMockRequest('payment_intent.succeeded', {})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('received', true)
    })
  })

  describe('Field mapping verification', () => {
    it('should correctly map Stripe subscription status to our status format', async () => {
      const statusMappings = [
        { stripe: 'active', expected: 'active' },
        { stripe: 'trialing', expected: 'trialing' },
        { stripe: 'past_due', expected: 'past_due' },
        { stripe: 'canceled', expected: 'cancelled' },
        { stripe: 'unpaid', expected: 'cancelled' },
      ]

      for (const mapping of statusMappings) {
        jest.clearAllMocks()

        const subscription: Partial<Stripe.Subscription> = {
          id: 'sub_test',
          customer: 'cus_test',
          status: mapping.stripe as Stripe.Subscription.Status,
          metadata: {
            userId: 'user_test',
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          items: {
            object: 'list',
            data: [
              {
                id: 'si_test',
                object: 'subscription_item',
                price: {
                  id: 'price_pro_test',
                  object: 'price',
                } as any,
              },
            ],
          } as any,
        }

        mockStripeClient.webhooks.constructEvent.mockReturnValue({
          type: 'customer.subscription.updated',
          data: {
            object: subscription,
          },
        } as Stripe.Event)

        mockStripeClient.customers.retrieve.mockResolvedValue({
          id: 'cus_test',
          object: 'customer',
          metadata: {},
        } as Stripe.Customer)

        const request = createMockRequest('customer.subscription.updated', subscription)
        await POST(request)

        const upsertCall = mockSupabaseClient.from().upsert
        const [upsertData] = upsertCall.mock.calls[0]
        expect(upsertData).toHaveProperty('status', mapping.expected)
      }
    })
  })
})

