-- ZerosByKai - Delete Specific User Completely
-- This script deletes a user by email from ALL relevant tables.
-- Run this in the Supabase SQL Editor.

DO $$ 
DECLARE 
    target_email TEXT := 'user@example.com'; -- <--- CHANGE THIS to the user's email
    target_id UUID;
BEGIN
    -- 1. Find the user ID
    SELECT id INTO target_id FROM auth.users WHERE email = target_email;

    IF target_id IS NULL THEN
        RAISE NOTICE 'User with email % not found in auth.users. Checking subscribers table...', target_email;
        
        -- Fallback: If not in auth, they might only be a newsletter subscriber
        DELETE FROM public.subscribers WHERE email = target_email;
        
        RAISE NOTICE 'Subscriber record for % (if any) deleted.', target_email;
        RETURN;
    END IF;

    -- 2. Delete Badges (User achievements)
    DELETE FROM public.user_badges WHERE user_id = target_id;

    -- 3. Keep Votes
    -- Note: We do NOT delete votes. Because the 'votes' table has 'ON DELETE SET NULL' 
    -- on the user_id column, deleting the user from auth.users will automatically 
    -- set these votes to anonymous (NULL user_id) while preserving the count.

    -- 4. Delete Subscriber record (Newsletter info and link to user_id)
    DELETE FROM public.subscribers WHERE email = target_email OR user_id = target_id;

    -- 5. Delete from Auth (This cascades to identities, sessions, etc.)
    DELETE FROM auth.users WHERE id = target_id;

    RAISE NOTICE 'User % (ID: %) and all associated data deleted successfully from all systems.', target_email, target_id;
END $$;
