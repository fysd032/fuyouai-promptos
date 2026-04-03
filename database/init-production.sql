-- ====================================================================
-- FuyouAI Production Database Initialization
-- Run this in Supabase SQL Editor before going live
-- ====================================================================

-- 1. Invite Codes System
-- ====================================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  code       VARCHAR(32) PRIMARY KEY,
  max_uses   INT NOT NULL DEFAULT 50,
  used_count INT NOT NULL DEFAULT 0,
  channel    VARCHAR(64) DEFAULT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invite_code_usage (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(32) NOT NULL REFERENCES invite_codes(code),
  user_id    UUID NOT NULL,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code, user_id)
);

CREATE INDEX IF NOT EXISTS idx_invite_usage_user ON invite_code_usage(user_id);

-- Seed initial invite codes (modify as needed)
INSERT INTO invite_codes (code, max_uses, channel) VALUES
  ('FUYOU-BETA01',   100, 'official'),
  ('FUYOU-REDDIT',   50,  'reddit'),
  ('FUYOU-PH2025',   200, 'producthunt')
ON CONFLICT (code) DO NOTHING;

-- 2. User Entitlements (Optional - for manual grants)
-- ====================================================================

CREATE TABLE IF NOT EXISTS user_entitlements (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL,
  type       TEXT NOT NULL DEFAULT 'beta_trial',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user ON user_entitlements(user_id);

-- 3. Subscriptions (Required for paid plans)
-- ====================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   VARCHAR(32) NOT NULL DEFAULT 'free',
  status                 VARCHAR(32) NOT NULL DEFAULT 'inactive',
  trial_start            TIMESTAMPTZ,
  trial_end              TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT false,
  current_period_end     TIMESTAMPTZ,
  creem_customer_id      VARCHAR(255),
  creem_subscription_id  VARCHAR(255),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_customer ON subscriptions(creem_customer_id);

-- 4. Creem Webhook Events (Required for payment idempotency)
-- ====================================================================

CREATE TABLE IF NOT EXISTS creem_webhook_events (
  id         VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creem_events_created ON creem_webhook_events(created_at);

-- 5. Cleanup old webhook events (optional - run periodically)
-- ====================================================================

-- Delete events older than 30 days (run this monthly via cron or manually)
-- DELETE FROM creem_webhook_events WHERE created_at < NOW() - INTERVAL '30 days';

-- ====================================================================
-- Verification Queries
-- ====================================================================

-- Run these to verify all tables are created:

SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'invite_codes',
    'invite_code_usage',
    'user_entitlements',
    'subscriptions',
    'creem_webhook_events'
  )
ORDER BY table_name;

-- Check invite codes:
SELECT code, max_uses, used_count, active, channel FROM invite_codes;

-- ====================================================================
-- DONE! Your database is ready for production.
-- ====================================================================
