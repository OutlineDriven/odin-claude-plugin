---
name: todos-enhance
description: 'Deepen a coarse task list: split compound items into atomic tasks, order them by real dependency, and pin an observable acceptance criterion to each. Use when the user says "sophisticate the todos", "these tasks are too vague", or a list reads as headings rather than executable work. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Sophisticate todos

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'sophisticate the todos', says the tasks are too vague, or the list reads as headings rather than executable work |
| Authority | Reversible local file edits only; no VCS, deployment, or remote mutation |
| Side effect | Rewrites the task list with compound items split, dependency order applied, and one acceptance criterion pinned per task |
| Done | Zero unclassified, vague, or unverifiable items remain and every task carries exactly one observable acceptance criterion |

## Inputs

The current task list in context. Required. Must be present in full.

## Procedure

1. **Diagnose.** Classify every item exactly once using this table:

| Class | Meaning |
|---|---|
| `atomic` | One behavior, executable as written |
| `compound` | Hides two or more separable pieces of work |
| `vague` | Names an area, not a change |
| `unordered` | Correct, but placed where its dependencies are unmet |
| `unverifiable` | Executable, but nobody can tell when it is done |

2. **Split.** Every `compound` item becomes N atomic tasks. A task is atomic when it names one behavior and can be executed without a further design decision. The test is not length. A one-line task that still requires choosing between two approaches is compound. Completion criterion: no task remains that hides more than one decision.

3. **Order.** Draw the dependency edges. B depends on A only when B cannot function without A's output, not merely because A feels earlier. Mark genuinely independent tasks as parallel. Introduce a phase only where a real barrier exists. Completion criterion: every dependency is an edge someone can point at, and independent work is marked parallel rather than serialized by accident.

4. **Pin acceptance.** Every task gets one observable done-test: a command, an output, or a state someone can check. Completion criterion: zero items remain `vague` or `unverifiable`, and every task carries exactly one acceptance criterion.

## Failure and recovery
- **No list provided.** Stop. State that a task list is required.
- **Empty list.** Stop. The done predicate holds vacuously; report it.
- **Non-convergence.** If any task remains unclassified, unverifiable, or compound after one pass, report the remaining items by class. Do not claim the done predicate holds.
- **Rollback.** On any failure, discard the rewritten list and present the diagnostic. The original list is unchanged.

## Output
A rewritten task list where every item is atomic, ordered by real dependency, and annotated with one observable acceptance criterion each. A terminal report listing remaining unclassified or unverifiable items if the done predicate cannot be reached.

## Provenance

Origin: current-odin-skill-tree. Project-owned. Adapted from `skills/sophisticate-todos/SKILL.md`. Edits were driven by the task-decomposition end state, not the source verbatim. Distinct from `update-todos`, which reconciles stale lists rather than deepening coarse ones.
