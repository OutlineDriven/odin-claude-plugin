---
name: incremental-implementation
description: 'Use when implementing a multi-file change, building a feature from a breakdown, or writing a large amount of code. Not for a single settled ticket: use work.'
---

# Incremental implementation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing any multi-file change, building a new feature from a breakdown, refactoring, or when about to write more than a small amount of code at once. |
| Authority | Reversible local: writes only named local artifacts; rollback is version control (revert of each slice commit). No remote mutation. |
| Side effect | Sequence of tested, committed slices, possibly behind feature flags. |
| Done | Each slice was individually tested and committed, the full suite passes, the build is clean, and the feature works end-to-end without uncommitted changes. |

## Inputs

- Plan or breakdown (required): ordered list of atomic changes that together deliver the feature or refactor. Each item must name the files it touches and the observable behavior it adds or changes.
- Existing test suite (required): the project's current test runner and passing baseline.
- Feature flag mechanism (optional): if the project uses feature flags, the flag name and gating surface for the new behavior.

## Procedure

1. Read the plan. Confirm each item is independently compilable and testable. If an item cannot be tested in isolation, split it further before proceeding.
2. For each plan item, in order:
   a. Implement the change across the named files. Keep the slice as thin as possible: one behavior, one concern, one testable contract.
   b. If a feature flag is in scope, gate the new behavior behind it so the system remains correct with the flag off.
   c. Run the affected tests. If the project has a fast targeted test command, use it; otherwise run the full suite.
   d. Confirm the build is clean: no new warnings, no type errors, no lint regressions on touched files.
   e. Commit the slice with a message that names the behavior added or changed. Do not bundle unrelated changes.
3. After all slices are committed, run the full test suite once more to confirm no cross-slice interaction introduced a regression.
4. Verify end-to-end: exercise the feature or refactor path manually or via integration test to confirm the complete behavior works.
5. If a feature flag was used, confirm the flag-on and flag-off paths both pass. Leave the flag in place unless the plan explicitly calls for its removal in a later slice.

## Failure and recovery
- Slice fails tests: stop. Fix the current slice before starting the next. Do not skip ahead or commit a broken state.
- Build breaks on a slice: stop. Revert the last commit if the fix is not immediate. Re-implement the slice with the narrower scope that keeps the build green.
- Cross-slice regression detected in step 3: bisect by reverting the most recent slice commit and re-running. Identify the conflicting slice and reconcile before re-committing.
- **Plan item cannot be split into a testable slice**: mark it blocked. Do not proceed to dependent items. Report the blocker and the minimum prerequisite needed.
- Partial result rule: committed slices that passed their own tests are retained. Only the failing or conflicting slice is reverted or reworked.

## Output
- A sequence of commits, each passing its own tests and the build.
- A clean working tree with no uncommitted changes.
- A passing full test suite.
- A confirmed end-to-end behavior for the feature or refactor.
