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
BREVO_WEEKLY_DIGEST_TEMPLATE_ID=3
BREVO_WEBHOOK_SECRET=your_secret_token

# AI
GEMINI_API_KEY=xxx

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=legacy_secret             # (Deprecated for new tokens)
EMAIL_TOKEN_SECRET=secure_secret      # Used for sign-in/unsub links
EMAIL_TOKEN_EXPIRY=7d

# Admin Config
ADMIN_EMAIL=kai@zerosbykai.com
ADMIN_NAME=Kai
BACKLOG_THRESHOLD=10
```

### 3. Database Setup
Run the SQL schema in Supabase SQL Editor:
```bash
# Apply final_schema.sql via Supabase Dashboard > SQL Editor
```

### 4. Run Locally
```bash
npm run dev
```

---

## Deployment to Fly.io

### 1. Set Secrets
```bash
fly secrets set SUPABASE_URL="your_url"
fly secrets set SUPABASE_ANON_KEY="your_key"
fly secrets set SUPABASE_SERVICE_KEY="your_service_key"
fly secrets set BREVO_API_KEY="xkeysib-..."
fly secrets set BREVO_WEEKLY_DIGEST_TEMPLATE_ID="3"
fly secrets set BREVO_WEBHOOK_SECRET="your_secret"
fly secrets set GEMINI_API_KEY="your_gemini_key"
fly secrets set EMAIL_TOKEN_SECRET="your_secret"
fly secrets set FRONTEND_URL="https://zerosbykai.com"
fly secrets set NODE_ENV="production"
fly secrets set ADMIN_EMAIL="kai@zerosbykai.com"
```

### 2. Deploy
```bash
fly deploy
```

---

## API Endpoints

### Public (Ideas)
- `GET /health` - Health check
- `GET /api/ideas/weekly` - Current week's ideas (Cached)
- `GET /api/ideas/leaderboard` - Last week's winner
- `GET /api/ideas/weekly-batches` - Past newsletter archive

### Auth & Subscription
- `POST /api/auth/subscribe` - Newsletter-only signup
- `POST /api/auth/post-login` - Sync logic & welcome email
- `POST /api/auth/verify-email-token` - Secure auto-login
- `POST /api/auth/unsubscribe` - RFC 8058 compliant opt-out

### Webhooks
- `POST /api/webhooks/brevo` - Event sync (Bounces, Spams, Deletions)

---

## Management Scripts

All administrative tasks are consolidated into `src/scripts/manage_templates.js`.

```bash
# Sync local HTML to Brevo
node src/scripts/manage_templates.js update [id]

# Send previews to yourself
node src/scripts/manage_templates.js preview [email]

# Register production webhooks
node src/scripts/manage_templates.js webhooks

# Simulate Monday workflow (Safe, no DB writes)
node src/scripts/manage_templates.js simulate
```

---

## Monitoring & Jobs

### Scheduled Jobs (GitHub Actions)
**Monday 14:00 UTC** — Weekly Digest Delivery
- Calculates winner, flip statuses, sends batch emails via Brevo.
- **Robustness**: Uses exponential backoff and idempotency keys to ensure zero-duplicate delivery.

**Sunday** — Multi-source Scraping
- Reddit, HN, IH, X → Gemini AI → Backlog ideas.

---

## 🧪 Testing
We maintain a >90% code coverage target for critical business logic.

```bash
# Run all tests
npm test

# Run with coverage report
npm run coverage
```

---

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `BREVO_API_KEY` | Brevo API key (v3) | ✅ |
| `BREVO_WEBHOOK_SECRET` | Security for Brevo webhooks | ✅ |
| `EMAIL_TOKEN_SECRET` | Secret for secure link tokens | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `SUPABASE_SERVICE_KEY` | Admin DB access | ✅ |

---

## Recent Milestones (2026-02-14)
- ✅ **Test Coverage**: Achieved >90% backend statement coverage.
- ✅ **Subscription Reliability**: Implemented exponential backoff and idempotency for email batches.
- ✅ **Auth Refinement**: Hardened post-login hooks with OAuth name sync and re-engagement logic.
- ✅ **Admin**: Consolidated all template/webhook/simulation tools into `manage_templates.js`.

**Last Updated**: 2026-02-14
