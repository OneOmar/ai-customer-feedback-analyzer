-- ============================================================================
-- AI Customer Feedback Analyzer - Database Schema
-- ============================================================================
-- This SQL file sets up the complete database schema for the feedback analyzer
-- including vector embeddings for semantic search and AI analysis.
--
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
-- Enable required PostgreSQL extensions for UUID generation and vector search

-- pgcrypto: Provides cryptographic functions including gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- vector: Enables pgvector for storing and querying vector embeddings
-- Used for semantic search on customer feedback
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Feedback Table
-- Stores customer feedback data with vector embeddings for semantic search
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference (from Clerk auth, stored as UUID)
    -- Links feedback to the user who uploaded it
    user_id TEXT NOT NULL,
    
    -- Metadata fields
    source TEXT,                    -- Source of feedback (e.g., 'survey', 'email', 'social')
    product_id TEXT,                -- Product identifier this feedback relates to
    username TEXT,                  -- Customer username/identifier (if available)
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5), -- Rating 1-5 stars
    
    -- Feedback content
    text TEXT NOT NULL,             -- The actual feedback text (required)
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Vector embedding for semantic search
    -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
    embedding VECTOR(1536)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
CREATE INDEX IF NOT EXISTS idx_feedback_product_id ON feedback(product_id);

-- Create IVFFLAT index for fast approximate nearest neighbor search on embeddings
-- This enables efficient semantic similarity searches
-- Lists = 100 is a good starting point for up to ~100k rows
-- Adjust lists based on your data size: sqrt(total_rows) is a common heuristic
CREATE INDEX IF NOT EXISTS idx_feedback_embedding_ivfflat
ON feedback USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add comment to table
COMMENT ON TABLE feedback IS 'Customer feedback data with vector embeddings for AI analysis';
COMMENT ON COLUMN feedback.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';

-- ----------------------------------------------------------------------------
-- Feedback Analysis Table
-- Stores AI-generated analysis results for each feedback entry
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback_analysis (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to feedback table
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    
    -- AI Analysis results
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    sentiment_score DECIMAL(3, 2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    
    -- Topics extracted from feedback (array of strings)
    topics TEXT[],
    
    -- AI-generated summaries and recommendations
    summary TEXT,                   -- Brief summary of the feedback
    recommendation TEXT,            -- Suggested action or response
    
    -- Additional analysis metadata
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analysis queries
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_feedback_id ON feedback_analysis(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_sentiment ON feedback_analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_analysis_created_at ON feedback_analysis(created_at DESC);

-- Create unique index to ensure one analysis per feedback
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_analysis_unique_feedback 
ON feedback_analysis(feedback_id);

-- Add comment to table
COMMENT ON TABLE feedback_analysis IS 'AI-generated analysis results for customer feedback';

-- ----------------------------------------------------------------------------
-- Uploads Table (optional but useful for tracking CSV uploads)
-- Tracks uploaded files and their processing status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploads (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference
    user_id TEXT NOT NULL,
    
    -- File information
    filename TEXT NOT NULL,
    file_size INTEGER,              -- File size in bytes
    row_count INTEGER,              -- Number of rows in CSV
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,             -- Error details if processing failed
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create indexes for upload queries
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at DESC);

-- Add comment to table
COMMENT ON TABLE uploads IS 'Tracks CSV upload history and processing status';

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Enable RLS to ensure users can only access their own data
-- This is critical for multi-tenant security

-- Enable RLS on feedback table
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Enable RLS on feedback_analysis table
ALTER TABLE feedback_analysis ENABLE ROW LEVEL SECURITY;

-- Enable RLS on uploads table
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Feedback Policies
-- Users can only see and manage their own feedback
-- ----------------------------------------------------------------------------

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON feedback
FOR SELECT
USING (user_id = auth.jwt()->>'sub');

-- Alternative policy if using direct user_id from Clerk
-- CREATE POLICY "Users can view their own feedback"
-- ON feedback
-- FOR SELECT
-- USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON feedback
FOR INSERT
WITH CHECK (user_id = auth.jwt()->>'sub');

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
ON feedback
FOR UPDATE
USING (user_id = auth.jwt()->>'sub')
WITH CHECK (user_id = auth.jwt()->>'sub');

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback"
ON feedback
FOR DELETE
USING (user_id = auth.jwt()->>'sub');

-- ----------------------------------------------------------------------------
-- Feedback Analysis Policies
-- Users can only see analysis of their own feedback
-- ----------------------------------------------------------------------------

-- Policy: Users can view analysis of their own feedback
CREATE POLICY "Users can view analysis of their own feedback"
ON feedback_analysis
FOR SELECT
USING (
    feedback_id IN (
        SELECT id FROM feedback 
        WHERE user_id = auth.jwt()->>'sub'
    )
);

-- Policy: Users can insert analysis for their own feedback
CREATE POLICY "Users can insert analysis for their own feedback"
ON feedback_analysis
FOR INSERT
WITH CHECK (
    feedback_id IN (
        SELECT id FROM feedback 
        WHERE user_id = auth.jwt()->>'sub'
    )
);

-- Policy: Users can update analysis of their own feedback
CREATE POLICY "Users can update analysis of their own feedback"
ON feedback_analysis
FOR UPDATE
USING (
    feedback_id IN (
        SELECT id FROM feedback 
        WHERE user_id = auth.jwt()->>'sub'
    )
);

-- Policy: Users can delete analysis of their own feedback
CREATE POLICY "Users can delete analysis of their own feedback"
ON feedback_analysis
FOR DELETE
USING (
    feedback_id IN (
        SELECT id FROM feedback 
        WHERE user_id = auth.jwt()->>'sub'
    )
);

-- ----------------------------------------------------------------------------
-- Uploads Policies
-- Users can only see their own uploads
-- ----------------------------------------------------------------------------

-- Policy: Users can view their own uploads
CREATE POLICY "Users can view their own uploads"
ON uploads
FOR SELECT
USING (user_id = auth.jwt()->>'sub');

-- Policy: Users can insert their own uploads
CREATE POLICY "Users can insert their own uploads"
ON uploads
FOR INSERT
WITH CHECK (user_id = auth.jwt()->>'sub');

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update their own uploads"
ON uploads
FOR UPDATE
USING (user_id = auth.jwt()->>'sub')
WITH CHECK (user_id = auth.jwt()->>'sub');

-- ----------------------------------------------------------------------------
-- 5. FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to feedback table
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply the trigger to feedback_analysis table
CREATE TRIGGER update_feedback_analysis_updated_at
    BEFORE UPDATE ON feedback_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Function for semantic similarity search
-- Finds feedback similar to a given query vector
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_feedback(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    text TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        feedback.id,
        feedback.text,
        1 - (feedback.embedding <=> query_embedding) AS similarity
    FROM feedback
    WHERE 
        feedback.embedding IS NOT NULL
        AND (filter_user_id IS NULL OR feedback.user_id = filter_user_id)
        AND 1 - (feedback.embedding <=> query_embedding) > match_threshold
    ORDER BY feedback.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION match_feedback IS 'Performs semantic similarity search on feedback using vector embeddings';

-- ----------------------------------------------------------------------------
-- 6. VIEWS (Optional but useful)
-- ----------------------------------------------------------------------------

-- View: Feedback with analysis
-- Joins feedback and analysis for easy querying
CREATE OR REPLACE VIEW feedback_with_analysis AS
SELECT 
    f.id,
    f.user_id,
    f.source,
    f.product_id,
    f.username,
    f.rating,
    f.text,
    f.created_at AS feedback_created_at,
    fa.sentiment,
    fa.sentiment_score,
    fa.topics,
    fa.summary,
    fa.recommendation,
    fa.confidence_score,
    fa.created_at AS analysis_created_at
FROM feedback f
LEFT JOIN feedback_analysis fa ON f.id = fa.feedback_id;

-- Add comment to view
COMMENT ON VIEW feedback_with_analysis IS 'Combined view of feedback and their analysis results';

-- ----------------------------------------------------------------------------
-- 7. SEED DATA (Optional - for testing)
-- ----------------------------------------------------------------------------
-- Uncomment to add sample data for testing

/*
-- Sample feedback data
INSERT INTO feedback (user_id, source, rating, text) VALUES
('test-user-1', 'survey', 5, 'Absolutely love this product! It exceeded all my expectations.'),
('test-user-1', 'email', 4, 'Great service, but delivery took a bit longer than expected.'),
('test-user-1', 'social', 2, 'Disappointed with the quality. Expected better for the price.');

-- Sample analysis data (you would normally generate this with AI)
INSERT INTO feedback_analysis (feedback_id, sentiment, sentiment_score, topics, summary) 
SELECT 
    id,
    'positive',
    0.95,
    ARRAY['product quality', 'satisfaction'],
    'Customer is very satisfied with the product'
FROM feedback 
WHERE rating = 5
LIMIT 1;
*/

-- ----------------------------------------------------------------------------
-- SETUP COMPLETE
-- ----------------------------------------------------------------------------
-- Your database is now ready for the AI Feedback Analyzer!
--
-- Next steps:
-- 1. Test by inserting sample feedback
-- 2. Generate embeddings using OpenAI API
-- 3. Update feedback with embeddings
-- 4. Run semantic similarity searches
--
-- Example queries:
-- 
-- -- Insert feedback
-- INSERT INTO feedback (user_id, text, rating, source)
-- VALUES ('your-clerk-user-id', 'Great product!', 5, 'web');
--
-- -- View all feedback with analysis
-- SELECT * FROM feedback_with_analysis WHERE user_id = 'your-clerk-user-id';
--
-- -- Search similar feedback (after adding embeddings)
-- SELECT * FROM match_feedback(
--     '[your-query-embedding-vector]'::vector,
--     0.7,
--     5,
--     'your-clerk-user-id'
-- );
-- ----------------------------------------------------------------------------

