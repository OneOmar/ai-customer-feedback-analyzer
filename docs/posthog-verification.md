# PostHog Verification Guide

## Why `window.posthog` is Undefined

### Root Causes

1. **PostHog Not Initialized**: The `initPostHog()` function must be called in a client component. If it's never called, `window.posthog` will be `undefined`.

2. **Initialization Timing**: PostHog uses dynamic imports and async initialization. `window.posthog` only exists **after** the initialization completes (usually within 1-2 seconds of page load).

3. **Server vs Client**: 
   - **Server components** (like `app/layout.tsx` without `'use client'`) cannot access `window` - it doesn't exist on the server
   - **Client components** can access `window`, but only after PostHog initializes

4. **PostHog Default Behavior**: PostHog automatically exposes itself to `window.posthog` when initialized, but only if:
   - Initialization succeeds
   - The code runs in a browser (not server)
   - The `loaded` callback has fired

## When `window.posthog` Should Exist

| Context | Should Exist? | Why |
|---------|---------------|-----|
| Server Component | ❌ No | `window` doesn't exist on server |
| Client Component (before init) | ❌ No | Not initialized yet |
| Client Component (after init) | ✅ Yes | PostHog exposes itself globally |
| Browser DevTools (immediately) | ❌ Maybe | Depends on initialization timing |
| Browser DevTools (after 2-3 seconds) | ✅ Yes | Should be initialized by then |

## How to Verify PostHog is Working

### Method 1: Check Browser Console (Recommended)

1. Open your app in the browser
2. Open DevTools (F12)
3. Wait 2-3 seconds for initialization
4. Run in console:

```javascript
// Check if PostHog exists
console.log('PostHog available:', typeof window.posthog !== 'undefined')

// If available, check status
if (window.posthog) {
  console.log('PostHog initialized:', window.posthog.__loaded)
  console.log('PostHog config:', window.posthog.config)
}
```

**Expected Output:**
```
PostHog available: true
PostHog initialized: true
PostHog config: { api_key: "phc_...", api_host: "https://app.posthog.com", ... }
```

### Method 2: Network Tab (Most Reliable)

1. Open DevTools → **Network** tab
2. Filter by: `posthog` or `batch`
3. Reload the page
4. Look for requests to:
   - `https://app.posthog.com/batch/` (or your custom host)
   - `https://app.posthog.com/e/` (events endpoint)

**What to Look For:**
- ✅ Requests appear within 2-3 seconds of page load
- ✅ Status code: `200` or `204`
- ✅ Request payload contains event data

**If No Requests:**
- PostHog not initialized
- Missing `NEXT_PUBLIC_POSTHOG_KEY` env var
- User has opted out
- Network blocked by ad blocker

### Method 3: PostHog Dashboard

1. Go to your PostHog dashboard: https://app.posthog.com
2. Navigate to **Activity** or **Events**
3. Perform actions in your app (click buttons, navigate pages)
4. Check if events appear in the dashboard (may take 1-2 minutes)

**What to Look For:**
- ✅ `$pageview` events appear automatically
- ✅ Custom events appear when you call `trackEvent()`
- ✅ User identification works if you call `identify()`

### Method 4: Manual Test Event

In browser console (after initialization):

```javascript
// Test event tracking
if (window.posthog) {
  window.posthog.capture('test_event', {
    test_property: 'test_value'
  })
  console.log('✅ Test event sent')
} else {
  console.error('❌ PostHog not available')
}
```

Then check:
1. Network tab for the request
2. PostHog dashboard for the event

### Method 5: Check Initialization Status

```javascript
// Check if PostHog is loading/loaded
if (window.posthog) {
  console.log('Status:', window.posthog.__loaded ? 'Loaded' : 'Loading')
  console.log('Has opted out:', window.posthog.has_opted_out_capturing())
} else {
  console.log('PostHog not initialized yet')
}
```

## Troubleshooting

### `window.posthog` is `undefined` after 5 seconds

**Possible Causes:**
1. ❌ `NEXT_PUBLIC_POSTHOG_KEY` not set in `.env.local`
2. ❌ `PostHogProvider` not added to layout
3. ❌ PostHog initialization failed (check console for errors)
4. ❌ User has opted out
5. ❌ Ad blocker blocking PostHog

**Fix:**
```bash
# 1. Add to .env.local
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here

# 2. Restart dev server
npm run dev

# 3. Check browser console for errors
```

### PostHog initializes but no events appear

**Check:**
1. Network tab - are requests being sent?
2. PostHog dashboard - are events arriving?
3. Console - any errors?
4. User opt-out status: `window.posthog.has_opted_out_capturing()`

### Events appear in Network but not in Dashboard

- Wait 1-2 minutes (PostHog processes events asynchronously)
- Check PostHog project settings (correct project selected?)
- Verify API key matches the project

## Quick Verification Checklist

- [ ] `NEXT_PUBLIC_POSTHOG_KEY` set in `.env.local`
- [ ] `PostHogProvider` added to `app/layout.tsx`
- [ ] Dev server restarted after adding env var
- [ ] Browser console shows no PostHog errors
- [ ] `window.posthog` exists after 3 seconds
- [ ] Network tab shows PostHog requests
- [ ] PostHog dashboard shows events

## Summary

**`window.posthog` is undefined because:**
- PostHog isn't initialized (most common)
- Initialization hasn't completed yet (timing issue)
- Running on server (no `window` object)

**To verify PostHog is working:**
1. ✅ Check Network tab for PostHog requests (most reliable)
2. ✅ Check `window.posthog` in console after 2-3 seconds
3. ✅ Check PostHog dashboard for events
4. ✅ Send a test event and verify it appears

