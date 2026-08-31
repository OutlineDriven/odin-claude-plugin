---
name: code-simplification
description: 'Use when the user asks to simplify, clean, or refine code. Measured mode cuts duplication or branch complexity under a green test gate; clarity mode refines readability while preserving behavior by reasoning. Not for new abstractions or whole-codebase refactors.'
---

# Code simplification

Two modes share one authority: reversible local edits to a named target, no new public surface, behavior preserved. Measured mode proves reduction with the test suite; clarity mode proves preservation by reasoning over the recorded behavior contract.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to simplify, clean, refactor, or improve the readability of code, or review flags bloat beyond the current diff. |
| Authority | Reversible local edits to the named target only. May refactor, extract, inline, and collapse conditionals; may not add new public surface or edit files outside the target. |
| Side effect | Refactoring edits to the named target only; no new public surface. |
| Done | Mode-specific done predicate holds (see each mode); behavior is preserved by tests (measured) or by recorded-contract reasoning (clarity). |

## Inputs

- Target (required): the file, module, function, or range to simplify. Named by the user.
- Test command (required for measured mode): the command that runs the test suite proving behavior preservation.
- Bloat signal (optional, measured mode): a review-flagged duplication hotspot or branch-complexity concern to prioritize. If absent, measure duplication and branch complexity on the target.
- Constraints (optional, clarity mode): behavior that must stay identical (public signatures, outputs, side effects, ordering). Infer these from the code when omitted.

## Mode selection

| User says | Mode | Gate |
|---|---|---|
| simplify, clean, debloat, reduce duplication or complexity, review flagged bloat | measured | Test suite green and bloat signal lower than baseline |
| simplify for readability, clean up, refactor for clarity, make this clearer | clarity | Recorded behavior contract unchanged after each edit |

When the user names a test command or a bloat signal, use measured mode. When the user names only a readability goal and no test command, use clarity mode. When both are supplied, use measured mode and prefer clarity-preserving candidates.

## Measured mode

1. Bound scope to the named target. Do not edit files outside it or introduce new public surface. Done when: scope is bounded to one named target.
2. Run the test command to establish a green baseline. If the suite is red, stop: behavior preservation cannot be proven on a red baseline. Done when: the test suite is green or the failing tests are reported and the skill stops.
3. Measure the current bloat signal on the target: duplicated blocks, branch count, or cyclomatic complexity. Record the baseline number. Done when: the baseline bloat signal is recorded.
4. Identify simplification candidates that preserve observable behavior: extract shared logic to remove duplication, collapse conditional branches into the general case, inline trivial single-use wrappers, flatten nesting past three levels. Done when: a candidate list is produced or the artifact is at its simplification floor.
5. Apply one simplification at a time. After each edit, run the test command. If any test fails, revert that edit and record the failing test. Done when: the edit is applied and tests pass, or the edit is reverted with the failing test recorded.
6. Re-measure the bloat signal. If it did not decrease, the edit did not satisfy the done predicate; discard it. Done when: the bloat signal is lower than the baseline, or the edit is discarded.
7. Repeat until no further behavior-preserving reduction is found or the remaining candidates risk changing observable behavior. Done when: no candidate remains that both preserves behavior and reduces the signal.
8. Run the full test command a final time. Confirm green and that the measured bloat signal is lower than the baseline. Done when: tests are green and the bloat signal is below the baseline.

## Clarity mode

1. Read the named target in full before changing anything. Record the observable behavior it must preserve: inputs, outputs, return paths, exceptions, side effects, and ordering. Done when: the target is read and its behavior contract is recorded.
2. Bound scope to the named target. Do not edit files, functions, or ranges the user did not name. Done when: scope is bounded to the named target.
3. Identify simplifications that preserve the recorded behavior: collapse special cases into the general case, inline trivial indirection, flatten deep nesting, remove dead branches and redundant conditions, replace verbose idioms with clearer equivalents, shorten long parameter lists by grouping related parameters. Done when: a candidate list is produced or the code is already clear and maintainable.
4. Apply one change at a time. After each change, confirm the recorded behavior is unchanged: signatures match, outputs and side effects match, and no control path was added, removed, or reordered. Done when: the change is applied and behavior is confirmed identical, or the change is reverted.
5. Stop when no further simplification preserves behavior or the remaining candidates add no clarity. Do not refactor for taste alone once the code is clear and maintainable. Done when: no candidate remains that both preserves behavior and adds clarity.

## Failure and recovery

- Red baseline (measured): the test suite is not green before any edit. Stop; do not simplify on an unproven baseline. Report the failing tests.
- Test regression after an edit (measured): revert that edit immediately. Record the edit and the failing test. Continue with other candidates only if the baseline stays green.
- No measurable reduction (measured): if no candidate lowers the bloat signal while keeping tests green, report that the artifact is already at its simplification floor. Do not force cosmetic changes.
- Behavior drift (clarity): if a change alters any recorded behavior, revert that change and do not re-attempt it. Report which behavior drifted.
- Ambiguous target (clarity): if the user did not name concrete code or the behavior to preserve cannot be determined from the code, stop and ask for the missing input. Do not guess scope.
- Scope creep: if a candidate requires editing outside the target or adding public surface, discard it. Report the candidate and the boundary it crossed.
- Non-converged: if simplification cycles or each candidate is rejected for behavior drift, stop and report the code as non-converged with the attempted changes listed.
- Partial result: keep applied changes that preserve behavior; report any rejected change and the reason. Never claim the done predicate holds when behavior is unverified.

## Output

Simplified target plus a report: mode, baseline → final bloat signal (measured) or recorded-contract verdict (clarity), applied simplifications, reverted edits with reasons, final test result (measured) or final behavior-confirmation result (clarity). Terminal classification: simplified, already-at-floor, or blocked.

