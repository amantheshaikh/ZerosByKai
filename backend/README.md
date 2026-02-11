# ZerosByKai Backend

Node.js/Express API for ZerosByKai startup ideas platform.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` file with:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Email (Brevo)
BREVO_API_KEY=xkeysib-...

# AI
GEMINI_API_KEY=xxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT for email tokens
JWT_SECRET=your_secure_random_string

# Admin Config
ADMIN_EMAIL=kai@zerosbykai.com
ADMIN_NAME=Kai
BACKLOG_THRESHOLD=10
```

### 3. Database Setup
Run the SQL schema in Supabase SQL Editor:
```bash
# Copy contents of schema.sql and run in Supabase Dashboard > SQL Editor
```

### 4. Run Locally
```bash
npm run dev
```

---

## Deployment to Fly.io

### 1. Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login
```bash
fly auth login
```

### 3. Create App
```bash
fly launch
# Follow prompts, say NO to Postgres (using Supabase)
```

### 4. Set Secrets
```bash
fly secrets set SUPABASE_URL="your_url"
fly secrets set SUPABASE_ANON_KEY="your_key"
fly secrets set SUPABASE_SERVICE_KEY="your_service_key"
fly secrets set BREVO_API_KEY="xkeysib-..."
fly secrets set GEMINI_API_KEY="your_gemini_key"
fly secrets set JWT_SECRET="your_jwt_secret"
fly secrets set FRONTEND_URL="https://zerosbykai.com"
fly secrets set NODE_ENV="production"
fly secrets set ADMIN_EMAIL="your_admin_email"
fly secrets set ADMIN_NAME="Kai"
fly secrets set BACKLOG_THRESHOLD="10"
```

### 5. Deploy
```bash
fly deploy
```

### 6. Check Status
```bash
fly status
fly logs
```

---

## API Endpoints

### Public (Ideas)
- `GET /health` - Health check
- `GET /api/ideas/weekly` - Current week's ideas (Cache-Control: 60s)
- `GET /api/ideas/leaderboard` - Top 3 winners from last week (Cache-Control: 60s)
- `GET /api/ideas/weekly-batches` - Paginated past batches (Cache-Control: 300s)
- `GET /api/ideas/weekly-batch/:date` - Specific week's batch (Cache-Control: 300s)

### Public (Emails)
- `GET /api/emails/view/:type` - Mirror link renderer (welcome, magic-link)

### Auth Endpoints
- `POST /api/auth/check` - Check if subscriber exists
- `POST /api/auth/subscribe` - Newsletter-only subscription (no account)
- `POST /api/auth/signup` - Send magic link (creates account)
- `POST /api/auth/verify` - Verify magic link OTP
- `POST /api/auth/verify-email-token` - Verify email token for auto-login
- `POST /api/auth/post-login` - Post-login hook (welcome email, sync)
- `GET /api/auth/user` - Get current user (auth required)
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/unsubscribe` - Verify unsubscribe token (rate limited)
- `POST /api/auth/unsubscribe` - Perform unsubscription (rate limited)
- `DELETE /api/auth/user` - Delete own account (auth required)
- `DELETE /api/auth/admin/user` - Admin delete user (service key required)

### Voting (Auth Required)
- `POST /api/votes` - Cast vote (one per week)
- `GET /api/votes/user` - Get user's current vote
- `GET /api/votes/last-week` - Get last week's vote result
- `GET /api/votes/badges` - Get user's badges

### Webhooks
- `POST /api/webhooks/brevo` - Brevo event sync (requires webhook secret)

---

## Scheduled Jobs

### Server Cron (node-cron, Fly.io)

**Wed/Fri/Sun 9 AM UTC**
- **Schedule Health Check** (`jobs/backlog_check.js`)
  - Verifies if next week's newsletter is scheduled.
  - Alerts Admin if actionable work is needed.

### GitHub Actions

**Sunday** — Multi-source Scraping
- Scrapes 20+ sources (Reddit, HN, IH, X)
- Generates ideas via Gemini AI → `status: 'backlog'`

**Monday 14:00 UTC (9 AM EST)** — Weekly Digest (`.github/workflows/weekly-digest.yml`)
- Calculates last week's winner & awards badges.
- Flips `scheduled` ideas → `published`.
- Sends digest via Brevo Template API (50/batch, per-subscriber params).

---

## Project Structure

```
backend/
├── src/
│   ├── server.js                     # Entry point + Cron jobs
│   ├── config/
│   │   └── supabase.js               # Supabase client setup
│   ├── routes/                       # API routes
│   │   ├── ideas.js                  # Ideas endpoints (leaderboard, weekly, batches)
│   │   ├── votes.js                  # Voting endpoints (cast, user vote, badges)
│   │   ├── auth.js                   # Auth endpoints (subscribe, login, unsubscribe)
│   │   ├── emails.js                 # Email mirror link renderer
│   │   └── webhooks.js               # Brevo webhook handler
│   ├── jobs/                         # Production cron jobs
│   │   ├── reddit_scraper.js         # Sunday: Reddit scraping
│   │   ├── weekly.js                 # Monday: publish, winner, digest
│   │   └── backlog_check.js          # Wed/Fri/Sun: Health check
│   ├── services/                     # Business Logic
│   │   ├── aiService.js              # AI Logic
│   │   ├── brevoService.js           # CRM Logic
│   │   └── newsletterService.js      # Scheduling Logic
│   ├── emails/                       # Email templates
│   │   └── templates/
│   │       ├── shared.js             # Shared components
│   │       ├── brevo_template.html   # Weekly digest (Brevo-hosted template)
│   │       ├── welcome.js            # Welcome email
│   │       └── magic-link.js         # Magic link email
│   ├── utils/                        # Utilities
│   │   └── emailToken.js             # JWT token generation/verification
│       └── delete-user-by-email.sql  # User deletion script
│       └── migration_v2.sql          # Schema alignment script
│       └── update_status_enum.sql    # Status enum migration (scheduled)
├── fly.toml                          # Fly.io deployment config
└── package.json
```

---

### Run Migration
```bash
# Run migration_v2.sql in Supabase SQL Editor to align production
```

### Test Reddit Scraping
```bash
npm run scrape:local
```

---

## Admin Management

### Managing Ideas
Use Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Table Editor → `ideas`
4. Edit, delete, or approve ideas directly

### Managing Users
Use Supabase Dashboard:
1. Navigate to Authentication → Users
2. View, edit, or delete users

### Deleting a User
```bash
# Run SQL script in Supabase SQL Editor
# See: src/scripts/delete-user-by-email.sql
```

### Resetting All Users (Dev Only)
```bash
# Run migrations/reset_all_users.sql in Supabase SQL Editor
# WARNING: Deletes ALL users/subs. Preserves votes (via SET NULL).
```

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `BREVO_API_KEY` | Brevo API key (v3) | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `JWT_SECRET` | Secret for email token signing | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `ADMIN_EMAIL` | Administrator alert email | ✅ |
| `ADMIN_NAME` | Administrator name | ❌ |
| `BACKLOG_THRESHOLD` | Ideas needed for health | ❌ |
| `PORT` | Server port (default: 3001) | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |

---

- ✅ **Next-Gen Models**: Integrated `gemini-3-flash-preview` and `gemini-3-pro-preview`.
- ✅ **Hardening**: CRLF protection, RFC 2047 subject encoding, Base64 email bodies.
- ✅ **Maintenance**: PII masked in logs, UTC standardized dates, ADMIN_CONFIG in env.
- ✅ **Sync**: Unified `tags` array (max 5) on ideas.


---

## Troubleshooting

### Server won't start
- Check `.env` file exists and has all required variables
- Verify port 3001 is not in use: `lsof -i :3001`
- Check Supabase keys are correct

### Emails not sending
- Verify `BREVO_API_KEY` is set correctly in Fly secrets
- Check Brevo Dashboard for logs

### Reddit scraping fails
- Check `GEMINI_API_KEY` is valid
- Verify API quota hasn't been exceeded
- Check for rate limiting (429 errors)

### Cron jobs not running
- Check server logs: `fly logs`
- Verify cron expressions in `server.js`
- Ensure server is running (Fly.io auto-restarts)

---

## Links

- **Frontend**: https://zerosbykai.com
- **API**: https://zerosbykai-api-prod.fly.dev
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Brevo Dashboard**: https://app.brevo.com
- **Fly.io Dashboard**: https://fly.io/dashboard

---

**Last Updated**: 2026-02-11
