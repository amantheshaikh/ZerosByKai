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
├── backend/                          # Express API
│   ├── src/
│   │   ├── server.js                 # Entry point + Cron jobs
│   │   ├── config/                   # Supabase, environment
│   │   ├── services/                 # Business logic (Brevo, AI, Newsletter)
│   │   ├── routes/                   # API routes (Auth, Ideas, Votes)
│   │   ├── jobs/                     # Production cron jobs
│   │   │   ├── scrapers/             # Scrapers (Reddit, HN, IH, X)
│   │   │   └── weekly.js             # Monday: publish, winner, digest
│   │   ├── emails/                   # Transactional templates
│   │   └── utils/                    # Utilities (JWT Tokens, etc)
│   ├── unit_tests/                   # Vitest suite (Services, Routes, Jobs)
│   └── fly.toml                      # Deployment config
│
├── frontend/                         # Next.js 14
│   ├── pages/                        # Routes (index, profile, archive, story)
│   ├── components/                   # UI Components (AuthModal, Cards, etc)
│   ├── lib/                          # Auth context, API helpers
│   ├── unit_tests/                   # React testing library suite
│   └── public/                       # Static assets
│
├── docs/                             # Deep-dive guides
│   ├── MASTER_WORKFLOW.md            # Newsletter lifecycle
│   ├── BREVO_GUIDE.md                # Email/Contact automation
│   └── AUTH_DOCUMENTATION.md         # Auth system technicals
│
└── .github/workflows/                # CI/CD & Scraper crons
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
- **Model**: `gemini-3-flash-preview` (with `gemini-2.5-flash` fallback)
- **Input**: Scraped Reddit posts
- **Output**: 10 startup ideas
- **Retry Logic**: Up to 3 workflow retries to ensure 10 ideas

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

## 📝 Recent Changes (2026-02-06)

### System Reliability & Testing
- ✅ **Full Test Suite**: Implemented Vitest suite for both Backend and Frontend.
- ✅ **High Coverage**: Achieved near 100% logic coverage for services, routes, and core jobs.
- ✅ **Test Consolidation**: Moved all unit tests to dedicated `unit_tests/` directories.
- ✅ **Refactoring**: Modularized `auth.js`, `ideas.js`, and `votes.js` into clean service/route patterns.

### Authentication & UI
- ✅ **AuthModal Refinement**: Enhanced email and name validation for better UX.
- ✅ **Signup Logic**: Improved handling of existing vs new subscribers during magic link flows.
- ✅ **Security**: Hardened JWT email token verification and rate limiting.

### Infrastructure (Feb 4, 2026)
- ✅ **Architecture**: Extracted planning logic to `src/services/newsletterService.js`.
- ✅ **State Machine**: `backlog` -> `approved` -> `scheduled` (hidden) -> `published` (live).
- ✅ **Efficiency**: Brevo Batch API (50 emails/req) for high-volume delivery.

---

**Last Updated**: 2026-02-06
