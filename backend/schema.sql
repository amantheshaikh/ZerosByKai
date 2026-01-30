-- ZerosByKai Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ideas table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  source_links JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  tags JSONB DEFAULT '{}'::jsonb, -- {geography: ["india"], category: ["cleantech"]}
  week_published DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Diversity tracking
  problem_keywords TEXT[],
  theme TEXT,
  
  -- BubbleLab reference
  bubblelab_batch_id TEXT,
  
  -- Moderation
  moderated_by TEXT,
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(idea_id, user_id)
);

-- Weekly batches table
CREATE TABLE weekly_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL UNIQUE,
  winner_idea_id UUID REFERENCES ideas(id),
  total_ideas INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  email_sent_at TIMESTAMPTZ,
  badge_emails_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges tracking
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  badge_type TEXT CHECK (badge_type IN ('kai_pick', 'bronze', 'silver', 'gold', 'diamond')),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, idea_id)
);

-- User profiles (extended from Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ideas_week ON ideas(week_published);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_votes_idea ON votes(idea_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_badges_user ON user_badges(user_id);
CREATE INDEX idx_weekly_batches_date ON weekly_batches(week_start_date);

-- Enable Row Level Security
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Ideas: Anyone can read published ideas
CREATE POLICY "Anyone can view published ideas"
  ON ideas FOR SELECT
  USING (status = 'published');

-- Votes: Users can read their own votes
CREATE POLICY "Users can view own votes"
  ON votes FOR SELECT
  USING (auth.uid() = user_id);

-- Votes: Users can insert their own votes
CREATE POLICY "Users can create votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Votes: Users can delete their own votes (change vote)
CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly batches: Anyone can read
CREATE POLICY "Anyone can view weekly batches"
  ON weekly_batches FOR SELECT
  USING (true);

-- User badges: Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Profiles: Users can view all profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Profiles: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate badge tier
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
