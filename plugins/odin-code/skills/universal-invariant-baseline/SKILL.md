---
name: universal-invariant-baseline
description: 'Use when invoked to apply an invariant-first, fail-fast, special-case-eliminating baseline. Not for domain models in types: use type-driven. Not for design-by-contract: use contract-driven.'
---

# Universal invariant baseline

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly requests an invariant-first, fail-fast, special-case-eliminating baseline for a named implementation. |
| Authority | Reversible local: writes only the named local artifact; rollback is version control (restore) or undo (file deletion). No remote mutation. |
| Side effect | Replace the target local file with its invariant-first, fail-fast, special-case-eliminating refinement. |
| Done | All named invariant checks pass and no unresolved special-case artifacts remain. |

## Inputs

Required:
- `TARGET`: path to the local source file or module to baseline.
- `LANGUAGE`: the target's language (e.g., `python`, `rust`, `typescript`). Required to select correct invariant patterns.

## Procedure

1. **Validate the request.** Confirm `TARGET` is a concrete, scoped implementation task with a named local path. If `TARGET` is absent, empty, or points to a non-local artifact, raise `BLOCKED-INPUT` and stop. **Done when:** `TARGET` is confirmed as a concrete local path.
2. **Enumerate invariants.** For `LANGUAGE`, enumerate the language-native invariant patterns that govern correctness: type contracts, ownership/borrow rules, null/void guards, resource lifecycle ordering, and domain-specific preconditions. Write each as a named, executable check with a unique identifier. **Done when:** every invariant pattern is a named, executable check with a unique identifier.
3. **Insert fail-fast guards.** Before every mutable state operation, every external call, and every branching decision, insert the matching invariant check. If any check fails, halt immediately with `INVARIANT-FAIL: <identifier>` and the observed violation. The target artifact is unchanged until all checks pass. **Done when:** every mutable state operation, external call, and branching decision has a matching invariant guard.
4. **Eliminate special cases.** Scan the target for:
   - Boolean flag arguments or module-level toggles that gate behavior.
   - Hardcoded branch paths that duplicate a general case.
   - Numeric or string domain constants used as inline guards.
   For each found artifact, either refactor the boolean branch into a data-driven lookup, merge the special case into the general path, or convert the magic constant into a named constant with a documented invariant. **Done when:** no boolean flags, hardcoded duplicate branches, or inline magic constants remain.
5. **Re-validate.** Run checks by compiling the target in its language-native build and running the existing test suite scoped to the target. If the project has no compile step, run the test suite alone. If any check fails, halt with `INVARIANT-FAIL: <identifier>` listing the specific failure. Record the complete set of removed special-case artifacts as the resolution log. **Done when:** all invariant checks pass and the resolution log is complete.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| BLOCKED-INPUT | `TARGET` absent, empty, or non-local | Stop. No file changed. |
| INVARIANT-FAIL | A named invariant check fails | Stop. Artifact unchanged. Report `<identifier>`. |
| SPECIAL-CASE-INCOMPLETE | Not all special-case artifacts resolved | Stop. Report the unresolved set. |

Partial-result rule: in-place edits to the target are rolled back via VCS on failure. Run `git restore TARGET` to revert the working copy to its pre-edit state. If the target was a new file, delete it instead. No partial result is emitted.

## Output
The target local artifact replaced with its invariant-first refinement, plus a resolution log listing every removed special case and the invariant identifier that now governs its behavior.
