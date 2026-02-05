# ZerosByKai - Comprehensive Code Review

**Date:** February 5, 2026  
**Project:** AI-powered startup idea curation platform (Reddit → AI → Newsletter)  
**Reviewed:** Backend (Node.js/Express), Frontend (Next.js/React), Database (Supabase PostgreSQL)

---

## Executive Summary

ZerosByKai is a well-structured platform with solid architectural decisions and good separation of concerns. The codebase demonstrates thoughtful implementation of modern best practices, but has several areas requiring attention for production readiness, security hardening, and maintainability improvements.

**Overall Assessment:** ✅ Good foundation | ⚠️ Several improvements needed

---

## 🔴 CRITICAL ISSUES

### 1. **Missing Error Recovery in Weekly Newsletter Job**
**Severity:** HIGH  
**File:** `backend/src/server.js` (lines 80-96)

The Monday cron job runs two sequential operations (`calculateWinner()` and `sendWeeklyDigest()`). If the winner calculation fails, the system still attempts to send the digest, which may fail or send incorrect data.

```javascript
// Current: Each operation catches errors independently, but job continues
cron.schedule('0 9 * * 1', async () => {
  try {
    await calculateWinner();
  } catch (error) {
    console.error('Error calculating winner:', error);
    // Job continues regardless!
  }
  
  try {
    await sendWeeklyDigest();
  } catch (error) {
    console.error('Error in weekly digest:', error);
  }
});
```

**Recommendation:**
```javascript
// Better: Implement circuit breaker pattern or transaction-like semantics
cron.schedule('0 9 * * 1', async () => {
  console.log('🚀 Starting weekly Monday workflow...');
  
  try {
    const winner = await calculateWinner();
    if (!winner) {
      throw new Error('Failed to calculate winner - aborting newsletter send');
    }
    
    await sendWeeklyDigest();
    console.log('✅ Weekly workflow completed successfully');
  } catch (error) {
    console.error('❌ Weekly workflow failed:', error.message);
    // TODO: Alert admin, implement retry logic, or queue for manual review
    await notifyAdmin(`Weekly workflow failed: ${error.message}`);
  }
});
```

---

### 2. **Unsafe Email Token Verification Without Rate Limiting**
**Severity:** HIGH  
**File:** `backend/src/routes/auth.js` (line 150+)

The `/api/auth/verify-email-token` endpoint lacks rate limiting, making it vulnerable to brute force attacks against email tokens.

**Current Issue:**
- No rate limiter on token verification endpoint
- Email tokens from digests are time-limited but not validated for reuse
- No logging of failed attempts

**Recommendation:**
```javascript
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes per IP
  skipSuccessfulRequests: true, // Only count failures
  message: { error: 'Too many token verification attempts. Please request a new link.' }
});

router.post('/verify-email-token', tokenLimiter, async (req, res) => {
  // ... implementation
});
```

---

### 3. **Missing Input Validation on AI Service**
**Severity:** MEDIUM  
**File:** `backend/src/services/aiService.js`

The `generateIdeas()` and `generateNewsletterSubject()` methods don't validate input before sending to Gemini API.

**Issues:**
- No check for empty `posts` array
- No validation of `count` parameter (could be invalid number)
- No sanitization of exclusion list items
- Unlimited prompt size could cause API failures

**Recommendation:**
```javascript
async generateIdeas(posts, count) {
  // Validation
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('Posts array is required and must not be empty');
  }
  
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error('Count must be an integer between 1 and 20');
  }
  
  if (this.exclusionList.length > 100) {
    throw new Error('Exclusion list too large (max 100 items)');
  }
  
  // Sanitize posts to prevent prompt injection
  const sanitizedPosts = posts.map(post => ({
    ...post,
    text: (post.text || '').substring(0, 5000) // Limit post size
  }));
  
  // ... rest of implementation
}
```

---

### 4. **Frontend Auth Token Persistence Issue**
**Severity:** MEDIUM  
**File:** `frontend/lib/auth.js` (lines 110-160)

The `checkEmailToken()` function cleans URL parameters but doesn't validate token format or expiration before attempting to use it.

**Issues:**
- Token is extracted and used without format validation
- No timeout for token verification request
- URL cleanup happens after token use (minor race condition risk)
- No token expiration validation

**Recommendation:**
```javascript
const checkEmailToken = useCallback(async () => {
  if (typeof window === 'undefined') return;
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) return;
  
  // Validate token format before use
  if (typeof token !== 'string' || token.length < 20) {
    console.error('Invalid token format');
    urlParams.delete('token');
    window.history.replaceState({}, '', new URL(window.location.href).toString());
    return;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const data = await apiFetch('/api/auth/verify-email-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (data?.session) {
      // Clean up URL BEFORE setting session
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.toString());
      
      await supabase.auth.setSession(data.session);
    }
  } catch (error) {
    // Handle timeout vs other errors
    if (error.name === 'AbortError') {
      console.error('Token verification timeout');
    }
  }
}, [supabase]);
```

---

### 5. **No CSRF Protection on State-Changing Operations**
**Severity:** MEDIUM  
**File:** `backend/src/routes/votes.js` and `auth.js`

POST endpoints lack CSRF token validation. While rate limiting exists, CSRF attacks from authenticated contexts aren't protected against.

**Recommendation:**
- Implement SameSite cookie attributes (add to production setup)
- Consider implementing double-submit cookie pattern for public endpoints
- Use POST/PUT/DELETE for state changes (✅ already done)
- Add CSRF token validation for sensitive operations

```javascript
// In vote submission
router.post('/', async (req, res) => {
  const { ideaId, csrfToken } = req.body;
  
  // Validate CSRF token from session
  if (!validateCSRFToken(req.session.csrfToken, csrfToken)) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  // ... rest of implementation
});
```

---

## 🟡 MAJOR ISSUES

### 6. **Hardcoded Fallback Secrets in Production Code**
**Severity:** HIGH  
**File:** `backend/src/config/env.js` (lines 40-41)

```javascript
jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
emailTokenSecret: process.env.EMAIL_TOKEN_SECRET || process.env.JWT_SECRET,
```

Fallback secrets are visible in source code and should never exist in production.

**Recommendation:**
```javascript
const requiredEnvVars = ['JWT_SECRET', 'EMAIL_TOKEN_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    const message = `❌ FATAL: Required environment variable missing: ${envVar}`;
    console.error(message);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }
  }
}

export const config = {
  // ... other config
  jwtSecret: process.env.JWT_SECRET,
  emailTokenSecret: process.env.EMAIL_TOKEN_SECRET,
  // ... no fallbacks
};
```

---

### 7. **Inefficient Vote Counting in Leaderboard Query**
**Severity:** MEDIUM  
**File:** `backend/src/routes/ideas.js` (lines 44-54)

The leaderboard endpoint fetches all ideas, then makes an N+1 query for each idea's vote count.

```javascript
// Current: N+1 query problem
const ideasWithVotes = await Promise.all(ideas.map(async (idea) => {
  const { count } = await supabaseAdmin
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('idea_id', idea.id);
  return { ...idea, votes: count || 0 };
}));
```

**Recommendation:**
```javascript
// Better: Single query with aggregation
const { data: ideasWithVotes, error } = await supabaseAdmin
  .from('ideas')
  .select(`
    *,
    votes: votes(count)
  `)
  .eq('week_published', weekStart)
  .or('status.eq.published,is_winner.eq.true');

if (error) throw error;

// Transform and sort in memory
const sorted = (ideasWithVotes || [])
  .map(idea => ({
    ...idea,
    votes: Array.isArray(idea.votes) ? idea.votes.length : 0
  }))
  .sort((a, b) => b.votes - a.votes)
  .slice(0, 3);
```

---

### 8. **Unhandled Promise Rejection in Auth Routes**
**Severity:** MEDIUM  
**File:** `backend/src/routes/auth.js` (lines 88-100)

Fire-and-forget operations don't have proper error tracking:

```javascript
// Current: No error handling or retry
syncContact({ email, name }).catch(err => {
  console.error(`❌ Failed to sync contact for ${email}:`, err.message);
});
```

**Recommendation:**
```javascript
// Add retry logic with exponential backoff
async function syncContactWithRetry(email, name, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await syncContact({ email, name });
      return;
    } catch (err) {
      lastError = err;
      const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.warn(`Sync failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  console.error(`❌ Failed to sync contact after ${maxRetries} attempts:`, lastError.message);
  // Queue for manual retry or dead letter queue
  await queueFailedSync({ email, name, error: lastError.message });
}
```

---

### 9. **Missing Pagination in Archive Endpoint**
**Severity:** MEDIUM  
**File:** `backend/src/routes/ideas.js` (weekly-batches endpoint)

Fetching all historical batches without pagination could cause memory issues and slow response times.

**Recommendation:**
```javascript
router.get('/weekly-batches', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;
    
    // Get total count
    const { count: total } = await supabase
      .from('weekly_batches')
      .select('*', { count: 'exact', head: true })
      .order('week_start_date', { ascending: false });
    
    // Get paginated results
    const { data: batches } = await supabase
      .from('weekly_batches')
      .select('*')
      .order('week_start_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    res.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 10. **Frontend Fetch Calls Don't Handle Slow Networks**
**Severity:** MEDIUM  
**File:** `frontend/lib/ideas.js`

Fetch calls lack timeout handling, causing indefinite hangs on slow networks.

```javascript
// Current: No timeout
export async function fetchCurrentWeekIdeas() {
  try {
    const url = `${getApiUrl()}/api/ideas/weekly`;
    const res = await fetch(url);
    // Could hang forever if network is slow
```

**Recommendation:**
```javascript
function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

export async function fetchCurrentWeekIdeas(timeoutMs = 10000) {
  try {
    const url = `${getApiUrl()}/api/ideas/weekly`;
    const res = await fetchWithTimeout(url, {}, timeoutMs);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.ideas || []).map(normalizeIdea);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timeout - network may be slow');
    }
    return [];
  }
}
```

---

## 🟠 SIGNIFICANT ISSUES

### 11. **Missing Database Connection Pool Configuration**
**Severity:** MEDIUM  
**File:** `backend/src/config/supabase.js`

Supabase client is instantiated without connection pool configuration.

**Recommendation:**
```javascript
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
  {
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    // Consider using a connection pool for high-traffic scenarios
    // This would require a PostgreSQL proxy like PgBouncer
  }
);
```

---

### 12. **No Request/Response Logging or Monitoring**
**Severity:** MEDIUM  
**File:** `backend/src/server.js`

Missing observability makes debugging production issues difficult.

**Recommendation:**
```javascript
import morgan from 'morgan'; // Or similar logging middleware

// Add request logging
app.use(morgan(':method :url :status :response-time ms', {
  skip: (req) => req.path === '/health' // Don't log health checks
}));

// Add structured logging for errors
app.use((err, req, res, next) => {
  console.error('Request Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: err.status || 500,
    message: err.message,
    requestId: req.id
  });
  
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    requestId: req.id
  });
});
```

---

### 13. **Frontend Auth Context Doesn't Handle Session Expiry**
**Severity:** MEDIUM  
**File:** `frontend/lib/auth.js` (session management)

No automatic session refresh when JWT expires, causing abrupt logouts.

**Recommendation:**
```javascript
useEffect(() => {
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Session refreshed');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
    }
  );
  
  return () => subscription?.unsubscribe();
}, [supabase.auth]);

// Implement token refresh 5 minutes before expiry
useEffect(() => {
  if (!session?.expires_at) return;
  
  const expiresAt = new Date(session.expires_at * 1000);
  const now = new Date();
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // 5 minutes before
  
  if (refreshTime <= 0) {
    // Token already expiring soon, refresh now
    supabase.auth.refreshSession();
    return;
  }
  
  const timeoutId = setTimeout(() => {
    supabase.auth.refreshSession();
  }, refreshTime);
  
  return () => clearTimeout(timeoutId);
}, [session, supabase.auth]);
```

---

### 14. **Race Condition in Auth Modal State**
**Severity:** MEDIUM  
**File:** `frontend/lib/auth.js`

Multiple operations can modify `postLoginProcessed` without synchronization:

```javascript
const postLoginProcessed = useRef(new Set());

// Issue: Race condition if multiple callbacks fire simultaneously
if (!postLoginProcessed.current.has(email)) {
  postLoginProcessed.current.add(email);
  // ... process login
}
```

**Recommendation:**
```javascript
const postLoginLock = useRef(new Map()); // email -> Promise

async function processPostLogin(email) {
  // If already processing, wait for the first one
  if (postLoginLock.current.has(email)) {
    return postLoginLock.current.get(email);
  }
  
  const promise = (async () => {
    try {
      // ... do post-login processing
    } finally {
      postLoginLock.current.delete(email);
    }
  })();
  
  postLoginLock.current.set(email, promise);
  return promise;
}
```

---

### 15. **Environment Variable Validation Only at Runtime**
**Severity:** LOW-MEDIUM  
**File:** `backend/src/config/env.js`

Environment variables are only validated when specific code paths execute, delaying discovery of misconfiguration.

**Recommendation:**
```javascript
// At module load time, validate all required vars
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'GEMINI_API_KEY'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  throw new Error(`Missing required env vars: ${missingVars.join(', ')}`);
}
```

---

## 🟡 CODE QUALITY ISSUES

### 16. **Inconsistent Error Handling Patterns**

**Issue:** Mix of try-catch, .catch(), and promise chains makes error flow unclear.

**Example - inconsistent:**
```javascript
// Pattern 1: try-catch
try {
  await operation();
} catch (error) {
  console.error(error);
}

// Pattern 2: .catch()
operation().catch(err => console.error(err));

// Pattern 3: Unhandled rejection
asyncFunction(); // Fire-and-forget, easy to miss errors
```

**Recommendation:** Standardize on async/await with try-catch for synchronous error handling.

---

### 17. **Magic Numbers Throughout Codebase**

**Issues Found:**
- `parseInt(process.env.BREVO_LIST_ID || '2', 10)` - Why 2?
- `max: 100 in production rate limiters` - Why 100?
- `max: 1000 in dev` - Why 1000?
- `10s timeout in AI service retry` - Why 10 seconds?

**Recommendation:**
```javascript
// Create a constants file
export const CONSTANTS = {
  RATE_LIMIT: {
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX_PROD: 15,
    AUTH_MAX_DEV: 100,
    GENERAL_WINDOW_MS: 15 * 60 * 1000,
    GENERAL_MAX_PROD: 100,
    GENERAL_MAX_DEV: 1000
  },
  AI: {
    RATE_LIMIT_RETRY_DELAY_MS: 10000,
    RETRY_ATTEMPTS: 3
  },
  BREVO: {
    DEFAULT_LIST_ID: 2,
    BATCH_SIZE: 50
  },
  TIMEOUTS: {
    FETCH_DEFAULT_MS: 10000,
    TOKEN_VERIFICATION_MS: 5000
  }
};
```

---

### 18. **Sparse Test Coverage**

**Issue:** No test files found in the repository (no `__tests__`, `test/`, `.test.js`, `.spec.js` files).

**Critical Functions Without Tests:**
- `aiService.js` - Complex AI prompt generation and fallback logic
- `emailService.js` - Email sending (should have mock tests)
- `auth.js` routes - Authentication flows are security-critical
- `dateUtils.js` - Date calculations for weekly batches

**Recommendation:**
```
backend/
  __tests__/
    unit/
      aiService.test.js
      emailService.test.js
      helpers.test.js
    integration/
      auth.integration.test.js
      ideas.integration.test.js
    fixtures/
      sampleIdeas.js
      samplePosts.js
frontend/
  __tests__/
    lib/
      auth.test.js
      ideas.test.js
    components/
      IdeaCard.test.jsx
```

Add minimal test suite:
```javascript
// backend/__tests__/unit/aiService.test.js
import { AIService } from '../../src/services/aiService.js';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AIService', () => {
  let aiService;
  
  beforeEach(() => {
    aiService = new AIService({
      gemini: {
        apiKey: 'test-key',
        models: { primary: 'test-model' }
      }
    });
  });
  
  it('should validate input before generating ideas', async () => {
    expect(() => aiService.generateIdeas([], 5))
      .toThrow('Posts array is required');
  });
  
  it('should reject invalid count values', async () => {
    const posts = [{ text: 'test' }];
    expect(() => aiService.generateIdeas(posts, -1))
      .toThrow('Count must be between 1 and 20');
  });
});
```

---

### 19. **Documentation Gaps**

**Missing Documentation:**
- No API documentation (Swagger/OpenAPI)
- No deployment guide
- No troubleshooting guide for failed scrapes
- No database schema diagram
- No architecture decision records (ADRs)
- README files in some dirs are minimal

**Recommendation:**
Create `docs/API.md`:
```markdown
# ZerosByKai API Documentation

## Authentication Endpoints

### POST /api/auth/signup
Send a magic link to user's email

**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name" // optional
}
```

**Response (200):**
```json
{
  "message": "Magic link sent to your email"
}
```

**Response (400):**
```json
{
  "error": "Email is required"
}
```

**Rate Limiting:** 15 requests per 15 minutes
```

---

### 20. **Inconsistent Naming Conventions**

**Issues:**
- File naming: `auth.js`, `ideas.js` vs `emailService.js`, `brevoService.js`
- Variable naming: `ideaId` vs `idea_id` (mix of camelCase and snake_case)
- Function naming: `getApiUrl()`, `apiFetch()` vs `maskEmail()`, `wait()`
- Database columns: `week_published`, `is_winner` (snake_case) but payload might use camelCase

**Recommendation:**
1. **Backend:** Use snake_case for database columns, camelCase for JavaScript
2. **Frontend:** Consistent camelCase for all variables/functions
3. **API responses:** Use camelCase for consistency with frontend
4. **File naming:** Use kebab-case for files (`email-service.js`, `brevo-service.js`)

---

## 🟢 POSITIVE PATTERNS

✅ **Strong architectural separation** - Clear route/service/config layering  
✅ **Environment-based configuration** - Flexible for dev/prod deployments  
✅ **Rate limiting implemented** - Protection against abuse  
✅ **Security headers with Helmet** - Good security defaults  
✅ **Email templating system** - Maintainable email generation  
✅ **Supabase RLS integration** - Proper row-level security usage  
✅ **PII-safe logging** - Email masking for privacy  
✅ **Graceful error handling** - Try-catch blocks in critical paths  
✅ **Next.js best practices** - Dynamic imports, SSR support  
✅ **Comprehensive .gitignore** - No secrets in repository  

---

## 📋 RECOMMENDATIONS SUMMARY

### Priority 1 (DO FIRST - Security/Stability)
1. Add rate limiting to `/api/auth/verify-email-token` endpoint
2. Remove hardcoded fallback secrets
3. Implement proper error recovery in Monday cron job
4. Add input validation to AI service
5. Fix N+1 query problem in leaderboard endpoint

### Priority 2 (DO SOON - Quality/UX)
6. Add timeout handling to all frontend fetch calls
7. Implement session auto-refresh on JWT expiry
8. Add structured request/response logging
9. Implement pagination for archive endpoint
10. Fix race condition in post-login processing

### Priority 3 (DO NEXT - Maintenance)
11. Create test suite for critical functions
12. Write comprehensive API documentation
13. Standardize naming conventions
14. Add retry logic with exponential backoff
15. Create database schema diagram

### Priority 4 (NICE TO HAVE - Polish)
16. Implement request tracing/correlation IDs
17. Add performance monitoring (Sentry, etc.)
18. Create deployment runbook
19. Add integration tests
20. Implement feature flags for safe rollouts

---

## 🔐 Security Audit

### ✅ What's Done Well
- HTTPS/TLS enforcement on Fly.io
- Rate limiting on public endpoints
- CORS properly configured
- Password-less auth (safer than password hashing)
- Email token scoped to user
- Helmet.js security headers
- No SQL injection risks (using Supabase parameterized queries)

### ⚠️ What Needs Attention
1. **Token Verification Endpoint** - Add rate limiting (see issue #2)
2. **CSRF Protection** - Implement for state-changing operations (see issue #5)
3. **Secret Management** - Remove fallback secrets (see issue #6)
4. **Session Validation** - Frontend should validate session before using (current code assumes valid)
5. **Input Validation** - AI service and routes need stricter input validation
6. **Sensitive Data** - Audit logging to ensure no PII in error messages

---

## 🚀 Performance Optimization Opportunities

1. **Database Queries**
   - Add indexes on commonly queried fields (email, week_published, status)
   - Implement query result caching for leaderboard (changes only weekly)
   - Use database views for complex queries

2. **API Response Times**
   - Implement Redis caching for `/api/ideas/weekly`
   - Add pagination to all list endpoints
   - Compress JSON responses (gzip already enabled via compression middleware)

3. **Frontend Performance**
   - Implement image lazy loading
   - Add Service Worker for offline support
   - Implement code splitting for routes
   - Add Next.js Image optimization

4. **Email Delivery**
   - Batch similar emails to reduce API calls
   - Implement email queue for resilience
   - Consider CDN for email template assets

---

## 🎯 Next Steps

1. **This Week:**
   - Fix critical security issues (rate limiting, secrets)
   - Add input validation to AI service
   - Fix leaderboard N+1 query

2. **Next Week:**
   - Add timeout handling to frontend
   - Implement basic test suite
   - Write API documentation

3. **Sprint Planning:**
   - Create "Testing" epic and plan test coverage
   - Create "Monitoring" epic for logging/observability
   - Create "Documentation" epic for API/deployment docs

---

## 📞 Questions for Product/Engineering Teams

1. **SLA**: What's the maximum acceptable downtime for weekly digest delivery?
2. **Scalability**: Expected user growth - when do we need multi-instance setup?
3. **Analytics**: What metrics should we track (email open rate, vote participation, etc.)?
4. **Compliance**: GDPR/CCPA concerns - do we have data retention policy?
5. **Monitoring**: What alerts should we set up for production?

---

**Code Review Completed:** February 5, 2026  
**Reviewer:** GitHub Copilot  
**Status:** Ready for team discussion and prioritization
