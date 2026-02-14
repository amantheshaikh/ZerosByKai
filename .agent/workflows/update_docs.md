---
description: Update project documentation (CLAUDE.md, README.md, docs/) and public assets (sitemap, robots)
---
1.  **Analyze Recent Changes**: 
    - Use `git log -n 20 --pretty=format:"%h - %s (%ad)" --date=short` to identify modified features.
    - Review conversation logs and relevant file modifications since the last sync.
2.  **Tier 1 (Foundation) Sync**:
    - Update `CLAUDE.md`: Refresh "Recent Major Changes", tech stack, and coding standards.
    - Update root `README.md`: Ensure core value proposition and setup are current.
    - Update `docs/README.md`: Maintain the **Documentation Index** routing table.
    - Update `docs/ai-context/`: Refresh `project-structure.md`, `architecture.md`, and `handoff.md`.
3.  **Tier 2 (Component) Sync**:
    - Update `backend/CONTEXT.md` and `frontend/CONTEXT.md` for architectural or pattern shifts.
    - Update `docs/MASTER_WORKFLOW.md`: Ensure step-by-step processes reflect implementation.
4.  **Tier 3 (Feature) Sync**:
    - Update feature-specific docs (e.g., `docs/AUTH_DOCUMENTATION.md`, `docs/idea_extraction_logic.md`) for deep logic changes.
5.  **Refactor & Clean**:
    - Audit for redundancies across all documents.
    - Consolidate related guides and remove stale instructions.
    - Ensure logical consistency across the 3-tier hierarchy.
6.  **Audit for Deletions**:
    - Cross-reference docs against the codebase to remove references to retired features or endpoints.
7.  **Synchronize Public Assets**:
    - Update `frontend/public/sitemap.xml` with new routes.
    - Update `frontend/public/robots.txt`.
    - Update `frontend/public/llms.txt`: Comprehensive project summary for AI.
8.  **Verification & Metadata**:
    - Validate all internal markdown links.
    - Update "Last Updated" timestamps in all modified documentation.
    - Required Files Check: `CLAUDE.md`, `README.md`, `frontend/public/llms.txt`, `frontend/public/robots.txt`, `frontend/public/sitemap.xml`, `docs/idea_extraction_logic.md`.
