---
name: tidy
description: 'Simplify code by removing dead, redundant, and special-cased constructs. Use when the user says "tidy this up", "simplify", "clean up this diff", "polish these changes", "make this simpler", or "apply the review findings". Working tree has fewer unnecessary constructs and the build passes. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Tidy

Simplify code in the working tree by removing constructs that do not earn their keep, then verify the build.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | tidy this up, simplify, clean up this diff, polish my changes, make this simpler, apply the review findings |
| Authority | Reversible local write: edit only files in the working tree; every change is recoverable via git. |
| Side effect | Applies simplifications directly to the working tree and verifies the build. |
| Done | Working tree has fewer dead/redundant/special-cased constructs and build/lint passes. |

## Inputs

- **Required**: A file, diff, directory, or code region the user names or is currently editing.
- **Optional**: A build or lint command if the repository does not expose a standard one.

## Procedure

1. **Bound scope.** Identify the exact files and functions in scope: the user-named target, the active file, or the current diff. Do not expand beyond this set.
2. **Read end to end.** Understand what each function, type, and module in scope must convey. Note the behavioral contract each piece serves.
3. **Classify candidates.** For each construct in scope, classify as one of:
   - **Dead code**: unreachable paths, unused imports, unexported helpers with zero callers, commented-out blocks, stale feature-flag branches that are always-on or always-off.
   - **Redundant construct**: duplicated logic, a wrapper that only forwards, a variable assigned once and immediately consumed, a conditional whose guard is always true or false in context, a type alias that adds no clarity.
   - **Special case**: a branch that handles one input shape identically to the general case, a guard that duplicates the default, a fallback that cannot trigger.
   - **Ceremony**: a factory/builder/adapter with one real implementation, a generic parameter with one concrete use, an abstraction layer with no real boundary behind it.
   - **Not a candidate**: live behavior, public API contracts, real boundary seams (process, network, untrusted input, FFI), code that is verbose but not wrong.
4. **Remove in place.** Delete dead code. Inline single-use wrappers. Collapse special cases into the general path. Fuse duplicated logic into one copy. Remove ceremony that does not protect a real boundary. Do not introduce new patterns, abstractions, or dependencies.
5. **Preserve behavior.** Every simplification must be behavior-preserving. If removing a construct would change observable behavior, it is not a tidy operation; stop and report it as a candidate for a separate refactor.
6. **Verify.** Run the repository's build and lint commands. If the build or lint fails, revert the last change that caused the failure and report it.
7. **Commit separately.** Tidy commits are always separate from behavior commits. Use atomic commits with clear messages naming what was removed.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Build or lint fails after a simplification | Revert the specific change that caused the failure. Report the construct as non-removable with the error. Continue with remaining candidates. |
| Scope is ambiguous (no file, diff, or region identified) | Stop. Ask the user to name the target. Do not guess or expand scope. |
| A candidate might be live behavior | Classify as "not a candidate" and skip. Do not remove to find out. |
| No candidates found in scope | Report: "Tidy: nothing to do in the scoped files." Make no changes. |

Partial results are valid: apply all safe simplifications, report any reverted or skipped constructs, and verify the build on what remains.

## Output
```
Tidy
  Removed:   N  (up to 5 paths/names; "and M more" if larger)
  Fixed:     N
  Skipped:   N  (one-phrase reason each)
  Verified:  build + lint pass
```

If nothing needed simplifying: `Tidy: nothing to do.`

## Provenance

Adapted from mblode/agent-skills (skills/tidy/SKILL.md), revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9. Licensed under MIT. Copyright (c) 2026 Matthew Blode. Clean-room adaptation: procedure rewritten for standalone code simplification without external skill dependencies. Original trigger and authority preserved.
