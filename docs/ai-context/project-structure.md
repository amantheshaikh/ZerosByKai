# Project Structure: ZerosByKai

This document documents the technology stack and file tree structure for ZerosByKai. **AI agents MUST read this file to understand the project organization before making any changes.**

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Supabase** - Database and Authentication (magic link, Google OAuth, email tokens)
- **Google Gemini** - AI analysis (`gemini-3-flash-preview`, fallback: `gemini-3-pro-preview`)
- **Amazon SES** - Email delivery service (hardened multipart/alternative)
- **node-cron** - Cron job scheduling
- **Fly.io** - Deployment platform

### Frontend
- **Next.js 14** - React framework (Pages Router)
- **JavaScript/React** - Language/Library
- **Tailwind CSS** - Styling with custom comic-panel design system
- **Framer Motion** - Animations
- **@supabase/ssr** - Auth client (`createPagesBrowserClient`)
- **Vercel** - Deployment platform

## Complete Project Structure

```
ZerosByKai/
├── CLAUDE.md                           # Tier 1: Master AI context file
├── task.md                             # Current task tracking
│
├── .github/workflows/                  # GitHub Actions
│   └── reddit-scraper.yml              # Sunday Reddit scraping workflow
│
├── backend/                            # Backend application
│   ├── README.md                       # Backend setup guide
│   ├── final_schema.sql                # Definitive schema
│   ├── migration_v2.sql                # Production alignment script
│   ├── src/                            # Source code
│   │   ├── server.js                   # Main entry point + cron jobs
│   │   ├── config/
│   │   │   └── supabase.js             # Supabase client (RLS + Admin)
│   │   ├── routes/                     # API Routes
│   │   │   ├── auth.js                 # Auth endpoints
│   │   │   ├── ideas.js                # Ideas CRUD & leaderboard
│   │   │   └── votes.js                # Voting, badges, results
│   │   ├── jobs/                       # Production cron jobs
│   │   │   ├── reddit_scraper.js       # Sunday: Reddit → Gemini 3 Preview → 10 ideas
│   │   │   └── weekly.js               # Monday: publish, winner, digest (SES)
│   │   ├── emails/                     # Email templates
│   │   │   ├── templates.js            # Re-exports all templates
│   │   │   └── templates/
│   │   │       ├── shared.js           # Shared components & styles
│   │   │       ├── weekly-digest.js    # Weekly digest email
│   │   │       ├── welcome.js          # Welcome email
│   │   │       └── magic-link.js       # Magic link email
│   │   ├── utils/
│   │   │   ├── emailToken.js           # JWT utilities
│   │   │   ├── emailService.js         # SES Hardened service
│   │   │   ├── helpers.js              # PII Masking & Config
│   │   │   └── dateUtils.js            # UTC Date utilities
│   │   └── scripts/
│   │       └── delete-user-by-email.sql
│   ├── package.json                    # Dependencies
│   ├── fly.toml                        # Fly.io config
│   └── .env                            # Environment variables
│
├── frontend/                           # Frontend application
│   ├── CONTEXT.md                      # Tier 2: Frontend component docs
│   ├── pages/                          # Next.js pages (Pages Router)
│   │   ├── _app.js                     # App wrapper: AuthProvider, JSON-LD schemas
│   │   ├── _document.js                # Document: meta, favicon, preconnect
│   │   ├── index.jsx                   # Landing page: hero, ideas, voting, FAQ
│   │   ├── about.jsx                   # About Kai page
│   │   ├── story.jsx                   # Origin story page
│   │   ├── archive.jsx                 # Past weekly idea archives
│   │   ├── profile.jsx                 # User profile: tier, votes, badges
│   │   ├── terms.jsx                   # Terms & guidelines
│   │   ├── privacy.jsx                 # Privacy policy
│   │   ├── unsubscribe.jsx             # Email unsubscribe handler
│   │   └── auth/
│   │       └── callback.jsx            # Magic link / OAuth callback
│   ├── components/                     # Reusable UI components
│   │   ├── AuthModal.jsx               # Auth modal (sign in / join / Google OAuth)
│   │   ├── Header.jsx                  # Site header with nav and auth state
│   │   ├── BadgeDisplay.jsx            # User badge display
│   │   ├── VoteConfirmation.jsx        # Vote confirmation modal
│   │   └── Leaderboard.jsx             # Idea voting leaderboard
│   ├── lib/                            # Shared utilities
│   │   └── auth.js                     # AuthProvider context, Supabase client
│   ├── styles/
│   │   └── globals.css                 # Global styles, comic design system
│   ├── public/                         # Static assets
│   │   ├── favicon.ico                 # Site favicon
│   │   ├── favicon-32x32.png           # 32x32 favicon
│   │   ├── kai-hero.jpg                # Hero image (also OG image)
│   │   ├── kai-about-hero.png          # About page hero
│   │   ├── icon-stash.png              # Feature icon
│   │   ├── icon-target.png             # Feature icon
│   │   ├── icon-trophy.png             # Feature icon
│   │   ├── robots.txt                  # Crawler directives
│   │   └── sitemap.xml                 # Sitemap for 6 public pages
│   ├── package.json                    # Dependencies
│   ├── tailwind.config.js              # Tailwind config with custom extensions
│   ├── next.config.js                  # Next.js config
│   ├── postcss.config.js               # PostCSS config
│   ├── jsconfig.json                   # JS path aliases (@/)
│   └── .eslintrc.json                  # ESLint rules
│
└── docs/                               # Documentation
    ├── CLAUDE-CODE-GUIDE.md            # AI coding guide
    ├── CLAUDE.md                       # AI context (legacy)
    ├── CONTEXT-tier2-component.md      # Component context template
    ├── CONTEXT-tier3-feature.md        # Feature context template
    ├── README.md                       # Docs overview
    └── ai-context/                     # AI documentation
        ├── project-structure.md        # This file
        ├── docs-overview.md            # Documentation system overview
        ├── deployment-infrastructure.md
        ├── system-integration.md
        └── handoff.md
```

## File Organization Principles

### Backend
- **`jobs/`** - Production cron jobs (scheduled tasks)
- **`workflows/`** - Testing and simulation scripts
- **`routes/`** - API endpoint definitions
- **`emails/templates/`** - Individual email template files
- **`emails/templates/shared.js`** - Shared email components (DRY)
- **`utils/`** - Reusable utilities
- **`config/`** - Configuration files

### Frontend
- **`pages/`** - Next.js pages (Pages Router)
- **`components/`** - Reusable UI components
- **`lib/`** - Shared utilities and context providers
- **`styles/`** - Global styles
- **`public/`** - Static assets

## Key Files to Know

### Backend Critical Files
| File | Purpose |
|------|---------|
| `server.js` | Entry point, cron scheduling, middleware |
| `jobs/reddit_scraper.js` | Sunday Reddit scraping workflow |
| `jobs/weekly.js` | Monday publish, winner, digest workflow |
| `routes/auth.js` | All authentication endpoints |
| `emails/templates/shared.js` | Shared email components |
| `utils/emailToken.js` | JWT token utilities |

### Frontend Critical Files
| File | Purpose |
|------|---------|
| `pages/_app.js` | App wrapper, AuthProvider, global meta |
| `pages/index.jsx` | Landing page (main entry point) |
| `lib/auth.js` | Auth context provider (all auth flows) |
| `components/AuthModal.jsx` | Authentication modal |
| `components/Header.jsx` | Site header with auth state |

## Documentation Hierarchy

### Tier 1: Foundation
- **`/CLAUDE.md`** - Master AI context, coding standards, key patterns
- **`/PROJECT_DOCUMENTATION.md`** - Comprehensive project guide
- **`/AUTH_DOCUMENTATION.md`** - Authentication system guide

### Tier 2: Components
- **`/backend/CONTEXT.md`** - Backend component documentation
- **`/frontend/CONTEXT.md`** - Frontend component documentation

### Tier 3: Features
- Feature-specific CONTEXT.md files as needed
- Created only when a component grows significant complexity

### Reference Documentation
- **`/backend/README.md`** - Backend setup and deployment
- **`/backend/SIMULATION.md`** - Testing and simulation guide
- **`/CHANGELOG.md`** - Change history

## Environment Variables

### Backend (.env)
```bash
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
GEMINI_API_KEY
JWT_SECRET
FRONTEND_URL
PORT, NODE_ENV
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

## Deployment

### Backend (Fly.io)
```bash
cd backend
fly deploy
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

## Recent Changes (Feb 2, 2026)
- ✅ Moved `workflows/daily_startup_ideas.js` → `jobs/reddit_scraper.js`
- ✅ Removed `routes/admin.js` (use Supabase dashboard)
- ✅ Separated email templates into individual files
- ✅ Added `utils/emailToken.js` for JWT tokens
- ✅ Added comprehensive testing scripts in `workflows/`
- ✅ Removed redundant wrapper scripts

---

**Last Updated:** February 2, 2026
