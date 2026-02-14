# AI Session Handoff: ZerosByKai

This document facilitates session continuity for AI agents working on the ZerosByKai project. 

## Active Session Context

When starting a new session, follow these steps to establish context:

1. **Read Foundation Docs (Tier 1):**
    - `CLAUDE.md` (Coding standards)
    - `docs/ai-context/project-structure.md` (File tree)
    - `docs/ai-context/docs-overview.md` (Routing guide)
2. **Identify Impact Area:**
    - If working on Backend: Read `backend/CONTEXT.md`.
    - If working on Frontend: Read `frontend/CONTEXT.md`.
3. **Check Task Progress:**
    - Read `task.md` in the current brain directory.

## Current State (Last Snapshot: Feb 14, 2026)

- **Milestone:** >90% Backend Test Coverage achieved.
- **Key Feature:** Subscription & Auth flows hardened for reliability.
- **Next Targets:** 
    - Frontend test suite expansion (currently <80%).
    - Implementation of optimistic UI updates for voting.

## Known Constraints

- **No TypeScript:** The project strictly uses JavaScript (ESM).
- **Design System:** Stick to the "Comic/Pop Art" aesthetic using specific Tailwind utilities (`comic-panel`, `comic-shadow`, `halftone`).
- **Auth Flow:** Always prioritize the Secure Email Token flow for user re-engagement.
- **Email:** The weekly digest MUST use the Brevo Batch API with idempotency keys.

## Development Checklist

- [ ] Run `npm run lint` before committing frontend changes.
- [ ] Run `npm test` in the relevant directory.
- [ ] Ensure any new environment variables are documented in `backend/README.md`.
- [ ] Update `backend/CONTEXT.md` or `frontend/CONTEXT.md` if architectural patterns change.
