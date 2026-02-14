-- Invite codes table for beta access
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invite_codes (
  code       VARCHAR(32) PRIMARY KEY,
  max_uses   INT NOT NULL DEFAULT 50,
  used_count INT NOT NULL DEFAULT 0,
  channel    VARCHAR(64) DEFAULT NULL,   -- e.g. "twitter", "kol-zhang", "producthunt"
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track which user used which code
CREATE TABLE IF NOT EXISTS invite_code_usage (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(32) NOT NULL REFERENCES invite_codes(code),
  user_id    UUID NOT NULL,
  email      VARCHAR(255) DEFAULT NULL,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code, user_id)   -- same user can't use same code twice
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_invite_usage_user ON invite_code_usage(user_id);

-- Seed some initial codes (adjust as needed)
INSERT INTO invite_codes (code, max_uses, channel) VALUES
  ('FUYOU-BETA01',   100, 'official'),
  ('FUYOU-REDDIT',   50,  'reddit'),
  ('FUYOU-PH2025',   200, 'producthunt')
ON CONFLICT (code) DO NOTHING;
