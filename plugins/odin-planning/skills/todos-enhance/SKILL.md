---
name: todos-enhance
description: 'Use when tasks are too vague, read as headings, or the user asks to sophisticate the todos. Not for stale reconciliation: use todos-update. Not for adding requirements: use todo-add.'
---

# Sophisticate todos

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'sophisticate the todos', says the tasks are too vague, or the list reads as headings rather than executable work. |
| Authority | Chat-only: returns a rewritten task list in the response. No file, VCS, or remote mutation. |
| Side effect | Produces a rewritten task list with compound items split, dependency order applied, and one acceptance criterion pinned per task. |
| Done | Zero unclassified, vague, or unverifiable items remain and every task carries exactly one observable acceptance criterion. |

## Inputs

The current task list in context. Required. Must be present in full.

## Refusals

- Will not proceed without a task list in context.
- Will not claim the done predicate holds while any task remains unclassified, unverifiable, or compound.
- Will not add a phase where no real barrier exists.

## Procedure

1. **Diagnose.** Classify every item exactly once: `atomic` (one behavior, executable as written), `compound` (hides two or more separable pieces of work), `vague` (names an area, not a change), `unordered` (correct, but placed where its dependencies are unmet), `unverifiable` (executable, but nobody can tell when it is done). **Done when:** every item is classified.
2. **Split.** Every `compound` item becomes N atomic tasks. A task is atomic when it names one behavior and can be executed without a further design decision. The test is not length; a one-line task that still requires choosing between two approaches is compound. **Done when:** no task remains that hides more than one decision.
3. **Order.** Draw the dependency edges. B depends on A only when B cannot function without A's output, not merely because A feels earlier. Mark genuinely independent tasks as parallel. Introduce a phase only where a real barrier exists. **Done when:** every dependency is an edge someone can point at, and independent work is marked parallel.
4. **Pin acceptance.** Every task gets one observable done-test: a command, an output, or a state someone can check. **Done when:** zero items remain `vague` or `unverifiable`, and every task carries exactly one acceptance criterion.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No list provided | Stop. State that a task list is required. |
| Empty list | Stop. The done predicate holds vacuously; report it. |
| Non-convergence | If any task remains unclassified, unverifiable, or compound after one pass, report the remaining items by class. Do not claim the done predicate holds. |
| Rollback | On any failure, discard the rewritten list and present the diagnostic. The original list is unchanged. |

## Output

A rewritten task list where every item is atomic, ordered by real dependency, and annotated with one observable acceptance criterion each, or a terminal report listing remaining unclassified or unverifiable items if the done predicate cannot be reached.
