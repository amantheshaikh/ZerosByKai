Multi-agent code review. Focus on critical, high-impact findings only.

@/CLAUDE.md
@/docs/ai-context/project-structure.md

**Scope:** "$ARGUMENTS"

## Process
1. Parse what to review from user input (files, features, components, or "recent changes").
2. Read relevant CONTEXT.md docs to understand the area.
3. Spawn 2-4 parallel Explore agents based on scope:
   - **Security**: Input validation, auth flows, data exposure, injection risks.
   - **Reliability**: Error handling, edge cases, data integrity, state management.
   - **Performance**: Bottlenecks, unnecessary queries, resource waste.
   - **Architecture**: Integration points, dependency issues, scaling concerns.
4. Synthesize findings into a prioritized report.

## Output Format
```
# Code Review: [scope]

## Critical Issues (fix now)
- [issue]: [file:line] — [impact] — [fix]

## High-Value Improvements
- [issue]: [what it unlocks] — [effort vs benefit]

## Action Plan
1. [ordered fixes]
```

## Rules
- Only report findings that significantly impact production, security, or user experience.
- Skip: style nits, micro-optimizations, theoretical concerns.
- Include file:line references. Provide specific fixes, not just problem descriptions.
