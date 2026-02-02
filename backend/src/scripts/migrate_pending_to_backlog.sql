-- Migration: Update 'pending' status to 'backlog'
-- Run this BEFORE applying the new check constraint

UPDATE ideas 
SET status = 'backlog' 
WHERE status = 'pending';
