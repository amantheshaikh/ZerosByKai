# ZerosByKai - Full Stack Deployment Guide

## 📦 What You Have

Complete backend (Express/Node.js) and frontend (Next.js) ready to deploy.

---

## 🔑 Credentials & API Keys Needed

### 1. **Supabase** (Database + Auth)
Sign up: https://supabase.com

After creating project, get:
- ✅ `SUPABASE_URL` - Project Settings > API > Project URL
- ✅ `SUPABASE_ANON_KEY` - Project Settings > API > anon/public key
- ✅ `SUPABASE_SERVICE_KEY` - Project Settings > API > service_role key (keep secret!)

**Setup Steps:**
1. Create new Supabase project
2. Go to SQL Editor
3. Copy/paste entire `/backend/schema.sql` file
4. Run the SQL to create tables

### 2. **Resend** (Email Sending)
Sign up: https://resend.com

After signing up:
- ✅ `RESEND_API_KEY` - Dashboard > API Keys > Create API Key
- ✅ Add domain: `zerosbykai.com` (or your domain)
- ✅ Verify DNS records (SPF, DKIM, DMARC)
- ✅ Set "From" email: `kai@zerosbykai.com`

**Email Limits:**
- Free tier: 3,000 emails/month
- Upgrade if you need more

### 3. **Fly.io** (Backend Hosting)
Sign up: https://fly.io

Install CLI:
```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

No API key needed - uses CLI login.

**Free Tier:**
- 3 shared-cpu-1x VMs
- 160GB outbound data transfer/month

### 4. **Vercel** (Frontend Hosting)
Sign up: https://vercel.com

Install CLI:
```bash
npm i -g vercel
vercel login
```

No API key needed - uses CLI login or GitHub integration.

**Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month

### 5. **Custom Secrets**

Set these yourself:
- ✅ `BUBBLELAB_WEBHOOK_SECRET` - Generate random string (e.g., `openssl rand -hex 32`)
- ✅ `ADMIN_PASSWORD` - Strong password for moderation panel
- ✅ `FRONTEND_URL` - Will be `https://zerosbykai.vercel.app` or your custom domain

---

## 🚀 Deployment Steps

### STEP 1: Deploy Backend (Fly.io)

```bash
cd backend

# Initialize Fly app
fly launch
# When prompted:
# - App name: zerosbykai-api (or your choice)
# - Region: Choose closest to your users (e.g., Mumbai = bom)
# - Postgres: Say NO (using Supabase)
# - Deploy now: Say NO (set secrets first)

# Set all secrets
fly secrets set \
  SUPABASE_URL="your_supabase_url" \
  SUPABASE_ANON_KEY="your_anon_key" \
  SUPABASE_SERVICE_KEY="your_service_key" \
  RESEND_API_KEY="your_resend_key" \
  BUBBLELAB_WEBHOOK_SECRET="your_generated_secret" \
  ADMIN_PASSWORD="your_secure_password" \
  FRONTEND_URL="https://zerosbykai.vercel.app" \
  NODE_ENV="production"

# Deploy
fly deploy

# Check status
fly status
fly logs

# Your API will be at: https://zerosbykai-api.fly.dev
```

### STEP 2: Deploy Frontend (Vercel)

```bash
cd ../frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: zerosbykai
# - Directory: ./
# - Override settings: No

# Set environment variables in Vercel dashboard:
# https://vercel.com/your-username/zerosbykai/settings/environment-variables

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://zerosbykai-api.fly.dev

# Redeploy after setting env vars
vercel --prod

# Your site will be at: https://zerosbykai.vercel.app
```

### STEP 3: Configure BubbleLab Webhook

In your BubbleLab flow, modify the code to POST to your API:

```typescript
// After generating ideas in BubbleLab:
await fetch('https://zerosbykai-api.fly.dev/api/webhook/bubblelab', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': 'your_webhook_secret_here'
  },
  body: JSON.stringify({
    batch_id: '2026-02-03',
    ideas: [
      {
        name: "IdeaName",
        title: "Full title",
        problem: "...",
        solution: "...",
        targetAudience: "...",
        whyItMatters: "...",
        sourceUrls: ["..."],
        tags: { geography: ["india"], category: ["cleantech"] }
      }
    ],
    metadata: {
      totalThreads: 2347,
      subreddits: ["india", "startups"]
    }
  })
});
```

### STEP 4: Test the Flow

1. **Send test ideas via webhook:**
```bash
curl -X POST https://zerosbykai-api.fly.dev/api/webhook/bubblelab \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your_secret" \
  -d '{
    "batch_id": "test-batch",
    "ideas": [{
      "name": "TestIdea",
      "title": "Test Startup Idea",
      "problem": "People hate testing",
      "solution": "Make testing fun",
      "targetAudience": "Developers",
      "whyItMatters": "Better software",
      "tags": {"geography": ["global"], "category": ["devtools"]}
    }]
  }'
```

2. **Moderate ideas:**
```bash
# List pending
curl -H "x-admin-password: your_password" \
  https://zerosbykai-api.fly.dev/api/admin/pending

# Approve
curl -X POST -H "x-admin-password: your_password" \
  https://zerosbykai-api.fly.dev/api/admin/approve/IDEA_ID

# Publish all approved
curl -X POST -H "x-admin-password: your_password" \
  https://zerosbykai-api.fly.dev/api/admin/publish
```

3. **Visit frontend:**
- Go to https://zerosbykai.vercel.app
- Sign up with magic link
- Vote on ideas

---

## 📧 Email Setup Checklist

### In Resend Dashboard:

1. **Add Domain**
   - Go to Domains > Add Domain
   - Enter: `zerosbykai.com`
   - Add DNS records to your domain provider:
     ```
     TXT @ v=spf1 include:_spf.resend.com ~all
     CNAME resend._domainkey resend._domainkey.resend.com
     CNAME resend2._domainkey resend2._domainkey.resend.com
     ```

2. **Verify Domain**
   - Wait for DNS propagation (~10 minutes)
   - Click "Verify" in Resend

3. **Test Email**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer your_resend_key" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "kai@zerosbykai.com",
       "to": "your@email.com",
       "subject": "Test from ZerosByKai",
       "html": "<p>It works!</p>"
     }'
   ```

---

## 🔄 Weekly Automation

Cron jobs run automatically on Fly.io:
- **Sunday 11 PM UTC**: Calculate winner, award badges
- **Monday 9 AM UTC**: Send weekly digest
- **Monday 9:15 AM UTC**: Send badge emails to winners

**Monitor cron jobs:**
```bash
fly logs --app zerosbykai-api | grep -i "cron\|winner\|digest\|badge"
```

---

## 🛠️ Moderation Workflow

### Option A: cURL Commands (Quick)
```bash
# List pending ideas
curl -H "x-admin-password: PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/pending

# Approve idea
curl -X POST -H "x-admin-password: PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/approve/IDEA_ID

# Reject idea
curl -X POST -H "x-admin-password: PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Not relevant"}' \
  https://zerosbykai-api.fly.dev/api/admin/reject/IDEA_ID

# Publish all approved
curl -X POST -H "x-admin-password: PASSWORD" \
  https://zerosbykai-api.fly.dev/api/admin/publish
```

### Option B: Build Simple Admin UI (Future)
Create `/admin` page in Next.js that calls these endpoints.

---

## 📊 Monitoring

### Backend Logs
```bash
fly logs --app zerosbykai-api
```

### Database (Supabase)
- Go to Supabase Dashboard > Table Editor
- View ideas, votes, badges tables

### Email Stats (Resend)
- Go to Resend Dashboard > Logs
- Check deliverability, opens (if enabled)

---

## 🐛 Troubleshooting

### Backend not responding
```bash
fly status
fly logs
# Check if app is running
```

### Emails not sending
```bash
# Check Resend logs in dashboard
# Verify domain is verified
# Check API key is correct
```

### Frontend can't reach backend
```bash
# Check NEXT_PUBLIC_API_URL is correct
# Check CORS settings in backend
# Verify Fly.io app is running
```

### Supabase RLS issues
```bash
# Go to Supabase Dashboard > Authentication > Policies
# Make sure RLS policies are enabled correctly
# Check SQL Editor for errors
```

---

## 💰 Cost Estimate (Free Tier)

- **Supabase**: Free (500MB database, 50,000 monthly active users)
- **Resend**: Free (3,000 emails/month)
- **Fly.io**: Free (3 shared VMs)
- **Vercel**: Free (100GB bandwidth/month)

**Total: $0/month for MVP** (until you scale)

---

## ✅ Final Checklist

Before launch:
- [ ] Supabase project created + schema.sql run
- [ ] Resend domain verified
- [ ] Backend deployed to Fly.io
- [ ] Frontend deployed to Vercel
- [ ] BubbleLab webhook configured
- [ ] Test signup flow works
- [ ] Test voting works
- [ ] Test moderation works
- [ ] Custom domain connected (optional)
- [ ] Monitor cron jobs (Sunday/Monday)

---

## 🚨 Important Notes

1. **Magic Links**: Supabase sends magic link emails. Make sure Supabase email settings are configured.

2. **One Vote Per Week**: Users can only vote once per week. They can change their vote anytime.

3. **Badge Emails**: Sent Monday 9:15 AM to users who picked winning idea.

4. **Moderation**: Review ideas Thursday-Sunday, publish before Monday 9 AM.

5. **Kai Image**: Replace placeholder in landing page with actual Kai character image.

---

## 📞 Need Help?

- Supabase: https://supabase.com/docs
- Resend: https://resend.com/docs
- Fly.io: https://fly.io/docs
- Vercel: https://vercel.com/docs

---

**Built with ❤️ for finding the right zero.**
