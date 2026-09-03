---
name: meaningful-test-coverage
description: 'Use when a test surface needs coverage raised to a configured target with behavior-guarding assertions, not vacuous execution-only tests. Binds coverage metric and tool, mutation tool and kill threshold, measures baseline, adds guarding tests, and re-measures. Not for line-coverage inflation without mutation proof.'
---

# Meaningful test coverage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A test surface needs coverage raised to a configured target with assertions that survive mutation. |
| Authority | Reversible local: write only test files inside the declared scope; rollback by reverting those files. |
| Side effect | New or revised tests that raise meaningful coverage to the configured target. |
| Done | The coverage target is met and the mutation kill threshold is met (or the waived checklist is applied), with justified exclusions recorded. |
| Stop | Blocked; stalled; exhausted. Bound: target, metric, tools, threshold, budget, scope. |

## Inputs

- Test surface (required): the module, package, or path whose coverage is being raised.
- Coverage target (required): the percentage or count that defines success, expressed as a metric: line, branch, or function coverage. Name the metric explicitly.
- Coverage tool (required): the tool that measures the declared metric (for example, `pytest --cov`, `jest --coverage`, `cargo tarpaulin`, `go test -cover`). Named before work begins.
- Mutation tool and kill threshold (required, or waiver): the tool that generates mutants and the kill-rate percentage that defines meaningful coverage (for example, `cargo-mutants`, `mutmut`, `Stryker`). If the user explicitly waives mutation testing, the waiver downgrades to a documented assertion-review checklist that the user signs off on.
- Test budget (required): the maximum effort or time allowed, declared before work begins.
- Scope (required): the files that may be edited, frozen before mutation.

## Procedure

1. Bind and freeze the target, metric, coverage tool, mutation tool, kill threshold, budget, and scope in writing. If mutation is waived, record the waiver and the assertion-review checklist that replaces it. Done when: every input is named and frozen, and the bound is recorded.
2. Measure baseline. Run the coverage tool over the test surface and record the baseline coverage by metric. Run the mutation tool and record the baseline kill rate. If the mutation tool is unavailable and no waiver was declared, stop with `blocked`. Done when: baseline coverage and mutation scores are recorded.
3. Add or revise tests whose assertions guard observable behavior, boundaries, invariants, and real error paths. Each test must assert a specific observable outcome, not merely execute a code path. Tests that call a function and check it did not throw, without asserting the return value or side effect, are vacuous: revise or remove them. Work inside the frozen scope only. Done when: the coverage tool reports the target met or a non-success terminal applies.
4. Re-measure. Run the coverage tool and the mutation tool. Success requires both: the coverage target is met by the declared metric, and the mutation kill threshold is met (or the waived assertion-review checklist is applied and signed off). Record justified exclusions with reasons (generated code, third-party, unreachable). If mutations survive, revise the assertions to guard the mutated behavior. Done when: both gates pass with exclusions recorded, or a non-success terminal applies.
5. Stop at the first of: both gates pass (success), a non-success terminal (blocked, stalled, exhausted), or the bound. Budget exhaustion is never success unless it was the predeclared success predicate. Done when: exactly one terminal class is selected and recorded.
6. Persist the run record to `.outline/loops/meaningful-test-coverage/<run_id>/` when durable. Emit `receipt.json` before return. Done when: the receipt is written with coverage and mutation measurements, files edited, exclusions, and the terminal class.

## Failure and recovery

- Blocked: the coverage tool or mutation tool is unavailable and no waiver was declared. Terminal `blocked`; name the missing tool. If the scope cannot be covered inside the bound, name the blocking file or dependency. Do not widen scope.
- Stalled: the coverage gap cannot be closed inside the budget, or mutations survive and the assertions cannot be revised to kill them. Terminal `stalled`; report the coverage reached, the mutation kill rate, and the gap.
- Exhausted: the budget is consumed before both gates pass. Terminal `exhausted`; report the coverage reached and the gap. Do not claim success.
- Tests pass but mutations survive: the coverage is not meaningful. Revise the assertions to guard the mutated behavior, or classify as `stalled` if the gap cannot be closed inside the budget.
- Justified exclusion: a target path is excluded for a stated reason (generated code, third-party, unreachable). Record the exclusion with its reason; do not count it against the target.

## Output

Coverage and mutation measurements (baseline and final), files edited, justified exclusions with reasons, receipt path, and exactly one terminal class (success, capped, stalled, blocked, exhausted, pending).
