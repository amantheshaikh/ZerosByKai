# Slash Commands

| Command | Purpose | Token Cost |
|---------|---------|------------|
| `/full-context` | Gather project context before a task | Low |
| `/code-review` | Multi-agent security/performance/architecture review | Medium |
| `/update-docs` | Sync documentation with code changes | Low |
| `/create-docs` | Generate documentation from scratch | Medium |
| `/refactor` | Intelligent file restructuring | Medium |
| `/handoff` | Save session progress for next session | Low |

## Usage Tips
- All commands accept arguments: `/code-review the auth flow`
- Commands auto-load relevant docs via `@/` references.
- Subagents get project context injected automatically via hooks.
- Keep arguments specific to avoid unnecessary exploration.
