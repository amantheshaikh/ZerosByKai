-- ============================================================
-- Migration: Atomic vote swap via PostgreSQL function
-- Run this in the Supabase SQL Editor
-- ============================================================
--
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
