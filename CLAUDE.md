# ZerosByKai - AI Context

## 1. Project Overview
- **Vision:** Create an AI-powered platform tailored for entrepreneurs to discover validated startup ideas scraped from Reddit.
- **Current Phase:** Active Development / MVP Deployment.
- **Key Architecture:** Monorepo-style structure with separate Frontend (Next.js) and Backend (Node.js).
- **Development Strategy:** User-centric design, robust AI analysis, and secure data handling using Supabase.

## 2. Project Structure

**⚠️ CRITICAL: AI agents MUST read the [Project Structure documentation](/docs/ai-context/project-structure.md) before attempting any task to understand the complete technology stack, actual file tree and project organization.**

For the complete tech stack and file tree structure, see [docs/ai-context/project-structure.md](/docs/ai-context/project-structure.md).

## 3. Coding Standards & AI Instructions

### General Instructions
- **Context Management:** Always read `CLAUDE.md` and `docs/ai-context/project-structure.md` first.
- **Environment:** Run `npm run dev` in `frontend/` for UI, and `npm run dev` in `backend/` for API.
- **Testing:** Verify changes locally before deployment.
- **Security:** usage of env vars for tokens, RLS in Supabase.

### Technologies
- **Frontend:** Next.js, React, Tailwind CSS.
- **Backend:** Node.js, Express, Fly.io.
- **Database:** Supabase (PostgreSQL).
- **AI:** Google Gemini.

### Code Style
- **TypeScript/JavaScript:**
    - Use async/await.
    - Prefer functional components in React.
    - Strong typing in TypeScript (where applicable).
    - ESLint/Prettier configuration if present.

### Documentation
- Update `CONTEXT.md` files in subdirectories when significant architectural changes occur.
- Keep `project-structure.md` up to date with file system changes.

## 4. Multi-Agent Workflows
- Use `.claude/commands` for orchestration patterns.
- Sub-agents will have context injected automatically via hooks (if configured).

## 5. Post-Task Completion Protocol
1. **Frontend:** Check built (`npm run build`).
2. **Backend:** Verify API endpoints.
3. **Lint/Type Check:** Run `tsc` or `eslint` where applicable.