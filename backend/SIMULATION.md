# Email Simulation Scripts

Use these commands to simulate and send emails to yourself for testing.

**Prerequisites:**
- Ensure you are in the `backend` directory.
- Ensure your `.env` file is set up with `RESEND_API_KEY` (and `DATABASE_URL` for the newsletter).

## 1. Simulate Welcome Email
This script sends a welcome email to `amantheshaikh@gmail.com`.

```bash
cd backend
node src/workflows/simulate_welcome.js
```

## 2. Simulate Weekly Newsletter
This script fetches the latest ideas from the database and sends a weekly digest email to `amantheshaikh@gmail.com`.

```bash
cd backend
node src/workflows/simulate_newsletter.js
```
