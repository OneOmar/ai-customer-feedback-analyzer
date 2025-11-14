# AI Customer Feedback Analyzer

AI-powered customer feedback analysis tool that uses OpenAI and LangChain to analyze sentiment, extract topics, and generate actionable insights from customer feedback data.

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts

**Backend:**
- Next.js API Routes
- Clerk (Authentication)
- Supabase (Database)
- OpenAI API (AI Analysis)
- LangChain (AI Orchestration)
- Stripe (Payments)

**Tooling:**
- Jest (Testing)
- ESLint (Linting)
- TypeScript
- PostCSS

**CI/CD:**
- GitHub Actions
- Vercel (Deployment)

## Project Structure

```
ai-customer-feedback-analyzer/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth route group (sign-in, sign-up)
│   ├── (dashboard)/              # Dashboard route group (protected)
│   │   └── dashboard/            # Dashboard pages (analytics, upload)
│   ├── api/                      # API routes (analyze, upload, stripe, etc.)
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── *.tsx                     # Feature components
├── lib/                          # Utility functions and configs
│   ├── auth.ts                   # Clerk authentication helpers
│   ├── supabase.ts              # Supabase client and helpers
│   ├── openai.ts                 # OpenAI API client
│   ├── langchain.ts             # LangChain analysis functions
│   ├── stripe.ts                # Stripe payment helpers
│   └── analytics.ts             # PostHog analytics
├── __tests__/                    # Test files
│   ├── api/                     # Integration tests
│   └── lib/                     # Unit tests
├── scripts/                      # Utility scripts
│   ├── seed-supabase.ts         # Database seeding
│   ├── test-analyze.ts          # Integration test script
│   └── e2e-smoke.ts             # E2E smoke test
├── supabase/
│   └── sql/
│       ├── init.sql             # Database schema
│       └── billing.sql          # Billing schema
├── styles/
│   └── globals.css              # Global styles
├── types/
│   └── index.ts                 # TypeScript type definitions
└── public/                       # Static assets
```

## Features

- **CSV Upload**: Upload customer feedback in CSV format for batch processing
- **AI Sentiment Analysis**: Automatic sentiment detection (positive, negative, neutral, mixed) using OpenAI
- **Topic Extraction**: AI-powered topic identification from feedback text
- **Visual Analytics**: Interactive charts and dashboards with Recharts
- **User Authentication**: Secure authentication with Clerk
- **Subscription Management**: Stripe-powered subscription tiers (Free, Pro, Business)
- **Vector Search**: Semantic similarity search using Supabase pgvector
- **Feedback Insights**: AI-generated summaries and actionable recommendations
- **Quota Management**: Usage tracking and limits per subscription tier
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## Quick Start

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...          # Clerk publishable key
CLERK_SECRET_KEY=sk_test_...                           # Clerk secret key

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                   # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=eyJ...                       # Supabase service role key

# OpenAI API
OPENAI_API_KEY=sk-...                                  # OpenAI API key
OPENAI_EMBED_MODEL=text-embedding-3-small             # Embedding model (optional)
OPENAI_LLM_MODEL=gpt-4o-mini                           # LLM model (optional)

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...         # Stripe publishable key
STRIPE_SECRET_KEY=sk_test_...                          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                        # Stripe webhook secret
STRIPE_PRICE_ID_PRO=price_...                          # Pro plan price ID
STRIPE_PRICE_ID_BUSINESS=price_...                     # Business plan price ID
STRIPE_SUCCESS_URL=http://localhost:3000/dashboard     # Success redirect URL
STRIPE_CANCEL_URL=http://localhost:3000/pricing        # Cancel redirect URL

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000              # Base application URL

# Optional: PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...                        # PostHog API key (optional)
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com       # PostHog host (optional)
```

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize Supabase database:**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL schema in Supabase SQL Editor:
     ```bash
     # Copy contents of supabase/sql/init.sql and run in Supabase SQL Editor
     ```
   - Or use Supabase CLI:
     ```bash
     supabase init
     supabase db push
     ```

3. **Run database migrations:**
   ```bash
   # If using Supabase CLI
   supabase migration up
   ```

4. **Seed database (optional):**
   ```bash
   npm run seed:supabase
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Running Tests

### Unit Tests

Run Jest unit tests:
```bash
npm test
```

Run in watch mode:
```bash
npm run test:watch
```

Run with coverage:
```bash
npm run test:coverage
```

**Test Setup:**
- Tests use mock environment variables (configured in `jest.setup.js`)
- No database required for unit tests
- Test files located in `__tests__/` directory

### Integration Tests

Run integration tests (requires running dev server):
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run integration tests
DISABLE_AUTH=true npm run test:analyze
```

**Test Setup:**
- Set `DISABLE_AUTH=true` to bypass Clerk authentication
- Set `TEST_USER_ID=test_user_123` (optional, auto-generated if not set)
- Requires valid Supabase and OpenAI credentials in `.env.local`

### E2E Tests

Run end-to-end smoke tests:
```bash
# PowerShell
$env:TEST_USER_ID="user_123"; npm run test:e2e

# Bash/Unix
TEST_USER_ID=user_123 npm run test:e2e
```

**Test Setup:**
- Requires running dev server (`npm run dev`)
- Set `TEST_USER_ID` environment variable
- Optionally set `LOCAL_API_URL` (defaults to `http://localhost:3000`)
- Set `DISABLE_AUTH=true` for testing without authentication

## CI & Required Secrets

### CI Pipeline

GitHub Actions runs on push/PR:
- **Lint**: ESLint code quality checks
- **Test**: Unit and integration tests
- **Build**: Production build verification
- **Deploy**: Auto-deploy to Vercel (main branch only)

### Required CI Secrets

Configure in GitHub repository settings → Secrets:

| Secret Name | Description |
|------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for database operations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis |
| `STRIPE_SECRET_KEY` | Stripe secret key for payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_PRO` | Stripe Pro plan price ID |
| `STRIPE_PRICE_ID_BUSINESS` | Stripe Business plan price ID |
| `VERCEL_TOKEN` | Vercel deployment token (optional, for auto-deploy) |

## Deploy (Vercel)

### Quick Deploy

1. **Connect repository to Vercel:**
   - Import your GitHub repository in [Vercel Dashboard](https://vercel.com)
   - Vercel auto-detects Next.js configuration

2. **Build settings (auto-detected):**
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. **Set environment variables:**
   - Go to Project Settings → Environment Variables
   - Add all required variables from `.env.local`
   - Configure for Production, Preview, and Development environments

4. **Deploy:**
   - Push to `main` branch triggers automatic deployment
   - Or manually deploy from Vercel dashboard

### Production Environment Variables

For production deployment:
- Use production keys (replace `_test_` with production keys for Clerk/Stripe)
- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Configure Stripe webhook endpoint: `https://your-domain.com/api/stripe/webhook`

## Resources

**Documentation:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [LangChain.js Documentation](https://js.langchain.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)

**UI Components:**
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org)

**Tools:**
- [Supabase Dashboard](https://app.supabase.com)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)

## License

MIT License - See LICENSE file for details.

This project is open source and available for use, modification, and distribution under the MIT License.
