-- ⚠️ DANGER: This script wipes all user data but PRESERVES valid votes.
-- Run this in the Supabase SQL Editor.

BEGIN;

-- 1. Delete Badges (User achievements should be wiped)
TRUNCATE TABLE public.user_badges;

-- 2. Delete Subscribers (Remove all email records)
TRUNCATE TABLE public.subscribers;

-- 3. Delete Users
-- Because 'votes' table has ON DELETE SET NULL, the votes will NOT be deleted.
-- They will simply have their 'user_id' set to NULL.
-- This preserves the "Total Votes" count on ideas while removing the user who cast them.
DELETE FROM auth.users;

COMMIT;

-- Note: Deleting from auth.users automatically cascades to:
-- - auth.identities
-- - auth.sessions
-- - auth.mfa_factors
