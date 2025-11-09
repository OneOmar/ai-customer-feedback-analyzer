#!/usr/bin/env tsx

/**
 * Quick script to check if required environment variables are set
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables - try .env.local first (Next.js default), then .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  console.log('📁 Loading .env.local file...');
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('📁 Loading .env file...');
  dotenv.config({ path: envPath });
} else {
  console.log('⚠️  No .env.local or .env file found');
  console.log('');
}

// Also load .env for any additional variables
dotenv.config({ path: envPath, override: false });

console.log('🔍 Checking environment variables...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const requiredVars = {
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'OPENAI_EMBED_MODEL': process.env.OPENAI_EMBED_MODEL,
  'OPENAI_LLM_MODEL': process.env.OPENAI_LLM_MODEL,
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const optionalVars = {
  'TEST_USER_ID': process.env.TEST_USER_ID,
  'LOCAL_API_URL': process.env.LOCAL_API_URL,
  'MAX_ITEMS_PER_BATCH': process.env.MAX_ITEMS_PER_BATCH,
};

let hasErrors = false;

console.log('📋 Required Variables:');
console.log('');
for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    const masked = key.includes('KEY') || key.includes('SECRET') 
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`  ✅ ${key}: ${masked}`);
  } else {
    console.log(`  ❌ ${key}: NOT SET`);
    hasErrors = true;
  }
}

console.log('');
console.log('📋 Optional Variables:');
console.log('');
for (const [key, value] of Object.entries(optionalVars)) {
  if (value) {
    console.log(`  ✓ ${key}: ${value}`);
  } else {
    console.log(`  ○ ${key}: not set (using default)`);
  }
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (hasErrors) {
  console.log('');
  console.error('❌ Missing required environment variables!');
  console.error('');
  console.error('📝 To fix this, create a .env.local file in your project root:');
  console.error('');
  console.error('   1. Create a file named .env.local');
  console.error('   2. Add the following variables:');
  console.error('');
  for (const [key] of Object.entries(requiredVars)) {
    if (!requiredVars[key as keyof typeof requiredVars]) {
      let exampleValue = 'your_value_here';
      if (key === 'OPENAI_API_KEY') {
        exampleValue = 'sk-proj-... (get from https://platform.openai.com/api-keys)';
      } else if (key.includes('SUPABASE')) {
        if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
          exampleValue = 'eyJ... (anon/public key from Supabase)';
        } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
          exampleValue = 'eyJ... (service_role key from Supabase - keep secret!)';
        } else {
          exampleValue = 'get from https://supabase.com/dashboard/project/_/settings/api';
        }
      } else if (key === 'OPENAI_EMBED_MODEL') {
        exampleValue = 'text-embedding-3-small';
      } else if (key === 'OPENAI_LLM_MODEL') {
        exampleValue = 'gpt-4o-mini';
      }
      console.error(`      ${key}=${exampleValue}`);
    }
  }
  console.error('');
  console.error('   Example .env.local file:');
  console.error('');
  console.error('   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx');
  console.error('   OPENAI_EMBED_MODEL=text-embedding-3-small');
  console.error('   OPENAI_LLM_MODEL=gpt-4o-mini');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  console.error('');
  console.error('   📖 See docs/quickstart.md for detailed setup instructions');
  console.error('');
  process.exit(1);
} else {
  console.log('');
  console.log('✅ All required environment variables are set!');
  console.log('');
  process.exit(0);
}

