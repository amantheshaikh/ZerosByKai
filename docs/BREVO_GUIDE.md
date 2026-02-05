# Brevo Integration Guide for ZerosByKai

This guide explains how to leverage the full platform capabilities of Brevo (formerly Sendinblue) for your application.

## 1. Analytics & Reporting

Since ZerosByKai sends emails using Brevo's Transactional API, you have built-in analytics.

### Accessing Reports
1. **Login** to your Brevo Dashboard.
2. Navigate to **Transactional** > **Statistics**.
3. You will see:
   - **Delivered**: Successful sends.
   - **Opened**: Open rates (Brevo inserts a tracking pixel).
   - **Clicked**: Click rates (Brevo re-writes links to track clicks).
   - **Bounced/Blocked**: Delivery failures.

> **Note:** Ensure "Tags" are used correctly in code (`weekly-digest`, `welcome`) to filter stats by email type.

### Detailed Logs
- Go to **Transactional** > **Logs** to search for specific emails (e.g., by recipient `kai@zerosbykai.com`).
- This is useful for debugging why a specific user didn't get an email.

## 2. Contact Management

Your backend automatically syncs users to Brevo when they sign up or log in.

### The Sync Logic
- **File:** `backend/src/services/brevoService.js`
- **Trigger:** Happens in `backend/src/routes/auth.js` (`/post-login` hook).
- **Behavior:**
  - Creates the contact if they don't exist.
  - Updates their attributes (FIRSTNAME, LASTNAME) if they do.
  - Adds them to **List ID 2** (Default).

### Action Required
1. Go to **Contacts** > **Lists** in Brevo.
2. Verify you have a list for "Weekly Newsletter".
3. Note its **ID**.
4. Update `backend/src/services/brevoService.js` if your ID is not `2`.

```javascript
// backend/src/services/brevoService.js
listIds: [2] // <-- Change this if your list ID is different
```

## 3. Email Templates

Currently, your email templates (`welcome.js`, `weekly-digest.js`) are **coded in JavaScript**.
- **Pros:** Full control over dynamic data (lists of ideas), version controlled (Git).
- **Cons:** Harder to edit design visually.

### Previewing Templates
You can send test emails to yourself without migrating to Brevo's builder:
```bash
# Run from project root
node backend/src/workflows/preview_templates.js your@email.com
```

### Migrating to Brevo Drag-and-Drop (Optional)
If you prefer to design emails in Brevo:
1. Create a template in Brevo Design Tool.
2. Use variables like `{{ params.name }}` or `{{ params.ideas }}`.
3. Get the **Template ID** (e.g., 5).
4. Update `emailService.js` to use `templateId: 5` instead of `htmlContent`.

## 4. Webhooks (Advanced)

To get real-time data back into your app (e.g., "Mark user as Bounced in Supabase"):

1. Go to **Transactional** > **Settings** > **Webhooks**.
2. Add a new Webhook.
3. **URL:** `https://your-api.fly.dev/api/brevo/webhook` (You need to build this endpoint).
4. **Events:** Check "Hard Bounce", "Complaint", "Delivered".

> *Note: This feature is not yet implemented in `server.js`. Currently, Brevo handles suppression of bounced emails automatically.*

## 5. Batch Sending (High Performance)

For the weekly newsletter, we use **Batch Sending** to deliver emails efficiently.

- **Strategy**: Client-side Batching (Parallel Requests)
- **Batch Size**: 50 emails per chunk.
- **Logic**:
  - We process subscribers in chunks of 50.
  - We use `Promise.allSettled` to send parallel requests for improved speed.
  - Each email is fully personalized with unique Unsubscribe/Login tokens.

### Deployment Note
This approach ensures high throughput while retaining full control over personalization. Brevo handles the high concurrency well.

