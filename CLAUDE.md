# ZerosByKai - AI Context (Tier 1: Foundation)

## Project Overview
AI-powered weekly startup ideas platform. Scrapes Reddit, Hacker News, Indie Hackers, and X for real problems, analyzes with Gemini AI, delivers 10 validated ideas every Monday.

**Monorepo:** `frontend/` (Next.js 14, Pages Router, Vercel) + `backend/` (Node.js/Express, Fly.io)  
**Database:** Supabase (PostgreSQL + Auth)  
**Email:** Brevo (Transactional + Contacts)  
**AI:** Google Gemini (Flash 2.0 / 1.5)

## Quick Reference
- **Dev:** `npm run dev` in `frontend/` (port 3000) and `backend/` (port 3001)
- **Test:** `npm test` in either directory (Vitest - isolation enabled, optimized for speed)
- **Mocks:** Use centralized mocks; `auth.test.jsx` uses surgical `vi.mock` for sub-second execution
- **Build:** `npm run build` in `frontend/`
- **Structure:** See `docs/ai-context/project-structure.md` for full file tree
- **Docs:** See `docs/README.md` for 3-tier indexing and routing
- **Main Docs:** See `README.md` for comprehensive guide

## Code Standards
- **Language:** JavaScript (no TypeScript). Async/await. Functional React components.
- **Testing:** Vitest for unit/integration tests. Supertest for API testing. Wrap state triggers in `act()`.
- **Security:** Secrets in env vars only. Supabase RLS for data isolation. Added open redirect protection in auth callbacks.
- **Principles:** KISS, YAGNI, DRY. Prefer existing libraries over custom implementations.
- **File Size:** Keep files focused and under 350 lines. Split by responsibility.
- **Documentation:** Update `docs/` or `README.md` when architecture changes.

## Key Patterns

### Authentication
- **Methods:** Supabase magic link + Google OAuth + Email token auto-login
- **Frontend:** `AuthProvider` in `frontend/lib/auth.js` handles all auth flows; ensures listeners persist across React StrictMode remounts.
- **Backend:** JWT tokens for email auto-login, Supabase session for authenticated requests
- **API:** `apiFetch()` helper automatically injects Bearer tokens
- **Flows:** 
  - Newsletter-only subscription (no account)
  - Magic link sign-in/sign-up
  - Google OAuth
  - Email token auto-login (from weekly digest)

### API Architecture
- **Routes:** Express routes at `/api/{ideas,votes,auth,webhooks,emails}`
- **Clients:** Two Supabase clients:
  - `supabase` (RLS-enabled for user operations)
  - `supabaseAdmin` (service key for admin operations)
- **Auth:** Bearer token validation via Supabase `getUser()`.
- **Atomics:** Vote casting uses database-level triggers to ensure atomicity and prevent race conditions.
- **Caching:** `getVotingWeek()` cached in-memory (60s TTL); read endpoints use `Cache-Control` headers
- **Rate Limiting:** Global limiter + per-route limiters on auth/unsubscribe endpoints

### Automation & Jobs
- **Generate:** Multi-source scraping → Gemini AI → `backlog` ideas (`npm run scrape:local`)
- **Approve:** Admin reviews `backlog` → marks as `approved` in Supabase
- **Schedule:** Select 10 oldest approved ideas → Lock for next week (`npm run schedule`)
- **Monday (GitHub Actions, `.github/workflows/weekly-digest.yml`):**
    1. Calculate last week's winner & award badges (order prioritized to prevent flag race)
    2. Publish *scheduled* batch (`scheduled` -> `published`)
    3. Send digest via Brevo Template API (params only, no server-side HTML)

### Email System
- **Provider:** Brevo (Transactional + Contacts Sync)
- **Weekly Digest:** Brevo-hosted template (`BREVO_WEEKLY_DIGEST_TEMPLATE_ID`), data sent as params; uses stable IDs for idempotency.
- **Welcome / Magic Link:** Server-generated HTML in `backend/src/emails/templates/`
- **Auto-Login:** JWT tokens in email URLs for seamless voting
- **Trigger:** GitHub Actions cron (Monday 14:00 UTC / 9 AM EST)

## Weekly Workflow

### 1. Generate
- **Command:** `npm run scrape:local`
- **Result:** Populates `ideas` table with status `backlog`.

### 2. Approve
- **Action:** Admin reviews `ideas` and sets status to `approved`.

### 3. Schedule
- **Command:** `npm run schedule -- --weeks 1`
- **Action:** Assigns next Monday's date to 10 ideas and sets status to `scheduled`.

### 4. Execute (Monday, GitHub Actions)
- **Trigger:** `.github/workflows/weekly-digest.yml` runs `node src/jobs/weekly.js --scheduled`
- **Result:** Winner calculated, ideas flipped to `published`, digest sent via Brevo template.

## File Organization

### Backend (`backend/src/`)
- **`server.js`** - Entry point, health check cron (backlog only)
- **`routes/`** - API endpoints (ideas, votes, auth)
- **`services/`** - Core business logic (brevo, ai, newsletter)
- **`jobs/`** - Production cron jobs
- **`unit_tests/`** - Logic verification (Vitest)

### Frontend (`frontend/`)
- **`pages/`** - Next.js pages
- **`components/`** - UI components
- **`lib/auth.js`** - Auth context
- **`unit_tests/`** - React component & lib tests

## Recent Major Changes (Mar 16, 2026)

### Reliability & Security (Mar 16)
- ✅ **Test Suite Overhaul**: Fixed 368 tests across frontend/backend. Optimized `auth.test.jsx` from 20s to <1s.
- ✅ **Auth Resilience**: Resolved session refresh gap on mount and StrictMode listener drops in `AuthProvider`.
- ✅ **Security**: Fixed open redirect vulnerability in auth callback; added JWT email token secret guard.
- ✅ **Database Atomics**: Implemented database-level triggers for vote casting; reordered winner calculation flags to prevent state races.
- ✅ **Infrastructure**: Migrated GitHub Actions to `pnpm` for faster, more reliable CI builds.
- ✅ **Bug Fixes**: Resolved duplicate email dispatching by stabilizing Brevo idempotency keys.

### UI & Performance (Mar 16)
- ✅ **AI Roasting**: Updated roast model to `gemini-3.1-flash-lite-preview` for better quality/speed.
- ✅ **Footer**: Integrated Product Hunt badge with a responsive flex layout.
- ✅ **Roast Page**: prioritized form/results in mobile-first layout.

### Previous (Feb 14)
- ✅ **Performance**: Parallelized DB calls; implemented `Cache-Control` headers for all read endpoints.
- ✅ **Security**: Updated `verify-email-token` to use `generateLink` + `verifyOtp` for robust session creation.
- ✅ **Auth**: Enforced name entry only for new users; removed redundant name field from subscribe modal.
- ✅ **Features**: Launched **Kai's Toolbox** (`/tools`) with dynamic logo fetching via Clearbit API.
- ✅ **Cleanup**: Removed dead endpoints and unused services across the backend.

### Previous (Feb 11)
- ✅ **Security**: Secured Brevo webhook auth; added rate limiter to `POST /unsubscribe`.
- ✅ **Cache**: In-memory cache for `getVotingWeek()` (60s TTL).


### Previous (Feb 9)
- ✅ **Security**: Unsubscribe links now use backend-generated secure tokens to prevent 401 errors.
- ✅ **Frontend Redesign**: New Hero section with Kai's image, overlay text, and scroll-triggered animations.
- ✅ **Mirror Link**: Mirror links in email digests now point to a dedicated frontend route instead of backend endpoint.
- ✅ **Cleanup**: Removed legacy server-side HTML generation for weekly digests; fully reliant on Brevo templates.
- ✅ **RFC 8058**: Per-subscriber `List-Unsubscribe` + `List-Unsubscribe-Post` headers for one-click unsubscribe.
- ✅ **Performance**: Implemented `vote_count` column on `ideas` table for O(1) leaderboard queries.
- ✅ **Scaling**: Added ISR (`getStaticProps`) to Landing Page (`index.jsx`) with 60s revalidation.
- ✅ **Subject Override**: Email subject from Supabase `weekly_batches.subject_line` passed via Brevo API.

## Documentation Hierarchy
- **Tier 1 (Foundation):** `CLAUDE.md` (Master), `docs/README.md` (Routing Index), `docs/ai-context/architecture.md` (Design/Infra)
- **Tier 2 (Component):** `backend/CONTEXT.md`, `frontend/CONTEXT.md`, `docs/MASTER_WORKFLOW.md`
- **Tier 3 (Features):** `docs/AUTH_DOCUMENTATION.md`
- **Reference:** `README.md`
