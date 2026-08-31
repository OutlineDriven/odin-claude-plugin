---
name: constraint-driven-development
description: 'Use when asked to implement under explicit non-negotiable constraints such as performance budgets, platform limits, or legal or API rules. Extracts constraints into checkable invariants, implements with fast-check loops, and verifies no constraint worsened against a baseline guard. No remote, credential, publish, deploy, or irreversible mutation.'
---

# Constraint-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing under explicit non-negotiable constraints such as performance budgets, platform limits, or legal or API rules. |
| Authority | Reversible local writes to the constraints record and the constrained code changes in the working tree. Roll back by reverting those writes; never mutate VCS history, credentials, or remote state. |
| Side effect | A constraints record and the code changes that satisfy it, both local and revertible. |
| Done | All stated constraints verifiably pass in the delivered change and no unrelated behavior regressed, recorded in the constraints artifact. |

## Inputs

Required: the set of non-negotiable constraints the change must satisfy, each stated as a measurable predicate (a budget number, a platform limit, or a legal or API rule with a checkable condition). Optional: an existing constraints record that already governs the target tree. A constraint that arrives as prose without a measurable form must be converted to one before any code is written; a constraint that cannot be checked is unmeasurable and stops the run.

## Procedure

1. Read the target tree once to learn language, stack, test runner, and any existing constraints record. Do not ask for what is readable. Done when: the target tree is read and its stack and test runner are known.
2. Extract every stated constraint into a named invariant: a predicate, the command or inspection that produces its verdict, and the value it must hold. Record them in a constraints record at the repo root, one row per constraint (name, rule, checked-by, runs-at). A constraint with a number and no check command is unmeasurable, not a constraint; stop and ask the user to supply a check or drop the constraint. A constraint with no number is not non-negotiable until the user supplies the target value; do not invent one. Done when: every constraint is a named invariant with a check and a target value, recorded in the constraints record.
3. Bound the change scope before mutating: list the files the work will touch. Constraints apply to the diff, not the whole tree, unless a constraint is explicitly project-wide. Done when: the change scope is bounded and listed.
4. Capture the baseline. Run each constraint's checked-by command against the current tree and record the measured value. This baseline is the floor: the delivered change must not produce a worse value for any constraint. Done when: every constraint has a recorded baseline value.
5. Implement the change. After each edit run the fast subset of checks (types, lint, the constraints whose checked-by command is fast) scoped to the touched files. Done when: the change is implemented and the fast checks pass for each edit.
6. Validate against the baseline guard. For each constraint, run its checked-by command on the delivered change and compare the result to the baseline value from Step 4. A constraint is violated when the delivered value is worse than the baseline (a threshold exceeded, a count increased, a check that previously passed now fails). Tightening is silent; loosening is a violation. A constraint that cannot be re-measured after the change is unverified and blocks done. Done when: every constraint is re-measured and none worsened against the baseline.
7. Run the full check set: every constraint's checked-by command against the complete change, plus the project test suite. Scope expensive checks (mutation testing, security scans) to the touched files. Done when: every constraint's checked-by command runs and the test suite passes.
8. Verify the done predicate: every constraint holds in the delivered change and none worsened against the baseline. Done when: every constraint holds and the baseline guard is clean, or the failing constraint is named.

## Failure and recovery

- Unmeasurable constraint: stop and convert it to a measurable predicate with a target value before any code change. Do not proceed on prose. Do not substitute a self-invented target for a missing number.
- Baseline guard violation: a constraint worsened against its baseline. Fix the code, or route the deviation through a tracked exception with an owner and an expiry; never weaken the constraints record to make a change pass.
- A constraint cannot be re-measured after the change: the constraint is unverified. Do not treat the change as clean; report that the guard could not run and hold the change for a human.
- A constraint fails at task end: fix the code, not the constraint. Relaxing a threshold is a separate human decision recorded as an exception, not a side effect of implementation.
- Partial result: deliver only the subset of changes for which every constraint verifiably holds and revert the rest. Never claim the done predicate holds for work that was not checked.

## Output

Constraints record naming each invariant with its check and baseline value, the delivered code change in which every constraint holds without regression, and a check-run report stating which constraints passed, which baseline-guard violations were flagged (none on success), and any constraint that could not be checked and why.
