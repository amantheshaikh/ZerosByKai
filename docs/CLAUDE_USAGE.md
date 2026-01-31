# Claude Code Usage Guide

This guide explains how to effectively use the Claude Code Development Kit setup in **ZerosByKai**.

## 🚀 Quick Start

1.  **Start Claude**: Open your terminal in the project root and type `claude`.
2.  **Context is Auto-Loaded**: `CLAUDE.md`, `project-structure.md`, and `docs-overview.md` are automatically read by Claude at the start of every session. You don't need to manually paste them.

## 🛠 Available Commands

Use these slash commands to trigger specific AI workflows.

| Command | Usage | Description |
| :--- | :--- | :--- |
| **/full-context** | `/full-context "Add Stripe payment"` | Analyze the request against the full project documentation before starting. |
| **/update-docs** | `/update-docs` | Scan recent changes and update `CONTEXT.md` files. |
| **/create-docs** | `/create-docs backend/src/new-service` | Generate initial documentation for a new component. |
| **/code-review** | `/code-review src/components/Header.tsx` | strict review of specific files against project standards. |
| **/refactor** | `/refactor "Simplify logic" src/utils.ts` | Propose refactoring improvements. |
| **/handoff** | `/handoff` | Generate a summary of the current session for the next session. |

## 💡 Workflow Examples

### 1. Adding a New Feature
**Goal**: Add a "Dark Mode" toggle.

1.  **Analyze**:
    ```bash
    /full-context "I want to add a dark mode toggle to the frontend. Analyze the impact on tailwind config and existing components."
    ```
2.  **Implement**:
    Claude will propose a plan. Ask it to proceed.
3.  **Document**:
    ```bash
    /create-docs frontend/components/ThemeToggle.tsx
    ```
    (Or let Claude update existing docs automatically).

### 2. Debugging a Complex Issue
**Goal**: API returns 500 on valid requests.

1.  **Investigate**:
    ```bash
    /full-context "The /analyze endpoint is failing with 500. Check backend/src/server.js and potential integration issues."
    ```
2.  **Fix**:
    Claude will analyze the context and suggest fixes.

### 3. Refactoring Integration Code
**Goal**: specific cleanup.

1.  **Run**:
    ```bash
    /refactor "Extract the Supabase client initialization into a singleton" backend/src/server.js
    ```

## 📝 Best Practices

-   **Trust the Context**: You rarely need to copy-paste file contents. If Claude is confused, use `/full-context` to force a "deep think" on the docs.
-   **Keep Docs Alive**: After a big change, run `/update-docs`. If `docs` get stale, the AI gets dumber.
-   **Example-Driven**: When asking for code, reference existing files: "Write this like `frontend/components/Header.tsx`".
