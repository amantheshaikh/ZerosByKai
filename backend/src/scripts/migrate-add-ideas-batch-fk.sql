-- Migration: Add FK ideas.week_published → weekly_batches.week_start_date, drop batch_id
-- Run in Supabase SQL Editor BEFORE deploying updated backend code.

BEGIN;

-- 1. Backfill: insert missing weekly_batches rows for any ideas.week_published
--    values that don't yet have a matching batch.
INSERT INTO weekly_batches (week_start_date, total_ideas)
SELECT DISTINCT i.week_published, 0
FROM ideas i
WHERE i.week_published IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM weekly_batches wb
    WHERE wb.week_start_date = i.week_published
  );

-- 2. Add FK constraint (ON UPDATE CASCADE, default RESTRICT on delete)
ALTER TABLE ideas
  ADD CONSTRAINT fk_ideas_week_published
  FOREIGN KEY (week_published)
  REFERENCES weekly_batches(week_start_date)
  ON UPDATE CASCADE;

-- 3. Drop the orphaned batch_id column
ALTER TABLE ideas DROP COLUMN IF EXISTS batch_id;

COMMIT;
