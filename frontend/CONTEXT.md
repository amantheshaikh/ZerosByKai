# Frontend Context (Tier 2)

> **Note**: This is component-specific context. See root **CLAUDE.md** for master project context and coding standards.

## Purpose
The frontend provides the user interface for ZerosByKai, built with Next.js (Pages Router). It handles authentication, idea browsing, voting, user profiles, and newsletter subscription.

## Component-Specific Development Guidelines
- **Technology**: Next.js 14 (Pages Router), React, Tailwind CSS, Framer Motion.
- **Fonts**: Bangers (comic titles) + Courier Prime (body text) via `next/font/google`.
- **Design System**: Comic-panel aesthetic with custom CSS classes (`comic-title`, `comic-body`, `comic-panel`, `comic-shadow`, `halftone`).
- **Styling**: Tailwind CSS utility classes with custom extensions in `tailwind.config.js`.
- **State Management**: React Context (`AuthProvider` in `lib/auth.js`).
- **Auth**: Supabase Auth via `@supabase/ssr` — magic link (OTP) and Google OAuth.

## Key Structure

### Pages (`pages/`)
| File | Route | Description |
|------|-------|-------------|
| `_app.js` | — | App wrapper: `AuthProvider`, global meta, JSON-LD schemas (Organization, WebSite) |
| `_document.js` | — | Document wrapper: charset, favicon, apple-touch-icon, theme-color, preconnect hints |
| `index.jsx` | `/` | Landing page: hero, newsletter subscribe, idea cards, voting, FAQ JSON-LD |
| `about.jsx` | `/about` | About Kai page |
| `story.jsx` | `/story` | Origin story page |
| `archive.jsx` | `/archive` | Past weekly idea archives |
| `profile.jsx` | `/profile` | User profile: tier, vote history, badges (auth required, noindex) |
| `terms.jsx` | `/terms` | Terms & guidelines |
| `privacy.jsx` | `/privacy` | Privacy policy |
| `unsubscribe.jsx` | `/unsubscribe` | Email unsubscribe handler (noindex) |
| `auth/callback.jsx` | `/auth/callback` | Magic link / OAuth callback with timeout error handling (noindex) |

### Components (`components/`)
| File | Description |
|------|-------------|
| `AuthModal.jsx` | Global auth modal with SIGN IN / JOIN tabs, Google OAuth button, inline feedback states |
| `Header.jsx` | Site header with nav links, auth state display (sign in / profile+sign out), `BadgeDisplay` |
| `BadgeDisplay.jsx` | Shows user's earned badges in the header |
| `VoteConfirmation.jsx` | Modal overlay confirming a vote action |
| `Leaderboard.jsx` | Displays idea voting leaderboard |

### Lib (`lib/`)
| File | Description |
|------|-------------|
| `auth.js` | `AuthProvider` context: Supabase client (`createPagesBrowserClient`), user/session state, `signIn`, `signOut`, `openAuthModal`/`closeAuthModal`, Google OAuth handler |

### Public Assets (`public/`)
- `favicon.ico`, `favicon-32x32.png` — Site icons
- `kai-hero.jpg` — Hero image (also used as OG image for social sharing)
- `kai-about-hero.png` — About page hero image
- `icon-stash.png`, `icon-target.png`, `icon-trophy.png` — Feature section icons
- `robots.txt` — Disallows `/auth/`, `/profile`, `/unsubscribe`, `/api/`
- `sitemap.xml` — All 6 public pages with priorities

## SEO Infrastructure
- **JSON-LD Schemas**: Organization + WebSite (global in `_app.js`), FAQPage (in `index.jsx`)
- **Open Graph + Twitter Cards**: Per-page meta tags on all public pages
- **Canonical URLs**: Set on every public page
- **Meta robots**: `noindex, nofollow` on private/utility pages (profile, auth/callback, unsubscribe)
- **Semantic HTML**: `<nav aria-label>` for navigation, semantic `<header>`, `<section>`, `<footer>` elements

## Authentication Flow
1. **Newsletter subscribe** (low friction): Hero form → `POST /api/subscribe` → `subscribers` table insert → inline success message
2. **Account creation** (magic link): AuthModal JOIN tab → `POST /api/auth/signup` → Supabase `signInWithOtp` → magic link email → `/auth/callback` → session
3. **Google OAuth**: AuthModal Google button → Supabase Google provider → `/auth/callback` → session
4. **Sign in** (returning user): AuthModal SIGN IN tab → email-only magic link

## Critical Implementation Details
- **Responsive Design**: Mobile-first approach using Tailwind breakpoints.
- **API Integration**: Calls backend API via `getApiUrl()` from `lib/auth.js` (reads `NEXT_PUBLIC_API_URL` env var).
- **Animations**: Framer Motion for page transitions and component entrance animations.
- **ESLint**: Configured via `.eslintrc.json`; uses `next/link` for all internal navigation (including hash links like `/#ideas-section`).
