# ZerosByKai - AI Context

## Project
AI platform for entrepreneurs — validated startup ideas scraped from Reddit, analyzed by Gemini.
Monorepo: `frontend/` (Next.js 14, Pages Router, Vercel) + `backend/` (Node.js/Express, Fly.io).
Database: Supabase (PostgreSQL + Auth). Email: Resend. AI: Google Gemini.

## Quick Reference
- **Dev:** `npm run dev` in `frontend/` (port 3000) and `backend/` (port 3001)
- **Build:** `npm run build` in `frontend/`
- **Structure:** See `docs/ai-context/project-structure.md` for full file tree
- **Docs:** See `docs/ai-context/docs-overview.md` for 3-tier doc system

## Code Standards
- JavaScript (no TypeScript). Async/await. Functional React components.
- ESLint for frontend linting. No test framework configured yet.
- Secrets in env vars only. Supabase RLS for data isolation.
- KISS, YAGNI, DRY. Prefer existing libraries over custom implementations.
- Keep files focused and under 350 lines. Split by responsibility.

## Key Patterns
- **Auth:** Supabase magic link + Google OAuth. `apiFetch()` in `frontend/lib/auth.js` handles Bearer tokens.
- **API:** Express routes at `/api/{ideas,votes,auth,admin}`. Two Supabase clients: `supabase` (RLS) and `supabaseAdmin` (service key).
- **Cron:** Sunday 10 AM UTC — `runRedditFlow()`. Monday 9 AM UTC — `autoPublishIdeas()` then `calculateWinner()` then `sendWeeklyDigest()`.
- **Badges:** Users who vote for the winning idea earn `kai_pick` badges. Tiers: bronze(1), silver(3), gold(6), diamond(11).

## Post-Task
1. Frontend: `npm run build` passes.
2. Backend: Verify API endpoints work.
3. Update CONTEXT.md files if architecture changed.
