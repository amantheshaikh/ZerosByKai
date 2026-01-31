Create or regenerate project documentation: "$ARGUMENTS"

@/CLAUDE.md
@/docs/ai-context/project-structure.md
@/docs/ai-context/docs-overview.md

## 3-Tier System
- **Tier 1** (foundational): `CLAUDE.md`, `project-structure.md`, `docs-overview.md`
- **Tier 2** (component): `backend/CONTEXT.md`, `frontend/CONTEXT.md`
- **Tier 3** (feature): `backend/src/CONTEXT.md`, etc.

## Process
1. Spawn Explore agents to analyze the codebase areas needing documentation.
2. Create/update docs following the tier system.
3. Optimize for AI consumption: structured sections, file paths, concise descriptions.
4. Update `docs-overview.md` to reference any new files.

## Rules
- Document current state only.
- Be concise — essential info only, no filler.
- Include file paths and technology specifics.
- Only create new CONTEXT.md when a component has 5+ meaningful files.
