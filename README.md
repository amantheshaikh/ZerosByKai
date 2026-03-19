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
npm run scrape:local # Optimized Reddit (Top 15), HN, IH, X
```

### 3. Move Ideas to Backlog (Scored)
```bash
cd backend
npm run backlog:check # Processes raw scrapes into the Ideas table
```

### 4. Schedule Newsletter (Batching)
```bash
cd backend
npm run schedule # Selects 10 best ideas and schedules them for Monday
```

### 5. Send Monday Digest (Live)
```bash
cd backend
npm run monday:weekly # Publishes batch, awards badges, sends Brevo emails
```

### 6. Test Workflow (Simulated)
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
Comprehensive identity and security flows are documented in [**AUTH_DOCUMENTATION.md**](./docs/AUTH_DOCUMENTATION.md).

### Quick Entry Points:
1. **Email Token Auto-Login** - Seamless transition from newsletter to voting.
2. **Magic Link** - Secure, passwordless entry.
3. **Google OAuth** - One-click social login.
4. **Newsletter-Only** - Subscription without account creation.

---

## 📧 Email System
Detailed automation and template logic is found in the [**Documentation Index**](./docs/README.md).

- **Providers**: Brevo (SMTP) + Cloudflare (Routing).
- **Digests**: Sent every Monday via API-driven templates.
- **Auto-Login**: JWT tokens enabling 7-day session persistence from emails.

---

## 🤖 AI & Scraping
Analytics and extraction heuristics are located in [**Idea Extraction Logic**](./docs/idea_extraction_logic.md).

- **Multi-source**: Sunday scrapes of Reddit, HN, IH, and X.
- **Model**: `gemini-3.1-flash-lite-preview` (Roasting) & `gemini-2.0-flash` (Primary Synthesis).
- **Workflow**: Automated synthesis → Backlog → Admin Approval → Scheduling.

---

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

---

## 📝 Recent Changes (2026-03-16)

### Roasting, UI & Reliability (Mar 16)
- ✅ **AI Roasting**: Updated roast model to `gemini-3.1-flash-lite-preview`.
- ✅ **Footer**: Integrated Product Hunt badge with responsive side-by-side layout.
- ✅ **Roast Page**: Reordered sections to prioritize "Form/Results" over "How It Works".
- ✅ **Reliability**: Automated cleanup of blocking node processes for smoother dev setup.

### Previous (2026-02-14)
- ✅ **Performance**: Parallelized DB calls; implemented `Cache-Control` headers for read endpoints.
- ✅ **Security**: Updated `verify-email-token` to use `generateLink` + `verifyOtp` sessions.
- ✅ **Features**: Launched **Kai's Toolbox** (`/tools`) with dynamic logo fetching.
- ✅ **Cleanup**: Removed dead endpoints and unused legacy services.

### Previous (Feb 11)
- ✅ **Security**: Secured Brevo webhook auth; added rate limiter to `POST /unsubscribe`.
- ✅ **Cache**: In-memory cache for `getVotingWeek()` (60s TTL).

---

**Last Updated**: 2026-03-16
