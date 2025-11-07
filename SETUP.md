# Setup Guide

Detailed setup instructions for the AI Customer Feedback Analyzer.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Fill in the required environment variables:

### Clerk Authentication

1. Sign up at [Clerk.com](https://clerk.com)
2. Create a new application
3. Copy your API keys to `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Supabase Database

1. Sign up at [Supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and keys to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI API

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Generate an API key
3. Add to `.env.local`:
   - `OPENAI_API_KEY`

### Stripe Payments

1. Sign up at [Stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard
3. Add to `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (after setting up webhooks)

## Step 3: Set Up Database Schema

Create the following tables in Supabase:

### `feedback` table

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  score DECIMAL(3, 2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
```

### `uploads` table

```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_uploads_user_id ON uploads(user_id);
```

### `subscriptions` table

```sql
CREATE TABLE subscriptions (
  user_id TEXT PRIMARY KEY,
  tier TEXT CHECK (tier IN ('FREE', 'PRO', 'ENTERPRISE')) DEFAULT 'FREE',
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due')) DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE,
  feedback_count INTEGER DEFAULT 0,
  feedback_limit INTEGER DEFAULT 100,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 4: Configure Clerk Routes

In your Clerk Dashboard, set the following paths:
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- After sign-in: `/dashboard`
- After sign-up: `/dashboard`

## Step 5: Set Up Stripe Webhooks

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (or see [Stripe docs](https://stripe.com/docs/stripe-cli))
2. Login: `stripe login`
3. Forward webhooks to local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the webhook secret to `.env.local`

## Step 6: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Optional: Install shadcn/ui Components

Add more components as needed:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
```

## Troubleshooting

### "Missing environment variables" error
- Ensure all required variables in `.env.local.example` are filled in `.env.local`
- Restart the dev server after adding new environment variables

### Database connection issues
- Verify your Supabase URL and keys are correct
- Check that your database tables are created
- Ensure Row Level Security (RLS) policies are configured if needed

### Clerk authentication not working
- Verify your Clerk keys are correct
- Check that middleware is configured correctly
- Ensure Clerk routes match your dashboard settings

## Next Steps

1. Create authentication pages (`/sign-in`, `/sign-up`)
2. Build the dashboard UI
3. Implement CSV upload functionality
4. Add sentiment analysis logic
5. Create data visualization components
6. Set up Stripe subscription flows

