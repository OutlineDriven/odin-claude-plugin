---
name: code-simplification
description: 'Use when the user asks to simplify or clean a specific code artifact, or when review flags bloat beyond the current diff. Reduces measured duplication or branch complexity while keeping the test suite green and behavior unchanged. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Code simplification

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to simplify or clean a specific code artifact, or review flags bloat beyond the current diff. |
| Authority | Reversible local edits to the target artifact only. May refactor, extract, inline, and collapse conditionals; may not add new public surface or edit files outside the target. |
| Side effect | Refactoring edits to the target artifact only; no new public surface. |
| Done | Test suite green, measured duplication or branch complexity reduced, zero behavior change demonstrated by existing tests. |

## Inputs

- Target artifact path (required): the file or module to simplify.
- Test command (required): the command that runs the test suite proving behavior preservation.
- Bloat signal (optional): a review-flagged duplication hotspot or branch-complexity concern to prioritize. If absent, measure duplication and branch complexity on the target.

## Procedure

1. Bound scope to the named target artifact. Do not edit files outside it or introduce new public surface.
2. Run the test command to establish a green baseline. If the suite is red, stop: behavior preservation cannot be proven on a red baseline.
3. Measure the current bloat signal on the target: duplicated blocks, branch count, or cyclomatic complexity. Record the baseline number.
4. Identify simplification candidates that preserve observable behavior: extract shared logic to remove duplication, collapse conditional branches into the general case, inline trivial single-use wrappers, flatten nesting past three levels.
5. Apply one simplification at a time. After each edit, run the test command. If any test fails, revert that edit and record the failing test.
6. Re-measure the bloat signal. If it did not decrease, the edit did not satisfy the done predicate; discard it.
7. Repeat until no further behavior-preserving reduction is found or the remaining candidates risk changing observable behavior.
8. Run the full test command a final time. Confirm green and that the measured bloat signal is lower than the baseline.

## Failure and recovery
- Red baseline: the test suite is not green before any edit. Stop; do not simplify on an unproven baseline. Report the failing tests.
- Test regression after an edit: revert that edit immediately. Record the edit and the failing test. Continue with other candidates only if the baseline stays green.
- No measurable reduction: if no candidate lowers the bloat signal while keeping tests green, report that the artifact is already at its simplification floor. Do not force cosmetic changes.
- Scope creep: if a candidate requires editing outside the target artifact or adding public surface, discard it. Report the candidate and the boundary it crossed.
- Blocked or non-converged result: report the target, baseline and final bloat signal, the list of applied and reverted edits, and the exact failing test if the suite is red.

## Output
The simplified target artifact plus a report containing: baseline and final bloat-signal measurement, the list of applied simplifications, any reverted edits with reasons, and the final test-command result. Terminal classification: simplified (signal reduced, tests green), already-at-floor (no reduction possible), or blocked (red baseline or unrecoverable regression).

## Provenance

Adapted from addyosmani/agent-skills, skills/code-simplification/SKILL.md, pinned revision d2c37ef6225dd8726cdd369a8030307f48592d26 (MIT). Copyright (c) 2025 Addy Osmani. This is a clean-room adaptation: the behavior-preserving simplification contract is re-expressed from the source mechanism; no source expression is copied. The MIT copyright notice and permission text are retained per the license obligation.
