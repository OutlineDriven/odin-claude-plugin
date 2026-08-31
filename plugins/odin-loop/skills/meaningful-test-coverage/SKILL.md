---
name: meaningful-test-coverage
description: 'Use when a test surface needs meaningful coverage raised to a configured target without vacuous tests. Stop at declared success, non-success, or the bound. Not for line-coverage inflation — use mutation testing for that.'
---

# Meaningful test coverage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A test surface needs meaningful coverage raised to a configured target without vacuous tests. |
| Authority | Reversible local: write only test files inside the declared scope; rollback by reverting those files. |
| Side effect | New or revised tests that raise meaningful coverage to the configured target. |
| Done | The configured target is met with assertions that survive mutation and value checks. |

## Inputs

- **Test surface** (required): the module, package, or path whose coverage is being raised.
- **Coverage target** (required): the percentage or count that defines success.
- **Test budget** (required): the maximum effort or time allowed, declared before work begins.
- **Scope** (required): the files that may be edited, frozen before mutation.

## Procedure

1. Bind the declared bound — target, scope, and test budget — and freeze it before writing any test. Done when: the bound is recorded in writing and no edit has been made yet.
2. Raise meaningful coverage toward the target inside the bound. Add or revise tests whose assertions guard observable behavior, boundaries, invariants, and real error paths — not lines that merely execute. Done when: the coverage tool reports the target met or a non-success terminal applies.
3. Stop at the first of: target met (success), a non-success terminal (justified exclusion, stalled, blocked), or budget exhausted. Budget exhaustion is never success unless it was the predeclared success predicate. Done when: exactly one terminal class is selected and recorded.
4. Persist the result: write the run record to `.outline/loops/<slug>/<run_id>/` when durable, and emit `receipt.json` before returning. Done when: the receipt file exists and contains every required field.

## Failure and recovery

- **Budget exhausted before target met**: terminal `exhausted`. Report the coverage reached and the gap. Do not claim success.
- **Scope cannot be covered inside the bound**: terminal `blocked`. Name the blocking file or dependency. Do not widen scope.
- **Tests pass but mutations survive**: the coverage is not meaningful. Revise the assertions to guard the mutated behavior, or classify as `stalled` if the gap cannot be closed inside the budget.
- **Justified exclusion**: a target path is excluded for a stated reason (generated code, third-party, unreachable). Record the exclusion; do not count it against the target.

## Output

A coverage result: terminal class (success, capped, stalled, blocked, exhausted, pending), coverage reached, files edited, and the receipt path — ordered by the procedure steps that produced them.
