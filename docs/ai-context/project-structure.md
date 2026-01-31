# Project Structure: ZerosByKai

This document documents the technology stack and file tree structure for ZerosByKai. **AI agents MUST read this file to understand the project organization before making any changes.**

## Technology Stack

### Backend
- **Node.js** - Runtime environment.
- **Express** - Web framework.
- **Supabase** - Database and Authentication (magic link OTP + Google OAuth).
- **Google Gemini** - AI analysis (integration via SDK).
- **Fly.io** - Deployment platform.

### Frontend
- **Next.js 14** - React framework (Pages Router).
- **JavaScript/React** - Language/Library.
- **Tailwind CSS** - Styling with custom comic-panel design system.
- **Framer Motion** - Animations.
- **@supabase/ssr** - Auth client (`createPagesBrowserClient`).
- **Vercel** - Deployment platform.

## Complete Project Structure

```
ZerosByKai/
├── CLAUDE.md                           # Master AI context file
├── task.md                             # Current task tracking
├── .claude/                            # Claude Code configuration
│   ├── settings.json                   # Settings
│   ├── commands/                       # AI orchestration commands
│   └── hooks/                          # Automation hooks
├── backend/                            # Backend application
│   ├── CONTEXT.md                      # Backend component docs (Tier 2)
│   ├── src/                            # Source code
│   │   ├── CONTEXT.md                  # Backend source docs (Tier 3)
│   │   ├── server.js                   # Main entry point
│   │   ├── routes/                     # API Routes
│   │   │   ├── auth.js                 # Auth routes (signup, subscribe, unsubscribe)
│   │   │   ├── ideas.js                # Ideas CRUD & leaderboard routes
│   │   │   ├── votes.js                # Voting, badges, last-week result
│   │   │   └── admin.js                # Admin routes
│   │   ├── jobs/                       # Cron jobs (weekly winner + digest)
│   │   ├── emails/                     # Email templates (digest, welcome, magic link)
│   │   ├── workflows/                  # AI analysis workflows
│   │   └── config/                     # Configuration (Supabase client)
│   ├── package.json                    # Dependencies
│   ├── fly.toml                        # Fly.io config
│   ├── schema.sql                      # Database schema
│   └── Dockerfile                      # Container config
├── frontend/                           # Frontend application
│   ├── CONTEXT.md                      # Frontend component docs (Tier 2)
│   ├── pages/                          # Next.js pages (Pages Router)
│   │   ├── _app.js                     # App wrapper: AuthProvider, JSON-LD schemas
│   │   ├── _document.js                # Document: meta, favicon, preconnect
│   │   ├── index.jsx                   # Landing page: hero, ideas, voting, FAQ schema
│   │   ├── about.jsx                   # About Kai page
│   │   ├── story.jsx                   # Origin story page
│   │   ├── archive.jsx                 # Past weekly idea archives
│   │   ├── profile.jsx                 # User profile: tier, vote, last week result, badges
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
│   │   └── globals.css                 # Global styles, comic design system classes
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
├── docs/                               # Documentation
│   ├── ai-context/                     # AI documentation
│   │   ├── project-structure.md        # This file
│   │   └── docs-overview.md            # Documentation system overview
│   └── ...                             # Specs and guides
└── ...                                 # Other root files
```
