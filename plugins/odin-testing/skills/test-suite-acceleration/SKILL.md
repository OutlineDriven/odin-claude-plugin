---
name: test-suite-acceleration
description: 'Use when a test suite is too slow and needs acceleration without weakening behavior or coverage, or CI parallelization must fix serial execution. Not for deleting tests: use tests-purge-unneeded.'
---

# Test suite acceleration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A test suite is too slow and must be accelerated without weakening it. |
| Authority | Reversible local: writes only test files and configuration; rollback is version control. No remote mutation. |
| Side effect | Test-suite acceleration under unchanged behavior and coverage. |
| Done | The fixed-baseline suite is faster without reliability, behavior, or coverage regression. |
| Stop | No safe gain; blocked; budget exhausted. Bound: baseline environment and optimization budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Inputs

- Budget (required): the maximum wall-clock time, CI cost, or engineer effort to spend on acceleration; if exceeded, stop as budget exhausted.

## Refusals

- Will not delete tests to reduce runtime; that is tests-purge-unneeded.
- Will not weaken assertions, skip flaky tests, or reduce coverage to hit a speed target.
- Will not claim success when the budget is exhausted unless exhaustion was the predeclared success predicate.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when:** the bound is recorded and no mutation has begun.
2. Execute the test-suite acceleration under unchanged behavior and coverage inside the bound, using only these mechanisms: test parallelization, CI parallelization, faster fixtures and setup, caching, and reducing redundant work. **Done when:** the fixed-baseline suite runs faster with no reliability, behavior, or coverage regression.
3. Stop at outcome.success, any outcome.non_success, or outcome.bound. **Done when:** a terminal class is assigned.
4. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Write an immutable K11 receipt with every K11 field. **Done when:** the receipt is written with every K11 field.

## Output

A receipt.json with the terminal class, bound, and per-step evidence, persisted at .outline/loops/<slug>/<run_id>/, ordering: bound, execution evidence, terminal verdict, receipt.
