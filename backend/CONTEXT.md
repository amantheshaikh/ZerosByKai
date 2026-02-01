# Backend Context (Tier 2: Component)

> **Note**: This is component-specific context. See root **CLAUDE.md** for master project context and coding standards.

## Purpose
The backend is a Node.js/Express API that handles:
- User authentication (magic link, OAuth, email tokens)
- Idea management (CRUD, publishing, voting)
- Weekly workflows (Reddit scraping, AI analysis, winner calculation)
- Email delivery (weekly digest, welcome, magic link)

## Current Status: Production ✅
Fully operational with automated weekly workflows.

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** Supabase (PostgreSQL + Auth)
- **AI:** Google Gemini (`gemini-2.0-flash-preview`, fallback to `gemini-2.5-flash`)
- **Email:** Resend
- **Deployment:** Fly.io
- **Cron:** node-cron

## Component Structure

### Core Files
```
backend/src/
├── server.js                     # Entry point, cron scheduling, middleware
├── config/
│   └── supabase.js               # Supabase client setup (RLS + Admin)
├── routes/                       # API endpoints
│   ├── ideas.js                  # GET /api/ideas (list, weekly, winner)
│   ├── votes.js                  # POST /api/votes, GET /api/votes/user
│   └── auth.js                   # Auth endpoints (subscribe, signup, verify, etc.)
├── jobs/                         # Production cron jobs
│   ├── reddit_scraper.js         # Sunday: Reddit → Gemini → 10 ideas
│   └── weekly.js                 # Monday: publish, winner, digest
├── workflows/                    # Testing/simulation scripts
│   ├── simulate_monday_workflow.js
│   ├── simulate_newsletter.js
│   ├── simulate_welcome.js
│   └── simulate_magic_link.js
├── emails/                       # Email templates
│   ├── templates.js              # Re-exports all templates
│   └── templates/
│       ├── shared.js             # Shared components & styles
│       ├── weekly-digest.js      # Weekly digest email
│       ├── welcome.js            # Welcome email
│       └── magic-link.js         # Magic link email
├── utils/
│   └── emailToken.js             # JWT token generation/verification
└── scripts/
    └── delete-user-by-email.sql  # User deletion script
```

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /api/ideas` - List all published ideas
- `GET /api/ideas/weekly` - Current week's ideas
- `GET /api/ideas/:id` - Single idea
- `GET /api/ideas/winner/:week` - Week's winner

### Auth Endpoints
- `POST /api/auth/subscribe` - Newsletter-only subscription (no account)
- `POST /api/auth/signup` - Send magic link (creates account)
- `POST /api/auth/verify-email-token` - Verify email token for auto-login
- `POST /api/auth/post-login` - Post-login hook (welcome email, sync)
- `GET /api/auth/user` - Get current user
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/unsubscribe` - Unsubscribe from emails

### Voting Endpoints (Auth Required)
- `POST /api/votes` - Cast vote (one per week)
- `GET /api/votes/user` - Get user's current vote
- `GET /api/votes/badges` - Get user's badges

## Cron Schedule

### Sunday 10 AM UTC
**Reddit Scraping** (`jobs/reddit_scraper.js`)
- Scrapes 17+ subreddits (r/Business_Ideas, r/SaaS, etc.)
- Anti-detection: rotating user agents, randomized delays
- Collects ~150 posts
- Processes with Gemini AI in batches
- Generates 10 startup ideas
- Saves as `status: 'pending'`
- Sends admin notification email

### Monday 9 AM UTC
**Weekly Workflow** (`jobs/weekly.js`)

1. **Auto-Publish Ideas** (`autoPublishIdeas()`)
   - Moves pending ideas to published
   - Creates weekly batch record

2. **Calculate Winner** (`calculateWinner()`)
   - Finds last week's most-voted idea
   - Awards badges to users who voted for it
   - Updates user_badges table

3. **Send Weekly Digest** (`sendWeeklyDigest()`)
   - Sends email to all active subscribers
   - Includes auto-login tokens for authenticated users
   - Shows this week's ideas + last week's winner

## Authentication Flows

### 1. Newsletter-Only Subscription
```javascript
POST /api/auth/subscribe
{ email, name }
→ Creates subscriber record (no auth user)
→ Sends welcome email
→ User receives weekly digests but cannot vote
```

### 2. Magic Link Sign-Up
```javascript
POST /api/auth/signup
{ email, name }
→ Creates auth user + subscriber record
→ Sends magic link email
→ User clicks link → /auth/callback → session created
→ Post-login hook runs (welcome email if new)
```

### 3. Email Token Auto-Login
```javascript
User clicks link in weekly digest with ?token=<jwt>
→ Frontend calls POST /api/auth/verify-email-token
→ Backend verifies JWT, creates session
→ User is automatically signed in
```

### 4. Post-Login Hook
```javascript
POST /api/auth/post-login (automatic)
→ Syncs subscriber record with auth user
→ Sends welcome email if new user
→ Marks user as welcomed
```

## Email System

### Templates
All templates use shared components from `emails/templates/shared.js`:
- `emailStyles` - Common CSS styles
- `generateEmailHeader()` - Reusable header
- `generateEmailFooter()` - Reusable footer
- `generateEmailWrapper()` - HTML wrapper

### Email Types
1. **Weekly Digest** - Sent every Monday to all subscribers
2. **Welcome Email** - Sent to new subscribers
3. **Magic Link** - Sent for passwordless authentication

### Auto-Login Feature
- Authenticated users receive weekly digest with `?token=<jwt>` in URLs
- Token expires after 7 days
- Single-use tokens (verified via backend)

## AI Integration

### Reddit Scraping
- **Subreddits:** 17+ startup-related communities
- **Anti-Detection:**
  - Rotating user agents (5 different fingerprints)
  - Randomized delays (2-5 seconds)
  - Exponential backoff on rate limits
  - Staggered request starts

### Gemini AI
- **Model:** `gemini-2.0-flash-preview` (fallback: `gemini-2.5-flash`)
- **Batch Processing:** Processes posts in batches of 75
- **Retry Logic:** 
  - Per-batch retries (up to 3 attempts)
  - Per-workflow retries (ensures 10 ideas)
  - Dynamic batch sizing based on remaining needs
- **Output:** 10 validated startup ideas with structured data

## Database Schema

### Key Tables
- **ideas** - Startup ideas (pending/published)
- **votes** - User votes (one per week)
- **user_badges** - Badges earned by users
- **weekly_batches** - Weekly metadata (winner, stats)
- **subscribers** - Email subscribers (with/without auth)

### Supabase Clients
```javascript
// RLS-enabled client (for user operations)
import { supabase } from './config/supabase.js';

// Admin client (bypasses RLS)
import { supabaseAdmin } from './config/supabase.js';
```

## Testing & Simulation

### Test Scripts
```bash
# Test Reddit scraping
node src/jobs/reddit_scraper.js

# Test Monday workflow (end-to-end)
node src/workflows/simulate_monday_workflow.js

# Test email templates
node src/workflows/simulate_newsletter.js
node src/workflows/simulate_welcome.js
node src/workflows/simulate_magic_link.js
```

## Environment Variables
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Email
RESEND_API_KEY=re_xxx

# AI
GEMINI_API_KEY=xxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT for email tokens
JWT_SECRET=xxx
```

## Deployment

### Fly.io
```bash
# Deploy
fly deploy

# View logs
fly logs

# Set secrets
fly secrets set SUPABASE_URL="xxx"
```

## Critical Implementation Details

### Two Supabase Clients
- **`supabase`** - RLS-enabled, for user-scoped operations
- **`supabaseAdmin`** - Service key, bypasses RLS for admin operations

### Error Handling
- Non-critical errors (email sending) fail silently with logging
- Critical errors (database operations) throw and return 500

### Security
- JWT tokens for email auto-login (7-day expiration)
- Supabase RLS for data isolation
- CORS configured for frontend domains only
- No admin password (removed, use Supabase dashboard)

## Recent Changes (Feb 2, 2026)
- ✅ Moved `workflows/daily_startup_ideas.js` → `jobs/reddit_scraper.js`
- ✅ Removed admin routes (use Supabase dashboard)
- ✅ Separated email templates into individual files
- ✅ Added email token auto-login
- ✅ Enhanced Reddit scraping anti-detection
- ✅ Improved Gemini retry logic
- ✅ Added comprehensive testing scripts

## Next Steps
- Consider adding rate limiting on auth endpoints
- Implement token revocation in database
- Add analytics for email click-throughs
- A/B test auto-login feature effectiveness
