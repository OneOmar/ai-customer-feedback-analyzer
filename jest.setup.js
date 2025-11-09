// Jest setup file
// Add custom matchers or global test setup here

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.OPENAI_EMBED_MODEL = 'text-embedding-3-small'
process.env.OPENAI_LLM_MODEL = 'gpt-4o-mini'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

