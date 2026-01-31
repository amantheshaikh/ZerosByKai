Create a session handoff document for continuity.

@/docs/ai-context/HANDOFF.md
@/CLAUDE.md

**User context:** "$ARGUMENTS"

## Process
1. Analyze session: What files were modified? What was accomplished? What's incomplete?
2. Read existing `docs/ai-context/HANDOFF.md` (create if missing).
3. Update or add a section:

```markdown
## [Task Title] - [Status: completed/in-progress/blocked]

### What Was Done
- [concrete achievements with file paths]

### Current Issue (if any)
[blocker or unresolved problem]

### Next Steps
- [actionable items]

### Key Files
- [relevant file paths]
```

## Rules
- Be specific: exact file paths, technical details, actionable steps.
- Don't duplicate existing content — update or add.
- Mark completed tasks. Remove stale entries.
