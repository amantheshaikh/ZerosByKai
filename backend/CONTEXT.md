# Backend Context (Tier 2)

> **Note**: This is component-specific context. See root **CLAUDE.md** for master project context and coding standards.

## Purpose
The backend handles API requests, user authentication via Supabase, and core ingredient analysis logic using Google Gemini.

## Current Status: Active Development ✅
Basic server structure is up. API endpoints for analysis and profile management are being developed.

## Component-Specific Development Guidelines
- **Technology**: Node.js, Express/Fastify.
- **Architecture**: MVC-ish (Routes -> Controllers/Handlers -> Services).
- **Code Organization**: Feature-based or Layer-based within `src/`.
- **Integration**: Supabase for DB, Google GenAI for analysis.

## Key Component Structure

### Core Modules (`src/`)
- **server.js** - Entry point.
- **routes/** - API route definitions.
- **config/** - Configuration.

## Critical Implementation Details
- **Gemini Integration**: Uses `google.genai` SDK (migrated from `google.generativeai`).
- **Supabase Auth**: Relies on Supabase for session management; backend validates tokens if necessary.
