-- Migration: Sync Production Schema to Local Changes
-- Purpose: Consolidate all pending schema changes into a single idempotent script.
-- Generated: 2026-02-05

BEGIN;

-- 1. Update 'ideas' table status constraint
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE public.ideas ADD CONSTRAINT ideas_status_check 
  CHECK (status IN ('backlog', 'approved', 'scheduled', 'published', 'archived'));

-- 2. Enhance 'weekly_batches' table
-- Add winner_calculated flag to prevent race conditions
ALTER TABLE public.weekly_batches
ADD COLUMN IF NOT EXISTS winner_calculated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.weekly_batches.winner_calculated IS 'Flag indicating whether the winner for this week has been calculated and badges awarded. Prevents race conditions.';

-- Add index for efficient batch lookups
CREATE INDEX IF NOT EXISTS idx_weekly_batches_winner_calculated 
ON weekly_batches(week_start_date, winner_calculated);

-- 3. Update Foreign Key Safety (ON DELETE SET NULL for auth.users)
-- This ensures that deleting a user doesn't delete their votes/badges/subscriber record,
-- but rather dissociates them (preserving data for leaderboard/stats).

-- Modify votes table FK
ALTER TABLE public.votes 
  DROP CONSTRAINT IF EXISTS votes_user_id_fkey,
  ADD CONSTRAINT votes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Modify user_badges table FK
ALTER TABLE public.user_badges 
  DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey,
  ADD CONSTRAINT user_badges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Modify subscribers table FK
ALTER TABLE public.subscribers 
  DROP CONSTRAINT IF EXISTS subscribers_user_id_fkey,
  ADD CONSTRAINT subscribers_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure user_id columns are nullable (required for ON DELETE SET NULL)
ALTER TABLE public.votes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_badges ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.subscribers ALTER COLUMN user_id DROP NOT NULL;

-- 4. Add Unique Constraints (to prevent duplicates)
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_idea_id_user_id_key;
ALTER TABLE public.votes ADD CONSTRAINT votes_idea_id_user_id_key UNIQUE(idea_id, user_id);

ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_idea_id_key;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_idea_id_key UNIQUE(user_id, idea_id);

-- 5. Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ideas_week ON ideas(week_published);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_votes_idea ON votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_batches_date ON weekly_batches(week_start_date);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);

COMMIT;
