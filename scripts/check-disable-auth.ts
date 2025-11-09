#!/usr/bin/env ts-node

/**
 * Quick script to check if DISABLE_AUTH is set correctly
 * This helps verify that the environment variable is being read
 */

import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const disableAuth = process.env.DISABLE_AUTH
const nodeEnv = process.env.NODE_ENV

console.log('🔍 Checking DISABLE_AUTH configuration...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`DISABLE_AUTH: ${disableAuth || '(not set)'}`)
console.log(`NODE_ENV: ${nodeEnv || '(not set)'}`)
console.log('')

const isDisabled = disableAuth === 'true' || disableAuth === '1' || nodeEnv === 'test'

if (isDisabled) {
  console.log('✅ Authentication will be DISABLED')
  console.log('   The API endpoints will bypass Clerk authentication')
} else {
  console.log('❌ Authentication is ENABLED')
  console.log('   The API endpoints require Clerk authentication')
  console.log('')
  console.log('   To disable authentication for testing:')
  console.log('   1. Add DISABLE_AUTH=true to .env.local')
  console.log('   2. Restart the Next.js dev server')
}

console.log('')

