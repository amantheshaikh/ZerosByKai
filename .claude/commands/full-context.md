Gather project context for: "$ARGUMENTS"

@/CLAUDE.md
@/docs/ai-context/project-structure.md

## Strategy
1. **Simple queries**: Use loaded context + targeted file reads.
2. **Complex tasks**: Spawn parallel Explore subagents targeting specific areas.

## Rules
- Launch multiple agents in one turn (parallel).
- Each agent should target specific files — don't overlap.
- Synthesize findings, then proceed with the user's request.

Now analyze what context is needed for "$ARGUMENTS" and gather it efficiently.
