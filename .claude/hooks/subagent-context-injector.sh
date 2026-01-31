#!/bin/bash
# Subagent Context Injector Hook
# Automatically prepends project context to Task subagent prompts.
# This saves tokens by ensuring subagents have context without manual copy-paste.

WORKSPACE="${WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# Read the tool input from stdin (JSON)
INPUT=$(cat)

# Extract the prompt field from the Task tool input
PROMPT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # Navigate to the prompt in tool_input
    tool_input = data.get('tool_input', data)
    print(tool_input.get('prompt', ''))
except:
    print('')
" 2>/dev/null)

# If no prompt found, pass through
if [ -z "$PROMPT" ]; then
    exit 0
fi

# Check if context is already injected (avoid double-injection)
if echo "$PROMPT" | grep -q "## Project Context (Auto-Injected)"; then
    exit 0
fi

# Build concise context block
CONTEXT="## Project Context (Auto-Injected)
ZerosByKai: Startup ideas platform. Frontend=Next.js 14 (frontend/), Backend=Node.js/Express (backend/), DB=Supabase, AI=Gemini.
Key files: CLAUDE.md (root), docs/ai-context/project-structure.md (file tree), backend/src/CONTEXT.md, frontend/CONTEXT.md.
"

# Inject context by prepending to the prompt
NEW_PROMPT="${CONTEXT}
${PROMPT}"

# Output modified tool input
echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
tool_input = data.get('tool_input', data)
tool_input['prompt'] = '''${NEW_PROMPT}'''
json.dump(data, sys.stdout)
" 2>/dev/null

exit 0
