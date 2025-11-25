---
name: type-driven-development
description: Run validation-first Idris2 workflows with tiered commands (CHECK/VALIDATE/GENERATE/REMEDIATE) and strict exit codes.
---

# SKILL: Type-Driven Development (Idris2)

Capability
- Run validation-first Idris2 workflows with tiered commands (CHECK/VALIDATE/GENERATE/REMEDIATE) and strict exit codes.

Inputs
- Working directory with `.ipkg` or `.idr` sources.
- Idris2 installed and on PATH.

Preconditions
- `command -v idris2 >/dev/null || exit 11`
- `fd -e ipkg -e idr . >/dev/null || exit 12`

Commands (≤120 chars)
- CHECK: `command -v idris2 >/dev/null || exit 11; fd -e ipkg -e idr . >/dev/null || exit 12; exit 0`
- VALIDATE: `fd -e ipkg -x idris2 --build {} || fd -e idr -x idris2 --check {} || exit 1`
- GENERATE: `fd -e ipkg -x idris2 --build {} --timing || fd -e idr -x idris2 --check {}`
- REMEDIATE: `rg -n 'maybe not total|covering' . && exit 14 || exit 0`

Success / Failure
- Pass when exit 0 and no totality/coverage warnings.
- Exit 13 for type errors/unsolved goals; 14 for totality gaps; 11/12 for missing tool/artifacts.

Workflow
1) CHECK preconditions.  
2) VALIDATE all packages/files.  
3) GENERATE diagnostics (timings) when needed.  
4) REMEDIATE until clean.  
5) Report exit codes and key warnings back to caller.

Safety
- Read-only operations; no file mutations.  
- Stop if commands exceed exit code 3 or >=11 class.

Remediation Tips
- Add `total` annotations and exhaustive patterns.  
- Split partial functions into total helpers.  
- Fill metas explicitly; avoid `%hint` deferrals.
