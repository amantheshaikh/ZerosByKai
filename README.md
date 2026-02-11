# ZerosByKai - Project Documentation

> **Purpose**: The single source of truth for the ZerosByKai project, including deployment, testing, and business logic.

---

## 🎯 Project Overview

**ZerosByKai** is a weekly startup ideas platform.
- **Concept**: Kai (Analyst persona) scrapes the internet for \"real problems\" people complain about.
- **Value**: "Finding the right 0" in a world of easy 0-to-1 building.
- **User Flow**: Browse 10 ideas → Pick 1 winner → Earn badges if your pick wins.

---

## 🚀 Deployment (Quick Start)

### Backend (Fly.io)
1. **Deploy**:
   ```bash
   cd backend
   fly deploy
   ```
2. **Secrets**:
   ```bash
   fly secrets set \
     SUPABASE_URL="https://xxx.supabase.co" \
     SUPABASE_ANON_KEY="xxx" \
     SUPABASE_SERVICE_KEY="xxx" \
     BREVO_API_KEY="xkeysib-..." \
     GEMINI_API_KEY="xxx" \
     JWT_SECRET="xxx" \
     FRONTEND_URL="https://zerosbykai.com" \
     NODE_ENV="production" \
     PORT=3001
   ```
3. **Logs**: `fly logs -a zerosbykai-api-prod`

### Frontend (Vercel)
1. **Deploy**:
   ```bash
   cd frontend
   vercel --prod
   ```
2. **Environment Variables** (Vercel Dashboard):
   - `NEXT_PUBLIC_API_URL`: `https://zerosbykai-api-prod.fly.dev`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://xxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `xxx`
   - `NEXT_PUBLIC_SITE_URL`: `https://zerosbykai.com`

### DNS (Spaceship)
- **A Record**: `@` → `76.76.21.21`
- **CNAME**: `www` → `cname.vercel-dns.com`

### Email Forwarding (Cloudflare)
- **kai@zerosbykai.com** → **amantheshaikh@gmail.com**
- Use Cloudflare Email Routing (free, unlimited forwards)

---

## 🧪 Testing & Verification

### 1. Run Unit Tests (Recommended)
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### 2. Run All Scrapers (Backlog Fill)
```bash
cd backend
npm run scrape:local # Runs Reddit, HN, IH, X
```

### 3. Test Monday Workflow (Simulated)
```bash
cd backend
node src/workflows/simulate_monday_workflow.js
```

### 4. Verify Flows
- **Newsletter Signup**: Subscribe via landing page. Check for welcome email and Brevo sync.
- **Account Creation**: Sign up with email. Check for magic link.
- **Auto-Login**: Click link in weekly digest email. Should auto-login via JWT.
- **Vote**: Click "I'D BUILD THIS" (requires login). Checks `votes` table.

---

## 📁 Project Structure

```
zerosbykai/
├── backend/                          # Express API (Fly.io)
│   ├── src/
│   │   ├── server.js                 # Entry point + health crons
│   │   ├── config/                   # env, supabase, brevo
│   │   ├── services/                 # Business logic (AI, Brevo, Newsletter)
│   │   ├── routes/                   # API routes (Auth, Ideas, Votes, Webhooks)
│   │   ├── jobs/                     # Production cron jobs
│   │   │   ├── scrapers/             # Multi-source scrapers (Reddit, HN, IH, X)
│   │   │   ├── schedule_newsletter.js # Batch scheduling
│   │   │   └── weekly.js             # Monday publishing & delivery
│   │   ├── emails/                   # Server-generated templates
│   │   └── utils/                    # JWT, date, masking helpers
│   ├── unit_tests/                   # Vitest logic suite
│   └── migrations/                   # SQL migration tracking
│
├── frontend/                         # Next.js 14 (Vercel)
│   ├── pages/                        # Routes (index, story, tools, profile, archive, unsubscribe)
│   ├── components/                   # UI (AuthModal, Carousel, Leaderboard)
│   ├── lib/                          # Auth context, API fetching, Stash data
│   ├── unit_tests/                   # React Testing Library suite
│   ├── unit_tests/__mocks__/         # Centralized frontend mocks
│   └── public/                       # Assets & SEO files
│
├── docs/                             # Tiered Documentation
│   ├── MASTER_WORKFLOW.md            # Lifecycle guide
│   ├── BREVO_GUIDE.md                # Email/Contact automation
│   ├── AUTH_DOCUMENTATION.md         # Auth system technicals
│   └── ai-context/                   # AI-specific context
│
└── .github/workflows/                # CI/CD & Weekly Cron
```

---

## 🔑 Core Business Rules

### Voting
- **One Vote per Week**: Users can change their vote, but only one counts per week.
- **Authenticated Users Only**: Must sign in to vote.

### Mission Designations
- **Onlooker**: 0-2 winning picks
- **Field Agent**: 3-6 winning picks
- **Lead Analyst**: 7-11 winning picks
- **Head of Intelligence**: 12-19 winning picks
- **Unicorn Hunter**: 20+ winning picks

### Weekly Cycle
- **Sunday**: Multi-source scraping → ideas generated (status: `backlog`)
- **Monday (GitHub Actions, 14:00 UTC)**:
  1. Calculate last week's winner & award badges
  2. Publish scheduled ideas (`scheduled` → `published`)
  3. Send weekly digest via Brevo template (with auto-login tokens)

---

## 🔐 Authentication Flows

See [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md) for comprehensive guide.

### Quick Overview:
1. **Email Token Auto-Login** - Users click links in weekly digest emails
2. **Magic Link** - Passwordless sign-in/sign-up
3. **Google OAuth** - Sign in with Google
4. **Newsletter-Only** - Subscribe without creating account

---

## 📧 Email System

### Email Provider: Brevo (formerly Sendinblue)
- **From**: `kai@zerosbykai.com`
- **Reply-To**: `kai@zerosbykai.com`

### Email Types:
1. **Weekly Digest** - Sent every Monday via Brevo template (params-only, no server-side HTML)
2. **Welcome Email** - Server-generated HTML, sent on signup
3. **Magic Link** - Server-generated HTML, sent for passwordless auth

### Auto-Login Feature:
- Authenticated users receive weekly digest with `?token=<jwt>` in URL
- Clicking link automatically signs them in
- Token expires after 7 days

---

## 🤖 AI & Scraping

### Multi-source Scraping
- **Frequency**: Sunday 10 AM UTC (via GitHub Actions)
- **Sources**: Reddit (17+ subreddits), Hacker News, Indie Hackers, X
- **Anti-Detection**: Rotating user agents, randomized delays, exponential backoff
- **Output**: ~300+ posts scraped from multiple platforms

### AI Idea Generation (Google Gemini)
- **Model**: `gemini-2.0-flash` (Primary) with fallback to `gemini-flash-latest`
- **Input**: Scraped content from multiple sources
- **Output**: 10 high-quality startup ideas
- **Retry Logic**: Automated model fallback and synthesis to ensure quality output.

---

## 🎨 Design System

- **Theme**: Comic Book / Pop Art
- **Fonts**: 
  - 'Bangers' (Headers)
  - 'Courier Prime' (Body)
- **Colors**: 
  - Yellow: `#FCD933`
  - Black: `#000`
  - Rose: `#BE123C`
- **Components**: Thick borders (3-4px), Halftone patterns, offset shadows

---

## 🔧 Environment Variables

### Backend (.env)
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Email
BREVO_API_KEY=xkeysib-...

# AI
GEMINI_API_KEY=xxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT for email tokens
JWT_SECRET=xxx
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 📊 Database Schema

### Core Tables
- **ideas** - Startup ideas (pending/published)
- **votes** - User votes (one per week)
- **user_badges** - Badges earned by users
- **weekly_batches** - Weekly metadata (winner, stats)
- **subscribers** - Email subscribers (with/without auth)

### Supabase Auth
- **auth.users** - Authenticated users (managed by Supabase)

---

## 🚨 Troubleshooting

### Backend won't start
- Check `.env` file exists and has all required variables
- Verify Supabase keys are correct
- Check port 3001 is not in use

### Emails not sending
- Verify `BREVO_API_KEY` is set
- Check Brevo dashboard for logs (Webhooks will handle bounces)
- Ensure `kai@zerosbykai.com` is verified in Brevo

### Reddit scraping fails
- Check `GEMINI_API_KEY` is valid
- Verify GitHub Actions secrets are set
- Check for rate limiting (429 errors)

### Auto-login not working
- Verify `JWT_SECRET` is set in backend
- Check token hasn't expired (7 days)
- Ensure frontend can reach backend API

---

## 📝 Recent Changes (2026-02-12)

### Routes Optimization & Refinement (Feb 12)
- ✅ **Performance**: Parallelized DB calls; implemented `Cache-Control` headers for all read endpoints.
- ✅ **Security**: Updated `verify-email-token` to use `generateLink` + `verifyOtp` for robust session creation.
- ✅ **Auth**: Enforced name entry only for new users; removed redundant name field from subscribe modal.
- ✅ **Features**: Launched **Kai's Toolbox** (`/tools`) with dynamic logo fetching via Clearbit API.
- ✅ **Tests**: Refactored frontend test suite with centralized utilities and mocks for faster, isolated testing.
- ✅ **Cleanup**: Removed dead endpoints and unused services across the API.


### Previous (Feb 11)
- ✅ **Security**: Secured Brevo webhook auth; added rate limiter to `POST /unsubscribe`.
- ✅ **Cache**: In-memory cache for `getVotingWeek()` (60s TTL).


### Previous (Feb 9)
- ✅ **Security**: Unsubscribe links use backend-generated secure tokens. RFC 8058 one-click unsubscribe.
- ✅ **Performance**: `vote_count` column for O(1) leaderboard. ISR on landing page (60s revalidation).
- ✅ **Email**: Subject override from `weekly_batches.subject_line`. Mirror links via dedicated frontend routes.
- ✅ **Frontend**: Hero redesign, scroll animations, comic-panel design system.
- ✅ **Testing**: Full Vitest suite for backend and frontend.

---

**Last Updated**: 2026-02-11
