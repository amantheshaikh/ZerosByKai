# 🧪 Full Stack Testing Guide

Now that both Backend (Fly.io) and Frontend (Vercel) are live, follow these steps to verify everything works together.

## 1. Verify Backend Health
Ensure your API is running and accessible.
- **Click this link**: [https://zerosbykai-api-prod.fly.dev/health](https://zerosbykai-api-prod.fly.dev/health)
- **Expected Result**: `{"status":"ok","service":"zerosbykai-api"}`

## 2. Seed Test Data (Important!)
Since your database is new, it's empty. The frontend will look broken (empty lists) until we add data.
Run this command in your **terminal** to manually add a test idea:

```bash
curl -X POST https://zerosbykai-api-prod.fly.dev/api/webhook/bubblelab \
  -H "x-webhook-secret: jkbsadfgh7y247yr8uhjfabnwjds738" \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "test-batch-001",
    "ideas": [{
      "name": "TestIdea",
      "title": "A Test Startup Idea",
      "problem": "Testing production apps is hard without data.",
      "solution": "A manual seed command that instantly populates the DB.",
      "targetAudience": "Developers",
      "whyItMatters": "It saves time.",
      "tags": {"geography": ["global"], "category": ["devtools"]},
      "sourceUrls": ["https://reddit.com/r/startups"]
    }]
  }'
```

Then, **Approve & Publish** it (as Admin):

```bash
# 1. Get the Idea ID (copy the "id" from the output)
curl -H "x-admin-password: A1m13a1n14_@" https://zerosbykai-api-prod.fly.dev/api/admin/pending

# 2. Approve it (Replace IDEA_ID_HERE with the actual ID)
curl -X POST -H "x-admin-password: A1m13a1n14_@" \
  https://zerosbykai-api-prod.fly.dev/api/admin/approve/IDEA_ID_HERE

# 3. Publish it
curl -X POST -H "x-admin-password: A1m13a1n14_@" \
  https://zerosbykai-api-prod.fly.dev/api/admin/publish
```

## 3. Test Frontend Flow
Go to your Vercel URL (e.g., `https://zerosbykai.vercel.app`).

### A. Signup (Magic Link)
1.  Enter your Name and **real Email** in the hero section.
2.  Click **"JOIN 547+ FOUNDERS"**.
3.  **Check**: Do you get a browser alert saying "Welcome aboard"?
4.  **Check**: Do you receive an email from `Supabase` (or your configured sender)?
    *   *Note: If you haven't configured a custom SMTP provider in Supabase, emails might be rate-limited or go to spam.*

### B. View Ideas
1.  Scroll down to "This Week's Zeros".
2.  **Check**: Do you see the "TestIdea" we just seeded?

### C. Vote (Requires Login)
1.  Click the link in your email to log in.
2.  Click "I'D BUILD THIS" on the idea card.
3.  **Check**: Does the button state change?

## 4. Debugging
If something fails:
- **Backend Logs**: `fly logs -a zerosbykai-api-prod`
- **Frontend Logs**: Vercel Dashboard > Logs
