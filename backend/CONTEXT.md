# Backend Context (Tier 2: Component)

> **Note**: This is component-specific context. See root **CLAUDE.md** for master project context and coding standards.

## Purpose
The backend is a Node.js/Express application that provides the API and background processing for ZerosByKai. It handles:
- Idea scraping and AI-powered generation
- User authentication and session management
- Email delivery via Brevo (Transactional & Batch)
- Voting logic and badge awarding
- Database orchestration via Supabase

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini (Flash 2.0 / 1.5)
- **Email:** Brevo
- **Hosting:** Fly.io

## Component Structure

### API Routes (`src/routes/`)
- `auth.js` - Sign up, subscribe, verification, unsubscribe, session management.
- `ideas.js` - Weekly batch retrieval, past editions, leaderboard data.
- `votes.js` - Casting votes, retrieving user's current/past votes, badges.
- `webhooks.js` - Handling Brevo webhook events (bounces, unsubscribes).

### Services (`src/services/`)
- `aiService.js` - Gemini AI prompts and analysis logic.
- `brevoService.js` - Contact sync and email delivery orchestration.
- `newsletterService.js` - Logic for scheduling batches and locking ideas.

### Jobs (`src/jobs/`)
- `scrapers/` - Multi-source data ingestion (Reddit, HN, IH, X).
- `weekly.js` - Monday workflow (winner calculation, publishing, digest delivery).
- `backlog_check.js` - Health monitoring for the newsletter schedule.

## Key Workflows

### 1. Automation Workflow (Monday)
The Monday workflow is triggered by GitHub Actions and executes `src/jobs/weekly.js`.
1. Calculates previous week's winner.
2. Awards badges to winning voters.
3. Publishes the next scheduled batch.
4. Sends the weekly digest via Brevo Batch API.

### 2. Authentication Flow (Email Token)
Secure auto-login via JWT tokens in emails:
1. User clicks link with `?token=<JWT>`.
2. Backend verifies JWT payload.
3. Backend generates a magic link and verifies it to create a Supabase session.

## Environment Variables
Required variables are documented in [backend/README.md](../backend/README.md).

## Recent Changes (Feb 11, 2026)
- ✅ **Security**: Fixed admin delete scalability (subscriber lookup), secured webhook auth.
- ✅ **Performance**: In-memory cache for `getVotingWeek()` (60s TTL), added `Cache-Control` headers.
- ✅ **Auth**: Optimized verify-token flow using magic link verification.
- ✅ **Cleanup**: Removed deprecated routes and unused service exports.

---

**Last Updated:** February 11, 2026
