# Changelog - February 2, 2026

## Summary of Changes

This document summarizes all changes made to the ZerosByKai project on February 2, 2026.

---

## 🎯 Major Features Added

### 1. Email Token Auto-Login
**What:** Users clicking links in weekly digest emails are automatically signed in.

**How it works:**
- Weekly digest emails include `?token=<jwt>` in URLs
- Frontend detects token and verifies with backend
- Session is created automatically
- Token is removed from URL

**Files changed:**
- `backend/src/utils/emailToken.js` (NEW)
- `backend/src/routes/auth.js` (added `/verify-email-token` endpoint)
- `backend/src/jobs/weekly.js` (generate tokens for authenticated users)
- `frontend/lib/auth.js` (auto-login logic)

**Benefits:**
- Reduces voting friction from 9 steps to 4
- Improves user engagement
- Seamless experience from email to voting

---

### 2. Enhanced Reddit Scraping
**What:** Improved anti-detection measures to avoid Reddit blacklisting.

**Improvements:**
- Rotating user agents (5 different browser fingerprints)
- Randomized delays (2-5 seconds between chunks)
- Exponential backoff on rate limits
- Staggered request starts
- Better error handling

**Files changed:**
- `backend/src/jobs/reddit_scraper.js` (formerly `daily_startup_ideas.js`)

**Benefits:**
- More reliable scraping
- Harder to detect as bot
- Better error recovery

---

### 3. Improved AI Idea Generation
**What:** Enhanced retry logic to ensure 10 ideas are always generated.

**Improvements:**
- 3-level retry system (per-batch, per-workflow, per-request)
- Dynamic batch sizing based on remaining needs
- Better error logging
- Fallback to backup Gemini model

**Files changed:**
- `backend/src/jobs/reddit_scraper.js`

**Benefits:**
- Guaranteed 10 ideas every week
- More resilient to API failures
- Better debugging

---

## 🗂️ Code Organization

### File Structure Improvements

**Moved:**
- `src/workflows/daily_startup_ideas.js` → `src/jobs/reddit_scraper.js`
  - Better naming (it's weekly, not daily)
  - Correct location (production job, not workflow)

**Removed:**
- `src/scripts/run-reddit-flow.js` (redundant wrapper)
- `src/routes/admin.js` (use Supabase dashboard instead)
- `src/scripts/delete-users.js` (duplicate of SQL script)
- `src/scripts/migrate-*.sql` (old migrations)

**Added:**
- `src/utils/emailToken.js` (JWT token utilities)
- `src/workflows/simulate_monday_workflow.js` (end-to-end testing)
- `src/emails/templates/` (separated email templates)

---

### Email Templates Refactored

**Before:**
```
src/emails/
└── templates.js (13.4 KB, 289 lines)
```

**After:**
```
src/emails/
├── templates.js (285 bytes, re-exports)
└── templates/
    ├── shared.js (2.8 KB, shared components)
    ├── weekly-digest.js (4.5 KB)
    ├── welcome.js (1.9 KB)
    └── magic-link.js (1.5 KB)
```

**Benefits:**
- Easier to maintain
- Shared components extracted (DRY)
- Better git diffs
- Reduced total size by 2.4 KB

---

## 🔐 Authentication Improvements

### Refactored `frontend/lib/auth.js`

**Improvements:**
- Comprehensive JSDoc comments
- Better error handling
- Clearer function names
- New methods exposed:
  - `sendMagicLink(email, name)`
  - `subscribeNewsletter(email, name)`
- Better logging with emoji prefixes
- Proper session management

**All flows covered:**
1. ✅ Email token auto-login
2. ✅ Magic link authentication
3. ✅ Google OAuth
4. ✅ Newsletter-only subscription
5. ✅ Post-login hooks

---

## 📚 Documentation Updates

### New Documentation
- `AUTH_DOCUMENTATION.md` - Comprehensive auth guide
- `CHANGELOG.md` - This file

### Updated Documentation
- `PROJECT_DOCUMENTATION.md` - Updated with new structure
- `backend/README.md` - Updated API endpoints and structure
- `backend/SIMULATION.md` - Enhanced testing guide

---

## 🔧 Environment Variables

### Added
- `JWT_SECRET` - For email token signing (backend)

### Removed
- `ADMIN_PASSWORD` - No longer needed (admin routes removed)

---

## 🐛 Bug Fixes

### 1. Duplicate Welcome Emails
**Issue:** Users receiving multiple welcome emails  
**Fix:** Added `welcomed` flag check in post-login hook  
**Files:** `backend/src/routes/auth.js`

### 2. Session Management
**Issue:** Post-login hook running multiple times  
**Fix:** Added sessionStorage flag to prevent duplicates  
**Files:** `frontend/lib/auth.js`

### 3. Error Handling
**Issue:** Errors blocking user experience  
**Fix:** Non-critical errors now fail silently with logging  
**Files:** `frontend/lib/auth.js`, `backend/src/routes/auth.js`

---

## 📊 Statistics

### Files Changed
- Modified: 13 files
- Added: 8 files
- Deleted: 5 files

### Lines of Code
- Added: ~1,200 lines
- Removed: ~500 lines
- Net change: +700 lines (mostly documentation)

### Documentation
- Added: 3 new docs
- Updated: 3 existing docs
- Total documentation: ~2,000 lines

---

## 🚀 Deployment Checklist

Before deploying to production:

- [x] Test Reddit scraping locally
- [x] Test Monday workflow end-to-end
- [x] Test all email templates
- [x] Test auto-login flow
- [x] Update environment variables
- [x] Update documentation
- [ ] Deploy backend to Fly.io
- [ ] Deploy frontend to Vercel
- [ ] Verify cron jobs are running
- [ ] Monitor first production run

---

## 🔮 Future Enhancements

### Potential Improvements
- [ ] Add token revocation to database
- [ ] Implement rate limiting on auth endpoints
- [ ] Add analytics for email click-throughs
- [ ] A/B test auto-login feature
- [ ] Add password authentication option
- [ ] Implement 2FA for sensitive actions

---

## 📝 Migration Notes

### For Existing Deployments

1. **Update Environment Variables**
   ```bash
   # Backend (Fly.io)
   fly secrets set JWT_SECRET="your_secure_random_string"
   fly secrets unset ADMIN_PASSWORD
   ```

2. **Update GitHub Actions Secrets**
   - Verify `GEMINI_API_KEY` is set
   - No changes needed to workflow file

3. **Database**
   - No schema changes required
   - Existing data is compatible

4. **Frontend**
   - No environment variable changes
   - Redeploy to pick up auth.js changes

---

## 🙏 Acknowledgments

All changes implemented based on user feedback and best practices for:
- Security (JWT tokens, session management)
- User experience (auto-login, reduced friction)
- Code quality (documentation, organization)
- Reliability (retry logic, error handling)

---

**Date**: February 2, 2026  
**Version**: 2.0.0  
**Status**: Ready for production deployment
