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

# Email
RESEND_API_KEY=re_xxx

# AI
GEMINI_API_KEY=xxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT for email tokens
JWT_SECRET=your_secure_random_string
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
fly secrets set RESEND_API_KEY="your_resend_key"
fly secrets set GEMINI_API_KEY="your_gemini_key"
fly secrets set JWT_SECRET="your_jwt_secret"
fly secrets set FRONTEND_URL="https://zerosbykai.com"
fly secrets set NODE_ENV="production"
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

### Public
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

### Voting (Auth Required)
- `POST /api/votes` - Cast vote (one per week)
- `GET /api/votes/user` - Get user's current vote
- `GET /api/votes/badges` - Get user's badges

---

## Cron Jobs

Automatically runs via `node-cron`:

### Sunday 10 AM UTC
- **Reddit Scraping** (`jobs/reddit_scraper.js`)
  - Scrapes 17+ subreddits
  - Generates 10 ideas via Gemini AI
  - Saves as `status: 'backlog'`

### Monday 9 AM UTC
- **Auto-Publish Ideas** (`jobs/weekly.js` → `autoPublishIdeas()`)
  - Moves backlog ideas to published
- **Calculate Winner** (`jobs/weekly.js` → `calculateWinner()`)
  - Finds last week's most-voted idea
  - Awards badges to users who voted for it
- **Send Weekly Digest** (`jobs/weekly.js` → `sendWeeklyDigest()`)
  - Sends emails to all subscribers
  - Includes auto-login tokens for authenticated users

---

## Project Structure

```
backend/
├── src/
│   ├── server.js                     # Entry point + Cron jobs
│   ├── config/
│   │   └── supabase.js               # Supabase client setup
│   ├── routes/                       # API routes
│   │   ├── ideas.js                  # Ideas endpoints
│   │   ├── votes.js                  # Voting endpoints
│   │   └── auth.js                   # Auth endpoints
│   ├── jobs/                         # Production cron jobs
│   │   ├── reddit_scraper.js         # Sunday: Reddit scraping
│   │   └── weekly.js                 # Monday: publish, winner, digest
│   ├── workflows/                    # Testing/simulation scripts
│   │   ├── simulate_monday_workflow.js
│   │   ├── simulate_welcome.js
│   │   └── simulate_magic_link.js
│   ├── emails/                       # Email templates
│   │   ├── templates.js              # Re-exports all templates
│   │   └── templates/
│   │       ├── shared.js             # Shared components
│   │       ├── weekly-digest.js      # Weekly digest email
│   │       ├── welcome.js            # Welcome email
│   │       └── magic-link.js         # Magic link email
│   ├── utils/                        # Utilities
│   │   └── emailToken.js             # JWT token generation/verification
│   └── scripts/                      # Utility scripts
│       └── delete-user-by-email.sql  # User deletion script
├── fly.toml                          # Fly.io deployment config
└── package.json
```

---

## Testing & Simulation

### Test Reddit Scraping
```bash
node src/jobs/reddit_scraper.js
```

### Test Monday Workflow (End-to-End)
```bash
node src/workflows/simulate_monday_workflow.js
```

### Test Email Templates
```bash
# Weekly digest
node src/workflows/simulate_newsletter.js

# Welcome email
node src/workflows/simulate_welcome.js

# Magic link
node src/workflows/simulate_magic_link.js
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

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `JWT_SECRET` | Secret for email token signing | ✅ |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ |
| `PORT` | Server port (default: 3001) | ❌ |
| `NODE_ENV` | Environment (development/production) | ❌ |

---

### Recent Changes (2026-02-02)

### File Structure
- ✅ Moved `workflows/daily_startup_ideas.js` → `jobs/reddit_scraper.js`
- ✅ **Cleanup**: Removed temporary simulation scripts (`simulate_newsletter.js`, `preview_email_html.js`)
- ✅ Removed admin routes (use Supabase dashboard)
- ✅ Separated email templates into individual files

### New Features
- ✅ **Brand Design**: Emails now match website aesthetic ("Rose 700" Pink + Yellow + Comic Cards)
- ✅ **Consistent Metrics**: Implemented robust thread count heuristic (2,100+) for weekly stats
- ✅ **Backlog Health**: Automated alerts on Fridays/Sundays if backlog < 10 ideas
- ✅ Email token auto-login (JWT-based)
- ✅ Enhanced Reddit scraping (anti-detection)


---

## Troubleshooting

### Server won't start
- Check `.env` file exists and has all required variables
- Verify port 3001 is not in use: `lsof -i :3001`
- Check Supabase keys are correct

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for logs: https://resend.com/emails
- Ensure `kai@zerosbykai.com` is verified in Resend

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
- **Resend Dashboard**: https://resend.com/emails
- **Fly.io Dashboard**: https://fly.io/dashboard

---

**Last Updated**: 2026-02-02
