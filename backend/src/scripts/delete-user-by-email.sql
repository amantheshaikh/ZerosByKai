-- Delete User by Email Script
-- This script deletes a user from both auth.users and subscribers tables
-- CASCADE constraints will automatically clean up related records in votes and user_badges
--
-- USAGE:
-- Replace 'user@example.com' with the actual email address you want to delete
-- Run this in Supabase SQL Editor or via psql

-- ============================================
-- CONFIGURATION: Set the email to delete here
-- ============================================
DO $$
DECLARE
  target_email TEXT := 'user@example.com';  -- CHANGE THIS EMAIL
  deleted_user_id UUID;
  deleted_subscriber_id UUID;
  votes_count INTEGER;
  badges_count INTEGER;
BEGIN
  -- Start transaction (implicit in DO block)
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting deletion process for email: %', target_email;
  RAISE NOTICE '========================================';
  
  -- Check if user exists in auth.users
  SELECT id INTO deleted_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF deleted_user_id IS NULL THEN
    RAISE NOTICE 'No user found in auth.users with email: %', target_email;
  ELSE
    RAISE NOTICE 'Found user in auth.users with ID: %', deleted_user_id;
    
    -- Count related records before deletion
    SELECT COUNT(*) INTO votes_count
    FROM votes
    WHERE user_id = deleted_user_id;
    
    SELECT COUNT(*) INTO badges_count
    FROM user_badges
    WHERE user_id = deleted_user_id;
    
    RAISE NOTICE 'User has % votes and % badges (will be deleted via CASCADE)', votes_count, badges_count;
  END IF;
  
  -- Check if subscriber exists
  SELECT id INTO deleted_subscriber_id
  FROM subscribers
  WHERE email = target_email;
  
  IF deleted_subscriber_id IS NULL THEN
    RAISE NOTICE 'No subscriber found with email: %', target_email;
  ELSE
    RAISE NOTICE 'Found subscriber with ID: %', deleted_subscriber_id;
  END IF;
  
  -- Perform deletions
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Executing deletions...';
  RAISE NOTICE '========================================';
  
  -- Delete from subscribers table
  DELETE FROM subscribers WHERE email = target_email;
  RAISE NOTICE '✓ Deleted from subscribers table';
  
  -- Delete from auth.users (this will CASCADE to votes and user_badges)
  DELETE FROM auth.users WHERE email = target_email;
  RAISE NOTICE '✓ Deleted from auth.users (votes and badges cascaded)';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Deletion completed successfully for: %', target_email;
  RAISE NOTICE '========================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error during deletion: %', SQLERRM;
END $$;
