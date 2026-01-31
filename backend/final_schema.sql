-- ZerosByKai - Final Consolidated Schema
-- Run this script in the Supabase SQL Editor.
-- It works for both new and existing databases (Idempotent-ish where possible),
-- but primarily intended as the definitive state.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  source_links JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  tags JSONB DEFAULT '{}'::jsonb,
  week_published DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Diversity tracking
  problem_keywords TEXT[],
  theme TEXT,
  
  -- Workflow batch reference
  batch_id TEXT,
  
  -- Moderation
  moderated_by TEXT,
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT
);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(idea_id, user_id)
);

-- Weekly Batches Table
CREATE TABLE IF NOT EXISTS weekly_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL UNIQUE,
  winner_idea_id UUID REFERENCES ideas(id),
  total_ideas INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  posts_scraped INTEGER,
  email_sent_at TIMESTAMPTZ,
  badge_emails_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  badge_type TEXT CHECK (badge_type IN ('kai_pick', 'bronze', 'silver', 'gold', 'diamond')),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, idea_id)
);

-- Users Profile Table (Extensions of auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  welcomed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing databases:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcomed BOOLEAN DEFAULT FALSE;
-- UPDATE profiles SET welcomed = TRUE WHERE welcomed IS NULL OR welcomed = FALSE;

-- Newsletter Subscribers Table (for non-authenticated users)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_ideas_week ON ideas(week_published);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_votes_idea ON votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_batches_date ON weekly_batches(week_start_date);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- 4. SECURITY (RLS)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Drop existing to ensure clean slate if re-running)

-- Ideas
DROP POLICY IF EXISTS "Anyone can view published ideas" ON ideas;
CREATE POLICY "Anyone can view published ideas" ON ideas FOR SELECT USING (status = 'published');

-- Votes
DROP POLICY IF EXISTS "Users can view own votes" ON votes;
CREATE POLICY "Users can view own votes" ON votes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create votes" ON votes;
CREATE POLICY "Users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON votes;
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Weekly Batches
DROP POLICY IF EXISTS "Anyone can view weekly batches" ON weekly_batches;
CREATE POLICY "Anyone can view weekly batches" ON weekly_batches FOR SELECT USING (true);

-- User Badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscribers (public insert for newsletter signup)
DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (true);

-- 6. FUNCTIONS & TRIGGERS

-- Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Get Badge Tier
CREATE OR REPLACE FUNCTION get_badge_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  badge_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO badge_count
  FROM user_badges
  WHERE user_id = user_uuid AND badge_type = 'kai_pick';
  
  IF badge_count >= 11 THEN
    RETURN 'diamond';
  ELSIF badge_count >= 6 THEN
    RETURN 'gold';
  ELSIF badge_count >= 3 THEN
    RETURN 'silver';
  ELSIF badge_count >= 1 THEN
    RETURN 'bronze';
  ELSE
    RETURN 'none';
  END IF;
END;
$$ LANGUAGE plpgsql;
