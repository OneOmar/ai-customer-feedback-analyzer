# 🗄️ Supabase Database Setup Guide

## ✅ Complete SQL Schema Created

Your Supabase database schema is ready at: `supabase/sql/init.sql`

This guide explains how to set up and use your database for the AI Feedback Analyzer.

---

## 📋 What's Included

### 1. **Extensions** ✅
- `pgcrypto` - UUID generation
- `vector` - pgvector for embeddings (1536 dimensions)

### 2. **Tables** ✅

#### **feedback**
Stores customer feedback with vector embeddings:
- `id` - UUID primary key
- `user_id` - Links to Clerk user (TEXT, not UUID since Clerk uses strings)
- `source` - Feedback source (survey, email, social, etc.)
- `product_id` - Product identifier
- `username` - Customer username
- `rating` - 1-5 star rating
- `text` - Feedback content (required)
- `created_at` / `updated_at` - Timestamps
- `embedding` - Vector(1536) for semantic search

#### **feedback_analysis**
Stores AI-generated analysis:
- `id` - UUID primary key
- `feedback_id` - Foreign key to feedback
- `sentiment` - positive/negative/neutral/mixed
- `sentiment_score` - -1 to 1
- `topics` - Array of extracted topics
- `summary` - AI-generated summary
- `recommendation` - Suggested action
- `confidence_score` - 0 to 1
- `created_at` / `updated_at` - Timestamps

#### **uploads**
Tracks CSV upload history:
- `id` - UUID primary key
- `user_id` - Links to Clerk user
- `filename` - Original filename
- `file_size` - Size in bytes
- `row_count` - Number of rows processed
- `status` - pending/processing/completed/failed
- `error_message` - Error details
- `created_at` / `completed_at` - Timestamps

### 3. **Indexes** ✅
- B-tree indexes on user_id, created_at, rating, source, product_id
- **IVFFLAT index** on embeddings for fast similarity search
- Unique index on feedback_analysis(feedback_id)

### 4. **Row Level Security (RLS)** ✅
All tables have RLS enabled with policies:
- Users can only access their own data
- Automatic enforcement via JWT tokens from Clerk

### 5. **Functions** ✅
- `update_updated_at_column()` - Auto-update timestamps
- `match_feedback()` - Semantic similarity search

### 6. **Views** ✅
- `feedback_with_analysis` - Joined view for easy querying

---

## 🚀 Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "ai-feedback-analyzer"
4. Choose a region close to your users
5. Set a strong database password (save it!)
6. Wait for project to be ready (~2 minutes)

### Step 2: Run the SQL Script

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/sql/init.sql`
4. Paste into the editor
5. Click "Run" (or press Ctrl+Enter)
6. Verify success: "Success. No rows returned"

### Step 3: Verify Tables Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see:
   - `feedback`
   - `feedback_analysis`
   - `uploads`
   - `feedback_with_analysis` (view)

### Step 4: Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abc123.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) - Keep this secret!

### Step 5: Add to `.env.local`

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔐 Authentication Integration

### Configure Clerk JWT for Supabase

Your RLS policies use `auth.jwt()->>'sub'` to get the user ID. This requires configuring Clerk to send JWT tokens to Supabase.

#### Option 1: Use Clerk User ID Directly (Simpler)

The current implementation already uses `user_id` as TEXT to match Clerk's string user IDs.

When inserting data:

```typescript
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

const { userId } = await auth()

await supabase.from('feedback').insert({
  user_id: userId, // Clerk user ID (string)
  text: 'Great product!',
  rating: 5
})
```

#### Option 2: Configure Clerk JWT Template (Advanced)

1. In Clerk Dashboard, go to **JWT Templates**
2. Create new template named "supabase"
3. Add this custom claim:
   ```json
   {
     "sub": "{{user.id}}"
   }
   ```
4. Update your Supabase client to use the JWT token

---

## 📊 Database Schema Diagram

```
┌─────────────────────────┐
│       feedback          │
├─────────────────────────┤
│ id (PK)                 │
│ user_id                 │──┐
│ source                  │  │
│ product_id              │  │
│ username                │  │
│ rating                  │  │
│ text                    │  │
│ created_at              │  │
│ updated_at              │  │
│ embedding (vector)      │  │
└─────────────────────────┘  │
                             │
                             │ 1:1
                             │
┌─────────────────────────┐  │
│   feedback_analysis     │  │
├─────────────────────────┤  │
│ id (PK)                 │  │
│ feedback_id (FK)        │──┘
│ sentiment               │
│ sentiment_score         │
│ topics                  │
│ summary                 │
│ recommendation          │
│ confidence_score        │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

┌─────────────────────────┐
│        uploads          │
├─────────────────────────┤
│ id (PK)                 │
│ user_id                 │
│ filename                │
│ file_size               │
│ row_count               │
│ status                  │
│ error_message           │
│ created_at              │
│ completed_at            │
└─────────────────────────┘
```

---

## 💻 Usage Examples

### Insert Feedback

```typescript
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

// In a Server Component or API Route
const { userId } = await auth()

const { data, error } = await supabase
  .from('feedback')
  .insert({
    user_id: userId,
    text: 'This product is amazing!',
    rating: 5,
    source: 'web',
    product_id: 'prod_123'
  })
  .select()
  .single()

if (error) console.error('Error:', error)
else console.log('Created:', data)
```

### Query User's Feedback

```typescript
const { userId } = await auth()

const { data, error } = await supabase
  .from('feedback')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// RLS automatically filters to only this user's data
```

### Insert Analysis

```typescript
const { data, error } = await supabase
  .from('feedback_analysis')
  .insert({
    feedback_id: feedbackId,
    sentiment: 'positive',
    sentiment_score: 0.85,
    topics: ['product quality', 'customer service'],
    summary: 'Customer is very satisfied with the product quality',
    recommendation: 'Share positive feedback with product team',
    confidence_score: 0.92
  })
```

### Get Feedback with Analysis

```typescript
const { userId } = await auth()

const { data, error } = await supabase
  .from('feedback_with_analysis')
  .select('*')
  .eq('user_id', userId)
  .order('feedback_created_at', { ascending: false })

// Returns joined data from both tables
```

### Semantic Similarity Search

```typescript
// First, get the query embedding from OpenAI
import { openai } from '@/lib/openai'

const embeddingResponse = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'product quality issues'
})

const queryEmbedding = embeddingResponse.data[0].embedding

// Then search for similar feedback
const { data, error } = await supabase
  .rpc('match_feedback', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
    filter_user_id: userId
  })

// Returns similar feedback ranked by similarity
```

### Update Feedback with Embedding

```typescript
// After getting embedding from OpenAI
const { data, error } = await supabase
  .from('feedback')
  .update({ embedding: embeddingVector })
  .eq('id', feedbackId)
```

### Track Upload

```typescript
// When starting upload
const { data: upload } = await supabase
  .from('uploads')
  .insert({
    user_id: userId,
    filename: 'feedback.csv',
    file_size: 1024000,
    row_count: 500,
    status: 'processing'
  })
  .select()
  .single()

// When completed
await supabase
  .from('uploads')
  .update({ 
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', upload.id)

// When failed
await supabase
  .from('uploads')
  .update({ 
    status: 'failed',
    error_message: 'Invalid CSV format'
  })
  .eq('id', upload.id)
```

---

## 🔍 Useful SQL Queries

### Count feedback by sentiment

```sql
SELECT 
    sentiment,
    COUNT(*) as count
FROM feedback_with_analysis
WHERE user_id = 'your-clerk-user-id'
GROUP BY sentiment;
```

### Average rating by product

```sql
SELECT 
    product_id,
    AVG(rating) as avg_rating,
    COUNT(*) as feedback_count
FROM feedback
WHERE user_id = 'your-clerk-user-id'
GROUP BY product_id;
```

### Recent feedback with analysis

```sql
SELECT * 
FROM feedback_with_analysis
WHERE user_id = 'your-clerk-user-id'
ORDER BY feedback_created_at DESC
LIMIT 10;
```

### Feedback without analysis (needs processing)

```sql
SELECT f.*
FROM feedback f
LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id
WHERE f.user_id = 'your-clerk-user-id'
AND fa.id IS NULL;
```

---

## 🎯 Next Steps

### 1. Implement CSV Upload
- Parse CSV file with PapaParse
- Insert feedback into database
- Track upload progress

### 2. Generate Embeddings
- Use OpenAI API to create embeddings
- Update feedback rows with embedding vectors
- Build IVFFLAT index for fast search

### 3. AI Analysis
- Use OpenAI/LangChain to analyze sentiment
- Extract topics from feedback
- Generate summaries and recommendations
- Store results in feedback_analysis table

### 4. Build Analytics Dashboard
- Query aggregated sentiment data
- Create charts with Recharts
- Show trends over time
- Display topic clustering

---

## 🛠️ Maintenance

### Rebuild IVFFLAT Index

If you have a lot of data and search becomes slow:

```sql
-- Drop and recreate with more lists
DROP INDEX idx_feedback_embedding_ivfflat;

CREATE INDEX idx_feedback_embedding_ivfflat
ON feedback USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 500); -- Adjust based on data size
```

### Clean Up Old Data

```sql
-- Delete feedback older than 1 year
DELETE FROM feedback
WHERE created_at < NOW() - INTERVAL '1 year'
AND user_id = 'your-clerk-user-id';
```

### Check Database Size

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🐛 Troubleshooting

### Error: "extension vector does not exist"

**Solution:** Enable pgvector in Supabase:
1. Go to Database → Extensions
2. Enable "vector"
3. Re-run the SQL script

### Error: "permission denied for table feedback"

**Solution:** Check RLS policies:
1. Ensure user is authenticated
2. Verify JWT token contains user ID
3. Check policy matches your auth setup

### Slow Vector Searches

**Solution:** 
1. Ensure IVFFLAT index exists
2. Increase `lists` parameter in index
3. Consider reducing match_count

### RLS Policy Not Working

**Solution:**
1. Check that RLS is enabled: `ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'feedback';`
3. Test with Supabase Dashboard SQL editor using:
   ```sql
   SET request.jwt.claims = '{"sub": "your-user-id"}';
   SELECT * FROM feedback;
   ```

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Vector Operations](https://github.com/pgvector/pgvector#operators)

---

## ✅ Checklist

Setup completion checklist:

- [ ] Supabase project created
- [ ] SQL script executed successfully
- [ ] Tables visible in Table Editor
- [ ] Credentials added to `.env.local`
- [ ] Supabase client configured in `lib/supabase.ts`
- [ ] Test insert feedback (manual or via app)
- [ ] Test RLS policies (should only see own data)
- [ ] Generate test embedding
- [ ] Test semantic search
- [ ] Verify analysis insertion works

---

**Your database is ready!** 🎉

Run the SQL script in Supabase and start building your AI-powered feedback analyzer!

