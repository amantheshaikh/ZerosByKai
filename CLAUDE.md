# ZerosByKai - AI Context (Tier 1: Foundation)

## Project Overview
AI-powered weekly startup ideas platform. Scrapes Reddit for real problems, analyzes with Gemini AI, delivers 10 validated ideas every Monday.

**Monorepo:** `frontend/` (Next.js 14, Pages Router, Vercel) + `backend/` (Node.js/Express, Fly.io)  
**Database:** Supabase (PostgreSQL + Auth)  
**Email:** Resend - **AI:** Google Gemini (Gemini 3 Preview for main jobs)
  

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

### Cron Jobs
- **Sunday 10 AM UTC:** Reddit scraping → Gemini 3 Preview → 10 ideas (status: `backlog`)
- **Monday 9 AM UTC:** 
  1. Auto-publish backlog ideas
  2. Calculate last week's winner (set `is_winner: true` and `status: 'archived'`)
  3. Send weekly digest (Base64 encoded bodies, CRLF protected, RFC 2047 subjects)

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

### Sunday (10 AM UTC)
1. **Reddit Scraping** (`jobs/reddit_scraper.js`)
   - Scrapes 17+ startup-related subreddits
   - Anti-detection measures (rotating user agents, delays)
   - Collects ~150 posts

2. **AI Analysis** (Gemini 3 Preview)
   - Processes posts in batches
   - Generates 10 startup ideas with up to 5 flexible tags
   - Uses `gemini-3-flash-preview` as primary, `gemini-3-pro-preview` as fallback
   - Saves as `status: 'backlog'`

### Monday (9 AM UTC)
1. **Auto-Publish** (`jobs/weekly.js`)
   - Moves backlog ideas to published
   - Creates weekly batch record

2. **Calculate Winner** (`jobs/weekly.js`)
   - Finds last week's most-voted idea
   - Awards badges to users who voted for it

3. **Send Digest** (`jobs/weekly.js`)
   - Sends weekly email to all subscribers
   - Includes auto-login tokens for authenticated users
   - Shows last week's winner

## File Organization

### Backend (`backend/src/`)
- **`server.js`** - Entry point, cron scheduling, middleware
- **`routes/`** - API endpoints (ideas, votes, auth)
- **`jobs/`** - Production cron jobs (reddit_scraper, weekly)
- **`workflows/`** - Testing/simulation scripts
- **`emails/templates/`** - Email templates (weekly-digest, welcome, magic-link)
- **`emails/templates/shared.js`** - Shared email components
- **`utils/`** - Utilities (emailToken.js for JWT)
- **`config/`** - Supabase client configuration

### Frontend (`frontend/`)
- **`pages/`** - Next.js pages (index, profile, story, etc.)
- **`components/`** - Reusable UI components
- **`lib/auth.js`** - Auth context provider
- **`styles/globals.css`** - Comic design system

## Environment Variables

### Backend
```bash
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
RESEND_API_KEY
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

## Recent Major Changes (Feb 2, 2026)
- ✅ Email token auto-login implemented
- ✅ Email templates separated into individual files
- ✅ Reddit scraping enhanced with anti-detection
- ✅ Gemini 3 Preview models integrated (Flash/Pro)
- ✅ **Tagging Refactor**: Flexible array-based tags (max 5) replacing region/category
- ✅ **Hardening**: CRLF protection, RFC 2047 subject encoding, Base64 email bodies
- ✅ **Database**: Schema standardized, RLS updated for `winner` status
- ✅ **Maintenance**: PII masked in logs, UTC standardized dates, ADMIN_CONFIG in env
- ✅ **Status Model**: `backlog` -> `published` -> `archived` (with separate `is_winner` flag)

## Documentation Hierarchy
- **Tier 1 (Foundation):** This file - Master context
- **Tier 2 (Components):** `backend/CONTEXT.md`, `frontend/CONTEXT.md`
- **Tier 3 (Features):** Feature-specific docs as needed
- **Reference:** `PROJECT_DOCUMENTATION.md`, `AUTH_DOCUMENTATION.md`
