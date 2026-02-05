-- ZerosByKai - Final Consolidated Schema
-- Run this script in the Supabase SQL Editor.
-- It works for both new and existing databases (Idempotent-ish where possible),
-- but primarily intended as the definitive state.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Weekly Batches Table (defined first: FK target for ideas.week_published)
CREATE TABLE IF NOT EXISTS weekly_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL UNIQUE,
  winner_idea_id UUID,  -- FK added via ALTER TABLE below (circular dependency with ideas)
  total_ideas INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  posts_scraped INTEGER,
  subject_line TEXT,
  email_sent_at TIMESTAMPTZ,
  winner_calculated BOOLEAN DEFAULT FALSE,  -- Prevents race condition in calculateWinner()
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  -- Metadata
  tags JSONB DEFAULT '{}'::jsonb,
  week_published DATE REFERENCES weekly_batches(week_start_date) ON UPDATE CASCADE,
  status TEXT CHECK (status IN ('backlog', 'published', 'archived')) DEFAULT 'backlog',
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resolve circular dependency: weekly_batches.winner_idea_id → ideas(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_weekly_batches_winner_idea'
  ) THEN
    ALTER TABLE weekly_batches
      ADD CONSTRAINT fk_weekly_batches_winner_idea
      FOREIGN KEY (winner_idea_id) REFERENCES ideas(id);
  END IF;
END $$;

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(idea_id, user_id)
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  badge_type TEXT CHECK (badge_type IN ('kai_pick')),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, idea_id)
);

-- Subscribers Table (unified: newsletter-only + authenticated users)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  welcomed BOOLEAN DEFAULT FALSE,
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
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);

-- 4. SECURITY (RLS)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Drop existing to ensure clean slate if re-running)

-- Ideas
DROP POLICY IF EXISTS "Anyone can view published ideas" ON ideas;
CREATE POLICY "Anyone can view published ideas" ON ideas FOR SELECT USING (status = 'published' OR is_winner = true);

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

-- Subscribers
DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
CREATE POLICY "Anyone can subscribe" ON subscribers FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own subscriber record" ON subscribers;
CREATE POLICY "Users can view own subscriber record" ON subscribers FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriber record" ON subscribers;
CREATE POLICY "Users can update own subscriber record" ON subscribers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. FUNCTIONS & TRIGGERS

-- Handle New User (upsert into subscribers, linking user_id)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Security fix: explicitly set search_path
  SET LOCAL search_path = public, pg_temp;

  INSERT INTO public.subscribers (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'user_name',           -- GitHub sometimes
      NEW.raw_user_meta_data->>'preferred_username',  -- Generic OIDC
      TRIM(CONCAT(NEW.raw_user_meta_data->>'given_name', ' ', NEW.raw_user_meta_data->>'family_name')), -- LinkedIn/OIDC split
      ''
    )
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), subscribers.name);
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
  
  IF badge_count >= 20 THEN
    RETURN 'unicorn_hunter';
  ELSIF badge_count >= 12 THEN
    RETURN 'head_intelligence';
  ELSIF badge_count >= 7 THEN
    RETURN 'lead_analyst';
  ELSIF badge_count >= 3 THEN
    RETURN 'field_agent';
  ELSE
    RETURN 'onlooker';
  END IF;
END;
$$ LANGUAGE plpgsql;
