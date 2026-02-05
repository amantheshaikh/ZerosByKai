# ZerosByKai - AI Context (Tier 1: Foundation)

## Project Overview
AI-powered weekly startup ideas platform. Scrapes Reddit for real problems, analyzes with Gemini AI, delivers 10 validated ideas every Monday.

**Monorepo:** `frontend/` (Next.js 14, Pages Router, Vercel) + `backend/` (Node.js/Express, Fly.io)  
**Database:** Supabase (PostgreSQL + Auth)  
**Email:** Brevo (Transactional + Contacts) - **AI:** Google Gemini (Gemini 3 Preview for main jobs)
  

## Quick Reference
- **Dev:** `npm run dev` in `frontend/` (port 3000) and `backend/` (port 3001)
- **Build:** `npm run build` in `frontend/`
- **Structure:** See `docs/ai-context/project-structure.md` for full file tree
- **Docs:** See `docs/ai-context/docs-overview.md` for 3-tier doc system
- **Main Docs:** See `PROJECT_DOCUMENTATION.md` for comprehensive guide

## Code Standards
- **Language:** JavaScript (no TypeScript). Async/await. Functional React components.
- **Linting:** ESLint for frontend. No test framework configured yet.
- **Security:** Secrets in env vars only. Supabase RLS for data isolation.
- **Principles:** KISS, YAGNI, DRY. Prefer existing libraries over custom implementations.
- **File Size:** Keep files focused and under 350 lines. Split by responsibility.
- **Documentation:** Update CONTEXT.md files when architecture changes.

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
- **Manual Scraping:** Multi-source scraping → Gemini AI → `backlog` ideas (run locally/manually)
- **Manual Approval:** Admin reviews `backlog` → marks as `approved` in Supabase
- **Manual Scheduling:** Select 10 oldest approved ideas → Lock for next week (`npm run schedule`)
- **Wed/Fri/Sun 9 AM UTC:** Schedule Health check (`backlog_check.js`) - Alerts if next week is not scheduled
- **Monday 9 AM UTC (Automated):** 
    1. Calculate last week's winner
    2. Send *scheduled* digest (Brevo) to all subscribers

### Mission Designations
- **Onlooker**: 0-2 winning picks
- **Field Agent**: 3-6 winning picks
- **Lead Analyst**: 7-11 winning picks
- **Head of Intelligence**: 12-19 winning picks
- **Unicorn Hunter**: 20+ winning picks

### Email System
- **Templates:** Separated into individual files in `backend/src/emails/templates/`
- **Shared Components:** Common styles and components in `shared.js`
- **Auto-Login:** Authenticated users get JWT tokens in email URLs for seamless voting

## Weekly Workflow

### 1. Generate (Any Day)
- **Command:** `npm run scrape:local`
- **Action:** Scrapes Reddit/HN/IH, uses Gemini to generate ideas.
- **Result:** Populates `ideas` table with status `backlog`.

### 2. Approve (Any Day)
- **Action:** Admin reviews `ideas` table in Supabase.
- **Result:** Changes status of good ideas from `backlog` to `approved`.

### 3. Schedule (Before Monday)
- **Command:** `npm run schedule -- --weeks 1`
- **Action:** Picks 10 *oldest approved* ideas. Locks them for next Monday. Generates AI Subject Line.
- **Result:** Uses `newsletterService.js`. Ideas set to `scheduled` (Hidden). Batch Created.

### 4. Health Check (Wed/Fri/Sun)
- **Action:** Checks if next Monday is scheduled.
- **Result:** Sends email reminder if actionable work is needed.

### 5. Execute (Monday 9 AM UTC)
- **Action:** `jobs/weekly.js` runs.
- **Result:** 
    1. Flips ideas from `scheduled` -> `published` (Visible).
    2. Calculates previous winner. 
    3. Sends email digest (Batched 50/req).

## File Organization

### Backend (`backend/src/`)
- **`server.js`** - Entry point, cron scheduling, middleware
- **`routes/`** - API endpoints (ideas, votes, auth)
- **`jobs/`** - Production cron jobs (reddit_scraper, weekly)
- **`workflows/`** - Testing/simulation scripts
- **`emails/templates/`** - Email templates (weekly-digest, welcome, magic-link)
- **`emails/templates/shared.js`** - Shared email components
- **`services/`** - Core capabilities (brevoService, aiService, newsletterService)
- **`jobs/scrapers/`** - Scraper logic & Reddit API helper
- **`utils/`** - General utilities (emailToken.js, emailService.js)

### Frontend (`frontend/`)
- **`pages/`** - Next.js pages (index, profile, story, etc.)
- **`components/`** - Reusable UI components
- **`lib/auth.js`** - Auth context provider
- **`styles/globals.css`** - Comic design system

## Environment Variables

### Backend
```bash
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
BREVO_API_KEY
GEMINI_API_KEY
JWT_SECRET
FRONTEND_URL
PORT, NODE_ENV
ADMIN_EMAIL, ADMIN_NAME, BACKLOG_THRESHOLD
```

### Frontend
```bash
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

## Post-Task Checklist
1. **Frontend:** `npm run build` passes
2. **Backend:** Verify API endpoints work
3. **Documentation:** Update CONTEXT.md files if architecture changed
4. **Testing:** Run simulation scripts if email/workflow changes
5. **Deployment:** Update environment variables if needed

## Recent Major Changes (Feb 4, 2026)
- ✅ **Architecture**: Extracted planning logic to `src/services/newsletterService.js`.
- ✅ **State Machine**: `backlog` -> `approved` -> `scheduled` (hidden) -> `published` (live).
- ✅ **Security**: Explicit "Publish" step on Monday 9 AM prevents content leaks.
- ✅ **Efficiency**: Brevo Batch API (50 emails/req) for high-volume delivery.
- ✅ **Migration**: Updated DB schema to support `scheduled` status.
- ✅ **Reliability**: Separated "Planning" (Service) from "Execution" (Job).

## Documentation Hierarchy
- **Tier 1 (Foundation):** This file - Master context
- **Tier 2 (Components):** `backend/CONTEXT.md`, `frontend/CONTEXT.md`
- **Tier 3 (Features):** Feature-specific docs as needed
- **Reference:** `PROJECT_DOCUMENTATION.md`, `AUTH_DOCUMENTATION.md`
