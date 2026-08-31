---
name: constraint-driven-development
description: 'Use when asked to implement under explicit non-negotiable constraints (performance budgets, platform limits, legal or API rules). Extracts constraints into checkable invariants and verifies every change holds them. No remote, credential, publish, deploy, or irreversible mutation.'
---

# Constraint-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing under explicit non-negotiable constraints such as performance budgets, platform limits, or legal or API rules. |
| Authority | Write only the constraints record and the constrained code changes in the working tree. Roll back by reverting those writes; never mutate VCS history, credentials, or remote state. |
| Side effect | A constraints record and the code changes that satisfy it, both local and revertible. |
| Done | All stated constraints verifiably hold in the delivered change and no unrelated behavior regressed. |

## Inputs

Required: the set of non-negotiable constraints the change must satisfy, each stated as a measurable predicate (a budget number, a platform limit, or a legal or API rule with a checkable condition). Optional: an existing constraints record that already governs the target tree. A constraint that arrives as prose without a measurable form must be converted to one before any code is written; a constraint that cannot be checked cannot be held.

## Procedure

1. Read the target tree once to learn language, stack, test runner, and any existing constraints record. Do not ask for what is readable. Done when: the target tree is read and its stack and test runner are known.
2. Extract every stated constraint into a named invariant: a predicate, the command or inspection that produces its verdict, and the value it must hold. Record them in a constraints record at the repo root, one row per constraint (name, rule, checked-by, runs-at). A constraint with a number and no check is an aspiration, not a constraint; give it a check or drop it. Done when: every constraint is a named invariant with a check, recorded in the constraints record.
3. Bound the change scope before mutating: list the files the work will touch. Constraints apply to the diff, not the whole tree, unless a constraint is explicitly project-wide. Done when: the change scope is bounded and listed.
4. Implement the change. After each edit run the fast subset of checks (types, lint, the floor) scoped to the touched files. Done when: the change is implemented and the fast checks pass for each edit.
5. On every change run a diff-scoped floor guard over the merge-base-to-working-tree diff including untracked files. It flags the five bar-lowering moves: a threshold in the constraints record moved down, a test made easier (a skip added, a test file deleted, or an assertion removed from a test that stayed), a checker silenced (a new suppression comment), unfinished work (a stub that throws, an empty catch, or a TODO where the implementation should be), or a new exception row. Tightening is silent; loosening is loud. Exit 0 is clean, 1 is at least one violation (block the change), 2 is the guard could not run (no merge base or not a git repo); never let a 2 read as a 0. Report the rule and the location, never a matched secret value. Done when: the floor guard exits 0 (clean) or the violation is named and the change is blocked.
6. At task end run the full check set: every constraint's checked-by command against the diff, plus the floor guard. Scope expensive checks (mutation testing, security scans) to the touched files. Done when: every constraint's checked-by command runs and the floor guard is clean.
7. Verify the done predicate: every constraint holds in the delivered change and the floor guard is clean. Where a target number is unknown, record today's measured value and refuse to get worse rather than inventing a target the codebase cannot meet. Done when: every constraint holds and the floor guard is clean, or the failing constraint is named.

## Failure and recovery
- Unmeasurable constraint: stop and convert it to a measurable predicate before any code change. Do not proceed on prose.
- Floor guard exit 1: a bar-lowering move is in the diff. Fix the code, or route the deviation through a tracked exception with an owner and an expiry; never weaken the constraints record to make a change pass.
- Floor guard exit 2: no merge base or not a git repo. Do not treat the change as clean; report that the guard could not run and hold the change for a human.
- A constraint fails at task end: fix the code, not the constraint. Relaxing a threshold is a separate human decision recorded as an exception, not a side effect of implementation.
- Partial result: deliver only the subset of changes for which every constraint verifiably holds and revert the rest. Never claim the done predicate holds for work that was not checked.

## Output
Constraints record naming each invariant with its check, the delivered code change in which every constraint holds, and a check-run report stating which constraints passed, which floor-guard moves were flagged (none on success), and any constraint that could not be checked and why.
