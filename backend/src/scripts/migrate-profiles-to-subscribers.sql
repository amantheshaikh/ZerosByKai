-- Migration: Merge profiles into subscribers
-- Run this in Supabase SQL Editor BEFORE deploying the updated backend code.
--
-- What this does:
-- 1. Adds user_id and welcomed columns to subscribers
-- 2. Backfills data from profiles + auth.users
-- 3. Drops the profiles table
-- 4. Removes dead badge_emails_sent_at column from weekly_batches
-- 5. Updates the handle_new_user() trigger
-- 6. Updates RLS policies

-- ============================================================
-- STEP 1: Add new columns to subscribers
-- ============================================================

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS welcomed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);

-- ============================================================
-- STEP 2: Backfill — link existing auth users to their subscriber records
-- ============================================================

-- 2a. For auth users who already have a subscriber record (match by email):
-- Copy user_id from auth.users and welcomed from profiles
UPDATE subscribers s
SET
  user_id = au.id,
  welcomed = COALESCE(p.welcomed, FALSE)
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE s.email = au.email
  AND s.user_id IS NULL;

-- 2b. For auth users who do NOT have a subscriber record yet:
-- Insert them into subscribers
INSERT INTO subscribers (user_id, email, name, welcomed)
SELECT
  au.id,
  au.email,
  COALESCE(p.name, au.raw_user_meta_data->>'name', ''),
  COALESCE(p.welcomed, FALSE)
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE NOT EXISTS (
  SELECT 1 FROM subscribers s WHERE s.email = au.email
);

-- ============================================================
-- STEP 3: Drop profiles table and its policies
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP TABLE IF EXISTS profiles;

-- ============================================================
-- STEP 4: Remove dead column from weekly_batches
-- ============================================================

ALTER TABLE weekly_batches DROP COLUMN IF EXISTS badge_emails_sent_at;

-- ============================================================
-- STEP 5: Update the handle_new_user() trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscribers (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), subscribers.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 6: Update RLS policies on subscribers
-- ============================================================

-- Add SELECT policy for authenticated users
DROP POLICY IF EXISTS "Users can view own subscriber record" ON subscribers;
CREATE POLICY "Users can view own subscriber record" ON subscribers
  FOR SELECT USING (auth.uid() = user_id);

-- Add UPDATE policy for authenticated users
DROP POLICY IF EXISTS "Users can update own subscriber record" ON subscribers;
CREATE POLICY "Users can update own subscriber record" ON subscribers
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure INSERT policy still exists
DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);
