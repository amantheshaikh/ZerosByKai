-- ============================================================
-- Migration: Add roasts table for Roast My Idea feature
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS roasts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea        TEXT        NOT NULL,
  roast       JSONB       NOT NULL,
  roast_score INTEGER     NOT NULL CHECK (roast_score >= 1 AND roast_score <= 10),
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast public feed queries (newest first)
CREATE INDEX IF NOT EXISTS roasts_public_feed_idx
  ON roasts (created_at DESC)
  WHERE is_public = true;

-- Index for user history lookups
CREATE INDEX IF NOT EXISTS roasts_user_idx
  ON roasts (user_id, created_at DESC);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE roasts ENABLE ROW LEVEL SECURITY;

-- Users can do anything with their own roasts
CREATE POLICY "users_own_roasts"
  ON roasts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone (including anonymous) can read public roasts
CREATE POLICY "public_roasts_readable"
  ON roasts
  FOR SELECT
  USING (is_public = true);
