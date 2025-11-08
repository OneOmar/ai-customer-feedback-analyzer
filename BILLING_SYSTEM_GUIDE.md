# 💳 Billing & Quota System Guide

Complete guide for the subscription billing and quota management system in your AI Feedback Analyzer.

---

## 📋 Overview

The billing system provides:
- **3 subscription tiers**: Free, Pro, Business
- **Quota enforcement** for AI analyses
- **Usage tracking** per billing period
- **Automatic quota resets** monthly
- **Stripe integration** ready

---

## 🎯 Subscription Plans

### Free Plan
- **$0/month**
- 100 AI analyses per month
- 500 feedback items storage
- Basic features
- Email support

### Pro Plan  
- **$29/month**
- 1,000 AI analyses per month
- 10,000 feedback items storage
- Advanced features
- Priority support
- API access

### Business Plan
- **$99/month**
- 10,000 AI analyses per month
- 100,000 feedback items storage
- Enterprise features
- Dedicated support
- Custom integrations

---

## 🗄️ Database Schema

### Step 1: Run Billing SQL

After running `supabase/sql/init.sql`, run:

```bash
# In Supabase SQL Editor
```

Copy and run `supabase/sql/billing.sql`:

```sql
-- Creates:
-- 1. subscriptions table
-- 2. usage table
-- 3. RLS policies
-- 4. Helper functions
```

### Tables Created

#### `subscriptions`
```sql
- id (UUID)
- user_id (TEXT) ← Clerk user ID
- plan ('free' | 'pro' | 'business')
- status ('active' | 'cancelled' | 'past_due' | 'trialing')
- current_period_start (timestamp)
- current_period_end (timestamp)
- stripe_customer_id (TEXT, nullable)
- stripe_subscription_id (TEXT, nullable)
- created_at, updated_at
```

#### `usage`
```sql
- id (UUID)
- user_id (TEXT)
- period_start (timestamp)
- period_end (timestamp)
- analyses_count (INTEGER) ← AI analyses used
- feedback_count (INTEGER) ← Feedback items stored
- created_at, updated_at
```

---

## 💻 Using the Billing API

### Import Functions

```typescript
import {
  checkQuota,
  incrementUsage,
  getSubscription,
  getCurrentUsage,
  PLANS
} from '@/lib/billing'
```

### Check Quota Before Analysis

```typescript
// In an API route or Server Component
import { checkQuota, incrementUsage } from '@/lib/billing'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  
  // Check if user has quota remaining
  const quota = await checkQuota(userId!)
  
  if (!quota.allowed) {
    return NextResponse.json({
      error: 'Quota exceeded',
      message: `You've used ${quota.used}/${quota.limit} analyses.`,
      plan: quota.plan,
      resetsAt: quota.resetsAt
    }, { status: 429 })
  }
  
  // Perform AI analysis...
  const result = await analyzeWithAI(feedbackText)
  
  // Increment usage counter
  await incrementUsage(userId!)
  
  return NextResponse.json({ success: true, result })
}
```

### Display Quota in Dashboard

```typescript
// In a Server Component
import { checkQuota, getSubscription } from '@/lib/billing'
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  const [quota, subscription] = await Promise.all([
    checkQuota(userId!),
    getSubscription(userId!)
  ])
  
  return (
    <div>
      <h2>{subscription?.plan.toUpperCase()} Plan</h2>
      <p>
        Used: {quota.used} / {quota.limit} analyses
      </p>
      <div className="w-full bg-gray-200 rounded">
        <div 
          className="bg-blue-600 h-2 rounded"
          style={{ width: `${(quota.used / quota.limit) * 100}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">
        Resets on {quota.resetsAt.toLocaleDateString()}
      </p>
    </div>
  )
}
```

---

## 🔄 Complete Analysis Flow

### Example: Full AI Analysis with Quota

See `app/api/analyze/route.ts` for complete implementation:

```typescript
export async function POST(req: Request) {
  const { userId } = await auth()
  
  // 1. Check quota
  const quota = await checkQuota(userId!)
  if (!quota.allowed) {
    return NextResponse.json({ error: 'Quota exceeded' }, { status: 429 })
  }
  
  // 2. Insert feedback
  const feedback = await insertFeedback(userId!, text, { rating, source })
  
  // 3. Analyze with AI
  const aiResult = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: text }]
  })
  
  // 4. Save analysis
  await insertAnalysis(feedback.id, aiResult)
  
  // 5. Increment usage ← Important!
  await incrementUsage(userId!)
  
  // 6. Return result with updated quota
  const updatedQuota = await checkQuota(userId!)
  return NextResponse.json({ 
    success: true,
    quota: updatedQuota
  })
}
```

---

## 🎫 Stripe Integration

### Set Up Stripe Products

1. **Create products in Stripe Dashboard:**
   - Pro Plan: $29/month
   - Business Plan: $99/month

2. **Get Price IDs:**
   - Copy the Price ID for each plan
   - Add to `.env.local`:

```env
STRIPE_PRICE_ID_PRO=price_1234567890
STRIPE_PRICE_ID_BUSINESS=price_0987654321
```

3. **Update `lib/billing.ts`:**
   Already configured to read from env vars!

### Handle Stripe Webhooks

Create `app/api/webhooks/stripe/route.ts`:

```typescript
import { updateSubscription } from '@/lib/billing'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
  
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription
      const clerkUserId = subscription.metadata.clerk_user_id
      
      // Map Stripe price ID to plan type
      const plan = getPlanFromPriceId(subscription.items.data[0].price.id)
      
      await updateSubscription(
        clerkUserId,
        plan,
        subscription.id
      )
      break
      
    case 'customer.subscription.deleted':
      // Downgrade to free
      const sub = event.data.object as Stripe.Subscription
      await updateSubscription(
        sub.metadata.clerk_user_id,
        'free'
      )
      break
  }
  
  return new Response('OK', { status: 200 })
}
```

---

## 📊 Quota Management Functions

### `checkQuota(userId: string)`

Returns:
```typescript
{
  allowed: boolean,      // Can perform action
  remaining: number,     // Analyses left
  used: number,          // Analyses used
  limit: number,         // Total limit
  plan: 'free'|'pro'|'business',
  status: 'active'|'cancelled'|...,
  resetsAt: Date        // When quota resets
}
```

### `incrementUsage(userId: string, count?: number)`

Increments usage counter. Call after successful AI analysis.

Returns: `boolean` (success)

### `getSubscription(userId: string)`

Returns full subscription record or null.

### `getCurrentUsage(userId: string)`

Returns usage record for current billing period.

### `canUploadFeedback(userId: string, count: number)`

Checks if user can store more feedback items.

Returns:
```typescript
{
  allowed: boolean,
  reason?: string
}
```

---

## 🔄 Automatic Quota Reset

The system automatically handles quota resets:

1. **On quota check**, if current date > period_end:
   - Updates subscription period dates
   - Creates new usage record with 0 counts
   - Returns fresh quota

2. **No cron jobs needed!**
   - Resets happen lazily on first check
   - Simple and reliable

---

## 🚨 Error Handling

### Quota Exceeded (429)

```typescript
if (!quota.allowed) {
  return NextResponse.json({
    error: 'Quota exceeded',
    message: `Upgrade to continue. Plan resets ${quota.resetsAt}`,
    quota: {
      used: quota.used,
      limit: quota.limit,
      plan: quota.plan
    }
  }, { status: 429 })
}
```

### Usage Increment Failed

```typescript
const success = await incrementUsage(userId)
if (!success) {
  console.error('Failed to increment usage')
  // Log for monitoring, but don't fail the request
}
```

---

## 🎨 UI Components

### Quota Display Component

```typescript
// components/QuotaDisplay.tsx
'use client'

import { useEffect, useState } from 'react'

export function QuotaDisplay({ userId }: { userId: string }) {
  const [quota, setQuota] = useState<any>(null)
  
  useEffect(() => {
    fetch(`/api/quota?userId=${userId}`)
      .then(res => res.json())
      .then(data => setQuota(data))
  }, [userId])
  
  if (!quota) return <div>Loading...</div>
  
  const percentage = (quota.used / quota.limit) * 100
  
  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold">{quota.plan.toUpperCase()} Plan</h3>
      <p className="text-sm text-gray-600 mb-2">
        {quota.used} / {quota.limit} analyses used
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            percentage > 90 ? 'bg-red-500' :
            percentage > 70 ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Resets {new Date(quota.resetsAt).toLocaleDateString()}
      </p>
    </div>
  )
}
```

### Upgrade Prompt

```typescript
// components/UpgradePrompt.tsx
export function UpgradePrompt({ quota }: { quota: any }) {
  if (quota.remaining > 10) return null
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-1">
          <p className="font-medium text-yellow-800">
            Running low on analyses
          </p>
          <p className="text-sm text-yellow-700">
            You have {quota.remaining} analyses left. 
            Upgrade for more capacity.
          </p>
        </div>
        <button className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded">
          Upgrade Now
        </button>
      </div>
    </div>
  )
}
```

---

## 🧪 Testing

### Create Test Subscription

```sql
-- In Supabase SQL Editor
INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end)
VALUES ('your-clerk-user-id', 'pro', 'active', NOW(), NOW() + INTERVAL '30 days');
```

### Simulate Usage

```typescript
// In your app or API route
import { incrementUsage } from '@/lib/billing'

// Add 50 analyses to test quota
for (let i = 0; i < 50; i++) {
  await incrementUsage(userId)
}
```

### Check Quota

```typescript
const quota = await checkQuota(userId)
console.log('Quota:', quota)
// Should show: used: 50, remaining: 950 (for pro plan)
```

---

## 📈 Analytics

### Usage Statistics Query

```sql
-- Get total usage across all users
SELECT 
    s.plan,
    COUNT(DISTINCT s.user_id) as users,
    SUM(u.analyses_count) as total_analyses,
    AVG(u.analyses_count) as avg_per_user
FROM subscriptions s
LEFT JOIN usage u ON s.user_id = u.user_id
WHERE u.period_start >= NOW() - INTERVAL '30 days'
GROUP BY s.plan;
```

### Revenue Projection

```typescript
// Get revenue from active subscriptions
const { data: subs } = await supabase
  .from('subscriptions')
  .select('plan, status')
  .eq('status', 'active')

const revenue = subs.reduce((sum, sub) => {
  return sum + PLANS[sub.plan].priceMonthly
}, 0)

console.log('Monthly Recurring Revenue:', revenue)
```

---

## 🔐 Security Considerations

✅ **RLS Policies** - Users can only see their own data  
✅ **Server-side checks** - All quota checks on backend  
✅ **Increment after success** - Only count successful analyses  
✅ **Idempotent operations** - Safe to call multiple times  
✅ **No client manipulation** - Quota can't be bypassed  

---

## 🐛 Troubleshooting

### Quota not resetting

**Solution:**
```sql
-- Manually reset period
UPDATE subscriptions 
SET 
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days'
WHERE user_id = 'your-user-id';

-- Create new usage record
INSERT INTO usage (user_id, period_start, period_end, analyses_count, feedback_count)
VALUES ('your-user-id', NOW(), NOW() + INTERVAL '30 days', 0, 0);
```

### Usage not incrementing

Check:
1. Subscription exists for user
2. Usage table has write permissions
3. `incrementUsage()` is being called after analysis
4. Check server logs for errors

### Quota shows 0/0

**Solution:**
```typescript
// Create subscription for user
const supabase = createServerClient()
await supabase.from('subscriptions').insert({
  user_id: userId,
  plan: 'free',
  status: 'active',
  current_period_start: new Date().toISOString(),
  current_period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
})
```

---

## ✅ Checklist

Setup:
- [ ] Run `supabase/sql/billing.sql` in Supabase
- [ ] Verify tables created (subscriptions, usage)
- [ ] Test RLS policies work
- [ ] Add Stripe price IDs to env vars

Integration:
- [ ] Import billing functions in API routes
- [ ] Call `checkQuota()` before AI analysis
- [ ] Call `incrementUsage()` after success
- [ ] Handle 429 errors in frontend
- [ ] Display quota in dashboard

Stripe:
- [ ] Create products in Stripe
- [ ] Set up webhook endpoint
- [ ] Test subscription creation
- [ ] Test plan upgrades/downgrades

---

## 🎯 Summary

**What's Included:**
- ✅ Complete billing logic in `lib/billing.ts`
- ✅ SQL schema in `supabase/sql/billing.sql`
- ✅ Example API route with quota enforcement
- ✅ 3 subscription tiers with limits
- ✅ Automatic quota resets
- ✅ TypeScript types and interfaces
- ✅ Error handling
- ✅ Usage tracking

**Ready for:**
- AI analysis quota enforcement
- Stripe subscription integration
- Usage analytics
- Multi-tier pricing
- Production deployment

---

**Your billing system is complete!** 🎉

Start enforcing quotas with:
```typescript
import { checkQuota, incrementUsage } from '@/lib/billing'
```

