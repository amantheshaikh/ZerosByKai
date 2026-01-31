# Project Structure: ZerosByKai

This document documents the technology stack and file tree structure for ZerosByKai. **AI agents MUST read this file to understand the project organization before making any changes.**

## Technology Stack

### Backend
- **Node.js** - Runtime environment.
- **Express** - Web framework.
- **Supabase** - Database and Authentication.
- **Google Gemini** - AI analysis (integration via SDK).
- **Fly.io** - Deployment platform.

### Frontend
- **Next.js** - React framework.
- **JavaScript/React** - Language/Library.
- **Tailwind CSS** - Styling.
- **Vercel** - Deployment platform.

## Complete Project Structure

```
ZerosByKai/
├── README.md                           # Project overview
├── CLAUDE.md                           # Master AI context file
├── task.md                             # Current task tracking
├── PROJECT_DOCUMENTATION.md            # Consolidated documentation
├── .claude/                            # Claude Code configuration
│   ├── settings.json                   # Settings
│   ├── commands/                       # AI orchestration commands
│   └── hooks/                          # Automation hooks
├── backend/                            # Backend application
│   ├── src/                            # Source code
│   │   ├── server.js                   # Main entry point
│   │   ├── routes/                     # API Routes
│   │   ├── jobs/                       # Cron jobs
│   │   └── config/                     # Configuration
│   ├── package.json                    # Dependencies
│   ├── fly.toml                        # Fly.io config
│   ├── schema.sql                      # Database schema
│   └── Dockerfile                      # Container config
├── frontend/                           # Frontend application
│   ├── pages/                          # Next.js pages
│   │   ├── index.jsx                   # Landing page
│   │   ├── _app.js                     # App wrapper
│   │   └── _document.js                # Document wrapper
│   ├── public/                         # Static assets
│   ├── styles/                         # CSS/Tailwind styles
│   ├── package.json                    # Dependencies
│   └── tailwind.config.js              # Tailwind config
├── docs/                               # Documentation
│   ├── ai-context/                     # AI documentation
│   │   ├── project-structure.md        # This file
│   │   └── ...                         # Other context files
│   └── ...                             # Specs and issues
└── ...                                 # Other root files
```