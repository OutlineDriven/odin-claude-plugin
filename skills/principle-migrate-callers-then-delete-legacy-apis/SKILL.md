---
name: principle-migrate-callers-then-delete-legacy-apis
description: 'Use when asked to replace an internal API by migrating every caller in one wave, then deleting the legacy path under version control. Don''t use for untracked data or changes without a version-control rollback.'
---

# Principle: migrate callers then delete legacy APIs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Replace an internal API. |
| Authority | vcs-reversible-destructive — deletes legacy source paths; every deletion is recoverable from version control. |
| Side effect | Migrates all callers to the new contract and deletes the legacy path. Local files and VCS only; no remote, credential, or paid-resource mutation. |
| Done | Only the new contract remains: zero references to the old API, zero legacy source files, and the project builds and tests pass. |

## Inputs

1. **Legacy API identifier** (required) — the function, method, class, or module to remove. Must be supplied by the human invoker.
2. **New API identifier** (required) — the replacement contract callers must adopt.
3. **Scope root** (optional) — the directory tree to search for callers. Defaults to the repository root.

## Procedure

1. **Bound scope.** Confirm the legacy API exists and identify every call site within the scope root using static search (grep, AST tooling, or IDE references). Record the complete caller list before any mutation.
2. **Classify callers.** Group call sites by migration pattern: direct replacement, signature adaptation, or removal (dead code). Flag any caller whose migration is ambiguous for human review before proceeding.
3. **Migrate callers in one wave.** Apply the migration to every classified call site. Each edit must compile and pass the project's type checker or linter after the wave completes. Do not leave partial migrations — if one caller cannot migrate, halt the wave and report the blocker.
4. **Verify zero references.** Search the scope root again for the legacy API identifier. If any reference remains, report each location and stop — do not delete the legacy path yet.
5. **Delete the legacy path.** Remove the legacy source file, export, or declaration. Remove any re-exports, barrel entries, or type aliases that forwarded it.
6. **Run project checks.** Execute the project build and test suite. If any check fails, inspect the failure: if caused by a missed caller, return to step 3; if caused by the deletion itself, restore the deleted file from VCS and report.

## Failure and recovery
| Failure class | Response |
|---|---|
| Ambiguous caller migration | Halt before mutation. Report the ambiguous call site and the two candidate interpretations. Await human decision. |
| Missed caller after deletion | Restore the deleted legacy file from VCS. Re-run step 3 for the missed caller, then repeat steps 4–6. |
| Build or test failure after deletion | Restore the deleted file from VCS. Diagnose whether the failure is a missed caller or a dependency not captured in the caller list. Fix and re-attempt. |
| Scope too broad or too narrow | Report the mismatch. Do not silently widen or narrow scope. Await human confirmation of the correct scope root. |

Partial-result rule: if the wave completes but verification fails, no deletion occurs. The migration is rolled back to the last consistent state.

## Output
- A migration report listing every caller migrated, the pattern applied, and the legacy path deleted.
- Confirmation that zero references to the legacy API remain.
- Confirmation that the project build and test suite pass.

## Provenance

- Origin: cursor/plugins — pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md
- Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa
- License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25; authored by Lauren Tan (poteto))
- Adaptation: Clean-room rewrite preserving the one-wave caller migration and VCS-recoverable deletion mechanisms from the source material under MIT license terms.
