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

### 1. Run All Scrapers (Backlog Fill)
```bash
cd backend
node src/jobs/scrapers/run_scrapers.js # Runs Reddit, HN, IH, X
```

### 2. Test Monday Workflow (End-to-End)
```bash
cd backend
node src/workflows/simulate_monday_workflow.js
```

### 3. Test Email Templates

# Welcome email
node src/workflows/simulate_welcome.js

# Magic link
node src/workflows/simulate_magic_link.js
```

### 4. Verify Flows
- **Newsletter Signup**: Subscribe via landing page. Check for welcome email.
- **Account Creation**: Sign up with email. Check for magic link.
- **Auto-Login**: Click link in weekly digest email. Should auto-login.
- **Vote**: Click "I'D BUILD THIS" (requires login). Checks `votes` table.

---

## 📁 Project Structure

```
zerosbykai/
├── backend/                          # Express API
│   ├── src/
│   │   ├── server.js                 # Entry point + Cron jobs
│   │   ├── config/                   # Supabase, environment
│   │   ├── routes/                   # API routes
│   │   │   ├── ideas.js              # Ideas endpoints
│   │   │   ├── votes.js              # Voting endpoints
│   │   │   └── auth.js               # Auth endpoints
│   │   ├── jobs/                     # Production cron jobs
│   │   │   ├── scrapers/             # Scrapers (Reddit, HN, IH, X)
│   │   │   │   └── run_scrapers.js   # Master orchestration script
│   │   │   └── weekly.js             # Monday: publish, winner, digest
│   │   ├── workflows/                # Testing/simulation scripts
│   │   │   ├── simulate_monday_workflow.js

│   │   │   ├── simulate_welcome.js
│   │   │   └── simulate_magic_link.js
│   │   ├── emails/                   # Email templates
│   │   │   └── templates/
│   │   │       ├── shared.js         # Shared components
│   │   │       ├── weekly-digest.js  # Weekly digest email
│   │   │       ├── welcome.js        # Welcome email
│   │   │       └── magic-link.js     # Magic link email
│   │   ├── utils/                    # Utilities
│   │   │   └── emailToken.js         # JWT token generation/verification
│   │   └── scripts/                  # Utility scripts
│   │       └── delete-user-by-email.sql
│   └── fly.toml                      # Deployment config
│
├── frontend/                         # Next.js
│   ├── pages/
│   │   ├── index.jsx                 # Main landing page
│   │   ├── profile.jsx               # User profile
│   │   └── story.jsx                 # About page
│   ├── components/                   # React components
│   ├── lib/
│   │   └── auth.js                   # Auth context provider
│   └── public/                       # Static assets
│
├── .github/workflows/                # GitHub Actions
│   └── reddit-scraper.yml            # Sunday Reddit scraping
│
└── AUTH_DOCUMENTATION.md             # Comprehensive auth guide
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
- **Sunday 10 AM UTC**: Reddit scraping → 10 ideas generated (status: `backlog`)
- **Monday 9 AM UTC**: 
  1. Auto-publish backlog ideas
  2. Calculate last week's winner
  3. Send weekly digest emails (with auto-login tokens)

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
1. **Weekly Digest** - Sent every Monday to all subscribers
2. **Welcome Email** - Sent to new subscribers
3. **Magic Link** - Sent for passwordless authentication

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

## 📝 Recent Changes (2026-02-03)

### System Audit & Hardening
- ✅ **Complete Logic Verification**: Validated 100% of Winner, Badge, and Leaderboard logic.
- ✅ **Frontend/Backend Parity**: Confirmed Auth & API environments match perfectly (`localhost` vs `prod`).
- ✅ **Tag System Finalized**: Flexible array tags fully implemented; legacy JSON tags- **Sync**: Unified `tags` array on ideas.
- ✅ **Multi-source Strategy**: Expanded scraping to include Hacker News, Indie Hackers, and X (Twitter) along with Reddit.
- ✅ **Cleanup**: Removed inefficient scripts (`check_db_badges.js`) and deprecated migrations.

### Code Organization
- ✅ Moved `daily_startup_ideas.js` → `jobs/reddit_scraper.js`
- ✅ Removed redundant `run-reddit-flow.js` wrapper
- ✅ Separated email templates into individual files
- ✅ Removed admin routes (use Supabase dashboard instead)
- ✅ Refactored `auth.js` with comprehensive documentation

### New Features
- ✅ **Brand Design**: Emails now match website aesthetic ("Rose 700" Pink + Yellow + Comic Cards)
- ✅ **Consistent Metrics**: Implemented robust thread count heuristic (2,100+) for weekly stats
- ✅ **Backlog Health**: Automated alerts on Fridays/Sundays if backlog < 10 ideas
- ✅ Email token auto-login from weekly digest
- ✅ Enhanced Reddit scraping anti-detection
- ✅ Newsletter-only subscription flow
- ✅ Comprehensive auth documentation

### Cleanup & Fixes
- ✅ **Security**: Removed temporary debug scripts (`diagnose_user.js`, etc.)
- ✅ **Status Model**: Simplified idea status to `backlog` -> `published` (removed `pending`/`rejected`)
- ✅ **Bug Fixes**: Fixed duplicate welcome emails, improved error handling


---

**Last Updated**: 2026-02-03
