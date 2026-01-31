Refactor the specified files: "$ARGUMENTS"

@/CLAUDE.md
@/docs/ai-context/project-structure.md

## Process
1. Parse @ tagged file paths from arguments.
2. Read each file + its imports/exports + consuming files.
3. For complex files, spawn parallel agents:
   - **Structure**: Split points, cohesion, component boundaries.
   - **Dependencies**: Import chains, circular risks, consuming files.
   - **Patterns**: Project conventions, naming, directory structure.
4. Assess: Is refactoring actually worth it? If the file is well-organized, say so honestly.
5. Execute: Create files → update imports → verify nothing breaks.

## Rules
- Preserve all functionality. No breaking changes.
- Follow existing project conventions.
- Update all import paths in consuming files.
- Run `npm run build` in frontend after changes.
- Skip files that don't benefit from refactoring — explain why.
