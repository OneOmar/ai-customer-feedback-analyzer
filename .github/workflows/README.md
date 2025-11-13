# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Required Secrets

The following secrets must be configured in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Required for Tests

- **`SUPABASE_SERVICE_ROLE_KEY`** - Supabase service role key (masked in CI logs)
- **`STRIPE_WEBHOOK_SECRET`** - Stripe webhook signing secret (masked in CI logs)
- **`OPENAI_API_KEY`** - OpenAI API key (masked in CI logs)

### Optional for Tests (uses defaults if not set)

- **`NEXT_PUBLIC_SUPABASE_URL`** - Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Supabase anonymous key
- **`STRIPE_SECRET_KEY`** - Stripe secret key
- **`STRIPE_PRICE_ID_PRO`** - Stripe Pro plan price ID
- **`STRIPE_PRICE_ID_BUSINESS`** - Stripe Business plan price ID

### Required for Vercel Deployment

- **`VERCEL_TOKEN`** - Vercel authentication token (only needed for main branch deployments)

## Workflow Overview

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request:

1. **Setup** - Installs Node.js 20 and dependencies with caching
2. **Lint** - Runs ESLint to check code quality
3. **Test** - Runs Jest test suite with required environment variables
4. **Build** - Builds the Next.js application
5. **Deploy** (optional) - Deploys to Vercel if on `main` branch and `VERCEL_TOKEN` is set

## Adding Secrets

1. Go to your repository on GitHub
2. Navigate to `Settings > Secrets and variables > Actions`
3. Click `New repository secret`
4. Add each secret with its name and value
5. Click `Add secret`

## Security Notes

- All secrets are automatically masked in CI logs
- Secrets are only available to workflows, not to forks
- Never commit secrets to the repository
- Use GitHub Secrets for all sensitive values

## Local Testing

To test the CI workflow locally, you can use [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act/releases

# Run the CI workflow
act push
```

Note: You'll need to set up secrets locally for act to work properly.

