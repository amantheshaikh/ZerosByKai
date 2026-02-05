---
description: Deploy application to production (Frontend Build + Fly.io Backend)
---

1. Verify we're on the main branch.
2. Pull latest changes to ensure we're up to date.
// turbo
3. Run `git pull origin main`
4. **Frontend**: Build the frontend to verify there are no build errors.
// turbo
5. Run `cd frontend && npm install && npm run build`
6. **Backend**: Verify critical environment variables are present in `backend/.env`.
// turbo
7. Run `grep -E "SUPABASE_URL|SUPABASE_SERVICE_KEY|BREVO_API_KEY|GEMINI_API_KEY" backend/.env`
8. **Backend**: Create a database backup before deploying (Safety First).
7. Run `flyctl postgres backup create`
8. Ask user for final confirmation before deploying to Fly.io.
9. **Backend**: Deploy to production.
10. Run `cd backend && flyctl deploy`
11. Verify deployment succeeded by checking the live URL and logs.
12. Run `flyctl logs --app zerosbykai-api` (Optional check)
13. Create a git tag for this release.
// turbo
14. Run `git tag -a v[version] -m "Production release [version]"`
15. Push the tag to remote.
// turbo
16. Run `git push origin v[version]`
