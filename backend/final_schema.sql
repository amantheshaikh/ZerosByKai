-- ZerosByKai - Final Consolidated Schema
-- Run this script in the Supabase SQL Editor.
-- It works for both new and existing databases (Idempotent-ish where possible),
-- but primarily intended as the definitive state.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Weekly Batches Table (defined first: FK target for ideas.week_published)
CREATE TABLE IF NOT EXISTS weekly_batches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  week_start_date date NOT NULL UNIQUE,
  winner_idea_id uuid,
  total_ideas integer DEFAULT 0,
  total_votes integer DEFAULT 0,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  subject_line text,
  winner_calculated boolean DEFAULT false,
  CONSTRAINT weekly_batches_pkey PRIMARY KEY (id),
  CONSTRAINT fk_weekly_batches_winner_idea FOREIGN KEY (winner_idea_id) REFERENCES public.ideas(id)
);

-- Ideas Table
CREATE TABLE IF NOT EXISTS ideas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  title text NOT NULL,
  problem text NOT NULL,
  solution text NOT NULL,
  target_audience text NOT NULL,
  why_it_matters text NOT NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  week_published date,
  status text DEFAULT 'backlog'::text CHECK (status = ANY (ARRAY['backlog'::text, 'approved'::text, 'scheduled'::text, 'published'::text, 'archived'::text])),
  created_at timestamp with time zone DEFAULT now(),
  is_winner boolean DEFAULT false,
  vote_count integer DEFAULT 0,
  CONSTRAINT ideas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_ideas_week_published FOREIGN KEY (week_published) REFERENCES public.weekly_batches(week_start_date)
);


-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  idea_id uuid,
  user_id uuid,
  voted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id),
  CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  type text NOT NULL,
  message text NOT NULL,
  email text,
  path text,
  user_id uuid,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Roasts Table
CREATE TABLE IF NOT EXISTS roasts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea text NOT NULL,
  roast jsonb NOT NULL,
  roast_score integer NOT NULL CHECK (roast_score >= 1 AND roast_score <= 10),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roasts_pkey PRIMARY KEY (id),
  CONSTRAINT roasts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  idea_id uuid,
  badge_type text CHECK (badge_type = 'kai_pick'::text),
  awarded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.ideas(id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Subscribers Table (unified: newsletter-only + authenticated users)
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  name text,
  subscribed_at timestamp with time zone DEFAULT now(),
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid UNIQUE,
  welcomed boolean DEFAULT false,
  unsubscribe_reason text,
  CONSTRAINT subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Processed Posts Table (Tracking external posts to avoid re-scraping)
CREATE TABLE IF NOT EXISTS processed_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  external_id text NOT NULL UNIQUE, -- reddit fullname (t3_...), hn id
  source text NOT NULL, -- 'reddit', 'hacker_news', etc.
  processed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT processed_posts_pkey PRIMARY KEY (id)
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
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- 4. SECURITY (RLS)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE roasts ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Drop existing to ensure clean slate if re-running)

-- Ideas
DROP POLICY IF EXISTS "Anyone can view published ideas" ON ideas;
CREATE POLICY "Anyone can view published ideas" ON ideas FOR SELECT USING (status IN ('published', 'archived') OR is_winner = true);

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

-- Feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedback;
CREATE POLICY "Anyone can insert feedback" ON feedback FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only service role can view feedback" ON feedback;
CREATE POLICY "Only service role can view feedback" ON feedback FOR SELECT USING (auth.role() = 'service_role');

-- Roasts
DROP POLICY IF EXISTS "Anyone can view public roasts" ON roasts;
CREATE POLICY "Anyone can view public roasts" ON roasts FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create roasts" ON roasts;
CREATE POLICY "Users can create roasts" ON roasts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own roasts" ON roasts;
CREATE POLICY "Users can update own roasts" ON roasts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. FUNCTIONS & TRIGGERS

-- Sync Total Votes in Weekly Batches
CREATE OR REPLACE FUNCTION public.sync_weekly_batch_vote_count()
RETURNS TRIGGER AS $$
DECLARE
    target_week DATE;
    target_idea_id UUID;
BEGIN
    if (TG_OP = 'INSERT') THEN
        target_idea_id := NEW.idea_id;
    ELSIF (TG_OP = 'DELETE') THEN
        target_idea_id := OLD.idea_id;
    END IF;

    -- 1. Sync Weekly Batch total
    SELECT week_published INTO target_week FROM ideas WHERE id = target_idea_id;
    IF target_week IS NOT NULL THEN
        UPDATE weekly_batches
        SET total_votes = (
            SELECT COUNT(*) FROM votes v
            JOIN ideas i ON v.idea_id = i.id
            WHERE i.week_published = target_week
        )
        WHERE week_start_date = target_week;
    END IF;

    -- 2. Sync Individual Idea total
    UPDATE ideas
    SET vote_count = (SELECT COUNT(*) FROM votes WHERE idea_id = target_idea_id)
    WHERE id = target_idea_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_weekly_batch_votes ON votes;
CREATE TRIGGER tr_sync_weekly_batch_votes
AFTER INSERT OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION public.sync_weekly_batch_vote_count();

-- Automatically flip winner_calculated when winner_idea_id is set
CREATE OR REPLACE FUNCTION public.sync_winner_calculated_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.winner_idea_id IS NOT NULL THEN
        NEW.winner_calculated := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_sync_winner_calculated ON weekly_batches;
CREATE TRIGGER tr_sync_winner_calculated
BEFORE INSERT OR UPDATE OF winner_idea_id ON weekly_batches
FOR EACH ROW EXECUTE FUNCTION public.sync_winner_calculated_flag();

-- Trigger function to sync new auth users to the subscribers table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    final_name TEXT;
BEGIN
  -- Extract name from metadata
  final_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    TRIM(CONCAT(NEW.raw_user_meta_data->>'given_name', ' ', NEW.raw_user_meta_data->>'family_name')),
    ''
  );

  -- UPSERT into subscribers
  INSERT INTO public.subscribers (user_id, email, name)
  VALUES (NEW.id, NEW.email, final_name)
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = CASE 
      WHEN final_name <> '' THEN final_name 
      ELSE subscribers.name 
    END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent Auth failure if subscriber sync fails
    RAISE WARNING 'handle_new_user trigger failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- Atomic vote swap via PostgreSQL function
-- Replaces the non-atomic delete-then-insert pattern in the
-- votes route with a single transaction, eliminating the window
-- where a user could temporarily have no vote on failure.

CREATE OR REPLACE FUNCTION cast_vote(
  p_idea_id  UUID,
  p_user_id  UUID,
  p_week_start DATE
)
RETURNS SETOF votes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete any existing vote for this user in this week
  DELETE FROM votes
  WHERE user_id = p_user_id
    AND idea_id IN (
      SELECT id FROM ideas WHERE week_published = p_week_start
    );

  -- Insert the new vote and return it
  RETURN QUERY
    INSERT INTO votes (idea_id, user_id)
    VALUES (p_idea_id, p_user_id)
    RETURNING *;
END;
$$;

-- Atomic scheduling of 10 backlog ideas
-- Ensures two concurrent requests cannot schedule the same ideas.
CREATE OR REPLACE FUNCTION pick_and_schedule_ideas(p_week DATE)
RETURNS SETOF ideas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_idea_ids UUID[];
BEGIN
  -- 1. Select and lock 10 oldest approved ideas
  SELECT array_agg(id) INTO v_idea_ids
  FROM (
    SELECT id
    FROM ideas
    WHERE status = 'approved'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 10
  ) subquery;

  -- Ensure we actually got exactly 10 ideas (array_agg returns NULL if no rows found)
  IF v_idea_ids IS NULL OR array_length(v_idea_ids, 1) < 10 THEN
    RAISE EXCEPTION 'Not enough approved ideas found (need 10, found %)', COALESCE(array_length(v_idea_ids, 1), 0);
  END IF;

  -- 2. Update their status to 'scheduled' and assign the week
  RETURN QUERY
    UPDATE ideas
    SET status = 'scheduled', week_published = p_week
    WHERE id = ANY(v_idea_ids)
    RETURNING *;
END;
$$;
