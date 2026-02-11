# ZerosByKai Master Workflow

This document maps out the entire lifecycle of a newsletter edition, from raw idea generation to email delivery.

## 0. The Flow at a Glance
1.  **Generate** (Manual): You run scrapers to fill the backlog.
2.  **Approve** (Manual): You review backlog ideas in Supabase and mark 10+ as "approved".
3.  **Schedule** (Manual): You pick ONE batch (10 ideas) for the next week and "lock" it.
4.  **Check** (Automated): System monitors if you forgot to schedule (Wed/Fri/Sun).
5.  **Send** (Automated): System calculates winner & sends email (Monday).

---

## 1. Step 1: Generate Ideas (Multi-source Scraper)
**Goal**: Populate the database with fresh raw ideas.
**Command**: `npm run scrape:local`
**Logic**:
- Fetches posts from Reddit, HackerNews, IndieHackers, X.
- Uses Gemini AI to filter noise and generate **up to 40** high-quality "Zero" ideas.
- **Outcome**: New rows added to `ideas` table with `status = 'backlog'`.

## 2. Step 2: Approve Ideas (Curator)
**Goal**: Select high-quality ideas for publication.
**Action**: Go to Supabase Dashboard > `ideas` table.
**Logic**:
- Review items with `status = 'backlog'`.
- If an idea is good: change `status` to `'approved'`.
- You need at least **10 approved ideas** to schedule a newsletter.

## 3. Step 3: Schedule Newsletter (The Publisher)
**Goal**: Lock in the 10 ideas for the upcoming Monday.
**Command**: `npm run schedule -- --weeks 1`
**Logic**:
- Selects the **10 OLDEST approved** ideas (FIFO from Approved pool).
    - *Why FIFO? To ensure older approved ideas are eventually published and don't get stuck.*
- sets `status = 'scheduled'` and assigns `week_published` to next Monday.
- **Note**: `scheduled` ideas are **NOT visible** on the website yet.
- Generates a **Subject Line** using AI.
- **Outcome**: A new row in `weekly_batches`. 10 ideas marked as `scheduled`.

## 4. Step 4: Health Monitor (The Safety Net)
**Goal**: Ensure you don't forget Step 3.
**Running**: Automatically on **Wed, Fri, Sun**.
**Logic**:
- Checks: "Is there a batch scheduled for *Next Monday* with a **Subject Line** and 10 ideas?"
- **If No**: Checks "Do we have enough *approved* ideas?" (Context).
- Sends you an email reminder with the status of your Approved Queue.

## 5. Step 5: Execution (Monday Morning)
**Goal**: Deliver the email.
**Running**: GitHub Actions (`.github/workflows/weekly-digest.yml`) — **Monday 14:00 UTC (9 AM EST)**.
**Command**: `node src/jobs/weekly.js --scheduled`
**Logic**:
1. **Calculate Winner**: Looks at the *Previous Week's* batch. Uses pre-calculated `vote_count` for O(1) efficiency. Determines winner.
   - Awards badges and **archives** last week's ideas.
2. **Publish**: Finds ideas scheduled for *this week* and flips status `scheduled` -> `published`.
   - *Now they receive public visibility on the site.*
3. **Send Digest**:
   - Sends per-subscriber params to **Brevo-hosted template** (`BREVO_WEEKLY_DIGEST_TEMPLATE_ID`). No server-side HTML generation.
   - **Optimization**: Sends in batches of 50 via `sendBatchEmailsWithTemplate()`. Each email gets personalized unsubscribe/login tokens.
   - **RFC 8058**: Includes `List-Unsubscribe` and `List-Unsubscribe-Post` headers for one-click unsubscribe support in major clients (Gmail, Outlook).
   - Subject line pulled from `weekly_batches.subject_line` (Supabase) or uses AI-generated default.
   - If NO scheduled batch is found: **Stops**. Sends nothing.

---

## Technical Mapping

| Step | Action | Logic Location | Cron / Command |
| :--- | :--- | :--- | :--- |
| **1. Generate** | Scrape & AI | `backend/src/jobs/scrapers/` | `npm run scrape:local` |
| **2. Approve** | Review | Supabase Dashboard | *Manual UI Action* |
| **3. Schedule** | Pick & Lock | `backend/src/services/newsletterService.js` | `npm run schedule` |
| **4. Check** | Monitor | `backend/src/jobs/backlog_check.js` | `0 9 * * 0,3,5` |
| **5. Execute** | Publish & Send | `backend/src/jobs/weekly.js` | GitHub Actions (`0 14 * * 1`) |
