# 🚀 DEPLOYMENT: MAKE IT LIVE NOW

This guide is optimized for immediate deployment.

## ✅ Pre-requisites Verified
- Backend Code: Ready (Node.js/Express)
- Frontend Code: Ready (Next.js with Landing Page)
- Dependencies: Installed
- Build: Verified (Frontend builds successfully)

---

## STEP 1: Supabase (Database)

1. **Create Project**: Go to [database.new](https://database.new)
2. **Setup Schema**:
   - Go to **SQL Editor** in Supabase dashboard.
   - Copy content of `backend/schema.sql`.
   - Run it to create tables.
3. **Get Secrets**:
   - Go to **Project Settings > API**.
   - Copy `Project URL`, `anon public key`, `service_role key`.

---

## STEP 2: Deploy Backend (Fly.io)

Run these commands in your terminal:

```bash
cd zerosbykai-fullstack/backend

# 1. Initialize App (Press Enter for defaults, No to Postgres/Redis)
fly launch --name zerosbykai-api --region bom --no-deploy

# 2. Set Secrets (Replace values!)
fly secrets set \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_ANON_KEY="your-anon-key" \
  SUPABASE_SERVICE_KEY="your-service-key" \
  RESEND_API_KEY="re_123456" \
  BUBBLELAB_WEBHOOK_SECRET="make-up-a-secret" \
  ADMIN_PASSWORD="make-up-a-password" \
  NODE_ENV="production"

# 3. Deploy
fly deploy
```

> **Note**: Copy the deployed URL (e.g., `https://zerosbykai-api.fly.dev`)

---

## STEP 3: Deploy Frontend (Vercel)

Run these commands:

```bash
cd ../frontend

# 1. Deploy
vercel

# Follow prompts:
# - Set up and deploy? [Y]
# - Scope? [Enter]
# - Link to existing project? [N]
# - Project name? [zerosbykai]
# - Directory? [./]
# - Settings? [N]
```

**Go to Vercel Dashboard for this project > Settings > Environment Variables:**
Add:
- `NEXT_PUBLIC_API_URL` = `https://zerosbykai-api.fly.dev` (Your backend URL)
- `NEXT_PUBLIC_SUPABASE_URL` = (Same as backend)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Same as backend)

**Finally, redeploy for variables to take effect:**
```bash
vercel --prod
```

---

## STEP 4: Live! 🚀

Your site is now live at `https://zerosbykai.vercel.app` (or similar).
