# ZerosByKai - Project Documentation

> **Purpose**: The single source of truth for the ZerosByKai project, including deployment, testing, and business logic.

---

## 🎯 Project Overview

**ZerosByKai** is a weekly startup ideas platform.
- **Concept**: Kai (Analyst persona) scrapes Reddit for "real problems" people complain about.
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
     RESEND_API_KEY="re_xxx" \
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

### DNS (Spaceship)
- **A Record**: `@` → `76.76.21.21`
- **CNAME**: `www` → `cname.vercel-dns.com`

---

## 🧪 Testing & Verification

### 1. Manual Seeding (Add Test Idea)
Since the database starts empty, run this to populate a test idea:
```bash
# 1. Create Idea
curl -X POST https://zerosbykai-api-prod.fly.dev/api/webhook/bubblelab \
  -H "x-webhook-secret: YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "test-batch",
    "ideas": [{
      "name": "TestIdea",
      "title": "A Test Idea",
      "problem": "App is empty.",
      "solution": "Add data.",
      "targetAudience": "Devs",
      "whyItMatters": "Sanity.",
      "tags": {"geography": ["global"], "category": ["test"]},
      "sourceUrls": ["http://test.com"]
    }]
  }'

# 2. Approve & Publish
curl -X POST -H "x-admin-password: YOUR_ADMIN_PASS" \
  https://zerosbykai-api-prod.fly.dev/api/admin/publish
```

### 2. Verify Flows
- **Signup**: Join via landing page. Check for Magic Link email.
- **Vote**: Click "I'D BUILD THIS" (requires login). Checks `votes` table.
- **Cron Jobs**: Run weekly at Sunday 11PM (winner) and Monday 9AM (digest).

---

## 📁 Project Structure

```
zerosbykai/
├── backend/              # Express API
│   ├── src/server.js     # Entry point + Cron
│   ├── src/routes/       # /ideas, /votes, /auth
│   └── fly.toml          # Deployment config
│
└── frontend/             # Next.js
    ├── pages/index.jsx   # Main Comic Landing Page
    ├── public/           # Assets (kai-hero.jpg)
    └── .env.production   # Env vars
```

## 🔑 Core Business Rules
- **One Vote per Week**: Users can change their vote, but only one counts per week.
- **Badges**: Bronze (1-2 wins), Silver (3-5), Gold (6-10), Diamond (11+).
- **Weekly Cycle**:
  - **Thu-Sun**: Admin moderates ideas.
  - **Sun 11PM**: Winner calculated. Badges awarded.
  - **Mon 9AM**: Digest email sent. Top 10 ideas go live.

---

## 🎨 Design System
- **Theme**: Comic Book / Pop Art.
- **Fonts**: 'Bangers' (Headers), 'Courier Prime' (Body).
- **Colors**: Yellow (#FBBF24), Black (#000), Rose (#BE123C).
- **Components**: Thick borders (3-4px), Halftone patterns, offset shadows.

---
**Last Updated**: 2026-01-30
