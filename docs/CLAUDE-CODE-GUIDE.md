# Claude Code Setup Guide — ZerosByKai

Your Claude Code setup is optimized for minimal token consumption. Here's what's configured and how to use it.

---

## What's Configured

### Files Structure
```
.claude/
├── settings.json          # Hook configuration
├── settings.local.json    # Auto-approved permissions
├── commands/              # Slash commands (skills)
│   ├── full-context.md    # /full-context
│   ├── code-review.md     # /code-review
│   ├── update-docs.md     # /update-docs
│   ├── create-docs.md     # /create-docs
│   ├── refactor.md        # /refactor
│   └── handoff.md         # /handoff
└── hooks/
    ├── subagent-context-injector.sh  # Auto-injects project context into subagents
    ├── notify.sh                     # Audio feedback
    └── sounds/                       # Notification sounds
```

### Hooks (Automatic)
1. **Subagent Context Injector** — When Claude spawns subagents, project context is automatically prepended. You never need to say "make sure to read CLAUDE.md first."
2. **Audio Notifications** — Plays a sound when Claude needs input or finishes a task, so you don't need to watch the terminal.

### Auto-Approved Permissions
Common read-only commands are pre-approved so Claude doesn't ask you each time:
- `npm run build/dev/lint`, `git status/diff/log/add`, `ls`, `tree`, `WebSearch`

---

## Slash Commands

### `/full-context <task description>`
**Use before starting any significant task.** Gathers project context efficiently.
```
/full-context implement a new admin dashboard
/full-context fix the voting bug on mobile
```

### `/code-review <scope>`
**Use after implementing features.** Spawns parallel agents for security, reliability, performance.
```
/code-review the auth flow
/code-review backend/src/routes/votes.js
/code-review recent changes
```

### `/update-docs`
**Use after code changes.** Updates CONTEXT.md files to keep AI context fresh.
```
/update-docs                    (analyzes session context)
/update-docs last 3 commits     (analyzes recent git history)
```

### `/refactor @file1 @file2`
**Use for restructuring files.** Analyzes dependencies, suggests splits, updates imports.
```
/refactor @frontend/pages/index.jsx
/refactor @backend/src/jobs/weekly.js
```

### `/handoff`
**Use when ending a session.** Saves progress for the next session to pick up.
```
/handoff completed the profile page redesign
/handoff blocked on Supabase migration
```

### `/create-docs`
**Use once to set up documentation.** Generates the 3-tier doc structure.
```
/create-docs
/create-docs backend only
```

---

## Token Optimization Tips

### 1. Be Specific in Requests
```
Bad:  "Fix the app"                              (Claude explores everything)
Good: "Fix the vote count on profile.jsx"         (Claude reads 1-2 files)
```

### 2. Reference Files Directly
```
Bad:  "Update the email template"                 (searches for it)
Good: "Update backend/src/emails/templates.js"    (reads directly)
```

### 3. Use `/full-context` Only When Needed
Skip it for simple, targeted tasks. Use it for complex features that span multiple files.

### 4. Use `/compact` When Context Gets Long
Claude Code's built-in `/compact` command summarizes the conversation to free up context window space. Use it during long sessions.

### 5. One Task Per Message
Instead of "fix the bug, add a feature, and update docs," do them as separate requests. This keeps Claude focused and avoids unnecessary file reads.

### 6. Don't Repeat Context
The subagent hook auto-injects project context. You never need to tell Claude to "read CLAUDE.md" or "check the project structure." It happens automatically.

### 7. Skip `/update-docs` for Small Changes
Only run it after significant feature additions or architectural changes. Bug fixes and tweaks don't need doc updates.

### 8. Use Plan Mode for Complex Tasks
For multi-file features, Claude will enter plan mode automatically. This reads files once, plans, then executes — instead of reading files repeatedly.

---

## How Token Costs Break Down

| Action | Token Cost | When to Use |
|--------|-----------|-------------|
| Simple file edit | ~Low | Bug fixes, small changes |
| `/full-context` | ~Medium | Before complex tasks |
| `/code-review` | ~High | After significant features |
| `/update-docs` | ~Low-Medium | After architecture changes |
| `/refactor` | ~Medium-High | File restructuring |
| `/handoff` | ~Low | End of session |
| Subagent (auto) | ~Low per agent | Handled automatically |

### What Drives Token Costs
1. **Number of files read** — Each file read consumes tokens proportional to its size.
2. **Command prompt length** — Our commands are optimized to ~20-35 lines instead of 150-300.
3. **Subagent count** — More agents = more tokens, but they run in parallel so wall-clock time stays low.
4. **Conversation length** — Use `/compact` to manage this.

---

## Documentation System (3-Tier)

```
Tier 1 (Foundational) — read by every session
├── CLAUDE.md                           # Project overview + standards
├── docs/ai-context/project-structure.md # Full file tree
└── docs/ai-context/docs-overview.md     # Doc system map

Tier 2 (Component) — read when working on that component
├── backend/CONTEXT.md
└── frontend/CONTEXT.md

Tier 3 (Feature) — read for specific subsystems
└── backend/src/CONTEXT.md
```

Keep these files concise. Every extra line costs tokens every time Claude reads them.

---

## Typical Workflow

```bash
# 1. Start a new feature
/full-context implement email preference settings

# 2. Claude plans and implements...

# 3. After implementation, review
/code-review the email preferences feature

# 4. Update docs if architecture changed
/update-docs

# 5. End of session
/handoff completed email preferences, needs testing
```

For simple fixes, skip straight to describing the task — no commands needed.
