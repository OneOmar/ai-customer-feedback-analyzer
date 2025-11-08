# 🌱 Database Seeding Guide

Quick guide for seeding your Supabase database with sample data.

---

## 📋 What's Included

### Script: `scripts/seed-supabase.ts`

**Features:**
- ✅ Loads environment variables from `.env.local`
- ✅ Seeds 10 diverse feedback samples with realistic data
- ✅ Includes corresponding AI analysis for each feedback
- ✅ Various sentiments: positive, negative, neutral, mixed
- ✅ Different ratings (1-5 stars)
- ✅ Multiple sources: web, email, survey, social
- ✅ Detailed logging and error handling
- ✅ Optional cleanup command

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

**New dependencies added:**
- `tsx` - TypeScript execution engine
- `dotenv` - Environment variable loader

### Step 2: Set Environment Variables

Add to your `.env.local`:

```env
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Test user ID (your Clerk user ID)
TEST_USER_ID=user_2abc123xyz
```

**How to get your Test User ID:**
1. Sign up in your app (http://localhost:3000/sign-up)
2. Go to dashboard (http://localhost:3000/dashboard)
3. Your user ID is displayed on the page
4. Copy it to `.env.local` as `TEST_USER_ID`

### Step 3: Run the Seeding Script

```bash
npm run seed:supabase
```

**Expected output:**

```
✅ Environment variables loaded
📝 Seeding data for user: user_2abc123xyz

🌱 Starting database seeding...

📝 [1/10] Processing: "Absolutely love this product! It has completely..."
   ✅ Feedback inserted (ID: abc-123-def)
   ✅ Analysis inserted (Sentiment: positive)

📝 [2/10] Processing: "The product is good overall, but the setup..."
   ✅ Feedback inserted (ID: def-456-ghi)
   ✅ Analysis inserted (Sentiment: mixed)

... (8 more entries)

============================================================
📊 SEEDING SUMMARY
============================================================
✅ Feedback entries inserted: 10/10
✅ Analysis entries inserted: 10/10

🎉 All data seeded successfully!

📍 Test User ID: user_2abc123xyz
💡 You can now view this data in your application

✅ Seeding complete!
```

### Step 4: View Your Data

1. Go to http://localhost:3000/dashboard
2. You should see 10 feedback entries
3. Go to http://localhost:3000/dashboard/analytics
4. You should see sentiment statistics

---

## 🧹 Cleanup (Optional)

To remove all seeded data:

```bash
npm run seed:cleanup
```

This will delete all feedback (and cascade to analysis) for your test user.

---

## 📊 Sample Data Overview

### 10 Feedback Entries Include:

**5 Positive** ⭐⭐⭐⭐⭐ / ⭐⭐⭐⭐
- Enthusiastic product praise
- Great customer service experience
- Simple and effective design
- Fast shipping and packaging
- Transformed workflow

**2 Negative** ⭐ / ⭐⭐
- Product quality issues
- Technical bugs and crashes
- Unmet expectations

**3 Neutral/Mixed** ⭐⭐⭐
- Setup confusion but good support
- Adequate but not exceptional
- Pricing concerns

### Analysis Data Includes:
- `sentiment`: positive, negative, neutral, or mixed
- `sentiment_score`: -1 to 1 (numerical sentiment)
- `topics`: Array of extracted themes
- `summary`: Brief analysis summary
- `recommendation`: Suggested action
- `confidence_score`: 0.85-0.95 (AI confidence)

---

## 🔧 Customizing Sample Data

Edit `scripts/seed-supabase.ts` and modify the `SAMPLE_FEEDBACK` array:

```typescript
const SAMPLE_FEEDBACK = [
  {
    text: 'Your custom feedback text here',
    rating: 5,
    source: 'web',
    product_id: 'prod_001',
    username: 'custom_user',
    sentiment: 'positive' as const,
    sentiment_score: 0.90,
    topics: ['topic1', 'topic2'],
    summary: 'Your summary',
    recommendation: 'Your recommendation'
  },
  // Add more samples...
]
```

Then run `npm run seed:supabase` again.

---

## 🐛 Troubleshooting

### Error: "Missing required environment variables"

**Solution:**
```bash
# Ensure .env.local exists and has required variables
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
TEST_USER_ID=user_...
```

### Error: "Failed to insert feedback"

**Solution:**
1. Check Supabase connection:
   ```bash
   # Test in Supabase SQL Editor
   SELECT * FROM feedback LIMIT 1;
   ```

2. Verify RLS policies allow insertion
3. Check service role key is correct

### Error: "Cannot find module 'tsx'"

**Solution:**
```bash
npm install tsx dotenv --save-dev
```

### No data showing in dashboard

**Solution:**
1. Verify TEST_USER_ID matches your Clerk user ID
2. Check you're signed in with the correct account
3. Query directly in Supabase:
   ```sql
   SELECT * FROM feedback WHERE user_id = 'your-test-user-id';
   ```

---

## 📝 Usage in Development

### Scenario 1: Fresh Database

```bash
# Run SQL schema
# (In Supabase SQL Editor: run supabase/sql/init.sql)

# Seed with sample data
npm run seed:supabase

# Start app
npm run dev
```

### Scenario 2: Reset Test Data

```bash
# Clean up old data
npm run seed:cleanup

# Seed fresh data
npm run seed:supabase
```

### Scenario 3: Multiple Test Users

```bash
# Seed for user 1
TEST_USER_ID=user_abc npm run seed:supabase

# Seed for user 2
TEST_USER_ID=user_xyz npm run seed:supabase
```

---

## 🎯 Use Cases

### Testing Dashboard
✅ View feedback list  
✅ Test sentiment statistics  
✅ Verify charts render correctly  
✅ Check pagination/filtering  

### Testing Analytics
✅ Sentiment breakdown  
✅ Topic clustering  
✅ Rating distribution  
✅ Trend analysis  

### Testing Search
✅ Semantic similarity (after adding embeddings)  
✅ Filtering by rating  
✅ Filtering by source  
✅ Date range filtering  

### Demo Purposes
✅ Show potential users realistic data  
✅ Present to stakeholders  
✅ Create screenshots  
✅ Record demo videos  

---

## 🔄 Integration with Real Data

Once you have real data flowing in:

1. **Stop using seeded data:**
   ```bash
   npm run seed:cleanup
   ```

2. **Import real CSV:**
   - Use the upload feature at `/dashboard/upload`
   - Or create a bulk import script

3. **Generate real embeddings:**
   - Run embedding generation on real feedback
   - Enable semantic search

4. **Generate real analysis:**
   - Process feedback through OpenAI API
   - Store analysis results

---

## 📊 Data Statistics

After seeding, you'll have:

| Metric | Count |
|--------|-------|
| **Total Feedback** | 10 |
| **With Analysis** | 10 (100%) |
| **Positive Sentiment** | 5 (50%) |
| **Negative Sentiment** | 2 (20%) |
| **Neutral/Mixed** | 3 (30%) |
| **5-Star Ratings** | 5 |
| **4-Star Ratings** | 2 |
| **3-Star Ratings** | 2 |
| **1-2 Star Ratings** | 2 |

**Average Sentiment Score:** ~0.38 (slightly positive)  
**Average Rating:** ~3.8 stars

---

## ✅ Checklist

Before seeding:
- [ ] Supabase project created
- [ ] SQL schema executed (`supabase/sql/init.sql`)
- [ ] Environment variables set in `.env.local`
- [ ] Dependencies installed (`npm install`)

After seeding:
- [ ] Check Supabase Table Editor for data
- [ ] View feedback in app dashboard
- [ ] Verify analytics page shows stats
- [ ] Test querying and filtering

---

## 🎉 Success!

Your database is now populated with realistic sample data for development and testing!

**Next steps:**
1. Build your dashboard UI
2. Create analytics visualizations
3. Implement CSV upload
4. Add real AI analysis
5. Generate embeddings for semantic search

---

**Happy developing!** 🚀

