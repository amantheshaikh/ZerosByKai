---
description: Update project documentation (CLAUDE.md, README.md, docs/) and public assets (sitemap, robots)
---
1.  **Analyze Recent Changes**: 
    - Use `git log -n 20 --pretty=format:"%h - %s (%ad)" --date=short` to identify modified features.
    - Review conversation logs and relevant file modifications since the last sync.
2.  **Tier 1 (Foundation) Sync**:
    - Update `CLAUDE.md`: Refresh "Recent Major Changes", technology stack, and evolving coding standards.
    - Update root `README.md`: Ensure core value proposition and setup instructions are current.
3.  **Tier 2 (Guides) Sync**:
    - Update `docs/MASTER_WORKFLOW.md`: Ensure step-by-step processes reflect current implementation.
    - Synchronize other guides (e.g., `BREVO_GUIDE.md`, `DEPLOYMENT.md`) as needed.
4.  **Tier 3 (Features) Sync**:
    - Update feature-specific docs (e.g., `AUTH_DOCUMENTATION.md`) for logic or API changes.
5.  **Audit for Deletions**:
    - Cross-reference documentation against the codebase to remove references to deleted endpoints, dead services, or retired features.
6.  **Synchronize Public Assets**:
    - Update `frontend/public/sitemap.xml` with new routes or priorities.
    - Update `frontend/public/robots.txt` and `frontend/public/llms.txt`.
    - Ensure copies exist in the project root if required for build scripts/AI context.
7.  **Verification & Metadata**:
    - Validate all internal markdown links.
    - Update "Last Updated" timestamps in all modified files.
    - Final review: Ensure consistent branding and terminology across all tiers.
