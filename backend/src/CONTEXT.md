# Backend Source Context (Tier 3)

*Core backend logic: routes, jobs, emails, workflows.*

## Routes (`routes/`)
- **auth.js** — Signup, subscribe, unsubscribe, magic link, Google OAuth.
- **ideas.js** — Ideas CRUD, leaderboard (top 3 with vote counts).
- **votes.js** — Cast/change vote (`POST /`), current vote (`GET /user`), last week result (`GET /last-week`), badges (`GET /badges`).
- **admin.js** — Admin operations.

## Jobs (`jobs/weekly.js`)
- **`calculateWinner()`** — Determines last week's winning idea (highest votes), upserts `weekly_batches`, awards `kai_pick` badges to winning voters.
- **`sendWeeklyDigest()`** — Sends digest email to all subscribers (auth users + newsletter). Merges/dedupes lists, respects unsubscribe suppression. Uses Resend API.
- Cron: Both run sequentially in a single Monday 9 AM UTC job.

## Emails (`emails/templates.js`)
- **`generateWeeklyDigestEmail()`** — Weekly digest with ideas, winner section (CTA to profile), vote buttons.
- **`generateWelcomeEmail()`** — New subscriber welcome.
- **`generateMagicLinkEmail()`** — Login magic link.

## Workflows (`workflows/`)
- **`daily_startup_ideas.js`** — Reddit scraping + Gemini AI analysis pipeline.

## Implementation Patterns
- Async/await for all I/O.
- Supabase Admin client for server-side DB/auth operations.
- Environment variables for all config (`process.env`).
