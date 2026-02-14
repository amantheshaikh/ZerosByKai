# Frontend Context (Tier 2: Component)

> **Note**: This is component-specific context. See root **CLAUDE.md** for master project context and coding standards.

## Purpose
The frontend is a Next.js application that provides the user interface for ZerosByKai. It handles:
- Idea browsing and voting
- User authentication (magic link, OAuth, auto-login)
- Newsletter subscription
- User profiles and badges
- Responsive comic-themed design

## Current Status: Production ✅
Fully operational with all authentication flows implemented.

## Technology Stack
- **Framework:** Next.js 14 (Pages Router)
- **Language:** JavaScript (React)
- **Styling:** Tailwind CSS + Custom Comic Design System
- **Fonts:** Bangers (comic titles) + Courier Prime (body text) via `next/font/google`
- **Animations:** Framer Motion
- **Auth:** Supabase Auth via `@supabase/ssr`
- **Deployment:** Vercel

## Component Structure

### Pages (`pages/`)
| File | Route | Description | SEO |
|------|-------|-------------|-----|
| `_app.js` | — | App wrapper: `AuthProvider`, global meta, JSON-LD schemas | — |
| `_document.js` | — | Document wrapper: charset, favicon, theme-color, preconnect | — |
| `index.jsx` | `/` | Landing page: hero, ideas, voting, FAQ | ✅ Indexed |
| `about.jsx` | `/about` | About Kai page | ✅ Indexed |
| `story.jsx` | `/story` | Origin story page | ✅ Indexed |
| `archive.jsx` | `/archive` | Past weekly idea archives | ✅ Indexed |
| `profile.jsx` | `/profile` | User profile: tier, votes, badges | ❌ Noindex |
| `tools.jsx` | `/tools` | Kai's Toolbox: resources & tools | ✅ Indexed |
| `terms.jsx` | `/terms` | Terms & guidelines | ✅ Indexed |

| `privacy.jsx` | `/privacy` | Privacy policy | ✅ Indexed |
| `unsubscribe.jsx` | `/unsubscribe` | Email unsubscribe handler | ❌ Noindex |
| `auth/callback.jsx` | `/auth/callback` | Magic link / OAuth callback | ❌ Noindex |

### Components (`components/`)
| File | Description |
|------|-------------|
| `AuthModal.jsx` | Global auth modal with SIGN IN / JOIN tabs, Google OAuth button |
| `Header.jsx` | Site header with nav links, auth state display, `BadgeDisplay` |
| `BadgeDisplay.jsx` | Shows user's earned badges in the header |
| `VoteConfirmation.jsx` | Modal overlay confirming a vote action |
| `Leaderboard.jsx` | Displays idea voting leaderboard |

### Lib (`lib/`)
| File | Description |
|------|-------------|
| `auth.js` | `AuthProvider` context: manages all authentication flows |

### Public Assets (`public/`)
- `favicon.ico`, `favicon-32x32.png` — Site icons
- `kai-hero.jpg` — Hero image (also OG image)
- `kai-about-hero.png` — About page hero
- `icon-stash.png`, `icon-target.png`, `icon-trophy.png` — Feature icons
- `robots.txt` — Disallows `/auth/`, `/profile`, `/unsubscribe`, `/api/`
- `sitemap.xml` — All 6 public pages with priorities

## Design System

### Comic Theme
- **Visual Style:** Comic book / Pop art aesthetic
- **Colors:**
  - Yellow: `#FCD933`
  - Black: `#000`
  - Rose: `#BE123C`
- **Typography:**
  - Headers: Bangers (bold, comic-style)
  - Body: Courier Prime (monospace, typewriter-style)

### Custom CSS Classes
```css
.comic-title       /* Comic-style headers with text shadow */
.comic-body        /* Typewriter-style body text */
.comic-panel       /* Panel-style containers with thick borders */
.comic-shadow      /* Offset shadow effect */
.halftone          /* Halftone dot pattern background */
```

### Tailwind Extensions
See `tailwind.config.js` for custom colors, fonts, and utilities.

## Authentication System

### Auth Context (`lib/auth.js`)
Provides comprehensive authentication management:

```javascript
const {
  // State
  user,                  // Current user object
  session,               // Current session
  isLoading,             // Auth loading state
  
  // Methods
  signOut,               // Sign out user
  signInWithGoogle,      // Google OAuth
  sendMagicLink,         // Send magic link email
  subscribeNewsletter,   // Newsletter-only subscription
  
  // Modal
  showAuthModal,         // Modal visibility
  authModalMode,         // 'signin' | 'join'
  openAuthModal,         // Open modal
  closeAuthModal,        // Close modal
  
  // Advanced
  supabase              // Supabase client
} = useAuth();
```

### Authentication Flows

#### 1. Newsletter-Only Subscription
```javascript
// Low friction - no account creation
const { subscribeNewsletter } = useAuth();
await subscribeNewsletter(email, name);
// → User receives weekly emails but cannot vote
```

#### 2. Magic Link Sign-Up
```javascript
// Creates account with passwordless auth
const { sendMagicLink } = useAuth();
await sendMagicLink(email, name);
// → User receives magic link email
// → Clicks link → /auth/callback → session created
```

#### 3. Google OAuth
```javascript
// One-click sign-in with Google
const { signInWithGoogle } = useAuth();
await signInWithGoogle();
// → Redirects to Google → /auth/callback → session created
```

#### 4. Email Token Auto-Login
```javascript
// Automatic - handled by AuthProvider
// User clicks link in weekly digest with ?token=<jwt>
// → Token verified with backend
// → Session created automatically
// → Token removed from URL
```

### Post-Login Hook
After any successful authentication:
1. Syncs subscriber record with auth user
2. Sends welcome email (if new user)
3. Marks user as welcomed (prevents duplicates)

## API Integration

### API Helper
```javascript
import { apiFetch } from '@/lib/auth';

// Automatically injects Bearer token if user is authenticated
const data = await apiFetch('/api/ideas/weekly');
```

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## SEO Infrastructure

### JSON-LD Schemas
- **Organization + WebSite** - Global in `_app.js`
- **FAQPage** - In `index.jsx`

### Meta Tags
Every public page includes:
- Open Graph tags (title, description, image, url)
- Twitter Card tags
- Canonical URL
- Meta description

### Robots Meta
- **Public pages:** Indexed
- **Private pages:** `noindex, nofollow` (profile, auth/callback, unsubscribe)

### Semantic HTML
- `<nav aria-label>` for navigation
- Semantic `<header>`, `<section>`, `<footer>` elements
- Proper heading hierarchy (single `<h1>` per page)

## Responsive Design

### Mobile-First Approach
- Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Touch-friendly buttons and interactive elements
- Optimized images for different screen sizes

### Animations
- Framer Motion for page transitions
- Entrance animations for components
- Smooth hover effects

## Critical Implementation Details

### Navigation
- All internal links use `next/link`
- Hash links (e.g., `/#ideas-section`) also use `next/link`
- External links use `target="_blank" rel="noopener noreferrer"`

### State Management
- Global auth state via React Context (`AuthProvider`)
- Local component state via `useState`
- No external state management library

### Performance
- Next.js automatic code splitting
- Image optimization via `next/image`
- Font optimization via `next/font/google`
- Preconnect hints for external resources

## Testing

### Local Development
```bash
npm run dev  # Start dev server on port 3000
npm run build  # Build for production
npm run start  # Start production server
```

### Build Validation
```bash
npm run build
# Should complete without errors
# Check for:
# - No ESLint errors
# - No build warnings
# - Successful page generation
```

## Recent Changes (Feb 14, 2026)
- ✅ **Auth**: Refined `/post-login` and `/subscribe` flows for better name sync and re-engagement.
- ✅ **Email Auth**: Hardened auto-login verification for more robust session creation in all environments.
- ✅ **Design**: Standardized tag extraction from the new `tags` array structure in the leaderboard.
- ✅ **Toolbox**: Launched **Kai's Toolbox** (`/tools`) with dynamic logo fetching.

---

**Last Updated:** February 14, 2026

### Protected Routes
```javascript
const { user, isLoading } = useAuth();

if (isLoading) return <Spinner />;
if (!user) return <SignInPrompt />;

return <ProtectedContent />;
```

### Conditional Rendering
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

### API Calls
```javascript
const { session } = useAuth();

const handleVote = async (ideaId) => {
  try {
    await apiFetch('/api/votes', {
      method: 'POST',
      body: JSON.stringify({ idea_id: ideaId })
    }, session);
  } catch (error) {
    console.error('Vote failed:', error);
  }
};
```

## Next Steps
- Consider adding loading states for all async operations
- Implement optimistic UI updates for voting
- Add analytics tracking for user interactions
- A/B test different CTA placements
