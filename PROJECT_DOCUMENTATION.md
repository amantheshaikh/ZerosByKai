# ZerosByKai - Project Documentation

> **Purpose**: Minimal-token reference for Claude Code when working on this project

---

## 🎯 Project Overview

**ZerosByKai** - Weekly startup ideas platform curated by Kai (27-year-old Asian American analyst) who scrapes Reddit to find real problems people complain about. Users vote on ideas, earn badges, prove they can spot winners.

**Tagline**: "In a world where 0 to 1 has become incredibly easy, find the right 0."

**Tone**: Edgy, no-BS, for builders/doers/hustlers. No AI fluff. Real problems only.

---

## 📁 Project Structure

```
zerosbykai/
├── backend/              # Express API (Fly.io)
│   ├── src/
│   │   ├── server.js     # Main server + cron jobs
│   │   ├── config/       # Supabase client
│   │   ├── routes/       # API endpoints
│   │   │   ├── ideas.js
│   │   │   ├── votes.js
│   │   │   ├── auth.js
│   │   │   ├── webhook.js
│   │   │   └── admin.js
│   │   ├── jobs/         # Cron jobs
│   │   │   └── weekly.js
│   │   └── emails/       # Email templates
│   │       └── templates.js
│   ├── schema.sql        # Supabase database schema
│   └── package.json
│
└── frontend/             # Next.js (Vercel)
    ├── pages/
    │   ├── index.jsx     # Landing page
    │   ├── ideas/        # Idea detail pages
    │   └── auth/         # Auth callbacks
    ├── components/
    └── package.json
```

---

## 🗄️ Database Schema (Supabase)

### Tables

**ideas**
- `id` (uuid, pk)
- `name` - Startup name (e.g., "WasteSense")
- `title` - Full title
- `problem` - Problem description (2-3 paragraphs)
- `solution` - Solution description
- `target_audience` - Who needs this
- `why_it_matters` - Market opportunity
- `source_links` (jsonb) - Reddit URLs
- `tags` (jsonb) - `{geography: ["india"], category: ["cleantech"]}`
- `week_published` (date)
- `status` - `pending`, `approved`, `rejected`, `published`
- `problem_keywords` (text[]) - For diversity check
- `bubblelab_batch_id`

**votes**
- `id` (uuid, pk)
- `idea_id` (fk → ideas)
- `user_id` (fk → auth.users)
- `voted_at`
- UNIQUE(idea_id, user_id)

**weekly_batches**
- `id` (uuid, pk)
- `week_start_date` (date, unique)
- `winner_idea_id` (fk → ideas)
- `total_ideas`, `total_votes`
- `email_sent_at`, `badge_emails_sent_at`

**user_badges**
- `id` (uuid, pk)
- `user_id` (fk → auth.users)
- `idea_id` (fk → ideas)
- `badge_type` - `kai_pick`, `bronze`, `silver`, `gold`, `diamond`
- `awarded_at`
- UNIQUE(user_id, idea_id)

**profiles**
- `id` (uuid, pk, fk → auth.users)
- `name`

---

## 🔑 Core Business Rules

### Voting
- ✅ **One vote per week** - User can only vote on ONE idea per week
- ✅ Can **change vote** - Delete old vote, insert new one
- ✅ Vote only on **current week's ideas**
- ❌ **No vote counts shown** to users (prevents gaming)

### Ideas
- ✅ **10 ideas per week** (from BubbleLab)
- ✅ Each idea has: Name, Title, Problem, Solution, Target, Why It Matters, Tags, Sources
- ✅ **Diversity engine** - Compare keywords with last 20 ideas, flag >70% similarity

### Badges
- ✅ Awarded to users who **voted for winning idea**
- ✅ Tiers: Bronze (1-2), Silver (3-5), Gold (6-10), Diamond (11+)
- ✅ Badge emails sent separately from weekly digest

### Moderation
- ✅ Thursday: BubbleLab sends ideas → `status: pending`
- ✅ Thu-Sun: Admin reviews (`/api/admin/*`)
- ✅ Approve → `status: approved`
- ✅ Before Monday: Publish → `status: published`

---

## 🔄 Weekly Workflow

```
Thursday 8 AM UTC
↓ BubbleLab scrapes Reddit, generates ideas
↓ POST /api/webhook/bubblelab
└─→ Ideas saved as `status: pending`

Thursday - Sunday
↓ Admin moderates ideas
└─→ Approve/reject via `/api/admin/*`

Sunday 11 PM UTC (Cron)
↓ Calculate last week's winner
↓ Award badges to winning voters
└─→ Update weekly_batches table

Monday 9 AM UTC (Cron)
↓ Send weekly digest to all users
└─→ Include this week's ideas + last week's winner

Monday 9:15 AM UTC (Cron)
↓ Send badge emails to users who picked winner
└─→ Personalized with badge count & tier
```

---

## 🛠️ API Endpoints Reference

### Public
```
GET  /api/ideas              # List all published ideas
GET  /api/ideas/weekly       # Current week's ideas
GET  /api/ideas/:id          # Single idea with vote count
GET  /api/ideas/winner/:week # Week's winner
```

### Auth (Magic Link)
```
POST /api/auth/signup        # Send magic link email
     Body: { email, name }
     
POST /api/auth/verify        # Verify magic link token
     Body: { token, type }
     
GET  /api/auth/user          # Get current user
     Header: Authorization: Bearer <token>
```

### Voting (Requires Auth)
```
POST /api/votes              # Cast or change vote
     Header: Authorization: Bearer <token>
     Body: { ideaId }
     Logic: Check current week, delete old vote, insert new
     
GET  /api/votes/user         # Get user's current week vote
     Header: Authorization: Bearer <token>
     
GET  /api/votes/badges       # Get user's badges + tier
     Header: Authorization: Bearer <token>
```

### Webhooks
```
POST /api/webhook/bubblelab  # Receive ideas from BubbleLab
     Header: x-webhook-secret: <secret>
     Body: { batch_id, ideas[], metadata }
     Logic: Extract keywords, check diversity, save as pending
```

### Admin (Password Auth)
```
GET  /api/admin/pending      # List pending ideas
     Header: x-admin-password: <password>
     
POST /api/admin/approve/:id  # Approve idea
POST /api/admin/reject/:id   # Reject idea
POST /api/admin/publish      # Publish all approved for this week
PUT  /api/admin/idea/:id     # Edit idea fields
```

---

## 🎨 Frontend Design System

### Typography
- **Headers**: `font-family: 'Bangers', cursive` (comic book style)
- **Body**: `font-family: 'Courier Prime', monospace` (analyst report feel)

### Colors
```css
--yellow-primary: #fbbf24
--amber: #f59e0b
--burgundy: #7D1935
--rose: #be123c
--black: #000000
--white: #ffffff
```

### Comic Book Elements
- Black borders (3-4px solid)
- Box shadows: `8px 8px 0px #000`
- Halftone dot patterns: `radial-gradient(circle, #000 1px, transparent 1px)`
- Panels: `.comic-panel { border: 3px solid #000; background: white; }`

### Key Components
```jsx
// Vote Button
<button className="comic-panel bg-gradient-to-r from-yellow-400 to-amber-400">
  <div className="comic-shadow absolute -z-10 bg-black translate-x-1 translate-y-1" />
  <span className="comic-title">I'D BUILD THIS</span>
</button>

// Idea Card
<div className="comic-panel p-8 bg-white comic-shadow">
  {/* Name, Problem, Solution, Target, Why */}
</div>

// Badge Display
🥉 Bronze (1-2) | 🥈 Silver (3-5) | 🥇 Gold (6-10) | 💎 Diamond (11+)
```

---

## 📧 Email Templates

### Weekly Digest
**From**: Kai <kai@zerosbykai.com>
**Subject**: Kai's Zeros: Week of [Date]
**Content**:
1. Header: ZEROSBYKAI | Week of [Date]
2. Summary: "[threadCount] threads analyzed"
3. Last Week's Winner (if exists)
4. This Week's Opportunities (10 ideas)
   - Each idea: Name, Title, Tags, Problem, Solution, Target, Why, "PICK THIS IDEA →" button
5. Footer: "See you next Monday, Kai"

### Badge Email
**From**: Kai <kai@zerosbykai.com>
**Subject**: 🎯 You Picked the Winner!
**Content**:
1. Header: "YOU PICKED THE WINNER!"
2. "You voted for: [Idea Name]"
3. Badge stats: [Count] winning picks, [Tier] badge
4. Message: "You're developing an eye for spotting opportunities..."
5. If Diamond: "You might just have a future in venture capital. 💼"
6. CTA: "SEE THIS WEEK'S IDEAS →"

---

## 🔧 Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

RESEND_API_KEY=re_xxx

PORT=3001
NODE_ENV=production
FRONTEND_URL=https://zerosbykai.vercel.app

BUBBLELAB_WEBHOOK_SECRET=xxx
ADMIN_PASSWORD=xxx
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
NEXT_PUBLIC_API_URL=https://zerosbykai-api.fly.dev
```

---

## 🐛 Common Tasks

### Add New Idea Manually
```bash
curl -X POST https://zerosbykai-api.fly.dev/api/webhook/bubblelab \
  -H "x-webhook-secret: SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "manual-2026-02-03",
    "ideas": [{
      "name": "IdeaName",
      "title": "Full Title",
      "problem": "...",
      "solution": "...",
      "targetAudience": "...",
      "whyItMatters": "...",
      "tags": {"geography": ["india"], "category": ["fintech"]},
      "sourceUrls": ["https://reddit.com/..."]
    }]
  }'
```

### Moderate Ideas
```bash
# List pending
curl -H "x-admin-password: PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/pending | jq

# Approve
curl -X POST -H "x-admin-password: PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/approve/IDEA_ID

# Publish all approved
curl -X POST -H "x-admin-password: PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/publish
```

### Check Winner
```bash
# Get last week's winner
curl https://zerosbykai-api.fly.dev/api/ideas/winner/2026-02-03
```

### Test Auth Flow
```bash
# Send magic link
curl -X POST https://zerosbykai-api.fly.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# User clicks link in email, gets redirected with token
# Frontend exchanges token for session
```

---

## 🚀 Deployment Commands

### Backend (Fly.io)
```bash
cd backend
fly deploy
fly logs
fly status
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Update Env Vars
```bash
# Fly.io
fly secrets set KEY=value

# Vercel
vercel env add KEY
```

---

## 🔍 Debugging

### Backend not receiving webhooks
```bash
fly logs --app zerosbykai-api | grep webhook
# Check x-webhook-secret header matches
```

### Cron jobs not running
```bash
fly logs | grep -i "cron\|winner\|digest"
# Jobs run at: Sun 11PM, Mon 9AM, Mon 9:15AM UTC
```

### Users can't vote
```bash
# Check Supabase RLS policies
# Verify JWT token is valid
# Check idea is from current week
```

### Emails not sending
```bash
# Resend dashboard > Logs
# Verify domain DNS records
# Check RESEND_API_KEY
```

---

## 📊 Database Queries (Quick Reference)

```sql
-- Get current week's ideas
SELECT * FROM ideas 
WHERE week_published = '2026-02-03' 
AND status = 'published';

-- Get vote count for idea
SELECT COUNT(*) FROM votes WHERE idea_id = 'xxx';

-- Get user's badges
SELECT * FROM user_badges WHERE user_id = 'xxx';

-- Get winner
SELECT i.*, COUNT(v.id) as votes
FROM ideas i
LEFT JOIN votes v ON v.idea_id = i.id
WHERE i.week_published = '2026-01-27'
GROUP BY i.id
ORDER BY votes DESC
LIMIT 1;

-- Award badges
INSERT INTO user_badges (user_id, idea_id, badge_type)
SELECT user_id, 'winner_idea_id', 'kai_pick'
FROM votes
WHERE idea_id = 'winner_idea_id'
ON CONFLICT (user_id, idea_id) DO NOTHING;
```

---

## 🎯 Key Files to Modify

### Change Cron Schedule
**File**: `backend/src/server.js`
```javascript
// Sunday 11 PM
cron.schedule('0 23 * * 0', calculateWinner);

// Monday 9 AM  
cron.schedule('0 9 * * 1', sendWeeklyDigest);
```

### Modify Email Templates
**File**: `backend/src/emails/templates.js`
```javascript
export function generateWeeklyDigestEmail({ ideas, winner, ... }) {
  // Edit HTML here
}
```

### Change Voting Logic
**File**: `backend/src/routes/votes.js`
```javascript
router.post('/', requireAuth, async (req, res) => {
  // One vote per week logic
});
```

### Update Landing Page
**File**: `frontend/pages/index.jsx`
```jsx
// Edit comic book components
```

---

## 🎨 Brand Assets

### Kai Character
- **Age**: 27
- **Ethnicity**: Asian American
- **Style**: Comic book illustration, burgundy blazer, magnifying glass
- **Image**: Use uploaded character image
- **Tone**: Analytical, curious, no-BS

### Messaging
- "This isn't AI-generated fluff"
- "Real problems. Real opportunities."
- "For the doers. The hustlers. The builders who actually ship."
- "Stack enough badges? You might just have a future in venture capital."

---

## ⚡ Performance Tips

### Reduce Token Usage
1. Reference this doc instead of re-reading code
2. Use specific file paths: `backend/src/routes/votes.js`
3. Use SQL queries from "Database Queries" section
4. Copy API curl commands from "Common Tasks"

### Quick Fixes
- **Add feature** → Identify file from "Key Files to Modify"
- **Debug issue** → Check "Debugging" section first
- **Deploy** → Use exact commands from "Deployment"

---

## 📝 Changelog Template

When making changes, log here:

```
## [Date] - [Your Name]

### Added
- Feature X in votes.js

### Changed  
- Email template wording

### Fixed
- Bug in winner calculation

### Deployment
- Ran: fly deploy
- Updated: RESEND_API_KEY secret
```

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://app.supabase.com
- **Resend Dashboard**: https://resend.com/home
- **Fly.io Dashboard**: https://fly.io/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

- **API Endpoint**: https://zerosbykai-api.fly.dev
- **Frontend**: https://zerosbykai.vercel.app
- **BubbleLab**: (your bubblelab URL)

---

**Last Updated**: 2026-01-30
**Version**: 1.0.0
**Status**: Production Ready

---

*Remember: This doc exists to minimize token usage. Reference it first before diving into code.*
