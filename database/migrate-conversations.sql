-- ============================================================
-- FuyouAI: Conversations / Messages / Module Runs Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          text,
  source         text,
  current_module text,
  status         text        NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 2. messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         text        NOT NULL,
  message_type    text,
  engine_name     text,
  module_name     text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id         ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages(created_at);

-- 3. module_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS module_runs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id       uuid        REFERENCES conversations(id) ON DELETE SET NULL,
  input_text            text,
  detected_intent       text,
  target_engine         text,
  target_module         text,
  clarification_needed  boolean     NOT NULL DEFAULT false,
  clarification_question text,
  final_output          text,
  status                text        NOT NULL DEFAULT 'success',
  token_usage_input     integer,
  token_usage_output    integer,
  latency_ms            integer,
  error_message         text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_module_runs_user_id         ON module_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_module_runs_conversation_id ON module_runs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_module_runs_created_at      ON module_runs(created_at DESC);

-- 4. Auto-refresh conversations.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. RLS
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_runs   ENABLE ROW LEVEL SECURITY;

-- conversations
DROP POLICY IF EXISTS "conv_select" ON conversations;
DROP POLICY IF EXISTS "conv_insert" ON conversations;
DROP POLICY IF EXISTS "conv_update" ON conversations;
DROP POLICY IF EXISTS "conv_delete" ON conversations;

CREATE POLICY "conv_select" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conv_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv_update" ON conversations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv_delete" ON conversations FOR DELETE USING (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS "msg_select" ON messages;
DROP POLICY IF EXISTS "msg_insert" ON messages;
DROP POLICY IF EXISTS "msg_update" ON messages;
DROP POLICY IF EXISTS "msg_delete" ON messages;

CREATE POLICY "msg_select" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "msg_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "msg_update" ON messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "msg_delete" ON messages FOR DELETE USING (auth.uid() = user_id);

-- module_runs
DROP POLICY IF EXISTS "runs_select" ON module_runs;
DROP POLICY IF EXISTS "runs_insert" ON module_runs;
DROP POLICY IF EXISTS "runs_update" ON module_runs;
DROP POLICY IF EXISTS "runs_delete" ON module_runs;

CREATE POLICY "runs_select" ON module_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "runs_insert" ON module_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "runs_update" ON module_runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "runs_delete" ON module_runs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Verify
-- ============================================================
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = t.table_name AND table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'messages', 'module_runs')
ORDER BY table_name;
