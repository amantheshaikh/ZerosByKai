# ZerosByKai - AI Context (Tier 1: Foundation)

## Project Overview
AI-powered weekly startup ideas platform. Scrapes Reddit, Hacker News, Indie Hackers, and X for real problems, analyzes with Gemini AI, delivers 10 validated ideas every Monday.

**Monorepo:** `frontend/` (Next.js 14, Pages Router, Vercel) + `backend/` (Node.js/Express, Fly.io)  
**Database:** Supabase (PostgreSQL + Auth)  
**Email:** Brevo (Transactional + Contacts)  
**AI:** Google Gemini (Flash 2.0 / 1.5)

## Quick Reference
- **Dev:** `npm run dev` in `frontend/` (port 3000) and `backend/` (port 3001)
- **Test:** `npm test` in either directory (Vitest)
- **Build:** `npm run build` in `frontend/`
- **Structure:** See `docs/ai-context/project-structure.md` for full file tree
- **Docs:** See `docs/ai-context/docs-overview.md` for 3-tier doc system
- **Main Docs:** See `README.md` for comprehensive guide

## Code Standards
- **Language:** JavaScript (no TypeScript). Async/await. Functional React components.
- **Testing:** Vitest for unit/integration tests. Supertest for API testing.
- **Security:** Secrets in env vars only. Supabase RLS for data isolation.
- **Principles:** KISS, YAGNI, DRY. Prefer existing libraries over custom implementations.
- **File Size:** Keep files focused and under 350 lines. Split by responsibility.
- **Documentation:** Update `docs/` or `README.md` when architecture changes.

## Key Patterns

### Authentication
- **Methods:** Supabase magic link + Google OAuth + Email token auto-login
- **Frontend:** `AuthProvider` in `frontend/lib/auth.js` handles all auth flows
- **Backend:** JWT tokens for email auto-login, Supabase session for authenticated requests
- **API:** `apiFetch()` helper automatically injects Bearer tokens
- **Flows:** 
  - Newsletter-only subscription (no account)
  - Magic link sign-in/sign-up
  - Google OAuth
  - Email token auto-login (from weekly digest)

### API Architecture
- **Routes:** Express routes at `/api/{ideas,votes,auth}`
- **Clients:** Two Supabase clients:
  - `supabase` (RLS-enabled for user operations)
  - `supabaseAdmin` (service key for admin operations)
- **Auth:** Bearer token validation via Supabase `getUser()`

### Automation & Jobs
- **Generate:** Multi-source scraping → Gemini AI → `backlog` ideas (`npm run scrape:local`)
- **Approve:** Admin reviews `backlog` → marks as `approved` in Supabase
- **Schedule:** Select 10 oldest approved ideas → Lock for next week (`npm run schedule`)
- **Monday 9 AM UTC (Automated):** 
    1. Calculate last week's winner & award badges
    2. Publish *scheduled* batch (`scheduled` -> `published`)
    3. Send digest (Brevo Batch API)

### Email System
- **Provider:** Brevo (Transaction & Contacts Sync)
- **Templates:** Separated into `backend/src/emails/templates/`
- **Auto-Login:** JWT tokens in email URLs for seamless voting

## Weekly Workflow

### 1. Generate
- **Command:** `npm run scrape:local`
- **Result:** Populates `ideas` table with status `backlog`.

### 2. Approve
- **Action:** Admin reviews `ideas` and sets status to `approved`.

### 3. Schedule
- **Command:** `npm run schedule -- --weeks 1`
- **Action:** Assigns next Monday's date to 10 ideas and sets status to `scheduled`.

### 4. Execute (Monday 9 AM UTC)
- **Action:** `jobs/weekly.js` runs.
- **Result:** Winner calculated, bits flipped to `published`, emails sent in batches.

## File Organization

### Backend (`backend/src/`)
- **`server.js`** - Entry point, cron scheduling
- **`routes/`** - API endpoints (ideas, votes, auth)
- **`services/`** - Core business logic (brevo, ai, newsletter)
- **`jobs/`** - Production cron jobs
- **`unit_tests/`** - Logic verification (Vitest)

### Frontend (`frontend/`)
- **`pages/`** - Next.js pages
- **`components/`** - UI components
- **`lib/auth.js`** - Auth context
- **`unit_tests/`** - React component & lib tests

## Recent Major Changes (Feb 6, 2026)
- ✅ **Testing**: Implemented comprehensive unit testing suite using Vitest (~100% logic coverage).
- ✅ **Cleanup**: Consolidated all test files into dedicated `unit_tests/` directories.
- ✅ **Refactoring**: Modularized backend routes and services for better maintainability.
- ✅ **Auth**: Enhanced `AuthModal` validation logic and user signup flows.
- ✅ **Architecture**: Hardened "Scheduled" state machine to prevent content leaks.
- ✅ **Email**: Fully migrated to Brevo Batch API and Contact Sync.

## Documentation Hierarchy
- **Tier 1 (Foundation):** This file - Master context
- **Tier 2 (Guides):** `docs/MASTER_WORKFLOW.md`, `docs/BREVO_GUIDE.md`
- **Tier 3 (Features):** `docs/AUTH_DOCUMENTATION.md`
- **Reference:** `README.md`
