# ZerosByKai Backend

Node.js/Express API for ZerosByKai startup ideas platform.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for admin operations)
- `RESEND_API_KEY` - Resend API key for sending emails
- `BUBBLELAB_WEBHOOK_SECRET` - Secret for securing BubbleLab webhook
- `ADMIN_PASSWORD` - Password for moderation admin panel
- `FRONTEND_URL` - Your frontend URL (for CORS)

### 3. Database Setup
Run the SQL schema in Supabase SQL Editor:
```bash
# Copy contents of schema.sql and run in Supabase Dashboard > SQL Editor
```

### 4. Run Locally
```bash
npm run dev
```

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
fly secrets set BUBBLELAB_WEBHOOK_SECRET="your_secret"
fly secrets set ADMIN_PASSWORD="your_password"
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

## API Endpoints

### Public
- `GET /health` - Health check
- `GET /api/ideas` - List all published ideas
- `GET /api/ideas/weekly` - Current week's ideas
- `GET /api/ideas/:id` - Single idea
- `GET /api/ideas/winner/:week` - Week's winner

### Auth Required
- `POST /api/auth/signup` - Send magic link
- `GET /api/auth/user` - Get current user
- `POST /api/votes` - Cast vote (one per week)
- `GET /api/votes/user` - Get user's current vote
- `GET /api/votes/badges` - Get user's badges

### Webhooks
- `POST /api/webhook/bubblelab` - Receive ideas from BubbleLab

### Admin (Password Protected)
- `GET /api/admin/pending` - List pending ideas
- `POST /api/admin/approve/:id` - Approve idea
- `POST /api/admin/reject/:id` - Reject idea
- `POST /api/admin/publish` - Publish all approved ideas
- `PUT /api/admin/idea/:id` - Edit idea

## Cron Jobs

Automatically runs:
- **Sunday 11 PM UTC**: Calculate winner, award badges
- **Monday 9 AM UTC**: Send weekly digest
- **Monday 9:15 AM UTC**: Send badge emails

## Admin Moderation

Access pending ideas:
```bash
curl -H "x-admin-password: YOUR_PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/pending
```

Or build a simple admin UI hitting these endpoints.
