# Testing Guide

## Running Tests with Authentication Disabled

The API endpoints (`/api/analyze` and `/api/upload`) require Clerk authentication by default. For testing purposes, you can disable authentication by setting the `DISABLE_AUTH` environment variable.

## Quick Start

### PowerShell
```powershell
$env:DISABLE_AUTH="true"; npm run test:analyze
```

### Bash/Unix
```bash
DISABLE_AUTH=true npm run test:analyze
```

### Using .env file
Add to your `.env.local` file:
```env
DISABLE_AUTH=true
TEST_USER_ID=test_user_123
```

## Environment Variables

### DISABLE_AUTH
- **Type**: `string` ("true" to disable, anything else to enable)
- **Default**: `false` (authentication required)
- **Usage**: Set to `"true"` to bypass Clerk authentication for testing
- **Warning**: Only use in development/test environments!

### TEST_USER_ID
- **Type**: `string`
- **Default**: `test_user_<timestamp>` (auto-generated)
- **Usage**: User ID to use when authentication is disabled
- **Note**: Used by `/api/upload` endpoint when `DISABLE_AUTH=true`

### LOCAL_API_URL
- **Type**: `string`
- **Default**: `http://localhost:3000`
- **Usage**: Base URL for the API (useful for testing against different ports)

## Testing Endpoints

### 1. Test /api/analyze endpoint

```bash
# PowerShell
$env:DISABLE_AUTH="true"; npm run test:analyze

# Bash/Unix
DISABLE_AUTH=true npm run test:analyze
```

### 2. Test /api/upload endpoint

Create a test CSV file and use a tool like `curl`:

```bash
# PowerShell
$env:DISABLE_AUTH="true"
curl -X POST http://localhost:3000/api/upload -F "file=@test.csv"

# Bash/Unix
DISABLE_AUTH=true curl -X POST http://localhost:3000/api/upload -F "file=@test.csv"
```

## Security Notes

⚠️ **Important**: 
- `DISABLE_AUTH=true` should **NEVER** be set in production
- Only use in local development and CI/CD test environments
- The authentication bypass is logged with a warning in server logs
- When disabled, the API uses test user IDs from environment variables

## How It Works

### When DISABLE_AUTH=true:

1. **`/api/analyze` endpoint**:
   - Skips Clerk authentication check
   - Uses `userId` from request body directly
   - Logs a warning message

2. **`/api/upload` endpoint**:
   - Skips Clerk authentication check
   - Uses `TEST_USER_ID` from environment or generates one
   - Logs a warning with the test user ID used

### When DISABLE_AUTH is not set (default):

1. Both endpoints require valid Clerk authentication
2. User ID is verified against the authenticated session
3. Returns 401 Unauthorized if no valid session found
4. Returns 403 Forbidden if user ID doesn't match authenticated user

## Troubleshooting

### Test fails with "Unauthorized: No valid session found"

**Solution**: Set `DISABLE_AUTH=true`:
```bash
# PowerShell
$env:DISABLE_AUTH="true"; npm run test:analyze

# Bash/Unix
DISABLE_AUTH=true npm run test:analyze
```

### Test fails with "User ID mismatch"

**Solution**: This shouldn't happen when `DISABLE_AUTH=true`. If it does, check that:
1. `DISABLE_AUTH` is set to `"true"` (string, not boolean)
2. Server has been restarted after setting the environment variable
3. Environment variable is available to the Next.js process

### Server logs show authentication warnings

**This is normal** when `DISABLE_AUTH=true`. The warnings indicate that authentication is bypassed, which is expected in test mode.

## Example .env.local for Testing

```env
# Disable authentication for testing
DISABLE_AUTH=true

# Test user ID (optional, defaults to test_user_<timestamp>)
TEST_USER_ID=test_user_123

# API URL (optional, defaults to http://localhost:3000)
LOCAL_API_URL=http://localhost:3000

# Other environment variables...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

## CI/CD Integration

For CI/CD pipelines, set the environment variable in your CI configuration:

### GitHub Actions
```yaml
env:
  DISABLE_AUTH: "true"
  TEST_USER_ID: "ci_test_user"
```

### GitLab CI
```yaml
variables:
  DISABLE_AUTH: "true"
  TEST_USER_ID: "ci_test_user"
```

### CircleCI
```yaml
environment:
  DISABLE_AUTH: "true"
  TEST_USER_ID: "ci_test_user"
```

