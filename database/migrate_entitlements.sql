-- ============================================================
-- Migration: user_entitlements + redeem_invite_code RPC
-- Run in Supabase SQL Editor (safe to re-run, all idempotent)
-- ============================================================

-- 1. user_entitlements table
-- Stores granted access rights independent of paid subscriptions.
-- UNIQUE(user_id, type) → one record per entitlement type per user.
CREATE TABLE IF NOT EXISTS user_entitlements (
  id         BIGSERIAL     PRIMARY KEY,
  user_id    UUID          NOT NULL,
  type       TEXT          NOT NULL DEFAULT 'beta_trial',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user
  ON user_entitlements (user_id);

-- ============================================================
-- 2. Atomic invite-code redemption function
--
-- Guarantees:
--   • invite_codes row is locked with FOR UPDATE → no over-issue
--   • If user already redeemed any code → skip increment, still
--     grant/extend entitlement (idempotent re-entry)
--   • used_count is incremented only once per fresh redemption
--   • entitlement upsert uses GREATEST(expires_at) → safe to call
--     multiple times, always keeps the furthest expiry
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_invite_code(
  p_code     TEXT,
  p_user_id  UUID,
  p_email    TEXT,
  p_ttl_days INT DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_code_row  invite_codes%ROWTYPE;
  v_expires   TIMESTAMPTZ;
  v_rows      INT;
  v_already   BOOLEAN := FALSE;
BEGIN
  -- Has this user already redeemed ANY invite code?
  -- If yes we still grant/extend the entitlement but do NOT burn a code slot.
  IF EXISTS (SELECT 1 FROM invite_code_usage WHERE user_id = p_user_id) THEN
    v_already := TRUE;
  END IF;

  IF NOT v_already THEN
    -- Lock the row to prevent concurrent over-redemption
    SELECT * INTO v_code_row
    FROM invite_codes
    WHERE code = p_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', FALSE, 'error', 'Invalid invite code');
    END IF;

    IF NOT v_code_row.active THEN
      RETURN jsonb_build_object('ok', FALSE, 'error', 'Invite code is disabled');
    END IF;

    IF v_code_row.used_count >= v_code_row.max_uses THEN
      RETURN jsonb_build_object('ok', FALSE, 'error', 'Invite code exhausted');
    END IF;

    -- Record usage; idempotent on (code, user_id)
    INSERT INTO invite_code_usage (code, user_id, email)
    VALUES (p_code, p_user_id, p_email)
    ON CONFLICT (code, user_id) DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;

    -- Only increment used_count for a truly new redemption row
    IF v_rows > 0 THEN
      UPDATE invite_codes
      SET used_count = used_count + 1
      WHERE code = p_code;
    END IF;
  END IF;

  -- Grant / extend entitlement (idempotent)
  v_expires := NOW() + (p_ttl_days || ' days')::INTERVAL;

  INSERT INTO user_entitlements (user_id, type, expires_at)
  VALUES (p_user_id, 'beta_trial', v_expires)
  ON CONFLICT (user_id, type) DO UPDATE
    SET expires_at = GREATEST(user_entitlements.expires_at, EXCLUDED.expires_at);

  RETURN jsonb_build_object(
    'ok',             TRUE,
    'alreadyRedeemed', v_already,
    'channel',        CASE WHEN v_already THEN NULL ELSE v_code_row.channel END,
    'expires_at',     v_expires
  );
END;
$$;
