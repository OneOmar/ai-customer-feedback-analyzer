-- ============================================================================
-- Billing and Subscription Tables
-- ============================================================================
-- Add these tables to support subscription plans and usage tracking
-- Run this after running init.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Subscriptions Table
-- Tracks user subscription plans and billing periods
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference (Clerk user ID)
    user_id TEXT NOT NULL UNIQUE,
    
    -- Subscription details
    plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')) DEFAULT 'free',
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')) DEFAULT 'active',
    
    -- Billing period
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Add comment
COMMENT ON TABLE subscriptions IS 'User subscription plans and billing information';

-- ----------------------------------------------------------------------------
-- Usage Table
-- Tracks usage within billing periods for quota enforcement
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference
    user_id TEXT NOT NULL,
    
    -- Billing period this usage applies to
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Usage counters
    analyses_count INTEGER NOT NULL DEFAULT 0,
    feedback_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for usage queries
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_period ON usage(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_period_start ON usage(period_start);

-- Add comment
COMMENT ON TABLE usage IS 'Usage tracking for billing periods and quota enforcement';

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on usage
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies for Subscriptions
-- ----------------------------------------------------------------------------

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON subscriptions
FOR SELECT
USING (user_id = auth.jwt()->>'sub');

-- Users can update their own subscription (for plan changes)
CREATE POLICY "Users can update their own subscription"
ON subscriptions
FOR UPDATE
USING (user_id = auth.jwt()->>'sub')
WITH CHECK (user_id = auth.jwt()->>'sub');

-- System can insert subscriptions (handled by backend)
CREATE POLICY "System can insert subscriptions"
ON subscriptions
FOR INSERT
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- RLS Policies for Usage
-- ----------------------------------------------------------------------------

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON usage
FOR SELECT
USING (user_id = auth.jwt()->>'sub');

-- System can manage usage (handled by backend)
CREATE POLICY "System can insert usage"
ON usage
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update usage"
ON usage
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Triggers
-- ----------------------------------------------------------------------------

-- Apply auto-update trigger to subscriptions
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply auto-update trigger to usage
CREATE TRIGGER update_usage_updated_at
    BEFORE UPDATE ON usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Helper Functions
-- ----------------------------------------------------------------------------

/**
 * Get current usage for a user
 * Returns usage stats for the current billing period
 */
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id TEXT)
RETURNS TABLE (
    analyses_count INTEGER,
    feedback_count INTEGER,
    plan TEXT,
    limit_analyses INTEGER,
    limit_feedback INTEGER,
    period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription RECORD;
    v_usage RECORD;
BEGIN
    -- Get subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get usage for current period
    SELECT * INTO v_usage
    FROM usage
    WHERE user_id = p_user_id
    AND period_start >= v_subscription.current_period_start
    AND period_end <= v_subscription.current_period_end
    LIMIT 1;
    
    -- Return combined data
    RETURN QUERY
    SELECT 
        COALESCE(v_usage.analyses_count, 0)::INTEGER,
        COALESCE(v_usage.feedback_count, 0)::INTEGER,
        v_subscription.plan::TEXT,
        CASE v_subscription.plan
            WHEN 'free' THEN 100
            WHEN 'pro' THEN 1000
            WHEN 'business' THEN 10000
        END::INTEGER,
        CASE v_subscription.plan
            WHEN 'free' THEN 500
            WHEN 'pro' THEN 10000
            WHEN 'business' THEN 100000
        END::INTEGER,
        v_subscription.current_period_end;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_current_usage IS 'Get usage statistics for current billing period';

-- ----------------------------------------------------------------------------
-- Sample Data (Optional - for testing)
-- ----------------------------------------------------------------------------

-- Uncomment to create test subscriptions
/*
-- Free tier user
INSERT INTO subscriptions (user_id, plan, status)
VALUES ('test-user-free', 'free', 'active');

-- Pro tier user
INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id)
VALUES ('test-user-pro', 'pro', 'active', 'cus_test123', 'sub_test123');

-- Business tier user
INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id)
VALUES ('test-user-business', 'business', 'active', 'cus_test456', 'sub_test456');

-- Add some usage data
INSERT INTO usage (user_id, period_start, period_end, analyses_count, feedback_count)
VALUES 
    ('test-user-free', NOW(), NOW() + INTERVAL '30 days', 25, 50),
    ('test-user-pro', NOW(), NOW() + INTERVAL '30 days', 150, 500),
    ('test-user-business', NOW(), NOW() + INTERVAL '30 days', 2500, 5000);
*/

-- ----------------------------------------------------------------------------
-- Setup Complete
-- ----------------------------------------------------------------------------
-- Your billing tables are ready!
--
-- Next steps:
-- 1. Use lib/billing.ts functions to check quotas
-- 2. Call incrementUsage() after each AI analysis
-- 3. Integrate Stripe webhooks for subscription changes
-- 4. Display quota information in dashboard
--
-- Example query to check usage:
-- SELECT * FROM get_current_usage('your-clerk-user-id');
-- ----------------------------------------------------------------------------

