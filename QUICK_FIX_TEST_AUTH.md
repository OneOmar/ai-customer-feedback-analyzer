# Quick Fix: Test Script Authentication Error

## Problem
The test script fails with "Unauthorized: No valid session found" because the API endpoints require Clerk authentication.

## Solution

### Step 1: Verify DISABLE_AUTH is in .env.local

Check that your `.env.local` file contains:
```env
DISABLE_AUTH=true
```

You can verify this by running:
```bash
npm run check:disable-auth
```

### Step 2: Restart Next.js Dev Server

**IMPORTANT**: The Next.js dev server must be restarted to load the new environment variable.

1. **Stop the current dev server** (if running):
   - Press `Ctrl+C` in the terminal where `npm run dev` is running

2. **Start the dev server again**:
   ```bash
   npm run dev
   ```

3. **Wait for the server to start** (you should see "Ready on http://localhost:3000")

### Step 3: Run the Test Script

Once the server is restarted, run the test:
```bash
npm run test:analyze
```

## Why This Happens

- Next.js reads environment variables from `.env.local` when the server **starts**
- If you add `DISABLE_AUTH=true` to `.env.local` while the server is running, it won't see it
- You must **restart the server** for it to load the new environment variable

## Verify It's Working

After restarting the server, you should see a warning in the server logs when the API is called:
```
⚠️  Authentication bypassed (DISABLE_AUTH=true, NODE_ENV=development)
```

If you see this warning, authentication is successfully disabled.

## Alternative: Set Environment Variable When Starting Server

You can also set the environment variable when starting the server:

### PowerShell:
```powershell
$env:DISABLE_AUTH="true"; npm run dev
```

### Bash/Unix:
```bash
DISABLE_AUTH=true npm run dev
```

Then in another terminal, run:
```bash
npm run test:analyze
```

## Security Reminder

⚠️ **Never set `DISABLE_AUTH=true` in production!** This is only for local development and testing.

