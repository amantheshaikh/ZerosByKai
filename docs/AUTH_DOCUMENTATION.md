# Authentication System Documentation

## Overview

The ZerosByKai authentication system supports multiple authentication flows to provide a seamless user experience.

## Authentication Flows

### 1. **Email Token Auto-Login** (from weekly digest emails)
**Use case:** Users click links in weekly digest emails and are automatically signed in

**Flow:**
1. User receives weekly digest email with `?token=<jwt>` in URL
2. Frontend detects token on page load
3. Token is verified with backend `/api/auth/verify-email-token`
4. Session is created and user is signed in
5. Token is removed from URL

**Code example:**
```javascript
// Automatic - handled by AuthProvider
// User clicks: https://zerosbykai.com?token=eyJhbGc...
// → Automatically signed in
```

---

### 2. **Magic Link Authentication** (passwordless)
**Use case:** Users sign up or sign in without passwords

**Flow:**
1. User enters email (and optionally name)
2. Backend sends magic link email via Supabase
3. User clicks link in email
4. Redirected to `/auth/callback`
5. Supabase verifies token and creates session
6. Post-login hook runs (welcome email, subscriber sync)

**Code example:**
```javascript
const { sendMagicLink } = useAuth();

// Sign up new user
await sendMagicLink('user@example.com', 'John Doe');

// Sign in existing user
await sendMagicLink('user@example.com');
```

---

### 3. **Google OAuth**
**Use case:** Users sign in with their Google account

**Flow:**
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. User authorizes app
4. Redirected back to `/auth/callback`
5. Supabase creates session
6. Post-login hook runs

**Code example:**
```javascript
const { signInWithGoogle } = useAuth();

await signInWithGoogle();
```

---

### 4. **Newsletter-Only Subscription**
**Use case:** Users who only want weekly emails (no account)

**Flow:**
1. User enters email (and optionally name)
2. Backend creates subscriber record (no auth user)
3. Welcome email sent
4. User receives weekly digests but cannot vote

**Code example:**
```javascript
const { subscribeNewsletter } = useAuth();

await subscribeNewsletter('user@example.com', 'Jane Doe');
```

---

## Post-Login Hook

After any successful authentication, the post-login hook runs to:

1. **Sync subscriber record** - Links auth user to subscriber table
2. **Send welcome email** - For new users only (checked via `welcomed` flag)
3. **Mark as welcomed** - Prevents duplicate welcome emails

**Backend endpoint:** `POST /api/auth/post-login`

**Triggered by:**
- Magic link sign-in
- Google OAuth sign-in
- Email token auto-login

---

## Auth Context API

### State

```javascript
const {
  user,           // Current user object (null if not signed in)
  session,        // Current session object (null if not signed in)
  isLoading,      // True while checking auth state
} = useAuth();
```

### Methods

```javascript
const {
  signOut,              // Sign out current user
  signInWithGoogle,     // Sign in with Google OAuth
  sendMagicLink,        // Send magic link email
  subscribeNewsletter,  // Subscribe to newsletter only
} = useAuth();
```

### Modal State

```javascript
const {
  showAuthModal,    // Boolean - is auth modal open?
  authModalMode,    // 'signin' | 'join'
  openAuthModal,    // (mode) => void - open modal
  closeAuthModal,   // () => void - close modal
} = useAuth();
```

---

## Usage Examples

### Check if user is signed in

```javascript
const { user, isLoading } = useAuth();

if (isLoading) return <Spinner />;
if (!user) return <SignInPrompt />;

return <Dashboard user={user} />;
```

### Sign in with magic link

```javascript
const [email, setEmail] = useState('');
const { sendMagicLink } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await sendMagicLink(email);
    alert('Check your email for the magic link!');
  } catch (error) {
    alert(error.message);
  }
};
```

### Subscribe to newsletter

```javascript
const [email, setEmail] = useState('');
const [name, setName] = useState('');
const { subscribeNewsletter } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await subscribeNewsletter(email, name);
    alert('Subscribed! Check your email.');
  } catch (error) {
    alert(error.message);
  }
};
```

### Conditional rendering based on auth state

```javascript
const { user } = useAuth();

return (
  <div>
    {user ? (
      <button onClick={signOut}>Sign Out</button>
    ) : (
      <button onClick={() => openAuthModal('signin')}>Sign In</button>
    )}
  </div>
);
```

---

## Error Handling

All auth methods throw errors that should be caught:

```javascript
try {
  await sendMagicLink(email);
} catch (error) {
  console.error('Auth error:', error);
  // Show user-friendly error message
  setError(error.message);
}
```

---

## Security Features

1. **JWT tokens** - Email tokens expire after 7 days
2. **Single-use tokens** - Email tokens can only be used once
3. **Supabase RLS** - Row-level security on all tables
4. **HTTPS only** - All auth flows require HTTPS in production
5. **Session management** - Automatic token refresh by Supabase

---

## Database Schema

### `subscribers` table
- `email` - User's email (unique)
- `name` - User's name (optional)
- `user_id` - Links to auth.users (null for newsletter-only)
- `welcomed` - Boolean flag to prevent duplicate welcome emails
- `unsubscribed_at` - Timestamp when user unsubscribed

### `auth.users` table (Supabase managed)
- Standard Supabase auth table
- Stores user credentials and OAuth data

---

## Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-api.fly.dev
NEXT_PUBLIC_SITE_URL=https://zerosbykai.com

# Backend (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
RESEND_API_KEY=your-resend-key
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://zerosbykai.com
```

---

## Testing

### Test magic link flow
```bash
node src/workflows/simulate_magic_link.js
```


### Test welcome email
```bash
node src/workflows/simulate_welcome.js
```

---

## Common Issues

### Issue: "Email token verification failed"
**Cause:** Token expired or already used  
**Solution:** User should sign in normally with magic link

### Issue: "Post-login hook failed"
**Cause:** Backend API unreachable or database error  
**Solution:** Non-critical - user is still signed in, just won't get welcome email

### Issue: "Magic link not working"
**Cause:** Email provider blocking emails or wrong redirect URL  
**Solution:** Check Resend logs and verify `FRONTEND_URL` is correct

---

## Future Enhancements

- [ ] Add password authentication option
- [ ] Implement 2FA for sensitive actions
- [ ] Add social login (Twitter, GitHub)
- [ ] Implement token revocation
- [ ] Add rate limiting on auth endpoints
