# Documentation System Guide

This guide explains the 3-tier documentation architecture for ZerosByKai. This system ensures AI agents have precise context without token overhead.

## 🗺️ Documentation Index

| Tier | Document | Purpose |
|------|----------|---------|
| **1: Foundation** | [CLAUDE.md](../CLAUDE.md) | Master coding standards & standards. |
|  | [project-structure.md](ai-context/project-structure.md) | Tech stack & file tree. |
|  | [architecture.md](ai-context/architecture.md) | Integration patterns & infrastructure. |
|  | [handoff.md](ai-context/handoff.md) | Session continuity protocol. |
| **2: Component** | [Backend Context](../backend/CONTEXT.md) | API reference & cron logic. |
|  | [Frontend Context](../frontend/CONTEXT.md) | Design system & UI patterns. |
|  | [MASTER_WORKFLOW.md](MASTER_WORKFLOW.md) | Newsletter lifecycle (Step-by-step). |
| **3: Feature** | [Auth Documentation](AUTH_DOCUMENTATION.md) | Identity flow deep-dive. |
|  | [Idea Extraction Logic](idea_extraction_logic.md) | AI scraping & generation heuristics. |

---

## Why the 3-Tier System?
Standard documentation often suffers from **Context Overload** or **Maintenance Burden**. Our system isolates changes:

- **Tier 1: Foundation (Rarely Changes)** - High-level architecture and standards.
- **Tier 2: Component (Occasionally Changes)** - Integration points and component boundaries.
- **Tier 3: Feature (Frequently Changes)** - Local implementation details.

## Implementation Strategy

### 1. Naturally Isolated
Place `CONTEXT.md` files with related code:
```
backend/
├── CONTEXT.md         # Backend architecture (Tier 2)
└── src/
    └── api/
        └── CONTEXT.md # API implementation (Tier 3)
```

### 2. Standardized Templates
Use our pre-defined templates for consistency:
- [Component Template (Tier 2)](templates/CONTEXT-tier2-component.md)
- [Feature Template (Tier 3)](templates/CONTEXT-tier3-feature.md)

---

*Part of the ZerosByKai platform - see [Main README](../README.md) for project overview.*