# Implementation Plan - Fix Fly.io Deployment

The backend application on Fly.io is entering a restart loop because it fails to bind to the correct network interface (`0.0.0.0`) or port, causing health checks to fail.

## Proposed Changes

### Backend `server.js`
- **Goal**: Ensure the server listens on `0.0.0.0` (all interfaces) instead of the default (which might be `localhost` or IPv6 only depending on Node version).
- **Change**: Update `app.listen` to explicitly specify `0.0.0.0`.

### Fly.io Configuration
- **Goal**: Align the `PORT` environment variable with `fly.toml`.
- **Action**: Set `PORT=3001` via `fly secrets set` to ensure the application listens on the port Fly.io's proxy expects.

---

## Verification Plan

### Automated
1. **Health Check**:
   - Run `curl https://zerosbykai-api-prod.fly.dev/health`
   - Expect: `200 OK` with `{"status":"ok"}`

### Manual
1. **Seeding**:
   - Retry the `curl` command to seed the test idea.
   - Verify it returns a success response.
