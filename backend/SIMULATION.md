# Testing & Simulation Guide

Use these scripts to test workflows and emails locally before deploying to production.

**Prerequisites:**
- Ensure you are in the `backend` directory
- Ensure your `.env` file is set up with all required keys
- Database should have some test data for realistic testing

---

## 🧪 Workflow Simulations

### 1. Simulate Full Monday Workflow
**What it does:** Runs all 3 Monday cron job functions in sequence:
1. Auto-publish pending ideas
2. Calculate last week's winner
3. Send weekly digest emails

```bash
cd backend
node src/workflows/simulate_monday_workflow.js
```

**Expected output:**
- Pending ideas moved to published
- Winner calculated and badges awarded
- Weekly digest email sent to your email

---

### 2. Simulate Reddit Scraping (Sunday Workflow)
**What it does:** 
- Scrapes Reddit for startup-related posts
- Generates 10 ideas using Gemini AI
- Saves ideas to database as `pending`

```bash
cd backend
node src/jobs/reddit_scraper.js
```

**Expected output:**
- ~150 posts scraped from 17+ subreddits
- 10 ideas generated
- Ideas saved to database
- Admin notification email sent

**Note:** This is the actual production script, not a simulation.

---

## 📧 Email Simulations

All email simulations send to `amantheshaikh@gmail.com` by default.

### 1. Simulate Welcome Email
**What it does:** Sends a welcome email to new subscribers.

```bash
cd backend
node src/workflows/simulate_welcome.js
```

**Email preview:**
- Subject: "Welcome to ZerosByKai"
- Content: Welcome message + CTA to browse ideas

---

### 2. Simulate Weekly Newsletter
**What it does:** 
- Fetches latest published ideas from database
- Generates weekly digest email
- Sends to your email with auto-login token

```bash
cd backend
node src/workflows/simulate_newsletter.js
```

**Email preview:**
- Subject: "Kai's Zeros: Week of [date]"
- Content: 10 ideas + last week's winner + CTA
- Auto-login: Click link to auto-sign in

**Requirements:**
- Database must have published ideas
- You must have a user account in Supabase

---

### 3. Simulate Magic Link Email
**What it does:** Sends a magic link authentication email.

```bash
cd backend
node src/workflows/simulate_magic_link.js
```

**Email preview:**
- Subject: "Your Login Link"
- Content: Magic link button + expiration notice

---

## 🔍 Testing Checklist

### Before Deploying to Production

- [ ] **Test Reddit Scraping**
  ```bash
  node src/jobs/reddit_scraper.js
  ```
  - Verify 10 ideas are generated
  - Check ideas are saved to database
  - Confirm admin email is sent

- [ ] **Test Monday Workflow**
  ```bash
  node src/workflows/simulate_monday_workflow.js
  ```
  - Verify ideas are published
  - Check winner is calculated
  - Confirm weekly digest is sent

- [ ] **Test All Email Templates**
  ```bash
  node src/workflows/simulate_welcome.js
  node src/workflows/simulate_newsletter.js
  node src/workflows/simulate_magic_link.js
  ```
  - Verify emails arrive in inbox
  - Check formatting is correct
  - Test all links work

- [ ] **Test Auto-Login**
  - Receive weekly digest email
  - Click main CTA link
  - Verify you're automatically signed in

- [ ] **Test Authentication Flows**
  - Newsletter-only subscription
  - Magic link sign-in
  - Google OAuth sign-in
  - Sign out

---

## 🐛 Debugging Tips

### Email not arriving?
1. Check Resend dashboard: https://resend.com/emails
2. Verify `RESEND_API_KEY` is set
3. Check spam folder
4. Ensure `kai@zerosbykai.com` is verified in Resend

### Ideas not generating?
1. Check `GEMINI_API_KEY` is valid
2. Verify API quota hasn't been exceeded
3. Check console for error messages
4. Try with smaller batch size

### Database errors?
1. Verify Supabase keys are correct
2. Check database schema is up to date
3. Ensure RLS policies allow operations
4. Check Supabase logs

### Auto-login not working?
1. Verify `JWT_SECRET` is set
2. Check token hasn't expired (7 days)
3. Ensure frontend can reach backend API
4. Check browser console for errors

---

## 📊 Expected Results

### Reddit Scraping
```
Scraping r/Business_Ideas [hot]...
Waiting 2.3s before next chunk...
Scraping r/SaaS [hot]...
...
Total posts scraped: 150
Generating 5 ideas from batch 1/2...
✅ Generated 5 ideas (Total: 5/10)
Generating 5 ideas from batch 2/2...
✅ Generated 5 ideas (Total: 10/10)
✅ Successfully generated 10 ideas!
📊 Final result: 10 validated ideas.
```

### Monday Workflow
```
Auto-published 10 ideas for week 2026-02-03
Winner: IdeaName with 15 votes
Awarded badges to 15 users
Sending digest to 42 active subscribers
Weekly digest sent successfully
```

### Email Simulation
```
Sending welcome email to amantheshaikh@gmail.com...
✅ Email sent successfully!
Email ID: abc123...
```

---

## 🚀 Production Deployment

After testing locally:

1. **Commit changes**
   ```bash
   git add .
   git commit -m "Update workflows and email templates"
   git push
   ```

2. **Deploy backend**
   ```bash
   cd backend
   fly deploy
   ```

3. **Verify cron jobs**
   ```bash
   fly logs
   ```

4. **Monitor first run**
   - Sunday 10 AM UTC: Check Reddit scraping
   - Monday 9 AM UTC: Check weekly digest

---

## 📝 Simulation Script Locations

| Script | Path | Purpose |
|--------|------|---------|
| Monday Workflow | `src/workflows/simulate_monday_workflow.js` | Full Monday flow |
| Reddit Scraping | `src/jobs/reddit_scraper.js` | Sunday scraping |
| Welcome Email | `src/workflows/simulate_welcome.js` | Welcome email |
| Weekly Newsletter | `src/workflows/simulate_newsletter.js` | Weekly digest |
| Magic Link | `src/workflows/simulate_magic_link.js` | Magic link email |

---

**Last Updated**: 2026-02-02
