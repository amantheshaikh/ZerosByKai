# Backend Context (Tier 2)

> **Note**: This is component-specific context. See root **CLAUDE.md** for master project context and coding standards.

## Purpose
The backend handles API requests, user authentication via Supabase, and core ingredient analysis logic using Google Gemini.

## Current Status: Active Development ✅
Basic server structure is up. API endpoints for analysis and profile management are being developed.

## Component-Specific Development Guidelines
- **Technology**: Node.js, Express/Fastify.
- **Architecture**: MVC-ish (Routes -> Controllers/Handlers -> Services).
- **Code Organization**: Feature-based or Layer-based within `src/`.
- **Integration**: Supabase for DB, Google GenAI for analysis.

## Key Component Structure

### Core Modules (`src/`)
- **server.js** — Entry point, cron scheduling, middleware.
- **routes/** — API route definitions (auth, ideas, votes, admin).
- **jobs/** — Weekly cron jobs (`calculateWinner`, `sendWeeklyDigest`).
- **emails/** — HTML email templates (digest, welcome, magic link).
- **workflows/** — AI analysis pipelines (Reddit + Gemini).
- **config/** — Supabase client configuration.

## Cron Schedule (server.js)
- **Monday 9 AM UTC** — `calculateWinner()` then `sendWeeklyDigest()` (sequential).
- **Monday 10 AM UTC** — `runRedditFlow()` (Reddit scraping + AI analysis).

## Critical Implementation Details
- **Gemini Integration**: Uses `google.genai` SDK.
- **Supabase Auth**: Backend validates JWT tokens; uses Admin client for server operations.
- **Email**: Resend API for transactional email delivery.
