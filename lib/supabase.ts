import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client configuration
 * Provides database and storage access for the application
 */

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase client instance
 * Use this for client-side database operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Create a Supabase client for server-side operations
 * Use service role key for elevated permissions
 */
export const createServiceSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}

