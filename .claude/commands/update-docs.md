Update documentation to reflect recent changes.

@/CLAUDE.md
@/docs/ai-context/project-structure.md
@/docs/ai-context/docs-overview.md

**Context:** "$ARGUMENTS"

## Core Rule
Document current state only. Never reference what changed or what was removed.

## Process
1. **Detect changes**: Analyze session context, or run `git diff`/`git log` if specified.
2. **Map to docs**: Determine which documentation files are affected.
3. **Update bottom-up**: Tier 3 (feature CONTEXT.md) → Tier 2 (component CONTEXT.md) → Tier 1 (project-structure.md).

## Update Triggers
- **File tree changes** → Update `project-structure.md`
- **New routes/jobs/features** → Update relevant `CONTEXT.md`
- **Architecture changes** → Update component + foundational docs

## Rules
- Be concise (max 3 sentences per update unless major change).
- Include file names and tech specifics.
- Don't create new doc files unless a component has 5+ meaningful files.
- Update `docs-overview.md` if new CONTEXT.md files are created.
