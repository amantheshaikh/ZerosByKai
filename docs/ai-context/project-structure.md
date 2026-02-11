# Project Structure: ZerosByKai

This document documents the technology stack and file tree structure for ZerosByKai. **AI agents MUST read this file to understand the project organization before making any changes.**

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Supabase** - Database and Authentication (magic link, Google OAuth, email tokens)
- **Google Gemini** - AI analysis (`gemini-3-flash-preview`, fallback: `gemini-3-pro-preview`)
- **Brevo** - Email delivery service (Transactional + Batch)
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
├── README.md                           # Main project documentation
├── task.md                             # Current task tracking
│
├── .github/workflows/                  # GitHub Actions
│   └── weekly-digest.yml               # Monday publish & send workflow
│
├── backend/                            # Backend application
│   ├── README.md                       # Backend setup guide
│   ├── final_schema.sql                # Definitive schema
│   ├── migrations/                     # Database migrations
│   │   ├── fix_auth_trigger.sql        # Fix for auth user creation trigger
│   │   ├── add_vote_count_to_ideas.sql # Optimization: vote_count column
│   │   ├── reset_all_users.sql         # Utilities to reset user base
│   │   └── sync_production_v2.sql      # Schema synchronization
│   ├── src/                            # Source code
│   │   ├── server.js                   # Main entry point + health crons
│   │   ├── config/
│   │   │   ├── env.js                  # Central configuration
│   │   │   └── supabase.js             # Supabase clients
│   │   ├── routes/                     # API Routes
│   │   │   ├── auth.js                 # Auth, signup, unsubscribe
│   │   │   ├── ideas.js                # Ideas, batches, leaderboard
│   │   │   ├── votes.js                # Voting, badges, last-week
│   │   │   ├── emails.js               # Legacy email routing (deprecated)
│   │   │   └── webhooks.js             # Brevo webhook handler
│   │   ├── services/                   # Business logic
│   │   │   ├── aiService.js            # Gemini AI integration
│   │   │   ├── brevoService.js         # Contact & list sync
│   │   │   └── newsletterService.js    # Scheduling & batch logic
│   │   ├── jobs/                       # Production cron jobs
│   │   │   ├── scrapers/               # Reddit, HN, IH, X scrapers
│   │   │   │   └── run_scrapers.js     # Scraper orchestration
│   │   │   ├── backlog_check.js        # Health check job
│   │   │   ├── schedule_newsletter.js  # Batch scheduling job
│   │   │   └── weekly.js               # Monday publishing & delivery
│   │   ├── emails/                     # Email templates
│   │   │   └── templates/
│   │   │       ├── shared.js           # Shared styles & components
│   │   │       ├── welcome.js          # Welcome email (server-generated)
│   │   │       └── magic-link.js       # Magic link (server-generated)
│   │   ├── utils/
│   │   │   ├── emailToken.js           # JWT utilities for email
│   │   │   ├── emailService.js         # Transporter wrapper
│   │   │   └── helpers.js              # General utilities
│   │   └── unit_tests/                 # Vitest backend suite
│   ├── package.json                    # Dependencies
│   ├── fly.toml                        # Fly.io config
│   └── .env                            # Environment variables
│
├── frontend/                           # Frontend application
│   ├── pages/                          # Next.js pages
│   │   ├── _app.js                     # App wrapper & context
│   │   ├── index.jsx                   # Landing page
│   │   ├── story.jsx                   # Origin story
│   │   ├── archive.jsx                 # Past editions
│   │   ├── profile.jsx                 # User profile & badges
│   │   ├── tools.jsx                   # Kai's toolbox (resources)
│   │   ├── terms.jsx                   # Terms of service
│   │   ├── privacy.jsx                 # Privacy policy
│   │   ├── unsubscribe.jsx             # Unsubscribe interface
│   │   ├── view/                       # Mirror link handlers
│   │   └── auth/                       # Auth callbacks
│   ├── components/                     # UI components
│   │   ├── AuthModal.jsx               # Unified signup/login
│   │   ├── Header.jsx                  # Navigation
│   │   ├── IdeaCarousel.jsx            # Dynamic idea slider
│   │   └── Leaderboard.jsx             # Voting results
│   ├── lib/                            # Shared logic
│   │   ├── auth.js                     # AuthProvider & context
│   │   └── stash-data.js               # Toolbox data source
│   ├── styles/                         # Global styles
│   ├── public/                         # Static assets
│   ├── unit_tests/                     # Frontend test suite
│   └── package.json                    # Dependencies
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
| `jobs/scrapers/run_scrapers.js` | Multi-source scraping orchestration |
| `jobs/weekly.js` | Monday publish, winner, digest workflow |
| `jobs/schedule_newsletter.js` | Batch scheduling logic |
| `services/aiService.js` | Gemini AI integration & prompt engineering |
| `services/brevoService.js` | Brevo contact & list synchronization |

### Frontend Critical Files
| File | Purpose |
|------|---------|
| `pages/_app.js` | App wrapper, AuthProvider, global meta |
| `pages/index.jsx` | Landing page (main entry point) |
| `pages/tools.jsx` | Kai's Toolbox (resource directory) |
| `lib/auth.js` | Auth context provider (all auth flows) |
| `components/AuthModal.jsx` | Unified Authentication modal |

## Documentation Hierarchy

### Tier 1: Foundation
- **`/CLAUDE.md`** - Master AI context, coding standards, key patterns
- **`/README.md`** - Comprehensive project guide, deployment, and testing
- **`/docs/AUTH_DOCUMENTATION.md`** - Authentication system guide


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

## Recent Changes
- ✅ **Routes Optimization (Feb 11)**: Removed dead endpoints/exports, added caching (in-memory + Cache-Control), parallelized DB calls, fixed admin delete scalability, secured webhook auth.
- ✅ **Auth (Feb 11)**: Updated `verify-email-token` to use magic link generation + verification for session creation; removed name field from subscribe modal.
- ✅ **Toolbox Implementation**: Added `tools.jsx` and `stash-data.js` for curated resource listing.
- ✅ **Tool Logos**: Dynamic logo fetching via Clearbit API integration.
- ✅ **Email System**: Fully migrated to Brevo (Transactional + Batch API), with RFC 8058 one-click unsubscribe support.
- ✅ **Performance**: Added `vote_count` column for O(1) leaderboard and ISR for landing page scaling.


---

**Last Updated:** February 11, 2026
