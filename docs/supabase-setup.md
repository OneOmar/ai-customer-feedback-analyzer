# Supabase Setup Guide

Complete setup instructions for the AI Feedback Analyzer database.

---

## 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `ai-feedback-analyzer`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning to complete

---

## 2. Enable Required Extensions

### Enable pgvector (for embeddings)

1. In your Supabase dashboard, go to **Database** → **Extensions**
2. Search for `vector`
3. Click the toggle to **enable** it
4. Alternatively, run in SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Enable pgcrypto (for UUID generation)

1. In **Database** → **Extensions**
2. Search for `pgcrypto`
3. Enable it (usually enabled by default)
4. Or run:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Verify Extensions

```sql
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pgcrypto');
```

Should return 2 rows.

---

## 3. Run Database Schema

### Run init.sql

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Open `supabase/sql/init.sql` from your project
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter`)
7. Wait for execution (should take ~5 seconds)
8. Verify success: **"Success. No rows returned"**

This creates:
- `feedback` table (with vector embeddings)
- `feedback_analysis` table
- `uploads` table
- `feedback_with_analysis` view
- Indexes (including IVFFLAT for vectors)
- RLS policies
- Helper functions

### Run billing.sql (Optional but Recommended)

1. Click **"New query"** again
2. Open `supabase/sql/billing.sql`
3. Copy and paste contents
4. Click **"Run"**

This creates:
- `subscriptions` table
- `usage` table
- Billing-related RLS policies
- Helper functions for quota management

---

## 4. Verify Tables and RLS

### Check Tables Created

Go to **Database** → **Tables** and verify:

- [x] `feedback`
- [x] `feedback_analysis`
- [x] `uploads`
- [x] `subscriptions` (if you ran billing.sql)
- [x] `usage` (if you ran billing.sql)

### Verify RLS Enabled

Run in SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('feedback', 'feedback_analysis', 'uploads', 'subscriptions', 'usage');
```

All tables should show `rowsecurity = true`.

### Check RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

Should return multiple policies for each table (SELECT, INSERT, UPDATE, DELETE).

### Test Vector Index

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'feedback' 
AND indexname LIKE '%ivfflat%';
```

Should return `idx_feedback_embedding_ivfflat`.

---

## 5. Configure Environment Variables

### Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:

| Variable | Location in Dashboard |
|----------|----------------------|
| **Project URL** | Under "Project URL" |
| **anon public** key | Under "Project API keys" |
| **service_role** key | Under "Project API keys" (click "Reveal" first) |

### Add to `.env.local`

Create or update `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test User ID (get this from your Clerk dashboard after signing up)
TEST_USER_ID=user_2abc123xyz
```

### Security Note

⚠️ **NEVER commit `.env.local` to version control!**

The `.gitignore` file already excludes it, but double-check:

```bash
# Verify .env.local is ignored
git status
# Should NOT show .env.local
```

---

## 6. Seed Sample Data

### Install Dependencies (if not done)

```bash
npm install
```

### Run Seeding Script

```bash
npm run seed:supabase
```

This will:
- Insert 10 diverse feedback samples
- Add corresponding AI analysis for each
- Associate all data with your `TEST_USER_ID`

### Expected Output

```
✅ Environment variables loaded
📝 Seeding data for user: user_2abc123xyz

🌱 Starting database seeding...

📝 [1/10] Processing: "Absolutely love this product!..."
   ✅ Feedback inserted (ID: abc-123)
   ✅ Analysis inserted (Sentiment: positive)

... (9 more entries)

============================================================
📊 SEEDING SUMMARY
============================================================
✅ Feedback entries inserted: 10/10
✅ Analysis entries inserted: 10/10

🎉 All data seeded successfully!
```

### Verify Seeded Data

In Supabase **Table Editor**:

1. Click on `feedback` table
2. You should see 10 rows
3. Click on `feedback_analysis` table
4. You should see 10 corresponding analysis rows

Or query in SQL Editor:

```sql
SELECT COUNT(*) FROM feedback;
-- Should return: 10

SELECT COUNT(*) FROM feedback_analysis;
-- Should return: 10

SELECT sentiment, COUNT(*) 
FROM feedback_analysis 
GROUP BY sentiment;
-- Should show distribution of sentiments
```

### Clean Up Seed Data (Optional)

```bash
npm run seed:cleanup
```

---

## 7. Backup, Migration & Restore

### Using Supabase Dashboard

#### Create Backup

1. Go to **Settings** → **Database**
2. Scroll to **Backups** section
3. Click **"Create backup"**
4. Backups are automatic on paid plans (daily)

#### Restore from Backup

1. In **Settings** → **Database** → **Backups**
2. Find the backup you want to restore
3. Click **"Restore"**
4. Confirm (⚠️ this will overwrite current data)

### Using Supabase CLI

#### Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm (all platforms)
npm install -g supabase
```

#### Login to Supabase

```bash
supabase login
```

#### Link to Your Project

```bash
supabase link --project-ref your-project-id
```

Find your project ID in: **Settings** → **General** → **Reference ID**

#### Pull Database Schema

```bash
supabase db pull
```

This creates a `supabase/migrations/` folder with your schema.

#### Create Migration

```bash
supabase migration new add_new_column
```

Edit the generated file in `supabase/migrations/`, then:

```bash
supabase db push
```

#### Dump Database

```bash
# Export schema and data
supabase db dump -f backup.sql

# Schema only
supabase db dump --schema-only -f schema.sql

# Data only
supabase db dump --data-only -f data.sql
```

#### Restore from Dump

```bash
supabase db reset
psql -h db.your-project.supabase.co -U postgres -d postgres -f backup.sql
```

### Manual SQL Backup

#### Export Current Schema

In SQL Editor:

```sql
-- Get all table definitions
SELECT 
    'CREATE TABLE ' || tablename || ' (...);' as create_statement
FROM pg_tables 
WHERE schemaname = 'public';
```

Copy the output and save to a file.

#### Export Data as CSV

```sql
-- Export feedback data
COPY (SELECT * FROM feedback) TO '/tmp/feedback.csv' CSV HEADER;

-- Export analysis data
COPY (SELECT * FROM feedback_analysis) TO '/tmp/feedback_analysis.csv' CSV HEADER;
```

Or use **Table Editor**:
1. Select table
2. Click **"Export"** → **"CSV"**

---

## 8. Verify Setup Complete

### Checklist

- [ ] Supabase project created
- [ ] Extensions enabled (vector, pgcrypto)
- [ ] `init.sql` executed successfully
- [ ] `billing.sql` executed (optional but recommended)
- [ ] All tables visible in Table Editor
- [ ] RLS enabled on all tables
- [ ] RLS policies created
- [ ] Environment variables set in `.env.local`
- [ ] Seeding script runs successfully
- [ ] Sample data visible in dashboard
- [ ] Can connect from Next.js app

### Test Connection

Create a test file `scripts/test-connection.ts`:

```typescript
import { createServerClient } from '../lib/supabase'

async function testConnection() {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('feedback')
    .select('count')
    .single()
  
  if (error) {
    console.error('❌ Connection failed:', error)
    return
  }
  
  console.log('✅ Connected to Supabase!')
  console.log('📊 Feedback count:', data)
}

testConnection()
```

Run:

```bash
npx tsx scripts/test-connection.ts
```

Should output: `✅ Connected to Supabase!`

---

## 9. Common Issues & Solutions

### Issue: "extension vector does not exist"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "permission denied for table feedback"

**Solution:** RLS is blocking you. Either:
1. Use service role key (bypasses RLS)
2. Set JWT claims correctly in your queries
3. Temporarily disable RLS for testing:
```sql
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
```
(Re-enable after testing!)

### Issue: Seed script fails with "Missing environment variables"

**Solution:** Ensure `.env.local` exists with all required variables:
```bash
cat .env.local
# Should show NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_ID
```

### Issue: Can't see seeded data in app

**Solution:** 
1. Verify `TEST_USER_ID` matches your Clerk user ID
2. Sign in with the correct account
3. Check RLS policies allow reading

### Issue: Vector search not working

**Solution:**
1. Verify IVFFLAT index exists:
```sql
\d+ feedback
-- Should show idx_feedback_embedding_ivfflat
```
2. Ensure embeddings are populated (not NULL)
3. Try rebuilding index:
```sql
REINDEX INDEX idx_feedback_embedding_ivfflat;
```

---

## 10. Next Steps

After setup is complete:

1. **Test in your app:**
   ```bash
   npm run dev
   ```
   Visit: http://localhost:3000/dashboard

2. **Generate embeddings:**
   - Implement OpenAI embedding generation
   - Update feedback rows with vectors
   - Test semantic search

3. **Set up Stripe:**
   - Configure subscription webhooks
   - Update subscriptions table on payment events

4. **Monitor usage:**
   - Check **Database** → **Database** for metrics
   - Set up alerts for storage/bandwidth

5. **Production deployment:**
   - Upgrade to paid plan if needed
   - Enable Point-in-Time Recovery (PITR)
   - Set up automated backups
   - Configure connection pooling

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Your Supabase database is ready!** 🎉

Next: Run `npm run dev` and start building your AI Feedback Analyzer.

