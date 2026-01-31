# Hooks

## Active Hooks

### Subagent Context Injector (`subagent-context-injector.sh`)
- **Trigger:** `PreToolUse` → `Task`
- Prepends project context to all subagent prompts automatically.
- Prevents double-injection if context is already present.

### Notification System (`notify.sh`)
- **Trigger:** `Notification` (input needed) + `Stop` (task complete)
- Cross-platform audio feedback (macOS/Linux/Windows).
- Sound files in `sounds/` directory.

## Configuration
Hooks are configured in `.claude/settings.json`. Uses `${WORKSPACE}` env var for paths.

## Troubleshooting
- `chmod +x *.sh` if hooks aren't executing.
- Test: `.claude/hooks/notify.sh input`
