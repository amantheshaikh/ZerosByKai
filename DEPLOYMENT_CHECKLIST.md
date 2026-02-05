# Deployment Checklist for Critical Fixes

## Pre-Deployment (Local)
- [x] Code reviewed
- [x] Syntax verified (no errors)
- [x] Tests passed
- [x] Git staged and ready

## Deployment Steps

### 1. Database Migration
```bash
# Backup first!
flyctl postgres backup create

# Apply migration
flyctl postgres exec -- psql -U postgres -d postgres << 'SQL'
-- Migration: Add winner_calculated flag to weekly_batches
ALTER TABLE public.weekly_batches
ADD COLUMN IF NOT EXISTS winner_calculated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.weekly_batches.winner_calculated 
IS 'Flag indicating whether the winner for this week has been calculated and badges awarded. Prevents race conditions.';

CREATE INDEX IF NOT EXISTS idx_weekly_batches_winner_calculated 
ON weekly_batches(week_start_date, winner_calculated);
SQL

# Verify
flyctl postgres exec -- psql -U postgres -d postgres \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='weekly_batches';"
```

### 2. Code Deployment
```bash
# Commit changes
git add backend/src/jobs/backlog_check.js
git add backend/src/jobs/weekly.js
git add backend/final_schema.sql
git add backend/migrations/add_winner_calculated_flag.sql
git commit -m "fix: Timezone bug in backlog_check and race condition in calculateWinner"

# Push and deploy
git push
flyctl deploy
```

### 3. Monitor Deployment
```bash
# Watch logs
flyctl logs --follow | grep -E "deployed|running|error"

# Wait for deployment to complete
# Should see: "api is live"
```

## Post-Deployment Verification

### Immediate Checks
```bash
# 1. Verify app is running
curl https://zerosbykai-api.fly.dev/health
# Expected: {"status":"ok","service":"zerosbykai-api"}

# 2. Check logs for errors
flyctl logs --follow | head -50
# Should not show any FATAL or ERROR

# 3. Verify database column exists
flyctl postgres exec -- psql -U postgres -d postgres \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='weekly_batches';"
# Expected output should include: winner_calculated
```

### Scheduled Checks
- [ ] **Next Wed/Fri/Sun 9 AM UTC:** Backlog check should run without timezone errors
  ```bash
  flyctl logs --follow | grep "🔍 Checking newsletter"
  flyctl logs --follow | grep "Target Newsletter Date"
  ```

- [ ] **Next Monday 9 AM UTC:** Winner calculation should run
  ```bash
  flyctl logs --follow | grep "🏆 Calculating winner"
  flyctl logs --follow | grep "Winner identified"
  # OR
  flyctl logs --follow | grep "Winner already calculated"
  ```

### Database Validation
```bash
# Check winner_calculated flag is set correctly
flyctl postgres exec -- psql -U postgres -d postgres << 'SQL'
SELECT 
  week_start_date,
  winner_calculated,
  winner_idea_id,
  total_ideas
FROM weekly_batches
ORDER BY week_start_date DESC
LIMIT 5;
SQL
```

### Badge Verification
```bash
# Check for duplicate badges
flyctl postgres exec -- psql -U postgres -d postgres << 'SQL'
SELECT user_id, idea_id, COUNT(*) as count
FROM user_badges
GROUP BY user_id, idea_id
HAVING COUNT(*) > 1;
-- Should return empty result (no duplicates)
SQL
```

## Rollback Plan

If issues occur, rollback is safe:

```bash
# Revert code
git revert HEAD
git push
flyctl deploy

# Database is backward compatible (column defaults to FALSE)
# No migration rollback needed - column can be ignored

# Monitor after rollback
flyctl logs --follow | grep -i error
```

## Success Criteria

✅ **Deployment is successful if:**
- Code deploys without errors
- Database migration applies without errors
- `winner_calculated` column exists in `weekly_batches`
- App logs show no errors
- Scheduled jobs run on next occurrence
- No timezone-related errors in logs
- No duplicate badges created

⚠️ **Rollback if:**
- Database migration fails
- Code fails to deploy
- Errors appear in logs
- Scheduled jobs fail

## Notes

- Migration is idempotent (safe to run multiple times)
- Column defaults to FALSE (backward compatible)
- Index improves query performance
- Changes don't require any API endpoint changes
- Existing data is unaffected

---

**Status:** ✅ Ready for deployment
**Risk Level:** Low (backward compatible, tested)
**Estimated Deployment Time:** 5 minutes
