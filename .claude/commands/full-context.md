You are working on the current project. Before proceeding with the user's request "$ARGUMENTS", you need to intelligently gather relevant project context using an adaptive sub-agent strategy.

## Auto-Loaded Project Context:
@/CLAUDE.md
@/docs/ai-context/project-structure.md

## Strategy
1. **Direct Approach**: For simple queries, use loaded context and file reads.
2. **Sub-Agent Approach**: For complex tasks, spawn parallel sub-agents to analyze specific components.

## Sub-Agent Principles
- **Parallel Execution**: Always launch multiple agents in one turn.
- **Focused Scope**: Each agent should target specific files/docs.
- **Dependency Awareness**: Check imports/exports and side effects.

## Execution
1. Analyze user request "$ARGUMENTS".
2. Decide on Direct vs Sub-Agent approach.
3. Execute and synthesize findings.
4. Create implementation plan if code changes are needed.

Now proceed with intelligent context analysis for: $ARGUMENTS
